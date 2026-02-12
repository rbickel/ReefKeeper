import { test as setup } from '@playwright/test';

/**
 * Auth setup for Playwright tests
 * 
 * This file runs once before all tests to handle authentication.
 * 
 * Current implementation:
 * - Sets a test mode flag in localStorage
 * - This flag can be checked by AuthGuard to bypass authentication
 * 
 * When authentication is added, update this to:
 * 1. Navigate to login page
 * 2. Fill in test credentials from environment variables
 * 3. Save the authenticated state (cookies, localStorage)
 * 
 * Example implementation when auth is added:
 * 
 *   await page.goto('/login');
 *   await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
 *   await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!);
 *   await page.getByRole('button', { name: /log in/i }).click();
 *   await page.waitForURL('/');
 *   await page.context().storageState({ path: authFile });
 */

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for app to be ready
    await page.waitForLoadState('networkidle');
    
    // Set test mode flag in localStorage
    // This can be used by the app to bypass authentication checks
    await page.evaluate(() => {
        localStorage.setItem('@reef_keeper:test_mode', 'true');
    });
    
    // Save the storage state for reuse in tests
    await page.context().storageState({ path: authFile });
});
