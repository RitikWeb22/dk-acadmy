import { parseContentToBlocks } from '../frontend/src/components/ui/MathEngine/mathParser';
import { sanitizeFormula } from '../frontend/src/components/ui/MathEngine/sanitizeFormula';
const katex = require('../frontend/node_modules/katex');

const stmt = "Let $f : \\mathbb{R} \\to \\mathbb{R}$ satisfy the equation $f(x + y) = f(x) \\cdot f(y)$ for all x, y \\in $\\mathbb{R}$ and $f(x)\\neq 0$ for any x \\in $\\mathbb{R}$. if the function f is differentiable at $x = 0$ and $f'(0)= 3$, then $\\lim_{h\\to 0} \\dfrac{1}{h}(f(h)-1)$ is equal to";

const blocks = parseContentToBlocks(stmt);
console.log('Blocks count:', blocks.length);
for (const b of blocks) {
  console.log(`[${b.type}]: ${b.content}`);
  if (b.type.startsWith('math')) {
    const clean = sanitizeFormula(b.content);
    try {
      const html = katex.renderToString(clean, { throwOnError: true });
    } catch (err: any) {
      console.log('>>> KATEX ERROR on', clean, ':', err.message);
    }
  }
}
