import { useCallback, useEffect, useState } from 'react';
import { MaintenanceTask } from '../models/Task';
import * as taskService from '../services/taskService';
import * as notificationService from '../services/notificationService';
import { DEFAULT_TASKS } from '../constants/DefaultTasks';

export function useTasks() {
    const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const data = await taskService.getTasks();
            setTasks(data);
        } catch (error) {
            console.error('Failed to load tasks:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const initializeDefaults = useCallback(async () => {
        const initialized = await taskService.isInitialized();
        if (!initialized) {
            const now = new Date();
            for (const template of DEFAULT_TASKS) {
                // Calculate initial due date from now based on recurrence
                const nextDue = new Date(now);
                const interval = template.recurrenceInterval ?? 1;
                switch (template.recurrenceUnit) {
                    case 'days':
                        nextDue.setDate(nextDue.getDate() + interval);
                        break;
                    case 'weeks':
                        nextDue.setDate(nextDue.getDate() + interval * 7);
                        break;
                    case 'months':
                        nextDue.setMonth(nextDue.getMonth() + interval);
                        break;
                }
                const newTask = await taskService.addTask({
                    ...template,
                    nextDueDate: nextDue.toISOString(),
                });
                if (newTask.notificationsEnabled) {
                    await notificationService.scheduleTaskNotification(newTask);
                }
            }
            await taskService.markInitialized();
        }
    }, []);

    useEffect(() => {
        (async () => {
            await initializeDefaults();
            await refresh();
        })();
    }, [initializeDefaults, refresh]);

    const add = async (task: Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt' | 'completionHistory'>) => {
        const newTask = await taskService.addTask(task);
        // Schedule notification for the new task
        if (newTask.notificationsEnabled) {
            await notificationService.scheduleTaskNotification(newTask);
        }
        await refresh();
        return newTask;
    };

    const update = async (id: string, updates: Partial<MaintenanceTask>) => {
        const updated = await taskService.updateTask(id, updates);
        // Reschedule notification for the updated task
        if (updated) {
            await notificationService.cancelTaskNotifications(id);
            if (updated.notificationsEnabled) {
                await notificationService.scheduleTaskNotification(updated);
            }
        }
        await refresh();
    };

    const complete = async (id: string, notes?: string) => {
        const completed = await taskService.completeTask(id, notes);
        if (completed && completed.notificationsEnabled) {
            // Schedule for the *next* due date (which was just calculated in completeTask)
            await notificationService.scheduleTaskNotification(completed);
        }
        await refresh();
    };

    const remove = async (id: string) => {
        // Cancel any pending notifications before deleting
        await notificationService.cancelTaskNotifications(id);
        await taskService.deleteTask(id);
        await refresh();
    };

    return {
        tasks,
        loading,
        refresh,
        add,
        update,
        complete,
        remove,
    };
}
