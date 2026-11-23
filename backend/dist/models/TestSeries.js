import mongoose, { Schema } from 'mongoose';
const optionSchema = new Schema({
    id: { type: String, default: 'A' },
    text: { type: String, default: '' },
    imageUrl: { type: String }
}, { _id: false });
const questionSchema = new Schema({
    id: { type: String, default: () => `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` },
    questionNumber: { type: Number, default: 1 },
    subject: { type: String, default: 'General' },
    difficulty: { type: String, default: 'Medium' },
    section: { type: String, enum: ['A', 'B'], default: 'A' },
    type: { type: String, default: 'SINGLE_CORRECT' },
    numericalAnswer: { type: String },
    chapter: { type: String, default: 'General' },
    statement: { type: String, default: '' },
    statementBlocks: { type: [Schema.Types.Mixed], default: undefined },
    imageUrl: { type: String },
    diagramUrl: { type: String },
    options: { type: [optionSchema], default: [] },
    correctAnswer: { type: String, default: 'A' },
    marks: { type: Number, default: 4 },
    negativeMarks: { type: Number, default: 1 },
    formulaKey: { type: String },
    explanation: { type: String },
    explanationBlocks: { type: [Schema.Types.Mixed], default: undefined },
    shortcutTrick: { type: String },
    videoSolutionUrl: { type: String, default: '' },
    pdfSolutionUrl: { type: String, default: '' },
    structuredContent: { type: [Schema.Types.Mixed], default: undefined },
    originalSource: { type: Schema.Types.Mixed, default: undefined },
    mathValidation: { type: Schema.Types.Mixed, default: undefined },
    isBonus: { type: Boolean, default: false },
    isCorrection: { type: Boolean, default: false }
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
    computeRank: { type: Boolean, default: true },
    scheduleMode: { type: String, default: 'SCHEDULED_WINDOW' },
    examSlot: { type: String, default: 'FLEXIBLE' },
    fullScreenLock: { type: Boolean, default: true },
    tabSwitchLimit: { type: Number, default: 3 },
    disableCopyPaste: { type: Boolean, default: true },
    strictTimer: { type: Boolean, default: true },
    autoSaveInterval: { type: Number, default: 10 },
    singleSessionGuard: { type: Boolean, default: true },
    scorecardRelease: { type: String, default: 'INSTANT' },
    bufferEntryMinutes: { type: Number, default: 30 },
    cutoffTierPredictor: { type: Boolean, default: true }
}, { _id: false });
const testSeriesSchema = new Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    badgeCode: { type: String, default: 'JEE MAIN' },
    examType: {
        type: String,
        enum: ['JEE Main', 'JEE Advanced', 'BITSAT', 'PartTest', 'MathSpeed', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'Dropper'],
        default: 'JEE Main'
    },
    format: {
        type: String,
        enum: ['Full Mock', 'Part Test', 'Chapter Test'],
        default: 'Full Mock'
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard', 'Moderate', 'Challenging', 'Advanced'],
        default: 'Medium'
    },
    durationMinutes: { type: Number, default: 180 },
    mode: {
        type: String,
        enum: ['Online', 'Offline', 'Hybrid', 'CBT'],
        default: 'Online'
    },
    courseName: { type: String, trim: true },
    pattern: { type: String, trim: true },
    syllabusPdfUrl: { type: String, trim: true },
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
    isFree: { type: Boolean, default: true },
    price: { type: Number, default: 0 },
    accessMode: { type: String, enum: ['free', 'paid'], default: 'free' },
    unlockedStudents: { type: [String], default: [] },
    status: {
        type: String,
        enum: ['Published', 'Draft', 'Scheduled', 'Archived'],
        default: 'Published'
    },
    schedule: { type: scheduleSchema, default: () => ({}) },
    solutionRelease: {
        enabled: { type: Boolean, default: false },
        pdfUrl: { type: String, default: '' },
        videoUrl: { type: String, default: '' },
        releaseDelayHours: { type: Number, default: 24 }
    },
    attemptsCount: { type: Number, default: 0 },
    order: { type: Number, default: 0, index: true }
}, {
    timestamps: true
});
testSeriesSchema.index({ status: 1, examType: 1 });
testSeriesSchema.index({ status: 1, createdAt: -1 });
testSeriesSchema.index({ examType: 1, format: 1, status: 1, createdAt: -1 });
testSeriesSchema.index({ slug: 1 }, { unique: true, sparse: true });
export const TestSeries = mongoose.model('TestSeries', testSeriesSchema);
