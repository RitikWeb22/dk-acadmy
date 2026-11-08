import { ommlNodeToLatex, mathMLNodeToLatex } from '../frontend/src/utils/universalMathEngine/index.ts';

const GREEK_UNICODE_MAP = {
  'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta', 'ε': '\\epsilon',
  'θ': '\\theta', 'λ': '\\lambda', 'μ': '\\mu', 'π': '\\pi', 'ρ': '\\rho',
  'σ': '\\sigma', 'tau': '\\tau', 'φ': '\\phi', 'ω': '\\omega', 'Δ': '\\Delta',
  'Ω': '\\Omega', 'Σ': '\\Sigma', 'Π': '\\Pi', 'Γ': '\\Gamma', 'Θ': '\\Theta'
};

const OPERATOR_UNICODE_MAP = {
  '−': '-', '–': '-', '—': '-', '×': '\\times', '÷': '\\div', '±': '\\pm',
  '≤': '\\le', '≥': '\\ge', '≠': '\\ne', '≈': '\\approx', '≡': '\\equiv',
  '∞': '\\infty', '∫': '\\int', '∬': '\\iint', '∭': '\\iiint', '∮': '\\oint',
  '∑': '\\sum', '∏': '\\prod', '√': '\\sqrt', '∂': '\\partial', '∇': '\\nabla',
  '∈': '\\in', '∉': '\\notin', '⊂': '\\subset', '⊆': '\\subseteq', '∪': '\\cup',
  '∩': '\\cap', '∧': '\\land', '∨': '\\lor', '¬': '\\neg', '⇒': '\\implies',
  '⇔': '\\iff', '→': '\\to', '←': '\\leftarrow', '↔': '\\leftrightarrow',
  '°': '^\\circ', '′': "'", '″': "''", '⋅': '\\cdot', '…': '\\dots'
};

