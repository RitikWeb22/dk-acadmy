import { parseContentToBlocks } from '../frontend/src/components/ui/MathEngine/mathParser.ts';
import { sanitizeFormula } from '../frontend/src/components/ui/MathEngine/sanitizeFormula.ts';
import katex from '../frontend/node_modules/katex/dist/katex.mjs';

const text = `If the function 
f(x)={■(1/x log_e((1+x/a)/(1-x/b))&,x<0 @k&,x=0@(cos^2x-sin^2x-1)/(√(x^2+1)-1)&,x>0)┤   is continuous at x=0 , then 1/a+1/b+4/k is equal to : 
                                                              [JEE Main 2021 (Online) 31st August Morning Slot]
(1)\t-5\t(2)\t5\t(3)\t-4\t(4)\t4`;

console.log('Testing parseContentToBlocks...');
const t0 = Date.now();
const blocks = parseContentToBlocks(text);
console.log('parseContentToBlocks took', Date.now() - t0, 'ms. Blocks:', blocks.length);

blocks.forEach((b, i) => {
  console.log(`Block ${i} [${b.type}]: ${JSON.stringify(b.content)}`);
  if (b.type !== 'text') {
    const san = sanitizeFormula(b.content);
    console.log(`  Sanitized: ${JSON.stringify(san)}`);
    try {
      katex.renderToString(san, { throwOnError: true });
      console.log('  KaTeX: OK');
    } catch (e: any) {
      console.log('  KaTeX error:', e.message);
    }
  }
});

