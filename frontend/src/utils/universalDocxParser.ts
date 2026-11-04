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

export function cleanMathSymbols(text: string): string {
  return reconstructUnicodeMath(text);
}

export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function ommlNodeToLatex(node: Node): string {
  return engineOmmlToLatex(node);
}

export function mathMLNodeToLatex(node: Node): string {
  return engineMathMLToLatex(node);
}

export function convertHtmlWithMathToLatex(htmlString: string): string {
  return convertHtmlWithMath(htmlString);
}

export function normalizeUnicodeMathText(raw: string): string {
  if (!raw) return '';
  return reconstructLinearEquation(raw);
}

export function normalizePastedQuestion(
  clipboardPayload: DataTransfer | { html?: string; text: string }
): NormalizedQuestionResult {
  const result = normalizePastedQuestionContent(clipboardPayload);

  let mappedSource: 'omml-html' | 'mathml-html' | 'standard-html' | 'unicode-plain-text' = 'unicode-plain-text';
  if (result.sourceType === 'omml-xml') mappedSource = 'omml-html';
  else if (result.sourceType === 'mathml-xml') mappedSource = 'mathml-html';
  else if (result.sourceType === 'html-math') mappedSource = 'standard-html';

  return {
    sourceType: mappedSource,
    fullNormalizedText: result.fullNormalizedText,
    hasQuestionWithOptions: result.hasQuestionWithOptions,
    statement: result.statement,
    options: result.options,
    correctKey: result.correctKey,
    numericalAnswer: result.numericalAnswer,
    stepSolution: result.stepSolution,
    dkSirShortcut: result.dkSirShortcut,
    warnings: result.warnings,
    confidence: result.confidence
  };
}

export function extractQuestionStatementAndOptions(rawText: string): {
  statement: string;
  options: NormalizedOption[];
  correctKey?: 'A' | 'B' | 'C' | 'D';
  numericalAnswer?: string;
  stepSolution?: string;
  dkSirShortcut?: string;
} {
  return extractStatementAndOptionsPreserving(rawText);
}
