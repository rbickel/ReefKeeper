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

test.describe('Task Lifecycle', () => {
    test.beforeEach(async ({ page }) => {
        // Pipe console logs to terminal for debugging
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

        await page.goto('/');

        // Clear state for fresh test
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Wait for the app to be ready
        await expect(page.getByText(/Maintenance/i)).toBeVisible({ timeout: TIMEOUTS.APP_READY });
    });

    test('should create and complete a non-recurring task', async ({ page }) => {
        // 1. Add Task from Dashboard
        const addTaskBtn = page.getByRole('button', { name: /Add Task/i });
        await expect(addTaskBtn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
        await addTaskBtn.click();

        await page.waitForURL('**/task/add');
        await expect(page.getByTestId('task-name-input')).toBeVisible();

        // Fill form
        await page.getByTestId('task-name-input').fill('E2E One-off Task');

        // Toggle Repeating Task OFF
        await page.getByTestId('task-recurring-switch').click();

        await page.getByTestId('save-task-button').click();

        // Navigate to Tasks tab
        await page.getByRole('tab', { name: /Tasks/i }).click();
        await page.waitForURL('**/tasks');
        await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();

        // 2. Verify it's in the list
        await expect(page.getByText('E2E One-off Task')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_INTERACTION });

        // 3. Complete it using helper function
        const checkbox = await getTaskCheckbox(page, 'E2E One-off Task');
        await checkbox.click();

        // 4. Verify it moves to Completed section
        await expect(page.getByText('✅ Completed')).toBeVisible();
    });

    test('should create and reschedule a recurring task', async ({ page }) => {
        const addTaskBtn = page.getByRole('button', { name: /Add Task/i });
        await addTaskBtn.click();

        await page.waitForURL('**/task/add');
        await expect(page.getByTestId('task-name-input')).toBeVisible();

        await page.getByTestId('task-name-input').fill('E2E Recurring Task');
        await page.getByTestId('save-task-button').click();

        await page.getByRole('tab', { name: /Tasks/i }).click();
        await page.waitForURL('**/tasks');

        // Wait for the task to appear in the list
        await expect(page.getByText('E2E Recurring Task')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
        
        // Complete it using helper function
        const checkbox = await getTaskCheckbox(page, 'E2E Recurring Task');
        await checkbox.click();

        // 3. Verify "(Done today)" text appears
        await expect(page.getByText(/\(Done today\)/i)).toBeVisible();
    });
});
