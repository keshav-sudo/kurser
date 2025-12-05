# GitHub Webhook Manager - Frontend

React-based testing application for all backend APIs.

## Features

- **GitHub OAuth Login**: Authenticate with GitHub
- **User Profile**: View logged-in user details
- **Repository Management**: 
  - Load all GitHub repositories
  - Setup webhooks for repositories
  - View tracked repositories
  - Remove webhooks
- **Webhook Events**: Monitor webhook events by repository
- **Health Check**: Test API availability

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will run on `http://localhost:3001`

## Usage

1. **Login**: Click "Login with GitHub" to authenticate
2. **Load Profile**: View your GitHub profile information
3. **Load Repositories**: Fetch all your GitHub repos
4. **Setup Webhook**: Select a repo and click "Setup Webhook"
5. **View Tracked Repos**: See all repositories with active webhooks
6. **Monitor Events**: Select a tracked repo to view webhook events
7. **Remove Webhook**: Delete webhook configuration for any repo

## API Testing

All backend endpoints can be tested through this UI:
- `/auth/github` - GitHub OAuth
- `/auth/github/callback` - OAuth callback
- `/auth/profile` - Get user profile
- `/repos` - List GitHub repos
- `/repos/tracked` - List tracked repos
- `/repos/webhook` - Setup webhook (POST)
- `/repos/webhook/:repoId` - Remove webhook (DELETE)
- `/webhook/events/:repoId` - Get webhook events
- `/health` - Health check

## Requirements

- Backend API running on `http://localhost:3000`
- Valid GitHub OAuth credentials configured in backend
- MongoDB and RabbitMQ services running

