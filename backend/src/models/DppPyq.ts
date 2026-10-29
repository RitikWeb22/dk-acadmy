import mongoose, { Schema, Document } from 'mongoose';

export interface IProblemOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface IProblemQuestion {
  id: string;
  qNum: number;
  statement: string;
  topic: string;
  options: IProblemOption[];
  correctKey: 'A' | 'B' | 'C' | 'D';
  dkSirShortcut?: string;
  stepSolution: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  examYear?: string;
}

export interface IDppPyq extends Document {
  id: string;
  badgeCode: string;
  title: string;
  slug: string;
  moduleType: 'DPP' | 'PYQ' | 'BITSAT';
  subject: 'Mathematics' | 'Physics' | 'Chemistry' | 'Mixed';
  categoryLabel: string;
  questionsCount: number;
  solutionNote: string;
  status: 'Published' | 'Draft' | 'Scheduled' | 'Archived';
  scheduledDate?: string;
  attemptsCount: number;
  questions: IProblemQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const optionSchema = new Schema<IProblemOption>(
  {
    key: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    text: { type: String, required: true }
  },
  { _id: false }
);

const questionSchema = new Schema<IProblemQuestion>(
  {
    id: { type: String, required: true },
    qNum: { type: Number, required: true },
    statement: { type: String, required: true },
    topic: { type: String, required: true, default: 'General' },
    options: { type: [optionSchema], default: [] },
    correctKey: { type: String, enum: ['A', 'B', 'C', 'D'], required: true, default: 'A' },
    dkSirShortcut: { type: String, default: '' },
    stepSolution: { type: String, default: '' },
    difficulty: { type: String, enum: ['Easy', 'Moderate', 'Challenging'], default: 'Moderate' },
    examYear: { type: String }
  },
  { _id: false }
);

const dppPyqSchema = new Schema<IDppPyq>(
  {
    id: { type: String, required: true, unique: true, index: true },
    badgeCode: { type: String, required: true, default: 'DPP' },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    moduleType: { type: String, enum: ['DPP', 'PYQ', 'BITSAT'], required: true, default: 'DPP' },
    subject: {
      type: String,
      enum: ['Mathematics', 'Physics', 'Chemistry', 'Mixed'],
      required: true,
      default: 'Mathematics'
    },
    categoryLabel: { type: String, required: true, default: 'Practice Drill' },
    questionsCount: { type: Number, default: 0 },
    solutionNote: { type: String, default: 'Detailed Step Solutions Available' },
    status: {
      type: String,
      enum: ['Published', 'Draft', 'Scheduled', 'Archived'],
      default: 'Published',
      index: true
    },
    scheduledDate: { type: String },
    attemptsCount: { type: Number, default: 0 },
    questions: { type: [questionSchema], default: [] }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

dppPyqSchema.index({ status: 1, subject: 1 });
dppPyqSchema.index({ status: 1, createdAt: -1 });

export const DppPyq = mongoose.model<IDppPyq>('DppPyq', dppPyqSchema);
