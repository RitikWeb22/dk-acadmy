/**
 * DK Academy - Universal Mathematical Question Normalization Engine (Frontend)
 */

import { detectInputFormat } from './inputDetector';
import { convertHtmlWithMath, ommlNodeToLatex, mathMLNodeToLatex } from './ommlMathMLConverter';
import { reconstructLinearEquation } from './linearEquationParser';
import { reconstructUnicodeMath } from './unicodeMathReconstructor';
import { validateLatex, validateStructuredQuestionLatex } from './latexValidator';
import {
  extractStatementAndOptionsPreserving,
  normalizePastedQuestionContent
} from './questionPreserver';
import type {
  InputFormatType,
  NormalizationOptions,
  NormalizationResult,
  NormalizedQuestionResult,
  ValidationReport
} from './types';

export * from './types';
export * from './inputDetector';
export * from './domAdapter';
export * from './unicodeMathReconstructor';
export * from './ommlMathMLConverter';
export * from './linearEquationParser';
export * from './latexValidator';
export * from './questionPreserver';

export function normalizeMathematicalText(
  rawInput: string,
  _options: NormalizationOptions = {}
): NormalizationResult {
  if (!rawInput || typeof rawInput !== 'string') {
    const emptyValidation: ValidationReport = {
      isValid: false,
      confidence: 0,
      needsReview: true,
      errors: ['Empty mathematical input'],
      warnings: [],
      uncertainRegions: ['empty']
    };
    return {
      success: false,
      normalizedText: '',
      sourceType: 'plain-text',
      confidence: 0,
      warnings: [],
      errors: ['Empty mathematical input'],
      needsReview: true,
      validation: emptyValidation
    };
  }

  const sourceType = detectInputFormat(rawInput);
  let processed = rawInput;

  if (sourceType === 'omml-xml' || sourceType === 'mathml-xml' || sourceType === 'html-math') {
    processed = convertHtmlWithMath(processed);
  }

  processed = reconstructLinearEquation(processed);
  const validation = validateLatex(processed);

  return {
    success: validation.isValid,
    normalizedText: processed,
    sourceType,
    confidence: validation.confidence,
    warnings: validation.warnings,
    errors: validation.errors,
    needsReview: validation.needsReview,
    validation
  };
}

export function reconstructWordEquationLinearFormat(rawText: string): string {
  if (!rawText) return '';
  return reconstructLinearEquation(rawText);
}

export function normalizeMathInText(rawText: string): string {
  if (!rawText) return '';
  const result = normalizeMathematicalText(rawText);
  return result.normalizedText;
}

export function normalizePastedQuestion(clipboard: any): NormalizedQuestionResult {
  return normalizePastedQuestionContent(clipboard);
}

export function validateMathLatex(input: string): ValidationReport {
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

