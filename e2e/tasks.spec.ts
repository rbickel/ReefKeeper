import { test, expect } from '@playwright/test';

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
        await expect(page.getByText(/Maintenance/i)).toBeVisible({ timeout: 20000 });
    });

    test('should create and complete a non-recurring task', async ({ page }) => {
        // 1. Add Task from Dashboard
        const addTaskBtn = page.getByRole('button', { name: /Add Task/i });
        await expect(addTaskBtn).toBeVisible({ timeout: 15000 });
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
        await expect(page.getByText('E2E One-off Task')).toBeVisible({ timeout: 10000 });

        // 3. Complete it - use a more reliable selector
        // The checkbox is within the same card as the task title
        const taskText = page.getByText('E2E One-off Task', { exact: true });
        await taskText.waitFor({ state: 'visible', timeout: 5000 });
        
        // Navigate to the checkbox: go up to the card container, then find the checkbox
        const checkbox = page.locator('div').filter({ has: taskText }).getByRole('checkbox').first();
        await expect(checkbox).toBeVisible({ timeout: 5000 });
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
        await expect(page.getByText('E2E Recurring Task')).toBeVisible({ timeout: 15000 });
        
        // Find the checkbox within the same card as the task title
        const taskText = page.getByText('E2E Recurring Task', { exact: true });
        await taskText.waitFor({ state: 'visible', timeout: 5000 });
        
        const checkbox = page.locator('div').filter({ has: taskText }).getByRole('checkbox').first();
        await expect(checkbox).toBeVisible({ timeout: 10000 });
        await checkbox.click();

        // 3. Verify "(Done today)" text appears
        await expect(page.getByText(/\(Done today\)/i)).toBeVisible();
    });
});
