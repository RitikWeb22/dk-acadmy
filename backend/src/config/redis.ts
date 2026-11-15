import { Redis, RedisOptions } from 'ioredis';
import { env } from './env.js';

let redisClient: Redis | null = null;
let isConnected = false;

const getRedisOptions = (): RedisOptions => ({
  connectTimeout: 10000,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  retryStrategy(times: number) {
    // Exponential backoff with a cap of 3 seconds
    const delay = Math.min(times * 100, 3000);
    return delay;
  }
});

/**
 * Initializes and connects the singleton Redis client if REDIS_URL is configured.
 */
export const initRedis = async (): Promise<Redis | null> => {
  if (!env.REDIS_URL || env.REDIS_URL.trim() === '') {
    console.log('[Redis] REDIS_URL not configured. Running without Redis cache.');
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = new Redis(env.REDIS_URL, getRedisOptions());

    redisClient.on('connect', () => {
      console.log('[Redis] Connected to Redis cluster/instance.');
    });

    redisClient.on('ready', () => {
      isConnected = true;
      console.log('[Redis] Redis client ready to accept commands.');
    });

    redisClient.on('error', (err: any) => {
      isConnected = false;
      console.warn(`[Redis] Connection warning: ${err.message}`);
    });

    redisClient.on('close', () => {
      isConnected = false;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error: any) {
    console.warn(`[Redis] Failed to connect to Redis: ${error.message}. Continuing in fallback mode.`);
    return null;
  }
};

/**
 * Creates a duplicate Redis client for Pub/Sub or independent channels (e.g. Socket.io adapter).
 */
export const createRedisClient = (): Redis | null => {
  if (!env.REDIS_URL || env.REDIS_URL.trim() === '') {
    return null;
  }
  return new Redis(env.REDIS_URL, getRedisOptions());
};

/**
 * Returns the active Redis client or null if disabled/offline.
 */
export const getRedisClient = (): Redis | null => {
  return redisClient;
};

/**
 * Checks whether Redis is connected and ready.
 */
export const isRedisReady = (): boolean => {
  return isConnected && redisClient !== null && redisClient.status === 'ready';
};

/**
 * Gracefully disconnects the Redis client.
 */
export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('[Redis] Disconnected successfully.');
    } catch {
      redisClient.disconnect();
    } finally {
      redisClient = null;
      isConnected = false;
    }
  }
};

/**
 * Cache GET helper with JSON deserialization.
 */
export async function cacheGet<T = any>(key: string): Promise<T | null> {
  if (!isRedisReady() || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (err: any) {
    console.warn(`[Redis Cache] GET error for key "${key}":`, err.message);
    return null;
  }
}

/**
 * Cache SET helper with JSON serialization and optional TTL (seconds).
 */
export async function cacheSet(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
  if (!isRedisReady() || !redisClient) return false;
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await redisClient.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await redisClient.set(key, serialized);
    }
    return true;
  } catch (err: any) {
    console.warn(`[Redis Cache] SET error for key "${key}":`, err.message);
    return false;
  }
}

/**
 * Cache DEL helper for one or multiple keys.
 */
export async function cacheDel(...keys: string[]): Promise<boolean> {
  if (!isRedisReady() || !redisClient || keys.length === 0) return false;
  try {
    await redisClient.del(...keys);
    return true;
  } catch (err: any) {
    console.warn(`[Redis Cache] DEL error:`, err.message);
    return false;
  }
}

/**
 * Cache DEL pattern helper (scans and deletes keys matching a wildcard pattern, e.g. "courses:*").
 */
export async function cacheDelPattern(pattern: string): Promise<number> {
  if (!isRedisReady() || !redisClient) return 0;
  try {
    let cursor = '0';
    let deletedCount = 0;
    do {
      const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redisClient.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== '0');
    return deletedCount;
  } catch (err: any) {
    console.warn(`[Redis Cache] DEL pattern error:`, err.message);
    return 0;
  }
}
