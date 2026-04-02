import { useCallback, useEffect, useState } from 'react';
import { Tank } from '../models/Tank';
import * as tankService from '../services/tankService';
import * as migrationService from '../services/migrationService';

export function useTanks() {
    const [tanks, setTanks] = useState<Tank[]>([]);
    const [activeTank, setActiveTankState] = useState<Tank | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const data = await tankService.getTanks();
            setTanks(data);

            const activeId = await tankService.getActiveTankId();
            const active = data.find((t) => t.id === activeId) ?? data.find((t) => t.isDefault) ?? data[0] ?? null;
            setActiveTankState(active);
        } catch (error) {
            console.error('Failed to load tanks:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const initialize = useCallback(async () => {
        // Run migrations first — this creates "My Reef Tank" if needed
        await migrationService.runMigrations();

        const initialized = await tankService.isInitialized();
        if (!initialized) {
            // If migration didn't create a tank (fresh install), create a default
            const existing = await tankService.getTanks();
            if (existing.length === 0) {
                const defaultTank = await tankService.addTank({
                    name: 'My Reef Tank',
                    type: 'mixed-reef',
                    volumeLiters: 284,
                    salinityUnit: 'ppt',
                    notes: '',
                    isDefault: true,
                    photoUri: undefined,
                });
                await tankService.setActiveTankId(defaultTank.id);
            }
            await tankService.markInitialized();
        }
    }, []);

    useEffect(() => {
        (async () => {
            await initialize();
            await refresh();
        })();
    }, [initialize, refresh]);

    const add = async (tank: Omit<Tank, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tank> => {
        const newTank = await tankService.addTank(tank);
        await refresh();
        return newTank;
    };

    const update = async (id: string, updates: Partial<Tank>): Promise<void> => {
        await tankService.updateTank(id, updates);
        await refresh();
    };

    const remove = async (id: string): Promise<void> => {
        await tankService.deleteTank(id);
        await refresh();
    };

    const setActive = async (id: string): Promise<void> => {
        await tankService.setActiveTankId(id);
        const data = await tankService.getTanks();
        const active = data.find((t) => t.id === id) ?? null;
        setActiveTankState(active);
    };

    return {
        tanks,
        activeTank,
        loading,
        refresh,
        add,
        update,
        remove,
        setActive,
    };
}
