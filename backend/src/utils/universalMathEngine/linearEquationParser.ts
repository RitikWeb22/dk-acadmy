/**
 * Mathematical Expression Reconstruction Layer (Layer D)
 * Comprehensive recursive and stack-based parser for:
 * - Word linear limits: (lim)┬(y→0), lim_(x→0), (lim)_(n→∞)
 * - Summations, products, integrals: (∑)┬(i=1)┴n, ∑_(i=1)^n, ∏, ∫
 * - Nested radicals: √(1+√(1+x^4)), ∛(...), ∜(...)
 * - Nested fractions: 1/(1+1/x), (A)/(B)
 * - Piecewise cases: {█(...)┤
 * - Matrices: [\matrix(...)], [█(...)], (\matrix(...)), |\matrix(...)|
 * - Absolute values: |x+1| <= 5 -> \left|x+1\right|\leq 5
 * - Trigonometric, logarithmic, and exponential functions
 * - Protection of existing valid LaTeX structures
 */

import { reconstructUnicodeMath, cleanInvisibleCharacters } from './unicodeMathReconstructor.js';

/**
 * Strips outer enclosing parentheses only when they truly wrap the entire string.
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
 * Reconstructs Word Linear Limits:
 * (lim)┬(y→0) or lim┬(y→0) or lim_(x→a) or (lim)_(n→∞)
 */
export function reconstructLimits(input: string): string {
  let text = input;

  // 1. Stacked operator notation: (lim)┬(y→0) or lim┬(y→0) or (lim)┴(y→0)
  text = text.replace(/(?:\(?\\?lim\)?)\s*[┬┴]\s*\(([^()]+)\)/gi, (_m, cond) => {
    const cleanCond = normalizeLimitCondition(cond);
    return `\\lim_{${cleanCond}}`;
  });

  // 2. Subscript notation: lim_(y→0) or (lim)_(y→0) or \lim_(y→0) or lim_{y→0}
  text = text.replace(/\\?lim_?\s*[\(\{\[]\s*([^)\}\]]+?)\s*[\)\}\]]/gi, (_m, cond) => {
    const cleanCond = normalizeLimitCondition(cond);
    return `\\lim_{${cleanCond}}`;
  });

  return text;
}

function normalizeLimitCondition(cond: string): string {
  let c = cond.trim();
  c = c.replace(/[→⟶]|->|\\to/g, ' \\to ');
  c = c.replace(/\\infty|\u221E|\binf\b/gi, '\\infty');
  // Destination fractions e.g. x \to 1/a -> x \to \frac{1}{a}
  c = c.replace(/([0-9a-zA-Z]+)\s*\/\s*([0-9a-zA-Z]+)/g, '\\frac{$1}{$2}');
  c = c.replace(/\s+/g, ' ').trim();
  c = c.replace(/\s*\\to\s*/g, ' \\to ');
  return c;
}

/**
 * Reconstructs Summations, Products, and Integrals:
 * (∑)┬(i=1)┴n or ∑_(i=1)^n or ∑_{i=1}^n
 */
