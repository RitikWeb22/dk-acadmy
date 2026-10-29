import http from 'http';
import dotenv from 'dotenv';
import { app } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocket } from './sockets/socket.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start Server and Connect DB
const startServer = () => {
  server.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`[Socket.io] Realtime gateway active on port ${PORT}`);
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
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('[Server] Error during database disconnection:', err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('[Server] Graceful shutdown timeout exceeded. Forcing exit.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
