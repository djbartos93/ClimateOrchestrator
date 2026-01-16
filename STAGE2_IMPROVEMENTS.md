# Stage 2 Heating Logic Improvements - Project Tracker

**Project Start Date:** 2026-01-15
**Status:** Phase 1 - In Progress

---

## Project Goals

Improve stage 2 heating logic to be more intelligent, efficient, and context-aware based on industry best practices and specific use cases.

---

## Research Findings Summary

### Industry Best Practices (Smart Thermostats)

**Ecobee:**
- Default: 10 minutes after stage 1 starts
- Configurable: 10-120 min delay OR 1-10°F temperature delta trigger
- Algorithm-based (some users find too aggressive)

**Honeywell:**
- Rate-of-change monitoring (no fixed delay)
- Brings stage 2 on quickly when needed
- More responsive than fixed-delay systems

**General HVAC Wisdom:**
- Stage 2 engages when >2°F below setpoint OR after 10 minutes
- Stage 1 (65-70% capacity) should run 75% of time for optimal efficiency
- Unnecessary stage 2 cycling reduces efficiency and comfort
- Design temperature = coldest expected outdoor temp for your region

### Key Principles for Optimal Dual-Stage Operation

1. **Longer delays are appropriate when:**
   - Outdoor temperature is mild (well above design temp)
   - Temperature delta is small (<3°F)
   - Not in a hurry (Away preset)
   - Close to setpoint

2. **Shorter delays are appropriate when:**
   - Outdoor temperature is extreme (at/near design temp)
   - Large temperature delta (>3°F)
   - Urgency required (Boost preset, just arrived home)
   - Rate of change indicates high heat loss

---

## Implementation Phases

### ✅ Phase 0: Foundation (Already Implemented)
- [x] Physics-based thermal model with learned house characteristics
- [x] Optimal delay calculation (2-12 min range)
- [x] Dynamic adjustment based on outdoor temp and conditions
- [x] Preset-specific learning (Home/Away/Sleep/Boost)
- [x] Auto-update on preset change, heating start, every 15 min

### ✅ Phase 1: Smart Triggers & Inhibits (COMPLETED)

**Goal:** Add intelligence for large setpoint changes and near-setpoint inhibit

