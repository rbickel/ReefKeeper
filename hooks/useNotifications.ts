import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { requestNotificationPermissions } from '../services/notificationService';

export function useNotifications() {
    const [permissionGranted, setPermissionGranted] = useState(false);

    useEffect(() => {
        // Request permissions on mount
        requestNotificationPermissions().then(setPermissionGranted);

        if (Platform.OS === 'web') return;

        // Listener for incoming notifications while app is in foreground
        const notificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
            console.log('Notification received:', notification);
        });

        const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
            const taskId = response.notification.request.content.data?.taskId;
            if (taskId) {
                console.log('Navigate to task:', taskId);
            }
        });

        return () => {
            notificationSubscription.remove();
            responseSubscription.remove();
        };
    }, []);

    return { permissionGranted };
}
