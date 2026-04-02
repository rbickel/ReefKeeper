# Basher — History

## Learnings

### 2026-04-02: Phase 1 test suite written
- **New test files created (6):**
  - `__tests__/models/Tank.test.ts` — createTank, TANK_TYPE_LABELS (all 12 types), defaults, salinity units, timestamps
  - `__tests__/models/WaterParameter.test.ts` — WATER_PARAMETERS (all 11), getParameterStatus (ok/warning/critical), boundary values, null criticalLow handling
  - `__tests__/models/WaterLog.test.ts` — createWaterLog, sparse readings, full panel, defaults, timestamps
  - `__tests__/services/tankService.test.ts` — full CRUD, isDefault logic for first tank, setDefaultTank toggling, getActiveTankId/setActiveTankId, isInitialized/markInitialized
  - `__tests__/services/waterLogService.test.ts` — full CRUD, getWaterLogsByTank filtering, getLatestReadings (most-recent-per-param), getParameterHistory (time series with day limit)
  - `__tests__/services/migrationService.test.ts` — default tank creation, creature tankId assignment, task tankId+scope assignment, idempotency, version tracking. Uses jest.mock for tankService/creatureService/taskService.
- **Existing test files updated (4):**
  - `__tests__/models/Creature.test.ts` — added tests for tankId, careLevel (default 'intermediate'), compatibilityNotes, minTankSizeGallons, CARE_LEVEL_LABELS
  - `__tests__/models/Task.test.ts` — added tests for tankId (default null), scope (default 'tank'), triggerThreshold (above/below operators), ParameterThreshold interface
  - `__tests__/services/creatureService.test.ts` — added getCreaturesByTank filter tests
  - `__tests__/services/taskService.test.ts` — added getTasksByTank (tank + global filtering), evaluateThresholds (alert generation, within-threshold, no-threshold, missing readings)
- **Pattern notes:** migrationService tests mock dependent services (tankService, creatureService, taskService) at module level rather than using AsyncStorage directly, since migration orchestrates across services. All other service tests mock AsyncStorage + uuid directly, matching existing patterns.
- **Boundary testing:** WaterParameter tests check exact reef range boundaries (should be 'ok'), exact critical boundaries (should be 'warning' per < / > operators — not <=/>= ), and null criticalLow params (ammonia, nitrite, nitrate, phosphate).

### 2026-04-02: Metric-first conversion (cross-agent update from Scribe)
- **Codebase is now metric-first.** All stored values use °C and liters. Field renames: `volumeGallons` → `volumeLiters`, `totalSystemGallons` → `totalSystemLiters`, `minTankSizeGallons` → `minTankSizeLiters`.
- **New unit preference system:** `models/UnitPreference.ts`, `services/unitPreferenceService.ts`, `hooks/useUnitPreferences.ts` — all need tests.
- **Key decision:** Data always stored in metric. Conversion at display layer only. Default metric; imperial opt-in.
- **Impact on your tests:** Tank.test.ts, Creature.test.ts, WaterParameter.test.ts assertions may need updating for new field names and metric values. New test files needed for UnitPreference model, unitPreferenceService, and useUnitPreferences hook.

### 2026-04-02: Team initialization
- Joined ReefKeeper as Tester
- Project: React Native (Expo) reef-keeping app — livestock inventory, measurement/maintenance tasks, auth, multi-tank management
- User: Raphael B
- Test stack: Jest (unit), Playwright (e2e), Maestro (mobile flows)
- Existing tests: __tests__/models/ (Creature, Task), __tests__/services/ (creature, task, notification), __tests__/hooks/ (useCreatures, useNotifications, useTasks)
- E2e tests: e2e/ (auth, creatures, tasks-crud, tasks)
- Maestro flows: maestro/ (app_launches, smoke_test)
