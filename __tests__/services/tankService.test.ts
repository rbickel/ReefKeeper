import AsyncStorage from '@react-native-async-storage/async-storage';
import * as tankService from '../../services/tankService';
import { Tank, TankType } from '../../models/Tank';

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

describe('tankService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getTanks', () => {
        it('should return empty array when nothing stored', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const result = await tankService.getTanks();

            expect(result).toEqual([]);
        });

        it('should return parsed tanks from storage', async () => {
            const mockTanks: Tank[] = [
                {
                    id: 'tank-1',
                    name: 'My Reef Tank',
                    type: 'mixed-reef',
                    volumeLiters: 284,
                    salinityUnit: 'ppt',
                    notes: '',
                    isDefault: true,
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockTanks));

            const result = await tankService.getTanks();

            expect(result).toEqual(mockTanks);
        });
    });

    describe('addTank', () => {
        it('should generate ID and timestamps', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

            const now = new Date('2026-02-13T10:00:00Z');
            jest.useFakeTimers().setSystemTime(now);

            const result = await tankService.addTank({
                name: 'New Tank',
                type: 'mixed-reef',
                volumeLiters: 284,
                salinityUnit: 'ppt',
                notes: '',
                isDefault: false,
            });

            expect(result.id).toBe('test-uuid-123');
            expect(result.name).toBe('New Tank');
            expect(result.createdAt).toBe(now.toISOString());
            expect(result.updatedAt).toBe(now.toISOString());

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_tanks',
                expect.stringContaining('"name":"New Tank"')
            );

            jest.useRealTimers();
        });

        it('should set isDefault to true for the first tank', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

            const result = await tankService.addTank({
                name: 'First Tank',
                type: 'nano',
                volumeLiters: 76,
                salinityUnit: 'ppt',
                notes: '',
                isDefault: false,
            });

            expect(result.isDefault).toBe(true);

            jest.useRealTimers();
        });

        it('should not set isDefault for subsequent tanks', async () => {
            const existingTank: Tank = {
                id: 'existing-1',
                name: 'Existing Tank',
                type: 'mixed-reef',
                volumeLiters: 284,
                salinityUnit: 'ppt',
                notes: '',
                isDefault: true,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([existingTank]));

            const result = await tankService.addTank({
                name: 'Second Tank',
                type: 'frag',
                volumeLiters: 151,
                salinityUnit: 'ppt',
                notes: '',
                isDefault: false,
            });

            expect(result.isDefault).toBe(false);
        });

        it('should add tank to existing list', async () => {
            const existingTank: Tank = {
                id: 'existing-1',
                name: 'Existing Tank',
                type: 'mixed-reef',
                volumeLiters: 284,
                salinityUnit: 'ppt',
                notes: '',
                isDefault: true,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([existingTank]));

            await tankService.addTank({
                name: 'New Tank',
                type: 'quarantine',
                volumeLiters: 38,
                salinityUnit: 'ppt',
                notes: '',
                isDefault: false,
            });

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_tanks',
                expect.stringContaining('"name":"Existing Tank"')
            );
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_tanks',
                expect.stringContaining('"name":"New Tank"')
            );
        });
    });

    describe('updateTank', () => {
        it('should update fields and timestamp', async () => {
            const initialDate = new Date('2026-02-01T00:00:00Z');
            const updateDate = new Date('2026-02-13T10:00:00Z');

            const mockTank: Tank = {
                id: 'tank-1',
                name: 'Original Name',
                type: 'mixed-reef',
                volumeLiters: 284,
                salinityUnit: 'ppt',
                notes: '',
                isDefault: true,
                createdAt: initialDate.toISOString(),
                updatedAt: initialDate.toISOString(),
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([mockTank]));

            jest.useFakeTimers().setSystemTime(updateDate);

            const result = await tankService.updateTank('tank-1', { name: 'Updated Name' });

            expect(result).not.toBeNull();
            expect(result!.name).toBe('Updated Name');
            expect(result!.updatedAt).toBe(updateDate.toISOString());
            expect(result!.createdAt).toBe(initialDate.toISOString());

            jest.useRealTimers();
        });

        it('should return null for non-existent tank', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

            const result = await tankService.updateTank('non-existent', { name: 'Test' });

            expect(result).toBeNull();
        });
    });

    describe('deleteTank', () => {
        it('should remove tank from list', async () => {
            const mockTanks: Tank[] = [
                {
                    id: 'tank-1',
                    name: 'Tank 1',
                    type: 'mixed-reef',
                    volumeLiters: 284,
                    salinityUnit: 'ppt',
                    notes: '',
                    isDefault: true,
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                },
                {
                    id: 'tank-2',
                    name: 'Tank 2',
                    type: 'quarantine',
                    volumeLiters: 38,
                    salinityUnit: 'ppt',
                    notes: '',
                    isDefault: false,
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockTanks));

            await tankService.deleteTank('tank-2');

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_tanks',
                expect.stringContaining('"name":"Tank 1"')
            );
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_tanks',
                expect.not.stringContaining('"name":"Tank 2"')
            );
        });
    });

    describe('setDefaultTank', () => {
        it('should unset previous default and set new one', async () => {
            const mockTanks: Tank[] = [
                {
                    id: 'tank-1',
                    name: 'Tank 1',
                    type: 'mixed-reef',
                    volumeLiters: 284,
                    salinityUnit: 'ppt',
                    notes: '',
                    isDefault: true,
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                },
                {
                    id: 'tank-2',
                    name: 'Tank 2',
                    type: 'frag',
                    volumeLiters: 151,
                    salinityUnit: 'ppt',
                    notes: '',
                    isDefault: false,
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockTanks));

            await tankService.setDefaultTank('tank-2');

            const savedCall = (AsyncStorage.setItem as jest.Mock).mock.calls.find(
                (call: string[]) => call[0] === '@reef_keeper_tanks'
            );
            const savedTanks: Tank[] = JSON.parse(savedCall[1]);

            expect(savedTanks.find(t => t.id === 'tank-1')!.isDefault).toBe(false);
            expect(savedTanks.find(t => t.id === 'tank-2')!.isDefault).toBe(true);
        });
    });

    describe('getActiveTankId', () => {
        it('should return null when no active tank set', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const result = await tankService.getActiveTankId();

            expect(result).toBeNull();
            expect(AsyncStorage.getItem).toHaveBeenCalledWith('@reef_keeper_active_tank');
        });

        it('should return stored active tank ID', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue('tank-1');

            const result = await tankService.getActiveTankId();

            expect(result).toBe('tank-1');
        });
    });

    describe('setActiveTankId', () => {
        it('should write active tank ID to storage', async () => {
            await tankService.setActiveTankId('tank-2');

            expect(AsyncStorage.setItem).toHaveBeenCalledWith('@reef_keeper_active_tank', 'tank-2');
        });
    });

    describe('isInitialized', () => {
        it('should return false when not initialized', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const result = await tankService.isInitialized();

            expect(result).toBe(false);
        });

        it('should return true when initialized', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

            const result = await tankService.isInitialized();

            expect(result).toBe(true);
        });
    });

    describe('markInitialized', () => {
        it('should write initialized flag to storage', async () => {
            await tankService.markInitialized();

            expect(AsyncStorage.setItem).toHaveBeenCalledWith('@reef_keeper_tanks_initialized', 'true');
        });
    });
});
