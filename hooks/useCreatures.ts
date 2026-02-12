import { useCallback, useEffect, useState } from 'react';
import { Creature } from '../models/Creature';
import * as creatureService from '../services/creatureService';
import { DEFAULT_CREATURES } from '../constants/DefaultCreatures';

export function useCreatures() {
    const [creatures, setCreatures] = useState<Creature[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const data = await creatureService.getCreatures();
            setCreatures(data.filter((c) => !c.archived));
        } catch (error) {
            console.error('Failed to load creatures:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const initializeDefaults = useCallback(async () => {
        const initialized = await creatureService.isInitialized();
        if (!initialized) {
            const now = new Date().toISOString();
            for (const template of DEFAULT_CREATURES) {
                await creatureService.addCreature({ ...template, dateAcquired: now });
            }
            await creatureService.markInitialized();
        }
    }, []);

    useEffect(() => {
        (async () => {
            await initializeDefaults();
            await refresh();
        })();
    }, [initializeDefaults, refresh]);

    const add = async (creature: Omit<Creature, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newCreature = await creatureService.addCreature(creature);
        await refresh();
        return newCreature;
    };

    const update = async (id: string, updates: Partial<Creature>) => {
        await creatureService.updateCreature(id, updates);
        await refresh();
    };

    const archive = async (id: string) => {
        await creatureService.archiveCreature(id);
        await refresh();
    };

    const remove = async (id: string) => {
        await creatureService.deleteCreature(id);
        await refresh();
    };

    return {
        creatures,
        loading,
        refresh,
        add,
        update,
        archive,
        remove,
    };
}
