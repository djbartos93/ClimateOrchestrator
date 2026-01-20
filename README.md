# ClimateOrchestrator

A smart home climate control system combining ESPHome-based thermostat hardware with Home Assistant automation and physics-based thermal modeling. The system learns your home's thermal characteristics over time to optimize HVAC performance and energy efficiency.

## Notes

The goal of this was to quickly create a base to build upon so this is all currently AI written, but I intend to completely review and improve this project in the future.

## Key Features

### Intelligent Climate Control
- **Dual-Stage Heating** with learned optimal stage 2 timing
- **Physics-Based Thermal Model** that adapts to your home's characteristics
- **Preset-Specific Learning** - Home, Away, Sleep, and Boost modes learn independently
- **Smart Stage 2 Control** with near-setpoint inhibit, large delta triggers, and urgency factors

### Multi-Room Temperature Management
- **Multi-Room Averaging** across Zigbee temperature sensors
- **Automatic Failover** to local DHT22 sensor if Home Assistant disconnects
- **Per-Room Enable/Disable** toggles for flexible averaging

### Smart Humidifier Control
- **Outdoor Temperature-Based Setpoint** prevents window condensation
- **Auto or Manual Mode** with configurable override
- **Safety Interlocks** - only runs during heating cycles

### Ecobee Integration
- **Passthrough Mode** for seamless fallback to existing Ecobee thermostat
- **Input Detection** monitors Ecobee W1, W2, Y1, G signals
- **System Mismatch Detection** alerts when systems disagree

### Safety Features
- **Boot Lockout** prevents spurious HVAC activation on startup
- **Heat/Cool Interlock** prevents simultaneous heating and cooling
- **Compressor Protection** enforces minimum off-time between cycles
- **Runtime Limits** with configurable maximums (default 2 hours)
- **API Disconnect Alarm** audible alert if Home Assistant connection lost
- **Emergency Stop** immediately shuts down all HVAC equipment
- **Interrupted Cycle Detection** extended lockout after unexpected reboot

## Project Structure

```
ClimateOrchestrator/
├── thermostat-config/              # ESPHome firmware configuration
│   ├── main.yaml                   # Entry point with substitutions
│   ├── secrets.yaml                # WiFi credentials (gitignored)
│   └── packages/
│       ├── network/
│       │   ├── wifi.yaml           # WiFi network configuration
│       │   └── ethernet.yaml       # Ethernet network configuration
│       ├── hardware.yaml           # I2C, RTC, buzzer, GPIO expander
│       ├── globals.yaml            # Global state variables
│       ├── sensors.yaml            # Temperature, humidity, runtime sensors
│       ├── switches.yaml           # HVAC relays, humidifier, maintenance
│       ├── numbers.yaml            # Tuning parameters (delays, deadbands)
│       ├── buttons.yaml            # Action buttons (reboot, emergency stop)
│       ├── climate.yaml            # Main thermostat with dual-stage logic
│       ├── scripts.yaml            # Automation scripts (LED, humidifier)
│       ├── intervals.yaml          # Safety checks and monitoring
│       └── esphome-core.yaml       # API, OTA, logging configuration
│
├── packages/                       # Home Assistant packages
│   ├── climate-supporting-entities/
│   │   ├── climate-helpers.yaml    # Input booleans, numbers, selects
│   │   ├── climate-sensors.yaml    # Template sensors for averaging
│   │   └── thermal-model.yaml      # Learned thermal parameters
│   └── climate-automations/
│       ├── climate-data-and-control.yaml    # Data sync and mode changes
│       └── thermal-model-learning.yaml      # ML learning automations
│
├── dashboards/
│   └── lovelace/
│       └── thermal-model-monitoring.yaml    # Comprehensive monitoring dashboard
│
├── CLAUDE.md                       # AI assistant guidance
├── AGENTS.md                       # Multi-agent collaboration guide
├── FIXES.md                        # Bug fix documentation
└── STAGE2_IMPROVEMENTS.md          # Stage 2 feature tracker
```

## Hardware Requirements

### ESP32-S3 Smart Thermostat
- **Microcontroller**: Waveshare ESP32-S3-POE-ETH-8DI-8DO (16MB flash, PSRAM)
- **Relay Control**: 8-Channel relay via PCA9554 I/O expander (I2C)
- **Local Sensors**: DHT22 temperature/humidity sensor
- **Status Indicator**: WS2812 RGB LED (built-in)
- **Alarm**: Active buzzer for safety alerts (built-in)
- **Timekeeping**: BM8563 RTC module (built-in)
- **Power**: 24VAC from HVAC C-wire, 5-24V DC for control

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

## Quick Start

### 1. ESPHome Thermostat Setup

**Configure settings** in `thermostat-config/main.yaml`:
```yaml
substitutions:
  device_name: smart-thermostat
  friendly_name: "Smart Thermostat"
  outdoor_temp_entity: "sensor.YOUR_OUTDOOR_TEMP"
  outdoor_humidity_entity: "sensor.YOUR_OUTDOOR_HUMIDITY"
```

**Set WiFi credentials** in `thermostat-config/secrets.yaml`:
```yaml
wifi_ssid: "YourWiFiName"
wifi_password: "YourWiFiPassword"
iot_wifi: "BackupWiFiName"
iot_password: "BackupPassword"
```

