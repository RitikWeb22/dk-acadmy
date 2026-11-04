import { stripOuterParens } from '../frontend/src/utils/questionBulkParser.ts';

function enhancedConvertAllFractions(input: string): string {
  let str = input;
  let changed = true;
  let iterations = 0;

  while (changed && iterations < 20) {
    changed = false;
    iterations++;

    for (let i = 0; i < str.length; i++) {
      if (str[i] === '/' && (i === 0 || str[i - 1] !== '\\')) {
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
                while (cmdCheck >= 0 && /\s/.test(str[cmdCheck])) cmdCheck--;
                const tokenEnd = cmdCheck;
                while (cmdCheck >= 0 && /[a-zA-Z0-9]/.test(str[cmdCheck])) cmdCheck--;
                if (cmdCheck >= 0 && str[cmdCheck] === '\\') {
                  leftStart = cmdCheck;
                } else if (tokenEnd >= cmdCheck + 1 && /^[0-9]+$/.test(str.substring(cmdCheck + 1, tokenEnd + 1))) {
                  leftStart = cmdCheck + 1;
                  if (leftStart > 0 && (str[leftStart - 1] === '-' || str[leftStart - 1] === '+') && (leftStart === 1 || /[\s=(]/.test(str[leftStart - 2]))) {
                    leftStart--;
                  }
                }
                break;
              }
            }
            p--;
          }
        } else {
          let p = leftEnd;
          while (p >= 0 && /[a-zA-Z0-9]/.test(str[p])) p--;
          if (p >= 0 && str[p] === '\\') p--;
          leftStart = p + 1;
        }

        if (leftStart < 0 || leftStart > leftEnd) continue;

        let rightStart = i + 1;
        while (rightStart < str.length && /\s/.test(str[rightStart])) rightStart++;
        if (rightStart >= str.length) continue;

        let rightEnd = -1;
        if (str[rightStart] === '(' || str[rightStart] === '{') {
          const openChar = str[rightStart];
          const closeChar = openChar === '(' ? ')' : '}';
          let depth = 0;
          let p = rightStart;
          while (p < str.length) {
            if (str[p] === openChar) depth++;
            else if (str[p] === closeChar) {
              depth--;
              if (depth === 0) {
                rightEnd = p;
                if (p + 1 < str.length && str[p + 1] === '^') {
                  let expP = p + 2;
                  if (str[expP] === '{') {
                    let expDepth = 0;
                    while (expP < str.length) {
                      if (str[expP] === '{') expDepth++;
                      else if (str[expP] === '}') {
                        expDepth--;
                        if (expDepth === 0) { rightEnd = expP; break; }
                      }
                      expP++;
                    }
                  } else if (/[0-9a-zA-Z]/.test(str[expP])) {
                    rightEnd = expP;
                  }
                }
                break;
              }
            }
            p++;
          }
        } else {
          let p = rightStart;
          if (str[p] === '\\') {
            p++;
            while (p < str.length && /[a-zA-Z]/.test(str[p])) p++;
          } else {
            while (p < str.length && /[a-zA-Z0-9]/.test(str[p])) p++;
          }
          rightEnd = p - 1;
        }

        if (rightEnd < rightStart) continue;

        let num = str.substring(leftStart, leftEnd + 1).trim();
        let den = str.substring(rightStart, rightEnd + 1).trim();

        if (num.startsWith('(') && num.endsWith(')')) {
          let inner = num.slice(1, -1).trim();
          let d = 0, bal = true;
          for (let c of inner) {
            if (c === '(') d++;
            else if (c === ')') { d--; if (d < 0) { bal = false; break; } }
          }
          if (bal && d === 0) num = inner;
        }

        if (den.startsWith('(') && den.endsWith(')')) {
          let inner = den.slice(1, -1).trim();
          let d = 0, bal = true;
          for (let c of inner) {
            if (c === '(') d++;
            else if (c === ')') { d--; if (d < 0) { bal = false; break; } }
          }
          if (bal && d === 0) den = inner;
        }

        const frac = `\\frac{${num}}{${den}}`;
        str = str.substring(0, leftStart) + frac + str.substring(rightEnd + 1);
        changed = true;
        break;
      }
    }
  }

  return str;
}

