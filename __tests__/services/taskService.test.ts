import AsyncStorage from '@react-native-async-storage/async-storage';
import * as taskService from '../../services/taskService';
import { MaintenanceTask, RecurrenceUnit } from '../../models/Task';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
}));

// Mock uuid
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid'),
}));

describe('taskService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getTasks', () => {
        it('should return empty array when no tasks exist', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
            
            const result = await taskService.getTasks();
            
            expect(result).toEqual([]);
        });

        it('should return parsed tasks from storage', async () => {
            const mockTasks: MaintenanceTask[] = [
                {
                    id: '1',
                    title: 'Test Task',
                    description: 'Test description',
                    recurrenceInterval: 7,
                    recurrenceUnit: 'days',
                    nextDueDate: new Date().toISOString(),
                    reminderOffsetHours: 24,
                    notificationsEnabled: true,
                    isPredefined: false,
                    tankId: null,
                    scope: 'global' as const,
                    completionHistory: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockTasks));
            
            const result = await taskService.getTasks();
            
            expect(result).toEqual(mockTasks);
        });
    });

    describe('addTask', () => {
        it('should add a new task with generated fields', async () => {
            const mockTasks: MaintenanceTask[] = [];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockTasks));

            const newTaskData = {
                title: 'Test Task',
                description: 'Testing',
                recurrenceInterval: 7,
                recurrenceUnit: 'days' as const,
                nextDueDate: new Date().toISOString(),
                reminderOffsetHours: 24,
                notificationsEnabled: true,
                isPredefined: false,
                tankId: null,
                scope: 'global' as const,
            };

            const result = await taskService.addTask(newTaskData);

            expect(result.id).toBe('test-uuid');
            expect(result.title).toBe('Test Task');
            expect(result.completionHistory).toEqual([]);
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_tasks',
                expect.stringContaining('"title":"Test Task"')
            );
        });

        it('should add task with weekly recurrence', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

            const taskData = {
                title: 'Weekly Task',
                description: 'Test weekly',
                recurrenceInterval: 2,
                recurrenceUnit: 'weeks' as RecurrenceUnit,
                nextDueDate: new Date().toISOString(),
                reminderOffsetHours: 48,
                notificationsEnabled: true,
                isPredefined: false,
                tankId: null,
                scope: 'global' as const,
            };

            const result = await taskService.addTask(taskData);

            expect(result.recurrenceInterval).toBe(2);
            expect(result.recurrenceUnit).toBe('weeks');
        });

        it('should add task with monthly recurrence', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

            const taskData = {
                title: 'Monthly Task',
                description: 'Test monthly',
                recurrenceInterval: 1,
                recurrenceUnit: 'months' as RecurrenceUnit,
                nextDueDate: new Date().toISOString(),
                reminderOffsetHours: 24,
                notificationsEnabled: true,
                isPredefined: false,
                tankId: null,
                scope: 'global' as const,
            };

            const result = await taskService.addTask(taskData);

            expect(result.recurrenceInterval).toBe(1);
            expect(result.recurrenceUnit).toBe('months');
        });

        it('should add non-recurring task', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

            const taskData = {
                title: 'One-time Task',
                description: 'Non-recurring',
                nextDueDate: new Date().toISOString(),
                reminderOffsetHours: 24,
                notificationsEnabled: true,
                isPredefined: false,
                tankId: null,
                scope: 'global' as const,
            };

            const result = await taskService.addTask(taskData);

            expect(result.recurrenceInterval).toBeUndefined();
            expect(result.recurrenceUnit).toBeUndefined();
        });

        it('should add task to existing list', async () => {
            const existingTask: MaintenanceTask = {
                id: 'existing-1',
                title: 'Existing Task',
                description: 'Already there',
                recurrenceInterval: 7,
                recurrenceUnit: 'days',
                nextDueDate: new Date().toISOString(),
                reminderOffsetHours: 24,
                notificationsEnabled: true,
                isPredefined: false,
                tankId: null,
                scope: 'global' as const,
                completionHistory: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([existingTask]));

            const taskData = {
                title: 'New Task',
                description: 'Just added',
                recurrenceInterval: 7,
                recurrenceUnit: 'days' as RecurrenceUnit,
                nextDueDate: new Date().toISOString(),
                reminderOffsetHours: 24,
                notificationsEnabled: true,
                isPredefined: false,
                tankId: null,
                scope: 'global' as const,
            };

            await taskService.addTask(taskData);

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_tasks',
                expect.stringContaining('"title":"Existing Task"')
            );
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_tasks',
                expect.stringContaining('"title":"New Task"')
            );
        });
    });

    describe('updateTask', () => {
        it('should update existing task', async () => {
            const initialDate = new Date('2026-02-01T00:00:00Z');
            const updateDate = new Date('2026-02-13T10:00:00Z');
            
            const mockTask: MaintenanceTask = {
                id: 'task-1',
                title: 'Original Title',
                description: 'Original description',
                recurrenceInterval: 7,
                recurrenceUnit: 'days',
                nextDueDate: initialDate.toISOString(),
                reminderOffsetHours: 24,
                notificationsEnabled: true,
                isPredefined: false,
                tankId: null,
                scope: 'global' as const,
                completionHistory: [],
                createdAt: initialDate.toISOString(),
                updatedAt: initialDate.toISOString(),
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([mockTask]));

            jest.useFakeTimers().setSystemTime(updateDate);

            const updates = {
                title: 'Updated Title',
                description: 'Updated description',
                recurrenceInterval: 14,
            };

            const result = await taskService.updateTask('task-1', updates);

            expect(result?.title).toBe('Updated Title');
            expect(result?.description).toBe('Updated description');
            expect(result?.recurrenceInterval).toBe(14);
            expect(result?.updatedAt).toBe(updateDate.toISOString());
            expect(result?.createdAt).toBe(initialDate.toISOString());

            jest.useRealTimers();
        });

        it('should return null for non-existent task', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

            const result = await taskService.updateTask('non-existent', { title: 'Test' });

            expect(result).toBeNull();
        });
    });

    describe('completeTask', () => {
        it('should reschedule a recurring task with days', async () => {
            const initialDate = new Date('2026-02-12T10:00:00Z');
            const mockTask: MaintenanceTask = {
                id: '1',
                title: 'Recurring Task',
                description: 'Desc',
                recurrenceInterval: 7,
                recurrenceUnit: 'days',
                nextDueDate: initialDate.toISOString(),
                reminderOffsetHours: 24,
                notificationsEnabled: true,
                isPredefined: false,
                tankId: null,
                scope: 'global' as const,
                completionHistory: [],
                createdAt: initialDate.toISOString(),
                updatedAt: initialDate.toISOString(),
            };

            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([mockTask]));

            // Mock current date
            const now = new Date('2026-02-12T12:00:00Z');
            jest.useFakeTimers().setSystemTime(now);

            const result = await taskService.completeTask('1');

            expect(result?.completionHistory.length).toBe(1);
            expect(result?.completionHistory[0].completedAt).toBe(now.toISOString());

            // Next due should be 7 days from NOW
            const expectedNextDue = new Date(now);
            expectedNextDue.setDate(expectedNextDue.getDate() + 7);

            expect(result?.nextDueDate).toBe(expectedNextDue.toISOString());
            expect(result?.isCompleted).toBeUndefined();

            jest.useRealTimers();
        });

        it('should reschedule a recurring task with weeks', async () => {
            const now = new Date('2026-02-12T12:00:00Z');
            const mockTask: MaintenanceTask = {
                id: '1',
                title: 'Weekly Task',
                description: 'Desc',
                recurrenceInterval: 2,
                recurrenceUnit: 'weeks',
                nextDueDate: now.toISOString(),
                reminderOffsetHours: 24,
                notificationsEnabled: true,
                isPredefined: false,
                tankId: null,
                scope: 'global' as const,
                completionHistory: [],
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
            };

            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([mockTask]));
            jest.useFakeTimers().setSystemTime(now);

            const result = await taskService.completeTask('1');

            const expectedNextDue = new Date(now);
            expectedNextDue.setDate(expectedNextDue.getDate() + 14); // 2 weeks

            expect(result?.nextDueDate).toBe(expectedNextDue.toISOString());

            jest.useRealTimers();
        });

        it('should reschedule a recurring task with months', async () => {
            const now = new Date('2026-02-12T12:00:00Z');
            const mockTask: MaintenanceTask = {
                id: '1',
                title: 'Monthly Task',
                description: 'Desc',
                recurrenceInterval: 1,
                recurrenceUnit: 'months',
                nextDueDate: now.toISOString(),
                reminderOffsetHours: 24,
                notificationsEnabled: true,
                isPredefined: false,
                tankId: null,
                scope: 'global' as const,
                completionHistory: [],
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
            };

            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([mockTask]));
            jest.useFakeTimers().setSystemTime(now);

            const result = await taskService.completeTask('1');

            const expectedNextDue = new Date(now);
            expectedNextDue.setMonth(expectedNextDue.getMonth() + 1);

            expect(result?.nextDueDate).toBe(expectedNextDue.toISOString());

            jest.useRealTimers();
        });

        it('should mark a non-recurring task as completed', async () => {
            const mockTask: MaintenanceTask = {
                id: '2',
                title: 'One-off Task',
                description: 'Desc',
                recurrenceInterval: undefined,
                recurrenceUnit: undefined,
                nextDueDate: new Date().toISOString(),
                reminderOffsetHours: 24,
                notificationsEnabled: true,
                isPredefined: false,
                tankId: null,
                scope: 'global' as const,
                completionHistory: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([mockTask]));

            const result = await taskService.completeTask('2');

            expect(result?.isCompleted).toBe(true);
            expect(result?.notificationsEnabled).toBe(false);
            expect(result?.completionHistory.length).toBe(1);
        });

        it('should add completion notes', async () => {
            const mockTask: MaintenanceTask = {
                id: '1',
                title: 'Task with notes',
                description: 'Desc',
                recurrenceInterval: 7,
                recurrenceUnit: 'days',
                nextDueDate: new Date().toISOString(),
                reminderOffsetHours: 24,
                notificationsEnabled: true,
                isPredefined: false,
                tankId: null,
                scope: 'global' as const,
                completionHistory: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([mockTask]));

            const notes = 'Completed with some observations';
            const result = await taskService.completeTask('1', notes);

            expect(result?.completionHistory[0].notes).toBe(notes);
        });

        it('should handle multiple completions', async () => {
            const mockTask: MaintenanceTask = {
                id: '1',
                title: 'Recurring Task',
                description: 'Desc',
                recurrenceInterval: 7,
                recurrenceUnit: 'days',
                nextDueDate: new Date().toISOString(),
                reminderOffsetHours: 24,
                notificationsEnabled: true,
                isPredefined: false,
                tankId: null,
                scope: 'global' as const,
                completionHistory: [
                    {
                        id: 'completion-1',
                        taskId: '1',
                        completedAt: '2026-02-01T00:00:00Z',
                        notes: 'First completion',
                    },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([mockTask]));

            const result = await taskService.completeTask('1', 'Second completion');

            expect(result?.completionHistory.length).toBe(2);
            expect(result?.completionHistory[1].notes).toBe('Second completion');
        });

        it('should return null for non-existent task', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

            const result = await taskService.completeTask('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('deleteTask', () => {
        it('should remove a task from storage', async () => {
            const mockTasks = [{ id: '1', title: 'Task 1' }, { id: '2', title: 'Task 2' }];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockTasks));

            await taskService.deleteTask('1');

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_tasks',
                JSON.stringify([{ id: '2', title: 'Task 2' }])
            );
        });

        it('should handle deletion of non-existent task', async () => {
            const mockTasks = [{ id: '1', title: 'Task 1' }];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockTasks));

            await taskService.deleteTask('non-existent');

            const savedData = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
            const savedTasks = JSON.parse(savedData);
            
            expect(savedTasks).toHaveLength(1);
            expect(savedTasks[0].id).toBe('1');
        });
    });

    describe('saveTasks', () => {
        it('should save tasks to AsyncStorage', async () => {
            const mockTasks: MaintenanceTask[] = [
                {
                    id: 'task-1',
                    title: 'Test Task',
                    description: 'Test',
                    recurrenceInterval: 7,
                    recurrenceUnit: 'days',
                    nextDueDate: new Date().toISOString(),
                    reminderOffsetHours: 24,
                    notificationsEnabled: true,
                    isPredefined: false,
                    tankId: null,
                    scope: 'global' as const,
                    completionHistory: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ];

            await taskService.saveTasks(mockTasks);

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_tasks',
                JSON.stringify(mockTasks)
            );
        });
    });

    describe('isInitialized and markInitialized', () => {
        it('should return false when not initialized', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const result = await taskService.isInitialized();

            expect(result).toBe(false);
        });

        it('should return true when initialized', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

            const result = await taskService.isInitialized();

            expect(result).toBe(true);
        });

        it('should mark as initialized', async () => {
            await taskService.markInitialized();

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_tasks_initialized',
                'true'
            );
        });
    });

    describe('getTasksByTank', () => {
        it('should return matching tank tasks plus global tasks', async () => {
            const mockTasks: MaintenanceTask[] = [
                {
                    id: 'task-1',
                    title: 'Water Change',
                    description: '',
                    recurrenceInterval: 7,
                    recurrenceUnit: 'days',
                    nextDueDate: new Date().toISOString(),
                    reminderOffsetHours: 24,
                    notificationsEnabled: true,
                    isPredefined: true,
                    completionHistory: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    tankId: 'tank-1',
                    scope: 'tank',
                } as any,
                {
                    id: 'task-2',
                    title: 'Clean Skimmer',
                    description: '',
                    recurrenceInterval: 3,
                    recurrenceUnit: 'days',
                    nextDueDate: new Date().toISOString(),
                    reminderOffsetHours: 24,
                    notificationsEnabled: true,
                    isPredefined: true,
                    completionHistory: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    tankId: 'tank-2',
                    scope: 'tank',
                } as any,
                {
                    id: 'task-3',
                    title: 'Mix Saltwater',
                    description: '',
                    recurrenceInterval: 7,
                    recurrenceUnit: 'days',
                    nextDueDate: new Date().toISOString(),
                    reminderOffsetHours: 24,
                    notificationsEnabled: true,
                    isPredefined: false,
                    completionHistory: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    tankId: null,
                    scope: 'global',
                } as any,
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockTasks));

            const result = await taskService.getTasksByTank('tank-1');

            expect(result).toHaveLength(2);
            expect(result.map((t: any) => t.title)).toContain('Water Change');
            expect(result.map((t: any) => t.title)).toContain('Mix Saltwater');
            expect(result.map((t: any) => t.title)).not.toContain('Clean Skimmer');
        });

        it('should return only global tasks when no tank-specific tasks match', async () => {
            const mockTasks: MaintenanceTask[] = [
                {
                    id: 'task-1',
                    title: 'Water Change',
                    description: '',
                    recurrenceInterval: 7,
                    recurrenceUnit: 'days',
                    nextDueDate: new Date().toISOString(),
                    reminderOffsetHours: 24,
                    notificationsEnabled: true,
                    isPredefined: true,
                    completionHistory: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    tankId: 'tank-2',
                    scope: 'tank',
                } as any,
                {
                    id: 'task-2',
                    title: 'Mix Saltwater',
                    description: '',
                    recurrenceInterval: 7,
                    recurrenceUnit: 'days',
                    nextDueDate: new Date().toISOString(),
                    reminderOffsetHours: 24,
                    notificationsEnabled: true,
                    isPredefined: false,
                    completionHistory: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    tankId: null,
                    scope: 'global',
                } as any,
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockTasks));

            const result = await taskService.getTasksByTank('tank-999');

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Mix Saltwater');
        });

        it('should return empty array when no tasks exist', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const result = await taskService.getTasksByTank('tank-1');

            expect(result).toEqual([]);
        });
    });

    describe('evaluateThresholds', () => {
        it('should return alerts when readings exceed thresholds', async () => {
            const mockTasks = [
                {
                    id: 'task-1',
                    title: 'Emergency Water Change',
                    description: '',
                    recurrenceInterval: undefined,
                    recurrenceUnit: undefined,
                    nextDueDate: new Date().toISOString(),
                    reminderOffsetHours: 24,
                    notificationsEnabled: true,
                    isPredefined: false,
                    tankId: 'tank-1',
                    scope: 'tank' as const,
                    completionHistory: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    triggerThreshold: {
                        parameterId: 'ammonia',
                        operator: 'above',
                        value: 0.25,
                    },
                },
                {
                    id: 'task-2',
                    title: 'Dose Alkalinity',
                    description: '',
                    recurrenceInterval: undefined,
                    recurrenceUnit: undefined,
                    nextDueDate: new Date().toISOString(),
                    reminderOffsetHours: 24,
                    notificationsEnabled: true,
                    isPredefined: false,
                    tankId: 'tank-1',
                    scope: 'tank' as const,
                    completionHistory: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    triggerThreshold: {
                        parameterId: 'alkalinity',
                        operator: 'below',
                        value: 7.0,
                    },
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockTasks));

            const readings = [
                { parameterId: 'ammonia' as const, value: 0.5 },   // above threshold
                { parameterId: 'alkalinity' as const, value: 6.5 }, // below threshold
            ];

            const alerts = await taskService.evaluateThresholds('tank-1', readings);

            expect(alerts).toHaveLength(2);
            expect(alerts[0].task.title).toBe('Emergency Water Change');
            expect(alerts[1].task.title).toBe('Dose Alkalinity');
        });

        it('should return empty when all readings are within thresholds', async () => {
            const mockTasks = [
                {
                    id: 'task-1',
                    title: 'Emergency Water Change',
                    description: '',
                    recurrenceInterval: undefined,
                    recurrenceUnit: undefined,
                    nextDueDate: new Date().toISOString(),
                    reminderOffsetHours: 24,
                    notificationsEnabled: true,
                    isPredefined: false,
                    tankId: 'tank-1',
                    scope: 'tank' as const,
                    completionHistory: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    triggerThreshold: {
                        parameterId: 'ammonia',
                        operator: 'above',
                        value: 0.25,
                    },
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockTasks));

            const readings = [
                { parameterId: 'ammonia' as const, value: 0.0 },  // within threshold
            ];

            const alerts = await taskService.evaluateThresholds('tank-1', readings);

            expect(alerts).toEqual([]);
        });

        it('should ignore tasks without triggerThreshold', async () => {
            const mockTasks = [
                {
                    id: 'task-1',
                    title: 'Water Change',
                    description: '',
                    recurrenceInterval: 7,
                    recurrenceUnit: 'days',
                    nextDueDate: new Date().toISOString(),
                    reminderOffsetHours: 24,
                    notificationsEnabled: true,
                    isPredefined: true,
                    tankId: 'tank-1',
                    scope: 'tank' as const,
                    completionHistory: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    // no triggerThreshold
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockTasks));

            const readings = [
                { parameterId: 'nitrate' as const, value: 50 },
            ];

            const alerts = await taskService.evaluateThresholds('tank-1', readings);

            expect(alerts).toEqual([]);
        });

        it('should ignore thresholds when matching reading is not present', async () => {
            const mockTasks = [
                {
                    id: 'task-1',
                    title: 'Reduce Nitrates',
                    description: '',
                    recurrenceInterval: undefined,
                    recurrenceUnit: undefined,
                    nextDueDate: new Date().toISOString(),
                    reminderOffsetHours: 24,
                    notificationsEnabled: true,
                    isPredefined: false,
                    tankId: 'tank-1',
                    scope: 'tank' as const,
                    completionHistory: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    triggerThreshold: {
                        parameterId: 'nitrate',
                        operator: 'above',
                        value: 20,
                    },
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockTasks));

            // Reading for a different parameter — no nitrate reading
            const readings = [
                { parameterId: 'temperature' as const, value: 78.0 },
            ];

            const alerts = await taskService.evaluateThresholds('tank-1', readings);

            expect(alerts).toEqual([]);
        });
    });
});
