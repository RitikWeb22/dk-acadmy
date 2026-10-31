import dns from 'dns';
import mongoose from 'mongoose';

// MongoDB Atlas connection URI loaded securely from environment variables
const getMongoUri = (): string => {
  const uri = process.env.MONGO_URI || process.env.DIRECT_ATLAS_URI;
  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Security Exception]: MONGO_URI environment variable is missing.');
    }
    console.warn('[MongoDB Warning]: MONGO_URI is not set. Please configure backend/.env.');
    return 'mongodb://127.0.0.1:27017/dk_academy_jee';
  }
  return uri;
};

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
  const uri = getMongoUri();

  const tryConnect = async (targetUri: string) => {
    return await mongoose.connect(targetUri, {
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
    const conn = await tryConnect(uri);
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (error: any) {
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

