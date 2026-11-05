/**
 * Sanitizes and pre-conditions formula strings before KaTeX.
 * This is the same function MathRenderer used inline. It lives in its own
 * module so the paste tracer can call it without loading the renderer stylesheet.
 */
export function sanitizeFormula(str: string): string {
  if (!str) return '';
  let res = str.split('$$').join('$')
    // Strip internal dollar delimiters so KaTeX never throws "Can't use function '$' in math mode"
    .replace(/\$/g, '')
    // Clean invisible Word formatting characters & hair spaces
    .replace(/[\u200A\u200B\u200C\u200D\u2060\u2061\u2062\u2063\u2064\uFEFF\u00A0]/g, ' ')
    // Ensure infty and common Greek letters have backslash if inside math formula
    .replace(/(?<!\\)\binfty\b/g, '\\infty')
    .replace(/(?<!\\)\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|lambda|mu|nu|xi|pi|rho|sigma|tau|phi|chi|psi|omega)\b/g, '\\$1')
    // Remove argument placeholders
    .replace(/[▒□]/g, '')
    // Normalize double backslashes
    .replace(/\\\\([a-zA-Z]+)/g, '\\$1')
    // Normalize unicode minus
    .replace(/[\u2212\u2013\u2014]/g, '-')
    // Normalize curly quotes
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    // Clean leading dots from copy-pasting
    .replace(/^\s*\.\s*(?=[A-Za-z])/g, '')
    // Strip accidental leading sentence starters mistakenly wrapped into math
    .replace(/^\\text\{\s*(?:If|Let|Then|Where|When)\s*\}\s*/i, '')
    .replace(/^(?:If|Let|Then|Where|When)\s+/i, '')
    // Normalize any duplicated \left\left or \right\right for any delimiter
    .replace(/(?:\\left\s*)+/g, '\\left')
    .replace(/(?:\\right\s*)+/g, '\\right')
    .replace(/\\left\s*\\left\s*([\[\(\{\|])/g, '\\left$1')
    .replace(/\\right\s*\\right\s*([\]\)\}\|])/g, '\\right$1')
    .replace(/,\s*\]/g, ']')
    // Fix inverted definite integral limits
    .replace(/\\int_\{?\\frac\{\\pi\}\{4\}\}?\^\{?\\frac\{\\pi\}\{6\}\}?/g, '\\int_{\\frac{\\pi}{6}}^{\\frac{\\pi}{4}}')
    .replace(/\\int_\{?\\pi\/4\}?\^\{?\\pi\/6\}?/g, '\\int_{\\frac{\\pi}{6}}^{\\frac{\\pi}{4}}')
    .replace(/\\int\s*_\s*\{?\s*(?:\\frac\{\\pi\}\{4\}|\\pi\/4)\s*\}?\s*\^\s*\{?\s*(?:\\frac\{\\pi\}\{6\}|\\pi\/6)\s*\}?/g, '\\int_{\\frac{\\pi}{6}}^{\\frac{\\pi}{4}}')
    .replace(/\\int\s*\^\s*\{?\s*(?:\\frac\{\\pi\}\{6\}|\\pi\/6)\s*\}?\s*_\s*\{?\s*(?:\\frac\{\\pi\}\{4\}|\\pi\/4)\s*\}?/g, '\\int_{\\frac{\\pi}{6}}^{\\frac{\\pi}{4}}')
    // Repair corrupted cotangent integral products from Word / PDF font subset encoding
    .replace(/(?:\\left\s*)?[=\[]\s*(?:\\left\s*)?\\?cot\s*[=\(]?\s*[xX]\s*[-−]\s*3[\s\S]*?\\?cot\s*[=\(]?\s*[xX]\s*[\+]\s*3[\s\S]*?\+\s*1\s*\]\s*(?:dx|𝑑𝑥)?\b/gi,
      '\\left(\\cot\\left(x - \\frac{\\pi}{3}\\right) \\cot\\left(x + \\frac{\\pi}{3}\\right) + 1\\right) \\, dx')
    .replace(/\[\s*\\?cot\s*=?\s*x\s*[-−]\s*3[\s\S]*?\\?cot\s*=?\s*x\s*[\+]\s*3[\s\S]*?\+\s*1\s*\]\s*(?:dx|𝑑𝑥)?\b/gi,
      '\\left(\\cot\\left(x - \\frac{\\pi}{3}\\right) \\cot\\left(x + \\frac{\\pi}{3}\\right) + 1\\right) \\, dx')
    .replace(/\[\s*\\?cot\s*[=\(]?\s*[xX]\s*[-−]\s*3\s*[\r\n\s]*,?\s*\]?\s*\\?cot\s*[=\(]?\s*[xX]\s*[\+]\s*3\s*[\r\n\s]*,?\s*\]?\s*\+\s*1\s*\]\s*(?:dx|𝑑𝑥)?\b/gi,
      '\\left(\\cot\\left(x - \\frac{\\pi}{3}\\right) \\cot\\left(x + \\frac{\\pi}{3}\\right) + 1\\right) \\, dx')
    .replace(/\\log_e\s*\(\s*\(\s*\)\s*/g, '\\log_e(')
    .replace(/\\log_e\s*\(\s*\(\s*/g, '\\log_e(')
    // Normalize prime derivatives: ϕ^' (t) -> \phi'(t)
    .replace(/([a-zA-Z\\]+)\s*\^['′]\s*/g, "$1' ")
    // Normalize empty set phi
    .replace(/∅/g, '\\phi ')
    // Normalize unbraced fractions and radicals in powers/subscripts: x^\frac{1}{2} -> x^{\frac{1}{2}}, e^\sqrt{x} -> e^{\sqrt{x}}
    .replace(/\^\{\{\\frac\{([^}]+)\}\}\{([^}]+)\}\}/g, '^{\\frac{$1}{$2}}')
    .replace(/\^(?!\{)\\frac\{\{([^}]+)\}\}\{([^}]+)\}/g, '^{\\frac{$1}{$2}}')
    .replace(/\^(?!\{)\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '^{\\frac{$1}{$2}}')
    .replace(/([\^_])\s*(\\sqrt(?:\[[^\]]*\])?\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g, '$1{$2}')
    .replace(/([\^_])\s*(\\(?:d?frac)\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g, '$1{$2}')
    // Normalize vectors: (OA) ⃗ -> \vec{OA}, a ⃗ -> \vec{a}, i ˆ -> \hat{i}
    .replace(/\(([A-Za-z]{1,3})\)\s*[\u20D7\u2192⃗]/g, '\\vec{$1}')
    .replace(/([a-zA-Z])\s*[\u20D7\u2192⃗]/g, '\\vec{$1}')
    .replace(/([ijk])\s*[\u0302\u02C6ˆ]/g, '\\hat{$1}')
    .replace(/⋅/g, ' \\cdot ')
    .replace(/×/g, ' \\times ')
    .replace(/∀/g, '\\forall ')
    .replace(/sint\b/g, '\\sin t')
    .replace(/sinxdx\b/g, '\\sin x\\,dx')
    .replace(/cos2([ABC])\b/g, '\\cos 2$1')
    // Exponential powers and arbitrary base powers with balanced single or double parentheses:
    // e.g. e^((2-4x)) -> e^{2-4x}, e^(2-4x) -> e^{2-4x}, e^(-x) -> e^{-x}, x^(n+1) -> x^{n+1}
    .replace(/([a-zA-Z0-9_\)\]\}]|\\\w+)\^\(\(([^()]+)\)\)/g, '$1^{$2}')
    .replace(/([a-zA-Z0-9_\)\]\}]|\\\w+)\^\(([^()]+)\)/g, '$1^{$2}')
    .replace(/e\^([0-9a-zA-Z]+)/g, 'e^{$1}')
    // Greek powers and unbraced variable exponents: \alpha^4 -> \alpha^{4}, \beta^4 -> \beta^{4}, x^2 -> x^{2}
    .replace(/\\(alpha|beta|gamma|theta|lambda|pi|phi|omega)\^([0-9a-zA-Z])(?![0-9a-zA-Z\{])/g, '\\$1^{$2}')
    .replace(/([a-zA-Z0-9_\)\]\}])\^([0-9a-zA-Z])(?![0-9a-zA-Z\{])/g, '$1^{$2}')
    // Strip any dangling trailing _ or ^ at the end of a formula
    .replace(/([\^_])\s*$/g, '')
    // Tall bracket display fractions: \left(\frac -> \left(\dfrac
    .replace(/\\left\(\s*\\frac/g, '\\left(\\dfrac')
    .trim();

  // If formula contains connecting words inside math mode without \text, wrap them in \text{ ... }
  // to ensure proper spaces between words and prevent collapsed text (excluding sentence starters like 'if')
  res = res.replace(/(?<!\\)\b(is equal to|equal to|then|where|and|such that|be defined as|defined as)\b/gi, (match) => `\\text{ ${match} }`);

  // Auto-balance \left and \right delimiters to eliminate unclosed group crashes
  const leftMatches = res.match(/\\left\b/g) || [];
  const rightMatches = res.match(/\\right\b/g) || [];
  if (leftMatches.length > rightMatches.length) {
    let count = 0;
    res = res.replace(/\\left([(\[{.|])/g, (m, char) => {
      count++;
      if (count > rightMatches.length) return char;
      return m;
    });
  } else if (rightMatches.length > leftMatches.length) {
    res = res.replace(/\\right([)\]}.|])/g, '$1');
  }

  // Auto-balance curly braces { and } (excluding escaped \{ and \})
  let openBraces = 0;
  let balanced = '';
  for (let i = 0; i < res.length; i++) {
    const ch = res[i];
    const prev = i > 0 ? res[i - 1] : '';
    if (ch === '{' && prev !== '\\') {
      openBraces++;
      balanced += ch;
    } else if (ch === '}' && prev !== '\\') {
      if (openBraces > 0) {
        openBraces--;
        balanced += ch;
      }
      // Drop unmatched closing brace that has no opening partner
    } else {
      balanced += ch;
    }
  }
  while (openBraces > 0) {
    balanced += '}';
    openBraces--;
  }
  res = balanced;

  return res;
}
