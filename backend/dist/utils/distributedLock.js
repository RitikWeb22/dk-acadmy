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
 * Generates a cryptographically strong unique owner token for a lease.
 */
export const generateOwnerToken = () => {
    return `lease-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
};
/**
 * Attempts to acquire an exclusive distributed lease lock in MongoDB with detailed lease metadata.
 * Returns { acquired: true, ownerToken, generation, expiresAt } on success.
 */
export async function acquireDistributedLease(lockKey, ttlMs = 30000, workerId = getWorkerIdentifier()) {
    if (mongoose.connection.readyState !== 1) {
        return { acquired: false };
    }
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);
    const ownerToken = generateOwnerToken();
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
                ownerToken,
                acquiredAt: now,
                expiresAt,
                ttlMs,
                renewedCount: 0
            },
            $inc: { generation: 1 } // Monotonically increasing fencing generation token
        }, { upsert: true, returnDocument: 'after' });
        if (res) {
            return {
                acquired: true,
                ownerToken: res.ownerToken || ownerToken,
                generation: res.generation || 1,
                expiresAt: res.expiresAt
            };
        }
        return { acquired: false };
    }
    catch (err) {
        // Duplicate key error (code 11000): Another active, non-expired worker holds this lock
        return { acquired: false };
    }
}
/**
 * Attempts to acquire an exclusive distributed lease lock in MongoDB.
 * Thread-safe and process-safe across multiple Node.js cluster workers or Docker containers.
 * Backwards-compatible signature returning boolean.
 */
export async function acquireDistributedLock(lockKey, ttlMs = 30000, workerId = getWorkerIdentifier()) {
    const lease = await acquireDistributedLease(lockKey, ttlMs, workerId);
    return lease.acquired;
}
/**
 * Renews an existing distributed lease lock before it expires (heartbeat mechanism).
 * Prevents another worker from reclaiming the lease while a long-running critical task executes.
 */
export async function renewDistributedLock(lockKey, ownerToken, ttlMs = 30000) {
    if (mongoose.connection.readyState !== 1)
        return false;
    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + ttlMs);
    try {
        const res = await DistributedLock.findOneAndUpdate({
            lockKey,
            $or: [
                { ownerToken },
                { lockedBy: ownerToken } // Fallback if workerId was used as token
            ],
            expiresAt: { $gt: now } // Only renew if not already expired and stolen
        }, {
            $set: {
                expiresAt: newExpiresAt,
                ttlMs
            },
            $inc: { renewedCount: 1 }
        }, { returnDocument: 'after' });
        return Boolean(res);
    }
    catch {
        return false;
    }
}
/**
 * Checks whether a distributed lock lease is currently active and held by the specified owner.
 */
export async function isLockHeld(lockKey, ownerTokenOrWorkerId) {
    if (mongoose.connection.readyState !== 1)
        return false;
    const now = new Date();
    const record = await DistributedLock.findOne({
        lockKey,
        $or: [
            { ownerToken: ownerTokenOrWorkerId },
            { lockedBy: ownerTokenOrWorkerId }
        ],
        expiresAt: { $gt: now }
    });
    return Boolean(record);
}
/**
 * Releases a previously acquired distributed lock.
 * Safely validates owner token / worker ID to prevent a stale worker whose lease
 * expired from inadvertently releasing a lock that has since been acquired by another worker.
 */
export async function releaseDistributedLock(lockKey, ownerTokenOrWorkerId) {
    if (mongoose.connection.readyState !== 1)
        return false;
    try {
        const query = { lockKey };
        if (ownerTokenOrWorkerId) {
            query.$or = [
                { ownerToken: ownerTokenOrWorkerId },
                { lockedBy: ownerTokenOrWorkerId }
            ];
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
 * Automatically handles owner tokens, fencing generations, and safe teardown.
 */
export async function withDistributedLock(lockKey, ttlMs, task, workerId = getWorkerIdentifier()) {
    const lease = await acquireDistributedLease(lockKey, ttlMs, workerId);
    if (!lease.acquired || !lease.ownerToken) {
        return {
            executed: false,
            reason: `Lock [${lockKey}] currently held by another worker or process`
        };
    }
    const ownerToken = lease.ownerToken;
    const generation = lease.generation || 1;
    try {
        const result = await task({
            ownerToken,
            generation,
            renew: () => renewDistributedLock(lockKey, ownerToken, ttlMs)
        });
        return { executed: true, result };
    }
    finally {
        await releaseDistributedLock(lockKey, ownerToken);
    }
}
