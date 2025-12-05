import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { connectDB } from './config/mongodb.js';
import authRoutes from './routes/authRoutes.js';
import repoRoutes from './routes/repoRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import deploymentRoutes from './routes/deploymentRoutes.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontend.url === '*' ? '*' : config.frontend.url,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  if (req.method === 'POST' && req.path === '/webhook') {
    console.log('🎯 Webhook event:', req.headers['x-github-event']);
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/repos', repoRoutes);
app.use('/webhook', webhookRoutes);
app.use('/api', deploymentRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Initialize connections and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start server
    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      console.log(`📊 Redis: ${config.redis.host}:${config.redis.port}`);
      console.log(`🗄️  MongoDB: Connected`);
    });
    
    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n👋 Shutting down gracefully...');
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
