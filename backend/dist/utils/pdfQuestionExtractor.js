import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { normalizeMathematicalText } from './universalMathEngine/index.js';
import { extractDocxMath, extractQuestionsFromDocxNative } from './docxMathExtractor.js';
import { extractQuestionsFromPdfPipeline } from './pdfExtractor/pdfPipeline.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Normalizes mathematical characters into standard LaTeX / KaTeX expressions
 * Powered by the Universal Mathematical Normalization Engine.
 */
export function normalizeMathInText(rawText) {
    if (!rawText)
        return '';
    const result = normalizeMathematicalText(rawText);
    return result.normalizedText;
}
/**
 * Parses raw text extracted from PDF into structured questions with validation
 */
export function parseQuestionsFromText(fullText, subject = 'Mathematics', targetExam = 'JEE Main') {
    const errorLog = [];
    if (!fullText || fullText.trim().length === 0) {
        return {
            totalDetected: 0,
            successfulCount: 0,
            needsReviewCount: 0,
            errorCount: 1,
            questions: [],
            rawTextPreview: '',
            totalPages: 1,
            errorLog: ['PDF contains no selectable text. Scanned OCR fallback triggered.']
        };
    }
    // Pre-clean linebreaks and normalize spaces
    let cleanedText = fullText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // Remove page footer markers like "-- 1 of 5 --"
    cleanedText = cleanedText.replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '');
    // 1. Check for separate Answer Key block (e.g. "Answer Key", "Answers:", or trailing answer grid like "1.C 2.D 3.D")
    const answerKeyMap = new Map();
    const ansGridMatch = cleanedText.match(/(?:(?:^|\n)\s*(?:JEE\s+Main[^\n]*\n\s*)?)1\s*[\.:]\s*[A-Da-d0-9][\s\S]*$/i);
    const explicitAnsMatch = cleanedText.match(/(?:Answer\s*Key|Answers?|ANSWERS?)\s*[:\n]([\s\S]+)$/i);
    const matchedAnsKey = explicitAnsMatch || ansGridMatch;
    if (matchedAnsKey && matchedAnsKey.index !== undefined) {
        const keyBlock = matchedAnsKey[0];
        const keyPairRegex = /(\d{1,3})\s*[\.:]\s*([A-Da-d0-9\.\-]+)/g;
        let km;
        while ((km = keyPairRegex.exec(keyBlock)) !== null) {
            const qn = parseInt(km[1], 10);
            const rawAns = km[2].trim().toUpperCase();
            if (!isNaN(qn) && ['A', 'B', 'C', 'D'].includes(rawAns)) {
                answerKeyMap.set(qn, rawAns);
            }
        }
        // Trim answer key block from question statements
        cleanedText = cleanedText.substring(0, matchedAnsKey.index).trim();
    }
    // 2. Identify sequential Question Delimiters:
    // e.g. "1.", "2.Let", "\n3.If", "Q.1", "Question 1:"
    const questionDelimiter = /(?:^|\n)\s*(?:(?:Q\.?|Question)\s*)?(\d{1,3})\s*\.\s*(?=[A-Za-z\(\[\\\|∫√])/g;
    const matches = [];
    let match;
    let expectedQ = 1;
    while ((match = questionDelimiter.exec(cleanedText)) !== null) {
        const qNum = parseInt(match[1], 10);
        // Ensure sequential progression (expectedQ or up to +3), preventing spurious formula matches like "3)dt"
        if (!isNaN(qNum) && qNum >= expectedQ && qNum <= expectedQ + 3) {
            matches.push({
                index: match.index,
                qNum,
                fullMatch: match[0]
            });
            expectedQ = qNum + 1;
        }
    }
    const rawBlocks = [];
    for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const next = matches[i + 1];
        const block = next
            ? cleanedText.substring(current.index, next.index)
            : cleanedText.substring(current.index);
        rawBlocks.push({ qNum: current.qNum, block });
    }
    const questions = [];
    let successfulCount = 0;
    let needsReviewCount = 0;
    for (let idx = 0; idx < rawBlocks.length; idx++) {
        const { qNum, block } = rawBlocks[idx];
        const tempId = `ext-q-${Date.now()}-${idx + 1}-${uuidv4().slice(0, 6)}`;
        // Strip leading question number
        let blockContent = block.replace(/^\s*(?:(?:Q\.?|Question)\s*)?\d{1,3}\s*\.\s*/i, '').trim();
        // Extract shift or year badge if embedded at the end of block (e.g. "JEE Main 2026 (Online) 8th April Evening Shift")
        let shiftBadge = '';
        const shiftMatch = blockContent.match(/(?:^|\n)\s*(JEE\s+Main[^\n]*Shift[^\n]*)/i);
        if (shiftMatch) {
            shiftBadge = shiftMatch[1].trim();
            blockContent = blockContent.replace(shiftMatch[0], '').trim();
        }
        let statement = blockContent;
        const options = [];
        let reviewReasons = [];
        // Find first option position: (A), (1), or uppercase A. / A (excluding 'A =', 'A \in', 'a real', etc.)
        const firstOptionIndex = blockContent.search(/(?:^|\n|\s)(?:\([Aa1]\)|(?<![a-zA-Z0-9])A\.(?!\d)|(?<![a-zA-Z0-9])A\s+(?![=+\-*\/<>\in\le\ge]))/);
        const hasOptB = firstOptionIndex !== -1 && /(?:^|\s|\n)(?:\([Bb2]\)|(?<![a-zA-Z0-9])B\.(?!\d)|(?<![a-zA-Z0-9])B\s+)/.test(blockContent.substring(firstOptionIndex));
        if (firstOptionIndex !== -1 && hasOptB) {
            statement = blockContent.substring(0, firstOptionIndex).trim();
            const optionsBlock = blockContent.substring(firstOptionIndex);
            const optAMatch = optionsBlock.match(/(?:^|\s|\n)(?:\([Aa1]\)|(?<![a-zA-Z0-9])A\.(?!\d)|(?<![a-zA-Z0-9])A\s+)\s*([\s\S]*?)(?=(?:^|\s|\n)(?:\([Bb2]\)|(?<![a-zA-Z0-9])B\.(?!\d)|(?<![a-zA-Z0-9])B\s+)\s*|$)/);
            const optBMatch = optionsBlock.match(/(?:^|\s|\n)(?:\([Bb2]\)|(?<![a-zA-Z0-9])B\.(?!\d)|(?<![a-zA-Z0-9])B\s+)\s*([\s\S]*?)(?=(?:^|\s|\n)(?:\([Cc3]\)|(?<![a-zA-Z0-9])C\.(?!\d)|(?<![a-zA-Z0-9])C\s+)\s*|$)/);
            const optCMatch = optionsBlock.match(/(?:^|\s|\n)(?:\([Cc3]\)|(?<![a-zA-Z0-9])C\.(?!\d)|(?<![a-zA-Z0-9])C\s+)\s*([\s\S]*?)(?=(?:^|\s|\n)(?:\([Dd4]\)|(?<![a-zA-Z0-9])D\.(?!\d)|(?<![a-zA-Z0-9])D\s+)\s*|$)/);
            const optDMatch = optionsBlock.match(/(?:^|\s|\n)(?:\([Dd4]\)|(?<![a-zA-Z0-9])D\.(?!\d)|(?<![a-zA-Z0-9])D\s+)\s*([\s\S]*?)$/);
            options.push({ key: 'A', text: optAMatch ? normalizeMathInText(optAMatch[1].trim()) : '' });
            options.push({ key: 'B', text: optBMatch ? normalizeMathInText(optBMatch[1].trim()) : '' });
            options.push({ key: 'C', text: optCMatch ? normalizeMathInText(optCMatch[1].trim()) : '' });
            options.push({ key: 'D', text: optDMatch ? normalizeMathInText(optDMatch[1].trim()) : '' });
            const missingOptions = options.filter(o => !o.text.trim());
            if (missingOptions.length > 0) {
                reviewReasons.push(`Missing option(s): ${missingOptions.map(o => o.key).join(', ')}`);
            }
        }
        else {
            // Numerical / integer type question: no A-D options
            options.push({ key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' });
        }
        // Mathematical sanitization on statement
        statement = normalizeMathInText(statement);
        if (statement.length < 15) {
            reviewReasons.push('Question statement is unusually brief');
        }
        // Determine suggested answer
        const suggestedAnswer = answerKeyMap.get(qNum) || 'A';
        const needsReview = reviewReasons.length > 0;
        if (needsReview) {
            needsReviewCount++;
        }
        else {
            successfulCount++;
        }
        questions.push({
            tempId,
            qNum: qNum || idx + 1,
            statement,
            topic: shiftBadge || `${subject} PYQ`,
            options,
            suggestedAnswer,
            stepSolution: '',
            dkSirShortcut: '',
            difficulty: 'Moderate',
            status: needsReview ? 'NEEDS_REVIEW' : 'EXTRACTED',
            reviewReason: reviewReasons.join('; '),
            pageNumber: Math.floor(idx / 5) + 1
        });
    }
    // If no questions were delimited by numbers, fallback to block splitting or simulated OCR
    if (questions.length === 0 && cleanedText.trim().length > 50) {
        // Attempt double newline split
        const chunks = cleanedText.split(/\n\s*\n/).filter(c => c.trim().length > 30);
        chunks.slice(0, 30).forEach((chunk, i) => {
            const qNum = i + 1;
            questions.push({
                tempId: `ext-fallback-${Date.now()}-${qNum}`,
                qNum,
                statement: normalizeMathInText(chunk.trim()),
                topic: `${subject} Drill`,
                options: [
                    { key: 'A', text: 'Option A' },
                    { key: 'B', text: 'Option B' },
                    { key: 'C', text: 'Option C' },
                    { key: 'D', text: 'Option D' }
                ],
                suggestedAnswer: 'A',
                stepSolution: '',
                dkSirShortcut: '',
                difficulty: 'Moderate',
                status: 'NEEDS_REVIEW',
                reviewReason: 'Fallback paragraph split: verify statement and options',
                pageNumber: 1
            });
            needsReviewCount++;
        });
    }
    return {
        totalDetected: questions.length,
        successfulCount,
        needsReviewCount,
        errorCount: questions.length === 0 ? 1 : 0,
        questions,
        rawTextPreview: cleanedText.slice(0, 1000),
        totalPages: Math.max(1, Math.ceil(questions.length / 5)),
        errorLog
    };
}
/**
 * Executes the PyMuPDF + RapidOCR high-resolution recognition pipeline
 */
function runPythonOcrPipeline(tempPdfPath, subject, targetExam) {
    return new Promise((resolve) => {
        const candidatePaths = [
            path.resolve(__dirname, '../../scripts/pdf_math_ocr_pipeline.py'),
            path.resolve(__dirname, '../scripts/pdf_math_ocr_pipeline.py'),
            path.resolve(__dirname, '../../../backend/scripts/pdf_math_ocr_pipeline.py'),
            path.resolve(process.cwd(), 'backend/scripts/pdf_math_ocr_pipeline.py'),
            path.resolve(process.cwd(), 'scripts/pdf_math_ocr_pipeline.py'),
            path.resolve(process.cwd(), '../backend/scripts/pdf_math_ocr_pipeline.py')
        ];
        const scriptPath = candidatePaths.find((p) => fs.existsSync(p));
        if (!scriptPath) {
            console.warn('pdf_math_ocr_pipeline.py not found on disk, skipping Python OCR');
            resolve(null);
            return;
        }
        const pyProcess = spawn('python', [
            '-X', 'utf8',
            scriptPath,
            '--input', tempPdfPath,
            '--subject', subject,
            '--exam', targetExam
        ], {
            env: {
                ...process.env,
                PYTHONIOENCODING: 'utf-8',
                PYTHONUTF8: '1'
            }
        });
        let stdout = '';
        let stderr = '';
        pyProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        pyProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        pyProcess.on('close', (code) => {
            if (code === 0 && stdout.trim()) {
                try {
                    const parsed = JSON.parse(stdout.trim());
                    resolve(parsed);
                    return;
                }
                catch (jsonErr) {
                    console.warn('Failed to parse Python OCR JSON output:', jsonErr);
                }
            }
            else {
                console.warn(`Python OCR exited with code ${code}. Stderr: ${stderr.slice(0, 300)}`);
            }
            resolve(null);
        });
        pyProcess.on('error', (err) => {
            console.warn('Failed to spawn Python process:', err.message);
            resolve(null);
        });
        // 45 second timeout for multi-page documents
        setTimeout(() => {
            try {
                pyProcess.kill();
            }
            catch { }
            resolve(null);
        }, 20000);
    });
}
/**
 * Extracts and parses questions from PDF Buffer
 */
/**
 * Extracts and parses questions from PDF Buffer using the independent PDF pipeline
 */
export async function extractQuestionsFromPdfBuffer(buffer, subject = 'Mathematics', targetExam = 'JEE Main') {
    try {
        const pipelineResult = await extractQuestionsFromPdfPipeline(buffer, subject, targetExam);
        if (pipelineResult.questions && pipelineResult.questions.length > 0) {
            const questions = pipelineResult.questions.map((nq, idx) => ({
                tempId: nq.id || `ext-pdf-${Date.now()}-${idx + 1}`,
                qNum: nq.qNum,
                statement: nq.statement,
                topic: nq.topic || `${subject} Question`,
                options: (nq.options || []).map((o) => ({
                    key: (['A', 'B', 'C', 'D'].includes(o.key?.toUpperCase()) ? o.key.toUpperCase() : 'A'),
                    text: o.text || ''
                })),
                suggestedAnswer: (['A', 'B', 'C', 'D'].includes(nq.correctAnswer?.toUpperCase())
                    ? nq.correctAnswer.toUpperCase()
                    : 'A'),
                stepSolution: nq.stepSolution || '',
                dkSirShortcut: nq.dkSirShortcut || '',
                difficulty: (['Easy', 'Moderate', 'Challenging'].includes(nq.difficulty)
                    ? nq.difficulty
                    : 'Moderate'),
                status: nq.status,
                reviewReason: nq.reviewReason || '',
                pageNumber: nq.sourcePage || Math.floor(idx / 5) + 1,
                // Preserve additional normalized fields
                ...(nq.questionType ? { questionType: nq.questionType } : {}),
                ...(nq.marks ? { marks: nq.marks } : {}),
                ...(nq.negativeMarks ? { negativeMarks: nq.negativeMarks } : {})
            }));
            return {
                totalDetected: pipelineResult.totalDetected,
                successfulCount: pipelineResult.successfulCount,
                needsReviewCount: pipelineResult.needsReviewCount,
                errorCount: pipelineResult.errorLog.length,
                questions,
                rawTextPreview: pipelineResult.rawTextPreview,
                totalPages: pipelineResult.totalPages,
                errorLog: pipelineResult.errorLog
            };
        }
    }
    catch (err) {
        console.warn('[PDF Pipeline Notice]: Falling back to standard parser:', err?.message);
    }
    // Fallback to printable text parser
    const str = buffer.toString('utf-8');
    const printable = str.replace(/[^\x20-\x7E\n]/g, ' ');
    return parseQuestionsFromText(printable, subject, targetExam);
}
/**
 * Extracts questions from DOCX buffer using native document-aware OMML pipeline (Phase 3)
 */
export async function extractQuestionsFromDocxBuffer(buffer, subject = 'Mathematics', targetExam = 'JEE Main') {
    try {
        const nativeResult = await extractQuestionsFromDocxNative(buffer, subject, targetExam);
        if (nativeResult.questions && nativeResult.questions.length > 0) {
            const questions = nativeResult.questions.map((nq, idx) => ({
                tempId: nq.id || `ext-docx-${Date.now()}-${idx + 1}`,
                qNum: nq.qNum,
                statement: nq.statement,
                topic: nq.topic || `${subject} Question`,
                options: (nq.options || []).map((o) => ({
                    key: (['A', 'B', 'C', 'D'].includes(o.key?.toUpperCase()) ? o.key.toUpperCase() : 'A'),
                    text: o.text || ''
                })),
                suggestedAnswer: (['A', 'B', 'C', 'D'].includes(nq.correctAnswer?.toUpperCase())
                    ? nq.correctAnswer.toUpperCase()
                    : 'A'),
                stepSolution: nq.stepSolution || '',
                dkSirShortcut: nq.dkSirShortcut || '',
                difficulty: (['Easy', 'Moderate', 'Challenging'].includes(nq.difficulty)
                    ? nq.difficulty
                    : 'Moderate'),
                status: nq.status,
                reviewReason: nq.reviewReason || '',
                pageNumber: Math.floor(idx / 5) + 1,
                // Preserve additional normalized fields
                ...(nq.questionType ? { questionType: nq.questionType } : {}),
                ...(nq.marks ? { marks: nq.marks } : {}),
                ...(nq.negativeMarks ? { negativeMarks: nq.negativeMarks } : {})
            }));
            return {
                totalDetected: nativeResult.totalDetected,
                successfulCount: nativeResult.successfulCount,
                needsReviewCount: nativeResult.needsReviewCount,
                errorCount: nativeResult.errorLog.length,
                questions,
                rawTextPreview: '',
                totalPages: Math.max(1, Math.ceil(questions.length / 5)),
                errorLog: nativeResult.errorLog
            };
        }
    }
    catch (err) {
        console.warn('[DOCX Native Notice]: Falling back to legacy docx parser:', err?.message);
    }
    // Fallback to extractDocxMath + parseQuestionsFromText
    const warnings = [];
    const errorLog = [];
    const result = await extractDocxMath(buffer, warnings, errorLog);
    if (!result.success || result.paragraphs.length === 0) {
        return {
            totalDetected: 0,
            successfulCount: 0,
            needsReviewCount: 0,
            errorCount: 1,
            rawTextPreview: '',
            totalPages: 1,
            questions: [],
            errorLog: errorLog.length > 0 ? errorLog : ['DOCX contained no extractable text.']
        };
    }
    const summary = parseQuestionsFromText(result.rawText, subject, targetExam);
    summary.totalPages = Math.max(1, Math.ceil(summary.questions.length / 5));
    summary.errorLog.push(...errorLog);
    return summary;
}
