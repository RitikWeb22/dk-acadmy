import type { ProblemQuestionItem } from '../components/admin/DppPyq/DppPyqManagementWorkspace';

/**
 * Strips outer enclosing parentheses only when they truly wrap the entire string.
 * Uses a depth counter to prevent breaking adjacent parenthesized factors like (A)(B) into A)(B.
 */
export function stripOuterParens(str: string): string {
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
 * Universal Fraction Converter:
 * Robustly converts any mathematical quotient A/B into \frac{A}{B}
 * using balanced bracket scanning backwards and forwards.
 * Handles:
 * - Nested parentheses ((A)(B))/(C)
 * - \sqrt{...}/(...)
 * - 1/((...))
 * - 1/n^2, 1/n^16, 1/16, \sqrt{3}/2
 * - (\alpha+1)/\beta, 1/\alpha
 */
export function convertAllFractions(input: string): string {
  let str = input;
  let changed = true;
  let iterations = 0;

  while (changed && iterations < 20) {
    changed = false;
    iterations++;

    for (let i = 0; i < str.length; i++) {
      if (str[i] === '/' && (i === 0 || str[i - 1] !== '\\')) {
        // Look for numerator boundary to the left of '/'
        let leftEnd = i - 1;
        while (leftEnd >= 0 && /\s/.test(str[leftEnd])) leftEnd--;
        if (leftEnd < 0) continue;

        let leftStart = -1;
        if (str[leftEnd] === ')' || str[leftEnd] === '}') {
          const closeChar = str[leftEnd];
          const openChar = closeChar === ')' ? '(' : '{';
          let depth = 0;
          let p = leftEnd;
          while (p >= 0) {
            if (str[p] === closeChar) depth++;
            else if (str[p] === openChar) {
              depth--;
              if (depth === 0) {
                leftStart = p;
                let cmdCheck = p - 1;
                while (cmdCheck >= 0 && /[a-zA-Z\\]/.test(str[cmdCheck])) {
                  if (str[cmdCheck] === '\\') {
                    leftStart = cmdCheck;
                    break;
                  }
                  cmdCheck--;
                }
                break;
              }
            }
            p--;
          }
        } else {
          let p = leftEnd;
          while (p >= 0 && /[a-zA-Z0-9_\^\\\{\}α-ωΑ-Ω]/.test(str[p])) {
            p--;
          }
          leftStart = p + 1;
        }

        if (leftStart < 0 || leftStart > leftEnd) continue;

        // Look for denominator boundary to the right of '/'
        let rightStart = i + 1;
        while (rightStart < str.length && /\s/.test(str[rightStart])) rightStart++;
        if (rightStart >= str.length) continue;

        let rightEnd = -1;
        if (str[rightStart] === '(' || str[rightStart] === '{') {
          let p = rightStart;
          while (p < str.length && (str[p] === '(' || str[p] === '{')) {
            const openChar = str[p];
            const closeChar = openChar === '(' ? ')' : '}';
            let depth = 0;
            while (p < str.length) {
              if (str[p] === openChar) depth++;
              else if (str[p] === closeChar) {
                depth--;
                if (depth === 0) {
                  rightEnd = p;
                  p++;
                  break;
                }
              }
              p++;
            }
            // Skip spaces
            while (p < str.length && /\s/.test(str[p])) p++;
            // If the next character is '(' and followed by factors, continue consuming adjacent factors in denominator
            if (p < str.length && (str[p] === '(' || str[p] === '{')) {
              continue;
            } else {
              break;
            }
          }
        } else {
          let p = rightStart;
          while (p < str.length && /[a-zA-Z0-9_\^\\\{\}α-ωΑ-Ω]/.test(str[p])) {
            p++;
          }
          rightEnd = p - 1;
        }

        if (rightEnd < rightStart) continue;

        const num = str.substring(leftStart, leftEnd + 1).trim();
        const den = str.substring(rightStart, rightEnd + 1).trim();

        if (!num || !den) continue;

        const cleanNum = stripOuterParens(num);
        const cleanDen = stripOuterParens(den);

        const frac = `\\frac{${cleanNum}}{${cleanDen}}`;
        str = str.substring(0, leftStart) + frac + str.substring(rightEnd + 1);
        changed = true;
        break;
      }
    }
  }

  return str;
}

/**
 * Checks whether a text string contains un-delimited LaTeX expressions
 * and wraps them in $...$ or $$...$$ for KaTeX typesetting.
 */
export function autoWrapMathDelimiters(text: string): string {
  if (!text) return '';

  const trimmed = text.trim();
  const hasLaTeX = /\\(?:cot|tan|sin|cos|sec|csc|log|ln|lim|int|sum|prod|frac|dfrac|sqrt|vec|hat|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|lambda|mu|nu|xi|pi|rho|sigma|tau|phi|chi|psi|omega|left|right|begin|matrix)\b|\^\{|\^[0-9a-zA-Z]|\[\s*-?[0-9]+(?:\.[0-9]+)?\s*,\s*-?[0-9]+(?:\.[0-9]+)?\s*\]/.test(trimmed);

  if (!hasLaTeX) return text;

  const englishWords = trimmed.match(/\b(?:which|statement|following|correct|incorrect|true|false|both|neither|only|where|then|when|let|given|value|find|such|that)\b/gi);
  const isProse = englishWords && englishWords.length >= 2;

  // If the whole text is predominantly a math formula without prose words
  if (!isProse && !text.includes('$')) {
    return `$${trimmed}$`;
  }

  // Smart wrap all mathematical formulas within mixed prose:
  let s = text;

  // 1. Protect existing $...$ and $$...$$
  const protectedMath: string[] = [];
  const protect = (match: string) => {
    const key = `___PROT_MATH_${protectedMath.length}___`;
    protectedMath.push(`$${match.trim()}$`);
    return ` ${key} `;
  };

  s = s.replace(/\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$/g, (m) => {
    const key = `___PROT_MATH_${protectedMath.length}___`;
    protectedMath.push(m);
    return ` ${key} `;
  });

  // 2. Protect and wrap standalone fractions: \frac{...}{...}
  s = s.replace(/(?<![a-zA-Z0-9_\$])(\\(?:frac|dfrac)\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})(?![a-zA-Z0-9_\$])/g, (_, m) => protect(m));

  // 3. Protect and wrap intervals: e.g. [-1, 3] or [0, 1] or [-1,3]
  s = s.replace(/(?<![a-zA-Z0-9_\$])(\[\s*-?[0-9]+(?:\.[0-9]+)?\s*,\s*-?[0-9]+(?:\.[0-9]+)?\s*\])(?![a-zA-Z0-9_\$])/g, (_, m) => protect(m));

  // 4. Protect and wrap coordinate tuples containing Greek / vectors / subscripts: e.g. (\alpha, \beta) or (\alpha_1, \beta_1)
  s = s.replace(/(?<![a-zA-Z0-9_\$])(\(\s*\\[a-zA-Z]+(?:_[0-9a-zA-Z\{\}]+)?\s*,\s*\\[a-zA-Z]+(?:_[0-9a-zA-Z\{\}]+)?\s*\))(?![a-zA-Z0-9_\$])/g, (_, m) => protect(m));

  // 5. Wrap compound math expressions, equations, vector linear combinations, and polynomials:
  // e.g. \vec{a}=2\hat{i}+\alpha\hat{j}+\hat{k} or \lambda\vec{a}+2\vec{b} or 3\vec{a}-\lambda\vec{b} or \vec{a}+\vec{b}
  // e.g. \alpha\beta=-6 or \alpha_1^{2}+\beta_1^{2}-\alpha_2\beta_2
  const term = '(?:-?\\s*(?:[0-9]+|\\\\[a-zA-Z]+(?:\\{[^}]*\\}|_[0-9a-zA-Z\\{\\}]+|\\^[0-9a-zA-Z\\{\\}]+)*)\\s*)+';
  const compoundMath = new RegExp('(?<![a-zA-Z0-9_\\$])(' + term + '(?:[=+\\-−*/×⋅]|\\in|\\cdot|\\times)\\s*' + term + '(?:(?:[=+\\-−*/×⋅]|\\in|\\cdot|\\times)\\s*' + term + ')*)(?![a-zA-Z0-9_\\$])', 'g');
  s = s.replace(compoundMath, (_, m) => protect(m));

  // 6. Wrap remaining standalone LaTeX commands / variables outside $:
  // e.g. \vec{a}, \vec{b}, \lambda, \alpha, \beta, \hat{i}
  const isolatedMath = /(?<![a-zA-Z0-9_\$\\])(\\(?:vec\{[a-zA-Z0-9]+\}|hat\{[ijk]\}|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|lambda|mu|nu|xi|pi|rho|sigma|tau|phi|chi|psi|omega)(?:\{[^}]*\}|_[0-9a-zA-Z\{\}]+|\^[0-9a-zA-Z\{\}]+)*)(?![a-zA-Z0-9_\{])/g;
  s = s.replace(isolatedMath, (_, m) => protect(m));

  // 7. Restore all protected math expressions
  s = s.replace(/___PROT_MATH_(\d+)___/g, (_, idx) => protectedMath[Number(idx)]);

  // Clean spacing around punctuation and adjacent delimiters
  s = s.replace(/\$\s*\$/g, ' ');
  s = s.replace(/\s+,/g, ',');
  s = s.replace(/\s+\./g, '.');
  s = s.replace(/\s*:\s*$/, ' :');
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

/**
 * Normalizes math and LaTeX typography in copied/pasted text line-by-line:
 * - Preserves all line breaks (\n) and user spacing
 * - Cleans invisible MS Word / PDF formatting characters (Hair Space \u200A, Zero-Width Space, Function Application)
 * - Strips MS Word equation argument brackets 〖 and 〗 and placeholders ▒
 * - Normalizes Word math (∫_0^1, 0π4, log_e, lim_(n→∞), fractions, powers, multi-digit exponents)
 * - Automatically wraps formulas in $...$ per line while keeping labels like "(S1): " outside
 */
export function normalizeMathText(raw: string): string {
  if (!raw) return '';

  let text = raw;

  // 0. Global pre-pass for Word/PDF copy-paste artifacts across multi-line blocks
  // 0a. Strip invisible characters, hair spaces, zero-width spaces, and placeholders
  text = text.replace(/[\u200B\u200C\u200D\u200E\u200F\uFEFF\u200A\u2009\u202F\u2060\u2061\u2062\u2063\u2064\uFFF9-\uFFFD\u00A0]/g, ' ')
             .replace(/[▒□┤├│〖〗]/g, '')
             .replace(/[\u201C\u201D]/g, '"')
             .replace(/[\u2018\u2019]/g, "'")
             .replace(/[\u2212\u2013\u2014]/g, '-');

  // 0b. Clean duplicated \left\left( and \right\right)
  text = text.replace(/\\left\s*\\left\s*\(/g, '\\left(')
             .replace(/\\right\s*\\right\s*\)/g, '\\right)');

  // 0c. Word decomposed vertical characters for ( 1 + e ( ( 2 - 4 x ) ) ) dx (1+e ... dx
  text = text.replace(/\(\s*\r?\n*1\s*\r?\n*\+\s*\r?\n*e[\s\S]*?\)\s*\r?\n*\s*d\s*\r?\n*x\s*\r?\n*(?=\(1\+e)/g, '');
  text = text.replace(/\(1\+e[\s\S]*?\(\s*\(?\s*([0-9a-zA-Z\s−-]+)\s*\)?[\s\S]*?\)\s*\)\s*dx/g, '(1+e^{$1})\\,dx');

  // 0d. Collapse Word multiline math tokens like α \n + \n 1 or 2 \n - \n 4 \n x
  text = text.replace(/([0-9a-zA-Zα-ωΑ-Ω])\s*\r?\n+\s*([\+\-])\s*\r?\n+\s*([0-9a-zA-Zα-ωΑ-Ω])/g, '$1 $2 $3');
  text = text.replace(/([0-9a-zA-Zα-ωΑ-Ω])\s*\r?\n+\s*([\+\-])\s*\r?\n+\s*([0-9a-zA-Zα-ωΑ-Ω])\s*\r?\n+\s*([0-9a-zA-Zα-ωΑ-Ω])/g, '$1 $2 $3$4');

  // 0e. Word duplicated integrals: ∫\n0\n1\n∫\n0\n1 or ∫\n0\n1
  text = text.replace(/∫\s*\r?\n*\s*([0-9a-zA-Z]+)\s*\r?\n*\s*([0-9a-zA-Z]+)(?:\s*\r?\n*\s*∫\s*\r?\n*\s*\1\s*\r?\n*\s*\2)?/g, '\\int_{$1}^{$2} ');

  // 0f. Word shadow fraction: NUM \n DEN \n DEN \n NUM
  text = text.replace(/([0-9a-zA-Z\+\-\^\\\{\}α-ωΑ-Ω\s]+?)\r?\n+([0-9a-zA-Z\+\-\^\\\{\}α-ωΑ-Ω\s]+?)\r?\n+\s*\2\s*\r?\n+\s*([0-9a-zA-Z\+\-\^\\\{\}α-ωΑ-Ω\s]+?)(?=\r?\n|\\right|\)|$)/g, (match, num, den, shadowNum) => {
    const n1 = num.replace(/\s+/g, '');
    const n2 = shadowNum.replace(/\s+/g, '');
    if (n1 === n2 || n1.includes(n2) || n2.includes(n1)) {
      return `\\frac{${num.trim()}}{${den.trim()}}`;
    }
    return match;
  });

  // 0g. Multi-line Word stacked fractions: e.g. \log_e\left(\n27\n64\n\right) or (\n32\n27\n)
  text = text.replace(/(\\log_e|\\ln)?\s*(\\left)?\s*\(\s*([0-9a-zA-Zα-ωΑ-Ω\+\-\^\\\{\}]+)\s*\r?\n+\s*([0-9a-zA-Zα-ωΑ-Ω\+\-\^\\\{\}]+)\s*(\\right)?\s*\)/g,
    (_, logCmd, leftBracket, num, den) => {
      const logPrefix = logCmd ? `${logCmd} ` : '';
      return `${logPrefix}\\left(\\frac{${num.trim()}}{${den.trim()}}\\right)`;
    }
  );

  // 0h. Collapse newlines inside any \left( ... \right)
  text = text.replace(/\\left\s*([(\[{])\s*([\s\S]*?)\s*\\right\s*([)\]}])/g, (_, openB, inner, closeB) => {
    const singleLine = inner.replace(/\r?\n+/g, ' ').trim();
    return `\\left${openB}${singleLine}\\right${closeB}`;
  });

  // 0i. If fraction in integral is followed by factor in denominator: \frac{1}{5+2x-2x^2} (1+e^{2-4x})\,dx
  text = text.replace(/\\frac\{1\}\{([^}]+)\}\s*\((1\+e\^\{[^}]+\}\\,dx)/g, '\\frac{1}{($1)$2}');

  const lines = text.split(/\r?\n/);
  const processedLines = lines.map((line) => {
    let res = line;

    // 1. Clean residual Word brackets and placeholders
    res = res.replace(/[〖〗]/g, '');
    res = res.replace(/[\uFFF9-\uFFFD\u200A\u200B\u200C\u200D\u2060\u2061\u2062\u2063\u2064\uFEFF\u00A0]/g, ' ')
             .replace(/[▒□┤├│]/g, '')
             .replace(/[\u201C\u201D]/g, '"')
             .replace(/[\u2018\u2019]/g, "'")
             .replace(/[\u2212\u2013\u2014]/g, '-');

    // 1b. MS Word derivative prime: ϕ^' (t) or ∅^' (π/4) -> \phi'(t)
    res = res.replace(/([a-zA-Z\\]+)\s*\^['′]\s*/g, "$1' ");
    res = res.replace(/∅/g, '\\phi ');

    // 1c. MS Word combining vector arrows: a ⃗ or (OA) ⃗ or a\u20D7
    res = res.replace(/\(([A-Za-z]{1,3})\)\s*[\u20D7\u2192⃗]/g, '\\vec{$1}');
    res = res.replace(/([a-zA-Z])\s*[\u20D7\u2192⃗]/g, '\\vec{$1}');
    // Unit vectors: i ˆ or j ˆ or k ˆ or \u0302
    res = res.replace(/([ijk])\s*[\u0302\u02C6ˆ]/g, '\\hat{$1}');

    // 1d. Universal quantifiers and symbols
    res = res.replace(/∀\s*([a-zA-Z]+)\s*∈\s*R\b/g, '\\forall $1 \\in \\mathbb{R}');
    res = res.replace(/∀\s*([a-zA-Z]+)\s*([><=])/g, '\\forall $1 $2 ');
    res = res.replace(/∀\s*([a-zA-Z]+)/g, '\\forall $1 ');
    res = res.replace(/∀/g, '\\forall ');

    // 1e. Word equation quote artifacts: (length" of " arcAB)/(" length of " arcBC)=1/5
    res = res.replace(/\(?\s*length"\s*of\s*"\s*arc([A-Za-z]+)\s*\)?\s*\/\s*\(?\s*"?\s*length\s*of\s*"?\s*arc([A-Za-z]+)\s*\)?/gi, '\\frac{\\text{length of arc } $1}{\\text{length of arc } $2}');
    res = res.replace(/length"\s*of\s*"\s*arc([A-Za-z]+)/gi, '\\text{length of arc } $1');
    res = res.replace(/"\s*length\s*of\s*"\s*arc([A-Za-z]+)/gi, '\\text{length of arc } $1');

    // 2. Clean leading punctuation artifact like ".Let" -> "Let" or "1,If" -> "1. If"
    res = res.replace(/^\s*\.\s*(?=[A-Za-z])/g, '');
    res = res.replace(/^(\d+)[,]\s*(?=[A-Za-z])/g, '$1. ');

    // 3. Word Linear Math / UnicodeMath piecewise cases & arrays: {■( ... @ ... )┤ or {■( ... )
    res = res.replace(/(?:([a-zA-Z0-9_()]+\s*=\s*))?\{?\s*■\s*\(([\s\S]*?)\)\s*(?:┤|\}|(?=\n|[a-zA-Z]|$))/g, (_, lhs, content) => {
      const rows = content.split('@').map((r: string) => {
        let row = r.trim();
        row = row.replace(/∈/g, ' \\in ')
                 .replace(/∉/g, ' \\notin ')
                 .replace(/→/g, ' \\to ')
                 .replace(/e\^min\{([^}]+)\}/g, 'e^{\\min\\{$1\\}}')
                 .replace(/e\^max\{([^}]+)\}/g, 'e^{\\max\\{$1\\}}')
                 .replace(/\bmin\{/g, '\\min\\{')
                 .replace(/\bmax\{/g, '\\max\\{')
                 .replace(/e\^\[([^\]]+)\]/g, 'e^{[$1]}')
                 .replace(/(?<!\\)log_e\s*([0-9a-zA-Z]+)/g, '\\log_e $1')
                 .replace(/(?<!\\)log_e/g, '\\log_e ');
        return row;
      });
      const prefix = lhs ? lhs.trim() + ' ' : '';
      return `$$${prefix}\\begin{cases} ${rows.join(' \\\\ ')} \\end{cases}$$`;
    });

    // Normalize alternate LaTeX delimiters safely with callbacks
    res = res.replace(/\\\[([\s\S]*?)\\\]/g, (_, p1) => `$$${p1}$$`)
             .replace(/\\\(([\s\S]*?)\\\)/g, (_, p1) => `$${p1}$`);

    // 4. Repeated ellipses: ⋯… or …⋯ or ⋯ or … -> \dots
    res = res.replace(/[⋯…]+/g, ' \\dots ');

    // 4b. Unicode superscripts: e² -> e^{2}, x³ -> x^{3}, n¹⁵ -> n^{15}
    res = res.replace(/([a-zA-Z0-9_\)\]\}])([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿˣʸ]+)/g, (_, base, supers) => {
      const supMap: Record<string, string> = {
        '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
        '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
        '⁺': '+', '⁻': '-', 'ⁿ': 'n', 'ˣ': 'x', 'ʸ': 'y'
      };
      const cleanExp = supers.split('').map((c: string) => supMap[c] || c).join('');
      return `${base}^{${cleanExp}}`;
    });

    // 5. Integral limits: ∫_0^1▒ or ∫_0^(π/4)▒ or \int_0^(\pi/4) or ∫_0^1
    res = res.replace(/(?:∫|\\int)_([0-9a-zA-Z]+|\{[^}]+\}|\([^)]+\))\s*\^\s*(\([^)]+\)|\{[^}]+\}|[0-9a-zA-Z]+?)(?:▒|\s*(?=[0-9a-zA-Z\/\(\\])|$)\s*/g, (_, low, high) => {
      const cleanLow = stripOuterParens(low).replace(/[{}]/g, '').trim();
      let cleanHigh = stripOuterParens(high).replace(/[{}]/g, '').trim();
      cleanHigh = cleanHigh.replace(/π\/4|\\pi\/4/, '\\frac{\\pi}{4}')
                           .replace(/π\/2|\\pi\/2/, '\\frac{\\pi}{2}')
                           .replace(/π/, '\\pi');
      return `\\int_{${cleanLow}}^{${cleanHigh}} `;
    });
    res = res.replace(/▒/g, ' ');
    res = res.replace(/∫01\b/g, '\\int_0^1 ')
             .replace(/∫02\b/g, '\\int_0^2 ')
             .replace(/∫0π2\b/g, '\\int_0^{\\pi/2} ')
             .replace(/(?:∫|(?<=\s|^))0π4\b/g, '\\int_0^{\\frac{\\pi}{4}} ')
             .replace(/(?:∫|(?<=\s|^))0∞\b/g, '\\int_0^\\infty ')
             .replace(/∫-loge\s*2loge\s*2\b/g, '\\int_{-\\ln 2}^{\\ln 2} ')
             .replace(/(?:∫|(?<=\s|^))-π4π4\b/g, '\\int_{-\\frac{\\pi}{4}}^{\\frac{\\pi}{4}} ')
             .replace(/∫_\{?([0-9a-zA-Z]+)\}?\^\{?([0-9a-zA-Z]+)\}?/g, '\\int_{$1}^{$2} ')
             .replace(/∫/g, '\\int ');

    // 6. Exponential powers: e^(-π/4) -> e^{-\frac{\pi}{4}}, e^(2-4x) -> e^{2-4x}, e^(-x) -> e^{-x}
    res = res.replace(/e\^\(([^()]+)\)/g, (_, p) => {
      let cleanP = p.replace(/π\/4|\\pi\/4/, '\\frac{\\pi}{4}')
                    .replace(/π\/2|\\pi\/2/, '\\frac{\\pi}{2}')
                    .replace(/π/, '\\pi');
      return `e^{${cleanP.trim()}}`;
    });
    res = res.replace(/e\^([0-9a-zA-Z]+)/g, 'e^{$1}');
    // Also any base^digit without braces: x^2 -> x^{2}, a^2 -> a^{2}
    res = res.replace(/([a-zA-Z0-9_\)\]\}])\^([0-9a-zA-Z])(?![0-9a-zA-Z\{])/g, '$1^{$2}');

    // 7. Limits: lim_(n→∞) or lim_(x→0)
    res = res.replace(/lim_?\s*\(([^)]+)\)\s*/g, (_, inner) => {
      const clean = inner.replace(/→/, '\\to ').replace(/∞/, '\\infty');
      return `\\lim_{${clean.trim()}} `;
    });
    res = res.replace(/lim\s*([a-zA-Z]+)\s*→\s*∞/g, '\\lim_{$1 \\to \\infty} ');
    res = res.replace(/lim\s*([a-zA-Z]+)\s*→\s*([0-9a-zA-Z]+)/g, '\\lim_{$1 \\to $2} ');

    // 8. Trig functions: tan^50 x -> \tan^{50} x
    res = res.replace(/(cot|tan|sin|cos|sec|csc)\^([0-9]+)\s*x/gi, (_, fn, p) => `\\${fn.toLowerCase()}^{${p}} x`);
    res = res.replace(/(?<!\\)(cot|tan|sin|cos|sec|csc)\b/gi, (match) => `\\${match.toLowerCase()} `);
    res = res.replace(/\\?\b(cot|tan|sin|cos|sec|csc)\s*[\^⁻](\-?1|¹)\b/gi, (_, fn) => `\\${fn.toLowerCase()}^{-1}`);
    res = res.replace(/\\?\b(cot|tan|sin|cos|sec|csc)⁻¹/gi, (_, fn) => `\\${fn.toLowerCase()}^{-1}`);

    // Differentials: xdx -> x\,dx, )dx -> )\,dx
    res = res.replace(/([0-9a-zA-Z\)\]\}])\s*dx\b/g, '$1\\,dx');
    res = res.replace(/sint\b/gi, '\\sin t');
    res = res.replace(/sinxdx\b/gi, '\\sin x\\,dx');
    res = res.replace(/cos2([ABC])\b/g, '\\cos 2$1');

    // 9. Square roots: √( ... ) with balanced parens to \sqrt{ ... }
    res = res.replace(/√\s*\(((?:[^()]|\((?:[^()]|\([^()]*\))*\))*)\)/g, (_, g1) => `\\sqrt{${g1.trim()}}`);
    res = res.replace(/√\s*([0-9a-zA-Z]+)/g, '\\sqrt{$1}');
    res = res.replace(/√/g, '\\sqrt');

    // 10. Universal Fractions: converts all quotients A/B into \frac{A}{B}
    res = convertAllFractions(res);

    // 10b. Normalize powers with unbraced fractions: x^\frac{{2}}{2} -> x^{\frac{2}{2}}
    res = res.replace(/\^\\frac\{\{([^}]+)\}\}\{([^}]+)\}/g, '^{\\frac{$1}{$2}}');
    res = res.replace(/\^\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '^{\\frac{$1}{$2}}');
    res = res.replace(/\^(\\frac\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g, '^{$1}');

    // 11. Multi-digit exponents without braces: 1^15 -> 1^{15}, n^16 -> n^{16} (run after fractions!)
    res = res.replace(/([a-zA-Z0-9_\)\]\}])\^([0-9]{2,})\b/g, '$1^{$2}');

    // 12. Greek letters (run after fractions so \frac doesn't get corrupted)
    res = res.replace(/α/g, '\\alpha ')
             .replace(/β/g, '\\beta ')
             .replace(/γ/g, '\\gamma ')
             .replace(/θ/g, '\\theta ')
             .replace(/λ/g, '\\lambda ')
             .replace(/π/g, '\\pi ')
             .replace(/μ/g, '\\mu ')
             .replace(/σ/g, '\\sigma ')
             .replace(/ω/g, '\\omega ')
             .replace(/ϕ/g, '\\phi ')
             .replace(/∅/g, '\\phi ')
             .replace(/Δ/g, '\\Delta ');

    // 12b. Greek subscripts: α_1 -> \alpha_1, etc.
    res = res.replace(/\\(alpha|beta|gamma|theta|lambda|pi|sigma|phi|omega)\s*(?=[_^\\]|[0-9])/g, '\\$1');
    res = res.replace(/\\(alpha|beta|gamma|theta|lambda|pi|sigma|phi|omega)_([0-9a-zA-Z]+)/g, '\\$1_{$2}');
    res = res.replace(/\(\\alpha_\{?([0-9])\}?\s*,\s*\\beta_\{?([0-9])\}?\s*\)/g, '(\\alpha_{$1}, \\beta_{$2})');
    res = res.replace(/,([\\a-zA-Z])/g, ', $1');

    // 13. Arrows, dots, and symbols
    res = res.replace(/→/g, ' \\to ')
             .replace(/←/g, ' \\leftarrow ')
             .replace(/∈/g, ' \\in ')
             .replace(/∉/g, ' \\notin ')
             .replace(/⊂/g, ' \\subset ')
             .replace(/⊆/g, ' \\subseteq ')
             .replace(/∪/g, ' \\cup ')
             .replace(/∩/g, ' \\cap ')
             .replace(/⋅/g, ' \\cdot ')
             .replace(/±/g, '\\pm ')
             .replace(/≠/g, '\\neq ')
             .replace(/≤/g, '\\le ')
             .replace(/≥/g, '\\ge ')
             .replace(/×/g, '\\times ')
             .replace(/÷/g, '\\div ')
             .replace(/∞/g, '\\infty ')
             .replace(/°/g, '^\\circ ')
             .replace(/(?<!\\)log_e\s*/g, '\\log_e ')
             .replace(/loge\b/g, '\\log_e ');

    // Clean any duplicated \left\left( or \right\right)
    res = res.replace(/\\left\s*\\left\s*\(/g, '\\left(')
             .replace(/\\right\s*\\right\s*\)/g, '\\right)');

    // 14. Dynamic parens for functions enclosing fractions (ensure not already preceded by \left)
    res = res.replace(/(?<!\\left)\s*(\\(?:log_e|ln|cot|tan|sin|cos|sec|csc))\s*\(([^()]*\\frac[^()]*)\)/g, '$1\\left($2\\right)');
    // 14b. Scale parentheses enclosing fractions to dynamic tall brackets \left( ... \right)
    res = res.replace(/(?<!\\left)\s*\(([^\(\)]*\\frac[^\(\)]*)\)/g, ' \\left($1\\right)');

    // 15. Words inside formulas: where -> \text{ ... }
    res = res.replace(/(?<=[,\$])\s*(where)\s+/gi, ' \\text{$1} ');

    // 16. Vectors in 3D: i+2j+k -> \hat{i} + 2\hat{j} + \hat{k}
    res = res.replace(/\b([0-9]*)\s*i\s*([+-])\s*([0-9]*)\s*j\s*([+-])\s*([0-9]*)\s*k\b/g, (_, c1, s1, c2, s2, c3) => {
      return `${c1 || ''}\\hat{i} ${s1} ${c2 || ''}\\hat{j} ${s2} ${c3 || ''}\\hat{k}`;
    });

    // 17. Normalize double backslashes
    res = res.replace(/\\\\([a-zA-Z]+)/g, '\\$1');

    // 18. Smart Delimiters: Wrap formulas cleanly without breaking prose sentences into clunky block cards
    if (!res.includes('$') && !res.startsWith('\\begin{')) {
      let prefix = '';
      let body = res;
      // Match question and option prefixes: e.g. "(S1): ", "1. ", "A. ", "B) ", "C ", "(D) ", "D "
      const prefixMatch = res.match(/^(\s*(?:\([a-zA-Z0-9]+\)|[0-9]+[.,]|[A-D][.,\)]|\([A-D]\)|[A-D]\s+)\s*[:=\-]?\s*)([\s\S]+)$/);
      if (prefixMatch) {
        prefix = prefixMatch[1];
        body = prefixMatch[2];
      }

      // Automatically scale tall brackets for fractions in options and expressions
      body = body.replace(/\\left\(\s*\\frac/g, '\\left(\\dfrac');

      const hasMathSyntax = /\\(?:frac|dfrac|int|lim|sum|prod|sqrt|alpha|beta|pi|tan|sin|cos|log_e|log|ln|dots|to|infty|left|right|vec|hat|in|ge|le|times|cdot|forall)\b|\^\{|\^[0-9a-zA-Z]|\\[\(\)]/.test(body);

      // Case C: Explicit check for "If [formula] then [formula] is equal to."
      const ifMatch = body.match(/^(If\s+)([\s\S]+?)(,\s*(?:\\text\{then\}|then)\s+|\s+(?:\\text\{then\}|then)\s+)([\s\S]+?)(\s+(?:is equal to\.?|is\s*:?|\.|$))$/i);
      if (ifMatch) {
        res = `${prefix}${ifMatch[1]}$ ${ifMatch[2].trim()} $ then $ ${ifMatch[4].trim()} $${ifMatch[5]}`;
      } else {
        const englishProseWords = body.match(/\b(?:which|statement|following|correct|incorrect|true|false|both|neither|only|where|when|let|given|value|find|such|that|because|since)\b/gi);
        const isProse = englishProseWords && englishProseWords.length >= 2;

        if (hasMathSyntax && !isProse) {
          // Case B: "The value of [formula] is"
          const valMatch = body.match(/^((?:The value of|Evaluate|Find)\s+)([\s\S]+?)(\s+(?:is equal to\.?|is\s*:?|\.|$))$/i);
          if (valMatch) {
            res = `${prefix}${valMatch[1]}$ ${valMatch[2].trim()} $${valMatch[3]}`;
          }
          // Case D: Pure math equation / expression (like (e-1)(e^2 + \frac{1}{2}) or \log_e\left(\frac{32}{27}\right))
          else {
            const tailMatch = body.match(/^([\s\S]+?)(\s+(?:is equal to\.?|is\s*:?|\.|$))$/i);
            if (tailMatch && tailMatch[2] && tailMatch[2].trim().length > 0 && !tailMatch[1].includes('=')) {
              res = `${prefix}$ ${tailMatch[1].trim()} $${tailMatch[2]}`;
            } else {
              res = `${prefix}$ ${body.trim()} $`;
            }
          }
        } else if (hasMathSyntax && isProse) {
          res = `${prefix}${autoWrapMathDelimiters(body)}`;
        } else {
          // If it's a standalone fraction like "\frac{1}{16}" without surrounding text, wrap in math
          if (/^\s*\\(?:frac|dfrac)\{[^{}]+\}\{[^{}]+\}\s*$/.test(res)) {
            res = `$ ${res.trim()} $`;
          }
        }
      }
    }

    return res;
  });

  return processedLines.join('\n');
}

