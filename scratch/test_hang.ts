import { normalizeMathString } from '../frontend/src/utils/mathImportRenderSystem/pasteHandler.ts';
import { parseWordQuestions, parseWordMatricesAndCases, cleanWordMathArtifacts } from '../frontend/src/utils/wordPasteParser.ts';

const text = `If the function 
f(x)={■(1/x log_e((1+x/a)/(1-x/b))&,x<0 @k&,x=0@(cos^2x-sin^2x-1)/(√(x^2+1)-1)&,x>0)┤   is continuous at x=0 , then 1/a+1/b+4/k is equal to : 
                                                              [JEE Main 2021 (Online) 31st August Morning Slot]
(1)\t-5\t(2)\t5\t(3)\t-4\t(4)\t4`;

console.log('1. Testing parseWordMatricesAndCases...');
const t0 = Date.now();
const casesRes = parseWordMatricesAndCases(text);
console.log('parseWordMatricesAndCases done in', Date.now() - t0, 'ms');
console.log(casesRes);

console.log('\n2. Testing parseWordQuestions...');
const t1 = Date.now();
const parsed = parseWordQuestions(text);
console.log('parseWordQuestions done in', Date.now() - t1, 'ms');
console.log(parsed);

console.log('\n3. Testing normalizeMathString...');
const t2 = Date.now();
const norm = normalizeMathString(text);
console.log('normalizeMathString done in', Date.now() - t2, 'ms');
console.log(norm);

