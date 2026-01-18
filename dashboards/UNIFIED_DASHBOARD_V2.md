# Climate Orchestrator Unified Dashboard - Installation Guide

## Overview
This unified dashboard combines all thermostat functionality into a single Home Assistant dashboard with multiple views (tabs). Each view provides focused access to specific aspects of your climate control system.

## Dashboard Structure

### View 1: Climate Control 🌡️
**Path**: `/climate-control`
**Purpose**: Main temperature control and system status

**Features**:
- Temperature control with thermostat card
- Current conditions display
- System status indicators
- Quick action buttons for mode changes
- Real-time environmental data

### View 2: Configuration ⚙️
**Path**: `/configuration`
**Purpose**: Advanced system configuration

**Features**:
- Sensor selection for temperature/humidity averaging
- Humidifier settings and controls
- House mode configuration
- Thermal model parameters by preset

### View 3: Monitoring & Analytics 📊
**Path**: `/monitoring`
**Purpose**: Performance tracking and analysis

**Features**:
- Thermal model health monitoring
- Predictions and efficiency metrics
- Historical performance graphs
- Runtime statistics

### View 4: System Diagnostics 🔧
**Path**: `/diagnostics`
**Purpose**: Troubleshooting and system health

**Features**:
- System health indicators
- Sensor diagnostics
- Hardware status monitoring
- Error detection and logging

### View 5: Advanced Thermal Model 📈
**Path**: `/thermal-model`
**Purpose**: Detailed thermal model analysis

**Features**:
- Current heating cycle analysis
- Stage 2 intelligent control status
- Preset urgency factors
- Thermal performance metrics

## Installation Instructions

### Method 1: YAML Mode (Recommended)

1. **Copy the dashboard file**:
   ```bash
   cp climate-orchestrator-unified-v2.yaml /config/dashboards/
   ```

2. **Add to configuration.yaml**:
   ```yaml
   lovelace:
     mode: yaml
     dashboards:
       climate-orchestrator:
         title: Climate Orchestrator
         icon: mdi:home-thermostat
         mode: yaml
         filename: climate-orchestrator-unified-v2.yaml
   ```

3. **Restart Home Assistant**

4. **Access the dashboard**:
   - Navigate to **Overview** in Home Assistant
   - Click on **Climate Orchestrator** in the sidebar
   - Use the tabs at the top to navigate between views

### Method 2: Dashboard Mode (Manual UI)

1. **Open Home Assistant**
2. **Go to Overview** → **Dashboard** → **Add Dashboard**
3. **Set title**: "Climate Orchestrator"
4. **Set icon**: `mdi:home-thermostat`
5. **Set URL**: `climate-orchestrator`
6. **Click "Create"**
7. **Edit the dashboard** (three dots → Edit dashboard)
8. **Switch to Raw Configuration**
9. **Paste the entire contents** of `climate-orchestrator-unified-v2.yaml`
10. **Save**

## Required Entities

### Core Climate Entities
- `climate.smart_thermostat` - Main thermostat entity
- `sensor.smart_thermostat_local_temperature` - Indoor temperature
- `sensor.smart_thermostat_local_humidity` - Indoor humidity

### Input Controls
- `input_number.heating_setpoint` - Heating temperature setpoint
- `input_number.cooling_setpoint` - Cooling temperature setpoint
- `input_select.hvac_mode` - HVAC mode selection
- `input_select.preset_mode` - Preset mode selection

### Mode Controls
- `input_boolean.away_mode` - Away mode toggle
- `input_boolean.eco_mode` - Eco mode toggle
- `input_boolean.boost_mode` - Boost mode toggle

### Sensor Selection
- `input_boolean.use_living_room_temp` - Living room temperature sensor
- `input_boolean.use_bedroom_temp` - Bedroom temperature sensor
- `input_boolean.use_office_temp` - Office temperature sensor
- `input_boolean.use_basement_temp` - Basement temperature sensor
- `input_boolean.use_living_room_humidity` - Living room humidity sensor
- `input_boolean.use_bedroom_humidity` - Bedroom humidity sensor
- `input_boolean.use_office_humidity` - Office humidity sensor
- `input_boolean.use_basement_humidity` - Basement humidity sensor

### Humidifier Controls
- `input_number.humidifier_setpoint` - Humidifier target humidity
- `input_number.humidity_tolerance` - Humidity tolerance range
- `input_boolean.humidifier_auto_mode` - Automatic humidifier control
- `switch.humidifier` - Humidifier power control

### House Configuration
- `input_select.house_mode` - House operating mode
- `input_boolean.occupancy_simulation` - Occupancy simulation
- `input_boolean.vacation_mode` - Vacation mode

