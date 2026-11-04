/**
 * Input Format Detection Layer (Layer A)
 */

import type { InputFormatType } from './types';

export function detectInputFormat(rawInput: string): InputFormatType {
  if (!rawInput || typeof rawInput !== 'string') return 'plain-text';

  const text = rawInput.trim();
  if (text.length === 0) return 'plain-text';

  // 1. Detect OMML (Office Math Markup Language)
  if (
    /<(?:m:)?oMath\b/i.test(text) ||
    /schemas\.openxmlformats\.org\/officeDocument\/2006\/math/i.test(text) ||
    /<(?:m:)?oMathPara\b/i.test(text)
  ) {
    return 'omml-xml';
  }

  // 2. Detect MathML
  if (
    /<math[\s>]/i.test(text) ||
    /www\.w3\.org\/1998\/Math\/MathML/i.test(text) ||
    (/<(?:mfrac|msup|msub|msqrt|mroot|munderover|mtable)\b/i.test(text) && /<\/[a-z]+>/i.test(text))
  ) {
    return 'mathml-xml';
  }

  // 3. Detect HTML containing math or formatting
  if (
    /<(?:p|div|span|table|tr|td|sup|sub|body|html)\b/i.test(text) &&
    /<\/(?:p|div|span|table|tr|td|sup|sub|body|html)>/i.test(text)
  ) {
    return 'html-math';
  }

  // 4. Detect Word Linear / UnicodeMath Format
  if (
    /[█┤]/.test(text) ||
    /\(lim\)┬/i.test(text) ||
    /\(∑\)┬/i.test(text) ||
    /\\matrix\s*\(/i.test(text) ||
    /\\eqarray\s*\(/i.test(text) ||
    /\\cases\s*\(/i.test(text) ||
    /@&/.test(text) ||
    /┬\(/.test(text)
  ) {
    return 'word-linear';
  }

  // 5. Detect Existing LaTeX
  const hasLatexCommand = /\\(?:frac|dfrac|sqrt|int|sum|prod|lim|begin|left|right|alpha|beta|gamma|delta|pi|theta|infty|times|div|pm|leq|geq|neq|to)\b/.test(text);
  const hasLatexDelimiters = /\$\$[\s\S]*?\$\$|\$[^\$\n]+\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\\[a-zA-Z]+/.test(text);

  if (hasLatexCommand || hasLatexDelimiters) {
    const wordCount = (text.replace(/\\[a-zA-Z]+/g, ' ').match(/\b[a-zA-Z]{3,}\b/g) || []).length;
    if (wordCount > 6) return 'mixed';
    return 'latex';
  }

  // 6. Detect Unicode Mathematical Notation
  const hasUnicodeMath = /[√∛∜×÷±∓≤≥≠≈∞∑∏∫→↔⇒⇔∈∉⊂⊆∪∩ℝℤℕℚℂα-ωΑ-Ω⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿⁱ₀₁₂₃₄₅₆₇₈₉]/.test(text);
  if (hasUnicodeMath) {
    return 'unicode-math';
  }

  return 'plain-text';
}

