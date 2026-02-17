# Testing the CI Failure Issue Creation Workflow

This guide explains how to test the CI failure issue creation workflow to ensure it works correctly in your repository.

## Prerequisites

Before testing, ensure you have:
1. The workflow file committed to `.github/workflows/create-issue-on-failure.yml`
2. The required labels created in your repository (run `./scripts/setup-ci-failure-labels.sh` or create them manually)
3. Appropriate permissions for the workflow (issues: write, actions: read, contents: read)

## Testing Methods

### Method 1: Intentional Test Failure (Recommended for Testing)

This method creates a temporary failing test that you can easily revert.

1. **Create a failing test:**
   ```bash
   # Create a simple failing test
   cat > __tests__/test-ci-failure.test.ts << 'EOF'
   describe('CI Failure Test', () => {
     it('should fail to test CI failure workflow', () => {
       expect(true).toBe(false); // Intentional failure
     });
   });
   EOF
   ```

2. **Commit and push:**
   ```bash
   git add __tests__/test-ci-failure.test.ts
   git commit -m "test: Add intentional failing test to verify CI failure workflow"
   git push
   ```

3. **Wait for CI to fail:**
   - Go to the Actions tab in your GitHub repository
   - Wait for the Shared CI workflow to fail
   - The "Create Issue on CI Failure" workflow should trigger automatically

4. **Verify the issue was created:**
   - Go to the Issues tab
   - Look for an issue titled "CI Failure: Shared CI (Run #...)"
   - Verify it contains:
     - Workflow name and run number
     - Branch and commit information
     - Links to the workflow run and commit
     - Detailed failure information
     - Assignment to @copilot (if available)
     - Labels: ci-failure, auto-created, bug

5. **Clean up:**
   ```bash
   git rm __tests__/test-ci-failure.test.ts
   git commit -m "test: Remove intentional failing test"
   git push
   ```

### Method 2: Type Error (Quick Test)

1. **Introduce a TypeScript error:**
   ```bash
   # Add a type error to any TypeScript file
   echo "const invalidCode: string = 123;" >> app/(tabs)/index.tsx
   git add app/(tabs)/index.tsx
   git commit -m "test: Add type error to test CI failure workflow"
   git push
   ```

2. **Wait for CI to fail** at the TypeScript type-check step

3. **Verify the issue** (same as Method 1, step 4)

4. **Clean up:**
   ```bash
   git checkout HEAD~1 -- app/(tabs)/index.tsx
   git commit -m "test: Revert type error"
   git push
   ```

### Method 3: Lint Error

1. **Introduce a lint error:**
   ```bash
   # Add a lint error to any file
   echo "var unused = 'test';" >> app/(tabs)/index.tsx
   git add app/(tabs)/index.tsx
   git commit -m "test: Add lint error to test CI failure workflow"
   git push
   ```

2. **Wait for CI to fail** at the lint check step

3. **Verify the issue** (same as Method 1, step 4)

4. **Clean up:**
   ```bash
   git checkout HEAD~1 -- app/(tabs)/index.tsx
   git commit -m "test: Revert lint error"
   git push
   ```

## Testing Duplicate Detection

To test that the workflow doesn't create duplicate issues:

1. **Create the first failure** using any method above
2. **Wait for the issue to be created**
3. **Create another failure** in the same workflow (e.g., commit another failing test)
4. **Verify behavior:**
   - The workflow should NOT create a new issue
   - It should add a comment to the existing issue with the new failure information

## Testing Different Workflows

The workflow monitors three different CI pipelines. To test each:

### Testing Shared CI Failure
- Use any of the methods above (test failure, type error, or lint error)
- Triggers on: Every push and PR to main

### Testing Web Platform Failure
- Requires pushing to main branch or creating a version tag
- Could fail at: web-build or web-e2e steps
- Example: Break Playwright tests

### Testing Android Platform Failure
- Requires pushing to main branch or creating a version tag
- Could fail at: android-build or android-test steps
- Example: Break Maestro tests or Android build configuration

## What to Verify

For each test, verify that the created issue contains:

✅ **Correct Title Format:**
- `CI Failure: [Workflow Name] (Run #[Number])`

✅ **Complete Information:**
- Workflow name
- Run number
- Branch name
- Commit SHA (short version for display)
- Who triggered the workflow
- Number of failed jobs

✅ **Working Links:**
- Link to workflow run (should open the failed run)
- Link to commit (should open the specific commit)

✅ **Failure Details:**
- List of failed jobs
- Failed steps within each job
- Log URLs for each failed job

✅ **Proper Labeling:**
- Labels: ci-failure, auto-created, bug

✅ **Copilot Assignment:**
- If copilot user exists: Should be assigned
- If copilot user doesn't exist: Issue created without assignee (workflow logs should show warning)

## Troubleshooting Test Failures

If the issue is not created:

1. **Check workflow permissions:**
   - Go to Settings → Actions → General
   - Ensure "Read and write permissions" is enabled for workflows

2. **Check the workflow run:**
   - Go to Actions tab
   - Look for "Create Issue on CI Failure" workflow
   - Check the logs for any errors

3. **Verify labels exist:**
   - Run `./scripts/setup-ci-failure-labels.sh`
   - Or create them manually in Settings → Labels

4. **Check workflow file:**
   - Ensure `.github/workflows/create-issue-on-failure.yml` exists
   - Validate with: `yamllint .github/workflows/create-issue-on-failure.yml`

## After Testing

Once you've verified the workflow works correctly:

1. Close the test issue(s) created
2. Remove any intentional failures from the codebase
3. The workflow is now ready for production use!

## Notes

- The workflow only triggers when monitored workflows (Shared CI, Web Platform, Android Platform) complete with a failure status
- Manual workflow runs or workflow_dispatch events will also trigger the issue creation if they fail
- Issues are automatically assigned to @copilot - ensure this user has appropriate repository access
