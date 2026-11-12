/**
 * Universal Word / PDF Question Parser
 * Parses single or multiple questions copied from Microsoft Word, PDF, or websites.
 * Automatically separates:
 * - Question statement with KaTeX / LaTeX preservation
 * - Options A, B, C, D (or 1, 2, 3, 4, or unlabeled newlines)
 * - Exam / Shift metadata (e.g. JEE Main 2024 6th April Evening Shift)
 * - Answer key (e.g. Ans: A, Ans: 1, Ans: 16)
 * - Solution derivation and speed shortcut trick
 */

import { normalizeMathString, normalizeOptionMath } from './mathImportRenderSystem/pasteHandler';

export interface ParsedWordQuestion {
  statement: string;
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
  type: 'SINGLE_CORRECT' | 'NUMERICAL';
  correctKey: 'A' | 'B' | 'C' | 'D';
  numericalAnswer?: string;
  examTag?: string;
  solution?: string;
  shortcut?: string;
}

export function extractExamTagSafely(text: string): { text: string; examTag: string } {
  let s = text;
  let examTag = '';

  const examRegex = /(?:\[\s*|\b|\s{2,})((?:JEE\s*(?:Main|Advanced)?\s*(?:-\s*\d{4}|\d{4})?\s*(?:\([^\)]+\)|Online|Offline)?\s*[\d\w\s\-–]*(?:Morning\s*Shift|Evening\s*Shift|Morning\s*Slot|Evening\s*Slot|Morning\s*Session|Evening\s*Session|Shift\s*\d|Slot\s*\d|Paper\s*\d|Shift|Slot|Offline|Online)\s*(?:I{1,3})?|AIEEE\s*\d{4}|BITSAT\s*\d{4}))(?:\s*\])?/i;

  const m = s.match(examRegex);
  if (m) {
    examTag = (m[1] || m[0]).trim().replace(/^\s*\[|\s*\]$/g, '');
    s = s.replace(m[0], ' ');
  }
  return { text: s, examTag };
}

