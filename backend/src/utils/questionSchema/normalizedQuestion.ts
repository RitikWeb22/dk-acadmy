/**
 * Common Normalized Question Schema & Adapters (Phase 2 & Phase 5)
 *
 * Provides a standardized question data structure for all document ingestion
 * pipelines (DOCX, PDF, Clipboard, JSON, Manual) while ensuring 100% backward
 * compatibility with existing DppPyq (IProblemQuestion) and TestSeries (ITestQuestion) models.
 */

import { v4 as uuidv4 } from 'uuid';
import type { IProblemQuestion, IProblemOption } from '../../models/DppPyq.js';
import type { ITestQuestion, ITestOption } from '../../models/TestSeries.js';

export type QuestionType =
  | 'SINGLE_CORRECT'
  | 'MULTIPLE_CORRECT'
  | 'NUMERICAL'
  | 'INTEGER'
  | 'ASSERTION_REASON'
  | 'PASSAGE'
  | 'MATCH_FOLLOWING';

export type DifficultyLevel = 'Easy' | 'Moderate' | 'Challenging' | 'Advanced';

export interface ContentBlock {
  id?: string;
  type: 'text' | 'math' | 'image' | 'table';
  content: string;
  displayMode?: boolean;
  meta?: Record<string, any>;
}

export interface NormalizedOption {
  key: string; // 'A', 'B', 'C', 'D', '1', '2', etc.
  text: string;
  blocks?: ContentBlock[];
  imageUrl?: string;
  isCorrect?: boolean;
}

export interface NormalizedQuestion {
  id: string;
  qNum: number;
  statement: string;
  statementBlocks?: ContentBlock[];
  options: NormalizedOption[];
  correctAnswer: string; // 'A' | 'B' | 'C' | 'D' | 'A,B' | numerical answer string
  stepSolution?: string;
  stepSolutionBlocks?: ContentBlock[];
  dkSirShortcut?: string;
  subject: string;
  chapter?: string;
  topic?: string;
  difficulty: DifficultyLevel;
  questionType: QuestionType;
  marks: number;
  negativeMarks: number;
  timeLimitSeconds?: number;
  examYear?: string;
  year?: number | string;
  shift?: string;
  targetExam?: string;
  sourceDocument?: string;
  sourcePage?: number;
  sourceParagraph?: number;
  extractionConfidence: number; // 0 - 100
  status: 'EXTRACTED' | 'NEEDS_REVIEW' | 'VERIFIED';
  reviewReason?: string;
  images?: Array<{ name: string; mimeType: string; dataUrl?: string; id?: string }>;
  tables?: Array<{ rows: string[][] }>;
  isFree?: boolean;
  videoUrl?: string;
  pdfUrl?: string;
}

/**
 * Creates a default normalized question instance
 */
export function createDefaultNormalizedQuestion(partial?: Partial<NormalizedQuestion>): NormalizedQuestion {
  return {
    id: partial?.id || `norm-q-${Date.now()}-${uuidv4().slice(0, 8)}`,
    qNum: partial?.qNum ?? 1,
    statement: partial?.statement || '',
    statementBlocks: partial?.statementBlocks || [],
    options: partial?.options || [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' }
    ],
    correctAnswer: partial?.correctAnswer || 'A',
    stepSolution: partial?.stepSolution || '',
    stepSolutionBlocks: partial?.stepSolutionBlocks || [],
    dkSirShortcut: partial?.dkSirShortcut || '',
    subject: partial?.subject || 'Mathematics',
    chapter: partial?.chapter || '',
    topic: partial?.topic || 'General',
    difficulty: partial?.difficulty || 'Moderate',
    questionType: partial?.questionType || 'SINGLE_CORRECT',
    marks: partial?.marks ?? 4,
    negativeMarks: partial?.negativeMarks ?? 1,
    extractionConfidence: partial?.extractionConfidence ?? 100,
    status: partial?.status || 'EXTRACTED',
    reviewReason: partial?.reviewReason || '',
    isFree: partial?.isFree ?? true,
    ...partial
  };
}

/**
 * Adapts a NormalizedQuestion to IProblemQuestion for DppPyq storage
 */
