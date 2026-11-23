import http from 'http';
import { env } from './config/env.js';
import { app } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocket } from './sockets/socket.js';
import { initRedis, disconnectRedis } from './config/redis.js';

const PORT = env.PORT;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start Server and Connect DB
const startServer = () => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on http://0.0.0.0:${PORT} in ${env.NODE_ENV} mode`);
    console.log(`[Socket.io] Realtime gateway active on port ${PORT}`);
  });

  // Connect to Redis in background
  initRedis().catch((err) => {
    console.warn('[Redis] Initial connection failed:', err.message);
  });

  // Connect to DB in background and seed initial data
  connectDB()
    .then(async () => {
      const { seedInitialDatabase } = await import('./config/seedDB.js');
      await seedInitialDatabase();
    })
    .catch((err) => {
      console.error('[MongoDB] Initial connection failed:', err.message);
    });
};

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('[Server] HTTP server closed.');
    try {
      await Promise.allSettled([disconnectDB(), disconnectRedis()]);
      process.exit(0);
    } catch (err) {
      console.error('[Server] Error during database/redis disconnection:', err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('[Server] Graceful shutdown timeout exceeded. Forcing exit.');
    process.exit(1);
  }, 10000).unref();
};

// Global Crash Protection & Process Guards
process.on('uncaughtException', (err: Error) => {
  console.error('[FATAL CRASH PREVENTED] Uncaught Exception:', err.message, err.stack);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[UNHANDLED PROMISE REJECTION PREVENTED]:', reason?.message || reason);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
