import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeMathematicalText,
  reconstructLinearEquation,
  reconstructWordEquationLinearFormat,
  normalizePastedQuestion,
  validateLatex,
  detectInputFormat,
  convertHtmlWithMath
} from '../src/utils/universalMathEngine/index.js';

describe('Universal Mathematical Question Normalization Engine — Master Test Suite', () => {

  // ==========================================================================
  // SECTION 1: MANDATORY EXACT REGRESSION BENCHMARKS (USER SPECIFIED)
  // ==========================================================================
  describe('Mandatory Regression Benchmarks (User Exact Examples)', () => {
    test('Test 1: Word stacked limit with nested radical and fraction: (lim)┬(y→0) (√(1+√(1+y^4 )) -√2)/y^4', () => {
      const input = '(lim)┬(y→0) (√(1+√(1+y^4 )) -√2)/y^4';
      const result = reconstructLinearEquation(input);

      // Verify limit reconstruction
      assert.match(result, /\\lim_\{y\s*\\to\s*0\}/);
      // Verify outer fraction reconstruction
      assert.match(result, /\\frac\{.*\}\{y\^4\}/);
      // Verify nested radical reconstruction
      assert.match(result, /\\sqrt\{1\+\\sqrt\{1\+y\^4\}\}/);
      // Verify \sqrt{2}
      assert.match(result, /\\sqrt\{2\}/);
    });

    test('Test 2: Unicode superscripts: x² + y³', () => {
      const input = 'x² + y³';
      const result = reconstructLinearEquation(input);
      // Strip spaces to verify canonical structure x^2+y^3
      const canonical = result.replace(/\s+/g, '');
      assert.equal(canonical, 'x^2+y^3');
    });

    test('Test 3: Unicode summation with lower bound and superscript: ∑_(i=1)^n i²', () => {
      const input = '∑_(i=1)^n i²';
      const result = reconstructLinearEquation(input);
      const canonical = result.replace(/\s+/g, '');
      assert.equal(canonical, '\\sum_{i=1}^{n}i^2');
    });

    test('Test 4: Deeply nested square roots: √(1+√(1+x^4))', () => {
      const input = '√(1+√(1+x^4))';
      const result = reconstructLinearEquation(input);
      const canonical = result.replace(/\s+/g, '');
      assert.equal(canonical, '\\sqrt{1+\\sqrt{1+x^4}}');
    });

    test('Test 5: Nested fractions: 1/(1+1/x)', () => {
      const input = '1/(1+1/x)';
      const result = reconstructLinearEquation(input);
      const canonical = result.replace(/\s+/g, '');
      assert.equal(canonical, '\\frac{1}{1+\\frac{1}{x}}');
    });
  });

  // ==========================================================================
  // SECTION 2: CATEGORY A — BASIC ARITHMETIC & OPERATORS
  // ==========================================================================
  describe('Category A: Basic Arithmetic & Operators', () => {
    test('Converts multiplication, division, plus-minus, and relations', () => {
      const input = 'a × b ÷ c ± d ∓ e ≤ f ≥ g ≠ h ≈ k';
      const result = reconstructLinearEquation(input);
      assert.match(result, /\\times/);
      assert.match(result, /\\div/);
      assert.match(result, /\\pm/);
      assert.match(result, /\\mp/);
      assert.match(result, /\\leq/);
      assert.match(result, /\\geq/);
      assert.match(result, /\\neq/);
      assert.match(result, /\\approx/);
    });
  });

  // ==========================================================================
  // SECTION 3: CATEGORY B — NESTED ROOTS & RADICALS
  // ==========================================================================
  describe('Category B: Radicals & Multi-Level Nested Roots', () => {
    test('Triple nested square roots: √(1+√(2+√(3+x)))', () => {
      const input = '√(1+√(2+√(3+x)))';
      const result = reconstructLinearEquation(input);
      assert.equal(result.replace(/\s+/g, ''), '\\sqrt{1+\\sqrt{2+\\sqrt{3+x}}}');
    });

    test('Degree radicals: Cube root and fourth root', () => {
      assert.equal(reconstructLinearEquation('∛(x^3 + 1)').replace(/\s+/g, ''), '\\sqrt[3]{x^3+1}');
      assert.equal(reconstructLinearEquation('∜(16)').replace(/\s+/g, ''), '\\sqrt[4]{16}');
    });

    test('Single token radicals: √2, √17, √x', () => {
      assert.match(reconstructLinearEquation('√2'), /\\sqrt\{2\}/);
      assert.match(reconstructLinearEquation('√17'), /\\sqrt\{17\}/);
      assert.match(reconstructLinearEquation('√x'), /\\sqrt\{x\}/);
    });
  });

  // ==========================================================================
  // SECTION 4: CATEGORY C — NESTED FRACTIONS
  // ==========================================================================
  describe('Category C: Complex & Nested Fractions', () => {
    test('Double nested fraction: 1/(1+1/(1+x))', () => {
      const input = '1/(1+1/(1+x))';
      const result = reconstructLinearEquation(input);
      assert.equal(result.replace(/\s+/g, ''), '\\frac{1}{1+\\frac{1}{1+x}}');
    });

    test('Fractions with parenthesized binomials: ((x+1)(x-2))/(x^2-4)', () => {
      const input = '((x+1)(x-2))/(x^2-4)';
      const result = reconstructLinearEquation(input);
      assert.match(result, /\\frac\{\(x\+1\)\(x-2\)\}\{x\^2-4\}/);
    });

    test('Does not corrupt calendar dates or words: 2024/2025 or and/or', () => {
      const input = 'Academic session 2024/2025 and/or 2026';
      const result = reconstructLinearEquation(input);
      assert.match(result, /2024\/2025/);
    });
  });

  // ==========================================================================
  // SECTION 5: CATEGORY D — LIMITS IN WORD LINEAR NOTATION
  // ==========================================================================
  describe('Category D: Word Linear Limits', () => {
    test('(lim)┬(x→0) (sin x)/x', () => {
      const input = '(lim)┬(x→0) (sin x)/x';
      const result = reconstructLinearEquation(input);
      assert.match(result, /\\lim_\{x\s*\\to\s*0\}/);
      assert.match(result, /\\frac\{\\sin x\}\{x\}/);
    });

    test('lim_(n→∞) (1 + 1/n)^n', () => {
      const input = 'lim_(n→∞) (1 + 1/n)^n';
      const result = reconstructLinearEquation(input);
      assert.match(result, /\\lim_\{n\s*\\to\s*\\infty\}/);
      assert.match(result, /\\frac\{1\}\{n\}/);
    });

    test('lim_(x→1/a) with fraction in destination', () => {
      const input = 'lim_(x→1/a) f(x)';
      const result = reconstructLinearEquation(input);
      assert.match(result, /\\lim_\{x\s*\\to\s*\\frac\{1\}\{a\}\}/);
    });
  });

  // ==========================================================================
  // SECTION 6: CATEGORY E — SUPERSCRIPTS & SUBSCRIPTS
  // ==========================================================================
  describe('Category E: Superscripts & Subscripts', () => {
    test('Multi-character superscripts: x¹² + y⁻¹', () => {
      const input = 'x¹² + y⁻¹';
      const result = reconstructLinearEquation(input);
      assert.match(result, /x\^\{12\}/);
      assert.match(result, /y\^\{-1\}/);
    });

    test('Multi-character subscripts: a₁ + a₂ + a₁₀ + xᵢ', () => {
      const input = 'a₁ + a₂ + a₁₀ + xᵢ';
      const result = reconstructLinearEquation(input);
      assert.match(result, /a_1/);
      assert.match(result, /a_2/);
      assert.match(result, /a_\{10\}/);
      assert.match(result, /x_i/);
    });
  });

  // ==========================================================================
  // SECTION 7: CATEGORY F — SUMMATIONS, PRODUCTS & INTEGRALS
  // ==========================================================================
  describe('Category F: Summations, Products & Integrals', () => {
    test('Word stacked summation: (∑)┬(k=1)┴N k^3', () => {
      const input = '(∑)┬(k=1)┴N k^3';
      const result = reconstructLinearEquation(input);
      assert.equal(result.replace(/\s+/g, ''), '\\sum_{k=1}^{N}k^3');
    });

    test('Word stacked product: (∏)┬(j=1)┴n (1+x_j)', () => {
      const input = '(∏)┬(j=1)┴n (1+x_j)';
      const result = reconstructLinearEquation(input);
      assert.match(result, /\\prod_\{j=1\}\^\{n\}/);
    });

    test('Definite integral with bounds: ∫_0^1 x^2 dx', () => {
      const input = '∫_0^1 x^2 dx';
      const result = reconstructLinearEquation(input);
      assert.match(result, /\\int_\{0\}\^\{1\}/);
    });
  });

  // ==========================================================================
  // SECTION 8: CATEGORY G — MATRICES & DETERMINANTS
  // ==========================================================================
  describe('Category G: Word Linear Matrices & Determinants', () => {
    test('Word linear bracket matrix: [\\matrix(1&2@3&4)]', () => {
      const input = 'Let A = [\\matrix(1&2@3&4)].';
      const result = reconstructLinearEquation(input);
      assert.match(result, /\\begin\{bmatrix\} 1 & 2 \\\\ 3 & 4 \\end\{bmatrix\}/);
    });

    test('Word linear determinant: |\\matrix(a&b@c&d)|', () => {
      const input = 'det(A) = |\\matrix(a&b@c&d)|';
      const result = reconstructLinearEquation(input);
      assert.match(result, /\\begin\{vmatrix\} a & b \\\\ c & d \\end\{vmatrix\}/);
    });
  });

  // ==========================================================================
  // SECTION 9: CATEGORY H — PIECEWISE FUNCTIONS
  // ==========================================================================
  describe('Category H: Piecewise Functions', () => {
    test('Three-row piecewise with cases: {█(&x^2," if " x<0@&0," if " x=0@&2x," if " x>0)┤', () => {
      const input = 'f(x)={█(&x^2," if " x<0@&0," if " x=0@&2x," if " x>0)┤';
      const result = reconstructLinearEquation(input);
      assert.match(result, /\\begin\{cases\}/);
      assert.match(result, /x\^2, & x < 0/);
      assert.match(result, /0, & x = 0/);
      assert.match(result, /2x, & x > 0/);
      assert.match(result, /\\end\{cases\}/);
    });
  });

  // ==========================================================================
  // SECTION 10: CATEGORY I — MIXED HINDI & ENGLISH CONTENT
  // ==========================================================================
  describe('Category I: Bilingual Hindi & English Preservation', () => {
    test('Preserves Devanagari Hindi text alongside equations', () => {
      const input = 'यदि f(x) = x² + 1 और (If f(x) is continuous), तो f(0) का मान ज्ञात कीजिए।';
      const result = reconstructLinearEquation(input);
      assert.match(result, /यदि f\(x\) = x\^2 \+ 1 और/);
      assert.match(result, /तो f\(0\) का मान ज्ञात कीजिए/);
    });
  });

  // ==========================================================================
  // SECTION 11: CATEGORY J — MULTIPLE-CHOICE QUESTIONS
  // ==========================================================================
  describe('Category J: Multiple-Choice Question Options & Metadata', () => {
    test('Extracts statement, 4 options, and answer key from pasted block', () => {
      const input = `
        Evaluate the integral I = ∫_0^1 x² dx.
        (A) 1/3
        (B) 1/2
        (C) 1/4
        (D) 1
        Answer: A
        Solution: The antiderivative of x^2 is x^3/3.
        DK Sir Shortcut: Direct power rule inspection.
      `;

      const result = normalizePastedQuestion(input);
      assert.equal(result.hasQuestionWithOptions, true);
      assert.equal(result.options.length, 4);
      assert.equal(result.options[0].key, 'A');
      assert.match(result.options[0].text, /\\frac\{1\}\{3\}/);
      assert.equal(result.correctKey, 'A');
      assert.ok(result.stepSolution);
      assert.ok(result.dkSirShortcut);
    });

    test('Handles 1, 2, 3, 4 option markers mapping to A, B, C, D', () => {
      const input = `
        Find roots of x² - 4 = 0.
        (1) ±2
        (2) ±4
        (3) 0
        (4) ±1
        Correct Option: 1
      `;
      const result = normalizePastedQuestion(input);
      assert.equal(result.options.length, 4);
      assert.equal(result.options[0].key, 'A');
      assert.match(result.options[0].text, /\\pm\s*2/);
      assert.equal(result.correctKey, 'A');
    });
  });

  // ==========================================================================
  // SECTION 12: CATEGORY K — EXISTING VALID LATEX PRESERVATION
  // ==========================================================================
  describe('Category K: Preservation of Existing Valid LaTeX', () => {
    test('Does not double-escape existing \\frac or \\sqrt', () => {
      const input = 'Let f(x) = \\frac{x^2 + 1}{\\sqrt{x^4 + 1}} and \\alpha = \\frac{\\pi}{4}.';
      const result = reconstructLinearEquation(input);
      assert.match(result, /\\frac\{x\^2 \+ 1\}\{\\sqrt\{x\^4 \+ 1\}\}/);
      assert.match(result, /\\alpha = \\frac\{\\pi\}\{4\}/);
      // Ensure no double backslashes
      assert.ok(!result.includes('\\\\frac'));
      assert.ok(!result.includes('\\\\sqrt'));
    });
  });

  // ==========================================================================
  // SECTION 13: CATEGORY L & M — MATHML & WORD OMML XML INGESTION
  // ==========================================================================
  describe('Category L & M: W3C MathML and Word OMML Ingestion', () => {
    test('Converts MathML <mfrac> and <msqrt> to LaTeX', () => {
      const mathml = `
        <math xmlns="http://www.w3.org/1998/Math/MathML">
          <mfrac>
            <mrow><msqrt><mi>x</mi></msqrt></mrow>
            <mrow><mi>y</mi><mo>+</mo><mn>1</mn></mrow>
          </mfrac>
        </math>
      `;
      const result = convertHtmlWithMath(mathml);
      assert.match(result, /\\frac\{\\sqrt\{x\}\}\{y\s*\+\s*1\}/);
    });

    test('Converts Word OMML <m:oMath> with <m:f> and <m:sSup>', () => {
      const omml = `
        <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
          <m:f>
            <m:num><m:r><m:t>1</m:t></m:r></m:num>
            <m:den>
              <m:sSup>
                <m:e><m:r><m:t>x</m:t></m:r></m:e>
                <m:sup><m:r><m:t>2</m:t></m:r></m:sup>
              </m:sSup>
            </m:den>
          </m:f>
        </m:oMath>
      `;
      const result = convertHtmlWithMath(omml);
      assert.match(result, /\\frac\{1\}\{(?:\{x\}|x)\^\{2\}\}/);
    });
  });

  // ==========================================================================
  // SECTION 14: CATEGORY O — MALFORMED & INCOMPLETE EXPRESSIONS
  // ==========================================================================
  describe('Category O: Malformed Expressions & Structural Validation', () => {
    test('Flags unclosed braces and produces valid warnings', () => {
      const malformed = '\\frac{1}{x + 1';
      const report = validateLatex(malformed);
      assert.equal(report.isValid, false);
      assert.ok(report.errors.length > 0);
      assert.equal(report.needsReview, true);
    });

    test('Flags empty fractions \\frac{}{}', () => {
      const emptyFrac = '\\frac{}{}';
      const report = validateLatex(emptyFrac);
      assert.equal(report.isValid, false);
      assert.ok(report.errors.some(e => e.includes('empty fraction')));
    });

    test('Flags mismatched \\left and \\right delimiters', () => {
      const unclosedLeft = '\\left( x + 1';
      const report = validateLatex(unclosedLeft);
      assert.ok(report.warnings.some(w => w.includes('\\left')));
    });
  });

  // ==========================================================================
  // SECTION 15: MASTER PIPELINE METADATA INTEGRITY
  // ==========================================================================
  describe('Master Pipeline Metadata Integrity', () => {
    test('normalizeMathematicalText returns complete structured schema', () => {
      const input = 'x² + y³ = 25';
      const result = normalizeMathematicalText(input);

      assert.equal(result.success, true);
      assert.match(result.normalizedText, /x\^2\s*\+\s*y\^3\s*=\s*25/);
      assert.equal(typeof result.confidence, 'number');
      assert.ok(result.confidence >= 0.90);
      assert.equal(result.needsReview, false);
      assert.ok(Array.isArray(result.warnings));
      assert.ok(Array.isArray(result.errors));
      assert.ok(result.validation);
    });
  });
});

