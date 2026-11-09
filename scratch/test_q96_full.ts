import { parseWordQuestions } from '../frontend/src/utils/wordPasteParser';
import { parseContentToBlocks } from '../frontend/src/components/ui/MathEngine/mathParser';
import { sanitizeFormula } from '../frontend/src/components/ui/MathEngine/sanitizeFormula';
const katex = require('../frontend/node_modules/katex');

const q96 = `96 . Let the solution curve y = y ( x ) of the differential equation x x 2 - y 2 + e y x x dy dx = x + x x 2 - y 2 + e y x y pass through the points (1,0) and (2 α , α ), α >0 . Then α is equal to ( A ) 1 2 exp⁡ π 6 + e -1 JEE Main 2022 (Online) 28th June Morning Shift ( B ) 1 2 exp⁡ π 6 + e -1 ( C ) exp⁡ π 6 + e +1 ( D ) 2exp⁡ π 3 + e -1`;

const parsed = parseWordQuestions(q96);
console.log('Parsed count:', parsed.length);
const q = parsed[0];
console.log('Type:', q.type);
console.log('Exam Tag:', q.examTag);
console.log('Statement:\n', q.statement);
console.log('Options:');
for (const opt of q.options) {
  console.log(`  (${opt.key}): ${opt.text}`);
}

const blocks = parseContentToBlocks(q.statement);
let hasError = false;
for (const b of blocks) {
  if (b.type.startsWith('math')) {
    const f = sanitizeFormula(b.content);
    try {
      katex.renderToString(f, { throwOnError: true });
    } catch (e: any) {
      hasError = true;
      console.log('Statement KaTeX error on:', f, '->', e.message);
    }
  }
}

for (const opt of q.options) {
  const ob = parseContentToBlocks(opt.text);
  for (const b of ob) {
    if (b.type.startsWith('math')) {
      const f = sanitizeFormula(b.content);
      try {
        katex.renderToString(f, { throwOnError: true });
      } catch (e: any) {
        hasError = true;
        console.log(`Option ${opt.key} KaTeX error on:`, f, '->', e.message);
      }
    }
  }
}

if (!hasError) console.log('\n>>> SUCCESS! Question 96 parsed with options and 100% KaTeX valid!');

