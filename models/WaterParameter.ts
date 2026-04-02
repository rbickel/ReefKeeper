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
  criticalLow: number | null;
  criticalHigh: number | null;
}

export interface WaterParameterDefinition {
  id: WaterParameterId;
  label: string;
  unit: string;
  emoji: string;
  ranges: ParameterRange;
  decimalPlaces: number;
}

export type ParameterStatus = 'ok' | 'warning' | 'critical';

export const WATER_PARAMETERS: WaterParameterDefinition[] = [
  {
    id: 'temperature',
    label: 'Temperature',
    unit: '°C',
    emoji: '🌡️',
    ranges: { reefLow: 24.4, reefHigh: 26.7, criticalLow: 23.3, criticalHigh: 27.8 },
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

export function getParameterStatus(
  paramId: WaterParameterId,
  value: number
): ParameterStatus {
  const def = WATER_PARAMETERS.find((p) => p.id === paramId);
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
