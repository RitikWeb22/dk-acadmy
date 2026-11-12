/**
 * DK Academy JEE - Smart Clipboard Math Ingestion Engine (Pipeline Stage 1 & 4)
 * 
 * Intercepts copy-paste from:
 * - Microsoft Word (Desktop & 365) via conditional comments <!--[if gte msEquation 12]>
 * - Web browsers (KaTeX annotations, MathML, MathJax img alt attributes)
 * - PDFs and plain text notes
 * 
 * Automatically repairs linear equation residues, differentials, and bare math,
 * wrapping them into canonical $...$ KaTeX syntax with ZERO manual fixing.
 */

import { ommlNodeToLatex, mathMLNodeToLatex, parseMarkupToDoc } from '../universalMathEngine';
import { parseWordMatricesAndCases, areValidExtractedOptions, fixNestedExponents, normalizePrimes, convertFractionsBalanced, convertExpBraces, convertLiteralCurlyBraces, normalizeAllRadicals, normalizeWordIntegrals } from '../wordPasteParser';

export interface ParsedOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface ExtractedQuestionData {
  statement: string;
  options: ParsedOption[];
  correctKey?: 'A' | 'B' | 'C' | 'D';
  numericalAnswer?: string;
  solution?: string;
  shortcut?: string;
  examTag?: string;
  marks?: number;
  negativeMarks?: number;
  hasOptions: boolean;
  rawText: string;
}

const GREEK_UNICODE_MAP: Record<string, string> = {
  'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta', 'ε': '\\epsilon',
  'θ': '\\theta', 'λ': '\\lambda', 'μ': '\\mu', 'π': '\\pi', 'ρ': '\\rho',
  'σ': '\\sigma', 'τ': '\\tau', 'φ': '\\phi', 'ω': '\\omega', 'Δ': '\\Delta',
  'Ω': '\\Omega', 'Σ': '\\Sigma', 'Π': '\\Pi', 'Γ': '\\Gamma', 'Θ': '\\Theta'
};

const OPERATOR_UNICODE_MAP: Record<string, string> = {
  '−': '-', '–': '-', '—': '-', '×': '\\times', '÷': '\\div', '±': '\\pm',
  '≤': '\\le', '≥': '\\ge', '≠': '\\ne', '≈': '\\approx', '≡': '\\equiv',
  '∞': '\\infty', '∫': '\\int', '∬': '\\iint', '∭': '\\iiint', '∮': '\\oint',
  '∑': '\\sum', '∏': '\\prod', '√': '\\sqrt', '∂': '\\partial', '∇': '\\nabla',
  '∈': '\\in', '∉': '\\notin', '⊂': '\\subset', '⊆': '\\subseteq', '∪': '\\cup',
  '∩': '\\cap', '∧': '\\land', '∨': '\\lor', '¬': '\\neg', '⇒': '\\implies',
  '⇔': '\\iff', '→': '\\to', '←': '\\leftarrow', '↔': '\\leftrightarrow',
  '°': '^\\circ', '′': "'", '″': "''", '⋅': '\\cdot', '…': '\\dots'
};

const PROSE_LIST = 'if|let|the|be|is|are|in|on|at|by|for|to|of|and|or|then|than|where|when|what|which|who|how|why|such|that|with|from|into|curve|passing|through|solution|differential|equation|point|points|value|values|find|evaluate|calculate|equal|equals|given|suppose|assume|consider|hence|therefore|show|prove|origin|axis|plane|line|slope';
const PROSE_GUARD = '(?!(?:' + PROSE_LIST + ')\\b)';

const MATH_COEFF_VAR = '(?<![a-zA-Z])' + PROSE_GUARD + '[0-9]*[a-zA-Z]{1,3}(?:\\^\\{?[^{}]+\\}?|_\\{?[^{}]+\\}?)*(?![a-zA-Z])';
const MATH_NUM = '(?<![a-zA-Z0-9])[0-9]+(?:\\.[0-9]+)?(?![a-zA-Z0-9])';
const MATH_CMD = '\\\\[a-zA-Z]+(?:\\^\\{?[^{}]+\\}?|_\\{?[^{}]+\\}?)*';
const MATH_PAREN = '\\([^()\\n]+\\)(?:\\^\\{?[^{}]+\\}?)*';
const MATH_ATOM = '(?:' + [MATH_CMD, MATH_PAREN, MATH_COEFF_VAR, MATH_NUM].join('|') + ')';
const MATH_OPERATOR = '(?:[+\\-*/=><≤≥≠])';
const MATH_UNIT = '(?:' + MATH_ATOM + '|' + MATH_OPERATOR + ')';
const DIFF_SIDE = '(?:' + MATH_UNIT + '(?:\\s*' + MATH_UNIT + ')*)';
const DIFF_EQ = new RegExp('(?<![$\\w])(' + DIFF_SIDE + '\\s*=\\s*' + DIFF_SIDE + ')(?=(?:\\s*[,;.]|\\s+(?:then|where|when|if|and|pass|through|at|with)\\b|$))', 'gi');

/**
 * Strips Microsoft Office HTML formatting and comments while extracting OMML
 */
