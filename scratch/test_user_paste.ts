import { parseWordQuestions } from '../frontend/src/utils/wordPasteParser';
import { normalizeMathString } from '../frontend/src/utils/mathImportRenderSystem/pasteHandler';
import { parseContentToBlocks } from '../frontend/src/components/ui/MathEngine/mathParser';

const text = `If the function 
f(x)={■(1/x log_e⁡((1+x/a)/(1-x/b))&,x<0 @k&,x=0@(cos^2⁡x-sin^2⁡x-1)/(√(x^2+1)-1)&,x>0)┤   is continuous at x=0 , then 1/a+1/b+4/k is equal to : 
                                                              [JEE Main 2021 (Online) 31st August Morning Slot]
(1)\t-5\t(2)\t5\t(3)\t-4\t(4)\t4`;

console.log("Testing parseWordQuestions on text...");
const t0 = Date.now();
const parsed = parseWordQuestions(text);
const t1 = Date.now();
console.log(`parseWordQuestions finished in ${t1 - t0}ms:`, JSON.stringify(parsed, null, 2));

console.log("\nTesting normalizeMathString on text directly...");
const t2 = Date.now();
const normalized = normalizeMathString(text);
const t3 = Date.now();
console.log(`normalizeMathString finished in ${t3 - t2}ms:`, normalized);