function fullNormalize(raw: string): string {
  let text = raw.split('$$').join('$');

  // Strip inner rogue dollar signs inside brackets/braces/parentheses:
  text = text.replace(/([\(\[\{])\s*\$\s*/g, '$1');
  text = text.replace(/\s*\$\s*([\)\]\}])/g, '$1');

  // Absorb leading limit/integral/sum before $: e.g. \lim_{t \to x} $\frac{...}{...}$ -> $\lim_{t \to x} \frac{...}{...}$
  text = text.replace(/(\\(?:lim|int|sum|prod)(?:_\{[^{}]+\}|_[0-9a-zA-Z]+|\^\{[^{}]+\}|\^[0-9a-zA-Z]+)*)\s*\$([^\$\n]+?)\$/g, 
    (_m, op, inner) => `$${op} ${inner}$`
  );

  // Absorb trailing equality after $: e.g. $\frac{...}{...}$ = 1 -> $\frac{...}{...} = 1$
  text = text.replace(/\$([^\$\n]+?)\$\s*([=<>≤≥]|\\le\b|\\ge\b)\s*(-?[0-9]+(?:\.[0-9]+)?|\\[a-zA-Z]+|[a-zA-Z0-9_]+(?:\^[0-9]+)?)(?=[,;.\s]|$)/g,
    (_m, inner, op, rhs) => `$${inner} ${op} ${rhs}$`
  );

  // Greek letters and math symbols
  text = text.replace(/α/g, '\\alpha')
             .replace(/β/g, '\\beta')
             .replace(/γ/g, '\\gamma')
             .replace(/∈\s*Z\b/g, '\\in \\mathbb{Z}')
             .replace(/∈/g, '\\in ');

  // Limits with arrow and fraction in subscript: lim_(x→1/a) -> \lim_{x \to \frac{1}{a}}
  text = text.replace(/\\?lim_?\s*[\(\{\[]\s*([^)\}\]]+)\s*[\)\}\]][\s\u200a]*/gi, (_, inner) => {
    let clean = inner.replace(/[→\u2192]|\\to/g, ' \\to ').replace(/[∞\u221E]|\\infty/g, '\\infty');
    clean = clean.replace(/([0-9a-zA-Z]+)\/([0-9a-zA-Z]+)/g, '\\frac{$1}{$2}');
    return `\\lim_{${clean.trim()}} `;
  });

  // Powers: 2x^2 -> 2x^{2}
  text = text.replace(/([a-zA-Z0-9_\)\]\}]|\\\w+)\^([0-9a-zA-Z])(?![0-9a-zA-Z\{])/g, '$1^{$2}');

  // Trig
  text = text.replace(/(cot|tan|sin|cos|sec|csc)\s*\(?([0-9a-zA-Z\+\-\^\\\{\}\s]+?)\)?(?=[=\+\-\*\/\s\)\],]|$)/gi, (m, fn, arg) => {
    if (/^(?:let|and|the|is|in|on|at|of|to|for|with|then|if)\b/i.test(m)) return m;
    return `\\${fn.toLowerCase()}(${arg.trim()})`;
  });

  // Square root: √17 -> \sqrt{17}
  text = text.replace(/√\s*([0-9a-zA-Z]+)/g, '\\sqrt{$1}');

  // Universal Fractions
  text = enhancedConvertAllFractions(text);

  // Auto wrap math
  text = testAutoWrap(text);

  return text;
}

