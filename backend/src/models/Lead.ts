import mongoose, { Schema, Document } from 'mongoose';

export interface ICounselorNote {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface ILead extends Document {
  leadId: string;
  fullName: string;
  mobile: string;
  email?: string;
  subject?: string;
  message?: string;
  relatedCourse?: string;
  currentClass: string;
  targetBatch: string;
  preferredTime?: string;
  city?: string;
  queryNotes?: string;
  source: string;
  status: 'New' | 'Contacted' | 'Follow-up required' | 'Demo Scheduled' | 'Enrolled' | 'Closed' | 'Dropped';
  priority: 'High' | 'Medium' | 'Low';
  leadScore: number;
  assignedCounselor?: string;
  counselorNotes: ICounselorNote[];
  followUpDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

const counselorNoteSchema = new Schema<ICounselorNote>(
  {
    id: { type: String, required: true },
    author: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: String, required: true }
  },
  { _id: false }
);

const leadSchema = new Schema<ILead>(
  {
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
    assignedCounselor: { type: String, default: 'Admissions Desk Janakpuri' },
    counselorNotes: [counselorNoteSchema],
    followUpDate: { type: String }
  },
  {
    timestamps: true
  }
);

leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ assignedCounselor: 1, status: 1 });
leadSchema.index({ mobile: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ fullName: 'text', mobile: 'text', email: 'text', queryNotes: 'text', message: 'text', subject: 'text' });

export const Lead = mongoose.model<ILead>('Lead', leadSchema);

