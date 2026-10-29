import dns from 'dns';
import mongoose from 'mongoose';

// Resolve MongoDB Atlas SRV records reliably on Windows & local networks
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // ignore if network permissions restrict custom DNS
}

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/dk_academy_jee';
    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 25,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 15000
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

