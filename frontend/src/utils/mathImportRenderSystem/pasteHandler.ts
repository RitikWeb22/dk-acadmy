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
import { parseWordMatricesAndCases } from '../wordPasteParser';

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
    if (typeof DOMParser !== 'undefined') {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(
          `<root xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${innerOmml}</root>`,
          'text/xml'
        );
        const oMath =
          (doc.getElementsByTagNameNS && doc.getElementsByTagNameNS('*', 'oMath')[0]) ||
          doc.getElementsByTagName('m:oMath')[0] ||
          doc.getElementsByTagName('oMath')[0] ||
          (doc.querySelector && doc.querySelector('oMath, m\\:oMath'));
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

  // Clean leading bullet, number, or dot: ". If a curve..." -> "If a curve..."
  s = s.replace(/Word HTML dropped part of the question\.\s*The plain-text version was kept and needs review\.\s*/gi, '');
  s = s.replace(/^[\s\u2022\u25E6\u25AA\u25CF.\-—]+\s*/g, '');
  s = s.replace(/^Q(?:uestion)?\s*\.?\s*\d+\s*[:.)\-—]\s*/gi, '');

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

  // Differential residues: dy/(" "\, dx) -> \dfrac{dy}{dx}, d^n/dx^n -> \dfrac{d^n}{dx^n}
  s = s.replace(/\b(d(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?[a-zA-Z]?)\s*\/\s*\(\s*(?:["'][^"']*["'])?\s*(?:\\,)?\s*(d[a-zA-Z](?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\)/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\b(d(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?[a-zA-Z]?)\s*\/\s*(d[a-zA-Z](?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\b/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\(\s*["'][^"']*["']\s*(?:\\,)?\s*(d[a-zA-Z])\s*\)/g, '\\,$1');

  // Word linear fractions with nested parens and exponents: (3x^{5} \tan^{-1}(x^3))/(1+x^{6})^{\frac{3}{2}}
  s = s.replace(
    /\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*\(((?:[^()\n]|\([^()\n]*\))+?)\)\^(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|[A-Za-z0-9_+\-]+)/g,
    (_, num, den, exp) => {
      const expStr = exp.startsWith('{') ? exp : `{${exp}}`;
      return `\\dfrac{${num}}{(${den})^${expStr}}`;
    }
  );
  s = s.replace(
    /\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*\(((?:[^()\n]|\([^()\n]*\))+?)\)/g,
    '\\dfrac{$1}{$2}'
  );
  s = s.replace(/(?<![a-zA-Z0-9_\\])\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*([A-Za-z0-9_\\^{}]+)/g, '\\dfrac{$1}{$2}');
  s = s.replace(/(?<![a-zA-Z0-9_\\])([A-Za-z0-9_\\^{}]+)\s*\/\s*\(((?:[^()\n]|\([^()\n]*\))+?)\)/g, '\\dfrac{$1}{$2}');
  s = s.replace(/(?<=[(,=+\-*\/]\s*)(\d+)\s*\/\s*(\d+)(?=\s*[),=+;\-*\/])/g, '\\dfrac{$1}{$2}');

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

  // Trig
  s = s.replace(/\\?(sin|cos|tan|cot|sec|csc)\s*\^\s*\(\s*-?\s*1\s*\)/gi, '\\$1^{-1}');
  s = s.replace(/(?<!\\)\b(sin|cos|tan|cot|sec|csc)\b(?!\^\{-?1\})/gi, '\\$1');

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
  s = s.replace(/\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]+?\$|\\\([\s\S]*?\\\)/g, (m) => {
    const key = `\u27E6MATH_${protectedBlocks.length}\u27E7`;
    protectedBlocks.push(m);
    return key;
  });

  const protect = (mathContent: string) => {
    let clean = mathContent.trim();
    if (!clean) return '';
    let trail = '';
    const m = clean.match(/([,;.]+)$/);
    if (m) {
      trail = m[1];
      clean = clean.slice(0, -trail.length).trim();
    }
    const key = `\u27E6MATH_${protectedBlocks.length}\u27E7`;
    protectedBlocks.push(`$${clean}$`);
    return ` ${key}${trail} `;
  };

  s = s.replace(/\\,\s*/g, ' ');

  const proseLead = '(?:Let|If|Suppose|Given|Define|Find|Evaluate|Calculate|Show|Consider)\\b\\s*[:,]?\\s*';
  const proseStops = '(?:pass|passes|passing|touch|touches|touching|intersect|intersects|has|have|having|where|when|such|if|then|and|with|at|for|is|are|represented|representing|given)\\b';

  // 1. Environments (with optional LHS: g(x) = \begin{cases} ... \end{cases})
  s = s.replace(
    new RegExp(`(${proseLead})?((?:[a-zA-Z|][a-zA-Z0-9_\\s'|()]*=\\s*)?\\\\begin\\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|aligned)\\}[\\s\\S]+?\\\\end\\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|aligned)\\})`, 'g'),
    (_, lead, m) => (lead ? lead + ' ' : '') + protect(m)
  );

  // 2. Differential equations like \dfrac{dy}{dx} - ... = ... before prose stop
  s = s.replace(
    new RegExp(`(${proseLead})?((?:\\\\(?:d?frac)\\{d\\^?[0-9]?[a-zA-Z]?\\}\\{d[a-zA-Z]\\^?[0-9]?\\}[^=]+)=\\s*([^,;.\\n]+?))(?=\\s+${proseStops}|\\s*[,;.]|$)`, 'gi'),
    (_, lead, eq) => {
      let activeLead = lead || '';
      let activeEq = eq;
      const introMatch = activeEq.match(/^(.*?\b(?:differential\s+equation|solution\s+curve|equation|curve|relation)\s*[:,]?\s*)(.+)$/i);
      if (introMatch) {
        activeLead += introMatch[1];
        activeEq = introMatch[2];
      }
      return (activeLead ? activeLead + ' ' : '') + protect(activeEq);
    }
  );

  // 3. Symmetric 3D Line Equations: \frac{x-x1}{a} = \frac{y-y1}{b} = \frac{z-z1}{c}
  s = s.replace(
    /(?<![$\w])((?:\\(?:d?frac)\{[^{}]+\}\{[^{}]+\}|[a-zA-Z0-9_+-]+)\s*=\s*(?:\\(?:d?frac)\{[^{}]+\}\{[^{}]+\}|[a-zA-Z0-9_+-]+)\s*=\s*(?:\\(?:d?frac)\{[^{}]+\}\{[^{}]+\}|[a-zA-Z0-9_+-]+))(?=\s*[,;.]|\s+${proseStops}|$)/gi,
    (_, m) => protect(m)
  );

  // 4. Integrals: \int ... dx
  s = s.replace(
    /(?<![$\w])(\\(?:int|iint|iiint|oint)(?:_[^{}\s]+|_\{\s*[^{}]*(?:\{[^{}]*\}[^{}]*)*\s*\}|\^[^{}\s]+|\^\{\s*[^{}]*(?:\{[^{}]*\}[^{}]*)*\s*\})*\s*[\s\S]+?(?:\\,?\s*d[a-zA-Z]|dx|dy|dt|dz|du|dv|d\theta|dr)(?![a-zA-Z]))(?=(?:\s*=\s*[^,;.\n]+)?(?:\s*[,;.]|\s+${proseStops}|$))/gi,
    (fullMatch) => protect(fullMatch)
  );

  // 5. Limits, Summations, Products: \lim_{...} ... (stop strictly before prose)
  s = s.replace(
    new RegExp(`(?<![$\\w])(\\\\(?:lim|sum|prod)(?:_[^{}\\s]+|_\\{\\s*[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\s*\\}|\\^[^{}\\s]+|\\^\\{\\s*[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\s*\\})*\\s*(?:[a-zA-Z0-9_^{}()'|\\\\+\\-*/\\[\\]\\s.]*?[a-zA-Z0-9_^{}()'|\\\\+\\-*/\\]]))(?=\\s+${proseStops}|\\s*[,;.]|$)`, 'gi'),
    (_, m) => protect(m)
  );

  // 6. Differential equations with explicit differentials: 2x^2 dy = (2xy+y^2) dx OR y(x+1) dx - x^2 dy = 0
  s = s.replace(
    new RegExp(`(${proseLead})?([a-zA-Z0-9_^{}()'|\\\\+\\-*/\\s.]*?\\b(?:d\\^?[0-9]?[a-zA-Z]?\\/d[a-zA-Z]\\^?[0-9]?|\\\\(?:d?frac)\\{d\\^?[0-9]?[a-zA-Z]?\\}\\{d[a-zA-Z]\\^?[0-9]?\\}|dy|dx|dt|dz)\\b[a-zA-Z0-9_^{}()'|\\\\+\\-*/\\s.]*?=[a-zA-Z0-9_^{}()'|\\\\+\\-*/\\s.]+?)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'gi'),
    (fullMatch, lead, eq) => {
      let activeLead = lead || '';
      let activeEq = eq;

      const introMatch = activeEq.match(/^(.*?\b(?:differential\s+equation|solution\s+curve|equation|curve|relation)\s*[:,]?\s*)(.+)$/i);
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
    /(?<![$\w])(\\vec\{[^{}]+\}\s*=\s*[^,;.\n]+?)(?=\s*[,;.]|\s+${proseStops}|$)/gi,
    (_, m) => protect(m)
  );

  // 8. General equations with LaTeX operators / functions: A^{-1} = ..., E = E^\circ - ...
  s = s.replace(
    new RegExp(`(${proseLead})?([a-zA-Z0-9_^{}()'|\\\\+\\-*/\\s.]+=([a-zA-Z0-9_^{}()'|\\\\+\\-*/\\s.]|\\\\(?:d?frac)\\{[^{}]+\\}\\{[^{}]+\\})+)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'g'),
    (fullMatch, lead, eq) => {
      let activeLead = lead || '';
      let activeEq = eq;

      const introMatch = activeEq.match(/^(.*?\b(?:differential\s+equation|solution\s+curve|equation|curve|relation)\s*[:,]?\s*)(.+)$/i);
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

  // 12. Single function terms / derivatives: f'(0), y(4), f( \dfrac{1}{2} ), f( 1/2 )
  s = s.replace(
    /(?<![$\w])([a-zA-Z]'*\s*\(\s*(?:\\(?:d?frac)\{[^{}]+\}\{[^{}]+\}|\d+\s*\/\s*\d+|[0-9a-zA-Z_+\-/*]+)\s*\))(?![$\w])/g,
    (_, m) => {
      const fracNorm = m.replace(/\(\s*(\d+)\s*\/\s*(\d+)\s*\)/, '\\left(\\dfrac{$1}{$2}\\right)')
                        .replace(/\(\s*(\\d?frac\{[^{}]+\}\{[^{}]+\})\s*\)/, '\\left($1\\right)');
      return protect(fracNorm);
    }
  );

  // 13. Inequalities: x > 1, \alpha, \beta > 0, \det A \neq 0
  s = s.replace(
    /(?<![$\w])((?:\\[a-zA-Z]+|[a-zA-Z0-9_^{}()]+)(?:\s*,\s*(?:\\[a-zA-Z]+|[a-zA-Z0-9_^{}()]+))*\s*(?:[><=≤≥≠]|\\(?:neq|le|ge))\s*[-+]?[0-9a-zA-Z_\\]+)(?=\s*[,;.]|\s+${proseStops}|$)/g,
    (fullMatch, eq) => {
      const nonLatex = eq.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:if|then|and|where|when|for|let)\b/i.test(nonLatex)) return fullMatch;
      return protect(eq);
    }
  );

  // 13b. Multi-term fraction expressions before "is equal to" / "equals" or punctuation
  // e.g. "then 1/a+1/b+4/k is equal to" -> "then $\dfrac{1}{a} + \dfrac{1}{b} + \dfrac{4}{k}$ is equal to"
  s = s.replace(
    /(?<=\b(?:then|and|if|where)\s+)(\d+\/[a-zA-Z0-9]+(?:\s*[+\-*/]\s*\d+\/[a-zA-Z0-9]+)+)(?=\s+(?:is\s+equal\s+to|equals\b|is\b)|\s*[,;.]|$)/gi,
    (_, m) => {
      const formatted = m.replace(/(\d+)\/([a-zA-Z0-9]+)/g, '\\dfrac{$1}{$2}');
      return protect(formatted);
    }
  );

  // 14. Point coordinates: point (1,2) or (1, 2, 3)
  s = s.replace(/(?<=\b(?:point|at|through|from)\s+)(\(\s*-?[0-9]+(?:\.[0-9]+)?\s*,\s*-?[0-9]+(?:\.[0-9]+)?\s*(?:,\s*-?[0-9]+(?:\.[0-9]+)?)?\s*\))(?![$\w])/gi, (_, m) => protect(m));

  // 15. Remaining standalone LaTeX commands with balanced braces
  s = s.replace(
    /(?<![$\w])(\\(?:d?frac|sqrt|vec|hat|bar|dot|ddot|tilde|mathbf|mathrm|text|operatorname)\{(?:[^{}]|\{[^{}]*\})*\}(?:\{(?:[^{}]|\{[^{}]*\})*\})*(?:[A-Za-z0-9_^{}\\()\[\]+\-*/\s.]*[A-Za-z0-9_^{}\\()\[\]+\-*/])?|\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|infty|times|div|pm|mp|le|ge|ne|approx|sim|to|partial|nabla|degree|circ)(?![a-zA-Z]))(?=\s*[,;.]|\s+${proseStops}|$|\s+[a-zA-Z]{3,})/gi,
    (fullMatch, cmd) => protect(cmd)
  );

  // Restore protected blocks
  for (let idx = 0; idx < protectedBlocks.length; idx++) {
    s = s.replace(`\u27E6MATH_${idx}\u27E7`, protectedBlocks[idx]);
  }

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

  if (
    (s.startsWith('$') && s.endsWith('$') && !s.slice(1, -1).includes('$')) ||
    (s.startsWith('\\(') && s.endsWith('\\)')) ||
    (s.startsWith('\\[') && s.endsWith('\\]'))
  ) {
    // Already delimited: clean up \frac -> \dfrac and return
    return s.replace(/\\frac\b/g, '\\dfrac');
  }

  // 1. Logarithm conversions: log_e 2 -> \log_e 2, ln x -> \ln x
  s = s.replace(/\blog_([a-zA-Z0-9]+|\{[^{}]+\})/g, '\\log_{$1}');
  s = s.replace(/(?<!\\)\b(log|ln)\b/g, '\\$1');

  // 2. Fractions: 1/(1-log_e 2) -> \dfrac{1}{1-\log_e 2}
  s = s.replace(/(?<![a-zA-Z0-9_\\])(-?[0-9a-zA-Z_\\^{}]+)\s*\/\s*\(([^\(\)\n]+)\)/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\(([^\(\)\n]+)\)\s*\/\s*(-?[0-9a-zA-Z_\\^{}]+)(?![a-zA-Z0-9_\\])/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\(([^\(\)\n]+)\)\s*\/\s*\(([^\(\)\n]+)\)/g, '\\dfrac{$1}{$2}');
  s = s.replace(/(?<![a-zA-Z0-9_\/])(-?\d+)\s*\/\s*(\d+)(?![a-zA-Z0-9_\/])/g, '\\dfrac{$1}{$2}');

  // 3. Unicode math in options
  s = s.replace(/−/g, '-').replace(/°/g, '^\\circ').replace(/×/g, '\\times').replace(/÷/g, '\\div').replace(/√/g, '\\sqrt');

  // 4. Exponentials and square roots
  s = s.replace(/\\?exp\s*\(\s*([^()]+)\s*\)/g, '\\exp\\left($1\\right)');
  s = s.replace(/\\?sqrt\s*\(\s*([^()]+)\s*\)/g, '\\sqrt{$1}');
  s = s.replace(/\\frac\b/g, '\\dfrac');

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
