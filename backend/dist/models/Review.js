import mongoose, { Schema } from 'mongoose';
const adminReplySchema = new Schema({
    adminId: { type: String, required: true },
    adminName: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date }
}, { _id: false });
const reviewSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'User' },
    studentName: { type: String, required: true, trim: true },
    studentEmail: { type: String, required: true, trim: true, lowercase: true },
    studentAvatar: { type: String },
    courseId: { type: String, required: true, index: true },
    courseTitle: { type: String, required: true },
    lectureId: { type: String, default: '' },
    lectureTitle: { type: String, default: '' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    confidenceLevel: { type: String, default: '' },
    satisfiedWithDepth: { type: String, default: '' },
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
}, {
    timestamps: true
});
reviewSchema.index({ courseId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ status: 1, rating: -1 });
reviewSchema.index({ studentEmail: 1 });
export const Review = mongoose.model('Review', reviewSchema);
