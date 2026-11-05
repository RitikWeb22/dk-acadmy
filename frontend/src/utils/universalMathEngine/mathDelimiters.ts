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

function wrapLooseMath(text: string): string {
  let result = text;
  result = result.replace(
    /\\lim(?:_\{[^{}]*\})?\s*(?:\\frac\{(?:[^{}]|\{[^{}]*\})*\}\{(?:[^{}]|\{[^{}]*\})*\})?(?:\s*[A-Za-z0-9()+\-=^'\\]+)+/g,
    (match) => `$${match.trim()}$`
  );
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
