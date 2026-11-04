/**
 * DK Academy - Universal DOCX, Google Docs, MathML & OMML Clipboard Normalizer
 * Backwards-compatible adapter powered by the Universal Mathematical Normalization Engine.
 */

import {
  GREEK_LATEX_MAP,
  OPERATOR_LATEX_MAP,
  reconstructUnicodeMath,
  cleanInvisibleCharacters,
  ommlNodeToLatex as engineOmmlToLatex,
  mathMLNodeToLatex as engineMathMLToLatex,
  convertHtmlWithMath,
  reconstructLinearEquation,
  extractStatementAndOptionsPreserving,
  normalizePastedQuestionContent
} from './universalMathEngine';
import type { NormalizedOption as EngineNormalizedOption } from './universalMathEngine/types';

export interface NormalizedOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface NormalizedQuestionResult {
  sourceType: 'omml-html' | 'mathml-html' | 'standard-html' | 'unicode-plain-text';
  fullNormalizedText: string;
  hasQuestionWithOptions: boolean;
  statement: string;
  options: NormalizedOption[];
  correctKey?: 'A' | 'B' | 'C' | 'D';
  numericalAnswer?: string;
  stepSolution?: string;
  dkSirShortcut?: string;
  warnings: string[];
  confidence: number;
}

export const GREEK_MATH_MAP: Record<string, string> = GREEK_LATEX_MAP;
export const OPERATOR_MAP: Record<string, string> = OPERATOR_LATEX_MAP;

/**
 * Reconstructs Unicode math symbols into LaTeX counterparts.
 */
export function cleanMathSymbols(text: string): string {
  if (!text) return '';
  return reconstructUnicodeMath(text);
}

/**
 * Safely strips HTML markup while decoding basic whitespace and entities.
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts an OMML DOM Node directly into LaTeX.
 */
export function ommlNodeToLatex(node: Node): string {
  if (!node) return '';
  return engineOmmlToLatex(node);
}

/**
 * Converts a MathML DOM Node directly into LaTeX.
 */
export function mathMLNodeToLatex(node: Node): string {
  if (!node) return '';
  return engineMathMLToLatex(node);
}

/**
 * Parses mixed HTML strings containing MathML, OMML, or HTML superscripts/subscripts into LaTeX.
 */
export function convertHtmlWithMathToLatex(htmlString: string): string {
  if (!htmlString) return '';
  return convertHtmlWithMath(htmlString);
}

/**
 * Normalizes Unicode math and linear equations in plain text to standard LaTeX.
 */
export function normalizeUnicodeMathText(raw: string): string {
  if (!raw) return '';
  return reconstructLinearEquation(raw);
}

/**
 * High-level parser for pasted clipboard content across DOCX, Word Online, Google Docs, and web browsers.
 */
export function normalizePastedQuestion(
  clipboardPayload: DataTransfer | { html?: string; text: string } | string | any
): NormalizedQuestionResult {
  const result = normalizePastedQuestionContent(clipboardPayload);

  // Map internal engine format back to adapter's strict union
  let mappedSource: 'omml-html' | 'mathml-html' | 'standard-html' | 'unicode-plain-text' = 'unicode-plain-text';
  if (result.sourceType === 'omml-xml') {
    mappedSource = 'omml-html';
  } else if (result.sourceType === 'mathml-xml') {
    mappedSource = 'mathml-html';
  } else if (result.sourceType === 'html-math') {
    mappedSource = 'standard-html';
  } else {
    mappedSource = 'unicode-plain-text';
  }

  return {
    sourceType: mappedSource,
    fullNormalizedText: result.fullNormalizedText || '',
    hasQuestionWithOptions: Boolean(result.hasQuestionWithOptions),
    statement: result.statement || '',
    options: result.options || [],
    correctKey: result.correctKey,
    numericalAnswer: result.numericalAnswer,
    stepSolution: result.stepSolution,
    dkSirShortcut: result.dkSirShortcut,
    warnings: result.warnings || [],
    confidence: typeof result.confidence === 'number' ? result.confidence : 1
  };
}

/**
 * Splits question raw text into statement, options (A-D), answer keys, and solutions.
 */
export function extractQuestionStatementAndOptions(rawText: string): {
  statement: string;
  options: NormalizedOption[];
  correctKey?: 'A' | 'B' | 'C' | 'D';
  numericalAnswer?: string;
  stepSolution?: string;
  dkSirShortcut?: string;
} {
  if (!rawText) {
    return {
      statement: '',
      options: []
    };
  }
  return extractStatementAndOptionsPreserving(rawText);
}