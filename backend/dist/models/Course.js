import mongoose, { Schema } from 'mongoose';
const lectureSchema = new Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    duration: { type: String },
    videoUrl: { type: String },
    isFreePreview: { type: Boolean, default: false },
    lessonType: {
        type: String,
        enum: ['recorded_video', 'live_class', 'text', 'pdf', 'quiz'],
        default: 'recorded_video'
    },
    videoStatus: {
        type: String,
        enum: ['uploading', 'processing', 'ready', 'failed'],
        default: 'ready'
    },
    notesPdfUrl: { type: String },
    dppPdfUrl: { type: String },
    answerKeyPdfUrl: { type: String },
    worksheetPdfUrl: { type: String },
    externalDocLink: { type: String },
    sortOrder: { type: Number, default: 0 },
    points: { type: Number, default: 40 },
    dueDate: { type: String },
    penaltyText: { type: String },
    penaltyPercent: { type: Number, default: 0 },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'Easy', 'Medium', 'Hard', 'Moderate', 'Challenging'],
        default: 'medium'
    },
    mcqQuestion: { type: String },
    mcqOptions: [
        {
            id: { type: String, default: 'A' },
            text: { type: String, default: '' }
        }
    ],
    mcqCorrectOptionId: { type: String },
    mcqExplanation: { type: String },
    maxAttempts: { type: Number, default: 3 },
    mcqs: [
        {
            id: { type: String, default: () => `mcq-${Date.now()}` },
            title: { type: String, default: 'Concept MCQ' },
            difficulty: {
                type: String,
                enum: ['easy', 'medium', 'hard', 'Easy', 'Medium', 'Hard', 'Moderate', 'Challenging'],
                default: 'medium'
            },
            question: { type: String, default: '' },
            options: [
                {
                    id: { type: String, default: 'A' },
                    text: { type: String, default: '' }
                }
            ],
            correctOptionId: { type: String, default: 'A' },
            explanation: { type: String, default: '' },
            videoSolutionUrl: { type: String, default: '' },
            points: { type: Number, default: 10 },
            maxAttempts: { type: Number, default: 3 }
        }
    ],
    resources: [
        {
            id: { type: String },
            title: { type: String, default: 'Study Resource' },
            url: { type: String, default: '' }
        }
    ]
}, { _id: false });
const sectionSchema = new Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    sortOrder: { type: Number, default: 0 },
    lectures: [lectureSchema]
}, { _id: false });
const courseSchema = new Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String },
    description: { type: String },
    category: { type: String, required: true },
    targetClass: { type: String, required: true },
    targetYear: { type: String, required: true },
    targetExam: { type: String, default: 'JEE Main & Advanced' },
    instructor: { type: String, default: 'Prof. R.K. Verma & DK Sir' },
    targetAudience: { type: String },
    learningOutcomes: [{ type: String }],
    prerequisites: { type: String },
    language: { type: String, default: 'Hinglish' },
    seoTitle: { type: String },
    seoDescription: { type: String },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    level: { type: String },
    tier: { type: String },
    deliveryMode: {
        type: String,
        default: 'Online Live'
    },
    mode: { type: String, default: 'Online Live' },
    courseType: { type: String, default: 'live' },
    tags: [{ type: String, trim: true }],
    badge: { type: String, trim: true },
    isPopular: { type: Boolean, default: false },
    isBestValue: { type: Boolean, default: false },
    startDate: { type: String },
    duration: { type: String },
    coverImage: { type: String },
    bannerImage: { type: String },
    syllabusPdfUrl: { type: String },
    testSchedulePdfUrl: { type: String },
    brochurePdfUrl: { type: String },
    curriculumSections: [sectionSchema],
    features: [{ type: String }],
    demoVideoUrl: { type: String, trim: true, default: '' },
    isPublished: { type: Boolean, default: true },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived', 'Draft', 'Published', 'Archived'],
        default: 'published'
    },
    enrolmentCount: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 4.8 },
    reviewCount: { type: Number, default: 0 }
}, {
    timestamps: true
});
courseSchema.index({ isPublished: 1, status: 1, category: 1 });
courseSchema.index({ status: 1, createdAt: -1 });
courseSchema.index({ targetClass: 1, targetExam: 1 });
courseSchema.index({ title: 'text', description: 'text' }, { default_language: 'none', language_override: 'none' });
export const Course = mongoose.model('Course', courseSchema);