### Thermal Model Parameters
- `input_number.thermal_mass_home` - Thermal mass for Home preset
- `input_number.heat_loss_coefficient_home` - Heat loss for Home preset
- `input_number.heating_rate_home` - Heating rate for Home preset
- `input_number.thermal_mass_away` - Thermal mass for Away preset
- `input_number.heat_loss_coefficient_away` - Heat loss for Away preset
- `input_number.heating_rate_away` - Heating rate for Away preset

### Monitoring Sensors
- `sensor.average_temperature` - Calculated average temperature
- `sensor.average_humidity` - Calculated average humidity
- `sensor.thermal_model_status` - Thermal model status
- `sensor.model_confidence_home` - Model confidence for Home preset
- `sensor.model_confidence_away` - Model confidence for Away preset
- `sensor.predicted_time_to_setpoint` - Predicted time to reach setpoint
- `sensor.heat_loss_rate` - Current heat loss rate
- `sensor.heating_efficiency_score` - Heating efficiency score

### Performance Metrics
- `sensor.heating_runtime_today` - Today's heating runtime
- `sensor.cooling_runtime_today` - Today's cooling runtime
- `sensor.total_cycles_today` - Today's total cycles

### System Health
- `binary_sensor.system_mismatch` - System mismatch detection
- `binary_sensor.sensor_fault_detected` - Sensor fault detection
- `binary_sensor.thermostat_online` - Thermostat connectivity status

### Room Sensors
- `sensor.living_room_temperature` - Living room temperature
- `sensor.bedroom_temperature` - Bedroom temperature
- `sensor.office_temperature` - Office temperature
- `sensor.basement_temperature` - Basement temperature
- `sensor.living_room_humidity` - Living room humidity
- `sensor.bedroom_humidity` - Bedroom humidity
- `sensor.office_humidity` - Office humidity
- `sensor.basement_humidity` - Basement humidity

### Hardware Status
- `sensor.esp32_uptime` - ESP32 device uptime
- `sensor.esp32_free_memory` - ESP32 available memory
- `sensor.esp32_wifi_signal` - WiFi signal strength

### Advanced Thermal Model
- `sensor.current_cycle_duration` - Current heating cycle duration
- `sensor.current_cycle_efficiency` - Current cycle efficiency
- `sensor.stage_2_active` - Stage 2 heating status
- `binary_sensor.stage_2_needed` - Stage 2 heating requirement
- `sensor.stage_2_urgency_factor` - Stage 2 urgency calculation
- `sensor.stage_2_predicted_savings` - Predicted Stage 2 savings
- `sensor.urgency_factor_home` - Home preset urgency
- `sensor.urgency_factor_away` - Away preset urgency
- `sensor.urgency_factor_sleep` - Sleep preset urgency
- `sensor.urgency_factor_boost` - Boost preset urgency

### Binary Sensors
- `binary_sensor.heating_active` - Heating system status
- `binary_sensor.cooling_active` - Cooling system status
- `binary_sensor.fan_running` - Fan system status

### Scripts
- `script.reset_daily_stats` - Reset daily statistics

## Theme Compatibility

This dashboard is designed to work perfectly with the **Material You** theme. The sections layout and built-in cards automatically adapt to your theme settings.

## Customization Tips

### Adding New Cards
To add new cards to any view, simply add them to the appropriate `cards:` array under the desired section.

### Modifying Layout
- Adjust `max_columns` to change the grid layout (1-4 columns)
- Reorder sections by changing their position in the `sections:` array
- Add or remove sections as needed

### Entity Customization
- Change `name:` fields to customize display names
- Modify `tap_action:` for custom interactions
- Adjust gauge ranges and severity colors as needed

## Troubleshooting

### Missing Entities
If you see "Entity not found" errors:
1. Check that all required entities exist in your system
2. Verify entity IDs match exactly
3. Ensure Climate Orchestrator packages are properly installed

### Layout Issues
If cards don't display correctly:
1. Ensure you're using Home Assistant 2026.1 or later
2. Check that your theme supports sections layout
3. Try refreshing the dashboard

### Performance Issues
If the dashboard is slow:
1. Reduce the number of history graphs
2. Increase refresh intervals
3. Consider splitting complex views

## Support

For issues related to:
- **Dashboard functionality**: Check entity availability and configuration
- **Missing entities**: Verify Climate Orchestrator packages are installed
- **Theme issues**: Ensure Material You theme is properly configured
- **Performance**: Consider reducing history graph time ranges

## Updates

To update the dashboard:
1. Replace the dashboard file with the new version
2. Clear your browser cache
3. Refresh Home Assistant

The dashboard structure is designed to be backward compatible with entity updates from the Climate Orchestrator system.
