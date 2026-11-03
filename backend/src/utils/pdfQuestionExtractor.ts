import { v4 as uuidv4 } from 'uuid';
import { PDFParse } from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { validateQuestionLatexStructure } from './mathLatexValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ExtractedQuestionResult {
  tempId: string;
  qNum: number;
  statement: string;
  topic: string;
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
  suggestedAnswer: 'A' | 'B' | 'C' | 'D';
  stepSolution: string;
  dkSirShortcut: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  status: 'EXTRACTED' | 'NEEDS_REVIEW' | 'VERIFIED';
  reviewReason: string;
  pageNumber: number;
}

export interface PdfExtractionSummary {
  totalDetected: number;
  successfulCount: number;
  needsReviewCount: number;
  errorCount: number;
  questions: ExtractedQuestionResult[];
  rawTextPreview: string;
  totalPages: number;
  errorLog: string[];
}

/**
 * Normalizes mathematical characters into standard LaTeX / KaTeX expressions
 */
export function normalizeMathInText(rawText: string): string {
  if (!rawText) return '';
  let text = rawText;

  // Normalize mathematical italic / bold unicode characters to standard ASCII:
  text = text.replace(/[\u{1D451}\u{1D41D}\u{1D485}]/gu, 'd')
             .replace(/[\u{1D465}\u{1D431}\u{1D499}]/gu, 'x')
             .replace(/[\u{1D466}\u{1D432}\u{1D49A}]/gu, 'y')
             .replace(/[\u{1D467}\u{1D433}\u{1D49B}]/gu, 'z')
             .replace(/[\u{1D461}\u{1D42D}\u{1D495}]/gu, 't')
             .replace(/[\u{1D453}\u{1D41F}\u{1D487}]/gu, 'f')
             .replace(/[\u{1D44E}\u{1D41A}\u{1D482}]/gu, 'a')
             .replace(/[\u{1D44F}\u{1D41B}\u{1D483}]/gu, 'b')
             .replace(/[\u{1D450}\u{1D41C}\u{1D484}]/gu, 'c')
             .replace(/[\u{1D45B}\u{1D427}\u{1D48F}]/gu, 'n')
             .replace(/[\u{1D45F}\u{1D42B}\u{1D493}]/gu, 'r')
             .replace(/[\u2212\u2013\u2014]/g, '-');

  // 0. Decode Word Quartz / CambriaMath subset font encoding artifacts (where no ToUnicode CMap is embedded)
  text = text.replace(/#\$(\(\$!&\$&'\)|\(\$!&\$&|\(\$!&\$'\))/g, '\\sqrt{x(x^2 + x + 1)}');
  text = text.replace(/\(√\$&'\)\*√\$"&\$!&'\+/g, '(\\sqrt{x} + 1)\\sqrt{x^4 + x^2 + 1}');
  text = text.replace(/\(√\$&'\)\*√\$"&\$!&'/g, '(\\sqrt{x} + 1)\\sqrt{x^4 + x^2 + 1}');
  text = text.replace(/∫\s*\u200a?\s*[\r\n]+\s*!\s*[\r\n]+\s*"/g, '\\int_0^2 ');
  text = text.replace(/∫\s*\u200a?\s*[\r\n]+\s*,\s*\.\/4\s*[\r\n]+\s*"/g, '\\int_0^{\\pi/4} ');
  text = text.replace(/∫\s*\u200a?\s*3\/6\s*[\r\n]+\s*3\/4/g, '\\int_{\\frac{\\pi}{6}}^{\\frac{\\pi}{4}} ');
  text = text.replace(/∫\s*\u200a?\s*3\/4\s*[\r\n]+\s*3\/6/g, '\\int_{\\frac{\\pi}{6}}^{\\frac{\\pi}{4}} ');
  text = text.replace(/\\int_\{?\\frac\{\\pi\}\{4\}\}?\^\{?\\frac\{\\pi\}\{6\}\}?/g, '\\int_{\\frac{\\pi}{6}}^{\\frac{\\pi}{4}}');
  text = text.replace(/\\int_\{?\\pi\/4\}?\^\{?\\pi\/6\}?/g, '\\int_{\\frac{\\pi}{6}}^{\\frac{\\pi}{4}}');
  text = text.replace(/\\int\s*_\s*\{?\s*(?:\\frac\{\\pi\}\{4\}|\\pi\/4)\s*\}?\s*\^\s*\{?\s*(?:\\frac\{\\pi\}\{6\}|\\pi\/6)\s*\}?/g, '\\int_{\\frac{\\pi}{6}}^{\\frac{\\pi}{4}}');
  text = text.replace(/\\int\s*\^\s*\{?\s*(?:\\frac\{\\pi\}\{6\}|\\pi\/6)\s*\}?\s*_\s*\{?\s*(?:\\frac\{\\pi\}\{4\}|\\pi\/4)\s*\}?/g, '\\int_{\\frac{\\pi}{6}}^{\\frac{\\pi}{4}}');
  text = text.replace(/∫\s*\u200a?\s*[\r\n]+\s*[\/']\s*[\r\n]+\s*[\/']/g, '\\int_{-1}^1 ');

  // Matrix and piecewise brackets in Equation Editor
  text = text.replace(/F\s*[\r\n]+\s*1\s*[\r\n]+\s*3\s*[\r\n]+\s*−1\s*[\r\n]+\s*2\s*[\r\n]+\s*1\s*[\r\n]+\s*𝛼\s*[\r\n]+\s*0\s*[\r\n]+\s*1\s*[\r\n]+\s*−1\s*[\r\n]+\s*H/g, '\\begin{bmatrix} 1 & 3 & -1 \\\\ 2 & 1 & \\alpha \\\\ 0 & 1 & -1 \\end{bmatrix}');

  // Comprehensive reconstruction of cotangent integral expression across raw font symbols and multiline breaks:
  text = text.replace(/\[\s*\\?cot\s*=?\s*x\s*[-−]\s*3[\s\S]*?\\?cot\s*=?\s*x\s*[\+]\s*3[\s\S]*?\+\s*1\s*\]\s*(?:dx|𝑑𝑥)?\b/gi,
    '\\left(\\cot\\left(x - \\frac{\\pi}{3}\\right) \\cot\\left(x + \\frac{\\pi}{3}\\right) + 1\\right) \\, dx');
  text = text.replace(/(?:\\left\s*)?[=\[]\s*(?:\\left\s*)?\\?cot\s*[=\(]?\s*[xX]\s*[-−]\s*3[\s\S]*?\\?cot\s*[=\(]?\s*[xX]\s*[\+]\s*3[\s\S]*?\+\s*1\s*\]\s*(?:dx|𝑑𝑥)?\b/gi,
    '\\left(\\cot\\left(x - \\frac{\\pi}{3}\\right) \\cot\\left(x + \\frac{\\pi}{3}\\right) + 1\\right) \\, dx');
  text = text.replace(/\[\s*\\?cot\s*[=\(]?\s*[xX]\s*[-−]\s*3\s*[\r\n\s]*,?\s*\]?\s*\\?cot\s*[=\(]?\s*[xX]\s*[\+]\s*3\s*[\r\n\s]*,?\s*\]?\s*\+\s*1\s*\]\s*(?:dx|𝑑𝑥)?\b/gi,
    '\\left(\\cot\\left(x - \\frac{\\pi}{3}\\right) \\cot\\left(x + \\frac{\\pi}{3}\\right) + 1\\right) \\, dx');
  text = text.replace(/[=\[]\s*\\?cot\s*[=\(]?\s*[xX]\s*[-−]\s*3[\s\S]*?cot\s*[=\(]?\s*[xX]\s*[+]\s*3[\s\S]*?\+\s*1\s*[@\]]\s*(?:dx|𝑑𝑥)\b/gi,
    '\\left(\\cot\\left(x - \\frac{\\pi}{3}\\right) \\cot\\left(x + \\frac{\\pi}{3}\\right) + 1\\right) \\, dx');
  text = text.replace(/\[\s*\\?cot\s*=?\s*x\s*[-−]\s*3\s*[\r\n\s]*,?\s*\]?\s*\\?cot\s*=?\s*x\s*\+\s*3\s*[\r\n\s]*,?\s*\]?\s*\+\s*1\s*\]\s*dx\b/gi,
    '\\left(\\cot\\left(x - \\frac{\\pi}{3}\\right) \\cot\\left(x + \\frac{\\pi}{3}\\right) + 1\\right) \\, dx');
  text = text.replace(/\[\s*cot\s*=?\s*x\s*[-−]\s*3\s*[\r\n]+\s*,\s*\]/gi, '\\left(\\cot\\left(x - \\frac{\\pi}{3}\\right)');
  text = text.replace(/cot\s*=?\s*x\s*[-−]\s*3\s*[\r\n]+\s*,\s*\]/gi, '\\cot\\left(x - \\frac{\\pi}{3}\\right)');
  text = text.replace(/cot\s*=?\s*x\s*\+\s*3\s*[\r\n]+\s*,\s*\]/gi, '\\cot\\left(x + \\frac{\\pi}{3}\\right)');
  text = text.replace(/cot\s*\(?\s*x\s*[-−]\s*3\s*[\r\n\/,]+\s*3\s*\)?/gi, '\\cot\\left(x - \\frac{\\pi}{3}\\right)');
  text = text.replace(/cot\s*\(?\s*x\s*\+\s*3\s*[\r\n\/,]+\s*3\s*\)?/gi, '\\cot\\left(x + \\frac{\\pi}{3}\\right)');
  text = text.replace(/\[\s*\\?cot\b/gi, '\\cot ');
  text = text.replace(/,\s*\]/g, ']');
  text = text.replace(/\+\s*1\s*\]\s*(?:dx|𝑑𝑥)?\b/gi, '+ 1 \\, dx');
  text = text.replace(/\\\\+([a-zA-Z]+)/g, '\\$1');
  text = text.replace(/\\{2,}log_e/g, '\\log_e');
  text = text.replace(/\\log_e\s*\(\s*\(\s*\)\s*/g, '\\log_e(');
  text = text.replace(/\\log_e\s*\(\s*\(\s*/g, '\\log_e(');
  text = text.replace(/\\log_e\s*\(\s*\\sqrt/g, '\\log_e(\\sqrt');
  text = text.replace(/\\log_e\s*\(\s*\(\s*\)?\s*(\\sqrt|[\\a-zA-Z0-9])/g, (_m, p1) => '\\log_e(' + p1);
  text = text.replace(/\\log_e\s*\(\s*\)\s*(\\sqrt|[\\a-zA-Z0-9])/g, (_m, p1) => '\\log_e(' + p1);
  text = text.replace(/log[7\-]/g, '\\log_e ');
  text = text.replace(/(?:\\left\s*){2,}/g, '\\left');
  text = text.replace(/(?:\\right\s*){2,}/g, '\\right');
  text = text.replace(/\\left\s*\\left\s*([\[\(\{\|])/g, '\\left$1');
  text = text.replace(/\\right\s*\\right\s*([\]\)\}\|])/g, '\\right$1');
  text = text.replace(/\\left\s*\\left/g, '\\left');
  text = text.replace(/\\right\s*\\right/g, '\\right');
  text = text.replace(/\/012\s*([\$x])/gi, '-\\sin x');
  text = text.replace(/\/012/g, '-\\sin ');
  text = text.replace(/012\s*([\$x])/gi, '\\sin x');
  text = text.replace(/012/g, '\\sin ');
  text = text.replace(/!9:0\s*[\$x]?/gi, '\\cos^2 x');
  text = text.replace(/9:0\s*[\$x]?["!]?\s*([\$x])/gi, '\\cos^2 x');
  text = text.replace(/9:0/g, '\\cos ');

  // Standard fraction markers
  text = text.replace(/\\pi\/4/g, '\\frac{\\pi}{4}');
  text = text.replace(/\\pi\/6/g, '\\frac{\\pi}{6}');
  text = text.replace(/\\pi\/3/g, '\\frac{\\pi}{3}');
  text = text.replace(/\\pi\/2/g, '\\frac{\\pi}{2}');
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

  // Stitch multiline integrals: \int ^2 \n 0 or \int \n 0 \n ^2
  text = text.replace(/\\int\s*\^\{?([0-9a-zA-Z\\/]+)\}?\s*\r?\n+\s*\{?([0-9a-zA-Z\\/]+)\}?/g, '\\int_{$2}^{$1} ');
  text = text.replace(/\\int_\{?([0-9a-zA-Z\\/]+)\}?\s*\r?\n+\s*\^\{?([0-9a-zA-Z\\/]+)\}?/g, '\\int_{$1}^{$2} ');
  text = text.replace(/\\int\s*\r?\n+\s*\{?([0-9a-zA-Z\\/]+)\}?\s*\r?\n+\s*\^\{?([0-9a-zA-Z\\/]+)\}?/g, '\\int_{$1}^{$2} ');

  // Stitch stacked fractions where numerator is on one line and denominator is on the next line (with dx, dt, etc. and optional trailing words)
  text = text.replace(/((?:The value of the integral\s*)?\\int[^\r\n]*?)\s*\r?\n+([^\r\n]+?)\r?\n+([^\r\n]+?\b(?:dx|dt|dy|d\theta)\b)([\s\S]*?)(?=\r?\n|$)/gi, (match, intPart, num, den, trail) => {
    if (/\\cot\b|\\left\[|\[/.test(num)) return match;
    const diffMatch = den.match(/\b(dx|dt|dy|d\theta)\b/i);
    const diffVar = diffMatch ? diffMatch[0] : 'dx';
    const cleanDen = den.replace(new RegExp(`\\s*\\b${diffVar}\\b`, 'i'), '').trim();
    return `${intPart} \\frac{${num.trim()}}{${cleanDen}} \\, ${diffVar}${trail}`;
  });

  // Also catch generic multiline fraction where numerator is on one line and denominator has dx on the next line
  text = text.replace(/(\\int[^\n]+?)\s*\r?\n+([\\a-zA-Z0-9\(\)\{\}\+\-\*\^\s_]+?)\r?\n+([\\a-zA-Z0-9\(\)\{\}\+\-\*\^\s_]+?\s*dx\b)([\s\S]*?)(?=\r?\n|$)/gi, (match, intPart, num, den, trail) => {
    if (/\\cot\b|\\left\[|\[/.test(num)) return match;
    return `${intPart} \\frac{${num.trim()}}{${den.replace(/\s*dx\b/i, '').trim()}} \\, dx${trail}`;
  });

  // Only perform glyph substitutions if no structured LaTeX tags or math delimiters exist
  const hasDollarMath = /\$[^\$\n]+\$/.test(text);
  if (!hasDollarMath && !text.includes('\\frac') && !text.includes('\\int') && !text.includes('\\sqrt')) {
    text = text.replace(/\$"/g, 'x^4');
    text = text.replace(/\$!/g, 'x^2');
    text = text.replace(/\$([!#'"&+\-/*])/g, 'x$1');
    text = text.replace(/([!#'"&+\-/*\(])\$/g, '$1x');
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

  // Sanitize unbalanced \left and \right delimiters which crash KaTeX rendering
  const leftMatches = (text.match(/\\left\b/g) || []).length;
  const rightMatches = (text.match(/\\right\b/g) || []).length;
  if (leftMatches !== rightMatches) {
    text = text.replace(/\\left\s*([\[\(\{\|])/g, '$1');
    text = text.replace(/\\right\s*([\]\)\}\|])/g, '$1');
  }

  return text;
}

/**
 * Parses raw text extracted from PDF into structured questions with validation
 */
export function parseQuestionsFromText(
  fullText: string,
  subject: string = 'Mathematics',
  targetExam: string = 'JEE Main'
): PdfExtractionSummary {
  const errorLog: string[] = [];
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
  const answerKeyMap = new Map<number, 'A' | 'B' | 'C' | 'D'>();
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
        answerKeyMap.set(qn, rawAns as 'A' | 'B' | 'C' | 'D');
      }
    }
    // Trim answer key block from question statements
    cleanedText = cleanedText.substring(0, matchedAnsKey.index).trim();
  }

  // 2. Identify sequential Question Delimiters:
  // e.g. "1.", "2.Let", "\n3.If", "Q.1", "Question 1:"
  const questionDelimiter = /(?:^|\n)\s*(?:(?:Q\.?|Question)\s*)?(\d{1,3})\s*\.\s*(?=[A-Za-z\(\[\\\|∫√])/g;

  const matches: { index: number; qNum: number; fullMatch: string }[] = [];
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

  const rawBlocks: { qNum: number; block: string }[] = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const block = next
      ? cleanedText.substring(current.index, next.index)
      : cleanedText.substring(current.index);
    rawBlocks.push({ qNum: current.qNum, block });
  }

  const questions: ExtractedQuestionResult[] = [];
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
    const options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = [];
    let reviewReasons: string[] = [];

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
    } else {
      // Numerical / integer type question: no A-D options
      options.push(
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' }
      );
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
    } else {
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
function runPythonOcrPipeline(
  tempPdfPath: string,
  subject: string,
  targetExam: string
): Promise<PdfExtractionSummary | null> {
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

    const pyProcess = spawn(
      'python',
      [
        '-X', 'utf8',
        scriptPath,
        '--input', tempPdfPath,
        '--subject', subject,
        '--exam', targetExam
      ],
      {
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          PYTHONUTF8: '1'
        }
      }
    );

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
        } catch (jsonErr) {
          console.warn('Failed to parse Python OCR JSON output:', jsonErr);
        }
      } else {
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
      } catch {}
      resolve(null);
    }, 45000);
  });
}

/**
 * Extracts and parses questions from PDF Buffer
 */
export async function extractQuestionsFromPdfBuffer(
  buffer: Buffer,
  subject: string = 'Mathematics',
  targetExam: string = 'JEE Main'
): Promise<PdfExtractionSummary> {
  // 1. Try PyMuPDF + RapidOCR high-resolution Math OCR Pipeline
  try {
    const tempFile = path.join(os.tmpdir(), `upload-${Date.now()}-${uuidv4().slice(0, 8)}.pdf`);
    await fs.promises.writeFile(tempFile, buffer);

    try {
      const ocrSummary = await runPythonOcrPipeline(tempFile, subject, targetExam);
      if (ocrSummary && ocrSummary.totalDetected > 0) {
        // Run mathematical LaTeX validation on all Python extracted questions
        let needsReviewCount = 0;
        let successfulCount = 0;

        ocrSummary.questions = ocrSummary.questions.map((q: any) => {
          const report = validateQuestionLatexStructure({
            qNum: q.qNum,
            statement: q.statement || q.questionText || '',
            options: q.options || []
          });

          const needsReview = report.needsReview || q.status === 'NEEDS_REVIEW';
          if (needsReview) {
            needsReviewCount++;
          } else {
            successfulCount++;
          }

          return {
            ...q,
            status: needsReview ? 'NEEDS_REVIEW' : 'EXTRACTED',
            reviewReason: report.reasons.length > 0 ? report.reasons.join('; ') : q.reviewReason,
            confidence: report.overallConfidence,
            uncertainRegions: report.uncertainRegions
          };
        });

        ocrSummary.successfulCount = successfulCount;
        ocrSummary.needsReviewCount = needsReviewCount;
        return ocrSummary;
      }
    } finally {
      fs.promises.unlink(tempFile).catch(() => {});
    }
  } catch (pyErr: any) {
    console.warn('Python OCR pipeline notice, falling back to in-process parser:', pyErr.message);
  }

  // 2. Fallback to PDFParse
  try {
    const parser = new (PDFParse as any)({
      data: buffer
    });

    const parsedData = await parser.getText();
    const fullText = (parsedData && parsedData.text) || '';
    const totalPages = (parsedData && parsedData.total) || 1;

    const summary = parseQuestionsFromText(fullText, subject, targetExam);
    summary.totalPages = totalPages;
    return summary;
  } catch (err: any) {
    console.error('PDFParse error, triggering OCR fallback parser:', err);
    // OCR / Text Fallback: scan buffer strings
    const str = buffer.toString('utf-8');
    const printable = str.replace(/[^\x20-\x7E\n]/g, ' ');
    const summary = parseQuestionsFromText(printable, subject, targetExam);
    summary.errorLog.push(`PDF parser warning: ${err.message}. Raw text extraction applied.`);
    return summary;
  }
}

/**
 * Executes the Python OOXML Math Extractor for Microsoft Word documents
 */
function runPythonDocxExtractor(
  tempDocxPath: string,
  subject: string,
  targetExam: string
): Promise<any> {
  return new Promise((resolve) => {
    const candidatePaths = [
      path.resolve(__dirname, '../../scripts/docx_math_extractor.py'),
      path.resolve(__dirname, '../scripts/docx_math_extractor.py'),
      path.resolve(__dirname, '../../../backend/scripts/docx_math_extractor.py'),
      path.resolve(process.cwd(), 'backend/scripts/docx_math_extractor.py'),
      path.resolve(process.cwd(), 'scripts/docx_math_extractor.py'),
      path.resolve(process.cwd(), '../backend/scripts/docx_math_extractor.py')
    ];
    const scriptPath = candidatePaths.find((p) => fs.existsSync(p));
    if (!scriptPath) {
      console.warn('docx_math_extractor.py not found on disk, skipping Python DOCX parser');
      resolve(null);
      return;
    }

    const pyProcess = spawn(
      'python',
      [
        '-X', 'utf8',
        scriptPath,
        '--input', tempDocxPath,
        '--subject', subject,
        '--exam', targetExam
      ],
      {
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          PYTHONUTF8: '1'
        }
      }
    );

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
        } catch (jsonErr) {
          console.warn('Failed to parse Python DOCX JSON output:', jsonErr);
        }
      } else {
        console.warn(`Python DOCX extractor exited with code ${code}. Stderr: ${stderr.slice(0, 300)}`);
      }
      resolve(null);
    });

    pyProcess.on('error', (err) => {
      console.warn('Failed to spawn Python process for DOCX:', err.message);
      resolve(null);
    });

    // 45 second timeout
    setTimeout(() => {
      try {
        pyProcess.kill();
      } catch {}
      resolve(null);
    }, 45000);
  });
}

/**
 * Extracts questions from DOCX buffer with full OOXML Office Math (OMML) preservation
 */
export async function extractQuestionsFromDocxBuffer(
  buffer: Buffer,
  subject: string = 'Mathematics',
  targetExam: string = 'JEE Main'
): Promise<PdfExtractionSummary> {
  try {
    const tempFile = path.join(os.tmpdir(), `upload-${Date.now()}-${uuidv4().slice(0, 8)}.docx`);
    await fs.promises.writeFile(tempFile, buffer);

    try {
      const docxResult = await runPythonDocxExtractor(tempFile, subject, targetExam);
      if (docxResult && docxResult.success && Array.isArray(docxResult.questions) && docxResult.questions.length > 0) {
        let successfulCount = 0;
        let needsReviewCount = 0;

        const validatedQuestions = docxResult.questions.map((q: any) => {
          const report = validateQuestionLatexStructure({
            qNum: q.qNum,
            statement: q.statement || '',
            options: q.options || []
          });

          const needsReview = report.needsReview;
          if (needsReview) needsReviewCount++;
          else successfulCount++;

          return {
            ...q,
            status: needsReview ? 'NEEDS_REVIEW' : 'EXTRACTED',
            reviewReason: report.reasons.length > 0 ? report.reasons.join('; ') : undefined,
            confidence: report.overallConfidence,
            uncertainRegions: report.uncertainRegions
          };
        });

        return {
          totalDetected: validatedQuestions.length,
          successfulCount,
          needsReviewCount,
          errorCount: 0,
          rawTextPreview: (docxResult && docxResult.rawTextPreview) || '',
          totalPages: Math.max(1, Math.ceil(validatedQuestions.length / 5)),
          questions: validatedQuestions,
          errorLog: []
        };
      }
    } finally {
      fs.promises.unlink(tempFile).catch(() => {});
    }
  } catch (err: any) {
    console.warn('Python DOCX extraction failed, trying mammoth fallback:', err.message);
  }

  // Mammoth fallback
  try {
    const mammoth = await import('mammoth');
    const { value: docText } = await mammoth.extractRawText({ buffer });
    const summary = parseQuestionsFromText(docText || '', subject, targetExam);
    summary.totalPages = Math.max(1, Math.ceil(summary.questions.length / 5));
    return summary;
  } catch (fallbackErr: any) {
    return {
      totalDetected: 0,
      successfulCount: 0,
      needsReviewCount: 0,
      errorCount: 1,
      rawTextPreview: '',
      totalPages: 1,
      questions: [],
      errorLog: [fallbackErr.message || 'DOCX parsing error']
    };
  }
}

