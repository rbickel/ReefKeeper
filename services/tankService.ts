import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tank } from '../models/Tank';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = '@reef_keeper_tanks';
const INITIALIZED_KEY = '@reef_keeper_tanks_initialized';
const ACTIVE_TANK_KEY = '@reef_keeper_active_tank';

export async function isInitialized(): Promise<boolean> {
    const val = await AsyncStorage.getItem(INITIALIZED_KEY);
    return val === 'true';
}

export async function markInitialized(): Promise<void> {
    await AsyncStorage.setItem(INITIALIZED_KEY, 'true');
}

export async function getTanks(): Promise<Tank[]> {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json) as Tank[];
}

export async function saveTanks(tanks: Tank[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tanks));
}

export async function addTank(
    tank: Omit<Tank, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Tank> {
    const now = new Date().toISOString();
    const tanks = await getTanks();

    const newTank: Tank = {
        ...tank,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
    };

    // If this is the first tank, make it the default
    if (tanks.length === 0) {
        newTank.isDefault = true;
    }

    tanks.push(newTank);
    await saveTanks(tanks);
    return newTank;
}

export async function updateTank(
    id: string,
    updates: Partial<Tank>
): Promise<Tank | null> {
    const tanks = await getTanks();
    const index = tanks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    tanks[index] = {
        ...tanks[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    await saveTanks(tanks);
    return tanks[index];
}

export async function deleteTank(id: string): Promise<void> {
    const tanks = await getTanks();
    if (tanks.length <= 1) {
        throw new Error('Cannot delete the sole remaining tank.');
    }
    await saveTanks(tanks.filter((t) => t.id !== id));
}

export async function setDefaultTank(id: string): Promise<void> {
    const tanks = await getTanks();
    for (const tank of tanks) {
        tank.isDefault = tank.id === id;
        tank.updatedAt = new Date().toISOString();
    }
    await saveTanks(tanks);
}

export async function getActiveTankId(): Promise<string | null> {
    return AsyncStorage.getItem(ACTIVE_TANK_KEY);
}

export async function setActiveTankId(id: string): Promise<void> {
    await AsyncStorage.setItem(ACTIVE_TANK_KEY, id);
}
