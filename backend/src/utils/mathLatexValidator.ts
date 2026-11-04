/**
 * DK Academy - Mathematical LaTeX & Syntax Validation Engine
 * Validates extracted mathematical expressions against KaTeX / LaTeX grammar,
 * balanced delimiters, mathematical environments, and font corruption markers.
 * Backwards-compatible adapter backed by the Universal Mathematical Normalization Engine.
 */

import {
  validateLatex,
  validateStructuredQuestionLatex
} from './universalMathEngine/index.js';
import type { ValidationReport } from './universalMathEngine/types.js';

export type MathValidationReport = ValidationReport;

export function validateMathLatex(input: string): MathValidationReport {
  return validateLatex(input);
}

export function validateQuestionLatexStructure(question: {
  qNum?: number;
  statement: string;
  options?: Array<{ key: string; text: string }>;
}): {
  overallConfidence: number;
  needsReview: boolean;
  reasons: string[];
  uncertainRegions: string[];
} {
  return validateStructuredQuestionLatex(question);
}
