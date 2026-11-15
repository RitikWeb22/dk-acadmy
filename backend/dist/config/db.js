import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';
// Prioritize IPv4 DNS lookups on Windows (prevents getaddrinfo ENOTFOUND with MongoDB Atlas replica sets)
try {
    if (typeof dns.setDefaultResultOrder === 'function') {
        dns.setDefaultResultOrder('ipv4first');
    }
}
catch {
    // ignore
}
// ─────────────────────────────────────────────────────────────────────────────
// SLOW QUERY PROFILER PLUGIN
// Automatically logs queries exceeding threshold (default: 100ms) with execution time
// ─────────────────────────────────────────────────────────────────────────────
const SLOW_QUERY_THRESHOLD_MS = Number(process.env.SLOW_QUERY_THRESHOLD_MS) || 100;
mongoose.plugin((schema) => {
    schema.pre(/^find|count|update|delete/, function () {
        this._queryStartTime = Date.now();
    });
    schema.post(/^find|count|update|delete/, function () {
        if (this._queryStartTime) {
            const durationMs = Date.now() - this._queryStartTime;
            if (durationMs > SLOW_QUERY_THRESHOLD_MS) {
                const collectionName = this.model?.collection?.name || 'unknown';
                const operation = this.op || 'query';
                logger.warn({
                    collection: collectionName,
                    op: operation,
                    durationMs,
                    thresholdMs: SLOW_QUERY_THRESHOLD_MS
                }, `[SLOW MONGODB QUERY: ${durationMs}ms] ${collectionName}.${operation}`);
            }
        }
    });
});
const poolMetrics = {
    maxPoolSize: Number(process.env.DB_MAX_POOL_SIZE || process.env.MONGO_MAX_POOL_SIZE) || 75,
    minPoolSize: Number(process.env.DB_MIN_POOL_SIZE || process.env.MONGO_MIN_POOL_SIZE) || 15,
    currentCheckedOut: 0,
    peakCheckedOut: 0,
    totalCheckouts: 0,
    totalCheckins: 0,
    totalCheckoutFailures: 0,
    waitQueueTimeoutMS: Number(process.env.DB_WAIT_QUEUE_TIMEOUT_MS) || 15000,
    readyState: 0
};
export const getMongoPoolMetrics = () => {
    return {
        ...poolMetrics,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host || undefined
    };
};
let isReconnecting = false;
let cmapListenersAttached = false;
const attachCmapListeners = (client) => {
    if (!client || cmapListenersAttached)
        return;
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
    }
    catch {
        // CMAP events not supported in mock environments
    }
};
export const connectDB = async () => {
    const uri = env.MONGO_URI;
    const tryConnect = async (targetUri) => {
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
        }
        catch {
            // ignore
        }
    }
    catch (error) {
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
    if (process.env.NODE_ENV === 'test')
        return;
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
