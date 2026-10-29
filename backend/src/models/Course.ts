import mongoose, { Schema, Document } from 'mongoose';

export interface ILectureResource {
  id?: string;
  title: string;
  url: string;
}

export interface ILecture {
  id: string;
  title: string;
  duration?: string;
  videoUrl?: string;
  isFreePreview?: boolean;
  lessonType?: 'recorded_video' | 'live_class' | 'text' | 'pdf' | 'quiz';
  videoStatus?: 'uploading' | 'processing' | 'ready' | 'failed';
  notesPdfUrl?: string;
  dppPdfUrl?: string;
  answerKeyPdfUrl?: string;
  worksheetPdfUrl?: string;
  externalDocLink?: string;
  sortOrder?: number;
  resources?: ILectureResource[];
}

export interface ISection {
  id: string;
  title: string;
  description?: string;
  sortOrder?: number;
  lectures: ILecture[];
}

export interface ICourse extends Document {
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  category: string;
  targetClass: string;
  targetYear: string;
  targetExam?: string;
  instructor?: string;
  targetAudience?: string;
  learningOutcomes?: string[];
  prerequisites?: string;
  language?: string;
  seoTitle?: string;
  seoDescription?: string;
  price: number;
  originalPrice?: number;
  level?: string;
  tier?: string;
  deliveryMode: 'Offline' | 'Hybrid' | 'Online Live';
  startDate?: string;
  duration?: string;
  coverImage?: string;
  bannerImage?: string;
  syllabusPdfUrl?: string;
  testSchedulePdfUrl?: string;
  brochurePdfUrl?: string;
  curriculumSections: ISection[];
  features?: string[];
  isPublished: boolean;
  status: 'draft' | 'published' | 'archived';
  enrolmentCount: number;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const lectureSchema = new Schema<ILecture>(
  {
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
    resources: [
      {
        id: { type: String },
        title: { type: String, required: true },
        url: { type: String, required: true }
      }
    ]
  },
  { _id: false }
);

const sectionSchema = new Schema<ISection>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    sortOrder: { type: Number, default: 0 },
    lectures: [lectureSchema]
  },
  { _id: false }
);

const courseSchema = new Schema<ICourse>(
  {
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
      enum: ['Offline', 'Hybrid', 'Online Live'],
      default: 'Offline'
    },
    startDate: { type: String },
    duration: { type: String },
    coverImage: { type: String },
    bannerImage: { type: String },
    syllabusPdfUrl: { type: String },
    testSchedulePdfUrl: { type: String },
    brochurePdfUrl: { type: String },
    curriculumSections: [sectionSchema],
    features: [{ type: String }],
    isPublished: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published'
    },
    enrolmentCount: { type: Number, default: 0 },
    rating: { type: Number, default: 4.8 },
    reviewCount: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

courseSchema.index({ isPublished: 1, status: 1, category: 1 });
courseSchema.index({ status: 1, createdAt: -1 });
courseSchema.index({ targetClass: 1, targetExam: 1 });
courseSchema.index(
  { title: 'text', description: 'text' },
  { default_language: 'none', language_override: 'none' }
);

export const Course = mongoose.model<ICourse>('Course', courseSchema);