export function reconstructNaryOperators(input: string): string {
  let text = input;

  // Word stacked summation/product: (∑)┬(i=1)┴n or (∑)┬(lower)┴(upper)
  text = text.replace(/(?:\(?\s*[∑\u2211]\s*\)?)\s*┬\s*\(([^()]+)\)\s*┴\s*([0-9a-zA-Z\(\)]+)/g, (_m, lower, upper) => {
    const cleanLower = stripOuterParensSafe(lower);
    const cleanUpper = stripOuterParensSafe(upper);
    return `\\sum_{${cleanLower}}^{${cleanUpper}}`;
  });

  text = text.replace(/(?:\(?\s*[∏\u220F]\s*\)?)\s*┬\s*\(([^()]+)\)\s*┴\s*([0-9a-zA-Z\(\)]+)/g, (_m, lower, upper) => {
    const cleanLower = stripOuterParensSafe(lower);
    const cleanUpper = stripOuterParensSafe(upper);
    return `\\prod_{${cleanLower}}^{${cleanUpper}}`;
  });

  // Linear subscript/superscript summation: ∑_(i=1)^n or ∑_{i=1}^{n}
  text = text.replace(/[∑\u2211]\s*_\s*[\(\{]([^()\{\}]+)[\)\}](?:\s*\^\s*[\(\{]?([0-9a-zA-Z_]+)[\)\}]?)?/g, (_m, lower, upper) => {
    const bLower = `_{${lower.trim()}}`;
    const bUpper = upper ? `^{${upper.trim()}}` : '';
    return `\\sum${bLower}${bUpper}`;
  });

  // Standalone ∑ -> \sum
  text = text.replace(/[∑\u2211]/g, '\\sum ');

  // Linear subscript/superscript product: ∏_(i=1)^n
  text = text.replace(/[∏\u220F]\s*_\s*[\(\{]([^()\{\}]+)[\)\}](?:\s*\^\s*[\(\{]?([0-9a-zA-Z_]+)[\)\}]?)?/g, (_m, lower, upper) => {
    const bLower = `_{${lower.trim()}}`;
    const bUpper = upper ? `^{${upper.trim()}}` : '';
    return `\\prod${bLower}${bUpper}`;
  });

  text = text.replace(/[∏\u220F]/g, '\\prod ');

  // Integrals with bounds: e.g. ∫_0^1, ∫_{0}^{1}, ∫_(0)^1, ∫_a^b, ∫ 0^1
  text = text.replace(/∫\s*(?:_\s*(?:\{([^{}]+)\}|\(([^()]+)\)|([0-9a-zA-Z\\]+)))?(?:\s*\^\s*(?:\{([^{}]+)\}|\(([^()]+)\)|([0-9a-zA-Z\\]+)))?/g,
    (_m, lBrace, lParen, lBare, uBrace, uParen, uBare) => {
      const lower = (lBrace || lParen || lBare || '').trim();
      const upper = (uBrace || uParen || uBare || '').trim();
      if (!lower && !upper) {
        return '\\int ';
      }
      const bLower = lower ? `_{${lower}}` : '';
      const bUpper = upper ? `^{${upper}}` : '';
      return `\\int${bLower}${bUpper} `;
    }
  );
  text = text.replace(/∫/g, '\\int ');

  return text;
}

/**
 * Recursive Parser for Radicals and Nested Square Roots:
 * Handles arbitrary nesting depths: √(1+√(1+x^4)) -> \sqrt{1+\sqrt{1+x^4}}
 * Handles cube root ∛ and 4th root ∜
 */
export function reconstructRadicals(input: string): string {
  if (!input) return '';

  let str = input;

  // Degree roots: ∛(x) -> \sqrt[3]{x}, ∜(x) -> \sqrt[4]{x}
  str = parseRadicalSymbolWithDegree(str, '∛', 3);
  str = parseRadicalSymbolWithDegree(str, '∜', 4);

  // Standard square root √ and \sqrt(
  return parseSquareRootsRecursively(str);
}

function parseRadicalSymbolWithDegree(text: string, symbol: string, degree: number): string {
  let str = text;
  let idx = str.indexOf(symbol);

  while (idx !== -1) {
    let nextPos = idx + symbol.length;
    while (nextPos < str.length && /\s/.test(str[nextPos])) nextPos++;

    if (nextPos < str.length && str[nextPos] === '(') {
      const matchParen = findMatchingParen(str, nextPos);
      if (matchParen !== -1) {
        const inner = str.substring(nextPos + 1, matchParen);
        const processedInner = reconstructRadicals(inner);
        const replacement = `\\sqrt[${degree}]{${processedInner}}`;
        str = str.substring(0, idx) + replacement + str.substring(matchParen + 1);
        idx = str.indexOf(symbol, idx + replacement.length);
        continue;
      }
    } else {
      // Single identifier or number e.g. ∛8
      let endPos = nextPos;
      while (endPos < str.length && /[0-9a-zA-Z]/.test(str[endPos])) endPos++;
      if (endPos > nextPos) {
        const token = str.substring(nextPos, endPos);
        const replacement = `\\sqrt[${degree}]{${token}}`;
        str = str.substring(0, idx) + replacement + str.substring(endPos);
        idx = str.indexOf(symbol, idx + replacement.length);
        continue;
      }
    }

    idx = str.indexOf(symbol, idx + symbol.length);
  }

  return str;
}

