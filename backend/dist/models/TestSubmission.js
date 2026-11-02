import mongoose, { Schema } from 'mongoose';
const testSubmissionSchema = new Schema({
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
}, {
    timestamps: true
});
testSubmissionSchema.index({ testId: 1, studentId: 1 });
export const TestSubmission = mongoose.model('TestSubmission', testSubmissionSchema);
