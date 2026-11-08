import { normalizeMathString } from '../frontend/src/utils/mathImportRenderSystem/pasteHandler';
import { parseWordQuestions } from '../frontend/src/utils/wordPasteParser';

const q1 = `If a curve y=f(x), passing through the point (1,2), is the solution of the differential equation, 2x^{2} dy=(2xy+y^{2}) \\, dx, then f( 1/2 ) is equal to :`;

console.log("Q1 normalizeMathString:");
console.log(normalizeMathString(q1));

const q3 = `If x^{3} dy+xy \\, dx=x^{2} dy+2y \\, dx,y(2)=e and x > 1 , then y(4) is equal to:`;
console.log("\nQ3 normalizeMathString:");
console.log(normalizeMathString(q3));

const q4 = `Let y=f(x) be the solution of the differential equation y(x+1) \\, dx-x^{2} dy=0,y(1)=e. Then \\lim_{x\\to 0^+} f(x) is equal to`;
console.log("\nQ4 normalizeMathString:");
console.log(normalizeMathString(q4));

const q5 = `Let the solution curve y=y(x) of the differential equation dy/(" " \\, dx)-(3x^{5} \\tan^{-1}(x^3 ))/(1+x^{6})^{\\frac{3}{2}} y=2x\\exp{ \\frac{x^{3}-\\tan^{-1}x^{3}}{\\sqrt{ (1+x^{6} )}} pass through the origin. Then y(1) is equal to :`;
console.log("\nQ5 normalizeMathString:");
console.log(normalizeMathString(q5));

