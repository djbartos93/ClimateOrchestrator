# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClimateOrchestrator is a smart home climate control system with two main components:

1. **ESPHome Thermostat** (`thermostat-config/`) - ESP32-S3 firmware for a smart thermostat with dual-stage heating, humidifier control, and safety interlocks
2. **Home Assistant Packages** (`packages/`) - YAML configurations for climate automation and thermal modeling

The system uses physics-based predictive control with machine learning to optimize HVAC performance based on learned house characteristics.

## Architecture

### ESPHome Thermostat (`thermostat-config/`)

**Entry point**: `thermostat-config/main.yaml`

The thermostat uses a modular package structure where each package handles a specific concern:

- `packages/network/` - Network connectivity (WiFi or Ethernet)
- `packages/hardware.yaml` - I2C bus, PCA9554 I/O expander, RTC, buzzer
- `packages/globals.yaml` - Global state variables
- `packages/sensors.yaml` - Temperature/humidity sensors, runtime tracking
- `packages/switches.yaml` - HVAC relays, humidifier, maintenance modes
- `packages/numbers.yaml` - Tuning parameters (delays, timeouts, deadbands)
- `packages/buttons.yaml` - Action buttons (reboot, emergency stop, etc.)
- `packages/climate.yaml` - Main thermostat climate component with dual-stage logic
- `packages/scripts.yaml` - Automation scripts (humidifier control, LED status)
- `packages/intervals.yaml` - Periodic safety checks and monitoring
- `packages/esphome-core.yaml` - Core ESPHome configuration (API, OTA, logging)

**Key Design Patterns**:
- Substitutions in `main.yaml` allow easy customization without touching package files
- Safety interlocks prevent simultaneous heating/cooling
- Boot lockout prevents HVAC activation during startup
- Remote sensor failover to local DHT22 if Home Assistant connection is lost
- Dual-stage heating with configurable delays and compressor lockout

### Home Assistant Packages (`packages/`)

**Two package types**:

1. **Supporting Entities** (`climate-supporting-entities/`)
   - `climate-helpers.yaml` - Input booleans, numbers, selects for UI controls
   - `climate-sensors.yaml` - Template sensors for multi-room temperature/humidity averaging
   - `thermal-model.yaml` - Learned parameters for physics-based thermal model (preset-specific)

2. **Automations** (`climate-automations/`)
   - `climate-data-and-control.yaml` - Main automation for data syncing and mode changes
   - `thermal-model-learning.yaml` - Machine learning automation that adapts thermal parameters

**Thermal Model Architecture**:
- Each preset mode (Home, Away, Sleep, Boost) learns independently
- Preset-specific parameters: heat loss coefficient, Stage 1/2 heating rates, confidence level
- Global parameter: thermal mass (tau)
- Learning occurs after each heating cycle using exponential weighted averaging
- Confidence increases with more cycles analyzed (20% → 95%)

## Common Commands

### ESPHome Development

```bash
# Validate thermostat configuration
esphome config thermostat-config/main.yaml

# Compile firmware (check for errors)
esphome compile thermostat-config/main.yaml

# Clean build files
esphome clean thermostat-config/main.yaml
```

### Home Assistant Configuration

Home Assistant YAML packages are placed in the `packages/` directory and loaded via `configuration.yaml`:

```yaml
homeassistant:
  packages: !include_dir_named packages/
```

After editing package files:

```bash
# Check configuration validity
ha core check

# Restart Home Assistant to apply changes
ha core restart
```

## Important Technical Details

### Temperature Source Selection

The system supports multi-room averaging:
- Template sensor `sensor.thermostat_average_temperature` calculates weighted average
- Individual room sensors can be enabled/disabled via `input_boolean.thermostat_use_*_temp`
- Automatic failover to local DHT22 sensor if all room sensors are disabled or unavailable
- Temperature values are in Celsius internally, converted from Fahrenheit sensor inputs

### Humidifier Control

Auto-setpoint calculation based on outdoor temperature prevents window condensation:
- At 10°C outdoor: 45% target humidity
- At -20°C outdoor: 20% target humidity
- Linear interpolation between these points
- Manual override available via `input_boolean.humidifier_manual_setpoint`

### Safety Systems

