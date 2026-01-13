# Thermal Model Automation Fixes

## Summary
This document outlines the fixes applied to the Home Assistant climate automation system to resolve errors and improve unit handling.

## Issues Fixed

### 1. Safety Reset Automation - Preset-Specific Entity References

**Problem:** The "Thermal Model: Safety Reset" automation was referencing non-preset-specific entities (`input_number.thermostat_stage1_heating_rate` and `input_number.thermostat_heat_loss_coefficient`) that don't exist. The thermal model uses preset-specific entities (home, away, sleep, boost).

**Files Modified:** `packages/climate-automations/thermal-model-learning.yaml`

**Changes:**
- Added `active_preset` variable to determine current preset mode
- Updated condition to use template-based checks instead of numeric_state conditions
- Changed condition to check preset-specific entities: `input_number.thermostat_stage1_heating_rate_{preset}` and `input_number.thermostat_heat_loss_coefficient_{preset}`
- Updated action section to reset only the active preset's parameters
- Added preset identifier to notification messages

### 2. Missing Default Values in Track Cycle Start Automation

**Problem:** Template rendering errors occurred when sensors were unavailable or returned 'None', causing automation failures.

**Files Modified:** `packages/climate-automations/thermal-model-learning.yaml`

**Changes:**
- Added default values to all temperature and sensor templates in the `cycle_data` variable:
  - `start_temp`: default 21°C
  - `outdoor_temp`: default 0°C
  - `setpoint`: default 21°C
  - `temp_delta`: default calculations with 21°C fallback
  - `stage2_delay_used`: default 5 minutes

### 3. Sensor Config Changed Automation - Preset-Specific References

**Problem:** The automation was trying to update non-preset-specific entities, causing "unknown entity" errors.

**Files Modified:** `packages/climate-automations/thermal-model-learning.yaml`

**Changes:**
- Added `active_preset` variable to track current preset mode
- Updated all entity references to be preset-specific:
  - `input_text.thermostat_last_sensor_config_{preset}`
  - `input_number.thermostat_model_confidence_{preset}`
- Added default value (20) to template when reading confidence level
- Updated notification messages to include preset identifier

### 4. Temperature Unit Conversion in Apply Optimal Delay

**Problem:** The outdoor temperature condition was comparing Celsius values (15°C) directly, but when Home Assistant is configured to use Fahrenheit, the sensor values are automatically converted, breaking the comparison logic.

**Files Modified:** `packages/climate-automations/thermal-model-learning.yaml`

**Changes:**
- Replaced numeric_state condition with template-based condition
- Added automatic unit detection and conversion logic
- Template checks sensor's `unit_of_measurement` attribute
- Converts Fahrenheit to Celsius if needed before comparison
- Preserves original threshold (15°C / 59°F) for heating season detection

### 5. Global Template Default Values

**Problem:** Multiple templates throughout the automations lacked default values, causing failures when sensors became unavailable.

**Files Modified:**
- `packages/climate-automations/thermal-model-learning.yaml`
- `packages/climate-automations/climate-data-and-control.yaml`

**Changes in thermal-model-learning.yaml:**
- Learn from Cycle automation: Added defaults to temperature comparisons (21°C)
- Variable definitions: Added defaults to stage1_rate (1.5), heat_loss_coeff (0.5), learning_rate (0.3)
- Heating rate calculations: Added defaults to all float conversions
- Temperature rise calculations: Added default (21°C) to all temperature readings
- Indoor/outdoor temperature averages: Added defaults to prevent division errors

**Changes in climate-data-and-control.yaml:**
- Remote temperature setting: default 21°C
- Ecobee temperature conversion: default 72°F (converts to ~22°C)
- Humidity settings: default 40%
- Humidifier setpoint: default 35%
- Temperature adjustments: default 21°C for heating, 24°C for cooling

## Testing Recommendations

After deploying these fixes:

1. **Check Configuration:** Run `ha core check` to validate YAML syntax
2. **Monitor Logs:** Watch for any template rendering errors in the first 24 hours
3. **Test Preset Switching:** Change between Home/Away/Sleep/Boost modes and verify:
   - Model parameters switch correctly
   - Sensor config changes are tracked per-preset
   - Safety reset only affects active preset
4. **Test Unit Conversion:** Verify Apply Optimal Delay automation triggers correctly:
   - Check automation traces in HA UI
   - Confirm outdoor temperature condition evaluates properly
5. **Test Sensor Unavailability:** Temporarily disable a temperature sensor and verify:
   - Default values are used
   - No error messages appear in logs
   - System continues to function

## Unit Handling Notes

### Temperature Units
- **ESPHome**: Always reports in Celsius
- **Home Assistant**: May display in Fahrenheit if configured
- **Solution**: Templates now check `unit_of_measurement` attribute and convert as needed

### Recommended Configuration
For consistency, consider setting Home Assistant to use Celsius internally:
```yaml
homeassistant:
  unit_system: metric
```

However, the current fixes support either unit system.

## Default Values Reference

All defaults were chosen based on typical operating ranges:

| Sensor/Parameter | Default | Reasoning |
|-----------------|---------|-----------|
| Indoor Temperature | 21°C | Typical room temperature |
| Outdoor Temperature | 0°C | Conservative for heating calculations |
| Setpoint Temperature | 21°C | Standard comfort temperature |
| Humidity | 40% | Mid-range healthy humidity |
| Stage 1 Heating Rate | 1.5°C/hr | Typical residential furnace |
| Heat Loss Coefficient | 0.5 | Average insulated home |
| Learning Rate | 0.3 | Balanced adaptation speed |
| Stage 2 Delay | 5 min | Conservative compressor protection |
| Humidifier Setpoint | 35% | Safe minimum for comfort |

## Future Improvements

1. Consider adding health checks that log when default values are used frequently
2. Add automation to notify when sensors are offline for extended periods
3. Implement sensor quality scoring based on availability
4. Add preset-specific sensor configurations (e.g., Sleep mode uses only bedroom sensor)
