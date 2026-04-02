# Rusty — History

## Learnings

### 2026-04-02: Team initialization
- Joined ReefKeeper as Lead
- Project: React Native (Expo) reef-keeping app — livestock inventory, measurement/maintenance tasks, auth, multi-tank management
- User: Raphael B
- Stack: TypeScript, Expo Router, Jest, Playwright
- Platforms: Android, Web
- Existing codebase has models (Creature, Task), services, hooks, and tab-based navigation

### 2026-04-02: Feature spec — Multi-Tank & Water Parameters
- Wrote comprehensive spec at `docs/FEATURE_SPEC.md` covering multi-tank, water params, livestock enhancements, task enhancements, dashboard redesign, migration, screen flows
- Key architecture: Tank is new top-level organizer; creatures/tasks gain `tankId`; water logs are sparse test sessions
- New models: Tank (12 tank types), WaterLog (sparse readings), WaterParameter (11 standard reef params with ranges)
- Modified models: Creature (+tankId, +careLevel, +compatibilityNotes, +minTankSizeGallons), MaintenanceTask (+tankId, +scope, +triggerThreshold)
- Migration strategy: versioned, idempotent, creates "My Reef Tank" default, assigns all existing data to it
- Charting recommendation: victory-native + react-native-svg (Expo-compatible)
- 4 implementation phases: Foundation → Tank UI → Water Params → Enhanced Livestock/Tasks
- Phases 2 and 3 can parallelize after Phase 1 (Livingston does foundation, Linus does UI phases)
- Key files: `models/Tank.ts`, `models/WaterLog.ts`, `models/WaterParameter.ts`, `services/tankService.ts`, `services/waterLogService.ts`, `services/migrationService.ts`
- Decision logged to decisions inbox

### 2026-04-02: Metric-First + Unit Preference Architecture
- Architectural decision: ALL data stored in metric (°C, liters). Conversion only at display/input layer.
- Created `models/UnitPreference.ts` — types (UnitSystem, TemperatureUnit, VolumeUnit), conversion utils (celsius↔fahrenheit, liters↔gallons), format helpers, display/storage converters
- Created `services/unitPreferenceService.ts` — AsyncStorage key `@reef_keeper_unit_preferences`
- Created `hooks/useUnitPreferences.ts` — exposes preferences + setSystem/setTemperatureUnit/setVolumeUnit
- Renamed Tank fields: `volumeGallons` → `volumeLiters`, `totalSystemGallons` → `totalSystemLiters`
- Renamed Creature field: `minTankSizeGallons` → `minTankSizeLiters`
- WaterParameter temperature now stored as °C: reef 24.4–26.7, critical 23.3–27.8
- Default tank volume: 284 L (was 75 gal)
- DefaultCreatures tank sizes converted: 10gal→38L, 20gal→76L, 30gal→114L, 40gal→151L, 55gal→208L, 75gal→284L
- Feature spec updated: new §9 Unit Preferences, all values metric, AsyncStorage key registered
- Tests NOT modified — Basher owns test updates
