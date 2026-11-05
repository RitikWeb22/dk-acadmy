/**
 * Independent PDF Document Ingestion Pipeline (Phase 4)
 *
 * Implements a document-aware extraction architecture:
 * 1. PDF Classification: Digital Text, Math-Rich, Scanned, Mixed.
 * 2. Multi-column & reading order reconstruction.
 * 3. Header, footer, watermark & page number suppression.
 * 4. High-confidence mathematical expression reconstruction.
 * 5. Question & Option boundary segmentation.
 * 6. Answer key & explanation association.
 * 7. Pure Node.js zero-external-binary runtime (Hostinger & Linux compatible).
 */

import { PDFParse } from 'pdf-parse';
import crypto from 'crypto';
import { normalizeMathematicalText } from '../universalMathEngine/index.js';
import { validateQuestionLatexStructure } from '../mathLatexValidator.js';
import { classifyQuestion, extractSolutionAndShortcuts } from '../questionClassifier.js';
import type { NormalizedQuestion, ContentBlock } from '../questionSchema/normalizedQuestion.js';
import { createDefaultNormalizedQuestion } from '../questionSchema/normalizedQuestion.js';

export type PdfDocumentClassification =
  | 'DIGITAL_TEXT'
  | 'MATH_RICH'
  | 'SCANNED'
  | 'MIXED';

export interface PdfClassificationReport {
  classification: PdfDocumentClassification;
  totalPages: number;
  totalCharacters: number;
  averageCharsPerPage: number;
  mathSymbolDensity: number; // 0 - 1
  isScannedSuspect: boolean;
  notes: string[];
}

export interface PdfPipelineResult {
  success: boolean;
  classification: PdfClassificationReport;
  questions: NormalizedQuestion[];
  totalDetected: number;
  successfulCount: number;
  needsReviewCount: number;
  rawTextPreview: string;
  totalPages: number;
  warnings: string[];
  errorLog: string[];
}

/**
 * Classifies the PDF document by analyzing text density and mathematical indicators
 */
export async function classifyPdfBuffer(buffer: Buffer): Promise<{
  report: PdfClassificationReport;
  rawText: string;
  totalPages: number;
}> {
  let rawText = '';
  let totalPages = 1;
  const notes: string[] = [];

  try {
    const parser = new (PDFParse as any)({ data: buffer });
    const parsed = await parser.getText();
    rawText = (parsed && parsed.text) || '';
    totalPages = (parsed && parsed.total) || 1;
  } catch (err: any) {
    notes.push(`PDF parser warning: ${err?.message}`);
  }

  const totalCharacters = rawText.trim().length;
  const averageCharsPerPage = totalPages > 0 ? Math.round(totalCharacters / totalPages) : 0;

  // Count mathematical indicators (integrals, Greek letters, superscripts, radicals, exponents, fractions)
  const mathMatches = rawText.match(/[∫∬∭∮∑∏√∛∜αβγδεθλμπστωΔΩ≈≠≤≥±×÷^_{}\\]|lim|sin|cos|tan|log|ln/g) || [];
  const mathSymbolDensity = totalCharacters > 0 ? mathMatches.length / totalCharacters : 0;

  const isScannedSuspect = averageCharsPerPage < 40 && totalCharacters < 200;

  let classification: PdfDocumentClassification = 'DIGITAL_TEXT';

  if (isScannedSuspect) {
    classification = 'SCANNED';
    notes.push('Extremely low selectable text density; document appears scanned or image-based.');
  } else if (mathSymbolDensity > 0.015) {
    classification = 'MATH_RICH';
    notes.push(`High mathematical expression density (${(mathSymbolDensity * 100).toFixed(2)}%).`);
  } else {
    classification = 'DIGITAL_TEXT';
    notes.push('Digital text-based document format detected.');
  }

  return {
    report: {
      classification,
      totalPages,
      totalCharacters,
      averageCharsPerPage,
      mathSymbolDensity,
      isScannedSuspect,
      notes
    },
    rawText,
    totalPages
  };
}

/**
 * Cleans header, footer, watermarks, and page numbers from extracted PDF text
 */
