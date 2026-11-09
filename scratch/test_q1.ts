import { parseContentToBlocks } from '../frontend/src/components/ui/MathEngine/mathParser';
import { normalizeMathString } from '../frontend/src/utils/mathImportRenderSystem/pasteHandler';
import { cleanWordMathArtifacts } from '../frontend/src/utils/wordPasteParser';

const q1 = "Let f:R→R satisfy the equation f(x + y) = f(x).f(y) for all x , y ∈R and f(x)≠ 0 for any x∈ R. if  the function f is differentiable at x = 0 and f'(0)= 3 , then  (lim)┬(h→0) 1/h(f(h)-1) is equal to__";

console.log('--- Raw input ---');
console.log(q1);

console.log('\n--- cleanWordMathArtifacts ---');
const cleaned = cleanWordMathArtifacts(q1);
console.log(cleaned);

console.log('\n--- normalizeMathString ---');
const norm = normalizeMathString(cleaned);
console.log(norm);

console.log('\n--- parseContentToBlocks ---');
const blocks = parseContentToBlocks(norm);
console.log(JSON.stringify(blocks, null, 2));

