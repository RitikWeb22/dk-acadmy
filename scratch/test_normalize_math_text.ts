import { normalizeMathText } from '../frontend/src/utils/questionBulkParser.ts';

const text = `If the function 
f(x)={■(1/x log_e((1+x/a)/(1-x/b))&,x<0 @k&,x=0@(cos^2x-sin^2x-1)/(√(x^2+1)-1)&,x>0)┤   is continuous at x=0 , then 1/a+1/b+4/k is equal to : 
                                                              [JEE Main 2021 (Online) 31st August Morning Slot]
(1)\t-5\t(2)\t5\t(3)\t-4\t(4)\t4`;

console.log('Testing normalizeMathText...');
const t0 = Date.now();
const res = normalizeMathText(text);
console.log('normalizeMathText finished in', Date.now() - t0, 'ms');
console.log(res);

