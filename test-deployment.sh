#!/bin/bash

# Quick test script for deployment system

API_URL="${1:-http://localhost:3000}"
JWT_TOKEN="$2"
PROJECT_ID="$3"

if [ -z "$JWT_TOKEN" ] || [ -z "$PROJECT_ID" ]; then
    echo "Usage: $0 [api_url] <jwt_token> <project_id>"
    echo ""
    echo "Example:"
    echo "  $0 http://localhost:3000 eyJhbGc... 64abc123def"
    echo ""
    exit 1
fi

echo "🧪 Testing Multi-Deploy System"
echo "=============================="
echo "API: $API_URL"
echo "Project: $PROJECT_ID"
echo ""

# Test 1: Create deployment
echo "1️⃣  Creating new deployment..."
DEPLOY_RESPONSE=$(curl -s -X POST "$API_URL/api/projects/$PROJECT_ID/deploy" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "main",
    "commitSha": "HEAD"
  }')

echo "$DEPLOY_RESPONSE" | jq '.'

DEPLOY_ID=$(echo "$DEPLOY_RESPONSE" | jq -r '.deployment.deployId')
echo ""
echo "✅ Deployment created: $DEPLOY_ID"
echo ""

# Wait for deployment to process
echo "2️⃣  Waiting for deployment to complete (checking every 5s)..."
for i in {1..24}; do
    sleep 5
    STATUS_RESPONSE=$(curl -s "$API_URL/api/deployments/$DEPLOY_ID" \
      -H "Authorization: Bearer $JWT_TOKEN")
    
    STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.deployment.status')
    echo "   Status: $STATUS (${i}x5s elapsed)"
    
    if [ "$STATUS" = "ready" ]; then
        echo ""
        echo "✅ Deployment ready!"
        echo "$STATUS_RESPONSE" | jq '.deployment'
        break
    elif [ "$STATUS" = "failed" ]; then
        echo ""
        echo "❌ Deployment failed!"
        echo "$STATUS_RESPONSE" | jq '.deployment'
        break
    fi
done

echo ""

# Test 2: List deployments
echo "3️⃣  Listing all deployments..."
curl -s "$API_URL/api/projects/$PROJECT_ID/deployments" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.deployments[] | {deployId, status, branch, isLatest, createdAt}'

echo ""

# Test 3: Get logs
echo "4️⃣  Fetching deployment logs..."
curl -s "$API_URL/api/deployments/$DEPLOY_ID/logs" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.'

echo ""
echo "✅ Tests complete!"
