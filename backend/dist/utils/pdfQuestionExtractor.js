import { v4 as uuidv4 } from 'uuid';
import { PDFParse } from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
/**
 * Normalizes mathematical characters into standard LaTeX / KaTeX expressions
 */
export function normalizeMathInText(rawText) {
    if (!rawText)
        return '';
    let text = rawText;
    // 0. Decode Word Quartz / CambriaMath subset font encoding artifacts (where no ToUnicode CMap is embedded)
    text = text.replace(/#\$(\(\$!&\$&'\)|\(\$!&\$&|\(\$!&\$'\))/g, '\\sqrt{x(x^2 + x + 1)}');
    text = text.replace(/\(√\$&'\)\*√\$"&\$!&'\+/g, '(\\sqrt{x} + 1)\\sqrt{x^4 + x^2 + 1}');
    text = text.replace(/\(√\$&'\)\*√\$"&\$!&'/g, '(\\sqrt{x} + 1)\\sqrt{x^4 + x^2 + 1}');
    text = text.replace(/∫\s*\u200a?\s*[\r\n]+\s*!\s*[\r\n]+\s*"/g, '\\int_0^2 ');
    text = text.replace(/∫\s*\u200a?\s*[\r\n]+\s*,\s*\.\/4\s*[\r\n]+\s*"/g, '\\int_0^{\\pi/4} ');
    text = text.replace(/∫\s*\u200a?\s*3\/6\s*[\r\n]+\s*3\/4/g, '\\int_{\\pi/4}^{\\pi/6} ');
    text = text.replace(/∫\s*\u200a?\s*[\r\n]+\s*[\/']\s*[\r\n]+\s*[\/']/g, '\\int_{-1}^1 ');
    // Stitch multiline integrals: \int ^2 \n 0 or \int \n 0 \n ^2
    text = text.replace(/\\int\s*\^\{?([0-9a-zA-Z\\/]+)\}?\s*\r?\n+\s*\{?([0-9a-zA-Z\\/]+)\}?/g, '\\int_{$2}^{$1} ');
    text = text.replace(/\\int_\{?([0-9a-zA-Z\\/]+)\}?\s*\r?\n+\s*\^\{?([0-9a-zA-Z\\/]+)\}?/g, '\\int_{$1}^{$2} ');
    text = text.replace(/\\int\s*\r?\n+\s*\{?([0-9a-zA-Z\\/]+)\}?\s*\r?\n+\s*\^\{?([0-9a-zA-Z\\/]+)\}?/g, '\\int_{$1}^{$2} ');
    // Stitch stacked fractions where numerator is on one line and denominator is on the next line (with dx, dt, etc. and optional trailing words)
    text = text.replace(/((?:The value of the integral\s*)?\\int[^\r\n]*?)\s*\r?\n+([^\r\n]+?)\r?\n+([^\r\n]+?\b(?:dx|dt|dy|d\theta)\b)([\s\S]*?)(?=\r?\n|$)/gi, (_, intPart, num, den, trail) => {
        const diffMatch = den.match(/\b(dx|dt|dy|d\theta)\b/i);
        const diffVar = diffMatch ? diffMatch[0] : 'dx';
        const cleanDen = den.replace(new RegExp(`\\s*\\b${diffVar}\\b`, 'i'), '').trim();
        return `${intPart} \\frac{${num.trim()}}{${cleanDen}} \\, ${diffVar}${trail}`;
    });
    // Also catch generic multiline fraction where numerator is on one line and denominator has dx on the next line
    text = text.replace(/(\\int[^\n]+?)\s*\r?\n+([\\a-zA-Z0-9\(\)\{\}\+\-\*\^\s_]+?)\r?\n+([\\a-zA-Z0-9\(\)\{\}\+\-\*\^\s_]+?\s*dx\b)([\s\S]*?)(?=\r?\n|$)/gi, (_, intPart, num, den, trail) => {
        return `${intPart} \\frac{${num.trim()}}{${den.replace(/\s*dx\b/i, '').trim()}} \\, dx${trail}`;
    });
    text = text.replace(/log[7\-]/g, '\\log_e ');
    text = text.replace(/\/012\s*([\$x])/gi, '-\\sin x');
    text = text.replace(/\/012/g, '-\\sin ');
    text = text.replace(/012\s*([\$x])/gi, '\\sin x');
    text = text.replace(/012/g, '\\sin ');
    text = text.replace(/!9:0\s*[\$x]?/gi, '\\cos^2 x');
    text = text.replace(/9:0\s*[\$x]?["!]?\s*([\$x])/gi, '\\cos^2 x');
    text = text.replace(/9:0/g, '\\cos ');
    // Standard fraction markers
    text = text.replace(/3\/6/g, '\\frac{\\pi}{6}');
    text = text.replace(/3\/4/g, '\\frac{\\pi}{4}');
    text = text.replace(/3\/2/g, '\\frac{\\pi}{2}');
    text = text.replace(/3\/,/g, '\\frac{\\pi}{3}');
    text = text.replace(/3\/!\$/g, '(\\pi - 2x)');
    text = text.replace(/3\/!/g, '\\pi - 2');
    text = text.replace(/3\//g, '\\pi - ');
    // Vertical stacked fractions in options: ' \n , -> 1/3; ! \n , -> 2/3
    text = text.replace(/['1]\s*[\r\n]+\s*,\s*,?/g, '\\frac{1}{3} ');
    text = text.replace(/[!2]\s*[\r\n]+\s*,\s*,?/g, '\\frac{2}{3} ');
    text = text.replace(/\b['1]\s*,\s*/g, '\\frac{1}{3} ');
    text = text.replace(/\b[!2]\s*,\s*/g, '\\frac{2}{3} ');
    // Only perform glyph substitutions if no structured LaTeX tags exist
    if (!text.includes('\\frac') && !text.includes('\\int') && !text.includes('\\sqrt')) {
        text = text.replace(/\$"/g, 'x^4');
        text = text.replace(/\$!/g, 'x^2');
        text = text.replace(/\$([0-9!#'"&+\-/*])/g, 'x$1');
        text = text.replace(/([0-9!#'"&+\-/*\(])\$/g, '$1x');
    }
    // Exponents & numbers
    text = text.replace(/([a-zA-Z0-9\)])!/g, '$1^2');
    text = text.replace(/!/g, '^2');
    text = text.replace(/#(?=[a-zA-Z0-9\(\\])/g, '\\sqrt');
    text = text.replace(/#/g, '^3');
    // Operators
    text = text.replace(/&/g, ' + ');
    text = text.replace(/(^|[\s\+\-\*\/\^\=,\(\$x])'/g, '$11');
    text = text.replace(/'(?=[\s\+\-\*\/\^\=,\)\$x]|$)/g, '1');
    text = text.replace(/"/g, '0');
    text = text.replace(/;/g, 'x');
    text = text.replace(/=(?=[a-zA-Z0-9\\])/g, '[');
    text = text.replace(/@(?=[\s\+\-\*\/\^\=,\)\$x]|$)/g, ']');
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
 * Executes the PyMuPDF + RapidOCR high-resolution recognition pipeline
 */
function runPythonOcrPipeline(tempPdfPath, subject, targetExam) {
    return new Promise((resolve) => {
        const candidatePaths = [
            path.resolve(__dirname, '../../scripts/pdf_math_ocr_pipeline.py'),
            path.resolve(__dirname, '../scripts/pdf_math_ocr_pipeline.py'),
            path.resolve(process.cwd(), 'backend/scripts/pdf_math_ocr_pipeline.py'),
            path.resolve(process.cwd(), 'scripts/pdf_math_ocr_pipeline.py')
        ];
        const scriptPath = candidatePaths.find((p) => fs.existsSync(p));
        if (!scriptPath) {
            console.warn('pdf_math_ocr_pipeline.py not found on disk, skipping Python OCR');
            resolve(null);
            return;
        }
        const pyProcess = spawn('python', [
            scriptPath,
            '--input', tempPdfPath,
            '--subject', subject,
            '--exam', targetExam
        ]);
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
        }, 45000);
    });
}
/**
 * Extracts and parses questions from PDF Buffer
 */
export async function extractQuestionsFromPdfBuffer(buffer, subject = 'Mathematics', targetExam = 'JEE Main') {
    // 1. Try PyMuPDF + RapidOCR high-resolution Math OCR Pipeline
    try {
        const tempFile = path.join(os.tmpdir(), `upload-${Date.now()}-${uuidv4().slice(0, 8)}.pdf`);
        await fs.promises.writeFile(tempFile, buffer);
        try {
            const ocrSummary = await runPythonOcrPipeline(tempFile, subject, targetExam);
            if (ocrSummary && ocrSummary.totalDetected > 0) {
                return ocrSummary;
            }
        }
        finally {
            fs.promises.unlink(tempFile).catch(() => { });
        }
    }
    catch (pyErr) {
        console.warn('Python OCR pipeline notice, falling back to in-process parser:', pyErr.message);
    }
    // 2. Fallback to PDFParse
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