function normalizeTestMath(raw) {
  if (!raw) return '';
  let s = raw;

  // Clean leading bullet, number, or dot: ". If a curve..." -> "If a curve..."
  s = s.replace(/^[\s\u2022\u25E6\u25AA\u25CF.\-—]+\s*(?=[A-Za-z])/g, '');
  s = s.replace(/^Q(?:uestion)?\s*\.?\s*\d+\s*[:.)\-—]\s*/gi, '');

  // Clean zero-width chars and smart quotes
  s = s.replace(/\\\\([a-zA-Z]+)/g, '\\$1');
  s = s.replace(/\u00A0/g, ' ');
  s = s.replace(/[\u200B-\u200D\uFEFF\u2060\u2061\u2062\u2063\u2064]/g, '');
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Mathematical alphanumeric symbols (Word math italics)
  s = s.replace(/[\u{1D44E}-\u{1D467}]/gu, (c) => {
    const code = c.codePointAt(0);
    if (code === 0x1D455) return 'h';
    return String.fromCharCode(97 + ((code || 0) - 0x1D44E));
  });
  s = s.replace(/[\u{1D434}-\u{1D44D}]/gu, (c) => {
    const code = c.codePointAt(0);
    return String.fromCharCode(65 + ((code || 0) - 0x1D434));
  });

  // Greek and operators
  for (const [uni, cmd] of Object.entries(GREEK_UNICODE_MAP)) {
    s = s.replaceAll(uni, ` ${cmd} `);
  }
  for (const [uni, cmd] of Object.entries(OPERATOR_UNICODE_MAP)) {
    s = s.replaceAll(uni, ` ${cmd} `);
  }

  // Superscripts & Subscripts
  const superMap = {
    '⁰': '^{0}', '¹': '^{1}', '²': '^{2}', '³': '^{3}', '⁴': '^{4}',
    '⁵': '^{5}', '⁶': '^{6}', '⁷': '^{7}', '⁸': '^{8}', '⁹': '^{9}',
    '⁺': '^{+}', '⁻': '^{-}', 'ⁿ': '^{n}'
  };
  for (const [sup, exp] of Object.entries(superMap)) {
    s = s.replaceAll(sup, exp);
  }

  const subMap = {
    '₀': '_{0}', '₁': '_{1}', '₂': '_{2}', '₃': '_{3}', '₄': '_{4}',
    '₅': '_{5}', '₆': '_{6}', '₇': '_{7}', '₈': '_{8}', '₉': '_{9}',
    '₊': '_{+}', '₋': '_{-}'
  };
  for (const [sub, ind] of Object.entries(subMap)) {
    s = s.replaceAll(sub, ind);
  }

  // Word linear differential equation fractions & quotes: dy/(" "\, dx) -> \dfrac{dy}{dx}
  s = s.replace(/\b(d\^?[0-9]?[a-zA-Z]?)\s*\/\s*\(\s*(?:["'][^"']*["'])?\s*(?:\\,)?\s*(d[a-zA-Z]\^?[0-9]?)\s*\)/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\b(d\^?[0-9]?[a-zA-Z]?)\s*\/\s*(d[a-zA-Z]\^?[0-9]?)\b/g, '\\dfrac{$1}{$2}');
  s = s.replace(/\(\s*["'][^"']*["']\s*(?:\\,)?\s*(d[a-zA-Z])\s*\)/g, '\\,$1');

  // Word linear fractions with nested parens and exponents: (3x^{5} \tan^{-1}(x^3))/(1+x^{6})^{\frac{3}{2}}
  s = s.replace(
    /\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*\(((?:[^()\n]|\([^()\n]*\))+?)\)\^(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|[A-Za-z0-9_+\-]+)/g,
    (_, num, den, exp) => {
      const expStr = exp.startsWith('{') ? exp : `{${exp}}`;
      return `\\dfrac{${num}}{(${den})^${expStr}}`;
    }
  );
  s = s.replace(
    /\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*\(((?:[^()\n]|\([^()\n]*\))+?)\)/g,
    '\\dfrac{$1}{$2}'
  );
  s = s.replace(/(?<![a-zA-Z0-9_\\])\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*([A-Za-z0-9_\\^{}]+)/g, '\\dfrac{$1}{$2}');
  s = s.replace(/(?<![a-zA-Z0-9_\\])([A-Za-z0-9_\\^{}]+)\s*\/\s*\(((?:[^()\n]|\([^()\n]*\))+?)\)/g, '\\dfrac{$1}{$2}');
  s = s.replace(/(?<=[(,=+\-*\/]\s*)(\d+)\s*\/\s*(\d+)(?=\s*[),=+;\-*\/])/g, '\\dfrac{$1}{$2}');

  // Exponential cleanup: \exp\{ ... \}
  s = s.replace(/(\\?exp\s*\{[\s\S]*?)(?=\s+(?:pass|through|is|equal|where|then|and|origin)\b|$)/gi, (m) => {
    const opens = (m.match(/\{/g) || []).length;
    const closes = (m.match(/\}/g) || []).length;
    if (opens > closes) {
      return m + '}'.repeat(opens - closes);
    }
    return m;
  });
  s = s.replace(/\\?exp\s*\{([^{}]*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}[^{}]*)*)\}/g, '\\exp\\left\\{$1\\right\\}');
  s = s.replace(/\\?exp\s*\(\s*([^()]+)\s*\)/g, '\\exp\\left($1\\right)');

  // Trig inverse
  s = s.replace(/\\?(sin|cos|tan|cot|sec|csc)\s*\^\s*\(\s*-?\s*1\s*\)/gi, '\\$1^{-1}');
  s = s.replace(/(?<!\\)\b(sin|cos|tan|cot|sec|csc)\b(?!\^\{-?1\})/gi, '\\$1');

  // Fractions inside \exp: \frac -> \dfrac
  s = s.replace(/\\exp\\left\\\{([\s\S]*?)\\right\\\}/g, (_, inner) => {
    const upgraded = inner.replace(/\\frac\b/g, '\\dfrac');
    return `\\exp\\left\\{${upgraded}\\right\\}`;
  });

  // Aligned
  s = s.replace(/\\begin\{align\*?\}/g, '\\begin{aligned}');
  s = s.replace(/\\end\{align\*?\}/g, '\\end{aligned}');

  // Redundant sqrt parens
  s = s.replace(/\\sqrt\(\s*([^()]+)\s*\)/g, '\\sqrt{$1}');
  s = s.replace(/\\sqrt\{\s*\(([^()]+)\)\s*\}/g, '\\sqrt{$1}');

  // Insert space after semicolons/commas when followed directly by initial conditions or variables (e.g. "dx;y(2)=e" or "0,y(1)=e")
  s = s.replace(/([0-9a-zA-Z_)\\])\s*([;,])\s*([a-zA-Z]\s*(?:\([^()]+\)|=))/g, '$1$2 $3');

  // Clean raw LaTeX spacing command \, outside math
  s = s.replace(/\\,\s*/g, ' ');

  // Wrap bare LaTeX in $...$
  const protectedBlocks = [];
  s = s.replace(/\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]+?\$|\\\([\s\S]*?\\\)/g, (m) => {
    const key = `\u27E6MATH_${protectedBlocks.length}\u27E7`;
    protectedBlocks.push(m);
    return key;
  });

  const protect = (mathContent) => {
    let clean = mathContent.trim();
    if (!clean) return '';
    let trail = '';
    const m = clean.match(/([,;.]+)$/);
    if (m) {
      trail = m[1];
      clean = clean.slice(0, -trail.length).trim();
    }
    const key = `\u27E6MATH_${protectedBlocks.length}\u27E7`;
    protectedBlocks.push(`$${clean}$`);
    return ` ${key}${trail} `;
  };

  const proseLead = '(?:Let|If|Suppose|Given|Define|Find|Evaluate|Calculate|Show|Consider)\\b\\s*[:,]?\\s*';
  const proseStops = '(?:pass|passes|passing|touch|touches|touching|intersect|intersects|has|have|having|where|when|such|if|then|and|with|at|for|is|are|represented|representing|given)\\b';

  // 1. Environments
  s = s.replace(
    new RegExp(`(${proseLead})?((?:[a-zA-Z|][a-zA-Z0-9_\\s'|()]*=\\s*)?\\\\begin\\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|aligned)\\}[\\s\\S]+?\\\\end\\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|aligned)\\})`, 'g'),
    (_, lead, m) => (lead ? lead + ' ' : '') + protect(m)
  );

  // 2. Differential equations like \dfrac{dy}{dx} - ... = ... before prose stop
  s = s.replace(
    new RegExp(`(${proseLead})?((?:\\\\(?:d?frac)\\{d\\^?[0-9]?[a-zA-Z]?\\}\\{d[a-zA-Z]\\^?[0-9]?\\}[^=]+)=\\s*([^,;.\\n]+?))(?=\\s+${proseStops}|\\s*[,;.]|$)`, 'gi'),
    (_, lead, eq) => {
      let activeLead = lead || '';
      let activeEq = eq;
      const introMatch = activeEq.match(/^(.*?\b(?:differential\s+equation|solution\s+curve|equation|curve|relation)\s*[:,]?\s*)(.+)$/i);
      if (introMatch) {
        activeLead += introMatch[1];
        activeEq = introMatch[2];
      }
      return (activeLead ? activeLead + ' ' : '') + protect(activeEq);
    }
  );

  // 3. Symmetric 3D Line Equations: \frac{x-x1}{a} = \frac{y-y1}{b} = \frac{z-z1}{c}
  s = s.replace(
    /(?<![$\w])((?:\\(?:d?frac)\{[^{}]+\}\{[^{}]+\}|[a-zA-Z0-9_+-]+)\s*=\s*(?:\\(?:d?frac)\{[^{}]+\}\{[^{}]+\}|[a-zA-Z0-9_+-]+)\s*=\s*(?:\\(?:d?frac)\{[^{}]+\}\{[^{}]+\}|[a-zA-Z0-9_+-]+))(?=\s*[,;.]|\s+${proseStops}|$)/gi,
    (_, m) => protect(m)
  );

  // 4. Integrals: \int ... dx
  s = s.replace(
    /(?<![$\w])(\\(?:int|iint|iiint|oint)(?:_[^{}\s]+|_\{\s*[^{}]*(?:\{[^{}]*\}[^{}]*)*\s*\}|\^[^{}\s]+|\^\{\s*[^{}]*(?:\{[^{}]*\}[^{}]*)*\s*\})*\s*[\s\S]+?(?:\\,?\s*d[a-zA-Z]|dx|dy|dt|dz|du|dv|d\theta|dr)(?![a-zA-Z]))(?=(?:\s*=\s*[^,;.\n]+)?(?:\s*[,;.]|\s+${proseStops}|$))/gi,
    (fullMatch) => protect(fullMatch)
  );

  // 5. Limits, Summations, Products: \lim_{...} ... (stop strictly before prose)
  s = s.replace(
    new RegExp(`(?<![$\\w])(\\\\(?:lim|sum|prod)(?:_[^{}\\s]+|_\\{\\s*[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\s*\\}|\\^[^{}\\s]+|\\^\\{\\s*[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\s*\\})*\\s*(?:[a-zA-Z0-9_^{}()'|\\\\+\\-*/\\[\\]\\s.]*?[a-zA-Z0-9_^{}()'|\\\\+\\-*/\\]]))(?=\\s+${proseStops}|\\s*[,;.]|$)`, 'gi'),
    (_, m) => protect(m)
  );

  // 6. Differential equations with explicit differentials: 2x^2 dy = (2xy+y^2) dx OR y(x+1) dx - x^2 dy = 0
  s = s.replace(
    new RegExp(`(${proseLead})?([a-zA-Z0-9_^{}()'|\\\\+\\-*/\\s.]*?\\b(?:d\\^?[0-9]?[a-zA-Z]?\\/d[a-zA-Z]\\^?[0-9]?|\\\\(?:d?frac)\\{d\\^?[0-9]?[a-zA-Z]?\\}\\{d[a-zA-Z]\\^?[0-9]?\\}|dy|dx|dt|dz)\\b[a-zA-Z0-9_^{}()'|\\\\+\\-*/\\s.]*?=[a-zA-Z0-9_^{}()'|\\\\+\\-*/\\s.]+?)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'gi'),
    (fullMatch, lead, eq) => {
      let activeLead = lead || '';
      let activeEq = eq;

      const introMatch = activeEq.match(/^(.*?\b(?:differential\s+equation|solution\s+curve|equation|curve|relation)\s*[:,]?\s*)(.+)$/i);
      if (introMatch) {
        activeLead += introMatch[1];
        activeEq = introMatch[2];
      }

      const nonLatex = activeEq.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:let|the|curve|passes|passing|through|solution|find|evaluate)\b/i.test(nonLatex)) {
        return fullMatch;
      }
      return (activeLead ? activeLead + ' ' : '') + protect(activeEq);
    }
  );

  // 7. Vector Equations & Triple Products
  s = s.replace(
    /(?<![$\w])(\[\s*\\vec\{[^{}]+\}[\s\S]+?\\vec\{[^{}]+\}\s*\])/g,
    (_, m) => protect(m)
  );
  s = s.replace(
    /(?<![$\w])(\\vec\{[^{}]+\}\s*=\s*[^,;.\n]+?)(?=\s*[,;.]|\s+${proseStops}|$)/gi,
    (_, m) => protect(m)
  );

  // 8. General equations with LaTeX operators / functions: A^{-1} = ..., E = E^\circ - ...
  s = s.replace(
    new RegExp(`(${proseLead})?([a-zA-Z0-9_^{}()'|\\\\+\\-*/\\s.]+=([a-zA-Z0-9_^{}()'|\\\\+\\-*/\\s.]|\\\\(?:d?frac)\\{[^{}]+\\}\\{[^{}]+\\})+)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'g'),
    (fullMatch, lead, eq) => {
      let activeLead = lead || '';
      let activeEq = eq;

      const introMatch = activeEq.match(/^(.*?\b(?:differential\s+equation|solution\s+curve|equation|curve|relation)\s*[:,]?\s*)(.+)$/i);
      if (introMatch) {
        activeLead += introMatch[1];
        activeEq = introMatch[2];
      }

      if (!/(\\[a-zA-Z]+|\^|_|\b(?:det|Tr|adj|sgn|sin|cos|tan|log|ln|exp)\b)/.test(activeEq)) {
        return fullMatch;
      }
      const nonLatex = activeEq.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:let|the|and|for|with|where|when|if|then|is|are|find|curve|line|plane)\b/i.test(nonLatex)) {
        return fullMatch;
      }
      return (activeLead ? activeLead + ' ' : '') + protect(activeEq);
    }
  );

  // 9. Initial conditions / evaluations: y(2)=e, y(1)=e, f'(0), f(1/2), y(4)
  s = s.replace(
    new RegExp(`(?<![$\\w])([a-zA-Z]\\s*(?:'*\\s*\\([a-zA-Z0-9_+\\-/*\\\\^\\{\\}\\s.,]+\\)|'\\s*\\(\\s*0\\s*\\))\\s*=\\s*[-+*/a-zA-Z0-9_\\\\^{}()]+?)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'g'),
    (fullMatch, eq) => {
      const nonLatex = eq.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:let|and|the|is|are|in|on|at|of|to|for|with|then|if|which|where)\b/i.test(nonLatex)) {
        return fullMatch;
      }
      return protect(eq);
    }
  );

  // 10. Angles with degree symbol: \sin 45^\circ or 45^\circ
  s = s.replace(
    /(?<![$\w])((?:\\(?:sin|cos|tan|cot|sec|csc)\s*)?[0-9]+(?:\.[0-9]+)?\s*\^\s*\\circ)/g,
    (_, m) => protect(m)
  );

  // 11. Curve definitions: y=f(x) or y=y(x)
  s = s.replace(/(?<![$\w])([a-zA-Z]\s*=\s*[a-zA-Z]\s*\([a-zA-Z0-9_+\-/*\s\\]+\))(?![$\w])/g, (_, m) => protect(m));

  // 12. Single function terms / derivatives: f'(0), y(4), f( \dfrac{1}{2} ), f( 1/2 )
  s = s.replace(
    /(?<![$\w])([a-zA-Z]'*\s*\(\s*(?:\\(?:d?frac)\{[^{}]+\}\{[^{}]+\}|\d+\s*\/\s*\d+|[0-9a-zA-Z_+\-/*]+)\s*\))(?![$\w])/g,
    (_, m) => {
      const fracNorm = m.replace(/\(\s*(\d+)\s*\/\s*(\d+)\s*\)/, '\\left(\\dfrac{$1}{$2}\\right)')
                        .replace(/\(\s*(\\d?frac\{[^{}]+\}\{[^{}]+\})\s*\)/, '\\left($1\\right)');
      return protect(fracNorm);
    }
  );

  // 13. Inequalities: x > 1, \alpha, \beta > 0, \det A \neq 0
  s = s.replace(
    /(?<![$\w])((?:\\[a-zA-Z]+|[a-zA-Z0-9_^{}()]+)(?:\s*,\s*(?:\\[a-zA-Z]+|[a-zA-Z0-9_^{}()]+))*\s*(?:[><=≤≥≠]|\\(?:neq|le|ge))\s*[-+]?[0-9a-zA-Z_\\]+)(?=\s*[,;.]|\s+${proseStops}|$)/g,
    (fullMatch, eq) => {
      const nonLatex = eq.replace(/\\[a-zA-Z]+/g, ' ');
      if (/\b(?:if|then|and|where|when|for|let)\b/i.test(nonLatex)) return fullMatch;
      return protect(eq);
    }
  );

  // 14. Point coordinates: point (1,2) or (1, 2, 3)
  s = s.replace(/(?<=\b(?:point|at|through|from)\s+)(\(\s*-?[0-9]+(?:\.[0-9]+)?\s*,\s*-?[0-9]+(?:\.[0-9]+)?\s*(?:,\s*-?[0-9]+(?:\.[0-9]+)?)?\s*\))(?![$\w])/gi, (_, m) => protect(m));

  // 15. Remaining standalone LaTeX commands with balanced braces
  s = s.replace(
    /(?<![$\w])(\\(?:d?frac|sqrt|vec|hat|bar|dot|ddot|tilde|mathbf|mathrm|text|operatorname)\{(?:[^{}]|\{[^{}]*\})*\}(?:\{(?:[^{}]|\{[^{}]*\})*\})*(?:[A-Za-z0-9_^{}\\()\[\]+\-*/\s.]*[A-Za-z0-9_^{}\\()\[\]+\-*/])?|\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|infty|times|div|pm|mp|le|ge|ne|approx|sim|to|partial|nabla|degree|circ)(?![a-zA-Z]))(?=\s*[,;.]|\s+${proseStops}|$|\s+[a-zA-Z]{3,})/gi,
    (fullMatch, cmd) => protect(cmd)
  );

  // Restore protected blocks
  for (let idx = 0; idx < protectedBlocks.length; idx++) {
    s = s.replace(`\u27E6MATH_${idx}\u27E7`, protectedBlocks[idx]);
  }

  s = s.replace(/\$\s*\$/g, ' ');
  s = s.replace(/\$\$+/g, '$');
  s = s.replace(/\s+,/g, ',');
  s = s.replace(/\s+\./g, '.');
  s = s.replace(/[^\S\r\n]+/g, ' ').trim();

  return s;
}

const q1 = "If a curve y=f(x), passing through the point (1,2), is the solution of the differential equation, 2x^{2} dy=(2xy+y^{2}) \\, dx, then f( 1/2 ) is equal to :";
const q2 = ". If a curve y=f(x), passing through the point (1,2), is the solution of the differential equation, 2x^{2} dy=(2xy+y^{2}) \\, dx, then f( 1/2 ) is equal to :";
const q3 = "If x^{3} dy+xy \\, dx=x^{2} dy+2y \\, dx;y(2)=e and x > 1 , then y(4) is equal to:";
const q4 = "Let y=f(x) be the solution of the differential equation y(x+1) \\, dx-x^{2} dy=0,y(1)=e. Then \\lim_{x\\to 0^+} f(x) is equal to";
const q5 = `Let the solution curve y=y(x) of the differential equation dy/(" "\\, dx)-(3x^{5} \\tan^{-1}(x^3))/(1+x^{6})^{\\frac{3}{2}} y=2x\\exp\\{ \\frac{x^{3}-\\tan^{-1}x^{3}}{\\sqrt{1+x^{6}}} \\} pass through the origin. Then y(1) is equal to :`;

console.log('=== TEST RESULTS 3 ===');
console.log('Q1:\n' + normalizeTestMath(q1));
console.log('\nQ2:\n' + normalizeTestMath(q2));
console.log('\nQ3:\n' + normalizeTestMath(q3));
console.log('\nQ4:\n' + normalizeTestMath(q4));
console.log('\nQ5:\n' + normalizeTestMath(q5));
