/**
 * Math Import & Render System - Bulk Question Parser & Importer (Step 2)
 *
 * Parses converted Markdown/LaTeX text into structured JEE questions:
 * - Numbering: Q1., 1., (1), Question 1:
 * - Options: (A)/(B)/(C)/(D) or (1)-(4)
 * - Metadata: marks (+4/-1), year/shift tags, section (A/B), topic, subject
 * - Correct answer key detection
 * - KaTeX validation & audit trail assignment
 */

import crypto from 'crypto';
import type { ExtractedQuestionItem, BatchValidationDashboard, AuditLogEntry } from './types.js';
import { normalizeCanonicalMath } from './mathNormalizer.js';
import { validateQuestion, summarizeBatchValidation } from './mathValidator.js';
import { extractDocxToMarkdown } from './pandocExtractor.js';

export interface ParseQuestionsOptions {
  defaultSubject?: string;
  defaultTopic?: string;
  defaultTargetExam?: string;
  positiveMarks?: number;
  negativeMarks?: number;
}

/**
 * Parses raw text containing multiple questions into structured Question items.
 */
export function parseQuestionsFromMarkdown(
  rawText: string,
  options: ParseQuestionsOptions = {}
): { questions: ExtractedQuestionItem[]; dashboard: BatchValidationDashboard } {
  const {
    defaultSubject = 'Mathematics',
    defaultTopic = 'General',
    defaultTargetExam = 'JEE Main',
    positiveMarks = 4,
    negativeMarks = 1
  } = options;

  if (!rawText || !rawText.trim()) {
    return {
      questions: [],
      dashboard: {
        total: 0,
        greenCount: 0,
        yellowCount: 0,
        redCount: 0,
        canPublishAll: true,
        redItemIndices: [],
        yellowItemIndices: []
      }
    };
  }

  // 1. Split text into question chunks by numbering patterns:
  // e.g. "Q1.", "Q.1:", "Question 1.", "\n1. ", "\n(1) "
  const lines = rawText.split(/\r?\n/);
  const rawChunks: string[] = [];
  let currentChunk: string[] = [];

  const qStartRegex = /^(?:Q(?:uestion)?\.?\s*(\d+)[\.:\)]?|\(?(\d+)\)[\.:\s]+)(.*)$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.trim().match(qStartRegex);

    if (match && (currentChunk.length === 0 || /^(?:Q|\(?\d+\))/i.test(line.trim()))) {
      if (currentChunk.length > 0) {
        rawChunks.push(currentChunk.join('\n'));
      }
      currentChunk = [line];
    } else {
      currentChunk.push(line);
    }
  }

  if (currentChunk.length > 0) {
    rawChunks.push(currentChunk.join('\n'));
  }

  // If no numbered chunks were found, treat entire text as single question
  if (rawChunks.length === 0) {
    rawChunks.push(rawText);
  }

  const questions: ExtractedQuestionItem[] = [];

  for (let idx = 0; idx < rawChunks.length; idx++) {
    const chunk = rawChunks[idx].trim();
    if (!chunk) continue;

    const parsed = parseSingleQuestionChunk(chunk, idx + 1, {
      defaultSubject,
      defaultTopic,
      defaultTargetExam,
      positiveMarks,
      negativeMarks
    });

    questions.push(parsed);
  }

  const dashboard = summarizeBatchValidation(questions);

  return { questions, dashboard };
}

/**
 * Parses an individual question chunk into statement, options, metadata, and keys.
 */
