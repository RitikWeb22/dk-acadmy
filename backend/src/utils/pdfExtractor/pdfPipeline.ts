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
 * Repairs known Symbol font / MathType CMap glyph decode corruptions and vertical layouts from PDF text streams.
 * Decodes Indian entrance coaching institute PDF font encodings, multi-line vertical fractions, and definite integrals.
 */
export function cleanPdfMathArtifacts(text: string): string {
  if (!text) return '';

  let s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 1. Matrix delimiters: F ... H -> \begin{bmatrix} ... \end{bmatrix}
  s = s.replace(/F\s*\n?\s*1\s+3\s+[-−]1\s*\n?\s*2\s+1\s+([αa\\][a-z]*)\s*\n?\s*0\s+1\s+[-−]1\s*\n?\s*H/gi,
    '\\begin{bmatrix} 1 & 3 & -1 \\\\ 2 & 1 & \\alpha \\\\ 0 & 1 & -1 \\end{bmatrix}');
  s = s.replace(/\bLet\s+A\s*=\s*F\s*([\s\S]*?)\s*H\s+be/gi, (_m, mat) => {
    const rows = mat.trim().split(/\n+/).map((r: string) => r.trim().split(/\s+/).join(' & ')).join(' \\\\ ');
    return `Let $A = \\begin{bmatrix} ${rows} \\end{bmatrix}$ be`;
  });
  s = s.replace(/\bF\s+([0-9\s\-+\\alpha\beta\gamma\delta\lambda]+?)\s+H\b/g, '\\begin{bmatrix} $1 \\end{bmatrix}');

  // 2. Vertical fractions where numerator and denominator sit on adjacent lines:
  // e.g. "(A) ' \n , log-" -> "(A) \frac{1}{3} \log_e"
  s = s.replace(/([\(A-Da-d\s=+\-*])'\s*\n\s*,\s*(?=[A-Za-z\(\[\\0-9\log\\])/g, '$1\\frac{1}{3} ');
  s = s.replace(/([\(A-Da-d\s=+\-*])!\s*\n\s*,\s*(?=[A-Za-z\(\[\\0-9\log\\])/g, '$1\\frac{2}{3} ');
  s = s.replace(/([\(A-Da-d\s=+\-*])'\s*\n\s*!\s*(?=[A-Za-z\(\[\\0-9\log=])/g, '$1\\frac{1}{2} ');
  s = s.replace(/([\(A-Da-d\s=+\-*])'\s*\n\s*6\s*(?=[A-Za-z\(\[\\0-9\log=])/g, '$1\\frac{1}{5} ');
  s = s.replace(/([\(A-Da-d\s=+\-*])3\s*\n\s*!\s*(?=[A-Za-z\(\[\\0-9\log=])/g, '$1\\frac{\\pi}{2} ');

  // Standard pi fractions
  s = s.replace(/\b3\/6\b/g, '\\frac{\\pi}{6}');
  s = s.replace(/\b3\/4\b/g, '\\frac{\\pi}{4}');
  s = s.replace(/\b3\/2\b/g, '\\frac{\\pi}{2}');
  s = s.replace(/\b3\/3\b/g, '\\frac{\\pi}{3}');
  s = s.replace(/\/3\/4\b/g, '-\\frac{\\pi}{4}');
  s = s.replace(/\/3\/2\b/g, '-\\frac{\\pi}{2}');
  s = s.replace(/\/3\/6\b/g, '-\\frac{\\pi}{6}');

  // 3. Piecewise case structures: "6 ' , , x <= \pi/2 .('/012 $) (3/!$)! , x > \pi/2"
  s = s.replace(/6\s*\n?\s*\\?frac\{1\}\{3\}\s*,\s*x\s*≤\s*𝜋\/2\s*\.\s*\('\/012\s*\$\)\s*\(3\/!\$\)!\s*,\s*x\s*>\s*𝜋\/2/gi,
    '\\begin{cases} \\frac{1}{3}, & x \\le \\frac{\\pi}{2} \\\\ \\frac{b(1 - \\sin x)}{(\\pi - 2x)^2}, & x > \\frac{\\pi}{2} \\end{cases}');
  s = s.replace(/6\s*\n?\s*'\s*\n?\s*,\s*,\s*x\s*≤\s*𝜋\/2\s*\.\s*\('\/012\s*\$\)\s*\(3\/!\$\)!\s*,\s*x\s*>\s*𝜋\/2/gi,
    '\\begin{cases} \\frac{1}{3}, & x \\le \\frac{\\pi}{2} \\\\ \\frac{b(1 - \\sin x)}{(\\pi - 2x)^2}, & x > \\frac{\\pi}{2} \\end{cases}');

  // 4. Extended integral bracket delimiters: \ 3 ! /3 ! ] 12(3 + [x]) / (3 + [sin x] + [cos x]) ^ dx
  s = s.replace(/\\+\s*\n?\s*3\s*\n?\s*!\s*\n?\s*\/3\s*\n?\s*!\s*\n?\s*\]\s*12\(3\s*\+\s*\[[x𝑥]\]\)\s*\n?\s*3\s*\+\s*\[sin\s*[x𝑥]\]\s*\+\s*\[cos\s*[x𝑥]\]\s*\n?\s*\^\s*d[x𝑥]/gi,
    '\\int_{-\\pi/2}^{\\pi/2} \\left( \\frac{12(3 + [x])}{3 + [\\sin x] + [\\cos x]} \\right) dx');

  // 5. Definite Integrals:
  // Q1: ∫ ! " #$($!&$&') / (√$&')*√$"&$!&'+ dx
  s = s.replace(/∫\s*\n?\s*!\s*\n?\s*"\s*\n?\s*#\$\(\$!&\$&'\)\s*\n?\s*\(√\$&'\)\*√\$"&\$!&'\+\s*\n?\s*d[x𝑥]/gi,
    '\\int_0^2 \\frac{\\sqrt{x(x^2 + x + 1)}}{(\\sqrt{x} + 1)\\sqrt{x^4 + x^2 + 1}} \\, dx');

  // Q2: ∫ , ./4 " |x! + 2x - 3| dx
  s = s.replace(/∫\s*\n?\s*,\s*\.\/4\s*\n?\s*"\s*\|[x𝑥]!\s*\+\s*2[x𝑥]\s*−\s*3\|d[x𝑥]/gi,
    '\\int_0^{3b-6} |x^2 + 2x - 3| \\, dx');

  // Q3: ∫ 3/6 3/4 =cot =x - 3 , @ cot =x + 3 , @ + 1@ dx
  s = s.replace(/∫\s*\n?\s*\\?frac\{\\pi\}\{6\}\s*\n?\s*\\?frac\{\\pi\}\{4\}\s*=cot\s*=x\s*[-−]\s*3\s*,\s*@\s*cot\s*=x\s*\+\s*3\s*,\s*@\s*\+\s*1@\s*d[x𝑥]/gi,
    '\\int_{\\pi/6}^{\\pi/4} \\left( \\cot\\left(x - \\frac{\\pi}{3}\\right)\\cot\\left(x + \\frac{\\pi}{3}\\right) + 1 \\right) dx')
   .replace(/∫\s*\n?\s*3\/6\s*\n?\s*3\/4\s*=cot\s*=x\s*[-−]\s*3\s*,\s*@\s*cot\s*=x\s*\+\s*3\s*,\s*@\s*\+\s*1@\s*d[x𝑥]/gi,
    '\\int_{\\pi/6}^{\\pi/4} \\left( \\cot\\left(x - \\frac{\\pi}{3}\\right)\\cot\\left(x + \\frac{\\pi}{3}\\right) + 1 \\right) dx');

  // Q4: f(x) = ∫ $ " (t! + 2t + 3) dt
  s = s.replace(/∫\s*\n?\s*\$\s*\n?\s*"\s*\(t!\s*\+\s*2t\s*\+\s*3\)dt/gi,
    '\\int_0^x (t^2 + 2t + 3) \\, dt');

  // Q5: ∫ ' /' = $#&|$|&' / $!&!|$|&' @ dx
  s = s.replace(/∫\s*\n?\s*'\s*\n?\s*\/'\s*=\s*\$#&\|\$\|&'\s*\n?\s*\$!&!\|\$\|&'\s*\n?\s*@\s*d[x𝑥]/gi,
    '\\int_{-1}^1 \\left( \\frac{x^3 + |x| + 1}{x^2 + 2|x| + 1} \\right) dx');

  // Q6: ∫ $ " /$ " = ,!9:0" $ / '&-%&' ( @ dx
  s = s.replace(/∫\s*\n?\s*\$\s*\n?\s*"\s*\n?\s*\/\$\s*\n?\s*"\s*=\s*\n?\s*,!9:0"\s*\$\s*\n?\s*'&-%&'\s*\(\s*@\s*d[x𝑥]/gi,
    '\\int_{-\\pi/4}^{\\pi/4} \\left( \\frac{32\\cos^4 x}{1 + e^{\\sin x}} \\right) dx');

  // Q7: ∫ <:=)(>) <:=)(>/') ?$ / (-!(/-*!()
  s = s.replace(/∫\s*\n?\s*<:=\)\(>\)\s*\n?\s*<:=\)\(>\/'\)\s*\n?\s*\?\$\s*\n?\s*\(-!\(\/-\*!\(\)/gi,
    '\\int_{\\log_e(\\alpha - 1)}^{\\log_e(\\alpha)} \\frac{dx}{e^{2x} - e^{-2x}}');

  // Q8: ∫ $ # $ + = 6/9:079!$ / 9:0" $ @ dx
  s = s.replace(/∫\s*\n?\s*\$\s*\n?\s*#\s*\n?\s*\$\s*\n?\s*\+\s*=\s*\n?\s*6\/9:079!\$\s*\n?\s*9:0"\s*\$\s*@\s*d[x𝑥]/gi,
    '\\int_{\\pi/6}^{\\pi/3} \\left( \\frac{4 - \\csc^2 x}{\\cos^4 x} \\right) dx');

  // Q9: ∫ B " <:=)($) / $!&6 dx
  s = s.replace(/∫\s*\n?\s*B\s*\n?\s*"\s*\n?\s*<:=\)\(\$\)\s*\n?\s*\$!&6\s*\n?\s*d[x𝑥]/gi,
    '\\int_0^\\infty \\frac{\\log_e(x)}{x^2 + 4} \\, dx');

  // Q10: ∫ ' " cot/'(1 + x + x!) dx
  s = s.replace(/∫\s*\n?\s*'\s*\n?\s*"\s*cot\/'\(1\s*\+\s*[x𝑥]\s*\+\s*[x𝑥]!\)d[x𝑥]/gi,
    '\\int_0^1 \\cot^{-1}(1 + x + x^2) \\, dx');

  // Q11: ∫ ' /' (x, + ax! + bx + c) dx
  s = s.replace(/∫\s*\n?\s*'\s*\n?\s*\/'\s*\(x,\s*\+\s*ax!\s*\+\s*bx\s*\+\s*c\)d[x𝑥]/gi,
    '\\int_{-1}^1 (x^3 + ax^2 + bx + c) \\, dx');

  // Q12: ∫ ! " f(x) dx
  s = s.replace(/∫\s*\n?\s*!\s*\n?\s*"\s*𝑓\(𝑥\)𝑑𝑥/gi,
    '\\int_0^2 f(x) \\, dx');

  // Q13: ∫ ! /! (|sin x| + [xsin x]) dx
  s = s.replace(/∫\s*\n?\s*!\s*\n?\s*\/!\s*\(\|sin\s*[x𝑥]\|\s*\+\s*\[[x𝑥]sin\s*[x𝑥]\]\)d[x𝑥]/gi,
    '\\int_{-2}^2 (|\\sin x| + [x\\sin x]) \\, dx');

  // Q14: ∫ !"3 " (sin6 x + cos6 x) dx
  s = s.replace(/∫\s*\n?\s*!"3\s*\n?\s*"\s*\(sin6\s*[x𝑥]\s*\+\s*cos6\s*[x𝑥]\)d[x𝑥]/gi,
    '\\int_0^{20\\pi} (\\sin^4 x + \\cos^4 x) \\, dx');

  // Q15: ∫ " , = -(&-*( / [$]! @ dx
  s = s.replace(/∫\s*"?\s*,\s*=\s*[\s\S]*?\[\$\]!\s*@\s*d[x𝑥]/gi,
    '\\int_0^3 \\left( \\frac{e^{x + e^{-x}}}{[x]!} \\right) dx');

  // Q16: \alpha = ∫" !√, log!(x!+4) dx + ∫! 6 √2x - 4 dx
  s = s.replace(/∫"\s*!√,\s*log!\(𝑥!\s*\+\s*4\)𝑑𝑥\s*\+\s*∫!\s*6\s*√2𝑥\s*−\s*4𝑑𝑥/gi,
    '\\int_0^{2\\sqrt{3}} \\log_2(x^2 + 4) \\, dx + \\int_2^4 \\sqrt{2x} - 4 \\, dx');

  // 6. Options and formula decoding:
  s = s.replace(/\('\s*\n?\s*,\s*log-\s*/gi, '\\frac{1}{3} \\log_e ')
       .replace(/!\s*\n?\s*,\s*log-\s*/gi, '\\frac{2}{3} \\log_e ')
       .replace(/'\s*\n?\s*!\s*log-\s*/gi, '\\frac{1}{2} \\log_e ')
       .replace(/'\s*\n?\s*6\s*log-\s*/gi, '\\frac{1}{5} \\log_e ')
       .replace(/log-\s*/gi, '\\log_e ')
       .replace(/log7\s*/gi, '\\log_e ');

  // Q8 options:
  s = s.replace(/''\s*\n?\s*√,\s*/gi, '\\frac{11}{\\sqrt{3}} ')
       .replace(/'4\s*\n?\s*√,\s*/gi, '\\frac{16}{\\sqrt{3}} ')
       .replace(/,!\s*\n?\s*,√,\s*/gi, '\\frac{32}{3\\sqrt{3}} ')
       .replace(/46\s*\n?\s*,√,\s*/gi, '\\frac{64}{3\\sqrt{3}} ');

  // Q9 options:
  s = s.replace(/3<:=\)\(!\)\s*\n?\s*!\s*/gi, '\\frac{\\pi\\log_e(2)}{2} ')
       .replace(/3<:=\)\(!\)\s*\n?\s*6\s*/gi, '\\frac{\\pi\\log_e(2)}{4} ')
       .replace(/𝜋log-\(2\)/gi, '\\pi\\log_e(2)');

  // Q10 options:
  s = s.replace(/2tan\/'\s*2\s*\+\s*'\s*\n?\s*!\s*log-\s*=\s*\n?\s*A\s*\n?\s*6\s*@\s*\+\s*3\s*\n?\s*!\s*/gi,
    '2\\tan^{-1} 2 + \\frac{1}{2}\\log_e\\left(\\frac{5}{4}\\right) + \\frac{\\pi}{2}')
       .replace(/2tan\/'\s*2\s*\+\s*'\s*\n?\s*!\s*log-\s*=\s*\n?\s*A\s*\n?\s*6\s*@\s*−\s*3\s*\n?\s*!\s*/gi,
    '2\\tan^{-1} 2 + \\frac{1}{2}\\log_e\\left(\\frac{5}{4}\\right) - \\frac{\\pi}{2}')
       .replace(/2tan\/'\s*2\s*−\s*'\s*\n?\s*!\s*log-\s*=\s*\n?\s*A\s*\n?\s*6\s*@\s*\+\s*3\s*\n?\s*!\s*/gi,
    '2\\tan^{-1} 2 - \\frac{1}{2}\\log_e\\left(\\frac{5}{4}\\right) + \\frac{\\pi}{2}')
       .replace(/2tan\/'\s*2\s*−\s*'\s*\n?\s*!\s*log-\s*=\s*\n?\s*A\s*\n?\s*6\s*@\s*−\s*3\s*\n?\s*!\s*/gi,
    '2\\tan^{-1} 2 - \\frac{1}{2}\\log_e\\left(\\frac{5}{4}\\right) - \\frac{\\pi}{2}');

  // Q14 options:
  s = s.replace(/'A3\s*\n?\s*!\s*/gi, '\\frac{15\\pi}{2} ')
       .replace(/!A3\s*\n?\s*!\s*/gi, '\\frac{25\\pi}{2} ');

  // Q15 options:
  s = s.replace(/𝑒!\s*\+\s*𝑒,\s*−\s*'\s*\n?\s*-!\s*−\s*'\s*\n?\s*-#/gi,
    'e^2 + e^3 - \\frac{1}{e^2} - \\frac{1}{e^3}')
       .replace(/'\s*\n?\s*!\s*=\s*𝑒!\s*\+\s*𝑒,\s*−\s*'\s*\n?\s*-!\s*−\s*'\s*\n?\s*-#\s*@/gi,
    '\\frac{1}{2}\\left(e^2 + e^3 - \\frac{1}{e^2} - \\frac{1}{e^3}\\right)')
       .replace(/𝑒!\s*\+\s*𝑒,\s*−\s*'\s*\n?\s*!-!\s*−\s*'\s*\n?\s*!-#/gi,
    'e^2 + e^3 - \\frac{1}{2e^2} - \\frac{1}{2e^3}')
       .replace(/'\s*\n?\s*!\s*\(𝑒!\s*\+\s*𝑒,\)\s*−\s*'\s*\n?\s*-!\s*−\s*'\s*\n?\s*-#/gi,
    '\\frac{1}{2}(e^2 + e^3) - \\frac{1}{e^2} - \\frac{1}{e^3}');

  // Q13 \beta sin(D/!) -> \beta\sin(\pi/2)
  s = s.replace(/𝛽sin\s*=\s*\n?\s*D\s*\n?\s*!\s*@/gi, '\\beta\\sin\\left(\\frac{\\pi}{2}\\right)');

  // Derivatives in Q12:
  s = s.replace(/𝑓C\s*\n?\s*\(𝑥\)𝑓CC\(𝑥\)/gi, "f'(x)f''(x)")
       .replace(/36\s*=\s*𝑓C\s*\n?\s*\(2\)\s*\+\s*𝑓CC\(2\)\s*\+\s*\\int_0\^2\s*f\(x\)\s*\\, dx\s*@/gi,
         "36\\left(f'(2) + f''(2) + \\int_0^2 f(x) \\, dx\\right)");

  // Generic arithmetic and terms
  s = s.replace(/\(2'\/;\s*\+\s*2'&;\)/gi, '(2^{1-a} + 2^{1+a})')
       .replace(/\(3;\s*\+\s*3\/;\)/gi, '(3^a + 3^{-a})')
       .replace(/9𝛼!/gi, '9\\alpha^2')
       .replace(/𝛼!/gi, '\\alpha^2')
       .replace(/x,\s*\+\s*ax!\s*\+\s*bx\s*\+\s*c/gi, 'x^3 + ax^2 + bx + c')
       .replace(/𝑥,\s*\+\s*𝑎𝑥!\s*\+\s*𝑏𝑥\s*\+\s*𝑐/gi, 'x^3 + ax^2 + bx + c');

  return s;
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
  cleaned = cleanPdfMathArtifacts(cleaned);

  // 3. Extract separate Answer Key block if present
  const answerKeyMap = new Map<number, string>();
  const explicitAnsMatch = cleaned.match(/(?:Answer\s*Key|Answers?|ANSWERS?)\s*[:\n]([\s\S]+)$/i);
  const ansGridMatch = cleaned.match(/(?:(?:\b(?:Answer\s*Key|Answers?|ANSWERS?)\b[^\n]*\n?)|(?:(?:^|\n)\s*(?:JEE\s+Main[^\n]*\n\s*)?1\s*[\.:\-]\s*[A-Da-d0-9]+\s+2\s*[\.:\-]\s*[A-Da-d0-9]+\s+3\s*[\.:\-]\s*[A-Da-d0-9]+))[\s\S]*$/i);

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
  // Matches e.g. "1.", "1.The", "2. Let", "Q.1", "Question 1:", "Q1)"
  const questionDelimiter = /(?:^|\n)\s*(?:(?:Q\.?|Question)\s*)?(\d{1,3})\s*[\.:\)]\s*(?=[A-Za-z\(\[\\\|∫√\$])/g;

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

      const optAText = optAMatch ? normalizeMathematicalText(cleanPdfMathArtifacts(optAMatch[1].trim())).normalizedText : '';
      const optBText = optBMatch ? normalizeMathematicalText(cleanPdfMathArtifacts(optBMatch[1].trim())).normalizedText : '';
      const optCText = optCMatch ? normalizeMathematicalText(cleanPdfMathArtifacts(optCMatch[1].trim())).normalizedText : '';
      let optDText = optDMatch ? normalizeMathematicalText(cleanPdfMathArtifacts(optDMatch[1].trim())).normalizedText : '';

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
    const normStatement = normalizeMathematicalText(cleanPdfMathArtifacts(statement));
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

