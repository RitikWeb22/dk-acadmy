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

import { ommlNodeToLatex, mathMLNodeToLatex } from '../universalMathEngine';

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
  // and discard fallback <![if !msEquation]>...<![endif]>
  const ommlCommentRegex = /<!--\[if\s+gte\s+(?:msEquation|mso)\s+\d+\]>([\s\S]*?)<!\[endif\]-->(\s*<!\[if\s+!msEquation\]>([\s\S]*?)<!\[endif\]>)?/gi;
  s = s.replace(ommlCommentRegex, (_match, innerOmml: string) => {
    if (typeof DOMParser !== 'undefined') {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<root>${innerOmml}</root>`, 'text/xml');
        const oMath = doc.querySelector('oMath, m\\:oMath');
        if (oMath) {
          const latex = ommlNodeToLatex(oMath);
          if (latex) return ` $${latex}$ `;
        }
      } catch {}
    }
    return ' ';
  });

  // 2. Convert Web KaTeX annotations: <annotation encoding="application/x-tex">...
  s = s.replace(/<annotation[^>]*encoding=["']application\/x-tex["'][^>]*>([\s\S]*?)<\/annotation>/gi, (_m, tex: string) => {
    return ` $${tex.trim()}$ `;
  });

  // 3. Convert MathML: <math>...</math>
  s = s.replace(/<math[\s\S]*?<\/math>/gi, (match) => {
    if (typeof DOMParser !== 'undefined') {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(match, 'text/xml');
        const mathEl = doc.querySelector('math');
        if (mathEl) {
          const latex = mathMLNodeToLatex(mathEl);
          if (latex) return ` $${latex}$ `;
        }
      } catch {}
    }
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
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/p>/gi, '\n');
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
  let s = raw;

  // Clean zero-width chars and smart quotes
  s = s.replace(/\\\\([a-zA-Z]+)/g, '\\$1');
  s = s.replace(/\u00A0/g, ' ');
  s = s.replace(/[\u200B-\u200D\uFEFF\u2060\u2061\u2062\u2063\u2064]/g, '');
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

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

  // Differential residues
  s = s.replace(/\b(d\^?[0-9]?[a-zA-Z]?)\s*\/\s*\(\s*(?:["'][^"']*["'])?\s*(?:\\,)?\s*(d[a-zA-Z]\^?[0-9]?)\s*\)/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\b(d\^?[0-9]?[a-zA-Z]?)\s*\/\s*(d[a-zA-Z]\^?[0-9]?)\b/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\(\s*["'][^"']*["']\s*(?:\\,)?\s*(d[a-zA-Z])\s*\)/g, '\\,$1');

  // Exponential
  s = s.replace(/(\\?exp\s*\{[\s\S]*?)(?=\s+(?:pass|through|is|equal|where|then|and|origin)\b|$)/gi, (m) => {
    const opens = (m.match(/\{/g) || []).length;
    const closes = (m.match(/\}/g) || []).length;
    if (opens > closes) {
      return m + '}'.repeat(opens - closes);
    }
    return m;
  });
  s = s.replace(/\\?exp\s*\{([^{}]*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}[^{}]*)*)\}/g, '\\exp\\left\\{$1\\right\\}');
  s = s.replace(/\\?exp\s*\(\s*([^()]+)\s*\)/g, '\\exp\\left($1\\right)');

  // Trig
  s = s.replace(/\\?(sin|cos|tan|cot|sec|csc)\s*\^\s*\(\s*-?\s*1\s*\)/gi, '\\$1^{-1}');
  s = s.replace(/(?<!\\)\b(sin|cos|tan|cot|sec|csc)\b(?!\^\{-?1\})/gi, '\\$1');

  // Aligned
  s = s.replace(/\\begin\{align\*?\}/g, '\\begin{aligned}');
  s = s.replace(/\\end\{align\*?\}/g, '\\end{aligned}');

  // Parenthesized linear fractions
  s = s.replace(/\(([A-Za-z0-9_+\-*\s\\^{}]+?)\)\s*\/\s*\(([A-Za-z0-9_+\-*\s\\^{}]+?)\)\^(\{?[^{}\s]+\}?|\\frac\{[^{}]+\}\{[^{}]+\})/g, '\\dfrac{$1}{($2)^{$3}}');
  s = s.replace(/\(([A-Za-z0-9_+\-*\s\\^{}]+?)\)\s*\/\s*\(([A-Za-z0-9_+\-*\s\\^{}]+?)\)/g, '\\dfrac{$1}{$2}');
  s = s.replace(/(?<=[(,=+\-*\/]\s*)(\d+)\s*\/\s*(\d+)(?=\s*[),=+;\-*\/])/g, '\\dfrac{$1}{$2}');

  // Redundant sqrt parens
  s = s.replace(/\\sqrt\(\s*([^()]+)\s*\)/g, '\\sqrt{$1}');
  s = s.replace(/\\sqrt\{\s*\(([^()]+)\)\s*\}/g, '\\sqrt{$1}');

  // Wrap bare LaTeX in $...$
  const protectedBlocks: string[] = [];
  s = s.replace(/\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]+?\$|\\\([\s\S]*?\\\)/g, (m) => {
    const key = `___PROT_BLOCK_${protectedBlocks.length}___`;
    protectedBlocks.push(m);
    return key;
  });

  const protect = (mathContent: string) => {
    const clean = mathContent.trim();
    if (!clean) return '';
    const key = `___PROT_BLOCK_${protectedBlocks.length}___`;
    protectedBlocks.push(`$${clean}$`);
    return ` ${key} `;
  };

  s = s.replace(/\\,\s*/g, ' ');

  // Environments
  s = s.replace(
    /(?<!\$)(f\s*\([a-zA-Z0-9]+\)\s*=\s*\\begin\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|aligned)\}[\s\S]+?\\end\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|aligned)\}|\\begin\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|aligned)\}[\s\S]+?\\end\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|aligned)\})(?!\$)/g,
    (_, m) => protect(m)
  );

  // Differential equations
  const proseStops = '(?:pass|passes|passing|touch|touches|touching|intersect|intersects|has|have|having|where|when|such|if|then|and|with|at|for|is|are)\\b';
  s = s.replace(
    new RegExp(`(?<![a-zA-Z0-9_\\$])((\\\\(?:d?frac)\\{d\\^?[0-9]?[a-zA-Z]?\\}\\{d[a-zA-Z]\\^?[0-9]?\\}[^=]+)=\\s*([^,;.\\n]+?))(?=\\s+${proseStops}|\\s*[,;.]|$)`, 'gi'),
    (_, m) => protect(m)
  );

  s = s.replace(DIFF_EQ, (fullMatch, eq) => {
    if (/\b(?:dy|dx|dt|dz)\b/.test(eq)) {
      return protect(eq);
    }
    return fullMatch;
  });

  // Conditions & functions
  s = s.replace(
    /(?<![$\w])([a-zA-Z]\s*\([a-zA-Z0-9_+\-/*\\^\{\}\s.,]+\)\s*=\s*[-+*/a-zA-Z0-9_\\^{}()]+)(?=\s*[,;.]|\s+(?:and|if|then|where|when|for)\b|$)/g,
    (fullMatch, eq) => {
      const nonLatex = eq.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:let|and|the|is|are|in|on|at|of|to|for|with|then|if|which|where)\b/i.test(nonLatex)) {
        return fullMatch;
      }
      return protect(eq);
    }
  );

  s = s.replace(/(?<![$\w])([a-zA-Z]\s*=\s*[a-zA-Z]\s*\([a-zA-Z0-9_+\-/*\s\\]+\))(?![$\w])/g, (_, m) => protect(m));
  s = s.replace(/(?<=\b(?:point|at|through)\s+)(\(\s*-?[0-9]+(?:\.[0-9]+)?\s*,\s*-?[0-9]+(?:\.[0-9]+)?\s*(?:,\s*-?[0-9]+(?:\.[0-9]+)?)?\s*\))(?![$\w])/gi, (_, m) => protect(m));
  s = s.replace(/(?<![$\w])([a-zA-Z]\s*\(\s*(?:\\dfrac\{[^{}]+\}\{[^{}]+\}|[0-9]+(?:\/[0-9]+)?)\s*\))(?![$\w])/g, (_, m) => protect(m));
  s = s.replace(/(?<![$\w])([a-zA-Z\\]+(?:\s*,\s*[a-zA-Z\\]+)*\s*[><=≤≥≠]\s*[-+]?[0-9a-zA-Z\\]+)(?=\s*[,;.]|\s+(?:and|or|then|where|when|for)\b|$)/g, (_, m) => protect(m));

  // Limits
  s = s.replace(
    /(?<![$\w])(\\(?:lim|sum|prod)(?:_\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|_[0-9a-zA-Z]+|\^\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\^[0-9a-zA-Z]+)*\s*(?:[a-zA-Z]\s*\([a-zA-Z0-9_+\-/*\s\\]+\)|\\(?:d?frac)\{[^{}]+\}\{[^{}]+\}|[a-zA-Z0-9_^{}\\()\[\]+\-*/]+))(?=\s+(?:is|equal|exists|where|then|and|for|\.|\,)|$)/gi,
    (_, m) => protect(m)
  );

  // Standalone LaTeX
  s = s.replace(
    /(?<!\$)((\\(?:d?frac|sqrt|vec|hat|alpha|beta|gamma|delta|theta|lambda|pi|sigma|phi|omega|to|leq|geq|ne|pm|mp|times|div|cdot|mathbb\{[A-Z]\}|mathrm\{[A-Za-z0-9]+\}))[A-Za-z0-9_^{}\\()\[\]+\-*/]*(?:\s*=\s*[A-Za-z0-9_^{}\\()\[\]+\-*/]+)?)(?!\$)/g,
    (_, m) => protect(m)
  );

  // Restore protected blocks
  for (let idx = 0; idx < protectedBlocks.length; idx++) {
    s = s.replace(`___PROT_BLOCK_${idx}___`, protectedBlocks[idx]);
  }

  s = s.replace(/\$\s*\$/g, ' ');
  s = s.replace(/\$\$+/g, '$');
  s = s.replace(/\s+,/g, ',');
  s = s.replace(/\s+\./g, '.');
  s = s.replace(/\s+/g, ' ').trim();

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
    for (const m of matches) {
      optionsMap[m.key] = m.text;
    }
    // Statement is text preceding the first option
    const firstOptIndex = cleaned.indexOf(matches[0].fullMatch);
    if (firstOptIndex > 0) {
      statement = cleaned.substring(0, firstOptIndex).trim();
    }
  }

  const options: ParsedOption[] = [
    { key: 'A' as const, text: optionsMap.A || '' },
    { key: 'B' as const, text: optionsMap.B || '' },
    { key: 'C' as const, text: optionsMap.C || '' },
    { key: 'D' as const, text: optionsMap.D || '' }
  ].filter((o) => Boolean(o.text));

  return {
    statement: statement || cleaned,
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

  const baseText = converted.trim() || plain;
  const normalized = normalizeMathString(baseText);
  return extractQuestionAndOptions(normalized);
}
