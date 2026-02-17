# CI Failure Issue Creation Workflow

## Overview

This workflow automatically creates GitHub issues when CI pipelines fail, providing detailed failure information and assigning them to Copilot Agent for automatic fixing.

## How It Works

### Trigger

The workflow is triggered by the `workflow_run` event when any of the following workflows complete with a failure status:
- **Shared CI** (`ci.yml`)
- **Web Platform** (`web.yml`)
- **Android Platform** (`android.yml`)

### Workflow Steps

1. **Detect Failure**: The workflow only runs when `github.event.workflow_run.conclusion == 'failure'`

2. **Gather Failure Information**: The workflow collects:
   - Workflow name and run number
   - Failed job details
   - Error logs and traces
   - Commit information
   - Triggering user

3. **Check for Existing Issues**: Before creating a new issue, the workflow checks if there's already an open issue for the same workflow failure to avoid duplicates.

4. **Create or Update Issue**:
   - **New Issue**: If no existing issue is found, creates a new issue with:
     - Descriptive title indicating which workflow failed
     - Complete failure details including logs
     - Links to workflow run and commit
     - Assignment to @copilot for automatic fixing
     - Labels: `ci-failure`, `auto-created`, `bug`
   
   - **Update Existing**: If an issue already exists, adds a comment with the new failure information

## Issue Format

Each created issue includes:

### Header Information
- Workflow name
- Run number
- Branch
- Commit SHA
- Who triggered the workflow
- Number of failed jobs

### Links
- Direct link to the failed workflow run
- Direct link to the commit

### Failure Details
For each failed job:
- Job name
- Status
- Start and completion times
- Duration
- Log URL
- List of failed steps

### Copilot Assignment
The issue is assigned to @copilot with instructions to:
1. Review the failure logs
2. Identify the root cause
3. Make necessary code changes
4. Ensure all tests pass

## Benefits

1. **Automatic Detection**: No manual intervention needed when CI fails
2. **Complete Context**: All necessary information for debugging is included
3. **Automatic Assignment**: Copilot Agent can immediately start working on fixes
4. **Prevents Duplicates**: Checks for existing issues before creating new ones
5. **Traceability**: Full audit trail of failures and their resolutions

## Configuration

### Required Permissions

The workflow requires the following permissions:
- `issues: write` - To create and update issues
- `actions: read` - To read workflow run information
- `contents: read` - To checkout the repository

### Labels

The workflow uses the following labels (ensure they exist in your repository):
- `ci-failure` - Indicates this is an automated CI failure issue (red, #d73a4a)
- `auto-created` - Indicates this issue was automatically created (blue, #0366d6)
- `bug` - Indicates this is a bug that needs fixing (red, #d73a4a)

**Quick Setup**: Run the setup script to automatically create these labels:
```bash
./scripts/setup-ci-failure-labels.sh
```

This script uses the GitHub CLI (`gh`) to create the required labels. Make sure you have:
1. GitHub CLI installed ([installation instructions](https://cli.github.com/))
2. Authenticated with `gh auth login`

**Alternative - Manual Setup**: You can also create these labels manually:
1. Go to your repository on GitHub
2. Navigate to **Issues** → **Labels**
3. Click **New label** and create each label with the specified name and color

### Copilot Assignment

The workflow assigns issues to the `copilot` user. Ensure this user has appropriate access to your repository.

## Testing

To test this workflow:

1. Create a failing test or intentionally break the build
2. Push the changes to trigger CI
3. Wait for the CI workflow to fail
4. Check that an issue is automatically created with proper details

## Troubleshooting

If issues are not being created:

1. **Check Permissions**: Ensure the workflow has the required permissions
2. **Verify Labels**: Make sure the required labels exist in your repository
3. **Check Copilot User**: Verify the copilot user exists and has access
4. **Review Workflow Logs**: Check the workflow run logs for any errors

## Future Enhancements

Potential improvements:
- Add more detailed log parsing to extract specific error messages
- Integrate with Slack/Teams for notifications
- Add priority labels based on which workflow failed
- Track failure frequency and patterns
- Auto-close issues when CI passes again
