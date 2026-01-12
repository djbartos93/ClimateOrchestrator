# ClimateOrchestrator

A smart home climate control system combining ESPHome-based thermostat hardware with Home Assistant automation and physics-based thermal modeling.

## Notes

The goal of this was to quickly create a base to build upon so this is all currently AI written, but I intend to completely review and improve this project in the future.
## Features

- **Dual-Stage Heating Control** with intelligent staging and automatic humidity setpoint
- **Smart Humidifier Control** with outdoor temperature-based setpoint calculation
- **Multi-Room Temperature Averaging** across multiple home assistant and local sensors with automatic failover
- **Physics-Based Thermal Model** that learns your house characteristics over time (supports different climate presets)
- **Preset-Specific Learning** adapts heating rates independently for Home, Away, Sleep, and Boost modes
- **Comprehensive Safety Systems** with multiple interlocks and monitoring intervals
- **Passthrough Mode** for seamless fallback to existing thermostat, in this case ecobee, only supports heat (2 stage), cool and fan
- **OTA Updates** via WiFi or Ethernet

## Hardware Requirements

### ESP32-S3 Smart Thermostat

- **Microcontroller**: Waveshare ESP32-S3-POE-ETH-8DI-8DO with 16MB flash and PSRAM  (this should work with any waveshare hardware)
- **Relay Control**: 8-Channel relay board with PCA9554 I/O expander (I2C) - future plans are to use modbus relay modules to simplify wiring and expand I/O
- **Local Sensors**: DHT22 temperature/humidity sensor
- **Status Indicator**: WS2812 RGB LED (built-in)
- **Alarm**: Active buzzer for safety alerts (built-in)
- **Timekeeping**: BM8563 RTC module (built-in)
- **Power**: 24VAC from HVAC C-wire for HVAC control, 5-24v DC for control power
- **Network**: WiFi or W5500 Ethernet module

### GPIO Pin Assignments

| Function | GPIO Pin | Notes |
|----------|----------|-------|
| I2C SDA | GPIO42 | PCA9554 + RTC |
| I2C SCL | GPIO41 | PCA9554 + RTC |
| DHT22 Sensor | GPIO0 | Local temp/humidity |
| Ecobee W1 Input | GPIO4 | Heat Stage 1 detect |
| Ecobee W2 Input | GPIO5 | Heat Stage 2 detect |
| Ecobee Y1 Input | GPIO6 | Cooling detect |
| Ecobee G Input | GPIO7 | Fan detect |
| Status LED | GPIO38 | WS2812 RGB |
| Buzzer | GPIO46 | Active buzzer |

## Project Structure

```
ClimateOrchestrator/
├── thermostat-config/          # ESPHome thermostat firmware
│   ├── main.yaml               # Main config with substitutions
│   ├── secrets.yaml            # WiFi credentials and keys
│   └── packages/               # Modular configuration packages
│       ├── network/            # WiFi or Ethernet configs
│       ├── hardware.yaml       # I2C devices, buzzer, RTC
│       ├── globals.yaml        # Global state variables
│       ├── sensors.yaml        # Temperature/humidity sensors
│       ├── switches.yaml       # HVAC relays and controls
│       ├── numbers.yaml        # Tuning parameters
│       ├── buttons.yaml        # Action buttons
│       ├── climate.yaml        # Main thermostat logic
│       ├── scripts.yaml        # Automation scripts
│       ├── intervals.yaml      # Safety checks and monitoring
│       └── esphome-core.yaml   # API, OTA, logging
│
└── packages/                   # Home Assistant configurations
    ├── climate-supporting-entities/
    │   ├── climate-helpers.yaml    # Input controls
    │   ├── climate-sensors.yaml    # Template sensors
    │   └── thermal-model.yaml      # Learned parameters
    └── climate-automations/
        ├── climate-data-and-control.yaml      # Main automation
        └── thermal-model-learning.yaml        # ML automation
```

## Quick Start

### ESPHome Thermostat

1. **Configure settings** in `thermostat-config/main.yaml`:
   ```yaml
   substitutions:
     device_name: smart-thermostat
     outdoor_temp_entity: "sensor.YOUR_OUTDOOR_TEMP"
     outdoor_humidity_entity: "sensor.YOUR_OUTDOOR_HUMIDITY"
   ```

2. **Set WiFi credentials** in `thermostat-config/secrets.yaml`:
   ```yaml
   wifi_ssid: "YourWiFiName"
   wifi_password: "YourWiFiPassword"
   ```

3. **flash with esp web tools**:


### Home Assistant Packages

1. **Enable packages** in `configuration.yaml`:
   ```yaml
   homeassistant:
     packages: !include_dir_named packages/
   ```

2. **Copy packages** to your Home Assistant `packages/` directory:
   - `climate-supporting-entities/` → Helper entities and sensors
   - `climate-automations/` → Climate control and learning automations

3. **Customize average temp sensor names** in `climate-sensors.yaml` to match your Zigbee sensors

4. **Restart Home Assistant**:
   ```bash
   ha core check
   ha core restart
   ```

## Thermal Model

The system learns your house's thermal characteristics through normal operation:

- **Thermal Mass (τ)**: How slowly temperature changes (10-120 minutes)
- **Heat Loss Coefficient**: Rate of heat loss to outdoors (per preset)
- **Stage 1 Heating Rate**: Temperature rise from Stage 1 heating (per preset)
- **Stage 2 Additional Rate**: Extra heating from Stage 2 (per preset)
- **Model Confidence**: Accuracy of predictions (20% → 95% as cycles analyzed)

Each preset mode (Home, Away, Sleep, Boost) maintains independent learned parameters, allowing instant adaptation when switching between presets.

## Multi-Room Averaging

Configure which room sensors contribute to the average temperature:

- `input_boolean.thermostat_use_living_room_temp`
- `input_boolean.thermostat_use_bedroom_temp`
- `input_boolean.thermostat_use_kitchen_temp`
- `input_boolean.thermostat_use_office_temp`

The system automatically falls back to the local DHT22 sensor if Home Assistant connection is lost.

## Humidifier Control

Automatic setpoint calculation prevents window condensation:

- **10°C outdoor**: 45% humidity target
- **-20°C outdoor**: 20% humidity target
- **Linear interpolation** between these points
- **Manual override** available via `input_boolean.humidifier_manual_setpoint`

Humidifier only operates when heating is active for safety.

## Safety Features

- **Boot Lockout**: 60-second delay on startup prevents spurious HVAC activation
- **Heat/Cool Interlock**: Prevents simultaneous heating and cooling
- **Compressor Protection**: Minimum off-time between cooling cycles
- **Runtime Limits**: Maximum 2-hour continuous heating/cooling
- **API Disconnect Alarm**: Audible alert if Home Assistant connection lost
- **Emergency Stop Button**: Immediately shuts down all HVAC equipment
- **Maintenance Mode**: Bypass automation for manual control


## License

Open Source - Built with ESPHome and Home Assistant
