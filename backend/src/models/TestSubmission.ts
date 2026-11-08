import mongoose, { Schema, Document } from 'mongoose';

export interface ITestSubmission extends Document {
  submissionId: string;
  testId: string;
  studentId: string;
  studentEmail?: string;
  studentName?: string;
  submittedAt: Date;
  timeSpentSeconds?: number;
  score: number;
  totalMarks: number;
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  responses: Record<string, any>;
  clientTimestamp?: number;
  attemptVersion?: number;
  status?: 'IN_PROGRESS' | 'SUBMITTED';
  lastSavedAt?: Date;
  solutionSchedule: {
    enabled: boolean;
    pdfSolutionUrl?: string;
    videoSolutionUrl?: string;
    releaseDelayHours: number;
    solutionUnlockAt: Date;
    releaseStatus: 'SCHEDULED' | 'UNLOCKED' | 'DISABLED';
  };
  createdAt: Date;
  updatedAt: Date;
}

const testSubmissionSchema = new Schema<ITestSubmission>(
  {
    submissionId: { type: String, required: true, unique: true, index: true },
    testId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    studentEmail: { type: String, trim: true },
    studentName: { type: String, trim: true },
    submittedAt: { type: Date, required: true, default: Date.now, index: true },
    timeSpentSeconds: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    unattemptedCount: { type: Number, default: 0 },
    responses: { type: Schema.Types.Mixed, default: () => ({}) },
    clientTimestamp: { type: Number, default: 0 },
    attemptVersion: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'SUBMITTED'],
      default: 'SUBMITTED',
      index: true
    },
    lastSavedAt: { type: Date, default: Date.now },
    solutionSchedule: {
      enabled: { type: Boolean, default: false },
      pdfSolutionUrl: { type: String, default: '' },
      videoSolutionUrl: { type: String, default: '' },
      releaseDelayHours: { type: Number, default: 24 },
      solutionUnlockAt: { type: Date, required: true, index: true },
      releaseStatus: {
        type: String,
        enum: ['SCHEDULED', 'UNLOCKED', 'DISABLED'],
        default: 'SCHEDULED'
      }
    }
  },
  {
    timestamps: true
  }
);

testSubmissionSchema.index({ testId: 1, studentId: 1 });

export const TestSubmission = mongoose.model<ITestSubmission>('TestSubmission', testSubmissionSchema);
