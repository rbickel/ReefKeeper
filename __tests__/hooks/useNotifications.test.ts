import { renderHook, waitFor } from '@testing-library/react-native';
import { useNotifications } from '../../hooks/useNotifications';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as notificationService from '../../services/notificationService';

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
    addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock Platform
jest.mock('react-native', () => ({
    Platform: {
        OS: 'ios',
    },
}));

// Mock notification service
jest.mock('../../services/notificationService', () => ({
    requestNotificationPermissions: jest.fn(),
}));

describe('useNotifications', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (Platform as any).OS = 'ios';
        (notificationService.requestNotificationPermissions as jest.Mock).mockResolvedValue(true);
    });

    it('should initialize with permissionGranted as false', () => {
        const { result } = renderHook(() => useNotifications());

        expect(result.current.permissionGranted).toBe(false);
    });

    it('should request permissions on mount', async () => {
        (notificationService.requestNotificationPermissions as jest.Mock).mockResolvedValue(true);

        const { result } = renderHook(() => useNotifications());

        await waitFor(() => {
            expect(result.current.permissionGranted).toBe(true);
        });

        expect(notificationService.requestNotificationPermissions).toHaveBeenCalled();
    });

    it('should set permissionGranted to false when permission is denied', async () => {
        (notificationService.requestNotificationPermissions as jest.Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useNotifications());

        await waitFor(() => {
            expect(result.current.permissionGranted).toBe(false);
        });
    });

    it('should not add listeners on web platform', () => {
        (Platform as any).OS = 'web';

        renderHook(() => useNotifications());

        expect(Notifications.addNotificationReceivedListener).not.toHaveBeenCalled();
        expect(Notifications.addNotificationResponseReceivedListener).not.toHaveBeenCalled();
    });

    it('should add notification listeners on native platforms', async () => {
        renderHook(() => useNotifications());

        await waitFor(() => {
            expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
            expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
        });
    });

    it('should handle notification received', async () => {
        const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
        
        let notificationCallback: any;
        (Notifications.addNotificationReceivedListener as jest.Mock).mockImplementation((callback) => {
            notificationCallback = callback;
            return { remove: jest.fn() };
        });

        renderHook(() => useNotifications());

        await waitFor(() => {
            expect(notificationCallback).toBeDefined();
        });

        const mockNotification = { request: { content: { title: 'Test' } } };
        notificationCallback(mockNotification);

        expect(consoleLog).toHaveBeenCalledWith('Notification received:', mockNotification);
        consoleLog.mockRestore();
    });

    it('should handle notification response with taskId', async () => {
        const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
        
        let responseCallback: any;
        (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation((callback) => {
            responseCallback = callback;
            return { remove: jest.fn() };
        });

        renderHook(() => useNotifications());

        await waitFor(() => {
            expect(responseCallback).toBeDefined();
        });

        const mockResponse = {
            notification: {
                request: {
                    content: {
                        data: { taskId: 'task-123' },
                    },
                },
            },
        };
        responseCallback(mockResponse);

        expect(consoleLog).toHaveBeenCalledWith('Navigate to task:', 'task-123');
        consoleLog.mockRestore();
    });

    it('should handle notification response without taskId', async () => {
        const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
        
        let responseCallback: any;
        (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation((callback) => {
            responseCallback = callback;
            return { remove: jest.fn() };
        });

        renderHook(() => useNotifications());

        await waitFor(() => {
            expect(responseCallback).toBeDefined();
        });

        const mockResponse = {
            notification: {
                request: {
                    content: {
                        data: {},
                    },
                },
            },
        };
        responseCallback(mockResponse);

        expect(consoleLog).not.toHaveBeenCalledWith('Navigate to task:', expect.anything());
        consoleLog.mockRestore();
    });

    it('should cleanup listeners on unmount', () => {
        const removeMock1 = jest.fn();
        const removeMock2 = jest.fn();

        (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue({ remove: removeMock1 });
        (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue({ remove: removeMock2 });

        const { unmount } = renderHook(() => useNotifications());

        unmount();

        expect(removeMock1).toHaveBeenCalled();
        expect(removeMock2).toHaveBeenCalled();
    });

    it('should not cleanup listeners on web platform', () => {
        (Platform as any).OS = 'web';

        const removeMock = jest.fn();
        (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue({ remove: removeMock });

        const { unmount } = renderHook(() => useNotifications());

        unmount();

        expect(removeMock).not.toHaveBeenCalled();
    });
});
