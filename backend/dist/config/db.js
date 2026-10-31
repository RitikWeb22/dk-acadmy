import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env.js';
// Prioritize IPv4 DNS lookups on Windows (prevents getaddrinfo ENOTFOUND with MongoDB Atlas replica sets)
try {
    if (typeof dns.setDefaultResultOrder === 'function') {
        dns.setDefaultResultOrder('ipv4first');
    }
}
catch {
    // ignore
}
// Note: Global sanitizeFilter is omitted as it incorrectly treats Mongoose query operators ($in, $ne) as string literals
let isReconnecting = false;
export const connectDB = async () => {
    const uri = env.MONGO_URI;
    const tryConnect = async (targetUri) => {
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
    }
    catch (error) {
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
    if (isReconnecting)
        return;
    isReconnecting = true;
    setTimeout(async () => {
        isReconnecting = false;
        if (mongoose.connection.readyState === 0) {
            console.log('[MongoDB] Retrying database connection...');
            await connectDB();
        }
    }, 5000);
};
export const disconnectDB = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log('[MongoDB] Connection closed successfully');
    }
};
