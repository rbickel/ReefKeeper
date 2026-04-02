# Basher — History

## Learnings

### 2026-04-02: Feature spec available
- **READ BEFORE IMPLEMENTATION:** docs/FEATURE_SPEC.md — comprehensive feature spec covering multi-tank management, water parameter tracking, livestock/task enhancements, dashboard redesign, and data migration.
- Architecture decisions recorded in .squad/decisions.md — review the multi-tank & water parameter architecture proposal.
- New test surface: Tank, WaterLog, WaterParameter models; tankService, waterLogService, migrationService; migration idempotency; threshold-triggered task evaluation; tank selector state persistence.

### 2026-04-02: Team initialization
- Joined ReefKeeper as Tester
- Project: React Native (Expo) reef-keeping app — livestock inventory, measurement/maintenance tasks, auth, multi-tank management
- User: Raphael B
- Test stack: Jest (unit), Playwright (e2e), Maestro (mobile flows)
- Existing tests: __tests__/models/ (Creature, Task), __tests__/services/ (creature, task, notification), __tests__/hooks/ (useCreatures, useNotifications, useTasks)
- E2e tests: e2e/ (auth, creatures, tasks-crud, tasks)
- Maestro flows: maestro/ (app_launches, smoke_test)
