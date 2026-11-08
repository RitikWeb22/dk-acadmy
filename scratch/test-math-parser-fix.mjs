import { parseContentToBlocks } from '../frontend/src/components/ui/MathEngine/mathParser.ts';
import { normalizeMathString } from '../frontend/src/utils/mathImportRenderSystem/pasteHandler.ts';

// Test parseContentToBlocks with normalizeMathString on all 5 questions
const testCases = [
  "If a curve y=f(x), passing through the point (1,2), is the solution of the differential equation, 2x^{2} dy=(2xy+y^{2}) \\, dx, then f( 1/2 ) is equal to :",
  ". If a curve y=f(x), passing through the point (1,2), is the solution of the differential equation, 2x^{2} dy=(2xy+y^{2}) \\, dx, then f( 1/2 ) is equal to :",
  "If x^{3} dy+xy \\, dx=x^{2} dy+2y \\, dx;y(2)=e and x > 1 , then y(4) is equal to:",
  "Let y=f(x) be the solution of the differential equation y(x+1) \\, dx-x^{2} dy=0,y(1)=e. Then \\lim_{x\\to 0^+} f(x) is equal to",
  `Let the solution curve y=y(x) of the differential equation dy/(" "\\, dx)-(3x^{5} \\tan^{-1}(x^3))/(1+x^{6})^{\\frac{3}{2}} y=2x\\exp\\{ \\frac{x^{3}-\\tan^{-1}x^{3}}{\\sqrt{1+x^{6}}} \\} pass through the origin. Then y(1) is equal to :`
];

for (let i = 0; i < testCases.length; i++) {
  console.log(`\n=== CASE ${i + 1} ===`);
  const norm = normalizeMathString(testCases[i]);
  console.log('Normalized String:');
  console.log(norm);
  const blocks = parseContentToBlocks(norm);
  const hasTextOnly = blocks.every(b => b.type === 'text');
  const mathBlocks = blocks.filter(b => b.type !== 'text');
  console.log(`Blocks parsed: total=${blocks.length}, mathBlocks=${mathBlocks.length}`);
  mathBlocks.forEach(mb => console.log(`  [${mb.type}] ${mb.rawSource}`));
}

