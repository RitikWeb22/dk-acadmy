import mongoose, { Schema } from 'mongoose';
const counselorNoteSchema = new Schema({
    id: { type: String, required: true },
    author: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: String, required: true }
}, { _id: false });
const leadSchema = new Schema({
    leadId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    subject: { type: String, trim: true, default: 'General Admissions & JEE Guidance' },
    message: { type: String, trim: true },
    relatedCourse: { type: String, trim: true },
    currentClass: { type: String, required: true, default: 'Class 11th' },
    targetBatch: { type: String, required: true, default: 'JEE Main & Advanced Complete' },
    preferredTime: { type: String, default: 'Evening' },
    city: { type: String, default: 'New Delhi' },
    queryNotes: { type: String },
    source: { type: String, default: 'Website Inquiry' },
    status: {
        type: String,
        enum: ['New', 'Contacted', 'Follow-up required', 'Demo Scheduled', 'Enrolled', 'Closed', 'Dropped'],
        default: 'New'
    },
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
    },
    leadScore: { type: Number, default: 70 },
    assignedCounselor: { type: String, default: 'Admissions Desk Dwarka' },
    counselorNotes: [counselorNoteSchema],
    followUpDate: { type: String }
}, {
    timestamps: true
});
leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ assignedCounselor: 1, status: 1 });
leadSchema.index({ mobile: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ fullName: 'text', mobile: 'text', email: 'text', queryNotes: 'text', message: 'text', subject: 'text' });
export const Lead = mongoose.model('Lead', leadSchema);
