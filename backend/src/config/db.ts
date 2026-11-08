import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env.js';

// Prioritize IPv4 DNS lookups on Windows (prevents getaddrinfo ENOTFOUND with MongoDB Atlas replica sets)
try {
  if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch {
  // ignore
}

// Note: Global sanitizeFilter is omitted as it incorrectly treats Mongoose query operators ($in, $ne) as string literals

export interface MongoPoolMetrics {
  maxPoolSize: number;
  minPoolSize: number;
  currentCheckedOut: number;
  peakCheckedOut: number;
  totalCheckouts: number;
  totalCheckins: number;
  totalCheckoutFailures: number;
  waitQueueTimeoutMS: number;
  readyState: number;
  host?: string;
}

const poolMetrics: MongoPoolMetrics = {
  maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 75,
  minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE) || 15,
  currentCheckedOut: 0,
  peakCheckedOut: 0,
  totalCheckouts: 0,
  totalCheckins: 0,
  totalCheckoutFailures: 0,
  waitQueueTimeoutMS: 15000,
  readyState: 0
};

export const getMongoPoolMetrics = (): MongoPoolMetrics => {
  return {
    ...poolMetrics,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || undefined
  };
};

let isReconnecting = false;
let cmapListenersAttached = false;

const attachCmapListeners = (client: any) => {
  if (!client || cmapListenersAttached) return;
  cmapListenersAttached = true;

  try {
    client.on('connectionCheckedOut', () => {
      poolMetrics.currentCheckedOut++;
      poolMetrics.totalCheckouts++;
      if (poolMetrics.currentCheckedOut > poolMetrics.peakCheckedOut) {
        poolMetrics.peakCheckedOut = poolMetrics.currentCheckedOut;
      }
    });

    client.on('connectionCheckedIn', () => {
      poolMetrics.currentCheckedOut = Math.max(0, poolMetrics.currentCheckedOut - 1);
      poolMetrics.totalCheckins++;
    });

    client.on('connectionCheckOutFailed', () => {
      poolMetrics.totalCheckoutFailures++;
    });
  } catch {
    // CMAP events not supported in mock environments
  }
};

export const connectDB = async (): Promise<void> => {
  const uri = env.MONGO_URI;

  const tryConnect = async (targetUri: string) => {
    return await mongoose.connect(targetUri, {
      maxPoolSize: poolMetrics.maxPoolSize,
      minPoolSize: poolMetrics.minPoolSize,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 15000,
      waitQueueTimeoutMS: poolMetrics.waitQueueTimeoutMS,
      maxIdleTimeMS: 30000,
      family: 4,
      retryWrites: true,
      retryReads: true
    });
  };

  try {
    const conn = await tryConnect(uri);
    poolMetrics.host = conn.connection.host;
    poolMetrics.readyState = 1;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host} (Pool: min=${poolMetrics.minPoolSize}, max=${poolMetrics.maxPoolSize})`);

    try {
      const client = conn.connection.getClient();
      attachCmapListeners(client);
    } catch {
      // ignore
    }
  } catch (error: any) {
    poolMetrics.readyState = 0;
    console.error('[MongoDB] Database connection failed:', error.message || error);
    scheduleReconnect();
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
  if (process.env.NODE_ENV === 'test') return;
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

