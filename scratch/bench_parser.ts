import { parseWordQuestions, wrapMathInDollars } from '../frontend/src/utils/wordPasteParser';

const q1 = `If a curve y=f(x), passing through the point (1,2), is the solution of the differential equation, 2x^{2} dy=(2xy+y^{2}) \\, dx, then f( \\frac{1}{2} ) is equal to :
(A) \\frac{1}{1-\\log_e 2}
(B) \\frac{2}{1+\\log_e 2}
(C) \\frac{1}{1+\\log_e 2}
(D) \\frac{2}{1-\\log_e 2}
Ans: A`;

console.time('parseWordQuestions');
try {
  const res = parseWordQuestions(q1);
  console.timeEnd('parseWordQuestions');
  console.log('Result parsed:', res.length);
  console.log('Statement:', res[0]?.statement);
  console.log('Options:', res[0]?.options);
} catch (e) {
  console.error('Error:', e);
}

