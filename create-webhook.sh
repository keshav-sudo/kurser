#!/bin/bash

# 🔐 GitHub Webhook Creator Script
# Usage: ./create-webhook.sh <GITHUB_USERNAME> <REPO_NAME> <WEBHOOK_URL> <GITHUB_TOKEN>

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 GitHub Webhook Creator"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check arguments
if [ "$#" -lt 3 ]; then
    echo -e "${RED}❌ Error: Missing arguments${NC}"
    echo ""
    echo "Usage: ./create-webhook.sh <USERNAME> <REPO_NAME> <WEBHOOK_URL> [GITHUB_TOKEN]"
    echo ""
    echo "Examples:"
    echo "  ./create-webhook.sh keshav my-repo https://abc123.ngrok.io/webhook"
    echo "  ./create-webhook.sh keshav my-repo https://abc123.ngrok.io/webhook ghp_yourtoken"
    echo ""
    echo "📝 Notes:"
    echo "  - If token not provided, will check GITHUB_TOKEN env variable"
    echo "  - Get token from: https://github.com/settings/tokens"
    echo "  - Required scope: admin:repo_hook"
    exit 1
fi

USERNAME="$1"
REPO="$2"
WEBHOOK_URL="$3"
GITHUB_TOKEN="${4:-$GITHUB_TOKEN}"

# Validate token
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ Error: GitHub token not provided${NC}"
    echo ""
    echo "Set token via:"
    echo "  export GITHUB_TOKEN='ghp_yourtoken'"
    echo "Or pass as 4th argument:"
    echo "  ./create-webhook.sh $USERNAME $REPO $WEBHOOK_URL ghp_yourtoken"
    exit 1
fi

# Generate random secret for webhook
SECRET=$(openssl rand -hex 20)

echo ""
echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Repository: $USERNAME/$REPO"
echo "  Webhook URL: $WEBHOOK_URL"
echo "  Secret: $SECRET"
echo "  Events: push, pull_request"
echo ""

# Create webhook using GitHub API
echo -e "${YELLOW}🔧 Creating webhook...${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -H "Content-Type: application/json" \
  -d "{
        \"name\": \"web\",
        \"active\": true,
        \"events\": [\"push\", \"pull_request\"],
        \"config\": {
          \"url\": \"$WEBHOOK_URL\",
          \"content_type\": \"json\",
          \"secret\": \"$SECRET\",
          \"insecure_ssl\": \"0\"
        }
      }" \
  "https://api.github.com/repos/$USERNAME/$REPO/hooks")

# Extract HTTP status code and response body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

# Check response
if [ "$HTTP_CODE" -eq 201 ]; then
    HOOK_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    
    echo -e "${GREEN}✅ Webhook created successfully!${NC}"
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ WEBHOOK CREATED!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "📌 Webhook Details:"
    echo "  Hook ID: $HOOK_ID"
    echo "  Repository: https://github.com/$USERNAME/$REPO"
    echo "  Webhook URL: $WEBHOOK_URL"
    echo ""
    echo "🔐 Secret (Save this!):"
    echo "  $SECRET"
    echo ""
    echo "📝 Add this to your .env file:"
    echo "  WEBHOOK_SECRET=$SECRET"
    echo ""
    echo "🧪 Test webhook:"
    echo "  curl -X POST \\"
    echo "    -H \"Authorization: Bearer \$GITHUB_TOKEN\" \\"
    echo "    -H \"Accept: application/vnd.github+json\" \\"
    echo "    https://api.github.com/repos/$USERNAME/$REPO/hooks/$HOOK_ID/pings"
    echo ""
    echo "🌐 View webhook settings:"
    echo "  https://github.com/$USERNAME/$REPO/settings/hooks/$HOOK_ID"
    echo ""
    
    # Save secret to file
    echo "WEBHOOK_SECRET=$SECRET" > webhook-secret.env
    echo -e "${GREEN}💾 Secret saved to: webhook-secret.env${NC}"
    
    # Send test ping
    echo ""
    echo -e "${YELLOW}📡 Sending test ping...${NC}"
    PING_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
      -H "Authorization: Bearer $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github+json" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      "https://api.github.com/repos/$USERNAME/$REPO/hooks/$HOOK_ID/pings")
    
    PING_CODE=$(echo "$PING_RESPONSE" | tail -n1)
    
    if [ "$PING_CODE" -eq 204 ]; then
        echo -e "${GREEN}✅ Test ping sent successfully!${NC}"
        echo "   Check your webhook endpoint logs"
    else
        echo -e "${YELLOW}⚠️  Ping status: $PING_CODE${NC}"
    fi
    
else
    echo -e "${RED}❌ Failed to create webhook${NC}"
    echo ""
    echo "HTTP Status: $HTTP_CODE"
    echo ""
    echo "Response:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    echo ""
    
    # Common error messages
    if echo "$BODY" | grep -q "Bad credentials"; then
        echo -e "${YELLOW}💡 Possible issues:${NC}"
        echo "  - Invalid or expired GitHub token"
        echo "  - Token doesn't have required permissions"
        echo "  - Token format incorrect (should start with ghp_)"
    elif echo "$BODY" | grep -q "Not Found"; then
        echo -e "${YELLOW}💡 Possible issues:${NC}"
        echo "  - Repository $USERNAME/$REPO doesn't exist"
        echo "  - Token doesn't have access to this repository"
        echo "  - Username or repo name is incorrect"
    elif echo "$BODY" | grep -q "Hook already exists"; then
        echo -e "${YELLOW}💡 Webhook already exists for this URL${NC}"
        echo "  View existing webhooks:"
        echo "  https://github.com/$USERNAME/$REPO/settings/hooks"
    else
        echo -e "${YELLOW}💡 Check:${NC}"
        echo "  - Token has 'admin:repo_hook' permission"
        echo "  - Repository exists and you have admin access"
        echo "  - Webhook URL is valid and accessible"
    fi
    
    exit 1
fi
