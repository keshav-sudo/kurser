import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');
const redisPassword = process.env.REDIS_PASSWORD || undefined;

// Redis connection
export const redisConnection = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
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
      age: 3600 * 24,
    },
    removeOnFail: {
      count: 500,
      age: 3600 * 24 * 7,
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
  },
});

// Helper to add webhook job
export async function addWebhookJob(data: any) {
  return await webhookQueue.add('webhook-event', data, {
    jobId: data.eventId,
  });
}

// Helper to add repo clone job for first-time setup
export async function addRepoCloneJob(data: any) {
  return await repoCloneQueue.add('clone-repo', data, {
    jobId: `clone-${data.repoId}-${Date.now()}`,
  });
}

// Helper to add deployment job
export async function addDeploymentJob(data: any) {
  return await deploymentQueue.add('deploy', data, {
    jobId: `deploy-${data.deploymentId}`,
  });
}

console.log(`✅ BullMQ connected to Redis at ${redisHost}:${redisPort}`);
