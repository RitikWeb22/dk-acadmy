/**
 * Math Import & Render System - Core Mathematical Normalizer (Step 4 & Storage Rule)
 *
 * Implements:
 * 1. Unicode -> LaTeX conversion
 * 2. Word junk stripping (nbsp, zero-width spaces, smart quotes, MSO styles, paragraph artifacts)
 * 3. Bare LaTeX wrapping into canonical $...$ / $$...$$
 * 4. Linear equation residues: a/b -> \dfrac{a}{b}, dy/dx -> \dfrac{dy}{dx}, exp{...} -> \exp\left\{...\right\}
 * 5. Environment normalization: \begin{align} / \begin{align*} -> \begin{aligned}
 * 6. Storage canonicalization: unescape double backslashes, strip rendered HTML
 */

export const GREEK_UNICODE_MAP: Record<string, string> = {
  'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta',
  'ε': '\\epsilon', 'ζ': '\\zeta', 'η': '\\eta', 'θ': '\\theta',
  'ι': '\\iota', 'κ': '\\kappa', 'λ': '\\lambda', 'μ': '\\mu',
  'ν': '\\nu', 'ξ': '\\xi', 'π': '\\pi', 'ρ': '\\rho',
  'σ': '\\sigma', 'τ': '\\tau', 'υ': '\\upsilon', 'φ': '\\phi',
  'χ': '\\chi', 'ψ': '\\psi', 'ω': '\\omega',
  'Γ': '\\Gamma', 'Δ': '\\Delta', 'Θ': '\\Theta', 'Λ': '\\Lambda',
  'Ξ': '\\Xi', 'Π': '\\Pi', 'Σ': '\\Sigma', 'Υ': '\\Upsilon',
  'Φ': '\\Phi', 'Ψ': '\\Psi', 'Ω': '\\Omega'
};

export const OPERATOR_UNICODE_MAP: Record<string, string> = {
  '±': '\\pm', '∓': '\\mp', '×': '\\times', '÷': '\\div',
  '−': '-', '°': '^\\circ',
  '⋅': '\\cdot', '∙': '\\cdot', '∘': '\\circ', '∗': '*',
  '√': '\\sqrt', '∛': '\\sqrt[3]', '∜': '\\sqrt[4]',
  '∝': '\\propto', '∞': '\\infty', '∠': '\\angle',
  '∫': '\\int', '∬': '\\iint', '∭': '\\iiint', '∮': '\\oint',
  '∑': '\\sum', '∏': '\\prod',
  '≤': '\\le', '≥': '\\ge', '≠': '\\ne', '≈': '\\approx',
  '≡': '\\equiv', '∼': '\\sim', '≃': '\\simeq',
  '⊂': '\\subset', '⊃': '\\supset', '⊆': '\\subseteq', '⊇': '\\supseteq',
  '∈': '\\in', '∉': '\\notin', '∋': '\\owns',
  '∩': '\\cap', '∪': '\\cup', '∅': '\\emptyset',
  '→': '\\to', '⇒': '\\implies', '⇔': '\\iff', '↔': '\\leftrightarrow',
  '∀': '\\forall', '∃': '\\exists', '∇': '\\nabla', '∂': '\\partial'
};

/**
 * Strips all rendered HTML tags and unescapes HTML entities.
 * Storage Rule: Never store rendered HTML in the database.
 */
