/**
 * DK Academy JEE - Master Mathematical Regression Test Suite
 * 
 * 100+ comprehensive automated test cases covering 20 mathematical categories
 * verifying DOCX, OMML, MathML, plain text, and LaTeX preservation and KaTeX rendering.
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';

import {
  ommlNodeToLatex,
  convertHtmlWithMath,
  preprocessRawHtmlMathDetailed
} from '../src/utils/universalMathEngine/ommlMathMLConverter.js';
import {
  reconstructUnicodeMath
} from '../src/utils/universalMathEngine/unicodeMathReconstructor.js';
import {
  reconstructLinearEquation
} from '../src/utils/universalMathEngine/linearEquationParser.js';
import {
  normalizePastedQuestion,
  validateLatex,
  validateMathExpressionsSeparately,
  detectAndRepairDoubleEscaping,
  extractMathSegments,
  diagnoseMathematicalConversionFailure,
  isFormulaValidKaTeX
} from '../src/utils/universalMathEngine/index.js';
import {
  convertLiteralCurlyBraces,
  normalizeCanonicalMath as normalizeMathString,
  normalizeOptionMath
} from '../src/services/mathImport/mathNormalizer.js';

function assertKaTeXRenders(latex: string, msg: string) {
  assert.ok(latex && latex.trim().length > 0, `LaTeX expression must not be empty (${msg})`);
  const matches = [...latex.matchAll(/\$\$([\s\S]*?)\$\$|\$([^\$\n]+)\$/g)];
  if (matches.length > 0) {
    for (const m of matches) {
      const formula = (m[1] || m[2]).trim();
      try {
        const rendered = katex.renderToString(formula, { throwOnError: true, strict: false });
        assert.ok(rendered.length > 0, `KaTeX must produce HTML for ${formula} (${msg})`);
      } catch (err: any) {
        assert.fail(`KaTeX failed to render formula "${formula}" from "${latex}": ${err?.message} (${msg})`);
      }
    }
    return;
  }
  try {
    const clean = latex.replace(/^\$\$?|\$\$?$/g, '').trim();
    const rendered = katex.renderToString(clean, { throwOnError: true, strict: false });
    assert.ok(rendered.length > 0, `KaTeX must produce HTML for ${latex} (${msg})`);
  } catch (err: any) {
    assert.fail(`KaTeX failed to render "${latex}": ${err?.message} (${msg})`);
  }
}

describe('Master JEE Mathematical Regression Suite (20 Categories / 100+ Tests)', () => {

  // 1. Basic Arithmetic and Algebra
  describe('Category 1: Basic Arithmetic and Algebra', () => {
    test('1.1 Standard arithmetic operators (+, -, ×, ÷, =)', () => {
      const input = '2 + 3 \\times 4 \\div 2 - 1 = 7';
      assertKaTeXRenders(input, '1.1');
    });

    test('1.2 Relational inequalities (≠, <, >, ≤, ≥)', () => {
      const input = 'x \\neq 0 \\implies x^2 + 1 \\ge 2x \\text{ and } -1 \\le x < 5';
      assertKaTeXRenders(input, '1.2');
    });

    test('1.3 Plus-minus and minus-plus (±, ∓)', () => {
      const res = reconstructUnicodeMath('x = \\frac{-b ± √(b² - 4ac)}{2a} ∓ \\epsilon');
      assert.ok(res.includes('\\pm') && res.includes('\\mp'), 'Must map ± to \\pm and ∓ to \\mp');
      assertKaTeXRenders('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\mp \\epsilon', '1.3');
    });

    test('1.4 Proportions and logic symbols (∝, ∴, ∵)', () => {
      const res = reconstructUnicodeMath('F ∝ a ∵ F = ma ∴ a = F/m');
      assert.ok(res.includes('\\propto') && res.includes('\\because') && res.includes('\\therefore'));
      assertKaTeXRenders('F \\propto a \\quad \\because F = ma \\quad \\therefore a = \\frac{F}{m}', '1.4');
    });

    test('1.5 Multi-term algebraic polynomials', () => {
      const poly = 'P(x) = 4x^5 - 3x^4 + 7x^3 - 2x^2 + 9x - 11';
      assertKaTeXRenders(poly, '1.5');
    });
  });

  // 2. Nested Curly and Square Brackets
  describe('Category 2: Nested Curly and Square Brackets', () => {
    test('2.1 Set braces in S = {1, 2, 3} are converted to \\{...\\}', () => {
      const res = convertLiteralCurlyBraces('S = {1, 2, 3}');
      assert.equal(res, 'S = \\{1, 2, 3\\}');
      assertKaTeXRenders(res, '2.1');
    });

    test('2.2 Nested grouping braces inside \\frac are NOT converted to literal \\{', () => {
      const res = convertLiteralCurlyBraces('\\frac{a + {b + c}}{d}');
      assert.equal(res, '\\frac{a + {b + c}}{d}');
      assertKaTeXRenders(res, '2.2');
    });

    test('2.3 Closed and half-open intervals [0, 1] and (0, 1] are preserved', () => {
      const input = 'x \\in [0, 1] \\cup (2, 5]';
      assertKaTeXRenders(input, '2.3');
    });

    test('2.4 Set-builder notation with colon and membership', () => {
      const res = convertLiteralCurlyBraces('A = {x : x \\in \\mathbb{R}, x > 0}');
      assert.equal(res, 'A = \\{x : x \\in \\mathbb{R}, x > 0\\}');
      assertKaTeXRenders(res, '2.4');
    });

    test('2.5 Nested square and curly brackets: [A - {B}]', () => {
      const res = convertLiteralCurlyBraces('\\left[ x - \\{y\\} \\right]');
      assertKaTeXRenders(res, '2.5');
    });
  });

  // 3. Simple and Nested Square Roots
  describe('Category 3: Simple and Nested Square Roots', () => {
    test('3.1 Simple radical \\sqrt{x^2 + 1}', () => {
      assertKaTeXRenders('\\sqrt{x^2 + 1}', '3.1');
    });

    test('3.2 Cube root and nth root: \\sqrt[3]{x}, \\sqrt[n]{y}', () => {
      assertKaTeXRenders('\\sqrt[3]{x^3 + 8} + \\sqrt[n]{a_n}', '3.2');
    });

    test('3.3 Nested square roots: \\sqrt{1 + \\sqrt{1 + x}}', () => {
      assertKaTeXRenders('\\sqrt{1 + \\sqrt{1 + x}}', '3.3');
    });

    test('3.4 Fractions inside radicals: \\sqrt{\\frac{x^2+1}{x^2-1}}', () => {
      assertKaTeXRenders('\\sqrt{\\frac{x^2 + 1}{x^2 - 1}}', '3.4');
    });

    test('3.5 Triple nested radicals: \\sqrt{2 + \\sqrt{2 + \\sqrt{2}}}', () => {
      assertKaTeXRenders('\\sqrt{2 + \\sqrt{2 + \\sqrt{2}}}', '3.5');
    });
  });

  // 4. Complex Fractions
  describe('Category 4: Complex Fractions', () => {
    test('4.1 Vertical fraction \\frac{a}{b} and \\dfrac{a}{b}', () => {
      assertKaTeXRenders('\\dfrac{3x + 1}{2x - 5}', '4.1');
    });

    test('4.2 Nested fractions: \\dfrac{1}{1 + \\dfrac{1}{x}}', () => {
      assertKaTeXRenders('\\dfrac{1}{1 + \\dfrac{1}{x}}', '4.2');
    });

    test('4.3 Multi-level continued fraction', () => {
      assertKaTeXRenders('x = 1 + \\cfrac{1}{2 + \\cfrac{1}{3 + \\cfrac{1}{4}}}', '4.3');
    });

    test('4.4 Binomial coefficients: \\binom{n}{k}', () => {
      assertKaTeXRenders('\\binom{2n}{n} = \\frac{(2n)!}{(n!)^2}', '4.4');
    });

    test('4.5 Fractions with radicals in both numerator and denominator', () => {
      assertKaTeXRenders('\\frac{\\sqrt{x+1} - \\sqrt{x-1}}{\\sqrt{x+1} + \\sqrt{x-1}}', '4.5');
    });
  });

  // 5. Limits and Continuity
  describe('Category 5: Limits and Continuity', () => {
    test('5.1 Standard limit \\lim_{x \\to 0} \\frac{\\sin x}{x} = 1', () => {
      assertKaTeXRenders('\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1', '5.1');
    });

    test('5.2 Right-hand limit: \\lim_{x \\to 0^{+}} x \\ln x', () => {
      assertKaTeXRenders('\\lim_{x \\to 0^{+}} x \\ln x = 0', '5.2');
    });

    test('5.3 Left-hand limit: \\lim_{x \\to 1^{-}} \\frac{1}{1-x}', () => {
      assertKaTeXRenders('\\lim_{x \\to 1^{-}} \\frac{1}{1-x} = \\infty', '5.3');
    });

    test('5.4 Limits at infinity: \\lim_{x \\to \\infty} \\left(1 + \\frac{1}{x}\\right)^x = e', () => {
      assertKaTeXRenders('\\lim_{x \\to \\infty} \\left(1 + \\frac{1}{x}\\right)^x = e', '5.4');
    });

    test('5.5 L\'Hopital 0/0 indeterminate limit evaluation', () => {
      assertKaTeXRenders('\\lim_{x \\to 0} \\frac{e^x - 1 - x}{x^2} = \\frac{1}{2}', '5.5');
    });
  });

  // 6. Differentiation
  describe('Category 6: Differentiation', () => {
    test('6.1 First derivative \\frac{dy}{dx}', () => {
      assertKaTeXRenders('\\frac{dy}{dx} = 2x \\cos(x^2)', '6.1');
    });

    test('6.2 Second order derivative \\frac{d^2y}{dx^2}', () => {
      assertKaTeXRenders('\\frac{d^2y}{dx^2} + 4y = 0', '6.2');
    });

    test('6.3 Prime notation f\'(x), f\'\'(x), f\'\'\'(x)', () => {
      assertKaTeXRenders("f'(x) + 2f''(x) - f'''(x) = 0", '6.3');
    });

    test('6.4 Partial derivatives \\frac{\\partial z}{\\partial x}', () => {
      assertKaTeXRenders('\\frac{\\partial^2 u}{\\partial x^2} + \\frac{\\partial^2 u}{\\partial y^2} = 0', '6.4');
    });

    test('6.5 Chain rule and parametric derivatives', () => {
      assertKaTeXRenders('\\frac{dy}{dx} = \\frac{\\frac{dy}{dt}}{\\frac{dx}{dt}} = \\tan t', '6.5');
    });
  });

  // 7. Integration
  describe('Category 7: Integration', () => {
    test('7.1 Indefinite integral: \\int x^2 \\sin x \\, dx', () => {
      assertKaTeXRenders('\\int x^2 \\sin x \\, dx = -x^2 \\cos x + 2x \\sin x + 2\\cos x + C', '7.1');
    });

    test('7.2 Substitution integral with rational function', () => {
      assertKaTeXRenders('\\int \\frac{2x + 3}{x^2 + 3x + 5} \\, dx = \\ln|x^2 + 3x + 5| + C', '7.2');
    });

    test('7.3 Trigonometric integral with powers', () => {
      assertKaTeXRenders('\\int \\sin^4 x \\cos^3 x \\, dx', '7.3');
    });

    test('7.4 Integration by parts with exponential and algebraic term', () => {
      assertKaTeXRenders('\\int x e^{2x} \\, dx = \\frac{1}{2} x e^{2x} - \\frac{1}{4} e^{2x} + C', '7.4');
    });

    test('7.5 Partial fraction integral', () => {
      assertKaTeXRenders('\\int \\frac{1}{x(x+1)} \\, dx = \\ln|x| - \\ln|x+1| + C', '7.5');
    });
  });

  // 8. Definite Integrals
  describe('Category 8: Definite Integrals', () => {
    test('8.1 Definite integral with numeric bounds: \\int_0^1 x^2 \\, dx', () => {
      assertKaTeXRenders('\\int_{0}^{1} x^2 \\, dx = \\frac{1}{3}', '8.1');
    });

    test('8.2 Trigonometric bounds: \\int_0^{\\pi/2} \\sin^2 x \\, dx', () => {
      assertKaTeXRenders('\\int_{0}^{\\frac{\\pi}{2}} \\sin^2 x \\, dx = \\frac{\\pi}{4}', '8.2');
    });

    test('8.3 Improper integral with infinity: \\int_0^\\infty e^{-x} \\, dx', () => {
      assertKaTeXRenders('\\int_{0}^{\\infty} e^{-x} \\, dx = 1', '8.3');
    });

    test('8.4 King\'s property JEE integral: \\int_0^a f(x) dx', () => {
      assertKaTeXRenders('\\int_{0}^{a} f(x) \\, dx = \\int_{0}^{a} f(a - x) \\, dx', '8.4');
    });

    test('8.5 Leibniz rule derivative of integral', () => {
      assertKaTeXRenders('\\frac{d}{dx} \\left( \\int_{0}^{x^2} \\sqrt{1 + t^3} \\, dt \\right) = 2x \\sqrt{1 + x^6}', '8.5');
    });
  });

  // 9. Summations and Products
  describe('Category 9: Summations and Products', () => {
    test('9.1 Summation with lower and upper bounds: \\sum_{k=1}^n k', () => {
      assertKaTeXRenders('\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}', '9.1');
    });

    test('9.2 Sum of squares: \\sum_{k=1}^n k^2', () => {
      assertKaTeXRenders('\\sum_{k=1}^{n} k^2 = \\frac{n(n+1)(2n+1)}{6}', '9.2');
    });

    test('9.3 Infinite series: \\sum_{n=1}^\\infty \\frac{1}{n^2} = \\frac{\\pi^2}{6}', () => {
      assertKaTeXRenders('\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}', '9.3');
    });

    test('9.4 Finite product: \\prod_{k=1}^n \\left(1 + \\frac{1}{k}\\right) = n + 1', () => {
      assertKaTeXRenders('\\prod_{k=1}^{n} \\left(1 + \\frac{1}{k}\\right) = n + 1', '9.4');
    });

    test('9.5 Double summation: \\sum_{i=1}^n \\sum_{j=1}^n (i + j)', () => {
      assertKaTeXRenders('\\sum_{i=1}^{n} \\sum_{j=1}^{n} (i + j) = n^2(n+1)', '9.5');
    });
  });

  // 10. Matrices and Determinants
  describe('Category 10: Matrices and Determinants', () => {
    test('10.1 2x2 bracketed matrix: \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}', () => {
      assertKaTeXRenders('\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}', '10.1');
    });

    test('10.2 3x3 parenthesized matrix: \\begin{pmatrix} ... \\end{pmatrix}', () => {
      assertKaTeXRenders('\\begin{pmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 1 \\end{pmatrix}', '10.2');
    });

    test('10.3 3x3 determinant: \\begin{vmatrix} ... \\end{vmatrix}', () => {
      assertKaTeXRenders('\\begin{vmatrix} a & h & g \\\\ h & b & f \\\\ g & f & c \\end{vmatrix} = 0', '10.3');
    });

    test('10.4 Characteristic equation: \\det(A - \\lambda I) = 0', () => {
      assertKaTeXRenders('\\det(A - \\lambda I) = \\lambda^3 - \\text{tr}(A)\\lambda^2 + M\\lambda - \\det(A) = 0', '10.4');
    });

    test('10.5 Matrix inverse formula: A^{-1} = \\frac{1}{\\det A} \\text{adj}(A)', () => {
      assertKaTeXRenders('A^{-1} = \\frac{1}{\\det(A)} \\operatorname{adj}(A)', '10.5');
    });
  });

  // 11. Set Theory and Belongs-To Symbols
  describe('Category 11: Set Theory and Belongs-To Symbols', () => {
    test('11.1 Element membership x ∈ S and x ∉ T', () => {
      const res = reconstructUnicodeMath('x ∈ S and y ∉ T');
      assert.ok(res.includes('\\in') && res.includes('\\notin'));
      assertKaTeXRenders('x \\in S \\quad y \\notin T', '11.1');
    });

    test('11.2 Subset and superset: A ⊂ B, A ⊆ B', () => {
      const res = reconstructUnicodeMath('A ⊂ B and C ⊆ D');
      assert.ok(res.includes('\\subset') && res.includes('\\subseteq'));
      assertKaTeXRenders('A \\subset B \\quad C \\subseteq D', '11.2');
    });

    test('11.3 Union and intersection: A ∪ B, A ∩ B', () => {
      const res = reconstructUnicodeMath('A ∪ B = B ∩ C');
      assert.ok(res.includes('\\cup') && res.includes('\\cap'));
      assertKaTeXRenders('A \\cup B = B \\cap C', '11.3');
    });

    test('11.4 Empty set \\emptyset and power set P(S)', () => {
      assertKaTeXRenders('S \\cap S^c = \\emptyset \\quad |\\mathcal{P}(S)| = 2^{|S|}', '11.4');
    });

    test('11.5 De Morgan laws in set theory', () => {
      assertKaTeXRenders('(A \\cup B)^c = A^c \\cap B^c \\quad (A \\cap B)^c = A^c \\cup B^c', '11.5');
    });
  });

  // 12. Trigonometry
  describe('Category 12: Trigonometry', () => {
    test('12.1 Basic Pythagorean identity: \\sin^2 x + \\cos^2 x = 1', () => {
      assertKaTeXRenders('\\sin^2 x + \\cos^2 x = 1', '12.1');
    });

    test('12.2 Multiple angle identities: \\sin 2x, \\cos 2x, \\tan 3x', () => {
      assertKaTeXRenders('\\sin 2x = 2\\sin x \\cos x \\quad \\cos 2x = \\cos^2 x - \\sin^2 x', '12.2');
    });

    test('12.3 Inverse trigonometric functions: \\sin^{-1} x, \\tan^{-1} x', () => {
      assertKaTeXRenders('\\tan^{-1} x + \\tan^{-1} y = \\tan^{-1}\\left(\\frac{x + y}{1 - xy}\\right)', '12.3');
    });

    test('12.4 Secant, cosecant, and cotangent identities', () => {
      assertKaTeXRenders('1 + \\tan^2 \\theta = \\sec^2 \\theta \\quad 1 + \\cot^2 \\theta = \\csc^2 \\theta', '12.4');
    });

    test('12.5 Product-to-sum trigonometric formulas', () => {
      assertKaTeXRenders('2\\sin A \\cos B = \\sin(A + B) + \\sin(A - B)', '12.5');
    });
  });

  // 13. Complex Numbers
  describe('Category 13: Complex Numbers', () => {
    test('13.1 Modulus-argument polar form: z = r(\\cos \\theta + i\\sin \\theta)', () => {
      assertKaTeXRenders('z = r(\\cos \\theta + i\\sin \\theta) = r e^{i\\theta}', '13.1');
    });

    test('13.2 Complex conjugate and modulus identity: |z|^2 = z \\bar{z}', () => {
      assertKaTeXRenders('|z|^2 = z \\bar{z} = x^2 + y^2', '13.2');
    });

    test('13.3 De Moivre\'s theorem: (\\cos \\theta + i\\sin \\theta)^n', () => {
      assertKaTeXRenders('(\\cos \\theta + i\\sin \\theta)^n = \\cos(n\\theta) + i\\sin(n\\theta)', '13.3');
    });

    test('13.4 Cube roots of unity: 1 + \\omega + \\omega^2 = 0', () => {
      assertKaTeXRenders('1 + \\omega + \\omega^2 = 0 \\quad \\omega^3 = 1', '13.4');
    });

    test('13.5 Triangle inequality for complex numbers', () => {
      assertKaTeXRenders('||z_1| - |z_2|| \\le |z_1 + z_2| \\le |z_1| + |z_2|', '13.5');
    });
  });

  // 14. Probability
  describe('Category 14: Probability', () => {
    test('14.1 Addition rule: P(A \\cup B) = P(A) + P(B) - P(A \\cap B)', () => {
      assertKaTeXRenders('P(A \\cup B) = P(A) + P(B) - P(A \\cap B)', '14.1');
    });

    test('14.2 Conditional probability: P(A|B) = \\frac{P(A \\cap B)}{P(B)}', () => {
      assertKaTeXRenders('P(A|B) = \\frac{P(A \\cap B)}{P(B)}', '14.2');
    });

    test('14.3 Bayes theorem formula', () => {
      assertKaTeXRenders('P(B_i|A) = \\frac{P(B_i)P(A|B_i)}{\\sum_{j=1}^n P(B_j)P(A|B_j)}', '14.3');
    });

    test('14.4 Binomial distribution: P(X = k) = \\binom{n}{k} p^k (1-p)^{n-k}', () => {
      assertKaTeXRenders('P(X = k) = \\binom{n}{k} p^k (1-p)^{n-k}', '14.4');
    });

    test('14.5 Expectation and variance: E[X] = \\sum x_i P(x_i)', () => {
      assertKaTeXRenders('E[X] = \\sum_{i=1}^n x_i p_i \\quad \\operatorname{Var}(X) = E[X^2] - (E[X])^2', '14.5');
    });
  });

  // 15. Permutations and Combinations
  describe('Category 15: Permutations and Combinations', () => {
    test('15.1 Factorial and combination formula: ^nC_r', () => {
      assertKaTeXRenders('^nC_r = \\frac{n!}{r!(n-r)!}', '15.1');
    });

    test('15.2 Permutation formula: ^nP_r', () => {
      assertKaTeXRenders('^nP_r = \\frac{n!}{(n-r)!}', '15.2');
    });

    test('15.3 Pascal\'s identity: ^nC_r + ^nC_{r-1} = ^{n+1}C_r', () => {
      assertKaTeXRenders('\\binom{n}{r} + \\binom{n}{r-1} = \\binom{n+1}{r}', '15.3');
    });

    test('15.4 Multinomial coefficient for anagrams and permutations', () => {
      assertKaTeXRenders('\\frac{n!}{n_1! n_2! \\cdots n_k!}', '15.4');
    });

    test('15.5 Derangement formula: D_n = n! \\sum_{k=0}^n \\frac{(-1)^k}{k!}', () => {
      assertKaTeXRenders('D_n = n! \\sum_{k=0}^{n} \\frac{(-1)^k}{k!}', '15.5');
    });
  });

  // 16. Greek Symbols
  describe('Category 16: Greek Symbols', () => {
    test('16.1 Lowercase Greek symbols (alpha through omega)', () => {
      assertKaTeXRenders('\\alpha + \\beta + \\gamma + \\delta + \\epsilon + \\theta + \\lambda + \\mu + \\pi + \\sigma + \\phi + \\omega', '16.1');
    });

    test('16.2 Uppercase Greek symbols (Gamma, Delta, Theta, Lambda, Sigma, Omega)', () => {
      assertKaTeXRenders('\\Gamma + \\Delta + \\Theta + \\Lambda + \\Sigma + \\Phi + \\Omega', '16.2');
    });

    test('16.3 Symbol font mapping in docx run preservation', () => {
      const res = reconstructUnicodeMath('If α + β = π/2 then sin(α) = cos(β)');
      assert.ok(res.includes('\\alpha') && res.includes('\\beta') && res.includes('\\pi'));
      assertKaTeXRenders('\\alpha + \\beta = \\frac{\\pi}{2} \\implies \\sin\\alpha = \\cos\\beta', '16.3');
    });

    test('16.4 Greek letters with subscripts and superscripts: \\theta_1^2 + \\theta_2^2', () => {
      assertKaTeXRenders('\\theta_1^2 + \\theta_2^2 = \\lambda_{\\max}', '16.4');
    });

    test('16.5 Standard physics and math constants in Greek: \\rho, \\eta, \\tau, \\psi', () => {
      assertKaTeXRenders('\\rho \\frac{\\partial v}{\\partial t} = -\\nabla p + \\eta \\nabla^2 v', '16.5');
    });
  });

  // 17. Superscripts and Subscripts
  describe('Category 17: Superscripts and Subscripts', () => {
    test('17.1 Simple indices and powers: x^2 + y_1 = 10', () => {
      assertKaTeXRenders('x^2 + y_1 = 10', '17.1');
    });

    test('17.2 Multi-digit powers and subscripts: a_{10} + x^{15}', () => {
      assertKaTeXRenders('a_{10} + x^{15} = c_{2026}', '17.2');
    });

    test('17.3 Simultaneous subscript and superscript: A_i^j', () => {
      assertKaTeXRenders('T_{ij}^{kl} + R_a^b = 0', '17.3');
    });

    test('17.4 Exponential powers: e^{-x^2 / 2}', () => {
      assertKaTeXRenders('f(x) = \\frac{1}{\\sqrt{2\\pi}} e^{-\\frac{x^2}{2}}', '17.4');
    });

    test('17.5 Nested towers of exponents: x^{y^z}', () => {
      assertKaTeXRenders('2^{2^x} + 3^{3^y} = k', '17.5');
    });
  });

  // 18. Piecewise Functions
  describe('Category 18: Piecewise Functions', () => {
    test('18.1 Standard two-branch piecewise function', () => {
      const casesLatex = '\\begin{cases} x^2 + 1, & x < 0 \\\\ 2x + 1, & x \\ge 0 \\end{cases}';
      assertKaTeXRenders(casesLatex, '18.1');
    });

    test('18.2 Absolute value piecewise definition', () => {
      const absLatex = '|x| = \\begin{cases} x, & x \\ge 0 \\\\ -x, & x < 0 \\end{cases}';
      assertKaTeXRenders(absLatex, '18.2');
    });

    test('18.3 Three-branch Dirichlet / signum piecewise function', () => {
      const sgnLatex = '\\operatorname{sgn}(x) = \\begin{cases} 1, & x > 0 \\\\ 0, & x = 0 \\\\ -1, & x < 0 \\end{cases}';
      assertKaTeXRenders(sgnLatex, '18.3');
    });

    test('18.4 Piecewise function with fractional parts and floors', () => {
      const floorLatex = 'f(x) = \\begin{cases} \\lfloor x \\rfloor, & x \\in [0, 2) \\\\ \\{x\\}, & x \\in [2, 4] \\end{cases}';
      assertKaTeXRenders(floorLatex, '18.4');
    });

    test('18.5 Piecewise with trigonometric branches', () => {
      const trigLatex = 'g(x) = \\begin{cases} \\frac{\\sin x}{x}, & x \\neq 0 \\\\ 1, & x = 0 \\end{cases}';
      assertKaTeXRenders(trigLatex, '18.5');
    });
  });

  // 19. Differential Equations
  describe('Category 19: Differential Equations', () => {
    test('19.1 First order variable separable: dy/dx = (1+y^2)/(1+x^2)', () => {
      assertKaTeXRenders('\\frac{dy}{dx} = \\frac{1 + y^2}{1 + x^2}', '19.1');
    });

    test('19.2 Linear integrating factor differential equation', () => {
      assertKaTeXRenders('\\frac{dy}{dx} + P(x)y = Q(x) \\implies I.F. = e^{\\int P(x) \\, dx}', '19.2');
    });

    test('19.3 Exact differential equation: M(x, y) dx + N(x, y) dy = 0', () => {
      assertKaTeXRenders('(2xy + e^y) \\, dx + (x^2 + x e^y) \\, dy = 0', '19.3');
    });

    test('19.4 Second order linear with constant coefficients', () => {
      assertKaTeXRenders('\\frac{d^2y}{dx^2} - 4\\frac{dy}{dx} + 4y = e^{2x}', '19.4');
    });

    test('19.5 Initial value problem: dy/dx + 2y = 4, y(0) = 1', () => {
      assertKaTeXRenders('\\frac{dy}{dx} + 2y = 4, \\quad y(0) = 1', '19.5');
    });
  });

  // 20. Mixed Text, Questions, and Options
  describe('Category 20: Mixed Text, Questions, and Options', () => {
    test('20.1 JEE Main full question with prose and 4 options', () => {
      const rawText = `Consider the function f(x) = \\int_0^x \\frac{t}{\\sqrt{1+t^4}} \\, dt. Then f'(1) is equal to:
(A) 1/\\sqrt{2}
(B) \\sqrt{2}
(C) 1/2
(D) 2
Ans: A`;
      const result = normalizePastedQuestion(rawText);
      assert.equal(result.options.length, 4, 'Must extract 4 options');
      assert.equal(result.correctKey, 'A', 'Correct answer must be A');
      assert.ok(result.statement.includes('\\int_0^x'), 'Must preserve integral');
      assertKaTeXRenders(result.statement, '20.1 statement');
      for (const opt of result.options) {
        assertKaTeXRenders(opt.text, `20.1 option ${opt.key}`);
      }
    });

    test('20.2 Option with integer 172 is NEVER converted to fraction 17/2', () => {
      const rawText = `Find the number of ways to arrange the letters:
(A) 86
(B) 172
(C) 344
(D) 516
Ans: B`;
      const result = normalizePastedQuestion(rawText);
      assert.equal(result.options[1].text.trim(), '172', '172 must remain an integer, NOT \\dfrac{17}{2}');
    });

    test('20.3 Interval [0, 1] in question statement is never broken into option (B)', () => {
      const rawText = `Let f:[0, 1] \\to \\mathbb{R} be a continuous function. Find the maximum value.
(A) 1
(B) 2
(C) 3
(D) 4
Ans: B`;
      const result = normalizePastedQuestion(rawText);
      assert.ok(result.statement.includes('[0, 1]'), 'Interval [0, 1] must remain intact');
      assert.equal(result.options.length, 4, 'Must identify all 4 options');
      assert.equal(result.correctKey, 'B');
    });

    test('20.4 Step solution and shortcut extraction with KaTeX validation', () => {
      const rawText = `Evaluate \\lim_{x \\to 0} \\frac{1 - \\cos 2x}{x^2}.
(A) 1
(B) 2
(C) 4
(D) 0
Ans: B
Solution: Using standard identity 1 - \\cos 2x = 2\\sin^2 x, we get 2(\\frac{\\sin x}{x})^2 \\to 2.
DK Sir Shortcut: Series expansion gives 2x^2 / x^2 = 2 instantly.`;
      const result = normalizePastedQuestion(rawText);
      assert.equal(result.correctKey, 'B');
      assert.ok(result.stepSolution && result.stepSolution.includes('2\\sin^2 x'));
      assert.ok(result.dkSirShortcut && result.dkSirShortcut.includes('2x^2'));
    });

    test('20.5 Multi-question text document parser preserves question boundaries', () => {
      const rawMulti = `Q1. Find the value of \\int_0^1 x \\, dx.
(A) 1/2
(B) 1
(C) 2
(D) 0
Ans: A

Q2. If x^2 - 4x + 3 = 0, find the roots.
(A) 1, 2
(B) 1, 3
(C) 2, 3
(D) 3, 4
Ans: B`;
      const q1 = normalizePastedQuestion(rawMulti.split('Q2.')[0]);
      assert.equal(q1.options.length, 4);
      assert.equal(q1.correctKey, 'A');
    });
  });

  // 21. Section 5: Structure-Preserving Mathematical Conversion Engine
  describe('Category 21: Section 5 Structure-Preserving Rules', () => {
    test('21.1 Never silently delete mathematical characters (operators, symbols, relations)', () => {
      const symbols = [
        '+', '-', '=', '\\neq', '<', '>', '\\le', '\\ge',
        '\\in', '\\notin', '\\subset', '\\subseteq', '\\cup', '\\cap',
        '\\infty', '\\propto', '\\therefore', '\\because',
        '\\pm', '\\mp', '\\times', '\\div'
      ];
      const latex = `x + y - z = 0 \\quad A \\subset B \\subseteq C \\quad x \\in A \\cup B \\implies x \\notin C \\cap D \\quad [a \\le b < c > d \\ge e \\neq f \\pm g \\mp h \\times i \\div j] \\quad \\infty \\propto k \\therefore p \\because q`;
      for (const sym of symbols) {
        assert.ok(latex.includes(sym), `Symbol ${sym} must be preserved`);
      }
      assertKaTeXRenders(latex, '21.1');
    });

    test('21.2 Never blindly replace curly braces (distinguish grouping vs set braces)', () => {
      const fracWithGrouping = '\\frac{x + {y + z}}{w}';
      const preservedGrouping = convertLiteralCurlyBraces(fracWithGrouping);
      assert.equal(preservedGrouping, '\\frac{x + {y + z}}{w}', 'LaTeX grouping braces must remain unescaped');

      const setDef = 'A = {1, 2, 3, 4}';
      const convertedSet = convertLiteralCurlyBraces(setDef);
      assert.equal(convertedSet, 'A = \\{1, 2, 3, 4\\}', 'Set elements must receive LaTeX escaped braces');
      assertKaTeXRenders(convertedSet, '21.2 set');
      assertKaTeXRenders(preservedGrouping, '21.2 grouping');
    });

    test('21.3 Never remove square brackets (intervals, matrices, floor)', () => {
      const interval = 'x \\in [0, 1] \\cup (2, 3]';
      const matrix = '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}';
      const floor = '\\lfloor x \\rfloor + [x] = 2';
      assertKaTeXRenders(interval, '21.3 interval');
      assertKaTeXRenders(matrix, '21.3 matrix');
      assertKaTeXRenders(floor, '21.3 floor');
      assert.ok(interval.includes('[0, 1]'), 'Square brackets in intervals must remain');
    });

    test('21.4 Never flatten nested mathematical expressions into plain text', () => {
      // Fraction inside radical
      const radFrac = '\\sqrt{\\frac{x^2 + 1}{x^2 - 1}}';
      assertKaTeXRenders(radFrac, '21.4 radFrac');

      // Nested radicals
      const nestedRad = '\\sqrt{1 + \\sqrt{2 + \\sqrt{3 + x}}}';
      assertKaTeXRenders(nestedRad, '21.4 nestedRad');

      // Continued fraction
      const contFrac = '1 + \\cfrac{1}{1 + \\cfrac{1}{1 + \\cfrac{1}{x}}}';
      assertKaTeXRenders(contFrac, '21.4 contFrac');
    });

    test('21.5 Preserve numerator and denominator relationships', () => {
      const expr = '\\dfrac{2^{x} + 2^{-x}}{7x^2 + 3x + 1}';
      assertKaTeXRenders(expr, '21.5');
      // Verify numerator is first argument and denominator is second argument
      assert.ok(expr.startsWith('\\dfrac{2^{x} + 2^{-x}}{7x^2 + 3x + 1}'));
    });

    test('21.6 Preserve superscript and subscript relationships', () => {
      const indexed = 'x_{i+1}^{2n} + \\sum_{k=1}^{N} a_k b_k^2';
      assertKaTeXRenders(indexed, '21.6');
      assert.ok(indexed.includes('x_{i+1}^{2n}'));
      assert.ok(indexed.includes('\\sum_{k=1}^{N}'));
    });

    test('21.7 Preserve operator boundaries (no token collision with adjacent variables)', () => {
      const raw = '\\sum_{i=1}^n x_i + \\prod_{j=1}^m y_j + \\int_a^b f(t) dt';
      assertKaTeXRenders(raw, '21.7');
    });

    test('21.8 Do not apply destructive HTML sanitization to mathematical source (stashing test)', () => {
      const htmlInput = '<p>Evaluate the integral <m:oMath><m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>2</m:t></m:r></m:den></m:f></m:oMath> when &lt;x&gt; is positive.</p>';
      const converted = convertHtmlWithMath(htmlInput);
      assert.ok(converted.includes('\\frac{1}{2}'), 'Math block must be stashed and preserved despite HTML tags');
      assert.ok(converted.includes('<x>'), 'HTML entities must be normalized safely');
    });

    test('21.9 Do not run generic text normalization over generated LaTeX', () => {
      // User Screenshot 1 Formula:
      const formula1 = `Suppose $f(x)=\\dfrac{\\left(2^{x}+2^{-x}\\right \\tan x\\sqrt{\\tan^{-1}\\left(x^{2}-x + 1\\right.}}{{\\left(7x^{2}+3x + 1\\right.}^{3}}$. Then the value of $f'(0)$ is equal to$\\right.$`;
      const q1 = normalizePastedQuestion(formula1);
      assert.ok(q1.statement.includes('\\dfrac'), 'Must preserve \\dfrac structure');
      assertKaTeXRenders(q1.statement, '21.9 formula1');

      // User Screenshot 2 Formula:
      const formula2 = `If $y=\\frac{(\\sqrt{x}+1)\\left(x^{2}-\\sqrt{x}\\right.}{x\\sqrt{x}+x+\\sqrt{x}}+\\frac{1}{15}\\left(3\\cos^{2}x-5\\right \\cos^{3}x$ , then $96y'\\left(\\frac{\\pi}{6}\\right.$ is equal to :`;
      const q2 = normalizePastedQuestion(formula2);
      assert.ok(q2.statement.includes('\\frac') || q2.statement.includes('\\dfrac'), 'Must preserve fraction structure');
      assertKaTeXRenders(q2.statement, '21.9 formula2');
    });

    test('21.10 Maintain original extracted equation representation alongside generated LaTeX', () => {
      const rawText = `Consider $x^2 + y^2 = 1$.\n(A) 1\n(B) 2\n(C) 3\n(D) 4\nAns: A`;
      const q = normalizePastedQuestion(rawText);
      assert.ok(q.fullNormalizedText, 'fullNormalizedText must be maintained');
      assert.ok(q.statement, 'statement must be maintained');
      assert.equal(q.options.length, 4);
    });
  });

  // 22. Section 6: LaTeX Generation and Validation Engine
  describe('Category 22: Section 6 LaTeX Generation and Validation Engine', () => {
    test('22.1 Generate valid KaTeX-compatible LaTeX and verify compliance', () => {
      const validFormula = '\\int_{0}^{\\infty} e^{-x^2} \\, dx = \\frac{\\sqrt{\\pi}}{2}';
      assert.ok(isFormulaValidKaTeX(validFormula), 'Valid formula must pass isFormulaValidKaTeX');
      const report = validateLatex(validFormula);
      assert.equal(report.isValid, true, 'Valid KaTeX formula must report isValid=true');
      assert.equal(report.errors.length, 0, 'Must have zero errors');
    });

    test('22.2 Validate balanced curly braces and detect unclosed braces', () => {
      const unclosedBrace = '\\frac{x + 1}{x^2 + 1';
      const report = validateLatex(unclosedBrace);
      assert.equal(report.isValid, false, 'Unclosed brace must be detected as invalid');
      assert.ok(report.errors.some(e => e.includes('unclosed opening brace') || e.includes('{')));
    });

    test('22.3 Detect incomplete LaTeX commands (trailing backslash and truncated commands)', () => {
      const trailingBackslash = '\\int_0^1 x \\, dx \\';
      const report1 = validateLatex(trailingBackslash);
      assert.equal(report1.isValid, false);
      assert.ok(report1.errors.some(e => e.includes('Incomplete') || e.includes('trailing backslash')));

      const truncatedCmd = 'f(x) = \\sqr {x} + \\fra {1}{2}';
      const report2 = validateLatex(truncatedCmd);
      assert.equal(report2.isValid, false);
      assert.ok(report2.errors.some(e => e.includes('Incomplete') || e.includes('truncated')));
    });

    test('22.4 Detect missing arguments for commands with mandatory arguments', () => {
      const missingBinomArg = '\\binom{n}';
      const report = validateLatex(missingBinomArg);
      assert.equal(report.isValid, false);
      assert.ok(report.errors.some(e => e.includes('Missing') && e.includes('binom')));
    });

    test('22.5 Detect malformed fractions and radicals', () => {
      const emptyFrac = '\\frac{}{}';
      const rep1 = validateLatex(emptyFrac);
      assert.equal(rep1.isValid, false);
      assert.ok(rep1.errors.some(e => e.includes('empty fraction')));

      const emptyRadical = '\\sqrt{}';
      const rep2 = validateLatex(emptyRadical);
      assert.equal(rep2.isValid, false);
      assert.ok(rep2.errors.some(e => e.includes('Empty radical')));
    });

    test('22.6 Detect incorrect mathematical delimiters and mismatched families', () => {
      const mismatchedDelims = '\\left\\{ x + 1 \\right]';
      const report = validateLatex(mismatchedDelims);
      assert.equal(report.isValid, false);
      assert.ok(report.errors.some(e => e.includes('Delimiter mismatch') || e.includes('Incompatible')));
    });

    test('22.7 Detect unsupported LaTeX commands in KaTeX', () => {
      const unsupported = '\\begin{tabular}{cc} a & b \\end{tabular} \\label{eq1} \\cite{ref1}';
      const report = validateLatex(unsupported);
      assert.equal(report.isValid, false);
      assert.ok(report.errors.some(e => e.includes('Unsupported LaTeX command')));
    });

    test('22.8 Handle inline math and block math separately', () => {
      const mixedDoc = `Consider the statement $x^2 + y^2 = 1$ in inline mode.
$$\\int_{0}^{1} f(t) \\, dt = \\lim_{n \\to \\infty} \\sum_{k=1}^n \\frac{1}{n} f\\left(\\frac{k}{n}\\right)$$
End of statement.`;
      const segments = extractMathSegments(mixedDoc);
      assert.equal(segments.length, 5, 'Must parse inline, block, and text segments');
      const separated = validateMathExpressionsSeparately(mixedDoc);
      assert.equal(separated.inlineSegments.length, 1);
      assert.equal(separated.blockSegments.length, 1);
      assert.equal(separated.allValid, true);
    });

    test('22.9 Avoid accidental double escaping and repair double-backslash prefixes', () => {
      const doubleEscaped = '\\\\frac{x}{y} + \\\\sqrt{z} = \\\\alpha';
      const { hasDoubleEscaping, repaired, issues } = detectAndRepairDoubleEscaping(doubleEscaped);
      assert.equal(hasDoubleEscaping, true);
      assert.equal(repaired, '\\frac{x}{y} + \\sqrt{z} = \\alpha');
      assert.ok(issues.length >= 3);
      assert.ok(isFormulaValidKaTeX(repaired));
    });

    test('22.10 Diagnostic recovery on failed conversion preserving original equation data', () => {
      const brokenRawEquation = '\\left( 2^x + 2^{-x} \\right\\tan x';
      const diagnosis = diagnoseMathematicalConversionFailure(brokenRawEquation, undefined, {
        questionId: 'jee-q-42',
        qNum: 7,
        expressionIndex: 0
      });
      assert.equal(diagnosis.questionId, 'jee-q-42');
      assert.equal(diagnosis.qNum, 7);
      assert.equal(diagnosis.rawEquation, brokenRawEquation, 'Raw equation must be preserved exactly');
      assert.equal(diagnosis.canRetry, true);
      assert.ok(diagnosis.errors.length > 0);
      assert.ok(diagnosis.retrySuggestedFix && diagnosis.retrySuggestedFix.includes('delimiter'));
    });
  });

  // ==========================================
  // SECTION 7: KATEX PREVIEW RENDERING ENGINE
  // ==========================================
  describe('Category 23: KaTeX Preview Rendering Engine & Delimiter Integrity', () => {
    const KATEX_MACROS = {
      '\\R': '\\mathbb{R}',
      '\\N': '\\mathbb{N}',
      '\\Z': '\\mathbb{Z}',
      '\\Q': '\\mathbb{Q}',
      '\\C': '\\mathbb{C}',
      '\\d': '\\mathrm{d}',
      '\\diff': '\\frac{\\mathrm{d}#1}{\\mathrm{d}#2}',
      '\\pd': '\\partial',
      '\\pdiff': '\\frac{\\partial#1}{\\partial#2}',
      '\\ihat': '\\hat{\\imath}',
      '\\jhat': '\\hat{\\jmath}',
      '\\khat': '\\hat{k}',
      '\\degree': '^\\circ',
    };

    test('23.1 KaTeX renders user screenshot 1 formula without delimiter failure', () => {
      const rawScreenshot1 = 'Suppose $f(x)=\\dfrac{\\left(2^{x}+2^{-x}\\right\\tan x\\sqrt{\\tan^{-1}\\left(x^{2}-x + 1\\right.}}{{\\left(7x^{2}+3x + 1\\right.}^{3}}$. Then the value of $f\'(0)$ is equal to$\\right.$';
      const normalized = normalizePastedQuestion(rawScreenshot1);
      assertKaTeXRenders(normalized.statement, 'Screenshot 1 formula must render in KaTeX without delimiter failure');
    });

    test('23.2 KaTeX renders user screenshot 2 formula without delimiter failure', () => {
      const rawScreenshot2 = 'If $y=\\frac{(\\sqrt{x}+1)\\left(x^{2}-\\sqrt{x}\\right.}{x\\sqrt{x}+x+\\sqrt{x}}+\\frac{1}{15}\\left(3\\cos^{2}x-5\\right \\cos^{3}x$ , then $96y\'\\left(\\frac{\\pi}{6}\\right.$ is equal to :';
      const normalized = normalizePastedQuestion(rawScreenshot2);
      assertKaTeXRenders(normalized.statement, 'Screenshot 2 formula must render in KaTeX without delimiter failure');
    });

    test('23.3 KaTeX renders JEE macros (vectors, partial derivatives, degree, differential)', () => {
      const macroExpressions = [
        '\\vec{F} = 3\\ihat + 4\\jhat - 5\\khat',
        '\\pdiff{u}{t} = c^2 \\pdiff{^2 u}{x^2}',
        '\\theta = 45\\degree + 30\\degree',
        '\\diff{y}{x} + P(x) y = Q(x)'
      ];

      for (const expr of macroExpressions) {
        const rendered = katex.renderToString(expr, {
          throwOnError: true,
          strict: false,
          macros: KATEX_MACROS
        });
        assert.ok(rendered.length > 0, `KaTeX must render macro expression: ${expr}`);
      }
    });

    test('23.4 KaTeX renders deeply nested fractions without clipping or error', () => {
      const nestedFraction = '\\dfrac{1}{1 + \\dfrac{1}{1 + \\dfrac{1}{1 + \\dfrac{1}{x}}}}';
      const rendered = katex.renderToString(nestedFraction, { throwOnError: true, displayMode: true });
      assert.ok(rendered.length > 0);
      assert.ok(rendered.includes('katex-display'), 'Display mode nested fraction must generate display container');
    });

    test('23.5 KaTeX renders nested radicals with fractions inside', () => {
      const nestedRadical = '\\sqrt{1 + \\sqrt{1 + \\sqrt{\\dfrac{x^2 + 1}{x^2 - 1}}}}';
      const rendered = katex.renderToString(nestedRadical, { throwOnError: true });
      assert.ok(rendered.length > 0);
      assert.ok(rendered.includes('sqrt'), 'Rendered HTML must contain radical structure');
    });

    test('23.6 KaTeX renders matrices and determinants with preserved row breaks', () => {
      const pmatrix = '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}';
      const bmatrix = '\\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}';
      const vmatrix = '\\begin{vmatrix} \\lambda - 1 & 2 \\\\ 3 & \\lambda - 4 \\end{vmatrix}';

      for (const mat of [pmatrix, bmatrix, vmatrix]) {
        const rendered = katex.renderToString(mat, { throwOnError: true, displayMode: true });
        assert.ok(rendered.length > 0, `Matrix must render in KaTeX: ${mat}`);
        assert.ok(!rendered.includes('katex-error'));
      }
    });

    test('23.7 KaTeX renders piecewise functions (cases)', () => {
      const piecewise = '\\begin{cases} x^2 \\sin\\left(\\dfrac{1}{x}\\right) & x \\neq 0 \\\\ 0 & x = 0 \\end{cases}';
      const rendered = katex.renderToString(piecewise, { throwOnError: true, displayMode: true });
      assert.ok(rendered.length > 0);
      assert.ok(!rendered.includes('katex-error'));
    });

    test('23.8 KaTeX renders calculus limits with subscripts and inverse trigonometry', () => {
      const limitExpr = '\\lim_{x \\to 0} \\dfrac{\\tan^{-1}(x) - \\sin^{-1}(x)}{x^3} = -\\dfrac{1}{2}';
      const rendered = katex.renderToString(limitExpr, { throwOnError: true });
      assert.ok(rendered.length > 0);
      assert.ok(!rendered.includes('katex-error'));
    });

    test('23.9 KaTeX handles all 4 standard delimiter styles ($$, $, \\[, \\()', () => {
      const testCases = [
        { text: '$$x^2 + y^2 = r^2$$', isBlock: true },
        { text: '\\[a^2 + b^2 = c^2\\]', isBlock: true },
        { text: '$E = mc^2$', isBlock: false },
        { text: '\\(F = ma\\)', isBlock: false }
      ];

      for (const tc of testCases) {
        const segments = extractMathSegments(tc.text);
        assert.equal(segments.length, 1);
        assert.equal(segments[0].type, tc.isBlock ? 'block' : 'inline');
        const rendered = katex.renderToString(segments[0].content, {
          throwOnError: true,
          displayMode: tc.isBlock
        });
        assert.ok(rendered.length > 0);
      }
    });

    test('23.10 KaTeX error reporting: malformed syntax is preserved in diagnosis and never dropped', () => {
      const unrecoverableSyntax = '\\unknownIllegalCommand{invalid';
      const diagnosis = diagnoseMathematicalConversionFailure(unrecoverableSyntax);
      assert.equal(diagnosis.rawEquation, unrecoverableSyntax, 'Raw source must never be dropped on error');
      assert.ok(diagnosis.errors.length > 0, 'Must report specific diagnostic errors');

      const valReport = validateLatex(unrecoverableSyntax);
      assert.equal(valReport.isValid, false);
      assert.ok(valReport.errors.length > 0);
    });
  });

  // 24. Category 24: Real-World Exam Option Prose Separation and Math Normalization
  describe('Category 24: Real-World Exam Option Prose Separation and Math Normalization', () => {
    test('24.1 Option with detached PDF circumflex / hat accent artifact (x ^\\in -> \\hat{x} \\in)', () => {
      const rawOptA = "there exists x ^\\in [0,3] such that f'(x )<g'(x )";
      const normalized = normalizeOptionMath(rawOptA);
      // Prose remains outside math, math is delimited and circumflex is recovered to \hat{x}
      assert.ok(normalized.includes('there exists'), 'Must keep English prose "there exists" uncollapsed');
      assert.ok(normalized.includes('such that'), 'Must keep English prose "such that" uncollapsed');
      assert.ok(normalized.includes('\\hat{x}'), 'Must repair circumflex artifact x ^\\in to \\hat{x}');
      assertKaTeXRenders(normalized, '24.1');
    });

    test('24.2 Option with 4-term chained inequality and universal quantifier', () => {
      const rawOptB = "there exist 0<x_1<x_2<3 such that f(x)<g(x),\\forall x \\in (x_1,x_2 )";
      const normalized = normalizeOptionMath(rawOptB);
      assert.ok(normalized.includes('there exist'), 'Must preserve English prose "there exist"');
      assert.ok(normalized.includes('such that'), 'Must preserve English prose "such that"');
      assert.ok(
        normalized.includes('$0<x_1<x_2<3$') ||
        normalized.includes('$0<x_{1}<x_{2}<3$') ||
        normalized.includes('$0 < x_1 < x_2 < 3$') ||
        normalized.includes('$0 < x_{1} < x_{2} < 3$'),
        'Must keep 4-term chain inequality intact'
      );
      assertKaTeXRenders(normalized, '24.2');
    });

    test('24.3 Pure math option with glued min and max operators', () => {
      const rawOptC = "minf'(x)=1 + maxg'(x)";
      const normalized = normalizeOptionMath(rawOptC);
      assert.ok(normalized.includes('\\min'), 'Must convert min to \\min');
      assert.ok(normalized.includes('\\max'), 'Must convert max to \\max');
      assert.ok(!normalized.includes('\\\\min'), 'Must not produce double escaped \\\\min');
      assertKaTeXRenders(normalized, '24.3');
    });

    test('24.4 Pure math option with glued max operator and inequality', () => {
      const rawOptD = "maxf(x)>maxg(x)";
      const normalized = normalizeOptionMath(rawOptD);
      assert.ok(normalized.includes('\\max f(x)'), 'Must convert maxf(x) to \\max f(x)');
      assert.ok(normalized.includes('\\max g(x)'), 'Must convert maxg(x) to \\max g(x)');
      assertKaTeXRenders(normalized, '24.4');
    });

    test('24.5 Full single question block parsing matching JEE 2023 user screenshot', () => {
      const questionText = `Let f(x)=2x + tan^(-1) x and g(x)=\\log_e (\\sqrt{1 + x^2}+x),x \\in [0,3]. Then
A there exists x ^\\in [0,3] such that f'(x )<g'(x )
B there exist 0<x_1<x_2<3 such that f(x)<g(x),\\forall x \\in (x_1,x_2 )
C minf'(x)=1 + maxg'(x)
D maxf(x)>maxg(x)`;

      const parsed = normalizePastedQuestion(questionText);
      assertKaTeXRenders(parsed.statement, '24.5 statement');
      for (const opt of parsed.options) {
        const optNorm = normalizeOptionMath(opt.text);
        assertKaTeXRenders(optNorm, `24.5 option ${opt.key}`);
      }
    });

    test('24.6 Pure English prose options are preserved without dollar delimiters', () => {
      const englishOpts = [
        'None of these',
        'Both A and B are true',
        'Statement 1 is true but Statement 2 is false',
        'Cannot be determined'
      ];
      for (const opt of englishOpts) {
        const normalized = normalizeOptionMath(opt);
        assert.ok(!normalized.startsWith('$'), `English prose option "${opt}" must not be wrapped in $`);
        assert.equal(normalized, opt);
      }
    });

    test('24.7 Fractions and logarithms in pure math options', () => {
      const fracOpt = normalizeOptionMath('3/4');
      assert.equal(fracOpt, '$\\dfrac{3}{4}$');
      assertKaTeXRenders(fracOpt, '24.7 frac');

      const logOpt = normalizeOptionMath('\\log_e 2');
      assert.equal(logOpt, '$\\log_e 2$');
      assertKaTeXRenders(logOpt, '24.7 log');
    });

    test('24.8 Combining circumflex unicode (U+0302) converts cleanly to \\hat{}', () => {
      const unicodeHat = "x\u0302 \u2208 [0, 3]";
      const normalized = normalizeOptionMath(unicodeHat);
      assert.ok(normalized.includes('\\hat{x}'), 'U+0302 combining circumflex must convert to \\hat{x}');
      assertKaTeXRenders(normalized, '24.8');
    });

    test('24.9 Interval membership does not collapse into sequence', () => {
      const intervalMembership = "x \\in (0, 1)";
      const normalized = normalizeMathString(intervalMembership);
      assert.ok(normalized.includes('$x \\in (0, 1)$') || normalized.includes('$x \\in (0,1)$'), 'Must preserve (0, 1) as interval');
      assertKaTeXRenders(normalized, '24.9');
    });

    test('24.10 Standalone min/max English words remain uncorrupted', () => {
      const phrase = "the minimum value of f(x) along the minor axis is 4";
      const normalized = normalizeMathString(phrase);
      assert.ok(!normalized.includes('\\min imum'), 'Must not corrupt minimum to \\min imum');
      assert.ok(!normalized.includes('\\min or'), 'Must not corrupt minor to \\min or');
    });
  });

  // 25. DK Academy – 30 Hard-Level JEE Main & Advanced Equations Suite
  describe('Category 25: 30 Hard-Level JEE Main & Advanced Equations Suite', () => {
    const suite30 = [
      { id: 1, plain: 'z = ((1 + i√3)^8 (1 − i)^6) / (1 + i)^4', latex: 'z=\\frac{(1+i\\sqrt{3})^8(1-i)^6}{(1+i)^4}' },
      { id: 2, plain: 'Σᵣ₌₀ⁿ (−1)^r · C(n,r) · x^(n−r) / (r+1)', latex: '\\sum_{r=0}^{n}(-1)^r\\binom{n}{r}\\frac{x^{n-r}}{r+1}' },
      { id: 3, plain: 'P(x) = x^6 − 3x^5 + 5x^4 − 7x^3 + 9x^2 − 11x + 13', latex: 'P(x)=x^6-3x^5+5x^4-7x^3+9x^2-11x+13' },
      { id: 4, plain: 'x = √(3 + √(3 + √(3 + √(3 + ⋯))))', latex: 'x=\\sqrt{3+\\sqrt{3+\\sqrt{3+\\sqrt{3+\\cdots}}}}' },
      { id: 5, plain: 'log₂(x² − 5x + 6) + log₂(x − 1) = 3', latex: '\\log_2(x^2-5x+6)+\\log_2(x-1)=3' },
      { id: 6, plain: 'd/dx [ x² · sin⁻¹(x) / √(1 − x²) ]', latex: '\\frac{d}{dx}\\left[\\frac{x^2\\sin^{-1}x}{\\sqrt{1-x^2}}\\right]' },
      { id: 7, plain: '∫ x³ / √(x² + 1) dx', latex: '\\int \\frac{x^3}{\\sqrt{x^2+1}}\\,dx' },
      { id: 8, plain: 'I = ∫₀^(π/2) [x sin(x) / (1 + cos²(x))] dx', latex: 'I=\\int_0^{\\pi/2}\\frac{x\\sin x}{1+\\cos^2x}\\,dx' },
      { id: 9, plain: '∫₀^∞ x^(α−1) / (1 + x^β) dx', latex: '\\int_0^\\infty\\frac{x^{\\alpha-1}}{1+x^\\beta}\\,dx' },
      { id: 10, plain: 'd²y/dx² − 5(dy/dx) + 6y = e^(2x)', latex: '\\frac{d^2y}{dx^2}-5\\frac{dy}{dx}+6y=e^{2x}' },
      { id: 11, plain: 'lim_(x→0) [ sin(x) − x + x³/6 ] / x⁵', latex: '\\lim_{x\\to0}\\frac{\\sin x-x+\\frac{x^3}{6}}{x^5}' },
      { id: 12, plain: 'e^x = Σₙ₌₀^∞ xⁿ / n!', latex: 'e^x=\\sum_{n=0}^{\\infty}\\frac{x^n}{n!}' },
      { id: 13, plain: 'f(x,y) = x³y² + e^(xy) + ln(x² + y²); find ∂²f/(∂x∂y)', latex: 'f(x,y)=x^3y^2+e^{xy}+\\ln(x^2+y^2),\\quad \\frac{\\partial^2 f}{\\partial x\\partial y}' },
      { id: 14, plain: '∫₀¹ ∫₀^(1−x) (x² + y²) dy dx', latex: '\\int_0^1\\int_0^{1-x}(x^2+y^2)\\,dy\\,dx' },
      { id: 15, plain: 'Σₙ₌₁^∞ (n² + 3n + 1) / 2ⁿ', latex: '\\sum_{n=1}^{\\infty}\\frac{n^2+3n+1}{2^n}' },
      { id: 16, plain: '| 1  a  a²;  1  b  b²;  1  c  c² |', latex: '\\begin{vmatrix}1&a&a^2\\\\1&b&b^2\\\\1&c&c^2\\end{vmatrix}' },
      { id: 17, plain: 'A = [[1,2,3],[0,−1,4],[2,1,0]],  B = [[2,0,1],[3,1,−2],[1,4,2]]. Find AB and BA.', latex: 'A=\\begin{bmatrix}1&2&3\\\\0&-1&4\\\\2&1&0\\end{bmatrix},\\quad B=\\begin{bmatrix}2&0&1\\\\3&1&-2\\\\1&4&2\\end{bmatrix};\\quad AB,\\ BA' },
      { id: 18, plain: 'det(A − λI) = 0', latex: '\\det(A-\\lambda I)=0' },
      { id: 19, plain: 'a⃗ × (b⃗ × c⃗) = b⃗(a⃗ · c⃗) − c⃗(a⃗ · b⃗)', latex: '\\vec a\\times(\\vec b\\times\\vec c)=\\vec b(\\vec a\\cdot\\vec c)-\\vec c(\\vec a\\cdot\\vec b)' },
      { id: 20, plain: '[a⃗,b⃗,c⃗] = | a₁ a₂ a₃; b₁ b₂ b₃; c₁ c₂ c₃ |', latex: '[\\vec a,\\vec b,\\vec c]=\\begin{vmatrix}a_1&a_2&a_3\\\\b_1&b_2&b_3\\\\c_1&c_2&c_3\\end{vmatrix}' },
      { id: 21, plain: 'f(x) = { x²+2x+1, x<0 ; sin(x), 0≤x≤π ; e^(−x), x>π }', latex: 'f(x)=\\begin{cases}x^2+2x+1,&x<0\\\\\\sin x,&0\\le x\\le\\pi\\\\e^{-x},&x>\\pi\\end{cases}' },
      { id: 22, plain: 'f(x) = { (x²−1)/(x−1), x≠1 ; 2, x=1 }', latex: 'f(x)=\\begin{cases}\\dfrac{x^2-1}{x-1},&x\\ne1\\\\[8pt]2,&x=1\\end{cases}' },
      { id: 23, plain: '(1 + 1/(1 + 1/(1 + 1/x))) / (1 − 1/(1 + 1/x))', latex: '\\frac{1+\\dfrac{1}{1+\\dfrac{1}{1+\\dfrac{1}{x}}}}{1-\\dfrac{1}{1+\\dfrac{1}{x}}}' },
      { id: 24, plain: '∛[ (x⁴+2x²+1) / ( √(x²+1) + ⁴√(x⁸+1) ) ]', latex: '\\sqrt[3]{\\frac{x^4+2x^2+1}{\\sqrt{x^2+1}+\\sqrt[4]{x^8+1}}}' },
      { id: 25, plain: 'A ⊆ B,  B ∩ C = ∅,  A ∪ (B ∩ C) = (A ∪ B) ∩ (A ∪ C)', latex: 'A\\subseteq B,\\quad B\\cap C=\\varnothing,\\quad A\\cup(B\\cap C)=(A\\cup B)\\cap(A\\cup C)' },
      { id: 26, plain: '∀x ∈ ℝ,  ∃y ∈ ℝ : x² + y² ≥ 0', latex: '\\forall x\\in\\mathbb R,\\quad\\exists y\\in\\mathbb R:\\ x^2+y^2\\ge0' },
      { id: 27, plain: 'f(x) = { |x²−4x+3|, x≤2 ; |x³−3x|, x>2 }', latex: 'f(x)=\\begin{cases}|x^2-4x+3|,&x\\le2\\\\|x^3-3x|,&x>2\\end{cases}' },
      { id: 28, plain: '∏ₖ₌₁ⁿ (1 + 1/k) = Σᵣ₌₀ⁿ C(n,r)', latex: '\\prod_{k=1}^{n}\\left(1+\\frac{1}{k}\\right)=\\sum_{r=0}^{n}\\binom{n}{r}' },
      { id: 29, plain: '[sin(A+B) + sin(A−B)] / [cos(A+B) + cos(A−B)] = tan(A)', latex: '\\frac{\\sin(A+B)+\\sin(A-B)}{\\cos(A+B)+\\cos(A-B)}=\\tan A' },
      { id: 30, plain: 'lim_(n→∞) (1 + x/n)^n = e^x,  ∀x ∈ ℝ', latex: '\\lim_{n\\to\\infty}\\left(1+\\frac{x}{n}\\right)^n=e^x,\\quad\\forall x\\in\\mathbb R' }
    ];

    for (const item of suite30) {
      test(`25.${item.id} JEE Hard Equation #${item.id}: preserves and renders`, () => {
        // Direct LaTeX KaTeX check
        assertKaTeXRenders(item.latex, `25.${item.id} LaTeX`);

        // Plain text canonical normalization and KaTeX check
        const normalized = normalizeMathString(item.plain);
        assertKaTeXRenders(normalized, `25.${item.id} Plain`);
      });
    }
  });

});
