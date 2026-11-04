/**
 * Question Content Preservation Layer (Layer E)
 */

import type { NormalizedOption, NormalizedQuestionResult } from './types';
import { detectInputFormat } from './inputDetector';
import { convertHtmlWithMath } from './ommlMathMLConverter';
import { reconstructLinearEquation } from './linearEquationParser';
import { validateLatex } from './latexValidator';

export function extractStatementAndOptionsPreserving(rawText: string): {
  statement: string;
  options: NormalizedOption[];
  correctKey?: 'A' | 'B' | 'C' | 'D';
  numericalAnswer?: string;
  stepSolution?: string;
  dkSirShortcut?: string;
} {
  if (!rawText || !rawText.trim()) {
    return { statement: '', options: [] };
  }

  const text = rawText.trim();
  let remainingText = text;

  let dkSirShortcut: string | undefined;
  const shortcutMatch = remainingText.match(/(?:DK\s*Sir\s*Shortcut|Inspection\s*Shortcut|Shortcut\s*Method)\s*[:=\-]\s*([\s\S]+?)(?=\n\s*(?:Answer|Ans|Solution|Expl)|\s*$)/i);
  if (shortcutMatch) {
    dkSirShortcut = shortcutMatch[1].trim();
    remainingText = remainingText.replace(shortcutMatch[0], '');
  }

  let stepSolution: string | undefined;
  const solMatch = remainingText.match(/(?:Step-by-step\s*Solution|Solution|Explanation|Detailed\s*Solution)\s*[:=\-]\s*([\s\S]+?)(?=\n\s*(?:Answer|Ans|Shortcut)|\s*$)/i);
  if (solMatch) {
    stepSolution = solMatch[1].trim();
    remainingText = remainingText.replace(solMatch[0], '');
  }

  let correctKey: 'A' | 'B' | 'C' | 'D' | undefined;
  let numericalAnswer: string | undefined;

  const ansKeyMatch = remainingText.match(/(?:Ans(?:wer)?|Correct(?:\s*(?:Key|Option))?|Option)\s*[:=\-]\s*[(]?([A-Da-d1-4])[)]?(?=[,;.\s\n]|$)/i);
  if (ansKeyMatch) {
    const rawVal = ansKeyMatch[1].toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(rawVal)) {
      correctKey = rawVal as 'A' | 'B' | 'C' | 'D';
    } else if (['1', '2', '3', '4'].includes(rawVal)) {
      const numToKeyMap: Record<string, 'A' | 'B' | 'C' | 'D'> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
      correctKey = numToKeyMap[rawVal];
    }
  }

  const numAnsMatch = remainingText.match(/(?:Ans(?:wer)?|Correct(?:\s*(?:Answer|Value))?|Value)\s*[:=\-]\s*(-?[0-9]+(?:\.[0-9]+)?)(?![a-zA-Z])/i);
  if (numAnsMatch && !correctKey) {
    numericalAnswer = numAnsMatch[1].trim();
  }

  const options: NormalizedOption[] = [];
  let statement = remainingText;

  const parenOptionsRegex = /(?:^|[\r\n\s])(?:\(([A-Da-d1-4])\)|([A-Da-d1-4])\.)\s+([\s\S]+?)(?=(?:[\r\n\s]+(?:\([A-Da-d1-4]\)|[A-Da-d1-4]\.)\s+)|(?:\n\s*(?:Ans|Correct|Sol|DK Sir))|$)/gi;

  const foundMatches: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string; fullMatch: string; index: number }> = [];
  let m: RegExpExecArray | null;

  while ((m = parenOptionsRegex.exec(remainingText)) !== null) {
    const rawK = (m[1] || m[2]).toUpperCase();
    let optKey: 'A' | 'B' | 'C' | 'D' | null = null;
    if (['A', 'B', 'C', 'D'].includes(rawK)) {
      optKey = rawK as 'A' | 'B' | 'C' | 'D';
    } else if (['1', '2', '3', '4'].includes(rawK)) {
      const map: Record<string, 'A' | 'B' | 'C' | 'D'> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
      optKey = map[rawK];
    }

    if (optKey) {
      foundMatches.push({
        key: optKey,
        text: m[3].trim(),
        fullMatch: m[0],
        index: m.index
      });
    }
  }

  if (foundMatches.length >= 4) {
    const firstOptIndex = foundMatches[0].index;
    statement = remainingText.substring(0, firstOptIndex).trim();

    for (const matchItem of foundMatches.slice(0, 4)) {
      options.push({
        key: matchItem.key,
        text: matchItem.text
      });
    }
  }

  statement = statement.replace(/(?:Ans(?:wer)?|Correct(?:\s*(?:Key|Option|Answer))?)\s*[:=\-]\s*.*$/i, '').trim();

  return {
    statement,
    options,
    correctKey,
    numericalAnswer,
    stepSolution,
    dkSirShortcut
  };
}

export function normalizePastedQuestionContent(clipboardOrText: any): NormalizedQuestionResult {
  let plain = '';
  let html = '';

  if (typeof clipboardOrText === 'string') {
    plain = clipboardOrText;
  } else if (clipboardOrText && typeof clipboardOrText.getData === 'function') {
    try {
      html = clipboardOrText.getData('text/html') || '';
    } catch {}
    try {
      plain = clipboardOrText.getData('text/plain') || clipboardOrText.getData('text') || '';
    } catch {}
  } else if (clipboardOrText && typeof clipboardOrText === 'object') {
    html = clipboardOrText.html || '';
    plain = clipboardOrText.text || '';
  }

  const sourceType = detectInputFormat(html || plain);

  let reconstructed = '';
  if (html && (sourceType === 'omml-xml' || sourceType === 'mathml-xml' || sourceType === 'html-math')) {
    reconstructed = convertHtmlWithMath(html);
  }

  if (!reconstructed || reconstructed.trim().length === 0) {
    reconstructed = reconstructLinearEquation(plain);
  } else {
    reconstructed = reconstructLinearEquation(reconstructed);
  }

  const extracted = extractStatementAndOptionsPreserving(reconstructed);
  const hasOptions = extracted.options.length === 4;

  const report = validateLatex(extracted.statement);

  return {
    sourceType,
    fullNormalizedText: reconstructed,
    hasQuestionWithOptions: hasOptions,
    statement: extracted.statement,
    options: extracted.options,
    correctKey: extracted.correctKey,
    numericalAnswer: extracted.numericalAnswer,
    stepSolution: extracted.stepSolution,
    dkSirShortcut: extracted.dkSirShortcut,
    warnings: report.warnings,
    errors: report.errors,
    confidence: report.confidence,
    needsReview: report.needsReview
  };
}

