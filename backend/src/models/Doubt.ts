import mongoose, { Schema, Document } from 'mongoose';

export interface IDoubtAnswer {
  adminId: string;
  adminName: string;
  answerText: string;
  attachmentUrl?: string;
  answeredAt: Date;
}

export interface IDoubt extends Document {
  studentId?: mongoose.Types.ObjectId;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  studentAvatar?: string;
  courseId: string;
  courseTitle: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics' | 'General';
  chapter?: string;
  topic?: string;
  question: string;
  questionImage?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  likes?: number;
  likedBy?: string[];
  status: 'PENDING' | 'ANSWERED' | 'REJECTED';

  answer?: IDoubtAnswer;
  createdAt: Date;
  updatedAt: Date;
}

const doubtAnswerSchema = new Schema<IDoubtAnswer>(
  {
    adminId: { type: String, required: true },
    adminName: { type: String, required: true },
    answerText: { type: String, required: true },
    attachmentUrl: { type: String },
    answeredAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const doubtSchema = new Schema<IDoubt>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User' },
    studentName: { type: String, required: true, trim: true },
    studentEmail: { type: String, required: true, trim: true, lowercase: true },
    studentPhone: { type: String, trim: true },
    studentAvatar: { type: String },
    courseId: { type: String, required: true, index: true },
    courseTitle: { type: String, required: true },
    subject: {
      type: String,
      enum: ['Physics', 'Chemistry', 'Mathematics', 'General'],
      default: 'Physics',
      index: true
    },
    chapter: { type: String, default: 'General' },
    topic: { type: String, default: 'Concept Query' },
    question: { type: String, required: true, trim: true },
    questionImage: { type: String },
    priority: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM'
    },
    likes: {
      type: Number,
      default: 0
    },
    likedBy: [{ type: String }],
    status: {
      type: String,
      enum: ['PENDING', 'ANSWERED', 'REJECTED'],
      default: 'PENDING',
      index: true
    },
    answer: doubtAnswerSchema
  },
  {
    timestamps: true
  }
);

doubtSchema.index({ courseId: 1, status: 1, createdAt: -1 });
doubtSchema.index({ studentEmail: 1, createdAt: -1 });

export const Doubt = mongoose.model<IDoubt>('Doubt', doubtSchema);

