import { normalizeMathString } from '../frontend/src/utils/mathImportRenderSystem/pasteHandler';
import { parseContentToBlocks } from '../frontend/src/components/ui/MathEngine/mathParser';
import { cleanWordMathArtifacts } from '../frontend/src/utils/wordPasteParser';

const raw = `Let
the function f : \\mathbb{R} \\to \\mathbb{R} and g : \\mathbb{R} \\to \\mathbb{R} be
defined as $& $f(x)=\\begin{cases}x+2$, & x 


 Then, the number of points in \\mathbb{R} where
(fog)(x) is NOT differentiable is equal to ____.`;

console.log('--- cleanWordMathArtifacts ---');
const cleaned = cleanWordMathArtifacts(raw);
console.log(cleaned);

console.log('\n--- normalizeMathString ---');
const norm = normalizeMathString(cleaned);
console.log(norm);

console.log('\n--- parseContentToBlocks ---');
const blocks = parseContentToBlocks(norm);
for (const b of blocks) {
  console.log(`[${b.type}]: ${b.content}`);
}

