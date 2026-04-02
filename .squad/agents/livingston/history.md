# Livingston — History

## Learnings

### 2026-04-02: Feature spec available
- **READ BEFORE IMPLEMENTATION:** docs/FEATURE_SPEC.md — comprehensive feature spec covering multi-tank management, water parameter tracking, livestock/task enhancements, dashboard redesign, and data migration.
- Architecture decisions recorded in .squad/decisions.md — review the multi-tank & water parameter architecture proposal.
- New backend work: Tank, WaterLog, WaterParameter models; tankService, waterLogService, migrationService; useTanks, useWaterLogs hooks; threshold-triggered tasks.

### 2026-04-02: Metric-first conversion (cross-agent update from Scribe)
- **Codebase is now metric-first.** All stored values use °C and liters. Field renames: `volumeGallons` → `volumeLiters`, `totalSystemGallons` → `totalSystemLiters`, `minTankSizeGallons` → `minTankSizeLiters`.
- **New unit preference system:** `models/UnitPreference.ts` (types + conversion utils), `services/unitPreferenceService.ts` (AsyncStorage persistence), `hooks/useUnitPreferences.ts` (React hook).
- **Key decision:** Data always stored in metric. Conversion happens at display/input boundaries only. Default is metric; imperial is opt-in via Settings.
- **Impact on your code:** Tank.ts, Creature.ts, WaterParameter.ts models changed. migrationService default tank is now 284 L. useTanks fresh-install volume is 284 L. DefaultCreatures tank sizes are in liters.

### 2026-04-02: Phase 1 Foundation Implementation
- **New models created:**
  - `models/Tank.ts` — Tank interface, TankType (12 types), SalinityUnit, TANK_TYPE_LABELS, createTank factory
  - `models/WaterParameter.ts` — WaterParameterId, ParameterRange, WaterParameterDefinition, WATER_PARAMETERS (11 params with real reef ranges), getParameterStatus(), ParameterStatus type
  - `models/WaterLog.ts` — WaterReading, WaterLog, createWaterLog factory. Sparse readings design — one log = one test session with only tested params.
- **Modified models:**
  - `models/Creature.ts` — Added CareLevel type, CARE_LEVEL_LABELS, tankId (string), careLevel, compatibilityNotes, minTankSizeGallons fields. Defaults: tankId='', careLevel='intermediate'.
  - `models/Task.ts` — Added TaskScope type, ParameterThreshold interface (imports WaterParameterId). Added tankId (string|null), scope, triggerThreshold fields. Defaults: tankId=null, scope='tank'.
- **New services:**
  - `services/tankService.ts` — Full CRUD, setDefaultTank, getActiveTankId/setActiveTankId, isInitialized/markInitialized. Storage keys: @reef_keeper_tanks, @reef_keeper_tanks_initialized, @reef_keeper_active_tank. First tank auto-becomes default. Deletion blocked if sole tank.
  - `services/waterLogService.ts` — Full CRUD, getWaterLogsByTank, getLatestReadings (returns Map of most recent reading per parameter), getParameterHistory (time series for charting, default 30 days). Key: @reef_keeper_water_logs.
  - `services/migrationService.ts` — Versioned migration (CURRENT_MIGRATION=1). Creates "My Reef Tank" default, assigns tankId+careLevel+compatibilityNotes to all creatures, assigns tankId+scope to all tasks. Idempotent: checks existing tankId/default tank before migrating.
- **Modified services:**
  - `services/creatureService.ts` — Added getCreaturesByTank(tankId).
  - `services/taskService.ts` — Added getTasksByTank(tankId) (returns matching tank + global tasks), evaluateThresholds(tankId, readings) returning TriggeredAlert[]. Imported WaterReading.
- **New hooks:**
  - `hooks/useTanks.ts` — Manages tank state, active tank, initialization (runs migrations, creates default if needed). Returns tanks, activeTank, loading, refresh, add, update, remove, setActive.
  - `hooks/useWaterLogs.ts` — Manages water log state scoped to tankId. Returns logs, latestReadings, loading, refresh, add, update, remove, getHistory.
- **Modified hooks:**
  - `hooks/useCreatures.ts` — Now accepts optional tankId param. When provided, filters via getCreaturesByTank, otherwise returns all.
  - `hooks/useTasks.ts` — Now accepts optional tankId param. When provided, filters via getTasksByTank, otherwise returns all.
- **Updated constants:**
  - `constants/DefaultCreatures.ts` — Added careLevel, compatibilityNotes, minTankSizeGallons to all 21 creatures with realistic reef values. Omit type now excludes tankId (assigned at init time).
  - `constants/DefaultTasks.ts` — Added scope:'tank' to all 12 existing tasks. Added 3 global tasks (Mix Saltwater Batch, Check RODI Filter TDS, Inspect Equipment). Added 3 triggered tasks (Emergency Water Change @ ammonia>0.25, Reduce Nitrates @ nitrate>20, Dose Alkalinity @ alk<7).
- **Key patterns:**
  - tankId on DefaultCreatures/DefaultTasks is null — the hook initialization stamps the actual active tankId at runtime.
  - useCreatures/useTasks accept optional tankId for backward compat — screens not yet updated can call with no args.
  - Migration checks tankId presence before updating to avoid double-migration.

### 2026-04-02: Team initialization
- Joined ReefKeeper as Backend Dev
- Project: React Native (Expo) reef-keeping app — livestock inventory, measurement/maintenance tasks, auth, multi-tank management
- User: Raphael B
- Stack: TypeScript, Expo
- Models: Creature.ts, Task.ts
- Services: creatureService.ts, taskService.ts, notificationService.ts
- Hooks: useCreatures.ts, useTasks.ts, useNotifications.ts
