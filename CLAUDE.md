# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClimateOrchestrator is a smart home climate control system with two main components:

1. **ESPHome Thermostat** (`thermostat-config/`) - ESP32-S3 firmware for a smart thermostat with dual-stage heating, humidifier control, and safety interlocks
2. **Home Assistant Packages** (`packages/`) - YAML configurations for climate automation, thermal modeling, and machine learning

The system uses physics-based predictive control with machine learning to optimize HVAC performance based on learned house characteristics. Each preset mode (Home, Away, Sleep, Boost) learns independently.

## Architecture

### ESPHome Thermostat (`thermostat-config/`)

**Entry point**: `thermostat-config/main.yaml`

The thermostat uses a modular package structure loaded from GitHub:

| Package | Purpose |
|---------|---------|
| `packages/network/wifi.yaml` | WiFi with fallback AP mode |
| `packages/network/ethernet.yaml` | Ethernet (alternative) |
| `packages/hardware.yaml` | I2C bus, PCA9554 I/O expander, RTC, buzzer |
| `packages/globals.yaml` | Global state variables, boot tracking |
| `packages/sensors.yaml` | Temperature/humidity, runtime tracking, binary sensors |
| `packages/switches.yaml` | HVAC relays, humidifier, maintenance modes |
| `packages/numbers.yaml` | Tuning parameters (delays, deadbands, timeouts) |
| `packages/buttons.yaml` | Action buttons (reboot, emergency stop) |
| `packages/climate.yaml` | Main thermostat with dual-stage heating logic |
| `packages/scripts.yaml` | Automation scripts (humidifier, LED, passthrough) |
| `packages/intervals.yaml` | Safety checks and periodic monitoring |
| `packages/esphome-core.yaml` | API, OTA, logging configuration |

**Key Design Patterns**:
- Substitutions in `main.yaml` allow customization without editing packages
- Packages loaded from GitHub branch specified by `github_ref` substitution
- Safety interlocks prevent simultaneous heating/cooling
- Boot lockout prevents HVAC activation during startup
- Interrupted cycle detection extends lockout after unexpected reboot
- Remote sensor failover to local DHT22 if Home Assistant connection lost

### Home Assistant Packages (`packages/`)

**Supporting Entities** (`climate-supporting-entities/`):

| File | Contents |
|------|----------|
| `climate-helpers.yaml` | Input booleans, numbers, selects, timers, counters |
| `climate-sensors.yaml` | Template sensors for averaging, stage 2 control, diagnostics |
| `thermal-model.yaml` | Learned parameters per preset, predictions, counters |

**Automations** (`climate-automations/`):

| File | Contents |
|------|----------|
| `climate-data-and-control.yaml` | Data sync, mode changes, Ecobee coordination |
| `thermal-model-learning.yaml` | ML learning, stage 2 control, maintenance alerts |

### Thermal Model Architecture

**Per-Preset Learning** (Home, Away, Sleep, Boost each learn independently):
- `thermostat_stage1_heating_rate_{preset}` - °C/hr from Stage 1
- `thermostat_stage2_additional_rate_{preset}` - °C/hr added by Stage 2
- `thermostat_heat_loss_coefficient_{preset}` - °C/hr/°C temperature difference
- `thermostat_model_confidence_{preset}` - 20-95% based on cycles analyzed

**Global Parameters**:
- `thermostat_thermal_mass` - Time constant τ (minutes)
- `thermostat_target_cycle_time` - Optimal cycle duration

**Learning Process**:
1. `thermal_model_track_cycle_start` records conditions when heating begins
2. `thermal_model_track_stage2_engage` records when/if Stage 2 engages
3. `thermal_model_learn_from_cycle` analyzes completed cycles
4. Uses exponential weighted averaging with adaptive learning rate
5. Confidence increases with more cycles analyzed

### Stage 2 Intelligent Control

**Control Logic** (`binary_sensor.stage2_should_engage`):
- NOT engaged if `stage2_temporarily_disabled` is on
- NOT engaged if within 1.5°F of setpoint (unless large delta override)
- ENGAGED if heating active and conditions met

**Key Sensors**:
- `sensor.current_temperature_delta` - °F below setpoint
- `binary_sensor.stage2_near_setpoint_inhibit` - TRUE when ≤1.5°F from target
- `binary_sensor.stage2_large_delta_trigger` - TRUE when >3°F AND recent change
- `sensor.stage2_active_urgency_factor` - Preset-specific multiplier

**Urgency Factors**:
- Home: 1.0x (neutral)
- Away: 1.5x (longer delays, efficiency)
- Sleep: 1.2x (slightly longer, quieter)
- Boost: 0.5x (shortest delays, fastest response)

## Common Commands

### ESPHome Development

```bash
# Validate thermostat configuration
esphome config thermostat-config/main.yaml

# Compile firmware
esphome compile thermostat-config/main.yaml

# Flash and monitor logs
esphome run thermostat-config/main.yaml

# View logs only
esphome logs thermostat-config/main.yaml

# Clean build files
esphome clean thermostat-config/main.yaml
```

### Home Assistant Configuration

```bash
# Check configuration validity
ha core check

# Restart Home Assistant
ha core restart
```

## File Modification Guidelines

### ESPHome Configuration

| Change Type | File to Edit |
|-------------|--------------|
| User-customizable settings | `main.yaml` substitutions block |
| GPIO pins, I2C devices | `packages/hardware.yaml` |
| HVAC control logic | `packages/climate.yaml` |
| Safety behavior | `packages/intervals.yaml` |
| Sensor definitions | `packages/sensors.yaml` |
| Relay controls | `packages/switches.yaml` |
| Tuning parameters | `packages/numbers.yaml` |
| Scripts | `packages/scripts.yaml` |

