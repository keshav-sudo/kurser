import { Worker } from 'bullmq';
import { config } from '../config/env';
import { QUEUE_NAMES, redisConnection } from '../config/queue';
import { processRepoClone } from '../processors/repoCloneProcessor';

export function createRepoCloneWorker() {
  const worker = new Worker(
    QUEUE_NAMES.REPO_CLONE,
    async (job) => {
      return await processRepoClone(job);
    },
    {
      connection: redisConnection,
      concurrency: 2, // Lower concurrency for clone operations
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 200 },
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Clone job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Clone job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('❌ Clone worker error:', err);
  });

  console.log(`🚀 Repo clone worker started`);

  return worker;
}
