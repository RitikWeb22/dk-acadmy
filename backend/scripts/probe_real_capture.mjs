/**
 * Probe real capture.json through the compiled math pipeline.
 * Run: node backend/scripts/probe_real_capture.mjs
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');

// Load the real capture
const capturePath = 'C:/Users/krish/.gemini/antigravity/brain/74b756c8-01c8-4ba7-865c-03a8ce2b93b3/.user_uploaded/media_1793905526392_b73380b1.json';
const capture = JSON.parse(readFileSync(capturePath, 'utf8'));

// Use compiled dist
const distIndex = pathToFileURL(join(__dirname, '..', 'dist', 'utils', 'universalMathEngine', 'index.js')).href;

let engine;
try {
  engine = await import(distIndex);
} catch (e) {
  console.error('Failed to import engine:', e.message);
  process.exit(1);
}

const { normalizePastedQuestion } = engine;

if (!normalizePastedQuestion) {
  console.error('normalizePastedQuestion not exported from index.js');
  console.log('Exports:', Object.keys(engine));
  process.exit(1);
}

const plainText = capture.rawPlain;
const htmlText = capture.rawHtml;

console.log('=== PLAIN TEXT INPUT ===');
console.log(plainText);
console.log('');

// Run through the engine using HTML path
try {
  const result = normalizePastedQuestion(htmlText, { wrapMathInDollars: true });
  console.log('=== HTML PATH RESULT ===');
  console.log('sourceType:', result.sourceType);
  console.log('needsReview:', result.needsReview);
  console.log('fullNormalizedText:');
  console.log(result.fullNormalizedText);
  console.log('');
  console.log('=== ESCAPED FOR JSON ===');
  console.log(JSON.stringify(result.fullNormalizedText));
} catch (e) {
  console.error('HTML path error:', e.message);
  console.error(e.stack);
}

// Also run plain text path
try {
  const result2 = normalizePastedQuestion(plainText, { wrapMathInDollars: true });
  console.log('');
  console.log('=== PLAIN TEXT PATH RESULT ===');
  console.log('sourceType:', result2.sourceType);
  console.log('fullNormalizedText:');
  console.log(result2.fullNormalizedText);
  console.log('');
  console.log('=== ESCAPED FOR JSON ===');
  console.log(JSON.stringify(result2.fullNormalizedText));
} catch (e) {
  console.error('Plain text path error:', e.message);
}
