import crypto from 'crypto';
import mongoose from 'mongoose';
import { DistributedLock } from '../models/DistributedLock.js';
/**
 * Generates a unique worker ID for this process.
 */
export const getWorkerIdentifier = () => {
    return `worker-${process.pid}-${crypto.randomBytes(4).toString('hex')}`;
};
/**
 * Attempts to acquire an exclusive distributed lease lock in MongoDB.
 * Thread-safe and process-safe across multiple Node.js cluster workers or Docker containers.
 */
export async function acquireDistributedLock(lockKey, ttlMs = 30000, workerId = getWorkerIdentifier()) {
    if (mongoose.connection.readyState !== 1) {
        // If database is unavailable, cannot acquire distributed lock
        return false;
    }
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);
    try {
        const res = await DistributedLock.findOneAndUpdate({
            lockKey,
            $or: [
                { expiresAt: { $lt: now } }, // Lock has expired; reclaim it
                { lockedBy: workerId } // Re-entrant lock by same worker
            ]
        }, {
            $set: {
                lockedBy: workerId,
                acquiredAt: now,
                expiresAt,
                ttlMs
            }
        }, { upsert: true, returnDocument: 'after' });
        return Boolean(res);
    }
    catch (err) {
        // Code 11000: Another active, non-expired worker already holds this lock
        if (err?.code === 11000 || err?.name === 'MongoServerError') {
            return false;
        }
        return false;
    }
}
/**
 * Releases a previously acquired distributed lock.
 */
export async function releaseDistributedLock(lockKey, workerId) {
    if (mongoose.connection.readyState !== 1)
        return false;
    try {
        const query = { lockKey };
        if (workerId) {
            query.lockedBy = workerId;
        }
        const res = await DistributedLock.deleteOne(query);
        return (res.deletedCount || 0) > 0;
    }
    catch {
        return false;
    }
}
/**
 * Executes a critical background task with distributed single-execution guarantee.
 * Guarantees that across multiple cluster workers, only one instance executes the task.
 */
export async function withDistributedLock(lockKey, ttlMs, task, workerId = getWorkerIdentifier()) {
    const acquired = await acquireDistributedLock(lockKey, ttlMs, workerId);
    if (!acquired) {
        return {
            executed: false,
            reason: `Lock [${lockKey}] currently held by another worker or process`
        };
    }
    try {
        const result = await task();
        return { executed: true, result };
    }
    finally {
        await releaseDistributedLock(lockKey, workerId);
    }
}
