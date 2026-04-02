# Squad Decisions

## Active Decisions

### 2026-04-02T00:00:00Z: Multi-Tank & Water Parameter Architecture

**By:** Rusty (Lead)
**Status:** Proposed — awaiting team review

#### Decisions

1. **Tank model is the new top-level organizer.** Creatures and tasks gain a `tankId` field. Tasks can also be `scope: 'global'` (tankId: null) for cross-tank work like mixing saltwater.

2. **Water logs are sparse test sessions, not per-parameter rows.** A single `WaterLog` entry represents one test session with multiple `WaterReading[]` entries. Users only fill in what they tested.

3. **Parameter ranges are hard-coded constants, not user-editable (v1).** The `WATER_PARAMETERS` array defines reef-standard ranges. Per-tank custom ranges are a future enhancement.

4. **Migration creates a "My Reef Tank" default.** All existing creatures get `tankId` set to this tank. All existing tasks become tank-scoped to it. Migration is versioned and idempotent.

5. **Threshold-triggered tasks.** Tasks can optionally have a `triggerThreshold` (parameter + operator + value). After each water log save, thresholds are evaluated and alerts surface on the dashboard.

6. **New "Parameters" tab added between Creatures and Tasks.** Four tabs total: Dashboard, Creatures, Parameters, Tasks.

7. **Tank selector is a shared pill/chip in the tab layout, not per-screen.** Switching tanks re-scopes all data views. Active tank ID persisted in AsyncStorage.

8. **Charting: victory-native + react-native-svg.** Expo-compatible, good TypeScript, supports domain overlays for range lines.

9. **Three implementation phases after foundation:** Tank UI → Water Params UI → Enhanced Livestock/Tasks. Phases 2 and 3 can run in parallel after Phase 1.

#### Impact
- New models: Tank, WaterLog, WaterParameter (constants)
- Modified models: Creature (+tankId, +careLevel, +compatibilityNotes, +minTankSizeGallons), MaintenanceTask (+tankId, +scope, +triggerThreshold)
- New services: tankService, waterLogService, migrationService
- New hooks: useTanks, useWaterLogs

### 2026-04-02T00:01:00Z: User Directive — Metric Defaults

**By:** Raphael B (via Copilot)
**Status:** Accepted

Default to metric units (liters, Celsius) throughout the app and documentation. Add a user setting to toggle between metric and imperial. European users are the primary audience.

### 2026-04-02T00:02:00Z: Metric-First Architecture + Unit Preference System

**By:** Rusty (Lead)
**Status:** Implemented

1. **Storage layer is always metric.** Temperatures stored as °C, volumes as liters. No exceptions.
2. **Conversion at display/input boundaries only.** The `UnitPreference` model provides conversion utilities used by UI components.
3. **Default is metric** (`UnitSystem = 'metric'`). Imperial users toggle in Settings.
4. **Master toggle + individual overrides.** `setSystem('imperial')` flips both temp and volume, but users can independently set `temperature` or `volume` units.
5. **No data migration needed for unit switch.** Since stored values are always metric, toggling the preference is a display-only change.

**Files created:** `models/UnitPreference.ts`, `services/unitPreferenceService.ts`, `hooks/useUnitPreferences.ts`
**Files modified:** Tank.ts (volumeLiters), Creature.ts (minTankSizeLiters), WaterParameter.ts (°C ranges), migrationService.ts, useTanks.ts, DefaultCreatures.ts, FEATURE_SPEC.md

### 2026-04-02T00:01:00Z: Phase 1 Foundation — Backend Implementation Decisions

**By:** Livingston (Backend Dev)
**Status:** Implemented

1. Hooks accept optional tankId — backward compatible for screens not yet updated.
2. DefaultCreatures/DefaultTasks use tankId: null — actual tankId stamped by hook initialization at runtime.
3. Migration is idempotent — checks existing tankId and default tank before migrating. Safe to re-run.
4. evaluateThresholds returns TriggeredAlert[] for dashboard alerts after waterlog saves.

### 2026-04-02T00:01:00Z: Phase 1 Test Approach Decisions

**By:** Basher (Tester)
**Status:** Implemented

1. migrationService tests mock dependent services at module level (not AsyncStorage directly) — migration orchestrates across services.
2. getParameterStatus boundary tests assert exact critical boundary values return 'warning' (strict inequality < / >).
3. getTasksByTank tests verify global tasks (scope: 'global') always included regardless of tankId filter.

### 2026-04-02T00:00:00Z: Metric-First Test Coverage Complete

**By:** Basher (Tester)
**Status:** Implemented

All tests updated for metric-first defaults. 6 existing test files updated (volumeGallons→volumeLiters, °F→°C throughout), 2 new test files created (UnitPreference model + unitPreferenceService). 123 tests passing. migrationService tests needed `getTanks.mockResolvedValue([])` for production idempotency check. Pre-existing Task.test.ts timing failure in `getTaskUrgency` unrelated.

### 2026-04-02T00:03:00Z: Phase 2 Tank UI Decisions

**By:** Linus (Frontend Dev)
**Status:** Implemented

1. TankSelector uses react-native-paper Modal + Portal — no external bottom-sheet libraries. Chip triggers the modal, List.Item for each tank.
2. Tab layout wraps Tabs in a View. TankSelector sits above `<Tabs>`, auth-gated.
3. Tank type picker uses Menu (not SegmentedButtons) — 12 types overflow SegmentedButtons. Binary choices still use SegmentedButtons.
4. Volume inputs are display-unit-aware — forms convert to metric on save via `convertVolumeForStorage()`, convert for display on load.
5. Delete tank blocked when only one tank — disabled button + service layer enforcement.

### 2026-04-02T00:03:00Z: Phase 3 Water Parameter UI Decisions

**By:** Linus (Frontend Dev)
**Status:** Implemented

1. No chart library — custom bar visualization with colored View bars and reef-range overlay. Avoids victory-native/react-native-svg dependency.
2. Parameters tab placed between Creatures and Tasks (4 tabs: Dashboard, Creatures, Parameters, Tasks). Uses "flask" icon.
3. Water log entry defaults to current date/time. No date picker for v1.
4. AlertBanner uses fixed color tints (#fde8e8 critical, #fef9e7 warning, #e6f9f0 ok) — not theme colors.
5. Shared file conflict avoidance — only added water-related content to layouts and dashboard, did not touch Phase 2 sections.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
