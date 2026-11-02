import mongoose, { Schema } from 'mongoose';
const extractedQuestionSchema = new Schema({
    tempId: { type: String, default: () => `q-ext-${Date.now()}` },
    qNum: { type: Number, default: 1 },
    statement: { type: String, default: '' },
    topic: { type: String, default: 'General' },
    options: [
        {
            key: { type: String, default: 'A' },
            text: { type: String, default: '' }
        }
    ],
    suggestedAnswer: { type: String, default: 'A' },
    verifiedAnswer: { type: String },
    stepSolution: { type: String, default: '' },
    dkSirShortcut: { type: String, default: '' },
    difficulty: {
        type: String,
        default: 'Moderate'
    },
    status: {
        type: String,
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
