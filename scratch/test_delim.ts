let test1 = `Let f be a differentiable function in the interval $(0, \\infty )$ such that $f(1) = 1$ and \\lim_{t \\to x} $\\frac{t^{2} f(x) - x^{2} f(t)}{$t - x$}$ = 1 for each $x > 0$. Then 2f(2) + 3f(3) is equal to`;

// 1. Strip inner rogue dollar signs inside brackets/braces/parentheses:
test1 = test1.replace(/([\(\[\{])\s*\$\s*/g, '$1');
test1 = test1.replace(/\s*\$\s*([\)\]\}])/g, '$1');

// 2. Absorb leading limit/integral/sum before $: e.g. \lim_{t \to x} $\frac{...}{...}$ -> $\lim_{t \to x} \frac{...}{...}$
test1 = test1.replace(/(\\(?:lim|int|sum|prod)(?:_\{[^{}]+\}|_[0-9a-zA-Z]+|\^\{[^{}]+\}|\^[0-9a-zA-Z]+)*)\s*\$([^\$\n]+?)\$/g, 
  (_m, op, inner) => `$${op} ${inner}$`
);

// 3. Absorb trailing equality after $: e.g. $\frac{...}{...}$ = 1 -> $\frac{...}{...} = 1$
test1 = test1.replace(/\$([^\$\n]+?)\$\s*([=<>≤≥]|\\le\b|\\ge\b)\s*(-?[0-9]+(?:\.[0-9]+)?|\\[a-zA-Z]+|[a-zA-Z0-9_]+(?:\^[0-9]+)?)(?=[,;.\s]|$)/g,
  (_m, inner, op, rhs) => `$${inner} ${op} ${rhs}$`
);

// 4. Wrap function combinations: 2f(2) + 3f(3)
test1 = test1.replace(/(?<![a-zA-Z0-9_\$])([0-9]*\s*[a-zA-Z]\s*\([0-9a-zA-Z]+\)\s*[+\-−*\/]\s*[0-9]*\s*[a-zA-Z]\s*\([0-9a-zA-Z]+\))(?![a-zA-Z0-9_\$])/g,
  (_m, expr) => `$${expr}$`
);

console.log('Result:');
console.log(test1);
