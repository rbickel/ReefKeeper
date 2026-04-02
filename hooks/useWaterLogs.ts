import { useCallback, useEffect, useState } from 'react';
import { WaterLog } from '../models/WaterLog';
import { WaterParameterId } from '../models/WaterParameter';
import * as waterLogService from '../services/waterLogService';

export function useWaterLogs(tankId: string) {
    const [logs, setLogs] = useState<WaterLog[]>([]);
    const [latestReadings, setLatestReadings] = useState<
        Map<WaterParameterId, { value: number; testedAt: string }>
    >(new Map());
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const data = await waterLogService.getWaterLogsByTank(tankId);
            // Sort newest first
            data.sort(
                (a, b) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime()
            );
            setLogs(data);

            const latest = await waterLogService.getLatestReadings(tankId);
            setLatestReadings(latest);
        } catch (error) {
            console.error('Failed to load water logs:', error);
        } finally {
            setLoading(false);
        }
    }, [tankId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const add = async (
        log: Omit<WaterLog, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<WaterLog> => {
        const newLog = await waterLogService.addWaterLog(log);
        await refresh();
        return newLog;
    };

    const update = async (id: string, updates: Partial<WaterLog>): Promise<void> => {
        await waterLogService.updateWaterLog(id, updates);
        await refresh();
    };

    const remove = async (id: string): Promise<void> => {
        await waterLogService.deleteWaterLog(id);
        await refresh();
    };

    const getHistory = async (
        paramId: WaterParameterId,
        days?: number
    ): Promise<{ date: string; value: number }[]> => {
        return waterLogService.getParameterHistory(tankId, paramId, days);
    };

    return {
        logs,
        latestReadings,
        loading,
        refresh,
        add,
        update,
        remove,
        getHistory,
    };
}