export function cleanPdfHeadersAndFooters(text: string): string {
  if (!text) return '';

  return (
    text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Page numbering: "Page 1 of 12", "-- 1 of 5 --", "1 / 10", "- 1 -"
      .replace(/(?:^|\n)\s*(?:Page\s*\d+\s*(?:of|\/)\s*\d+|--\s*\d+\s*(?:of|\/)\s*\d+\s*--|-\s*\d+\s*-)\s*(?=\n|$)/gi, '\n')
      // Common coaching headers / test series watermarks (matches whole header line)
      .replace(/(?:^|\n)[^\n]*(?:DK\s*ACADEMY|JEE\s*\(MAIN\s*\+\s*ADVANCED\)|TEST\s*ID\s*:\s*[A-Z0-9\-]+|TIME\s*:\s*\d+\s*HOURS?|MAX(?:IMUM)?\s*MARKS?\s*:\s*\d+)[^\n]*(?=\n|$)/gi, '\n')
      // Repeated multi-space gaps
      .replace(/[ \t]{4,}/g, '  ')
  );
}

/**
 * De-interleaves two-column text layout when columns are side-by-side
 */
export function resolveMultiColumnReadingOrder(text: string): string {
  const lines = text.split('\n');
  const reconstructed: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check if line contains a clear two-column split with a second question or option delimiter in second half
    const columnSplitMatch = line.match(/^(.{25,70}?)\s{6,}(Q\.?\s*\d{1,3}[\.:\)]\s*.*)$/i);
    if (columnSplitMatch) {
      reconstructed.push(columnSplitMatch[1].trim());
      reconstructed.push(columnSplitMatch[2].trim());
    } else {
      reconstructed.push(line);
    }
  }

  return reconstructed.join('\n');
}

/**
 * Executes the independent PDF question extraction pipeline
 */
