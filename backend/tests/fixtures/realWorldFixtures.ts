/**
 * Realistic Real-World Production Clipboard & File Ingestion Fixtures
 * Sourced from actual Word, Google Docs, MathML, PDF OCR, and AI outputs.
 */

export interface RealWorldFixture {
  name: string;
  sourceType: 'word_omml' | 'gdocs_html' | 'mathml' | 'pdf_ocr' | 'web_html' | 'ai_markdown';
  rawPayload: string;
  expectedKeywords: string[];
  expectedLatexSubstrings: string[];
}

export const REAL_WORLD_FIXTURES: RealWorldFixture[] = [
  // =========================================================================
  // 1. REAL MICROSOFT WORD CLIPBOARD HTML WITH OMML & CONDITIONAL COMMENTS
  // =========================================================================
  {
    name: 'Microsoft Word 365 Clipboard HTML (OMML)',
    sourceType: 'word_omml',
    rawPayload: `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta name=ProgId content=Word.Document>
<meta name=Generator content="Microsoft Word 15">
<style>
<!--
 /* Font Definitions */
 @font-face
	{font-family:"Cambria Math";
	panose-1:2 4 5 3 5 4 6 3 2 4;}
-->
</style>
</head>
<body lang=EN-US>
<div class=WordSection1>
<p class=MsoNormal>Evaluate the following definite limit from JEE Advanced 2023:</p>
<p class=MsoNormal><!--[if gte mso 9]><xml>
 <o:OfficeDocumentSettings>
  <o:AllowPNG/>
 </o:OfficeDocumentSettings>
</xml><![endif]--><!--[if gte mso 9]><xml>
 <m:oMathPara>
  <m:oMath>
   <m:f>
    <m:num>
     <m:rad>
      <m:radPr><m:degHide m:val="on"/></m:radPr>
      <m:deg/>
      <m:e>
       <m:r><m:t>1+</m:t></m:r>
       <m:rad>
        <m:radPr><m:degHide m:val="on"/></m:radPr>
        <m:deg/>
        <m:e>
         <m:r><m:t>1+</m:t></m:r>
         <m:sSup>
          <m:e><m:r><m:t>x</m:t></m:r></m:e>
          <m:sup><m:r><m:t>4</m:t></m:r></m:sup>
         </m:sSup>
        </m:e>
       </m:rad>
      </m:e>
     </m:rad>
     <m:r><m:t>-</m:t></m:r>
     <m:rad>
      <m:radPr><m:degHide m:val="on"/></m:radPr>
      <m:deg/>
      <m:e><m:r><m:t>2</m:t></m:r></m:e>
     </m:rad>
    </m:num>
    <m:den>
     <m:sSup>
      <m:e><m:r><m:t>x</m:t></m:r></m:e>
      <m:sup><m:r><m:t>4</m:t></m:r></m:sup>
     </m:sSup>
    </m:den>
   </m:f>
  </m:oMath>
 </m:oMathPara>
</xml><![endif]--></p>
<p class=MsoNormal>(A) 1/2</p>
<p class=MsoNormal>(B) 1/4</p>
<p class=MsoNormal>(C) 1/8</p>
<p class=MsoNormal>(D) 1/16</p>
</div>
</body>
</html>`,
    expectedKeywords: ['Evaluate the following definite limit', '(A)', '(B)'],
    expectedLatexSubstrings: ['\\frac', '\\sqrt{1+', 'x^{4}', '\\sqrt{2}']
  },

  // =========================================================================
  // 2. GOOGLE DOCS CLIPBOARD HTML (WITH INLINE SUPERSCRIPTS & UNICODE)
  // =========================================================================
  {
    name: 'Google Docs Clipboard HTML with Superscripts & Greek',
    sourceType: 'gdocs_html',
    rawPayload: `<meta charset='utf-8'><b style="font-weight:normal;" id="docs-internal-guid-9b34-8c82">
<p dir="ltr"><span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;">Let f(x) = x</span><sup><span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;">2</span></sup><span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;"> + y</span><sup><span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;">3</span></sup><span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;"> and let &alpha; &le; x &le; &beta;.</span></p>
<p dir="ltr"><span style="font-size:11pt;font-family:Arial;">Find the summation &sum;</span><sub><span style="font-size:11pt;font-family:Arial;">i=1</span></sub><sup><span style="font-size:11pt;font-family:Arial;">n</span></sup><span style="font-size:11pt;font-family:Arial;"> i</span><sup><span style="font-size:11pt;font-family:Arial;">2</span></sup><span style="font-size:11pt;font-family:Arial;">.</span></p>
</b>`,
    expectedKeywords: ['Let f(x) =', 'Find the summation'],
    expectedLatexSubstrings: ['x^{2}', 'y^{3}', '\\alpha', '\\beta', '\\sum']
  },

  // =========================================================================
  // 3. W3C MATHML SPECIFICATION DOCUMENT
  // =========================================================================
  {
    name: 'W3C MathML Document with Nested Fractions and Square Root',
    sourceType: 'mathml',
    rawPayload: `<?xml version="1.0" encoding="UTF-8"?>
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mrow>
    <mi>x</mi>
    <mo>=</mo>
    <mfrac>
      <mrow>
        <mo>−</mo>
        <mi>b</mi>
        <mo>±</mo>
        <msqrt>
          <mrow>
            <msup>
              <mi>b</mi>
              <mn>2</mn>
            </msup>
            <mo>−</mo>
            <mn>4</mn>
            <mo>⁢</mo>
            <mi>a</mi>
            <mo>⁢</mo>
            <mi>c</mi>
          </mrow>
        </msqrt>
      </mrow>
      <mrow>
        <mn>2</mn>
        <mo>⁢</mo>
        <mi>a</mi>
      </mrow>
    </mfrac>
  </mrow>
</math>`,
    expectedKeywords: ['x'],
    expectedLatexSubstrings: ['\\frac{-b \\pm \\sqrt{', 'b^{2} - 4 a c', '2 a}']
  },

  // =========================================================================
  // 4. PDF OCR EXTRACTED TEXT STREAM (JEE PAST PAPER CORRUPTED)
  // =========================================================================
  {
    name: 'PDF / OCR Raw Text Extraction (Cambria Math Artifacts)',
    sourceType: 'pdf_ocr',
    rawPayload: `Q.42 Consider the function f: R -> R defined by
f(x) = {█(&x^2+1," if " x<0@&0," if " x=0@&2x," if " x>0)┤
Then the value of (lim)┬(x→0) f(x) is:
(A) 0
(B) 1
(C) Does not exist
(D) 2
Ans: C
Sol: Left hand limit is 1 and right hand limit is 0.`,
    expectedKeywords: ['Consider the function', 'Then the value of', '(A)', '(B)', '(C)', '(D)'],
    expectedLatexSubstrings: ['\\begin{cases}', '\\lim_{x \\to 0}']
  },

  // =========================================================================
  // 5. WEBSITE HTML (ONLINE QUESTION BANK WITH MATH TAGS)
  // =========================================================================
  {
    name: 'Online JEE Test Portal HTML with math tags and tables',
    sourceType: 'web_html',
    rawPayload: `<div class="question-container">
  <div class="q-title"><p>Find the value of the definite integral:</p></div>
  <div class="equation-block">
    <math xmlns="http://www.w3.org/1998/Math/MathML">
      <msubsup>
        <mo>&int;</mo>
        <mn>0</mn>
        <mn>1</mn>
      </msubsup>
      <msup><mi>x</mi><mn>2</mn></msup>
      <mo>&dd;</mo>
      <mi>x</mi>
    </math>
  </div>
  <table class="options-table">
    <tr><td>(A)</td><td>1/3</td></tr>
    <tr><td>(B)</td><td>1/2</td></tr>
    <tr><td>(C)</td><td>1/6</td></tr>
    <tr><td>(D)</td><td>2/3</td></tr>
  </table>
</div>`,
    expectedKeywords: ['Find the value of the definite integral', '(A)', '(B)'],
    expectedLatexSubstrings: ['\\int', 'x^{2}', '\\frac{1}{3}']
  },

  // =========================================================================
  // 6. AI-GENERATED MATHEMATICAL CONTENT (CHATGPT / CLAUDE LATEX OUTPUT)
  // =========================================================================
  {
    name: 'AI Generated Response with Display and Inline Math',
    sourceType: 'ai_markdown',
    rawPayload: `Here is the step-by-step solution for the given limit:

We are asked to compute:
\\[
\\lim_{y \\to 0} \\frac{\\sqrt{1+\\sqrt{1+y^4}} - \\sqrt{2}}{y^4}
\\]

Rationalizing the numerator by multiplying conjugate:
\\( \\sqrt{1+\\sqrt{1+y^4}} + \\sqrt{2} \\)

We obtain:
\\[
\\frac{1+\\sqrt{1+y^4}-2}{y^4 (\\sqrt{1+\\sqrt{1+y^4}}+\\sqrt{2})}
\\]
Which simplifies to \\( \\frac{1}{4\\sqrt{2}} \\).`,
    expectedKeywords: ['Here is the step-by-step solution', 'Rationalizing the numerator'],
    expectedLatexSubstrings: ['\\lim_{y \\to 0}', '\\frac{\\sqrt{1+\\sqrt{1+y^4}}', '\\frac{1}{4\\sqrt{2}}']
  }
];

