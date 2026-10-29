import mongoose, { Schema, Document } from 'mongoose';

export interface IWatchProgress extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: string;
  videoId?: mongoose.Types.ObjectId | string;
  lectureId: string;
  lastPositionSeconds: number;
  totalDurationSeconds: number;
  percentageWatched: number;
  isCompleted: boolean;
  completedAt?: Date;
  lastWatchedAt: Date;
  watchHistoryCount: number;
}

const watchProgressSchema = new Schema<IWatchProgress>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    courseId: {
      type: String,
      required: true,
      index: true
    },
    videoId: {
      type: Schema.Types.Mixed
    },
    lectureId: {
      type: String,
      required: true,
      index: true
    },
    lastPositionSeconds: {
      type: Number,
      default: 0,
      min: 0
    },
    totalDurationSeconds: {
      type: Number,
      default: 0,
      min: 0
    },
    percentageWatched: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true
    },
    completedAt: {
      type: Date
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now
    },
    watchHistoryCount: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast lookup per student per course per lecture
watchProgressSchema.index({ studentId: 1, courseId: 1, lectureId: 1 }, { unique: true });

export const WatchProgress = mongoose.model<IWatchProgress>('WatchProgress', watchProgressSchema);
