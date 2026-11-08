import { normalizePastedQuestion } from '../frontend/src/utils/universalDocxParser.ts';

const text1 = "If a curve y=f(x), passing through the point (1,2), is the solution of the differential equation, 2x^{2} dy=(2xy+y^{2}) \\, dx, then f( 1/2 ) is equal to :";
const res = normalizePastedQuestion(text1);
console.log('Result of normalizePastedQuestion:');
console.log(res);

