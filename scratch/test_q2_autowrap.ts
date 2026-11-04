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
    const nonLatex = eq.replace(/\\[a-zA-Z]+/g, ' ');
    if (/\b(?:let|and|the|is|are|in|on|at|of|to|for|with|then|if|which|where|satisfying|between|perpendicular)\b/i.test(nonLatex)) {
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
    const nonLatex = m.replace(/\\[a-zA-Z]+/g, ' ');
    if (/\b(?:let|and|the|is|are|in|on|at|of|to|for|with|then|if|which|where|satisfying|between|perpendicular)\b/i.test(nonLatex)) {
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

const inputQ2 = String.raw`Let $a > 0$ be a root of the equation $2x^{2} + x - 2 = 0$. If \lim_{x \to \frac{1}{a}} \frac{16(1-\cos(2+x-2x^{2}))}{(1-ax)^{2}} = \alpha+\beta\sqrt{17}, where \alpha,\beta\in \mathbb{Z}, then \alpha+\beta is equal to`;

console.log('Q2 AutoWrapped:');
console.log(testAutoWrap(inputQ2));

