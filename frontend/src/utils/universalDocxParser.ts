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
import { parseWordQuestions, cleanWordMathArtifacts } from './wordPasteParser';
import { extractMathFromHtml, normalizeMathString, normalizeOptionMath } from './mathImportRenderSystem/pasteHandler';

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
  needsReview?: boolean;
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
  // Check if raw plain text contains questions that parseWordQuestions can extract
  let htmlText = '';
  let plainText = '';
  if (typeof clipboardPayload === 'string') {
    plainText = clipboardPayload;
  } else if (clipboardPayload && typeof clipboardPayload.getData === 'function') {
    htmlText = clipboardPayload.getData('text/html') || '';
    plainText = clipboardPayload.getData('text/plain') || clipboardPayload.getData('text') || '';
  } else if (clipboardPayload && typeof clipboardPayload === 'object') {
    htmlText = clipboardPayload.html || '';
    plainText = clipboardPayload.text || clipboardPayload.plain || '';
  }

  let textToUse = plainText;
  if (htmlText && (/<(?:m:)?(?:oMath|oMathPara|math)\b|<!--\[if\s+gte\s+msEquation/i.test(htmlText) || /<table|<tr|<p|<span|<div/i.test(htmlText))) {
    const converted = extractMathFromHtml(htmlText);
    if (converted.trim()) {
      textToUse = converted;
    }
  }

  textToUse = cleanWordMathArtifacts(textToUse);
  textToUse = textToUse.replace(/Word HTML dropped part of the question\.\s*The plain-text version was kept and needs review\.\s*/gi, '');

  const wordQuestions = parseWordQuestions(textToUse);
  if (wordQuestions.length > 0) {
    const q0 = wordQuestions[0];
    const hasActualOptions = q0.options.filter(o => o.text && o.text.trim().length > 0).length >= 2;
    return {
      sourceType: htmlText ? 'omml-html' : 'unicode-plain-text',
      fullNormalizedText: q0.statement,
      hasQuestionWithOptions: hasActualOptions,
      statement: q0.statement,
      options: q0.options,
      correctKey: q0.correctKey,
      numericalAnswer: q0.numericalAnswer,
      stepSolution: q0.solution,
      dkSirShortcut: q0.shortcut,
      warnings: [],
      confidence: 1,
      needsReview: false
    };
  }

  // Fallback if no questions detected: normalize statement directly
  const norm = normalizeMathString(textToUse);
  return {
    sourceType: htmlText ? 'omml-html' : 'unicode-plain-text',
    fullNormalizedText: norm,
    hasQuestionWithOptions: false,
    statement: norm,
    options: [],
    correctKey: 'A',
    warnings: [],
    confidence: 1,
    needsReview: false
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
  const wordQuestions = parseWordQuestions(rawText);
  if (wordQuestions.length > 0 && (wordQuestions[0].options.length === 4 || wordQuestions[0].statement)) {
    const q0 = wordQuestions[0];
    return {
      statement: q0.statement,
      options: q0.options,
      correctKey: q0.correctKey,
      numericalAnswer: q0.numericalAnswer,
      stepSolution: q0.solution,
      dkSirShortcut: q0.shortcut
    };
  }
  return extractStatementAndOptionsPreserving(rawText);
}