import { test, expect, Page } from '@playwright/test';

// Helper timeout constants
const TIMEOUTS = {
    APP_READY: 20000,
    ELEMENT_VISIBLE: 15000,
    ELEMENT_INTERACTION: 10000,
    SHORT: 5000,
};

test.describe('Creature CRUD Operations', () => {
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

    test('should create a new fish creature', async ({ page }) => {
        // Navigate to Creatures tab
        await page.getByRole('tab', { name: /Creatures/i }).click();
        await page.waitForURL('**/creatures');

        // Click Add button (FAB)
        const addButton = page.getByTestId('add-creature-fab');
        await expect(addButton).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
        await addButton.click();

        await page.waitForURL('**/creature/add');

        // Fill creature details
        await page.getByPlaceholder(/e\.g\. Nemo/i).fill('Clownfish Nemo');
        await page.getByPlaceholder(/e\.g\. Amphiprion/i).fill('Amphiprion ocellaris');
        
        // Fish type is selected by default - just verify the button is visible
        await expect(page.getByRole('button', { name: /🐠 Fish/i })).toBeVisible();
        
        // Fill quantity using the dedicated test ID for robustness
        await page.getByTestId('creature-quantity-input').fill('2');
        await page.getByPlaceholder(/additional notes/i).fill('Beautiful orange and white coloring');

        // Save the creature
        await page.getByRole('button', { name: /Save Creature/i }).click();

        // Should navigate back to creatures list
        await page.waitForURL('**/creatures');

        // Verify creature appears in the list
        await expect(page.getByText('Clownfish Nemo')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_INTERACTION });
        await expect(page.getByText('Amphiprion ocellaris')).toBeVisible();
    });

    test('should create creatures of different types', async ({ page }) => {
        // Navigate to Creatures tab
        await page.getByRole('tab', { name: /Creatures/i }).click();
        await page.waitForURL('**/creatures');

        // Create a Coral (use unique name to avoid collisions with defaults)
        await page.getByTestId('add-creature-fab').click();
        await page.waitForURL('**/creature/add');
        await page.getByPlaceholder(/e\.g\. Nemo/i).fill('Test Hammer Colony');
        await page.getByPlaceholder(/e\.g\. Amphiprion/i).fill('Euphyllia ancora');
        await page.getByRole('button', { name: /🪸 Coral/i }).click();
        await page.getByRole('button', { name: /Save Creature/i }).click();
        await page.waitForURL('**/creatures');
        await expect(page.getByText('Test Hammer Colony').first()).toBeVisible({ timeout: TIMEOUTS.ELEMENT_INTERACTION });

        // Create an Invertebrate (use unique name)
        await page.getByTestId('add-creature-fab').click();
        await page.waitForURL('**/creature/add');
        await page.getByPlaceholder(/e\.g\. Nemo/i).fill('Test Cleaner Shrimp');
        await page.getByPlaceholder(/e\.g\. Amphiprion/i).fill('Lysmata amboinensis');
        await page.getByRole('button', { name: /🦀 Invert/i }).click();
        await page.getByRole('button', { name: /Save Creature/i }).click();
        await page.waitForURL('**/creatures');
        await expect(page.getByText('Test Cleaner Shrimp').first()).toBeVisible({ timeout: TIMEOUTS.ELEMENT_INTERACTION });

        // Verify all creatures are visible (use .first() to handle potential duplicates)
        await expect(page.getByText('Test Hammer Colony').first()).toBeVisible();
        await expect(page.getByText('Test Cleaner Shrimp').first()).toBeVisible();
    });

    test('should view creature details', async ({ page }) => {
        // Navigate to Creatures tab and create a creature
        await page.getByRole('tab', { name: /Creatures/i }).click();
        await page.waitForURL('**/creatures');
        
        await page.getByTestId('add-creature-fab').click();
        await page.waitForURL('**/creature/add');
        await page.getByPlaceholder(/e\.g\. Nemo/i).fill('Tang Blue');
        await page.getByPlaceholder(/e\.g\. Amphiprion/i).fill('Paracanthurus hepatus');
        await page.getByTestId('creature-quantity-input').fill('1');
        await page.getByPlaceholder(/additional notes/i).fill('Needs lots of swimming space');
        await page.getByRole('button', { name: /Save Creature/i }).click();
        await page.waitForURL('**/creatures');

        // Click on the creature to view details
        await page.getByText('Tang Blue').click();
        
        // Verify we're on the detail page
        await expect(page).toHaveURL(/\/creature\/[^/]+$/);
        
        // Verify details are displayed (use .last() to get visible element - React Native Web renders hidden duplicates)
        await expect(page.getByText('Tang Blue').last()).toBeVisible();
        await expect(page.getByText('Paracanthurus hepatus').last()).toBeVisible();
        await expect(page.getByText('🐠 Fish').last()).toBeVisible();
        await expect(page.getByText('Needs lots of swimming space').last()).toBeVisible();
    });

    test('should edit a creature', async ({ page }) => {
        // Navigate to Creatures tab and create a creature
        await page.getByRole('tab', { name: /Creatures/i }).click();
        await page.waitForURL('**/creatures');
        
        await page.getByTestId('add-creature-fab').click();
        await page.waitForURL('**/creature/add');
        await page.getByPlaceholder(/e\.g\. Nemo/i).fill('Original Name');
        await page.getByPlaceholder(/e\.g\. Amphiprion/i).fill('Original Species');
        await page.getByRole('button', { name: /Save Creature/i }).click();
        await page.waitForURL('**/creatures');

        // Click on the creature to view details
        await page.getByText('Original Name').click();
        
        // Click Edit button
        await page.getByRole('button', { name: /Edit Creature/i }).click();
        await expect(page).toHaveURL(/\/creature\/edit\/[^/]+$/);
        
        // Edit the creature
        await page.getByPlaceholder(/e\.g\. Nemo/i).fill('Updated Name');
        await page.getByPlaceholder(/e\.g\. Amphiprion/i).fill('Updated Species');
        await page.getByTestId('creature-quantity-input').fill('3');
        await page.getByRole('button', { name: /🪸 Coral/i }).click();
        
        // Save changes
        await page.getByRole('button', { name: /Save Changes/i }).click();
        
        // Should navigate back to detail page
        await expect(page).toHaveURL(/\/creature\/[^/]+$/);
        
        // Verify updated details (use .last() to get visible element)
        await expect(page.getByText('Updated Name').last()).toBeVisible({ timeout: TIMEOUTS.ELEMENT_INTERACTION });
        await expect(page.getByText('Updated Species').last()).toBeVisible();
        await expect(page.getByText('🪸 Coral').last()).toBeVisible();
    });

    test('should archive a creature', async ({ page }) => {
        // Navigate to Creatures tab and create a creature
        await page.getByRole('tab', { name: /Creatures/i }).click();
        await page.waitForURL('**/creatures');
        
        await page.getByTestId('add-creature-fab').click();
        await page.waitForURL('**/creature/add');
        await page.getByPlaceholder(/e\.g\. Nemo/i).fill('To Be Archived');
        await page.getByPlaceholder(/e\.g\. Amphiprion/i).fill('Test Species');
        await page.getByRole('button', { name: /Save Creature/i }).click();
        await page.waitForURL('**/creatures');

        // Verify creature is in the list
        await expect(page.getByText('To Be Archived')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_INTERACTION });

        // Click on the creature to view details
        await page.getByText('To Be Archived').click();
        
        // Archive the creature
        await page.getByRole('button', { name: /Archive Creature/i }).click();
        
        // Should navigate back to creatures list
        await page.waitForURL('**/creatures');
        
        // Creature should not be visible (archived creatures are filtered out)
        await expect(page.getByText('To Be Archived')).not.toBeVisible();
    });

    test('should search and filter creatures', async ({ page }) => {
        // Navigate to Creatures tab and create multiple creatures
        await page.getByRole('tab', { name: /Creatures/i }).click();
        await page.waitForURL('**/creatures');
        
        // Create fish
        await page.getByTestId('add-creature-fab').click();
        await page.waitForURL('**/creature/add');
        await page.getByPlaceholder(/e\.g\. Nemo/i).fill('Goldfish');
        await page.getByPlaceholder(/e\.g\. Amphiprion/i).fill('Carassius auratus');
        await page.getByRole('button', { name: /Save Creature/i }).click();
        await page.waitForURL('**/creatures');
        
        // Create coral
        await page.getByTestId('add-creature-fab').click();
        await page.waitForURL('**/creature/add');
        await page.getByPlaceholder(/e\.g\. Nemo/i).fill('Brain Coral');
        await page.getByPlaceholder(/e\.g\. Amphiprion/i).fill('Diploria labyrinthiformis');
        await page.getByRole('button', { name: /🪸 Coral/i }).click();
        await page.getByRole('button', { name: /Save Creature/i }).click();
        await page.waitForURL('**/creatures');

        // Both should be visible initially
        await expect(page.getByText('Goldfish')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_INTERACTION });
        await expect(page.getByText('Brain Coral')).toBeVisible();

        // Filter by Fish type
        await page.getByRole('button', { name: /🐠 Fish/i }).click();
        await expect(page.getByText('Goldfish')).toBeVisible();
        await expect(page.getByText('Brain Coral')).not.toBeVisible();

        // Filter by Coral type
        await page.getByRole('button', { name: /🪸 Coral/i }).click();
        await expect(page.getByText('Brain Coral')).toBeVisible();
        await expect(page.getByText('Goldfish')).not.toBeVisible();

        // Show all
        await page.getByRole('button', { name: /🌊 All/i }).click();
        await expect(page.getByText('Goldfish')).toBeVisible();
        await expect(page.getByText('Brain Coral')).toBeVisible();

        // Test search
        const searchBar = page.getByPlaceholder(/Search creatures/i);
        await searchBar.fill('Brain');
        await expect(page.getByText('Brain Coral')).toBeVisible();
        await expect(page.getByText('Goldfish')).not.toBeVisible();
    });

    test('should require name and species to save creature', async ({ page }) => {
        // Navigate to Creatures tab
        await page.getByRole('tab', { name: /Creatures/i }).click();
        await page.waitForURL('**/creatures');
        
        await page.getByTestId('add-creature-fab').click();
        await page.waitForURL('**/creature/add');

        // Save button should be disabled without required fields
        const saveButton = page.getByRole('button', { name: /Save Creature/i });
        await expect(saveButton).toBeDisabled();

        // Fill only name
        await page.getByPlaceholder(/e\.g\. Nemo/i).fill('Test Name');
        await expect(saveButton).toBeDisabled();

        // Fill species too
        await page.getByPlaceholder(/e\.g\. Amphiprion/i).fill('Test Species');
        await expect(saveButton).toBeEnabled();
    });
});
