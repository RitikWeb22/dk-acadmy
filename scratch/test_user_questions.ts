import { normalizeMathText, autoWrapMathDelimiters, convertAllFractions } from '../frontend/src/utils/questionBulkParser.ts';

const q1 = `Let f be a differentiable function in the interval $(0, \infty )$ such that $f(1) = 1$ and \\lim_{t \\to x} $\\frac{t^{2} f(x) - x^{2} f(t)}{$t - x$}$ = 1 for each $x > 0$. Then 2f(2) + 3f(3) is equal to`;

const q2 = `Let a>0 be a root of the equation 2x^2+x-2=0. If lim_(x→1/a) 16(1-cos⁡(2+x-2x^2 ))/((1-ax)^2 )=α+β√17, where α,β∈Z, then α+β is equal to`;

const q3 = `lim_(n→∞) ((1^2-1)(n-1)+(2^2-2)(n-2)+⋯+((n-1)^2-(n-1))⋅1)/((1^3+2^3+⋯⋯+n^3 )-(1^2+2^2+⋯⋅+n^2 ) ) is equal to :`;

console.log('=== Q1 RAW ===');
console.log(q1);
console.log('=== Q1 NORMALIZED ===');
const n1 = normalizeMathText(q1);
console.log(n1);

console.log('\n=== Q2 RAW ===');
console.log(q2);
console.log('=== Q2 NORMALIZED ===');
const n2 = normalizeMathText(q2);
console.log(n2);

console.log('\n=== Q3 RAW ===');
console.log(q3);
console.log('=== Q3 NORMALIZED ===');
const n3 = normalizeMathText(q3);
console.log(n3);
