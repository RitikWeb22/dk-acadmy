import { cleanWordMathArtifacts } from '../frontend/src/utils/wordPasteParser';
import { normalizeMathString } from '../frontend/src/utils/mathImportRenderSystem/pasteHandler';

const input = 'Let the solution curve y = y(x) of the differential equation [\\frac{x}{\\sqrt{x^2-y^2}} + e^{y/x}] x \\frac{dy}{dx} = x + [\\frac{x}{\\sqrt{x^2-y^2}} + e^{y/x}] y pass through the points (1, 0) and (2\\alpha, \\alpha), \\alpha > 0. Then \\alpha is equal to';

console.log('--- cleanWordMathArtifacts ---');
console.log(cleanWordMathArtifacts(input));

console.log('--- normalizeMathString ---');
console.log(normalizeMathString(input));

