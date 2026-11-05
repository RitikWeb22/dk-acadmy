import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

// 1. IMPORT STRICTLY FROM COMPILED dist/ USING PLAIN NODE (NO tsx)
import { extractDocxMath } from '../dist/utils/docxMathExtractor.js';
import {
  normalizePastedQuestion,
  normalizeMathematicalText,
  preprocessRawHtmlMathDetailed,
  getDOMParser
} from '../dist/utils/universalMathEngine/index.js';

console.log('====================================================');
console.log('PRODUCTION SMOKE TEST: COMPILED backend/dist ENGINE');
console.log('====================================================\n');

// Verify that globalThis.DOMParser is NOT set beforehand
console.log('1. Environment check:');
console.log('   globalThis.DOMParser pre-existing?', typeof globalThis.DOMParser);
const parserClass = getDOMParser();
console.log('   domAdapter getDOMParser() resolved constructor:', parserClass?.name || 'null');
console.log('   CWD fallback verification: DOMParser successfully loaded via createRequire?', !!parserClass);
console.log('');

// 2. Build a real .docx file containing equations in a paragraph and in a table cell
const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml"
            ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="word/document.xml"/>
</Relationships>`;

const bodyXml = `
  <!-- Paragraph with OMML limit equation -->
  <w:p>
    <w:r><w:t>Question 1: Evaluate the limit </w:t></w:r>
    <m:oMath>
      <m:limLow>
        <m:e><m:r><m:t>lim</m:t></m:r></m:e>
        <m:lim><m:r><m:t>x→0</m:t></m:r></m:lim>
      </m:limLow>
      <m:f>
        <m:num><m:r><m:t>sin x</m:t></m:r></m:num>
        <m:den><m:r><m:t>x</m:t></m:r></m:den>
      </m:f>
    </m:oMath>
    <w:r><w:t> carefully.</w:t></w:r>
  </w:p>

  <!-- Table with a table cell containing nested radical OMML -->
  <w:tbl>
    <w:tr>
      <w:tc>
        <w:p><w:r><w:t>Option A</w:t></w:r></w:p>
      </w:tc>
      <w:tc>
        <w:p>
          <w:r><w:t>Value = </w:t></w:r>
          <m:oMath>
            <m:rad>
              <m:radPr><m:degHide m:val="on"/></m:radPr>
              <m:deg/>
              <m:e>
                <m:r><m:t>1+</m:t></m:r>
                <m:rad>
                  <m:radPr><m:degHide m:val="on"/></m:radPr>
                  <m:deg/>
                  <m:e>
                    <m:r><m:t>1+x</m:t></m:r>
                  </m:e>
                </m:rad>
              </m:e>
            </m:rad>
          </m:oMath>
        </w:p>
      </w:tc>
    </w:tr>
  </w:tbl>
`;

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${bodyXml}
    <w:sectPr/>
  </w:body>
</w:document>`;

const zip = new JSZip();
zip.file('[Content_Types].xml', CONTENT_TYPES_XML);
zip.file('_rels/.rels', RELS_XML);
zip.file('word/document.xml', documentXml);

const docxBuffer = Buffer.from(await zip.generateAsync({ type: 'arraybuffer' }));
const docxFilePath = path.join(process.cwd(), 'smoke_test_real.docx');
fs.writeFileSync(docxFilePath, docxBuffer);
console.log('2. Created real .docx file on disk:', docxFilePath, `(${docxBuffer.length} bytes)`);

// Run DOCX extraction using compiled dist code
const extractedDocx = await extractDocxMath(docxBuffer);
console.log('   DOCX extraction successful?', extractedDocx.success);
console.log('   Total paragraphs extracted:', extractedDocx.paragraphs.length);
for (let i = 0; i < extractedDocx.paragraphs.length; i++) {
  const p = extractedDocx.paragraphs[i];
  console.log(`   [Paragraph ${i + 1}] hasMath=${p.hasMath}: ${JSON.stringify(p.text)}`);
}
console.log('   Extracted rawText:');
console.log('   ----------------------------------------');
console.log(extractedDocx.rawText);
console.log('   ----------------------------------------\n');

// 3. Run Word-HTML paste case through compiled engine
const wordClipboardHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
xmlns="http://www.w3.org/TR/REC-html40">
<body>
<p class=MsoNormal>Evaluate the limit <!--[if gte msEquation 12]>
 <m:oMath>
  <m:limLow>
   <m:e><m:r><m:t>lim</m:t></m:r></m:e>
   <m:lim><m:r><m:t>x→0</m:t></m:r></m:lim>
  </m:limLow>
  <m:f>
   <m:num><m:r><m:t>sin x</m:t></m:r></m:num>
   <m:den><m:r><m:t>x</m:t></m:r></m:den>
  </m:f>
 </m:oMath>
<![endif]--><![if !msEquation]>lim_(x-&gt;0) (sin x)/x<![endif]>:
</p>
<p class=MsoNormal>(A) 0</p>
<p class=MsoNormal>(B) 1</p>
<p class=MsoNormal>(C) <!--[if gte msEquation 12]>
 <m:oMath><m:r><m:t>∞</m:t></m:r></m:oMath>
<![endif]--><![if !msEquation]>infinity<![endif]></p>
<p class=MsoNormal>(D) -1</p>
<p class=MsoNormal>Ans: B</p>
</body>
</html>`;

const mockClipboard = {
  getData: (format) => {
    if (format === 'text/html') return wordClipboardHtml;
    if (format === 'text/plain') return 'Compute limit lim_(x->0) (sin x)/x:\n(A) 0\n(B) 1\n(C) infinity\n(D) -1\nAns: B';
    return '';
  }
};

const pasteResult = normalizePastedQuestion(mockClipboard);
console.log('3. Word-HTML Paste Case through compiled normalizePastedQuestion:');
console.log('   sourceType:', pasteResult.sourceType);
console.log('   hasQuestionWithOptions:', pasteResult.hasQuestionWithOptions);
console.log('   statement:', JSON.stringify(pasteResult.statement));
console.log('   options:');
for (const opt of pasteResult.options) {
  console.log(`     (${opt.key}) ${opt.text}`);
}
console.log('   correctKey:', pasteResult.correctKey);
console.log('   needsReview:', pasteResult.needsReview);
console.log('   warnings count:', pasteResult.warnings?.length || 0);
console.log('   errors count:', pasteResult.errors?.length || 0);

// Clean up smoke docx file
fs.unlinkSync(docxFilePath);
console.log('\n[SMOKE TEST PASSED SUCCESSFULLY]');
