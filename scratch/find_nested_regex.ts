import fs from 'fs';
import path from 'path';

const files = [
  'frontend/src/utils/wordPasteParser.ts',
  'frontend/src/utils/mathImportRenderSystem/pasteHandler.ts',
  'frontend/src/utils/questionBulkParser.ts',
  'frontend/src/components/ui/MathEngine/sanitizeFormula.ts'
];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Check for nested quantifiers like ([^...]*)* or (.*)* or (\s*...)+ or similar
    if (/\([^()]*[+*][^()]*\)[+*]/.test(line) || /\[\\s\\S\]\*/.test(line)) {
      console.log(`${f}:${idx + 1}: ${line.trim()}`);
    }
  });
}

