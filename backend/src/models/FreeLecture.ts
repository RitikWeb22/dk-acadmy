import mongoose, { Schema, Document } from 'mongoose';

export interface IFreeLecture extends Document {
  id: string;
  title: string;
  subject: 'Mathematics' | 'Physics' | 'Chemistry' | 'Mixed';
  trackId: string;
  trackTitle: string;
  order: number;
  duration: string;
  isFree: boolean;
  price: number;
  discountPrice?: number;
  videoUrl: string;
  thumbnailUrl?: string;
  dppName?: string;
  dppUrl?: string;
  notesPdfUrl?: string;
  facultyName: string;
  targetExam: string;
  targetClass: string;
  description?: string;
  tags?: string[];
  badge?: string;
  status: 'Published' | 'Draft';
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const freeLectureSchema = new Schema<IFreeLecture>(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    subject: {
      type: String,
      enum: ['Mathematics', 'Physics', 'Chemistry', 'Mixed'],
      required: true,
      default: 'Mathematics'
    },
    trackId: { type: String, required: true, default: 'free-math-calculus-shortcuts', index: true },
    trackTitle: { type: String, required: true, default: 'Differential Calculus Shortcuts' },
    order: { type: Number, required: true, default: 1 },
    duration: { type: String, required: true, default: '45 min' },
    isFree: { type: Boolean, required: true, default: true },
    price: { type: Number, required: true, default: 0 },
    discountPrice: { type: Number, default: 0 },
    videoUrl: { type: String, required: true, default: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    thumbnailUrl: { type: String, default: '/img/founder.jpeg' },
    dppName: { type: String, default: 'DPP-01: Kota Practice Sheet' },
    dppUrl: { type: String, default: '/sample-dpp.pdf' },
    notesPdfUrl: { type: String, default: '/sample-notes.pdf' },
    facultyName: { type: String, default: 'Dharmendra Kumar (DK Sir)' },
    targetExam: { type: String, default: 'JEE Main & Advanced 2026/27' },
    targetClass: { type: String, default: 'Class 11 & 12' },
    description: { type: String, default: '' },
    tags: [{ type: String, trim: true }],
    badge: { type: String, trim: true },
    status: {
      type: String,
      enum: ['Published', 'Draft'],
      default: 'Published'
    },
    viewsCount: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

freeLectureSchema.index({ status: 1, subject: 1 });
freeLectureSchema.index({ trackId: 1, order: 1 });

export const FreeLecture = mongoose.model<IFreeLecture>('FreeLecture', freeLectureSchema);
