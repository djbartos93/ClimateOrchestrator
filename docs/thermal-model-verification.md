# Thermal Model Verification & Testing Guide

This guide verifies:
- Units are consistent (model math in °C)
- Learning updates are happening
- Predictions and applied delays behave as expected
- Reset mechanisms work

## Preconditions
- Home Assistant packages are loaded and HA has been restarted.
- ESPHome device is online and entities are available.

## 1) Unit Sanity Checks (Critical)
Perform these checks first. If any fail, do not trust learning results.

### A. Indoor temperature (model input)
- **Entity**: `sensor.thermostat_average_temperature`
- **Expected**:
  - `unit_of_measurement` should be `°C`
  - Value should be ~20–25 for typical indoor temps

### B. Setpoint (model input)
- **Entity**: `sensor.smart_thermostat_setpoint_celsius`
- **Expected**:
  - `unit_of_measurement` should be `°C`
  - If your UI is °F, this should track `(setpoint°F - 32) * 5/9`

### C. User-facing effective temp (normalized)
- **Entity**: `sensor.smart_thermostat_effective_temperature_fahrenheit`
- **Expected**:
  - `unit_of_measurement` should be `°F`
  - Should closely match what you see in the thermostat UI

### D. Outdoor temperature (model input)
- **Entity**: `sensor.outdoor_temperature_celsius`
- **Expected**:
  - `unit_of_measurement` should be `°C`

## 2) Prediction Sanity Checks

### A. Predicted time values
- **Entities**:
  - `sensor.predicted_time_to_setpoint_stage_1`
  - `sensor.predicted_time_to_setpoint_stage_1_2`

**Expected behaviors**:
- With a positive temp gap, predicted time should be a reasonable number (often 5–90 min depending on conditions).
- `stage_1_2` prediction should generally be <= `stage_1` prediction.

**Red flags**:
- Values jump by ~1.8× or ~0.55× when nothing changed (unit mismatch symptom).
- Values pinned at `999` frequently (net heating rate <= 0; often due to extreme estimated heat loss or bad sensor values).

### B. Current heat loss rate
- **Entity**: `sensor.current_heat_loss_rate` (°C/hr)

**Expected behaviors**:
- In winter, should be positive when indoor > outdoor.
- Should scale upward when outdoor gets colder.

## 3) Learning Verification (Cycle-Based)

### A. Verify cycle tracking is writing JSON
- **Entity**: `input_text.thermostat_recent_cycles`

During a heating cycle:
- Confirm it is non-empty JSON and includes:
  - `start_temp`
  - `outdoor_temp`
  - `setpoint_c`
  - `temp_delta_c`

If stage 2 engages, confirm JSON updates:
- `stage2_used: true`
- `stage2_engage_time`
- `stage2_engage_temp`

### B. Verify learning automation runs
Automation:
- `Thermal Model: Learn from Cycle`

After a heating cycle ends:
- Check automation trace (or logbook entries) for:
  - Cycle analyzed
  - Updated stage 1 rate and/or stage 2 additional rate
  - Confidence update

### C. Expected learning behavior
After multiple “clean” cycles:
- `input_number.thermostat_model_confidence_{preset}` should rise gradually.
- Learned rates should remain within safety bounds:
  - Stage 1: 0.4–8.0 °C/hr
  - Stage 2 add: 0.2–6.0 °C/hr
  - Heat loss coeff: 0.1–2.5

## 4) Optimal Delay Application Verification
Automation:
- `Thermal Model: Apply Optimal Delay`

### A. Preconditions
- Heating and cooling both off.
- Heating season condition passes (outdoor < 15°C normalized).

### B. Expected behavior
- When confidence <= threshold, delay should remain at default.
- When confidence > threshold, delay should follow `sensor.optimal_stage_2_delay`.

### C. Observability
- Watch:
  - `number.smart_thermostat_stage_2_delay`
  - Logbook entries under “Thermal Model”

## 5) Reset Testing

### A. Active preset reset
- Press: `button.thermal_model_reset_active_preset`

Expected:
- Active preset learned parameters reset to defaults
- Active preset confidence reset to 20
- Active preset cycle counter reset

### B. Reset all presets
- Press: `button.thermal_model_reset_all_presets`

Expected:
- Home/Away/Sleep/Boost all reset similarly

## Troubleshooting

### Symptom: model never learns
- Verify “successful cycle” condition:
  - cycle must end at/near setpoint
- Verify `input_text.thermostat_recent_cycles` is valid JSON
- Verify temperature entities are not `unknown`/`unavailable`

### Symptom: frequent safety resets
- Usually a unit mismatch or bad sensor input.
- Verify section “Unit Sanity Checks (Critical)” again.

### Symptom: predicted time is always 999
- Net heating rate <= 0
- Check:
  - `sensor.current_heat_loss_rate`
  - stage1/stage2 learned values
  - indoor/outdoor sensors

## Recommended “Smoke Test” Scenario
1. Set preset to `home`
2. Set setpoint a few degrees above current temperature
3. Allow a full cycle to complete (reach setpoint)
4. Confirm:
   - `Thermal Model: Learn from Cycle` runs
   - confidence increments
   - predicted times are sane
   - next idle period applies (or logs) the optimal stage 2 delay