**Validate and flash**:
```bash
esphome config thermostat-config/main.yaml
esphome run thermostat-config/main.yaml
```

### 2. Home Assistant Setup

**Enable packages** in `configuration.yaml`:
```yaml
homeassistant:
  packages: !include_dir_named packages/
```

**Copy packages** to your Home Assistant `packages/` directory:
- `climate-supporting-entities/` - Helper entities and sensors
- `climate-automations/` - Climate control and learning automations

**Customize sensor names** in `climate-sensors.yaml` to match your actual Zigbee sensors.

**Restart Home Assistant**:
```bash
ha core check
ha core restart
```

## Thermal Model Learning

The system learns your home's thermal characteristics through normal operation:

### Learned Parameters (Per Preset)
| Parameter | Description | Typical Range |
|-----------|-------------|---------------|
| Stage 1 Heating Rate | Temperature rise per hour from Stage 1 | 1.0-4.0 °C/hr |
| Stage 2 Additional Rate | Extra heating from Stage 2 | 0.5-3.0 °C/hr |
| Heat Loss Coefficient | Rate of heat loss per degree difference | 0.2-1.0 °C/hr/°C |
| Model Confidence | Accuracy of predictions | 20-95% |

### Global Parameters
| Parameter | Description | Typical Range |
|-----------|-------------|---------------|
| Thermal Mass (τ) | How slowly temperature changes | 15-60 minutes |
| Target Cycle Time | Optimal heating cycle duration | 15-35 minutes |

### Preset Urgency Factors
| Preset | Default Multiplier | Effect |
|--------|-------------------|--------|
| Home | 1.0x | Balanced comfort and efficiency |
| Away | 1.5x | Longer delays, prioritize efficiency |
| Sleep | 1.2x | Slightly longer delays, quieter |
| Boost | 0.5x | Shortest delays, fastest heating |

## Stage 2 Intelligent Control

### Smart Triggers
- **Near-Setpoint Inhibit**: Stage 2 won't engage within 1.5°F of setpoint
- **Large Delta Trigger**: Immediate 1-minute delay when >3°F change detected
- **Preset Urgency**: Different presets have different response speeds

### Manual Control
- **Disable Button**: Temporarily disable Stage 2 for 15-240 minutes
- **Auto Re-Enable**: Automatically turns back on after timeout

### Configurable Range
- **Delay Range**: 1-30 minutes (expanded for mild weather efficiency)
- **Urgency Factors**: 0.3x - 2.0x multiplier per preset

## Dashboard

The included Lovelace dashboard (`dashboards/lovelace/thermal-model-monitoring.yaml`) provides:

1. **Current Heating Cycle** - Real-time status and temperature tracking
2. **Stage 2 Control** - Delays, triggers, inhibits, and disable button
3. **Preset Urgency Factors** - Adjustable sliders for each preset
4. **Thermal Model Learning** - Parameters and confidence for active preset
5. **All Presets Summary** - Side-by-side comparison of learned values
6. **Rate-of-Change Diagnostics** - Temperature change monitoring
7. **Predictions** - Estimated cycle times based on learned model
8. **Performance & Efficiency** - Daily stats and efficiency score
9. **Safety & Diagnostics** - Safety bounds and reset information

## Troubleshooting

### ESPHome Issues
- **Check logs**: `esphome logs thermostat-config/main.yaml`
- **Boot lockout**: HVAC won't respond for ~60s after boot (safety feature)
- **Fallback AP**: Connect to "smart-thermostat Fallback Hotspot" if WiFi fails

### Home Assistant Issues
- **Validate templates**: Developer Tools → Template
- **Check automation traces**: Automation UI for failed conditions
- **Low confidence (<50%)**: System still learning, expect adaptation

### Common Problems
| Problem | Solution |
|---------|----------|
| Stage 2 not activating | Check `input_number.stage2_disable_timeout`, verify not inhibited |
| Humidifier not running | Only operates when heating is active |
| Remote sensors stale | Check `input_boolean.thermostat_use_*_temp` toggles |
| Model not learning | Ensure heating cycles complete (reach setpoint) |
| Safety reset triggered | Check STAGE2_IMPROVEMENTS.md for parameter bounds |

## Development

### ESPHome Commands
```bash
# Validate configuration
esphome config thermostat-config/main.yaml

# Compile firmware
esphome compile thermostat-config/main.yaml

# Flash and monitor
esphome run thermostat-config/main.yaml

# View logs
esphome logs thermostat-config/main.yaml
```

### Home Assistant Commands
```bash
# Check configuration
ha core check

# Restart to apply changes
ha core restart
```

## Documentation

- **CLAUDE.md** - AI assistant guidance for working with this codebase
- **AGENTS.md** - Multi-agent collaboration guidelines
- **FIXES.md** - Bug fix history and documentation
- **STAGE2_IMPROVEMENTS.md** - Stage 2 feature implementation tracker
- **dashboards/README.md** - Dashboard installation and customization
- **thermostat-config/README.md** - ESPHome configuration details

## License

Open Source - Built with ESPHome and Home Assistant
