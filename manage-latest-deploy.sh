#!/bin/bash

# Script to update the "latest" deployment symlink for instant rollback/promotion

PROJECT_ID="$1"
DEPLOY_ID="$2"
MOUNT_PATH="${3:-/mnt/azure-blob/deployments}"

if [ -z "$PROJECT_ID" ] || [ -z "$DEPLOY_ID" ]; then
    echo "Usage: $0 <project_id> <deploy_id> [mount_path]"
    echo ""
    echo "Example:"
    echo "  $0 64abc123def 1733234567-a8b9c 
    echo ""
    exit 1
fi

PROJECT_PATH="$MOUNT_PATH/projects/$PROJECT_ID/deploys"
DEPLOY_PATH="$PROJECT_PATH/$DEPLOY_ID"
LATEST_LINK="$PROJECT_PATH/latest"

echo "🔄 Updating latest deployment pointer"
echo "======================================"
echo "Project: $PROJECT_ID"
echo "Deploy:  $DEPLOY_ID"
echo ""

# Check if deployment exists
if [ ! -d "$DEPLOY_PATH" ]; then
    echo "❌ Deployment not found: $DEPLOY_PATH"
    exit 1
fi

# Check if latest link exists and show current
if [ -L "$LATEST_LINK" ]; then
    CURRENT=$(readlink "$LATEST_LINK")
    echo "📌 Current latest: $(basename $CURRENT)"
fi

# Remove old symlink
if [ -e "$LATEST_LINK" ]; then
    rm "$LATEST_LINK"
fi

# Create new symlink
ln -s "$DEPLOY_PATH" "$LATEST_LINK"

if [ $? -eq 0 ]; then
    echo "✅ Updated latest deployment to: $DEPLOY_ID"
    echo ""
    echo "🌍 Changes are live immediately!"
    echo "   No rebuild or restart needed"
    
    # Verify
    if [ -L "$LATEST_LINK" ]; then
        echo ""
        echo "🔗 Symlink created:"
        ls -lah "$LATEST_LINK"
    fi
else
    echo "❌ Failed to create symlink"
    exit 1
fi
