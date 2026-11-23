import mongoose, { Schema, Document } from 'mongoose';

export interface IProblemOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
  imageUrl?: string;
}

export interface IProblemQuestion {
  id: string;
  qNum: number;
  statement: string;
  statementBlocks?: any[];
  imageUrl?: string;
  diagramUrl?: string;
  topic: string;
  questionType?: string;
  options: IProblemOption[];
  correctKey: 'A' | 'B' | 'C' | 'D';
  numericalAnswer?: string;
  dkSirShortcut?: string;
  stepSolution: string;
  stepSolutionBlocks?: any[];
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  examYear?: string;
  year?: number | string;
  isFree?: boolean;
  videoUrl?: string;
  pdfUrl?: string;
  structuredContent?: Array<{ type: string; text?: string; latex?: string }>;
  originalSource?: { type?: string; rawText?: string; preserved?: boolean };
  mathValidation?: { status?: string; failedExpressions?: string[]; uncertainExpressions?: string[] };
}

export interface IDppPyq extends Document {
  id: string;
  badgeCode: string;
  title: string;
  slug: string;
  moduleType: 'DPP' | 'PYQ' | 'BITSAT';
  subject: 'Mathematics' | 'Physics' | 'Chemistry' | 'Logical Reasoning' | 'English Proficiency' | 'Logical Reasoning & English' | 'Mixed' | 'General' | string;
  categoryLabel: string;
  chapter?: string;
  examTarget?: string;
  targetClass?: string;
  isFree?: boolean;
  price?: number;
  pdfUrl?: string;
  videoUrl?: string;
  videoWalkthroughUrl?: string;
  questionsCount: number;
  durationMinutes?: number;
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
    text: { type: String, required: true },
    imageUrl: { type: String }
  },
  { _id: false }
);

const questionSchema = new Schema<IProblemQuestion>(
  {
    id: { type: String, required: true },
    qNum: { type: Number, required: true },
    statement: { type: String, required: true },
    imageUrl: { type: String },
    diagramUrl: { type: String },
    topic: { type: String, required: true, default: 'General' },
    questionType: { type: String, default: 'SINGLE_CORRECT' },
    options: { type: [optionSchema], default: [] },
    correctKey: { type: String, enum: ['A', 'B', 'C', 'D'], required: true, default: 'A' },
    numericalAnswer: { type: String, default: '' },
    dkSirShortcut: { type: String, default: '' },
    stepSolution: { type: String, default: '' },
    difficulty: { type: String, enum: ['Easy', 'Moderate', 'Challenging'], default: 'Moderate' },
    examYear: { type: String, default: '' },
    year: { type: Schema.Types.Mixed },
    isFree: { type: Boolean, default: true },
    videoUrl: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },
    structuredContent: { type: [Schema.Types.Mixed], default: undefined },
    originalSource: { type: Schema.Types.Mixed, default: undefined },
    mathValidation: { type: Schema.Types.Mixed, default: undefined }
  },
  { _id: false, strict: false }
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
      required: true,
      default: 'Mathematics'
    },
    categoryLabel: { type: String, required: true, default: 'Practice Drill' },
    chapter: { type: String, default: '' },
    examTarget: { type: String, default: '' },
    targetClass: { type: String, default: '' },
    isFree: { type: Boolean, default: true },
    price: { type: Number, default: 0 },
    pdfUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    videoWalkthroughUrl: { type: String, default: '' },
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
    strict: false,
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
dppPyqSchema.index({ moduleType: 1, subject: 1, status: 1, createdAt: -1 });
dppPyqSchema.index({ chapter: 1, subject: 1 });
dppPyqSchema.index({ title: 'text', categoryLabel: 'text', chapter: 'text' });

export const DppPyq = mongoose.model<IDppPyq>('DppPyq', dppPyqSchema);
