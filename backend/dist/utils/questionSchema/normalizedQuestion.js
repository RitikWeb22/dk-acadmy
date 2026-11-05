/**
 * Common Normalized Question Schema & Adapters (Phase 2 & Phase 5)
 *
 * Provides a standardized question data structure for all document ingestion
 * pipelines (DOCX, PDF, Clipboard, JSON, Manual) while ensuring 100% backward
 * compatibility with existing DppPyq (IProblemQuestion) and TestSeries (ITestQuestion) models.
 */
import { v4 as uuidv4 } from 'uuid';
/**
 * Creates a default normalized question instance
 */
export function createDefaultNormalizedQuestion(partial) {
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
export function normalizedToProblemQuestion(nq) {
    // Map options ensuring valid keys
    const validKeys = ['A', 'B', 'C', 'D'];
    const mappedOptions = (nq.options || []).slice(0, 4).map((opt, idx) => {
        const rawKey = opt.key ? opt.key.toUpperCase() : validKeys[idx] || 'A';
        const key = (validKeys.includes(rawKey) ? rawKey : validKeys[idx] || 'A');
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
    const correctKey = validKeys.includes(rawCorrect)
        ? rawCorrect
        : 'A';
    const diffMap = {
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
        structuredContent: nq.statementBlocks,
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
        ...(nq.questionType ? { questionType: nq.questionType } : {}),
        ...(nq.marks ? { marks: nq.marks } : {}),
        ...(nq.negativeMarks ? { negativeMarks: nq.negativeMarks } : {})
    };
}
/**
 * Adapts an existing IProblemQuestion back to NormalizedQuestion
 */
export function problemQuestionToNormalized(pq, extraMeta) {
    return createDefaultNormalizedQuestion({
        id: pq.id || `q-${pq.qNum || 1}-${Date.now()}`,
        qNum: pq.qNum || 1,
        statement: pq.statement || '',
        statementBlocks: pq.statementBlocks || pq.structuredContent || [],
        options: (pq.options || []).map((o) => ({
            key: o.key,
            text: o.text || '',
            isCorrect: o.key === pq.correctKey
        })),
        correctAnswer: pq.correctKey || 'A',
        stepSolution: pq.stepSolution || '',
        stepSolutionBlocks: pq.stepSolutionBlocks,
        dkSirShortcut: pq.dkSirShortcut || '',
        difficulty: pq.difficulty || 'Moderate',
        topic: pq.topic || 'General',
        examYear: pq.examYear || (pq.year ? String(pq.year) : ''),
        year: pq.year,
        isFree: pq.isFree ?? true,
        videoUrl: pq.videoUrl || '',
        pdfUrl: pq.pdfUrl || '',
        status: pq.mathValidation?.status || 'EXTRACTED',
        reviewReason: (pq.mathValidation?.uncertainExpressions || []).join('; '),
        questionType: pq.questionType || 'SINGLE_CORRECT',
        marks: pq.marks ?? 4,
        negativeMarks: pq.negativeMarks ?? 1,
        ...extraMeta
    });
}
/**
 * Adapts NormalizedQuestion to ITestQuestion for TestSeries mock exams
 */
export function normalizedToTestQuestion(nq) {
    const options = (nq.options || []).map((o) => ({
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
        structuredContent: nq.statementBlocks,
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
