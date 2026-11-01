import mongoose, { Schema } from 'mongoose';
const optionSchema = new Schema({
    key: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    text: { type: String, required: true }
}, { _id: false });
const questionSchema = new Schema({
    id: { type: String, required: true },
    qNum: { type: Number, required: true },
    statement: { type: String, required: true },
    topic: { type: String, required: true, default: 'General' },
    options: { type: [optionSchema], default: [] },
    correctKey: { type: String, enum: ['A', 'B', 'C', 'D'], required: true, default: 'A' },
    dkSirShortcut: { type: String, default: '' },
    stepSolution: { type: String, default: '' },
    difficulty: { type: String, enum: ['Easy', 'Moderate', 'Challenging'], default: 'Moderate' },
    examYear: { type: String, default: '' },
    year: { type: Schema.Types.Mixed },
    isFree: { type: Boolean, default: true },
    videoUrl: { type: String, default: '' },
    pdfUrl: { type: String, default: '' }
}, { _id: false, strict: false });
const dppPyqSchema = new Schema({
    id: { type: String, required: true, unique: true, index: true },
    badgeCode: { type: String, required: true, default: 'DPP' },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    moduleType: { type: String, enum: ['DPP', 'PYQ', 'BITSAT'], required: true, default: 'DPP' },
    subject: {
        type: String,
        enum: ['Mathematics', 'Physics', 'Chemistry', 'Mixed'],
        required: true,
        default: 'Mathematics'
    },
    categoryLabel: { type: String, required: true, default: 'Practice Drill' },
    chapter: { type: String, default: '' },
    examTarget: { type: String, default: '' },
    isFree: { type: Boolean, default: true },
    pdfUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    videoWalkthroughUrl: { type: String, default: '' },
    questionsCount: { type: Number, default: 0 },
    solutionNote: { type: String, default: 'Detailed Step Solutions Available' },
    status: {
        type: String,
        enum: ['Published', 'Draft', 'Scheduled', 'Archived'],
        default: 'Published',
        index: true
    },
    scheduledDate: { type: String },
    attemptsCount: { type: Number, default: 0 },
    questions: { type: [questionSchema], default: [] }
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
dppPyqSchema.index({ status: 1, subject: 1 });
dppPyqSchema.index({ status: 1, createdAt: -1 });
export const DppPyq = mongoose.model('DppPyq', dppPyqSchema);
