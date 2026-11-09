import { parseContentToBlocks } from '../frontend/src/components/ui/MathEngine/mathParser';

const text = `Let f:R→R satisfy the equation f(x + y) = f(x).f(y) for all x , y ∈R and f(x)≠ 0 for any x∈ R. if  the function f is differentiable at x = 0 and f'(0)= 3 , then  (lim)┬(h→0) 1/h(f(h)-1) is equal to__`;

console.log('--- parseContentToBlocks(text) ---');
const blocks = parseContentToBlocks(text);
for (const b of blocks) {
  console.log(`[${b.type}]: ${b.content}`);
}
