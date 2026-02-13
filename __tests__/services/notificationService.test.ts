import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as notificationService from '../../services/notificationService';
import { createTask } from '../../models/Task';

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    setNotificationHandler: jest.fn(),
    scheduleNotificationAsync: jest.fn(),
    getAllScheduledNotificationsAsync: jest.fn(),
    cancelScheduledNotificationAsync: jest.fn(),
    cancelAllScheduledNotificationsAsync: jest.fn(),
    SchedulableTriggerInputTypes: {
        DATE: 'date',
    },
}));

// Mock Platform
jest.mock('react-native', () => ({
    Platform: {
        OS: 'ios',
    },
}));

describe('notificationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (Platform as any).OS = 'ios';
    });

    describe('requestNotificationPermissions', () => {
        it('should return false on web platform', async () => {
            (Platform as any).OS = 'web';
            const result = await notificationService.requestNotificationPermissions();
            expect(result).toBe(false);
        });

        it('should return true when permission is already granted', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

            const result = await notificationService.requestNotificationPermissions();

            expect(result).toBe(true);
            expect(Notifications.setNotificationHandler).toHaveBeenCalled();
        });

        it('should request permission when not granted', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
            (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

            const result = await notificationService.requestNotificationPermissions();

            expect(result).toBe(true);
            expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
            expect(Notifications.setNotificationHandler).toHaveBeenCalled();
        });

        it('should return false when permission is denied', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
            (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

            const result = await notificationService.requestNotificationPermissions();

            expect(result).toBe(false);
            expect(Notifications.setNotificationHandler).not.toHaveBeenCalled();
        });

        it('should configure notification handler when granted', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

            await notificationService.requestNotificationPermissions();

            expect(Notifications.setNotificationHandler).toHaveBeenCalledWith({
                handleNotification: expect.any(Function),
            });

            // Test the handler function
            const handlerConfig = (Notifications.setNotificationHandler as jest.Mock).mock.calls[0][0];
            const result = await handlerConfig.handleNotification();
            
            expect(result).toEqual({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
            });
        });
    });

    describe('scheduleTaskNotification', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2026-02-15T12:00:00.000Z'));
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should return null on web platform', async () => {
            (Platform as any).OS = 'web';
            const task = createTask({
                title: 'Test Task',
                nextDueDate: new Date('2026-02-20T12:00:00.000Z').toISOString(),
                reminderOffsetHours: 24,
                notificationsEnabled: true,
            });

            const result = await notificationService.scheduleTaskNotification(task);

            expect(result).toBeNull();
        });

        it('should return null when notifications are disabled', async () => {
            const task = createTask({
                title: 'Test Task',
                nextDueDate: new Date('2026-02-20T12:00:00.000Z').toISOString(),
                reminderOffsetHours: 24,
                notificationsEnabled: false,
            });

            const result = await notificationService.scheduleTaskNotification(task);

            expect(result).toBeNull();
        });

        it('should return null when trigger date is in the past', async () => {
            const task = createTask({
                title: 'Test Task',
                nextDueDate: new Date('2026-02-10T12:00:00.000Z').toISOString(),
                reminderOffsetHours: 24,
                notificationsEnabled: true,
            });

            const result = await notificationService.scheduleTaskNotification(task);

            expect(result).toBeNull();
        });

        it('should schedule notification for future task', async () => {
            (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id-123');

            const task = createTask({
                title: 'Water Change',
                nextDueDate: new Date('2026-02-20T12:00:00.000Z').toISOString(),
                reminderOffsetHours: 24,
                notificationsEnabled: true,
            });

            const result = await notificationService.scheduleTaskNotification(task);

            expect(result).toBe('notification-id-123');
            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
                content: {
                    title: '🔧 Maintenance Reminder',
                    body: expect.stringContaining('Water Change'),
                    data: { taskId: task.id },
                    sound: true,
                },
                trigger: {
                    type: 'date',
                    date: expect.any(Date),
                },
            });
        });

        it('should use "tomorrow" in body when reminderOffsetHours >= 24', async () => {
            (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id-123');

            const task = createTask({
                title: 'Test Task',
                nextDueDate: new Date('2026-02-20T12:00:00.000Z').toISOString(),
                reminderOffsetHours: 24,
                notificationsEnabled: true,
            });

            await notificationService.scheduleTaskNotification(task);

            const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
            expect(call.content.body).toContain('tomorrow');
        });

        it('should use "soon" in body when reminderOffsetHours < 24', async () => {
            (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id-123');

            const task = createTask({
                title: 'Test Task',
                nextDueDate: new Date('2026-02-20T12:00:00.000Z').toISOString(),
                reminderOffsetHours: 12,
                notificationsEnabled: true,
            });

            await notificationService.scheduleTaskNotification(task);

            const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
            expect(call.content.body).toContain('soon');
        });
    });

    describe('cancelTaskNotifications', () => {
        it('should do nothing on web platform', async () => {
            (Platform as any).OS = 'web';

            await notificationService.cancelTaskNotifications('task-123');

            expect(Notifications.getAllScheduledNotificationsAsync).not.toHaveBeenCalled();
        });

        it('should cancel notifications for specific task', async () => {
            const mockNotifications = [
                { identifier: 'notif-1', content: { data: { taskId: 'task-123' } } },
                { identifier: 'notif-2', content: { data: { taskId: 'task-456' } } },
                { identifier: 'notif-3', content: { data: { taskId: 'task-123' } } },
            ];
            (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(mockNotifications);

            await notificationService.cancelTaskNotifications('task-123');

            expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif-1');
            expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif-3');
            expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
        });

        it('should handle tasks with no scheduled notifications', async () => {
            (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue([]);

            await notificationService.cancelTaskNotifications('task-123');

            expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
        });
    });

    describe('cancelAllNotifications', () => {
        it('should do nothing on web platform', async () => {
            (Platform as any).OS = 'web';

            await notificationService.cancelAllNotifications();

            expect(Notifications.cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
        });

        it('should cancel all scheduled notifications', async () => {
            await notificationService.cancelAllNotifications();

            expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
        });
    });
});