function parseSingleQuestionChunk(
  chunk: string,
  indexFallback: number,
  options: ParseQuestionsOptions
): ExtractedQuestionItem {
  // Extract metadata lines: year/shift tags, section
  let year: string | undefined;
  let shift: string | undefined;
  let targetExam = options.defaultTargetExam || 'JEE Main';
  let section: 'A' | 'B' = 'A';
  let positiveMarks = options.positiveMarks ?? 4;
  let negativeMarks = options.negativeMarks ?? 1;

  // Year/shift detection: e.g. "JEE Main 2024 (Online) 27th January Morning Slot"
  const examTagMatch = chunk.match(/\b(JEE\s*(?:Main|Advanced)|BITSAT)\s*(\d{4})?\s*(?:\(([^)]+)\))?\s*([^,\n]*)/i);
  if (examTagMatch) {
    targetExam = examTagMatch[1];
    year = examTagMatch[2] || undefined;
    shift = (examTagMatch[3] ? `${examTagMatch[3]} ` : '') + (examTagMatch[4] || '').trim();
  }

  // Marks tag: e.g. "+4 / -1 Marks" or "+3 / -0"
  const marksMatch = chunk.match(/\+?\s*(\d+)\s*\/\s*[-−]?\s*(\d+)\s*Marks?/i);
  if (marksMatch) {
    positiveMarks = parseInt(marksMatch[1], 10);
    negativeMarks = parseInt(marksMatch[2], 10);
  }

  // Section detection: Section A or Section B / Numerical
  if (/\b(?:Section\s*B|Numerical\s*Answer|Integer\s*Type)\b/i.test(chunk)) {
    section = 'B';
    negativeMarks = 0; // Section B JEE standard
  }

  // Answer key detection: e.g. "Ans: B", "Answer: (2)", "Correct Option - C"
  let correctKey: 'A' | 'B' | 'C' | 'D' | undefined;
  let numericalAnswer: string | undefined;

  const ansMatch = chunk.match(/(?:Ans(?:wer)?|Correct(?:\s*Option|\s*Key)?)\s*[:=\-–]\s*\(?([A-Da-d1-4]|[-−+]?\d+(?:\.\d+)?)\)?/i);
  if (ansMatch) {
    const rawAns = ansMatch[1].toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(rawAns)) {
      correctKey = rawAns as 'A' | 'B' | 'C' | 'D';
    } else if (['1', '2', '3', '4'].includes(rawAns)) {
      const map: Record<string, 'A' | 'B' | 'C' | 'D'> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
      correctKey = map[rawAns];
    } else {
      numericalAnswer = rawAns.replace('−', '-');
    }
  }

  // Solution and shortcut extraction
  let stepSolution: string | undefined;
  let dkSirShortcut: string | undefined;

  const solMatch = chunk.match(/(?:Detailed\s*Solution|Solution|Explanation)\s*[:=\-–]\s*([\s\S]+?)(?=(?:DK\s*Sir\s*Shortcut|Ans|$))/i);
  if (solMatch) {
    stepSolution = normalizeCanonicalMath(solMatch[1].trim());
  }

  const shortcutMatch = chunk.match(/(?:DK\s*Sir\s*Shortcut|Inspection\s*Shortcut|Shortcut\s*Method)\s*[:=\-–]\s*([\s\S]+?)$/i);
  if (shortcutMatch) {
    dkSirShortcut = normalizeCanonicalMath(shortcutMatch[1].trim());
  }

  // Clean metadata labels from statement body
  let cleanChunk = chunk
    .replace(/(?:Ans(?:wer)?|Correct(?:\s*Option|\s*Key)?)\s*[:=\-–].*$/gim, '')
    .replace(/(?:Detailed\s*Solution|Solution|Explanation)\s*[:=\-–][\s\S]*$/gim, '')
    .replace(/(?:DK\s*Sir\s*Shortcut|Inspection\s*Shortcut|Shortcut\s*Method)\s*[:=\-–][\s\S]*$/gim, '');

  // Extract Question Number
  let qNum = indexFallback;
  const numMatch = cleanChunk.match(/^(?:Q(?:uestion)?\.?\s*(\d+)[\.:\)]?|\(?(\d+)\)[\.:\s]+)/i);
  if (numMatch) {
    qNum = parseInt(numMatch[1] || numMatch[2], 10);
    cleanChunk = cleanChunk.replace(/^(?:Q(?:uestion)?\.?\s*\d+[\.:\)]?|\(?\d+\)[\.:\s]+)/i, '');
  }

  // Option Splitting: (A), (B), (C), (D) or (1), (2), (3), (4)
  const optionRegex = /(?:^|\n|\s{2,})(?:\(?([A-Da-d1-4])\)|\b([A-Da-d])[\.:]\s+)([\s\S]+?)(?=(?:(?:\n|\s{2,})(?:\(?[A-Da-d1-4]\)|\b[A-Da-d][\.:]\s+)|$))/g;
  const rawOptions: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }> = [];

  const optKeyMap: Record<string, 'A' | 'B' | 'C' | 'D'> = {
    'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D',
    '1': 'A', '2': 'B', '3': 'C', '4': 'D'
  };

  let optMatch: RegExpExecArray | null;
  let firstOptPos = cleanChunk.length;

  while ((optMatch = optionRegex.exec(cleanChunk)) !== null) {
    const rawKey = (optMatch[1] || optMatch[2]).toUpperCase();
    const key = optKeyMap[rawKey];
    const text = normalizeCanonicalMath(optMatch[3].trim());

    if (key && !rawOptions.some((o) => o.key === key)) {
      rawOptions.push({ key, text });
      if (optMatch.index < firstOptPos) {
        firstOptPos = optMatch.index;
      }
    }
  }

  // The statement is everything before the first option
  let rawStatement = cleanChunk.slice(0, firstOptPos).trim();
  const statement = normalizeCanonicalMath(rawStatement);

  // Validate question and options
  const validation = validateQuestion(statement, rawOptions);

  const auditTrail: AuditLogEntry[] = [
    {
      id: crypto.randomUUID(),
      originalInput: chunk,
      convertedOutput: statement,
      layer: 'pandoc',
      status: validation.overallStatus,
      timestamp: new Date().toISOString(),
      details: {
        optionsCount: rawOptions.length,
        hasKey: Boolean(correctKey),
        canPublish: validation.canPublish
      }
    }
  ];

  return {
    qNum,
    statement,
    options: rawOptions,
    correctKey,
    numericalAnswer,
    positiveMarks,
    negativeMarks,
    section,
    subject: options.defaultSubject,
    topic: options.defaultTopic,
    targetExam,
    year,
    shift,
    stepSolution,
    dkSirShortcut,
    validation,
    auditTrail,
    sourceType: 'pandoc-docx'
  };
}

/**
 * Bulk DOCX Importer: Converts DOCX buffer to Markdown using Pandoc/OMML,
 * parses all questions, marks, and options in one go.
 */
export async function importQuestionsFromDocxBuffer(
  buffer: Buffer,
  options: ParseQuestionsOptions = {}
): Promise<{ questions: ExtractedQuestionItem[]; dashboard: BatchValidationDashboard; usedPandoc: boolean; warnings: string[] }> {
  const { markdown, usedPandoc, warnings } = await extractDocxToMarkdown(
    buffer,
    options.defaultSubject,
    options.defaultTargetExam
  );

  const { questions, dashboard } = parseQuestionsFromMarkdown(markdown, options);

  return {
    questions,
    dashboard,
    usedPandoc,
    warnings
  };
}

