import { normalizeMathText } from '../frontend/src/utils/questionBulkParser';

const text = `If the function 
f(x)={■(1/x log_e⁡((1+x/a)/(1-x/b))&,x<0 @k&,x=0@(cos^2⁡x-sin^2⁡x-1)/(√(x^2+1)-1)&,x>0)┤   is continuous at x=0 , then 1/a+1/b+4/k is equal to : 
                                                              [JEE Main 2021 (Online) 31st August Morning Slot]
(1)\t-5\t(2)\t5\t(3)\t-4\t(4)\t4`;

console.log("Calling normalizeMathText on text...");
const t0 = Date.now();
const res = normalizeMathText(text);
const t1 = Date.now();
console.log(`Took ${t1 - t0}ms:\n`, res);

