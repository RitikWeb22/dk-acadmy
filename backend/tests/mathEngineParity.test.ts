import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

// Backend Universal Math Engine
import {
  preprocessRawHtmlMath as backendPreprocess,
  preprocessRawHtmlMathDetailed as backendPreprocessDetailed,
  convertHtmlWithMath as backendConvertHtml,
  normalizePastedQuestion as backendNormalizeQuestion
} from '../src/utils/universalMathEngine/index.js';

// Frontend Universal Math Engine
// @ts-ignore
import {
  preprocessRawHtmlMath as frontendPreprocess,
  preprocessRawHtmlMathDetailed as frontendPreprocessDetailed,
  convertHtmlWithMath as frontendConvertHtml,
  normalizePastedQuestion as frontendNormalizeQuestion
} from '../../frontend/src/utils/universalMathEngine/index';

describe('Math Engine Frontend-Backend Step A Parity Suite', () => {
  const sampleOmmlHtml = `
<html xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
<body>
<p class=MsoNormal>Evaluate <!--[if gte mso 9]><xml>
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
</xml><![endif]--><![if !msEquation]>lim_(x-&gt;0) (sin x)/x<![endif]>:
</p>
<p class=MsoNormal>(A) 0</p>
<p class=MsoNormal>(B) 1</p>
<p class=MsoNormal>(C) 2</p>
<p class=MsoNormal>(D) 3</p>
<p class=MsoNormal>Ans: B</p>
</body>
</html>
  `.trim();

  test('Both engines extract identical LaTeX from conditional OMML comments', () => {
    const backendPre = backendPreprocess(sampleOmmlHtml);
    const frontendPre = frontendPreprocess(sampleOmmlHtml);
    assert.equal(frontendPre, backendPre, 'preprocessRawHtmlMath output must be identical');
  });

  test('Both engines report identical detailed KaTeX validation and review flags', () => {
    const backendDet = backendPreprocessDetailed(sampleOmmlHtml);
    const frontendDet = frontendPreprocessDetailed(sampleOmmlHtml);
    assert.equal(frontendDet.needsReview, backendDet.needsReview);
    assert.equal(frontendDet.warnings.length, backendDet.warnings.length);
    assert.equal(frontendDet.html, backendDet.html);
  });

  test('Both engines produce identical normalizePastedQuestion output', () => {
    const mockClipboard = {
      getData: (format: string) => (format === 'text/html' ? sampleOmmlHtml : '')
    };
    const bResult = backendNormalizeQuestion(mockClipboard);
    const fResult = frontendNormalizeQuestion(mockClipboard);

    assert.equal(fResult.statement, bResult.statement);
    assert.equal(fResult.options.length, bResult.options.length);
    for (let i = 0; i < bResult.options.length; i++) {
      assert.equal(fResult.options[i].key, bResult.options[i].key);
      assert.equal(fResult.options[i].text, bResult.options[i].text);
    }
    assert.equal(fResult.correctKey, bResult.correctKey);
  });
});