export async function extractQuestionsFromPdfPipeline(
  buffer: Buffer,
  subject: string = 'Mathematics',
  targetExam: string = 'JEE Main'
): Promise<PdfPipelineResult> {
  const warnings: string[] = [];
  const errorLog: string[] = [];

  // 1. Classify PDF
  const { report, rawText, totalPages } = await classifyPdfBuffer(buffer);

  if (report.classification === 'SCANNED') {
    warnings.push(
      'Document appears to be scanned or contains image-only pages. Text extraction may be incomplete.'
    );
  }

  // 2. Clean headers, footers & resolve columns
  let cleaned = cleanPdfHeadersAndFooters(rawText);
  cleaned = resolveMultiColumnReadingOrder(cleaned);

  // 3. Extract separate Answer Key block if present
  const answerKeyMap = new Map<number, string>();
  const explicitAnsMatch = cleaned.match(/(?:Answer\s*Key|Answers?|ANSWERS?)\s*[:\n]([\s\S]+)$/i);
  const ansGridMatch = cleaned.match(/(?:(?:^|\n)\s*(?:JEE\s+Main[^\n]*\n\s*)?)1\s*[\.:\-]\s*[A-Da-d0-9][\s\S]*$/i);

  const matchedAnsKey = explicitAnsMatch || ansGridMatch;
  if (matchedAnsKey && matchedAnsKey.index !== undefined) {
    const keyBlock = matchedAnsKey[0];
    const keyPairRegex = /(\d{1,3})\s*[\.:\-]\s*([A-Da-d0-9\.\-]+)/g;
    let km;
    while ((km = keyPairRegex.exec(keyBlock)) !== null) {
      const qn = parseInt(km[1], 10);
      const rawAns = km[2].trim().toUpperCase();
      if (!isNaN(qn)) {
        answerKeyMap.set(qn, rawAns);
      }
    }
    // Remove answer key block from body to avoid polluting question statements
    cleaned = cleaned.substring(0, matchedAnsKey.index).trim();
  }

  // 4. Identify Question Delimiters
  // Matches e.g. "1.", "2. Let", "Q.1", "Question 1:", "Q1)"
  const questionDelimiter = /(?:^|\n)\s*(?:(?:Q\.?|Question)\s*)?(\d{1,3})\s*[\.:\)]\s*(?=[A-Za-z\(\[\\\|∫√])/g;

  const matches: { index: number; qNum: number; fullMatch: string }[] = [];
  let match;
  let expectedQ = 1;
  while ((match = questionDelimiter.exec(cleaned)) !== null) {
    const qNum = parseInt(match[1], 10);
    if (!isNaN(qNum) && qNum >= expectedQ && qNum <= expectedQ + 4) {
      matches.push({
        index: match.index,
        qNum,
        fullMatch: match[0]
      });
      expectedQ = qNum + 1;
    }
  }

  const rawBlocks: { qNum: number; block: string }[] = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const block = next
      ? cleaned.substring(current.index, next.index)
      : cleaned.substring(current.index);
    rawBlocks.push({ qNum: current.qNum, block });
  }

  const questions: NormalizedQuestion[] = [];
  let successfulCount = 0;
  let needsReviewCount = 0;

  for (let idx = 0; idx < rawBlocks.length; idx++) {
    const { qNum, block } = rawBlocks[idx];
    let blockContent = block.replace(/^\s*(?:(?:Q\.?|Question)\s*)?\d{1,3}\s*[\.:\)]\s*/i, '').trim();

    // Check embedded shift / exam tag
    let shiftBadge = '';
    const shiftMatch = blockContent.match(/(?:^|\n)\s*(JEE\s+Main[^\n]*Shift[^\n]*)/i);
    if (shiftMatch) {
      shiftBadge = shiftMatch[1].trim();
      blockContent = blockContent.replace(shiftMatch[0], '').trim();
    }

    let statement = blockContent;
    const options: Array<{ key: string; text: string }> = [];
    const reviewReasons: string[] = [];

    // Parse options
    const firstOptionIndex = blockContent.search(
      /(?:^|\n|\s)(?:\([Aa1]\)|(?<![a-zA-Z0-9])A\.(?!\d)|(?<![a-zA-Z0-9])A\s+(?![=+\-*\/<>\in\le\ge]))/
    );
    const hasOptB =
      firstOptionIndex !== -1 &&
      /(?:^|\s|\n)(?:\([Bb2]\)|(?<![a-zA-Z0-9])B\.(?!\d)|(?<![a-zA-Z0-9])B\s+)/.test(
        blockContent.substring(firstOptionIndex)
      );

    let explanationText = '';

    if (firstOptionIndex !== -1 && hasOptB) {
      statement = blockContent.substring(0, firstOptionIndex).trim();
      const optionsBlock = blockContent.substring(firstOptionIndex);

      const optAMatch = optionsBlock.match(
        /(?:^|\s|\n)(?:\([Aa1]\)|(?<![a-zA-Z0-9])A\.(?!\d)|(?<![a-zA-Z0-9])A\s+)\s*([\s\S]*?)(?=(?:^|\s|\n)(?:\([Bb2]\)|(?<![a-zA-Z0-9])B\.(?!\d)|(?<![a-zA-Z0-9])B\s+)\s*|$)/
      );
      const optBMatch = optionsBlock.match(
        /(?:^|\s|\n)(?:\([Bb2]\)|(?<![a-zA-Z0-9])B\.(?!\d)|(?<![a-zA-Z0-9])B\s+)\s*([\s\S]*?)(?=(?:^|\s|\n)(?:\([Cc3]\)|(?<![a-zA-Z0-9])C\.(?!\d)|(?<![a-zA-Z0-9])C\s+)\s*|$)/
      );
      const optCMatch = optionsBlock.match(
        /(?:^|\s|\n)(?:\([Cc3]\)|(?<![a-zA-Z0-9])C\.(?!\d)|(?<![a-zA-Z0-9])C\s+)\s*([\s\S]*?)(?=(?:^|\s|\n)(?:\([Dd4]\)|(?<![a-zA-Z0-9])D\.(?!\d)|(?<![a-zA-Z0-9])D\s+)\s*|$)/
      );
      const optDMatch = optionsBlock.match(
        /(?:^|\s|\n)(?:\([Dd4]\)|(?<![a-zA-Z0-9])D\.(?!\d)|(?<![a-zA-Z0-9])D\s+)\s*([\s\S]*?)$/
      );

      const optAText = optAMatch ? normalizeMathematicalText(optAMatch[1].trim()).normalizedText : '';
      const optBText = optBMatch ? normalizeMathematicalText(optBMatch[1].trim()).normalizedText : '';
      const optCText = optCMatch ? normalizeMathematicalText(optCMatch[1].trim()).normalizedText : '';
      let optDText = optDMatch ? normalizeMathematicalText(optDMatch[1].trim()).normalizedText : '';

      // Check for trailing solution in option D
      const solMatch = optDText.match(/(?:(?:Ans(?:wer)?|Solution|Explanation)\s*[:\-])\s*([\s\S]+)$/i);
      if (solMatch && solMatch.index !== undefined) {
        explanationText = solMatch[1].trim();
        optDText = optDText.substring(0, solMatch.index).trim();
      }

      options.push(
        { key: 'A', text: optAText },
        { key: 'B', text: optBText },
        { key: 'C', text: optCText },
        { key: 'D', text: optDText }
      );

      const missing = options.filter((o) => !o.text.trim());
      if (missing.length > 0) {
        reviewReasons.push(`Missing option(s): ${missing.map((o) => o.key).join(', ')}`);
      }
    } else {
      // Numerical / integer type
      options.push(
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' }
      );
    }

    // Mathematical normalization
    const normStatement = normalizeMathematicalText(statement);
    statement = normStatement.normalizedText;

    if (statement.length < 12) {
      reviewReasons.push('Question statement is unusually brief');
    }

    // Classify question type
    const classification = classifyQuestion(statement, options, targetExam);

    // Extract solutions & shortcuts
    const { stepSolution, dkSirShortcut, answerKey: inlineAns } = extractSolutionAndShortcuts(explanationText);
    const suggestedAnswer = answerKeyMap.get(qNum) || inlineAns || 'A';

    // Validate LaTeX
    const validation = validateQuestionLatexStructure({
      qNum,
      statement,
      options: options.map((o) => ({ key: o.key as any, text: o.text }))
    });

    if (validation.needsReview) {
      reviewReasons.push(...validation.reasons);
    }

    const needsReview = reviewReasons.length > 0;
    if (needsReview) needsReviewCount++;
    else successfulCount++;

    const statementBlocks: ContentBlock[] = [
      {
        id: `blk-pdf-${idx}`,
        type: 'text',
        content: statement
      }
    ];

    const nq = createDefaultNormalizedQuestion({
      id: `pdf-q-${Date.now()}-${idx + 1}-${crypto.randomBytes(3).toString('hex')}`,
      qNum: qNum || idx + 1,
      statement,
      statementBlocks,
      options,
      correctAnswer: suggestedAnswer,
      stepSolution,
      dkSirShortcut,
      subject,
      topic: shiftBadge || `${subject} Problem`,
      questionType: classification.questionType,
      marks: classification.suggestedMarks,
      negativeMarks: classification.suggestedNegativeMarks,
      status: needsReview ? 'NEEDS_REVIEW' : 'EXTRACTED',
      reviewReason: reviewReasons.join('; '),
      extractionConfidence: validation.overallConfidence,
      sourceDocument: 'PDF',
      sourcePage: Math.floor(idx / 5) + 1
    });

    questions.push(nq);
  }

  // Fallback for documents without sequential number boundaries
  if (questions.length === 0 && cleaned.trim().length > 60) {
    const chunks = cleaned.split(/\n\s*\n/).filter((c) => c.trim().length > 30);
    chunks.slice(0, 30).forEach((chunk, i) => {
      const qNum = i + 1;
      const norm = normalizeMathematicalText(chunk.trim()).normalizedText;
      questions.push(
        createDefaultNormalizedQuestion({
          id: `pdf-fallback-${Date.now()}-${qNum}`,
          qNum,
          statement: norm,
          statementBlocks: [{ id: `blk-fall-${i}`, type: 'text', content: norm }],
          options: [
            { key: 'A', text: '' },
            { key: 'B', text: '' },
            { key: 'C', text: '' },
            { key: 'D', text: '' }
          ],
          correctAnswer: 'A',
          subject,
          topic: `${subject} Fallback Drill`,
          questionType: 'SINGLE_CORRECT',
          status: 'NEEDS_REVIEW',
          reviewReason: 'Paragraph chunk fallback; verify statement, options, and key',
          sourceDocument: 'PDF',
          sourcePage: 1
        })
      );
      needsReviewCount++;
    });
  }

  return {
    success: questions.length > 0,
    classification: report,
    questions,
    totalDetected: questions.length,
    successfulCount,
    needsReviewCount,
    rawTextPreview: cleaned.slice(0, 1000),
    totalPages: totalPages || 1,
    warnings,
    errorLog
  };
}

