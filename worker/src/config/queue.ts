import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { config } from './env';

// Redis connection
export const redisConnection = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
});

// Queue names
export const QUEUE_NAMES = {
  WEBHOOK_EVENTS: 'webhook-events',
  REPO_CLONE: 'repo-clone',
  REPO_ANALYSIS: 'repo-analysis',
  DEPLOYMENTS: 'deployments',
};

// Create queues
export const webhookQueue = new Queue(QUEUE_NAMES.WEBHOOK_EVENTS, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100,
      age: 3600 * 24, // 24 hours
    },
    removeOnFail: {
      count: 500,
      age: 3600 * 24 * 7, // 7 days
    },
  },
});

export const repoCloneQueue = new Queue(QUEUE_NAMES.REPO_CLONE, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 50,
      age: 3600 * 24,
    },
    removeOnFail: {
      count: 200,
      age: 3600 * 24 * 7,
    },
  },
});

export const repoAnalysisQueue = new Queue(QUEUE_NAMES.REPO_ANALYSIS, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: {
      count: 100,
      age: 3600 * 24,
    },
    removeOnFail: {
      count: 300,
      age: 3600 * 24 * 7,
    },
  },
});

export const deploymentQueue = new Queue(QUEUE_NAMES.DEPLOYMENTS, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
    removeOnComplete: {
      count: 200,
      age: 3600 * 24 * 30, // 30 days
    },
    removeOnFail: {
      count: 500,
      age: 3600 * 24 * 30,
    },
  },
});
  },
});

// Queue events for monitoring
export const webhookQueueEvents = new QueueEvents(QUEUE_NAMES.WEBHOOK_EVENTS, {
  connection: redisConnection,
});

export const repoCloneQueueEvents = new QueueEvents(QUEUE_NAMES.REPO_CLONE, {
  connection: redisConnection,
});

export const repoAnalysisQueueEvents = new QueueEvents(QUEUE_NAMES.REPO_ANALYSIS, {
  connection: redisConnection,
});

export const deploymentQueueEvents = new QueueEvents(QUEUE_NAMES.DEPLOYMENTS, {
  connection: redisConnection,
});

// Helper function to add job to queue
export async function addWebhookJob(data: any) {
  return await webhookQueue.add('webhook-event', data, {
    jobId: data.eventId,
  });
}

export async function addRepoCloneJob(data: any) {
  return await repoCloneQueue.add('clone-repo', data, {
    jobId: `clone-${data.repoId}-${Date.now()}`,
  });
}

export async function addRepoAnalysisJob(data: any) {
  return await repoAnalysisQueue.add('analyze-repo', data, {
    jobId: `analyze-${data.repoId}-${Date.now()}`,
  });
}

export async function addDeploymentJob(data: any) {
  return await deploymentQueue.add('deploy', data, {
    jobId: `deploy-${data.deploymentId}`,
  });
}

// Graceful shutdown
export async function closeQueues() {
  await webhookQueue.close();
  await repoCloneQueue.close();
  await repoAnalysisQueue.close();
  await deploymentQueue.close();
  await webhookQueueEvents.close();
  await repoCloneQueueEvents.close();
  await repoAnalysisQueueEvents.close();
  await deploymentQueueEvents.close();
  await redisConnection.quit();
  console.log('✅ All queues closed');
}
