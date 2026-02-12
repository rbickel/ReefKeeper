import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration with authentication bypass support
 * 
 * This config sets up:
 * 1. A setup project that runs before tests to handle authentication
 * 2. Storage state reuse to avoid re-authenticating for each test
 * 3. Environment variables to control test behavior
 */

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:8081',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    webServer: {
        command: 'npx expo start --web --port 8081',
        url: 'http://localhost:8081',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
    projects: [
        // Setup project - runs once before all tests
        {
            name: 'setup',
            testMatch: /.*\.setup\.ts/,
        },
        // Test project - depends on setup
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // Use the storage state from the setup project
                storageState: 'e2e/.auth/user.json',
            },
            dependencies: ['setup'],
        },
    ],
});
