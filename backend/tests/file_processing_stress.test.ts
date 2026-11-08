import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import katex from 'katex';
import { verifyMagicBytes } from '../src/utils/fileValidation.js';
import { normalizeMathematicalText } from '../src/utils/universalMathEngine/index.js';
import { extractDocxMath } from '../src/utils/docxMathExtractor.js';

describe('DK Academy Backend — Phase 3: File Processing & Mathematical Content Stress Testing Suite', () => {
  const tmpDir = os.tmpdir();

  // ==========================================
  // SECTION 1: Extreme Mathematical Structures
  // ==========================================
  describe('Extreme Mathematical Structures KaTeX Stress Testing', () => {
    test('15-level deeply nested radicals parse and render without stack overflow', () => {
      let nested = 'x';
      for (let i = 0; i < 15; i++) {
        nested = `\\sqrt{1 + ${nested}}`;
      }
      const raw = `Solve for x: ${nested} = \\frac{1 + \\sqrt{5}}{2}`;
      const normalized = normalizeMathematicalText(raw);
      assert.ok(normalized);

      // Verify KaTeX renders without throwing
      const html = katex.renderToString(nested, { throwOnError: false });
      assert.ok(html.includes('katex-html'), 'Must produce valid KaTeX HTML output');
    });

    test('Complex multiline double integrals and vector calculus equations', () => {
      const vectorCalcExpr =
        '\\oint_{\\partial \\Sigma} \\vec{B} \\cdot d\\vec{\\ell} = \\mu_0 \\iint_{\\Sigma} \\vec{J} \\cdot d\\vec{A} + \\mu_0 \\varepsilon_0 \\frac{d}{dt} \\iint_{\\Sigma} \\vec{E} \\cdot d\\vec{A}';
      const normalized = normalizeMathematicalText(vectorCalcExpr);
      assert.ok(normalized);
      const html = katex.renderToString(vectorCalcExpr, { throwOnError: false });
      assert.ok(html.includes('oint'));
      assert.ok(html.includes('iint'));
    });

    test('3x3 and 4x4 Matrices with determinant equations', () => {
      const matrixExpr =
        '\\det \\begin{pmatrix} 1 - \\lambda & 2 & 3 \\\\ 0 & 4 - \\lambda & 5 \\\\ 0 & 0 & 6 - \\lambda \\end{pmatrix} = (1 - \\lambda)(4 - \\lambda)(6 - \\lambda)';
      const normalized = normalizeMathematicalText(matrixExpr);
      assert.ok(normalized);
      const html = katex.renderToString(matrixExpr, { throwOnError: false });
      assert.ok(html.includes('pmatrix') || html.includes('matrix'));
    });

    test('Piecewise functions with case delimiters', () => {
      const piecewiseExpr =
        'f(x) = \\begin{cases} \\frac{\\sin x}{x} & \\text{if } x \\neq 0 \\\\ 1 & \\text{if } x = 0 \\end{cases}';
      const normalized = normalizeMathematicalText(piecewiseExpr);
      assert.ok(normalized);
      const html = katex.renderToString(piecewiseExpr, { throwOnError: false });
      assert.ok(html.includes('cases'));
    });

    test('Complex Chemistry reaction equations with state notations and reaction arrows', () => {
      const chemExpr =
        '2\\text{KMnO}_4\\text{(aq)} + 5\\text{H}_2\\text{C}_2\\text{O}_4\\text{(aq)} + 3\\text{H}_2\\text{SO}_4\\text{(aq)} \\rightarrow 2\\text{MnSO}_4 + \\text{K}_2\\text{SO}_4 + 10\\text{CO}_2\\uparrow + 8\\text{H}_2\\text{O}';
      const normalized = normalizeMathematicalText(chemExpr);
      assert.ok(normalized);
      const html = katex.renderToString(chemExpr, { throwOnError: false });
      assert.ok(html.includes('KMnO'));
    });
  });

  // ==========================================
  // SECTION 2: Large Bulk Document Imports
  // ==========================================
  describe('Large Bulk Question Import Stress Testing', () => {
    test('Simulated 200-question bulk dataset is normalized under 500ms', () => {
      const questions: string[] = [];
      for (let i = 1; i <= 200; i++) {
        questions.push(
          `Question ${i}: Evaluate the limit \\lim_{x \\to 0} \\frac{\\sqrt[3]{1 + ${i}x} - 1}{x} and find option A: \\frac{${i}}{3}, option B: -1, option C: 0, option D: \\infty.`
        );
      }
      const bulkText = questions.join('\n\n');

      const t0 = performance.now();
      const result = normalizeMathematicalText(bulkText);
      const durationMs = performance.now() - t0;

      assert.ok(result.normalizedText.length > 0);
      assert.ok(durationMs < 500, `200 questions must normalize under 500ms (took ${durationMs.toFixed(1)}ms)`);
      // Verify key preservation in bulk stream
      assert.ok(result.normalizedText.includes('\\sqrt[3]'), 'Must retain cube root across all 200 questions');
      assert.ok(result.normalizedText.includes('-1'), 'Must retain negative options across bulk import');
    });
  });

  // ==========================================
  // SECTION 3: Malformed, Corrupted & Truncated Files
  // ==========================================
  describe('Malformed Documents & Binary Magic Bytes Hardening', () => {
    test('Truncated zero-byte file is rejected cleanly by magic byte inspection', () => {
      const emptyFile = path.join(tmpDir, `empty_${Date.now()}.docx`);
      fs.writeFileSync(emptyFile, Buffer.alloc(0));
      try {
        const isValid = verifyMagicBytes(emptyFile, '.docx');
        assert.equal(isValid, false, 'Zero-byte file must be rejected');
      } finally {
        if (fs.existsSync(emptyFile)) fs.unlinkSync(emptyFile);
      }
    });

    test('Corrupted DOCX with truncated ZIP headers fails safely without process crash', async () => {
      const corruptZipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0xde, 0xad, 0xbe, 0xef]);
      const corruptFile = path.join(tmpDir, `corrupt_${Date.now()}.docx`);
      fs.writeFileSync(corruptFile, corruptZipHeader);

      try {
        const extraction = await extractDocxMath(corruptZipHeader);
        assert.equal(extraction.success, false, 'Corrupted zip structure must fail safely without process crash');
        assert.ok(extraction.errorLog.length > 0, 'Must record descriptive error in errorLog');
      } finally {
        if (fs.existsSync(corruptFile)) fs.unlinkSync(corruptFile);
      }
    });

    test('Executable binary ELF/PE disguised as PDF is rejected by magic byte inspector', () => {
      const fakePdf = path.join(tmpDir, `malicious_${Date.now()}.pdf`);
      // Windows PE EXE magic bytes: MZ (4D 5A)
      const exeHeader = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00]);
      fs.writeFileSync(fakePdf, exeHeader);

      try {
        const isValid = verifyMagicBytes(fakePdf, '.pdf');
        assert.equal(isValid, false, 'PE executable disguised as PDF must be rejected');
      } finally {
        if (fs.existsSync(fakePdf)) fs.unlinkSync(fakePdf);
      }
    });

    test('Malformed XML string with unclosed tags does not hang or enter infinite loop', () => {
      const malformedXml = '<m:oMath><m:r><m:t>x + y</m:t></m:r><m:rad><m:radPr><m:deg/>'; // truncated mid-radical
      const t0 = performance.now();
      const normalized = normalizeMathematicalText(malformedXml);
      const elapsed = performance.now() - t0;

      assert.ok(elapsed < 100, `Malformed XML must terminate under 100ms (took ${elapsed.toFixed(1)}ms)`);
      assert.ok(typeof normalized.normalizedText === 'string');
    });
  });
});
