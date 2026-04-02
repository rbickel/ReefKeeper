import AsyncStorage from '@react-native-async-storage/async-storage';
import * as migrationService from '../../services/migrationService';
import * as tankService from '../../services/tankService';
import * as creatureService from '../../services/creatureService';
import * as taskService from '../../services/taskService';
import { Tank } from '../../models/Tank';
import { Creature } from '../../models/Creature';
import { MaintenanceTask } from '../../models/Task';

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

// Mock dependent services
jest.mock('../../services/tankService');
jest.mock('../../services/creatureService');
jest.mock('../../services/taskService');

const mockedTankService = tankService as jest.Mocked<typeof tankService>;
const mockedCreatureService = creatureService as jest.Mocked<typeof creatureService>;
const mockedTaskService = taskService as jest.Mocked<typeof taskService>;

describe('migrationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('runMigrations', () => {
        it('should create default "My Reef Tank" on first run', async () => {
            // Migration version is 0 (not yet run)
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const defaultTank: Tank = {
                id: 'test-uuid-123',
                name: 'My Reef Tank',
                type: 'mixed-reef',
                volumeLiters: 284,
                salinityUnit: 'ppt',
                notes: 'Auto-created during upgrade. Edit to match your setup!',
                isDefault: true,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            };
            mockedTankService.getTanks.mockResolvedValue([]);
            mockedTankService.addTank.mockResolvedValue(defaultTank);
            mockedCreatureService.getCreatures.mockResolvedValue([]);
            mockedTaskService.getTasks.mockResolvedValue([]);
            mockedTankService.setActiveTankId.mockResolvedValue();

            await migrationService.runMigrations();

            expect(mockedTankService.addTank).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'My Reef Tank',
                    type: 'mixed-reef',
                    volumeLiters: 284,
                    isDefault: true,
                })
            );
        });

        it('should assign tankId to all existing creatures', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const defaultTank: Tank = {
                id: 'default-tank-id',
                name: 'My Reef Tank',
                type: 'mixed-reef',
                volumeLiters: 284,
                salinityUnit: 'ppt',
                notes: '',
                isDefault: true,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            };
            mockedTankService.getTanks.mockResolvedValue([]);
            mockedTankService.addTank.mockResolvedValue(defaultTank);

            const existingCreatures: Creature[] = [
                {
                    id: 'creature-1',
                    name: 'Nemo',
                    species: 'Clownfish',
                    type: 'fish',
                    dateAcquired: '2026-01-01T00:00:00Z',
                    quantity: 1,
                    notes: '',
                    healthLog: [],
                    archived: false,
                    tankId: 'tank-1',
                    careLevel: 'beginner',
                    compatibilityNotes: 'Reef-safe',
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                },
                {
                    id: 'creature-2',
                    name: 'Bubbles',
                    species: 'Yellow Tang',
                    type: 'fish',
                    dateAcquired: '2026-01-01T00:00:00Z',
                    quantity: 1,
                    notes: '',
                    healthLog: [],
                    archived: false,
                    tankId: 'tank-1',
                    careLevel: 'intermediate',
                    compatibilityNotes: 'Needs large tank',
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                },
            ];
            mockedCreatureService.getCreatures.mockResolvedValue(existingCreatures);
            mockedCreatureService.updateCreature.mockResolvedValue(null);
            mockedTaskService.getTasks.mockResolvedValue([]);
            mockedTankService.setActiveTankId.mockResolvedValue();

            await migrationService.runMigrations();

            expect(mockedCreatureService.updateCreature).toHaveBeenCalledWith('creature-1', expect.objectContaining({
                tankId: 'default-tank-id',
            }));
            expect(mockedCreatureService.updateCreature).toHaveBeenCalledWith('creature-2', expect.objectContaining({
                tankId: 'default-tank-id',
            }));
        });

        it('should assign tankId and scope to all existing tasks', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const defaultTank: Tank = {
                id: 'default-tank-id',
                name: 'My Reef Tank',
                type: 'mixed-reef',
                volumeLiters: 284,
                salinityUnit: 'ppt',
                notes: '',
                isDefault: true,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            };
            mockedTankService.getTanks.mockResolvedValue([]);
            mockedTankService.addTank.mockResolvedValue(defaultTank);
            mockedCreatureService.getCreatures.mockResolvedValue([]);

            const existingTasks: MaintenanceTask[] = [
                {
                    id: 'task-1',
                    title: 'Water Change',
                    description: '',
                    recurrenceInterval: 7,
                    recurrenceUnit: 'days',
                    nextDueDate: '2026-03-15T00:00:00Z',
                    reminderOffsetHours: 24,
                    notificationsEnabled: true,
                    isPredefined: true,
                    tankId: null,
                    scope: 'global' as const,
                    completionHistory: [],
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                },
                {
                    id: 'task-2',
                    title: 'Clean Skimmer',
                    description: '',
                    recurrenceInterval: 3,
                    recurrenceUnit: 'days',
                    nextDueDate: '2026-03-15T00:00:00Z',
                    reminderOffsetHours: 24,
                    notificationsEnabled: true,
                    isPredefined: true,
                    tankId: null,
                    scope: 'global' as const,
                    completionHistory: [],
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                },
            ];
            mockedTaskService.getTasks.mockResolvedValue(existingTasks);
            mockedTaskService.updateTask.mockResolvedValue(null);
            mockedTankService.setActiveTankId.mockResolvedValue();

            await migrationService.runMigrations();

            expect(mockedTaskService.updateTask).toHaveBeenCalledWith('task-1', expect.objectContaining({
                tankId: 'default-tank-id',
                scope: 'tank',
            }));
            expect(mockedTaskService.updateTask).toHaveBeenCalledWith('task-2', expect.objectContaining({
                tankId: 'default-tank-id',
                scope: 'tank',
            }));
        });

        it('should set active tank ID after migration', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const defaultTank: Tank = {
                id: 'default-tank-id',
                name: 'My Reef Tank',
                type: 'mixed-reef',
                volumeLiters: 284,
                salinityUnit: 'ppt',
                notes: '',
                isDefault: true,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            };
            mockedTankService.getTanks.mockResolvedValue([]);
            mockedTankService.addTank.mockResolvedValue(defaultTank);
            mockedCreatureService.getCreatures.mockResolvedValue([]);
            mockedTaskService.getTasks.mockResolvedValue([]);
            mockedTankService.setActiveTankId.mockResolvedValue();

            await migrationService.runMigrations();

            expect(mockedTankService.setActiveTankId).toHaveBeenCalledWith('default-tank-id');
        });

        it('should be idempotent — running twice does not create duplicates', async () => {
            // First call: version is 0
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

            const defaultTank: Tank = {
                id: 'default-tank-id',
                name: 'My Reef Tank',
                type: 'mixed-reef',
                volumeLiters: 284,
                salinityUnit: 'ppt',
                notes: '',
                isDefault: true,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            };
            mockedTankService.getTanks.mockResolvedValue([]);
            mockedTankService.addTank.mockResolvedValue(defaultTank);
            mockedCreatureService.getCreatures.mockResolvedValue([]);
            mockedTaskService.getTasks.mockResolvedValue([]);
            mockedTankService.setActiveTankId.mockResolvedValue();

            await migrationService.runMigrations();

            // Verify migration version was saved
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_migration_version',
                '1'
            );

            // Second call: version is now 1
            jest.clearAllMocks();
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue('1');

            await migrationService.runMigrations();

            // Should NOT have called addTank a second time
            expect(mockedTankService.addTank).not.toHaveBeenCalled();
            expect(mockedCreatureService.updateCreature).not.toHaveBeenCalled();
            expect(mockedTaskService.updateTask).not.toHaveBeenCalled();
        });

        it('should track and check migration version', async () => {
            // Version already at 1 — no migration should run
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue('1');

            await migrationService.runMigrations();

            expect(AsyncStorage.getItem).toHaveBeenCalledWith('@reef_keeper_migration_version');
            expect(mockedTankService.addTank).not.toHaveBeenCalled();
        });

        it('should skip migration if already at current version', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue('1');

            await migrationService.runMigrations();

            // No tank creation, creature updates, or task updates
            expect(mockedTankService.addTank).not.toHaveBeenCalled();
            expect(mockedCreatureService.getCreatures).not.toHaveBeenCalled();
            expect(mockedTaskService.getTasks).not.toHaveBeenCalled();
            expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(
                '@reef_keeper_migration_version',
                expect.anything()
            );
        });

        it('should set default careLevel for migrated creatures', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const defaultTank: Tank = {
                id: 'default-tank-id',
                name: 'My Reef Tank',
                type: 'mixed-reef',
                volumeLiters: 284,
                salinityUnit: 'ppt',
                notes: '',
                isDefault: true,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            };
            mockedTankService.getTanks.mockResolvedValue([]);
            mockedTankService.addTank.mockResolvedValue(defaultTank);

            const creature: Creature = {
                id: 'creature-1',
                name: 'Nemo',
                species: 'Clownfish',
                type: 'fish',
                dateAcquired: '2026-01-01T00:00:00Z',
                quantity: 1,
                notes: '',
                healthLog: [],
                archived: false,
                tankId: 'tank-1',
                careLevel: 'beginner',
                compatibilityNotes: 'Reef-safe',
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            };
            mockedCreatureService.getCreatures.mockResolvedValue([creature]);
            mockedCreatureService.updateCreature.mockResolvedValue(null);
            mockedTaskService.getTasks.mockResolvedValue([]);
            mockedTankService.setActiveTankId.mockResolvedValue();

            await migrationService.runMigrations();

            expect(mockedCreatureService.updateCreature).toHaveBeenCalledWith('creature-1', expect.objectContaining({
                careLevel: 'intermediate',
                compatibilityNotes: '',
            }));
        });
    });
});
