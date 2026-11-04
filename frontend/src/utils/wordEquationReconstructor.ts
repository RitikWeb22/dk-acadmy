/**
 * DK Academy - Word Equation Linear Format (UnicodeMath / OMML) Reconstruction Engine
 * Reconstructs legacy Microsoft Word Equation Editor linear-format equations into KaTeX / LaTeX.
 * Handles:
 * - Piecewise cases: {█(...)┤, █(...), {\matrix(...)}, \cases(...)
 * - Matrix brackets: [\matrix(...)], [█(...)], (\matrix(...)), |\matrix(...)|
 * - Word Linear limits: lim_(n→∞) (...), lim_(x→1/a) (...)
 * - Word Linear fractions: ((numerator))/((denominator)), (numerator)/(denominator)
 * - Structural tokens: █ (cases/matrix array), @ (row separator), & (alignment/column), ┤ (closing marker)
 * - Invisible characters: \u2061 (function application), \u200A (hair space), zero-width chars
 * - Mathematical symbols: ⋅ (cdot), ⋯ (dots), radical roots (√17), sets (α,β∈Z -> \alpha,\beta \in \mathbb{Z})
 * - Nested or corrupted dollar signs inside fractions e.g. \frac{...}{$t - x$}
 */

export function reconstructWordEquationLinearFormat(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Remove leading numbering / dot artifact before text: e.g. ". Let" or "1. Let" or ". यदि"
  text = text.replace(/^\s*(?:\d+\.|\.)\s*(?=[A-Za-z\u0900-\u097F])/g, '');

  // 2. Clean invisible Word equation formatting characters, hair spaces, and normalize math unicode symbols
  text = cleanInvisibleAndWordArtifacts(text);

  // 3. Normalize domain / mapping notation:
  // f:R→R or f: R -> R or f:R \to R -> \(f:\mathbb{R}\to\mathbb{R}\)
  text = text.replace(
    /\b([a-zA-Z])\s*:\s*(?:\\mathbb\{R\}|\bR\b)\s*(?:→|->|\\to)\s*(?:\\mathbb\{R\}|\bR\b)\b/g,
    '\\($1:\\mathbb{R}\\to\\mathbb{R}\\)'
  );
  text = text.replace(
    /\b([a-zA-Z])\s*:\s*(?:\\mathbb\{[A-Z]\}|[A-Z])\s*(?:→|->|\\to)\s*(?:\\mathbb\{[A-Z]\}|[A-Z])\b/g,
    '\\($1:\\mathbb{R}\\to\\mathbb{R}\\)'
  );

  // 4. Reconstruct Linear Format Limits: lim_(n \to \infty) or lim_(x \to 1/a)
  text = reconstructLinearLimits(text);

  // 5. Reconstruct Linear Format Matrices: [█(...)], [\matrix(...)], (\matrix(...)), |\matrix(...)|
  text = reconstructLinearMatrices(text);

  // 6. Reconstruct Linear Format Piecewise Functions: {█(...)┤, █(...)
  text = reconstructLinearPiecewise(text);

  // 7. Reconstruct Linear Format Fractions: ((...))/((...)) or (...)/(...)
  text = reconstructLinearFractions(text);

  // 8. Reconstruct Radical Roots & Math Sets:
  // e.g. √17 -> \sqrt{17}, √(x^2+1) -> \sqrt{x^2+1}
  text = text.replace(/√\s*\(([^()]+(?:\([^()]+\)[^()]*)*)\)/g, '\\sqrt{$1}');
  text = text.replace(/√([0-9a-zA-Z]+)/g, '\\sqrt{$1}');

  // Sets: where α,β∈Z or \alpha,\beta \in Z -> \alpha, \beta \in \mathbb{Z}
  text = text.replace(/where\s*([\\a-zA-Z,\s]+)\s*\\in\s*(?:Z|\\mathbb\{Z\}|\bR\b|\\mathbb\{R\})\b/gi, (match, vars) => {
    const cleanVars = vars.replace(/\s+/g, ' ').trim();
    return `where $${cleanVars} \\in \\mathbb{Z}$`;
  });

  // 9. Heal nested / stray dollar signs inside math structures:
  // e.g. \frac{t^2 f(x) - x^2 f(t)}{$t - x$} -> \frac{t^2 f(x) - x^2 f(t)}{t - x}
  text = healNestedDollars(text);

  // 10. Wrap function references in prose: "If f(x) is continuous" -> "If \(f(x)\) is continuous"
  text = text.replace(
    /(?<=\b(?:if|when|where|let|then|suppose|given|and)\s+)([a-zA-Z]\s*\([a-zA-Z0-9_]+\))(?=\s+(?:is|are|be|has|have|defined|continuous|differentiable|satisfies|satisfying)\b)/gi,
    '\\($1\\)'
  );

  // 11. Clean dangling legacy structural tokens if any slip through
  text = text.replace(/[█┤]/g, '');

  // Clean trailing spaces and excessive newlines
  text = text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

/**
 * Cleans invisible formatting artifacts and normalizes basic Unicode math symbols
 */
export function cleanInvisibleAndWordArtifacts(text: string): string {
  if (!text) return '';
  return text
    // Strip zero-width & invisible format chars:
    // \u200B (ZWSP), \u200C (ZWNJ), \u200D (ZWJ), \u200E (LRM), \u200F (RLM), \uFEFF (BOM), \u2060 (WJ),
    // \u2061 (FUNCTION APPLICATION), \u2062 (INVISIBLE TIMES), \u2063 (INVISIBLE SEPARATOR), \u2064 (INVISIBLE PLUS)
    .replace(/[\u200B\u200C\u200D\u200E\u200F\uFEFF\u2060\u2061\u2062\u2063\u2064\uFFF9-\uFFFD]/g, '')
    // Normalize hair spaces & narrow non-breaking spaces
    .replace(/[\u200A\u2009\u202F\u00A0]/g, ' ')
    // Normalize math dots & arrows & symbols
    .replace(/[⋅∙•]/g, ' \\cdot ')
    .replace(/[⋯…]/g, ' \\dots ')
    .replace(/[→⟶]/g, ' \\to ')
    .replace(/[≤⩽]/g, ' \\leq ')
    .replace(/[≥⩾]/g, ' \\geq ')
    .replace(/[≠]/g, ' \\neq ')
    .replace(/[±]/g, ' \\pm ')
    .replace(/[×]/g, ' \\times ')
    .replace(/[∞]/g, ' \\infty ')
    .replace(/[∈]/g, ' \\in ')
    .replace(/[α]/g, ' \\alpha ')
    .replace(/[β]/g, ' \\beta ')
    .replace(/[γ]/g, ' \\gamma ')
    .replace(/[θ]/g, ' \\theta ')
    .replace(/[λ]/g, ' \\lambda ')
    .replace(/[π]/g, ' \\pi ')
    .replace(/[ℤ]/g, ' \\mathbb{Z} ')
    .replace(/[ℝ]/g, ' \\mathbb{R} ')
    // Clean curly quotes & dashes
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2212\u2013\u2014]/g, '-');
}

