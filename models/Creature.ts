export type CreatureType = 'fish' | 'coral' | 'invertebrate' | 'other';

export interface HealthLogEntry {
  id: string;
  creatureId: string;
  date: string; // ISO date string
  note: string;
}

export interface Creature {
  id: string;
  name: string;
  species: string;
  type: CreatureType;
  photoUri?: string;
  dateAcquired: string; // ISO date string
  quantity: number;
  notes: string;
  healthLog: HealthLogEntry[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export const CREATURE_TYPE_LABELS: Record<CreatureType, string> = {
  fish: '🐠 Fish',
  coral: '🪸 Coral',
  invertebrate: '🦀 Invertebrate',
  other: '🌊 Other',
};

export const CREATURE_TYPE_ICONS: Record<CreatureType, string> = {
  fish: 'fish',
  coral: 'flower',
  invertebrate: 'spider',
  other: 'waves',
};

export function createCreature(partial: Partial<Creature> & Pick<Creature, 'name' | 'species' | 'type'>): Creature {
  const now = new Date().toISOString();
  return {
    id: '',
    photoUri: undefined,
    dateAcquired: now,
    quantity: 1,
    notes: '',
    healthLog: [],
    archived: false,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}