**Always validate**: `esphome config thermostat-config/main.yaml`

### Home Assistant Packages

| Change Type | File to Edit |
|-------------|--------------|
| UI controls (input_boolean, input_number) | `climate-helpers.yaml` |
| Sensor calculations | `climate-sensors.yaml` |
| Learning parameters | `thermal-model.yaml` |
| Automation logic | `thermal-model-learning.yaml` |
| Data sync, Ecobee | `climate-data-and-control.yaml` |

**Always check**: `ha core check` before restarting

## Key Entity Reference

### ESPHome Entities (prefix: `smart_thermostat.`)

| Entity | Purpose |
|--------|---------|
| `climate.smart_thermostat` | Main climate control |
| `sensor.smart_thermostat_effective_temperature` | Current temperature (°F) |
| `sensor.smart_thermostat_local_temperature` | DHT22 sensor |
| `sensor.smart_thermostat_outdoor_temperature` | From Home Assistant |
| `binary_sensor.smart_thermostat_heating_active` | Heating on/off |
| `binary_sensor.smart_thermostat_stage_2_active` | Stage 2 on/off |
| `switch.smart_thermostat_heat_stage1_relay` | Stage 1 relay |
| `switch.smart_thermostat_heat_stage2_relay` | Stage 2 relay |
| `switch.smart_thermostat_humidifier_relay` | Humidifier relay |
| `number.smart_thermostat_stage_2_delay` | Stage 2 delay (minutes) |

### Home Assistant Entities

| Entity | Purpose |
|--------|---------|
| `sensor.thermostat_average_temperature` | Multi-room average (°C) |
| `sensor.humidifier_auto_setpoint` | Calculated from outdoor temp |
| `sensor.optimal_stage_2_delay` | Calculated optimal delay |
| `sensor.active_preset_mode` | Current preset (home/away/sleep/boost) |
| `sensor.current_temperature_delta` | °F below setpoint |
| `sensor.stage2_active_urgency_factor` | Active urgency multiplier |
| `binary_sensor.stage2_should_engage` | Master stage 2 control |
| `binary_sensor.stage2_near_setpoint_inhibit` | Within 1.5°F |
| `binary_sensor.stage2_large_delta_trigger` | >3°F + recent change |
| `input_number.thermostat_stage1_heating_rate_{preset}` | Learned parameter |
| `input_number.thermostat_model_confidence_{preset}` | Learning progress |
| `counter.thermostat_cycles_analyzed_{preset}` | Per-preset cycle count |

## Safety Bounds

Thermal model parameters are validated every 6 hours and reset if out of bounds:

| Parameter | Valid Range | Notes |
|-----------|-------------|-------|
| Stage 1 Rate | 0.4-8.0 °C/hr | Small houses can be fast |
| Stage 2 Additional | 0.2-6.0 °C/hr | Must be positive |
| Heat Loss Coefficient | 0.1-2.5 | Higher = leakier house |

## Temperature Units

- **ESPHome internal**: Celsius
- **ESPHome effective_temperature sensor**: Fahrenheit
- **Home Assistant templates**: Convert as needed
- **Zigbee sensors**: Usually Fahrenheit (converted in templates)

## Important Patterns

### Default Values in Templates

Always provide defaults for sensor values to handle unavailability:
```yaml
{% set temp = states('sensor.some_sensor') | float(21) %}
{% set outdoor = states('sensor.outdoor') | float(0) %}
```

### Preset-Specific Entity Access

Use dynamic entity construction for preset-specific parameters:
```yaml
{% set preset = states('sensor.active_preset_mode') | lower %}
{% set confidence = states('input_number.thermostat_model_confidence_' + preset) | int(20) %}
```

### Lambda Logging

Use ESP logging macros in ESPHome lambdas:
```cpp
ESP_LOGI("tag", "Info message: %s", variable);
ESP_LOGW("tag", "Warning message");
ESP_LOGD("tag", "Debug message: %.1f", float_value);
```

## Debugging Tips

### ESPHome Issues
- Check logs: `esphome logs thermostat-config/main.yaml`
- Increase log verbosity in `main.yaml` substitutions
- Boot lockout lasts ~60s - HVAC won't respond until cleared
- If device won't connect: Use fallback AP

### Home Assistant Issues
- Validate templates: Developer Tools → Template
- Check automation traces in UI for failed conditions
- Thermal model confidence < 50%: System still learning
- Check `sensor.active_temperature_sensor_config` for active rooms

### Common Problems

| Problem | Cause | Solution |
|---------|-------|----------|
| Stage 2 not activating | Near-setpoint inhibit | Check `binary_sensor.stage2_near_setpoint_inhibit` |
| Stage 2 not activating | Temporarily disabled | Check `input_boolean.stage2_temporarily_disabled` |
| Humidifier not running | Only runs during heating | Verify `binary_sensor.smart_thermostat_heating_active` |
| Model not learning | Cycles not completing | Ensure heating reaches setpoint |
| Safety reset triggered | Parameters out of bounds | Check STAGE2_IMPROVEMENTS.md |
| Remote sensors stale | Toggles off | Check `input_boolean.thermostat_use_*_temp` |

## Branch Strategy

The `github_ref` substitution in `main.yaml` controls which branch packages are loaded from:
- `main` - Stable release
- `feature/*` - Feature branches for testing

Current branch: Check `github_ref` anchor in `main.yaml`
