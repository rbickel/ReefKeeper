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
        await expect(page.getByText(/Tasks/i, { exact: true })).toBeVisible();

        // 2. Verify it's in the list
        await expect(page.getByText('E2E One-off Task')).toBeVisible();

        // 3. Complete it
        const taskCard = page.locator('div, section').filter({ hasText: 'E2E One-off Task' }).last();
        // We added testID={`task-checkbox-${task.id}`} but don't have the ID.
        // Use the role="checkbox" which we saw in the snapshot.
        const checkbox = taskCard.getByRole('checkbox');
        await expect(checkbox).toBeVisible();
        await checkbox.click();

        // 4. Verify it moves to Completed section
        await expect(page.getByText(/Completed/i)).toBeVisible();
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

        const taskRow = page.locator('div, section').filter({ hasText: 'E2E Recurring Task' }).last();
        await taskRow.getByRole('checkbox').click();

        // 3. Verify "(Done today)" text appears
        await expect(page.getByText(/\(Done today\)/i)).toBeVisible();
    });
});