function parseSquareRootsRecursively(text: string): string {
  let str = text;

  // We scan for either '√' or '\sqrt(' (Word linear or unbraced LaTeX)
  let i = 0;
  while (i < str.length) {
    let isRad = false;
    let symLen = 0;

    if (str[i] === '√') {
      isRad = true;
      symLen = 1;
    } else if (str.startsWith('\\sqrt(', i)) {
      isRad = true;
      symLen = 5; // length of '\sqrt'
    }

    if (!isRad) {
      i++;
      continue;
    }

    let nextPos = i + symLen;
    while (nextPos < str.length && /\s/.test(str[nextPos])) nextPos++;

    if (nextPos < str.length && str[nextPos] === '(') {
      const closeParen = findMatchingParen(str, nextPos);
      if (closeParen !== -1) {
        const inner = str.substring(nextPos + 1, closeParen);
        // Recursively parse the inside of the square root
        const normalizedInner = parseSquareRootsRecursively(inner);
        const replacement = `\\sqrt{${normalizedInner.trim()}}`;
        str = str.substring(0, i) + replacement + str.substring(closeParen + 1);
        i += replacement.length;
        continue;
      }
    } else {
      // Bare token like √2, √17, √x, √π, √alpha
      let endPos = nextPos;
      if (endPos < str.length && str[endPos] === '\\') {
        endPos++;
        while (endPos < str.length && /[a-zA-Z]/.test(str[endPos])) endPos++;
      } else {
        while (endPos < str.length && /[0-9a-zA-Z\u0370-\u03FF]/.test(str[endPos])) endPos++;
      }

      if (endPos > nextPos) {
        const token = str.substring(nextPos, endPos);
        const replacement = `\\sqrt{${token}}`;
        str = str.substring(0, i) + replacement + str.substring(endPos);
        i += replacement.length;
        continue;
      }
    }

    i += symLen;
  }

  return str;
}

function findMatchingParen(str: string, openIndex: number): number {
  const openChar = str[openIndex];
  const closeChar = openChar === '(' ? ')' : openChar === '{' ? '}' : ']';
  let depth = 1;

  for (let i = openIndex + 1; i < str.length; i++) {
    if (str[i] === openChar) depth++;
    else if (str[i] === closeChar) {
      depth--;
      if (depth === 0) return i;
    }
  }

  return -1;
}

/**
 * Recursive Fraction Converter:
 * Robustly converts linear quotients A/B into \frac{A}{B}
 * Innermost-first evaluation preserves nested structures: 1/(1+1/x) -> \frac{1}{1+\frac{1}{x}}
 */