function testAutoWrap(text: string): string {
  const protectedMath: string[] = [];
  const protect = (match: string) => {
    let trimmed = match.trim();
    if (trimmed.startsWith('$') && trimmed.endsWith('$')) {
      trimmed = trimmed.slice(1, -1).trim();
    }
    const key = `___PROT_MATH_${protectedMath.length}___`;
    protectedMath.push(`$${trimmed}$`);
    return ` ${key} `;
  };

  let s = text;

  // 1. Protect existing $...$
  s = s.replace(/\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$/g, (m) => protect(m));

  // 2. Protect limit equations: e.g. \lim_{...} ... = ...
  s = s.replace(/(?<![a-zA-Z0-9_\$])(\\(?:lim|sum|prod)(?:_\{[^{}]+\}|_[0-9a-zA-Z]+|\^\{[^{}]+\}|\^[0-9a-zA-Z]+)*\s*[\s\S]+?=\s*[^,;.\n]+?)(?=\s*[,;.]|\s+(?:and|if|then|where|when|for)\b|$)/g, (fullMatch, eq) => {
    if (/\b(?:let|and|the|is|are|in|on|at|of|to|for|with|then|if|which|where|satisfying|between|perpendicular)\b/i.test(eq)) {
      return fullMatch;
    }
    return protect(eq);
  });

  // 3. Protect standalone fractions: e.g. 16\frac{...}{...} or \frac{...}{...}
  s = s.replace(/(?<![\^_{a-zA-Z_\$])((?:-?\s*[0-9]+(?:\.[0-9]+)?\s*)?\\(?:frac|dfrac)\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})(?![\^}a-zA-Z0-9_\$])/g, (_, m) => protect(m));

  // 4. Protect set membership: e.g. \alpha, \beta \in \mathbb{Z} or x \in [0, 1]
  s = s.replace(/(?<![a-zA-Z0-9_\$])((?:\\[a-zA-Z]+|[a-zA-Z0-9_]+)(?:\s*,\s*(?:\\[a-zA-Z]+|[a-zA-Z0-9_]+))*\s*(?:\\in\b)\s*(?:\\mathbb\{[A-Z]\}|\\mathbf\{[A-Z]\}|[A-Z]|\[[^\]\n]+\]|\([^\)\n]+\)))(?![a-zA-Z0-9_\$])/g, (_, m) => protect(m));

  // 5. Wrap function combinations: e.g. 2f(2) + 3f(3)
  s = s.replace(/(?<![a-zA-Z0-9_\$])([0-9]*\s*[a-zA-Z]\s*\([0-9a-zA-Z]+\)\s*[+\-−*\/]\s*[0-9]*\s*[a-zA-Z]\s*\([0-9a-zA-Z]+\))(?![a-zA-Z0-9_\$])/g, (_, m) => protect(m));

  // 6. Compound math: e.g. a > 0 or 2x^{2} + x - 2 = 0 or \alpha + \beta
  const singleAtom = '(?:-?\\s*(?:[0-9]*\\s*\\\\[a-zA-Z]+(?:\\{[^}]*\\}|_(?:\\{[^}]*\\}|[0-9a-zA-Z]+)|\\^(?:\\{[^}]*\\}|[0-9a-zA-Z]+))*(?:\\s*[0-9a-zA-Z])?|(?<![a-zA-Z])[0-9]*\\s*[a-zA-Z](?![a-zA-Z])(?:_(?:\\{[^}]*\\}|[0-9a-zA-Z]+)|\\^(?:\\{[^}]*\\}|[0-9a-zA-Z]+))*|\\([^()\\n]{1,80}\\)|\\[[^\\[\\]\\n]{1,80}\\]|\\|[^|\\n]{1,80}\\|(?:\\^[0-9a-zA-Z]+|\\^\\{[^}]+\\})?|[0-9]+(?:\\.[0-9]+)?))';
  const mathOp = '(?:[=+\\-−*/×⋅<>]|\\\\in\\b|\\\\ge\\b|\\\\le\\b|\\\\neq\\b|\\\\pm\\b|\\\\cdot|\\\\times)';
  const compoundMath = new RegExp(`(?<![a-zA-Z0-9_\\$])(${singleAtom}\\s*${mathOp}\\s*${singleAtom}(?:\\s*${mathOp}\\s*${singleAtom}){0,6})(?![a-zA-Z0-9_\\$])`, 'g');
  s = s.replace(compoundMath, (_, m) => {
    if (/\b(?:let|and|the|is|are|in|on|at|of|to|for|with|then|if|which|where|satisfying|between|perpendicular)\b/i.test(m)) {
      return m;
    }
    return protect(m);
  });

  // 7. Restore protected
  let passes = 0;
  while (s.includes('___PROT_MATH_') && passes < 10) {
    s = s.replace(/___PROT_MATH_(\d+)___/g, (_, idx) => protectedMath[Number(idx)] || '');
    passes++;
  }

  return s.replace(/\s+/g, ' ').trim();
}

const q1 = String.raw`Let f be a differentiable function in the interval $(0, \infty )$ such that $f(1) = 1$ and \lim_{t \to x} $\frac{t^{2} f(x) - x^{2} f(t)}{$t - x$}$ = 1 for each $x > 0$. Then 2f(2) + 3f(3) is equal to`;

const q2 = String.raw`Let a>0 be a root of the equation 2x^2+x-2=0. If lim_(x→1/a) 16(1-cos⁡(2+x-2x^2 ))/((1-ax)^2 )=α+β√17, where α,β∈Z, then α+β is equal to`;

console.log('=== TEST Q1 ===');
console.log(fullNormalize(q1));

console.log('\n=== TEST Q2 ===');
console.log(fullNormalize(q2));
