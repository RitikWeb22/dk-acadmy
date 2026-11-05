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

function wrapLooseMath(text: string): string {
  let result = text;

  // Case V: "The value of ... is ( )." / "The value of ... is equal to ..."
  const valMatch = result.match(
    /^(\s*(?:The value of(?: the integral)?|Find the value of(?: the integral)?|Evaluate(?: the integral)?|Find|Evaluate)\s+)([\s\S]+?)(\s+(?:is equal to\b|is\b|equals?\b)[\s\S]*?$|\.$|$)/i
  );
  if (valMatch && (valMatch[2].includes('\\') || valMatch[2].includes('^') || valMatch[2].includes('_'))) {
    return `${valMatch[1]}$${valMatch[2].trim()}$${valMatch[3]}`;
  }

  // Wrap structured math operators: \lim, \int, \iint, \iiint, \sum, \prod
  const opRegex = /\\(?:lim|int|iint|iiint|sum|prod)(?![a-zA-Z])/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  let accumulated = '';

  while ((match = opRegex.exec(result)) !== null) {
    const startIndex = match.index;
    accumulated += result.slice(lastIndex, startIndex);
    const spanInfo = extractBalancedMathSpan(result, startIndex);
    if (spanInfo && spanInfo.span) {
      accumulated += `$${spanInfo.span}$`;
      lastIndex = spanInfo.endIndex;
      opRegex.lastIndex = lastIndex;
    } else {
      accumulated += match[0];
      lastIndex = startIndex + match[0].length;
    }
  }
  accumulated += result.slice(lastIndex);
  result = accumulated;

  result = result.replace(
    /(^|[^$\\A-Za-z])([A-Za-z](?:['′])?\([^()\n]{0,24}\))/g,
    (_match, lead: string, atom: string) => `${lead}$${atom}$`
  );
  result = result.replace(
    /(^|[^$\\A-Za-z])([A-Za-z]\s*=\s*-?\d+(?:\.\d+)?)/g,
    (_match, lead: string, atom: string) => `${lead}$${atom.trim()}$`
  );
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
