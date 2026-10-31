import mongoose, { Schema } from 'mongoose';
const optionSchema = new Schema({
    id: { type: String, required: true },
    text: { type: String, required: true },
    imageUrl: { type: String }
}, { _id: false });
const questionSchema = new Schema({
    id: { type: String, required: true },
    questionNumber: { type: Number, required: true },
    subject: { type: String, required: true },
    chapter: { type: String, default: 'General' },
    statement: { type: String, required: true },
    imageUrl: { type: String },
    options: [optionSchema],
    correctAnswer: { type: String, required: true },
    marks: { type: Number, default: 4 },
    negativeMarks: { type: Number, default: 1 },
    formulaKey: { type: String },
    explanation: { type: String },
    shortcutTrick: { type: String },
    videoSolutionUrl: { type: String }
}, { _id: false });
const markingSchemeSchema = new Schema({
    correct: { type: Number, default: 4 },
    incorrect: { type: Number, default: 1 },
    unattempted: { type: Number, default: 0 }
}, { _id: false });
const scheduleSchema = new Schema({
    startWindow: { type: Date },
    endWindow: { type: Date },
    autoSubmit: { type: Boolean, default: true },
    computeRank: { type: Boolean, default: true }
}, { _id: false });
const testSeriesSchema = new Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    badgeCode: { type: String, default: 'JEE MAIN' },
    examType: {
        type: String,
        enum: ['JEE Main', 'JEE Advanced', 'BITSAT'],
        default: 'JEE Main'
    },
    format: {
        type: String,
        enum: ['Full Mock', 'Part Test', 'Chapter Test'],
        default: 'Full Mock'
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Hard'
    },
    durationMinutes: { type: Number, default: 180 },
    totalQuestions: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 300 },
    subjects: { type: [String], default: ['Mathematics'] },
    markingScheme: { type: markingSchemeSchema, default: () => ({ correct: 4, incorrect: 1, unattempted: 0 }) },
    instructions: { type: [String], default: [] },
    questions: { type: [questionSchema], default: [] },
    batch: { type: String, default: 'Ultimate 2-Year Live Classroom (2028)' },
    targetBatches: { type: [String], default: ['Ultimate 2-Year Live Classroom (2028)'] },
    totalTests: { type: Number, default: 8 },
    testsBreakdown: {
        type: Schema.Types.Mixed,
        default: () => ({ published: 8, draft: 0, scheduled: 0 })
    },
    accessLevel: {
        type: String,
        enum: ['BATCH_INCLUDED', 'FREE_LEAD_MAGNET'],
        default: 'BATCH_INCLUDED'
    },
    status: {
        type: String,
        enum: ['Published', 'Draft', 'Scheduled', 'Archived'],
        default: 'Published'
    },
    schedule: { type: scheduleSchema, default: () => ({}) },
    attemptsCount: { type: Number, default: 0 }
}, {
    timestamps: true
});
testSeriesSchema.index({ status: 1, examType: 1 });
testSeriesSchema.index({ status: 1, createdAt: -1 });
export const TestSeries = mongoose.model('TestSeries', testSeriesSchema);
