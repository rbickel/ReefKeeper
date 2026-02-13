import AsyncStorage from '@react-native-async-storage/async-storage';
import * as creatureService from '../../services/creatureService';
import { Creature, CreatureType } from '../../models/Creature';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
}));

// Mock uuid
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid-123'),
}));

describe('creatureService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getCreatures', () => {
        it('should return empty array when no creatures exist', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
            
            const result = await creatureService.getCreatures();
            
            expect(result).toEqual([]);
        });

        it('should return parsed creatures from storage', async () => {
            const mockCreatures: Creature[] = [
                {
                    id: '1',
                    name: 'Clownfish',
                    species: 'Amphiprion ocellaris',
                    type: 'fish',
                    dateAcquired: '2026-01-01T00:00:00Z',
                    quantity: 2,
                    notes: 'Test notes',
                    healthLog: [],
                    archived: false,
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockCreatures));
            
            const result = await creatureService.getCreatures();
            
            expect(result).toEqual(mockCreatures);
        });
    });

    describe('addCreature', () => {
        it('should add a new creature with generated ID and timestamps', async () => {
            const mockExistingCreatures: Creature[] = [];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockExistingCreatures));

            const now = new Date('2026-02-13T10:00:00Z');
            jest.useFakeTimers().setSystemTime(now);

            const newCreatureData = {
                name: 'Blue Tang',
                species: 'Paracanthurus hepatus',
                type: 'fish' as CreatureType,
                dateAcquired: now.toISOString(),
                quantity: 1,
                notes: 'Beautiful blue fish',
                healthLog: [],
                archived: false,
                photoUri: undefined,
            };

            const result = await creatureService.addCreature(newCreatureData);

            expect(result.id).toBe('test-uuid-123');
            expect(result.name).toBe('Blue Tang');
            expect(result.species).toBe('Paracanthurus hepatus');
            expect(result.type).toBe('fish');
            expect(result.createdAt).toBe(now.toISOString());
            expect(result.updatedAt).toBe(now.toISOString());
            
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_creatures',
                expect.stringContaining('"name":"Blue Tang"')
            );

            jest.useRealTimers();
        });

        it('should add creature to existing list', async () => {
            const mockExistingCreatures: Creature[] = [
                {
                    id: 'existing-1',
                    name: 'Existing Creature',
                    species: 'Test species',
                    type: 'coral',
                    dateAcquired: '2026-01-01T00:00:00Z',
                    quantity: 1,
                    notes: '',
                    healthLog: [],
                    archived: false,
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockExistingCreatures));

            const newCreatureData = {
                name: 'New Creature',
                species: 'New species',
                type: 'invertebrate' as CreatureType,
                dateAcquired: new Date().toISOString(),
                quantity: 3,
                notes: 'New notes',
                healthLog: [],
                archived: false,
                photoUri: undefined,
            };

            await creatureService.addCreature(newCreatureData);

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_creatures',
                expect.stringContaining('"name":"Existing Creature"')
            );
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_creatures',
                expect.stringContaining('"name":"New Creature"')
            );
        });

        it('should handle all creature types', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));
            
            const types: CreatureType[] = ['fish', 'coral', 'invertebrate', 'other'];
            
            for (const type of types) {
                const creatureData = {
                    name: `Test ${type}`,
                    species: `Species ${type}`,
                    type,
                    dateAcquired: new Date().toISOString(),
                    quantity: 1,
                    notes: '',
                    healthLog: [],
                    archived: false,
                    photoUri: undefined,
                };
                
                const result = await creatureService.addCreature(creatureData);
                expect(result.type).toBe(type);
            }
        });
    });

    describe('updateCreature', () => {
        it('should update existing creature and set updatedAt', async () => {
            const initialDate = new Date('2026-02-01T00:00:00Z');
            const updateDate = new Date('2026-02-13T10:00:00Z');
            
            const mockCreatures: Creature[] = [
                {
                    id: 'creature-1',
                    name: 'Original Name',
                    species: 'Original Species',
                    type: 'fish',
                    dateAcquired: initialDate.toISOString(),
                    quantity: 1,
                    notes: 'Original notes',
                    healthLog: [],
                    archived: false,
                    createdAt: initialDate.toISOString(),
                    updatedAt: initialDate.toISOString(),
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockCreatures));

            jest.useFakeTimers().setSystemTime(updateDate);

            const updates = {
                name: 'Updated Name',
                species: 'Updated Species',
                quantity: 3,
                notes: 'Updated notes',
            };

            const result = await creatureService.updateCreature('creature-1', updates);

            expect(result?.name).toBe('Updated Name');
            expect(result?.species).toBe('Updated Species');
            expect(result?.quantity).toBe(3);
            expect(result?.notes).toBe('Updated notes');
            expect(result?.updatedAt).toBe(updateDate.toISOString());
            expect(result?.createdAt).toBe(initialDate.toISOString()); // Should not change
            
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_creatures',
                expect.stringContaining('"name":"Updated Name"')
            );

            jest.useRealTimers();
        });

        it('should return null for non-existent creature', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

            const result = await creatureService.updateCreature('non-existent', { name: 'Test' });

            expect(result).toBeNull();
        });

        it('should update only specified fields', async () => {
            const mockCreatures: Creature[] = [
                {
                    id: 'creature-1',
                    name: 'Original Name',
                    species: 'Original Species',
                    type: 'fish',
                    dateAcquired: '2026-01-01T00:00:00Z',
                    quantity: 1,
                    notes: 'Original notes',
                    healthLog: [],
                    archived: false,
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockCreatures));

            const result = await creatureService.updateCreature('creature-1', { quantity: 5 });

            expect(result?.name).toBe('Original Name'); // Should remain unchanged
            expect(result?.species).toBe('Original Species'); // Should remain unchanged
            expect(result?.quantity).toBe(5); // Should be updated
        });

        it('should update creature type', async () => {
            const mockCreatures: Creature[] = [
                {
                    id: 'creature-1',
                    name: 'Test',
                    species: 'Test species',
                    type: 'fish',
                    dateAcquired: '2026-01-01T00:00:00Z',
                    quantity: 1,
                    notes: '',
                    healthLog: [],
                    archived: false,
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockCreatures));

            const result = await creatureService.updateCreature('creature-1', { type: 'coral' });

            expect(result?.type).toBe('coral');
        });
    });

    describe('archiveCreature', () => {
        it('should mark creature as archived', async () => {
            const mockCreatures: Creature[] = [
                {
                    id: 'creature-1',
                    name: 'Test Creature',
                    species: 'Test species',
                    type: 'fish',
                    dateAcquired: '2026-01-01T00:00:00Z',
                    quantity: 1,
                    notes: '',
                    healthLog: [],
                    archived: false,
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockCreatures));

            await creatureService.archiveCreature('creature-1');

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_creatures',
                expect.stringContaining('"archived":true')
            );
        });
    });

    describe('deleteCreature', () => {
        it('should remove creature from storage', async () => {
            const mockCreatures: Creature[] = [
                {
                    id: 'creature-1',
                    name: 'Creature 1',
                    species: 'Species 1',
                    type: 'fish',
                    dateAcquired: '2026-01-01T00:00:00Z',
                    quantity: 1,
                    notes: '',
                    healthLog: [],
                    archived: false,
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                },
                {
                    id: 'creature-2',
                    name: 'Creature 2',
                    species: 'Species 2',
                    type: 'coral',
                    dateAcquired: '2026-01-01T00:00:00Z',
                    quantity: 1,
                    notes: '',
                    healthLog: [],
                    archived: false,
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockCreatures));

            await creatureService.deleteCreature('creature-1');

            const savedData = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
            const savedCreatures = JSON.parse(savedData);
            
            expect(savedCreatures).toHaveLength(1);
            expect(savedCreatures[0].id).toBe('creature-2');
            expect(savedCreatures[0].name).toBe('Creature 2');
        });

        it('should handle deletion of non-existent creature gracefully', async () => {
            const mockCreatures: Creature[] = [
                {
                    id: 'creature-1',
                    name: 'Creature 1',
                    species: 'Species 1',
                    type: 'fish',
                    dateAcquired: '2026-01-01T00:00:00Z',
                    quantity: 1,
                    notes: '',
                    healthLog: [],
                    archived: false,
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockCreatures));

            await creatureService.deleteCreature('non-existent-id');

            const savedData = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
            const savedCreatures = JSON.parse(savedData);
            
            // Original creature should still be there
            expect(savedCreatures).toHaveLength(1);
            expect(savedCreatures[0].id).toBe('creature-1');
        });
    });

    describe('saveCreatures', () => {
        it('should save creatures to AsyncStorage', async () => {
            const mockCreatures: Creature[] = [
                {
                    id: 'creature-1',
                    name: 'Test Creature',
                    species: 'Test species',
                    type: 'fish',
                    dateAcquired: '2026-01-01T00:00:00Z',
                    quantity: 1,
                    notes: '',
                    healthLog: [],
                    archived: false,
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                },
            ];

            await creatureService.saveCreatures(mockCreatures);

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_creatures',
                JSON.stringify(mockCreatures)
            );
        });
    });

    describe('isInitialized and markInitialized', () => {
        it('should return false when not initialized', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const result = await creatureService.isInitialized();

            expect(result).toBe(false);
        });

        it('should return true when initialized', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

            const result = await creatureService.isInitialized();

            expect(result).toBe(true);
        });

        it('should mark as initialized', async () => {
            await creatureService.markInitialized();

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_creatures_initialized',
                'true'
            );
        });
    });
});
