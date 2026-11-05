/**
 * Step B: DOCX Math Extractor Tests
 *
 * Tests the pure-Node.js DOCX extractor (jszip + xmldom + ommlNodeToLatex).
 * No Python, no Pandoc, no mammoth required.
 *
 * NOTE ON FIXTURES:
 * We construct minimal synthetic DOCX files in memory using JSZip.
 * This is the only approach available without real .docx fixtures committed.
 * When the user provides real .docx fixtures, add them to backend/tests/fixtures/
 * and add additional tests that call extractDocxMath(fs.readFileSync(...)).
 *
 * REAL RESULTS ONLY — no fabricated pass/fail.
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { extractDocxMath } from '../src/utils/docxMathExtractor.js';

// ============================================================================
// Helpers to build minimal synthetic DOCX buffers in memory
// ============================================================================

/** Minimal [Content_Types].xml required by every DOCX */
const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml"
            ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

/** Minimal _rels/.rels */
const RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="word/document.xml"/>
</Relationships>`;

/** Wraps body XML into a minimal word/document.xml */
function makeDocumentXml(bodyContent: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${bodyContent}
    <w:sectPr/>
  </w:body>
</w:document>`;
}

/** Builds a Buffer that is a valid (minimal) DOCX zip with the given document body. */
async function buildDocxBuffer(bodyContent: string): Promise<Buffer> {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', CONTENT_TYPES_XML);
  zip.file('_rels/.rels', RELS_XML);
  zip.file('word/document.xml', makeDocumentXml(bodyContent));
  const arrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
  return Buffer.from(arrayBuffer);
}

// ============================================================================
// Tests
// ============================================================================

