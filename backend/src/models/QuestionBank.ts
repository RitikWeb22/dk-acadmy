import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionBankOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
  imageUrl?: string;
}

export interface IQuestionBankItem extends Document {
  id: string;
  statement: string;
  statementBlocks?: any[];
  imageUrl?: string;
  subject: 'Mathematics' | 'Physics' | 'Chemistry' | 'Mixed';
  exam: string;
  year: number | string;
  chapter: string;
  topic?: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  questionType:
    | 'Single Correct MCQ'
    | 'Multiple Correct MCQ'
    | 'Numerical Answer'
    | 'Integer Type'
    | 'Paragraph'
    | 'Match the Following'
    | 'Other';
  options: IQuestionBankOption[];
  correctKey: 'A' | 'B' | 'C' | 'D';
  correctKeys?: string[];
  numericalAnswer?: number | string;
  numericalTolerance?: number;
  stepSolution: string;
  dkSirShortcut?: string;
  videoUrl?: string;
  pdfUrl?: string;
  diagramUrl?: string;
  accessOverride?: 'inherit' | 'free' | 'paid';
  usageCount: number;
  usedInPapers: { paperId: string; paperTitle: string }[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const optionSchema = new Schema<IQuestionBankOption>(
  {
    key: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    text: { type: String, required: true },
    imageUrl: { type: String }
  },
  { _id: false }
);

const questionBankSchema = new Schema<IQuestionBankItem>(
  {
    id: { type: String, required: true, unique: true, index: true },
    statement: { type: String, required: true },
    statementBlocks: { type: [Schema.Types.Mixed], default: undefined },
    subject: {
      type: String,
      enum: ['Mathematics', 'Physics', 'Chemistry', 'Mixed'],
      required: true,
      default: 'Mathematics'
    },
    exam: { type: String, default: 'JEE Main', index: true },
    year: { type: Schema.Types.Mixed, default: 2024, index: true },
    chapter: { type: String, default: 'General', index: true },
    topic: { type: String, default: 'General' },
    difficulty: {
      type: String,
      enum: ['Easy', 'Moderate', 'Challenging'],
      default: 'Moderate'
    },
    questionType: {
      type: String,
      enum: [
        'Single Correct MCQ',
        'Multiple Correct MCQ',
        'Numerical Answer',
        'Integer Type',
        'Paragraph',
        'Match the Following',
        'Other'
      ],
      default: 'Single Correct MCQ'
    },
    options: { type: [optionSchema], default: [] },
    correctKey: { type: String, enum: ['A', 'B', 'C', 'D'], default: 'A' },
    correctKeys: { type: [String], default: [] },
    numericalAnswer: { type: Schema.Types.Mixed },
    numericalTolerance: { type: Number, default: 0 },
    stepSolution: { type: String, default: '' },
    dkSirShortcut: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    diagramUrl: { type: String, default: '' },
    accessOverride: { type: String, enum: ['inherit', 'free', 'paid'], default: 'inherit' },
    usageCount: { type: Number, default: 0 },
    usedInPapers: [
      {
        paperId: { type: String },
        paperTitle: { type: String }
      }
    ],
    tags: { type: [String], default: [] }
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

questionBankSchema.index({ statement: 'text', chapter: 'text', topic: 'text' });
questionBankSchema.index({ exam: 1, subject: 1, year: 1 });

export const QuestionBank = mongoose.model<IQuestionBankItem>(
  'QuestionBank',
  questionBankSchema
);

