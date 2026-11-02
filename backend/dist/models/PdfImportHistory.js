import mongoose, { Schema } from 'mongoose';
const extractedQuestionSchema = new Schema({
    tempId: { type: String, required: true },
    qNum: { type: Number, required: true },
    statement: { type: String, required: true },
    topic: { type: String, default: 'General' },
    options: [
        {
            key: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
            text: { type: String, required: true }
        }
    ],
    suggestedAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], default: 'A' },
    verifiedAnswer: { type: String, enum: ['A', 'B', 'C', 'D'] },
    stepSolution: { type: String, default: '' },
    dkSirShortcut: { type: String, default: '' },
    difficulty: {
        type: String,
        enum: ['Easy', 'Moderate', 'Challenging'],
        default: 'Moderate'
    },
    status: {
        type: String,
        enum: ['EXTRACTED', 'NEEDS_REVIEW', 'VERIFIED', 'REJECTED'],
        default: 'EXTRACTED'
    },
    reviewReason: { type: String, default: '' },
    pageNumber: { type: Number, default: 1 },
    diagramUrl: { type: String, default: '' }
}, { _id: false, strict: false });
const pdfImportHistorySchema = new Schema({
    id: { type: String, required: true, unique: true, index: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    fileUrl: { type: String, default: '' },
    status: {
        type: String,
        enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVIEW_REQUIRED'],
        default: 'PROCESSING',
        index: true
    },
    totalDetected: { type: Number, default: 0 },
    successfulCount: { type: Number, default: 0 },
    needsReviewCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    targetExam: { type: String, default: 'JEE Main' },
    subject: { type: String, default: 'Mathematics' },
    year: { type: Schema.Types.Mixed, default: 2024 },
    paperId: { type: String, default: '' },
    extractedQuestions: { type: [extractedQuestionSchema], default: [] },
    errorLog: { type: [String], default: [] }
}, {
    timestamps: true,
    strict: false,
    toJSON: {
        virtuals: true,
        transform: (_doc, ret) => {
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});
export const PdfImportHistory = mongoose.model('PdfImportHistory', pdfImportHistorySchema);
