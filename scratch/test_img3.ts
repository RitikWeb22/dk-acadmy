import { normalizeMathString } from '../frontend/src/utils/mathImportRenderSystem/pasteHandler';
import { parseContentToBlocks } from '../frontend/src/components/ui/MathEngine/mathParser';

const raw = 'Let the solution curve y = y(x) of the differential equation [x/ \\sqrt{x^2 - y^2} }+e^{ \\frac{y}{x} }]x \\dfrac{} \\, dy}{\\, dx = x + [x/ \\sqrt{x^2 - y^2} + e^x] ypass through the points(1 ,0) and (2 \\alpha ,\\alpha ) ,\\alpha > 0 . Then \\alpha is equal to';

console.log('--- normalizeMathString ---');
const norm = normalizeMathString(raw);
console.log(norm);

console.log('\n--- parseContentToBlocks ---');
const blocks = parseContentToBlocks(norm);
for (const b of blocks) {
  console.log(`[${b.type}]: ${b.content}`);
}
