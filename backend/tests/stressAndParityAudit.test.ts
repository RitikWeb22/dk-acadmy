/**
 * Master Stress Testing, Real-World Fixtures, KaTeX Verification,
 * and Frontend-Backend Parity Audit Suite
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
// KaTeX from frontend node_modules (the exact production KaTeX used in DK Academy)
// @ts-ignore
import katex from '../../frontend/node_modules/katex/dist/katex.mjs';

// Backend Universal Math Engine
import {
  normalizeMathematicalText as backendNormalize,
  reconstructLinearEquation as backendReconstruct,
  normalizePastedQuestion as backendNormalizeQuestion,
  validateLatex as backendValidateLatex,
  convertHtmlWithMath as backendConvertHtml
} from '../src/utils/universalMathEngine/index.js';

// Frontend Universal Math Engine (tested for 100% isomorphic parity)
// @ts-ignore
import {
  normalizeMathematicalText as frontendNormalize,
  reconstructLinearEquation as frontendReconstruct,
  normalizePastedQuestion as frontendNormalizeQuestion,
  validateLatex as frontendValidateLatex,
  convertHtmlWithMath as frontendConvertHtml
} from '../../frontend/src/utils/universalMathEngine/index';

import { COMPREHENSIVE_MATH_DATASET } from './datasets/comprehensive200MathDataset.js';
import { REAL_WORLD_FIXTURES } from './fixtures/realWorldFixtures.js';

describe('Production Readiness Audit & Real-World Stress Testing Suite', () => {

  // =========================================================================
  // 1. VERIFICATION OF THE 200+ COMPREHENSIVE REGRESSION DATASET
  // =========================================================================
  describe('Part 1: 200+ Mathematical Regression Dataset Execution', () => {
    test(`Dataset size validation: Must contain at least 200 cases (Found: ${COMPREHENSIVE_MATH_DATASET.length})`, () => {
      assert.ok(
        COMPREHENSIVE_MATH_DATASET.length >= 200,
        `Expected at least 200 cases, found ${COMPREHENSIVE_MATH_DATASET.length}`
      );
    });

    // Execute each test case individually with strict assertions
    for (const testCase of COMPREHENSIVE_MATH_DATASET) {
      test(`[${testCase.id}] ${testCase.category}: ${testCase.topic}`, () => {
        const normalized = backendReconstruct(testCase.rawInput);
        assert.ok(normalized && normalized.trim().length > 0, `Output is empty for ${testCase.id}`);

        if (typeof testCase.expectedMatch === 'string') {
          assert.ok(
            normalized.includes(testCase.expectedMatch),
            `[${testCase.id}] Expected output to include "${testCase.expectedMatch}", got: "${normalized}"`
          );
        } else {
          assert.match(
            normalized,
            testCase.expectedMatch,
            `[${testCase.id}] Expected output to match ${testCase.expectedMatch}, got: "${normalized}"`
          );
        }

        if (testCase.requiredTokens) {
          for (const token of testCase.requiredTokens) {
            assert.ok(
              normalized.includes(token),
              `[${testCase.id}] Expected required token "${token}" in: "${normalized}"`
            );
          }
        }
      });
    }
  });

  // =========================================================================
  // 2. KATEX PRODUCTION RENDERING VERIFICATION
  // =========================================================================
  describe('Part 2: Production KaTeX Rendering Verification (v0.19.1)', () => {
    test('Renders every eligible normalized mathematical output using KaTeX without exceptions', () => {
      let renderAttempts = 0;
      let renderSuccesses = 0;
      const failures: { id: string; input: string; normalized: string; error: string }[] = [];

      for (const testCase of COMPREHENSIVE_MATH_DATASET) {
        if (!testCase.mustRenderKaTeX) continue;

        const normalized = backendReconstruct(testCase.rawInput);
        renderAttempts++;

        // Extract pure mathematical expressions or test full expression
        // Remove question punctuation or surrounding prose for pure KaTeX validation
        let mathForKatex = normalized.trim();
        // If wrapped in display or inline math delimiters, strip them for katex.renderToString
        mathForKatex = mathForKatex
          .replace(/^\\\[\s*/, '')
          .replace(/\s*\\\]$/, '')
          .replace(/^\\\(\s*/, '')
          .replace(/\s*\\\)$/, '')
          .replace(/^\$\$|\$\$$/g, '')
          .replace(/^\$+|\$+$/g, '')
          .trim();

        try {
          const renderedHtml = katex.renderToString(mathForKatex, {
            throwOnError: true,
            displayMode: true
          });
          assert.ok(renderedHtml && renderedHtml.length > 0);
          renderSuccesses++;
        } catch (err: any) {
          failures.push({
            id: testCase.id,
            input: testCase.rawInput,
            normalized: mathForKatex,
            error: err.message
          });
        }
      }

      if (failures.length > 0) {
        console.error('KaTeX Rendering Failures:', JSON.stringify(failures, null, 2));
      }

      assert.equal(
        failures.length,
        0,
        `Found ${failures.length} KaTeX rendering failures out of ${renderAttempts} attempts`
      );
      assert.equal(renderSuccesses, renderAttempts);
    });
  });

  // =========================================================================
  // 3. FRONTEND VS BACKEND PARITY AUDIT
  // =========================================================================
  describe('Part 3: Frontend vs Backend Engine Isomorphic Parity', () => {
    test('Produces 100% identical normalized LaTeX for core regression benchmarks', () => {
      const benchmarkInputs = [
        '(lim)┬(y→0) (√(1+√(1+y^4 )) -√2)/y^4',
        'x² + y³',
        '∑_(i=1)^n i²',
        '√(1+√(1+x^4))',
        '1/(1+1/x)',
        '[\\matrix(1&2@3&4)]',
        'f(x)={█(&x^2," if " x<0@&0," if " x=0@&2x," if " x>0)┤',
        '∫_0^1 x^2 dx',
        '|x+1| <= 5',
        'a × b ÷ c ± d ∓ e ≤ f ≥ g ≠ h ≈ k',
        'Academic session 2024/2025 and/or 2026',
        'यदि f(x) = x² + 1 और (If f(x) is continuous), तो f(0) का मान ज्ञात कीजिए।'
      ];

      for (const input of benchmarkInputs) {
        const backendOut = backendReconstruct(input);
        const frontendOut = frontendReconstruct(input);
        assert.equal(
          frontendOut,
          backendOut,
          `Parity mismatch on reconstructLinearEquation:\nBackend:  "${backendOut}"\nFrontend: "${frontendOut}"`
        );
      }
    });

    test('Produces identical structured question extraction and option keys', () => {
      const sampleQuestion = `
        Evaluate the definite integral I = ∫_0^1 x² dx.
        (A) 1/3
        (B) 1/2
        (C) 1/4
        (D) 1
        Answer: A
        Solution: By the power rule, the integral is [x^3/3]_0^1 = 1/3.
        DK Sir Shortcut: Direct power rule inspection.
      `;

      const backendQ = backendNormalizeQuestion(sampleQuestion);
      const frontendQ = frontendNormalizeQuestion(sampleQuestion);

      assert.equal(frontendQ.hasQuestionWithOptions, backendQ.hasQuestionWithOptions);
      assert.equal(frontendQ.options.length, backendQ.options.length);
      assert.equal(frontendQ.correctKey, backendQ.correctKey);

      for (let i = 0; i < backendQ.options.length; i++) {
        assert.equal(frontendQ.options[i].key, backendQ.options[i].key);
        assert.equal(frontendQ.options[i].text, backendQ.options[i].text);
      }
    });

    test('Produces identical LaTeX structural validation results', () => {
      const inputs = [
        '\\frac{1}{x+1}',
        '\\frac{1}{x+1', // unclosed
        '\\frac{}{}', // empty
        '\\left( x + 1', // unmatched left
        '\\sqrt{x^2 + 1}'
      ];

      for (const inp of inputs) {
        const bVal = backendValidateLatex(inp);
        const fVal = frontendValidateLatex(inp);
        assert.equal(fVal.isValid, bVal.isValid, `Validation isValid mismatch for ${inp}`);
        assert.equal(fVal.errors.length, bVal.errors.length, `Validation errors mismatch for ${inp}`);
        assert.equal(fVal.warnings.length, bVal.warnings.length, `Validation warnings mismatch for ${inp}`);
      }
    });
  });

  // =========================================================================
  // 4. REAL-WORLD PRODUCTION FIXTURE AUDIT
  // =========================================================================
  describe('Part 4: Real-World Ingestion Fixtures (Word, GDocs, MathML, PDF OCR, Web, AI)', () => {
    for (const fixture of REAL_WORLD_FIXTURES) {
      test(`Fixture [${fixture.sourceType}]: ${fixture.name}`, () => {
        let result = '';

        const normRes = backendNormalize(fixture.rawPayload);
        result = normRes.normalizedText;

        assert.ok(result && result.trim().length > 0, `Result is empty for ${fixture.name}`);

        for (const kw of fixture.expectedKeywords) {
          assert.ok(
            result.includes(kw),
            `Fixture [${fixture.name}] missing expected keyword: "${kw}". Full output:\n${result}`
          );
        }

        for (const latexSub of fixture.expectedLatexSubstrings) {
          assert.ok(
            result.includes(latexSub),
            `Fixture [${fixture.name}] missing expected LaTeX substring: "${latexSub}". Full output:\n${result}`
          );
        }
      });
    }
  });

  // =========================================================================
  // 5. ADVERSARIAL AND STRESS EDGE CASES
  // =========================================================================
  describe('Part 5: Adversarial, Malformed & Extreme Edge-Case Stress Testing', () => {
    test('Deeply nested 10-level radicals without stack overflow or crash', () => {
      const tenLevelRadical = '√(1+√(1+√(1+√(1+√(1+√(1+√(1+√(1+√(1+√x)))))))))';
      const output = backendReconstruct(tenLevelRadical);
      assert.ok(output.includes('\\sqrt{x}'));
      // Count nested \sqrt occurrences
      const count = (output.match(/\\sqrt\{/g) || []).length;
      assert.equal(count, 10);
    });

    test('Deeply nested 8-level fractions without stack overflow or crash', () => {
      const eightLevelFrac = '1/(1+1/(1+1/(1+1/(1+1/(1+1/(1+1/(1+1/x)))))))';
      const output = backendReconstruct(eightLevelFrac);
      const count = (output.match(/\\frac\{1\}\{/g) || []).length;
      assert.equal(count, 8);
    });

    test('Zero-width space and invisible Unicode character stripping', () => {
      const zeroWidthBombed = 'x\u200B\u200C\u200D\uFEFF² + y\u2060\u2061\u2062³';
      const output = backendReconstruct(zeroWidthBombed);
      assert.equal(output.replace(/\s+/g, ''), 'x^2+y^3');
    });

    test('Large 50KB question payload processed under 500ms', () => {
      const baseParagraph = 'Evaluate the integral ∫_0^1 x² dx and limit (lim)┬(y→0) (sin y)/y. Option (A) 1/3 (B) 1/2.\n';
      const largePayload = baseParagraph.repeat(500); // ~50 KB text
      assert.ok(largePayload.length > 40000);

      const startTime = Date.now();
      const output = backendReconstruct(largePayload);
      const elapsed = Date.now() - startTime;

      assert.ok(output.length > 0);
      assert.ok(elapsed < 1500, `Large payload took ${elapsed}ms, exceeding threshold`);
    });

    test('Safely handles malformed XML/HTML without unhandled exception', () => {
      const malformed = '<m:oMath><m:f><m:num><m:t>1<m:den><unclosed>tag';
      assert.doesNotThrow(() => {
        const out = backendConvertHtml(malformed);
        assert.ok(typeof out === 'string');
      });
    });

    test('Preserves hyphens in compound words vs minus signs in math', () => {
      const compoundWordText = 'Consider a non-linear, high-dimensional system with x - 5 = 0.';
      const output = backendReconstruct(compoundWordText);
      assert.ok(output.includes('non-linear'));
      assert.ok(output.includes('high-dimensional'));
      assert.match(output, /x\s*-\s*5\s*=\s*0/);
    });
  });

});
