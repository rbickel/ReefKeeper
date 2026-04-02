# Linus — History

## Learnings

### 2026-04-02: Phase 3 — Water Parameter Tracking UI
- Built 4 new screens: parameters tab, waterlog/add, waterlog/[id], waterlog/history
- Built 3 new components: ParameterStatusBadge, WaterSummaryCard, AlertBanner
- Integrated water summary + alert banner into dashboard (index.tsx)
- Added Parameters tab between Creatures and Tasks in tab layout
- Added waterlog routes to root _layout.tsx (waterlog/add as modal, waterlog/[id], waterlog/history)
- No chart library used — built custom bar visualization with Views + proportional widths
- Temperature display/input respects unit preferences via convertTemperatureForDisplay/ForStorage
- Water log entry is sparse — only filled fields get saved as readings
- AlertBanner shows critical/warning alerts, staleness (>7 days), or "all in range" / "no tests yet"
- Had to coordinate with Phase 2 agent on shared files (_layout.tsx, index.tsx, _layout tabs) — only touched water-related additions
- Used point.date as key instead of array index for bar chart rows
- FAB is flagged by lint as needing PascalCase — this is a react-native-paper component, lint false positive

### 2026-04-02: Phase 2 — Tank Management UI implemented
- **TankSelector component** (`components/TankSelector.tsx`): Chip + Portal/Modal listing all tanks with active tank checkmark. Uses react-native-paper Chip, Modal, Portal, List. "Add New Tank" button at bottom.
- **Tank CRUD screens**: `app/tank/add.tsx`, `app/tank/[id].tsx`, `app/tank/edit/[id].tsx` — all follow existing code patterns (ScrollView, cards, outlined inputs, same StyleSheet approach).
- **Tab layout** (`app/(tabs)/_layout.tsx`): Wrapped `<Tabs>` in a `<View>`, added TankSelector above tabs. Only visible when user is authenticated.
- **Root layout** (`app/_layout.tsx`): Added Stack.Screen entries for tank/add (modal), tank/[id], tank/edit/[id].
- **Dashboard scoped** (`app/(tabs)/index.tsx`): Passes `activeTank?.id` to `useCreatures()` and `useTasks()`. Welcome shows active tank name. Added "+ New Tank" quick action button.
- **Creatures tab scoped** (`app/(tabs)/creatures.tsx`): Passes `activeTank?.id` to `useCreatures()`.
- **Tasks tab scoped** (`app/(tabs)/tasks.tsx`): Passes `activeTank?.id` to `useTasks()`.
- **Settings** (`app/settings.tsx`): Added "Units" card with SegmentedButtons (metric/imperial) using `useUnitPreferences`. Added "Tank Management" card listing all tanks with View buttons and "+ Add New Tank".
- **Unit-aware volume inputs**: Tank add/edit forms show L or gal based on preferences, convert using `convertVolumeForStorage()` on save and `convertVolumeForDisplay()` on load.
- **Pattern notes**: Menu component works well for long option lists (12 tank types). SegmentedButtons for binary choices (salinity unit, unit system). Portal/Modal for tank selector picker.
- **Key files created**: components/TankSelector.tsx, app/tank/add.tsx, app/tank/[id].tsx, app/tank/edit/[id].tsx
- **Key files modified**: app/(tabs)/_layout.tsx, app/_layout.tsx, app/(tabs)/index.tsx, app/(tabs)/creatures.tsx, app/(tabs)/tasks.tsx, app/settings.tsx

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
