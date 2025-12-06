# Project Structure - Clean & Organized

## Directory Layout

```
main/
├── src/                    # Source TypeScript files (development)
│   ├── config/            # Configuration files
│   ├── controller/        # API controllers including webhookController
│   ├── middleware/        # Express middleware
│   ├── models/            # MongoDB models (User, Repository, WebhookEvent)
│   ├── routes/            # API routes including webhookRoutes
│   └── index.ts           # Main entry point
│
├── dist/                  # Compiled JavaScript files (production)
│   └── (mirror of src/)   # Auto-generated, DO NOT edit
│
├── node_modules/          # Dependencies
├── .env                   # Environment variables
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project dependencies
```

## Webhook Implementation

### Architecture
The webhook system is research-ready and follows best practices:

1. **Routes** (`src/routes/webhookRoutes.ts`)
   - POST `/` - Receive GitHub webhooks
   - GET `/events/:repoId` - Get webhook events for a repository
   - PATCH `/events/:eventId/status` - Update event processing status

2. **Controller** (`src/controller/webhookController.ts`)
   - `handleWebhook()` - Validates, stores, and queues webhook events
   - `getWebhookEvents()` - Retrieves event history
   - `updateEventStatus()` - Updates processing status

3. **Model** (`src/models/WebhookEvent.ts`)
   - Stores webhook events with status tracking
   - Fields: repoId, eventType, eventData, status, timestamps

### Webhook Flow
```
GitHub → POST /webhooks → handleWebhook() → Save to DB → RabbitMQ → Worker Processing
```

## Build & Development

### Development
```bash
npm run dev    # Start with hot-reload
```

### Production Build
```bash
npm run build  # Compile TypeScript to dist/
npm start      # Run from dist/
```

## TypeScript Configuration

- **rootDir**: `./src` - Only TypeScript source files
- **outDir**: `./dist` - Only compiled JavaScript files
- **Strict mode**: Enabled with type checking
- **Source maps**: Enabled for debugging

## Important Notes

1. **NEVER edit files in `dist/`** - They are auto-generated
2. **Only edit `.ts` files in `src/`** - Then rebuild
3. **`.gitignore` prevents** compiled files in src/
4. **Webhook events** are queued to RabbitMQ for async processing
5. **Research-ready**: Full event tracking and status management

## Cleanup Done

✅ Removed all `.js`, `.js.map`, `.d.ts` files from `src/`
✅ Rebuilt clean `dist/` folder from TypeScript sources
✅ Updated `.gitignore` to prevent future conflicts
✅ Verified webhook implementation is properly structured
✅ TypeScript config properly separates src/ and dist/
