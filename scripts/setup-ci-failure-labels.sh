#!/bin/bash
# Script to create required labels for CI failure workflow
# Usage: ./scripts/setup-ci-failure-labels.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Setting up labels for CI failure workflow..."

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub CLI${NC}"
    echo "Please run: gh auth login"
    exit 1
fi

echo -e "${GREEN}Creating labels...${NC}"

# Create ci-failure label
if gh label create "ci-failure" \
    --description "Indicates an automated CI pipeline failure" \
    --color "d73a4a" 2>/dev/null; then
    echo -e "${GREEN}✓ Created label: ci-failure${NC}"
else
    echo -e "${YELLOW}⚠ Label 'ci-failure' already exists${NC}"
fi

# Create auto-created label
if gh label create "auto-created" \
    --description "Issue was automatically created by a workflow" \
    --color "0366d6" 2>/dev/null; then
    echo -e "${GREEN}✓ Created label: auto-created${NC}"
else
    echo -e "${YELLOW}⚠ Label 'auto-created' already exists${NC}"
fi

# Check if bug label exists (it usually does by default)
# gh label list output format: "label-name\tdescription\tcolor"
if ! gh label list | grep -q "^bug"$'\t'; then
    if gh label create "bug" \
        --description "Something isn't working" \
        --color "d73a4a" 2>/dev/null; then
        echo -e "${GREEN}✓ Created label: bug${NC}"
    fi
else
    echo -e "${GREEN}✓ Label 'bug' already exists${NC}"
fi

echo ""
echo -e "${GREEN}Label setup complete!${NC}"
echo ""
echo "The following labels are now available:"
echo "  • ci-failure (red) - Indicates an automated CI pipeline failure"
echo "  • auto-created (blue) - Issue was automatically created by a workflow"
echo "  • bug (red) - Something isn't working"
echo ""
echo -e "${YELLOW}Note:${NC} The CI failure workflow assigns issues to @copilot."
echo "Make sure the copilot user has appropriate access to this repository."