export function reconstructFractions(input: string): string {
  let str = input;

  // Process up to 15 iterations to resolve nested fraction structures
  let changed = true;
  let iterations = 0;

  while (changed && iterations < 15) {
    changed = false;
    iterations++;

    // Find a candidate slash '/'
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '/') {
        // Skip escaped slash or already inside LaTeX command
        if (i > 0 && str[i - 1] === '\\') continue;

        // 1. Scan Left: find boundary of numerator
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
            // Check for prefix identifier before opening paren: e.g. 16(...) or sin(...) or cos(...)
            let preEnd = leftStart - 1;
            while (preEnd >= 0 && /\s/.test(str[preEnd])) preEnd--;
            if (preEnd >= 0) {
              let pPre = preEnd;
              while (pPre >= 0 && /[a-zA-Z0-9_\\^']/.test(str[pPre])) pPre--;
              const token = str.substring(pPre + 1, preEnd + 1);
              const nonNumeratorPrefixes = new Set([
                'is', 'and', 'or', 'if', 'then', 'to', 'where', 'for', 'of', 'in',
                'int', '\\int', 'sum', '\\sum', 'prod', '\\prod', 'lim', '\\lim',
                'dx', 'dy', 'dt', 'dz'
              ]);
              if (token && !nonNumeratorPrefixes.has(token.toLowerCase())) {
                leftStart = pPre + 1;
              }
            }
          }
        } else if (str[leftEnd] === '}') {
          // Numerator ends with closing brace e.g. \sqrt{...} or {...}
          let depth = 1;
          let p = leftEnd - 1;
          while (p >= 0 && depth > 0) {
            if (str[p] === '}') depth++;
            else if (str[p] === '{') depth--;
            p--;
          }
          if (depth === 0) {
            leftStart = p + 1;
            // Check for LaTeX command before '{': \sqrt, \frac, \left|
            let preEnd = leftStart - 1;
            if (preEnd >= 0 && str[preEnd] === '^') {
              // Base with exponent e.g. (-1)^{n+1} or x^{2}
              preEnd--;
              while (preEnd >= 0 && /\s/.test(str[preEnd])) preEnd--;
              if (preEnd >= 0) {
                if (str[preEnd] === ')') {
                  let bDepth = 1;
                  let q = preEnd - 1;
                  while (q >= 0 && bDepth > 0) {
                    if (str[q] === ')') bDepth++;
                    else if (str[q] === '(') bDepth--;
                    q--;
                  }
                  if (bDepth === 0) preEnd = q;
                } else if (str[preEnd] === '}') {
                  let bDepth = 1;
                  let q = preEnd - 1;
                  while (q >= 0 && bDepth > 0) {
                    if (str[q] === '}') bDepth++;
                    else if (str[q] === '{') bDepth--;
                    q--;
                  }
                  if (bDepth === 0) preEnd = q;
                } else if (str[preEnd] === '|') {
                  let q = preEnd - 1;
                  while (q >= 0 && str[q] !== '|') q--;
                  if (q >= 0 && str[q] === '|') preEnd = q;
                } else {
                  while (preEnd >= 0 && /[a-zA-Z0-9_\\]/.test(str[preEnd])) preEnd--;
                }
                leftStart = preEnd + 1;
              }
            } else {
              while (preEnd >= 0 && /[a-zA-Z\\]/.test(str[preEnd])) preEnd--;
              leftStart = preEnd + 1;
            }
          }
        } else if (str[leftEnd] === '|') {
          let p = leftEnd - 1;
          while (p >= 0 && str[p] !== '|') p--;
          if (p >= 0 && str[p] === '|') {
            leftStart = p;
          }
        } else {
          // Simple identifier, constant, factorial or term e.g. 1, x, y^4, \pi, n!
          let p = leftEnd;
          while (p >= 0 && /[a-zA-Z0-9_\\^!]/.test(str[p])) p--;
          leftStart = p + 1;

          // If the token is a single variable letter (e.g. 'x' in '\pi x/2' or '2x/3'), check for leading coefficient
          const currentToken = str.substring(leftStart, leftEnd + 1);
          if (currentToken.length === 1 && /^[a-zA-Z]$/.test(currentToken)) {
            let testP = leftStart - 1;
            while (testP >= 0 && /\s/.test(str[testP])) testP--;
            if (testP >= 0) {
              let pPre = testP;
              while (pPre >= 0 && /[a-zA-Z0-9_\\]/.test(str[pPre])) pPre--;
              const prevWord = str.substring(pPre + 1, testP + 1);
              if (/^\\(?:partial|pi|alpha|beta|gamma|theta|lambda|mu|omega)$/i.test(prevWord) || /^[0-9]+$/.test(prevWord)) {
                leftStart = pPre + 1;
              }
            }
          }
        }

        if (leftStart < 0 || leftStart > leftEnd) continue;

        // 2. Scan Right: find boundary of denominator
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
        } else if (str[rightStart] === '{') {
          let depth = 1;
          let p = rightStart + 1;
          while (p < str.length && depth > 0) {
            if (str[p] === '{') depth++;
            else if (str[p] === '}') depth--;
            p++;
          }
          if (depth === 0) rightEnd = p - 1;
        } else if (str[rightStart] === '|') {
          let p = rightStart + 1;
          while (p < str.length && str[p] !== '|') p++;
          if (p < str.length && str[p] === '|') {
            rightEnd = p;
            let nextP = rightEnd + 1;
            while (nextP < str.length && /\s/.test(str[nextP])) nextP++;
            while (nextP < str.length && (str[nextP] === '^' || str[nextP] === '_')) {
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
              } else {
                break;
              }
              nextP = rightEnd + 1;
              while (nextP < str.length && /\s/.test(str[nextP])) nextP++;
            }
          }
        } else {
          let p = rightStart;
          if (str[p] === '\\') {
            p++;
            while (p < str.length && /[a-zA-Z]/.test(str[p])) p++;
            // Absorb optional bracket arguments e.g. \sqrt[3]{...}
            while (p < str.length && /\s/.test(str[p])) p++;
            if (p < str.length && str[p] === '[') {
              let bDepth = 1;
              p++;
              while (p < str.length && bDepth > 0) {
                if (str[p] === '[') bDepth++;
                else if (str[p] === ']') bDepth--;
                p++;
              }
            }
            // Absorb mandatory brace arguments e.g. \sqrt{...} or \frac{...}{...}
            while (p < str.length && /\s/.test(str[p])) p++;
            while (p < str.length && str[p] === '{') {
              let cDepth = 1;
              p++;
              while (p < str.length && cDepth > 0) {
                if (str[p] === '{') cDepth++;
                else if (str[p] === '}') cDepth--;
                p++;
              }
              while (p < str.length && /\s/.test(str[p])) p++;
            }
            // If macro is \partial, absorb following variable e.g. \partial x
            const cmd = str.substring(rightStart, p).trim();
            if (cmd === '\\partial') {
              let nextP = p;
              while (nextP < str.length && /\s/.test(str[nextP])) nextP++;
              if (nextP < str.length && /[a-zA-Z]/.test(str[nextP])) {
                p = nextP + 1;
              }
            }
          } else {
            while (p < str.length && /[a-zA-Z0-9_\\^!]/.test(str[p])) p++;
            // Check if identifier is a known function followed by parentheses argument e.g. det(A)
            const funcToken = str.substring(rightStart, p).trim();
            const isFunctionWithParen = /^(?:det|adj|tr|exp|log|ln|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|f|g|h|p|q)$/i.test(funcToken);
            if (isFunctionWithParen) {
              let testP = p;
              while (testP < str.length && /\s/.test(str[testP])) testP++;
              if (testP < str.length && str[testP] === '(') {
                let fDepth = 1;
                let q = testP + 1;
                while (q < str.length && fDepth > 0) {
                  if (str[q] === '(') fDepth++;
                  else if (str[q] === ')') fDepth--;
                  q++;
                }
                if (fDepth === 0) {
                  p = q;
                }
              }
            }
          }
          rightEnd = p - 1;
        }

        if (rightEnd < rightStart) continue;

        const numRaw = str.substring(leftStart, leftEnd + 1).trim();
        const denRaw = str.substring(rightStart, rightEnd + 1).trim();

        if (!numRaw || !denRaw) continue;

        // Strip outer parens
        const cleanNum = stripOuterParensSafe(numRaw);
        const cleanDen = stripOuterParensSafe(denRaw);

        // Don't convert dates (e.g. 2024/2025) or plain text paths
        if (/^\d{4}$/.test(cleanNum) && /^\d{4}$/.test(cleanDen)) continue;
        const proseWords = /^(?:and|or|true|false|if|then|where|when|in|on|at|to|for|is|are|of|by|not)$/i;
        if (proseWords.test(cleanNum) || proseWords.test(cleanDen)) continue;

        const frac = `\\frac{${cleanNum}}{${cleanDen}}`;
        str = str.substring(0, leftStart) + frac + str.substring(rightEnd + 1);
        changed = true;
        break; // Restart scan from beginning with updated string
      }
    }
  }

  return str;
}

