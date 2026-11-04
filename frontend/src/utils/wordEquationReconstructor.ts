/**
 * DK Academy - Word Equation Linear Format (UnicodeMath / OMML) Reconstruction Engine
 * Backwards-compatible adapter backed by the Universal Mathematical Normalization Engine.
 */

import {
  reconstructLinearEquation,
  cleanInvisibleCharacters,
  reconstructLimits,
  stripOuterParensSafe,
  reconstructFractions,
  reconstructUnicodeMath,
  convertHtmlWithMath
} from './universalMathEngine';

/**
 * Reconstructs Word Linear Format equations and markup into standard LaTeX.
 */
export function reconstructWordEquationLinearFormat(rawText: string): string {
  if (!rawText) return '';
  let text = rawText;

  // Sniff for HTML/XML markup commonly emitted by Word, MathType, or MathML
  const hasMarkup =
    text.includes('<') &&
    /(?:<m:oMath|<math|<sup|<sub|<div|<p|<table|<span|<w:worddocument)/i.test(text);

  if (hasMarkup) {
    try {
      text = convertHtmlWithMath(text);
    } catch {
      // Graceful fallback to raw text if HTML parsing encounters syntax issues
    }
  }

  return reconstructLinearEquation(text);
}

/**
 * Strips zero-width spaces, Word control characters, and hidden OCR markers.
 */
export function cleanInvisibleAndWordArtifacts(text: string): string {
  if (!text) return '';
  return cleanInvisibleCharacters(text);
}

/**
 * Reconstructs linear limit representations into LaTeX \lim structures.
 */
export function reconstructLinearLimits(text: string): string {
  if (!text) return '';
  return reconstructLimits(text);
}

export { stripOuterParensSafe };

/**
 * Reconstructs linear quotients into \frac{...}{...}.
 */
export function reconstructLinearFractions(text: string): string {
  if (!text) return '';
  return reconstructFractions(text);
}

/**
 * Removes rogue nested math delimiters ($) inside already bracketed LaTeX macros
 * such as \frac, \dfrac, \sqrt, and \lim conditions.
 */
export function healNestedDollars(text: string): string {
  if (!text || !text.includes('$')) return text;

  let res = text;

  // 1. Clean nested dollars inside \lim_{...}
  res = res.replace(/\\lim_\{([^{}]*)\}/g, (_, cond) => `\\lim_{${cond.replace(/\$/g, '').trim()}}`);

  // 2. Clean nested dollars inside \frac{...}{...} and \dfrac{...}{...} supporting arbitrary brace depths
  const fracRegex = /\\(d?frac)\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = fracRegex.exec(res)) !== null) {
    const macroStart = match.index;
    const numOpenBrace = macroStart + match[0].length - 1;
    const numCloseBrace = findBalancedBrace(res, numOpenBrace);
    if (numCloseBrace === -1) break;

    // Locate second argument (denominator)
    let denOpenBrace = numCloseBrace + 1;
    while (denOpenBrace < res.length && /\s/.test(res[denOpenBrace])) denOpenBrace++;
    if (denOpenBrace >= res.length || res[denOpenBrace] !== '{') break;

    const denCloseBrace = findBalancedBrace(res, denOpenBrace);
    if (denCloseBrace === -1) break;

    const numContent = res.substring(numOpenBrace + 1, numCloseBrace).replace(/\$/g, '');
    const denContent = res.substring(denOpenBrace + 1, denCloseBrace).replace(/\$/g, '');
    const macroType = match[1];

    const replacement = `\\${macroType}{${numContent}}{${denContent}}`;
    res = res.substring(0, macroStart) + replacement + res.substring(denCloseBrace + 1);

    // Reposition regex pointer past replaced segment
    fracRegex.lastIndex = macroStart + replacement.length;
  }

  // 3. Clean nested dollars inside \sqrt{...} and \sqrt[n]{...}
  res = res.replace(/\\sqrt(?:\[[^\]]*\])?\{([^{}]*)\}/g, (fullMatch) => {
    return fullMatch.replace(/\$/g, '');
  });

  return res;
}

/**
 * Normalizes expression components of piecewise linear equations.
 */
export function normalizePiecewiseMathPart(expr: string): string {
  if (!expr) return '';
  let s = cleanInvisibleCharacters(expr);
  s = reconstructUnicodeMath(s);
  s = reconstructLinearEquation(s);
  return s;
}

/**
 * Normalizes relational and logical condition components of piecewise equations.
 */
export function normalizePiecewiseCondPart(cond: string): string {
  if (!cond) return '';
  let s = cleanInvisibleCharacters(cond);
  s = reconstructUnicodeMath(s);

  // Standardize ASCII relational operators to LaTeX commands
  s = s.replace(/<=/g, '\\leq ');
  s = s.replace(/>=/g, '\\geq ');
  s = s.replace(/!=/g, '\\neq ');
  s = s.replace(/\s*(\\leq|\\geq|\\in|\\neq|<|>|=)\s*/g, ' $1 ');

  // Wrap natural language fallback keywords in \text{}
  const trimmed = s.trim();
  if (/^(?:otherwise|else|अन्यथा)$/i.test(trimmed)) {
    return `\\text{${trimmed}}`;
  }

  return s.trim();
}

/**
 * Helper to match balanced curly braces: { ... }
 */
function findBalancedBrace(str: string, openIndex: number): number {
  if (str[openIndex] !== '{') return -1;
  let depth = 1;
  for (let i = openIndex + 1; i < str.length; i++) {
    if (str[i] === '{' && (i === 0 || str[i - 1] !== '\\')) depth++;
    else if (str[i] === '}' && (i === 0 || str[i - 1] !== '\\')) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}