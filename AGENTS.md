# AGENTS.md

Multi-agent collaboration guide for ClimateOrchestrator. This document helps AI agents understand the codebase quickly and work effectively across different task types.

## Quick Context

**What is this?** A smart thermostat system combining:
- **ESPHome** (ESP32-S3 firmware) - Real-time HVAC control
- **Home Assistant** (YAML packages) - Automation, learning, UI

**Core capability**: Physics-based thermal model that learns your home's heating characteristics per preset mode (Home/Away/Sleep/Boost).

## Task-Specific Guidance

### ESPHome / Firmware Tasks

**Key files**:
- `thermostat-config/main.yaml` - Entry point, substitutions, boot sequence
- `thermostat-config/packages/climate.yaml` - HVAC control logic
- `thermostat-config/packages/sensors.yaml` - Sensor definitions
- `thermostat-config/packages/intervals.yaml` - Safety checks

**Before modifying**:
1. Read CLAUDE.md for full architecture
2. Understand the boot lockout sequence in `main.yaml`
3. Check if changes affect safety interlocks

**After modifying**:
```bash
esphome config thermostat-config/main.yaml  # Validate
esphome compile thermostat-config/main.yaml  # Test compilation
```

**Gotchas**:
- Packages loaded from GitHub via `github_ref` substitution
- Temperature internally in Celsius; `effective_temperature` is published as Celsius and Home Assistant provides a normalized Fahrenheit helper sensor for UI-facing °F values
- Boot lockout prevents HVAC for ~60s after startup
- `id()` references globals, sensors, switches by their internal ID

### Home Assistant / Automation Tasks

**Key files**:
- `packages/climate-automations/thermal-model-learning.yaml` - Learning logic
- `packages/climate-supporting-entities/thermal-model.yaml` - Learned parameters
- `packages/climate-supporting-entities/climate-sensors.yaml` - Template sensors

**Before modifying**:
1. Understand preset-specific entity pattern: `entity_{preset}`
2. Check existing templates for similar patterns
3. Always provide default values in templates

**After modifying**:
```bash
ha core check  # Validate YAML
ha core restart  # Apply changes
```

**Gotchas**:
- Each preset (home/away/sleep/boost) has separate learned parameters
- Template sensors must handle `unknown`/`unavailable` states
- Use `| float(default)` and `| int(default)` everywhere

### Thermal Model / Learning Tasks

**Key concepts**:
- **Stage 1 heating rate**: °C/hr from furnace stage 1
- **Stage 2 additional rate**: Extra °C/hr when stage 2 engages
- **Heat loss coefficient**: °C/hr per °C of indoor-outdoor difference
- **Confidence**: 20-95%, increases with analyzed cycles

**Learning flow**:
1. `thermal_model_track_cycle_start` - Records start conditions
2. `thermal_model_track_stage2_engage` - Records stage 2 engagement
3. `thermal_model_learn_from_cycle` - Analyzes completed cycle
4. Exponential weighted averaging updates parameters

**Safety bounds** (reset if exceeded):
- Stage 1: 0.4-8.0 °C/hr
- Stage 2 additional: 0.2-6.0 °C/hr
- Heat loss: 0.1-2.5

### Stage 2 Control Tasks

**Control chain**:
```
binary_sensor.stage2_should_engage (master)
├── NOT input_boolean.stage2_temporarily_disabled
├── NOT binary_sensor.stage2_near_setpoint_inhibit (unless large delta)
└── binary_sensor.smart_thermostat_heating_active
```

**Key thresholds**:
- Near-setpoint inhibit: ≤1.5°F from target
- Large delta trigger: >3°F AND (setpoint changed <5min OR preset changed <5min)
- Urgency factors: 0.5x (Boost) to 1.5x (Away)

### Dashboard / UI Tasks

**Key file**: `dashboards/lovelace/thermal-model-monitoring.yaml`

**Sections**:
1. Current Heating Cycle
2. Stage 2 Control
3. Preset Urgency Factors
4. Thermal Model Learning
5. All Presets Summary
6. Rate-of-Change Diagnostics
7. Predictions
8. Performance & Efficiency
9. Safety & Diagnostics

**Adding cards**: Follow existing grid pattern, include all required entities

### Bug Fixes

**Documentation**: Update `FIXES.md` with:
- Problem description
- Root cause
- Files modified
- Changes made
- Testing recommendations

**Common patterns to check**:
- Missing default values in templates
- Preset-specific vs global entity references
- Temperature unit mismatches (°C vs °F)
- Entity availability checks

### New Features

**Documentation**: Update `STAGE2_IMPROVEMENTS.md` for stage 2 features

