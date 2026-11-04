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
  targetExam?: string; // 'JEE Main', 'JEE Advanced', etc.
  wrapMathInDollars?: boolean; // wrap standalone formulas in $...$
  inlineFractions?: boolean;
  maxNestingDepth?: number;
}

export interface ValidationReport {
  isValid: boolean;
  confidence: number; // 0.0 to 1.0 based on structural integrity
  needsReview: boolean;
  errors: string[];
  warnings: string[];
  uncertainRegions: string[];
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
  correctKey?: 'A' | 'B' | 'C' | 'D';
  numericalAnswer?: string;
  stepSolution?: string;
  dkSirShortcut?: string;
  warnings: string[];
  errors: string[];
  confidence: number;
  needsReview: boolean;
}

