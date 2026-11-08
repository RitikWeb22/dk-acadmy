import { parseWordQuestions, cleanWordMathArtifacts } from '../frontend/src/utils/wordPasteParser';
import { normalizeMathString } from '../frontend/src/utils/mathImportRenderSystem/pasteHandler';

const q1 = `If a curve y=f(x), passing through the point (1,2), is the solution of the differential equation, 2x^{2} dy=(2xy+y^{2}) \\, dx, then f( 1/2 ) is equal to :
(A) \\frac{1}{1-\\log_e 2}
(B) \\frac{1}{1+\\log_e 2}
(C) \\frac{2}{1-\\log_e 2}
(D) \\frac{2}{1+\\log_e 2}
Ans: A`;

const q3 = `If x^{3} dy+xy \\, dx=x^{2} dy+2y \\, dx,y(2)=e and x > 1 , then y(4) is equal to:
A 1/2
B 3/2
C 2
D 4
Ans: C`;

const q4 = `Let y=f(x) be the solution of the differential equation y(x+1) \\, dx-x^{2} dy=0,y(1)=e. Then \\lim_{x\\to 0^+} f(x) is equal to
A 0
B 1
C e
D \\infty
Ans: A`;

const q5 = `Let the solution curve y=y(x) of the differential equation dy/(" " \\, dx)-(3x^{5} \\tan^{-1}(x^3 ))/(1+x^{6})^{\\frac{3}{2}} y=2x\\exp{ \\frac{x^{3}-\\tan^{-1}x^{3}}{\\sqrt{ (1+x^{6} )}} pass through the origin. Then y(1) is equal to :
A $\\exp{\\frac{1-\\pi}{4\\sqrt{2}}}$
B 1
C 2
D 0
Ans: A`;

const qNew = `If the function 
f(x)={■(1/x log_e⁡((1+x/a)/(1-x/b))&,x<0 @k&,x=0@(cos^2⁡x-sin^2⁡x-1)/(√(x^2+1)-1)&,x>0)┤   is continuous at x=0 , then 1/a+1/b+4/k is equal to : 
                                                              [JEE Main 2021 (Online) 31st August Morning Slot]
(1)\t-5\t(2)\t5\t(3)\t-4\t(4)\t4`;

console.log("Suite prepared.");

