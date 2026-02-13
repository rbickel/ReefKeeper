import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useTasks } from '../../hooks/useTasks';
import * as taskService from '../../services/taskService';
import * as notificationService from '../../services/notificationService';
import { DEFAULT_TASKS } from '../../constants/DefaultTasks';

// Mock the services
jest.mock('../../services/taskService', () => ({
    getTasks: jest.fn(),
    addTask: jest.fn(),
    updateTask: jest.fn(),
    completeTask: jest.fn(),
    deleteTask: jest.fn(),
    isInitialized: jest.fn(),
    markInitialized: jest.fn(),
}));

jest.mock('../../services/notificationService', () => ({
    scheduleTaskNotification: jest.fn(),
    cancelTaskNotifications: jest.fn(),
}));

// Mock DEFAULT_TASKS
jest.mock('../../constants/DefaultTasks', () => ({
    DEFAULT_TASKS: [
        {
            title: 'Default Task Days',
            description: 'Test description',
            recurrenceInterval: 7,
            recurrenceUnit: 'days',
            reminderOffsetHours: 24,
            notificationsEnabled: true,
            isPredefined: true,
        },
        {
            title: 'Default Task Weeks',
            description: 'Test description',
            recurrenceInterval: 2,
            recurrenceUnit: 'weeks',
            reminderOffsetHours: 24,
            notificationsEnabled: true,
            isPredefined: true,
        },
        {
            title: 'Default Task Months',
            description: 'Test description',
            recurrenceInterval: 1,
            recurrenceUnit: 'months',
            reminderOffsetHours: 24,
            notificationsEnabled: false,
            isPredefined: true,
        },
    ],
}));

