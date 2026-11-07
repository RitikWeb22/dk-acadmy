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
  return text
    .replace(/[\u200B-\u200F\u2060-\u2064\uFEFF\u00AD\u034F\u180E\uFFF9-\uFFFC]/g, '')
    .replace(/[\u2000-\u200A\u202F\u205F\u00A0\u3000]/g, ' ')
    .replace(/[▒□〖〗]/g, '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u2032/g, "'")
    .replace(/\u2033/g, "''")
    .replace(/\u2034/g, "'''")
    .replace(/[\u2212\u2010-\u2015]/g, '-')
    .replace(/[\u2044\u2215]/g, '/');
}

/**
 * Reconstructs Word linear UnicodeMath equations, integrals, summations, limits,
 * fractions, powers, and inverse trig functions into standardized LaTeX syntax.
 */
export function convertWordEquationToLatex(raw: string): string {
  if (!raw) return '';
  let s = cleanWordMathArtifacts(raw);

  // 0a. Word linear Piecewise Cases: {■(row1@row2@...)┤ or {■(...) or {\matrix(...) or \cases(...)
  s = s.replace(/\{\s*(?:■|\\matrix|\\eqarray|\\cases)?\s*\(([\s\S]+?)\)\s*(?:┤|│|\}|(?=\s*(?:where|when|for|\n|if|$)))/g, (_, body) => {
    const rows = body.split('@').map((r: string) => r.trim().replace(/\s*&\s*/g, ' & ')).join(' \\\\ ');
    return `\\begin{cases} ${rows} \\end{cases}`;
  });

  // 0b. Word linear Matrices: [■(...)], (■(...)), |■(...)|
  s = s.replace(/\[\s*(?:■|\\matrix)?\s*\(([\s\S]+?)\)\s*\]/g, (_, body) => {
    const rows = body.split('@').map((r: string) => r.trim().replace(/\s*&\s*/g, ' & ')).join(' \\\\ ');
    return `\\begin{bmatrix} ${rows} \\end{bmatrix}`;
  });
  s = s.replace(/\(\s*(?:■|\\matrix)?\s*\(([\s\S]+?)\)\s*\)/g, (_, body) => {
    const rows = body.split('@').map((r: string) => r.trim().replace(/\s*&\s*/g, ' & ')).join(' \\\\ ');
    return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
  });
  s = s.replace(/\|\s*(?:■|\\matrix)?\s*\(([\s\S]+?)\)\s*\|/g, (_, body) => {
    const rows = body.split('@').map((r: string) => r.trim().replace(/\s*&\s*/g, ' & ')).join(' \\\\ ');
    return `\\begin{vmatrix} ${rows} \\end{vmatrix}`;
  });

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

  // 10. Derivatives: dy/dx or d^2y/dx^2
  s = s.replace(/\b(d\^?[0-9]?[a-zA-Z]?)\s*\/\s*(d[a-zA-Z]\^?[0-9]?)\b/g, '\\frac{$1}{$2}');

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
       .replace(/[≤\u2264]/g, '\\leq ')
       .replace(/[≥\u2265]/g, '\\geq ')
       .replace(/≠/g, '\\neq ');

  // 8. Multi-character or parenthesized exponents: 2^(2r+1) -> 2^{2r+1}, e^((2-4x)) -> e^{2-4x}
  s = s.replace(/([0-9a-zA-Z\)\]\}]|\\\w+)\s*\^\s*\(\s*\(([^()]+)\)\s*\)/g, '$1^{$2}');
  s = s.replace(/([0-9a-zA-Z\)\]\}]|\\\w+)\s*\^\s*\(\s*([^()]+)\s*\)/g, '$1^{$2}');
  s = s.replace(/([0-9a-zA-Z\)\]\}]|\\\w+)\s*\^\s*([a-zA-Z0-9])(?![a-zA-Z0-9{])/g, '$1^{$2}');

  // 9. Subscripts: S_k -> S_{k}, a_n -> a_{n}
  s = s.replace(/\b([A-Za-z])_([a-zA-Z0-9]+)\b/g, '$1_{$2}');

  // 10. Fractions:
  // e.g. 1/(5+2x-2x^2 )(1+e^{2-4x} ) -> \frac{1}{(5+2x-2x^2)(1+e^{2-4x})}
  s = s.replace(/1\s*\/\s*\(\s*([^()]+)\s*\)\s*\(\s*([^()]+)\s*\)/g, '\\frac{1}{($1)($2)}');
  s = s.replace(/1\s*\/\s*\\alpha\b/g, '\\frac{1}{\\alpha}');
  s = s.replace(/\\pi\s*\/\s*([0-9]+)/g, '\\frac{\\pi}{$1}');
  s = s.replace(/(?<![a-zA-Z0-9\\])([0-9]+)\s*\/\s*([0-9]+)(?![a-zA-Z0-9])/g, '\\frac{$1}{$2}');

  // (a+1)/b or (\alpha+1)/\beta or (18-[1-x]) / ([x-3a])
  s = s.replace(/\(\s*([0-9a-zA-Z\\^{}_+\-\s\[\]]+?)\s*\)\s*\/\s*([\\a-zA-Z0-9_]+)/g, '\\frac{$1}{$2}');
  // NUM / (DEN)
  s = s.replace(/([0-9a-zA-Z\\^{}_]+)\s*\/\s*\(\s*([0-9a-zA-Z\\^{}_+\-\s\[\]]+?)\s*\)/g, '\\frac{$1}{$2}');
  // (NUM) / (DEN)
  s = s.replace(/\(\s*([0-9a-zA-Z\\^{}_+\-\s\[\]]+?)\s*\)\s*\/\s*\(\s*([0-9a-zA-Z\\^{}_+\-\s\[\]]+?)\s*\)/g, '\\frac{$1}{$2}');

  // 11. Tall parentheses \left( \frac{...}{...} \right) with arbitrary nested braces
  s = s.replace(/(\\(?:tan|cot|sin|cos|sec|csc)(?:\^\{[^}]+\})?|\\(?:log_e|ln|log))\s*\(\s*(\\frac\{(?:[^{}]|\{[^{}]*\})*\}\{(?:[^{}]|\{[^{}]*\})*\})\s*\)/g,
    '$1\\left($2\\right)');

  // 12. Spacing around \, dx
  s = s.replace(/\s*dx\b/gi, ' \\, dx');

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

  // Check if string contains English prose words:
  const proseRegex = /\b(?:Let|Then|If|When|Where|Find|Calculate|Given|Suppose|Show|Prove|The|Hence|Therefore|is|are|was|were|equal|to|for|with|and|or|in|of|by|on|at|all|value|values|such|that|which|following|true|false|statements?|continuous|discontinuous|exists|at|least|points?)\b/i;
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
  // Step 1: Protect existing $...$
  const protectedBlocks: string[] = [];
  s = s.replace(/\$[^\$]+?\$/g, (m) => {
    const key = `___PROT_${protectedBlocks.length}___`;
    protectedBlocks.push(m);
    return key;
  });

  const protect = (match: string) => {
    const key = `___PROT_${protectedBlocks.length}___`;
    protectedBlocks.push(`$${match.trim()}$`);
    return ` ${key} `;
  };

  // Step 2a: Piecewise and Matrix environments: e.g. f(x) = \begin{cases} ... \end{cases}
  s = s.replace(/(?<!\$)(f\s*\([a-zA-Z0-9]+\)\s*=\s*\\begin\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix)\}[\s\S]+?\\end\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix)\}|\\begin\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix)\}[\s\S]+?\\end\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix)\})(?!\$)/g,
    (_, m) => protect(m));

  // Step 2b: Function mappings: e.g. f : \mathbb{R} \to \mathbb{R}
  s = s.replace(/(?<![a-zA-Z0-9_\$])([a-zA-Z]\s*:\s*(?:\\mathbb\{[A-Z]\}|[A-Z])\s*\\to\s*(?:\\mathbb\{[A-Z]\}|[A-Z]))(?![a-zA-Z0-9_\$])/g,
    (_, m) => protect(m));

  // Step 2c: Set membership expressions: e.g. a,b,c \in \mathbb{R} or x \in [0, 1]
  s = s.replace(/(?<![a-zA-Z0-9_\$])([a-zA-Z\\]+(?:\s*,\s*[a-zA-Z\\]+)*\s*\\in\s*(?:\\mathbb\{[A-Z]\}|\[[^\]]+\]|\([^\)]+\)|[A-Z]))(?![a-zA-Z0-9_\$])/g,
    (_, m) => protect(m));

  // Step 3: Full integral equations or expressions
  s = s.replace(/(?<![a-zA-Z0-9_\$])(\\(?:int|iint|iiint)(?:_\{[^{}]+\}|_[0-9a-zA-Z]+|\^\{[^{}]+\}|\^[0-9a-zA-Z]+)*\s*[\s\S]+?\\,\s*dx(?:\s*=\s*[^,;\n]+)?)(?=\s*,|\s+where|\s+for|\s+and|$)/gi,
    (_, m) => protect(m));

  // Step 4: Full equations starting with variable: e.g. S_{k} = \sum_{r=1}^{k} \tan^{-1}\left(\frac{6^{r}}{2^{2r+1}+3^{2r+1}}\right)
  s = s.replace(/(?<![a-zA-Z0-9_\$])(\b[A-Za-z](?:_\{[^{}]+\}|_[A-Za-z0-9]+)?\s*=\s*(?:\\sum|\\prod|\\lim)[\s\S]+?)(?=\s*\.|\s+Then\b|\s+and\b|\s+where\b|$)/gi,
    (_, m) => protect(m));

  // Step 5a: Full limits/summations with fractions or expressions before prose: e.g. \lim_{x\to 7}\frac{18-[1-x]}{[x-3a]} exists
  s = s.replace(/(?<![a-zA-Z0-9_\$])(\\(?:lim|sum|prod)(?:_\{[^{}]+\}|_[0-9a-zA-Z]+|\^\{[^{}]+\}|\^[0-9a-zA-Z]+)*\s*(?:\\(?:frac|dfrac)\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|[A-Za-z0-9_^{}\\()\[\]+\-*/]+))(?=\s+(?:exists|is|equal|where|then|and|for|\.|\,)|$)/gi,
    (_, m) => protect(m));

  // Step 5b: Standalone limits/summations before prose: e.g. \lim_{k\to\infty} S_{k} is equal to
  s = s.replace(/(?<![a-zA-Z0-9_\$])(\\(?:lim|sum|prod)(?:_\{[^{}]+\}|_[0-9a-zA-Z]+|\^\{[^{}]+\}|\^[0-9a-zA-Z]+)*\s*[A-Za-z0-9_^{}\\()]+)(?=\s+is\b|\s*=\s*|\s*[,;.]|\s+where\b|\s+and\b|$)/gi,
    (_, m) => protect(m));

  // Step 5c: Bracketed variable definitions like [t] or [x] when preceded by "where" or followed by "is"
  s = s.replace(/(?<![a-zA-Z0-9_\$])(\[[a-zA-Z0-9_\-]+\])(?=\s+(?:is|denotes|represents|where))/gi,
    (_, m) => protect(m));

  // Step 5d: Relational inequalities: e.g. \leq t, \le t, \ge t, > 0
  s = s.replace(/(?<![a-zA-Z0-9_\$])(\\(?:leq|ge|le|geq|neq)\s+[a-zA-Z0-9_\\]+)(?![a-zA-Z0-9_\$])/gi,
    (_, m) => protect(m));

  // Step 6a: Multi-term algebraic relations/equations: e.g. a+b+c=1 or a+b+c \neq 1 or x^2+y^2=1
  s = s.replace(/(?<![a-zA-Z0-9_\$])([a-zA-Z0-9_\\]+(?:\s*[-+*/]\s*[a-zA-Z0-9_\\]+)+\s*(?:=|\\neq|\\leq|\\geq|<|>)\s*[-+*/a-zA-Z0-9_\\]+)(?![a-zA-Z0-9_\$])/gi,
    (_, m) => protect(m));

  // Step 6b: Inequalities or bounds: e.g. \alpha, \beta > 0
  s = s.replace(/(?<![a-zA-Z0-9_\$])((\\[a-zA-Z]+|[a-zA-Z])(?:\s*,\s*(\\[a-zA-Z]+|[a-zA-Z]))*\s*[><=]\s*[0-9]+)(?![a-zA-Z0-9_\$])/gi,
    (_, m) => protect(m));

  // Step 6c: Polynomials or expressions: e.g. \alpha^4 - \beta^4 or \alpha^{4} - \beta^{4} or x^2 + y^2
  s = s.replace(/(?<![a-zA-Z0-9_\$])((\\[a-zA-Z]+|[a-zA-Z])(?:\^\{[^{}]+\}|\^[0-9a-zA-Z]+)\s*[-+*/]\s*(\\[a-zA-Z]+|[a-zA-Z])(?:\^\{[^{}]+\}|\^[0-9a-zA-Z]+))(?![a-zA-Z0-9_\$])/gi,
    (_, m) => protect(m));

  // Step 7: Standalone math commands
  s = s.replace(/(?<!\$)((\\(?:tan|cot|sin|cos|sec|csc)\^\{[^}]+\}|\\(?:frac|dfrac|sqrt|log_e|ln|alpha|beta|gamma|theta|lambda|pi|sum|lim|int|mathbb\{[A-Z]\}|neq|leq|geq|in|to|subset|subseteq|cap|cup|pm|mp|times|div|cdot|hat\{[^{}]+\}|vec\{[^{}]+\}|Delta|phi))\S*(?:\s*[=+*/\-]\s*\S+)*)(?!\$)/g,
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
 * Parses a single question text block into structured components.
 */