/**
 * Universal Bulk Question Parser
 * Supports:
 * 1. JSON Array of questions
 * 2. CSV / TSV with headers or standard column order
 * 3. Plain Text question banks (Q1. ... (A) ... (B) ... (C) ... (D) ... Ans: A)
 * 4. NTA / JEE numbered option styles: (1), (2), (3), (4)
 */
export function parseBulkQuestions(
  rawInput: string,
  defaultTopic: string = 'General',
  defaultYear?: string
): { questions: ProblemQuestionItem[]; errors: string[] } {
  const text = (rawInput || '').trim();

  if (!text) {
    return { questions: [], errors: ['No text provided to parse.'] };
  }

  // 1. Try JSON Array parsing
  if (text.startsWith('[') || text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const validQuestions: ProblemQuestionItem[] = items.map((item, idx) => {
        const qNum = typeof item.qNum === 'number' ? item.qNum : idx + 1;
        const statement = normalizeMathText(item.statement || item.question || item.title || `Question ${qNum}`);
        const topic = item.topic || defaultTopic;

        const validKeys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
        let options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = [
          { key: 'A', text: 'Option A' },
          { key: 'B', text: 'Option B' },
          { key: 'C', text: 'Option C' },
          { key: 'D', text: 'Option D' }
        ];

        if (Array.isArray(item.options) && item.options.length > 0) {
          options = item.options.map((opt: any, oIdx: number) => {
            const rawKey = typeof opt === 'object' && opt?.key ? String(opt.key).trim().toUpperCase() : '';
            const key: 'A' | 'B' | 'C' | 'D' = validKeys.includes(rawKey as any)
              ? (rawKey as 'A' | 'B' | 'C' | 'D')
              : validKeys[oIdx] || 'A';
            const optText = typeof opt === 'string' ? opt : opt.text || `Option ${oIdx + 1}`;
            return {
              key,
              text: normalizeMathText(optText)
            };
          });
        } else if (item.optionA || item.A) {
          options = [
            { key: 'A', text: normalizeMathText(item.optionA || item.A || '') },
            { key: 'B', text: normalizeMathText(item.optionB || item.B || '') },
            { key: 'C', text: normalizeMathText(item.optionC || item.C || '') },
            { key: 'D', text: normalizeMathText(item.optionD || item.D || '') }
          ];
        }

        const rawKey = String(item.correctKey || item.answer || item.correct || 'A').trim().toUpperCase();
        const correctKey = (['A', 'B', 'C', 'D'].includes(rawKey) ? rawKey : 'A') as 'A' | 'B' | 'C' | 'D';

        return {
          id: item.id || `q-bulk-${Date.now()}-${idx + 1}`,
          qNum,
          statement,
          topic,
          options,
          correctKey,
          stepSolution: normalizeMathText(item.stepSolution || item.solution || item.explanation || 'Step solution provided.'),
          dkSirShortcut: normalizeMathText(item.dkSirShortcut || item.shortcut || ''),
          difficulty: ['Easy', 'Moderate', 'Challenging'].includes(item.difficulty) ? item.difficulty : 'Moderate',
          examYear: item.examYear || defaultYear || 'JEE Main 2025',
          videoUrl: item.videoUrl || item.youtubeUrl || '',
          pdfUrl: item.pdfUrl || '',
          isFree: item.isFree !== false
        };
      });

      if (validQuestions.length > 0) {
        return { questions: validQuestions, errors: [] };
      }
    } catch {
      // Not valid JSON, proceed to CSV / Text parser
    }
  }

  // 2. Try CSV Parsing
  const csvRows = parseCSV(text);
  if (csvRows.length >= 2 && csvRows[0].length >= 5) {
    const firstRowStr = csvRows[0].join(' ').toLowerCase();
    const isHeader =
      firstRowStr.includes('question') ||
      firstRowStr.includes('statement') ||
      firstRowStr.includes('option') ||
      firstRowStr.includes('correct');

    const dataRows = isHeader ? csvRows.slice(1) : csvRows;
    const questions: ProblemQuestionItem[] = [];

    dataRows.forEach((row, idx) => {
      if (row.length < 5 || !row[0]?.trim()) return;

      const statement = normalizeMathText(row[0]?.trim() || `Question ${idx + 1}`);
      const optA = normalizeMathText(row[1]?.trim() || 'Option A');
      const optB = normalizeMathText(row[2]?.trim() || 'Option B');
      const optC = normalizeMathText(row[3]?.trim() || 'Option C');
      const optD = normalizeMathText(row[4]?.trim() || 'Option D');

      const rawAns = (row[5] || 'A').trim().toUpperCase().charAt(0);
      const correctKey = (['A', 'B', 'C', 'D'].includes(rawAns) ? rawAns : 'A') as 'A' | 'B' | 'C' | 'D';

      const stepSolution = normalizeMathText(row[6]?.trim() || 'Step-by-step solution provided.');
      const dkSirShortcut = normalizeMathText(row[7]?.trim() || '');
      const videoUrl = row[8]?.trim() || '';
      const pdfUrl = row[9]?.trim() || '';
      const topic = row[10]?.trim() || defaultTopic;
      const rawDiff = row[11]?.trim() || 'Moderate';
      const difficulty = (['Easy', 'Moderate', 'Challenging'].includes(rawDiff) ? rawDiff : 'Moderate') as any;
      const examYear = row[12]?.trim() || defaultYear || 'JEE Main 2025';
      const rawFree = row[13]?.trim()?.toLowerCase();
      const isFree = rawFree === 'false' ? false : true;

      questions.push({
        id: `q-csv-${Date.now()}-${idx + 1}`,
        qNum: idx + 1,
        statement,
        topic,
        options: [
          { key: 'A', text: optA },
          { key: 'B', text: optB },
          { key: 'C', text: optC },
          { key: 'D', text: optD }
        ],
        correctKey,
        stepSolution,
        dkSirShortcut,
        videoUrl,
        pdfUrl,
        difficulty,
        examYear,
        isFree
      });
    });

    if (questions.length > 0) {
      return { questions, errors: [] };
    }
  }

  // 3. Try Structured Text Parser with Math & Indian Examination Normalization
  const textQuestions = parseStructuredText(text, defaultTopic, defaultYear);
  if (textQuestions.length > 0) {
    return { questions: textQuestions, errors: [] };
  }

  return {
    questions: [],
    errors: [
      'Could not parse questions. Please use CSV format with at least 5 columns, standard JSON, or numbered blocks (Q1. ... (A) ... (B) ... (C) ... (D) ... Ans: A).'
    ]
  };
}

