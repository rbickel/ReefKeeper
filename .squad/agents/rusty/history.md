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
