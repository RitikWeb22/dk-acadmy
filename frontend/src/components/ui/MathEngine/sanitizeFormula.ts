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
    // Repair HTML entities if present in math string
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    // Strip orphan internal tokens if present
    .replace(/\[\|MATH_\d+\|\]/g, '')
    .replace(/\u27E6MATH_\d+\u27E7/g, '')
    .replace(/___PROT_\d+___/g, '')
    .replace(/\[\s*MATH_\d+\s*\]/gi, '')
    .replace(/⟦\s*MATH_\d+\s*⟧/gi, '')
    // Repair broken/corrupted differentials: e.g. \dfrac{} \ dy}{\, dx or \dfrac{} \, dy}{\, dx -> \dfrac{dy}{dx}
    .replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}\s*\{?\s*(?:\\,)?\s*(d[a-zA-Z])/gi, '\\dfrac{$1}{$2}')
    .replace(/\\(?:d?frac)\{\s*\}\s*\{\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}\s*\{\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}/gi, '\\dfrac{$1}{$2}')
    .replace(/\\(?:d?frac)\{\s*\}\s*(?:\\?\s*\{\s*)?[^a-zA-Z\n]{0,8}(d[a-zA-Z])[^a-zA-Z\n]{1,8}(d[a-zA-Z])\}?/gi, '\\dfrac{$1}{$2}')
    .replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}\s*\{?\s*(?:\\,)?\s*([a-zA-Z]+)/gi, '\\dfrac{$1}{$2}')
    .replace(/\\(?:d?frac)\{\s*\}\s*(?:\{\s*\})?\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\/\s*(?:\\,)?\s*(d[a-zA-Z])/gi, '\\dfrac{$1}{$2}')
    .replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])(?![a-zA-Z{])/gi, '\\dfrac{$1}{dx}')
    .replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*([a-zA-Z]+)\s*\}\s*\{?\s*(?:\\,)?\s*([a-zA-Z]+)/gi, '\\dfrac{$1}{$2}')
    .replace(/\\(?:d?frac)\{\s*(?:\\,)?\s*([a-zA-Z]+)\s*\}\s*\{\s*(?:\\,)?\s*([a-zA-Z]+)\s*\}/gi, '\\dfrac{$1}{$2}')
    .replace(/\\(?:d?frac)\{\s*\}\s*(?:\\,)?\s*([a-zA-Z]+)\s*\/\s*(?:\\,)?\s*([a-zA-Z]+)/g, '\\dfrac{$1}{$2}')
    // Separate glued math functions: 2xexp -> 2x exp, xexp -> x exp, 2xsin -> 2x sin
    .replace(/([0-9a-zA-Z])\s*(sin|cos|tan|cot|sec|csc|log_e|ln|log|exp)\b/gi, '$1 $2')
    // Double parens on radicals: √((1+x^6)) or \sqrt((1+x^6)) or 4√2
    .replace(/√\s*\(\s*\(\s*([^()]+)\s*\)\s*\)/g, '\\sqrt{$1}')
    .replace(/\\?sqrt\s*\(\s*\(\s*([^()]+)\s*\)\s*\)/g, '\\sqrt{$1}')
    .replace(/(\d+)\s*√\s*(\d+)/g, '$1\\sqrt{$2}')
    .replace(/√\s*(\d+)/g, '\\sqrt{$1}')
    // Repair Word linear differential residue: dy/(" " \, dx) or dy/(dx) or dy/dx
    .replace(/\b(d\^?[0-9]?[a-zA-Z]?)\s*\/\s*\(\s*(?:["'][^"']*["'])?\s*(?:\\,)?\s*(d[a-zA-Z]\^?[0-9]?)\s*\)/g, '\\dfrac{$1}{$2}')
    .replace(/\b(d\^?[0-9]?[a-zA-Z]?)\s*\/\s*(d[a-zA-Z]\^?[0-9]?)\b/g, '\\dfrac{$1}{$2}')
    .replace(/\(\s*["'][^"']*["']\s*(?:\\,)?\s*(d[a-zA-Z])\s*\)/g, '\\,$1')
    // Convert radical fractions: x/\sqrt{...} or x/ \sqrt{...} or x/√(x^2-y^2)
    .replace(/([a-zA-Z0-9]+)\s*\/\s*\\?sqrt\s*\{([^}]+)\}\s*\}?/gi, '\\dfrac{$1}{\\sqrt{$2}}')
    .replace(/([a-zA-Z0-9]+)\s*\/\s*\\?sqrt\s*\(([^)]+)\)\s*\}?/gi, '\\dfrac{$1}{\\sqrt{$2}}')
    .replace(/([a-zA-Z0-9]+)\s*\/\s*√\s*\(([^()]+)\)\s*\}?/g, '\\dfrac{$1}{\\sqrt{$2}}')
    .replace(/([a-zA-Z0-9]+)\s*\/\s*(\\(?:sqrt|cbrt)\{(?:[^{}]|\{[^{}]*\})*\})\s*\}?/g, '\\dfrac{$1}{$2}')

    // Convert linear fractions into \dfrac (numerator upon denominator) so they render as vertical fractions
    // Parens over parens: (A)/(B) -> \dfrac{A}{B}
    .replace(/\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*\(((?:[^()\n]|\([^()\n]*\))+?)\)/g, '\\dfrac{$1}{$2}')
    // Token over parens: A/(B) -> \dfrac{A}{B}
    .replace(/(?<![a-zA-Z0-9_\\])([A-Za-z0-9_\\^{}]+)\s*\/\s*\(((?:[^()\n]|\([^()\n]*\))+?)\)/g, '\\dfrac{$1}{$2}')
    // Parens over token: (A)/B -> \dfrac{A}{B}
    .replace(/\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*([A-Za-z0-9_\\^{}]+)/g, '\\dfrac{$1}{$2}')
    // Number over number: 1/2 -> \dfrac{1}{2}, -1/2 -> -\dfrac{1}{2}
    .replace(/(?<![a-zA-Z0-9_\\/])([-+]?\d+)\s*\/\s*(\d+)(?![a-zA-Z0-9_\\/])/g, '\\dfrac{$1}{$2}')
    // Number over variable: 1/x -> \dfrac{1}{x}, 1/a -> \dfrac{1}{a}, 4/k -> \dfrac{4}{k}
    .replace(/(?<![a-zA-Z0-9_\\/])([-+]?\d+)\s*\/\s*([a-zA-Z](?:_[a-zA-Z0-9]+|_[0-9]+)?)(?![a-zA-Z0-9_\\/])/g, '\\dfrac{$1}{$2}')
    // Variable over number: x/2 -> \dfrac{x}{2}
    .replace(/(?<![a-zA-Z0-9_\\/])([-+]?[a-zA-Z])\s*\/\s*(\d+)(?![a-zA-Z0-9_\\/])/g, '\\dfrac{$1}{$2}')
    // Variable over variable: x/a -> \dfrac{x}{a}, x/b -> \dfrac{x}{b}, a/b -> \dfrac{a}{b}
    .replace(/(?<![a-zA-Z0-9_\\/])([-+]?[a-zA-Z])\s*\/\s*([a-zA-Z](?:_[a-zA-Z0-9]+|_[0-9]+)?)(?![a-zA-Z0-9_\\/])/g, '\\dfrac{$1}{$2}')
    // Greek letter fractions: \pi/2 -> \dfrac{\pi}{2}, \pi^2/32 -> \dfrac{\pi^2}{32}
    .replace(/(\\(?:pi|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|xi|rho|sigma|tau|phi|chi|psi|omega)(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\/\s*([a-zA-Z0-9]+)/g, '\\dfrac{$1}{$2}')
    .replace(/(?<![a-zA-Z0-9_\\/])([-+]?\d+)\s*\/\s*(\\(?:pi|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|xi|rho|sigma|tau|phi|chi|psi|omega)(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)/g, '\\dfrac{$1}{$2}')
    // Upgrade \frac to \dfrac for proper "upon" height
    .replace(/\\frac\b/g, '\\dfrac')
    // Second pass repair for broken/corrupted differentials:
    .replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}\s*\{?\s*(?:\\,)?\s*(d[a-zA-Z])/gi, '\\dfrac{$1}{$2}')
    .replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])(?![a-zA-Z{])/gi, '\\dfrac{$1}{dx}')
    // Clean any empty fraction residues so KaTeX NEVER throws "Expected group after '\dfrac'"
    .replace(/\\(?:d?frac)\{\s*\}\s*\{\s*\}/g, '')
    .replace(/\\(?:d?frac)\{\s*\}\s*\{([^{}]+)\}/g, '\\dfrac{1}{$1}')
    .replace(/\\(?:d?frac)\{([^{}]+)\}\s*\{\s*\}/g, '\\dfrac{$1}{1}')
    .replace(/\\(?:d?frac)\{\s*\}\s*/g, '')
    .replace(/\\(?:d?frac)(?!\s*\{)/g, '')
    // Clean redundant parens inside sqrt: \sqrt{(1+x^6)} -> \sqrt{1+x^6}
    .replace(/\\sqrt\(\s*([^()]+)\s*\)/g, '\\sqrt{$1}')
    .replace(/\\sqrt\{\s*\(([^()]+)\)\s*\}/g, '\\sqrt{$1}')

    // Strip orphan internal tokens if present
    .replace(/\[\|MATH_\d+\|\]/g, '')
    .replace(/\u27E6MATH_\d+\u27E7/g, '')
    .replace(/___PROT_\d+___/g, '')
    .replace(/\[\s*MATH_\d+\s*\]/gi, '')
    .replace(/⟦\s*MATH_\d+\s*⟧/gi, '')
    // Tall delimiters for \exp( ... ) with balanced parens
    .replace(/\\?exp\s*\(\s*\(\s*([^()]+)\s*\)\s*\/\s*\(\s*([^()]+)\s*\)\s*\)/gi, '\\exp\\left(\\dfrac{$1}{$2}\\right)')
    .replace(/\\?exp\s*\(\s*([^/()]+)\s*\/\s*([^/()]+)\s*\)/gi, '\\exp\\left(\\dfrac{$1}{$2}\\right)')
    .replace(/\\?exp\s*\(([^()]+)\)/g, (_m, inner) => `\\exp\\left(${inner.replace(/\\frac\b/g, '\\dfrac')}\\right)`)
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
    // Strip illegal prime / quote superscripts on digits e.g. 0^' or 0^{'} or 0' -> 0
    .replace(/(\d+)\s*\^\s*\{?\s*['′]\s*\}?/g, '$1')
    .replace(/(\d+)\s*['′]/g, '$1')
    .replace(/([a-zA-Z\\]+)\s*\^\s*\{?\s*['′]\s*\}?/g, "$1' ")
    .replace(/\^\s*\{?\s*['′]\s*\}?/g, "'")
    // Normalize empty set phi
    .replace(/∅/g, '\\phi ')
    // Normalize unbraced fractions and radicals in powers/subscripts: x^\frac{1}{2} -> x^{\frac{1}{2}}, e^\sqrt{x} -> e^{\sqrt{x}}
    .replace(/\^\{\{\\frac\{([^}]+)\}\}\{([^}]+)\}\}/g, '^{\\frac{$1}{$2}}')
    .replace(/\^(?!\{)\\frac\{\{([^}]+)\}\}\{([^}]+)\}/g, '^{\\frac{$1}{$2}}')
    .replace(/\^(?!\{)\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '^{\\frac{$1}{$2}}')
    .replace(/([\^_])\s*(\\sqrt(?:\[[^\]]*\])?\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g, '$1{$2}')
    .replace(/([\^_])\s*(\\(?:d?frac)\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g, '$1{$2}')
    // Ensure any unbraced \sqrt commands have valid braces (fixes "Missing radicand argument for \sqrt")
    .replace(/\\sqrt(?:\s*\[([^\]]*)\])?\s*([a-zA-Z0-9]+|\\[a-zA-Z]+)/g, (_m, deg, tok) => deg ? `\\sqrt[${deg}]{${tok}}` : `\\sqrt{${tok}}`)
    .replace(/\\sqrt(?:\s*\[([^\]]*)\])?\s*(?!\{|\s*[a-zA-Z0-9\\])([^\s\$\\\{\}\(\)]+)/g, (_m, deg, tok) => deg ? `\\sqrt[${deg}]{${tok}}` : `\\sqrt{${tok}}`)
    .replace(/\\sqrt\s*(?=[$+\-*/=,;\)]|$)/g, '\\sqrt{x}')
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

  // Fix nested exponents: e.g. e^(tan^(-1)(...)) -> e^{\tan^{-1}(...)}
  if (res.includes('^(')) {
    let result = '';
    let i = 0;
    while (i < res.length) {
      if (res[i] === '^' && res[i + 1] === '(') {
        let depth = 1;
        let j = i + 2;
        while (j < res.length && depth > 0) {
          if (res[j] === '(') depth++;
          else if (res[j] === ')') depth--;
          j++;
        }
        if (depth === 0) {
          const inner = res.slice(i + 2, j - 1);
          result += `^{${inner}}`;
          i = j;
          continue;
        }
      }
      result += res[i];
      i++;
    }
    res = result;
  }

  // Convert balanced exp{ ... } or \exp{ ... } into \exp\left\{ ... \right\} with tall curly braces
  if (/\\?exp[\s\u2061\u2060-\u2064\u200B-\u200D\uFEFF]*(?:\\?\{|\{)/i.test(res)) {
    const expRegex = /\\?exp[\s\u2061\u2060-\u2064\u200B-\u200D\uFEFF]*(?:\\?\{|\{)/gi;
    let expMatch: RegExpExecArray | null;
    let expResult = '';
    let expLastIndex = 0;
    while ((expMatch = expRegex.exec(res)) !== null) {
      expResult += res.substring(expLastIndex, expMatch.index);
      const startInner = expRegex.lastIndex;
      let depth = 1;
      let i = startInner;
      let foundClose = false;
      const openedWithEscape = expMatch[0].endsWith('\\{');

      for (; i < res.length; i++) {
        const isEsc = i > 0 && res[i - 1] === '\\';
        if (res[i] === '{') {
          if (openedWithEscape ? isEsc : !isEsc) depth++;
        } else if (res[i] === '}') {
          if (openedWithEscape ? isEsc : !isEsc) {
            depth--;
            if (depth === 0) {
              foundClose = true;
              break;
            }
          }
        }
      }

      const closePos = foundClose && openedWithEscape ? i - 1 : i;
      let inner = res.substring(startInner, closePos).trim();
      inner = inner.replace(/\\frac\b/g, '\\dfrac');
      expResult += `\\exp\\left\\{${inner}\\right\\}`;
      expLastIndex = foundClose ? i + 1 : i;
      expRegex.lastIndex = expLastIndex;
    }
    expResult += res.substring(expLastIndex);
    res = expResult;
  }

  // Strip stray & characters if no alignment/cases/matrix environment is present
  if (!/\\begin\{(?:cases|aligned|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|split|gather|alignat)\}/.test(res)) {
    res = res.replace(/&/g, ' ');
  } else {
    // Strip any stray & that appears before the first \begin{...}
    const firstBegin = res.indexOf('\\begin{');
    if (firstBegin > 0) {
      res = res.slice(0, firstBegin).replace(/&/g, ' ') + res.slice(firstBegin);
    }
    // Strip any stray & that appears after the last \end{...}
    const lastEnd = res.lastIndexOf('\\end{');
    if (lastEnd !== -1) {
      const endBrace = res.indexOf('}', lastEnd);
      if (endBrace !== -1 && endBrace + 1 < res.length) {
        res = res.slice(0, endBrace + 1) + res.slice(endBrace + 1).replace(/&/g, ' ');
      }
    }
  }

  // Auto-close unclosed environments: e.g. \begin{cases} without \end{cases}
  const envMatches = res.match(/\\begin\{(cases|aligned|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|split|gather)\}/g);
  if (envMatches) {
    for (const envTag of envMatches) {
      const envName = envTag.slice(7, -1);
      const endTag = `\\end{${envName}}`;
      if (!res.includes(endTag)) {
        res += ` ${endTag}`;
      }
    }
  }

  // If formula contains connecting words inside math mode without \text, wrap them in \text{ ... }
  // to ensure proper spaces between words and prevent collapsed text (excluding sentence starters like 'if')
  res = res.replace(/(?<!\\)\b(is equal to|equal to|then|where|and|such that|be defined as|defined as)\b/gi, (match) => `\\text{ ${match} }`);

  // Auto-balance \left and \right delimiters to eliminate unclosed group crashes
  const leftCount = (res.match(/\\left\b/g) || []).length;
  const rightCount = (res.match(/\\right\b/g) || []).length;
  if (leftCount > rightCount) {
    res += ' \\right.'.repeat(leftCount - rightCount);
  } else if (rightCount > leftCount) {
    let excess = rightCount - leftCount;
    res = res.replace(/\\right\s*([)\]}.|]|\\[{}\[\]|])/g, (m) => {
      if (excess > 0) {
        excess--;
        return '';
      }
      return m;
    });
  }

  // Auto-balance curly braces { and } (excluding escaped \{ and \})
  // Track open brace stack or brace depth associated with \left
  // When a \left is encountered, record the current brace depth
  // Only close braces that were opened AFTER the corresponding \left
  let openBraces = 0;
  let balanced = '';
  const leftBraceDepths: number[] = [];

  for (let i = 0; i < res.length; i++) {
    const ch = res[i];
    const prev = i > 0 ? res[i - 1] : '';

    if (res.startsWith('\\left', i)) {
      leftBraceDepths.push(openBraces);
    } else if (res.startsWith('\\right', i)) {
      const minBracesAtLeft = leftBraceDepths.pop() ?? 0;
      // If any unclosed { were opened inside this \left...\right group, close them before \right
      while (openBraces > minBracesAtLeft) {
        balanced += '}';
        openBraces--;
      }
    }

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

  // Final safeguard: Never allow empty \dfrac{} or bare \dfrac to escape to KaTeX
  res = res.replace(/\\(?:d?frac)\{\s*\}\s*\{\s*\}/g, '');
  res = res.replace(/\\(?:d?frac)\{\s*\}\s*\{([^{}]+)\}/g, '\\dfrac{1}{$1}');
  res = res.replace(/\\(?:d?frac)\{([^{}]+)\}\s*\{\s*\}/g, '\\dfrac{$1}{1}');
  res = res.replace(/\\(?:d?frac)\{\s*\}\s*/g, '');
  res = res.replace(/\\(?:d?frac)(?!\s*\{)/g, '');
  res = res.replace(/\u27E6MATH_\d+\u27E7/g, '');
  res = res.replace(/\[\s*MATH_\d+\s*\]/gi, '');
  res = res.replace(/⟦\s*MATH_\d+\s*⟧/gi, '');

  return res.trim();
}