export function normalizedToProblemQuestion(nq: NormalizedQuestion): IProblemQuestion {
  // Map options ensuring valid keys
  const validKeys: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
  const mappedOptions: IProblemOption[] = (nq.options || []).slice(0, 4).map((opt, idx) => {
    const rawKey = opt.key ? opt.key.toUpperCase() : validKeys[idx] || 'A';
    const key = (validKeys.includes(rawKey as any) ? rawKey : validKeys[idx] || 'A') as 'A' | 'B' | 'C' | 'D';
    return {
      key,
      text: opt.text || ''
    };
  });

  // Ensure 4 options exist for standard MCQ
  while (mappedOptions.length < 4) {
    const nextKey = validKeys[mappedOptions.length] || 'A';
    mappedOptions.push({ key: nextKey, text: '' });
  }

  const rawCorrect = (nq.correctAnswer || 'A').toUpperCase().trim().slice(0, 1);
  const correctKey: 'A' | 'B' | 'C' | 'D' = validKeys.includes(rawCorrect as any)
    ? (rawCorrect as 'A' | 'B' | 'C' | 'D')
    : 'A';

  const diffMap: Record<DifficultyLevel, 'Easy' | 'Moderate' | 'Challenging'> = {
    Easy: 'Easy',
    Moderate: 'Moderate',
    Challenging: 'Challenging',
    Advanced: 'Challenging'
  };

  return {
    id: nq.id,
    qNum: nq.qNum,
    statement: nq.statement,
    statementBlocks: nq.statementBlocks,
    topic: nq.topic || nq.chapter || 'General',
    options: mappedOptions,
    correctKey,
    dkSirShortcut: nq.dkSirShortcut || '',
    stepSolution: nq.stepSolution || '',
    stepSolutionBlocks: nq.stepSolutionBlocks,
    difficulty: diffMap[nq.difficulty] || 'Moderate',
    examYear: nq.examYear || (nq.year ? String(nq.year) : ''),
    year: nq.year,
    isFree: nq.isFree ?? true,
    videoUrl: nq.videoUrl || '',
    pdfUrl: nq.pdfUrl || '',
    structuredContent: nq.statementBlocks as any,
    originalSource: {
      type: nq.sourceDocument,
      preserved: true,
      page: nq.sourcePage
    },
    mathValidation: {
      status: nq.status,
      uncertainExpressions: nq.reviewReason ? [nq.reviewReason] : []
    },
    // Retain full metadata on strict: false schema
    ...((nq as any).questionType ? { questionType: nq.questionType } : {}),
    ...((nq as any).marks ? { marks: nq.marks } : {}),
    ...((nq as any).negativeMarks ? { negativeMarks: nq.negativeMarks } : {})
  } as IProblemQuestion;
}

/**
 * Adapts an existing IProblemQuestion back to NormalizedQuestion
 */
export function problemQuestionToNormalized(
  pq: IProblemQuestion,
  extraMeta?: Partial<NormalizedQuestion>
): NormalizedQuestion {
  return createDefaultNormalizedQuestion({
    id: pq.id || `q-${pq.qNum || 1}-${Date.now()}`,
    qNum: pq.qNum || 1,
    statement: pq.statement || '',
    statementBlocks: (pq as any).statementBlocks || (pq as any).structuredContent || [],
    options: (pq.options || []).map((o) => ({
      key: o.key,
      text: o.text || '',
      isCorrect: o.key === pq.correctKey
    })),
    correctAnswer: pq.correctKey || 'A',
    stepSolution: pq.stepSolution || '',
    stepSolutionBlocks: (pq as any).stepSolutionBlocks,
    dkSirShortcut: pq.dkSirShortcut || '',
    difficulty: (pq.difficulty as DifficultyLevel) || 'Moderate',
    topic: pq.topic || 'General',
    examYear: pq.examYear || (pq.year ? String(pq.year) : ''),
    year: pq.year,
    isFree: pq.isFree ?? true,
    videoUrl: pq.videoUrl || '',
    pdfUrl: pq.pdfUrl || '',
    status: (pq.mathValidation?.status as any) || 'EXTRACTED',
    reviewReason: (pq.mathValidation?.uncertainExpressions || []).join('; '),
    questionType: (pq as any).questionType || 'SINGLE_CORRECT',
    marks: (pq as any).marks ?? 4,
    negativeMarks: (pq as any).negativeMarks ?? 1,
    ...extraMeta
  });
}

/**
 * Adapts NormalizedQuestion to ITestQuestion for TestSeries mock exams
 */
export function normalizedToTestQuestion(nq: NormalizedQuestion): ITestQuestion {
  const options: ITestOption[] = (nq.options || []).map((o) => ({
    id: o.key,
    text: o.text || '',
    imageUrl: o.imageUrl
  }));

  return {
    id: nq.id,
    questionNumber: nq.qNum,
    subject: nq.subject,
    section: 'A',
    type: nq.questionType === 'NUMERICAL' || nq.questionType === 'INTEGER' ? 'NUMERICAL' : 'SINGLE_CORRECT',
    numericalAnswer: nq.questionType === 'NUMERICAL' || nq.questionType === 'INTEGER' ? nq.correctAnswer : undefined,
    chapter: nq.chapter || nq.topic || '',
    statement: nq.statement,
    statementBlocks: nq.statementBlocks,
    imageUrl: nq.images && nq.images.length > 0 ? nq.images[0].dataUrl : undefined,
    options,
    correctAnswer: nq.correctAnswer,
    marks: nq.marks ?? 4,
    negativeMarks: nq.negativeMarks ?? 1,
    explanation: nq.stepSolution,
    explanationBlocks: nq.stepSolutionBlocks,
    shortcutTrick: nq.dkSirShortcut,
    videoSolutionUrl: nq.videoUrl,
    pdfSolutionUrl: nq.pdfUrl,
    structuredContent: nq.statementBlocks as any,
    originalSource: {
      type: nq.sourceDocument,
      preserved: true
    },
    mathValidation: {
      status: nq.status,
      uncertainExpressions: nq.reviewReason ? [nq.reviewReason] : []
    }
  };
}

