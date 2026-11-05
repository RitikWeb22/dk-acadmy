import { normalizePastedQuestion } from '../frontend/src/utils/universalMathEngine/index.ts';
import { parseContentToBlocks } from '../frontend/src/components/ui/MathEngine/mathParser.ts';

// Simulate exactly what happens in the browser
const googleDocsPlain = '(lim)\u252C(y\u21920) (\u221A(1+\u221A(1+y^4 )) -\u221A2)/y^4';

// Step 1: normalizePastedQuestion (what handleStatementPaste calls)
const mockClipboard = {
  getData: (format: string) => {
    if (format === 'text/plain' || format === 'text') return googleDocsPlain;
    return ''; // No HTML from Google Docs that has OMML
  }
};

const result = normalizePastedQuestion(mockClipboard as any);
console.log('=== PASTE RESULT ===');
console.log('statement:', JSON.stringify(result.statement));
console.log('fullNormalizedText:', JSON.stringify(result.fullNormalizedText));
console.log('hasQuestionWithOptions:', result.hasQuestionWithOptions);
console.log('warnings:', result.warnings);

// Step 2: parseContentToBlocks (what MathText/MathRenderer calls on the statement)
const blocks = parseContentToBlocks(result.statement || result.fullNormalizedText);
console.log('\n=== PARSED BLOCKS ===');
blocks.forEach((b, i) => {
  console.log(`Block ${i}: type=${b.type}, content=${JSON.stringify(b.content)}`);
});

