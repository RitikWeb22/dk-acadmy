import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  label: string;
  description?: string;
  usageLimit: number;
  usedCount: number;
  minCoursePrice?: number;
  maxDiscountAmount?: number;
  applicableCourses?: string[];
  isActive: boolean;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    discountType: {
      type: String,
      enum: ['percent', 'flat'],
      default: 'percent',
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 1
    },
    label: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    usageLimit: {
      type: Number,
      required: true,
      min: 1,
      default: 50
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    minCoursePrice: {
      type: Number,
      default: 0
    },
    maxDiscountAmount: {
      type: Number
    },
    applicableCourses: [{
      type: String,
      trim: true
    }],
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    expiryDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

couponSchema.index({ code: 1, isActive: 1 });

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);
