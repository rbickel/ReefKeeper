# ReefKeeper — Multi-Tank & Water Parameter Feature Specification

**Author:** Rusty (Lead)  
**Date:** 2026-04-02  
**Status:** Draft — awaiting team review  
**For:** Linus (Frontend), Livingston (Backend)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Multi-Tank Management](#2-multi-tank-management)
3. [Water Parameter Tracking](#3-water-parameter-tracking)
4. [Livestock Inventory Enhancements](#4-livestock-inventory-enhancements)
5. [Maintenance Task Enhancements](#5-maintenance-task-enhancements)
6. [Dashboard Redesign](#6-dashboard-redesign)
7. [Data Migration](#7-data-migration)
8. [Screen Flows & Navigation](#8-screen-flows--navigation)
9. [Implementation Phases](#9-implementation-phases)

---

## 1. Overview

ReefKeeper currently operates as a single-tank app: all creatures and tasks live in a flat global list. Real reefers run multiple systems (display tank, frag tank, quarantine, etc.) and track water parameters obsessively. This spec adds:

- **Multi-tank management** — Tank model, CRUD, scoping of creatures/tasks to tanks
- **Water parameter tracking** — WaterLog model, entry UI, history charts, acceptable-range alerts
- **Livestock enhancements** — tank association, care levels, compatibility notes
- **Task enhancements** — tank-scoped tasks, measurement-triggered tasks, global vs per-tank
- **Dashboard redesign** — tank selector, per-tank stats, water parameter summary, alerts

### Design Principles

- **Offline-first** — all data stays in AsyncStorage (cloud sync is a separate future effort)
- **Non-breaking migration** — existing users see zero data loss; everything moves into a "My Reef Tank" default
- **Progressive disclosure** — single-tank users don't feel complexity; multi-tank is opt-in
- **Reef-keeping domain accuracy** — real parameter ranges, real maintenance cadences

---

## 2. Multi-Tank Management

### 2.1 Tank Model

```typescript
// models/Tank.ts

export type TankType =
  | 'mixed-reef'      // Most common — SPS + LPS + softies + fish
  | 'sps-dominant'    // Acropora, Montipora — high light, high flow, tight params
  | 'lps-dominant'    // Euphyllia, Acans — moderate light/flow
  | 'soft-coral'      // Leathers, mushrooms, zoanthids — forgiving
  | 'fowlr'           // Fish-Only With Live Rock — no coral
  | 'nano'            // Under 30 gallons — any coral mix
  | 'quarantine'      // Temporary holding — bare-bottom, medication-safe
  | 'frag'            // Propagation tank — grow-out racks
  | 'predator'        // Large aggressive fish — groupers, triggers, eels
  | 'seahorse'        // Dedicated seahorse setup — low flow, hitching posts
  | 'lagoon'          // Shallow, high-light, sand-heavy — clams, Montis
  | 'other';

export type SalinityUnit = 'ppt' | 'sg'; // parts per thousand or specific gravity

export interface Tank {
  id: string;
  name: string;
  type: TankType;
  volumeGallons: number;         // display tank volume
  totalSystemGallons?: number;   // including sump, refugium, etc.
  salinityUnit: SalinityUnit;    // user preference per tank
  photoUri?: string;
  notes: string;
  isDefault: boolean;            // exactly one tank has this set to true
  createdAt: string;
  updatedAt: string;
}

export const TANK_TYPE_LABELS: Record<TankType, string> = {
  'mixed-reef':    '🪸 Mixed Reef',
  'sps-dominant':  '🌿 SPS Dominant',
  'lps-dominant':  '🫧 LPS Dominant',
  'soft-coral':    '🍄 Soft Coral',
  'fowlr':         '🐟 FOWLR',
  'nano':          '🔬 Nano Reef',
  'quarantine':    '🏥 Quarantine',
  'frag':          '✂️ Frag Tank',
  'predator':      '🦈 Predator',
  'seahorse':      '🐴 Seahorse',
  'lagoon':        '🏖️ Lagoon',
  'other':         '🌊 Other',
};

export function createTank(
  partial: Partial<Tank> & Pick<Tank, 'name' | 'type' | 'volumeGallons'>
): Tank {
  const now = new Date().toISOString();
  return {
    id: '',
    totalSystemGallons: undefined,
    salinityUnit: 'ppt',
    photoUri: undefined,
    notes: '',
    isDefault: false,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}
```

### 2.2 Tank Storage Key Convention

```
@reef_keeper_tanks           — Tank[]
@reef_keeper_tanks_initialized — "true"|null
@reef_keeper_active_tank     — tank id string (last selected)
```

### 2.3 Tank CRUD — `services/tankService.ts`

| Function | Signature | Notes |
|----------|-----------|-------|
| `getTanks` | `() => Promise<Tank[]>` | |
| `saveTanks` | `(tanks: Tank[]) => Promise<void>` | |
| `addTank` | `(tank: Omit<Tank, 'id'\|'createdAt'\|'updatedAt'>) => Promise<Tank>` | ID via `uuid`. If first tank, set `isDefault: true` |
| `updateTank` | `(id: string, updates: Partial<Tank>) => Promise<Tank \| null>` | |
| `deleteTank` | `(id: string) => Promise<void>` | Block if it's the sole remaining tank. Reassign creatures/tasks to another tank first. |
| `setDefaultTank` | `(id: string) => Promise<void>` | Unsets previous default, sets new one |
| `getActiveTankId` | `() => Promise<string \| null>` | Reads `@reef_keeper_active_tank` |
| `setActiveTankId` | `(id: string) => Promise<void>` | Writes `@reef_keeper_active_tank` |

### 2.4 `useTanks` Hook — `hooks/useTanks.ts`

```typescript
export function useTanks() {
  // State
  tanks: Tank[];
  activeTank: Tank | null;
  loading: boolean;

  // Actions
  refresh: () => Promise<void>;
  add: (tank: ...) => Promise<Tank>;
  update: (id, updates) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setActive: (id: string) => Promise<void>;
}
```

The hook initializes defaults on first run (creates the "My Reef Tank" migration tank — see §7).

### 2.5 Tank Selector UX

A persistent pill/chip at the top of every tab showing the active tank name. Tapping it opens a bottom sheet listing all tanks with an "Add Tank" CTA at the bottom. The active tank is highlighted. Switching tanks refreshes all data views (creatures, tasks, water logs).

```
┌────────────────────────────────────┐
│  [🪸 My Reef Tank ▾]              │  ← tank selector pill
├────────────────────────────────────┤
│                                    │
│  (tab content scoped to tank)      │
│                                    │
└────────────────────────────────────┘
```

### 2.6 Tank Detail Screen

```
┌─────────────────────────────────────┐
│ ← Back          My Reef Tank    ⚙️  │
├─────────────────────────────────────┤
│ [Tank Photo or Placeholder]         │
│                                     │
│ Type: 🪸 Mixed Reef                │
│ Volume: 75 gal (system: 95 gal)    │
│ Salinity Unit: ppt                  │
│                                     │
│ ── Stats ──                         │
│ 🐠 12 fish  🪸 8 corals            │
│ 🦀 5 inverts  📋 14 tasks          │
│ Last water test: 2 days ago         │
│                                     │
│ ── Notes ──                         │
│ Mixed reef, 2 years running.        │
│ AI Hydra 32 lights, Nero 5 pumps.   │
│                                     │
│ [Edit Tank]  [Delete Tank]          │
└─────────────────────────────────────┘
```

---

## 3. Water Parameter Tracking

### 3.1 Water Parameters — Domain Reference

These are the standard reef aquarium parameters and their acceptable ranges. Ranges are for a **mixed reef** — SPS-dominant tanks need tighter calcium/alk/mag stability.

| Parameter | Unit | Reef Range (Low) | Reef Range (High) | Critical Low | Critical High | Notes |
|-----------|------|-------------------|--------------------|--------------|---------------|-------|
| Temperature | °F | 76.0 | 80.0 | 74.0 | 82.0 | 78°F ideal. Stability > exact number |
| Salinity (ppt) | ppt | 34.0 | 36.0 | 32.0 | 38.0 | 35 ppt / 1.025 SG ideal |
| Salinity (SG) | SG | 1.024 | 1.026 | 1.022 | 1.028 | Refractometer or digital |
| pH | — | 7.8 | 8.4 | 7.6 | 8.6 | Naturally rises during photoperiod |
| Ammonia (NH₃) | ppm | 0.0 | 0.0 | — | 0.25 | Must be 0 in established tank |
| Nitrite (NO₂) | ppm | 0.0 | 0.0 | — | 0.25 | Must be 0 in established tank |
| Nitrate (NO₃) | ppm | 0.0 | 10.0 | — | 20.0 | Low for SPS; 5-10 for mixed |
| Phosphate (PO₄) | ppm | 0.0 | 0.05 | — | 0.1 | Promotes algae if too high |
| Calcium (Ca) | ppm | 380 | 450 | 350 | 500 | Corals consume it; dose daily |
| Alkalinity (dKH) | dKH | 7.0 | 11.0 | 6.0 | 13.0 | Most important for SPS stability |
| Magnesium (Mg) | ppm | 1250 | 1400 | 1100 | 1500 | Enables Ca/Alk balance |

### 3.2 WaterParameter Type & Ranges Model

```typescript
// models/WaterParameter.ts

export type WaterParameterId =
  | 'temperature'
  | 'salinity_ppt'
  | 'salinity_sg'
  | 'ph'
  | 'ammonia'
  | 'nitrite'
  | 'nitrate'
  | 'phosphate'
  | 'calcium'
  | 'alkalinity'
  | 'magnesium';

export interface ParameterRange {
  reefLow: number;
  reefHigh: number;
  criticalLow: number | null;   // null = no lower critical (e.g. ammonia)
  criticalHigh: number | null;
}

export interface WaterParameterDefinition {
  id: WaterParameterId;
  label: string;
  unit: string;
  emoji: string;
  ranges: ParameterRange;
  decimalPlaces: number;        // for formatting input/display
}

export const WATER_PARAMETERS: WaterParameterDefinition[] = [
  {
    id: 'temperature',
    label: 'Temperature',
    unit: '°F',
    emoji: '🌡️',
    ranges: { reefLow: 76.0, reefHigh: 80.0, criticalLow: 74.0, criticalHigh: 82.0 },
    decimalPlaces: 1,
  },
  {
    id: 'salinity_ppt',
    label: 'Salinity (ppt)',
    unit: 'ppt',
    emoji: '🧂',
    ranges: { reefLow: 34.0, reefHigh: 36.0, criticalLow: 32.0, criticalHigh: 38.0 },
    decimalPlaces: 1,
  },
  {
    id: 'salinity_sg',
    label: 'Salinity (SG)',
    unit: 'SG',
    emoji: '🧂',
    ranges: { reefLow: 1.024, reefHigh: 1.026, criticalLow: 1.022, criticalHigh: 1.028 },
    decimalPlaces: 3,
  },
  {
    id: 'ph',
    label: 'pH',
    unit: '',
    emoji: '⚗️',
    ranges: { reefLow: 7.8, reefHigh: 8.4, criticalLow: 7.6, criticalHigh: 8.6 },
    decimalPlaces: 2,
  },
  {
    id: 'ammonia',
    label: 'Ammonia (NH₃)',
    unit: 'ppm',
    emoji: '⚠️',
    ranges: { reefLow: 0.0, reefHigh: 0.0, criticalLow: null, criticalHigh: 0.25 },
    decimalPlaces: 2,
  },
  {
    id: 'nitrite',
    label: 'Nitrite (NO₂)',
    unit: 'ppm',
    emoji: '⚠️',
    ranges: { reefLow: 0.0, reefHigh: 0.0, criticalLow: null, criticalHigh: 0.25 },
    decimalPlaces: 2,
  },
  {
    id: 'nitrate',
    label: 'Nitrate (NO₃)',
    unit: 'ppm',
    emoji: '📊',
    ranges: { reefLow: 0.0, reefHigh: 10.0, criticalLow: null, criticalHigh: 20.0 },
    decimalPlaces: 1,
  },
  {
    id: 'phosphate',
    label: 'Phosphate (PO₄)',
    unit: 'ppm',
    emoji: '🔬',
    ranges: { reefLow: 0.0, reefHigh: 0.05, criticalLow: null, criticalHigh: 0.1 },
    decimalPlaces: 3,
  },
  {
    id: 'calcium',
    label: 'Calcium (Ca)',
    unit: 'ppm',
    emoji: '🦴',
    ranges: { reefLow: 380, reefHigh: 450, criticalLow: 350, criticalHigh: 500 },
    decimalPlaces: 0,
  },
  {
    id: 'alkalinity',
    label: 'Alkalinity',
    unit: 'dKH',
    emoji: '🧪',
    ranges: { reefLow: 7.0, reefHigh: 11.0, criticalLow: 6.0, criticalHigh: 13.0 },
    decimalPlaces: 1,
  },
  {
    id: 'magnesium',
    label: 'Magnesium (Mg)',
    unit: 'ppm',
    emoji: '💎',
    ranges: { reefLow: 1250, reefHigh: 1400, criticalLow: 1100, criticalHigh: 1500 },
    decimalPlaces: 0,
  },
];
```

### 3.3 WaterLog Model

```typescript
// models/WaterLog.ts

import { WaterParameterId } from './WaterParameter';

export interface WaterReading {
  parameterId: WaterParameterId;
  value: number;
}

export interface WaterLog {
  id: string;
  tankId: string;
  testedAt: string;              // ISO date string — when the test was performed
  readings: WaterReading[];      // sparse — user only records what they tested
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export function createWaterLog(
  partial: Partial<WaterLog> & Pick<WaterLog, 'tankId' | 'readings'>
): WaterLog {
  const now = new Date().toISOString();
  return {
    id: '',
    testedAt: now,
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}
```

**Key design decision:** A `WaterLog` is a single test session (e.g., "Tuesday evening test"). It contains multiple `WaterReading` entries — one per parameter the user tested. This is sparse: if they only tested salinity and pH, the log has 2 readings, not 11 blank fields. This matches real-world behavior — reefers test different parameters on different schedules (daily temp check, weekly full panel, etc.).

### 3.4 Water Log Storage

```
@reef_keeper_water_logs — WaterLog[]
```

### 3.5 Water Log Service — `services/waterLogService.ts`

| Function | Signature | Notes |
|----------|-----------|-------|
| `getWaterLogs` | `() => Promise<WaterLog[]>` | |
| `getWaterLogsByTank` | `(tankId: string) => Promise<WaterLog[]>` | Filter from full list |
| `addWaterLog` | `(log: Omit<WaterLog, 'id'\|'createdAt'\|'updatedAt'>) => Promise<WaterLog>` | |
| `updateWaterLog` | `(id: string, updates: Partial<WaterLog>) => Promise<WaterLog \| null>` | |
| `deleteWaterLog` | `(id: string) => Promise<void>` | |
| `getLatestReadings` | `(tankId: string) => Promise<Map<WaterParameterId, { value: number; testedAt: string }>>` | Most recent reading per parameter across all logs |
| `getParameterHistory` | `(tankId: string, paramId: WaterParameterId, days?: number) => Promise<{ date: string; value: number }[]>` | Time series for charting, default 30 days |

### 3.6 `useWaterLogs` Hook — `hooks/useWaterLogs.ts`

```typescript
export function useWaterLogs(tankId: string) {
  logs: WaterLog[];
  latestReadings: Map<WaterParameterId, { value: number; testedAt: string }>;
  loading: boolean;

  refresh: () => Promise<void>;
  add: (log: ...) => Promise<WaterLog>;
  update: (id, updates) => Promise<void>;
  remove: (id: string) => Promise<void>;
  getHistory: (paramId, days?) => Promise<{ date: string; value: number }[]>;
}
```

### 3.7 Water Parameter Entry Screen

```
┌─────────────────────────────────────┐
│ ← Back      Log Water Test      💾  │
├─────────────────────────────────────┤
│ Tank: 🪸 My Reef Tank              │
│ Date/Time: [Apr 2, 2026 7:30 PM ▾] │
│                                     │
│ ── Quick Test (tap to enter) ──     │
│ 🌡️ Temperature   [ 78.2 ] °F   ✅ │
│ 🧂 Salinity      [ 35.0 ] ppt  ✅ │
│ ⚗️ pH             [ 8.21 ]      ✅ │
│ ⚠️ Ammonia       [      ] ppm     │
│ ⚠️ Nitrite       [      ] ppm     │
│ 📊 Nitrate       [ 4.0  ] ppm  ✅ │
│ 🔬 Phosphate     [ 0.03 ] ppm  ✅ │
│ 🦴 Calcium       [ 420  ] ppm  ✅ │
│ 🧪 Alkalinity    [ 8.5  ] dKH  ✅ │
│ 💎 Magnesium     [ 1350 ] ppm  ✅ │
│                                     │
│ Notes: [Weekly full panel test    ] │
│                                     │
│ [Save Water Test]                   │
└─────────────────────────────────────┘

✅ = within reef range
🟡 = outside reef range but not critical
🔴 = critical — show inline warning
```

Color-coded feedback appears instantly as the user types a value. Users only fill in what they tested — blank fields are not saved.

### 3.8 Water Parameter History Screen

```
┌─────────────────────────────────────┐
│ ← Back     Water Parameters         │
├─────────────────────────────────────┤
│ [🪸 My Reef Tank ▾]                │
│                                     │
│ ── Current Readings ──              │
│ 🌡️ 78.2°F  🧂 35.0ppt  ⚗️ 8.21   │
│ 📊 NO₃ 4.0  🔬 PO₄ 0.03           │
│ 🦴 Ca 420   🧪 Alk 8.5  💎 Mg 1350│
│ (all ✅ in range)                   │
│                                     │
│ ── Trend: [Alkalinity ▾] ──        │
│                                     │
│ dKH                                 │
│ 11 ┤╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ high    │
│ 10 ┤                                │
│  9 ┤      ●──●                      │
│  8 ┤●──●─╱    ╲──●──●──●           │
│  7 ┤╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ low     │
│    └──┴──┴──┴──┴──┴──┴──┴──→       │
│    3/5 3/8 3/12 3/15 3/19 3/23 3/27│
│                                     │
│ ── Test Log ──                      │
│ Apr 2    Full panel   9 params  ▸   │
│ Mar 30   Quick check  3 params  ▸   │
│ Mar 27   Full panel   9 params  ▸   │
│                                     │
│ [+ Log New Test]                    │
└─────────────────────────────────────┘
```

**Charting library:** Use `react-native-chart-kit` or `victory-native` (both support Expo). The chart displays the selected parameter over the last 30 days. Horizontal dashed lines show the reef range low/high. Points outside the range are colored red.

### 3.9 Parameter Alerts

When a reading is outside the acceptable range, the dashboard and water parameter screen show alerts:

```typescript
export type ParameterStatus = 'ok' | 'warning' | 'critical';

export function getParameterStatus(
  paramId: WaterParameterId,
  value: number
): ParameterStatus {
  const def = WATER_PARAMETERS.find(p => p.id === paramId);
  if (!def) return 'ok';
  const { ranges } = def;

  if (
    (ranges.criticalLow !== null && value < ranges.criticalLow) ||
    (ranges.criticalHigh !== null && value > ranges.criticalHigh)
  ) {
    return 'critical';
  }

  if (value < ranges.reefLow || value > ranges.reefHigh) {
    return 'warning';
  }

  return 'ok';
}
```

---

## 4. Livestock Inventory Enhancements

### 4.1 Modified Creature Model

```typescript
// models/Creature.ts — additions (bold = new fields)

export type CareLevel = 'beginner' | 'intermediate' | 'expert';

export interface Creature {
  // ... all existing fields unchanged ...

  tankId: string;                       // NEW — required, references Tank.id
  careLevel: CareLevel;                 // NEW — defaults to 'intermediate'
  compatibilityNotes: string;           // NEW — free-text, e.g. "May nip SPS corals"
  minTankSizeGallons?: number;          // NEW — optional, e.g. 75 for a Yellow Tang
}

export const CARE_LEVEL_LABELS: Record<CareLevel, string> = {
  beginner: '🟢 Beginner',
  intermediate: '🟡 Intermediate',
  expert: '🔴 Expert',
};
```

### 4.2 Creature Service Changes

- `getCreatures()` unchanged (returns all)
- New: `getCreaturesByTank(tankId: string)` — filter by `tankId`
- `addCreature()` — `tankId` is now a required field in the input
- **Migration fills `tankId` with the default tank's ID** (see §7)

### 4.3 `useCreatures` Hook Changes

```typescript
export function useCreatures(tankId: string) {
  // Now filters creatures by the active tank
  // All CRUD operations stamp the active tankId on new creatures
}
```

### 4.4 Default Creatures Enhancement

Update `constants/DefaultCreatures.ts` — add `careLevel`, `compatibilityNotes`, and `minTankSizeGallons` to each default creature. Examples:

| Creature | Care Level | Min Tank | Compatibility |
|----------|-----------|----------|---------------|
| Ocellaris Clownfish | beginner | 20 | Reef-safe. May host anemones. Semi-aggressive to other clowns. |
| Royal Gramma | beginner | 30 | Peaceful. Stays near caves. May squabble with similar-shaped fish. |
| Flame Angelfish | intermediate | 55 | May nip LPS/SPS coral. Monitor with expensive corals. |
| Yellow Tang | intermediate | 75 | Reef-safe. Can be aggressive to other tangs. Needs swimming room. |
| Mandarin Dragonet | expert | 30 | Needs mature tank (6+ months) with copepod population. Slow feeder. |
| Hammer Coral | intermediate | — | LPS. 6"+ sweeper tentacles — keep distance from neighbors. |
| Bubble Tip Anemone | intermediate | 40 | Stings nearby corals. May wander. Needs stable params 6+ months. |
| Fire Shrimp | beginner | 20 | Reef-safe cleaner. Shy; needs caves. Keep singly or in mated pairs. |
| Peppermint Shrimp | beginner | 10 | Eats Aiptasia anemones. Reef-safe. Peaceful. |

### 4.5 Creature Card Enhancement

The `CreatureCard` component gains:
- A colored care-level badge (🟢🟡🔴)
- Compatibility warning icon if `compatibilityNotes` is non-empty
- Subtle tank-size warning if creature's `minTankSizeGallons` exceeds the active tank's `volumeGallons`

---

## 5. Maintenance Task Enhancements

### 5.1 Modified Task Model

```typescript
// models/Task.ts — additions

export type TaskScope = 'tank' | 'global';

export interface ParameterThreshold {
  parameterId: WaterParameterId;
  operator: 'above' | 'below';
  value: number;                    // threshold value
}

export interface MaintenanceTask {
  // ... all existing fields unchanged ...

  tankId: string | null;            // NEW — null = global task
  scope: TaskScope;                 // NEW — 'tank' or 'global'
  triggerThreshold?: ParameterThreshold; // NEW — optional measurement trigger
}
```

### 5.2 Task Scope Semantics

| Scope | `tankId` | Behavior |
|-------|----------|----------|
| `'global'` | `null` | Shows on every tank's task list. Completion is global. E.g., "Check ATO reservoir," "Mix saltwater batch" |
| `'tank'` | `string` | Shows only for the specified tank. E.g., "Water change (10-20%)" — each tank has its own schedule |

### 5.3 Parameter-Triggered Tasks

Some tasks should auto-flag when a water reading is out of range:

```typescript
// Example: "Do a water change when nitrate exceeds 20 ppm"
const waterChangeTask: MaintenanceTask = {
  // ...
  triggerThreshold: {
    parameterId: 'nitrate',
    operator: 'above',
    value: 20,
  },
};
```

**Trigger evaluation:** After saving a water log, run `evaluateThresholds(tankId)`:

```typescript
export async function evaluateThresholds(
  tankId: string,
  readings: WaterReading[]
): Promise<TriggeredAlert[]> {
  const tasks = await getTasksByTank(tankId);
  const alerts: TriggeredAlert[] = [];

  for (const task of tasks) {
    if (!task.triggerThreshold) continue;
    const reading = readings.find(r => r.parameterId === task.triggerThreshold!.parameterId);
    if (!reading) continue;

    const { operator, value } = task.triggerThreshold;
    const triggered =
      (operator === 'above' && reading.value > value) ||
      (operator === 'below' && reading.value < value);

    if (triggered) {
      alerts.push({
        task,
        reading,
        message: `${task.title} — ${reading.parameterId} is ${reading.value} (threshold: ${operator} ${value})`,
      });
    }
  }

  return alerts;
}
```

Alerts surface in the dashboard and can trigger notifications.

### 5.4 Default Tasks — Scoping

During migration, existing predefined tasks become **tank-scoped** (assigned to the default tank). We also add a few global default tasks:

**New global defaults:**
| Title | Recurrence | Description |
|-------|-----------|-------------|
| Mix Saltwater Batch | weekly | Mix RODI + reef salt to target salinity. Aerate & heat 24h before use. |
| Check RODI Filter TDS | monthly | Test TDS of RODI output. Replace filters/membrane when >5 TDS. |
| Inspect Equipment | monthly | Check return pump, heater, ATO, powerheads for wear or malfunction. |

**New triggered-task defaults (per tank):**
| Title | Trigger | Description |
|-------|---------|-------------|
| Emergency Water Change | Ammonia above 0.25 ppm | Ammonia detected — perform 25-50% water change immediately. |
| Reduce Nitrates | Nitrate above 20 ppm | Nitrates elevated — increase water changes or adjust feeding. |
| Dose Alkalinity | Alkalinity below 7.0 dKH | Alkalinity low — dose buffer per calculator. Retest in 4 hours. |

### 5.5 Task Service Changes

- `getTasks()` unchanged
- New: `getTasksByTank(tankId: string)` — returns tasks where `tankId` matches OR `scope === 'global'`
- `addTask()` — `tankId` and `scope` are now part of the input
- `completeTask()` — unchanged logic, but global task completion is truly global

### 5.6 `useTasks` Hook Changes

```typescript
export function useTasks(tankId: string) {
  // Filters tasks to active tank + global tasks
  // All CRUD operations include the active tankId
}
```

---

## 6. Dashboard Redesign

### 6.1 New Dashboard Layout

```
┌─────────────────────────────────────┐
│ ReefKeeper             ⚙️  👤       │
├─────────────────────────────────────┤
│ [🪸 My Reef Tank ▾]                │  ← tank selector
│                                     │
│ ── Water Summary ──                 │
│ Last tested: 2 hours ago            │
│ ┌─────┬─────┬─────┬─────┐          │
│ │🌡️78F│🧂35 │⚗️8.2│📊4  │          │
│ │ ✅  │ ✅  │ ✅  │ ✅  │          │
│ └─────┴─────┴─────┴─────┘          │
│ ┌─────┬─────┬─────┐                │
│ │🦴420│🧪8.5│💎1350│                │
│ │ ✅  │ ✅  │ ✅  │                │
│ └─────┴─────┴─────┘                │
│ [Log Water Test]  [View History]    │
│                                     │
│ ── Alerts ──                  (0)   │
│ ✅ All parameters in range          │
│                                     │
│ ── Tasks ──                         │
│ 🔴 2 overdue  🟡 3 due today       │
│ ┌───────────────────────────────┐   │
│ │ ⚠️ Water Change — 1 day late │   │
│ │ ⚠️ Clean Skimmer — 3 hrs late│   │
│ │ 📋 Feed Corals — due today   │   │
│ └───────────────────────────────┘   │
│ [View All Tasks]                    │
│                                     │
│ ── Livestock ──                     │
│ 🐠 12  🪸 8  🦀 5                  │
│ [View All Creatures]                │
│                                     │
│ ── Quick Actions ──                 │
│ [+ Log Test] [+ Add Creature]      │
│ [+ Add Task] [+ New Tank]          │
└─────────────────────────────────────┘
```

### 6.2 Dashboard Components

| Component | Source | Notes |
|-----------|--------|-------|
| `TankSelector` | New | Pill/chip + bottom sheet. Shared across all tabs. |
| `WaterSummaryCard` | New | Grid of latest readings with status colors. |
| `AlertBanner` | New | Shows critical/warning parameter alerts + triggered task alerts. |
| `TaskSummaryCard` | Modify existing | Add urgency counts, keep top-N overdue/today tasks. |
| `LivestockSummaryCard` | Modify existing | Same counts but scoped to active tank. |
| `QuickActions` | New | Grid of shortcut buttons. |

### 6.3 Alert Logic

Alerts combine:
1. **Parameter alerts** — any latest reading outside reef range
2. **Triggered task alerts** — any task whose threshold condition is currently met
3. **Stale data alert** — "No water test in X days" if last test > 7 days ago

Alerts are sorted: critical first, then warnings, then informational.

---

## 7. Data Migration

### 7.1 Strategy

On first app launch after the update, a migration runs **once**. It is idempotent and safe to re-run.

### 7.2 Migration Steps

```typescript
// services/migrationService.ts

const MIGRATION_VERSION_KEY = '@reef_keeper_migration_version';
const CURRENT_MIGRATION = 1; // bump for each migration

export async function runMigrations(): Promise<void> {
  const currentVersion = parseInt(
    (await AsyncStorage.getItem(MIGRATION_VERSION_KEY)) || '0',
    10
  );

  if (currentVersion < 1) {
    await migrateToMultiTank();
    await AsyncStorage.setItem(MIGRATION_VERSION_KEY, '1');
  }
}

async function migrateToMultiTank(): Promise<void> {
  // 1. Create default tank
  const defaultTank = await tankService.addTank({
    name: 'My Reef Tank',
    type: 'mixed-reef',
    volumeGallons: 75,           // reasonable default
    salinityUnit: 'ppt',
    notes: 'Auto-created during upgrade. Edit to match your setup!',
    isDefault: true,
  });

  // 2. Assign all existing creatures to the default tank
  const creatures = await creatureService.getCreatures();
  for (const creature of creatures) {
    await creatureService.updateCreature(creature.id, {
      tankId: defaultTank.id,
      careLevel: 'intermediate',     // safe default
      compatibilityNotes: '',
    });
  }

  // 3. Assign all existing tasks to the default tank
  const tasks = await taskService.getTasks();
  for (const task of tasks) {
    await taskService.updateTask(task.id, {
      tankId: defaultTank.id,
      scope: 'tank',                 // existing tasks were tank-specific
    });
  }

  // 4. Set default tank as active
  await tankService.setActiveTankId(defaultTank.id);
}
```

### 7.3 Migration UX

After migration, show a one-time welcome modal:

```
┌─────────────────────────────────────┐
│         🎉 ReefKeeper Updated!      │
│                                     │
│  Your livestock and tasks have been │
│  moved into "My Reef Tank".         │
│                                     │
│  You can now:                       │
│  • Track water parameters 🧪       │
│  • Manage multiple tanks 🪸        │
│  • Get alerts for out-of-range      │
│    readings ⚠️                      │
│                                     │
│  Edit your tank details in Settings │
│  to match your actual setup.        │
│                                     │
│         [Got It — Let's Go!]        │
└─────────────────────────────────────┘
```

### 7.4 Migration Safety

- Migration checks the version number before running — safe to re-run
- If `getCreatures()` returns creatures that already have a `tankId`, those are skipped
- If a default tank already exists (`isDefault: true`), it is reused
- No data is deleted — only fields are added to existing records

---

## 8. Screen Flows & Navigation

### 8.1 New Screens

| Route | Screen | Purpose |
|-------|--------|---------|
| `app/(tabs)/parameters.tsx` | Water Parameters Tab | Latest readings + chart + test log |
| `app/tank/add.tsx` | Add Tank | Form: name, type, volume, salinity unit, photo, notes |
| `app/tank/[id].tsx` | Tank Detail | Tank info, stats, edit/delete actions |
| `app/tank/edit/[id].tsx` | Edit Tank | Edit form |
| `app/waterlog/add.tsx` | Log Water Test | Parameter entry form with inline range feedback |
| `app/waterlog/[id].tsx` | Water Log Detail | View a single test session's readings |
| `app/waterlog/history.tsx` | Parameter History | Chart + timeline for a selected parameter |

### 8.2 Modified Screens

| Screen | Changes |
|--------|---------|
| `app/(tabs)/_layout.tsx` | Add "Parameters" tab (🧪) between Creatures and Tasks |
| `app/(tabs)/index.tsx` | Full dashboard redesign (see §6) |
| `app/(tabs)/creatures.tsx` | Scoped to active tank. Add care-level badges. |
| `app/(tabs)/tasks.tsx` | Scoped to active tank + show globals. Add scope badge. |
| `app/creature/add.tsx` | Auto-populate `tankId` from active tank. Add care level, compatibility, min tank size fields. |
| `app/creature/edit/[id].tsx` | Same new fields. Allow tank reassignment dropdown. |
| `app/creature/[id].tsx` | Show new fields. Show tank name. |
| `app/task/add.tsx` | Add scope selector (tank/global), trigger threshold builder. |
| `app/task/[id].tsx` | Show scope, threshold info, tank name. |
| `app/settings.tsx` | Add tank management section. Export includes tank + water log data. |

### 8.3 Navigation Map

```
(tabs)/
├── index.tsx          ← Dashboard (tank selector at top)
├── creatures.tsx      ← Creatures list (scoped to tank)
├── parameters.tsx     ← Water Parameters (NEW TAB)
└── tasks.tsx          ← Tasks list (scoped to tank + globals)

tank/
├── add.tsx            ← Add Tank (NEW)
├── [id].tsx           ← Tank Detail (NEW)
└── edit/[id].tsx      ← Edit Tank (NEW)

creature/
├── add.tsx            ← Add Creature (modified)
├── [id].tsx           ← Creature Detail (modified)
└── edit/[id].tsx      ← Edit Creature (modified)

task/
├── add.tsx            ← Add Task (modified)
└── [id].tsx           ← Task Detail (modified)

waterlog/
├── add.tsx            ← Log Water Test (NEW)
├── [id].tsx           ← Water Log Detail (NEW)
└── history.tsx        ← Parameter History Charts (NEW)

settings.tsx           ← Settings (modified — add tank management)
```

### 8.4 Shared Components

| Component | File | Notes |
|-----------|------|-------|
| `TankSelector` | `components/TankSelector.tsx` | Pill + bottom sheet. Used in every tab via layout. |
| `TankSelectorSheet` | `components/TankSelectorSheet.tsx` | Bottom sheet with tank list + "Add Tank" button. |
| `WaterSummaryCard` | `components/WaterSummaryCard.tsx` | Grid of latest readings with status coloring. |
| `ParameterChart` | `components/ParameterChart.tsx` | Line chart for a single parameter over time. |
| `ParameterStatusBadge` | `components/ParameterStatusBadge.tsx` | ✅🟡🔴 badge for a reading. |
| `AlertBanner` | `components/AlertBanner.tsx` | Critical/warning alerts at dashboard top. |
| `CareLevelBadge` | `components/CareLevelBadge.tsx` | 🟢🟡🔴 badge for creature care level. |
| `ScopeBadge` | `components/ScopeBadge.tsx` | "Tank" or "Global" chip on task cards. |

---

## 9. Implementation Phases

### Phase 1: Foundation (Backend + Models)

**Owner:** Livingston  
**Depends on:** Nothing

1. Create `models/Tank.ts`, `models/WaterParameter.ts`, `models/WaterLog.ts`
2. Add new fields to `models/Creature.ts` and `models/Task.ts`
3. Create `services/tankService.ts`, `services/waterLogService.ts`
4. Modify `services/creatureService.ts` and `services/taskService.ts` for tank scoping
5. Create `services/migrationService.ts`
6. Create `hooks/useTanks.ts`, `hooks/useWaterLogs.ts`
7. Modify `hooks/useCreatures.ts` and `hooks/useTasks.ts` to accept `tankId`
8. Update `constants/DefaultCreatures.ts` with care levels and compatibility
9. Add global default tasks and triggered-task defaults to `constants/DefaultTasks.ts`
10. Write unit tests for all new services and migration logic

### Phase 2: Tank Management UI

**Owner:** Linus  
**Depends on:** Phase 1

1. Build `TankSelector` + `TankSelectorSheet` components
2. Integrate tank selector into `(tabs)/_layout.tsx`
3. Build tank CRUD screens: `tank/add.tsx`, `tank/[id].tsx`, `tank/edit/[id].tsx`
4. Wire up dashboard to scope data by active tank
5. Run migration on app startup (integrate into `_layout.tsx` or a boot hook)
6. Show migration welcome modal for existing users

### Phase 3: Water Parameter Tracking UI

**Owner:** Linus  
**Depends on:** Phase 1

1. Build "Parameters" tab (`(tabs)/parameters.tsx`)
2. Build water log entry screen (`waterlog/add.tsx`)
3. Build water log detail screen (`waterlog/[id].tsx`)
4. Build parameter history/chart screen (`waterlog/history.tsx`)
5. Build `WaterSummaryCard`, `ParameterChart`, `ParameterStatusBadge`, `AlertBanner`
6. Integrate `WaterSummaryCard` and alerts into dashboard

### Phase 4: Enhanced Livestock & Tasks

**Owner:** Linus  
**Depends on:** Phase 2

1. Update creature add/edit forms with new fields (careLevel, compatibility, minTankSize, tankId)
2. Update `CreatureCard` with care-level badge and compatibility warning
3. Update task add form with scope selector and threshold builder
4. Update `TaskCard` with scope badge
5. Implement threshold evaluation after water log save
6. Wire triggered alerts into dashboard

### Phase 5: Polish & Testing

**Owner:** All  
**Depends on:** Phases 2-4

1. E2E tests for multi-tank flows, water logging, migration
2. Cross-platform testing (Android + Web)
3. Accessibility audit (screen reader labels, contrast)
4. Performance — ensure tank switching is instant (filter in memory, not refetch)
5. Edge cases: deleting the last tank, reassigning creatures, empty states

---

## Appendix A: AsyncStorage Key Registry

| Key | Type | Description |
|-----|------|-------------|
| `@reef_keeper_creatures` | `Creature[]` | All creatures across all tanks |
| `@reef_keeper_creatures_initialized` | `"true"` | First-run flag |
| `@reef_keeper_tasks` | `MaintenanceTask[]` | All tasks across all tanks |
| `@reef_keeper_tasks_initialized` | `"true"` | First-run flag |
| `@reef_keeper_tanks` | `Tank[]` | All tanks |
| `@reef_keeper_tanks_initialized` | `"true"` | First-run flag |
| `@reef_keeper_active_tank` | `string` | ID of currently selected tank |
| `@reef_keeper_water_logs` | `WaterLog[]` | All water test logs |
| `@reef_keeper_migration_version` | `string` | Migration version number |

## Appendix B: Charting Library Recommendation

**Recommended:** `victory-native` with `react-native-svg`

- Works with Expo (no native module linking required)
- Supports line charts with domain constraints (for range overlays)
- Active maintenance, good TypeScript support
- Alternatives: `react-native-chart-kit` (simpler but less customizable)

Install: `npx expo install victory-native react-native-svg`

## Appendix C: Reef Tank Type Reference

| Type | Description | Typical Params | Common Livestock |
|------|-------------|----------------|------------------|
| Mixed Reef | SPS, LPS, softies, fish | Standard ranges | Clownfish, tangs, chalices, hammers, mushrooms |
| SPS Dominant | Acropora, Montipora, Stylophora | Alk 8-9 dKH, Ca 420-450 | Acros, Montis, wrasses, gobies |
| LPS Dominant | Euphyllia, Acanthastrea, Favia | Slightly more flexible | Hammers, torches, acans, clownfish |
| Soft Coral | Leathers, zoanthids, mushrooms | Most forgiving | Zoas, mushrooms, xenias, GSP |
| FOWLR | Fish-only with live rock | No coral requirements | Tangs, angels, triggers, wrasses |
| Nano | Under 30 gallons, any coral | Tighter swings, less stable | Small gobies, shrimp, softies, select LPS |
| Quarantine | Bare-bottom, medication-safe | Adjustable | New additions — observe 4+ weeks |
| Frag | Propagation grow-out | Same as source tank | Coral frags on racks/plugs |

## Appendix D: Future Considerations (Out of Scope)

These are explicitly **not** in this spec but are natural follow-ups:

- **Cloud sync** — AsyncStorage → remote database, multi-device
- **Photo timeline** — periodic tank photos with parameter overlay
- **Dosing calculator** — calculate 2-part or kalkwasser doses from parameter readings
- **Equipment inventory** — track lights, pumps, heaters, reactors per tank
- **Community features** — share tank profiles, livestock compatibility database
- **ICP-OES test import** — parse lab results (Triton, ATI) into water logs
- **Bluetooth probe integration** — auto-log from Neptune Apex, GHL, Seneye
