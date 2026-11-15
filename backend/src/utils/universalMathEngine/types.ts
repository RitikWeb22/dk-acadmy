/**
 * Universal Mathematical Normalization Engine - Types & Interfaces
 * DK Academy JEE & BITSAT Examination Platform
 */

export type InputFormatType =
  | 'omml-xml'
  | 'mathml-xml'
  | 'html-math'
  | 'word-linear'
  | 'unicode-math'
  | 'latex'
  | 'plain-text'
  | 'mixed';

export interface NormalizationOptions {
  preserveExistingLatex?: boolean;
  targetExam?: string;
  wrapMathInDollars?: boolean;
  inlineFractions?: boolean;
  maxNestingDepth?: number;
  // Optional safe flags (non-breaking)
  stripInvisibleChars?: boolean;
  strictSyntaxCheck?: boolean;
}

export interface ConversionFailureDiagnosis {
  questionId?: string;
  qNum?: number;
  expressionIndex?: number;
  rawEquation: string;
  convertedLatex?: string;
  errors: string[];
  warnings: string[];
  canRetry: boolean;
  retrySuggestedFix?: string;
}

export interface ValidationReport {
  isValid: boolean;
  confidence: number;
  needsReview: boolean;
  errors: string[];
  warnings: string[];
  uncertainRegions: string[]; // Exactly string[] as expected
  katexValid?: boolean;
  diagnoses?: ConversionFailureDiagnosis[];
}

export interface NormalizationResult {
  success: boolean;
  normalizedText: string;
  sourceType: InputFormatType;
  confidence: number;
  warnings: string[];
  errors: string[];
  needsReview: boolean;
  validation: ValidationReport;
}

export interface NormalizedOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface NormalizedQuestionResult {
  sourceType: InputFormatType;
  fullNormalizedText: string;
  hasQuestionWithOptions: boolean;
  statement: string;
  options: NormalizedOption[];
  correctKey?: 'A' | 'B' | 'C' | 'D'; // Intact as original
  numericalAnswer?: string;           // Intact as string
  stepSolution?: string;
  dkSirShortcut?: string;
  warnings: string[];
  errors: string[];
  confidence: number;
  needsReview: boolean;
  validation?: ValidationReport;      // Optional so older callers don't fail
}