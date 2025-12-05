import { config } from './config/env';
import { closeQueues } from './config/queue';
import { createWebhookWorker } from './workers/webhookWorker';
import { createRepoCloneWorker } from './workers/repoCloneWorker';
import { createRepoAnalysisWorker } from './workers/repoAnalysisWorker';
import deploymentWorker from './workers/deploymentWorker';

console.log('🚀 Starting Kurser Worker Service...');
console.log(`📝 Worker Name: ${config.worker.name}`);
console.log(`⚙️  Concurrency: ${config.worker.concurrency}`);
console.log(`🔗 Redis: ${config.redis.host}:${config.redis.port}`);
console.log(`📁 Clone Directory: ${config.cloneDir}`);

// Create all workers
const webhookWorker = createWebhookWorker();
const repoCloneWorker = createRepoCloneWorker();
const repoAnalysisWorker = createRepoAnalysisWorker();

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down worker service...');
  
  try {
    await webhookWorker.close();
    await repoCloneWorker.close();
    await repoAnalysisWorker.close();
    await deploymentWorker.close();
    await closeQueues();
    
    console.log('✅ Worker service stopped gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  shutdown();
});

console.log('✅ Worker service started successfully');
console.log('📊 Monitoring queues for jobs...\n');
