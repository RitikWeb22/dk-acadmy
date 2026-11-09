import { cleanWordMathArtifacts, parseWordQuestions, normalizeDocxMath, preformatDocxOptions, extractExamTagSafely } from '../frontend/src/utils/wordPasteParser';
import { normalizeMathString } from '../frontend/src/utils/mathImportRenderSystem/pasteHandler';
import { parseContentToBlocks } from '../frontend/src/components/ui/MathEngine/mathParser';
import { sanitizeFormula } from '../frontend/src/components/ui/MathEngine/sanitizeFormula';
const JSZip = require('../backend/node_modules/jszip');
const fs = require('fs');
const katex = require('../frontend/node_modules/katex');

async function testDocx(filePath: string, name: string) {
  console.log(`\n========================================`);
  console.log(`TESTING DOCX: ${name}`);
  console.log(`========================================`);

  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const docXml = await zip.file('word/document.xml').async('string');
  const text = docXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  // Split on question numbers e.g. " 1.", " 2.", " 3."
  const qMatches = text.split(/(?=\b\d{1,3}\s*\.\s*[A-Z])/g).slice(1, 11);
  console.log(`Found ${qMatches.length} questions in sample.`);

  let successCount = 0;
  let totalCount = 0;

  for (let i = 0; i < qMatches.length; i++) {
    totalCount++;
    const rawQ = qMatches[i].trim();
    const parsedList = parseWordQuestions(rawQ);
    if (parsedList.length === 0) {
      console.log(`Q${i + 1}: FAILED to parse question`);
      continue;
    }
    const q = parsedList[0];
    const stmt = q.statement;
    const blocks = parseContentToBlocks(stmt);

    let hasError = false;
    for (const b of blocks) {
      if (b.type.startsWith('math')) {
        const formula = sanitizeFormula(b.content);
        try {
          katex.renderToString(formula, { throwOnError: true });
        } catch (err: any) {
          hasError = true;
          console.log(`Q${i + 1} KaTeX error in [${formula}]: ${err.message}`);
        }
      }
    }

    // Check options
    for (const opt of q.options) {
      if (!opt.text) continue;
      const optBlocks = parseContentToBlocks(opt.text);
      for (const ob of optBlocks) {
        if (ob.type.startsWith('math')) {
          const formula = sanitizeFormula(ob.content);
          try {
            katex.renderToString(formula, { throwOnError: true });
          } catch (err: any) {
            hasError = true;
            console.log(`Q${i + 1} Option ${opt.key} KaTeX error in [${formula}]: ${err.message}`);
          }
        }
      }
    }

    if (!hasError) {
      successCount++;
    }
  }

  console.log(`Result for ${name}: ${successCount}/${totalCount} questions had 100% valid KaTeX.`);
}

async function run() {
  await testDocx('C:/Users/krish/.gemini/antigravity/brain/a0972936-ba86-4b59-adda-cc566d5fe0c2/.user_uploaded/media_1794217358857_7a4879f7.docx', 'differential_equation');
  await testDocx('C:/Users/krish/.gemini/antigravity/brain/a0972936-ba86-4b59-adda-cc566d5fe0c2/.user_uploaded/media_1794217358887_f807bc92.docx', 'DEFINITE_PYQ');
  await testDocx('C:/Users/krish/.gemini/antigravity/brain/a0972936-ba86-4b59-adda-cc566d5fe0c2/.user_uploaded/media_1794217358933_96baf87e.docx', 'TEST-12');
  await testDocx('C:/Users/krish/.gemini/antigravity/brain/a0972936-ba86-4b59-adda-cc566d5fe0c2/.user_uploaded/media_1794217663723_14a08d10.docx', 'FUNCTION_PYQ');
  await testDocx('C:/Users/krish/.gemini/antigravity/brain/a0972936-ba86-4b59-adda-cc566d5fe0c2/.user_uploaded/media_1794217663735_cf86cda1.docx', 'DIFFERENTIATION');
}

run();

