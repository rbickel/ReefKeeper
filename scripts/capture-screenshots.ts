import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    
    // iPhone 14 Pro dimensions
    const context = await browser.newContext({
        viewport: { width: 393, height: 852 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
    });
    
    const page = await context.newPage();
    
    // Set test mode to bypass auth
    await page.goto('http://localhost:8081');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
        localStorage.setItem('@reef_keeper:test_mode', 'true');
    });
    await page.reload();
    
    // Wait for dashboard to load
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'docs/screenshots/dashboard.png', fullPage: false });
    console.log('Captured: dashboard');

    // Navigate to Tasks tab
    const tasksTab = page.getByRole('tab', { name: /Tasks/i });
    await tasksTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/screenshots/tasks.png', fullPage: false });
    console.log('Captured: tasks');

    // Navigate to Creatures tab
    const creaturesTab = page.getByRole('tab', { name: /Creatures/i });
    await creaturesTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/screenshots/creatures.png', fullPage: false });
    console.log('Captured: creatures');

    // Navigate to Add Task
    await page.goto('http://localhost:8081/task/add');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/screenshots/add-task.png', fullPage: false });
    console.log('Captured: add-task');

    // Login screen (clear test mode)
    await page.evaluate(() => {
        localStorage.removeItem('@reef_keeper:test_mode');
    });
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/screenshots/login.png', fullPage: false });
    console.log('Captured: login');

    await browser.close();
    console.log('Done! All screenshots saved to docs/screenshots/');
})();
