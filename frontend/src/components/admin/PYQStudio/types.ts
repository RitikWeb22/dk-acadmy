export type PyqStudioTab = 'dashboard' | 'papers' | 'create' | 'question-bank' | 'pdf-history';

export type SubjectDomain = 'Mathematics' | 'Physics' | 'Chemistry' | 'Mixed';

export type TargetExamination = 'JEE Main' | 'JEE Advanced' | 'BITSAT' | 'Custom';

export type QuestionType =
  | 'Single Correct MCQ'
  | 'Multiple Correct MCQ'
  | 'Numerical Answer'
  | 'Integer Type'
  | 'Paragraph'
  | 'Match the Following'
  | 'Other';

export type QuestionDifficulty = 'Easy' | 'Moderate' | 'Challenging';

export type PublicationStatus = 'Draft' | 'Scheduled' | 'Published' | 'Archived';

export type AccessMode = 'free' | 'paid';

export interface PyqOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface PyqQuestion {
  id: string;
  qNum: number;
  statement: string;
  subject: SubjectDomain;
  chapter: string;
  topic?: string;
  difficulty: QuestionDifficulty;
  questionType: QuestionType;
  options: PyqOption[];
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
  examYear?: string;
  isFree?: boolean;
  status?: 'EXTRACTED' | 'NEEDS_REVIEW' | 'VERIFIED' | 'REJECTED';
  reviewReason?: string;
}

export interface PyqPaper {
  id: string;
  _id?: string;
  badgeCode: string;
  title: string;
  slug: string;
  moduleType: 'PYQ' | 'DPP' | 'BITSAT';
  subject: SubjectDomain;
  targetExam: string;
  year: number | string;
  chapter: string;
  chapters?: string[];
  categoryLabel: string;
  questionsCount: number;
  durationMinutes: number;
  totalMarks: number;
  positiveMarks: number;
  negativeMarks: number;
  accessMode: AccessMode;
  isFree: boolean;
  price?: number;
  pdfUrl?: string;
  solutionPdfUrl?: string;
  videoUrl?: string;
  videoWalkthroughUrl?: string;
  solutionNote: string;
  status: PublicationStatus;
  scheduledDate?: string;
  scheduledTime?: string;
  attemptsCount: number;
  questions: PyqQuestion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PdfImportRecord {
  id: string;
  fileName: string;
  fileSize: number;
  fileUrl?: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REVIEW_REQUIRED';
  totalDetected: number;
  successfulCount: number;
  needsReviewCount: number;
  errorCount: number;
  targetExam?: string;
  subject?: string;
  year?: number | string;
  paperId?: string;
  extractedQuestions: any[];
  errorLog: string[];
  createdAt: string;
}

export interface QuestionBankItem {
  id: string;
  statement: string;
  subject: SubjectDomain;
  exam: string;
  year: number | string;
  chapter: string;
  topic?: string;
  difficulty: QuestionDifficulty;
  questionType: QuestionType;
  options: PyqOption[];
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
  usedInPapers?: { paperId: string; paperTitle: string }[];
  tags: string[];
  createdAt: string;
}

export const SUBJECT_CHAPTERS: Record<SubjectDomain, string[]> = {
  Mathematics: [
    'Straight Lines',
    'Circles',
    'Parabola',
    'Ellipse & Hyperbola',
    'Definite Integration',
    'Indefinite Integration',
    'Differential Equations',
    'Matrices & Determinants',
    'Vectors & 3D Geometry',
    'Probability & Statistics',
    'Complex Numbers & Quadratic Equations',
    'Binomial Theorem & PnC',
    'Limits, Continuity & Differentiability',
    'Application of Derivatives (AOD)',
    'Sequences and Series',
    'Trigonometric Functions & Equations'
  ],
  Physics: [
    'Kinematics & Projectile Motion',
    'Newton Laws of Motion & Friction',
    'Work, Energy and Power',
    'Rotational Dynamics & CM',
    'Gravitation',
    'Thermodynamics & KTG',
    'Electrostatics & Gauss Law',
    'Current Electricity',
    'Magnetic Effects of Current & Magnetism',
    'Electromagnetic Induction (EMI)',
    'Alternating Current (AC)',
    'Wave Optics & Ray Optics',
    'Dual Nature & Modern Physics',
    'Semiconductors & Logic Gates'
  ],
  Chemistry: [
    'Chemical Bonding & Molecular Structure',
    'Coordination Compounds & d-Block',
    'Chemical & Ionic Equilibrium',
    'Electrochemistry',
    'Chemical Kinetics',
    'Thermodynamics & Thermochemistry',
    'Organic Reaction Mechanism & Haloalkanes',
    'Alcohols, Phenols & Ethers',
    'Aldehydes, Ketones & Carboxylic Acids',
    'Amines & Nitrogen Compounds',
    'Biomolecules & Polymers',
    'p-Block & Periodic Properties'
  ],
  Mixed: [
    'Full Syllabus Mock Drill 1',
    'Full Syllabus Mock Drill 2',
    'JEE Advanced Comprehensive Paper 1',
    'BITSAT 130-Question Speed Mock'
  ]
};

export const EXAM_YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020];
