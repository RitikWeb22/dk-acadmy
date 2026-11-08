import { extractStatementAndOptions } from '../frontend/src/utils/questionBulkParser.ts';
import { normalizePastedQuestion } from '../frontend/src/utils/universalDocxParser.ts';

const text = `If the function 
f(x)={■(1/x log_e((1+x/a)/(1-x/b))&,x<0 @k&,x=0@(cos^2x-sin^2x-1)/(√(x^2+1)-1)&,x>0)┤   is continuous at x=0 , then 1/a+1/b+4/k is equal to : 
                                                              [JEE Main 2021 (Online) 31st August Morning Slot]
(1)\t-5\t(2)\t5\t(3)\t-4\t(4)\t4`;

console.log('1. Testing extractStatementAndOptions...');
const t0 = Date.now();
const res1 = extractStatementAndOptions(text);
console.log('extractStatementAndOptions done in', Date.now() - t0, 'ms');
console.log('Statement:', res1.statement);
console.log('Options:', res1.options);

console.log('\n2. Testing normalizePastedQuestion...');
const t1 = Date.now();
const res2 = normalizePastedQuestion(text);
console.log('normalizePastedQuestion done in', Date.now() - t1, 'ms');
console.log('Normalized:', res2);

