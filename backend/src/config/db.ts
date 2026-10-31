import dns from 'dns';
import mongoose from 'mongoose';

// Prioritize IPv4 DNS lookups on Windows (prevents getaddrinfo ENOTFOUND with MongoDB Atlas replica sets)
try {
  if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch {
  // ignore
}

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/dk_academy_jee';
    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 25,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 30000,
      family: 4,
      retryWrites: true,
      retryReads: true
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error occurred:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Connection lost. Reconnecting...');
    });
  } catch (error: any) {
    console.error('[MongoDB] Database connection failed:', error.message || error);
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[MongoDB] Connection closed successfully');
  }
};

