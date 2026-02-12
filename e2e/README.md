# E2E Testing with Playwright

## Authentication Bypass for Tests

This project uses Playwright's **storage state** feature to handle authentication in tests. This is an industry-standard approach that allows tests to bypass login flows.

### How It Works

1. **Setup Phase** (`auth.setup.ts`):
   - Runs once before all tests
   - Sets a test mode flag in localStorage
   - Saves the browser state (cookies, localStorage) for reuse

2. **Test Phase** (all `*.spec.ts` files):
   - Each test starts with the saved storage state
   - Tests can access the app without logging in
   - Test mode flag allows the app to bypass authentication checks

### Current Implementation

Since the app doesn't have authentication yet, the setup currently:
- Sets `@reef_keeper:test_mode` flag in localStorage
- Saves the storage state for tests to reuse

### When Authentication is Added

Update `e2e/auth.setup.ts` to:

```typescript
setup('authenticate', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in test credentials
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: /log in/i }).click();
    
    // Wait for authentication to complete
    await page.waitForURL('/');
    
    // Save the authenticated state
    await page.context().storageState({ path: authFile });
});
```

### Alternative: Environment Variable Bypass

You can also check for the test mode flag in your authentication guard:

```typescript
// In your auth guard component
const isTestMode = typeof window !== 'undefined' && 
                   localStorage.getItem('@reef_keeper:test_mode') === 'true';

if (isTestMode) {
    // Skip authentication in test mode
    return <>{children}</>;
}

// Normal authentication logic...
```

### Running Tests

```bash
# Start the development server
npm run web

# In another terminal, run tests
npx playwright test

# Run tests in UI mode for debugging
npx playwright test --ui

# Run specific test file
npx playwright test tasks.spec.ts
```

### Test Credentials

When authentication is added, create test credentials and store them securely:

1. **Local Development**: Use a `.env.local` file (already in .gitignore)
   ```
   TEST_USER_EMAIL=test.user@example.com
   TEST_USER_PASSWORD=Test-SecureP@ssw0rd-2024!
   ```

2. **CI/CD**: Add these as secrets in your CI environment

### Best Practices

1. **Use a dedicated test user**: Don't use production user accounts for testing
2. **Keep credentials secure**: Never commit credentials to the repository
3. **Reuse storage state**: The setup project saves state, all tests reuse it
4. **Reset state between test runs**: The setup project runs fresh each time

### Troubleshooting

**Tests fail with "not authenticated" errors:**
- Ensure `npm run web` is running
- Check that `auth.setup.ts` completed successfully
- Verify the `.auth/user.json` file was created

**Storage state not persisting:**
- Check file permissions on `e2e/.auth/` directory
- Ensure Playwright config has `dependencies: ['setup']` set

**Want to see auth flow in action:**
- Run `npx playwright test --project=setup --ui` to debug the setup project
- Check browser DevTools → Application → Local Storage during setup