/**
 * Reconstructs Word Linear Piecewise Cases: {█(...)┤
 */
export function reconstructPiecewiseCases(input: string): string {
  const startRegex = /(?:([a-zA-Z]+\s*\([a-zA-Z0-9_]+\)\s*=)\s*)?(\{?\s*(?:█|\\matrix|\\eqarray|\\cases)\s*\()/g;

  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = startRegex.exec(input)) !== null) {
    const fullMatchStart = match.index;
    const lhs = match[1] || '';
    const marker = match[2];
    const contentStartIndex = match.index + match[0].length;

    // Scan forward using balanced parentheses
    let depth = 1;
    let contentEndIndex = -1;
    let inQuote = false;

    for (let i = contentStartIndex; i < input.length; i++) {
      const char = input[i];
      if (char === '"') {
        inQuote = !inQuote;
        continue;
      }
      if (!inQuote) {
        if (char === '(') depth++;
        else if (char === ')') {
          depth--;
          if (depth === 0) {
            contentEndIndex = i;
            break;
          }
        }
      }
    }

    if (contentEndIndex !== -1) {
      result += input.slice(lastIndex, fullMatchStart);

      const innerContent = input.slice(contentStartIndex, contentEndIndex);
      let afterParenIndex = contentEndIndex + 1;

      // Consume trailing closing markers like '┤' or matching '}'
      while (afterParenIndex < input.length && /[\s┤\}]/.test(input[afterParenIndex])) {
        if (input[afterParenIndex] === '┤' || (marker.includes('{') && input[afterParenIndex] === '}')) {
          afterParenIndex++;
        } else if (/\s/.test(input[afterParenIndex])) {
          afterParenIndex++;
        } else {
          break;
        }
      }

      // Convert inner rows to LaTeX cases
      const reconstructedCases = formatPiecewiseRows(innerContent, lhs);
      result += `\n\n\\[\n${reconstructedCases}\n\\]\n\n`;

      lastIndex = afterParenIndex;
      startRegex.lastIndex = afterParenIndex;
    }
  }

  result += input.slice(lastIndex);
  return result;
}

