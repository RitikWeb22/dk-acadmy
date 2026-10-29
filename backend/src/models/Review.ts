import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminReply {
  adminId: string;
  adminName: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IReview extends Document {
  studentId?: mongoose.Types.ObjectId;
  studentName: string;
  studentEmail: string;
  studentAvatar?: string;
  courseId: string;
  courseTitle: string;
  rating: number; // 1 to 5
  title: string;
  content: string;
  status: 'APPROVED' | 'PENDING' | 'HIDDEN' | 'FLAGGED';
  isVerifiedPurchase: boolean;
  adminReply?: IAdminReply;
  createdAt: Date;
  updatedAt: Date;
}

const adminReplySchema = new Schema<IAdminReply>(
  {
    adminId: { type: String, required: true },
    adminName: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date }
  },
  { _id: false }
);

const reviewSchema = new Schema<IReview>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User' },
    studentName: { type: String, required: true, trim: true },
    studentEmail: { type: String, required: true, trim: true, lowercase: true },
    studentAvatar: { type: String },
    courseId: { type: String, required: true, index: true },
    courseTitle: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ['APPROVED', 'PENDING', 'HIDDEN', 'FLAGGED'],
      default: 'APPROVED',
      index: true
    },
    isVerifiedPurchase: { type: Boolean, default: true },
    adminReply: adminReplySchema
  },
  {
    timestamps: true
  }
);

reviewSchema.index({ courseId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ status: 1, rating: -1 });
reviewSchema.index({ studentEmail: 1 });

export const Review = mongoose.model<IReview>('Review', reviewSchema);

