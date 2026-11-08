import { normalizeMathString } from '../frontend/src/utils/mathImportRenderSystem/pasteHandler.ts';

const textWithExistingDollar = `Let y=f(x) be the solution of the differential equation y(x+1) \\, dx-x^{2} dy=0,y(1)=e. Then $\\lim_{x\\to 0^+} f(x)$ is equal to`;

console.log('Original with single delimited limit:');
console.log(textWithExistingDollar);

console.log('\nAfter normalizeMathString:');
console.log(normalizeMathString(textWithExistingDollar));

