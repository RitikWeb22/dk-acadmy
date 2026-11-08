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

import { reconstructUnicodeMath, cleanInvisibleCharacters } from './unicodeMathReconstructor';

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
 * Robust matching parenthesis finder supporting (), {}, []
 */
export function findMatchingDelimiter(str: string, openIndex: number): number {
  const openChar = str[openIndex];
  const closeMap: Record<string, string> = { '(': ')', '{': '}', '[': ']' };
  const closeChar = closeMap[openChar];
  if (!closeChar) return -1;

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
 * Reconstructs Word Linear Limits:
 * (lim)┬(y→0) or lim┬(y→0) or lim_(x→a) or (lim)_(n→∞)
 */
export function reconstructLimits(input: string): string {
  let text = input;

  // 1. Stacked operator notation: (lim)┬(y→0) or lim┬(y→0) or (lim)┴(y→0)
  text = text.replace(/(?:\(?\\?lim\)?)\s*[┬┴]\s*\(([^()]+)\)/gi, (_m, cond) => {
    return `\\lim_{${normalizeLimitCondition(cond)}}`;
  });

  // 2. Subscript notation: lim_(y→0) or (lim)_(y→0) or \lim_(y→0) or lim_{y→0}
  text = text.replace(/(?:\\?lim|\(lim\))_?\s*([({[])\s*([^)}\]]+?)\s*([)}\]])/gi, (_m, open, cond, close) => {
    const validPairs: Record<string, string> = { '(': ')', '{': '}', '[': ']' };
    if (validPairs[open] !== close) return _m;
    return `\\lim_{${normalizeLimitCondition(cond)}}`;
  });

  return text;
}

function normalizeLimitCondition(cond: string): string {
  let c = cond.trim();
  c = c.replace(/[→⟶]|->|(?<!\\)to\b/g, ' \\to ');
  c = c.replace(/\\infty|\u221E|\binf\b/gi, '\\infty');
  // Simple fractions in limits: x \to 1/2 -> x \to \frac{1}{2}
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

  // Word stacked summation/product: (∑)┬(lower)┴(upper)
  text = text.replace(/(?:\(?\s*[∑\u2211]\s*\)?)\s*┬\s*\(([^()]+)\)\s*┴\s*([0-9a-zA-Z()\\{}_^]+)/g, (_m, lower, upper) => {
    return `\\sum_{${stripOuterParensSafe(lower)}}^{${stripOuterParensSafe(upper)}}`;
  });

  text = text.replace(/(?:\(?\s*[∏\u220F]\s*\)?)\s*┬\s*\(([^()]+)\)\s*┴\s*([0-9a-zA-Z()\\{}_^]+)/g, (_m, lower, upper) => {
    return `\\prod_{${stripOuterParensSafe(lower)}}^{${stripOuterParensSafe(upper)}}`;
  });

  // Quoted subscript summation: ∑_"aes " -> \sum_{a \in S}
  text = text.replace(/[∑\u2211]\s*_\s*"([^"]+)"/g, (_m, lower) => {
    const cleanLower = lower.trim();
    const normLower = /^aes$/i.test(cleanLower) ? 'a \\in S' : cleanLower;
    return `\\sum_{${normLower}} `;
  });

  // Linear subscript/superscript summation: ∑_(i=1)^n or ∑_{i=1}^{n}
  text = text.replace(/[∑\u2211]\s*_\s*([({])([^(){}]+)([)}])(?:\s*\^\s*([({]?)([0-9a-zA-Z_+-\\^]+)([)}]?))?/g, (_m, _o1, lower, _c1, _o2, upper) => {
    const cleanLower = lower.trim();
    const normLower = /^"?aes"?$/i.test(cleanLower) ? 'a \\in S' : cleanLower;
    const bLower = `_{${normLower}}`;
    const bUpper = upper ? `^{${stripOuterParensSafe(upper.trim())}}` : '';
    return `\\sum${bLower}${bUpper}`;
  });

  // Bare token subscript summation: ∑_aes or ∑_i
  text = text.replace(/[∑\u2211]\s*_\s*([a-zA-Z0-9]+)(?:\s*\^\s*([a-zA-Z0-9]+))?/g, (_m, lower, upper) => {
    const normLower = /^aes$/i.test(lower) ? 'a \\in S' : lower;
    const bUpper = upper ? `^{${upper}}` : '';
    return `\\sum_{${normLower}}${bUpper} `;
  });

  text = text.replace(/[∑\u2211]/g, '\\sum ');

  // Linear subscript/superscript product: ∏_(i=1)^n
  text = text.replace(/[∏\u220F]\s*_\s*([({])([^(){}]+)([)}])(?:\s*\^\s*([({]?)([0-9a-zA-Z_+-\\^]+)([)}]?))?/g, (_m, _o1, lower, _c1, _o2, upper) => {
    const bLower = `_{${lower.trim()}}`;
    const bUpper = upper ? `^{${stripOuterParensSafe(upper.trim())}}` : '';
    return `\\prod${bLower}${bUpper}`;
  });

  text = text.replace(/[∏\u220F]/g, '\\prod ');

  // Integrals with bounds: ∫_0^1, ∫_{0}^{1}, ∫_(0)^1, ∫_a^b
  text = text.replace(/∫\s*(?:_\s*(?:\{([^{}]+)\}|\(([^()]+)\)|([0-9a-zA-Z\\]+)))?(?:\s*\^\s*(?:\{([^{}]+)\}|\(([^()]+)\)|([0-9a-zA-Z\\]+)))?/g,
    (_m, lBrace, lParen, lBare, uBrace, uParen, uBare) => {
      const lower = (lBrace || lParen || lBare || '').trim();
      const upper = (uBrace || uParen || uBare || '').trim();
      if (!lower && !upper) return '\\int ';
      const bLower = lower ? `_{${lower}}` : '';
      const bUpper = upper ? `^{${upper}}` : '';
      return `\\int${bLower}${bUpper} `;
    }
  );
  text = text.replace(/∫/g, '\\int ');

  return text;
}

