import dotenv from 'dotenv';

dotenv.config();

export const config = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  azure: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
    storageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
    storageAccountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || '',
  },
  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
    name: process.env.WORKER_NAME || `worker-${process.pid}`,
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/kurser',
  },
  github: {
    token: process.env.GITHUB_TOKEN || '',
  },
  cloneDir: process.env.CLONE_DIR || '/tmp/kurser-repos',
  mainApiUrl: process.env.MAIN_API_URL || 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'info',
};
