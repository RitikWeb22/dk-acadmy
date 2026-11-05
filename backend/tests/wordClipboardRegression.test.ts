import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  convertHtmlWithMath,
  preprocessRawHtmlMath,
  preprocessRawHtmlMathDetailed
} from '../src/utils/universalMathEngine/ommlMathMLConverter.js';
import {
  normalizePastedQuestion
} from '../src/utils/universalMathEngine/index.js';

describe('Word Clipboard HTML OMML Ingestion Regression Suite (Step A)', () => {
  test('Extracts <m:oMath> inside conditional comments and strips <![if !msEquation]> fallback', () => {
    const rawWordClipboardHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
xmlns="http://www.w3.org/TR/REC-html40">
<body>
<p class=MsoNormal>Evaluate the limit <!--[if gte mso 9]><xml>
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
</xml><![endif]--><![if !msEquation]><span style='mso-no-proof:yes'>lim_(x-&gt;0) (sin x)/x</span><![endif]>:
</p>
<p class=MsoNormal>(A) 0</p>
<p class=MsoNormal>(B) 1</p>
<p class=MsoNormal>(C) <!--[if gte mso 9]><xml>
 <m:oMath><m:r><m:t>∞</m:t></m:r></m:oMath>
</xml><![endif]--><![if !msEquation]>infinity<![endif]></p>
<p class=MsoNormal>(D) -1</p>
<p class=MsoNormal>Ans: B</p>
</body>
</html>
    `.trim();

    // 1. Verify preprocessor extracts OMML and strips non-math fallback
    const preprocessed = preprocessRawHtmlMath(rawWordClipboardHtml);
    assert.ok(preprocessed.includes('\\lim_{x \\to 0}\\frac{sin x}{x}') || preprocessed.includes('\\lim_{x\\to 0}\\frac{sin x}{x}'), 'Should convert limit & fraction OMML');
    assert.ok(!preprocessed.includes('lim_(x->0)'), 'Should strip !msEquation plain-text fallback');
    assert.ok(!preprocessed.includes('!msEquation'), 'Should remove conditional comment syntax');

    // 2. Full conversion through normalizePastedQuestion
    const result = normalizePastedQuestion({
      getData: (format: string) => {
        if (format === 'text/html') return rawWordClipboardHtml;
        if (format === 'text/plain') return 'Compute limit lim_(x->0) (sin x)/x:\n(A) 0\n(B) 1\n(C) infinity\n(D) -1\nAns: B';
        return '';
      }
    });

    assert.ok(result.hasQuestionWithOptions, 'Should detect 4 options');
    assert.equal(result.options.length, 4, 'Must have exactly 4 options');
    assert.equal(result.correctKey, 'B', 'Correct key should be B');
    assert.ok(result.statement.includes('\\lim'), 'Statement should have \\lim');
    assert.ok(result.statement.includes('\\frac'), 'Statement should have \\frac');
    assert.equal(result.options[0].text, '0');
    assert.equal(result.options[1].text, '1');
    assert.ok(result.options[2].text.includes('\\infty'), 'Option C should contain infinity LaTeX');
    assert.equal(result.options[3].text, '-1');
  });

  test('Extracts nested radicals and fractions from Word 365 clipboard HTML', () => {
    const nestedRadicalHtml = `
<html xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
<body>
<p class=MsoNormal>If <!--[if gte mso 9]><xml>
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
</xml><![endif]--><![if !msEquation]>sqrt(1+sqrt(1+x))<![endif]> = 2, find x.</p>
<p class=MsoNormal>(A) 3</p>
<p class=MsoNormal>(B) 8</p>
<p class=MsoNormal>(C) 15</p>
<p class=MsoNormal>(D) 24</p>
<p class=MsoNormal>Ans: B</p>
</body>
</html>
    `.trim();

    const result = normalizePastedQuestion({
      getData: (format: string) => (format === 'text/html' ? nestedRadicalHtml : '')
    });

    assert.ok(result.statement.includes('\\sqrt{1+\\sqrt{1+x}}') || result.statement.includes('\\sqrt{1+ \\sqrt{1+x}}'), 'Must reconstruct nested square root');
    assert.ok(!result.statement.includes('sqrt(1+sqrt(1+x))'), 'Must remove fallback plain text');
    assert.equal(result.correctKey, 'B');
  });

  test('Preserves fallback text and flags needsReview when KaTeX validation fails', () => {
    // Malformed OMML with empty fraction where KaTeX fails validation
    const malformedHtml = `
<html xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
<body>
<p class=MsoNormal>Question statement <!--[if gte mso 9]><xml>
 <m:oMath>
  <m:f><m:num></m:num><m:den></m:den></m:f>
 </m:oMath>
</xml><![endif]--><![if !msEquation]><span style='mso-no-proof:yes'>1/fallback_denominator</span><![endif]>.</p>
<p class=MsoNormal>(A) 1</p>
<p class=MsoNormal>(B) 2</p>
<p class=MsoNormal>(C) 3</p>
<p class=MsoNormal>(D) 4</p>
<p class=MsoNormal>Ans: A</p>
</body>
</html>
    `.trim();

    const detailed = preprocessRawHtmlMathDetailed(malformedHtml);
    assert.ok(detailed.needsReview, 'Should flag needsReview when equation fails KaTeX validation');
    assert.ok(detailed.warnings.length > 0, 'Should record a warning message');
    assert.ok(detailed.html.includes('1/fallback_denominator'), 'Must retain fallback text when KaTeX fails');
  });
});

