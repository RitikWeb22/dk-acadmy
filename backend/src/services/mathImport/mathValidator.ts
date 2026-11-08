/**
 * Math Import & Render System - KaTeX Validation Engine (Step 6)
 *
 * Verifies every mathematical block with strict katex.renderToString({ throwOnError: true }).
 * Flags:
 * - Syntax errors
 * - Unbalanced braces and delimiters ($)
 * - Empty \frac{}
 * - [CHECK: ...] markers
 * - Leftover linear fractions
 *
 * Outputs:
 * - GREEN: Completely valid, zero errors, zero unresolved markers.
 * - YELLOW: Converted via OCR/AI, review suggested, non-blocking.
 * - RED: Invalid LaTeX syntax, fatal parsing error, unclosed delimiters. BLOCKS PUBLISHING.
 */

import katex from 'katex';
import type {
  ValidationStatus,
  ValidationIssue,
  ItemValidationResult,
  QuestionValidationSummary,
  BatchValidationDashboard
} from './types.js';

export const KATEX_VALIDATOR_MACROS: Record<string, string> = {
  '\\R': '\\mathbb{R}',
  '\\N': '\\mathbb{N}',
  '\\Z': '\\mathbb{Z}',
  '\\Q': '\\mathbb{Q}',
  '\\C': '\\mathbb{C}',
  '\\d': '\\mathrm{d}',
  '\\diff': '\\frac{\\mathrm{d}#1}{\\mathrm{d}#2}',
};

/**
 * Extracts math formulas from delimited text ($...$ and $$...$$).
 */
export function extractMathTokens(text: string): Array<{ formula: string; isDisplay: boolean; raw: string }> {
  if (!text) return [];
  const tokens: Array<{ formula: string; isDisplay: boolean; raw: string }> = [];

  // Match $$...$$, \[...\], $...$, \(...\)
  const regex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^\$\n]+?\$|\\\([\s\S]+?\\\))/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    let formula = '';
    let isDisplay = false;

    if (raw.startsWith('$$') && raw.endsWith('$$')) {
      formula = raw.slice(2, -2).trim();
      isDisplay = true;
    } else if (raw.startsWith('\\[') && raw.endsWith('\\]')) {
      formula = raw.slice(2, -2).trim();
      isDisplay = true;
    } else if (raw.startsWith('$') && raw.endsWith('$')) {
      formula = raw.slice(1, -1).trim();
      isDisplay = false;
    } else if (raw.startsWith('\\(') && raw.endsWith('\\)')) {
      formula = raw.slice(2, -2).trim();
      isDisplay = false;
    }

    if (formula) {
      tokens.push({ formula, isDisplay, raw });
    }
  }

  return tokens;
}

/**
 * Checks for balanced curly braces in a formula string (excluding escaped \{ and \}).
 */
export function checkBraceBalance(formula: string): boolean {
  let depth = 0;
  for (let i = 0; i < formula.length; i++) {
    const ch = formula[i];
    const prev = i > 0 ? formula[i - 1] : '';
    if (ch === '{' && prev !== '\\') {
      depth++;
    } else if (ch === '}' && prev !== '\\') {
      depth--;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}

/**
 * Checks for balanced dollar signs in a text string.
 */
export function checkDollarBalance(text: string): boolean {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : '';
    if (ch === '$' && prev !== '\\') {
      count++;
    }
  }
  return count % 2 === 0;
}

/**
 * Validates a single text field (statement, option text, or solution).
 */
export function validateTextField(
  text: string,
  isOcrOrAiSourced: boolean = false
): ItemValidationResult {
  const issues: ValidationIssue[] = [];

  if (!text || !text.trim()) {
    return {
      status: 'RED',
      isValid: false,
      issues: [{ type: 'syntax_error', message: 'Field is empty' }]
    };
  }

  // 1. Check for [CHECK: ...] markers
  const checkMatches = text.match(/\[CHECK(?::\s*[^\]]+)?\]/gi);
  if (checkMatches) {
    issues.push({
      type: 'check_marker',
      message: `Unresolved manual check marker found: ${checkMatches.join(', ')}`
    });
  }

  // 2. Check for dollar delimiter parity
  if (!checkDollarBalance(text)) {
    issues.push({
      type: 'unbalanced_delimiter',
      message: 'Unbalanced dollar delimiter ($) in text'
    });
  }

  // 3. Check for empty fractions
  if (/\\(?:d?frac)(?:\{\s*\}\s*\{[^{}]*\}|\{[^{}]*\}\s*\{\s*\})/.test(text)) {
    issues.push({
      type: 'empty_fraction',
      message: 'Empty fraction \\frac{}{} found with missing numerator or denominator'
    });
  }

  // 4. Check for leftover linear fraction artifacts outside delimiters
  const nonDelimited = text.replace(/\$\$[\s\S]*?\$\$|\$[^$\n]+?\$/g, ' ');
  if (/\b[a-zA-Z0-9_\)\]\}]\s*\/\s*\(\s*["']?\s*(?:\\,)?\s*d[a-zA-Z]/i.test(nonDelimited)) {
    issues.push({
      type: 'linear_fraction',
      message: 'Unconverted Word differential residue detected'
    });
  }

  // 5. Test render every math expression with KaTeX throwOnError: true
  const mathTokens = extractMathTokens(text);
  for (const token of mathTokens) {
    if (!checkBraceBalance(token.formula)) {
      issues.push({
        type: 'unbalanced_brace',
        message: 'Unbalanced curly braces in formula',
        expression: token.raw
      });
      continue;
    }

    try {
      katex.renderToString(token.formula, {
        displayMode: token.isDisplay,
        throwOnError: true,
        strict: 'ignore',
        macros: KATEX_VALIDATOR_MACROS
      });
    } catch (err: any) {
      issues.push({
        type: 'syntax_error',
        message: `KaTeX syntax error: ${err.message || 'Invalid LaTeX'}`,
        expression: token.raw
      });
    }
  }

  // Determine status
  const hasFatal = issues.some(
    (i) =>
      i.type === 'syntax_error' ||
      i.type === 'unbalanced_brace' ||
      i.type === 'unbalanced_delimiter' ||
      i.type === 'empty_fraction' ||
      i.type === 'check_marker'
  );

  let status: ValidationStatus = 'GREEN';
  if (hasFatal) {
    status = 'RED';
  } else if (issues.length > 0 || isOcrOrAiSourced) {
    status = 'YELLOW';
  }

  return {
    status,
    isValid: status !== 'RED',
    issues
  };
}

