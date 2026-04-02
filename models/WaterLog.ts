import { WaterParameterId } from './WaterParameter';

export interface WaterReading {
  parameterId: WaterParameterId;
  value: number;
}

export interface WaterLog {
  id: string;
  tankId: string;
  testedAt: string;
  readings: WaterReading[];
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
