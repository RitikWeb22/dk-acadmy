/**
 * Compares clipboard text/plain with an HTML conversion.
 * `\lim` satisfies a plain `lim` token. Prose words and numeric tokens must
 * still appear, and the HTML result must not contain fewer equations.
 */
const MATH_WORDS = new Set([
  'lim', 'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'sqrt', 'frac', 'dfrac',
  'infty', 'inf', 'sum', 'prod', 'int', 'left', 'right', 'begin', 'end', 'to', 'cdot',
  'times', 'leq', 'geq', 'neq', 'alpha', 'beta', 'gamma', 'pi', 'theta', 'lambda', 'mu',
  'sigma', 'phi', 'omega', 'text', 'mathrm', 'mathbb', 'max', 'min', 'sup', 'exp',
  'aes', 'ea', 'ax', 'bx', 'cx', 'dx', 'dy', 'dt', 'dz', 'ab', 'bc', 'ca', 'xy', 'yz', 'zx',
]);

const PROSE_SPLIT = /\b(?:suppose|is|are|was|were|differentiable|equals|equal|then|and|where|when|given|find|the|that|this|function|following|value|let|if|for|with|from|into|such|which|what|evaluate|compute|question|statement|limit|answer|ans|option|primary|cell|following)\b/gi;

export const PLAIN_TEXT_FALLBACK_WARNING =
  'Word HTML dropped part of the question. The plain-text version was kept and needs review.';

function unfold(text: string): string {
  return text.replace(/\\([a-zA-Z]+)/g, '$1').replace(/[′]/g, "'");
}

function proseTokens(text: string): string[] {
  return (unfold(text).match(/[A-Za-z]{2,}/g) || [])
    .map((word) => word.toLowerCase())
    .filter((word) => !MATH_WORDS.has(word));
}

function numberTokens(text: string): string[] {
  return unfold(text).match(/\d+(?:\.\d+)?/g) || [];
}

function equationCount(text: string): number {
  const delimited = text.match(/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g);
  if (delimited && delimited.length > 0) return delimited.length;
  return text
    .split(PROSE_SPLIT)
    .map((part) => part.trim())
    .filter((part) => /[0-9=√^\\/]|\blim\b|\(/.test(part) && /[0-9A-Za-z√\\^]/.test(part))
    .length;
}

export function htmlResultLosesContent(plain: string, htmlText: string): boolean {
  if (!plain.trim()) return false;
  if (!htmlText.trim()) return true;

  const htmlProse = new Set(proseTokens(htmlText));
  const missingProse = proseTokens(plain).filter((token) => !htmlProse.has(token));
  if (missingProse.length >= 3) return true;

  const htmlNumbers = new Set(numberTokens(htmlText));
  const missingNumbers = numberTokens(plain).filter((token) => !htmlNumbers.has(token));
  if (missingNumbers.length >= 3) return true;

  // Only consider equation loss if HTML produced zero math while plain text had equations
  const htmlEqs = equationCount(htmlText);
  const plainEqs = equationCount(plain);
  if (plainEqs > 0 && htmlEqs === 0) return true;

  return false;
}
