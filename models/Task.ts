export type RecurrenceUnit = 'days' | 'weeks' | 'months';

export interface TaskCompletionRecord {
    id: string;
    taskId: string;
    completedAt: string; // ISO date string
    notes?: string;
}

export interface MaintenanceTask {
    id: string;
    title: string;
    description: string;
    recurrenceInterval: number; // e.g. 7
    recurrenceUnit: RecurrenceUnit; // e.g. 'days' → every 7 days
    nextDueDate: string; // ISO date string
    reminderOffsetHours: number; // how many hours before due date to notify
    notificationsEnabled: boolean;
    isPredefined: boolean;
    completionHistory: TaskCompletionRecord[];
    createdAt: string;
    updatedAt: string;
}

export function createTask(partial: Partial<MaintenanceTask> & Pick<MaintenanceTask, 'title'>): MaintenanceTask {
    const now = new Date().toISOString();
    return {
        id: '',
        description: '',
        recurrenceInterval: 7,
        recurrenceUnit: 'days',
        nextDueDate: now,
        reminderOffsetHours: 24,
        notificationsEnabled: true,
        isPredefined: false,
        completionHistory: [],
        createdAt: now,
        updatedAt: now,
        ...partial,
    };
}

export function getTaskUrgency(task: MaintenanceTask): 'overdue' | 'today' | 'upcoming' | 'later' {
    const now = new Date();
    const due = new Date(task.nextDueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 0) return 'overdue';
    if (diffDays < 1) return 'today';
    if (diffDays < 3) return 'upcoming';
    return 'later';
}
