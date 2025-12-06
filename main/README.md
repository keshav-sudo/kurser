# Kurser Main Service

Main API service for GitHub webhook integration with OAuth authentication, RabbitMQ event streaming, and MongoDB storage.

## Features

- ✅ GitHub OAuth authentication
- ✅ Repository webhook management
- ✅ Webhook event capture and queuing
- ✅ RabbitMQ event streaming to worker service
- ✅ MongoDB data persistence
- ✅ Redis support for caching
- ✅ Docker containerization
- ✅ TypeScript with full type safety

## Architecture

```
User → GitHub OAuth → Main Service → RabbitMQ → Worker Service
                     ↓
                  MongoDB (Events, Users, Repos)
```

## Setup

### 1. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `GITHUB_CLIENT_ID` - GitHub OAuth App Client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth App Secret
- `GITHUB_CALLBACK_URL` - OAuth callback URL
- `JWT_SECRET` - Secret for JWT token generation
- `MONGODB_URI` - MongoDB connection string
- `RABBITMQ_HOST`, `RABBITMQ_PORT` - RabbitMQ configuration

### 2. GitHub OAuth App Setup

1. Go to GitHub Settings → Developer Settings → OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/auth/github/callback`
4. Copy Client ID and Secret to `.env`

### 3. Run with Docker Compose

```bash
# Start all services (MongoDB, RabbitMQ, Redis, Main API)
docker-compose up -d

# View logs
docker-compose logs -f main

# Stop services
docker-compose down
```

### 4. Run Locally (Development)

```bash
# Install dependencies
npm install

# Start MongoDB and RabbitMQ via Docker
docker-compose up -d mongodb rabbitmq redis

# Run in development mode
npm run dev

# Build for production
npm run build
npm start
```

## API Endpoints

### Authentication
- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/github/callback` - OAuth callback
- `GET /auth/profile` - Get user profile (requires auth)

### Repositories
- `GET /repos` - Get user's GitHub repositories
- `GET /repos/tracked` - Get tracked repositories
- `POST /repos/webhook` - Setup webhook for repository
- `DELETE /repos/webhook/:repoId` - Remove webhook

### Webhooks
- `POST /webhook` - GitHub webhook endpoint (public)
- `GET /webhook/events/:repoId` - Get webhook events
- `PATCH /webhook/events/:eventId/status` - Update event status

### Health
- `GET /health` - Health check

## Authentication Flow

1. User clicks login → `/auth/github`
2. GitHub authorization screen appears
3. User authorizes → callback to `/auth/github/callback`
4. Server exchanges code for access token
5. User data saved to MongoDB
6. JWT token generated and sent to frontend
7. Frontend uses JWT for authenticated requests

## Webhook Flow

1. User sets up webhook via `/repos/webhook`
2. Main service creates webhook on GitHub using OAuth token
3. GitHub sends events → `/webhook` endpoint
4. Event saved to MongoDB with status 'pending'
5. Event published to RabbitMQ queue
6. Worker service consumes from queue and processes
7. Worker updates event status via `/webhook/events/:eventId/status`

## Database Schema

### User
- githubId, username, email, accessToken
- avatarUrl, repos[]
- timestamps

### Repository
- userId, repoId, repoName, fullName
- webhookId, webhookUrl, isActive
- lastWebhookEvent, timestamps

### WebhookEvent
- repoId, eventType, eventData
- status (pending/processing/completed/failed)
- error, processedAt, timestamps

## Development

```bash
# Watch mode
npm run dev

# Build TypeScript
npm run build

# Production
npm start
```

## Docker

```bash
# Build image
docker build -t kurser-main .

# Run container
docker run -p 3000:3000 --env-file .env kurser-main
```

## RabbitMQ Management

Access RabbitMQ management UI: http://localhost:15672
- Username: guest
- Password: guest

## Monitoring

- **Main API**: http://localhost:3000/health
- **RabbitMQ**: http://localhost:15672
- **MongoDB**: mongodb://localhost:27017
- **Redis**: redis://localhost:6379

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection | mongodb://localhost:27017/kurser |
| RABBITMQ_HOST | RabbitMQ host | localhost |
| RABBITMQ_PORT | RabbitMQ port | 5672 |
| GITHUB_CLIENT_ID | GitHub OAuth Client ID | - |
| GITHUB_CLIENT_SECRET | GitHub OAuth Secret | - |
| JWT_SECRET | JWT signing secret | - |

## Troubleshooting

### RabbitMQ connection failed
- Ensure RabbitMQ is running: `docker-compose ps`
- Check logs: `docker-compose logs rabbitmq`

### MongoDB connection failed
- Verify MongoDB is running: `docker-compose ps`
- Check connection string in `.env`

### GitHub webhook not receiving events
- Verify `PUBLIC_URL` is accessible from GitHub
- Use ngrok for local development: `ngrok http 3000`
- Update webhook URL in GitHub repo settings

## Production Deployment (Vercel)

For Vercel deployment, use serverless functions. See `vercel.json` configuration.

## License

MIT
