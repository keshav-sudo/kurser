import { Worker } from 'bullmq';
import { config } from '../config/env';
import { QUEUE_NAMES, redisConnection } from '../config/queue';
import { processWebhookEvent } from '../processors/webhookProcessor';

export function createWebhookWorker() {
  const worker = new Worker(
    QUEUE_NAMES.WEBHOOK_EVENTS,
    async (job) => {
      return await processWebhookEvent(job);
    },
    {
      connection: redisConnection,
      concurrency: config.worker.concurrency,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('❌ Worker error:', err);
  });

  console.log(`🚀 Webhook worker started with concurrency: ${config.worker.concurrency}`);

  return worker;
}
