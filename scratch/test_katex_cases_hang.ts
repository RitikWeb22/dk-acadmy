import { parseContentToBlocks } from '../frontend/src/components/ui/MathEngine/mathParser.ts';
import { sanitizeFormula } from '../frontend/src/components/ui/MathEngine/sanitizeFormula.ts';
import katex from '../frontend/node_modules/katex/dist/katex.mjs';

const formattedText = `If the function 



\\[
f(x)=
\\begin{cases}
\\dfrac{1}{x} \\log_e(\\dfrac{1+\\dfrac{x}{a}}{1-\\dfrac{x}{b}}), & x < 0\\\\[6pt]
k, & x = 0\\\\[6pt]
\\dfrac{\\cos^2x-\\sin^2x-1}{\\sqrt{x^2+1}-1}, & x > 0
\\end{cases}
\\]


is continuous at $x = 0$, then $\\frac{1}{a}$ + $\\frac{1}{b}$ + $\\frac{4}{k}$ is equal to :
                                                              [JEE Main 2021 (Online) 31st August Morning Slot]
(1) - 5\t(2)\t5\t(3) - 4\t(4)\t4`;

console.log('Testing parseContentToBlocks on normalized...');
const t0 = Date.now();
const blocks = parseContentToBlocks(formattedText);
console.log('parseContentToBlocks finished in', Date.now() - t0, 'ms. Blocks:', blocks.length);

blocks.forEach((b, i) => {
  console.log(`Block ${i} [${b.type}]: ${JSON.stringify(b.content)}`);
  if (b.type !== 'text') {
    const san = sanitizeFormula(b.content);
    try {
      katex.renderToString(san, { throwOnError: true, displayMode: b.type === 'math_block' });
      console.log('  KaTeX: OK');
    } catch (e: any) {
      console.log('  KaTeX ERROR:', e.message);
    }
  }
});

