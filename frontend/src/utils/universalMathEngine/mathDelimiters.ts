/**
 * Puts math in $...$ or leaves existing $$...$$ / $...$ alone.
 * Plain sentences with no math signals are returned unchanged.
 */
const PROSE_WORD = /\b[A-Za-z]{4,}\b/g;
const MATH_WORD = new Set([
  'lim', 'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'sqrt', 'frac', 'dfrac',
  'infty', 'left', 'right', 'begin', 'cases', 'text', 'sum', 'prod', 'int',
]);

function hasLooseLatex(text: string): boolean {
  const withoutDelimited = text.replace(/\$\$[\s\S]*?\$\$|\$[^$\n]*?\$/g, ' ');
  return /\\[a-zA-Z]+|√|\blim\b/.test(withoutDelimited);
}

function isPureMath(text: string): boolean {
  const words = text.replace(/\\[a-zA-Z]+/g, ' ').match(PROSE_WORD) || [];
  const prose = words.filter((word) => !MATH_WORD.has(word.toLowerCase()));
  return prose.length === 0 && /\\[a-zA-Z]+|√|\^|_/.test(text);
}

const PROSE_WORDS_SET = new Set([
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'of', 'in', 'on', 'at', 'to', 'for', 'from', 'by', 'with',
  'the', 'a', 'an', 'and', 'or', 'not', 'but',
  'then', 'than', 'where', 'when', 'what', 'which', 'who', 'whom', 'whose', 'why', 'how',
  'let', 'if', 'given', 'suppose', 'assume', 'consider',
  'find', 'evaluate', 'determine', 'calculate', 'simplify',
  'value', 'values', 'equal', 'equals', 'satisfying', 'satisfies',
  'magnitude', 'length', 'area', 'volume', 'distance',
  'vector', 'vectors', 'matrix', 'matrices', 'function', 'functions',
  'point', 'points', 'line', 'lines', 'plane', 'planes', 'curve', 'curves',
  'statement', 'correct', 'incorrect', 'true', 'false', 'option', 'options'
]);

function extractBalancedMathSpan(text: string, startIndex: number): { span: string; endIndex: number } | null {
  let i = startIndex;
  let braceDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let lastValidEnd = startIndex;

  while (i < text.length) {
    const ch = text[i];

    if (ch === '{') {
      braceDepth++;
      i++;
      lastValidEnd = i;
      continue;
    }
    if (ch === '}') {
      if (braceDepth > 0) braceDepth--;
      i++;
      lastValidEnd = i;
      continue;
    }
    if (ch === '(') {
      parenDepth++;
      i++;
      lastValidEnd = i;
      continue;
    }
    if (ch === ')') {
      if (parenDepth > 0) parenDepth--;
      i++;
      lastValidEnd = i;
      continue;
    }
    if (ch === '[') {
      bracketDepth++;
      i++;
      lastValidEnd = i;
      continue;
    }
    if (ch === ']') {
      if (bracketDepth > 0) bracketDepth--;
      i++;
      lastValidEnd = i;
      continue;
    }

    if (braceDepth > 0 || parenDepth > 0 || bracketDepth > 0) {
      i++;
      lastValidEnd = i;
      continue;
    }

    // Top-level LaTeX command
    if (ch === '\\') {
      const match = text.slice(i).match(/^\\[a-zA-Z]+/);
      if (match) {
        i += match[0].length;
        lastValidEnd = i;
        continue;
      }
      i++;
      lastValidEnd = i;
      continue;
    }

    // Numbers, math symbols, operators
    if (/[0-9+\-=*\/^_,:;~<>⋅×√]/.test(ch)) {
      i++;
      lastValidEnd = i;
      continue;
    }

    // Whitespace at top level
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Words at top level
    if (/[a-zA-Z]/.test(ch)) {
      const match = text.slice(i).match(/^[a-zA-Z]+/);
      if (match) {
        const word = match[0];
        if (PROSE_WORDS_SET.has(word.toLowerCase()) && word.length > 1) {
          break;
        }
        i += word.length;
        lastValidEnd = i;
        continue;
      }
    }

    // Any other character stops top-level math
    break;
  }

  const span = text.slice(startIndex, lastValidEnd).trim();
  if (!span) return null;
  return { span, endIndex: lastValidEnd };
}

