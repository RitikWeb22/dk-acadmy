import { parseWordQuestions } from '../frontend/src/utils/wordPasteParser';
import { parseContentToBlocks } from '../frontend/src/components/ui/MathEngine/mathParser';
import { sanitizeFormula } from '../frontend/src/components/ui/MathEngine/sanitizeFormula';
const JSZip = require('../backend/node_modules/jszip');
const fs = require('fs');
const katex = require('../frontend/node_modules/katex');

async function testTargetQuestions() {
  const filePath = 'C:/Users/krish/.gemini/antigravity/brain/a0972936-ba86-4b59-adda-cc566d5fe0c2/.user_uploaded/media_1794217358857_7a4879f7.docx';
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const docXml = await zip.file('word/document.xml').async('string');
  const text = docXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  const targetNums = ['96', '100', '101', '102'];

  for (const num of targetNums) {
    console.log(`\n========================================`);
    console.log(`CHECKING QUESTION ${num}`);
    console.log(`========================================`);
    
    // Find where `${num} .` or `${num}.` appears
    const regex = new RegExp(`\\b${num}\\s*\\.\\s*([A-Z][\\s\\S]*?)(?=\\b\\d{1,3}\\s*\\.\\s*[A-Z]|$)`, 'i');
    const m = text.match(regex);
    if (!m) {
      console.log(`Could not find question ${num}`);
      continue;
    }
    const rawQ = m[0].trim();
    console.log('Raw Question snippet:');
    console.log(rawQ.substring(0, 200) + '...');

    const parsedList = parseWordQuestions(rawQ);
    console.log(`Parsed questions count: ${parsedList.length}`);
    if (parsedList.length === 0) continue;

    const q = parsedList[0];
    console.log('Type:', q.type);
    console.log('Exam Tag:', q.examTag);
    console.log('Statement:');
    console.log(q.statement);
    console.log('Options:');
    for (const opt of q.options) {
      console.log(`  (${opt.key}): ${opt.text}`);
    }

    // Test KaTeX on statement
    const blocks = parseContentToBlocks(q.statement);
    let errorCount = 0;
    for (const b of blocks) {
      if (b.type.startsWith('math')) {
        const formula = sanitizeFormula(b.content);
        try {
          katex.renderToString(formula, { throwOnError: true });
        } catch (err: any) {
          errorCount++;
          console.log(`[ERROR in Statement formula]: "${formula}" -> ${err.message}`);
        }
      }
    }

    // Test KaTeX on options
    for (const opt of q.options) {
      if (!opt.text) continue;
      const optBlocks = parseContentToBlocks(opt.text);
      for (const ob of optBlocks) {
        if (ob.type.startsWith('math')) {
          const formula = sanitizeFormula(ob.content);
          try {
            katex.renderToString(formula, { throwOnError: true });
          } catch (err: any) {
            errorCount++;
            console.log(`[ERROR in Option ${opt.key}]: "${formula}" -> ${err.message}`);
          }
        }
      }
    }

    if (errorCount === 0) {
      console.log(`Question ${num}: PERFECT 100% KaTeX valid!`);
    } else {
      console.log(`Question ${num}: FAILED with ${errorCount} errors`);
    }
  }
}

testTargetQuestions();