**Multi-layer safety checks** in `intervals.yaml`:
- 1s high-speed checks: critical heating/cooling conflicts
- 60s checks: heat/cool interlock, humidifier safety, runtime limits
- API disconnect alarm triggers if Home Assistant connection lost

**Interlocks**:
- Heating and cooling cannot run simultaneously
- Humidifier only runs when heating is active
- Stage 2 heating has minimum delay after Stage 1 activation
- Compressor has minimum off-time between cycles

### Preset-Specific Learning

When the thermostat preset mode changes, the system instantly switches to that preset's learned parameters:
- Home mode: Uses sensors from living room, kitchen, bedroom, office
- Away mode: May use fewer sensors, learns different heating rates
- Each preset maintains separate `stage1_heating_rate`, `stage2_additional_rate`, `heat_loss_coefficient`
- Confidence tracking is per-preset (each starts at 20%, grows to 95%)

## File Modification Guidelines

### When modifying ESPHome configuration:

1. **User-customizable settings** go in `substitutions` block of `main.yaml`
2. **Hardware changes** (GPIO pins, I2C devices): edit `packages/hardware.yaml`
3. **HVAC logic changes**: edit `packages/climate.yaml`
4. **Safety behavior**: edit `packages/intervals.yaml`
5. **Always validate** before flashing: `esphome config thermostat-config/main.yaml`

### When modifying Home Assistant packages:

1. **UI controls** (input_boolean, input_number): edit `climate-helpers.yaml`
2. **Sensor calculations**: edit `climate-sensors.yaml`
3. **Learning parameters**: edit `thermal-model.yaml`
4. **Automation logic**: edit `climate-data-and-control.yaml` or `thermal-model-learning.yaml`
5. **Always check config**: `ha core check` before restarting

## Hardware Configuration

**ESP32-S3 Smart Thermostat**:
- Board: Waveshare ESP32-S3-ETH (16MB flash, PSRAM)
- Relay control via PCA9554 I2O expander (I2C address 0x27)
- Local sensing: DHT22 on GPIO0
- Status LED: WS2812 RGB on GPIO38
- Buzzer: Active buzzer on GPIO46
- RTC: BM8563 for timekeeping
- Ecobee passthrough: GPIO4 (W1), GPIO5 (W2), GPIO6 (Y1), GPIO7 (G)

**Network Options**:
- WiFi: Dual-network support with fallback AP
- Ethernet: Waveshare W5500 module (alternative)
- Switch between WiFi/Ethernet by editing `main.yaml` line 109

## Debugging Tips

**ESPHome Issues**:
- Check logs: `esphome logs thermostat-config/main.yaml`
- Increase log verbosity in `main.yaml` substitutions (DEBUG or VERBOSE)
- Boot lockout lasts 60s - HVAC won't respond until cleared
- If device won't connect: Use fallback AP (SSID: "smart-thermostat Fallback Hotspot")

**Home Assistant Issues**:
- Validate templates in Developer Tools → Template
- Check automation traces in UI for failed conditions
- Thermal model confidence < 50%: System still learning, expect adaptation
- Check `sensor.active_temperature_sensor_config` to see which rooms are active

**Common Problems**:
- Stage 2 not activating: Check `input_number.thermostat_stage2_delay` (default 300s)
- Humidifier not running: Only operates when heating is active
- Remote sensors not updating: Check `input_boolean.thermostat_use_*_temp` toggles
- Thermal model not learning: Ensure heating cycles complete successfully (reach setpoint)

## Key Entities Reference

**ESPHome Entities** (prefix: `smart_thermostat.`):
- `climate.smart_thermostat` - Main climate control
- `sensor.smart_thermostat_local_temperature` - DHT22 sensor
- `sensor.smart_thermostat_outdoor_temperature` - From Home Assistant
- `switch.smart_thermostat_heat_relay` - Direct relay control
- `switch.smart_thermostat_maintenance_mode` - Bypass automation

**Home Assistant Entities**:
- `sensor.thermostat_average_temperature` - Multi-room average
- `sensor.humidifier_auto_setpoint` - Calculated from outdoor temp
- `input_number.thermostat_stage1_heating_rate_{preset}` - Learned parameter
- `counter.thermostat_cycles_analyzed` - Learning progress tracker
