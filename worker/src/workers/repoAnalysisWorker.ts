import { Worker } from 'bullmq';
import { config } from '../config/env';
import { QUEUE_NAMES, redisConnection } from '../config/queue';
import { processRepoAnalysis } from '../processors/repoAnalysisProcessor';

export function createRepoAnalysisWorker() {
  const worker = new Worker(
    QUEUE_NAMES.REPO_ANALYSIS,
    async (job) => {
      return await processRepoAnalysis(job);
    },
    {
      connection: redisConnection,
      concurrency: 3,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 300 },
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Analysis job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Analysis job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('❌ Analysis worker error:', err);
  });

  console.log(`🚀 Repo analysis worker started`);

  return worker;
}
