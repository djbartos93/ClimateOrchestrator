# Unified Climate Orchestrator Dashboard

## Overview

A single, comprehensive dashboard with tabbed views for all ClimateOrchestrator functions. This replaces the multiple separate dashboards with a cleaner, unified interface.

## Dashboard Structure

The unified dashboard is organized into 5 tabbed sections:

### Tab 1: Climate Control
- Main thermostat interface with temperature control
- Current conditions and system status
- Quick actions for mode changes
- Today's performance metrics

### Tab 2: Configuration
- Sensor selection (temperature and humidity)
- Humidifier settings and preferences
- House characteristics and system behavior
- Thermal model configuration

### Tab 3: Monitoring & Analytics
- Thermal model learning status
- Predictions and efficiency metrics
- Weekly performance analysis
- Historical trends and graphs

### Tab 4: System Diagnostics
- System health and safety monitoring
- Hardware status and relay monitoring
- Sensor diagnostics and troubleshooting
- Performance metrics and graphs

### Tab 5: Advanced Thermal Model
- Current heating cycle analysis
- Stage 2 intelligent control
- All presets comparison
- Rate of change diagnostics

## Installation

### Method 1: Dashboard Mode (Recommended)

1. **Open Home Assistant**
2. **Go to Settings → Dashboards**
3. **Click "+ Add Dashboard"**
4. **Choose "New dashboard from scratch"**
5. **Name it "Climate Orchestrator"**
6. **Click the ⋮ menu → "Edit Dashboard"**
7. **Click ⋮ menu again → "Raw configuration editor"**
8. **Copy the contents** of `climate-orchestrator-unified.yaml`
9. **Paste into the editor**
10. **Click "Save"**

### Method 2: YAML Mode

Add to your `configuration.yaml`:

```yaml
lovelace:
  mode: yaml
  dashboards:
    climate-orchestrator:
      mode: yaml
      title: Climate Orchestrator
      icon: mdi:home-thermometer
      show_in_sidebar: true
      filename: dashboards/lovelace/climate-orchestrator-unified.yaml
```

## Benefits of Unified Dashboard

- **Clean Interface**: Single dashboard instead of 5 separate ones
- **Tabbed Navigation**: Easy switching between different functional areas
- **Logical Organization**: Related functions grouped together
- **Reduced Clutter**: Minimizes sidebar overcrowding
- **Consistent Experience**: Same styling and layout across all sections

## Features

### Material You Theme Optimized
- Semantic colors that adapt to your theme
- Clean, modern card layouts
- Responsive grid system

### Built-in Card Focus
- Primarily uses native Home Assistant cards
- Minimal custom card dependencies
- Better performance and compatibility

### Comprehensive Coverage
- All functionality from the 5 separate dashboards
- Enhanced organization and flow
- Quick access to frequently used features

## Navigation Tips

1. **Climate Control Tab**: For daily operations and quick adjustments
2. **Configuration Tab**: For system setup and preferences
3. **Monitoring Tab**: For performance analysis and trends
4. **Diagnostics Tab**: For troubleshooting and system health
5. **Advanced Tab**: For detailed thermal model analysis

## Customization

### Adding New Cards
Each tab uses `type: grid` layout. Add cards within the appropriate section:

```yaml
# Example adding to Climate Control tab
- type: entities
  title: Your New Card
  entities:
    - entity: sensor.your_entity
```

### Adjusting Layout
Change `max_columns: 3` at the top level for different grid widths:
- `2` for wider cards
- `4` for more compact layout

### Reorganizing Tabs
Simply reorder the sections in the YAML file to change tab order.

## Entity Requirements

This unified dashboard expects the same entities as the separate dashboards:
- ESPHome thermostat entities
- Home Assistant template sensors
- Input helpers and configuration entities
- Thermal model learning entities

## Troubleshooting

### Tabs Not Showing
- Ensure you're using Home Assistant 2026.1 or newer
- Check that sections layout is supported
- Verify dashboard YAML syntax

### Missing Entities
- Check that all ClimateOrchestrator packages are loaded
- Verify entity IDs match your configuration
- Use Developer Tools → States to check entity availability

### Performance Issues
- Reduce `hours_to_show` on history graphs
- Limit real-time updating sensors
- Consider using fewer cards per tab

## Migration from Separate Dashboards

If you currently use the separate dashboards:

1. **Install the unified dashboard** using the instructions above
2. **Test functionality** to ensure all entities work correctly
3. **Remove old dashboards** from your sidebar (optional)
4. **Update bookmarks** to point to the new unified dashboard

The unified dashboard provides all the same functionality in a cleaner, more organized interface.