export function extractMathFromHtml(html: string): string {
  if (!html) return '';
  let s = html;

  // 1. Process Word conditional comments: <!--[if gte msEquation 12]>...<m:oMath>...<![endif]-->
  // First strip non-msEquation fallback image blocks cleanly to avoid regex backtracking
  s = s.replace(/<!\[if\s+!msEquation\]>[\s\S]*?<!\[endif\]>/gi, '');

  const ommlCommentRegex = /<!--\[if\s+gte\s+(?:msEquation|mso)\s+\d+\]>([\s\S]*?)<!\[endif\]-->/gi;
  s = s.replace(ommlCommentRegex, (_match, innerOmml: string) => {
    try {
      const doc = parseMarkupToDoc(
        `<root xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${innerOmml}</root>`,
        'xml'
      );
      if (doc) {
        const oMath =
          (doc.getElementsByTagNameNS && doc.getElementsByTagNameNS('*', 'oMath')[0]) ||
          doc.getElementsByTagName('m:oMath')[0] ||
          doc.getElementsByTagName('oMath')[0] ||
          (doc.querySelector && doc.querySelector('oMath, m\\:oMath'));
        if (oMath) {
          const latex = ommlNodeToLatex(oMath);
          if (latex) return ` $${latex}$ `;
        }
      }
    } catch {}
    return ' ';
  });

  // 2. Convert Web KaTeX annotations: <annotation encoding="application/x-tex">...
  s = s.replace(/<annotation[^>]*encoding=["']application\/x-tex["'][^>]*>([\s\S]*?)<\/annotation>/gi, (_m, tex: string) => {
    return ` $${tex.trim()}$ `;
  });

  // 3. Convert MathML: <math>...</math>
  s = s.replace(/<math[\s\S]*?<\/math>/gi, (match) => {
    try {
      const doc = parseMarkupToDoc(match, 'xml');
      if (doc) {
        const mathEl = doc.querySelector ? doc.querySelector('math') : doc.getElementsByTagName('math')[0];
        if (mathEl) {
          const latex = mathMLNodeToLatex(mathEl);
          if (latex) return ` $${latex}$ `;
        }
      }
    } catch {}
    return match;
  });

  // 4. Convert img tags with LaTeX alt text: <img alt="x^2+1" ...>
  s = s.replace(/<img[^>]*\balt=["']([^"']+)["'][^>]*>/gi, (_m, alt: string) => {
    if (/[\\^{}_]/.test(alt) || /\b(?:frac|sqrt|int|sum)\b/.test(alt)) {
      return ` $${alt.trim()}$ `;
    }
    return '';
  });

  // 5. Convert superscripts & subscripts: <sup>2</sup> -> ^{2}, <sub>i</sub> -> _{i}
  s = s.replace(/<sup[^>]*>([\s\S]*?)<\/sup>/gi, '^{$1}');
  s = s.replace(/<sub[^>]*>([\s\S]*?)<\/sub>/gi, '_{$1}');

  // 6. Strip remaining HTML tags
  s = s.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ');
  s = s.replace(/<\/(?:td|th)>/gi, '\t');
  s = s.replace(/<\/(?:tr|p|div|li|h[1-6])>/gi, '\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<[^>]+>/g, ' ');

  // 7. Decode HTML entities
  s = s.replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  return s;
}

/**
 * Normalizes Unicode math, Word linear fractions, and bare LaTeX expressions
 */
export function normalizeMathString(raw: string): string {
  if (!raw) return '';
  let s = parseWordMatricesAndCases(raw);
  s = normalizeWordIntegrals(s);

  // Clean leading bullet, number, or dot: ". If a curve..." -> "If a curve..."
  s = s.replace(/Word HTML dropped part of the question\.\s*The plain-text version was kept and needs review\.\s*/gi, '');
  s = s.replace(/^[\s\u2022\u25E6\u25AA\u25CF.\-—]+\s*/g, '');
  s = s.replace(/^Q(?:uestion)?\s*\.?\s*\d+\s*[:.)\-—]\s*/gi, '');

  // Strip Word equation literal text quotes: e.g. " and ", " is", " where ", " for ", " then "
  s = s.replace(/"\s*(and|or|is|where|when|for|then|if|with|such\s+that)\s*"/gi, ' $1 ');
  s = s.replace(/"\s*(is|and)\b/gi, ' $1');
  s = s.replace(/\b(is|and)\s*"/gi, '$1 ');
  s = s.replace(/([a-zA-Z0-9_)\]])"\s*(is|and|where|when|for|then|if|with)/gi, '$1 $2');

  // Clean zero-width chars and smart quotes
  s = s.replace(/\\\\([a-zA-Z]+)/g, '\\$1');
  s = s.replace(/\u00A0/g, ' ');
  s = s.replace(/[\u200B-\u200D\uFEFF\u2060\u2061\u2062\u2063\u2064▒□〖〗]/g, '');
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Remove stray unescaped $ inside open LaTeX groups/braces: e.g. \dfrac{x$\int...} or {- $1}
  let groupSanitized = '';
  let braceDepth = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    const prev = i > 0 ? s[i - 1] : '';
    if (char === '{' && prev !== '\\') {
      braceDepth++;
      groupSanitized += char;
    } else if (char === '}' && prev !== '\\') {
      if (braceDepth > 0) braceDepth--;
      groupSanitized += char;
    } else if (char === '$' && prev !== '\\' && braceDepth > 0) {
      // Stray $ inside an open LaTeX brace group - omit it
      continue;
    } else {
      groupSanitized += char;
    }
  }
  s = groupSanitized;

  // If \lim or \sum or \prod is immediately before a $, pull the $ in front of \lim:
  s = s.replace(/(\\\b(?:lim|sum|prod)(?:_[^{}\s]+|_\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\^[^{}\s]+|\^\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})*)\s*\$/gi, '$$$1 ');

  // If $ was opened after \lim or around \dfrac and left unclosed before prose stop (", then"):
  s = s.replace(/\$([^$\n]+?)(?=\s*,\s*(?:then|where|when|if|and)\b)/g, '$$$1$$');

  // Convert plain text piecewise cases: e.g. f(x) = { -2, -2 <= x <= 0 \n x - 2, 0 < x <= 2
  s = s.replace(/([a-zA-Z]\s*\([a-zA-Z0-9_]+\)\s*=\s*)\{\s*([\s\S]+?)(?=\s*(?:and|where|when|such|for|Then|\.|\b[a-zA-Z]\s*\([a-zA-Z0-9_]+\)\s*=|$))/gi, (match, lhs, body) => {
    if (!/(?:<=|>=|<|>|≤|≥|\\le|\\ge)/.test(body)) return match;
    const lines = body.split(/\n|\r\n|(?<=[0-9a-zA-Z_])\s{3,}/).map((l: string) => l.trim()).filter(Boolean);
    if (lines.length < 2) return match;
    const branches: string[] = [];
    for (const line of lines) {
      let cleanedLine = line.replace(/^\{+/, '').trim();
      const parts = cleanedLine.split(/\s*,\s*(?=[-+]?[0-9a-zA-Z_\\|])/);
      if (parts.length >= 2) {
        const expr = parts[0].trim();
        const cond = parts.slice(1).join(', ').trim()
          .replace(/<=|≤/g, '\\le ')
          .replace(/<(?!=)/g, ' < ')
          .replace(/>=|≥/g, '\\ge ')
          .replace(/>(?!=)/g, ' > ');
        branches.push(`${expr}, & ${cond}`);
      } else {
        branches.push(cleanedLine);
      }
    }
    return `${lhs}\\begin{cases} ${branches.join(' \\\\ ')} \\end{cases} `;
  });

  // Strip illegal prime / quote superscripts on digits e.g. 0^' or 0^{'} or 0' -> 0
  s = s.replace(/(\d+)\s*\^\s*\{?\s*['′]\s*\}?/g, '$1')
       .replace(/(\d+)\s*['′]/g, '$1')
       .replace(/([a-zA-Z\\]+)\s*\^\s*\{?\s*['′]\s*\}?/g, "$1'")
       .replace(/\^\s*\{?\s*['′]\s*\}?/g, "'");

  // Word linear limits: (lim)┬(h→0) or (lim)┬(h->0) or lim┬(x→0) or (lim)_(h→0) or lim_(x→0)
  s = s.replace(/(?:\(?\\?lim\)?)\s*[┬┴]\s*\(([^()]+)\)/gi, (_m, cond) => {
    const c = cond.trim().replace(/[→⟶]|->|(?<!\\)to\b/g, '\\to ').replace(/\\infty|\u221E|\binf\b/gi, '\\infty');
    return `\\lim_{${c.trim()}}`;
  });
  s = s.replace(/(?:\\?lim|\(lim\))_\s*\(([^()]+)\)/gi, (_m, cond) => {
    const c = cond.trim().replace(/[→⟶]|->|(?<!\\)to\b/g, '\\to ').replace(/\\infty|\u221E|\binf\b/gi, '\\infty');
    return `\\lim_{${c.trim()}}`;
  });

  // Word summations: ∑_(r=1)^k or ∑_{r=1}^k
  s = s.replace(/[∑\u2211]\s*_\s*([({])([^(){}]+)([)}])(?:\s*\^\s*([({]?)([0-9a-zA-Z_+-\\^]+)([)}]?))?/g, (_m, _o1, lower, _c1, _o2, upper) => {
    const up = upper ? `^{${upper.trim()}}` : '';
    return `\\sum_{${lower.trim()}}${up}`;
  });

  // Word products: ∏_(i=1)^n
  s = s.replace(/[∏\u220F]\s*_\s*([({])([^(){}]+)([)}])(?:\s*\^\s*([({]?)([0-9a-zA-Z_+-\\^]+)([)}]?))?/g, (_m, _o1, lower, _c1, _o2, upper) => {
    const up = upper ? `^{${upper.trim()}}` : '';
    return `\\prod_{${lower.trim()}}${up}`;
  });

  // Function dot multiplication: f(x).f(y) -> f(x) \cdot f(y)
  s = s.replace(/([a-zA-Z]\s*\([^()]+\))\s*\.\s*([a-zA-Z]\s*\([^()]+\))/g, '$1 \\cdot $2');

  // Domain & codomain: Let f,g:R→R or f:R->R
  s = s.replace(/\b([a-zA-Z](?:\s*,\s*[a-zA-Z])*)\s*:\s*([RNZQ])\s*(?:[→⟶]|->|\\to)\s*([RNZQ])\b/g, (_m, funcs, d, cd) => {
    const formattedFuncs = funcs.split(',').map((f: string) => f.trim()).join(', ');
    return `${formattedFuncs} : \\mathbb{${d}} \\to \\mathbb{${cd}}`;
  });
  s = s.replace(/[→⟶]|(?<=[0-9a-zA-Z\s])->(?=[0-9a-zA-Z\s])/g, ' \\to ');
  s = s.replace(/(\\in|\\notin|\\subset|\\subseteq|\\to)\s*([RNZQ])\b/g, '$1 \\mathbb{$2}');
  s = s.replace(/\b(on|in)\s+R\b/g, '$1 \\mathbb{R}');

  // Mathematical alphanumeric symbols (Word math italics)
  s = s.replace(/[\u{1D44E}-\u{1D467}]/gu, (c) => {
    const code = c.codePointAt(0);
    if (code === 0x1D455) return 'h';
    return String.fromCharCode(97 + ((code || 0) - 0x1D44E));
  });
  s = s.replace(/[\u{1D434}-\u{1D44D}]/gu, (c) => {
    const code = c.codePointAt(0);
    return String.fromCharCode(65 + ((code || 0) - 0x1D434));
  });

  // Greek and operators
  for (const [uni, cmd] of Object.entries(GREEK_UNICODE_MAP)) {
    s = s.replaceAll(uni, ` ${cmd} `);
  }
  for (const [uni, cmd] of Object.entries(OPERATOR_UNICODE_MAP)) {
    s = s.replaceAll(uni, ` ${cmd} `);
  }

  // Superscripts & Subscripts
  const superMap: Record<string, string> = {
    '⁰': '^{0}', '¹': '^{1}', '²': '^{2}', '³': '^{3}', '⁴': '^{4}',
    '⁵': '^{5}', '⁶': '^{6}', '⁷': '^{7}', '⁸': '^{8}', '⁹': '^{9}',
    '⁺': '^{+}', '⁻': '^{-}', 'ⁿ': '^{n}'
  };
  for (const [sup, exp] of Object.entries(superMap)) {
    s = s.replaceAll(sup, exp);
  }

  const subMap: Record<string, string> = {
    '₀': '_{0}', '₁': '_{1}', '₂': '_{2}', '₃': '_{3}', '₄': '_{4}',
    '₅': '_{5}', '₆': '_{6}', '₇': '_{7}', '₈': '_{8}', '₉': '_{9}',
    '₊': '_{+}', '₋': '_{-}'
  };
  for (const [sub, ind] of Object.entries(subMap)) {
    s = s.replaceAll(sub, ind);
  }

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

  // Fix nested exponents and prime derivatives
  s = fixNestedExponents(s);
  s = normalizePrimes(s);

  // Greek letter fractions with powers: \pi^2/32 -> \dfrac{\pi^2}{32}, \pi/2 -> \dfrac{\pi}{2}
  s = s.replace(/(\\[a-zA-Z]+)\s*\^/g, '$1^');
  // Greek letter fractions with leading coefficient or variable: 3\pi/4 -> \dfrac{3\pi}{4}, k\pi/12 -> \dfrac{k\pi}{12}, 7\pi/4 -> \dfrac{7\pi}{4}
  s = s.replace(/(?<![0-9a-zA-Z_\\])([-+])?\s*((?:[0-9a-zA-Z_]+(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?\s*)?\\(?:pi|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|xi|rho|sigma|tau|phi|chi|psi|omega)(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\/\s*([0-9a-zA-Z]+)/g, (_match, sign, num, den) => {
    const sPrefix = sign ? `${sign} ` : '';
    return `${sPrefix}\\dfrac{${num.trim()}}{${den.trim()}}`;
  });
  s = s.replace(/(\\(?:pi|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|xi|rho|sigma|tau|phi|chi|psi|omega)(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\/\s*([0-9a-zA-Z]+)/g, '\\dfrac{$1}{$2}');

  // Differentials: dy/(" "\, dx) -> \dfrac{dy}{dx}, d^n/dx^n -> \dfrac{d^n}{dx^n}
  s = s.replace(/\b(d(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?[a-zA-Z]?)\s*\/\s*\(\s*(?:["'][^"']*["'])?\s*(?:\\,)?\s*(d[a-zA-Z](?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\)/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\b(d(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?[a-zA-Z]?)\s*\/\s*(d[a-zA-Z](?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\b/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\(\s*["'][^"']*["']\s*(?:\\,)?\s*(d[a-zA-Z])\s*\)/g, '\\,$1');

  // Repair corrupted differential residues:
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}\s*\{?\s*(?:\\,)?\s*(d[a-zA-Z])/gi, '\\dfrac{$1}{$2}');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*\{\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}\s*\{\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}/gi, '\\dfrac{$1}{$2}');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*(?:\\?\s*\{\s*)?[^a-zA-Z\n]{0,8}(d[a-zA-Z])[^a-zA-Z\n]{1,8}(d[a-zA-Z])\}?/gi, '\\dfrac{$1}{$2}');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}\s*\{?\s*(?:\\,)?\s*([a-zA-Z]+)/gi, '\\dfrac{$1}{$2}');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*(?:\{\s*\})?\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\/\s*(?:\\,)?\s*(d[a-zA-Z])/gi, '\\dfrac{$1}{$2}');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])(?![a-zA-Z{])/gi, '\\dfrac{$1}{dx}');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*([a-zA-Z]+)\s*\}\s*\{?\s*(?:\\,)?\s*([a-zA-Z]+)/gi, '\\dfrac{$1}{$2}');
  s = s.replace(/\\(?:d?frac)\{\s*(?:\\,)?\s*([a-zA-Z]+)\s*\}\s*\{\s*(?:\\,)?\s*([a-zA-Z]+)\s*\}/gi, '\\dfrac{$1}{$2}');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*(?:\\,)?\s*([a-zA-Z]+)\s*\/\s*(?:\\,)?\s*([a-zA-Z]+)/g, '\\dfrac{$1}{$2}');

  // Separate glued math functions: 2xexp -> 2x exp, xexp -> x exp, 2xsin -> 2x sin
  s = s.replace(/([0-9a-zA-Z])\s*(sin|cos|tan|cot|sec|csc|log_e|ln|log|exp)\b/gi, '$1 $2');

  // Dot multiplication between radical/number and trig/function: √2 .sinx -> \sqrt{2} \sin x, 2.sin x -> 2 \sin x
  s = s.replace(/(\\(?:sqrt|cbrt)\{[^{}]+\}|\d+|[a-zA-Z0-9])\s*\.\s*(?=(?:\\)?(?:sin|cos|tan|sec|cot|csc|log|ln|exp|[a-zA-Z]))/gi, '$1 ');

  // Multiple angles: sin2x -> \sin 2x, cos2x -> \cos 2x, tan2x -> \tan 2x, sin3x -> \sin 3x
  s = s.replace(/\b(sin|cos|tan|sec|cot|csc)([2-9])(?=[a-zA-Z\\])/gi, '\\$1 $2');

  // Unspaced trig: sinx -> \sin x, cosx -> \cos x, tanx -> \tan x, secx -> \sec x
  s = s.replace(/\b(sin|cos|tan|sec|cot|csc)([a-zA-Z])\b/gi, '\\$1 $2');

  // Double parens on radicals: √((1+x^6)) or \sqrt((1+x^6)) or 4√2
  s = s.replace(/√\s*\(\s*\(\s*([^()]+)\s*\)\s*\)/g, '\\sqrt{$1}');
  s = s.replace(/\\?sqrt\s*\(\s*\(\s*([^()]+)\s*\)\s*\)/g, '\\sqrt{$1}');
  s = s.replace(/(\d+)\s*√\s*(\d+)/g, '$1\\sqrt{$2}');
  s = s.replace(/√\s*(\d+)/g, '\\sqrt{$1}');

  // Join words hyphenated across a newline: e.g. differ-\nential -> differential
  s = s.replace(/([a-zA-Z])-\s*[\r\n]+\s*([a-zA-Z])/g, '$1$2');
  // Only connect math closing brackets directly preceding prose continuation verbs across a newline:
  s = s.replace(/([\]\)])\s*[\r\n]+\s*(pass(?:es)?|touch(?:es)?|intersect(?:s)?|where|when|such|then|with)\b/gi, '$1 $2');
  s = s.replace(/([a-zA-Z0-9\]\)])passthrough\b/gi, '$1 pass through');
  s = s.replace(/(?<!\\[a-zA-Z]*)([a-zA-Z0-9\]\)])\s*(pass(?:es)?\s+through|touch(?:es)?|intersect(?:s)?|where|when|such|then|with)\b/gi, '$1 $2');

  // Normalize all radicals first so they have proper \sqrt{...} format with balanced parens
  s = normalizeAllRadicals(s);

  // Radical fractions: e.g. x/√(x^2-y^2) or x/\sqrt{x^2-y^2} -> \dfrac{x}{\sqrt{x^2-y^2}} (safely swallow stray Word trailing brace)
  s = s.replace(/([a-zA-Z0-9]+)\s*\/\s*\\?sqrt\s*\{([^}]+)\}\s*\}?/gi, '\\dfrac{$1}{\\sqrt{$2}}');
  s = s.replace(/([a-zA-Z0-9]+)\s*\/\s*\\?sqrt\s*\(([^)]+)\)\s*\}?/gi, '\\dfrac{$1}{\\sqrt{$2}}');
  s = s.replace(/([a-zA-Z0-9]+)\s*\/\s*√\s*\(([^()]+)\)\s*\}?/g, '\\dfrac{$1}{\\sqrt{$2}}');
  s = s.replace(/([a-zA-Z0-9]+)\s*\/\s*(\\(?:sqrt|cbrt)\{(?:[^{}]|\{[^{}]*\})*\})\s*\}?/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*(\\(?:sqrt|cbrt)\{(?:[^{}]|\{[^{}]*\})*\})\s*\}?/g, '\\dfrac{$1}{$2}');
  s = s.replace(/(\\(?:sqrt|cbrt)\{(?:[^{}]|\{[^{}]*\})*\})\s*\/\s*([a-zA-Z0-9]+)/g, '\\dfrac{$1}{$2}');

  // Exponential fraction: e.g. e^{y/x} or e^(y/x) -> e^{\frac{y}{x}}
  s = s.replace(/e\s*\^\s*\{?\s*([a-zA-Z0-9]+)\s*\/\s*([a-zA-Z0-9]+)\s*\}?/g, 'e^{\\frac{$1}{$2}}');

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
  s = s.replace(
    /\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*\(((?:[^()\n]|\([^()\n]*\))+?)\)/g,
    '\\dfrac{$1}{$2}'
  );
  s = s.replace(/(?<![a-zA-Z0-9_\\])\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*(?!\\(?:sqrt|cbrt)\b)([A-Za-z0-9_\\^{}]+)/g, '\\dfrac{$1}{$2}');
  s = s.replace(/(?<![a-zA-Z0-9_\\])([A-Za-z0-9_\\^{}]+)\s*\/\s*\(((?:[^()\n]|\([^()\n]*\))+?)\)/g, '\\dfrac{$1}{$2}');
  
  // Number over number: 1/2, -1/2, 3/4
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
  // Greek letter fractions with leading coefficient / variable: 3\pi/4 -> \dfrac{3\pi}{4}, k\pi/12 -> \dfrac{k\pi}{12}, 7\pi/4 -> \dfrac{7\pi}{4}
  s = s.replace(/(?<![0-9a-zA-Z_\\])([-+]?(?:[0-9a-zA-Z_]+(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?\s*)?\\(?:pi|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|xi|rho|sigma|tau|phi|chi|psi|omega)(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\/\s*([0-9a-zA-Z]+)/g, (match, num, den) => {
    return `\\dfrac{${num.trim()}}{${den.trim()}}`;
  });
  // Greek letter fractions: \pi/2 -> \dfrac{\pi}{2}, \pi/4 -> \dfrac{\pi}{4}
  s = s.replace(/(\\(?:pi|alpha|beta|gamma|theta|lambda|mu|omega)(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\/\s*([a-zA-Z0-9]+)/g, '\\dfrac{$1}{$2}');
  s = s.replace(/(?<![a-zA-Z0-9_\\])([-+]?\d+)\s*\/\s*(\\(?:pi|alpha|beta|gamma|theta|lambda|mu|omega)(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)/g, '\\dfrac{$1}{$2}');
  // Convert complex balanced fractions, radicals, and exp{...} braces
  s = normalizeAllRadicals(s);
  s = convertFractionsBalanced(s);
  s = convertExpBraces(s);
  s = convertLiteralCurlyBraces(s);
  s = convertLiteralCurlyBraces(s);

  // Upgrade \frac to \dfrac for proper "upon" height
  s = s.replace(/\\frac\b/g, '\\dfrac');

  // Convert square brackets enclosing vertical fractions to \left[ ... \right]
  s = s.replace(/(?<!\\left\s*)\[\s*([^[\]]*?\\(?:d?frac)\{(?:[^{}]|\{[^{}]*\})*\}\{(?:[^{}]|\{[^{}]*\})*\}[\s\S]*?)\s*\](?!\s*\\right)/g, '\\left[ $1 \\right]');

  // Clean duplicated delimiters: \left\left[ -> \left[
  s = s.replace(/(?:\\left\s*)+\[/g, '\\left[');
  s = s.replace(/(?:\\right\s*)+\]/g, '\\right]');
  s = s.replace(/(?:\\left\s*)+\(/g, '\\left(');
  s = s.replace(/(?:\\right\s*)+\)/g, '\\right)');

  // Exponential cleanup: \exp\{ ... \} with balanced braces
  const expRegex = /\\?exp\s*\\?\{/gi;
  let expMatch: RegExpExecArray | null;
  let expResult = '';
  let expLastIndex = 0;

  while ((expMatch = expRegex.exec(s)) !== null) {
    expResult += s.substring(expLastIndex, expMatch.index);
    const startInner = expRegex.lastIndex;
    let depth = 1;
    let i = startInner;
    let foundClose = false;

    for (; i < s.length; i++) {
      const ch = s[i];
      const prev = i > 0 ? s[i - 1] : '';
      if (ch === '{' && prev !== '\\') {
        depth++;
      } else if (ch === '}' && prev !== '\\') {
        depth--;
        if (depth === 0) {
          foundClose = true;
          break;
        }
      } else if (depth === 1 && /\b(pass|through|origin|is|equal|where|then|and)\b/i.test(s.substring(i, i + 8))) {
        break;
      }
    }

    let inner = s.substring(startInner, i).trim();
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
    expResult += `\\exp\\left\\{${inner}\\right\\}`;
    expLastIndex = foundClose ? i + 1 : i;
    expRegex.lastIndex = expLastIndex;
  }
  expResult += s.substring(expLastIndex);
  s = expResult;

  s = s.replace(/\\?exp\s*\(\s*([^()]+)\s*\)/g, '\\exp\\left($1\\right)');

  // Trig (safe inverse trig without consuming enclosing parentheses)
  s = s.replace(/\\?(sin|cos|tan|cot|sec|csc)\s*\^\s*(?:\{\s*-?\s*1\s*\}|\(\s*-?\s*1\s*\))\s*\(\s*([a-zA-Z0-9_\^]+)\s*\)/gi, '\\$1^{-1}($2)');
  s = s.replace(/\\?(sin|cos|tan|cot|sec|csc)\s*\^\s*(?:\{\s*-?\s*1\s*\}|\(\s*-?\s*1\s*\))\s*(?![\\(])([a-zA-Z0-9]+(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)/gi, '\\$1^{-1}($2)');
  s = s.replace(/\\?(sin|cos|tan|cot|sec|csc)\s*\^\s*(?:\{\s*-?\s*1\s*\}|\(\s*-?\s*1\s*\))/gi, '\\$1^{-1}');
  s = s.replace(/(?<!\\)\b(sin|cos|tan|cot|sec|csc)\b/gi, '\\$1');

  // Fractions inside \exp: \frac -> \dfrac
  s = s.replace(/\\exp\\left\\\{([\s\S]*?)\\right\\\}/g, (_, inner) => {
    const upgraded = inner.replace(/\\frac\b/g, '\\dfrac');
    return `\\exp\\left\\{${upgraded}\\right\\}`;
  });

  // Aligned
  s = s.replace(/\\begin\{align\*?\}/g, '\\begin{aligned}');
  s = s.replace(/\\end\{align\*?\}/g, '\\end{aligned}');

  // Redundant sqrt parens
  s = s.replace(/\\sqrt\(\s*([^()]+)\s*\)/g, '\\sqrt{$1}');
  s = s.replace(/\\sqrt\{\s*\(([^()]+)\)\s*\}/g, '\\sqrt{$1}');

  // Insert space after semicolons/commas when followed directly by initial conditions or variables (e.g. "dx;y(2)=e" or "0,y(1)=e")
  s = s.replace(/([0-9a-zA-Z_)\\])\s*([;,])\s*([a-zA-Z]\s*(?:\([^()]+\)|=))/g, '$1$2 $3');

  // Wrap bare LaTeX in $...$
  const protectedBlocks: string[] = [];
  s = s.replace(/\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?:\\\$|[^\$])+?\$|\\\([\s\S]*?\\\)/g, (m) => {
    const key = `\u27E6MATH_${protectedBlocks.length}\u27E7`;
    protectedBlocks.push(m);
    return key;
  });

  const isInsideLatexGroup = (str: string, offset: number): boolean => {
    let depth = 0;
    for (let i = 0; i < offset; i++) {
      if (str[i] === '{' && (i === 0 || str[i - 1] !== '\\')) depth++;
      else if (str[i] === '}' && (i === 0 || str[i - 1] !== '\\')) {
        if (depth > 0) depth--;
      }
    }
    return depth > 0;
  };

  const protect = (mathContent: string) => {
    let clean = mathContent.trim();
    if (!clean) return '';
    let trail = '';
    const m = clean.match(/([,;.]+)$/);
    if (m) {
      trail = m[1];
      clean = clean.slice(0, -trail.length).trim();
    }
    // Unpack any nested ⟦MATH_...⟧ tokens already inside clean so tokens never nest
    let unpackPasses = 0;
    while (/\u27E6MATH_(\d+)\u27E7/.test(clean) && unpackPasses < 10) {
      clean = clean.replace(/\u27E6MATH_(\d+)\u27E7/g, (_, id) => {
        const inner = protectedBlocks[Number(id)] || '';
        return inner.replace(/^\$|\$$/g, '').trim();
      });
      unpackPasses++;
    }
    const key = `\u27E6MATH_${protectedBlocks.length}\u27E7`;
    protectedBlocks.push(`$${clean}$`);
    return ` ${key}${trail} `;
  };

  s = s.replace(/\\,\s*/g, ' ');

  const proseLead = '(?:Let|If|Suppose|Given|Define|Find|Evaluate|Calculate|Show|Consider)\\b\\s*[:,]?\\s*';
  const proseStops = '(?:pass|passes|passing|touch|touches|touching|intersect|intersects|has|have|having|where|when|such|if|then|and|with|at|for|is|are|represented|representing|given)\\b';

  // 1. Environments (with optional LHS: f(x) = \begin{cases} ... \end{cases} or A = \begin{pmatrix} ... \end{pmatrix})
  s = s.replace(
    new RegExp(`(${proseLead})?((?:[a-zA-Z]\\s*(?:\\([^()\\n]*\\))?\\s*=\\s*)?\\\\begin\\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|aligned)\\}[\\s\\S]+?\\\\end\\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|aligned)\\})`, 'g'),
    (_, lead, m) => (lead ? lead + ' ' : '') + protect(m)
  );

  // 1b. Function mappings: e.g. f : \mathbb{R} \to \mathbb{R}, g:(0, \infty) \to \mathbb{R}, f: [0, 1] \to \mathbb{R}
  s = s.replace(
    /(?<![$\w])([a-zA-Z]\s*:\s*(?:\\mathbb\{[A-Z]\}|[A-Z]|\([^()\n]+\)|\[[^\[\]\n]+\]|\\?\{[^{}\n]+?\\?\}(?:\s*[-−]\s*\\?\{[^{}\n]+?\\?\})?)\s*(?:\\to|->|→)\s*(?:\\mathbb\{[A-Z]\}|[A-Z]|\([^()\n]+\)|\[[^\[\]\n]+\]))(?![$\w])/g,
    (_, m) => protect(m)
  );
  s = s.replace(/(?<![a-zA-Z0-9_\$])([a-zA-Z]\s*:\s*(?:\\mathbb\{[A-Z]\}|[A-Z])\s*\\to\s*(?:\\mathbb\{[A-Z]\}|[A-Z]))(?![a-zA-Z0-9_\$])/g,
    (_, m) => protect(m));

  // Dedicated curve & line equations after "with the curve", "and the curve", "the curve", "curve", "the line", "line":
  // e.g. "with the curve y = \sqrt{2}\sin x is", "curve y = \sqrt{2}\sin x", "the line y = 3x + 1"
  s = s.replace(
    /(?<=\b(?:with\s+the\s+curve|and\s+the\s+curve|of\s+the\s+curve|the\s+curve|curve|the\s+line|line)\s+)([a-zA-Z]\s*=\s*[-+*/0-9a-zA-Z_\\^{}()\s.]*?[a-zA-Z0-9_\\^{}()\]]+)(?=\s*[,;.]|\s+(?:is|are|pass|passes|touch|touches|intersect|intersects|has|have|at|where|when|if|then|and|with)\b|$)/gi,
    (fullMatch, eq) => {
      const stripped = eq.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:let|the|for|with|where|when|if|then|is|are|curve|line)\b/i.test(stripped)) {
        return fullMatch;
      }
      return protect(eq);
    }
  );

  // Set equations with intervals and set differences (balanced curly brace matching):
  // e.g. S = (0, 2\pi) - \{ \pi/2, 3\pi/4, 3\pi/2, 7\pi/4 \}, S = \mathbb{R} - \{0\}, A = [0, 2\pi] - \{ \pi/2 \}
  const setRegex = /(?<![$\w])([A-Z]\s*=\s*(?:\\mathbb\{[A-Z]\}|[A-Z]|\([^()\n]+\)|\[[^\[\]\n]+\])\s*[-−]\s*(\\?\{)|[A-Z]\s*=\s*(\\?\{)|(?:\([^()\n]+\)|\[[^\[\]\n]+\]|\\mathbb\{[A-Z]\}|[A-Z])\s*[-−]\s*(\\?\{)|(?<=(?:[-−]|\\setminus)\s*)(\\?\{))/g;
  let setMatch: RegExpExecArray | null;
  let setRes = '';
  let setLastIndex = 0;
  while ((setMatch = setRegex.exec(s)) !== null) {
    setRes += s.substring(setLastIndex, setMatch.index);
    const braceStr = setMatch[2] || setMatch[3] || setMatch[4] || setMatch[5] || '{';
    const isEscaped = braceStr.startsWith('\\');
    const startInner = setMatch.index + setMatch[0].length;
    let depth = 1;
    let i = startInner;
    for (; i < s.length; i++) {
      const isEsc = i > 0 && s[i - 1] === '\\';
      if (s[i] === '{') {
        if (isEsc === isEscaped) depth++;
      } else if (s[i] === '}') {
        if (isEsc === isEscaped) {
          depth--;
          if (depth === 0) break;
        }
      }
    }
    const fullMatched = s.substring(setMatch.index, i + 1);
    let formattedSet = fullMatched;
    if (formattedSet.includes('{') && !formattedSet.includes('\\left\\{')) {
      formattedSet = formattedSet.replace(/\\?\{([\s\S]*)\\?\}/, (_, inner) => `\\left\\{${inner.trim()}\\right\\}`);
    }
    setRes += protect(formattedSet);
    setLastIndex = i + 1;
    setRegex.lastIndex = setLastIndex;
  }
  setRes += s.substring(setLastIndex);
  s = setRes;

  // 3. Symmetric 3D Line Equations: \frac{x-x1}{a} = \frac{y-y1}{b} = \frac{z-z1}{c}
  s = s.replace(
    new RegExp(`(?<![$\\w])((?:\\\\(?:d?frac)\\{[^{}]+\\}\\{[^{}]+\\}|[a-zA-Z0-9_+-]+)\\s*=\\s*(?:\\\\(?:d?frac)\\{[^{}]+\\}\\{[^{}]+\\}|[a-zA-Z0-9_+-]+)\\s*=\\s*(?:\\\\(?:d?frac)\\{[^{}]+\\}\\{[^{}]+\\}|[a-zA-Z0-9_+-]+))(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'gi'),
    (_, m) => protect(m)
  );

  // 4. Integrals: \int ... dx
  s = s.replace(
    new RegExp(`(?<![$\\w])(\\\\(?:int|iint|iiint|oint)(?:_[^{}\\s]+|_\\{\\s*[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\s*\\}|\\^[^{}\\s]+|\\^\\{\\s*[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\s*\\})*\\s*[\\s\\S]+?(?:\\\\,?\\s*d[a-zA-Z]|dx|dy|dt|dz|du|dv|d\\theta|dr)(?![a-zA-Z]))(?=(?:\\s*=\\s*[^,;.\\n]+)?(?:\\s*[,;.]|\\s+${proseStops}|$))`, 'gi'),
    (fullMatch, _int, offset) => isInsideLatexGroup(s, offset) ? fullMatch : protect(fullMatch)
  );

  // 5. Limits, Summations, Products: \lim_{...} ... (stop strictly before prose)
  s = s.replace(
    new RegExp(`(?<![$\\w])(\\\\(?:lim|sum|prod)(?:_[^{}\\s]+|_\\{\\s*[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\s*\\}|\\^[^{}\\s]+|\\^\\{\\s*[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\s*\\})*\\s*[-a-zA-Z0-9_^{}()'|\\\\+*/\\[\\]=\\s.,]*?[-a-zA-Z0-9_^{}()'|\\\\+*/\\[\\]=}])(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'gi'),
    (m, _, offset) => isInsideLatexGroup(s, offset) ? m : protect(m)
  );

  // 6. Differential equations with explicit differentials: 2x^2 dy = (2xy+y^2) dx OR y(x+1) dx - x^2 dy = 0 OR [ ... ] x \dfrac{dy}{dx} = ...
  s = s.replace(
    new RegExp(`(${proseLead})?([-a-zA-Z0-9_^{}()'|\\\\+*/\\[\\]\\s.]*?\\b(?:d\\^?[0-9]?[a-zA-Z]?\\/d[a-zA-Z]\\^?[0-9]?|\\\\(?:d?frac)\\{d\\^?[0-9]?[a-zA-Z]?\\}\\{d[a-zA-Z]\\^?[0-9]?\\}|dy|dx|dt|dz)\\b[-a-zA-Z0-9_^{}()'|\\\\+*/\\[\\]\\s.]*?=[-a-zA-Z0-9_^{}()'|\\\\+*/\\[\\]\\s.]+?)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'gi'),
    (fullMatch, lead, eq) => {
      let activeLead = lead || '';
      let activeEq = eq;

      const introMatch = activeEq.match(/^(.*?\b(?:(?:solution\s+curve\s+of\s+the\s+)?differential\s+equation|solution\s+curve|equation|curve|relation)\s*[:,]?\s*)([\s\S]+)$/i);
      if (introMatch) {
        activeLead += introMatch[1];
        activeEq = introMatch[2];
      }

      const nonLatex = activeEq.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:let|the|curve|passes|passing|through|solution|find|evaluate)\b/i.test(nonLatex)) {
        return fullMatch;
      }
      return (activeLead ? activeLead + ' ' : '') + protect(activeEq);
    }
  );

  // 7. Vector Equations & Triple Products: \vec{r} = \vec{a} + \lambda \vec{b}, [\vec{a} \; \vec{b} \; \vec{c}]
  s = s.replace(
    /(?<![$\w])(\[\s*\\vec\{[^{}]+\}[\s\S]+?\\vec\{[^{}]+\}\s*\])/g,
    (_, m) => protect(m)
  );
  s = s.replace(
    new RegExp(`(?<![$\\w])(\\\\vec\\{[^{}]+\\}\\s*=\\s*[^,;.\\n]+?)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'gi'),
    (_, m) => protect(m)
  );

  // 8. General equations with LaTeX operators / functions: A^{-1} = ..., E = E^\circ - ...
  s = s.replace(
    new RegExp(`(${proseLead})?([-a-zA-Z0-9_^{}()'|\\\\+*/\\[\\]\\s.]+=([-a-zA-Z0-9_^{}()'|\\\\+*/\\[\\]\\s.]|\\\\(?:d?frac)\\{[^{}]+\\}\\{[^{}]+\\})+)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'g'),
    (fullMatch, lead, eq) => {
      let activeLead = lead || '';
      let activeEq = eq;

      const introMatch = activeEq.match(/^(.*?\b(?:(?:solution\s+curve\s+of\s+the\s+)?differential\s+equation|solution\s+curve|equation|curve|relation)\s*[:,]?\s*)([\s\S]+)$/i);
      if (introMatch) {
        activeLead += introMatch[1];
        activeEq = introMatch[2];
      }

      if (!/(\\[a-zA-Z]+|\^|_|\b(?:det|Tr|adj|sgn|sin|cos|tan|log|ln|exp)\b)/.test(activeEq)) {
        return fullMatch;
      }
      const nonLatex = activeEq.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:let|the|and|for|with|where|when|if|then|is|are|find|curve|line|plane)\b/i.test(nonLatex)) {
        return fullMatch;
      }
      return (activeLead ? activeLead + ' ' : '') + protect(activeEq);
    }
  );

  // 8b. Functional equations: f(x+y) = f(x) \cdot f(y), f(x^2)+g(4-x)=4x^3, g(4-x)+g(x)=0
  s = s.replace(
    new RegExp(
      `(?<![$\\w])(` +
      `(?:[a-zA-Z]\\s*\\([^()\\n]+\\)|[-+*/0-9a-zA-Z_\\\\^{}]+)` +
      `(?:\\s*[-+*/]\\s*(?:[a-zA-Z]\\s*\\([^()\\n]+\\)|[-+*/0-9a-zA-Z_\\\\^{}]+))*` +
      `\\s*=\\s*` +
      `[-+*/0-9a-zA-Z_\\\\^{}()'|.\\s]+?` +
      `)(?=\\s+${proseStops}|\\s*[,;.]|$)`,
      'gi'
    ),
    (fullMatch, eq) => {
      // Must contain at least one function call: e.g. f(...) or g(...)
      if (!/[a-zA-Z]\s*\([^()\n]+\)/.test(eq)) {
        return fullMatch;
      }
      const nonLatex = eq.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:let|the|and|for|with|where|when|if|then|is|are|find|curve|line|plane)\b/i.test(nonLatex)) {
        return fullMatch;
      }
      return protect(eq);
    }
  );

  // 9. Initial conditions / evaluations: y(2)=e, y(1)=e, f'(0), f(1/2), y(4)
  s = s.replace(
    new RegExp(`(?<![$\\w])([a-zA-Z]\\s*(?:'*\\s*\\([a-zA-Z0-9_+\\-/*\\\\^\\{\\}\\s.,]+\\)|'\\s*\\(\\s*0\\s*\\))\\s*=\\s*[-+*/a-zA-Z0-9_\\\\^{}()]+?)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'g'),
    (fullMatch, eq) => {
      const nonLatex = eq.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:let|and|the|is|are|in|on|at|of|to|for|with|then|if|which|where)\b/i.test(nonLatex)) {
        return fullMatch;
      }
      return protect(eq);
    }
  );

  // 10. Angles with degree symbol: \sin 45^\circ or 45^\circ
  s = s.replace(
    /(?<![$\w])((?:\\(?:sin|cos|tan|cot|sec|csc)\s*)?[0-9]+(?:\.[0-9]+)?\s*\^\s*\\circ)/g,
    (_, m) => protect(m)
  );

  // 11. Curve definitions: y=f(x) or y=y(x)
  s = s.replace(/(?<![$\w])([a-zA-Z]\s*=\s*[a-zA-Z]\s*\([a-zA-Z0-9_+\-/*\s\\]+\))(?![$\w])/g, (_, m) => protect(m));

  // 11b. Point coordinates: point (1,2) or points (1,0) and (2\alpha, \alpha)
  s = s.replace(/(?<=\b(?:point|points|at|through|from)\s+)((?:\(\s*[^,()\n]+\s*,\s*[^,()\n]+(?:\s*,\s*[^,()\n]+)?\s*\)\s*(?:and|,)\s*)*\(\s*[^,()\n]+\s*,\s*[^,()\n]+(?:\s*,\s*[^,()\n]+)?\s*\))/gi, (m) => {
    return m.replace(/\(\s*[^,()\n]+\s*,\s*[^,()\n]+(?:\s*,\s*[^,()\n]+)?\s*\)/g, (pt) => protect(pt));
  });

  // 12a. Chain inequalities: e.g. 0 < x < \dfrac{\pi}{2} or -1 \le x \le 1
  s = s.replace(
    /(?<![$\w])([-+]?[0-9a-zA-Z_^{}()\\]+(?:\/[-+]?[0-9a-zA-Z_^{}()\\]+)?\s*(?:<|>|<=|>=|≤|≥|\\le\b|\\ge\b|\\leq\b|\\geq\b)\s*[-+]?[0-9a-zA-Z_^{}()\\]+\s*(?:<|>|<=|>=|≤|≥|\\le\b|\\ge\b|\\leq\b|\\geq\b)\s*[-+]?(?:\\(?:d?frac)\{[^{}]+\}\{[^{}]+\}|[0-9a-zA-Z_^{}()\\]+))(?![$\w])/gi,
    (_, m) => protect(m)
  );

  // 12. Inequalities & non-equalities: x > 1, \alpha, \beta > 0, f(x) \ne 0, \det A \neq 0
  s = s.replace(
    new RegExp(`(?<![$\\w])((?:\\\\[a-zA-Z]+|[a-zA-Z0-9_^{}()]+)(?:\\s*,\\s*(?:\\\\[a-zA-Z]+|[a-zA-Z0-9_^{}()]+))*\\s*(?:[><=≤≥≠]|\\\\(?:ne\\b|neq\\b|le\\b|ge\\b|leq\\b|geq\\b))\\s*[-+]?[0-9a-zA-Z_\\\\]+)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'g'),
    (fullMatch, eq) => {
      const nonLatex = eq.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:if|then|and|where|when|for|let)\b/i.test(nonLatex)) return fullMatch;
      return protect(eq);
    }
  );

  // 13. Single function terms / derivatives: f'(0), y(4), f( \dfrac{1}{2} ), f( 1/2 )
  s = s.replace(
    /(?<![$\w])([a-zA-Z]'*\s*\(\s*(?:\\(?:d?frac)\{[^{}]+\}\{[^{}]+\}|\d+\s*\/\s*\d+|[0-9a-zA-Z_+\-/*]+)\s*\))(?![$\w])/g,
    (m, _, offset) => {
      if (isInsideLatexGroup(s, offset)) return m;
      const fracNorm = m.replace(/\(\s*(\d+)\s*\/\s*(\d+)\s*\)/, '\\left(\\dfrac{$1}{$2}\\right)')
                        .replace(/\(\s*(\\d?frac\{[^{}]+\}\{[^{}]+\})\s*\)/, '\\left($1\\right)');
      return protect(fracNorm);
    }
  );

  // 13b. Expressions before "is equal to" / "equals"
  // e.g. "then 6(y'(0) + (y(log_e √3))^2) is equal to", "then the value of 3\alpha^2 is equal to", "then y(2) is equal to"
  s = s.replace(
    /\b(then\s+(?:the\s+)?value\s+of|the\s+value\s+of|value\s+of|then|and|if|where|find|evaluate)\s+((?:[^,;.\n]|\.(?=\d))+?)\s+(is\s+equal\s+to|equals\b)(?:\s*[:=_\-]+)?/gi,
    (fullMatch, lead, expr, tail) => {
      let trimmed = expr.trim();
      // Keep English prose like "integral" / "the integral" out of math delimiters
      const intMatch = trimmed.match(/^((?:(?:the\s+)?(?:definite\s+)?integral)\s+)([\s\S]+)$/i);
      if (intMatch) {
        lead = `${lead} ${intMatch[1]}`.trim();
        trimmed = intMatch[2].trim();
      }
      trimmed = trimmed.replace(/(?<![a-zA-Z0-9_\\])([-+]?\d+)\s*\/\s*(\d+)(?![a-zA-Z0-9_])/g, '\\dfrac{$1}{$2}');
      if (/[0-9\+\-\*\/\^_{}\(\)\[\]\\]/.test(trimmed) && !/\b(?:is|are|the|number|points|statement|curves?)\b/i.test(trimmed)) {
        return `${lead} ${protect(trimmed)} ${tail}`;
      }
      return fullMatch;
    }
  );

  // 13c. Standalone blackboard bold sets: \mathbb{R}, \mathbb{N}, etc.
  s = s.replace(/(?<![$\w])(\\(?:mathbb|mathbf|mathcal)\{[A-Z]\})(?![$\w])/g, (m, _, offset) => isInsideLatexGroup(s, offset) ? m : protect(m));

  // 13d. Function composition expressions: e.g. (f \circ g)(x) or (fog)(x)
  s = s.replace(/(?<![$\w])(\([a-zA-Z]\s*\\circ\s*[a-zA-Z]\)\s*(?:\([^()\n]+\))?)(?![$\w])/gi, (m, expr, offset) => isInsideLatexGroup(s, offset) ? m : protect(expr));

  // 14b. Generalized set membership relations: x \in S, x, y \in S, x \in A, x \in \mathbb{R}, x \in [0, 1], x \in \{...\}
  s = s.replace(
    /(?<![$\w])([a-zA-Z](?:\s*,\s*[a-zA-Z])*\s*\\in\s*(?:\\mathbb\{[A-Z]\}|[A-Z]|\[[^\[\]\n]+\]|\([^()\n]+\)|\\?\{[^{}\n]+?\\?\}))(?![$\w])/g,
    (m, _, offset) => isInsideLatexGroup(s, offset) ? m : protect(m)
  );
  s = s.replace(/(?<![$\w])([a-zA-Z](?:\s*,\s*[a-zA-Z])*\s*\\in\s*(?:\\mathbb\{[RNZQ]\}|[RNZQ]|\[[^\[\]\n]+\]|\([^()\n]+\)))(?![$\w])/g, (m, _, offset) => isInsideLatexGroup(s, offset) ? m : protect(m));

  // Expressions after "is" before punctuation or prose stops: e.g. "is \dfrac{k\pi}{12}, then", "is \dfrac{a}{b}, where", "is \sqrt{2}, then"
  s = s.replace(
    /(?<=\bis\s+)([-+]?\s*(?:\\(?:d?frac)\{(?:[^{}]|\\{[^{}]*\\})+\\}\{(?:[^{}]|\\{[^{}]*\\})+\\}|\\(?:sqrt|cbrt)\{[^{}]+\}|[0-9a-zA-Z_\\^{}()]+)(?:\s*[-+*/]\s*(?:\\(?:d?frac)\{[^{}]+\}\{[^{}]+\}|\\(?:sqrt|cbrt)\{[^{}]+\}|[0-9a-zA-Z_\\^{}()]+))*)(?=\s*[,;.]|\s+(?:then|where|when|if|and)\b)/g,
    (m, expr, offset) => {
      if (isInsideLatexGroup(s, offset)) return m;
      if (/^[_.\s]+$/.test(expr)) return m;
      const stripped = expr.replace(/\\[a-zA-Z]+/g, ' ').trim();
      if (/\b(?:the|a|an|equal|true|false|correct|given|defined|continuous)\b/i.test(stripped)) return m;
      if (/[0-9\+\-\*\/\^_{}\(\)\\]/.test(expr)) {
        return protect(expr);
      }
      return m;
    }
  );

  // Single variable before "is equal to" / "equals": e.g. "then k is equal to" -> "then $k$ is equal to"
  s = s.replace(
    /\b(then\s+)([a-zA-Z])(\s+(?:is\s+equal\s+to|equals)\b)/gi,
    (_, lead, v, tail) => `${lead}${protect(v)}${tail}`
  );

  // 14c. Simple variable assignments after at/for/where/when/if: at x = 0, for x = 1
  s = s.replace(
    new RegExp(`(?<=\\b(?:at|for|where|when|if|with)\\s+)([a-zA-Z]\\s*=\\s*[-+]?[0-9a-zA-Z_\\\\^{}()]+)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'g'),
    (m, _, offset) => isInsideLatexGroup(s, offset) ? m : protect(m)
  );

  // 14d. Parenthesized or bracketed expressions with exponents or fractions:
  // e.g. (\dfrac{y}{x})^{3}, \left(\dfrac{y}{x}\right)^3, \left[\dfrac{y}{x}\right]^2, (\dfrac{1}{2})^n
  s = s.replace(
    /(?<![a-zA-Z0-9_\$\\])(?:\\left\s*\(\s*|\(\s*)([-+]?\s*\\(?:d?frac)\{(?:[^{}]|\{[^{}]*\})*\}\{(?:[^{}]|\{[^{}]*\})*\}[\s\S]*?)(?:\\right\s*\)|\))(?:\s*\^\s*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|[0-9a-zA-Z]+))?(?![a-zA-Z0-9_\$])/g,
    (m, _, offset) => {
      if (isInsideLatexGroup(s, offset)) return m;
      let cleaned = m.trim();
      let exp = '';
      const expMatch = cleaned.match(/\^\s*(\{[\s\S]+\}|[0-9a-zA-Z]+)$/);
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
    (m, _, offset) => {
      if (isInsideLatexGroup(s, offset)) return m;
      let cleaned = m.trim();
      let exp = '';
      const expMatch = cleaned.match(/\^\s*(\{[\s\S]+\}|[0-9a-zA-Z]+)$/);
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
    (full, inner, exp, offset) => {
      if (isInsideLatexGroup(s, offset)) return full;
      const stripped = inner.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:let|the|and|is|are|in|on|at|of|to|for|with|then|if|which|where|be)\b/i.test(stripped)) {
        return full;
      }
      const expStr = exp.startsWith('{') ? exp : `{${exp}}`;
      return protect(`\\left(${inner.trim()}\\right)^${expStr}`);
    }
  );

  // 14e. Radicals with optional leading coefficient: e.g. 6\sqrt{10}, 2\sqrt{2}, \sqrt{x^2+1}
  s = s.replace(/(?<![a-zA-Z0-9_\$\\])([-+]?\s*\d*\s*\\(?:sqrt|cbrt)(?:\[[^\]]+\])?\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})(?![a-zA-Z0-9_\$])/g,
    (m, _, offset) => isInsideLatexGroup(s, offset) ? m : protect(m.trim()));

  // 14f. Set definitions: e.g. A = {1, 3, 7, 9, 11}, B = {2, 4, 5, 7, 8, 10, 12}, S = {a \in \mathbb{R} : ...}
  s = s.replace(
    /(?<![$\w])([A-Z]\s*=\s*\\?\{[^{}\n]+?\\?\})(?![$\w])/g,
    (m, _, offset) => isInsideLatexGroup(s, offset) ? m : protect(m)
  );

  // 14g. Set differences: e.g. \mathbb{R} - \{0\}, R - {-1, 1}, (-1, \infty) - {3}, N - {1}
  s = s.replace(
    /(?<![$\w])((?:\\mathbb\{[RNZQ]\}|[RNZQ]|\([^()\n]+\)|\[[^\[\]\n]+\])\s*[-−]\s*\\?\{[^{}\n]+?\\?\})(?![$\w])/g,
    (m, _, offset) => isInsideLatexGroup(s, offset) ? m : protect(m)
  );

  // 14h. Function domains or mappings with sets: e.g. f: {1, 2, 3, 4} \to ..., n \in {1, 2, 3}
  s = s.replace(
    /(?<![$\w])([a-zA-Z]\s*:\s*\\?\{[^{}\n]+?\\?\}\s*(?:\\to|->|→)\s*[-+*/a-zA-Z0-9_\\\\^{}()'|\\[\\]\\{\\}\\s.]+?)(?=\\s*[,;.]|\\s+${proseStops}|$)/g,
    (m, _, offset) => isInsideLatexGroup(s, offset) ? m : protect(m)
  );

  // 14i. Standalone finite sets after "is" or "in" or "to": e.g. "is {1, 2, 3, 4, 5}", "in {1, 2, 3}"
  s = s.replace(
    /(?<=\b(?:is|in|to)\s+)(\\?\{[-+0-9a-zA-Z_\s,;.\-\\/]+\\?\})(?=\s*[,;.]|\s+${proseStops}|$)/g,
    (m, _, offset) => isInsideLatexGroup(s, offset) ? m : protect(m)
  );

  // Sets after set difference operator "-" or "\setminus": e.g. " - {1, 2}", " - \{\frac{\pi}{2}, ...\}"
  s = s.replace(
    /(?<=(?:[-−]|\\setminus)\s*)(\\?\{[-+0-9a-zA-Z_\\^{}()\s,;.\-\\/]+\\?\})(?=\s*[,;.]|\s+${proseStops}|$)/g,
    (m, _, offset) => isInsideLatexGroup(s, offset) ? m : protect(m)
  );

  // Clean empty \dfrac{} or \frac{} so they are never protected into standalone invalid $\dfrac{}$
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*\{\s*\}/g, '');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*/g, '');
  s = s.replace(/\\(?:d?frac)(?!\s*\{)/g, '');

  // 15. Remaining standalone LaTeX commands with balanced braces
  s = s.replace(
    new RegExp(`(?<![$\\w])(\\\\(?:d?frac)\\{(?:[^{}]|\\{[^{}]*\\})+\\}\\{(?:[^{}]|\\{[^{}]*\\})+\\}|\\\\(?:sqrt|vec|hat|bar|dot|ddot|tilde|mathbf|mathrm|text|operatorname)\\{(?:[^{}]|\\{[^{}]*\\})*\\}(?:[A-Za-z0-9_^{}\\\\()[\\]+\\-*/\\s.]*[A-Za-z0-9_^{}\\\\()[\\]+\\-*/])?|\\\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|infty|times|div|pm|mp|le|ge|ne|approx|sim|to|partial|nabla|degree|circ)(?![a-zA-Z]))(?=\\s*[,;.]|\\s+${proseStops}|$|\\s+[a-zA-Z]{3,})`, 'gi'),
    (fullMatch, cmd, offset) => isInsideLatexGroup(s, offset) ? fullMatch : protect(cmd)
  );

  // 1. Expand any remaining nested ⟦MATH_...⟧ tokens inside protectedBlocks
  for (let p = 0; p < 10; p++) {
    let changed = false;
    for (let i = 0; i < protectedBlocks.length; i++) {
      if (/[\u27E6⟦\[]MATH_?(\d+)[\u27E7⟧\]]/i.test(protectedBlocks[i])) {
        protectedBlocks[i] = protectedBlocks[i].replace(/[\u27E6⟦\[]MATH_?(\d+)[\u27E7⟧\]]/gi, (_, id) => {
          const inner = protectedBlocks[Number(id)] || '';
          return inner.replace(/^\$|\$$/g, '').trim();
        });
        changed = true;
      }
    }
    if (!changed) break;
  }

  // 2. Restore all protected blocks into s recursively with global regex
  let restorePasses = 0;
  while (/[\u27E6⟦\[]MATH_?(\d+)[\u27E7⟧\]]/i.test(s) && restorePasses < 10) {
    s = s.replace(/[\u27E6⟦\[]MATH_?(\d+)[\u27E7⟧\]]/gi, (_, id) => {
      const block = protectedBlocks[Number(id)];
      return block !== undefined ? block : '';
    });
    restorePasses++;
  }

  // 3. Final safety cleanup: remove any leftover orphan tokens
  s = s.replace(/\u27E6MATH_\d+\u27E7/g, '');
  s = s.replace(/\[\|MATH_\d+\|\]/g, '');
  s = s.replace(/___PROT_\d+___/g, '');
  s = s.replace(/\[\s*MATH_\d+\s*\]/gi, '');
  s = s.replace(/⟦\s*MATH_\d+\s*⟧/gi, '');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*\{\s*\}/g, '');
  s = s.replace(/\\(?:d?frac)\{\s*\}\s*/g, '');
  s = s.replace(/\\(?:d?frac)(?!\s*\{)/g, '');

  // 4. Clean adjacent dollars and spacing
  s = s.replace(/\$\s*\$/g, ' ');
  s = s.replace(/\$\$+/g, '$');
  s = s.replace(/\s+,/g, ',');
  s = s.replace(/\s+\./g, '.');
  s = s.replace(/[^\S\r\n]+/g, ' ').trim();

  return s;
}

/**
 * Normalizes mathematical option text (fractions, logarithms, powers, single numbers).
 * Leaves descriptive English choices ("None of these", "Both A and B") as plain text.
 */
export function normalizeOptionMath(raw: string): string {
  if (!raw) return '';
  let s = raw.trim();
  s = s.replace(/\s*\.$/, '');
  s = s.replace(/\\\\([a-zA-Z]+)/g, '\\$1');

  // Strip Word invisible formatting characters, unicode math symbols and quotes early
  s = s.replace(/[\u2061\u2062\u2063\u2064]/g, ' ')
       .replace(/[\u200B-\u200F\uFEFF\u00AD\u034F\u180E\uFFF9-\uFFFC]/g, '')
       .replace(/[−–]/g, '-')
       .replace(/°/g, '^\\circ')
       .replace(/×/g, '\\times')
       .replace(/÷/g, '\\div')
       .replace(/π/g, '\\pi ')
       .replace(/α/g, '\\alpha ')
       .replace(/β/g, '\\beta ')
       .replace(/γ/g, '\\gamma ')
       .replace(/θ/g, '\\theta ')
       .replace(/λ/g, '\\lambda ')
       .replace(/μ/g, '\\mu ');

  if (
    (s.startsWith('$') && s.endsWith('$') && !s.slice(1, -1).includes('$')) ||
    (s.startsWith('\\(') && s.endsWith('\\)')) ||
    (s.startsWith('\\[') && s.endsWith('\\]'))
  ) {
    // Already delimited: clean up \frac -> \dfrac and return
    return s.replace(/\\frac\b/g, '\\dfrac');
  }

  // 1. Plain text fraction and exponential tokens in options
  s = s.replace(/\b1\s+2\s*(?:exp|\\exp)\b/gi, '\\dfrac{1}{2} \\exp');
  s = s.replace(/\b1\s+4\s*(?:exp|\\exp)\b/gi, '\\dfrac{1}{4} \\exp');
  s = s.replace(/\b2\s*(?:exp|\\exp)\b/gi, '2 \\exp');
  s = s.replace(/(?<!\\)\bexp\b/gi, '\\exp');
  s = s.replace(/\\exp\s+(?!\\left)([-+]?[0-9a-zA-Z\\^{}_/]+(?:\s*[-+]\s*[-+]?[0-9a-zA-Z\\^{}_/]+)*)/g, '\\exp\\left($1\\right)');

  s = s.replace(/\b1\s+2\b/g, '\\dfrac{1}{2}');
  s = s.replace(/\b1\s+4\b/g, '\\dfrac{1}{4}');
  s = s.replace(/\b3\s+4\b/g, '\\dfrac{3}{4}');
  s = s.replace(/\b3\s+8\b/g, '\\dfrac{3}{8}');
  s = s.replace(/\b5\s+2\b/g, '\\dfrac{5}{2}');
  s = s.replace(/\b17\s+2\b/g, '\\dfrac{17}{2}');

  s = s.replace(/[-−]\s*3\s+2e\b/gi, '-\\dfrac{3}{2e}');
  s = s.replace(/[-−]\s*2\s+3e\b/gi, '-\\dfrac{2}{3e}');
  s = s.replace(/[-−]\s*3\s+e\b/gi, '-\\dfrac{3}{e}');
  s = s.replace(/[-−]\s*2\s+e\b/gi, '-\\dfrac{2}{e}');

  // Greek letter fractions with leading signs or coefficients:
  // e.g. +\pi/4 -> + \dfrac{\pi}{4}, -\pi/2 -> - \dfrac{\pi}{2}, \pi/4 -> \dfrac{\pi}{4}
  s = s.replace(/(?<![0-9a-zA-Z_\\])([-+])?\s*\\pi\s*\/\s*([0-9]+)/gi, (_m, sign, den) => {
    const sPrefix = sign ? `${sign} ` : '';
    return `${sPrefix}\\dfrac{\\pi}{${den}}`;
  });
  s = s.replace(/\\pi\s*([2-9]|12|16|32)\b/g, '\\dfrac{\\pi}{$1}');
  s = s.replace(/e\s*\\pi\s*\/\s*([0-9]+)/gi, 'e^{\\dfrac{\\pi}{$1}}');

  // 1b. Logarithm conversions: log_e 2 -> \log_e 2, 2log_e 2 -> 2 \log_e 2, ln x -> \ln x
  s = s.replace(/(\d+)[^\S\r\n]*(?=\\?log)/gi, '$1 ');
  s = s.replace(/(?<![a-zA-Z\\])log_e\s*(\d+)/gi, '\\log_e $1');
  s = s.replace(/(?<![a-zA-Z\\])log_e\s*([a-zA-Z])\b/gi, '\\log_e $1');
  s = s.replace(/(?<![a-zA-Z\\])log_e(?![a-zA-Z])/gi, '\\log_e');
  s = s.replace(/(?<![a-zA-Z\\])log_([0-9a-zA-Z]+)\s*(\d+)/gi, '\\log_{$1} $2');
  s = s.replace(/(?<![a-zA-Z\\])log_([0-9a-zA-Z]+)\s*([a-zA-Z])\b/gi, '\\log_{$1} $2');
  s = s.replace(/(?<![a-zA-Z\\])log_([0-9a-zA-Z]+)(?![a-zA-Z])/gi, '\\log_{$1}');
  s = s.replace(/(?<!\\)\b(log|ln)\b/g, '\\$1');

  // Exponents with nested parens e.g. (8)^(1/4) -> (8)^{1/4} and prime derivatives
  s = fixNestedExponents(s);
  s = normalizePrimes(s);

  // 2. Fractions: balanced parentheses and nested fractions (e.g. 3/(1+(8)^(1/4)), 1/(1-log_e 2))
  s = convertFractionsBalanced(s);
  s = s.replace(/(?<![a-zA-Z0-9_\\])(-?[0-9a-zA-Z_\\^{}]+)\s*\/\s*\(([^\(\)\n]+)\)/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\(([^\(\)\n]+)\)\s*\/\s*(-?[0-9a-zA-Z_\\^{}]+)(?![a-zA-Z0-9_\\])/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\(([^\(\)\n]+)\)\s*\/\s*\(([^\(\)\n]+)\)/g, '\\dfrac{$1}{$2}');
  s = s.replace(/(?<![a-zA-Z0-9_\/])([-+])\s*(\d+)\s*\/\s*(\d+)(?![a-zA-Z0-9_\/])/g, '$1 \\dfrac{$2}{$3}');
  s = s.replace(/(?<![a-zA-Z0-9_\/])(\d+)\s*\/\s*(\d+)(?![a-zA-Z0-9_\/])/g, '\\dfrac{$1}{$2}');

  // 3. Unicode math in options
  s = s.replace(/[\u200B-\u200F\u2060-\u2064\uFEFF\u00AD\u034F\u180E\uFFF9-\uFFFC]/g, '')
       .replace(/−/g, '-')
       .replace(/°/g, '^\\circ')
       .replace(/×/g, '\\times')
       .replace(/÷/g, '\\div')
       .replace(/π/g, '\\pi ')
       .replace(/α/g, '\\alpha ');

  // Radicals: 4√2 -> 4\sqrt{2}, √((...)) -> \sqrt{...}
  s = s.replace(/√\s*\(\s*\(\s*([^()]+)\s*\)\s*\)/g, '\\sqrt{$1}');
  s = s.replace(/\\?sqrt\s*\(\s*\(\s*([^()]+)\s*\)\s*\)/g, '\\sqrt{$1}');
  s = s.replace(/(\d+)\s*√\s*(\d+)/g, '$1\\sqrt{$2}');
  s = s.replace(/√\s*(\d+)/g, '\\sqrt{$1}');
  s = s.replace(/√\s*\(([^()]+)\)/g, '\\sqrt{$1}');
  s = s.replace(/√\s*\{([^{}]+)\}/g, '\\sqrt{$1}');
  s = s.replace(/√\s*([a-zA-Z]+)/g, '\\sqrt{$1}');
  s = s.replace(/√/g, '\\sqrt ');

  // 4. Exponentials and square roots (including nested fraction arguments)
  s = s.replace(/\\?exp\s*\(\s*\(\s*([^()]+)\s*\)\s*\/\s*\(\s*([^()]+)\s*\)\s*\)/gi, '\\exp\\left(\\dfrac{$1}{$2}\\right)');
  s = s.replace(/\\?exp\s*\(\s*\(\s*([^()]+)\s*\)\s*\/\s*([^()]+)\s*\)/gi, '\\exp\\left(\\dfrac{$1}{$2}\\right)');
  s = s.replace(/\\?exp\s*\(\s*([^/()]+)\s*\/\s*\(\s*([^()]+)\s*\)\s*\)/gi, '\\exp\\left(\\dfrac{$1}{$2}\\right)');
  s = s.replace(/\\?exp\s*\(\s*([^/()]+)\s*\/\s*([^/()]+)\s*\)/gi, '\\exp\\left(\\dfrac{$1}{$2}\\right)');
  s = s.replace(/\\?exp\s*\(\s*\(\s*([^()]+)\s*\)\s*\)/gi, '\\exp\\left($1\\right)');
  s = convertExpBraces(s);
  s = convertLiteralCurlyBraces(s);
  s = s.replace(/\\?exp\s*\(\s*([^()]+)\s*\)/g, '\\exp\\left($1\\right)');
  s = s.replace(/\\?sqrt\s*\(\s*([^()]+)\s*\)/g, '\\sqrt{$1}');
  s = s.replace(/\\frac\b/g, '\\dfrac');
  s = s.replace(/(\\(?:pi|alpha|beta|gamma|theta|lambda|mu|omega)(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\/\s*([a-zA-Z0-9]+)/g, '\\dfrac{$1}{$2}');

  // 5. English prose check vs mathematical expression
  const isEnglishProse = /\b(?:none|both|all|neither|either|cannot|can|not|be|determined|true|false|correct|incorrect|statement|above|below)\b/i.test(s);
  const isMathExpr = /[\^_\\]|\b\d+\b|[+\-*/=><≤≥≠]/.test(s);

  if (!isEnglishProse && isMathExpr) {
    return `$${s}$`;
  }
  return s;
}

/**
 * Splits normalized text into question statement, options (A-D), answer key, and solution.
 */
export function extractQuestionAndOptions(text: string): ExtractedQuestionData {
  let cleaned = text.trim();

  // Strip question number prefix: "Q1.", "1.", "(1)", "Question 1:"
  cleaned = cleaned.replace(/^\s*(?:Q(?:uestion)?\s*\.?\s*\d+\s*[:.)-]?|\(?\d+\)\s*[:.)-]?)\s*/i, '');

  let correctKey: 'A' | 'B' | 'C' | 'D' | undefined;
  let numericalAnswer: string | undefined;
  let solution: string | undefined;
  let shortcut: string | undefined;

  // Answer key detection: "Ans: B", "Answer: (C)", "Key: 4"
  const ansMatch = cleaned.match(/(?:Ans(?:wer)?|Key|Correct\s*Option)\s*[:=\-]?\s*\(?([A-Da-d0-9.\-]+)\)?/i);
  if (ansMatch) {
    const keyCandidate = ansMatch[1].toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(keyCandidate)) {
      correctKey = keyCandidate as 'A' | 'B' | 'C' | 'D';
    } else {
      numericalAnswer = ansMatch[1];
    }
    cleaned = cleaned.replace(ansMatch[0], '').trim();
  }

  // Solution detection
  const solMatch = cleaned.match(/(?:Solution|Soln|Explanation)\s*[:\-]\s*([\s\S]+?)(?=(?:Shortcut|DK\s*Sir\s*Shortcut|Trick|Ans|Key)\b|$)/i);
  if (solMatch) {
    solution = solMatch[1].trim();
    cleaned = cleaned.replace(solMatch[0], '').trim();
  }

  // Options detection: (A), (B), (C), (D) or (1), (2), (3), (4)
  const optionsMap: Record<string, string> = {};
  const optRegex = /(?:^|[\n\s])(?:\(([A-Da-d1-4])\)|([A-Da-d1-4])\.)\s+([\s\S]+?)(?=(?:[\n\s](?:\([A-Da-d1-4]\)|[A-Da-d1-4]\.)\s+)|$)/g;
  let optMatch: RegExpExecArray | null;
  const matches: { key: string; text: string; fullMatch: string }[] = [];

  while ((optMatch = optRegex.exec(cleaned)) !== null) {
    const rawKey = (optMatch[1] || optMatch[2]).toUpperCase();
    const key = rawKey === '1' ? 'A' : rawKey === '2' ? 'B' : rawKey === '3' ? 'C' : rawKey === '4' ? 'D' : rawKey;
    matches.push({
      key,
      text: optMatch[3].trim(),
      fullMatch: optMatch[0]
    });
  }

  let statement = cleaned;
  if (matches.length >= 2) {
    const candidateMap = { A: '', B: '', C: '', D: '' };
    for (const m of matches) {
      if (['A', 'B', 'C', 'D'].includes(m.key)) {
        candidateMap[m.key as 'A' | 'B' | 'C' | 'D'] = m.text;
      }
    }
    const firstOptIndex = cleaned.indexOf(matches[0].fullMatch);
    const candidateStmt = firstOptIndex > 0 ? cleaned.substring(0, firstOptIndex).trim() : '';

    if (candidateStmt && areValidExtractedOptions(candidateMap, candidateStmt)) {
      for (const m of matches) {
        optionsMap[m.key] = m.text;
      }
      statement = candidateStmt;
    }
  }

  const options: ParsedOption[] = [
    { key: 'A' as const, text: normalizeOptionMath(optionsMap.A || '') },
    { key: 'B' as const, text: normalizeOptionMath(optionsMap.B || '') },
    { key: 'C' as const, text: normalizeOptionMath(optionsMap.C || '') },
    { key: 'D' as const, text: normalizeOptionMath(optionsMap.D || '') }
  ].filter((o) => Boolean(o.text));

  return {
    statement: normalizeMathString(statement || cleaned),
    options,
    correctKey,
    numericalAnswer,
    solution,
    shortcut,
    hasOptions: options.length >= 2,
    rawText: text
  };
}

/**
 * Main Clipboard Paste Ingestion Pipeline
 */
export function handleSmartMathPaste(e: ClipboardEvent | { clipboardData?: DataTransfer | null }): ExtractedQuestionData {
  const cd = e.clipboardData;
  if (!cd) {
    return {
      statement: '',
      options: [],
      hasOptions: false,
      rawText: ''
    };
  }

  const html = cd.getData('text/html') || '';
  const plain = cd.getData('text/plain') || cd.getData('text') || '';

  let converted = '';
  if (html && /<(?:m:)?(?:oMath|oMathPara|math)\b|<!--\[if\s+gte\s+msEquation/i.test(html)) {
    converted = extractMathFromHtml(html);
  } else if (html) {
    converted = extractMathFromHtml(html);
  }

  let baseText = converted.trim() || plain;
  baseText = baseText.replace(/Word HTML dropped part of the question\.\s*The plain-text version was kept and needs review\.\s*/gi, '');
  return extractQuestionAndOptions(baseText);
}
