# ClimateOrchestrator Dashboards

This directory contains Lovelace dashboard configurations for monitoring the ClimateOrchestrator smart thermostat system.

## Directory Structure

```
dashboards/
├── README.md                           # This file
└── lovelace/
    └── thermal-model-monitoring.yaml  # Thermal model & stage 2 control dashboard
```

## Installation

### Method 1: Dashboard Mode (Recommended)

1. In Home Assistant, go to **Settings → Dashboards**
2. Click **+ Add Dashboard**
3. Choose **New dashboard from scratch**
4. Name it "Thermal Model Monitor"
5. Click the ⋮ menu → **Edit Dashboard**
6. Click ⋮ menu again → **Raw configuration editor**
7. Copy the contents of `lovelace/thermal-model-monitoring.yaml`
8. Paste into the editor
9. Click **Save**

### Method 2: YAML Mode

If you're using YAML mode for dashboards:

1. Add to your `configuration.yaml`:
   ```yaml
   lovelace:
     mode: yaml
     dashboards:
       thermal-model:
         mode: yaml
         title: Thermal Model Monitor
         icon: mdi:chart-line
         show_in_sidebar: true
         filename: dashboards/lovelace/thermal-model-monitoring.yaml
   ```

2. Restart Home Assistant
3. Dashboard will appear in sidebar

## Dashboard Features

### Thermal Model Monitoring Dashboard

**Path:** `/thermal-model`

Comprehensive monitoring dashboard with 9 sections:

1. **Current Heating Cycle**
   - Real-time heating status
   - Temperature delta gauge
   - Cycle progress tracking
   - Losing ground alert

2. **Stage 2 Intelligent Control**
   - Delay settings (current vs. optimal)
   - Urgency multipliers
   - Triggers and inhibits status
   - Disable stage 2 button

3. **Preset Urgency Factors**
   - Adjustable sliders for Home/Away/Sleep/Boost
   - Explanation of urgency multipliers
   - Example calculations

4. **Thermal Model Learning Progress**
   - Current preset parameters
   - Confidence gauge
   - Historical learning trends

5. **All Presets Learning Summary**
   - Side-by-side comparison
   - All 4 presets (Home/Away/Sleep/Boost)
   - Stage 1, Stage 2, heat loss, confidence

6. **Rate-of-Change Diagnostics**
   - Temperature change rates (5min/10min windows)
   - Losing ground detection
   - Data collection for Phase 3 decision

7. **Thermal Model Predictions**
   - Predicted cycle times
   - Heat loss calculations
   - Explanation of prediction logic

8. **System Performance & Efficiency**
   - Today's runtime statistics
   - Efficiency score gauge
   - Stage 1 vs Stage 2 usage ratio

9. **Safety & Diagnostics**
   - Safety bounds documentation
   - Last model update timestamp
   - Reset system explanation

## Customization

### Adding More Cards

Each section uses `type: grid` which automatically arranges cards. To add a card:

```yaml
- type: grid
  title: Your Section
  cards:
    - type: entities
      title: Your Card
      entities:
        - entity: sensor.your_entity
```

### Changing Layout

Adjust the `max_columns` at the top level to change grid width:

```yaml
max_columns: 3  # Default: 3 columns, change to 2 or 4
```

### Preset-Specific Views

The dashboard currently shows the "home" preset by default. To show a different preset, change the entity IDs:

```yaml
# From:
- entity: input_number.thermostat_stage1_heating_rate_home

# To:
- entity: input_number.thermostat_stage1_heating_rate_away
```

Or use template cards that dynamically show the active preset (advanced).

## Entities Required

This dashboard expects the following entities to exist:

**From Phase 1:**
- `sensor.current_temperature_delta`
- `binary_sensor.stage2_near_setpoint_inhibit`
- `binary_sensor.stage2_large_delta_trigger`
- `binary_sensor.stage2_should_engage`
- `button.disable_stage2_temporarily`
- `input_boolean.stage2_temporarily_disabled`

**From Phase 2:**
- `input_number.stage2_urgency_home/away/sleep/boost`
- `sensor.stage2_active_urgency_factor`

**From Phase 3 (Diagnostics):**
- `sensor.temperature_change_rate_5min`
- `sensor.temperature_change_rate_10min`
- `binary_sensor.losing_ground_while_heating`
- `sensor.heating_cycle_progress`

**From Thermal Model:**
- `input_number.thermostat_stage1_heating_rate_{preset}`
- `input_number.thermostat_stage2_additional_rate_{preset}`
- `input_number.thermostat_heat_loss_coefficient_{preset}`
- `input_number.thermostat_model_confidence_{preset}`
- `counter.thermostat_cycles_analyzed`

**From ESPHome:**
- `binary_sensor.smart_thermostat_heating_active`
- `binary_sensor.smart_thermostat_stage_2_active`
- `sensor.smart_thermostat_effective_temperature`
- `number.smart_thermostat_stage_2_delay`

## Troubleshooting

### Entities Not Found

If you see "Entity not found" errors:
1. Check that all packages are loaded in `configuration.yaml`
2. Restart Home Assistant after adding new packages
3. Verify entity IDs match your configuration

### Dashboard Not Appearing

If the dashboard doesn't show in sidebar:
1. Check `configuration.yaml` lovelace configuration
2. Ensure `show_in_sidebar: true`
3. Restart Home Assistant
4. Clear browser cache (Ctrl+F5)

### Cards Not Displaying

If cards show errors:
1. Check entity availability in **Developer Tools → States**
2. Verify entity IDs are correct (case-sensitive!)
3. Check Home Assistant logs for errors

## Future Dashboards

Planned dashboards for future development:

- **Main Climate Control** - Daily operation and manual overrides
- **Historical Analysis** - Long-term trends and efficiency tracking
- **Diagnostics & Debugging** - Detailed system health monitoring
- **Humidifier Control** - Humidifier-specific monitoring
- **Equipment Health** - Runtime tracking, filter reminders, maintenance

## Contributing

When adding new dashboards:
1. Place YAML files in `dashboards/lovelace/`
2. Use descriptive filenames (kebab-case)
3. Document entities required
4. Update this README with installation instructions
5. Test on a clean Home Assistant instance if possible

## Support

For issues or questions:
- Check Home Assistant documentation: https://www.home-assistant.io/lovelace/
- Review `CLAUDE.md` in repository root
- Check `STAGE2_IMPROVEMENTS.md` for feature documentation
