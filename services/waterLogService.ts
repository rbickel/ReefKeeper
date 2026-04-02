import AsyncStorage from '@react-native-async-storage/async-storage';
import { WaterLog } from '../models/WaterLog';
import { WaterParameterId } from '../models/WaterParameter';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = '@reef_keeper_water_logs';

export async function getWaterLogs(): Promise<WaterLog[]> {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json) as WaterLog[];
}

export async function getWaterLogsByTank(tankId: string): Promise<WaterLog[]> {
    const logs = await getWaterLogs();
    return logs.filter((log) => log.tankId === tankId);
}

export async function addWaterLog(
    log: Omit<WaterLog, 'id' | 'createdAt' | 'updatedAt'>
): Promise<WaterLog> {
    const now = new Date().toISOString();
    const newLog: WaterLog = {
        ...log,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
    };
    const logs = await getWaterLogs();
    logs.push(newLog);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    return newLog;
}

export async function updateWaterLog(
    id: string,
    updates: Partial<WaterLog>
): Promise<WaterLog | null> {
    const logs = await getWaterLogs();
    const index = logs.findIndex((l) => l.id === id);
    if (index === -1) return null;

    logs[index] = {
        ...logs[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    return logs[index];
}

export async function deleteWaterLog(id: string): Promise<void> {
    const logs = await getWaterLogs();
    await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(logs.filter((l) => l.id !== id))
    );
}

export async function getLatestReadings(
    tankId: string
): Promise<Map<WaterParameterId, { value: number; testedAt: string }>> {
    const logs = await getWaterLogsByTank(tankId);
    const latest = new Map<WaterParameterId, { value: number; testedAt: string }>();

    // Sort logs newest first by testedAt
    const sorted = [...logs].sort(
        (a, b) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime()
    );

    for (const log of sorted) {
        for (const reading of log.readings) {
            if (!latest.has(reading.parameterId)) {
                latest.set(reading.parameterId, {
                    value: reading.value,
                    testedAt: log.testedAt,
                });
            }
        }
    }

    return latest;
}

export async function getParameterHistory(
    tankId: string,
    paramId: WaterParameterId,
    days: number = 30
): Promise<{ date: string; value: number }[]> {
    const logs = await getWaterLogsByTank(tankId);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const history: { date: string; value: number }[] = [];

    for (const log of logs) {
        if (new Date(log.testedAt) < cutoff) continue;
        for (const reading of log.readings) {
            if (reading.parameterId === paramId) {
                history.push({
                    date: log.testedAt,
                    value: reading.value,
                });
            }
        }
    }

    // Sort oldest to newest for charting
    history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return history;
}