/**
 * Reconstructs Word Linear Format Limits:
 * lim_(n \to \infty ) or lim_(x \to 1/a) or lim_(x->0)
 */
export function reconstructLinearLimits(text: string): string {
  let res = text;
  // lim_(...) or lim_{...} or lim (...)
  res = res.replace(/\\?lim_?\s*[\(\{\[]\s*([^)\}\]]+?)\s*[\)\}\]]\s*/gi, (_, cond) => {
    let cleanCond = cond.trim()
      .replace(/[→⟶]|\\to/g, ' \\to ')
      .replace(/\\infty|\u221E|inf\b/gi, '\\infty')
      .replace(/\s+/g, ' ');

    // If destination in limit is a fraction like 1/a -> \frac{1}{a}
    cleanCond = cleanCond.replace(/([0-9a-zA-Z]+)\s*\/\s*([0-9a-zA-Z]+)/g, '\\frac{$1}{$2}');
    return `\\lim_{${cleanCond.trim()}} `;
  });

  return res;
}

/**
 * Strips outer enclosing parentheses using a depth counter
 */
export function stripOuterParensSafe(str: string): string {
  let s = str.trim();
  while (s.startsWith('(') && s.endsWith(')')) {
    let depth = 0;
    let isEnclosing = true;
    for (let i = 0; i < s.length - 1; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') depth--;
      if (depth === 0) {
        isEnclosing = false;
        break;
      }
    }
    if (isEnclosing) {
      s = s.slice(1, -1).trim();
    } else {
      break;
    }
  }
  return s;
}

/**
 * Reconstructs Word Linear Format fractions:
 * e.g. ((1^2-1)(n-1)+...)/((1^3+2^3+...)-(1^2+...))
 * e.g. 16(1-cos(2+x-2x^2 ))/((1-ax)^2 )
 */
