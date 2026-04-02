# Linus — History

## Learnings

### 2026-04-02: Feature spec available
- **READ BEFORE IMPLEMENTATION:** docs/FEATURE_SPEC.md — comprehensive feature spec covering multi-tank management, water parameter tracking, livestock/task enhancements, dashboard redesign, and data migration.
- Architecture decisions recorded in .squad/decisions.md — review the multi-tank & water parameter architecture proposal.
- New UI work: Tank selector pill/chip in tab layout, Parameters tab, dashboard redesign, water log charting (victory-native + react-native-svg).

### 2026-04-02: Team initialization
- Joined ReefKeeper as Frontend Dev
- Project: React Native (Expo) reef-keeping app — livestock inventory, measurement/maintenance tasks, auth, multi-tank management
- User: Raphael B
- Stack: TypeScript, Expo Router
- Platforms: Android, Web
- Existing screens: (tabs) index, creatures, tasks; creature/[id], creature/add, creature/edit/[id]; task/[id], task/add; settings
- Existing components: CreatureCard, TaskCard, Header, EmptyState, AuthGuard
- Constants: Colors, CreatureTypes, DefaultCreatures, DefaultTasks
