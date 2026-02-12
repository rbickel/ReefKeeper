import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaintenanceTask, RecurrenceUnit } from '../models/Task';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = '@reef_keeper_tasks';
const INITIALIZED_KEY = '@reef_keeper_tasks_initialized';

export async function getTasks(): Promise<MaintenanceTask[]> {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json) as MaintenanceTask[];
}

export async function saveTasks(tasks: MaintenanceTask[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export async function addTask(
    task: Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt' | 'completionHistory'>
): Promise<MaintenanceTask> {
    const now = new Date().toISOString();
    const newTask: MaintenanceTask = {
        ...task,
        id: uuidv4(),
        completionHistory: [],
        createdAt: now,
        updatedAt: now,
    };
    const tasks = await getTasks();
    tasks.push(newTask);
    await saveTasks(tasks);
    return newTask;
}

export async function updateTask(id: string, updates: Partial<MaintenanceTask>): Promise<MaintenanceTask | null> {
    const tasks = await getTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;
    tasks[index] = {
        ...tasks[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    await saveTasks(tasks);
    return tasks[index];
}

export async function completeTask(id: string, notes?: string): Promise<MaintenanceTask | null> {
    const tasks = await getTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const task = tasks[index];

    // Add completion record
    task.completionHistory.push({
        id: uuidv4(),
        taskId: id,
        completedAt: new Date().toISOString(),
        notes,
    });

    // Calculate next due date
    task.nextDueDate = calculateNextDueDate(
        new Date(),
        task.recurrenceInterval,
        task.recurrenceUnit
    ).toISOString();

    task.updatedAt = new Date().toISOString();
    await saveTasks(tasks);
    return task;
}

export async function deleteTask(id: string): Promise<void> {
    const tasks = await getTasks();
    await saveTasks(tasks.filter((t) => t.id !== id));
}

export async function isInitialized(): Promise<boolean> {
    const value = await AsyncStorage.getItem(INITIALIZED_KEY);
    return value === 'true';
}

export async function markInitialized(): Promise<void> {
    await AsyncStorage.setItem(INITIALIZED_KEY, 'true');
}

function calculateNextDueDate(fromDate: Date, interval: number, unit: RecurrenceUnit): Date {
    const next = new Date(fromDate);
    switch (unit) {
        case 'days':
            next.setDate(next.getDate() + interval);
            break;
        case 'weeks':
            next.setDate(next.getDate() + interval * 7);
            break;
        case 'months':
            next.setMonth(next.getMonth() + interval);
            break;
    }
    return next;
}