/**
 * Validates an entire question including statement and options.
 * Accepts either:
 * - `validateQuestion(statement: string, options?: Array<{ key: string; text: string }>, isOcrOrAiSourced?: boolean)`
 * - `validateQuestion(questionObj: { statement: string; options?: Array<{ key?: string; text: string } | string>; isOcrOrAiSourced?: boolean; questionNumber?: number })`
 */
export function validateQuestion(
  statementOrObj: string | { statement: string; options?: any[]; isOcrOrAiSourced?: boolean; questionNumber?: number },
  optionsList?: Array<{ key: string; text: string }>,
  isOcrOrAiSourcedParam: boolean = false
): QuestionValidationSummary {
  let statement = '';
  let options: Array<{ key: string; text: string }> = [];
  let isOcrOrAiSourced = isOcrOrAiSourcedParam;
  let qNum: number | undefined;

  if (typeof statementOrObj === 'object' && statementOrObj !== null) {
    statement = statementOrObj.statement || '';
    qNum = statementOrObj.questionNumber;
    isOcrOrAiSourced = Boolean(statementOrObj.isOcrOrAiSourced || isOcrOrAiSourcedParam);
    if (Array.isArray(statementOrObj.options)) {
      options = statementOrObj.options.map((opt: any, idx: number) => {
        if (typeof opt === 'string') {
          return { key: String.fromCharCode(65 + idx), text: opt };
        }
        return {
          key: opt?.key || opt?.id || String.fromCharCode(65 + idx),
          text: opt?.text || ''
        };
      });
    }
  } else {
    statement = typeof statementOrObj === 'string' ? statementOrObj : '';
    options = Array.isArray(optionsList) ? optionsList : [];
    isOcrOrAiSourced = Boolean(isOcrOrAiSourcedParam);
  }

  const statementValidation = validateTextField(statement, isOcrOrAiSourced);
  const optionsStatus: Record<string, ValidationStatus> = {};
  const allIssues: ValidationIssue[] = [...statementValidation.issues];

  let hasRed = statementValidation.status === 'RED';
  let hasYellow = statementValidation.status === 'YELLOW';

  for (const opt of options) {
    const optValidation = validateTextField(opt.text, isOcrOrAiSourced);
    optionsStatus[opt.key] = optValidation.status;
    allIssues.push(...optValidation.issues);

    if (optValidation.status === 'RED') hasRed = true;
    if (optValidation.status === 'YELLOW') hasYellow = true;
  }

  let overallStatus: ValidationStatus = 'GREEN';
  if (hasRed) {
    overallStatus = 'RED';
  } else if (hasYellow) {
    overallStatus = 'YELLOW';
  }

  return {
    questionNumber: qNum,
    statementStatus: statementValidation.status,
    optionsStatus,
    overallStatus,
    canPublish: overallStatus !== 'RED',
    issues: allIssues
  };
}

/**
 * Summarizes validation across a batch of questions for the Admin Dashboard.
 */
export function summarizeBatchValidation(
  questions: Array<any>
): BatchValidationDashboard {
  let greenCount = 0;
  let yellowCount = 0;
  let redCount = 0;
  const redItemIndices: number[] = [];
  const yellowItemIndices: number[] = [];

  questions.forEach((q, idx) => {
    const val: QuestionValidationSummary = q?.overallStatus
      ? q
      : (q?.validation || validateQuestion(q));
    const itemNumber = q?.questionNumber || (idx + 1);

    if (val.overallStatus === 'RED') {
      redCount++;
      redItemIndices.push(itemNumber);
    } else if (val.overallStatus === 'YELLOW') {
      yellowCount++;
      yellowItemIndices.push(itemNumber);
    } else {
      greenCount++;
    }
  });

  return {
    total: questions.length,
    greenCount,
    yellowCount,
    redCount,
    canPublishAll: redCount === 0,
    redItemIndices,
    yellowItemIndices
  };
}