export function reconstructLinearFractions(text: string): string {
  let str = text;

  let changed = true;
  let iterations = 0;

  while (changed && iterations < 15) {
    changed = false;
    iterations++;

    for (let i = 0; i < str.length; i++) {
      if (str[i] === '/') {
        // Skip if this slash is preceded by backslash or already inside a \frac command
        if (i > 0 && str[i - 1] === '\\') continue;

        // 1. Scan Left: find start of numerator
        let leftEnd = i - 1;
        while (leftEnd >= 0 && /\s/.test(str[leftEnd])) leftEnd--;
        if (leftEnd < 0) continue;

        let leftStart = -1;
        if (str[leftEnd] === ')') {
          let depth = 1;
          let p = leftEnd - 1;
          while (p >= 0 && depth > 0) {
            if (str[p] === ')') depth++;
            else if (str[p] === '(') depth--;
            p--;
          }
          if (depth === 0) {
            leftStart = p + 1;
            // Check if there is a prefix like 16(...) or sin(...) or cos(...) attached to the paren
            let prefixEnd = leftStart - 1;
            while (prefixEnd >= 0 && /\s/.test(str[prefixEnd])) prefixEnd--;
            if (prefixEnd >= 0) {
              let pPre = prefixEnd;
              while (pPre >= 0 && /[a-zA-Z0-9_\\^]/.test(str[pPre])) pPre--;
              const token = str.substring(pPre + 1, prefixEnd + 1);
              if (token && !['is', 'and', 'or', 'if', 'then', 'to', 'where'].includes(token.toLowerCase())) {
                leftStart = pPre + 1;
              }
            }
          }
        } else {
          // Simple identifier or number: e.g. 1 / a, \pi / 4, x / 2
          let p = leftEnd;
          while (p >= 0 && /[a-zA-Z0-9_\\^]/.test(str[p])) p--;
          leftStart = p + 1;
        }

        if (leftStart < 0 || leftStart > leftEnd) continue;

        // 2. Scan Right: find end of denominator
        let rightStart = i + 1;
        while (rightStart < str.length && /\s/.test(str[rightStart])) rightStart++;
        if (rightStart >= str.length) continue;

        let rightEnd = -1;
        if (str[rightStart] === '(') {
          let depth = 1;
          let p = rightStart + 1;
          while (p < str.length && depth > 0) {
            if (str[p] === '(') depth++;
            else if (str[p] === ')') depth--;
            p++;
          }
          if (depth === 0) {
            rightEnd = p - 1;
            // Check if denominator paren is followed by an exponent e.g. ((1-ax)^2) or (1-ax)^2
            let nextP = rightEnd + 1;
            while (nextP < str.length && /\s/.test(str[nextP])) nextP++;
            if (nextP < str.length && str[nextP] === '^') {
              nextP++;
              while (nextP < str.length && /\s/.test(str[nextP])) nextP++;
              if (nextP < str.length && str[nextP] === '{') {
                let d2 = 1;
                nextP++;
                while (nextP < str.length && d2 > 0) {
                  if (str[nextP] === '{') d2++;
                  else if (str[nextP] === '}') d2--;
                  nextP++;
                }
                rightEnd = nextP - 1;
              } else if (nextP < str.length && /[a-zA-Z0-9]/.test(str[nextP])) {
                while (nextP < str.length && /[a-zA-Z0-9]/.test(str[nextP])) nextP++;
                rightEnd = nextP - 1;
              }
            }
          }
        } else {
          let p = rightStart;
          while (p < str.length && /[a-zA-Z0-9_\\^]/.test(str[p])) p++;
          rightEnd = p - 1;
        }

        if (rightEnd < rightStart) continue;

        const numRaw = str.substring(leftStart, leftEnd + 1).trim();
        const denRaw = str.substring(rightStart, rightEnd + 1).trim();

        if (!numRaw || !denRaw) continue;

        // Clean outer parens if enclosing
        const cleanNum = stripOuterParensSafe(numRaw);
        const cleanDen = stripOuterParensSafe(denRaw);

        // Don't format dates like 2024/2025
        if (/^\d{4}$/.test(cleanNum) && /^\d{4}$/.test(cleanDen)) continue;

        const frac = `\\frac{${cleanNum}}{${cleanDen}}`;
        str = str.substring(0, leftStart) + frac + str.substring(rightEnd + 1);
        changed = true;
        break;
      }
    }
  }

  return str;
}

/**
 * Heals nested or stray $ inside math structures:
 * e.g. $\frac{t^2 f(x) - x^2 f(t)}{$t - x$}$ -> $\frac{t^2 f(x) - x^2 f(t)}{t - x}$
 */
