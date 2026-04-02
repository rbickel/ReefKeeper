export type TankType =
  | 'mixed-reef'
  | 'sps-dominant'
  | 'lps-dominant'
  | 'soft-coral'
  | 'fowlr'
  | 'nano'
  | 'quarantine'
  | 'frag'
  | 'predator'
  | 'seahorse'
  | 'lagoon'
  | 'other';

export type SalinityUnit = 'ppt' | 'sg';

export interface Tank {
  id: string;
  name: string;
  type: TankType;
  volumeLiters: number;
  totalSystemLiters?: number;
  salinityUnit: SalinityUnit;
  photoUri?: string;
  notes: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const TANK_TYPE_LABELS: Record<TankType, string> = {
  'mixed-reef': '🪸 Mixed Reef',
  'sps-dominant': '🌿 SPS Dominant',
  'lps-dominant': '🫧 LPS Dominant',
  'soft-coral': '🍄 Soft Coral',
  'fowlr': '🐟 FOWLR',
  'nano': '🔬 Nano Reef',
  'quarantine': '🏥 Quarantine',
  'frag': '✂️ Frag Tank',
  'predator': '🦈 Predator',
  'seahorse': '🐴 Seahorse',
  'lagoon': '🏖️ Lagoon',
  'other': '🌊 Other',
};

export function createTank(
  partial: Partial<Tank> & Pick<Tank, 'name' | 'type' | 'volumeLiters'>
): Tank {
  const now = new Date().toISOString();
  return {
    id: '',
    totalSystemLiters: undefined,
    salinityUnit: 'ppt',
    photoUri: undefined,
    notes: '',
    isDefault: false,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}
