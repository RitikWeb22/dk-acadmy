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
  return text
    // Non-breaking spaces and zero-width spaces
    .replace(/[\u00A0\u200B\u200C\u200D\u2060\uFEFF]/g, ' ')
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

  // 1. Differential residues from Word: dy/(" " \, dx), dy/(dx), dy/dx
  s = s.replace(/\b(d\^?[0-9]?[a-zA-Z]?)\s*\/\s*\(\s*(?:["'][^"']*["'])?\s*(?:\\,)?\s*(d[a-zA-Z]\^?[0-9]?)\s*\)/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\b(d\^?[0-9]?[a-zA-Z]?)\s*\/\s*(d[a-zA-Z]\^?[0-9]?)\b/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\(\s*["'][^"']*["']\s*(?:\\,)?\s*(d[a-zA-Z])\s*\)/g, '\\,$1');

  // 2. Exponential tall brackets: exp{...} -> \exp\left\{...\right\}
  // Auto-balance any unclosed \exp{...} before prose boundaries
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

  // 3. Inverse trigonometric notation: tan^(-1) -> \tan^{-1}
  s = s.replace(/\\?(sin|cos|tan|cot|sec|csc)\s*\^\s*\(\s*-?\s*1\s*\)/gi, '\\$1^{-1}');
  s = s.replace(/(?<!\\)\b(sin|cos|tan|cot|sec|csc)\b(?!\^\{-?1\})/gi, '\\$1');

  // 4. Align environments: KaTeX requires 'aligned' inside math mode instead of top-level 'align' / 'align*'
  s = s.replace(/\\begin\{align\*?\}/g, '\\begin{aligned}');
  s = s.replace(/\\end\{align\*?\}/g, '\\end{aligned}');

  // 5. Parenthesized linear fractions: (A)/(B) or (A)/(B)^C or (A)/(B)^{\frac{3}{2}}
  s = s.replace(/\(([A-Za-z0-9_+\-*\s\\^{}]+?)\)\s*\/\s*\(([A-Za-z0-9_+\-*\s\\^{}]+?)\)\^(\{?[^{}\s]+\}?|\\frac\{[^{}]+\}\{[^{}]+\})/g, '\\dfrac{$1}{($2)^{$3}}');
  s = s.replace(/\(([A-Za-z0-9_+\-*\s\\^{}]+?)\)\s*\/\s*\(([A-Za-z0-9_+\-*\s\\^{}]+?)\)/g, '\\dfrac{$1}{$2}');

  // 6. Simple numeric fractions in options/text: e.g. 1/2 -> \dfrac{1}{2} (when not part of a URL or date)
  s = s.replace(/(?<![a-zA-Z0-9_\/])(\d+)\s*\/\s*(\d+)(?![a-zA-Z0-9_\/])/g, '\\dfrac{$1}{$2}');

  // 7. Redundant parentheses in radicals: \sqrt{(x+1)} -> \sqrt{x+1}
  s = s.replace(/\\sqrt\(\s*([^()]+)\s*\)/g, '\\sqrt{$1}');
  s = s.replace(/\\sqrt\{\s*\(([^()]+)\)\s*\}/g, '\\sqrt{$1}');

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

  // Step 1: Protect existing delimited blocks using non-word tokens ⟦MATH_idx⟧
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

  // Strip stray comma in backslash-comma outside math so clauses are not cut short
  s = s.replace(/\\,\s*/g, ' ');

  const proseLead = '(?:Let|If|Suppose|Given|Define|Find|Evaluate|Calculate|Show|Consider)\\b\\s*';
  const proseStops = '(?:pass|passes|passing|touch|touches|touching|intersect|intersects|has|have|having|where|when|such|if|then|and|with|at|for|is|are|represented|representing|given)\\b';

  // 1. Environments (with optional LHS: g(x) = \begin{cases} ... \end{cases} or A = \begin{pmatrix} ... \end{pmatrix})
  s = s.replace(
    new RegExp(`(${proseLead})?((?:[a-zA-Z|][a-zA-Z0-9_\\s'|()]*=\\s*)?\\\\begin\\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|aligned)\\}[\\s\\S]+?\\\\end\\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|aligned)\\})`, 'g'),
    (_, lead, m) => (lead ? lead + ' ' : '') + protect(m)
  );

  // 2. Differential equations like \dfrac{dy}{dx} - ... = ... before prose stop
  s = s.replace(
    new RegExp(`(?<![a-zA-Z0-9_\\$])((\\\\(?:d?frac)\\{d\\^?[0-9]?[a-zA-Z]?\\}\\{d[a-zA-Z]\\^?[0-9]?\\}[^=]+)=\\s*([^,;.\\n]+?))(?=\\s+${proseStops}|\\s*[,;.]|$)`, 'gi'),
    (_, m) => protect(m)
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

  // 5. Limits, Summations, Products: \lim_{...} ...
  s = s.replace(
    /(?<![$\w])(\\(?:lim|sum|prod)(?:_[^{}\s]+|_\{\s*[^{}]*(?:\{[^{}]*\}[^{}]*)*\s*\}|\^[^{}\s]+|\^\{\s*[^{}]*(?:\{[^{}]*\}[^{}]*)*\s*\})*\s*[^,;.\n]+?)(?=\s*[,;.]|\s+${proseStops}|$)/gi,
    (_, m) => protect(m)
  );

  // 6. Differential equations with explicit differentials: 2x^2 dy = (2xy+y^2) dx
  s = s.replace(
    new RegExp(`(${proseLead})?([^,;.\\n]*?\\b(?:d\\^?[0-9]?[a-zA-Z]?\\/d[a-zA-Z]\\^?[0-9]?|\\\\(?:d?frac)\\{d\\^?[0-9]?[a-zA-Z]?\\}\\{d[a-zA-Z]\\^?[0-9]?\\}|dy|dx|dt|dz)\\b[^,;.\\n]+?)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'gi'),
    (fullMatch, lead, eq) => {
      const nonLatex = eq.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:let|the|curve|passes|passing|through|solution|is|find|evaluate)\b/i.test(nonLatex)) {
        return fullMatch;
      }
      return (lead ? lead + ' ' : '') + protect(eq);
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
      if (!/(\\[a-zA-Z]+|\^|_|\b(?:det|Tr|adj|sgn|sin|cos|tan|log|ln|exp)\b)/.test(eq)) {
        return fullMatch;
      }
      const nonLatex = eq.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:let|the|and|for|with|where|when|if|then|is|are|find|curve|line|plane)\b/i.test(nonLatex)) {
        return fullMatch;
      }
      return (lead ? lead + ' ' : '') + protect(eq);
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

  // 10. Curve definitions: y=f(x) or y=y(x)
  s = s.replace(/(?<![$\w])([a-zA-Z]\s*=\s*[a-zA-Z]\s*\([a-zA-Z0-9_+\-/*\s\\]+\))(?![$\w])/g, (_, m) => protect(m));

  // 11. Single function terms / derivatives: f'(0), y(4), f( \dfrac{1}{2} )
  s = s.replace(
    /(?<![$\w])([a-zA-Z]'*\s*\(\s*(?:\\(?:d?frac)\{[^{}]+\}\{[^{}]+\}|[0-9a-zA-Z_+\-/*]+)\s*\))(?![$\w])/g,
    (_, m) => protect(m)
  );

  // 12. Inequalities: x > 1, \alpha, \beta > 0, \det A \neq 0
  s = s.replace(
    /(?<![$\w])((?:\\[a-zA-Z]+|[a-zA-Z0-9_^{}()]+)(?:\s*,\s*(?:\\[a-zA-Z]+|[a-zA-Z0-9_^{}()]+))*\s*(?:[><=≤≥≠]|\\(?:neq|le|ge))\s*[-+]?[0-9a-zA-Z_\\]+)(?=\s*[,;.]|\s+${proseStops}|$)/g,
    (fullMatch, eq) => {
      const nonLatex = eq.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:if|then|and|where|when|for|let)\b/i.test(nonLatex)) return fullMatch;
      return protect(eq);
    }
  );

  // 13. Point coordinates: point (1,2) or (1, 2, 3)
  s = s.replace(/(?<=\b(?:point|at|through|from)\s+)(\(\s*-?[0-9]+(?:\.[0-9]+)?\s*,\s*-?[0-9]+(?:\.[0-9]+)?\s*(?:,\s*-?[0-9]+(?:\.[0-9]+)?)?\s*\))(?![$\w])/gi, (_, m) => protect(m));

  // 14. Remaining standalone LaTeX commands with balanced braces
  s = s.replace(
    /(?<![$\w])(\\(?:d?frac|sqrt|vec|hat|bar|dot|ddot|tilde|mathbf|mathrm|text|operatorname)\{(?:[^{}]|\{[^{}]*\})*\}(?:\{(?:[^{}]|\{[^{}]*\})*\})*(?:[A-Za-z0-9_^{}\\()\[\]+\-*/\s.]*[A-Za-z0-9_^{}\\()\[\]+\-*/])?|\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|infty|times|div|pm|mp|le|ge|ne|approx|sim|to|partial|nabla|degree|circ)(?![a-zA-Z]))(?=\s*[,;.]|\s+${proseStops}|$|\s+[a-zA-Z]{3,})/gi,
    (fullMatch, cmd) => protect(cmd)
  );

  // Restore protected blocks
  for (let idx = 0; idx < protectedBlocks.length; idx++) {
    s = s.replace(`\u27E6MATH_${idx}\u27E7`, protectedBlocks[idx]);
  }

  // Clean double dollars and redundant spaces
  s = s.replace(/\$\s*\$/g, ' ');
  s = s.replace(/\$\$+/g, '$');
  s = s.replace(/\s+,/g, ',');
  s = s.replace(/\s+\./g, '.');
  s = s.replace(/\s+/g, ' ').trim();

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