**Tasks:**
- [x] Expand stage 2 delay range from 2-15min to 1-30min (ESPHome + HA)
- [x] Create button to disable stage 2 temporarily (with auto-re-enable timeout)
- [x] Implement near-setpoint inhibit (don't engage stage 2 if within 1.5°F of setpoint)
- [x] Implement large-delta immediate trigger (engage stage 2 quickly if >3°F change)
- [x] Add detection for recent preset/setpoint changes (within last 5 minutes)
- [x] Create helper sensors to track these conditions
- [x] Update stage 2 engagement logic in ESPHome to respect inhibit flag
- [ ] Test scenarios (PENDING USER TESTING):
  - [ ] Away → Home with 5°F setpoint increase
  - [ ] Small manual adjustment (1°F) when already at 68°F
  - [ ] Cold startup in morning
  - [ ] Stage 2 disable button functionality

**Expected Benefits:**
- ✓ No unnecessary stage 2 when close to setpoint (comfort + efficiency)
- ✓ Fast recovery when coming home from Away
- ✓ Manual override capability for testing or special situations
- ✓ Better handling of extreme weather vs mild weather

**Configuration Values:**
- Near-setpoint inhibit threshold: **1.5°F**
- Large delta trigger threshold: **3.0°F**
- Recent change window: **5 minutes**
- Immediate stage 2 delay: **1 minute**
- Stage 2 disable timeout: **120 minutes** (2 hours)
- Extended delay range: **1-30 minutes**

---

### ✅ Phase 2: Preset-Based Urgency (COMPLETED)

**Goal:** Different presets have different urgency requirements

**Git Branch:** `feature/stage2-phase2-preset-urgency`

**Tasks:**
- [x] Add urgency factors per preset (Home: 1.0, Away: 1.5x, Sleep: 1.2x, Boost: 0.5x)
- [x] Modify optimal delay calculation to incorporate urgency
- [x] Add input_number helpers for per-preset urgency tuning
- [x] Create sensor to display active preset urgency factor
- [x] Update documentation with preset behavior differences

**Expected Benefits:**
- ✓ Boost preset responds faster (0.5x multiplier = shorter delays)
- ✓ Away preset prioritizes efficiency over speed (1.5x = longer delays)
- ✓ Sleep preset balances comfort and quiet operation (1.2x = slightly longer)
- ✓ User-tunable urgency factors for customization

**Urgency Factor Details:**

| Preset | Default Multiplier | Effect on Delay | Use Case |
|--------|-------------------|-----------------|----------|
| **Home** | 1.0x | No change | Standard comfort, balanced efficiency |
| **Away** | 1.5x | +50% longer | Prioritize efficiency over speed |
| **Sleep** | 1.2x | +20% longer | Quieter, gentler heating |
| **Boost** | 0.5x | -50% shorter | Rapid response, maximum comfort |

**Examples:**
- Base optimal delay calculated: 10 minutes
  - Home: 10 × 1.0 = 10 minutes
  - Away: 10 × 1.5 = 15 minutes (more efficient)
  - Sleep: 10 × 1.2 = 12 minutes (quieter)
  - Boost: 10 × 0.5 = 5 minutes (faster heat)

- Base optimal delay: 20 minutes (mild weather)
  - Home: 20 × 1.0 = 20 minutes
  - Away: 20 × 1.5 = 30 minutes (clamped to max)
  - Sleep: 20 × 1.2 = 24 minutes
  - Boost: 20 × 0.5 = 10 minutes

---

### 📋 Phase 3: Advanced Intelligence (DATA COLLECTION)

**Status:** Diagnostic sensors added, no automation yet

**Goal:** Collect data to determine if rate-of-change (ROC) detection is worth implementing

**Current Implementation:**
- [x] Temperature rate-of-change sensors (5min and 10min windows)
- [x] Heating cycle progress sensor
- [x] "Losing ground while heating" detection sensor
- [x] Statistics tracking for temperature change patterns
- [ ] Data collection over heating season (user testing)
- [ ] Analysis of collected data to determine if ROC automation is needed
- [ ] Decision on Phase 3 full implementation

**Diagnostic Sensors Added:**

1. **`sensor.temperature_change_rate_5min`**
   - Measures: Temperature change in °F per minute (5-minute window)
   - Purpose: Detect rapid temperature changes
   - Example values:
     - `+0.15` = Heating up at 0.15°F/min (normal stage 1)
     - `-0.08` = Cooling at 0.08°F/min (potential heat loss issue)
     - `0.00` = Flat, not changing

2. **`sensor.temperature_change_rate_10min`**
   - Measures: Temperature change in °F per minute (10-minute window)
   - Purpose: Smoother trend detection, filters out noise
   - Use: More stable indicator for longer-term trends

3. **`sensor.heating_cycle_progress`**
   - Measures: Temperature gain since heating cycle started (°F)
   - Purpose: Track if heating is actually making progress
   - Example values:
     - `+1.2` = Gained 1.2°F since heating started (good)
     - `-0.3` = Lost 0.3°F despite heating (problem!)
     - `0.0` = No progress (marginal)

4. **`binary_sensor.losing_ground_while_heating`**
   - TRUE when: Heating on for 5+ minutes but temp still dropping or flat
   - Purpose: Flag scenarios where stage 2 might be needed urgently
   - Use case: Door left open, extreme cold, furnace issue

5. **`sensor.temperature_change_stats_during_heating`**
   - Measures: Statistical summary of temperature change rates
   - Purpose: Track patterns over time (min/max/average)
   - Use: Identify typical vs. anomalous behavior

**What to Monitor:**

Over the next heating season, watch for:

1. **How often does `losing_ground_while_heating` go TRUE?**
   - Frequent: ROC automation might be valuable
   - Rare: Current system is probably sufficient

2. **What temperature change rates are typical?**
   - During normal heating: Expect +0.05 to +0.25 °F/min
   - During cooling: Expect -0.01 to -0.05 °F/min
   - Extreme scenarios: < -0.08 °F/min (possible door open)

3. **When does progress stall?**
   - Check `heating_cycle_progress` sensor
   - If often flat or negative, ROC could help

4. **Correlation with comfort issues**
   - When temp drops fast, did you notice discomfort?
   - Would faster stage 2 engagement have helped?

**Next Steps (After Data Collection):**

After 1-2 months of heating season:
1. Review sensor history in Home Assistant
2. Look for patterns in the data
3. Decide if Phase 3 full automation is warranted:
   - **Option A:** Implement full ROC automation (if losing ground is common)
   - **Option B:** Add alerts only (notify on anomalies, no auto-action)
   - **Option C:** Keep diagnostic sensors, skip automation (if rare/not useful)

**Future Phase 3 Tasks (if data supports it):**
- [ ] Implement automatic stage 2 trigger on losing ground detection
- [ ] Add time-of-day awareness (morning warm-up vs evening)
- [ ] Create notification system for unusual HVAC behavior
- [ ] Detect equipment degradation (stage 1 rate dropping over time)

---

## Technical Architecture

### Current System Overview

**Stage 2 Delay Control:**
- ESPHome: `number.smart_thermostat_stage_2_delay` (1-15 min) → Will expand to 1-30 min
- Home Assistant: `sensor.optimal_stage_2_delay` (2-12 min calculated) → Will expand range
- Auto-apply automation: Confidence > 35%, outdoor < 15°C, difference > 1 min

**Learned Parameters (Per Preset):**
- `input_number.thermostat_stage1_heating_rate_{preset}` (°C/hr)
- `input_number.thermostat_stage2_additional_rate_{preset}` (°C/hr)
- `input_number.thermostat_heat_loss_coefficient_{preset}` (°C/hr/°C)
- `input_number.thermostat_model_confidence_{preset}` (20-95%)

**Key Entities:**
- `binary_sensor.smart_thermostat_heating_active`
- `binary_sensor.smart_thermostat_stage_2_active`
- `sensor.smart_thermostat_effective_temperature` (°F)
- `climate.smart_thermostat` (setpoint in temperature attribute)

### Phase 1 Architecture Additions

**New Helper Entities:**
- `input_number.stage2_disable_timeout` - How long to disable (minutes)
- `input_boolean.stage2_temporarily_disabled` - Disable flag (with auto-off timer)
- `button.disable_stage2_temporarily` - User-facing button
- `binary_sensor.stage2_near_setpoint_inhibit` - Within 1.5°F of setpoint
- `binary_sensor.stage2_large_delta_trigger` - >3°F change detected
- `sensor.time_since_setpoint_change` - Minutes since last setpoint change
- `sensor.time_since_preset_change` - Minutes since last preset change

**Modified Logic:**
- ESPHome climate.yaml: Stage 2 wait_until condition checks HA inhibit flag
- New automation: Detect large delta + recent change → set delay to 1 min
- New automation: Near setpoint → set inhibit flag
- New automation: Disable button → set flag → wait → clear flag

---

## Testing Scenarios

### Phase 1 Test Cases

1. **Near-Setpoint Inhibit Test**
   - Set to 70°F, wait until 68.7°F, verify stage 2 does NOT engage
   - Expected: Stage 1 only runs, reaches setpoint smoothly

2. **Large Delta Away→Home Test**
   - Set Away (62°F), switch to Home (70°F)
   - Expected: Stage 2 engages after ~1 minute

3. **Small Manual Adjustment Test**
   - Currently at 68°F, change setpoint to 69°F
   - Expected: Stage 1 only (or long delay), smooth approach

4. **Extreme Cold Test**
   - Outdoor temp at/below design temp, large delta
   - Expected: Stage 2 engages quickly (1-2 min)

5. **Mild Weather Test**
   - Outdoor temp 40°F, small delta
   - Expected: Long delay (15-30 min) or no stage 2

6. **Disable Button Test**
   - Press disable stage 2 button
   - Start heating cycle
   - Expected: Stage 1 only, auto-re-enable after timeout

---

## Notes & Decisions

### Design Temperature Reference
- **Design temperature** = Coldest expected outdoor temp for region
- Typical values: -10°F to 10°F depending on climate zone
- When outdoor temp is AT design temp: maximum heating needed (short delays)
- When outdoor temp is ABOVE design temp: stage 1 often sufficient (long delays)

### Delay Range Expansion (1-30 minutes)
- **Rationale:**
  - Allows stage 1-only operation in mild weather (15-30 min delays)
  - Accommodates naturally longer heating cycles
  - Manual override for extreme efficiency mode
  - Research shows stage 1 should run 75% of time
- **Range Limits:**
  - Minimum: 1 minute (near-immediate for urgent situations)
  - Maximum: 30 minutes (mild weather, efficiency priority)
  - Optimal calculation range: 2-20 minutes (expanded from 2-12)

### Stage 2 Disable Button Design
- **Timeout Duration:** 120 minutes (2 hours)
  - Long enough for testing or special situations
  - Short enough to not forget it's disabled
- **Auto-Re-enable:** Prevents accidentally leaving stage 2 disabled indefinitely
- **Use Cases:**
  - Testing thermal model with stage 1 only
  - Quieter operation during meetings/calls
  - Verifying stage 1 capacity in mild weather

---

## Resources & References

- [HVAC.com: Two-Stage Furnace Guide](https://www.hvac.com/expert-advice/what-is-a-two-stage-furnace/)
- [Carrier: 2-Stage HVAC Systems](https://www.carrier.com/residential/en/us/homeowner-resources/hvac-basics/2-stage-hvac-system/)
- [Hearth.com: Ecobee Staging Discussion](https://www.hearth.com/talk/threads/ecobee-automatic-vs-manual-staging-on-a-two-stage-heatpump.198519/)
- [The Furnace Outlet: Smart Thermostat Control Logic](https://thefurnaceoutlet.com/blogs/hvac-tips/smart-thermostats-control-logic-when-tech-helps-balance-a-slightly-off-system)

---

## Implementation Summary

### Phase 1 Implementation Details

**Files Modified:**

1. **thermostat-config/packages/numbers.yaml**
   - Expanded `stage2_delay_minutes` max value from 15 to 30 minutes

2. **packages/climate-supporting-entities/thermal-model.yaml**
   - Updated `sensor.optimal_stage_2_delay` calculation ranges:
     - Long delay: 15min → 30min (when stage 1 sufficient)
     - Minimum delay: 2min → 1min (urgent situations)
     - Calculated max: 12min → 20min (mild weather scenarios)

3. **packages/climate-supporting-entities/climate-helpers.yaml**
   - Added `input_number.stage2_disable_timeout` (15-240 min, default 120)
   - Added `input_boolean.stage2_temporarily_disabled`
   - Added `button.disable_stage2_temporarily`

4. **packages/climate-supporting-entities/climate-sensors.yaml**
   - Added `sensor.time_since_setpoint_change` - tracks minutes since setpoint changed
   - Added `sensor.time_since_preset_change` - tracks minutes since preset changed
   - Added `sensor.current_temperature_delta` - current °F from setpoint
   - Added `binary_sensor.stage2_near_setpoint_inhibit` - within 1.5°F threshold
   - Added `binary_sensor.stage2_large_delta_trigger` - >3°F + recent change
   - Added `binary_sensor.stage2_should_engage` - master control combining all logic

5. **packages/climate-automations/thermal-model-learning.yaml**
   - Added `stage2_disable_button_handler` automation
     - Handles button press, sets disabled flag
     - Starts timeout timer
     - Auto re-enables after timeout
     - Sends notifications at disable and re-enable
   - Added `stage2_large_delta_delay_override` automation
     - Triggers when large delta detected
     - Sets stage 2 delay to 1 minute for rapid response
     - Sends notification with delta value

6. **thermostat-config/packages/sensors.yaml**
   - Imported `binary_sensor.stage2_should_engage` from HA into ESPHome
   - Allows ESPHome to check HA's stage 2 control logic

7. **thermostat-config/packages/climate.yaml**
   - Updated stage 2 engagement condition to check `stage2_should_engage`
   - Now respects near-setpoint inhibit, disable flag, and large delta trigger
   - Logs warning if stage 2 inhibited after delay

**New Entities Created:**
- `input_number.stage2_disable_timeout`
- `input_boolean.stage2_temporarily_disabled`
- `button.disable_stage2_temporarily`
- `sensor.time_since_setpoint_change`
- `sensor.time_since_preset_change`
- `sensor.current_temperature_delta`
- `binary_sensor.stage2_near_setpoint_inhibit`
- `binary_sensor.stage2_large_delta_trigger`
- `binary_sensor.stage2_should_engage`

**Behavior Changes:**
- Stage 2 will NOT engage if within 1.5°F of setpoint (unless large delta override)
- Stage 2 will engage after 1 minute if >3°F change detected in last 5 minutes
- User can temporarily disable stage 2 for 15-240 minutes (default 120)
- Stage 2 delay can now be set up to 30 minutes for mild weather efficiency
- All stage 2 control decisions now logged to Home Assistant logbook

---

### Phase 2 Implementation Details

**Files Modified:**

1. **packages/climate-supporting-entities/climate-helpers.yaml**
   - Added `input_number.stage2_urgency_home` (0.3-2.0, default 1.0)
   - Added `input_number.stage2_urgency_away` (0.3-2.0, default 1.5)
   - Added `input_number.stage2_urgency_sleep` (0.3-2.0, default 1.2)
   - Added `input_number.stage2_urgency_boost` (0.3-2.0, default 0.5)

2. **packages/climate-supporting-entities/climate-sensors.yaml**
   - Added `sensor.stage2_active_urgency_factor` - Returns active preset's urgency multiplier

3. **packages/climate-supporting-entities/thermal-model.yaml**
   - Updated `sensor.optimal_stage_2_delay` calculation
   - Multiplies base optimal delay by urgency factor
   - Clamps final result to 1-30 minute range

**New Entities Created:**
- `input_number.stage2_urgency_home`
- `input_number.stage2_urgency_away`
- `input_number.stage2_urgency_sleep`
- `input_number.stage2_urgency_boost`
- `sensor.stage2_active_urgency_factor`

**Behavior Changes:**
- Optimal delay now varies by preset mode automatically
- Boost preset gets 50% faster response (shorter delays)
- Away preset gets 50% slower response (longer delays, more efficient)
- Sleep preset gets 20% slower response (quieter operation)
- All urgency factors user-adjustable via sliders (0.3x - 2.0x range)
- Changes take effect immediately when preset changes

**How It Works:**
1. Thermal model calculates base optimal delay using physics (house characteristics, outdoor temp, delta)
2. System looks up active preset's urgency factor
3. Multiplies base delay by urgency factor
4. Clamps result to valid range (1-30 minutes)
5. Result sent to ESPHome as the recommended delay

**User Customization:**
Users can adjust urgency factors in Home Assistant UI:
- Want Away mode even more efficient? Set to 2.0x
- Want Boost mode even faster? Set to 0.3x (minimum)
- Fine-tune each preset independently

---

### Phase 3 Implementation Details (Data Collection Only)

**Files Modified:**

1. **packages/climate-supporting-entities/climate-sensors.yaml**
   - Added derivative platform sensors for temperature rate-of-change
   - Added `sensor.temperature_change_rate_5min` (5-minute window)
   - Added `sensor.temperature_change_rate_10min` (10-minute window)
   - Added `sensor.heating_cycle_progress` (temp gain during heating)
   - Added `binary_sensor.losing_ground_while_heating` (problem detection)
   - Added `sensor.temperature_change_stats_during_heating` (statistics)

**New Entities Created:**
- `sensor.temperature_change_rate_5min` - Derivative sensor, °F/min
- `sensor.temperature_change_rate_10min` - Derivative sensor, °F/min (smoother)
- `sensor.heating_cycle_progress` - Template sensor, °F gained since cycle start
- `binary_sensor.losing_ground_while_heating` - Problem detection
- `sensor.temperature_change_stats_during_heating` - Statistics platform

**Behavior Changes:**
- NO automation added - purely diagnostic
- Sensors collect data passively in background
- No alerts, no triggers, no stage 2 changes
- User can monitor sensors in Home Assistant UI
- Historical data available for analysis

**How to Use the Diagnostic Data:**

1. **Add sensors to Lovelace dashboard** for real-time monitoring:
   ```yaml
   - type: sensor
     entity: sensor.temperature_change_rate_5min
     name: "Temp Change Rate"
   - type: sensor
     entity: sensor.heating_cycle_progress
     name: "Heating Progress"
   - type: binary-sensor
     entity: binary_sensor.losing_ground_while_heating
     name: "Losing Ground Alert"
   ```

2. **Create long-term statistics graphs** in Home Assistant:
   - View temperature change rate trends
   - Compare heating vs. cooling rates
   - Identify patterns and anomalies

3. **Check history when issues occur**:
   - If house feels cold, check if "losing ground" was TRUE
   - Compare rate-of-change during good vs. bad cycles
   - Correlate with outdoor temperature extremes

4. **After 1-2 months, review data**:
   - Export sensor history to spreadsheet
   - Calculate how often losing ground occurs
   - Decide if Phase 3 automation is worth implementing

---

## Critical Bug Fixes

### Thermal Model Learning Bug (2026-01-15)

**Problem Discovered:**
The thermal model learning automation had a critical flaw - it NEVER learned stage 2's additional heating rate!

**Original Logic (BROKEN):**
- IF stage 2 was NOT used: Learn stage 1 rate ✓
- IF stage 2 WAS used: Learn NOTHING! ✗

**Impact:**
- Homes where stage 2 frequently engaged never learned accurate stage 1 rates
- Stage 2 additional rate stayed at default (1.8°C/hr) forever
- Combined heating rate (stage 1 + stage 2) was incorrectly attributed to stage 1 alone
- Safety reset triggered false positives for small/efficient houses

**User's Specific Case (825 sqft house):**
- Stage 2 kicked in on almost every cycle (5min delay)
- Combined rate: ~5°C/hr (reasonable for tiny thermal mass!)
- System thought this was stage 1 rate (wrong!)
- Safety bounds (4.5°C/hr max) triggered reset
- Confidence dropped to 20%, never improved

**Fix Applied:**

1. **Added Stage 2 Learning Logic:**
   - When stage 2 is used: `stage2_additional = combined_rate - stage1_rate`
   - Applies same exponential weighted averaging as stage 1
   - Sanity checks: Must be positive and < 5.0°C/hr
   - Now stage 2's contribution is properly learned!

2. **Relaxed Safety Bounds (for small houses):**
   - Old: Stage 1: 0.6-4.5°C/hr
   - **New: Stage 1: 0.4-8.0°C/hr** (small houses heat fast!)
   - Old: Heat loss: 0.15-1.8
   - **New: Heat loss: 0.1-2.5** (leaky old houses have high loss)
   - **New: Stage 2 add: 0.2-6.0°C/hr** (now being checked!)

3. **Updated Stage 1 Upper Bound:**
   - Changed from 5.0 to 8.0°C/hr in learning logic
   - Allows small houses to learn their true fast heating rates

4. **Improved Safety Reset Notifications:**
   - Now shows ALL parameters that exceeded bounds
   - Helps debug which parameter triggered reset
   - Logs actual values before reset

**Why 5°C/hr is reasonable for user's house:**
- 825 sqft = 1/3 typical house size
- Small thermal mass = temperatures change quickly
- Small furnace in small space = concentrated heating
- Heat rises → 2nd floor warmer → sensors show rapid change
- 5°C/hr combined (stage 1+2) is totally plausible!

**Expected Outcome After Fix:**
- Stage 1-only cycles: Learn stage 1 rate (1.5-3.0°C/hr likely)
- Stage 2 cycles: Learn stage 2 additional (1.5-3.5°C/hr likely)
- Safety reset won't trigger unless truly unreasonable
- Confidence will grow to 95% over 50+ cycles
- System adapts to small house characteristics

---

## Change Log

### 2026-01-15 - Critical Learning Bug Fixed
- 🐛 Fixed thermal model never learning stage 2 additional rate
- 🐛 Added stage 2 learning logic when stage 2 is used
- 🔧 Relaxed safety bounds for small/efficient houses
- 🔧 Stage 1 upper bound: 4.5 → 8.0°C/hr
- 🔧 Heat loss bounds: 0.15-1.8 → 0.1-2.5
- 🔧 Added stage 2 bounds: 0.2-6.0°C/hr
- 📊 Improved safety reset notifications with parameter values

### 2026-01-15 - Phase 3 Diagnostic Sensors Added
- ✅ Added 5 diagnostic sensors for ROC monitoring
- ✅ Temperature change rate tracking (5min and 10min)
- ✅ Heating cycle progress sensor
- ✅ Losing ground detection (binary sensor)
- ✅ Statistical analysis sensor
- 📊 NO automation - data collection only
- 📋 User testing and analysis required before full implementation

### 2026-01-15 - Phase 2 Complete
- ✅ All Phase 2 tasks implemented
- ✅ Added per-preset urgency factors (Home/Away/Sleep/Boost)
- ✅ Updated optimal delay calculation with urgency multiplier
- ✅ User-adjustable urgency sliders (0.3x - 2.0x)
- ✅ Active urgency factor display sensor
- ✅ Documentation updated with behavior tables
- 📋 Testing pending user validation

### 2026-01-15 - Phase 1 Complete
- ✅ All Phase 1 tasks implemented
- ✅ Expanded delay range to 1-30 minutes
- ✅ Near-setpoint inhibit logic (1.5°F threshold)
- ✅ Large delta immediate trigger (>3°F + recent change)
- ✅ Temporary disable button with auto-timeout
- ✅ ESPHome integration with HA control logic
- 📋 Testing scenarios pending user validation

### 2026-01-15 - Project Initiation
- Project initiated
- Research completed on industry best practices
- Phase 1 scope defined
- Document created for tracking
- Implementation started
