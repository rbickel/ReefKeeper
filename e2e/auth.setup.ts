import { test as setup } from '@playwright/test';

/**
 * Auth setup for Playwright tests
 * 
 * This file runs once before all tests to handle authentication.
 * When authentication is added to the app, update this file to:
 * 1. Navigate to login page
 * 2. Fill in test credentials
 * 3. Save the authenticated state
 * 
 * For now, it sets a flag in localStorage to indicate test mode.
 */

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Set test mode flag in localStorage
    // This can be used by the app to bypass authentication checks
    await page.evaluate(() => {
        localStorage.setItem('@reef_keeper:test_mode', 'true');
    });
    
    // Wait for app to be ready
    await page.waitForTimeout(2000);
    
    // Save the storage state for reuse in tests
    await page.context().storageState({ path: authFile });
});
