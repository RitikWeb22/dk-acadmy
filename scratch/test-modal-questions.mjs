import { parseWordQuestions } from '../frontend/src/utils/wordPasteParser.ts';

const fullText1 = `If a curve y=f(x), passing through the point (1,2), is the solution of the differential equation, 2x^{2} dy=(2xy+y^{2}) \\, dx, then f( 1/2 ) is equal to :
(A) 1/(1-log_e 2)
(B) 1/(1+log_e 2)
(C) (1-log_e 2)
(D) (1+log_e 2)
Ans: A`;

const parsed1 = parseWordQuestions(fullText1);
console.log('--- Parsed Q1 ---');
console.log('Statement:', parsed1[0]?.statement);
console.log('Option A:', parsed1[0]?.options[0]?.text);

const fullText4 = `Let y=f(x) be the solution of the differential equation y(x+1) \\, dx-x^{2} dy=0,y(1)=e. Then \\lim_{x\\to 0^+} f(x) is equal to
(A) 0
(B) 1
(C) e
(D) 1/e
Ans: B`;

const parsed4 = parseWordQuestions(fullText4);
console.log('--- Parsed Q4 ---');
console.log('Statement:', parsed4[0]?.statement);
console.log('Option A:', parsed4[0]?.options[0]?.text);

const fullText5 = `Let the solution curve y=y(x) of the differential equation dy/(" "\\, dx)-(3x^{5} \\tan^{-1}(x^3))/(1+x^{6})^{\\frac{3}{2}} y=2x\\exp\\{ \\frac{x^{3}-\\tan^{-1}x^{3}}{\\sqrt{1+x^{6}}} \\} pass through the origin. Then y(1) is equal to :
(A) \\exp(\\frac{1-\\pi}{4\\sqrt{2}})
(B) \\exp(\\frac{1+\\pi}{4\\sqrt{2}})
(C) 1
(D) 0
Ans: A`;

const parsed5 = parseWordQuestions(fullText5);
console.log('--- Parsed Q5 ---');
console.log('Statement:', parsed5[0]?.statement);
console.log('Option A:', parsed5[0]?.options[0]?.text);

