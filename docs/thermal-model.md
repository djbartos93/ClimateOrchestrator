# Thermal Model (Stage 2 Optimization)

## Purpose
The thermal model learns your home’s heating characteristics and uses that learning to compute an **optimal stage 2 delay**. The goal is to meet a target cycle time (efficiency + comfort) while minimizing unnecessary stage 2 usage.

This system is split across:
- **ESPHome thermostat firmware** (real-time HVAC control)
- **Home Assistant packages** (learning, predictions, UI helpers)

The learning is **preset-specific**: `home`, `away`, `sleep`, `boost` each maintain their own learned parameters.

## Critical Unit Contract
This is the most important invariant in the entire design.

- **All thermal model math uses Celsius**.
- **Stage 2 trigger UX** (near-setpoint inhibit, “delta”, ROC diagnostics) may use Fahrenheit for user readability.
- Any time a value comes from a source that may be °F (HA UI setpoint, some sensors), it must be normalized before being used in thermal model calculations.

### Canonical “model inputs” (Celsius)
- **Indoor temperature**: `sensor.thermostat_average_temperature` (°C)
- **Outdoor temperature**: `sensor.outdoor_temperature_celsius` (°C)
- **Setpoint temperature** (normalized): `sensor.smart_thermostat_setpoint_celsius` (°C)

### Canonical “user-facing” (Fahrenheit)
- **Effective indoor temperature in °F** (normalized): `sensor.smart_thermostat_effective_temperature_fahrenheit` (°F)
- **Temperature delta from setpoint**: `sensor.current_temperature_delta` (°F)
- **ROC / derivative sensors**: `sensor.temperature_change_rate_5min`, `sensor.temperature_change_rate_10min` (°F/min)

## Learned Parameters (per preset)
Stored as `input_number` entities (in Home Assistant) and updated by automations.

- **Stage 1 heating rate**: `input_number.thermostat_stage1_heating_rate_{preset}` (°C/hr)
- **Stage 2 additional heating rate**: `input_number.thermostat_stage2_additional_rate_{preset}` (°C/hr)
- **Heat loss coefficient**: `input_number.thermostat_heat_loss_coefficient_{preset}` (°C/hr/°C)
- **Model confidence**: `input_number.thermostat_model_confidence_{preset}` (%)

## Derived/Prediction Sensors
Defined in `packages/climate-supporting-entities/thermal-model.yaml`.

- **Current heat loss rate**: `sensor.current_heat_loss_rate` (°C/hr)
  - Computed as: `k * (indoor_c - outdoor_c)`

- **Predicted time to setpoint (stage 1 only)**: `sensor.predicted_time_to_setpoint_stage_1` (min)
  - Uses:
    - `temp_needed = setpoint_c - indoor_c`
    - `net_heating_rate = stage1_rate - heat_loss_rate`

- **Predicted time to setpoint (stage 1+2)**: `sensor.predicted_time_to_setpoint_stage_1_2` (min)
  - Uses:
    - `net_heating_rate = (stage1_rate + stage2_add) - heat_loss_rate`

- **Optimal stage 2 delay**: `sensor.optimal_stage_2_delay` (min)
  - Uses predicted times + target cycle time + preset urgency factor.

## Learning Data Flow
All learning is performed by Home Assistant automations in `packages/climate-automations/thermal-model-learning.yaml`.

### 1) Track cycle start
Automation: `Thermal Model: Track Cycle Start`

When heating turns on:
- Captures `start_temp` (°C) from `sensor.thermostat_average_temperature`
- Captures `outdoor_temp` (°C) from `sensor.outdoor_temperature_celsius`
- Captures `setpoint_c` (°C) by converting the climate setpoint if needed
- Captures `temp_delta_c` (°C) = `setpoint_c - start_temp`
- Stores everything in JSON in `input_text.thermostat_recent_cycles`

### 2) Track stage 2 engagement (optional)
Automation: `Thermal Model: Track Stage 2 Engagement`

When stage 2 becomes active:
- Updates the JSON with:
  - `stage2_used: true`
  - `stage2_engage_time`
  - `stage2_engage_temp` (°C)

### 3) Learn from cycle end
Automation: `Thermal Model: Learn from Cycle`

Triggered when heating turns off.

Key steps:
- Validates “successful cycle” by checking the final temperature is at/near setpoint (now normalized to °C regardless of HA unit system).
- Computes:
  - `temp_rise` (°C)
  - `cycle_duration` (minutes)
  - `observed_heating_rate` (°C/hr)

#### Stage 1-only cycles
If stage 2 was not used:
- Update stage 1 rate based on the observed rate (EWMA, clamped to safety bounds)

#### Stage 2 cycles
If stage 2 was used:
- Estimate stage 1 rate based on the portion before stage 2 engaged
- Estimate combined rate based on the portion after stage 2 engaged
- Compute stage 2 additional:
  - `stage2_add = combined_rate - stage1_rate_this_cycle`
- Update stage 1 + stage2_add using EWMA and bounds

#### Heat loss learning
Uses indoor/outdoor average temperature difference:
- `temp_diff_avg = indoor_avg - outdoor`
- If `temp_diff_avg` is sufficiently large, estimate loss coefficient.

### Confidence
Confidence increases based on cycle count per preset.

## Applying the Model (Control Output)
Automation: `Thermal Model: Apply Optimal Delay`

When idle (not heating/cooling) and during heating season:
- Chooses `sensor.optimal_stage_2_delay` if confidence > threshold, otherwise a default.
- Writes to ESPHome: `number.smart_thermostat_stage_2_delay`.

## Reset Behavior
Two reset modes exist:

- **Per-preset reset script**: `script.thermal_model_reset_preset`
  - Resets learned parameters + confidence + cycle counter for a specified preset.

- **UI buttons** (created in `thermal-model.yaml`):
  - `button.thermal_model_reset_active_preset`
  - `button.thermal_model_reset_all_presets`

## Common Failure Modes (Units)
- **°F treated as °C** in model math:
  - Predicted times explode, learning produces nonsensical rates, safety reset triggers.

- **°C treated as °F** in user-facing deltas/ROC:
  - Delta/ROC appear too small, near-setpoint logic becomes unreliable.

The current configuration mitigates these by normalizing:
- Setpoint to °C for model math
- Effective temp to °F for user-facing delta/ROC
