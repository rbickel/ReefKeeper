import { test, expect, Page } from '@playwright/test';

// Helper timeout constants
const TIMEOUTS = {
    APP_READY: 20000,
    ELEMENT_VISIBLE: 15000,
    ELEMENT_INTERACTION: 10000,
    SHORT: 5000,
};

// Helper function to get checkbox for a specific task
async function getTaskCheckbox(page: Page, taskName: string) {
    const taskText = page.getByText(taskName, { exact: true });
    await taskText.waitFor({ state: 'visible', timeout: TIMEOUTS.SHORT });
    
    const checkbox = page.locator('div').filter({ has: taskText }).getByRole('checkbox').first();
    await expect(checkbox).toBeVisible({ timeout: TIMEOUTS.SHORT });
    return checkbox;
}

test.describe('Task CRUD Operations', () => {
    test.beforeEach(async ({ page }) => {
        // Pipe console logs to terminal for debugging
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

        await page.goto('/');

        // Clear app data but preserve test mode flag
        await page.evaluate(() => {
            const keys = Object.keys(localStorage).filter(k => k !== '@reef_keeper:test_mode');
            keys.forEach(k => localStorage.removeItem(k));
        });
        await page.reload();

        // Wait for the app to be ready
        await expect(page.getByText(/Maintenance/i)).toBeVisible({ timeout: TIMEOUTS.APP_READY });
    });

    test('should create a new recurring task with days interval', async ({ page }) => {
        // Click Add Task from Dashboard
        const addTaskBtn = page.getByRole('button', { name: /Add Task/i });
        await expect(addTaskBtn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
        await addTaskBtn.click();

        await page.waitForURL('**/task/add');
        await expect(page.getByTestId('task-name-input')).toBeVisible();

        // Fill task details
        await page.getByTestId('task-name-input').fill('Weekly Water Change');
        await page.getByLabel(/Description/i).fill('Change 20% of tank water');
        
        // Verify recurring is on by default
        await expect(page.getByTestId('task-recurring-switch')).toBeChecked();
        
        // Set interval to 7 days
        await page.getByLabel(/Repeat every/i).fill('7');
        await page.getByRole('button', { name: /Days/i }).click();
        
        await page.getByTestId('save-task-button').click();

        // Should navigate back to home
        await page.waitForURL('/');

        // Navigate to Tasks tab to verify
        await page.getByRole('tab', { name: /Tasks/i }).click();
        await page.waitForURL('**/tasks');

        // Verify task appears in the list
        await expect(page.getByText('Weekly Water Change')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_INTERACTION });
    });

    test('should create recurring tasks with different intervals', async ({ page }) => {
        // Navigate to Tasks tab first
        await page.getByRole('tab', { name: /Tasks/i }).click();
        await page.waitForURL('**/tasks');

        // Create task with weeks interval
        await page.getByTestId('add-task-fab').click();
        await page.waitForURL('**/task/add');
        await page.getByTestId('task-name-input').fill('Bi-weekly Filter Check');
        await page.getByLabel(/Repeat every/i).fill('2');
        await page.getByRole('button', { name: /Weeks/i }).click();
        await page.getByTestId('save-task-button').click();
        await page.waitForURL('/');

        // Create task with months interval
        await page.getByRole('button', { name: /Add Task/i }).click();
        await page.waitForURL('**/task/add');
        await page.getByTestId('task-name-input').fill('Monthly Deep Clean');
        await page.getByLabel(/Repeat every/i).fill('1');
        await page.getByRole('button', { name: /Months/i }).click();
        await page.getByTestId('save-task-button').click();
        await page.waitForURL('/');

        // Verify both tasks in the list
        await page.getByRole('tab', { name: /Tasks/i }).click();
        await page.waitForURL('**/tasks');
        await expect(page.getByText('Bi-weekly Filter Check')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_INTERACTION });
        await expect(page.getByText('Monthly Deep Clean')).toBeVisible();
    });

    test('should create a non-recurring task', async ({ page }) => {
        // Add Task from Dashboard
        const addTaskBtn = page.getByRole('button', { name: /Add Task/i });
        await addTaskBtn.click();

        await page.waitForURL('**/task/add');
        await expect(page.getByTestId('task-name-input')).toBeVisible();

        // Fill form
        await page.getByTestId('task-name-input').fill('One-time Equipment Check');
        await page.getByLabel(/Description/i).fill('Inspect all equipment before vacation');

        // Toggle Repeating Task OFF
        await page.getByTestId('task-recurring-switch').click();
        await expect(page.getByTestId('task-recurring-switch')).not.toBeChecked();

        // Interval fields should be hidden
        await expect(page.getByLabel(/Repeat every/i)).not.toBeVisible();

        await page.getByTestId('save-task-button').click();

        // Navigate to Tasks tab
        await page.getByRole('tab', { name: /Tasks/i }).click();
        await page.waitForURL('**/tasks');

        // Verify task appears
        await expect(page.getByText('One-time Equipment Check')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_INTERACTION });
    });

    test('should view task details', async ({ page }) => {
        // Create a task first
        await page.getByRole('button', { name: /Add Task/i }).click();
        await page.waitForURL('**/task/add');
        await page.getByTestId('task-name-input').fill('Test Task Details');
        await page.getByLabel(/Description/i).fill('This is a test description');
        await page.getByLabel(/Repeat every/i).fill('5');
        await page.getByRole('button', { name: /Days/i }).click();
        await page.getByTestId('save-task-button').click();
        await page.waitForURL('/');

        // Navigate to Tasks tab
        await page.getByRole('tab', { name: /Tasks/i }).click();
        await page.waitForURL('**/tasks');

        // Click on the task
        await page.getByText('Test Task Details').click();
        
        // Verify we're on the detail page
        await expect(page).toHaveURL(/\/task\/[^/]+$/);
        
        // Verify details are displayed
        await expect(page.getByText('Test Task Details')).toBeVisible();
        await expect(page.getByText('This is a test description')).toBeVisible();
        await expect(page.getByText(/Every 5 days/i)).toBeVisible();
        await expect(page.getByText(/Times completed/i)).toBeVisible();
    });

    test('should delete a task', async ({ page }) => {
        // Create a task first
        await page.getByRole('button', { name: /Add Task/i }).click();
        await page.waitForURL('**/task/add');
        await page.getByTestId('task-name-input').fill('Task To Delete');
        await page.getByTestId('save-task-button').click();
        await page.waitForURL('/');

        // Navigate to Tasks tab
        await page.getByRole('tab', { name: /Tasks/i }).click();
        await page.waitForURL('**/tasks');

        // Verify task exists
        await expect(page.getByText('Task To Delete')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_INTERACTION });

        // Click on the task to view details
        await page.getByText('Task To Delete').click();
        await expect(page).toHaveURL(/\/task\/[^/]+$/);
        
        // Delete the task
        await page.getByRole('button', { name: /Delete Task/i }).click();
        
        // Should navigate back to tasks list
        await page.waitForURL('**/tasks');
        
        // Task should not be visible
        await expect(page.getByText('Task To Delete')).not.toBeVisible();
    });

    test('should require task name to save', async ({ page }) => {
        // Add Task from Dashboard
        await page.getByRole('button', { name: /Add Task/i }).click();
        await page.waitForURL('**/task/add');

        // Save button should be disabled without name
        const saveButton = page.getByTestId('save-task-button');
        await expect(saveButton).toBeDisabled();

        // Fill task name
        await page.getByTestId('task-name-input').fill('Valid Task Name');
        
        // Now save button should be enabled
        await expect(saveButton).toBeEnabled();
    });
});

