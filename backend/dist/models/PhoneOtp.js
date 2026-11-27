import mongoose, { Schema } from 'mongoose';
const phoneOtpSchema = new Schema({
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
}, {
    timestamps: true
});
// Automatically expire OTP documents after expiresAt
phoneOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
phoneOtpSchema.index({ phone: 1, purpose: 1 });
export const PhoneOtp = mongoose.model('PhoneOtp', phoneOtpSchema);