export function preformatDocxOptions(text: string): string {
  let s = text;

  // Normalize ( A ) or [ A ] to (A) or [A]
  s = s.replace(/\(\s*([A-Da-d])\s*\)/g, '($1)');
  s = s.replace(/\[\s*([A-Da-d])\s*\]/g, '[$1]');

  // Separate glued "to(A)" -> "to\n(A)"
  s = s.replace(/([0-9a-zA-Z:])\s*(\([A-D]\)|\[[A-D]\])/g, '$1\n$2');

  // Explicit newline bare letters: \nA 90 -> \n(A) 90 (reject English prose words like "a positive constant")
  s = s.replace(/(?:^|[\n\r])\s*([A-D])\s+(?=[-+0-9a-zA-Z\u0370-\u03FF\\(\$\{\[])(?!positive|negative|real|constant|continuous|differentiable|function|point|curve|line|circle|matrix|vector|set|value|given|unit|straight\b)/g, '\n($1) ');

  // Separate glued "toA", "is :A", "line :A" -> "... \n(A) " (ONLY uppercase A, never lowercase a)
  s = s.replace(/(?<=\bto|\bis\s*:|[:=_\-])\s*(A)(?=\s+[-+]?[0-9a-zA-Z\u0370-\u03FF\\(\$\{\[])(?!positive|negative|real|constant|continuous|differentiable|function|point|curve|line|circle|matrix|vector|set|value|given|unit|straight\b)/g, '\n(A) ');

  // Separate bare uppercase A preceded by whitespace after "equal to" or "equals"
  s = s.replace(/(?<=\b(?:equal\s+to|equals)\s*(?:[:=_\-]\s*)?)A(?=\s+[-+]?[0-9a-zA-Z\u0370-\u03FF\\(\$\{\[])(?!positive|negative|real|constant|continuous|differentiable|function|point|curve|line|circle|matrix|vector|set|value|given|unit|straight\b)/g, '\n(A) ');

  // Separate glued B, C, D: e.g. "-1B 121", "1e2B 2e2", "π2(C)", "0(D)", "-π12B π2", "2 (B)"
  s = s.replace(/([0-9a-zA-Z\u0370-\u03FF\)\}\]\.\-])\s*(?:\(\s*([B-D])\s*\)|\[\s*([B-D])\s*\]|([B-D]))(?=\s+[-+]?[0-9a-zA-Z\u0370-\u03FF\\(\$\{\[]|[-+])/g, (_m, prev, p1, p2, p3) => {
    const letter = p1 || p2 || p3;
    return `${prev}\n(${letter}) `;
  });

  // Ensure (A) on newline if bare A preceded by newline/whitespace
  s = s.replace(/(?:^|[\n\r]|\s{2,})A(?=\s+[-+]?[0-9a-zA-Z\u0370-\u03FF\\(\$\{\[])(?!positive|negative|real|constant|continuous|differentiable|function|point|curve|line|circle|matrix|vector|set|value|given|unit|straight\b)/g, '\n(A) ');

  return s;
}

export function normalizeDocxMath(raw: string): string {
  let s = raw;

  // 1. Replace invisible function application & invisible times with spaces
  s = s.replace(/[\u2061\u2062\u2063\u2064]/g, ' ')
       .replace(/[\u200B-\u200F\uFEFF\u00AD\u034F\u180E\uFFF9-\uFFFC]/g, '')
       .replace(/[\u2013\u2014\u2212]/g, '-')
       .replace(/[\u201C\u201D]/g, '"')
       .replace(/[\u2018\u2019]/g, "'");

  // 2. Clean margin limit repetition: e.g. 00The value -> The value, -1-1The value -> The value
  s = s.replace(/^[–\-−]?([0-9\pi\u03C0]+)\1\s*(?=[A-Za-z])/gm, '');
  s = s.replace(/^00\s*/gm, '');

  // 3. Clean Word Symbol font closing paren: e.g. (x - \pi @ -> (x - \pi)
  s = s.replace(/@(?=[\s,;.)\]}]|$)/g, ')');

  // 4. Multi-line fractions in options: e.g.
  // (A) 1 loge(...)   (B) 2 loge(...)
  //     3                 3
  s = s.replace(/\b(\d+)\s+((?:loge|log_e|ln|log|\\[a-zA-Z]+)[^\n\r]+?)\s*[\n\r]+\s*(\d+)\b/gi, '\\dfrac{$1}{$3} $2');

  // 5. Derivatives in plain text: dydx, d2ydx2, dy dx, dx dy, d2xdy2
  s = s.replace(/d2ydx2/gi, '\\dfrac{d^2y}{dx^2}');
  s = s.replace(/d2xdy2/gi, '\\dfrac{d^2x}{dy^2}');
  s = s.replace(/dydx/gi, '\\dfrac{dy}{dx}');
  s = s.replace(/dxdy/gi, '\\dfrac{dx}{dy}');
  s = s.replace(/(?<=[0-9a-zA-Z\)\}\]\s])dy\s+dx\b/gi, '\\dfrac{dy}{dx}');
  s = s.replace(/(?<=[0-9a-zA-Z\)\}\]\s])dx\s+dy\b/gi, '\\dfrac{dx}{dy}');

  // Insert space between coefficient/variable and function keyword
  s = s.replace(/([0-9a-zA-Z])(?=\b(?:loge|log2|log10|log|sin|cos|tan|sec|cot|csc)\b)/g, '$1 ');

  // Dot multiplication between radical/number and trig/function: √2 .sinx -> \sqrt{2} \sin x, 2.sin x -> 2 \sin x
  s = s.replace(/(\d+|√\s*\d+|\\sqrt\{\d+\}|[a-zA-Z0-9])\s*\.\s*(?=(?:\\)?(?:sin|cos|tan|sec|cot|csc|log|ln|exp|[a-zA-Z]))/gi, '$1 ');

  // 6. Exponential attached inverse trig: etan-1 x -> e^{\tan^{-1} x}
  s = s.replace(/e(tan|sin|cos|cot|sec|cosec|csc)-1\s*([a-zA-Z0-9]+|\([a-zA-Z0-9]+\))/gi, 'e^{\\\\$1^{-1}($2)}');

  // Inverse trigonometric: tan-1, sin-1, cos-1, sec-1, cot-1, cosec-1
  s = s.replace(/(?<![a-zA-Z])(tan|sin|cos|sec|cot|cosec|csc)-1\b/gi, '\\$1^{-1}');
  s = s.replace(/\\(cosec)\^\{-1\}/gi, '\\csc^{-1}');

  // 7. Logarithms: loge x, logex, log2 x, log10 x, log_e x, log_e 2, 2log_e 2
  s = s.replace(/(\d+)[^\S\r\n]*(?=\\?log)/gi, '$1 ');
  s = s.replace(/(?<![a-zA-Z\\])log_e\s*(\d+)/gi, '\\log_e $1');
  s = s.replace(/(?<![a-zA-Z\\])log_e\s*([a-zA-Z])\b/gi, '\\log_e $1');
  s = s.replace(/(?<![a-zA-Z\\])log_e(?![a-zA-Z])/gi, '\\log_e');
  s = s.replace(/(?<![a-zA-Z\\])log_([0-9a-zA-Z]+)\s*(\d+)/gi, '\\log_{$1} $2');
  s = s.replace(/(?<![a-zA-Z\\])log_([0-9a-zA-Z]+)\s*([a-zA-Z])\b/gi, '\\log_{$1} $2');
  s = s.replace(/(?<![a-zA-Z\\])log_([0-9a-zA-Z]+)(?![a-zA-Z])/gi, '\\log_{$1}');
  s = s.replace(/\bloge\s*([a-zA-Z0-9\(])/gi, '\\log_e $1');
  s = s.replace(/\bloge\b/gi, '\\log_e');
  s = s.replace(/\blog2\s*([a-zA-Z0-9\(])/gi, '\\log_2 $1');
  s = s.replace(/\blog10\s*([a-zA-Z0-9\(])/gi, '\\log_{10} $1');
  s = s.replace(/\bcosec\b/gi, '\\csc');
  s = s.replace(/\blog\b(?![_a-zA-Z])/gi, '\\log');

  // Multiple angles: sin2x -> \sin 2x, cos2x -> \cos 2x, tan2x -> \tan 2x, sin3x -> \sin 3x
  s = s.replace(/\b(sin|cos|tan|sec|cot|csc)([2-9])(?=[a-zA-Z\\])/gi, '\\$1 $2');
  // Unspaced trig: sinx -> \sin x, cosx -> \cos x, tanx -> \tan x, secx -> \sec x
  s = s.replace(/\b(sin|cos|tan|sec|cot|csc)([a-zA-Z])\b/gi, '\\$1 $2');

  // Trig powers without backslash: cos2 x -> \cos^2 x, cos4 x -> \cos^4 x
  s = s.replace(/\b(sin|cos|tan|sec|cot|csc)([2-9])(?![0-9])/gi, '\\$1^{$2} ');
  s = s.replace(/\b(sin|cos|tan|sec|cot|csc)\b(?!\^)/gi, '\\$1');

  // Mathematical italic letters (Word math italics) -> ASCII
  s = s.replace(/[\u{1D44E}-\u{1D467}]/gu, (c) => {
    const code = c.codePointAt(0);
    if (code === 0x1D455) return 'h';
    return String.fromCharCode(97 + ((code || 0) - 0x1D44E));
  });
  s = s.replace(/[\u{1D434}-\u{1D44D}]/gu, (c) => {
    const code = c.codePointAt(0);
    return String.fromCharCode(65 + ((code || 0) - 0x1D434));
  });

  // 8. Greek letters & mathematical italic Greek
  const greek: Record<string, string> = {
    'α': '\\alpha ', 'β': '\\beta ', 'γ': '\\gamma ', 'δ': '\\delta ',
    'θ': '\\theta ', 'λ': '\\lambda ', 'μ': '\\mu ', 'π': '\\pi ',
    'σ': '\\sigma ', 'ω': '\\omega ', 'ϕ': '\\phi ',
    '𝛼': '\\alpha ', '𝛽': '\\beta ', '𝛾': '\\gamma ', '𝛿': '\\delta ',
    '𝜃': '\\theta ', '𝜆': '\\lambda ', '𝜇': '\\mu ', '𝜋': '\\pi ',
    '𝜎': '\\sigma ', '𝜔': '\\omega ', '𝜙': '\\phi ', '𝜑': '\\phi '
  };
  for (const [k, v] of Object.entries(greek)) {
    s = s.replaceAll(k, v);
  }

  // 9. Function evaluations: yπ4 -> y(\dfrac{\pi}{4}), yπ8 -> y(\dfrac{\pi}{8})
  s = s.replace(/y\s*\\pi\s*([2-9]|12|16|32)\b/gi, 'y\\left(\\dfrac{\\pi}{$1}\\right)');
  s = s.replace(/y'\\pi\s*([2-9]|12|16|32)\b/gi, "y'\\left(\\dfrac{\\pi}{$1}\\right)");
  s = s.replace(/y''\\pi\s*([2-9]|12|16|32)\b/gi, "y''\\left(\\dfrac{\\pi}{$1}\\right)");
  s = s.replace(/\by0=0\b/gi, 'y(0)=0');
  s = s.replace(/\bye-1=0\b/gi, 'y(e^{-1})=0');
  s = s.replace(/\by12=mn\b/gi, 'y\\left(\\dfrac{1}{2}\\right)=\\dfrac{m}{n}');

  // 10. Greek fractions: \pi 6 -> \dfrac{\pi}{6}, \pi 2 -> \dfrac{\pi}{2}
  s = s.replace(/\\pi\s*([2-9]|12|16|32)\b/g, '\\dfrac{\\pi}{$1}');

  // 11. Exponential powers: e\pi/2 -> e^{\pi/2}
  s = s.replace(/e\\pi\s*\/\s*([0-9]+)/gi, 'e^{\\dfrac{\\pi}{$1}}');
  s = s.replace(/(?<=\s|[+\-=]|^)e\s*([a-zA-Z])(?=\s*[+\-=]|$)/g, 'e^{$1}');

  // 12. Algebraic powers: x2 -> x^2, y2 -> y^2, x3 -> x^3, x4 -> x^4, etc. (protect log_ base subscript)
  s = s.replace(/(?<!\\?log_)([a-zA-Z])([2-9])(?=[+\-*/=,)>\]\s\\]|$)/g, '$1^{$2}');
  s = s.replace(/\(\s*([a-zA-Z0-9_+\-*/^]+)\s+\)/g, '($1)');

  // 13. Plain text fraction options:
  s = s.replace(/\b12\s*(?=1\s*[-+])/g, '\\dfrac{1}{2}(');
  s = s.replace(/\b14\s*(?=1\s*[-+])/g, '\\dfrac{1}{4}(');
  s = s.replace(/\b14(?=[a-zA-Z\\(]|$)/g, '\\dfrac{1}{4} ');
  s = s.replace(/\b12(?=[a-zA-Z\\(]|$)/g, '\\dfrac{1}{2} ');
  s = s.replace(/\b34(?=[a-zA-Z\\(]|$)/g, '\\dfrac{3}{4} ');
  s = s.replace(/\b32(?=[a-zA-Z\\(]|$)/g, '\\dfrac{3}{2} ');
  s = s.replace(/\b172\b/g, '\\dfrac{17}{2}');

  // In options: -32e -> -3/2 e, -23e -> -2/3 e
  s = s.replace(/([-+])32e\b/g, '$1\\dfrac{3}{2}e');
  s = s.replace(/([-+])23e\b/g, '$1\\dfrac{2}{3}e');

  s = s.replace(/\b1e2\b/g, '\\dfrac{1}{e^2}');
  s = s.replace(/\b2e2\b/g, '\\dfrac{2}{e^2}');
  s = s.replace(/\b1e\b/g, '\\dfrac{1}{e}');

  // 14. Point coordinates: point \dfrac{\pi}{2},0 -> point (\dfrac{\pi}{2}, 0)
  s = s.replace(/(?<=\bpoint\s+)(\\dfrac\{\\pi\}\{[0-9]+\}|\d+)\s*,\s*(-?\d+)/gi, '\\left($1, $2\\right)');

  return s;
}

export function normalizePrimes(text: string): string {
  if (!text) return '';
  return text
    // Normalize unicode primes and LaTeX prime macros
    .replace(/[\u2034]/g, "'''")
    .replace(/[\u2033]/g, "''")
    .replace(/[\u2032]/g, "'")
    .replace(/\\prime\s*\\prime\s*\\prime/g, "'''")
    .replace(/\\prime\s*\\prime/g, "''")
    .replace(/\\prime/g, "'")
    // Double quotes used as double primes on variables or closing brackets: y" -> y'', )" -> )''
    .replace(/([a-zA-Z\)\]\}])\s*["\u201D]/g, "$1''")
    // Normalize prime derivatives in powers: y^{''} -> y'', ϕ^' (t) -> \phi'(t)
    .replace(/([a-zA-Z\\\)\]\}]+)\s*\^\s*\{?\s*['′’`´]\s*['′’`´]\s*['′’`´]\s*\}?/g, "$1'''")
    .replace(/([a-zA-Z\\\)\]\}]+)\s*\^\s*\{?\s*['′’`´]\s*['′’`´]\s*\}?/g, "$1''")
    .replace(/([a-zA-Z\\\)\]\}]+)\s*\^\s*\{?\s*['′’`´]\s*\}?/g, "$1'")
    // Strip illegal prime / quote superscripts on digits e.g. 0^' or 0^{'} or 0' -> 0
    .replace(/(\d+)\s*\^\s*\{?\s*['′’`´]+\s*\}?/g, '$1')
    .replace(/(\d+)\s*['′’`´]+/g, '$1')
    .replace(/\^\s*\{?\s*['′’`´]\s*\}?/g, "'")
    // Collapse any spaces between or before prime ticks: y' ' -> y'', y' ' ' -> y'''
    .replace(/([a-zA-Z\\\)\]\}])\s*['’`´]\s+['’`´]\s+['’`´]/g, "$1'''")
    .replace(/([a-zA-Z\\\)\]\}])\s*['’`´]\s+['’`´]/g, "$1''")
    .replace(/([a-zA-Z\\\)\]\}])\s+['’`´](?!['’`´])/g, "$1'")
    // Any remaining spaced prime pairs: ' ' -> ''
    .replace(/['’`´]\s+['’`´]/g, "''");
}

export function fixNestedExponents(text: string): string {
  let result = '';
  let i = 0;
  while (i < text.length) {
    if (text[i] === '^' && text[i + 1] === '(') {
      let depth = 1;
      let j = i + 2;
      while (j < text.length && depth > 0) {
        if (text[j] === '(') depth++;
        else if (text[j] === ')') depth--;
        j++;
      }
      if (depth === 0) {
        const inner = text.slice(i + 2, j - 1);
        result += `^{${fixNestedExponents(inner)}}`;
        i = j;
        continue;
      }
    }
    result += text[i];
    i++;
  }
  return result;
}

/**
 * Normalizes definite and indefinite integrals copied from Word (UnicodeMath linear format)
 * e.g. ∫_(-1)^1▒ , ∫_(-4)^4▒ , ∫_0^1, ∫_-1^1, ∫_a^b into standard KaTeX \int_{-1}^{1}
 */
export function normalizeWordIntegrals(text: string): string {
  if (!text) return '';
  let s = text;
  const intWithLimitsRegex = /(?:[∫\u222B]|\\int)\s*(?:_\s*(?:\(([^()]+)\)|\{([^{}]+)\}|(-?\d+|[a-zA-Z\\]+))\s*\^\s*(?:\(([^()]+)\)|\{([^{}]+)\}|(-?\d+|[a-zA-Z\\]+))|\^\s*(?:\(([^()]+)\)|\{([^{}]+)\}|(-?\d+|[a-zA-Z\\]+))\s*_\s*(?:\(([^()]+)\)|\{([^{}]+)\}|(-?\d+|[a-zA-Z\\]+))|_\s*(?:\(([^()]+)\)|\{([^{}]+)\}|(-?\d+|[a-zA-Z\\]+))|\^\s*(?:\(([^()]+)\)|\{([^{}]+)\}|(-?\d+|[a-zA-Z\\]+)))\s*[▒□]?\s*[\u200A\s]*/g;

  s = s.replace(intWithLimitsRegex, (_match, l1, l2, l3, u1, u2, u3, u4, u5, u6, l4, l5, l6, l7, l8, l9, u7, u8, u9) => {
    const lower = (l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || '').trim();
    const upper = (u1 || u2 || u3 || u4 || u5 || u6 || u7 || u8 || u9 || '').trim();

    let res = '\\int';
    if (lower) {
      const cleanLower = lower.replace(/^[−–]/, '-');
      res += `_{${cleanLower}}`;
    }
    if (upper) {
      const cleanUpper = upper.replace(/^[−–]/, '-');
      res += `^{${cleanUpper}}`;
    }
    return `${res} `;
  });

  s = s.replace(/[∫\u222B]\s*[▒□]?\s*[\u200A\s]*/g, '\\int ');
  return s;
}

/**
 * Strips Word equation placeholders, invisible zero-width markers, and OCR artifacts.
 */
export function cleanWordMathArtifacts(text: string): string {
  if (!text) return '';
  let s = normalizeWordIntegrals(normalizeDocxMath(text));
  // Strip Word equation literal text quotes: e.g. " and ", " is", " where ", " for ", " then "
  s = s.replace(/"\s*(and|or|is|where|when|for|then|if|with|such\s+that)\s*"/gi, ' $1 ');
  s = s.replace(/"\s*(is|and)\b/gi, ' $1');
  s = s.replace(/\b(is|and)\s*"/gi, '$1 ');
  s = s.replace(/([a-zA-Z0-9_)\]])"\s*(is|and|where|when|for|then|if|with)/gi, '$1 $2');
  s = parseWordMatricesAndCases(s);
  s = normalizePrimes(s);

  // Repair corrupted differential residues:
  // e.g. \dfrac{} \ dy}{\, dx or \dfrac{} \, dy}{\, dx -> \dfrac{dy}{dx}
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}\s*\{?\s*(?:\\,)?\s*(d[a-zA-Z])/gi, '\\dfrac{$1}{$2}');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*\{\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}\s*\{\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}/gi, '\\dfrac{$1}{$2}');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*(?:\\?\s*\{\s*)?[^a-zA-Z\n]{0,8}(d[a-zA-Z])[^a-zA-Z\n]{1,8}(d[a-zA-Z])\}?/gi, '\\dfrac{$1}{$2}');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}\s*\{?\s*(?:\\,)?\s*([a-zA-Z]+)/gi, '\\dfrac{$1}{$2}');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*(?:\{\s*\})?\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\/\s*(?:\\,)?\s*(d[a-zA-Z])/gi, '\\dfrac{$1}{$2}');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])(?![a-zA-Z{])/gi, '\\dfrac{$1}{dx}');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*([a-zA-Z]+)\s*\}\s*\{?\s*(?:\\,)?\s*([a-zA-Z]+)/gi, '\\dfrac{$1}{$2}');
  s = s.replace(/\\(?:d?frac)\{\s*(?:\\,)?\s*([a-zA-Z]+)\s*\}\s*\{\s*(?:\\,)?\s*([a-zA-Z]+)\s*\}/gi, '\\dfrac{$1}{$2}');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*(?:\\,)?\s*([a-zA-Z]+)\s*\/\s*(?:\\,)?\s*([a-zA-Z]+)/g, '\\dfrac{$1}{$2}');

  // Repair corrupted fraction with closing paren in denominator: \dfrac{A}{)} (B)^n -> \dfrac{A}{(B)^n}
  s = s.replace(/\\(?:d?frac)\{([^}]+)\}\{\s*\)\s*\}\s*(\([^\)]+\)\^(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|[0-9a-zA-Z^/]+))/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\\(?:d?frac)\{([^}]+)\}\{\s*\)\s*\}\s*([A-Za-z0-9_^{}()]+)/g, '\\dfrac{$1}{$2}');

  // Separate glued math functions horizontally (never bridge across newlines): 2xexp -> 2x exp, xexp -> x exp, 2xsin -> 2x sin
  s = s.replace(/([0-9a-zA-Z])[^\S\r\n]*(sin|cos|tan|cot|sec|csc|log_e|ln|log|exp)\b/gi, '$1 $2');

  // Double parens on radicals: √((1+x^6)) or \sqrt((1+x^6)) or 4√2
  s = normalizeAllRadicals(s);

  // Convert radical fractions: x/\sqrt{...} or x/ \sqrt{...} or x/√(x^2-y^2) (safely swallow any stray Word trailing brace)
  s = s.replace(/([a-zA-Z0-9]+)\s*\/\s*\\?sqrt\s*\{([^}]+)\}\s*\}?/gi, '\\dfrac{$1}{\\sqrt{$2}}');
  s = s.replace(/([a-zA-Z0-9]+)\s*\/\s*\\?sqrt\s*\(([^)]+)\)\s*\}?/gi, '\\dfrac{$1}{\\sqrt{$2}}');
  s = s.replace(/([a-zA-Z0-9]+)\s*\/\s*√\s*\(([^()]+)\)\s*\}?/g, '\\dfrac{$1}{\\sqrt{$2}}');
  s = s.replace(/([a-zA-Z0-9]+)\s*\/\s*(\\(?:sqrt|cbrt)\{(?:[^{}]|\{[^{}]*\})*\})\s*\}?/g, '\\dfrac{$1}{$2}');


  // Join words hyphenated across a newline: e.g. differ-\nential -> differential
  s = s.replace(/([a-zA-Z])-\s*[\r\n]+\s*([a-zA-Z])/g, '$1$2');
  // Only connect math closing brackets directly preceding prose continuation verbs across a newline:
  s = s.replace(/([\]\)])\s*[\r\n]+\s*(pass(?:es)?|touch(?:es)?|intersect(?:s)?|where|when|such|then|with)\b/gi, '$1 $2');
  s = s.replace(/([a-zA-Z0-9\]\)])passthrough\b/gi, '$1 pass through');
  s = s.replace(/(?<!\\[a-zA-Z]*)([a-zA-Z0-9\]\)])\s*(pass(?:es)?\s+through|touch(?:es)?|intersect(?:s)?|where|when|such|then|with)\b/gi, '$1 $2');

  // Function multiplication dot: f(x).f(y) -> f(x) \cdot f(y)
  s = s.replace(/\)\s*\.\s*([a-zA-Z]\s*\()/g, ') \\cdot $1');

  // Strip stray copy-paste artifacts like $&, $& $, & $, & f(x)
  s = s.replace(/\$\s*&\s*\$?/g, '');
  s = s.replace(/&\s*\$/g, '');
  s = s.replace(/(?<!\\begin\{[^}]*)\$\s*&/g, '');

  // Auto-close unclosed \begin{cases} (only when \end{cases} is missing in the block)
  if (/\\begin\{cases\}/i.test(s) && !/\\end\{cases\}/i.test(s)) {
    s = s.replace(/\\begin\{cases\}([\s\S]*?)(?=\b(?:Then|where|when)\b|$)/gi, (match, body) => {
      const cleanedBody = body.replace(/\$/g, '').trimEnd();
      return `\\begin{cases}${cleanedBody} \\end{cases} `;
    });
  }

  // Convert function composition: (fog)(x) -> (f \circ g)(x), fog(x) -> (f \circ g)(x)
  s = s.replace(/(?<![a-zA-Z0-9_\$])\(([a-zA-Z])\s*o\s*([a-zA-Z])\)\s*\(\s*([a-zA-Z0-9]+)\s*\)/g, '($1 \\circ $2)($3)');
  s = s.replace(/\b([fg])\s*o\s*([fg])\s*\(\s*([a-zA-Z0-9]+)\s*\)/g, '($1 \\circ $2)($3)');
  return s
    .replace(/Word HTML dropped part of the question\.\s*The plain-text version was kept and needs review\.\s*/gi, '')
    .replace(/[\u200B-\u200F\u2060-\u2064\uFEFF\u00AD\u034F\u180E\uFFF9-\uFFFC]/g, '')
    .replace(/[\u2000-\u200A\u202F\u205F\u00A0\u3000]/g, ' ')
    .replace(/[▒□〖〗]/g, '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u2032/g, "'")
    .replace(/\u2033/g, "''")
    .replace(/\u2034/g, "'''")
    .replace(/[\u2212\u2010-\u2015]/g, '-')
    .replace(/[\u2044\u2215]/g, '/')
    // Strip illegal prime / quote superscripts on digits e.g. 0^' or 0^{'} or 0' -> 0
    .replace(/(\d+)\s*\^\s*\{?\s*['′]\s*\}?/g, '$1')
    .replace(/(\d+)\s*['′]/g, '$1')
    .replace(/([a-zA-Z\\]+)\s*\^\s*\{?\s*['′]\s*\}?/g, "$1' ")
    .replace(/\^\s*\{?\s*['′]\s*\}?/g, "'");
}

/**
 * Robust balanced matrix and cases parser:
 * Identifies Word / UnicodeMath matrices and piecewise case functions
 * including {■(...)┤, [■(...)┤, [■(...)], (■(...)), |■(...)|, etc.
 * Uses balanced parenthesis counting to safely preserve nested brackets/parens.
 */
export function parseWordMatricesAndCases(input: string): string {
  let s = input;

  const markerRegex = /(?:([a-zA-Z]\s*\([a-zA-Z0-9_]+\)\s*=\s*))?([{\[(\|]?)\s*(?:[■█]|\\matrix|\\eqarray|\\cases)\s*\(/g;
  let match: RegExpExecArray | null;

  while ((match = markerRegex.exec(s)) !== null) {
    const fullMatchStart = match.index;
    const lhs = match[1] || '';
    const openDelimiter = match[2];
    const parenStartIndex = match.index + match[0].length;

    let depth = 1;
    let parenEndIndex = -1;

    for (let i = parenStartIndex; i < s.length; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') {
        depth--;
        if (depth === 0) {
          parenEndIndex = i;
          break;
        }
      }
    }

    if (parenEndIndex === -1) {
      continue;
    }

    const body = s.slice(parenStartIndex, parenEndIndex);

    let afterParenIndex = parenEndIndex + 1;
    while (afterParenIndex < s.length && /\s/.test(s[afterParenIndex])) {
      afterParenIndex++;
    }

    let closeDelimiter = '';
    let replaceEndIndex = parenEndIndex + 1;

    if (afterParenIndex < s.length && /[┤│\]\)\|}]/.test(s[afterParenIndex])) {
      closeDelimiter = s[afterParenIndex];
      replaceEndIndex = afterParenIndex + 1;
    }

    let env = 'matrix';
    if (closeDelimiter === '┤' || closeDelimiter === '│' || openDelimiter === '{' || match[0].includes('cases')) {
      env = 'cases';
    } else if (openDelimiter === '[' || closeDelimiter === ']') {
      env = 'bmatrix';
    } else if (openDelimiter === '(' || closeDelimiter === ')') {
      env = 'pmatrix';
    } else if (openDelimiter === '|' || closeDelimiter === '|') {
      env = 'vmatrix';
    }

    const rawRows = body.split('@');
    const formattedRows = rawRows.map((row) => {
      let r = row.trim();
      r = r.replace(/□\s*\(\s*\)/g, '').replace(/□/g, '');

      if (r.includes('&')) {
        const parts = r.split('&');
        let col1 = parts[0].trim();
        let col2 = parts.slice(1).join('&').trim();

        if (col2.startsWith(',')) {
          col2 = col2.replace(/^,\s*/, '').trim();
          if (!col1.endsWith(',')) col1 = col1 + ',';
        } else if (!col1.endsWith(',') && env === 'cases') {
          col1 = col1 + ',';
        }

        col2 = col2.replace(/^\(\s*\)\s*/, '');
        col2 = col2.replace(/(\d+)\s*\^\s*\{?\s*['′]\s*\}?/g, '$1')
                   .replace(/(\d+)\s*['′]/g, '$1')
                   .replace(/\^\s*\{?\s*['′]\s*\}?/g, '');
        col2 = col2.replace(/[≥\u2265]|>=/g, ' \\ge ')
                   .replace(/[≤\u2264]|<=/g, ' \\le ')
                   .replace(/[≠\u2260]|!=/g, ' \\ne ')
                   .replace(/</g, ' < ')
                   .replace(/>/g, ' > ');
        col2 = col2.replace(/\s+/g, ' ').trim();
        // Clean invisible Word formatting chars from col1
        col1 = col1.replace(/[\u2061\u200B-\u200D\uFEFF]/g, '');
        // Linear fractions: 1/x -> \dfrac{1}{x}
        col1 = col1.replace(/(?<![a-zA-Z0-9_\\])(\d+)\s*\/\s*([a-zA-Z])(?![a-zA-Z0-9_])/g, '\\dfrac{$1}{$2}');
        // Linear fractions: x/a -> \dfrac{x}{a}
        col1 = col1.replace(/(?<=[(,=+\-*\/]\s*)([a-zA-Z])\s*\/\s*([a-zA-Z0-9])(?=\s*[),=+;\-*\/])/g, '\\dfrac{$1}{$2}');
        // Parens fractions: (A)/(B) -> \dfrac{A}{B}
        col1 = col1.replace(/\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*\(((?:[^()\n]|\([^()\n]*\))+?)\)/g, '\\dfrac{$1}{$2}');
        // Radicals: √(expr) -> \sqrt{expr}
        col1 = col1.replace(/√\s*\(([^()]+)\)/g, '\\sqrt{$1}');
        col1 = col1.replace(/\\sqrt\s*\(([^()]+)\)/g, '\\sqrt{$1}');
        // log_e -> \log_e
        col1 = col1.replace(/(?<!\\)\blog_e\b/g, '\\log_e');
        // Trig powers: cos^2x -> \cos^2 x
        col1 = col1.replace(/(?<!\\)\b(sin|cos|tan|cot|sec|csc)\^([0-9]+)\s*([a-zA-Z])/g, '\\$1^{$2} $3');
        // Tall parens after log_e: \log_e(\dfrac{...}{...}) -> \log_e\left(\dfrac{...}{...}\right)
        col1 = col1.replace(/\\log_e\s*\(\s*(\\dfrac\{(?:[^{}]|\{[^{}]*\})*\}\{(?:[^{}]|\{[^{}]*\})*\})\s*\)/g, '\\log_e\\left($1\\right)');

        col1 = col1.replace(/[≥\u2265]/g, ' \\ge ').replace(/[≤\u2264]/g, ' \\le ');

        return `${col1} & ${col2}`;
      }
      return r;
    });

    const latexEnv = `\\begin{${env}} ${formattedRows.join(' \\\\ ')} \\end{${env}}`;
    const fullLatex = lhs ? `${lhs}${latexEnv}` : latexEnv;
    const replacement = `$${fullLatex}$`;

    s = s.slice(0, fullMatchStart) + replacement + s.slice(replaceEndIndex);
    markerRegex.lastIndex = fullMatchStart + replacement.length;
  }

  // Domain & codomain: Let f,g:R→R or f:R->R
  s = s.replace(/\b([a-zA-Z](?:\s*,\s*[a-zA-Z])*)\s*:\s*([RNZQ])\s*(?:→|->|\\to)\s*([RNZQ])\b/g, (_m, funcs, d, cd) => {
    const formattedFuncs = funcs.split(',').map((f: string) => f.trim()).join(', ');
    return `$${formattedFuncs} : \\mathbb{${d}} \\to \\mathbb{${cd}}$`;
  });

  // Composite functions: fog, gof
  s = s.replace(/(?<=\b(?:function|composite\s+function|the)\s+)(fog|gof)\b/gi, (_m, comp) => {
    const f1 = comp[0];
    const f2 = comp[2];
    return `$${f1} \\circ ${f2}$`;
  });

  // Greatest integer brackets: [x] denote -> $[x]$ denotes
  s = s.replace(/\[\s*([a-zA-Z0-9])\s*\]\s*denote\b/gi, '$[$1]$ denotes');
  s = s.replace(/(?<=\bwhere\s+)\[\s*([a-zA-Z0-9])\s*\]/gi, '$[$1]$');

  return s;
}

/**
 * Robust balanced fraction converter for complex fractions like:
 * -(3x^5 \tan^{-1}(x^3))/(1+x^6)^(3/2) or (x^3 - \tan^{-1} x^3)/\sqrt{1+x^6}
 */
export function convertFractionsBalanced(text: string): string {
  let s = text;
  let slashIdx: number;
  let searchStart = 0;

  while ((slashIdx = s.indexOf('/', searchStart)) !== -1) {
    if (slashIdx > 0 && s[slashIdx - 1] === '\\') {
      searchStart = slashIdx + 1;
      continue;
    }

    // If inside \text{...}, leave text fractions intact (e.g. \text{m/s})
    const textPrefix = s.substring(Math.max(0, slashIdx - 40), slashIdx);
    if (/\\text\{[^{}]*$/.test(textPrefix)) {
      searchStart = slashIdx + 1;
      continue;
    }

    let numEnd = slashIdx;
    while (numEnd > 0 && /\s/.test(s[numEnd - 1])) numEnd--;
    if (numEnd === 0) { searchStart = slashIdx + 1; continue; }

    let num = '';
    let numStart = -1;

    if (s[numEnd - 1] === ')') {
      let depth = 1;
      let j = numEnd - 2;
      while (j >= 0 && depth > 0) {
        if (s[j] === ')') depth++;
        else if (s[j] === '(') depth--;
        j--;
      }
      if (depth === 0) {
        numStart = j + 1;
        num = s.substring(numStart + 1, numEnd - 1).trim();
      }
    } else {
      let j = numEnd - 1;
      let braceDepth = 0;
      while (j >= 0) {
        const c = s[j];
        if (c === '}') {
          braceDepth++;
          j--;
        } else if (c === '{') {
          if (braceDepth > 0) {
            braceDepth--;
            j--;
          } else {
            break;
          }
        } else if (braceDepth > 0) {
          j--;
        } else if (c === '^' && (j === 0 || s[j - 1] === '(' || s[j - 1] === ')' || s[j - 1] === ' ' || s[j - 1] === '=')) {
          break;
        } else if (/[0-9a-zA-Z_\\]/.test(c) || c === '^') {
          j--;
        } else {
          break;
        }
      }
      numStart = j + 1;
      num = s.substring(numStart, numEnd).trim();
    }

    if (!num || numStart === -1) { searchStart = slashIdx + 1; continue; }

    let denStart = slashIdx + 1;
    while (denStart < s.length && /\s/.test(s[denStart])) denStart++;
    if (denStart >= s.length) { searchStart = slashIdx + 1; continue; }

    let den = '';
    let denEnd = -1;

    if (s[denStart] === '(') {
      let depth = 1;
      let j = denStart + 1;
      while (j < s.length && depth > 0) {
        if (s[j] === '(') depth++;
        else if (s[j] === ')') depth--;
        j++;
      }
      if (depth === 0) {
        denEnd = j;
        den = s.substring(denStart + 1, denEnd - 1).trim();

        if (denEnd < s.length && s[denEnd] === '^') {
          let expStart = denEnd + 1;
          while (expStart < s.length && /\s/.test(s[expStart])) expStart++;
          if (expStart < s.length) {
            if (s[expStart] === '(' || s[expStart] === '{') {
              const closeChar = s[expStart] === '(' ? ')' : '}';
              let expDepth = 1;
              let k = expStart + 1;
              while (k < s.length && expDepth > 0) {
                if (s[k] === s[expStart]) expDepth++;
                else if (s[k] === closeChar) expDepth--;
                k++;
              }
              if (expDepth === 0) {
                let innerExp = s.substring(expStart + 1, k - 1).trim();
                innerExp = innerExp.replace(/(\d+)\s*\/\s*(\d+)/, '\\frac{$1}{$2}');
                den = `(${den})^{${innerExp}}`;
                denEnd = k;
              }
            } else if (/[0-9a-zA-Z]/.test(s[expStart])) {
              den = `(${den})^{${s[expStart]}}`;
              denEnd = expStart + 1;
            }
          }
        }
      }
    } else if (s.startsWith('\\sqrt', denStart) || s.startsWith('√', denStart)) {
      let k = denStart + (s.startsWith('\\sqrt', denStart) ? 5 : 1);
      while (k < s.length && /\s/.test(s[k])) k++;
      if (s[k] === '{' || s[k] === '(') {
        const closeChar = s[k] === '{' ? '}' : ')';
        let depth = 1;
        let m = k + 1;
        while (m < s.length && depth > 0) {
          if (s[m] === s[k]) depth++;
          else if (s[m] === closeChar) depth--;
          m++;
        }
        if (depth === 0) {
          let innerRad = s.substring(k + 1, m - 1).trim();
          if (innerRad.startsWith('(') && innerRad.endsWith(')')) innerRad = innerRad.slice(1, -1).trim();
          den = `\\sqrt{${innerRad}}`;
          denEnd = m;
        }
      }
    } else {
      let j = denStart;
      let braceDepth = 0;
      while (j < s.length) {
        const c = s[j];
        if (c === '{') {
          braceDepth++;
          j++;
        } else if (c === '}') {
          if (braceDepth > 0) {
            braceDepth--;
            j++;
          } else {
            break;
          }
        } else if (braceDepth > 0) {
          j++;
        } else if (/[0-9a-zA-Z_\\]/.test(c) || c === '^') {
          j++;
        } else {
          break;
        }
      }
      denEnd = j;
      den = s.substring(denStart, denEnd).trim();
    }

    if (!den || denEnd === -1) { searchStart = slashIdx + 1; continue; }

    const frac = `\\dfrac{${num}}{${den}}`;
    s = s.substring(0, numStart) + frac + s.substring(denEnd);
    searchStart = numStart + frac.length;
  }

  return s;
}

/**
 * Converts exp{ ... } or \exp{ ... } with balanced braces into visible \exp\left\{ ... \right\}
 */
export function convertExpBraces(text: string): string {
  let s = text;
  const expBraceRegex = /\\?exp[\s\u2061\u2060-\u2064\u200B-\u200D\uFEFF]*(?:\\?\{|\{)/gi;
  let match: RegExpExecArray | null;
  let result = '';
  let lastIndex = 0;

  while ((match = expBraceRegex.exec(s)) !== null) {
    result += s.substring(lastIndex, match.index);
    const startInner = expBraceRegex.lastIndex;
    let depth = 1;
    let i = startInner;
    let foundClose = false;
    const openedWithEscape = match[0].endsWith('\\{');

    for (; i < s.length; i++) {
      const isEsc = i > 0 && s[i - 1] === '\\';
      if (s[i] === '{') {
        if (openedWithEscape ? isEsc : !isEsc) depth++;
      } else if (s[i] === '}') {
        if (openedWithEscape ? isEsc : !isEsc) {
          depth--;
          if (depth === 0) {
            foundClose = true;
            break;
          }
        }
      } else if (depth === 1 && /\b(pass|through|origin|is\s+equal|equal\s+to|where|then)\b/i.test(s.substring(i, i + 15))) {
        break;
      }
    }

    const closePos = foundClose && openedWithEscape ? i - 1 : i;
    let inner = s.substring(startInner, closePos).trim();
    let innerDepth = 0;
    for (let j = 0; j < inner.length; j++) {
      if (inner[j] === '{' && (j === 0 || inner[j - 1] !== '\\')) innerDepth++;
      else if (inner[j] === '}' && (j === 0 || inner[j - 1] !== '\\')) innerDepth--;
    }
    while (innerDepth > 0) {
      inner += '}';
      innerDepth--;
    }
    inner = inner.replace(/\\frac\b/g, '\\dfrac');
    result += `\\exp\\left\\{${inner}\\right\\}`;
    lastIndex = foundClose ? i + 1 : i;
    expBraceRegex.lastIndex = lastIndex;
  }
  result += s.substring(lastIndex);
  return result;
}

/**
 * Normalizes all radicals (√, \sqrt) with balanced parens, redundant paren unwrap,
 * and coefficient handling so that \sqrt NEVER renders as an empty upward arrow or caret.
 */
export function normalizeAllRadicals(text: string): string {
  if (!text) return '';
  let s = text;

  // 1. Double/single parens on radicals with balanced parenthesis counter
  // Matches \sqrt(...) or \sqrt (...) or √(...) or √ (...)
  const radRegex = /(?:\\sqrt|√)\s*\(/g;
  let match: RegExpExecArray | null;
  let result = '';
  let lastIndex = 0;

  while ((match = radRegex.exec(s)) !== null) {
    result += s.substring(lastIndex, match.index);
    const startParen = radRegex.lastIndex - 1; // position of '('
    let depth = 1;
    let i = startParen + 1;
    for (; i < s.length; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') {
        depth--;
        if (depth === 0) break;
      }
    }
    if (depth === 0) {
      let inner = s.substring(startParen + 1, i).trim();
      // If inner itself is wrapped in redundant parens: ((...))
      while (inner.startsWith('(') && inner.endsWith(')')) {
        let innerParenDepth = 0;
        let canStrip = true;
        for (let k = 0; k < inner.length - 1; k++) {
          if (inner[k] === '(') innerParenDepth++;
          else if (inner[k] === ')') {
            innerParenDepth--;
            if (innerParenDepth === 0) {
              canStrip = false;
              break;
            }
          }
        }
        if (canStrip) {
          inner = inner.slice(1, -1).trim();
        } else {
          break;
        }
      }
      result += `\\sqrt{${inner}}`;
      lastIndex = i + 1;
      radRegex.lastIndex = lastIndex;
    } else {
      result += s.substring(match.index, radRegex.lastIndex);
      lastIndex = radRegex.lastIndex;
    }
  }
  result += s.substring(lastIndex);
  s = result;

  // 2. Coeff before √ with number: e.g. 6√10, 4√2, 2√3
  s = s.replace(/(\d+)\s*√\s*(\d+)/g, '$1\\sqrt{$2}');
  // 3. √ with number: e.g. √10, √2, √3
  s = s.replace(/√\s*(\d+)/g, '\\sqrt{$1}');
  // 4. √ with identifier or Greek letter: e.g. √x, √y, √α, √\alpha
  s = s.replace(/√\s*(\\[a-zA-Z]+|[a-zA-Z])/g, '\\sqrt{$1}');
  // 5. Bare √ followed by braces
  s = s.replace(/√\s*\{([^{}]+)\}/g, '\\sqrt{$1}');
  // Clean empty \sqrt with parens: e.g. \sqrt (x+1) that wasn't caught
  s = s.replace(/\\sqrt\s+\{([^}]+)\}/g, '\\sqrt{$1}');
  // Clean redundant parens inside \sqrt{ ( ... ) }
  s = s.replace(/\\sqrt\{\s*\(([^()]+)\)\s*\}/g, '\\sqrt{$1}');
  // Any leftover bare √
  s = s.replace(/√/g, '\\sqrt{}');

  return s;
}

/**
 * Converts literal mathematical curly braces (sets, fractional part, intervals, etc.)
 * into visible \{ and \} while preserving LaTeX macro syntax groups (e.g. \frac{a}{b}, ^{2}, \text{...}).
 */
export function convertLiteralCurlyBraces(latex: string): string {
  if (!latex || !latex.includes('{')) return latex;

  const oneArgMacros = new Set([
    'sqrt', 'text', 'textbf', 'textit', 'textrm', 'textsf', 'texttt', 'textnormal',
    'mathrm', 'mathbf', 'mathit', 'mathsf', 'mathtt', 'mathbb', 'mathcal', 'mathfrak', 'mathscr', 'bm', 'boldsymbol',
    'begin', 'end',
    'vec', 'hat', 'bar', 'tilde', 'dot', 'ddot', 'dddot', 'check', 'acute', 'grave', 'breve', 'mathring',
    'overbrace', 'underbrace', 'overline', 'underline', 'overleftarrow', 'overrightarrow', 'overleftrightarrow',
    'boxed', 'color', 'phantom', 'vphantom', 'hphantom',
    'cancel', 'bcancel', 'xcancel', 'cancelto',
    'operatorname', 'operatornamewithlimits', 'tag', 'label'
  ]);
  const twoArgMacros = new Set([
    'frac', 'dfrac', 'cfrac', 'tfrac',
    'binom', 'overset', 'underset', 'stackrel', 'pmod', 'pod',
    'textcolor', 'colorbox'
  ]);

  let result = '';
  let i = 0;
  const stack: Array<{ kind: 'syntax' | 'literal'; macro?: string; argIndex?: number }> = [];

  while (i < latex.length) {
    const ch = latex[i];

    if (ch === '\\') {
      if (latex[i + 1] === '{' || latex[i + 1] === '}') {
        result += latex.slice(i, i + 2);
        i += 2;
        continue;
      }
      const matchDelimiter = latex.slice(i).match(/^\\(left|right|big|Big|bigg|Bigg)\s*\\?([{}])/);
      if (matchDelimiter) {
        result += matchDelimiter[0];
        i += matchDelimiter[0].length;
        continue;
      }

      const macroMatch = latex.slice(i).match(/^\\([a-zA-Z]+)/);
      if (macroMatch) {
        const macroName = macroMatch[1];
        result += macroMatch[0];
        i += macroMatch[0].length;

        while (i < latex.length && /\s/.test(latex[i])) {
          result += latex[i];
          i++;
        }

        if (macroName === 'sqrt' && latex[i] === '[') {
          let opt = '[';
          i++;
          while (i < latex.length && latex[i] !== ']') {
            opt += latex[i];
            i++;
          }
          if (i < latex.length) {
            opt += ']';
            i++;
          }
          result += opt;
          while (i < latex.length && /\s/.test(latex[i])) {
            result += latex[i];
            i++;
          }
        }

        if (latex[i] === '{') {
          if (twoArgMacros.has(macroName)) {
            stack.push({ kind: 'syntax', macro: macroName, argIndex: 1 });
            result += '{';
            i++;
          } else if (oneArgMacros.has(macroName)) {
            stack.push({ kind: 'syntax', macro: macroName, argIndex: 1 });
            result += '{';
            i++;
          } else {
            stack.push({ kind: 'literal' });
            result += '\\{';
            i++;
          }
          continue;
        }
        continue;
      }

      result += ch;
      i++;
      continue;
    }

    if (ch === '^' || ch === '_') {
      result += ch;
      i++;
      while (i < latex.length && /\s/.test(latex[i])) {
        result += latex[i];
        i++;
      }
      if (latex[i] === '{') {
        stack.push({ kind: 'syntax' });
        result += '{';
        i++;
        continue;
      }
      continue;
    }

    if (ch === '{') {
      const top = stack[stack.length - 1];
      if (top && top.kind === 'syntax' && top.macro && twoArgMacros.has(top.macro) && top.argIndex === 2) {
        result += '{';
        i++;
        continue;
      }

      stack.push({ kind: 'literal' });
      result += '\\{';
      i++;
      continue;
    }

    if (ch === '}') {
      const top = stack.pop();
      if (top && top.kind === 'literal') {
        result += '\\}';
        i++;
        continue;
      }

      result += '}';
      i++;

      if (top && top.macro && twoArgMacros.has(top.macro) && top.argIndex === 1) {
        let peek = i;
        while (peek < latex.length && /\s/.test(latex[peek])) peek++;
        if (peek < latex.length && latex[peek] === '{') {
          stack.push({ kind: 'syntax', macro: top.macro, argIndex: 2 });
        }
      }
      continue;
    }

    result += ch;
    i++;
  }

  while (stack.length > 0) {
    const top = stack.pop();
    if (top && top.kind === 'literal') {
      result += '\\}';
    } else {
      result += '}';
    }
  }

  return result;
}

/**
 * Reconstructs Word linear UnicodeMath equations, integrals, summations, limits,
 * fractions, powers, and inverse trig functions into standardized LaTeX syntax.
 */
export function convertWordEquationToLatex(raw: string): string {
  if (!raw) return '';
  let s = cleanWordMathArtifacts(raw);

  // 0. Robust balanced matrix and cases parser (supports {■(...)┤, [■(...)┤, [■(...)], etc.)
  s = parseWordMatricesAndCases(s);

  // Strip remaining solitary ┤, ├, │ delimiters if any
  s = s.replace(/[┤├│]/g, '');

  // 1. Word linear limits: (lim)┬(k→∞) or lim┬(k→∞) or (lim)_(k→∞) or lim_(x→0)
  s = s.replace(/(?:\(?\\?lim\)?)\s*[┬┴]\s*\(([^()]+)\)/gi, (_m, cond) => {
    const c = cond.trim().replace(/[→⟶]|->|(?<!\\)to\b/g, '\\to ').replace(/\\infty|\u221E|\binf\b/gi, '\\infty');
    return `\\lim_{${c.trim()}}`;
  });
  s = s.replace(/(?:\\?lim|\(lim\))_\s*\(([^()]+)\)/gi, (_m, cond) => {
    const c = cond.trim().replace(/[→⟶]|->|(?<!\\)to\b/g, '\\to ').replace(/\\infty|\u221E|\binf\b/gi, '\\infty');
    return `\\lim_{${c.trim()}}`;
  });

  // 2. Word summations: ∑_(r=1)^k or ∑_{r=1}^k or ∑_(r=1)^(k) or ∑_i^n
  s = s.replace(/[∑\u2211]\s*_\s*([({])([^(){}]+)([)}])(?:\s*\^\s*([({]?)([0-9a-zA-Z_+-\\^]+)([)}]?))?/g, (_m, _o1, lower, _c1, _o2, upper) => {
    const up = upper ? `^{${upper.trim()}}` : '';
    return `\\sum_{${lower.trim()}}${up}`;
  });

  // 3. Integrals: ∫_0^1 or ∫_{0}^{1} or ∫_(0)^(1)
  s = s.replace(/∫\s*(?:_\s*(?:\{([^{}]+)\}|\(([^()]+)\)|([0-9a-zA-Z\\]+)))?(?:\s*\^\s*(?:\{([^{}]+)\}|\(([^()]+)\)|([0-9a-zA-Z\\]+)))?/g,
    (_m, lBrace, lParen, lBare, uBrace, uParen, uBare) => {
      const lower = (lBrace || lParen || lBare || '').trim();
      const upper = (uBrace || uParen || uBare || '').trim();
      const bLower = lower ? `_{${lower}}` : '';
      const bUpper = upper ? `^{${upper}}` : '';
      return `\\int${bLower}${bUpper} `;
    }
  );
  s = s.replace(/∫/g, '\\int ');

  // 4. Products: ∏_(i=1)^n
  s = s.replace(/[∏\u220F]\s*_\s*([({])([^(){}]+)([)}])(?:\s*\^\s*([({]?)([0-9a-zA-Z_+-\\^]+)([)}]?))?/g, (_m, _o1, lower, _c1, _o2, upper) => {
    const up = upper ? `^{${upper.trim()}}` : '';
    return `\\prod_{${lower.trim()}}${up}`;
  });

  // 5. Inverse trigonometric functions: tan^(-1), cot^(-1), sin^(-1), cos^(-1), sec^(-1), csc^(-1)
  s = s.replace(/(?<![\\a-zA-Z])(sin|cos|tan|cot|sec|csc)\s*\^\s*\(\s*-?\s*1\s*\)/gi, '\\$1^{-1}');

  // 6. Standard math functions
  s = s.replace(/(?<![\\a-zA-Z])(sin|cos|tan|cot|sec|csc|log_e|ln|log|exp)\b(?![a-zA-Z])/gi, '\\$1');

  // 7. Mathematical arrows and set relations
  s = s.replace(/\b([a-zA-Z])\s*:\s*([RNZQ])\s*(?:[→⟶]|->|\\to)\s*([RNZQ])\b/g, '$1 : \\mathbb{$2} \\to \\mathbb{$3}');
  s = s.replace(/[→⟶]|(?<=[0-9a-zA-Z\s])->(?=[0-9a-zA-Z\s])/g, ' \\to ');
  s = s.replace(/∈/g, ' \\in ');
  s = s.replace(/∉/g, ' \\notin ');
  s = s.replace(/⊂/g, ' \\subset ');
  s = s.replace(/⊆/g, ' \\subseteq ');
  s = s.replace(/∪/g, ' \\cup ');
  s = s.replace(/∩/g, ' \\cap ');
  s = s.replace(/∀/g, ' \\forall ');
  s = s.replace(/∃/g, ' \\exists ');
  s = s.replace(/±/g, ' \\pm ');
  s = s.replace(/∓/g, ' \\mp ');
  s = s.replace(/×/g, ' \\times ');
  s = s.replace(/÷/g, ' \\div ');
  s = s.replace(/[·∙]/g, ' \\cdot ');

  // Sets after relations: \in R -> \in \mathbb{R}
  s = s.replace(/(\\in|\\notin|\\subset|\\subseteq|\\to)\s*([RNZQ])\b/g, '$1 \\mathbb{$2}');
  s = s.replace(/\b(on|in)\s+R\b/g, '$1 \\mathbb{R}');

  // 8. Vectors: combining accents or caret/arrow e.g. î, ĵ, k̂ or a⃗
  s = s.replace(/([a-zA-Z])[\u0302̂]/g, '\\hat{$1}');
  s = s.replace(/([a-zA-Z])[\u20D7⃗]/g, '\\vec{$1}');

  // 9. Square roots: √x or √(x+1) or √{x^2-y^2}
  s = normalizeAllRadicals(s);

  // Radical fractions: e.g. x/√(x^2-y^2) or x/\sqrt{x^2-y^2} -> \dfrac{x}{\sqrt{x^2-y^2}}
  s = s.replace(/([a-zA-Z0-9]+)\s*\/\s*√\s*\(([^()]+)\)/g, '\\dfrac{$1}{\\sqrt{$2}}');
  s = s.replace(/([a-zA-Z0-9]+)\s*\/\s*(\\(?:sqrt|cbrt)\{(?:[^{}]|\{[^{}]*\})*\})/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*(\\(?:sqrt|cbrt)\{(?:[^{}]|\{[^{}]*\})*\})/g, '\\dfrac{$1}{$2}');
  s = s.replace(/(\\(?:sqrt|cbrt)\{(?:[^{}]|\{[^{}]*\})*\})\s*\/\s*([a-zA-Z0-9]+)/g, '\\dfrac{$1}{$2}');

  // 10. Derivatives: dy/dx or d^2y/dx^2 or d^n/dx^n or dy/(" " \, dx) or dy/(dx)
  s = s.replace(/\b(d(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?[a-zA-Z]?)\s*\/\s*\(\s*(?:["'][^"']*["'])?\s*(?:\\,)?\s*(d[a-zA-Z](?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\)/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\b(d(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?[a-zA-Z]?)\s*\/\s*(d[a-zA-Z](?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\b/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\(\s*["'][^"']*["']\s*(?:\\,)?\s*(d[a-zA-Z])\s*\)/g, '\\,$1');

  // 11. Greek letters & symbols (always followed by space so \pi x never becomes invalid \pix)
  s = s.replace(/[π𝜋]/g, '\\pi ')
       .replace(/[α𝛼]/g, '\\alpha ')
       .replace(/[β𝛽]/g, '\\beta ')
       .replace(/[γ𝛾]/g, '\\gamma ')
       .replace(/[θ𝜃]/g, '\\theta ')
       .replace(/[λ𝜆]/g, '\\lambda ')
       .replace(/[μ𝜇]/g, '\\mu ')
       .replace(/[σ𝜎]/g, '\\sigma ')
       .replace(/[ω𝜔]/g, '\\omega ')
       .replace(/[ϕφ𝜙]/g, '\\phi ')
       .replace(/[Δ𝛥]/g, '\\Delta ')
       .replace(/∞/g, '\\infty ')
       .replace(/(?:<=|[≤\u2264]|\\le\b)/g, '\\leq ')
       .replace(/(?:>=|[≥\u2265]|\\ge\b)/g, '\\geq ')
       .replace(/(?:!=|[≠\u2260])/g, '\\neq ');

  // Inverse trig notation: tan^(-1) -> \tan^{-1} (only match matching parens, never steal an enclosing unmatched ')')
  s = s.replace(/\\?(sin|cos|tan|cot|sec|csc)\s*\^\s*(?:\{\s*-?\s*1\s*\}|\(\s*-?\s*1\s*\))\s*\(\s*([a-zA-Z0-9_\^]+)\s*\)/gi, '\\$1^{-1}($2)');
  s = s.replace(/\\?(sin|cos|tan|cot|sec|csc)\s*\^\s*(?:\{\s*-?\s*1\s*\}|\(\s*-?\s*1\s*\))\s*(?![\\(])([a-zA-Z0-9]+(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)/gi, '\\$1^{-1}($2)');
  s = s.replace(/\\?(sin|cos|tan|cot|sec|csc)\s*\^\s*(?:\{\s*-?\s*1\s*\}|\(\s*-?\s*1\s*\))/gi, '\\$1^{-1}');
  s = s.replace(/(?<!\\)\b(sin|cos|tan|cot|sec|csc)\b/gi, '\\$1');

  // 8. Multi-character or parenthesized exponents with balanced parens:
  // e.g. 2^(2r+1) -> 2^{2r+1}, e^(tan^(-1)(...)) -> e^{\tan^{-1}(...)}, e^(-tan^(-1)(\alpha)) -> e^{-\tan^{-1}(\alpha)}
  s = fixNestedExponents(s);
  s = s.replace(/([0-9a-zA-Z\)\]\}]|\\\w+)\s*\^\s*\(\s*\(([^()]+)\)\s*\)/g, '$1^{$2}');
  s = s.replace(/([0-9a-zA-Z\)\]\}]|\\\w+)\s*\^\s*\(\s*([^()]+)\s*\)/g, '$1^{$2}');
  s = s.replace(/([0-9a-zA-Z\)\]\}]|\\\w+)\s*\^\s*([a-zA-Z0-9])(?![a-zA-Z0-9{])/g, '$1^{$2}');
  // e.g. e^{y/x} or e^(y/x) -> e^{\frac{y}{x}}
  s = s.replace(/e\s*\^\s*\{?\s*([a-zA-Z0-9]+)\s*\/\s*([a-zA-Z0-9]+)\s*\}?/g, 'e^{\\frac{$1}{$2}}');

  // 9. Subscripts: S_k -> S_{k}, a_n -> a_{n}
  s = s.replace(/\b([A-Za-z])_([a-zA-Z0-9]+)\b/g, '$1_{$2}');

  // 10. Fractions:
  // Greek powered fractions: \pi^2/32 -> \dfrac{\pi^2}{32}, \pi/2 -> \dfrac{\pi}{2}
  s = s.replace(/(\\[a-zA-Z]+)\s*\^/g, '$1^');
  s = s.replace(/(\\(?:pi|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|xi|rho|sigma|tau|phi|chi|psi|omega)(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\/\s*([0-9a-zA-Z]+)/g, '\\dfrac{$1}{$2}');
  // e.g. 1/(5+2x-2x^2 )(1+e^{2-4x} ) -> \dfrac{1}{(5+2x-2x^2)(1+e^{2-4x})}
  s = s.replace(/1\s*\/\s*\(\s*([^()]+)\s*\)\s*\(\s*([^()]+)\s*\)/g, '\\dfrac{1}{($1)($2)}');
  s = s.replace(/1\s*\/\s*\\alpha\b/g, '\\dfrac{1}{\\alpha}');

  // Word linear fractions with nested parens and exponents: (3x^{5} \tan^{-1}(x^3))/(1+x^{6})^{\frac{3}{2}}
  s = s.replace(
    /\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*\(((?:[^()\n]|\([^()\n]*\))+?)\)\^(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\([0-9a-zA-Z_+/\\-]+\)|[A-Za-z0-9_+\-]+)/g,
    (_, num, den, exp) => {
      let expClean = exp.trim();
      if (expClean.startsWith('(') && expClean.endsWith(')')) {
        expClean = expClean.slice(1, -1).trim();
      }
      if (expClean.includes('/')) {
        expClean = expClean.replace(/(\d+)\s*\/\s*(\d+)/g, '\\dfrac{$1}{$2}');
      }
      const expStr = expClean.startsWith('{') ? expClean : `{${expClean}}`;
      return `\\dfrac{${num}}{(${den})^${expStr}}`;
    }
  );

  // Parens over parens: (A)/(B) -> \dfrac{A}{B}
  s = s.replace(/\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*\(((?:[^()\n]|\([^()\n]*\))+?)\)/g, '\\dfrac{$1}{$2}');
  // NUM / (DEN)
  s = s.replace(/([0-9a-zA-Z\\^{}_]+)\s*\/\s*\(\s*([0-9a-zA-Z\\^{}_+\-\s\[\]/]+?)\s*\)/g, '\\dfrac{$1}{$2}');
  // (NUM) / DEN
  s = s.replace(/\(\s*([0-9a-zA-Z\\^{}_+\-\s\[\]/]+?)\s*\)\s*\/\s*([\\a-zA-Z0-9_]+)/g, '\\dfrac{$1}{$2}');

  // Number over number: 1/2 -> \dfrac{1}{2}, -1/2 -> -\dfrac{1}{2}
  s = s.replace(/(?<![a-zA-Z0-9_\/\^\\])([-+]?\d+)\s*\/\s*(\d+)(?![a-zA-Z0-9_\/])/g, '\\dfrac{$1}{$2}');
  // Number over variable: 1/x -> \dfrac{1}{x}, 1/x^2 -> \dfrac{1}{x^2}, 1/a -> \dfrac{1}{a}, 4/k -> \dfrac{4}{k}
  s = s.replace(/(?<![a-zA-Z0-9_\\])([-+]?\d+)\s*\/\s*([a-zA-Z](?:_[a-zA-Z0-9]+|_[0-9]+)?(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)(?![a-zA-Z0-9_])/g, '\\dfrac{$1}{$2}');
  // Variable over number: x/2 -> \dfrac{x}{2}
  s = s.replace(/(?<![a-zA-Z0-9_\\])([-+]?[a-zA-Z](?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\/\s*(\d+)(?![a-zA-Z0-9_])/g, '\\dfrac{$1}{$2}');
  // Variable over variable: x/a -> \dfrac{x}{a}, x/b -> \dfrac{x}{b}, a/b -> \dfrac{a}{b} (not inside \text{...})
  s = s.replace(/(?<![a-zA-Z0-9_\\])([-+]?[a-zA-Z](?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\/\s*([a-zA-Z](?:_[a-zA-Z0-9]+|_[0-9]+)?(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)(?![a-zA-Z0-9_])/g, (match, v1, v2, offset, full) => {
    const before = full.substring(Math.max(0, offset - 20), offset);
    if (/\\text\{[^{}]*$/.test(before)) return match;
    return `\\dfrac{${v1}}{${v2}}`;
  });
  // Greek letter fractions with leading coefficient or variable: 3\pi/4 -> \dfrac{3\pi}{4}, k\pi/12 -> \dfrac{k\pi}{12}, 7\pi/4 -> \dfrac{7\pi}{4}
  s = s.replace(/(?<![0-9a-zA-Z_\\])([-+]?(?:[0-9a-zA-Z_]+(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?\s*)?\\(?:pi|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|xi|rho|sigma|tau|phi|chi|psi|omega)(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\/\s*([0-9a-zA-Z]+)/g, (match, num, den) => {
    return `\\dfrac{${num.trim()}}{${den.trim()}}`;
  });
  // Greek letter fractions: \pi/2 -> \dfrac{\pi}{2}, \pi/4 -> \dfrac{\pi}{4}
  s = s.replace(/(\\(?:pi|alpha|beta|gamma|theta|lambda|mu|omega)(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\/\s*([a-zA-Z0-9]+)/g, '\\dfrac{$1}{$2}');
  s = s.replace(/(?<![a-zA-Z0-9_\\])([-+]?\d+)\s*\/\s*(\\(?:pi|alpha|beta|gamma|theta|lambda|mu|omega)(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)/g, '\\dfrac{$1}{$2}');
  // Convert complex balanced fractions and exp{...} braces before wrapping
  s = convertFractionsBalanced(s);
  s = convertExpBraces(s);
  s = convertLiteralCurlyBraces(s);

  // Upgrade \frac to \dfrac for proper "upon" height
  s = s.replace(/\\frac\b/g, '\\dfrac');

  // 11. Tall parentheses \left( \dfrac{...}{...} \right) with arbitrary nested braces
  s = s.replace(/(\\(?:tan|cot|sin|cos|sec|csc)(?:\^\{[^}]+\})?|\\(?:log_e|ln|log))\s*\(\s*(\\(?:d?frac)\{(?:[^{}]|\{[^{}]*\})*\}\{(?:[^{}]|\{[^{}]*\})*\})\s*\)/g,
    '$1\\left($2\\right)');

  // Parenthesized vertical fractions: (\dfrac{...}{...}) -> \left( \dfrac{...}{...} \right)
  s = s.replace(/(?<!\\left\s*)\(\s*(\\(?:d?frac)\{(?:[^{}]|\{[^{}]*\})*\}\{(?:[^{}]|\{[^{}]*\})*\})\s*\)(?!\s*\\right)/g, '\\left($1\\right)');

  // 12. Spacing around standalone \, dx, \, dy, \, dt, \, dz (never inside \frac or \dfrac)
  s = s.replace(/(?<!\\(?:d?frac)\{[^}]*|\\(?:d?frac)\{[^}]*\}\{[^}]*)(?:\\,)?\s*\b(d[txyz])\b(?!\s*\/|\s*\})/gi, ' \\, $1');
  s = s.replace(/\\(?:d?frac)\{\s*\\,?\s*(d[txyz])\s*\}\{\s*\\,?\s*(d[txyz])\s*\}/gi, '\\dfrac{$1}{$2}');

  // 13. Convert square brackets enclosing vertical fractions to \left[ ... \right]
  s = s.replace(/(?<!\\left\s*)\[\s*([^[\]]*?\\(?:d?frac)\{(?:[^{}]|\{[^{}]*\})*\}\{(?:[^{}]|\{[^{}]*\})*\}[\s\S]*?)\s*\](?!\s*\\right)/g, '\\left[ $1 \\right]');

  // Clean duplicated delimiters: \left\left[ -> \left[
  s = s.replace(/(?:\\left\s*)+\[/g, '\\left[');
  s = s.replace(/(?:\\right\s*)+\]/g, '\\right]');
  s = s.replace(/(?:\\left\s*)+\(/g, '\\left(');
  s = s.replace(/(?:\\right\s*)+\)/g, '\\right)');

  return s.trim();
}

/**
 * Smartly wraps mathematical formulas in KaTeX-compatible $...$ delimiters.
 * Wraps equations, integrals, summations, limits, and options while preserving
 * natural English sentence words.
 */
export function wrapMathInDollars(text: string): string {
  let s = text.trim();
  if (!s) return '';
  s = normalizePrimes(s);

  // Already single math block wrapped
  if (s.startsWith('$') && s.endsWith('$') && !s.slice(1, -1).includes('$')) {
    return s;
  }

  // Strip leading stray period or bullet before sentence text: e.g. ". If a curve" -> "If a curve"
  s = s.replace(/^\s*\.\s*(?=[A-Za-z])/g, '');

  // Check if string contains English prose words:
  const proseRegex = /\b(?:Let|Then|If|When|Where|Find|Calculate|Given|Suppose|Show|Prove|The|Hence|Therefore|is|are|was|were|equal|to|for|with|and|or|in|of|by|on|at|all|value|values|such|that|which|following|true|false|statements?|continuous|discontinuous|exists|at|least|points?|curve|solution|passing|through)\b/i;
  const words = s.split(/\s+/);
  const hasProse = proseRegex.test(s) && words.length > 2;

  // If pure math (like an option or standalone expression), wrap entirely in $...$
  if (!hasProse) {
    if (!s.startsWith('$')) {
      return `$${s}$`;
    }
    return s;
  }

  // For mixed text:
  // Step 1: Protect existing $...$ (including multiline cases and matrices)
  const protectedBlocks: string[] = [];
  s = s.replace(/\$(?:\\\$|[^\$])+?\$/g, (m) => {
    const key = `___PROT_${protectedBlocks.length}___`;
    protectedBlocks.push(m);
    return key;
  });

  const protect = (match: string) => {
    const key = `___PROT_${protectedBlocks.length}___`;
    protectedBlocks.push(`$${match.trim()}$`);
    return ` ${key} `;
  };

  // Step 2a: Piecewise and Matrix environments: e.g. f(x) = \begin{cases} ... \end{cases} or g(x) = \begin{cases}
  s = s.replace(/(?<!\$)([a-zA-Z]\s*\([a-zA-Z0-9_]+\)\s*=\s*\\begin\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix)\}[\s\S]+?\\end\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix)\}|\\begin\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix)\}[\s\S]+?\\end\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix)\})(?!\$)/g,
    (_, m) => protect(m));

  // Step 2b: Function mappings: e.g. f : \mathbb{R} \to \mathbb{R}
  s = s.replace(/(?<![a-zA-Z0-9_\$])([a-zA-Z]\s*:\s*(?:\\mathbb\{[A-Z]\}|[A-Z])\s*\\to\s*(?:\\mathbb\{[A-Z]\}|[A-Z]))(?![a-zA-Z0-9_\$])/g,
    (_, m) => protect(m));

  // Step 2c: Set membership expressions: e.g. a,b,c \in \mathbb{R} or x \in [0, 1]
  s = s.replace(/(?<![a-zA-Z0-9_\$])([a-zA-Z\\]+(?:\s*,\s*[a-zA-Z\\]+)*\s*\\in\s*(?:\\mathbb\{[A-Z]\}|\[[^\]]+\]|\([^\)]+\)|[A-Z]))(?![a-zA-Z0-9_\$])/g,
    (_, m) => protect(m));

  // Step 2d: Differential equations (unified with coefficients and brackets)
  // e.g. (1+e^{2x}) \dfrac{dy}{dx} + 2(1+y^2)e^x = 0
  // e.g. [\dfrac{x}{\sqrt{x^2-y^2}} + e^{y/x}] x \dfrac{dy}{dx} = x + ...
  // e.g. 2x^{2} dy=(2xy+y^{2}) \, dx
  // e.g. y(x+1) \, dx-x^{2} dy=0
  const proseDiffStopsEq = '(?:pass|passes|passing|touch|touches|touching|intersect|intersects|has|have|having|where|when|such|if|then|and|with|at|for|is|are)\\b';
  s = s.replace(
    new RegExp(`(?<![a-zA-Z0-9_\\$])([-0-9a-zA-Z^{}_\\\\()\\[\\]+*/\\s]*?\\b(?:d\\^?[0-9]?[a-zA-Z]?\\/d[a-zA-Z]\\^?[0-9]?|\\\\(?:d?frac)\\{d\\^?[0-9]?[a-zA-Z]?\\}\\{d[a-zA-Z]\\^?[0-9]?\\}|dy|dx|dt|dz)\\b[-0-9a-zA-Z^{}_\\\\()\\[\\]+*/\\s]*?=\\s*[^,;.\\n]+?)(?=\\s*[,;.]|\\s+${proseDiffStopsEq}|$)`, 'gi'),
    (fullMatch, eq: string) => {
      let activeEq = eq.trim();
      let prefix = '';
      const introMatch = activeEq.match(/^(.*?\b(?:(?:solution\s+curve\s+of\s+the\s+)?differential\s+equation|solution\s+curve|equation|curve|relation)\s*[:,]?\s*)([\s\S]+)$/i);
      if (introMatch) {
        prefix = introMatch[1];
        activeEq = introMatch[2];
      }
      const stripped = activeEq.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:let|the|for|with|where|when|if|then|is|are|curve|passes|passing|through|solution)\b/i.test(stripped)) {
        return fullMatch;
      }
      return (prefix ? prefix + ' ' : '') + protect(activeEq);
    }
  );

  // Step 2e: Function initial condition equations: e.g. y(2)=e, y(1)=3, y(0)=0, y(\pi/4)=\pi^2/32
  s = s.replace(
    /(?<![a-zA-Z0-9_\$])([a-zA-Z]\s*\([a-zA-Z0-9_+\-/*\\^\{\}\s.,]+\)\s*=\s*[-+*/a-zA-Z0-9_\\^{}()\s]+?)(?=\s*[,;.]|\s+(?:and|if|then|where|when|for|with|be)\b|$)/g,
    (fullMatch, eq) => {
      const nonLatex = eq.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:let|and|the|is|are|in|on|at|of|to|for|with|then|if|which|where)\b/i.test(nonLatex)) {
        return fullMatch;
      }
      return protect(eq);
    }
  );

  // Step 2f: Function curve definitions: e.g. y=f(x) or y = f(x)
  s = s.replace(/(?<![a-zA-Z0-9_\$])([a-zA-Z]\s*=\s*[a-zA-Z]\s*\([a-zA-Z0-9_+\-/*\s\\]+\))(?![a-zA-Z0-9_\$])/g,
    (_, m) => protect(m));

  // Step 2g: Coordinate tuples: e.g. point (1,2) or points (1,0) and (2\alpha, \alpha)
  s = s.replace(/(?<=\b(?:point|points|at|through|from)\s+)((?:\(\s*[^,()\n]+\s*,\s*[^,()\n]+(?:\s*,\s*[^,()\n]+)?\s*\)\s*(?:and|,)\s*)*\(\s*[^,()\n]+\s*,\s*[^,()\n]+(?:\s*,\s*[^,()\n]+)?\s*\))/gi, (m) => {
    return m.replace(/\(\s*[^,()\n]+\s*,\s*[^,()\n]+(?:\s*,\s*[^,()\n]+)?\s*\)/g, (pt) => protect(pt));
  });

  // Step 3: Full integral equations or expressions
  s = s.replace(/(?<![a-zA-Z0-9_\$])(\\(?:int|iint|iiint)(?:_\{[^{}]+\}|_[0-9a-zA-Z]+|\^\{[^{}]+\}|\^[0-9a-zA-Z]+)*\s*[\s\S]+?\\,\s*dx(?:\s*=\s*[^,;\n]+)?)(?=\s*,|\s+where|\s+for|\s+and|$)/gi,
    (_, m) => protect(m));

  // Step 4: Full equations starting with variable: e.g. S_{k} = \sum_{r=1}^{k} \tan^{-1}\left(\frac{6^{r}}{2^{2r+1}+3^{2r+1}}\right)
  s = s.replace(/(?<![a-zA-Z0-9_\$])(\b[A-Za-z](?:_\{[^{}]+\}|_[A-Za-z0-9]+)?\s*=\s*(?:\\sum|\\prod|\\lim)[\s\S]+?)(?=\s*\.|\s+Then\b|\s+and\b|\s+where\b|$)/gi,
    (_, m) => protect(m));

  // Step 5a: Full limits/summations with fractions or expressions before prose: e.g. \lim_{x\to 7}\frac{18-[1-x]}{[x-3a]} exists
  s = s.replace(/(?<![a-zA-Z0-9_\$])(\\(?:lim|sum|prod)(?:_\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|_[0-9a-zA-Z]+|\^\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\^[0-9a-zA-Z]+)*\s*(?:\\(?:frac|dfrac)\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|[A-Za-z0-9_^{}\\()\[\]+\-*/]+))(?=\s+(?:exists|is|equal|where|then|and|for|\.|\,)|$)/gi,
    (_, m) => protect(m));

  // Step 5b: Standalone limits/summations before prose: e.g. \lim_{k\to\infty} S_{k} is equal to, \lim_{x\to 0^{+}} f(x) is equal to
  s = s.replace(/(?<![a-zA-Z0-9_\$])(\\(?:lim|sum|prod)(?:_\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|_[0-9a-zA-Z]+|\^\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\^[0-9a-zA-Z]+)*\s*(?:[A-Za-z]['′]?(?:\([^()\n]+\))?|[A-Za-z0-9_^{}\\()]+))(?=\s+is\b|\s*=\s*|\s*[,;.]|\s+where\b|\s+and\b|$)/gi,
    (_, m) => protect(m));

  // Step 5c: Bracketed variable definitions like [t] or [x] when preceded by "where" or followed by "is"
  s = s.replace(/(?<![a-zA-Z0-9_\$])(\[[a-zA-Z0-9_\-]+\])(?=\s+(?:is|denotes|represents|where))/gi,
    (_, m) => protect(m));

  // Step 5d: Relational inequalities: e.g. \leq t, \le t, \ge t, > 0
  s = s.replace(/(?<![a-zA-Z0-9_\$])(\\(?:leq|ge|le|geq|neq)\s+[a-zA-Z0-9_\\]+)(?![a-zA-Z0-9_\$])/gi,
    (_, m) => protect(m));

  // Step 5e: Comprehensive expression before "is equal to" / "equals"
  // e.g. "then 6(y'(0) + (y(log_e √3))^2) is equal to", "then the value of 3\alpha^2 is equal to", "then y(2) is equal to"
  s = s.replace(
    /\b(then\s+(?:the\s+)?value\s+of|the\s+value\s+of|value\s+of|then|and|if|where|find|evaluate)\s+([^,;\n]+?)\s+(is\s+equal\s+to|equals\b)(?:\s*[:=_\-]+)?/gi,
    (fullMatch, lead, expr, tail) => {
      let trimmed = expr.trim();
      trimmed = trimmed.replace(/(?<![a-zA-Z0-9_\\])([-+]?\d+)\s*\/\s*(\d+)(?![a-zA-Z0-9_])/g, '\\dfrac{$1}{$2}');
      if (/[0-9\+\-\*\/\^_{}\(\)\[\]\\]/.test(trimmed) && !/\b(?:is|are|the|number|points|statement|curves?)\b/i.test(trimmed)) {
        return `${lead} ${protect(trimmed)} ${tail}`;
      }
      return fullMatch;
    }
  );

  // Step 5f: Chain inequalities: e.g. 0 < x < \dfrac{\pi}{2} or -1 \le x \le 1
  s = s.replace(
    /(?<![$\w])([-+]?[0-9a-zA-Z_^{}()\\]+(?:\/[-+]?[0-9a-zA-Z_^{}()\\]+)?\s*(?:<|>|<=|>=|≤|≥|\\le\b|\\ge\b|\\leq\b|\\geq\b)\s*[-+]?[0-9a-zA-Z_^{}()\\]+\s*(?:<|>|<=|>=|≤|≥|\\le\b|\\ge\b|\\leq\b|\\geq\b)\s*[-+]?(?:\\(?:d?frac)\{[^{}]+\}\{[^{}]+\}|[0-9a-zA-Z_^{}()\\]+))(?![$\w])/gi,
    (_, m) => protect(m)
  );

  // Step 5g: Standalone blackboard bold sets: \mathbb{R}, \mathbb{N}, etc.
  s = s.replace(/(?<![$\w])(\\(?:mathbb|mathbf|mathcal)\{[A-Z]\})(?![$\w])/g, (_, m) => protect(m));

  // Step 5h: Function composition expressions: e.g. (f \circ g)(x) or (fog)(x)
  s = s.replace(/(?<!\\)\(\s*([a-zA-Z])o([a-zA-Z])\s*\)\s*(\(\s*[-+0-9a-zA-Z_/*\\]+\s*\))/gi, (_m, f1, f2, arg) => {
    return `(${f1} \\circ ${f2})${arg}`;
  });

  s = s.replace(/(?<!\\)\(\s*([a-zA-Z])o([a-zA-Z])\s*\)/gi, (_m, f1, f2) => {
    return `(${f1} \\circ ${f2})`;
  });

  s = s.replace(/(?<![$\w])(\([a-zA-Z]\s*\\circ\s*[a-zA-Z]\)\s*(?:\([^()\n]+\))?)(?![$\w])/gi, (_m, expr) => protect(expr));

  // Step 5h: Standalone subscript variables outside math: e.g. where k_1 and k_2 are real constants
  s = s.replace(/(?<![a-zA-Z0-9_\$\\])([a-zA-Z]_[0-9a-zA-Z]+)(?![a-zA-Z0-9_\$])/g, (_m, sub) => protect(sub));

  // Step 6a: Multi-term algebraic relations/equations: e.g. a+b+c=1 or a+b+c \neq 1 or x^2+y^2=1
  s = s.replace(/(?<![a-zA-Z0-9_\$])([a-zA-Z0-9_\\]+(?:\s*[-+*/]\s*[a-zA-Z0-9_\\]+)+\s*(?:=|\\neq|\\leq|\\geq|<|>)\s*[-+*/a-zA-Z0-9_\\]+)(?![a-zA-Z0-9_\$])/gi,
    (_, m) => protect(m));

  // Step 6b: Inequalities or bounds: e.g. x > 1, \alpha, \beta > 0, 0 \le x < 1
  s = s.replace(/(?<![a-zA-Z0-9_\$])((?:[0-9]+(?:\.[0-9]+)?\s*(?:<=|>=|<|>|\\le\b|\\ge\b)\s*)?(?:\\[a-zA-Z]+|[a-zA-Z])(?:\s*,\s*(?:\\[a-zA-Z]+|[a-zA-Z]))*\s*(?:<=|>=|<|>|\\le\b|\\ge\b)\s*[-+*/0-9a-zA-Z_\\^{}()]+)(?=\s*[,;.]|\s+(?:and|if|then|where|when|for)\b|$)/gi,
    (fullMatch, eq) => {
      const nonLatex = eq.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:let|and|the|is|are|in|on|at|of|to|for|with|then|if|which|where)\b/i.test(nonLatex)) {
        return fullMatch;
      }
      return protect(eq);
    });

  // Step 6c: Polynomials or expressions: e.g. \alpha^4 - \beta^4 or \alpha^{4} - \beta^{4} or x^2 + y^2
  s = s.replace(/(?<![a-zA-Z0-9_\$])((\\[a-zA-Z]+|[a-zA-Z])(?:\^\{[^{}]+\}|\^[0-9a-zA-Z]+)\s*[-+*/]\s*(\\[a-zA-Z]+|[a-zA-Z])(?:\^\{[^{}]+\}|\^[0-9a-zA-Z]+))(?![a-zA-Z0-9_\$])/gi,
    (_, m) => protect(m));

  // Step 6c-1: Parenthesized or bracketed expressions with exponents or fractions:
  // e.g. (\dfrac{y}{x})^{3}, \left(\dfrac{y}{x}\right)^3, \left[\dfrac{y}{x}\right]^2, (\dfrac{1}{2})^n
  s = s.replace(
    /(?<![a-zA-Z0-9_\$\\])(?:\\left\s*\(\s*|\(\s*)([-+]?\s*\\(?:d?frac)\{(?:[^{}]|\{[^{}]*\})*\}\{(?:[^{}]|\{[^{}]*\})*\}[\s\S]*?)(?:\\right\s*\)|\))(?:\s*\^\s*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|[0-9a-zA-Z]+))?(?![a-zA-Z0-9_\$])/g,
    (m) => {
      let cleaned = m.trim();
      let exp = '';
      const expMatch = cleaned.match(/\^\s*(\{[^{}]*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}[^{}]*)*\}|[0-9a-zA-Z]+)$/);
      if (expMatch) {
        exp = `^${expMatch[1]}`;
        cleaned = cleaned.slice(0, cleaned.length - expMatch[0].length).trim();
      }
      if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
        cleaned = cleaned.slice(1, -1).trim();
      } else if (cleaned.startsWith('\\left(') && cleaned.endsWith('\\right)')) {
        cleaned = cleaned.slice(6, -7).trim();
      }
      return protect(`\\left(${cleaned}\\right)${exp}`);
    }
  );

  s = s.replace(
    /(?<![a-zA-Z0-9_\$\\])(?:\\left\s*\[\s*|\[\s*)([-+]?\s*\\(?:d?frac)\{(?:[^{}]|\{[^{}]*\})*\}\{(?:[^{}]|\{[^{}]*\})*\}[\s\S]*?)(?:\\right\s*\]|\])(?:\s*\^\s*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|[0-9a-zA-Z]+))?(?![a-zA-Z0-9_\$])/g,
    (m) => {
      let cleaned = m.trim();
      let exp = '';
      const expMatch = cleaned.match(/\^\s*(\{[^{}]*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}[^{}]*)*\}|[0-9a-zA-Z]+)$/);
      if (expMatch) {
        exp = `^${expMatch[1]}`;
        cleaned = cleaned.slice(0, cleaned.length - expMatch[0].length).trim();
      }
      if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
        cleaned = cleaned.slice(1, -1).trim();
      } else if (cleaned.startsWith('\\left[') && cleaned.endsWith('\\right]')) {
        cleaned = cleaned.slice(6, -7).trim();
      }
      return protect(`\\left[${cleaned}\\right]${exp}`);
    }
  );

  // General parenthesized math expressions with powers: e.g. (1+x^6)^{3/2}, (x+1)^2
  s = s.replace(
    /(?<![a-zA-Z0-9_\$\\])(?:\\left\s*\(\s*|\(\s*)([-+0-9a-zA-Z_\\^\{\}\s/+\-*.,]+?)(?:\\right\s*\)|\))\s*\^\s*((?:\{[^{}]*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}[^{}]*)*\}|[0-9a-zA-Z]+))(?![a-zA-Z0-9_\$])/g,
    (full, inner, exp) => {
      const stripped = inner.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:let|the|and|is|are|in|on|at|of|to|for|with|then|if|which|where|be)\b/i.test(stripped)) {
        return full;
      }
      const expStr = exp.startsWith('{') ? exp : `{${exp}}`;
      return protect(`\\left(${inner.trim()}\\right)^${expStr}`);
    }
  );

  // Step 6c-2: Radicals with optional leading coefficient: e.g. 6\sqrt{10}, 2\sqrt{2}, \sqrt{x^2+1}
  s = s.replace(/(?<![a-zA-Z0-9_\$\\])([-+]?\s*\d*\s*\\(?:sqrt|cbrt)(?:\[[^\]]+\])?\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})(?![a-zA-Z0-9_\$])/g,
    (_, m) => protect(m.trim()));

  // Step 6d: Standalone expressions with powers or subscripts: e.g. 2x^{2}, x^{3}, y^{2}, e^{-x}, e^{x}
  s = s.replace(/(?<![a-zA-Z0-9_\$\\])([0-9]*[a-zA-Z]\^\{[^{}]+\}|[0-9]*[a-zA-Z]\^[0-9a-zA-Z]+|[0-9]*[a-zA-Z]_[0-9a-zA-Z]+)(?![a-zA-Z0-9_\{])/g,
    (_, m) => protect(m));

  // Step 6e: Standalone fractions (with optional leading sign): e.g. \dfrac{1}{2}, -\dfrac{1}{2}, \dfrac{1}{a}
  s = s.replace(/(?<![a-zA-Z0-9_\$])([-+]?\s*\\(?:d?frac)\{[^{}]+\}\{[^{}]+\})(?![a-zA-Z0-9_\$])/g,
    (_, m) => protect(m.trim()));

  // Clean empty \dfrac{} or \frac{} so they are never protected into standalone invalid $\dfrac{}$
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*\{\s*\}/g, '');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*\{([^{}]+)\}/g, '\\dfrac{1}{$1}');
  s = s.replace(/\\(?:d?frac)\{([^{}]+)\}\s*\{\s*\}/g, '\\dfrac{$1}{1}');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*/g, '');
  s = s.replace(/\\(?:d?frac)(?!\s*\{)/g, '');

  // Step 7: Standalone math commands
  s = s.replace(/(?<!\$)([-+]?\s*(\\(?:tan|cot|sin|cos|sec|csc)\^\{[^}]+\}|\\(?:frac|dfrac|sqrt|log_e|ln|alpha|beta|gamma|theta|lambda|pi|sum|lim|int|mathbb\{[A-Z]\}|neq|leq|geq|in|to|subset|subseteq|cap|cup|pm|mp|times|div|cdot|hat\{[^{}]+\}|vec\{[^{}]+\}|Delta|phi))\S*(?:\s*[=+*/\-]\s*\S+)*)(?!\$)/g,
    (_, m) => protect(m));

  // Step 8: Restore protected blocks
  for (let idx = 0; idx < protectedBlocks.length; idx++) {
    s = s.replace(`___PROT_${idx}___`, protectedBlocks[idx]);
  }

  // Final cleanup of orphan tokens & empty fractions
  s = s.replace(/___PROT_\d+___/g, '');
  s = s.replace(/\u27E6MATH_\d+\u27E7/g, '');
  s = s.replace(/\[\s*MATH_\d+\s*\]/gi, '');
  s = s.replace(/⟦\s*MATH_\d+\s*⟧/gi, '');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*\{\s*\}/g, '');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*\{([^{}]+)\}/g, '\\dfrac{1}{$1}');
  s = s.replace(/\\(?:d?frac)\{([^{}]+)\}\s*\{\s*\}/g, '\\dfrac{$1}{1}');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*/g, '');
  s = s.replace(/\\(?:d?frac)(?!\s*\{)/g, '');

  // Clean double dollars and redundant spaces around punctuation
  s = s.replace(/\$\s*\$/g, ' ');
  s = s.replace(/\$\$+/g, '$');
  s = s.replace(/\s+,/g, ',');
  s = s.replace(/\s+\./g, '.');
  s = s.replace(/\s+/g, ' ').trim();
  s = convertLiteralCurlyBraces(s);

  return s;
}

/**
 * Smart Question Splitter:
 * Splits raw pasted text into individual question segments without
 * accidentally fragmenting numbered options (1., 2., 3., 4.) into separate questions.
 */
export function splitIntoQuestionSegments(rawText: string): string[] {
  const text = rawText.trim();
  if (!text) return [];

  // Check 1: Explicit "Question 1:", "Q.1:", "Q1." prefixes
  const explicitQRegex = /(?:^|\n\s*\n|\n)(?=(?:Q(?:uestion)?\.?\s*\d+[\.\:\)]?)\s*)/i;
  const explicitParts = text.split(explicitQRegex).map((p) => p.trim()).filter(Boolean);
  if (explicitParts.length > 1) {
    return explicitParts;
  }

  // Check 2: Separated by double newlines where each block starts with a question number e.g. "1.", "2."
  // Prevents splitting numbered options (1., 2., 3., 4.) that belong to the same question!
  const doubleNewlineBlocks = text.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
  if (doubleNewlineBlocks.length > 1) {
    const questionNumberedBlocks = doubleNewlineBlocks.filter((b) => /^(?:Q\d+|\d+[\.\:\)])/i.test(b));
    if (questionNumberedBlocks.length >= 2) {
      return doubleNewlineBlocks;
    }

    // Check 2b: Multiple blocks separated by double newlines where each block is a self-contained question
    // (has its own exam tag, or starts with question prose and ends with a query prompt)
    const isQuestionBlock = (b: string) => {
      if (/^\s*(?:\([A-D1-4]\)|\[[A-D1-4]\]|[A-D1-4][\.:\)])\s+[^\n]{1,60}$/i.test(b.trim())) return false;
      const hasExamTag = /(?:\[|\b)(?:JEE\s*(?:Main|Advanced)?|AIEEE|BITSAT|NEET)/i.test(b);
      const hasPrompt = /(?:is\s+equal\s+to|equals|find|evaluate|calculate|determine|\?|__+)/i.test(b);
      const startsWithQuestionProse = /^(?:[•\u2022\u25E6\u25AA\u25CF.\-—\s]*)(?:Let\b|If\b|The\s+(?:value|integral|number|area|function|equation|set|sum|slope|minimum|maximum|limit|differential)|Consider\b|Find\b|Evaluate\b|For\b|Given\b|Suppose\b|A\s+(?:curve|function|matrix|line|circle|triangle)\b)/i.test(b);
      return hasExamTag || (startsWithQuestionProse && hasPrompt);
    };
    const qBlocks = doubleNewlineBlocks.filter(isQuestionBlock);
    if (qBlocks.length >= 2 && qBlocks.length === doubleNewlineBlocks.length) {
      return doubleNewlineBlocks;
    }
  }

  // Check 3: Multiple "Ans:" or "Answer:" lines indicate multiple questions
  const ansMatches = [...text.matchAll(/(?:^|\n)\s*(?:Ans(?:wer)?|Correct\s*Option|Key)\s*[:=\-]?\s*[A-D1-4]/gi)];
  if (ansMatches.length > 1) {
    const multiQRegex = /(?:\n\s*\n|\n)(?=\d+[\.\:\)]\s+[A-Z])/gi;
    const parts = text.split(multiQRegex).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) return parts;
  }

  // Check 4: Sequential numbered questions e.g. "1. Let y = ... 2. Let f(x) = ..." or "\n1. ... \n2. ..."
  const sequentialRegex = /(?:^|[\n\r]|\s{2,})(?=\b\d{1,3}\s*[\.\:\)]\s*[A-Z])/g;
  const seqParts = text.split(sequentialRegex).map((p) => p.trim()).filter(Boolean);
  if (seqParts.length > 1) {
    const hasMultipleNumbered = seqParts.filter((p) => /^\d{1,3}\s*[\.\:\)]\s*[A-Z]/i.test(p)).length >= 2;
    if (hasMultipleNumbered) {
      return seqParts;
    }
  }

  // Default: Single question block (keeps statement & all options intact)
  return [text];
}

/**
 * Validates whether an extracted string candidate can legitimately be an option choice.
 * Returns false if candidate text is a question connective, query prompt, or condition prose.
 */
export function isValidOptionText(opt: string): boolean {
  if (!opt) return false;
  const t = opt.trim();
  if (!t) return false;

  // Cannot be pure sentence connective or conjunction
  if (/^(?:if|then|where|when|and|or|but|for|with|at|in|on|to|let|the|of|a|an|is|are|was|were|so|as)$/i.test(t)) {
    return false;
  }

  // Cannot start with sentence introductory clause
  if (/^(?:if|then|where|when|let|suppose|for\s+all|for\s+any)\s+/i.test(t)) {
    return false;
  }

  // Cannot contain question query or prompt
  if (/\b(?:is\s+equal\s+to|equal\s+to|equals\b|find\b|calculate\b|determine\b|evaluate\b|\?)/i.test(t)) {
    return false;
  }

  // Cannot contain fill-in-the-blank line
  if (/__+|_+$/.test(t)) {
    return false;
  }

  // Cannot contain problem condition prose
  if (/\b(?:satisfy|satisfies|satisfying|differentiable|continuous\s+at|given\s+that)\b/i.test(t)) {
    return false;
  }

  return true;
}

/**
 * Validates whether extracted candidate options A, B, C, D form a legitimate set of choices
 * and did not mutilate or steal the question prompt.
 */
export function areValidExtractedOptions(
  options: { A: string; B: string; C: string; D: string },
  statement: string
): boolean {
  const nonBlank = [options.A, options.B, options.C, options.D].filter((o) => o.trim().length > 0);
  if (nonBlank.length < 2) return false;

  // All extracted non-blank options must pass isValidOptionText
  for (const opt of nonBlank) {
    if (!isValidOptionText(opt)) {
      return false;
    }
  }

  // Remaining statement must not be left hanging
  const stmtTrim = statement.trim();
  if (!stmtTrim) return false;

  if (/\b(?:satisfy|satisfies|equation|function|such\s+that|let|suppose|and|with|if)$/i.test(stmtTrim)) {
    return false;
  }

  return true;
}

/**
 * Scans for sequential option keys, prioritizing bottom-most matches and ensuring all candidates pass validation.
 */
export function findSequentialOptions(
  text: string,
  markerRegex: RegExp,
  numToLetterMap: Record<string, 'A' | 'B' | 'C' | 'D'> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' },
  requireFour = false
): { options: { A: string; B: string; C: string; D: string }; statement: string } | null {
  const allMatches = [...text.matchAll(markerRegex)];
  if (allMatches.length < 2) return null;

  const parsedMatches = allMatches.map((m) => {
    const rawK = (m[1] || m[2] || m[3] || m[4] || '').toUpperCase();
    const key = numToLetterMap[rawK] || (rawK as 'A' | 'B' | 'C' | 'D');
    return {
      index: m.index!,
      length: m[0].length,
      key
    };
  });

  const expectedKeys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  const aIndices = parsedMatches
    .map((m, idx) => (m.key === 'A' ? idx : -1))
    .filter((idx) => idx !== -1);

  // Try from latest 'A' backwards to prioritize bottom-most options
  for (const aIdx of [...aIndices].reverse()) {
    const sequence: typeof parsedMatches = [];
    let nextExpected = 0;

    for (let i = aIdx; i < parsedMatches.length; i++) {
      if (parsedMatches[i].key === expectedKeys[nextExpected]) {
        sequence.push(parsedMatches[i]);
        nextExpected++;
        if (nextExpected === 4) break;
      }
    }

    if (requireFour && sequence.length < 4) continue;
    if (sequence.length < 2) continue;

    const firstOptIndex = sequence[0].index;
    const extractedStatement = text.slice(0, firstOptIndex).trim();
    const candidateMap = { A: '', B: '', C: '', D: '' };

    for (let i = 0; i < sequence.length; i++) {
      const cur = sequence[i];
      const start = cur.index + cur.length;
      const end = i + 1 < sequence.length ? sequence[i + 1].index : text.length;
      let optVal = text.slice(start, end).trim();
      optVal = optVal.replace(/\s*\.$/, '');
      candidateMap[cur.key] = optVal;
    }

    if (areValidExtractedOptions(candidateMap, extractedStatement)) {
      return { options: candidateMap, statement: extractedStatement };
    }
  }

  return null;
}

/**
 * Parses a single question text block into structured components.
 */
export function parseSingleQuestionBlock(rawBlock: string): ParsedWordQuestion {
  // Normalize unicode spaces and strip invisible Word/PDF mathematical formatting markers
  let text = cleanWordMathArtifacts(rawBlock).trim();

  // 1. Remove leading bullets, stray dots, and question numbering e.g. ". If a curve", "1.", "Q.1:", "(1)"
  text = text.replace(/^[\s\u2022\u25E6\u25AA\u25CF.\-—]+\s*(?=[A-Za-z])/g, '');
  text = text.replace(/^\s*(?:Q(?:uestion)?\.?\s*\d+[\.\:\)]?|\(?\d+\)[\.\:\)]?)\s*/i, '').trim();

  // 2. Extract Solution & Shortcut if present
  let solution = '';
  let shortcut = '';

  const shortcutMatch = text.match(/(?:DK\s*Sir\s*Shortcut|Shortcut|Speed\s*Trick)\s*[:=\-]\s*([\s\S]+?)(?=\n\s*(?:Ans|Solution|$))/i);
  if (shortcutMatch) {
    shortcut = shortcutMatch[1].trim();
    text = text.replace(shortcutMatch[0], '').trim();
  }

  const solutionMatch = text.match(/(?:Solution|Explanation|Step\s*Solution)\s*[:=\-]\s*([\s\S]+?)(?=\n\s*(?:Ans|Shortcut|$))/i);
  if (solutionMatch) {
    solution = solutionMatch[1].trim();
    text = text.replace(solutionMatch[0], '').trim();
  }

  // 3. Extract Answer Key / Numerical Answer (Supports Ans: A, Ans: (B), Ans: 1 -> A, Ans: 2 -> B, etc.)
  const numToLetterMap: Record<string, 'A' | 'B' | 'C' | 'D'> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
  let correctKey: 'A' | 'B' | 'C' | 'D' = 'A';
  let numericalAnswer = '';

  const ansMatch = text.match(/(?:Ans(?:wer)?|Correct\s*Option|Key)\s*[:=\-]?\s*\(?([A-D1-4]|\-?\d+(?:\.\d+)?)\)?/i);
  if (ansMatch) {
    const rawVal = ansMatch[1].trim().toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(rawVal)) {
      correctKey = rawVal as 'A' | 'B' | 'C' | 'D';
    } else if (['1', '2', '3', '4'].includes(rawVal)) {
      correctKey = numToLetterMap[rawVal] || 'A';
    } else {
      numericalAnswer = rawVal;
    }
    text = text.replace(ansMatch[0], '').trim();
  }

  // 4. Safely Extract Exam / Shift Tag BEFORE option scanning
  // Prevents exam tag from greedily consuming following options like "D 1/2 e^{\pi/2}-1"
  let examTag = '';
  const examRes = extractExamTagSafely(text);
  examTag = examRes.examTag;
  text = examRes.text.trim();

  // 5. Preformat docx options so glued or inline options like "to(A)", "is: A", "toA", "1e2B 2e2", "0(D)"
  // are properly separated onto newlines with standard (A), (B), (C), (D) markers
  text = preformatDocxOptions(text);

  // 6. Extract Options (Supports A-D, 1-4, Bare Labels, Single-Space Delimiters, and Blank/Unlabeled Newlines)
  let optionsMap: Record<string, string> = { A: '', B: '', C: '', D: '' };

  // Priority 1: Letter markers (A-D) enclosed: (A), [A], Option A
  let res = findSequentialOptions(text, /(?:^|\s+)(?:\(([A-Da-d])\)|\[([A-Da-d])\]|Option\s*\(?([A-Da-d])\)?[:.]?)(?:\s+|$)/gi);
  if (res) {
    optionsMap = res.options;
    text = res.statement;
  }

  // Priority 2: Letter markers with punctuation: A., A), A:
  if (!res) {
    res = findSequentialOptions(text, /(?:^|[\n\r\t]|\s+)([A-Da-d])[\.:\)](?:\s+|$)/gi);
    if (res) {
      optionsMap = res.options;
      text = res.statement;
    }
  }

  // Priority 3: Fresh newline dash letter markers: e.g. "\n- A" or "\nA - "
  if (!res) {
    res = findSequentialOptions(text, /(?:^|[\n\r])\s*([A-Da-d])\s*[-–—]\s+/gi);
    if (res) {
      optionsMap = res.options;
      text = res.statement;
    }
  }

  // Priority 4: Numbered markers (1-4) enclosed: (1), [1], Option 1 (require 4 options or explicit Option)
  if (!res) {
    res = findSequentialOptions(text, /(?:^|\s+)(?:Option\s*\(?([1-4])\)?[:.]?)(?:\s+|$)/gi);
    if (!res) {
      res = findSequentialOptions(text, /(?:^|\s+)(?:\(([1-4])\)|\[([1-4])\])(?:\s+|$)/gi, numToLetterMap, true);
    }
    if (res) {
      optionsMap = res.options;
      text = res.statement;
    }
  }

  // Priority 5: Numbered markers with punctuation on fresh newline: \n1., \n1), \n1:
  if (!res) {
    res = findSequentialOptions(text, /(?:^|[\n\r])\s*([1-4])[\.:\)](?:\s+|$)/gi, numToLetterMap, true);
    if (res) {
      optionsMap = res.options;
      text = res.statement;
    }
  }

  // Priority 6: Bare letter markers: A 10  B 20  C 30  D 40 (require all 4)
  if (!res) {
    res = findSequentialOptions(text, /(?:^|[\n\r\t]|\s{2,})([A-Da-d])\s+(?=\S)/gi, numToLetterMap, true);
    if (res) {
      optionsMap = res.options;
      text = res.statement;
    }
  }

  // Priority 7: Single-line sequential A ... B ... C ... D ...
  if (!res) {
    const singleLineMatchLetters = text.match(/(?:^|[\n\r\s])\(?A\)?\s*[\.:\)]?\s+([\s\S]+?)\s+\(?B\)?\s*[\.:\)]?\s+([\s\S]+?)\s+\(?C\)?\s*[\.:\)]?\s+([\s\S]+?)\s+\(?D\)?\s*[\.:\)]?\s+([\s\S]+)$/i);
    if (singleLineMatchLetters && typeof singleLineMatchLetters.index === 'number') {
      const statement = text.slice(0, singleLineMatchLetters.index).trim();
      const cand = {
        A: singleLineMatchLetters[1].trim().replace(/\s*\.$/, ''),
        B: singleLineMatchLetters[2].trim().replace(/\s*\.$/, ''),
        C: singleLineMatchLetters[3].trim().replace(/\s*\.$/, ''),
        D: singleLineMatchLetters[4].trim().replace(/\s*\.$/, '')
      };
      if (areValidExtractedOptions(cand, statement)) {
        optionsMap = cand;
        text = statement;
        res = { options: cand, statement };
      }
    }
  }

  // Priority 8: Blank / Unlabeled Options (Only when non-prose and distinct)
  if (!res) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length >= 5) {
      const candidateStmt = lines.slice(0, -4).join('\n').trim();
      const last4 = lines.slice(-4);
      const stmtEndsWithPrompt = /(?:[\.\?\:\=]|__+|is\s+equal\s+to|equals|is)\s*$/i.test(candidateStmt);
      const cand = {
        A: last4[0].replace(/\s*\.$/, ''),
        B: last4[1].replace(/\s*\.$/, ''),
        C: last4[2].replace(/\s*\.$/, ''),
        D: last4[3].replace(/\s*\.$/, '')
      };
      if (stmtEndsWithPrompt && last4.every((l) => l.length < 80) && areValidExtractedOptions(cand, candidateStmt)) {
        optionsMap = cand;
        text = candidateStmt;
        res = { options: cand, statement: candidateStmt };
      }
    } else if (lines.length >= 3) {
      const line1Tokens = lines[lines.length - 2].split(/\t+|\s{4,}/).map((t) => t.trim()).filter(Boolean);
      const line2Tokens = lines[lines.length - 1].split(/\t+|\s{4,}/).map((t) => t.trim()).filter(Boolean);
      if (line1Tokens.length === 2 && line2Tokens.length === 2) {
        const candidateStmt = lines.slice(0, -2).join('\n').trim();
        const cand = {
          A: line1Tokens[0].replace(/\s*\.$/, ''),
          B: line1Tokens[1].replace(/\s*\.$/, ''),
          C: line2Tokens[0].replace(/\s*\.$/, ''),
          D: line2Tokens[1].replace(/\s*\.$/, '')
        };
        if (areValidExtractedOptions(cand, candidateStmt)) {
          optionsMap = cand;
          text = candidateStmt;
          res = { options: cand, statement: candidateStmt };
        }
      }
    } else if (lines.length >= 2) {
      const lastLine = lines[lines.length - 1];
      const tokens = lastLine.split(/\t+|\s{4,}/).map((t) => t.trim()).filter(Boolean);
      if (tokens.length === 4) {
        const candidateStmt = lines.slice(0, -1).join('\n').trim();
        const cand = {
          A: tokens[0].replace(/\s*\.$/, ''),
          B: tokens[1].replace(/\s*\.$/, ''),
          C: tokens[2].replace(/\s*\.$/, ''),
          D: tokens[3].replace(/\s*\.$/, '')
        };
        if (areValidExtractedOptions(cand, candidateStmt)) {
          optionsMap = cand;
          text = candidateStmt;
          res = { options: cand, statement: candidateStmt };
        }
      }
    }
  }

  // 6. Mathematical & LaTeX Normalization (KaTeX / MathJax Compatibility via Master Normalizer)
  const normStatement = normalizeMathString(text.trim());
  const hasExtractedOptions = [optionsMap.A, optionsMap.B, optionsMap.C, optionsMap.D].some(
    (o) => o.trim().length > 0
  );

  const finalOptions: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = [
    { key: 'A', text: normalizeOptionMath(optionsMap.A || '') },
    { key: 'B', text: normalizeOptionMath(optionsMap.B || '') },
    { key: 'C', text: normalizeOptionMath(optionsMap.C || '') },
    { key: 'D', text: normalizeOptionMath(optionsMap.D || '') }
  ];

  const isNumerical = !hasExtractedOptions || Boolean(numericalAnswer);
  const type: 'SINGLE_CORRECT' | 'NUMERICAL' = isNumerical ? 'NUMERICAL' : 'SINGLE_CORRECT';

  return {
    statement: normStatement,
    options: finalOptions,
    type,
    correctKey,
    numericalAnswer: numericalAnswer || undefined,
    examTag: examTag || undefined,
    solution: solution ? normalizeMathString(solution) : undefined,
    shortcut: shortcut ? normalizeMathString(shortcut) : undefined
  };
}

/**
 * Main parser entry point: parses text into array of structured questions.
 */
export function parseWordQuestions(rawText: string): ParsedWordQuestion[] {
  const segments = splitIntoQuestionSegments(rawText);
  if (segments.length === 0) return [];
  return segments.map((seg) => parseSingleQuestionBlock(seg));
}
