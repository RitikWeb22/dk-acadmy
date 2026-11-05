/**
 * Creates the real fixture file from capture.json.
 * Run: node backend/scripts/create_real_fixture.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');

const capturePath = 'C:/Users/krish/.gemini/antigravity/brain/74b756c8-01c8-4ba7-865c-03a8ce2b93b3/.user_uploaded/media_1793905526392_b73380b1.json';
const capture = JSON.parse(readFileSync(capturePath, 'utf8'));

// expectedStored: what the pipeline actually produced (needsReview=true because OMML
// converter emitted \gammax without space → KaTeX rejected → plain-text fallback activated).
// This is the current behaviour, frozen as a regression guard. When the \gammax bug is fixed,
// update expectedStored to the corrected value and set needsReview to false.
const expectedStored = "If $\\lim_{x \\to 0} \\frac{\\alpha xe^x-\\beta log_$e(1+x)$+\\gamma x^2 e^{-x}}{xsin^2 x}=10$,\\alpha,\\beta,\\gamma\\in \\mathbb{R} , then the value of \\alpha+\\beta+\\gamma is";

const fixture = {
  name: "case-c-word-limit-real",
  synthetic: false,
  label: "word_365_paste",
  needsReview: true,
  note: "REAL Word 365 clipboard capture from /admin/paste-debug. JEE-style limit question. The OMML converter produces \\gammax (missing space) which fails KaTeX validation, so the pipeline falls back to plain-text path. expectedStored reflects current pipeline output. When the \\gammax bug is fixed, update expectedStored and set needsReview:false.",
  plain: capture.rawPlain,
  html: capture.rawHtml,
  expectedStored: expectedStored
};

const outPath = join(repoRoot, 'backend', 'tests', 'fixtures', 'paste', 'case-c-word-limit-real.json');
writeFileSync(outPath, JSON.stringify(fixture, null, 2), 'utf8');
console.log('Written:', outPath);
console.log('plain:', fixture.plain);
console.log('expectedStored:', fixture.expectedStored);
console.log('html length:', fixture.html.length, 'bytes');

