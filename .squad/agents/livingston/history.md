# Livingston — History

## Learnings

### 2026-04-02: Feature spec available
- **READ BEFORE IMPLEMENTATION:** docs/FEATURE_SPEC.md — comprehensive feature spec covering multi-tank management, water parameter tracking, livestock/task enhancements, dashboard redesign, and data migration.
- Architecture decisions recorded in .squad/decisions.md — review the multi-tank & water parameter architecture proposal.
- New backend work: Tank, WaterLog, WaterParameter models; tankService, waterLogService, migrationService; useTanks, useWaterLogs hooks; threshold-triggered tasks.

### 2026-04-02: Team initialization
- Joined ReefKeeper as Backend Dev
- Project: React Native (Expo) reef-keeping app — livestock inventory, measurement/maintenance tasks, auth, multi-tank management
- User: Raphael B
- Stack: TypeScript, Expo
- Models: Creature.ts, Task.ts
- Services: creatureService.ts, taskService.ts, notificationService.ts
- Hooks: useCreatures.ts, useTasks.ts, useNotifications.ts