describe('useTasks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (taskService.getTasks as jest.Mock).mockResolvedValue([]);
        (taskService.isInitialized as jest.Mock).mockResolvedValue(true);
    });

    it('should initialize with empty tasks and loading state', () => {
        const { result } = renderHook(() => useTasks());

        expect(result.current.tasks).toEqual([]);
        expect(result.current.loading).toBe(true);
    });

    it('should load tasks on mount', async () => {
        const mockTasks = [
            {
                id: '1',
                title: 'Water Change',
                description: 'Change 25% of water',
                recurrenceInterval: 7,
                recurrenceUnit: 'days' as const,
                nextDueDate: '2026-02-20',
                reminderOffsetHours: 24,
                notificationsEnabled: true,
                isPredefined: false,
                completionHistory: [],
                createdAt: '2026-01-01',
                updatedAt: '2026-01-01',
            },
        ];
        (taskService.getTasks as jest.Mock).mockResolvedValue(mockTasks);

        const { result } = renderHook(() => useTasks());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.tasks).toEqual(mockTasks);
        expect(taskService.getTasks).toHaveBeenCalled();
    });

    it('should initialize default tasks when not initialized', async () => {
        (taskService.isInitialized as jest.Mock).mockResolvedValue(false);
        (taskService.addTask as jest.Mock).mockImplementation((task) =>
            Promise.resolve({ ...task, id: 'new-id', completionHistory: [], createdAt: '2026-01-01', updatedAt: '2026-01-01' })
        );

        renderHook(() => useTasks());

        await waitFor(() => {
            expect(taskService.addTask).toHaveBeenCalled();
        });

        expect(taskService.markInitialized).toHaveBeenCalled();
        expect(notificationService.scheduleTaskNotification).toHaveBeenCalled();
    });

    it('should not initialize defaults when already initialized', async () => {
        (taskService.isInitialized as jest.Mock).mockResolvedValue(true);

        renderHook(() => useTasks());

        await waitFor(() => {
            expect(taskService.getTasks).toHaveBeenCalled();
        });

        expect(taskService.addTask).not.toHaveBeenCalled();
        expect(taskService.markInitialized).not.toHaveBeenCalled();
    });

    it('should add a new task with notifications', async () => {
        const mockTask = {
            title: 'New Task',
            description: 'Test description',
            recurrenceInterval: 14,
            recurrenceUnit: 'days' as const,
            nextDueDate: '2026-02-20',
            reminderOffsetHours: 24,
            notificationsEnabled: true,
            isPredefined: false,
        };

        const addedTask = {
            ...mockTask,
            id: 'new-id',
            completionHistory: [],
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
        };

        (taskService.addTask as jest.Mock).mockResolvedValue(addedTask);
        (taskService.getTasks as jest.Mock).mockResolvedValue([addedTask]);

        const { result } = renderHook(() => useTasks());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.add(mockTask);
        });

        expect(taskService.addTask).toHaveBeenCalledWith(mockTask);
        expect(notificationService.scheduleTaskNotification).toHaveBeenCalledWith(addedTask);
        expect(taskService.getTasks).toHaveBeenCalled();
    });

    it('should add a new task without notifications', async () => {
        const mockTask = {
            title: 'New Task',
            description: 'Test description',
            recurrenceInterval: 14,
            recurrenceUnit: 'days' as const,
            nextDueDate: '2026-02-20',
            reminderOffsetHours: 24,
            notificationsEnabled: false,
            isPredefined: false,
        };

        const addedTask = {
            ...mockTask,
            id: 'new-id',
            completionHistory: [],
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
        };

        (taskService.addTask as jest.Mock).mockResolvedValue(addedTask);
        (taskService.getTasks as jest.Mock).mockResolvedValue([addedTask]);

        const { result } = renderHook(() => useTasks());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.add(mockTask);
        });

        expect(taskService.addTask).toHaveBeenCalledWith(mockTask);
        expect(notificationService.scheduleTaskNotification).not.toHaveBeenCalled();
    });

    it('should update a task and reschedule notification', async () => {
        const updatedTask = {
            id: 'task-id',
            title: 'Updated Task',
            description: 'Updated description',
            recurrenceInterval: 7,
            recurrenceUnit: 'days' as const,
            nextDueDate: '2026-02-20',
            reminderOffsetHours: 24,
            notificationsEnabled: true,
            isPredefined: false,
            completionHistory: [],
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
        };

        (taskService.updateTask as jest.Mock).mockResolvedValue(updatedTask);

        const { result } = renderHook(() => useTasks());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.update('task-id', { title: 'Updated Task' });
        });

        expect(taskService.updateTask).toHaveBeenCalledWith('task-id', { title: 'Updated Task' });
        expect(notificationService.cancelTaskNotifications).toHaveBeenCalledWith('task-id');
        expect(notificationService.scheduleTaskNotification).toHaveBeenCalledWith(updatedTask);
        expect(taskService.getTasks).toHaveBeenCalled();
    });

    it('should update a task and not schedule notification when disabled', async () => {
        const updatedTask = {
            id: 'task-id',
            title: 'Updated Task',
            description: 'Updated description',
            recurrenceInterval: 7,
            recurrenceUnit: 'days' as const,
            nextDueDate: '2026-02-20',
            reminderOffsetHours: 24,
            notificationsEnabled: false,
            isPredefined: false,
            completionHistory: [],
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
        };

        (taskService.updateTask as jest.Mock).mockResolvedValue(updatedTask);

        const { result } = renderHook(() => useTasks());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.update('task-id', { notificationsEnabled: false });
        });

        expect(notificationService.cancelTaskNotifications).toHaveBeenCalledWith('task-id');
        expect(notificationService.scheduleTaskNotification).not.toHaveBeenCalled();
    });

    it('should complete a task and reschedule notification', async () => {
        const completedTask = {
            id: 'task-id',
            title: 'Task',
            description: 'Description',
            recurrenceInterval: 7,
            recurrenceUnit: 'days' as const,
            nextDueDate: '2026-02-27',
            reminderOffsetHours: 24,
            notificationsEnabled: true,
            isPredefined: false,
            completionHistory: [],
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
        };

        (taskService.completeTask as jest.Mock).mockResolvedValue(completedTask);

        const { result } = renderHook(() => useTasks());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.complete('task-id', 'Completed successfully');
        });

        expect(taskService.completeTask).toHaveBeenCalledWith('task-id', 'Completed successfully');
        expect(notificationService.scheduleTaskNotification).toHaveBeenCalledWith(completedTask);
        expect(taskService.getTasks).toHaveBeenCalled();
    });

    it('should complete a task without rescheduling notification when disabled', async () => {
        const completedTask = {
            id: 'task-id',
            title: 'Task',
            description: 'Description',
            recurrenceInterval: 7,
            recurrenceUnit: 'days' as const,
            nextDueDate: '2026-02-27',
            reminderOffsetHours: 24,
            notificationsEnabled: false,
            isPredefined: false,
            completionHistory: [],
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
        };

        (taskService.completeTask as jest.Mock).mockResolvedValue(completedTask);

        const { result } = renderHook(() => useTasks());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.complete('task-id');
        });

        expect(notificationService.scheduleTaskNotification).not.toHaveBeenCalled();
    });

    it('should remove a task and cancel notifications', async () => {
        const { result } = renderHook(() => useTasks());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.remove('task-id');
        });

        expect(notificationService.cancelTaskNotifications).toHaveBeenCalledWith('task-id');
        expect(taskService.deleteTask).toHaveBeenCalledWith('task-id');
        expect(taskService.getTasks).toHaveBeenCalled();
    });

    it('should refresh tasks', async () => {
        const { result } = renderHook(() => useTasks());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        const initialCallCount = (taskService.getTasks as jest.Mock).mock.calls.length;

        await act(async () => {
            await result.current.refresh();
        });

        expect((taskService.getTasks as jest.Mock).mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should handle errors when loading tasks', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        (taskService.getTasks as jest.Mock).mockRejectedValue(new Error('Load failed'));

        const { result } = renderHook(() => useTasks());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(consoleError).toHaveBeenCalledWith('Failed to load tasks:', expect.any(Error));
        consoleError.mockRestore();
    });
});
