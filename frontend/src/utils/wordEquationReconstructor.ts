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

export function reconstructWordEquationLinearFormat(rawText: string): string {
  if (!rawText) return '';
  let text = rawText;
  if (text.includes('<') && (text.includes('<m:oMath') || text.includes('<math') || text.includes('<sup>') || text.includes('<sub>') || text.includes('<div') || text.includes('<p') || text.includes('<table'))) {
    text = convertHtmlWithMath(text);
  }
  return reconstructLinearEquation(text);
}

export function cleanInvisibleAndWordArtifacts(text: string): string {
  return cleanInvisibleCharacters(text);
}

export function reconstructLinearLimits(text: string): string {
  return reconstructLimits(text);
}

export { stripOuterParensSafe };

export function reconstructLinearFractions(text: string): string {
  return reconstructFractions(text);
}

export function healNestedDollars(text: string): string {
  let res = text;
  res = res.replace(/\\frac\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, (_match, num, den) => {
    const cleanNum = num.replace(/\$/g, '').trim();
    const cleanDen = den.replace(/\$/g, '').trim();
    return `\\frac{${cleanNum}}{${cleanDen}}`;
  });
  res = res.replace(/\\lim_\{([^{}]*)\}/g, (_, cond) => `\\lim_{${cond.replace(/\$/g, '').trim()}}`);
  return res;
}

export function normalizePiecewiseMathPart(expr: string): string {
  let s = cleanInvisibleCharacters(expr);
  s = reconstructUnicodeMath(s);
  s = reconstructLinearEquation(s);
  return s;
}

export function normalizePiecewiseCondPart(cond: string): string {
  let s = cleanInvisibleCharacters(cond);
  s = reconstructUnicodeMath(s);
  s = s.replace(/<=/g, '\\leq ');
  s = s.replace(/>=/g, '\\geq ');
  s = s.replace(/!=/g, '\\neq ');
  s = s.replace(/\s*(\\leq|\\geq|\\in|<|>|=)\s*/g, ' $1 ');
  return s.trim();
}