/**
 * Recursive Parser for Radicals and Nested Square Roots
 */
export function reconstructRadicals(input: string): string {
  if (!input) return '';

  let str = input;
  str = parseRadicalSymbolWithDegree(str, '∛', 3);
  str = parseRadicalSymbolWithDegree(str, '∜', 4);
  return parseSquareRootsRecursively(str);
}

function parseRadicalSymbolWithDegree(text: string, symbol: string, degree: number): string {
  let str = text;
  let idx = str.indexOf(symbol);

  while (idx !== -1) {
    let nextPos = idx + symbol.length;
    while (nextPos < str.length && /\s/.test(str[nextPos])) nextPos++;

    if (nextPos < str.length && str[nextPos] === '(') {
      const matchParen = findMatchingDelimiter(str, nextPos);
      if (matchParen !== -1) {
        const inner = str.substring(nextPos + 1, matchParen);
        const processedInner = reconstructRadicals(inner);
        const replacement = `\\sqrt[${degree}]{${processedInner}}`;
        str = str.substring(0, idx) + replacement + str.substring(matchParen + 1);
        idx = str.indexOf(symbol, idx + replacement.length);
        continue;
      }
    } else {
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
  let i = 0;

  while (i < str.length) {
    let isRad = false;
    let symLen = 0;

    if (str[i] === '√') {
      isRad = true;
      symLen = 1;
    } else if (str.startsWith('\\sqrt(', i)) {
      isRad = true;
      symLen = 5;
    }

    if (!isRad) {
      i++;
      continue;
    }

    let nextPos = i + symLen;
    while (nextPos < str.length && /\s/.test(str[nextPos])) nextPos++;

    if (nextPos < str.length && str[nextPos] === '(') {
      const closeParen = findMatchingDelimiter(str, nextPos);
      if (closeParen !== -1) {
        const inner = str.substring(nextPos + 1, closeParen);
        const normalizedInner = parseSquareRootsRecursively(inner);
        const replacement = `\\sqrt{${normalizedInner.trim()}}`;
        str = str.substring(0, i) + replacement + str.substring(closeParen + 1);
        i += replacement.length;
        continue;
      }
    } else {
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

/**
 * Recursive Fraction Converter: converts A/B into \frac{A}{B}
 */
export function reconstructFractions(input: string): string {
  let str = input;
  let changed = true;
  let iterations = 0;

  while (changed && iterations < 20) {
    changed = false;
    iterations++;

    for (let i = 0; i < str.length; i++) {
      if (str[i] !== '/') continue;

      // Skip escaped slash or comments
      if (i > 0 && str[i - 1] === '\\') continue;

      // Skip slashes inside text macros like \text{...} or \mathrm{...}
      const openStack: number[] = [];
      for (let k = 0; k < i; k++) {
        if (str[k] === '{' && (k === 0 || str[k - 1] !== '\\')) openStack.push(k);
        else if (str[k] === '}' && (k === 0 || str[k - 1] !== '\\')) openStack.pop();
      }
      if (openStack.length > 0) {
        const innerOpen = openStack[openStack.length - 1];
        const beforeBrace = str.slice(Math.max(0, innerOpen - 16), innerOpen);
        if (/\\(?:text|mathrm|operatorname)\s*$/.test(beforeBrace)) continue;
      }

      // 1. Scan Left: boundary of numerator
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
      } else if (str[leftEnd] === '|') {
        let p = leftEnd - 1;
        while (p >= 0 && str[p] !== '|') p--;
        if (p >= 0) leftStart = p;
      } else if (str[leftEnd] === '}') {
        let depth = 1;
        let p = leftEnd - 1;
        while (p >= 0 && depth > 0) {
          if (str[p] === '}') depth++;
          else if (str[p] === '{') depth--;
          p--;
        }
        if (depth === 0) {
          leftStart = p + 1;
          let preEnd = leftStart - 1;
          if (preEnd >= 0 && str[preEnd] === '^') {
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
              } else if (str[preEnd] === '|') {
                let q = preEnd - 1;
                while (q >= 0 && str[q] !== '|') q--;
                if (q >= 0) preEnd = q - 1;
              } else {
                while (preEnd >= 0 && /[a-zA-Z0-9_\\]/.test(str[preEnd])) preEnd--;
              }
              leftStart = preEnd + 1;
            }
          } else {
            while (preEnd >= 0 && (str[preEnd] === '}' || str[preEnd] === ']')) {
              const closeCh = str[preEnd];
              const openCh = closeCh === '}' ? '{' : '[';
              let d2 = 1;
              let q = preEnd - 1;
              while (q >= 0 && d2 > 0) {
                if (str[q] === closeCh) d2++;
                else if (str[q] === openCh) d2--;
                q--;
              }
              if (d2 === 0) preEnd = q;
              else break;
            }
            while (preEnd >= 0 && /[a-zA-Z\\]/.test(str[preEnd])) preEnd--;
            leftStart = preEnd + 1;
          }
        }
      } else {
        let p = leftEnd;
        while (p >= 0 && /[a-zA-Z0-9_\\^!]/.test(str[p])) p--;
        leftStart = p + 1;
        if (leftStart <= leftEnd && str[leftStart] === '^' && leftStart > 0 && str[leftStart - 1] === '|') {
          let q = leftStart - 2;
          while (q >= 0 && str[q] !== '|') q--;
          if (q >= 0) leftStart = q;
        }

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

      // 2. Scan Right: boundary of denominator
      let rightStart = i + 1;
      while (rightStart < str.length && /\s/.test(str[rightStart])) rightStart++;
      if (rightStart >= str.length) continue;

      let rightEnd = -1;
      if (str[rightStart] === '(') {
        const closeParen = findMatchingDelimiter(str, rightStart);
        if (closeParen !== -1) {
          rightEnd = closeParen;
          let nextP = rightEnd + 1;
          while (nextP < str.length && /\s/.test(str[nextP])) nextP++;
          if (nextP < str.length && str[nextP] === '^') {
            nextP++;
            while (nextP < str.length && /\s/.test(str[nextP])) nextP++;
            if (nextP < str.length && str[nextP] === '{') {
              const closeBrace = findMatchingDelimiter(str, nextP);
              if (closeBrace !== -1) rightEnd = closeBrace;
            } else if (nextP < str.length && /[a-zA-Z0-9]/.test(str[nextP])) {
              while (nextP < str.length && /[a-zA-Z0-9]/.test(str[nextP])) nextP++;
              rightEnd = nextP - 1;
            }
          }
        }
      } else if (str[rightStart] === '|') {
        let p = rightStart + 1;
        while (p < str.length && str[p] !== '|') p++;
        if (p < str.length) {
          rightEnd = p;
          let nextP = rightEnd + 1;
          while (nextP < str.length && /\s/.test(str[nextP])) nextP++;
          if (nextP < str.length && str[nextP] === '^') {
            nextP++;
            while (nextP < str.length && /\s/.test(str[nextP])) nextP++;
            if (nextP < str.length && str[nextP] === '{') {
              const closeBrace = findMatchingDelimiter(str, nextP);
              if (closeBrace !== -1) rightEnd = closeBrace;
            } else if (nextP < str.length && /[a-zA-Z0-9]/.test(str[nextP])) {
              while (nextP < str.length && /[a-zA-Z0-9]/.test(str[nextP])) nextP++;
              rightEnd = nextP - 1;
            }
          }
        }
      } else if (str[rightStart] === '{') {
        const closeBrace = findMatchingDelimiter(str, rightStart);
        if (closeBrace !== -1) rightEnd = closeBrace;
      } else {
        let p = rightStart;
        if (str[p] === '\\') {
          let cmdEnd = p + 1;
          while (cmdEnd < str.length && /[a-zA-Z]/.test(str[cmdEnd])) cmdEnd++;
          const cmdName = str.substring(p + 1, cmdEnd);
          let afterCmd = cmdEnd;
          while (afterCmd < str.length && /\s/.test(str[afterCmd])) afterCmd++;
          if (afterCmd < str.length && (str[afterCmd] === '[' || str[afterCmd] === '{')) {
            p = afterCmd;
            if (p < str.length && str[p] === '[') {
              const cb = findMatchingDelimiter(str, p);
              if (cb !== -1) p = cb + 1;
            }
            while (p < str.length) {
              let ws = p;
              while (ws < str.length && /\s/.test(str[ws])) ws++;
              if (ws < str.length && str[ws] === '{') {
                const cb = findMatchingDelimiter(str, ws);
                if (cb !== -1) {
                  p = cb + 1;
                } else {
                  break;
                }
              } else {
                break;
              }
            }
          } else {
            while (p < str.length && /[a-zA-Z0-9_\\^!]/.test(str[p])) p++;
            if (/^(?:partial|Delta|nabla)$/.test(cmdName)) {
              let q = p;
              while (q < str.length && /\s/.test(str[q])) q++;
              if (q < str.length && /[a-zA-Z0-9_^]/.test(str[q])) {
                while (q < str.length && /[a-zA-Z0-9_\\^!]/.test(str[q])) q++;
                p = q;
              }
            }
          }
        } else {
          while (p < str.length && /[a-zA-Z0-9_\\^!]/.test(str[p])) p++;
          const fnToken = str.substring(rightStart, p);
          if (
            p > rightStart &&
            p < str.length &&
            str[p] === '(' &&
            !/^d(?:[a-zA-Z]|\\[a-zA-Z]+)(?:\^[0-9a-zA-Z{}]+)?$/.test(fnToken)
          ) {
            const closeParen = findMatchingDelimiter(str, p);
            if (closeParen !== -1) {
              p = closeParen + 1;
            }
          }
        }
        rightEnd = p - 1;
      }

      if (rightEnd < rightStart) continue;

      const numRaw = str.substring(leftStart, leftEnd + 1).trim();
      const denRaw = str.substring(rightStart, rightEnd + 1).trim();

      if (!numRaw || !denRaw) continue;

      const cleanNum = stripOuterParensSafe(numRaw);
      const cleanDen = stripOuterParensSafe(denRaw);

      // Guard against dates and natural English stop-words
      if (/^\d{4}$/.test(cleanNum) && /^\d{4}$/.test(cleanDen)) continue;
      const proseWords = /^(?:and|or|true|false|if|then|where|when|in|on|at|to|for|is|are|of|by|not)$/i;
      if (proseWords.test(cleanNum) || proseWords.test(cleanDen)) continue;

      // Recursively convert inner fractions within numerator and denominator
      const innerNum = reconstructFractions(cleanNum);
      const innerDen = reconstructFractions(cleanDen);
      const frac = `\\frac{${innerNum}}{${innerDen}}`;
      str = str.substring(0, leftStart) + frac + str.substring(rightEnd + 1);
      changed = true;
      break;
    }
  }

  return str;
}

/**
 * Reconstructs Word Linear Piecewise Cases: {█(...)┤ or {■(...)┤
 */
export function reconstructPiecewiseCases(input: string): string {
  const startRegex = /(?:([a-zA-Z]+\s*\([a-zA-Z0-9_]+\)\s*=)\s*)?(\{?\s*(?:[█■]|\\matrix|\\eqarray|\\cases)\s*\()/g;

  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = startRegex.exec(input)) !== null) {
    const fullMatchStart = match.index;
    const lhs = match[1] || '';
    const contentStartIndex = match.index + match[0].length;

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

      while (afterParenIndex < input.length && /[\s┤}]/.test(input[afterParenIndex])) {
        afterParenIndex++;
      }

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
    const rowText = rawRow.replace(/^&/, '').trim();

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
  let s = cleanInvisibleCharacters(expr);
  s = reconstructUnicodeMath(s);
  s = s.replace(/\|([^|]+)\|/g, (_m, inner) => `\\left|${inner}\\right|`);
  s = reconstructRadicals(s);

  // Corrupted floor bracket paired with closing brace: min⌊f(t)} -> \min\{f(t)\}
  s = s.replace(/⌊([^⌋}]+)}/g, '\\{$1\\}');
  s = s.replace(/\\lfloor([^⌋}]+)\}/g, '\\{$1\\}');
  s = s.replace(/\{([^}]+)⌋/g, '\\{$1\\}');
  s = s.replace(/\\{([^}]+)\\rfloor/g, '\\{$1\\}');

  // Escaping known math functions safely (including min, max, lim, sup, inf, gcd, lcm, det)
  s = s.replace(/(?<![\\a-zA-Z])(sin|cos|tan|cot|sec|csc|ln|log|exp|min|max|lim|sup|inf|gcd|lcm|det)\b(?![a-zA-Z])/g, '\\$1');

  // Fractions inside parentheses
  s = s.replace(/(\\(?:sin|cos|tan|cot|sec|csc))\s*\(([^()]+)\)/g, (_m, trig, arg) => {
    const cleanArg = arg.trim();
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
        return `${trig}\\left(${sign}\\dfrac{${num}}{${den}}\\right)`;
      }
    }
    return `${trig}(${cleanArg})`;
  });

  s = reconstructFractions(s);
  s = s.replace(/\\frac\{/g, '\\dfrac{');
  return s.trim();
}

