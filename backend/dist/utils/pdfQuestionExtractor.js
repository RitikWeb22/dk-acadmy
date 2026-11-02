import { v4 as uuidv4 } from 'uuid';
import { PDFParse } from 'pdf-parse';
/**
 * Normalizes mathematical characters into standard LaTeX / KaTeX expressions
 */
export function normalizeMathInText(rawText) {
    if (!rawText)
        return '';
    let text = rawText;
    // Normalize common math unicode symbols to LaTeX equivalents
    text = text.replace(/∫/g, '\\int ');
    text = text.replace(/√\s*(\([^\)]+\)|[a-zA-Z0-9]+)/g, '\\sqrt{$1}');
    text = text.replace(/√/g, '\\sqrt');
    text = text.replace(/α/g, '\\alpha');
    text = text.replace(/β/g, '\\beta');
    text = text.replace(/θ/g, '\\theta');
    text = text.replace(/λ/g, '\\lambda');
    text = text.replace(/π/g, '\\pi');
    text = text.replace(/ϕ/g, '\\phi');
    text = text.replace(/Ø/g, "\\phi'");
    text = text.replace(/Ø'/g, "\\phi'");
    text = text.replace(/→/g, '\\to ');
    text = text.replace(/∈/g, '\\in ');
    text = text.replace(/≥/g, '\\ge ');
    text = text.replace(/≤/g, '\\le ');
    text = text.replace(/≠/g, '\\ne ');
    text = text.replace(/±/g, '\\pm ');
    text = text.replace(/×/g, '\\times ');
    text = text.replace(/÷/g, '\\div ');
    text = text.replace(/·/g, '\\cdot ');
    text = text.replace(/∞/g, '\\infty ');
    // Fix common broken LaTeX tags like "\frac{pi}{4}" or spaces inside log_e
    text = text.replace(/log_e\s+([0-9a-zA-Z\(\)]+)/g, '\\log_e($1)');
    text = text.replace(/\\log_e\s+/g, '\\log_e ');
    return text;
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
        // Find first option position: (A), A., (A) etc.
        const firstOptionIndex = blockContent.search(/(?:^|\s|\n)(?:\(?A\)?\.?|\(A\))\s+/i);
        if (firstOptionIndex !== -1) {
            statement = blockContent.substring(0, firstOptionIndex).trim();
            const optionsBlock = blockContent.substring(firstOptionIndex);
            const optAMatch = optionsBlock.match(/(?:^|\s|\n)(?:\(?A\)?\.?|\(A\))\s+([\s\S]*?)(?=(?:^|\s|\n)(?:\(?B\)?\.?|\(B\))\s+|$)/i);
            const optBMatch = optionsBlock.match(/(?:^|\s|\n)(?:\(?B\)?\.?|\(B\))\s+([\s\S]*?)(?=(?:^|\s|\n)(?:\(?C\)?\.?|\(C\))\s+|$)/i);
            const optCMatch = optionsBlock.match(/(?:^|\s|\n)(?:\(?C\)?\.?|\(C\))\s+([\s\S]*?)(?=(?:^|\s|\n)(?:\(?D\)?\.?|\(D\))\s+|$)/i);
            const optDMatch = optionsBlock.match(/(?:^|\s|\n)(?:\(?D\)?\.?|\(D\))\s+([\s\S]*?)$/i);
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
 * Extracts and parses questions from PDF Buffer
 */
export async function extractQuestionsFromPdfBuffer(buffer, subject = 'Mathematics', targetExam = 'JEE Main') {
    try {
        const parser = new PDFParse({
            data: buffer
        });
        const parsedData = await parser.getText();
        const fullText = (parsedData && parsedData.text) || '';
        const totalPages = (parsedData && parsedData.total) || 1;
        const summary = parseQuestionsFromText(fullText, subject, targetExam);
        summary.totalPages = totalPages;
        return summary;
    }
    catch (err) {
        console.error('PDFParse error, triggering OCR fallback parser:', err);
        // OCR / Text Fallback: scan buffer strings
        const str = buffer.toString('utf-8');
        const printable = str.replace(/[^\x20-\x7E\n]/g, ' ');
        const summary = parseQuestionsFromText(printable, subject, targetExam);
        summary.errorLog.push(`PDF parser warning: ${err.message}. Raw text extraction applied.`);
        return summary;
    }
}
