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

/**
 * Strips Word equation placeholders, invisible zero-width markers, and OCR artifacts.
 */
export function cleanWordMathArtifacts(text: string): string {
  if (!text) return '';
  let s = parseWordMatricesAndCases(text);
  // Function multiplication dot: f(x).f(y) -> f(x) \cdot f(y)
  s = s.replace(/\)\s*\.\s*([a-zA-Z]\s*\()/g, ') \\cdot $1');
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

  // 9. Square roots: √x or √(x+1)
  s = s.replace(/√\s*\(([^()]+)\)/g, '\\sqrt{$1}');
  s = s.replace(/√\s*([0-9a-zA-Z]+)/g, '\\sqrt{$1}');
  s = s.replace(/√/g, '\\sqrt');

  // 10. Derivatives: dy/dx or d^2y/dx^2 or d^n/dx^n or dy/(" " \, dx) or dy/(dx)
  s = s.replace(/\b(d(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?[a-zA-Z]?)\s*\/\s*\(\s*(?:["'][^"']*["'])?\s*(?:\\,)?\s*(d[a-zA-Z](?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\)/g, '\\frac{$1}{$2}');
  s = s.replace(/\b(d(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?[a-zA-Z]?)\s*\/\s*(d[a-zA-Z](?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\b/g, '\\frac{$1}{$2}');
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

  // 8. Multi-character or parenthesized exponents: 2^(2r+1) -> 2^{2r+1}, e^((2-4x)) -> e^{2-4x}
  s = s.replace(/([0-9a-zA-Z\)\]\}]|\\\w+)\s*\^\s*\(\s*\(([^()]+)\)\s*\)/g, '$1^{$2}');
  s = s.replace(/([0-9a-zA-Z\)\]\}]|\\\w+)\s*\^\s*\(\s*([^()]+)\s*\)/g, '$1^{$2}');
  s = s.replace(/([0-9a-zA-Z\)\]\}]|\\\w+)\s*\^\s*([a-zA-Z0-9])(?![a-zA-Z0-9{])/g, '$1^{$2}');

  // 9. Subscripts: S_k -> S_{k}, a_n -> a_{n}
  s = s.replace(/\b([A-Za-z])_([a-zA-Z0-9]+)\b/g, '$1_{$2}');

  // 10. Fractions:
  // e.g. 1/(5+2x-2x^2 )(1+e^{2-4x} ) -> \dfrac{1}{(5+2x-2x^2)(1+e^{2-4x})}
  s = s.replace(/1\s*\/\s*\(\s*([^()]+)\s*\)\s*\(\s*([^()]+)\s*\)/g, '\\dfrac{1}{($1)($2)}');
  s = s.replace(/1\s*\/\s*\\alpha\b/g, '\\dfrac{1}{\\alpha}');
  s = s.replace(/\\pi\s*\/\s*([0-9]+)/g, '\\dfrac{\\pi}{$1}');

  // Parens over parens: (A)/(B) -> \dfrac{A}{B}
  s = s.replace(/\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*\(((?:[^()\n]|\([^()\n]*\))+?)\)/g, '\\dfrac{$1}{$2}');
  // NUM / (DEN)
  s = s.replace(/([0-9a-zA-Z\\^{}_]+)\s*\/\s*\(\s*([0-9a-zA-Z\\^{}_+\-\s\[\]/]+?)\s*\)/g, '\\dfrac{$1}{$2}');
  // (NUM) / DEN
  s = s.replace(/\(\s*([0-9a-zA-Z\\^{}_+\-\s\[\]/]+?)\s*\)\s*\/\s*([\\a-zA-Z0-9_]+)/g, '\\dfrac{$1}{$2}');

  // Number over number: 1/2 -> \dfrac{1}{2}, -1/2 -> -\dfrac{1}{2}
  s = s.replace(/(?<![a-zA-Z0-9_\\])([-+]?\d+)\s*\/\s*(\d+)(?![a-zA-Z0-9_])/g, '\\dfrac{$1}{$2}');
  // Number over variable: 1/x -> \dfrac{1}{x}, 1/a -> \dfrac{1}{a}, 4/k -> \dfrac{4}{k}
  s = s.replace(/(?<![a-zA-Z0-9_\\])([-+]?\d+)\s*\/\s*([a-zA-Z](?:_[a-zA-Z0-9]+|_[0-9]+)?)(?![a-zA-Z0-9_])/g, '\\dfrac{$1}{$2}');
  // Variable over number: x/2 -> \dfrac{x}{2}
  s = s.replace(/(?<![a-zA-Z0-9_\\])([-+]?[a-zA-Z])\s*\/\s*(\d+)(?![a-zA-Z0-9_])/g, '\\dfrac{$1}{$2}');
  // Variable over variable: x/a -> \dfrac{x}{a}, x/b -> \dfrac{x}{b}, a/b -> \dfrac{a}{b}
  s = s.replace(/(?<![a-zA-Z0-9_\\])([-+]?[a-zA-Z])\s*\/\s*([a-zA-Z](?:_[a-zA-Z0-9]+|_[0-9]+)?)(?![a-zA-Z0-9_])/g, '\\dfrac{$1}{$2}');
  // Greek letter fractions: \pi/2 -> \dfrac{\pi}{2}, \pi/4 -> \dfrac{\pi}{4}
  s = s.replace(/(\\(?:pi|alpha|beta|gamma|theta|lambda|mu|omega))\s*\/\s*([a-zA-Z0-9]+)/g, '\\dfrac{$1}{$2}');
  s = s.replace(/(?<![a-zA-Z0-9_\\])([-+]?\d+)\s*\/\s*(\\(?:pi|alpha|beta|gamma|theta|lambda|mu|omega))/g, '\\dfrac{$1}{$2}');
  // Upgrade \frac to \dfrac for proper "upon" height
  s = s.replace(/\\frac\b/g, '\\dfrac');

  // 11. Tall parentheses \left( \dfrac{...}{...} \right) with arbitrary nested braces
  s = s.replace(/(\\(?:tan|cot|sin|cos|sec|csc)(?:\^\{[^}]+\})?|\\(?:log_e|ln|log))\s*\(\s*(\\(?:d?frac)\{(?:[^{}]|\{[^{}]*\})*\}\{(?:[^{}]|\{[^{}]*\})*\})\s*\)/g,
    '$1\\left($2\\right)');

  // 12. Spacing around \, dx, \, dy, \, dt, \, dz
  s = s.replace(/(?:\\,)?\s*\b(d[txyz])\b/gi, ' \\, $1');

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

  // Step 2d: Differential equations
  // e.g. \dfrac{dy}{dx} - \dfrac{3x^5 \tan^{-1}(x^3)}{(1+x^6)^{3/2}} y = 2x\exp\{ ... \}
  const proseDiffStops = '(?:pass|passes|passing|touch|touches|touching|intersect|intersects|has|have|having|where|when|such|if|then|and|with|at|for|is|are)\\b';
  const fullDiffEqRegex = new RegExp(
    `(?<![a-zA-Z0-9_\\$])((\\\\(?:d?frac)\\{d\\^?[0-9]?[a-zA-Z]?\\}\\{d[a-zA-Z]\\^?[0-9]?\\}[^=]+)=\\s*([^,;.\\n]+?))(?=\\s+${proseDiffStops}|\\s*[,;.]|$)`,
    'i'
  );
  s = s.replace(fullDiffEqRegex, (_, m) => protect(m));

  // e.g. 2x^{2} dy=(2xy+y^{2}) \, dx
  // e.g. x^{3} dy+xy \, dx=x^{2} dy+2y \, dx
  // e.g. y(x+1) \, dx-x^{2} dy=0
  // e.g. (x^2+1) \frac{dy}{dx} + 2xy = 4x^2
  const proseDiffStopsEq = '(?:pass|passes|passing|touch|touches|touching|intersect|intersects|has|have|having|where|when|such|if|then|and|with|at|for|is|are)\\b';
  s = s.replace(
    new RegExp(`(?<![a-zA-Z0-9_\\$])(-?[0-9a-zA-Z^{}_\\\\()\\[\\]+\\-*/\\s]*?\\b(?:dy|dx|dt|dz)\\b[0-9a-zA-Z^{}_\\\\()\\[\\]+\\-*/\\s]*?=\\s*[^,;.\\n]+?)(?=\\s*[,;.]|\\s+${proseDiffStopsEq}|$)`, 'gi'),
    (fullMatch, eq: string) => {
      let activeEq = eq.trim();
      let prefix = '';
      const introMatch = activeEq.match(/^(.*?\b(?:differential\s+equation|solution\s+curve|equation|curve|relation)\s*[:,]?\s*)(.+)$/i);
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

  // Step 2e: Function initial condition equations: e.g. y(2)=e, y(1)=e, y(0)=1, f(0)=0
  s = s.replace(
    /(?<![a-zA-Z0-9_\$])([a-zA-Z]\s*\([a-zA-Z0-9_+\-/*\\^\{\}\s.,]+\)\s*=\s*[-+*/a-zA-Z0-9_\\^{}()]+)(?=\s*[,;.]|\s+(?:and|if|then|where|when|for)\b|$)/g,
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

  // Step 2g: Coordinate tuples: e.g. point (1,2) or at (0, 0)
  s = s.replace(/(?<=\b(?:point|at|through)\s+)(\(\s*-?[0-9]+(?:\.[0-9]+)?\s*,\s*-?[0-9]+(?:\.[0-9]+)?\s*(?:,\s*-?[0-9]+(?:\.[0-9]+)?)?\s*\))(?![a-zA-Z0-9_\$])/gi,
    (_, m) => protect(m));

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

  // Step 5e: Variable or function query before "is equal to" / "equals"
  // e.g. "then f( \frac{1}{2} ) is equal to", "then y(4) is equal to", "Then a is equal to"
  s = s.replace(
    /(?<=\b(?:Then|and|if|where)\s+)([a-zA-Z](?:\s*\([a-zA-Z0-9_+\-/*\\^\{\}\s.,]+\))?)(?=\s+(?:is\s+equal\s+to|equals\b|exists\b))/gi,
    (_, m) => {
      let clean = m.trim();
      clean = clean.replace(/(\d+)\s*\/\s*(\d+)/g, '\\dfrac{$1}{$2}');
      if (clean.includes('\\frac') || clean.includes('\\dfrac')) {
        clean = clean.replace(/\(\s*(\\(?:d?frac)\{[^{}]+\}\{[^{}]+\})\s*\)/, '\\left($1\\right)');
      }
      return protect(clean);
    }
  );

  // Step 5f: Single or multi-term fraction expressions before "is equal to" / "equals" or punctuation
  // e.g. "then 1/a+1/b+4/k is equal to" -> "then $\dfrac{1}{a} + \dfrac{1}{b} + \dfrac{4}{k}$ is equal to"
  // e.g. "then 1/2 is equal to" -> "then $\dfrac{1}{2}$ is equal to"
  s = s.replace(
    /(?<=\b(?:then|find|calculate|where|when|if|is)\s+)([-+]?\s*(?:\\(?:d?frac)\{[^{}]+\}\{[^{}]+\}|\d+\s*\/\s*[a-zA-Z0-9]+)(?:\s*[+\-*/]\s*(?:\\(?:d?frac)\{[^{}]+\}\{[^{}]+\}|\d+\s*\/\s*[a-zA-Z0-9]+))*)(?=\s+(?:is\s+equal\s+to|equals\b|is\b)|\s*[,;.]|$)/gi,
    (_, m) => {
      let formatted = m.replace(/(?<![a-zA-Z0-9_\\])([-+]?\d+)\s*\/\s*(\d+)(?![a-zA-Z0-9_])/g, '\\dfrac{$1}{$2}')
                       .replace(/(?<![a-zA-Z0-9_\\])([-+]?\d+)\s*\/\s*([a-zA-Z0-9]+)(?![a-zA-Z0-9_])/g, '\\dfrac{$1}{$2}');
      return protect(formatted);
    }
  );

  // Step 5g: Composite functions: e.g. (gof)(-4)+(gof)(4) or (fog)(x) or (gof)
  s = s.replace(/(?<!\\)\(\s*([a-zA-Z])o([a-zA-Z])\s*\)\s*(\(\s*[-+0-9a-zA-Z_/*\\]+\s*\))/gi, (_m, f1, f2, arg) => {
    return `(${f1} \\circ ${f2})${arg}`;
  });

  s = s.replace(/(?<!\\)\(\s*([a-zA-Z])o([a-zA-Z])\s*\)/gi, (_m, f1, f2) => {
    return `(${f1} \\circ ${f2})`;
  });

  s = s.replace(/(?<=\b(?:then|find|calculate|is|and)\s+)(\([a-zA-Z]\s*\\circ\s*[a-zA-Z]\)\s*\([^()\n]+\)(?:\s*[+\-*/]\s*\([a-zA-Z]\s*\\circ\s*[a-zA-Z]\)\s*\([^()\n]+\))+)(?=\s+(?:is\s+equal\s+to|equals|is)\b|\s*[,;.]|$)/gi,
    (_m, expr) => protect(expr));

  s = s.replace(/(?<=\b(?:if|when|where|let)\s+)(\([a-zA-Z]\s*\\circ\s*[a-zA-Z]\))(?=\s+(?:is|are)\b)/gi,
    (_m, expr) => protect(expr));

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

  // Step 6d: Standalone expressions with powers or subscripts: e.g. 2x^{2}, x^{3}, y^{2}, e^{-x}, e^{x}
  s = s.replace(/(?<![a-zA-Z0-9_\$\\])([0-9]*[a-zA-Z]\^\{[^{}]+\}|[0-9]*[a-zA-Z]\^[0-9a-zA-Z]+|[0-9]*[a-zA-Z]_[0-9a-zA-Z]+)(?![a-zA-Z0-9_\{])/g,
    (_, m) => protect(m));

  // Step 6e: Standalone fractions (with optional leading sign): e.g. \dfrac{1}{2}, -\dfrac{1}{2}, \dfrac{1}{a}
  s = s.replace(/(?<![a-zA-Z0-9_\$])([-+]?\s*\\(?:d?frac)\{[^{}]+\}\{[^{}]+\})(?![a-zA-Z0-9_\$])/g,
    (_, m) => protect(m.trim()));

  // Step 7: Standalone math commands
  s = s.replace(/(?<!\$)([-+]?\s*(\\(?:tan|cot|sin|cos|sec|csc)\^\{[^}]+\}|\\(?:frac|dfrac|sqrt|log_e|ln|alpha|beta|gamma|theta|lambda|pi|sum|lim|int|mathbb\{[A-Z]\}|neq|leq|geq|in|to|subset|subseteq|cap|cup|pm|mp|times|div|cdot|hat\{[^{}]+\}|vec\{[^{}]+\}|Delta|phi))\S*(?:\s*[=+*/\-]\s*\S+)*)(?!\$)/g,
    (_, m) => protect(m));

  // Step 8: Restore protected blocks
  for (let idx = 0; idx < protectedBlocks.length; idx++) {
    s = s.replace(`___PROT_${idx}___`, protectedBlocks[idx]);
  }

  // Clean double dollars and redundant spaces around punctuation
  s = s.replace(/\$\s*\$/g, ' ');
  s = s.replace(/\$\$+/g, '$');
  s = s.replace(/\s+,/g, ',');
  s = s.replace(/\s+\./g, '.');
  s = s.replace(/\s+/g, ' ').trim();

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
  }

  // Check 3: Multiple "Ans:" or "Answer:" lines indicate multiple questions
  const ansMatches = [...text.matchAll(/(?:^|\n)\s*(?:Ans(?:wer)?|Correct\s*Option|Key)\s*[:=\-]?\s*[A-D1-4]/gi)];
  if (ansMatches.length > 1) {
    const multiQRegex = /(?:\n\s*\n|\n)(?=\d+[\.\:\)]\s+[A-Z])/gi;
    const parts = text.split(multiQRegex).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) return parts;
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
  text = convertWordEquationToLatex(text);

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

  // 4. Extract Exam / Shift Tag (e.g. JEE Main 2024 (Online) 6th April Evening Shift)
  let examTag = '';
  const examTagMatch = text.match(/(?:\[|\b|\s{2,})(JEE\s*(?:Main|Advanced)?\s*(?:-\s*\d{4}|\d{4}|\([^\)]+\)|Online|Offline)[^\n\r]*)/i) ||
                       text.match(/\b(JEE\s*(?:Main|Advanced)?[^\n\r]*?(?:Shift|Morning|Evening|Paper\s*\d|Session\s*\d|Jan(?:uary)?|Apr(?:il)?|June|July|Feb(?:ruary)?)[^\n\r]*)/i) ||
                       text.match(/\b(BITSAT\s*\d{4}[^\n\r]*)/i);

  if (examTagMatch) {
    examTag = examTagMatch[1].trim().replace(/^\[|\]$/g, '');
    text = text.replace(examTagMatch[0], '').trim();
  }

  // 5. Extract Options (Supports A-D, 1-4, Bare Labels, Single-Space Delimiters, and Blank/Unlabeled Newlines)
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
