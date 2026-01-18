# Climate Orchestrator Dashboard Installation Guide

## Overview

This directory contains comprehensive Home Assistant dashboards for the ClimateOrchestrator ESPHome thermostat system. All dashboards use the new sections layout and are optimized for the Material You theme.

## Dashboard Files

| Dashboard | File | Purpose |
|-----------|------|---------|
| **Climate Control** | `climate-control.yaml` | Main daily operation dashboard |
| **Thermostat Configuration** | `thermostat-configuration.yaml` | System settings and preferences |
| **Climate Monitoring** | `climate-monitoring.yaml` | Thermal model and efficiency metrics |
| **System Diagnostics** | `system-diagnostics.yaml` | Health monitoring and troubleshooting |
| **Thermal Model Monitor** | `thermal-model-monitoring.yaml` | Advanced thermal model analysis |

## Installation Instructions

### Method 1: Dashboard Mode (Recommended)

1. **Open Home Assistant**
2. **Go to Settings → Dashboards**
3. **Click "+ Add Dashboard"** for each dashboard
4. **Choose "New dashboard from scratch"**
5. **Name the dashboard** (use names from table above)
6. **Click the ⋮ menu → "Edit Dashboard"**
7. **Click ⋮ menu again → "Raw configuration editor"**
8. **Copy the contents** of the corresponding YAML file
9. **Paste into the editor**
10. **Click "Save"**

### Method 2: YAML Mode

Add to your `configuration.yaml`:

```yaml
lovelace:
  mode: yaml
  dashboards:
    climate-control:
      mode: yaml
      title: Climate Control
      icon: mdi:home-thermometer
      show_in_sidebar: true
      filename: dashboards/lovelace/climate-control.yaml
    
    thermostat-config:
      mode: yaml
      title: Thermostat Configuration
      icon: mdi:cog
      show_in_sidebar: true
      filename: dashboards/lovelace/thermostat-configuration.yaml
    
    climate-monitoring:
      mode: yaml
      title: Climate Monitoring
      icon: mdi:chart-line
      show_in_sidebar: true
      filename: dashboards/lovelace/climate-monitoring.yaml
    
    system-diagnostics:
      mode: yaml
      title: System Diagnostics
      icon: mdi:doctor
      show_in_sidebar: true
      filename: dashboards/lovelace/system-diagnostics.yaml
    
    thermal-model:
      mode: yaml
      title: Thermal Model Monitor
      icon: mdi:chart-line
      show_in_sidebar: true
      filename: dashboards/lovelace/thermal-model-monitoring.yaml
```

## Features by Dashboard

### Climate Control Dashboard
- **Temperature Control**: Main thermostat interface with setpoint control
- **System Status**: Real-time HVAC equipment status
- **Quick Actions**: Mode selection and preset changes
- **Room Sensors**: Enable/disable individual room sensors
- **Today's Performance**: Runtime statistics and efficiency metrics
- **Environmental Context**: Weather conditions and heat loss analysis

### Thermostat Configuration Dashboard
- **Sensor Configuration**: Multi-room sensor selection and averaging
- **Humidifier Settings**: Auto/manual humidity control configuration
- **House Configuration**: Physical properties and system preferences
- **Thermal Model Parameters**: Learning system configuration
- **Advanced Settings**: Device-specific and learning parameters

### Climate Monitoring Dashboard
- **Thermal Model Learning**: Model confidence and parameter status
- **Predictions & Calculations**: Time-to-setpoint and heat loss analysis
- **All Presets Comparison**: Side-by-side preset parameters
- **System Efficiency**: Performance scoring and metrics
- **Historical Trends**: 24-hour temperature and equipment activity
- **Rate of Change Analysis**: Temperature change diagnostics

### System Diagnostics Dashboard
- **System Health**: Connection status and safety interlocks
- **Safety Monitoring**: Runtime limits and emergency controls
- **Sensor Diagnostics**: Remote sensor availability and status
- **Hardware Diagnostics**: Relay and passthrough monitoring
- **Performance Metrics**: Response times and device statistics
- **Troubleshooting Tools**: Common issues and solutions

### Thermal Model Monitor Dashboard
- **Current Heating Cycle**: Real-time cycle progress and alerts
- **Stage 2 Control**: Intelligent delay settings and triggers
- **Preset Urgency Factors**: Mode-specific urgency multipliers
- **Learning Progress**: Confidence tracking and parameter evolution
- **Rate-of-Change Diagnostics**: Advanced thermal analysis
- **System Performance**: Efficiency scoring and usage patterns

## Theme Requirements

### Required Themes
- **Material You Theme** (default theme)
- **Material You Extra Components** (for enhanced styling)

### Optional Custom Cards
- **Bubble Cards v3.1.0** (installed - minimal usage)
- **Mushroom Cards** (installed - available for unique features)

## Entity Requirements

These dashboards expect the following entity categories:

### ESPHome Entities (prefix: `smart_thermostat.`)
- Climate control and sensors
- Relay controls and status
- Device health and diagnostics

### Home Assistant Template Entities
- Temperature/humidity averaging
- Thermal model calculations
- Runtime statistics and history

### Input Entities
- Configuration helpers
- Sensor selection toggles
- Learning parameters

## Customization

### Changing Layout
Adjust `max_columns` at the top level of each dashboard:
```yaml
max_columns: 3  # Default: 3 columns
# Change to 2 or 4 for different layouts
```

### Adding Cards
Each section uses `type: grid`. Add cards like this:
```yaml
- type: entities
  title: Your Card
  entities:
    - entity: sensor.your_entity
```

### Material You Theme Colors
The dashboards use semantic colors that adapt to the Material You theme:
- **Green**: Good/optimal status
- **Yellow**: Warning/caution
- **Red**: Critical/alert status

## Troubleshooting

### Entities Not Found
1. Verify all ClimateOrchestrator packages are loaded
2. Check entity IDs match your configuration
3. Restart Home Assistant after adding packages

### Dashboard Not Appearing
1. Ensure `show_in_sidebar: true` in YAML mode
2. Check Home Assistant logs for errors
3. Clear browser cache (Ctrl+F5)

### Performance Issues
1. Reduce `hours_to_show` on history graphs
2. Limit the number of real-time sensors
3. Use template sensors for calculated values

## Support

For issues:
1. Check Home Assistant documentation: https://www.home-assistant.io/lovelace/
2. Review `CLAUDE.md` in repository root
3. Verify all required packages are installed
4. Check entity availability in Developer Tools → States
