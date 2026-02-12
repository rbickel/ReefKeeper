import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { MaintenanceTask } from '../models/Task';

/**
 * Request notification permissions from the user.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return false;
    }

    // Configure notification handler
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });

    return true;
}

/**
 * Schedule a local notification for a task based on its due date and reminder offset.
 */
export async function scheduleTaskNotification(task: MaintenanceTask): Promise<string | null> {
    if (Platform.OS === 'web') return null; // Web notifications not yet supported
    if (!task.notificationsEnabled) return null;

    const dueDate = new Date(task.nextDueDate);
    const triggerDate = new Date(dueDate.getTime() - task.reminderOffsetHours * 60 * 60 * 1000);

    // Don't schedule if trigger date is in the past
    if (triggerDate.getTime() <= Date.now()) return null;

    const identifier = await Notifications.scheduleNotificationAsync({
        content: {
            title: '🔧 Maintenance Reminder',
            body: `"${task.title}" is due ${task.reminderOffsetHours >= 24 ? 'tomorrow' : 'soon'}!`,
            data: { taskId: task.id },
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
        },
    });

    return identifier;
}

/**
 * Cancel all scheduled notifications for a specific task.
 */
export async function cancelTaskNotifications(taskId: string): Promise<void> {
    if (Platform.OS === 'web') return;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
        if (notification.content.data?.taskId === taskId) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
    }
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
}
