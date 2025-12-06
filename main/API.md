# API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication

All authenticated endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Auth Endpoints

### 1. GitHub Login (Start OAuth)
```http
GET /auth/github
```

**Response:** Redirects to GitHub OAuth page

---

### 2. GitHub Callback (OAuth Callback)
```http
GET /auth/github/callback?code=<CODE>
```

**Response:** Redirects to frontend with JWT token
```
http://localhost:3001/auth/callback?token=<JWT_TOKEN>
```

---

### 3. Get User Profile
```http
GET /auth/profile
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "id": "user_id",
  "username": "github_username",
  "email": "user@example.com",
  "avatarUrl": "https://avatars.githubusercontent.com/...",
  "repos": ["owner/repo1", "owner/repo2"]
}
```

---

## Repository Endpoints

### 4. Get User's GitHub Repositories
```http
GET /repos
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "repos": [
    {
      "id": 123456,
      "name": "my-repo",
      "full_name": "username/my-repo",
      "private": false,
      "html_url": "https://github.com/username/my-repo",
      "description": "Repository description",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 5. Get Tracked Repositories
```http
GET /repos/tracked
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "repos": [
    {
      "_id": "repo_object_id",
      "userId": "user_object_id",
      "repoId": "123456",
      "repoName": "my-repo",
      "fullName": "username/my-repo",
      "webhookId": "webhook_id",
      "webhookUrl": "https://your-app.com/webhook",
      "isActive": true,
      "lastWebhookEvent": "2024-01-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 6. Setup Webhook for Repository
```http
POST /repos/webhook
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "repoFullName": "username/my-repo"
}
```

**Response:**
```json
{
  "message": "Webhook configured successfully",
  "repo": {
    "_id": "repo_object_id",
    "userId": "user_object_id",
    "repoId": "123456",
    "repoName": "my-repo",
    "fullName": "username/my-repo",
    "webhookId": "webhook_id",
    "webhookUrl": "https://your-app.com/webhook",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error Response:**
```json
{
  "error": "Webhook already configured for this repository"
}
```

---

### 7. Remove Webhook
```http
DELETE /repos/webhook/:repoId
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "message": "Webhook removed successfully"
}
```

---

## Webhook Endpoints

### 8. GitHub Webhook Handler (Public)
```http
POST /webhook
```

**Headers:**
```
X-GitHub-Event: push
X-GitHub-Delivery: unique-delivery-id
Content-Type: application/json
```

**Request Body:** GitHub webhook payload (varies by event type)

**Response:**
```json
{
  "message": "Webhook received",
  "eventId": "event_object_id"
}
```

---

### 9. Get Webhook Events for Repository
```http
GET /webhook/events/:repoId?status=pending&limit=50
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `status` (optional): Filter by status (pending/processing/completed/failed)
- `limit` (optional): Number of events to return (default: 50)

**Response:**
```json
{
  "events": [
    {
      "_id": "event_object_id",
      "repoId": "123456",
      "eventType": "push",
      "eventData": { /* GitHub webhook payload */ },
      "status": "completed",
      "processedAt": "2024-01-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 10. Update Event Status (Internal - for worker)
```http
PATCH /webhook/events/:eventId/status
```

**Request Body:**
```json
{
  "status": "completed",
  "error": null
}
```

**Response:**
```json
{
  "event": {
    "_id": "event_object_id",
    "repoId": "123456",
    "eventType": "push",
    "status": "completed",
    "processedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## Health Check

### 11. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Webhook Event Types

Supported GitHub events:
- `push` - Code pushed to repository
- `pull_request` - Pull request opened/closed/merged
- `issues` - Issue opened/closed/commented
- `commit_comment` - Comment on commit

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "details": "Error message"
}
```

---

## RabbitMQ Message Format

Messages published to queue:
```json
{
  "eventId": "event_object_id",
  "event": "push",
  "repoId": "123456",
  "repoFullName": "username/my-repo",
  "payload": { /* Full GitHub webhook payload */ },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Example Usage (cURL)

### Login Flow
```bash
# 1. Start OAuth (opens browser)
curl http://localhost:3000/auth/github

# 2. After authorization, get token from callback URL
# Token will be in: http://localhost:3001/auth/callback?token=<TOKEN>

# 3. Get profile
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3000/auth/profile
```

### Setup Webhook
```bash
# 1. Get repositories
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3000/repos

# 2. Setup webhook
curl -X POST \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"repoFullName": "username/my-repo"}' \
  http://localhost:3000/repos/webhook

# 3. Check tracked repos
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3000/repos/tracked
```

### Monitor Events
```bash
# Get webhook events
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3000/webhook/events/123456?status=completed&limit=10
```
