import mongoose, { Schema, Document } from 'mongoose';

export interface IDistributedLock extends Document {
  lockKey: string;
  lockedBy: string;
  ownerToken: string;
  generation: number;
  renewedCount: number;
  acquiredAt: Date;
  expiresAt: Date;
  ttlMs: number;
}

const distributedLockSchema = new Schema<IDistributedLock>(
  {
    lockKey: { type: String, required: true, unique: true, index: true },
    lockedBy: { type: String, required: true },
    ownerToken: { type: String, required: true, default: () => new mongoose.Types.ObjectId().toHexString() },
    generation: { type: Number, required: true, default: 1 },
    renewedCount: { type: Number, required: true, default: 0 },
    acquiredAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
    ttlMs: { type: Number, required: true, default: 30000 }
  },
  { timestamps: true }
);

// TTL index to automatically prune expired lock records after 1 hour
distributedLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

export const DistributedLock =
  mongoose.models.DistributedLock ||
  mongoose.model<IDistributedLock>('DistributedLock', distributedLockSchema);