**Checklist**:
- [ ] Add helper entities in `climate-helpers.yaml`
- [ ] Add sensors in `climate-sensors.yaml` or `thermal-model.yaml`
- [ ] Add automations in `thermal-model-learning.yaml`
- [ ] Update ESPHome if firmware changes needed
- [ ] Add dashboard cards if user-facing
- [ ] Update README.md and CLAUDE.md

## Entity Naming Conventions

### ESPHome Entities
- Prefix: `smart_thermostat_`
- Examples: `smart_thermostat_heating_active`, `smart_thermostat_stage_2_delay`

### Home Assistant Entities
- Learned parameters: `thermostat_{parameter}_{preset}`
- Stage 2 control: `stage2_{function}`
- Sensors: `thermostat_{measurement}`

### Preset Names
Always lowercase in entity names: `home`, `away`, `sleep`, `boost`

## Code Patterns

### Template Sensor with Defaults
```yaml
state: >
  {% set temp = states('sensor.temperature') | float(21) %}
  {% set outdoor = states('sensor.outdoor') | float(0) %}
  {{ (temp - outdoor) | round(1) }}
```

### Preset-Specific Access
```yaml
{% set preset = states('sensor.active_preset_mode') | lower %}
{% set rate = states('input_number.thermostat_stage1_heating_rate_' + preset) | float(1.5) %}
```

### Automation with Preset Variables
```yaml
variables:
  active_preset: >
    {% set preset = state_attr('climate.smart_thermostat', 'preset_mode') | lower %}
    {% if preset in ['home', 'away', 'sleep', 'boost'] %}
      {{ preset }}
    {% else %}
      home
    {% endif %}
action:
  - service: input_number.set_value
    target:
      entity_id: "input_number.thermostat_confidence_{{ active_preset }}"
```

### ESPHome Lambda
```cpp
- lambda: |-
    ESP_LOGI("hvac", "Stage 2 delay: %.0f min", id(stage2_delay_minutes).state);
    if (id(heat_stage1_relay).state && !id(heat_stage2_relay).state) {
      ESP_LOGD("hvac", "Stage 1 active, Stage 2 waiting");
    }
```

## Quick Reference Tables

### File Locations by Task Type

| Task | Primary File(s) |
|------|-----------------|
| HVAC control logic | `thermostat-config/packages/climate.yaml` |
| Safety checks | `thermostat-config/packages/intervals.yaml` |
| Learning automations | `packages/climate-automations/thermal-model-learning.yaml` |
| Learned parameters | `packages/climate-supporting-entities/thermal-model.yaml` |
| Template sensors | `packages/climate-supporting-entities/climate-sensors.yaml` |
| UI helpers | `packages/climate-supporting-entities/climate-helpers.yaml` |
| Dashboard | `dashboards/lovelace/thermal-model-monitoring.yaml` |

### Key Binary Sensors

| Sensor | TRUE When |
|--------|-----------|
| `heating_active` | Stage 1 or Stage 2 running |
| `stage_2_active` | Stage 2 relay on |
| `stage2_near_setpoint_inhibit` | Within 1.5°F of target |
| `stage2_large_delta_trigger` | >3°F delta + recent change |
| `stage2_should_engage` | OK to engage stage 2 |
| `losing_ground_while_heating` | Heating but temp dropping |

### Urgency Factors

| Preset | Factor | Effect |
|--------|--------|--------|
| Boost | 0.5x | Fastest response |
| Home | 1.0x | Balanced |
| Sleep | 1.2x | Quieter |
| Away | 1.5x | Most efficient |

## Testing Checklist

### After ESPHome Changes
- [ ] `esphome config` passes
- [ ] `esphome compile` succeeds
- [ ] Check logs for warnings
- [ ] Verify safety interlocks work
- [ ] Test boot lockout behavior

### After Home Assistant Changes
- [ ] `ha core check` passes
- [ ] Automations trigger correctly
- [ ] Template sensors update
- [ ] Dashboard displays correctly
- [ ] Check automation traces

### After Learning Logic Changes
- [ ] Cycles are tracked correctly
- [ ] Parameters update within bounds
- [ ] Confidence increases appropriately
- [ ] Safety reset triggers when needed
- [ ] Per-preset isolation works

## Common Mistakes to Avoid

1. **Forgetting default values** - Always use `| float(default)` or `| int(default)`
2. **Wrong entity prefix** - ESPHome uses `smart_thermostat_`, HA varies
3. **Temperature unit mismatch** - Internal Celsius, UI often Fahrenheit
4. **Non-preset-specific access** - Most parameters are per-preset now
5. **Missing availability checks** - Handle `unknown`/`unavailable`
6. **Editing packages directly** - Use `main.yaml` substitutions when possible
7. **Skipping validation** - Always run config/check commands
8. **Not updating docs** - Update FIXES.md or STAGE2_IMPROVEMENTS.md
