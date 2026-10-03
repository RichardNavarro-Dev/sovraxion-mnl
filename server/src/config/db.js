import fs from 'node:fs';
import mongoose from 'mongoose';
import { env } from './env.js';

let memoryServer = null;

mongoose.set('strictQuery', true);
// Query operators are built server-side only; all client input is type-checked and stripped of $-prefixed keys by noSqlSanitize.

export async function connectDatabase() {
  let uri = env.MONGODB_URI;

  if (!uri && env.USE_MEMORY_DB) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    fs.mkdirSync(env.MEMORY_DB_PATH, { recursive: true });
    memoryServer = await MongoMemoryServer.create({
      instance: { dbPath: env.MEMORY_DB_PATH, storageEngine: 'wiredTiger', dbName: 'sovraxion_mnl' },
    });
    uri = memoryServer.getUri('sovraxion_mnl');
    console.log(`[db] Embedded MongoDB running with persistent storage at ${env.MEMORY_DB_PATH}`);
  }

  if (!uri) {
    throw new Error('MONGODB_URI is not configured and USE_MEMORY_DB is disabled.');
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000, autoIndex: true });
  console.log('[db] MongoDB connected');

  mongoose.connection.on('error', (err) => console.error('[db] connection error:', err.message));
  mongoose.connection.on('disconnected', () => console.warn('[db] MongoDB disconnected'));
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop({ doCleanup: false });
    memoryServer = null;
  }
}
