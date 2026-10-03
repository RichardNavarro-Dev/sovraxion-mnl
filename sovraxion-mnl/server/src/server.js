import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { ensureSeedData } from './seed.js';

async function start() {
  await connectDatabase();
  await ensureSeedData();
  const app = createApp();
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`[server] SOVRAXION MNL API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down gracefully`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => console.error('[server] Unhandled rejection:', reason));
}

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
