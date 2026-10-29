import mongoose, { Schema, Document } from 'mongoose';

export interface IPlaybackSession extends Document {
  studentId: mongoose.Types.ObjectId;
  sessionId: string;
  deviceFingerprint: string;
  ipAddress?: string;
  userAgent?: string;
  currentCourseId?: string;
  currentLectureId?: string;
  isActive: boolean;
  revoked: boolean;
  revokedReason?: string;
  lastHeartbeat: Date;
  createdAt: Date;
  updatedAt: Date;
}

const playbackSessionSchema = new Schema<IPlaybackSession>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    deviceFingerprint: {
      type: String,
      required: true
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    currentCourseId: {
      type: String
    },
    currentLectureId: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    revoked: {
      type: Boolean,
      default: false,
      index: true
    },
    revokedReason: {
      type: String
    },
    lastHeartbeat: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Expire inactive playback sessions after 24 hours of inactivity
playbackSessionSchema.index({ lastHeartbeat: 1 }, { expireAfterSeconds: 86400 });

export const PlaybackSession = mongoose.model<IPlaybackSession>('PlaybackSession', playbackSessionSchema);