export function parseSingleQuestionBlock(rawBlock: string): ParsedWordQuestion {
  // Normalize unicode spaces and strip invisible Word/PDF mathematical formatting markers
  let text = cleanWordMathArtifacts(rawBlock).trim();

  // 1. Remove leading question numbers e.g. "1.", "2.", "Q.1:", "Question 2:"
  text = text.replace(/^\s*(?:Q(?:uestion)?\.?\s*\d+|\d+[\.\:\)])\s*/i, '').trim();

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
  const examTagMatch = text.match(/\b(JEE\s*(?:Main|Advanced)?(?:\s*\d{4})?[^\n]*?(?:Shift|Morning|Evening|Paper\s*\d|Session\s*\d)?)\b/i) ||
                       text.match(/\[(JEE\s*(?:Main|Advanced)?[^\]]+)\]/i) ||
                       text.match(/\b(BITSAT\s*\d{4}[^\n]*)/i);

  if (examTagMatch) {
    examTag = examTagMatch[1].trim().replace(/^\[|\]$/g, '');
    text = text.replace(examTagMatch[0], '').trim();
  }

  // 5. Extract Options (Supports A-D, 1-4, Bare Labels, and Blank/Unlabeled Newlines)
  const optionsMap: Record<string, string> = { A: '', B: '', C: '', D: '' };

  // Strategy 1: Standard markers with parens, brackets, or Option label: (A), [A], Option A, A., A:, A), (1), [1], 1., 1)
  const standardMarkerRegex = /(?:^|[\n\r]|\s{2,})(?:\(([A-D1-4])\)|\[([A-D1-4])\]|Option\s*\(?([A-D1-4])\)?[:.]?|([A-D1-4])[\.:\)])(?:\s+|$)/gi;
  let matches = [...text.matchAll(standardMarkerRegex)];

  // Strategy 2: Bare letter or bare number markers (e.g. newline "A -6\nB -2", or multiple spaces "A -21.  B 21.")
  if (matches.length < 2) {
    const bareMarkerRegex = /(?:^|[\n\r]|\s{2,})(?:Option\s+)?([A-D1-4])(?:\s*[\.:\)]|\s+)(?=\S)/gi;
    const bareMatches = [...text.matchAll(bareMarkerRegex)];
    const keys = bareMatches.map((m) => (m[1] || '').toUpperCase());
    if ((keys.includes('A') && keys.includes('B')) || (keys.includes('1') && keys.includes('2'))) {
      matches = bareMatches;
    }
  }

  // Strategy 3: Single-line sequential A ... B ... C ... D ... or 1 ... 2 ... 3 ... 4 ...
  if (matches.length < 2) {
    const singleLineMatchLetters = text.match(/(?:^|[\n\r])\s*A\s*[\.:\)]?\s+([\s\S]+?)\s+B\s*[\.:\)]?\s+([\s\S]+?)\s+C\s*[\.:\)]?\s+([\s\S]+?)\s+D\s*[\.:\)]?\s+([\s\S]+)$/i);
    const singleLineMatchNumbers = text.match(/(?:^|[\n\r])\s*1\s*[\.:\)]?\s+([\s\S]+?)\s+2\s*[\.:\)]?\s+([\s\S]+?)\s+3\s*[\.:\)]?\s+([\s\S]+?)\s+4\s*[\.:\)]?\s+([\s\S]+)$/i);
    const match = singleLineMatchLetters || singleLineMatchNumbers;
    if (match) {
      const statement = text.slice(0, match.index).trim();
      optionsMap.A = match[1].trim().replace(/\s*\.$/, '');
      optionsMap.B = match[2].trim().replace(/\s*\.$/, '');
      optionsMap.C = match[3].trim().replace(/\s*\.$/, '');
      optionsMap.D = match[4].trim().replace(/\s*\.$/, '');
      text = statement;
    }
  }

  if (matches.length >= 2) {
    const firstOptionIdx = matches[0].index ?? 0;
    const extractedStatement = text.slice(0, firstOptionIdx).trim();

    for (let i = 0; i < matches.length; i++) {
      const cur = matches[i];
      const rawK = (cur[1] || cur[2] || cur[3] || cur[4] || '').toUpperCase();
      const k = numToLetterMap[rawK] || (rawK as 'A' | 'B' | 'C' | 'D');
      const start = (cur.index ?? 0) + cur[0].length;
      const end = (i + 1 < matches.length) ? (matches[i + 1].index ?? text.length) : text.length;
      let optVal = text.slice(start, end).trim();
      // Strip trailing punctuation dot if present (e.g. "-21." -> "-21")
      optVal = optVal.replace(/\s*\.$/, '');
      if (['A', 'B', 'C', 'D'].includes(k)) {
        optionsMap[k] = optVal;
      }
    }
    text = extractedStatement;
  }

  // Strategy 4: Blank / Unlabeled Options (New Lines or Tab/Space Separated)
  // When options have NO marker (no A, B, C, D and no 1, 2, 3, 4)
  if (!optionsMap.A && !optionsMap.B) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    // Case 4a: Last 4 non-empty lines are options A, B, C, D
    if (lines.length >= 5) {
      const last4 = lines.slice(-4);
      if (last4.every((l) => l.length < 200)) {
        optionsMap.A = last4[0].replace(/\s*\.$/, '');
        optionsMap.B = last4[1].replace(/\s*\.$/, '');
        optionsMap.C = last4[2].replace(/\s*\.$/, '');
        optionsMap.D = last4[3].replace(/\s*\.$/, '');
        text = lines.slice(0, -4).join('\n').trim();
      }
    } else if (lines.length >= 3) {
      // Case 4c: Last 2 lines each have 2 tokens separated by tabs or 2+ spaces (2x2 grid)
      const line1Tokens = lines[lines.length - 2].split(/\t+|\s{2,}/).map((t) => t.trim()).filter(Boolean);
      const line2Tokens = lines[lines.length - 1].split(/\t+|\s{2,}/).map((t) => t.trim()).filter(Boolean);
      if (line1Tokens.length === 2 && line2Tokens.length === 2) {
        optionsMap.A = line1Tokens[0].replace(/\s*\.$/, '');
        optionsMap.B = line1Tokens[1].replace(/\s*\.$/, '');
        optionsMap.C = line2Tokens[0].replace(/\s*\.$/, '');
        optionsMap.D = line2Tokens[1].replace(/\s*\.$/, '');
        text = lines.slice(0, -2).join('\n').trim();
      }
    } else if (lines.length >= 2) {
      // Case 4b: Last line has 4 tokens separated by tabs or 2+ spaces
      const lastLine = lines[lines.length - 1];
      const tokens = lastLine.split(/\t+|\s{2,}/).map((t) => t.trim()).filter(Boolean);
      if (tokens.length === 4) {
        optionsMap.A = tokens[0].replace(/\s*\.$/, '');
        optionsMap.B = tokens[1].replace(/\s*\.$/, '');
        optionsMap.C = tokens[2].replace(/\s*\.$/, '');
        optionsMap.D = tokens[3].replace(/\s*\.$/, '');
        text = lines.slice(0, -1).join('\n').trim();
      }
    }
  }

  // 6. Mathematical & LaTeX Normalization (KaTeX / MathJax Compatibility)
  const normStatement = wrapMathInDollars(convertWordEquationToLatex(text.trim()));
  const finalOptions: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = [
    { key: 'A', text: wrapMathInDollars(convertWordEquationToLatex(optionsMap.A || '')) },
    { key: 'B', text: wrapMathInDollars(convertWordEquationToLatex(optionsMap.B || '')) },
    { key: 'C', text: wrapMathInDollars(convertWordEquationToLatex(optionsMap.C || '')) },
    { key: 'D', text: wrapMathInDollars(convertWordEquationToLatex(optionsMap.D || '')) }
  ];

  return {
    statement: normStatement,
    options: finalOptions,
    type: 'SINGLE_CORRECT',
    correctKey,
    examTag: examTag || undefined,
    solution: solution ? wrapMathInDollars(convertWordEquationToLatex(solution)) : undefined,
    shortcut: shortcut ? wrapMathInDollars(convertWordEquationToLatex(shortcut)) : undefined
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
