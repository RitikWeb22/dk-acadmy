/**
 * Get expectedStored for capture.json using happy-dom + frontend pipeline.
 * Run: node --import ./backend/node_modules/tsx/dist/esm/index.js backend/scripts/probe_capture_frontend.ts
 */
import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';

// Install happy-dom globals
const dom = new Window();
(globalThis as any).DOMParser = dom.DOMParser;
(globalThis as any).window = dom;
(globalThis as any).document = dom.document;

const capturePath = 'C:/Users/krish/.gemini/antigravity/brain/74b756c8-01c8-4ba7-865c-03a8ce2b93b3/.user_uploaded/media_1793905526392_b73380b1.json';
const capture = JSON.parse(readFileSync(capturePath, 'utf8'));

const { traceMathInputPaste } = await import('../../frontend/src/utils/pastePipelineTrace.ts');
const { resolveMathInputPaste } = await import('../../frontend/src/utils/mathInputPaste.ts');

function clipboard(html: string, plain: string) {
  return {
    getData(format: string) {
      if (format === 'text/html') return html;
      if (format === 'text/plain' || format === 'text') return plain;
      return '';
    },
  };
}

const payload = clipboard(capture.rawHtml, capture.rawPlain);

const trace = traceMathInputPaste(payload);
const resolved = resolveMathInputPaste(payload);

console.log('=== TRACE ===');
console.log('sourceType:', trace.sourceType);
console.log('usedPlainFallback:', trace.usedPlainFallback);
console.log('ommlWarnings:', trace.ommlWarnings.join(' | ') || '(none)');
console.log('');
console.log('afterOmmlExtraction:', trace.afterOmmlExtraction);
console.log('');
console.log('afterLatexConversion:', trace.afterLatexConversion);
console.log('');
console.log('afterNormalizer:', trace.afterNormalizer);
console.log('');
console.log('afterPasteHandler:', trace.afterPasteHandler);
console.log('');
console.log('mathInputOnChange:', trace.mathInputOnChange);
console.log('');
console.log('=== FINAL stored (mathInputOnChange) ===');
console.log(trace.mathInputOnChange);
console.log('');
console.log('=== JSON-ESCAPED (use as expectedStored in fixture) ===');
console.log(JSON.stringify(trace.mathInputOnChange));
console.log('');
console.log('=== BLOCKS ===');
trace.blocks.forEach((b: any, i: number) => console.log(`  [${i}] type=${b.type} katexOk=${b.katexOk} content=${JSON.stringify(b.content)}`));
