import mongoose, { Schema } from 'mongoose';
const orderSchema = new Schema({
    orderId: { type: String, required: true, unique: true, index: true },
    paymentId: { type: String, index: true },
    signature: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    studentName: { type: String, required: true, trim: true },
    studentEmail: { type: String, required: true, trim: true, lowercase: true },
    studentPhone: { type: String, trim: true },
    courseId: { type: String, required: true, index: true },
    courseTitle: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
        type: String,
        enum: ['SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'],
        default: 'PENDING',
        index: true
    },
    refundAmount: { type: Number, default: 0 },
    paymentGateway: { type: String, default: 'Razorpay' },
    notes: { type: Schema.Types.Mixed }
}, {
    timestamps: true
});
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ studentEmail: 1, createdAt: -1 });
export const Order = mongoose.model('Order', orderSchema);