describe('DOCX Math Extractor — Step B', () => {

  // --- Safety guards ---

  test('Rejects non-DOCX buffer (bad magic bytes)', async () => {
    const notADocx = Buffer.from('This is not a ZIP file at all');
    const result = await extractDocxMath(notADocx);
    assert.strictEqual(result.success, false);
    assert.ok(result.errorLog.some(e => e.includes('PK ZIP header')), 'Should mention ZIP header error');
  });

  test('Rejects oversized buffer (> 25 MB limit)', async () => {
    // Build a minimal DOCX but report it as 26 MB via crafted length
    const validDocx = await buildDocxBuffer('<w:p><w:r><w:t>Hello</w:t></w:r></w:p>');
    // Fake a 26 MB buffer (PK header + lots of zeros — not a valid zip but passes magic check)
    const bigFakeBuffer = Buffer.alloc(26 * 1024 * 1024);
    bigFakeBuffer[0] = 0x50; bigFakeBuffer[1] = 0x4B;
    bigFakeBuffer[2] = 0x03; bigFakeBuffer[3] = 0x04;
    const result = await extractDocxMath(bigFakeBuffer);
    assert.strictEqual(result.success, false);
    assert.ok(result.errorLog.some(e => e.includes('large')), 'Should mention size limit');
  });

  // --- Plain text extraction ---

  test('Extracts plain text from normal paragraphs (no math)', async () => {
    const body = `
      <w:p><w:r><w:t>Question 1: What is 2 + 2?</w:t></w:r></w:p>
      <w:p><w:r><w:t>(A) 3</w:t></w:r></w:p>
      <w:p><w:r><w:t>(B) 4</w:t></w:r></w:p>
      <w:p><w:r><w:t>(C) 5</w:t></w:r></w:p>
      <w:p><w:r><w:t>(D) 6</w:t></w:r></w:p>
    `;
    const docx = await buildDocxBuffer(body);
    const result = await extractDocxMath(docx);
    assert.strictEqual(result.success, true);
    assert.ok(result.paragraphs.length >= 5, 'Should extract 5+ paragraphs');
    assert.ok(result.rawText.includes('What is 2 + 2'), 'Should include question text');
    assert.ok(result.rawText.includes('(A) 3'), 'Should include option A');
    assert.ok(!result.paragraphs.some(p => p.hasMath), 'No math expected');
  });

  // --- OMML equation extraction ---

  test('Extracts OMML fraction \\frac{sin x}{x} from normal paragraph', async () => {
    const body = `
      <w:p>
        <w:r><w:t xml:space="preserve">Evaluate </w:t></w:r>
        <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
          <m:f>
            <m:num><m:r><m:t>sin x</m:t></m:r></m:num>
            <m:den><m:r><m:t>x</m:t></m:r></m:den>
          </m:f>
        </m:oMath>
        <w:r><w:t xml:space="preserve"> as x approaches 0.</w:t></w:r>
      </w:p>
    `;
    const docx = await buildDocxBuffer(body);
    const result = await extractDocxMath(docx);
    assert.strictEqual(result.success, true);
    const mathPara = result.paragraphs.find(p => p.hasMath);
    assert.ok(mathPara, 'Should have a paragraph with math');
    assert.ok(mathPara!.text.includes('frac'), 'Should contain \\frac');
    assert.ok(mathPara!.text.includes('sin x'), 'Should contain sin x');
  });

  test('Extracts OMML limit \\lim_{x\\to 0} from normal paragraph', async () => {
    const body = `
      <w:p>
        <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
          <m:limLow>
            <m:e><m:r><m:t>lim</m:t></m:r></m:e>
            <m:lim><m:r><m:t>x&#x2192;0</m:t></m:r></m:lim>
          </m:limLow>
          <m:f>
            <m:num><m:r><m:t>sin x</m:t></m:r></m:num>
            <m:den><m:r><m:t>x</m:t></m:r></m:den>
          </m:f>
        </m:oMath>
      </w:p>
    `;
    const docx = await buildDocxBuffer(body);
    const result = await extractDocxMath(docx);
    assert.strictEqual(result.success, true);
    const mathPara = result.paragraphs.find(p => p.hasMath);
    assert.ok(mathPara, 'Should have a paragraph with math');
    assert.ok(mathPara!.text.includes('\\lim') || mathPara!.text.includes('lim'), 'Should contain lim');
    assert.ok(mathPara!.text.includes('frac'), 'Should contain \\frac');
  });

  // --- Table cell extraction ---

  test('Extracts OMML equations from table cells (<w:tc>)', async () => {
    const body = `
      <w:tbl>
        <w:tr>
          <w:tc>
            <w:p><w:r><w:t>Option A:</w:t></w:r></w:p>
          </w:tc>
          <w:tc>
            <w:p>
              <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
                <m:f>
                  <m:num><m:r><m:t>a</m:t></m:r></m:num>
                  <m:den><m:r><m:t>b</m:t></m:r></m:den>
                </m:f>
              </m:oMath>
            </w:p>
          </w:tc>
        </w:tr>
      </w:tbl>
    `;
    const docx = await buildDocxBuffer(body);
    const result = await extractDocxMath(docx);
    assert.strictEqual(result.success, true);
    // The table cell paragraph with math should be extracted
    const mathPara = result.paragraphs.find(p => p.hasMath);
    assert.ok(mathPara, 'Should extract math from table cell');
    assert.ok(mathPara!.text.includes('frac'), 'Table cell math should produce \\frac{a}{b}');
  });

  // --- Nested radical ---

  test('Extracts nested square root \\sqrt{1+\\sqrt{1+x}}', async () => {
    const body = `
      <w:p>
        <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
          <m:rad>
            <m:radPr><m:degHide m:val="on"/></m:radPr>
            <m:deg/>
            <m:e>
              <m:r><m:t>1+</m:t></m:r>
              <m:rad>
                <m:radPr><m:degHide m:val="on"/></m:radPr>
                <m:deg/>
                <m:e><m:r><m:t>1+x</m:t></m:r></m:e>
              </m:rad>
            </m:e>
          </m:rad>
        </m:oMath>
      </w:p>
    `;
    const docx = await buildDocxBuffer(body);
    const result = await extractDocxMath(docx);
    assert.strictEqual(result.success, true);
    const mathPara = result.paragraphs.find(p => p.hasMath);
    assert.ok(mathPara, 'Should extract math paragraph with nested radical');
    assert.ok(mathPara!.text.includes('\\sqrt'), 'Should produce \\sqrt');
  });

  // --- Plain text unaffected ---

  test('Plain-text question with no math is extracted unmodified', async () => {
    const body = `
      <w:p><w:r><w:t>What is the capital of France?</w:t></w:r></w:p>
      <w:p><w:r><w:t>(A) Berlin</w:t></w:r></w:p>
      <w:p><w:r><w:t>(B) London</w:t></w:r></w:p>
      <w:p><w:r><w:t>(C) Paris</w:t></w:r></w:p>
      <w:p><w:r><w:t>(D) Rome</w:t></w:r></w:p>
      <w:p><w:r><w:t>Ans: C</w:t></w:r></w:p>
    `;
    const docx = await buildDocxBuffer(body);
    const result = await extractDocxMath(docx);
    assert.strictEqual(result.success, true);
    assert.ok(result.rawText.includes('capital of France'), 'Statement preserved');
    assert.ok(result.rawText.includes('Paris'), 'Option C preserved');
    assert.ok(result.rawText.includes('Ans: C'), 'Answer preserved');
    assert.ok(!result.paragraphs.some(p => p.hasMath), 'No math paragraphs for plain text');
    assert.ok(result.warnings.length === 0, 'No warnings for plain text');
  });

});