/**
 * Standard CSV line & quote parser
 */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if (char === '\t' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parses plain-text questions in various Indian entrance exam format variants.
 * Handles Math equations containing variables A, B, C, D without corrupting options.
 */
function parseStructuredText(
  text: string,
  defaultTopic: string,
  defaultYear?: string
): ProblemQuestionItem[] {
  const questions: ProblemQuestionItem[] = [];

  // Split by question markers:
  // Must be at line start, e.g. "Q1.", "Question 1:", "Problem 1.", "1. " followed by a letter or formula
  const qBlocks = text
    .split(/(?:^|\n)(?=\s*(?:Q(?:uestion)?\s*#?\s*\d+[\.\:\)]|\bProblem\s*\d+[\.\:\)]|\bQ\d+[\.\:\)]|(?:\d{1,3}[\.\)]\s+(?=[A-Z\$\\\*\#]))))/i)
    .filter((b) => b.trim().length > 0);

  // If text didn't split into multiple questions, treat whole input as 1 question block
  const blocksToProcess = qBlocks.length > 0 ? qBlocks : [text];

  blocksToProcess.forEach((rawBlock, idx) => {
    const block = rawBlock.trim();
    if (!block || block.length < 8) return;

    // Clean leading Q1. or 1.
    const cleanBlock = block.replace(/^\s*(?:Q(?:uestion)?\s*#?\s*\d+[\.\:\)]|\bProblem\s*\d+[\.\:\)]|\bQ\d+[\.\:\)]|\d{1,3}[\.\)]\s*)\s*/i, '');

    // Extract Answer / Correct Key
    const ansMatch = cleanBlock.match(/(?:Ans(?:wer)?|Correct(?:\s*(?:Key|Option))?|Option)\s*[:=\-]\s*[(]?([A-Da-d1-4])[)]?/i);
    let rawAns = ansMatch ? ansMatch[1].toUpperCase() : 'A';
    // Map NTA 1,2,3,4 to A,B,C,D
    if (rawAns === '1') rawAns = 'A';
    else if (rawAns === '2') rawAns = 'B';
    else if (rawAns === '3') rawAns = 'C';
    else if (rawAns === '4') rawAns = 'D';
    const correctKey = (['A', 'B', 'C', 'D'].includes(rawAns) ? rawAns : 'A') as 'A' | 'B' | 'C' | 'D';

    // Extract Solution
    const solMatch = cleanBlock.match(/(?:^|\n)\s*(?:Sol(?:ution)?|Expl(?:anation)?)\s*[:=\-]\s*([\s\S]+?)(?=(?:\n\s*(?:Shortcut|Trick|DK\s*Sir|Video|PDF|Topic)|$))/i);
    const stepSolution = solMatch ? normalizeMathText(solMatch[1]) : 'Step solution provided.';

    // Extract DK Sir Shortcut
    const shortcutMatch = cleanBlock.match(/(?:^|\n)\s*(?:Shortcut|Trick|DK\s*Sir)\s*[:=\-]\s*([\s\S]+?)(?=(?:\n\s*(?:Video|PDF|Topic)|$))/i);
    const dkSirShortcut = shortcutMatch ? normalizeMathText(shortcutMatch[1]) : '';

    // Extract Video & PDF
    const videoMatch = cleanBlock.match(/(?:Video(?:\s*URL)?|YouTube)\s*[:=\-]\s*(https?:\/\/[^\s\n]+)/i);
    const videoUrl = videoMatch ? videoMatch[1].trim() : '';

    const pdfMatch = cleanBlock.match(/(?:PDF(?:\s*URL)?)\s*[:=\-]\s*(https?:\/\/[^\s\n]+)/i);
    const pdfUrl = pdfMatch ? pdfMatch[1].trim() : '';

    // Separate question text from metadata (remove Sol, Shortcut, Video, PDF from body)
    let body = cleanBlock;
    const metaIndex = cleanBlock.search(/(?:^|\n)\s*(?:Ans(?:wer)?|Correct(?:\s*Key)?|Sol(?:ution)?|Expl(?:anation)?|Shortcut|DK\s*Sir|Video|PDF)\s*[:=\-]/i);
    if (metaIndex !== -1) {
      body = cleanBlock.substring(0, metaIndex).trim();
    }

    // Now extract statement and options A, B, C, D (or 1, 2, 3, 4)
    const { statement, options } = extractStatementAndOptions(body);

    questions.push({
      id: `q-text-${Date.now()}-${idx + 1}`,
      qNum: idx + 1,
      statement: normalizeMathText(statement || `Question ${idx + 1}`),
      topic: defaultTopic,
      options: options.map((opt) => ({
        key: opt.key,
        text: normalizeMathText(opt.text)
      })),
      correctKey,
      stepSolution,
      dkSirShortcut,
      videoUrl,
      pdfUrl,
      difficulty: 'Moderate',
      examYear: defaultYear || 'JEE Main 2025',
      isFree: true
    });
  });

  return questions;
}

/**
 * Robustly separates Question Statement and 4 MCQ Options.
 * Supports:
 * 1. Bare horizontal Word options: A -21.  B 21.  C 19.  D 0
 * 2. 2-column Word table options: A ... C ... \n B ... D ...
 * 3. Standard lines: (A) ... (B) ... (C) ... (D) ... or A) ... B) ... or A. ... B. ...
 * 4. NTA numbers: (1) ... (2) ... (3) ... (4) ... or 1. ... 2. ...
 * Cleans leading question numbers (1,If ... -> If ...) and trailing dots on numeric options (-21. -> -21).
 */
export function extractStatementAndOptions(text: string): {
  statement: string;
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correctKey?: 'A' | 'B' | 'C' | 'D';
} {
  const defaultOptions: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = [
    { key: 'A', text: 'Option A' },
    { key: 'B', text: 'Option B' },
    { key: 'C', text: 'Option C' },
    { key: 'D', text: 'Option D' }
  ];

  if (!text) {
    return { statement: '', options: defaultOptions };
  }

  // 1. Clean leading question numbers e.g. "18..Let", "18. Let", "1, If", "Q1."
  let cleanText = text
    .replace(/^\s*(?:Q(?:uestion)?\s*#?\s*\d+[\.\:\,\)]+|\bProblem\s*\d+[\.\:\,\)]+|\bQ\d+[\.\:\,\)]+|\d{1,3}[\.\,\)]+)\s*/i, '')
    .trim();
  // Strip leading dots artifact: e.g. "..Let" or ".Let"
  cleanText = cleanText.replace(/^\s*[\.\,]+\s*(?=[A-Za-z])/g, '');

  // Look for answer key if present in text
  const ansMatch = cleanText.match(/(?:Ans(?:wer)?|Correct(?:\s*(?:Key|Option))?|Option)\s*[:=\-]\s*[(]?([A-Da-d1-4])[)]?/i);
  let detectedCorrectKey: ('A' | 'B' | 'C' | 'D') | undefined;
  if (ansMatch) {
    let raw = ansMatch[1].toUpperCase();
    if (raw === '1') raw = 'A';
    else if (raw === '2') raw = 'B';
    else if (raw === '3') raw = 'C';
    else if (raw === '4') raw = 'D';
    if (['A', 'B', 'C', 'D'].includes(raw)) detectedCorrectKey = raw as any;
  }

  // Strategy 1: Match genuine options A, B, C, D
  // Exclude false positives where 'A' is part of prose (e.g. "point A divide", "matrix A", "set A", "arc AC")
  const optPattern = /(?:^|\r?\n|\s{2,}|\t)(?:\(([A-Da-d])\)|\[([A-Da-d])\]|\b([A-Da-d])\s*[\.\)\:\-]\s*|\b([A-Da-d])\s+(?=[0-9\-\+\(\$]|\\(?:frac|sqrt|log|pi|alpha|beta)|[A-Z][a-z]{0,2}\b))/g;
  const matches: { index: number; key: string; fullLength: number; matchStart: number }[] = [];
  let m: RegExpExecArray | null;

  while ((m = optPattern.exec(cleanText)) !== null) {
    const rawKey = (m[1] || m[2] || m[3] || m[4]).toUpperCase();
    matches.push({
      index: m.index,
      key: rawKey,
      fullLength: m[0].length,
      matchStart: m.index + (m[0].length - m[0].trimStart().length)
    });
  }

  // Filter out prose variables (e.g. "point A", "set A", "A and B", "A divides")
  const validMatches = matches.filter((item) => {
    const beforeSnippet = cleanText.substring(Math.max(0, item.index - 20), item.index).toLowerCase();
    const afterSnippet = cleanText.substring(item.index, item.index + 20).toLowerCase();

    if (/\b(?:point|set|matrix|vector|vertex|arc|plane|line|segment|triangle|centre|internally)\s*$/i.test(beforeSnippet)) {
      return false;
    }
    if (/^[A-Da-d]\s+(?:divides?|and|is|are|lies|has|be|such|of|satisfy|satisfies|belongs?)\b/i.test(afterSnippet)) {
      return false;
    }
    return true;
  });

  // Find the BEST contiguous sequence of A -> B -> C -> D towards the end of text
  let bestA: { a: any; b: any; c?: any; d?: any } | null = null;
  const aMatches = validMatches.filter((item) => item.key === 'A');

  for (const a of aMatches) {
    const bAfter = validMatches.find((item) => item.key === 'B' && item.index > a.index);
    const cAfter = validMatches.find((item) => item.key === 'C' && item.index > (bAfter?.index || 0));
    const dAfter = validMatches.find((item) => item.key === 'D' && item.index > (cAfter?.index || 0));

    if (bAfter && (cAfter || dAfter)) {
      bestA = { a, b: bAfter, c: cAfter, d: dAfter };
    }
  }

  if (bestA) {
    const statement = cleanText.substring(0, bestA.a.matchStart).trim();
    const seq = [bestA.a, bestA.b, bestA.c, bestA.d].filter(Boolean);

    const optionsMap: Record<'A' | 'B' | 'C' | 'D', string> = {
      A: '',
      B: '',
      C: '',
      D: ''
    };

    for (let i = 0; i < seq.length; i++) {
      const curr = seq[i];
      const next = seq[i + 1];
      const optKey = curr.key;
      const keyPos = cleanText.indexOf(optKey, curr.matchStart);
      const contentStart = keyPos + 1;
      const contentEnd = next ? next.matchStart : cleanText.length;
      let optText = cleanText.substring(contentStart, contentEnd).trim();
      optText = optText.replace(/^[\.\)\:\-\s]+/, '').trim();
      optText = optText.replace(/([0-9]+)\.\s*$/, '$1').trim();
      optionsMap[optKey as 'A' | 'B' | 'C' | 'D'] = optText;
    }

    return {
      statement: statement || 'Question',
      options: [
        { key: 'A', text: optionsMap.A || 'Option A' },
        { key: 'B', text: optionsMap.B || 'Option B' },
        { key: 'C', text: optionsMap.C || 'Option C' },
        { key: 'D', text: optionsMap.D || 'Option D' }
      ],
      ...(detectedCorrectKey ? { correctKey: detectedCorrectKey } : {})
    };
  }

  // Strategy 2: NTA style (1), (2), (3), (4) or 1., 2., 3., 4.
  const numRegex = /(?:^|[\s\n])(?:\(([1-4])\)|\[([1-4])\]|\b([1-4])\b[.:\s\-)])\s*/g;
  const numMatches: { index: number; key: string; length: number }[] = [];
  let nm: RegExpExecArray | null;

  while ((nm = numRegex.exec(text)) !== null) {
    const rawNum = (nm[1] || nm[2] || nm[3]);
    numMatches.push({
      index: nm.index,
      key: rawNum,
      length: nm[0].length
    });
  }

  const numFoundKeys = new Set(numMatches.map((item) => item.key));
  if (numFoundKeys.has('1') && numFoundKeys.has('2') && (numFoundKeys.has('3') || numFoundKeys.has('4'))) {
    const first1 = numMatches.find((item) => item.key === '1')!;
    const rawStatement = text.substring(0, first1.index).trim();
    const cleanStatement = rawStatement
      .replace(/^\s*(?:Q(?:uestion)?\s*#?\s*\d+[\.\:\,\)]|\bProblem\s*\d+[\.\:\,\)]|\bQ\d+[\.\:\,\)]|\d{1,3}[\.\,\)]\s*)\s*/i, '')
      .trim();

    const optionsMap: Record<'A' | 'B' | 'C' | 'D', string> = {
      A: '',
      B: '',
      C: '',
      D: ''
    };

    const keyMap: Record<string, 'A' | 'B' | 'C' | 'D'> = {
      '1': 'A',
      '2': 'B',
      '3': 'C',
      '4': 'D'
    };

    const sorted = numMatches.filter((item) => item.index >= first1.index);
    for (let i = 0; i < sorted.length; i++) {
      const curr = sorted[i];
      const next = sorted[i + 1];
      const start = curr.index + curr.length;
      const end = next ? next.index : text.length;
      let optText = text.substring(start, end).trim();
      optText = optText.replace(/([0-9]+)\.\s*$/, '$1').trim();
      const targetLetter = keyMap[curr.key] || 'A';
      optionsMap[targetLetter] = optText;
    }

    return {
      statement: cleanStatement || 'Question',
      options: [
        { key: 'A', text: optionsMap.A || 'Option A' },
        { key: 'B', text: optionsMap.B || 'Option B' },
        { key: 'C', text: optionsMap.C || 'Option C' },
        { key: 'D', text: optionsMap.D || 'Option D' }
      ],
      ...(detectedCorrectKey ? { correctKey: detectedCorrectKey } : {})
    };
  }

  // Fallback: No options detected, clean leading question number if present
  const cleanStatement = text
    .replace(/^\s*(?:Q(?:uestion)?\s*#?\s*\d+[\.\:\,\)]|\bProblem\s*\d+[\.\:\,\)]|\bQ\d+[\.\:\,\)]|\d{1,3}[\.\,\)]\s*)\s*/i, '')
    .trim();

  return {
    statement: cleanStatement || text.trim(),
    options: defaultOptions,
    ...(detectedCorrectKey ? { correctKey: detectedCorrectKey } : {})
  };
}

/**
 * Generates and triggers download of the standard Questions CSV Template
 */
export function downloadQuestionsTemplateCsv(): void {
  const headers = [
    'Question Statement',
    'Option A',
    'Option B',
    'Option C',
    'Option D',
    'Correct Key (A/B/C/D)',
    'Step Solution',
    'DK Sir Kota Shortcut',
    'Video Solution URL',
    'PDF Solution URL',
    'Topic',
    'Difficulty (Easy/Moderate/Challenging)',
    'Exam Year',
    'Is Free Preview (TRUE/FALSE)'
  ];

  const sampleRows = [
    [
      '"If the vectors a = 2i - j + k, b = i + 2j - 3k, and c = 3i + pj + 5k are coplanar, then the scalar parameter p equals:"',
      '"-4"',
      '"2"',
      '"0"',
      '"6"',
      '"A"',
      '"For coplanar vectors, the scalar triple product [a b c] = 0. Expanding determinant gives 7p + 28 = 0 => p = -4."',
      '"DK Sir 20s Inspection Shortcut: Substitute p = -4 into row 3; rows 1 and 2 linearly sum to give zero determinant."',
      '"https://www.youtube.com/watch?v=dQw4w9WgXcQ"',
      '"https://example.com/vectors-notes.pdf"',
      '"Vectors & 3D Geometry"',
      '"Moderate"',
      '"JEE Main 2025"',
      '"TRUE"'
    ],
    [
      '"The value of the definite integral \\int_{0}^{\\pi/2} \\frac{\\sin^3 x}{\\sin^3 x + \\cos^3 x} dx is:"',
      '"\\pi/4"',
      '"\\pi/2"',
      '"0"',
      '"1"',
      '"A"',
      '"By applying Kings property \\int f(a+b-x)dx, 2I = \\int 1 dx from 0 to \\pi/2 => 2I = \\pi/2 => I = \\pi/4."',
      '"DK Sir Symmetry Rule: Any integral of the form sin^n x / (sin^n x + cos^n x) on [0, pi/2] is always (b-a)/2 = pi/4."',
      '"https://www.youtube.com/watch?v=dQw4w9WgXcQ"',
      '"https://example.com/integral-notes.pdf"',
      '"Definite Integrals"',
      '"Easy"',
      '"JEE Advanced 2024"',
      '"FALSE"'
    ],
    [
      '"The locus of a point whose distance from the origin is twice its distance from the y-axis is:"',
      '"x^2 + y^2 = 4x^2"',
      '"3x^2 - y^2 = 0"',
      '"x^2 - 3y^2 = 0"',
      '"y^2 - 4x^2 = 0"',
      '"B"',
      '"Given \\sqrt{x^2 + y^2} = 2|x|. Squaring both sides yields x^2 + y^2 = 4x^2 => 3x^2 - y^2 = 0."',
      '"DK Sir Coordinate Rule: Direct algebraic distance definition."',
      '""',
      '""',
      '"Straight Lines & Locus"',
      '"Moderate"',
      '"JEE Main 2023"',
      '"TRUE"'
    ]
  ];

  const csvContent = [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'dk_academy_pyq_bulk_questions_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
