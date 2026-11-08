import { parseContentToBlocks } from '../frontend/src/components/ui/MathEngine/mathParser';
import { normalizeMathString } from '../frontend/src/utils/mathImportRenderSystem/pasteHandler';

const rawStatement = `If the function 
f(x)={■(1/x log_e⁡((1+x/a)/(1-x/b))&,x<0 @k&,x=0@(cos^2⁡x-sin^2⁡x-1)/(√(x^2+1)-1)&,x>0)┤   is continuous at x=0 , then 1/a+1/b+4/k is equal to : 
                                                              [JEE Main 2021 (Online) 31st August Morning Slot]`;

console.log("1. parseContentToBlocks on RAW statement:");
const t0 = Date.now();
const b1 = parseContentToBlocks(rawStatement);
console.log(`Took ${Date.now() - t0}ms, blocks count: ${b1.length}`);

console.log("2. normalizeMathString on RAW statement:");
const t1 = Date.now();
const norm = normalizeMathString(rawStatement);
console.log(`Took ${Date.now() - t1}ms: \n${norm}`);

console.log("3. parseContentToBlocks on NORMALIZED statement:");
const t2 = Date.now();
const b2 = parseContentToBlocks(norm);
console.log(`Took ${Date.now() - t2}ms, blocks count: ${b2.length}`);