export function healNestedDollars(text: string): string {
  let res = text;

  // Remove $ inside \frac{...}{...}
  res = res.replace(/\\frac\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, (match, num, den) => {
    const cleanNum = num.replace(/\$/g, '').trim();
    const cleanDen = den.replace(/\$/g, '').trim();
    return `\\frac{${cleanNum}}{${cleanDen}}`;
  });

  // Remove $ inside \lim_{...}
  res = res.replace(/\\lim_\{([^{}]*)\}/g, (_, cond) => `\\lim_{${cond.replace(/\$/g, '').trim()}}`);

  // Remove stray $ directly adjacent to math operators: e.g. =$1 -> = 1, +$2 -> + 2
  res = res.replace(/([=+\-<>])\s*\$\s*([0-9a-zA-Z])/g, '$1 $2');

  return res;
}

/**
 * Parses and converts Word linear format piecewise functions {█(...)┤ to LaTeX \begin{cases}...\end{cases}
 */
function reconstructLinearPiecewise(text: string): string {
  const startRegex = /(?:([a-zA-Z]\s*\([a-zA-Z0-9_]+\)\s*=)\s*)?(\{?\s*(?:█|\\matrix|\\eqarray|\\cases)\s*\()/g;

  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = startRegex.exec(text)) !== null) {
    const fullMatchStart = match.index;
    const lhs = match[1] || ''; // e.g. "f(x)="
    const marker = match[2];
    const contentStartIndex = match.index + match[0].length;

    // Scan forward using balanced parentheses
    let depth = 1;
    let contentEndIndex = -1;
    let inQuote = false;

    for (let i = contentStartIndex; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuote = !inQuote;
        continue;
      }
      if (!inQuote) {
        if (char === '(') {
          depth++;
        } else if (char === ')') {
          depth--;
          if (depth === 0) {
            contentEndIndex = i;
            break;
          }
        }
      }
    }

    if (contentEndIndex !== -1) {
      result += text.slice(lastIndex, fullMatchStart);

      const innerContent = text.slice(contentStartIndex, contentEndIndex);
      let afterParenIndex = contentEndIndex + 1;

      // Consume trailing closing markers like '┤' or matching '}'
      while (afterParenIndex < text.length && /[\s┤\}]/.test(text[afterParenIndex])) {
        if (text[afterParenIndex] === '┤' || (marker.includes('{') && text[afterParenIndex] === '}')) {
          afterParenIndex++;
        } else if (/\s/.test(text[afterParenIndex])) {
          afterParenIndex++;
        } else {
          break;
        }
      }

      // Convert inner rows to cases
      const reconstructedCases = convertRowsToCasesEnvironment(innerContent, lhs);
      result += `\n\n\\[\n${reconstructedCases}\n\\]\n\n`;

      lastIndex = afterParenIndex;
      startRegex.lastIndex = afterParenIndex;
    }
  }

  result += text.slice(lastIndex);
  return result;
}

/**
 * Converts piecewise row items separated by '@' into formatted LaTeX cases lines
 */
function convertRowsToCasesEnvironment(content: string, lhs: string): string {
  // Split rows by '@'
  const rawRows = content.split('@').map((r) => r.trim()).filter(Boolean);
  const formattedRows: string[] = [];

  for (let idx = 0; idx < rawRows.length; idx++) {
    const rawRow = rawRows[idx];

    // Strip leading alignment '&' marker if present
    let rowText = rawRow.replace(/^&/, '').trim();

    // Separate expression part from condition part
    let exprPart = rowText;
    let condPart = '';

    // Condition keywords
    const ifMatch = rowText.match(/^(.*?)(?:,\s*|\s+)?(?:"\s*if\s*"|,\s*" if "\s*|\bif\b|\bfor\b|\bwhen\b|यदि)\s*(.+)$/i);

    if (ifMatch) {
      exprPart = ifMatch[1].trim();
      condPart = ifMatch[2].trim();
    } else if (rowText.includes('&')) {
      // Column alignment marker separation
      const colParts = rowText.split('&');
      exprPart = colParts[0].trim();
      condPart = colParts.slice(1).join('&').trim();
    }

    // Clean quotes from condition
    condPart = condPart.replace(/^"|"$/g, '').trim();

    // Normalize expression part
    const cleanExpr = normalizePiecewiseMathPart(exprPart);

    // Normalize condition part
    const cleanCond = normalizePiecewiseCondPart(condPart);

    const isLast = idx === rawRows.length - 1;
    const rowSuffix = isLast ? '' : '\\\\[6pt]';

    if (cleanCond) {
      formattedRows.push(`${cleanExpr}, & ${cleanCond}${rowSuffix}`);
    } else {
      formattedRows.push(`${cleanExpr}${rowSuffix}`);
    }
  }

  const casesEnv = `\\begin{cases}\n${formattedRows.join('\n')}\n\\end{cases}`;
  return lhs ? `${lhs}\n${casesEnv}` : casesEnv;
}

