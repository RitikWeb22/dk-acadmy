/**
 * DK Academy - Universal Mathematical Question Normalization Engine (Frontend)
 */

import { detectInputFormat } from './inputDetector.js';
import { convertHtmlWithMath, ommlNodeToLatex, mathMLNodeToLatex } from './ommlMathMLConverter.js';
import { reconstructLinearEquation } from './linearEquationParser.js';
import { reconstructUnicodeMath } from './unicodeMathReconstructor.js';
import { validateLatex, validateStructuredQuestionLatex } from './latexValidator.js';
import {
  extractStatementAndOptionsPreserving,
  normalizePastedQuestionContent
} from './questionPreserver.js';
import type {
  InputFormatType,
  NormalizationOptions,
  NormalizationResult,
  NormalizedQuestionResult,
  ValidationReport
} from './types.js';

export * from './types.js';
export * from './inputDetector.js';
export * from './domAdapter.js';
export * from './unicodeMathReconstructor.js';
export * from './ommlMathMLConverter.js';
export * from './linearEquationParser.js';
export * from './latexValidator.js';
export * from './questionPreserver.js';
export * from './mathDelimiters.js';

/**
 * Normalizes any mathematical string into standardized LaTeX while executing validation.
 */
export function normalizeMathematicalText(
  rawInput: string,
  options: NormalizationOptions = {}
): NormalizationResult {
  if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
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

  try {
    const sourceType: InputFormatType = detectInputFormat(rawInput);
    let processed = rawInput;

    // 1. Convert markup formats (OMML / MathML / HTML math spans)
    if (sourceType === 'omml-xml' || sourceType === 'mathml-xml' || sourceType === 'html-math') {
      processed = convertHtmlWithMath(processed);
    }

    // 2. Reconstruct Word linear, Unicode, nested radicals, limits, & fractions
    processed = reconstructLinearEquation(processed);

    // 3. Optional wrapping if configured
    if (options.wrapMathInDollars) {
      const trimmed = processed.trim();
      const isAlreadyWrapped =
        (trimmed.startsWith('$') && trimmed.endsWith('$')) ||
        (trimmed.startsWith('\\(') && trimmed.endsWith('\\)')) ||
        (trimmed.startsWith('\\[') && trimmed.endsWith('\\]'));

      if (!isAlreadyWrapped) {
        processed = `$${trimmed}$`;
      }
    }

    // 4. Validate output LaTeX syntax & structure
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
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const fallbackValidation: ValidationReport = {
      isValid: false,
      confidence: 0,
      needsReview: true,
      errors: [`Normalization exception: ${errorMessage}`],
      warnings: [],
      uncertainRegions: ['unhandled-syntax-error']
    };

    return {
      success: false,
      normalizedText: rawInput,
      sourceType: 'mixed',
      confidence: 0,
      warnings: [],
      errors: [errorMessage],
      needsReview: true,
      validation: fallbackValidation
    };
  }
}

/**
 * Reconstructs Word linear equations into equivalent LaTeX without full document processing.
 */
export function reconstructWordEquationLinearFormat(rawText: string): string {
  if (!rawText) return '';
  return reconstructLinearEquation(rawText);
}

/**
 * Shorthand helper to quickly convert any inline or block math string to clean LaTeX.
 */
export function normalizeMathInText(rawText: string, options: NormalizationOptions = {}): string {
  if (!rawText) return '';
  const result = normalizeMathematicalText(rawText, options);
  return result.normalizedText;
}

/**
 * Normalizes multi-part pasted question content (clipboard event, HTML, or raw text).
 */
export function normalizePastedQuestion(
  clipboard: string | any
): NormalizedQuestionResult {
  return normalizePastedQuestionContent(clipboard);
}

/**
 * Validates a single LaTeX formula string for syntax errors and unbalanced delimiters.
 */
export function validateMathLatex(input: string): ValidationReport {
  return validateLatex(input);
}

/**
 * Validates whole question objects including question statements and MCQ option fields.
 */
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