export function stripRenderedHtml(text: string): string {
  if (!text) return '';
  return text
    // Remove scripts and styles completely
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remove KaTeX rendered HTML containers if accidentally copied
    .replace(/<span class="katex-mathml">[\s\S]*?<\/span>/gi, '')
    .replace(/<span class="katex-html"[^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<span class="katex"[^>]*>[\s\S]*?<\/span>/gi, '')
    // Convert <sup> and <sub> tags to LaTeX powers/indices before dropping tags
    .replace(/<sup>(.*?)<\/sup>/gi, '^{$1}')
    .replace(/<sub>(.*?)<\/sub>/gi, '_{$1}')
    // Drop remaining HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}

/**
 * Normalizes double-escaped backslashes (\frac vs \\frac).
 * Storage Rule: Never store double-escaped backslashes.
 */
export function normalizeBackslashes(text: string): string {
  if (!text) return '';
  // Avoid replacing legitimate matrix/cases linebreaks (\\ followed by whitespace or line end)
  // Replace \\command with \command
  return text.replace(/\\\\([a-zA-Z]+)/g, '\\$1');
}

/**
 * Strips Word junk: non-breaking spaces, zero-width characters, smart quotes, mso artifacts.
 */
export function stripWordJunk(text: string): string {
  if (!text) return '';
  let s = parseWordMatricesAndCases(text);
  return s
    // Non-breaking spaces and zero-width spaces
    .replace(/[\u00A0\u200B\u200C\u200D\u2060\uFEFF]/g, ' ')
    // Strip dropped HTML banner warning if copied into text
    .replace(/Word HTML dropped part of the question\.\s*The plain-text version was kept and needs review\.\s*/gi, '')
    // Word smart quotes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    // Word dashes
    .replace(/[\u2013\u2014]/g, '-')
    // Word equation placeholders and box tokens
    .replace(/□\s*\(\s*\)/g, '')
    .replace(/[▒□┤├│〖〗■█]/g, '')
    // Stray leading numbering or dots e.g. ". If a curve" -> "If a curve"
    .replace(/^\s*(?:\d+\.|\.)\s*(?=[A-Za-z])/g, '')
    // Spacing quotes in Word e.g. dy/(" " \, dx)
    .replace(/([0-9a-zA-Z])\s*["']\s*["']\s*([0-9a-zA-Z])/g, '$1 $2')
    .replace(/"\s*"/g, ' ')
    .replace(/'\s+'/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
        col2 = col2.replace(/[≥\u2265]|>=/g, ' \\ge ')
                   .replace(/[≤\u2264]|<=/g, ' \\le ')
                   .replace(/[≠\u2260]|!=/g, ' \\ne ')
                   .replace(/</g, ' < ')
                   .replace(/>/g, ' > ');
        col2 = col2.replace(/\s+/g, ' ').trim();
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
 * Replaces Unicode mathematical characters with canonical LaTeX commands.
 */
export function convertUnicodeMathToLatex(text: string): string {
  if (!text) return '';
  let res = text;

  // Greek letters
  for (const [uni, cmd] of Object.entries(GREEK_UNICODE_MAP)) {
    res = res.replaceAll(uni, ` ${cmd} `);
  }

  // Operators and symbols
  for (const [uni, cmd] of Object.entries(OPERATOR_UNICODE_MAP)) {
    res = res.replaceAll(uni, ` ${cmd} `);
  }

  // Superscript numbers: ², ³, ⁴, ⁿ
  const superMap: Record<string, string> = {
    '⁰': '^{0}', '¹': '^{1}', '²': '^{2}', '³': '^{3}', '⁴': '^{4}',
    '⁵': '^{5}', '⁶': '^{6}', '⁷': '^{7}', '⁸': '^{8}', '⁹': '^{9}',
    '⁺': '^{+}', '⁻': '^{-}', 'ⁿ': '^{n}'
  };
  for (const [sup, exp] of Object.entries(superMap)) {
    res = res.replaceAll(sup, exp);
  }

  // Subscript numbers: ₀, ₁, ₂, ...
  const subMap: Record<string, string> = {
    '₀': '_{0}', '₁': '_{1}', '₂': '_{2}', '₃': '_{3}', '₄': '_{4}',
    '₅': '_{5}', '₆': '_{6}', '₇': '_{7}', '₈': '_{8}', '₉': '_{9}',
    '₊': '_{+}', '₋': '_{-}'
  };
  for (const [sub, ind] of Object.entries(subMap)) {
    res = res.replaceAll(sub, ind);
  }

  // Word mathematical italic & bold alphanumeric symbols (e.g. 𝑥, 𝑦, 𝑧) -> ASCII a-z, A-Z
  res = res.replace(/[\u{1D400}-\u{1D7FF}]/gu, (char) => {
    const cp = char.codePointAt(0);
    if (!cp) return char;
    if (cp >= 0x1D400 && cp <= 0x1D419) return String.fromCharCode(cp - 0x1D400 + 65);
    if (cp >= 0x1D41A && cp <= 0x1D433) return String.fromCharCode(cp - 0x1D41A + 97);
    if (cp >= 0x1D434 && cp <= 0x1D44D) return String.fromCharCode(cp - 0x1D434 + 65);
    if (cp >= 0x1D44E && cp <= 0x1D467) return String.fromCharCode(cp - 0x1D44E + 97);
    return char;
  });

  return res;
}

/**
 * Repairs linear equations residues:
 * - dy/(" " \, dx) -> \dfrac{dy}{dx}
 * - a/b -> \dfrac{a}{b}
 * - exp{...} -> \exp\left\{...\right\}
 * - tan^{-1}x -> \tan^{-1}(x)
 * - \begin{align} / \begin{align*} -> \begin{aligned}
 */
export function repairLinearMathResidues(text: string): string {
  if (!text) return '';
  let s = text;

  // Clean leading bullet, number, or dot: ". If a curve..." -> "If a curve..."
  s = s.replace(/^[\s\u2022\u25E6\u25AA\u25CF.\-—]+\s*(?=[A-Za-z])/g, '');
  s = s.replace(/^Q(?:uestion)?\s*\.?\s*\d+\s*[:.)\-—]\s*/gi, '');

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

  // 1. Differential residues from Word: dy/(" " \, dx), dy/(dx), dy/dx, d^n/dx^n
  s = s.replace(/\b(d(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?[a-zA-Z]?)\s*\/\s*\(\s*(?:["'][^"']*["'])?\s*(?:\\,)?\s*(d[a-zA-Z](?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\)/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\b(d(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?[a-zA-Z]?)\s*\/\s*(d[a-zA-Z](?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\b/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\(\s*["'][^"']*["']\s*(?:\\,)?\s*(d[a-zA-Z])\s*\)/g, '\\,$1');

  // 2. Word linear fractions with nested parens and exponents: (3x^{5} \tan^{-1}(x^3))/(1+x^{6})^{\frac{3}{2}}
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

  // 3. Exponential cleanup: \exp\{ ... \} with balanced braces
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

  // 4. Inverse trigonometric notation: tan^(-1) -> \tan^{-1}
  s = s.replace(/\\?(sin|cos|tan|cot|sec|csc)\s*\^\s*\(\s*-?\s*1\s*\)/gi, '\\$1^{-1}');
  s = s.replace(/(?<!\\)\b(sin|cos|tan|cot|sec|csc)\b(?!\^\{-?1\})/gi, '\\$1');

  // Fractions inside \exp: \frac -> \dfrac
  s = s.replace(/\\exp\\left\\\{([\s\S]*?)\\right\\\}/g, (_, inner) => {
    const upgraded = inner.replace(/\\frac\b/g, '\\dfrac');
    return `\\exp\\left\\{${upgraded}\\right\\}`;
  });

  // 5. Align environments: KaTeX requires 'aligned' inside math mode instead of top-level 'align' / 'align*'
  s = s.replace(/\\begin\{align\*?\}/g, '\\begin{aligned}');
  s = s.replace(/\\end\{align\*?\}/g, '\\end{aligned}');

  // 6. Simple numeric fractions in options/text: e.g. 1/2, -1/2 -> \dfrac{1}{2}
  s = s.replace(/(?<![a-zA-Z0-9_\/])([-+]?\d+)\s*\/\s*(\d+)(?![a-zA-Z0-9_\/])/g, '\\dfrac{$1}{$2}');
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

  // 7. Redundant parentheses in radicals: \sqrt{(x+1)} -> \sqrt{x+1}
  s = s.replace(/\\sqrt\(\s*([^()]+)\s*\)/g, '\\sqrt{$1}');
  s = s.replace(/\\sqrt\{\s*\(([^()]+)\)\s*\}/g, '\\sqrt{$1}');

  // 8. Insert space after semicolons/commas when followed directly by initial conditions or variables (e.g. "dx;y(2)=e" or "0,y(1)=e")
  s = s.replace(/([0-9a-zA-Z_)\\])\s*([;,])\s*([a-zA-Z]\s*(?:\([^()]+\)|=))/g, '$1$2 $3');

  return s;
}

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
 * Ensures all mathematical expressions are properly enclosed in $...$ (inline) or $$...$$ (display),
 * leaving English prose strictly outside delimiters.
 */
export function wrapBareLatexInDollars(text: string): string {
  if (!text) return '';
  let s = text.trim();

  // If already pure wrapped formula
  if (s.startsWith('$') && s.endsWith('$') && !s.slice(1, -1).includes('$')) {
    return s;
  }

  // Step 1: Protect existing delimited blocks using non-word tokens ⟦MATH_idx⟧ (including multiline inline math)
  const protectedBlocks: string[] = [];
  s = s.replace(/\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?:\\\$|[^\$])+?\$|\\\([\s\S]*?\\\)/g, (m) => {
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

  // Strip stray comma in backslash-comma outside math so clauses are not cut short
  s = s.replace(/\\,\s*/g, ' ');

  const proseLead = '(?:Let|If|Suppose|Given|Define|Find|Evaluate|Calculate|Show|Consider)\\b\\s*[:,]?\\s*';
  const proseStops = '(?:pass|passes|passing|touch|touches|touching|intersect|intersects|has|have|having|where|when|such|if|then|and|with|at|for|is|are|represented|representing|given)\\b';

  // 1. Environments (with optional LHS: g(x) = \begin{cases} ... \end{cases} or A = \begin{pmatrix} ... \end{pmatrix})
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
    new RegExp(`(?<![$\\w])((?:\\\\(?:d?frac)\\{[^{}]+\\}\\{[^{}]+\\}|[a-zA-Z0-9_+-]+)\\s*=\\s*(?:\\\\(?:d?frac)\\{[^{}]+\\}\\{[^{}]+\\}|[a-zA-Z0-9_+-]+)\\s*=\\s*(?:\\\\(?:d?frac)\\{[^{}]+\\}\\{[^{}]+\\}|[a-zA-Z0-9_+-]+))(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'gi'),
    (_, m) => protect(m)
  );

  // 4. Integrals: \int ... dx
  s = s.replace(
    new RegExp(`(?<![$\\w])(\\\\(?:int|iint|iiint|oint)(?:_[^{}\\s]+|_\\{\\s*[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\s*\\}|\\^[^{}\\s]+|\\^\\{\\s*[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\s*\\})*\\s*[\\s\\S]+?(?:\\\\,?\\s*d[a-zA-Z]|dx|dy|dt|dz|du|dv|d\\theta|dr)(?![a-zA-Z]))(?=(?:\\s*=\\s*[^,;.\\n]+)?(?:\\s*[,;.]|\\s+${proseStops}|$))`, 'gi'),
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
    new RegExp(`(?<![$\\w])(\\\\vec\\{[^{}]+\\}\\s*=\\s*[^,;.\\n]+?)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'gi'),
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

  // 8b. Functional equations: f(x+y) = f(x) \cdot f(y) or f(xy) = f(x) + f(y)
  s = s.replace(
    new RegExp(`(?<![$\\w])([a-zA-Z]\\s*\\([^()\\n]+\\)\\s*=\\s*[-+*/a-zA-Z0-9_\\\\^{}()'|\\s.]*?[a-zA-Z0-9_^{}()'|\\\\)])(?=\\s+${proseStops}|\\s*[,;.]|$)`, 'gi'),
    (fullMatch, eq) => {
      const nonLatex = eq.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:let|the|and|for|with|where|when|if|then|is|are|find)\b/i.test(nonLatex)) {
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
    (_, m) => {
      const fracNorm = m.replace(/\(\s*(\d+)\s*\/\s*(\d+)\s*\)/, '\\left(\\dfrac{$1}{$2}\\right)')
                        .replace(/\(\s*(\\d?frac\{[^{}]+\}\{[^{}]+\})\s*\)/, '\\left($1\\right)');
      return protect(fracNorm);
    }
  );

  // 14. Point coordinates: point (1,2) or (1, 2, 3)
  s = s.replace(/(?<=\b(?:point|at|through|from)\s+)(\(\s*-?[0-9]+(?:\.[0-9]+)?\s*,\s*-?[0-9]+(?:\.[0-9]+)?\s*(?:,\s*-?[0-9]+(?:\.[0-9]+)?)?\s*\))(?![$\w])/gi, (_, m) => protect(m));

  // 14b. Set membership relations: x, y \in \mathbb{R} or x \in R or n \in \mathbb{N}
  s = s.replace(/(?<![$\w])([a-zA-Z](?:\s*,\s*[a-zA-Z])*\s*\\in\s*(?:\\mathbb\{[RNZQ]\}|[RNZQ]|\[[^\[\]\n]+\]|\([^()\n]+\)))(?![$\w])/g, (_, m) => protect(m));

  // 14c. Simple variable assignments after at/for/where/when/if: at x = 0, for x = 1
  s = s.replace(
    new RegExp(`(?<=\\b(?:at|for|where|when|if|with)\\s+)([a-zA-Z]\\s*=\\s*[-+]?[0-9a-zA-Z_\\\\^{}()]+)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'g'),
    (_, m) => protect(m)
  );

  // 15. Remaining standalone LaTeX commands with balanced braces
  s = s.replace(
    new RegExp(`(?<![$\\w])(\\\\(?:d?frac|sqrt|vec|hat|bar|dot|ddot|tilde|mathbf|mathrm|text|operatorname)\\{(?:[^{}]|\\{[^{}]*\\})*\\}(?:\\{(?:[^{}]|\\{[^{}]*\\})*\\})*(?:[A-Za-z0-9_^{}\\\\()[\\]+\\-*/\\s.]*[A-Za-z0-9_^{}\\\\()[\\]+\\-*/])?|\\\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|infty|times|div|pm|mp|le|ge|ne|approx|sim|to|partial|nabla|degree|circ)(?![a-zA-Z]))(?=\\s*[,;.]|\\s+${proseStops}|$|\\s+[a-zA-Z]{3,})`, 'gi'),
    (fullMatch, cmd) => protect(cmd)
  );

  // 1. Expand any remaining nested ⟦MATH_...⟧ tokens inside protectedBlocks
  for (let p = 0; p < 10; p++) {
    let changed = false;
    for (let i = 0; i < protectedBlocks.length; i++) {
      if (/\u27E6MATH_(\d+)\u27E7/.test(protectedBlocks[i])) {
        protectedBlocks[i] = protectedBlocks[i].replace(/\u27E6MATH_(\d+)\u27E7/g, (_, id) => {
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
  while (/\u27E6MATH_(\d+)\u27E7/.test(s) && restorePasses < 10) {
    s = s.replace(/\u27E6MATH_(\d+)\u27E7/g, (_, id) => {
      const block = protectedBlocks[Number(id)];
      return block !== undefined ? block : '';
    });
    restorePasses++;
  }

  // 3. Final safety cleanup: remove any leftover orphan tokens
  s = s.replace(/\u27E6MATH_\d+\u27E7/g, '');

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

  if (
    (s.startsWith('$') && s.endsWith('$') && !s.slice(1, -1).includes('$')) ||
    (s.startsWith('\\(') && s.endsWith('\\)')) ||
    (s.startsWith('\\[') && s.endsWith('\\]'))
  ) {
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
 * Master Normalization Pipeline (Step 4 & Storage Rule).
 * Transforms raw pasted or extracted text into canonical KaTeX-ready LaTeX.
 */
export function normalizeCanonicalMath(raw: string): string {
  if (!raw) return '';

  // 1. Strip rendered HTML (Storage Rule)
  let text = stripRenderedHtml(raw);

  // 2. Strip Word junk (nbsp, zero-width, smart quotes, etc.)
  text = stripWordJunk(text);

  // 3. Normalize double-escaped backslashes (Storage Rule)
  text = normalizeBackslashes(text);

  // 4. Convert Unicode math to LaTeX
  text = convertUnicodeMathToLatex(text);

  // 5. Repair linear math residues (fractions, differentials, exp, etc.)
  text = repairLinearMathResidues(text);

  // 6. Wrap bare LaTeX in $...$ leaving plain English outside
  text = wrapBareLatexInDollars(text);

  return text;
}
