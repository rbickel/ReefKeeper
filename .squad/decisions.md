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

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