test.describe('Task Lifecycle and States', () => {
    test.beforeEach(async ({ page }) => {
        // Pipe console logs to terminal for debugging
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

        await page.goto('/');

        // Clear app data but preserve test mode flag
        await page.evaluate(() => {
            const keys = Object.keys(localStorage).filter(k => k !== '@reef_keeper:test_mode');
            keys.forEach(k => localStorage.removeItem(k));
        });
        await page.reload();

        // Wait for the app to be ready
        await expect(page.getByText(/Maintenance/i)).toBeVisible({ timeout: TIMEOUTS.APP_READY });
    });

    test('should complete a non-recurring task and move to completed section', async ({ page }) => {
        // Create a non-recurring task
        const addTaskBtn = page.getByRole('button', { name: /Add Task/i });
        await addTaskBtn.click();

        await page.waitForURL('**/task/add');
        await page.getByTestId('task-name-input').fill('Non-recurring Task');

        // Toggle Repeating Task OFF
        await page.getByTestId('task-recurring-switch').click();

        await page.getByTestId('save-task-button').click();

        // Navigate to Tasks tab
        await page.getByRole('tab', { name: /Tasks/i }).click();
        await page.waitForURL('**/tasks');

        // Verify task is in the list
        await expect(page.getByText('Non-recurring Task')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_INTERACTION });

        // Complete the task
        const checkbox = await getTaskCheckbox(page, 'Non-recurring Task');
        await checkbox.click();

        // Wait a moment for the UI to update
        await page.waitForTimeout(500);

        // Verify it moves to Completed section
        await expect(page.getByText('✅ Completed')).toBeVisible();
        
        // Task should still be visible but in completed section
        await expect(page.getByText('Non-recurring Task')).toBeVisible();
    });

    test('should complete a recurring task and show done today indicator', async ({ page }) => {
        // Create a recurring task
        const addTaskBtn = page.getByRole('button', { name: /Add Task/i });
        await addTaskBtn.click();

        await page.waitForURL('**/task/add');
        await page.getByTestId('task-name-input').fill('Recurring Task');
        
        // Recurring is on by default
        await expect(page.getByTestId('task-recurring-switch')).toBeChecked();
        
        await page.getByTestId('save-task-button').click();

        await page.getByRole('tab', { name: /Tasks/i }).click();
        await page.waitForURL('**/tasks');

        // Wait for the task to appear in the list
        await expect(page.getByText('Recurring Task')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
        
        // Complete the task
        const checkbox = await getTaskCheckbox(page, 'Recurring Task');
        await checkbox.click();

        // Wait a moment for the UI to update
        await page.waitForTimeout(500);

        // Verify "(Done today)" text appears
        await expect(page.getByText(/\(Done today\)/i)).toBeVisible();
    });

    test('should track completion history', async ({ page }) => {
        // Create a task
        await page.getByRole('button', { name: /Add Task/i }).click();
        await page.waitForURL('**/task/add');
        await page.getByTestId('task-name-input').fill('History Test Task');
        await page.getByTestId('save-task-button').click();
        await page.waitForURL('/');

        // Navigate to Tasks tab
        await page.getByRole('tab', { name: /Tasks/i }).click();
        await page.waitForURL('**/tasks');

        // Click on the task to view details
        await page.getByText('History Test Task').click();
        await expect(page).toHaveURL(/\/task\/[^/]+$/);
        
        // Initially, completion history should be empty
        await expect(page.getByText(/Times completed/i)).toBeVisible();
        await expect(page.getByText(/Not completed yet/i)).toBeVisible();

        // Complete the task from detail page
        await page.getByRole('button', { name: /Mark as Done/i }).click();
        
        // Wait for the page to reload
        await page.waitForTimeout(1000);
        
        // Verify completion count increased
        const completionCount = page.locator('text=/Times completed/i').locator('..').getByText('1');
        await expect(completionCount).toBeVisible();
        
        // Verify completion history shows entry
        await expect(page.getByText(/✅/)).toBeVisible();
    });

    test('should display tasks in correct urgency sections', async ({ page }) => {
        // Create multiple tasks with different due dates by manipulating localStorage
        await page.evaluate(() => {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const upcoming = new Date(today);
            upcoming.setDate(upcoming.getDate() + 2);
            
            const later = new Date(today);
            later.setDate(later.getDate() + 5);
            
            const tasks = [
                {
                    id: 'task-today',
                    title: 'Due Today Task',
                    description: '',
                    recurrenceInterval: 7,
                    recurrenceUnit: 'days',
                    nextDueDate: today.toISOString(),
                    reminderOffsetHours: 24,
                    notificationsEnabled: true,
                    isPredefined: false,
                    completionHistory: [],
                    createdAt: today.toISOString(),
                    updatedAt: today.toISOString(),
                },
                {
                    id: 'task-upcoming',
                    title: 'Upcoming Task',
                    description: '',
                    recurrenceInterval: 7,
                    recurrenceUnit: 'days',
                    nextDueDate: upcoming.toISOString(),
                    reminderOffsetHours: 24,
                    notificationsEnabled: true,
                    isPredefined: false,
                    completionHistory: [],
                    createdAt: today.toISOString(),
                    updatedAt: today.toISOString(),
                },
                {
                    id: 'task-later',
                    title: 'Later Task',
                    description: '',
                    recurrenceInterval: 7,
                    recurrenceUnit: 'days',
                    nextDueDate: later.toISOString(),
                    reminderOffsetHours: 24,
                    notificationsEnabled: true,
                    isPredefined: false,
                    completionHistory: [],
                    createdAt: today.toISOString(),
                    updatedAt: today.toISOString(),
                },
            ];
            
            localStorage.setItem('@reef_keeper_tasks', JSON.stringify(tasks));
            localStorage.setItem('@reef_keeper_tasks_initialized', 'true');
        });

        // Reload to pick up the tasks
        await page.reload();
        await expect(page.getByText(/Maintenance/i)).toBeVisible({ timeout: TIMEOUTS.APP_READY });

        // Navigate to Tasks tab
        await page.getByRole('tab', { name: /Tasks/i }).click();
        await page.waitForURL('**/tasks');

        // Verify section headers appear
        await expect(page.getByText('🟡 Due Today')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_INTERACTION });
        await expect(page.getByText('🔵 Upcoming')).toBeVisible();
        await expect(page.getByText('⚪ Later')).toBeVisible();

        // Verify tasks are in correct sections
        await expect(page.getByText('Due Today Task')).toBeVisible();
        await expect(page.getByText('Upcoming Task')).toBeVisible();
        await expect(page.getByText('Later Task')).toBeVisible();
    });

    test('should handle overdue tasks as due today', async ({ page }) => {
        // Create an overdue task by manipulating localStorage
        await page.evaluate(() => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            const tasks = [
                {
                    id: 'task-overdue',
                    title: 'Overdue Task',
                    description: '',
                    recurrenceInterval: 7,
                    recurrenceUnit: 'days',
                    nextDueDate: yesterday.toISOString(),
                    reminderOffsetHours: 24,
                    notificationsEnabled: true,
                    isPredefined: false,
                    completionHistory: [],
                    createdAt: yesterday.toISOString(),
                    updatedAt: yesterday.toISOString(),
                },
            ];
            
            localStorage.setItem('@reef_keeper_tasks', JSON.stringify(tasks));
            localStorage.setItem('@reef_keeper_tasks_initialized', 'true');
        });

        // Reload to pick up the tasks
        await page.reload();
        await expect(page.getByText(/Maintenance/i)).toBeVisible({ timeout: TIMEOUTS.APP_READY });

        // Navigate to Tasks tab
        await page.getByRole('tab', { name: /Tasks/i }).click();
        await page.waitForURL('**/tasks');

        // Verify overdue task appears in "Due Today" section
        await expect(page.getByText('🟡 Due Today')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_INTERACTION });
        await expect(page.getByText('Overdue Task')).toBeVisible();
    });

    test('should move completed non-recurring task to completed section', async ({ page }) => {
        // Create a non-recurring task in localStorage
        await page.evaluate(() => {
            const today = new Date();
            const tasks = [
                {
                    id: 'task-non-recurring',
                    title: 'One Time Task',
                    description: '',
                    nextDueDate: today.toISOString(),
                    reminderOffsetHours: 24,
                    notificationsEnabled: true,
                    isPredefined: false,
                    completionHistory: [],
                    createdAt: today.toISOString(),
                    updatedAt: today.toISOString(),
                },
            ];
            
            localStorage.setItem('@reef_keeper_tasks', JSON.stringify(tasks));
            localStorage.setItem('@reef_keeper_tasks_initialized', 'true');
        });

        // Reload to pick up the tasks
        await page.reload();
        await expect(page.getByText(/Maintenance/i)).toBeVisible({ timeout: TIMEOUTS.APP_READY });

        // Navigate to Tasks tab
        await page.getByRole('tab', { name: /Tasks/i }).click();
        await page.waitForURL('**/tasks');

        // Complete the task
        await expect(page.getByText('One Time Task')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_INTERACTION });
        const checkbox = await getTaskCheckbox(page, 'One Time Task');
        await checkbox.click();

        // Wait for UI to update
        await page.waitForTimeout(500);

        // Verify completed section appears
        await expect(page.getByText('✅ Completed')).toBeVisible();
    });
});