function formatPiecewiseRows(content: string, lhs: string): string {
  const rawRows = content.split('@').map((r) => r.trim()).filter(Boolean);
  const formattedRows: string[] = [];

  for (let idx = 0; idx < rawRows.length; idx++) {
    const rawRow = rawRows[idx];
    let rowText = rawRow.replace(/^&/, '').trim();

    let exprPart = rowText;
    let condPart = '';

    const ifMatch = rowText.match(/^(.*?)(?:,\s*|\s+)?(?:"\s*if\s*"|,\s*" if "\s*|\bif\b|\bfor\b|\bwhen\b|यदि)\s*(.+)$/i);
    const otherwiseMatch = !ifMatch ? rowText.match(/^(.*?)(?:,\s*|\s+)?(?:"\s*(?:otherwise|else)\s*"|\botherwise\b|\belse\b|अन्यथा)\s*"?$/i) : null;
    if (ifMatch) {
      exprPart = ifMatch[1].replace(/[,"]+$/g, '').trim();
      condPart = ifMatch[2].replace(/^[,"]+|[,"]+$/g, '').trim();
    } else if (otherwiseMatch) {
      exprPart = otherwiseMatch[1].replace(/[,"]+$/g, '').trim();
      condPart = 'otherwise';
    } else if (rowText.includes('&')) {
      const colParts = rowText.split('&');
      exprPart = colParts[0].replace(/[,"]+$/g, '').trim();
      condPart = colParts.slice(1).join('&').replace(/^[,"]+|[,"]+$/g, '').trim();
    }

    condPart = condPart.replace(/^"|"$/g, '').trim();

    const cleanExpr = normalizeLinearMathPart(exprPart);
    const cleanCond = normalizeLinearCondPart(condPart);

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

function normalizeLinearMathPart(expr: string): string {
  let s = expr;
  s = cleanInvisibleCharacters(s);
  s = reconstructUnicodeMath(s);

  // Absolute value: |...| -> \left|...\right|
  s = s.replace(/\|([^|]+)\|/g, (_m, inner) => `\\left|${inner}\\right|`);

  // Radicals
  s = reconstructRadicals(s);

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

  // Fractions
  s = reconstructFractions(s);

  // Standardize fractions in piecewise display mode to \dfrac
  s = s.replace(/\\frac\{/g, '\\dfrac{');

  return s.trim();
}

function normalizeLinearCondPart(cond: string): string {
  let s = cond;
  s = cleanInvisibleCharacters(s);
  s = reconstructUnicodeMath(s);

  s = s.replace(/<=/g, '\\leq ');
  s = s.replace(/>=/g, '\\geq ');
  s = s.replace(/!=/g, '\\neq ');
  s = s.replace(/\s*(\\leq|\\geq|\\in|<|>|=)\s*/g, ' $1 ');

  if (/^(?:otherwise|else|अन्यथा)$/i.test(s.trim())) {
    return `\\text{${s.trim()}}`;
  }

  return s.trim();
}

/**
 * Reconstructs Word Linear Matrices:
 * [\matrix(...)], [█(...)], (\matrix(...)), |\matrix(...)|
 */
export function reconstructMatrices(input: string): string {
  return input.replace(
    /([\[\(|])\s*(?:█|\\matrix|\\eqarray)\s*\(([\s\S]*?)\)\s*([\]\)|])/g,
    (_fullMatch, openBracket, content, closeBracket) => {
      let env = 'bmatrix';
      if (openBracket === '(' || closeBracket === ')') env = 'pmatrix';
      if (openBracket === '|' || closeBracket === '|') env = 'vmatrix';

      const rows = content.split('@').map((r: string) => {
        return r.trim().replace(/\s*&\s*/g, ' & ');
      });

      return `\\begin{${env}} ${rows.join(' \\\\ ')} \\end{${env}}`;
    }
  );
}

/**
 * Normalizes Absolute Values:
 * |x+1| <= 5 -> \left|x+1\right|\leq 5
 */
export function reconstructAbsoluteValues(input: string): string {
  // Only match balanced vertical bars around math terms without conflicting with LaTeX \left| or \right|
  return input.replace(/(?<!\\left\s*)\|([a-zA-Z0-9_\+\-\*\/\^\s\\\{\}\(\)']+?)\|(?!\\right)/g, (match, inner) => {
    // Avoid matching bitwise OR or prose bars
    if (inner.includes('\n') || inner.length > 80) return match;
    const cleanInner = inner.trim();
    if (!cleanInner) return match;
    return `\\left|${cleanInner}\\right|`;
  });
}

/**
 * Master Linear Equation Reconstructor
 * Connects all Layer D parsers in optimal mathematical dependency sequence
 */
export function reconstructLinearEquation(input: string): string {
  if (!input) return '';

  let text = input;

  // 1. Remove leading dot artifacts: e.g. ". Let" or "1. Let"
  text = text.replace(/^\s*(?:\d+\.|\.)\s*(?=[A-Za-z\u0900-\u097F])/g, '');

  // 2. Clean invisible chars & normalize basic math Unicode
  text = cleanInvisibleCharacters(text);

  // 3. Domain mappings: f:R→R -> \(f:\mathbb{R}\to\mathbb{R}\)
  text = text.replace(
    /\b([a-zA-Z])\s*:\s*(?:\\mathbb\{R\}|\bR\b)\s*(?:→|->|\\to)\s*(?:\\mathbb\{R\}|\bR\b)\b/g,
    '\\($1:\\mathbb{R}\\to\\mathbb{R}\\)'
  );

  // 4. Reconstruct Limits
  text = reconstructLimits(text);

  // 5. Reconstruct Summations, Products, Integrals
  text = reconstructNaryOperators(text);

  // 6. Reconstruct Linear Format Matrices
  text = reconstructMatrices(text);

  // 7. Reconstruct Linear Format Piecewise Cases
  text = reconstructPiecewiseCases(text);

  // 8. Reconstruct Radicals & Nested Square Roots
  text = reconstructRadicals(text);

  // 8.5 Reconstruct standard mathematical functions: sin, cos, tan, etc.
  text = text.replace(/(?<![\\a-zA-Z])(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|ln|log|exp)\b(?=\s*[\^_\(\{\\\|0-9a-zA-Z\u0370-\u03FF])/g, (_m, p1) => `\\${p1}`);

  // 9. Reconstruct Unicode Superscripts, Subscripts, Greek, and Operators
  text = reconstructUnicodeMath(text);

  // 9.5 Normalize parenthesized exponents and subscripts: ^(bx) -> ^{bx}, _(n+1) -> _{n+1}
  text = text.replace(/\^\s*\(([^()]+)\)/g, '^{$1}');
  text = text.replace(/_\s*\(([^()]+)\)/g, '_{$1}');

  // 10. Reconstruct Fractions & Nested Quotients
  text = reconstructFractions(text);

  // 11. Normalize Absolute Values
  text = reconstructAbsoluteValues(text);

  // 12. Clean dangling legacy structural tokens if any slip through
  text = text.replace(/[█┤]/g, '');

  return text.trim();
}
