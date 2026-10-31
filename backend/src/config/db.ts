import dns from 'dns';
import mongoose from 'mongoose';

// Fallback direct replica set URI to bypass Windows querySrv ECONNREFUSED issues
const DIRECT_ATLAS_URI =
  'mongodb://ritikweb30_db_user:LcIQJeKuxVDp0Q8g@ac-mqptae5-shard-00-00.bpriw9o.mongodb.net:27017,ac-mqptae5-shard-00-01.bpriw9o.mongodb.net:27017,ac-mqptae5-shard-00-02.bpriw9o.mongodb.net:27017/dk_academy_jee?ssl=true&replicaSet=atlas-cdcqa2-shard-0&authSource=admin&retryWrites=true&w=majority';

// Prioritize IPv4 DNS lookups on Windows (prevents getaddrinfo ENOTFOUND with MongoDB Atlas replica sets)
try {
  if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch {
  // ignore
}

let isReconnecting = false;

export const connectDB = async (): Promise<void> => {
  const primaryUri = process.env.MONGO_URI || DIRECT_ATLAS_URI;

  const tryConnect = async (uri: string) => {
    return await mongoose.connect(uri, {
      maxPoolSize: 25,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 15000,
      family: 4,
      retryWrites: true,
      retryReads: true
    });
  };

  try {
    const conn = await tryConnect(primaryUri);
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (error: any) {
    console.warn(`[MongoDB] Primary connection failed (${error.code || error.message}). Attempting direct replica set fallback...`);
    try {
      const conn = await tryConnect(DIRECT_ATLAS_URI);
      console.log(`[MongoDB] Connected successfully via direct replica set: ${conn.connection.host}`);
    } catch (fallbackError: any) {
      console.error('[MongoDB] Database connection failed:', fallbackError.message || fallbackError);
      scheduleReconnect();
    }
  }

  // Register connection events only once
  if (!mongoose.connection.listeners('error').length) {
    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error occurred:', err?.message || err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Connection lost. Scheduling reconnection...');
      scheduleReconnect();
    });
  }
};

const scheduleReconnect = () => {
  if (isReconnecting) return;
  isReconnecting = true;
  setTimeout(async () => {
    isReconnecting = false;
    if (mongoose.connection.readyState === 0) {
      console.log('[MongoDB] Retrying database connection...');
      await connectDB();
    }
  }, 5000);
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[MongoDB] Connection closed successfully');
  }
};

