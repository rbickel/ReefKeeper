# Basher — History

## Learnings

### 2026-04-02: Phase 2+3 UI complete — tests needed (cross-agent update from Scribe)
- **Phase 2 (Tank Management UI) is implemented.** New screens: `app/tank/add.tsx`, `app/tank/[id].tsx`, `app/tank/edit/[id].tsx`. New component: `components/TankSelector.tsx`. Modified: tab layout, dashboard, creatures, tasks, settings — all scoped to active tank.
- **Phase 3 (Water Parameters UI) is implemented.** New screens: `app/(tabs)/parameters.tsx`, `app/waterlog/add.tsx`, `app/waterlog/[id].tsx`, `app/waterlog/history.tsx`. New components: `components/WaterSummaryCard.tsx`, `components/ParameterStatusBadge.tsx`, `components/AlertBanner.tsx`. Dashboard now shows water summary + alerts.
- **Key UI decisions to test against:** TankSelector uses Modal/Portal (react-native-paper). Volume inputs are unit-aware (convert on save/load). Delete tank blocked when only one. Custom bar visualization (no chart lib). AlertBanner uses fixed color tints. Parameters tab between Creatures and Tasks.
- **248 tests currently passing.** New UI screens have no test coverage yet.

### 2026-04-02: Metric-first unit conversion — test suite update
- **Updated 6 existing test files** for metric-first defaults:
  - `__tests__/models/Tank.test.ts` — `volumeGallons`→`volumeLiters`, `totalSystemGallons`→`totalSystemLiters`, values converted (75gal→284L, 40→151, 20→76, 10→38, 50→189, 100→378, 55→208)
  - `__tests__/models/Creature.test.ts` — `minTankSizeGallons`→`minTankSizeLiters` (75→284)
  - `__tests__/models/WaterParameter.test.ts` — Temperature ranges from °F to °C (reefLow 76→24.4, reefHigh 80→26.7, criticalLow 74→23.3, criticalHigh 82→27.8), all getParameterStatus temp test values updated
  - `__tests__/services/tankService.test.ts` — All Tank objects and addTank calls: `volumeGallons`→`volumeLiters`
  - `__tests__/services/migrationService.test.ts` — `volumeGallons: 75`→`volumeLiters: 284`, added `getTanks.mockResolvedValue([])` (production migration now calls getTanks for idempotency check)
  - `__tests__/services/waterLogService.test.ts` — Temperature reading values from °F to °C (78.2→25.7, 78.0→25.6, 77.5→25.3, 77.0→25.0, 80.0→26.7)
- **Created 2 new test files:**
  - `__tests__/models/UnitPreference.test.ts` — DEFAULT_UNIT_PREFERENCES (metric), celsiusToFahrenheit, fahrenheitToCelsius, litersToGallons, gallonsToLiters, convertTemperatureForDisplay/Storage, convertVolumeForDisplay/Storage, formatTemperature, formatVolume; edge cases (0, negatives, large volumes)
  - `__tests__/services/unitPreferenceService.test.ts` — getUnitPreferences (defaults + stored), saveUnitPreferences (persist to AsyncStorage)
- **Pattern notes:** Used `toBeCloseTo(expected, precision)` for all floating-point conversion assertions. Used `toBe()` for exact matches.
- **Migration test fix:** Production migrationService now calls `tankService.getTanks()` at start for idempotency — tests needed mock for getTanks returning `[]`.
- **Pre-existing failure:** Task.test.ts `getTaskUrgency` timing test fails (timezone issue) — not related to metric changes.

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
