import AsyncStorage from '@react-native-async-storage/async-storage';
import * as taskService from '../../services/taskService';
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
    v4: jest.fn(() => 'test-uuid'),
}));

describe('taskService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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
    });

    describe('completeTask', () => {
        it('should reschedule a recurring task', async () => {
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

            // Next due should be 7 days from NOW (per taskService implementation using new Date())
            const expectedNextDue = new Date(now);
            expectedNextDue.setDate(expectedNextDue.getDate() + 7);

            expect(result?.nextDueDate).toBe(expectedNextDue.toISOString());
            expect(result?.isCompleted).toBeUndefined();

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
    });
});