/**
 * Normalizes mathematical expression parts inside piecewise rows
 */
export function normalizePiecewiseMathPart(expr: string): string {
  let s = expr;

  s = cleanInvisibleAndWordArtifacts(s);

  // Absolute value: |...| -> \left|...\right|
  s = s.replace(/\|([^|]+)\|/g, (_m, inner) => `\\left|${inner}\\right|`);

  // Nested roots: \sqrt(...) or √(...) -> \sqrt{...}
  s = s.replace(/(?:\\sqrt|√)\s*\(([^()]+(?:\([^()]+\)[^()]*)*)\)/g, (_m, p1) => `\\sqrt{${p1}}`);
  s = s.replace(/√([0-9a-zA-Z]+)/g, (_m, p1) => `\\sqrt{${p1}}`);

  // Trigonometric, logarithmic, and exponential functions
  s = s.replace(/(?<![\\a-zA-Z])(sin|cos|tan|cot|sec|csc|ln|log|exp)\b/g, (_m, p1) => `\\${p1}`);

  // Fractions inside parentheses e.g. \sin(-\pi x/2) -> \sin\left(-\dfrac{\pi x}{2}\right)
  s = s.replace(/(\\(?:sin|cos|tan|cot|sec|csc))\s*\(([^()]+)\)/g, (_m, trig, arg) => {
    let cleanArg = arg.trim();
    if (cleanArg.includes('/')) {
      const fracParts = cleanArg.split('/');
      if (fracParts.length === 2) {
        let num = fracParts[0].trim();
        const den = fracParts[1].trim();
        let sign = '';
        if (num.startsWith('-')) {
          sign = '-';
          num = num.slice(1).trim();
        }
        num = num.replace(/\s+/g, ' ').trim();
        return `${trig}\\left(${sign}\\dfrac{${num}}{${den}}\\right)`;
      }
    }
    return `${trig}(${cleanArg.replace(/\s+/g, ' ').trim()})`;
  });

  // Standardize existing \frac to \dfrac
  s = s.replace(/\\frac\{/g, () => '\\dfrac{');

  // Standalone fractions: A/B -> \dfrac{A}{B}
  s = s.replace(/(?<![a-zA-Z0-9_\\{}])(-?[0-9a-zA-Z\\^]+)\/([0-9a-zA-Z\\^]+)(?![a-zA-Z0-9_{}])/g, (_m, p1, p2) => `\\dfrac{${p1}}{${p2}}`);

  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * Normalizes condition parts inside piecewise rows
 */
export function normalizePiecewiseCondPart(cond: string): string {
  let s = cond;
  s = cleanInvisibleAndWordArtifacts(s);

  s = s.replace(/<=/g, '\\leq ');
  s = s.replace(/>=/g, '\\geq ');
  s = s.replace(/!=/g, '\\neq ');

  s = s.replace(/\s*(\\leq|\\geq|\\in|<|>|=)\s*/g, ' $1 ');
  s = s.replace(/\s+/g, ' ').trim();

  if (/^(?:otherwise|else|अन्यथा)$/i.test(s)) {
    return `\\text{${s}}`;
  }

  return s;
}

/**
 * Reconstructs Word Linear Format Matrices: [█(...)], [\matrix(...)], (\matrix(...)), |\matrix(...)|
 */
function reconstructLinearMatrices(text: string): string {
  return text.replace(
    /([\[\(|])\s*(?:█|\\matrix|\\eqarray)\s*\(([\s\S]*?)\)\s*([\]\)|])/g,
    (_fullMatch, openBracket, content, closeBracket) => {
      let env = 'bmatrix';
      if (openBracket === '(' || closeBracket === ')') env = 'pmatrix';
      if (openBracket === '|' || closeBracket === '|') env = 'vmatrix';

      // Split rows by '@'
      const rows = content.split('@').map((r: string) => {
        // In each row, columns are separated by '&'
        return r.trim().replace(/\s*&\s*/g, ' & ');
      });

      return `\\begin{${env}} ${rows.join(' \\\\ ')} \\end{${env}}`;
    }
  );
}
