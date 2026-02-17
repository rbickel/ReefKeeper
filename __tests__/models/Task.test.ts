import { createTask, getTaskUrgency, RecurrenceUnit } from '../../models/Task';

describe('Task', () => {
    describe('createTask', () => {
        it('should create a task with only title', () => {
            const task = createTask({ title: 'Water Change' });

            expect(task.title).toBe('Water Change');
            expect(task.id).toBe('');
            expect(task.description).toBe('');
            expect(task.recurrenceInterval).toBe(7);
            expect(task.recurrenceUnit).toBe('days');
            expect(task.reminderOffsetHours).toBe(24);
            expect(task.notificationsEnabled).toBe(true);
            expect(task.isPredefined).toBe(false);
            expect(task.completionHistory).toEqual([]);
            expect(task.createdAt).toBeDefined();
            expect(task.updatedAt).toBeDefined();
            expect(task.nextDueDate).toBeDefined();
        });

        it('should create a task with optional fields', () => {
            const nextDue = new Date('2026-12-31').toISOString();
            const task = createTask({
                title: 'Test Task',
                description: 'Test description',
                recurrenceInterval: 14,
                recurrenceUnit: 'weeks',
                nextDueDate: nextDue,
                reminderOffsetHours: 48,
                notificationsEnabled: false,
                isPredefined: true,
            });

            expect(task.description).toBe('Test description');
            expect(task.recurrenceInterval).toBe(14);
            expect(task.recurrenceUnit).toBe('weeks');
            expect(task.nextDueDate).toBe(nextDue);
            expect(task.reminderOffsetHours).toBe(48);
            expect(task.notificationsEnabled).toBe(false);
            expect(task.isPredefined).toBe(true);
        });

        it('should support all recurrence units', () => {
            const units: RecurrenceUnit[] = ['days', 'weeks', 'months'];
            
            units.forEach(unit => {
                const task = createTask({
                    title: 'Test',
                    recurrenceUnit: unit,
                });
                expect(task.recurrenceUnit).toBe(unit);
            });
        });

        it('should set createdAt and updatedAt to current time', () => {
            const before = new Date().getTime();
            const task = createTask({ title: 'Test Task' });
            const after = new Date().getTime();

            const createdTime = new Date(task.createdAt).getTime();
            const updatedTime = new Date(task.updatedAt).getTime();

            expect(createdTime).toBeGreaterThanOrEqual(before);
            expect(createdTime).toBeLessThanOrEqual(after);
            expect(updatedTime).toBeGreaterThanOrEqual(before);
            expect(updatedTime).toBeLessThanOrEqual(after);
        });
    });

    describe('getTaskUrgency', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2026-02-15T12:00:00.000Z'));
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should return "overdue" for past due dates', () => {
            const task = createTask({
                title: 'Overdue Task',
                nextDueDate: new Date('2026-02-10').toISOString(),
            });

            expect(getTaskUrgency(task)).toBe('overdue');
        });

        it('should return "today" for today due dates', () => {
            const task = createTask({
                title: 'Today Task',
                nextDueDate: new Date('2026-02-15').toISOString(),
            });

            expect(getTaskUrgency(task)).toBe('today');
        });

        it('should return "upcoming" for tasks due within 3 days', () => {
            const task1 = createTask({
                title: 'Tomorrow Task',
                nextDueDate: new Date('2026-02-16').toISOString(),
            });
            expect(getTaskUrgency(task1)).toBe('upcoming');

            const task2 = createTask({
                title: 'Day After Task',
                nextDueDate: new Date('2026-02-17').toISOString(),
            });
            expect(getTaskUrgency(task2)).toBe('upcoming');

            const task3 = createTask({
                title: '3 Days Task',
                nextDueDate: new Date('2026-02-18').toISOString(),
            });
            expect(getTaskUrgency(task3)).toBe('upcoming');
        });

        it('should return "later" for tasks due more than 3 days away', () => {
            const task = createTask({
                title: 'Future Task',
                nextDueDate: new Date('2026-02-20').toISOString(),
            });

            expect(getTaskUrgency(task)).toBe('later');
        });

        it('should handle tasks with time components correctly', () => {
            const task = createTask({
                title: 'Task with Time',
                nextDueDate: new Date('2026-02-15T23:59:59.999Z').toISOString(),
            });

            expect(getTaskUrgency(task)).toBe('today');
        });
    });
});
