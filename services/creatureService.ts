import AsyncStorage from '@react-native-async-storage/async-storage';
import { Creature } from '../models/Creature';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = '@reef_keeper_creatures';
const INITIALIZED_KEY = '@reef_keeper_creatures_initialized';

export async function isInitialized(): Promise<boolean> {
    const val = await AsyncStorage.getItem(INITIALIZED_KEY);
    return val === 'true';
}

export async function markInitialized(): Promise<void> {
    await AsyncStorage.setItem(INITIALIZED_KEY, 'true');
}

export async function getCreatures(): Promise<Creature[]> {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json) as Creature[];
}

export async function saveCreatures(creatures: Creature[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(creatures));
}

export async function addCreature(creature: Omit<Creature, 'id' | 'createdAt' | 'updatedAt'>): Promise<Creature> {
    const now = new Date().toISOString();
    const newCreature: Creature = {
        ...creature,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
    };
    const creatures = await getCreatures();
    creatures.push(newCreature);
    await saveCreatures(creatures);
    return newCreature;
}

export async function updateCreature(id: string, updates: Partial<Creature>): Promise<Creature | null> {
    const creatures = await getCreatures();
    const index = creatures.findIndex((c) => c.id === id);
    if (index === -1) return null;
    creatures[index] = {
        ...creatures[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    await saveCreatures(creatures);
    return creatures[index];
}

export async function archiveCreature(id: string): Promise<void> {
    await updateCreature(id, { archived: true });
}

export async function deleteCreature(id: string): Promise<void> {
    const creatures = await getCreatures();
    await saveCreatures(creatures.filter((c) => c.id !== id));
}