function findMathSpanStart(text: string, opIndex: number, minIndex: number): number {
  let start = opIndex;
  let i = opIndex;

  while (i > minIndex) {
    // Skip horizontal whitespace
    let p = i;
    while (p > minIndex && (text[p - 1] === ' ' || text[p - 1] === '\t')) p--;
    if (p <= minIndex) break;

    const before = text.slice(minIndex, p);

    // Match an immediately preceding math prefix token (e.g. \sqrt{, \left(, =, +, -, f(x), \alpha, etc.)
    const prefixMatch = before.match(
      /(?:\\(?:sqrt|frac|dfrac|tfrac|left)\s*|[({[=+\-*/^_]|[A-Za-z]['′]?\([^()\n]{1,24}\)|\\(?:alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|pi|sigma|phi|omega)\b|[0-9]+|[A-Za-z](?=\s*=))$/
    );
    if (prefixMatch) {
      const token = prefixMatch[0];
      const wordCheck = token.replace(/[^A-Za-z]/g, '').toLowerCase();
      if (wordCheck.length > 1 && PROSE_WORDS_SET.has(wordCheck)) {
        break;
      }
      i = p - token.length;
      start = i;
      continue;
    }

    break;
  }

  // Trim any leading whitespace from the expanded start
  while (start < opIndex && /\s/.test(text[start])) start++;
  return start;
}

function wrapLooseMath(text: string): string {
  let result = text;

  // Case V: "The value of ... is ( )." / "The value of ... is equal to ..."
  const valMatch = result.match(
    /^(\s*(?:The value of(?: the integral)?|Find the value of(?: the integral)?|Evaluate(?: the integral)?|Find|Evaluate)\s+)([\s\S]+?)(\s+(?:is equal to\b|is\b|equals?\b)[\s\S]*?$|\.$|$)/i
  );
  if (valMatch && !/\b(?:such that|where|when|if|and)\b/i.test(valMatch[2]) && (valMatch[2].includes('\\') || valMatch[2].includes('^') || valMatch[2].includes('_'))) {
    return `${valMatch[1]}$${valMatch[2].trim()}$${valMatch[3]}`;
  }

  const localProtected: string[] = [];
  const stashMath = (mathContent: string): string => {
    const token = `\u0001${localProtected.length}\u0001`;
    localProtected.push(`$${mathContent.trim()}$`);
    return token;
  };

  // Wrap structured math operators: \lim, \int, \iint, \iiint, \sum, \prod
  const opRegex = /\\(?:lim|int|iint|iiint|sum|prod)(?![a-zA-Z])/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  let accumulated = '';

  while ((match = opRegex.exec(result)) !== null) {
    const startIndex = findMathSpanStart(result, match.index, lastIndex);
    accumulated += result.slice(lastIndex, startIndex);
    const spanInfo = extractBalancedMathSpan(result, startIndex);
    if (spanInfo && spanInfo.span) {
      accumulated += stashMath(spanInfo.span);
      lastIndex = spanInfo.endIndex;
      opRegex.lastIndex = lastIndex;
    } else {
      accumulated += result.slice(startIndex, match.index + match[0].length);
      lastIndex = match.index + match[0].length;
    }
  }
  accumulated += result.slice(lastIndex);
  result = accumulated;

  // Wrap domain mappings: f:[0,\infty) \to \mathbb{R}
  result = result.replace(
    /(?<![A-Za-z0-9_$\u0000\u0001])([A-Za-z]\s*:\s*(?:[(\[][^()\[\]\n]+[)\]]|\\mathbb\{[A-Z]\}|[A-Z])\s*\\to\s*(?:\\mathbb\{[A-Z]\}|[A-Z]))/g,
    (_m, expr: string) => stashMath(expr)
  );

  // Wrap interval unions: (-\infty, 0) \cup (0, \infty)
  result = result.replace(
    /(?<![A-Za-z0-9_$\u0000\u0001])([(\[][^()\[\]\n]+?[)\]]\s*\\(?:cup|cap)\s*[(\[][^()\[\]\n]+?[)\]])/g,
    (_m, expr: string) => stashMath(expr)
  );

  // Wrap greatest-integer notation "Let [t] denote" and explicit intervals "interval [0,8]"
  result = result.replace(
    /(\bLet\s+)(\[[A-Za-z]\])(?=\s+denote\b)/g,
    (_m, lead: string, expr: string) => `${lead}${stashMath(expr)}`
  );
  result = result.replace(
    /(\binterval\s+)([(\[][0-9A-Za-z+\-,\s\\]+[)\]])/g,
    (_m, lead: string, expr: string) => `${lead}${stashMath(expr)}`
  );

  // Wrap equations with LHS = RHS containing LaTeX or exponents (e.g. f(x)=[\frac{x}{2}+3]-[\sqrt{x}] or ax^2+bx-\sqrt{e}=0)
  result = result.replace(
    /(?<![A-Za-z0-9_$\u0000\u0001])((?:[A-Za-z]['′]?\s*\([^()\n]{1,16}\)|[0-9a-zA-Z^{}_\\]+(?:\s*[+\-*/]\s*(?:\\sqrt(?:\[[^\]]*\])?\{[^{}]+\}|[0-9a-zA-Z^{}_\\]+))*)\s*=\s*[^,;.\n\u0000\u0001]+?)(?=\s*[,;.]|\s+(?:and|or|if|then|where|when|be|is|are|in|at|to|for|such)\b|$)/g,
    (fullMatch, expr: string) => {
      const stripped = expr.replace(/\\[a-zA-Z]+/g, ' ');
      const words = stripped.match(/\b[A-Za-z]{2,}\b/g) || [];
      if (words.some((w) => PROSE_WORDS_SET.has(w.toLowerCase()))) return fullMatch;
      if (/\\[a-zA-Z]+|\^|_|\d/.test(expr)) {
        return stashMath(expr);
      }
      return fullMatch;
    }
  );

  // Wrap standalone logarithmic / trig expressions with coefficients: e.g. 12\log_e(a+b)
  result = result.replace(
    /(?<![A-Za-z0-9_$\u0000\u0001])((?:[0-9]+\s*)?\\(?:log|ln|sin|cos|tan|cot|sec|csc|exp)(?:_\{?[0-9a-zA-Z]+\}?|\^\{?[0-9a-zA-Z+\-]+\}?)*\s*(?:\([^()\n]+\)|[0-9a-zA-Z]+))/g,
    (_m, expr: string) => stashMath(expr)
  );

  // Wrap standalone exponential / power tokens like e^{a}
  result = result.replace(
    /(?<![A-Za-z0-9_$\u0000\u0001])([A-Za-z0-9]+\^(?:\{[^{}\n]+\}|[0-9a-zA-Z]+))(?![A-Za-z0-9_$\u0000\u0001])/g,
    (_m, expr: string) => stashMath(expr)
  );

  result = result.replace(
    /(^|[^$\\A-Za-z0-9_\u0000\u0001])([A-Za-z](?:['′])?\([^()\n]{1,24}\))/g,
    (fullMatch, lead: string, atom: string) => {
      const inner = atom.slice(atom.indexOf('(') + 1, -1).trim();
      if (!inner || PROSE_WORDS_SET.has(inner.toLowerCase())) return fullMatch;
      return `${lead}${stashMath(atom)}`;
    }
  );
  result = result.replace(
    /(^|[^$\\A-Za-z0-9_\u0000\u0001])([A-Za-z]\s*=\s*-?\d+(?:\.\d+)?)/g,
    (_match, lead: string, atom: string) => `${lead}${stashMath(atom)}`
  );

  result = result.replace(/\u0001(\d+)\u0001/g, (_m, idx: string) => localProtected[Number(idx)] || '');
  return result.replace(/\$\s+,/g, '$,');
}

export function ensureMathDelimiters(text: string): string {
  if (!text) return '';
  if (!hasLooseLatex(text) && !isPureMath(text)) return text;
  if (!hasLooseLatex(text)) return text;

  if (isPureMath(text) && !text.includes('$')) {
    return `$${text.trim()}$`;
  }

  const protectedMath: string[] = [];
  let body = text.replace(/\$\$[\s\S]*?\$\$|\$[^$\n]*?\$/g, (match) => {
    const token = `\u0000${protectedMath.length}\u0000`;
    protectedMath.push(match.trim());
    return token;
  });
  if (isPureMath(body)) {
    body = `$${body.trim()}$`;
  } else if (hasLooseLatex(body)) {
    body = wrapLooseMath(body);
  }
  return body
    .replace(/\u0000(\d+)\u0000/g, (_match, index: string) => protectedMath[Number(index)] || '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\$\s+,/g, '$,')
    .trim();
}
