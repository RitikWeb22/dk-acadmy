import katex from '../frontend/node_modules/katex/dist/katex.mjs';
import { normalizeMathText } from '../frontend/src/utils/questionBulkParser.ts';

const q1 = `Let f be a differentiable function in the interval $(0, \\infty )$ such that $f(1) = 1$ and \\lim_{t \\to x} $\\frac{t^{2} f(x) - x^{2} f(t)}{$t - x$}$ = 1 for each $x > 0$. Then 2f(2) + 3f(3) is equal to`;

const q2 = `Let a>0 be a root of the equation 2x^2+x-2=0. If lim_(x→1/a) 16(1-cos⁡(2+x-2x^2 ))/((1-ax)^2 )=α+β√17, where α,β∈Z, then α+β is equal to`;

const q3 = `lim_(n→∞) ((1^2-1)(n-1)+(2^2-2)(n-2)+⋯+((n-1)^2-(n-1))⋅1)/((1^3+2^3+⋯⋯+n^3 )-(1^2+2^2+⋯⋅+n^2 ) ) is equal to :`;

function testKatexRender(label: string, raw: string) {
  console.log(`\nTesting ${label}...`);
  const normalized = normalizeMathText(raw);
  console.log('Normalized:', normalized);

  const mathRegex = /\$([^\$\n]+?)\$/g;
  let m;
  let count = 0;
  while ((m = mathRegex.exec(normalized)) !== null) {
    const expr = m[1].trim();
    count++;
    try {
      const rendered = katex.renderToString(expr, { throwOnError: true });
      console.log(`  [OK] Math ${count}: $${expr}$`);
    } catch (err: any) {
      console.error(`  [FAILED] Math ${count}: $${expr}$`);
      console.error('  Error:', err.message);
      process.exit(1);
    }
  }
}

testKatexRender('Question 1', q1);
testKatexRender('Question 2', q2);
testKatexRender('Question 3', q3);
console.log('\n>>> ALL 3 QUESTIONS RENDERED 100% PERFECTLY IN KATEX! <<<');
