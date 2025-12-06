import { Worker, Job } from 'bullmq';
import { config } from '../config/env';
import { processDeployment } from '../processors/deploymentProcessor';

const deploymentWorker = new Worker(
  'deployments',
  async (job: Job) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 DEPLOYMENT WORKER - Job ${job.id}`);
    console.log(`${'='.repeat(60)}\n`);
    
    return await processDeployment(job);
  },
  {
    connection: {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    },
    concurrency: config.worker.concurrency,
    limiter: {
      max: 3, // Max 3 concurrent deployments
      duration: 1000,
    },
  }
);

deploymentWorker.on('completed', (job: Job, result: any) => {
  console.log(`\n✅ Deployment job ${job.id} completed`);
  console.log(`   Deploy ID: ${result.deploymentId}`);
  console.log(`   Build time: ${result.buildTime}s`);
});

deploymentWorker.on('failed', (job: Job | undefined, error: Error) => {
  console.error(`\n❌ Deployment job ${job?.id} failed:`, error.message);
});

deploymentWorker.on('error', (error: Error) => {
  console.error('❌ Deployment worker error:', error);
});

console.log('🚀 Deployment worker started');

export default deploymentWorker;
