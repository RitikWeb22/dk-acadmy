import mongoose, { Schema, Document } from 'mongoose';

export interface IPhoneOtp extends Document {
  phone: string;
  otpHash: string;
  purpose: 'FORGOT_PASSWORD' | 'LOGIN' | 'VERIFY';
  attempts: number;
  verified: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const phoneOtpSchema = new Schema<IPhoneOtp>(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    otpHash: {
      type: String,
      required: true
    },
    purpose: {
      type: String,
      enum: ['FORGOT_PASSWORD', 'LOGIN', 'VERIFY'],
      default: 'FORGOT_PASSWORD'
    },
    attempts: {
      type: Number,
      default: 0
    },
    verified: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Automatically expire OTP documents after expiresAt
phoneOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
phoneOtpSchema.index({ phone: 1, purpose: 1 });

export const PhoneOtp = mongoose.model<IPhoneOtp>('PhoneOtp', phoneOtpSchema);