function normalizeLinearCondPart(cond: string): string {
  let s = cleanInvisibleCharacters(cond);
  s = reconstructUnicodeMath(s);

  // Quotes around text in conditions: e.g. " and " -> \text{ and }
  s = s.replace(/"\s*([^"]+?)\s*"/g, (_m, word) => {
    const cleanWord = word.trim();
    if (!cleanWord) return ' ';
    return ` \\text{ ${cleanWord} } `;
  });
  s = s.replace(/["']\s*["']/g, ' ');

  // English words in conditions
  s = s.replace(/(?<!\\text\{\s*)(?<=[0-9a-zA-Z\s>≤<≥=])\b(and|if|for|when|where|or)\b(?=[0-9a-zA-Z\s>≤<≥=])(?!\s*\})/g, '\\text{ $1 }');
  s = s.replace(/\\text\{\s*\\text\{\s*([^}]+)\s*\}\s*\}/g, '\\text{ $1 }');
  s = s.replace(/\\text\{\s*([a-zA-Z]+)\s*\}\s*\\text\{\s*([a-zA-Z]+)\s*\}/g, '\\text{ $1 $2 }');

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
    /([[(|])\s*(?:[█■]|\\matrix|\\eqarray)\s*\(([\s\S]*?)\)\s*([\])|])/g,
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
  return input.replace(/(?<!\\left\s*)\|([a-zA-Z0-9_+*/^\\\s{}()'-]+?)\|(?!\\right)/g, (match, inner) => {
    if (inner.includes('\n') || inner.length > 80) return match;
    const cleanInner = inner.trim();
    if (!cleanInner) return match;
    return `\\left|${cleanInner}\\right|`;
  });
}

/**
 * Master Linear Equation Reconstructor
 */

/**
 * Real LaTeX command tokens: these indicate the string has already been
 * converted to LaTeX and must not be re-processed through the linear/Unicode
 * pipeline. Word linear-notation tokens like \matrix and \eqarray are
 * intentionally excluded from this set so they are still converted.
 */
const REAL_LATEX_COMMAND = /\\(?:frac|dfrac|tfrac|sqrt|lim|sum|prod|int|infty|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|pi|sigma|phi|omega|Gamma|Delta|Theta|Lambda|Sigma|Phi|Omega|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|ln|log|exp|vec|hat|bar|dot|ddot|tilde|overset|underset|mathbb|mathrm|mathbf|text|begin|end|left|right|leq|geq|neq|approx|times|div|pm|mp|cdot|to|rightarrow|leftarrow|Rightarrow|Leftarrow|in|subset|supset|cup|cap|partial|nabla|hbar|binom|boxed|cancel|phantom|quad|qquad)(?![a-zA-Z])/;

function normalizeParenthesizedScripts(input: string): string {
  let str = input;
  let i = 0;
  while (i < str.length) {
    if (str[i] === '^' || str[i] === '_') {
      const op = str[i];
      let j = i + 1;
      while (j < str.length && /\s/.test(str[j])) j++;
      if (j < str.length && str[j] === '(') {
        const closeParen = findMatchingDelimiter(str, j);
        if (closeParen !== -1) {
          const inner = stripOuterParensSafe(str.substring(j + 1, closeParen));
          const replacement = `${op}{${inner}}`;
          str = str.substring(0, i) + replacement + str.substring(closeParen + 1);
          i += replacement.length;
          continue;
        }
      }
    }
    i++;
  }
  return str;
}

export function reconstructLinearEquation(input: string): string {
  if (!input) return '';

  // Spacing quotes: Word and user typing often uses " " or "" or ' ' for spacing, e.g. 8" " m+12n -> 8 m+12n
  let pre = input.replace(/([0-9]+)\s*["']\s*["']\s*([a-zA-Z])/g, '$1 $2');
  pre = pre.replace(/([a-zA-Z])\s*["']\s*["']\s*([0-9a-zA-Z])/g, '$1 $2');
  pre = pre.replace(/"\s*"/g, ' ').replace(/'\s+'/g, ' ');
  pre = pre.replace(/([0-9a-zA-Z])\s*\\,\s*(?=[0-9a-zA-Z])/g, '$1 ');

  const already = pre.trim();

  // If the text already contains real LaTeX commands (output of ommlNodeToLatex / convertHtmlWithMath),
  // skip the linear and Unicode conversion steps that would corrupt existing LaTeX.
  // We still run paren-exponent normalisation and strip leftover Word tokens,
  // but we do NOT skip matrix/piecewise reconstruction (\matrix, \eqarray are Word linear artifacts).
  if (REAL_LATEX_COMMAND.test(already)) {
    let text = pre;
    // Remove leading numbering/dot artifacts
    text = text.replace(/^\s*(?:\d+\.|\.)\s*(?=[A-Za-z\u0900-\u097F])/g, '');
    // Strip empty Word answer-box placeholder □( )
    text = text.replace(/□\s*\(\s*\)/g, '');
    // Repair 'ea' OCR artifact for e^a in JEE questions
    text = text.replace(/\bvalue of\s+\$?ea\$?(?![a-zA-Z^])/gi, 'value of $e^{a}$');
    // Convert any remaining raw Unicode n-ary operators (∑, ∏, ∫)
    if (/[∑∏∫\u2211\u220F\u222B]/.test(text)) {
      text = reconstructNaryOperators(text);
    }
    // Convert standalone numeric fractions in options like (A) 1/3 outside LaTeX braces
    text = text.replace(/(\([A-Da-d1-4]\)\s*)(-?\d+)\s*\/\s*(\d+)\b/g, '$1\\frac{$2}{$3}');
    // Normalise parenthesized exponents/subscripts that may survive OMML conversion
    text = normalizeParenthesizedScripts(text);
    // Brace unbraced \sqrt or \frac in superscripts/subscripts
    text = text.replace(/([\^_])\s*(\\sqrt(?:\[[^\]]*\])?\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g, '$1{$2}');
    text = text.replace(/([\^_])\s*(\\(?:d?frac)\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g, '$1{$2}');
    // Strip leftover Word linear formatting tokens
    text = text.replace(/[█■┤□▒]/g, '');
    return text.trim();
  }

  let text = pre;

  // 1. Remove leading numbering/dot artifacts, Word equation placeholders and box tokens
  text = text.replace(/^\s*(?:\d+\.|\.)\s*(?=[A-Za-z\u0900-\u097F])/g, '');
  text = text.replace(/□\s*\(\s*\)/g, '');
  text = text.replace(/[▒□┤├│〖〗]/g, '');
  text = text.replace(/\bvalue of\s+ea\b(?!\^)/gi, 'value of e^{a}');

  // 2. Clean invisible chars
  text = cleanInvisibleCharacters(text);

  // 3. Domain mappings: f:R→R -> \(f:\mathbb{R}\to\mathbb{R}\) and f:[0,∞)→R
  text = text.replace(
    /\b([a-zA-Z])\s*:\s*(?:\\mathbb\{R\}|\bR\b)\s*(?:→|->|\\to)\s*(?:\\mathbb\{R\}|\bR\b)\b/g,
    '\\($1:\\mathbb{R}\\to\\mathbb{R}\\)'
  );
  text = text.replace(
    /\b([a-zA-Z])\s*:\s*([(\[][0-9a-zA-Z∞\-\+,\s\\]+[)\]]|\b(?:R|Z|N|Q|C)\b)\s*(?:→|->|\\to)\s*\b(R|Z|N|Q|C)\b/g,
    '$1:$2 \\to \\mathbb{$3}'
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

  // 8.5 Standard function commands (do not use \b after name so log_e and sin^2 match)
  text = text.replace(/(?<![\\a-zA-Z])(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|ln|log|exp)(?![a-zA-Z])(?=\s*[\^_{|\\0-9a-zA-Z\u0370-\u03FF(])/g, '\\$1');

  // 9. Unicode characters & symbols
  text = reconstructUnicodeMath(text);

  // 9.5 Parenthesized exponents and subscripts (supports nested parens like e^((f(r))/r))
  text = normalizeParenthesizedScripts(text);

  // 10. Fractions
  text = reconstructFractions(text);

  // 10.5 Ensure \sqrt and \frac in superscripts/subscripts are braced
  text = text.replace(/([\^_])\s*(\\sqrt(?:\[[^\]]*\])?\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g, '$1{$2}');
  text = text.replace(/([\^_])\s*(\\(?:d?frac)\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g, '$1{$2}');

  // 10.55 Ensure any unbraced \sqrt commands have valid braces (fixes "Missing radicand argument for \sqrt")
  text = text.replace(/\\sqrt(?:\s*\[([^\]]*)\])?\s*(?!\{)(?!\[)([a-zA-Z0-9\u0370-\u03FF]+|\\[a-zA-Z]+)/g, (_m, deg, tok) => deg ? `\\sqrt[${deg}]{${tok}}` : `\\sqrt{${tok}}`);
  text = text.replace(/\\sqrt(?:\s*\[([^\]]*)\])?\s*(?!\{|\[|\s*[a-zA-Z0-9\\])([^\s\$\\\{\}\(\)\[\]]+)/g, (_m, deg, tok) => deg ? `\\sqrt[${deg}]{${tok}}` : `\\sqrt{${tok}}`);
  text = text.replace(/\\sqrt\s*(?=[$+\-*/=,;\)]|$)/g, '\\sqrt{x}');

  // 10.6 Convert literal curly braces immediately following \lim_{...} into \left\{ ... \right\}
  const limBraceMatch = /(\\lim_\{[^{}]+\}\s*)\{/g;
  let lbMatch: RegExpExecArray | null;
  while ((lbMatch = limBraceMatch.exec(text)) !== null) {
    const openBraceIdx = lbMatch.index + lbMatch[1].length;
    const closeBraceIdx = findMatchingDelimiter(text, openBraceIdx);
    if (closeBraceIdx !== -1) {
      const inner = text.substring(openBraceIdx + 1, closeBraceIdx).trim();
      text = text.substring(0, openBraceIdx) + `\\left\\{${inner}\\right\\}` + text.substring(closeBraceIdx + 1);
      limBraceMatch.lastIndex = openBraceIdx + 7;
    }
  }

  // 11. Absolute Values
  text = reconstructAbsoluteValues(text);

  // 12. Strip leftover Word linear formatting tokens
  text = text.replace(/[█■┤□▒]/g, '');

  return text.trim();
}