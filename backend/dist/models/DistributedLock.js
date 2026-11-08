import mongoose, { Schema } from 'mongoose';
const distributedLockSchema = new Schema({
    lockKey: { type: String, required: true, unique: true, index: true },
    lockedBy: { type: String, required: true },
    acquiredAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
    ttlMs: { type: Number, required: true, default: 30000 }
}, { timestamps: true });
// TTL index to automatically prune expired lock records after 1 hour
distributedLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });
export const DistributedLock = mongoose.models.DistributedLock ||
    mongoose.model('DistributedLock', distributedLockSchema);
