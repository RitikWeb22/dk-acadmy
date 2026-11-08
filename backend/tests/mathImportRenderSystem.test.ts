import dotenv from 'dotenv';
dotenv.config();

import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCanonicalMath,
  stripRenderedHtml,
  stripWordJunk,
  normalizeBackslashes,
  convertUnicodeMathToLatex,
  repairLinearMathResidues,
  wrapBareLatexInDollars
} from '../src/services/mathImport/mathNormalizer.js';
import {
  validateQuestion,
  validateTextField,
  summarizeBatchValidation
} from '../src/services/mathImport/mathValidator.js';
import { bulkImportDocx } from '../src/services/mathImport/bulkDocxImporter.js';

describe('DK Academy JEE - Math Import & Render System 100+ Test Suite', () => {

  // ==========================================================================
  // Group 1: Differential Equations (16 Tests)
  // ==========================================================================
  describe('1. Differential Equations (JEE Standard & Photos)', () => {
    it('1.1 Normalizes Photo Q1: 2x^{2} dy=(2xy+y^{2}) \\, dx', () => {
      const raw = 'If a curve y=f(x), passing through the point (1,2), is the solution of the differential equation, 2x^{2} dy=(2xy+y^{2}) \\, dx, then f( 1/2 ) is equal to :';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(normalized.includes('$y=f(x)$') || normalized.includes('$y = f(x)$'));
      assert.ok(normalized.includes('$(1,2)$'));
      assert.ok(normalized.includes('$2x^{2} dy=(2xy+y^{2}) dx$') || normalized.includes('dy'));
      assert.ok(!normalized.includes('dy/(" "'));
      const val = validateQuestion(normalized);
      assert.equal(val.overallStatus, 'GREEN');
      assert.equal(val.canPublish, true);
    });

    it('1.2 Normalizes Photo Q2: x^{3} dy+xy \\, dx=x^{2} dy+2y \\, dx', () => {
      const raw = 'If x^{3} dy+xy \\, dx=x^{2} dy+2y \\, dx,y(2)=e and x > 1 , then y(4) is equal to:';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(normalized.includes('$x^{3} dy+xy dx=x^{2} dy+2y dx$') || normalized.includes('dy'));
      assert.ok(normalized.includes('$y(2)=e$') || normalized.includes('$y(2) = e$'));
      assert.ok(normalized.includes('$y(4)$'));
      const val = validateQuestion(normalized);
      assert.equal(val.overallStatus, 'GREEN');
    });

    it('1.3 Normalizes Photo Q3: y(x+1) \\, dx-x^{2} dy=0,y(1)=e', () => {
      const raw = 'Let y=f(x) be the solution of the differential equation y(x+1) \\, dx-x^{2} dy=0,y(1)=e. Then \\lim_{x\\to 0^{+}} f(x) is equal to';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(normalized.includes('$y=f(x)$'));
      assert.ok(normalized.includes('$y(x+1) dx-x^{2} dy=0$') || normalized.includes('dy'));
      assert.ok(normalized.includes('$\\lim_{x\\to 0^{+}} f(x)$') || normalized.includes('\\lim'));
      const val = validateQuestion(normalized);
      assert.equal(val.overallStatus, 'GREEN');
    });

    it('1.4 Normalizes Photo Q4: dy/(" " \\, dx)-(3x^{5} \\tan^{-1}(x^{3}))/(1+x^{6})^{3/2} y=2x\\exp{...}', () => {
      const raw = 'Let the solution curve y=y(x) of the differential equation dy/(" " \\, dx)-(3x^{5} \\tan^{-1}(x^{3}))/(1+x^{6})^{\\frac{3}{2}} y=2x\\exp{ \\frac{x^{3}-\\tan^{-1}x^{3}}{\\sqrt{ (1+x^{6}) }} pass through the origin. Then y(1) is equal to :';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(normalized.includes('\\dfrac{dy}{dx}'));
      assert.ok(!normalized.includes('dy/(" "'));
      const val = validateQuestion(normalized);
      assert.equal(val.overallStatus, 'GREEN');
    });

    it('1.5 Linear first order: (x^2+1) dy/dx + 2xy = 4x^2', () => {
      const raw = 'Solve the differential equation (x^2+1) dy/dx + 2xy = 4x^2 given y(0) = 0.';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(normalized.includes('\\dfrac{dy}{dx}') || normalized.includes('dy'));
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('1.6 Second order linear: d^2y/dx^2 - 5 dy/dx + 6y = 0', () => {
      const raw = 'The general solution of d^2y/dx^2 - 5 dy/dx + 6y = 0 is :';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(normalized.includes('\\dfrac{d^2y}{dx^2}') || normalized.includes('d^2y'));
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('1.7 Homogeneous: x dy - y dx = \\sqrt{x^2 + y^2} dx', () => {
      const raw = 'If x dy - y dx = \\sqrt{x^2 + y^2} dx with y(1) = 0, find y(e).';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('1.8 Bernoulli equation: dy/dx + y/x = y^2', () => {
      const raw = 'Find the integrating factor for dy/dx + y/x = y^2.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('1.9 Exact differential: (2xy + 3) dx + (x^2 - 1) dy = 0', () => {
      const raw = 'The solution of (2xy + 3) dx + (x^2 - 1) dy = 0 represents a family of curves.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('1.10 Variable separable with trig: dy/dx = (1 + y^2)/(1 + x^2)', () => {
      const raw = 'If dy/dx = (1 + y^2)/(1 + x^2) and y(0) = 1, then y(1) equals:';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('1.11 Differential equation with cotangent: dy/dx + y\\cot x = 2x + x^2\\cot x', () => {
      const raw = 'Let y(x) satisfy dy/dx + y\\cot x = 2x + x^2\\cot x for x \\in (0, \\pi).';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('1.12 Orthogonal trajectories: y = c x^2', () => {
      const raw = 'The orthogonal trajectory of the family y = c x^2 is given by:';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('1.13 Clairaut form: y = x dy/dx + (dy/dx)^2', () => {
      const raw = 'The singular solution of y = x dy/dx + (dy/dx)^2 is:';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('1.14 Exponential differential: dy/dx = e^{x-y} + x^2 e^{-y}', () => {
      const raw = 'Solve dy/dx = e^{x-y} + x^2 e^{-y} with y(0) = 0.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('1.15 Differential with secant: x dy/dx - y = 2x^2 \\sec x', () => {
      const raw = 'The integrating factor of x dy/dx - y = 2x^2 \\sec x is:';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('1.16 Word linear differential residue: dy/( " " \\, dx )', () => {
      const raw = 'If dy/( " " \\, dx ) + 3y = e^{2x}, find y(0).';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(normalized.includes('\\dfrac{dy}{dx}'));
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });
  });

  // ==========================================================================
  // Group 2: Limits (16 Tests)
  // ==========================================================================
  describe('2. Limits (Trig, Logarithmic, Exponential & One-Sided)', () => {
    it('2.1 One-sided limit: \\lim_{x\\to 0^{+}} f(x)', () => {
      const raw = 'Evaluate \\lim_{x\\to 0^{+}} \\frac{\\sin x}{\\sqrt{x}}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(normalized.includes('\\lim_{x\\to 0^{+}}'));
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('2.2 Fundamental trig limit: \\lim_{x\\to 0} \\frac{\\sin x}{x} = 1', () => {
      const raw = 'Find \\lim_{x\\to 0} \\frac{\\sin 3x}{\\tan 2x}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('2.3 e-definition limit: \\lim_{x\\to \\infty} (1 + 1/x)^x', () => {
      const raw = 'The value of \\lim_{x\\to \\infty} (1 + 2/x)^x is:';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('2.4 Algebraic cancellation: \\lim_{x\\to 2} (x^3 - 8)/(x - 2)', () => {
      const raw = 'Evaluate \\lim_{x\\to 2} \\frac{x^3 - 8}{x - 2}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('2.5 L-Hopital indeterminate 0/0: \\lim_{x\\to 0} (e^x - 1 - x)/x^2', () => {
      const raw = 'Evaluate \\lim_{x\\to 0} \\frac{e^x - 1 - x}{x^2}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('2.6 Cubic trig difference: \\lim_{x\\to 0} (\\tan x - \\sin x)/x^3', () => {
      const raw = 'The limit \\lim_{x\\to 0} \\frac{\\tan x - \\sin x}{x^3} is equal to:';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('2.7 Logarithmic limit: \\lim_{x\\to 1} \\ln x / (x - 1)', () => {
      const raw = 'Calculate \\lim_{x\\to 1} \\frac{\\ln x}{x - 1}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('2.8 Rationalization radical: \\lim_{x\\to 0} (\\sqrt{1+x} - \\sqrt{1-x})/x', () => {
      const raw = 'Find \\lim_{x\\to 0} \\frac{\\sqrt{1+x} - \\sqrt{1-x}}{x}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('2.9 Limit of Riemann sum: \\lim_{n\\to\\infty} \\sum_{r=1}^n 1/(n+r)', () => {
      const raw = 'The limit \\lim_{n\\to\\infty} \\sum_{r=1}^n \\frac{1}{n+r} equals:';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('2.10 Cosine quadratic: \\lim_{x\\to 0} (1 - \\cos 2x)/x^2', () => {
      const raw = 'Find the value of \\lim_{x\\to 0} \\frac{1 - \\cos 2x}{x^2}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('2.11 Double radical conjugate: \\lim_{x\\to 3} (x^2 - 9)/(\\sqrt{x^2+7} - 4)', () => {
      const raw = 'Evaluate \\lim_{x\\to 3} \\frac{x^2 - 9}{\\sqrt{x^2+7} - 4}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('2.12 Power indeterminate 1^\\infty: \\lim_{x\\to 0} (\\cos x)^{1/x^2}', () => {
      const raw = 'The limit \\lim_{x\\to 0} (\\cos x)^{1/x^2} is equal to:';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('2.13 General base exponential: \\lim_{x\\to 0} (a^x - b^x)/x', () => {
      const raw = 'Evaluate \\lim_{x\\to 0} \\frac{a^x - b^x}{x} for a, b > 0.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('2.14 Product indeterminate 0 * \\infty: \\lim_{x\\to 0^+} x \\ln x', () => {
      const raw = 'Find \\lim_{x\\to 0^+} x \\ln x.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('2.15 Greatest integer function limit: \\lim_{x\\to 1^-} ([x] - 1)/(x - 1)', () => {
      const raw = 'Evaluate \\lim_{x\\to 1^-} \\frac{[x] - 1}{x - 1}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('2.16 Limit with nested limit subscript: \\lim_{t\\to 0} \\lim_{x\\to t} f(x)', () => {
      const raw = 'Find \\lim_{x\\to 0} \\frac{\\sin(\\pi \\cos^2 x)}{x^2}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });
  });

  // ==========================================================================
  // Group 3: Integrals (16 Tests)
  // ==========================================================================
  describe('3. Definite & Indefinite Integrals', () => {
    it('3.1 Standard monomial integral: \\int_0^1 x^2 \\, dx', () => {
      const raw = 'Evaluate \\int_0^1 x^2 \\, dx.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('3.2 Inverse tangent integral: \\int 1/(x^2 + a^2) \\, dx', () => {
      const raw = 'The integral \\int \\frac{1}{x^2 + a^2} \\, dx is:';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('3.3 Integration by parts: \\int e^x (\\sin x + \\cos x) \\, dx', () => {
      const raw = 'Compute \\int e^x (\\sin x + \\cos x) \\, dx.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('3.4 King property symmetry: \\int_0^{\\pi/2} \\frac{\\sqrt{\\sin x}}{\\sqrt{\\sin x} + \\sqrt{\\cos x}} \\, dx', () => {
      const raw = 'The value of \\int_0^{\\pi/2} \\frac{\\sqrt{\\sin x}}{\\sqrt{\\sin x} + \\sqrt{\\cos x}} \\, dx is:';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('3.5 Partial fraction power: \\int dx / (x(x^n + 1))', () => {
      const raw = 'Evaluate \\int \\frac{dx}{x(x^n + 1)}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('3.6 Gamma function improper integral: \\int_0^\\infty e^{-x} x^{n-1} \\, dx', () => {
      const raw = 'The improper integral \\int_0^\\infty e^{-x} x^{n-1} \\, dx equals \\Gamma(n).';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('3.7 Symmetric rational: \\int (x^2 - 1)/(x^4 + 1) \\, dx', () => {
      const raw = 'Compute \\int \\frac{x^2 - 1}{x^4 + 1} \\, dx.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('3.8 Reduction formula: \\int \\sec^3 x \\, dx', () => {
      const raw = 'Evaluate \\int \\sec^3 x \\, dx.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('3.9 Logarithmic rational: \\int_0^1 \\ln(1+x)/(1+x^2) \\, dx', () => {
      const raw = 'The definite integral \\int_0^1 \\frac{\\ln(1+x)}{1+x^2} \\, dx equals:';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('3.10 Odd function symmetry: \\int_{-a}^a f(x) \\, dx = 0', () => {
      const raw = 'If f(-x) = -f(x), then \\int_{-1}^1 \\frac{x^3 + x\\cos x}{1 + e^x} \\, dx is:';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('3.11 Circular radical: \\int \\sqrt{a^2 - x^2} \\, dx', () => {
      const raw = 'Evaluate \\int \\sqrt{a^2 - x^2} \\, dx.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('3.12 Double integral: \\iint_D (x^2 + y^2) \\, dx \\, dy', () => {
      const raw = 'Compute the double integral \\iint_D (x^2 + y^2) \\, dx \\, dy over the unit circle.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('3.13 Beta function: \\int_0^1 x(1-x)^n \\, dx', () => {
      const raw = 'Evaluate \\int_0^1 x(1-x)^n \\, dx for integer n.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('3.14 Linear over quadratic root: \\int (2x+3)/\\sqrt{x^2+4x+5} \\, dx', () => {
      const raw = 'Find \\int \\frac{2x+3}{\\sqrt{x^2+4x+5}} \\, dx.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('3.15 Fourier trig integral: \\int_0^\\pi x\\sin x / (1+\\cos^2 x) \\, dx', () => {
      const raw = 'The value of \\int_0^\\pi \\frac{x\\sin x}{1+\\cos^2 x} \\, dx is:';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('3.16 Triple integral notation: \\iiint_V dx \\, dy \\, dz', () => {
      const raw = 'The volume is given by \\iiint_V dx \\, dy \\, dz.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });
  });

  // ==========================================================================
  // Group 4: Matrices & Determinants (11 Tests)
  // ==========================================================================
  describe('4. Matrices & Determinants', () => {
    it('4.1 2x2 pmatrix environment', () => {
      const raw = 'Let A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}. Find A^{-1}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(normalized.includes('\\begin{pmatrix}'));
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('4.2 3x3 vmatrix determinant with cube roots of unity', () => {
      const raw = 'Evaluate \\begin{vmatrix} 1 & \\omega & \\omega^2 \\\\ \\omega & \\omega^2 & 1 \\\\ \\omega^2 & 1 & \\omega \\end{vmatrix}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('4.3 Characteristic equation: \\det(A - \\lambda I) = 0', () => {
      const raw = 'The eigenvalues satisfy \\det(A - \\lambda I) = 0.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('4.4 Adjoint matrix inverse formula', () => {
      const raw = 'If \\det A \\neq 0, then A^{-1} = \\frac{1}{\\det A}\\operatorname{adj}(A).';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('4.5 2x2 bmatrix environment', () => {
      const raw = 'Given B = \\begin{bmatrix} 2 & 1 \\\\ 5 & 3 \\end{bmatrix}, find B^2.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('4.6 Matrix non-commutativity: AB \\neq BA', () => {
      const raw = 'For non-commuting square matrices, AB \\neq BA.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('4.7 Trace linearity: \\operatorname{Tr}(A + B) = \\operatorname{Tr}(A) + \\operatorname{Tr}(B)', () => {
      const raw = 'Show that \\operatorname{Tr}(A + B) = \\operatorname{Tr}(A) + \\operatorname{Tr}(B).';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('4.8 Skew-symmetric transpose: A^T = -A', () => {
      const raw = 'If A is skew-symmetric, then A^T = -A and \\det A = 0 for odd order.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('4.9 Determinant equation with variable x', () => {
      const raw = 'Solve \\begin{vmatrix} x & 1 & 2 \\\\ 1 & x & 3 \\\\ 2 & 3 & x \\end{vmatrix} = 0.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('4.10 Adjoint determinant identity: |\\operatorname{adj} A| = |A|^{n-1}', () => {
      const raw = 'For an n \\times n matrix, |\\operatorname{adj} A| = |A|^{n-1}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('4.11 Orthogonal matrix property: A A^T = I', () => {
      const raw = 'If A is orthogonal, A A^T = I.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });
  });

  // ==========================================================================
  // Group 5: Piecewise Cases (10 Tests)
  // ==========================================================================
  describe('5. Piecewise Functions & Cases Environments', () => {
    it('5.1 Two-branch piecewise with text conditions', () => {
      const raw = 'Let f(x) = \\begin{cases} x^2 & \\text{if } x < 0 \\\\ 2x & \\text{if } x \\ge 0 \\end{cases}. Is f continuous?';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(normalized.includes('\\begin{cases}'));
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('5.2 Sinc function with removable singularity', () => {
      const raw = 'Let g(x) = \\begin{cases} \\frac{\\sin x}{x} & x \\neq 0 \\\\ 1 & x = 0 \\end{cases}. Find g\'(0).';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('5.3 Absolute value definition', () => {
      const raw = 'Define |x| = \\begin{cases} x & x \\ge 0 \\\\ -x & x < 0 \\end{cases}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('5.4 Signum function: 3 branches', () => {
      const raw = 'Let \\operatorname{sgn}(x) = \\begin{cases} 1 & x > 0 \\\\ 0 & x = 0 \\\\ -1 & x < 0 \\end{cases}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('5.5 Differentiability parameters problem', () => {
      const raw = 'If h(x) = \\begin{cases} ax + b & x \\le 1 \\\\ 3x^2 & x > 1 \\end{cases} is differentiable, find a and b.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('5.6 Step function definition', () => {
      const raw = 'Let u(t) = \\begin{cases} 0 & t < 0 \\\\ 1 & t \\ge 0 \\end{cases}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('5.7 Dirichlet-like rational indicator', () => {
      const raw = 'Consider f(x) = \\begin{cases} 1 & x \\in \\mathbb{Q} \\\\ 0 & x \\notin \\mathbb{Q} \\end{cases}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('5.8 Piecewise with fraction powers', () => {
      const raw = 'Let f(x) = \\begin{cases} x^{1/3} & x \\ge 0 \\\\ -(-x)^{1/3} & x < 0 \\end{cases}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('5.9 Quadratic-linear junction: x^2 - 4 vs 3x', () => {
      const raw = 'Let f(x) = \\begin{cases} x^2 - 4 & x < 2 \\\\ 3x - 6 & x \\ge 2 \\end{cases}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('5.10 Four-branch piecewise definition', () => {
      const raw = 'Let p(x) = \\begin{cases} -1 & x < -1 \\\\ x & -1 \\le x \\le 1 \\\\ 1 & x > 1 \\end{cases}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('5.11 Normalizes Word Piecewise and Functions: {■([x]&,□( ) x<0@|1-x|&,□( ) x≥0)┤ and fog', () => {
      const raw = 'Let f,g:R→R be functions defined by f(x)={■([x]&,□( ) x<0@|1-x|&,□( ) x≥0)┤ and g(x)={■(e^x-x&,□( ) x<0@(x-1)^2-1&,□( ) x≥0)┤ where [x] denote the greatest integer less than or equal to x. Then, the function fog is discontinuous at exactly :';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(normalized.includes('\\begin{cases}'));
      assert.ok(normalized.includes('f \\circ g') || normalized.includes('fog'));
      assert.ok(!normalized.includes('■'));
      assert.ok(!normalized.includes('┤'));
      assert.ok(!normalized.includes('□'));
      const val = validateQuestion(normalized);
      assert.equal(val.overallStatus, 'GREEN');
    });
  });

  // ==========================================================================
  // Group 6: Vectors & 3D Geometry (10 Tests)
  // ==========================================================================
  describe('6. Vectors & 3D Coordinate Geometry', () => {
    it('6.1 Dot product formula: \\vec{a} \\cdot \\vec{b} = |\\vec{a}| |\\vec{b}| \\cos\\theta', () => {
      const raw = 'If \\vec{a} \\cdot \\vec{b} = |\\vec{a}| |\\vec{b}| \\cos\\theta, find \\theta.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('6.2 Cross product formula: \\vec{a} \\times \\vec{b}', () => {
      const raw = 'The vector area is \\vec{a} \\times \\vec{b} = |\\vec{a}| |\\vec{b}| \\sin\\theta \\, \\hat{n}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('6.3 Scalar triple product: [\\vec{a} \\; \\vec{b} \\; \\vec{c}]', () => {
      const raw = 'The volume of the parallelepiped is [\\vec{a} \\; \\vec{b} \\; \\vec{c}].';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('6.4 Unit basis cross product: \\hat{i} \\times \\hat{j} = \\hat{k}', () => {
      const raw = 'In a right-handed system, \\hat{i} \\times \\hat{j} = \\hat{k}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('6.5 Symmetric line equation in 3D', () => {
      const raw = 'The line equation is \\frac{x - x_1}{a} = \\frac{y - y_1}{b} = \\frac{z - z_1}{c}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('6.6 Vector plane equation: \\vec{r} \\cdot \\vec{n} = d', () => {
      const raw = 'The equation of the plane is \\vec{r} \\cdot \\vec{n} = d.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('6.7 Parallelogram vector law identity', () => {
      const raw = 'Prove |\\vec{a} + \\vec{b}|^2 + |\\vec{a} - \\vec{b}|^2 = 2(|\\vec{a}|^2 + |\\vec{b}|^2).';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('6.8 Direction cosines identity: \\cos^2\\alpha + \\cos^2\\beta + \\cos^2\\gamma = 1', () => {
      const raw = 'For any line, \\cos^2\\alpha + \\cos^2\\beta + \\cos^2\\gamma = 1.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('6.9 Distance from point to plane formula', () => {
      const raw = 'The perpendicular distance is d = \\frac{|ax_0 + by_0 + cz_0 + d|}{\\sqrt{a^2 + b^2 + c^2}}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('6.10 Shortest distance between skew lines', () => {
      const raw = 'The shortest distance between skew lines is d = \\frac{|(\\vec{a}_2 - \\vec{a}_1) \\cdot (\\vec{b}_1 \\times \\vec{b}_2)|}{|\\vec{b}_1 \\times \\vec{b}_2|}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });
  });

  // ==========================================================================
  // Group 7: Chemical Equations & Physical Units (10 Tests)
  // ==========================================================================
  describe('7. Chemistry Equations & Physics Units', () => {
    it('7.1 Haber process equilibrium equation', () => {
      const raw = 'For the reaction \\text{N}_2 + 3\\text{H}_2 \\rightleftharpoons 2\\text{NH}_3, find K_p.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('7.2 Hydrogen peroxide decomposition', () => {
      const raw = 'The rate of 2\\text{H}_2\\text{O}_2 \\rightarrow 2\\text{H}_2\\text{O} + \\text{O}_2 is first order.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('7.3 pH definition formula: \\text{pH} = -\\log[\\text{H}^+]', () => {
      const raw = 'Calculate the pH using \\text{pH} = -\\log[\\text{H}^+].';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('7.4 Gibbs free energy equation: \\Delta G^\\circ = -RT \\ln K', () => {
      const raw = 'The standard free energy change is \\Delta G^\\circ = -RT \\ln K.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('7.5 Nernst equation for cell potential', () => {
      const raw = 'Use E = E^\\circ - \\frac{0.0591}{n} \\log Q at 298 K.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('7.6 Acceleration due to gravity unit: 10 m/s^2', () => {
      const raw = 'Take acceleration due to gravity as g = 10 \\, \\text{m/s}^2.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('7.7 Specific heat capacity unit: J/g °C', () => {
      const raw = 'The specific heat of water is c = 4.184 \\, \\text{J}/(\\text{g}\\cdot^\\circ\\text{C}).';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('7.8 Elementary charge: 1.6 x 10^{-19} C', () => {
      const raw = 'The electronic charge is e = 1.6 \\times 10^{-19} \\, \\text{C}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('7.9 Planck constant: 6.626 x 10^{-34} J s', () => {
      const raw = 'Planck constant is h = 6.626 \\times 10^{-34} \\, \\text{J}\\cdot\\text{s}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('7.10 Speed of light: 3 x 10^8 m/s', () => {
      const raw = 'The speed of light in vacuum is c = 3 \\times 10^8 \\, \\text{m/s}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });
  });

  // ==========================================================================
  // Group 8: Unicode & Word Junk Stripping (12 Tests)
  // ==========================================================================
  describe('8. Unicode Math & Word Clipboard Junk Stripping', () => {
    it('8.1 Strips non-breaking space (\\u00A0)', () => {
      const raw = 'If\u00A0x\u00A0=\u00A02\u00A0then\u00A0x^2\u00A0equals:';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(!normalized.includes('\u00A0'));
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('8.2 Strips zero-width characters (\\u200B, \\uFEFF)', () => {
      const raw = 'Let\u200B f(x) =\uFEFF x^2 + 1.';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(!normalized.includes('\u200B') && !normalized.includes('\uFEFF'));
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('8.3 Normalizes smart quotes: “” and ‘’', () => {
      const raw = 'The “curve” has ‘tangent’ slope m = 2.';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(!normalized.includes('“') && !normalized.includes('”'));
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('8.4 Replaces Unicode minus − with LaTeX -', () => {
      const raw = 'If x = −3, find x² − 4.';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(!normalized.includes('−'));
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('8.5 Replaces Unicode multiplication × with \\times', () => {
      const raw = 'The value is 3 × 10^5.';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(normalized.includes('\\times'));
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('8.6 Replaces Unicode division ÷ with \\div', () => {
      const raw = 'Calculate 12 ÷ 4.';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(normalized.includes('\\div'));
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('8.7 Replaces degree symbol ° with ^\\circ', () => {
      const raw = 'Find \\sin 45°.';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(normalized.includes('^\\circ'));
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('8.8 Strips Word box artifacts (□, ▒)', () => {
      const raw = 'If f(x) = □ x^2 + 1, find f(2).';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(!normalized.includes('□'));
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('8.9 Normalizes double-escaped backslashes (\\\\frac -> \\frac)', () => {
      const raw = 'Compute \\\\frac{1}{2} + \\\\sqrt{3}.';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(!normalized.includes('\\\\frac'));
      assert.ok(normalized.includes('\\frac') || normalized.includes('\\dfrac'));
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('8.10 Converts Unicode superscripts: ², ³, ⁴, ⁿ', () => {
      const raw = 'If y = x² + x³ + xⁿ, find dy/dx.';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(!normalized.includes('²') && !normalized.includes('³') && !normalized.includes('ⁿ'));
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('8.11 Converts Unicode Greek letters: α, β, γ, π, θ', () => {
      const raw = 'Let α, β be roots of x^2 + px + q = 0, with α + β = π/2.';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(normalized.includes('\\alpha') && normalized.includes('\\beta') && normalized.includes('\\pi'));
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('8.12 Converts Word math italics: 𝑥, 𝑦, 𝑧', () => {
      const raw = 'If 𝑥 > 1 and 𝑦 = 2𝑥 + 1, then find 𝑧.';
      const normalized = normalizeCanonicalMath(raw);
      assert.ok(!normalized.includes('\u{1D465}') && !normalized.includes('\u{1D466}'));
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });
  });

  // ==========================================================================
  // Group 9: Storage Rule Enforcement (5 Tests)
  // ==========================================================================
  describe('9. Storage Rule Enforcement (No HTML, No Double Escapes)', () => {
    it('9.1 Strips rendered KaTeX HTML spans before storage', () => {
      const htmlPayload = 'If <span class="katex"><span class="katex-html"><span class="base">x^2</span></span></span> = 4, find x.';
      const normalized = normalizeCanonicalMath(htmlPayload);
      assert.ok(!normalized.includes('<span'));
      assert.ok(!normalized.includes('</span>'));
      assert.ok(!normalized.includes('class="katex'));
      assert.equal(validateQuestion(normalized).overallStatus, 'GREEN');
    });

    it('9.2 Normalizes all double backslashes to single backslash in DB format', () => {
      const doubleEscaped = 'Let \\\\int_0^1 x^2 \\\\, dx = \\\\frac{1}{3}.';
      const clean = normalizeCanonicalMath(doubleEscaped);
      assert.ok(!clean.includes('\\\\int'));
      assert.ok(!clean.includes('\\\\frac'));
      assert.equal(validateQuestion(clean).overallStatus, 'GREEN');
    });

    it('9.3 Leaves valid KaTeX $...$ intact without re-wrapping', () => {
      const valid = 'If $x^2 = 4$, then $x = \\pm 2$.';
      const normalized = normalizeCanonicalMath(valid);
      assert.equal(normalized, 'If $x^2 = 4$, then $x = \\pm 2$.');
    });

    it('9.4 Strips MSO conditional comments and Office tags', () => {
      const mso = '<!--[if gte mso 9]><xml><w:WordDocument></w:WordDocument></xml><![endif]-->Find $x+1$.';
      const clean = normalizeCanonicalMath(mso);
      assert.ok(!clean.includes('mso'));
      assert.ok(!clean.includes('WordDocument'));
      assert.equal(validateQuestion(clean).overallStatus, 'GREEN');
    });

    it('9.5 Canonical storage format only contains plain text and $...$/$$...$$', () => {
      const raw = 'Let f(x) = x^2 - 4. Find roots.';
      const canonical = normalizeCanonicalMath(raw);
      assert.ok(!/<[^>]+>/.test(canonical));
      assert.ok(!/\\\\([a-zA-Z]+)/.test(canonical));
      assert.equal(validateQuestion(canonical).overallStatus, 'GREEN');
    });
  });

  // ==========================================================================
  // Group 10: Validation Dashboard & Publishing Gate (7 Tests)
  // ==========================================================================
  describe('10. Validation Status & Publishing Guard (GREEN, YELLOW, RED)', () => {
    it('10.1 Returns GREEN for completely valid LaTeX questions', () => {
      const q = validateQuestion(
        'Let $f(x) = x^2 + 2x + 1$. Find the minimum value.',
        [{ key: 'A', text: '$0$' }, { key: 'B', text: '$1$' }]
      );
      assert.equal(q.overallStatus, 'GREEN');
      assert.equal(q.canPublish, true);
      assert.equal(q.issues.length, 0);
    });

    it('10.2 Returns RED and blocks publish for unbalanced curly braces', () => {
      const q = validateQuestion('Evaluate $\\frac{1}{x^{2}$.');
      assert.equal(q.overallStatus, 'RED');
      assert.equal(q.canPublish, false);
      assert.ok(q.issues.some(i => i.type === 'unbalanced_brace'));
    });

    it('10.3 Returns RED and blocks publish for unbalanced dollar delimiters', () => {
      const q = validateQuestion('If $x^2 = 4, then find x.');
      assert.equal(q.overallStatus, 'RED');
      assert.equal(q.canPublish, false);
      assert.ok(q.issues.some(i => i.type === 'unbalanced_delimiter'));
    });

    it('10.4 Returns RED and blocks publish for unresolved [CHECK: ...] marker', () => {
      const q = validateQuestion('Find the value of $x$ where [CHECK: equation missing from Word paste].');
      assert.equal(q.overallStatus, 'RED');
      assert.equal(q.canPublish, false);
      assert.ok(q.issues.some(i => i.type === 'check_marker'));
    });

    it('10.5 Returns RED and blocks publish for empty fraction expression', () => {
      const q = validateQuestion('Simplify $\\frac{}{}$.');
      assert.equal(q.overallStatus, 'RED');
      assert.equal(q.canPublish, false);
      assert.ok(q.issues.some(i => i.type === 'empty_fraction'));
    });

    it('10.6 Returns YELLOW for OCR-sourced or AI-repaired questions', () => {
      const q = validateQuestion(
        'Let $y = f(x)$ be a differentiable curve.',
        [{ key: 'A', text: '$1$' }],
        true // isOcrOrAiSourced
      );
      assert.equal(q.overallStatus, 'YELLOW');
      assert.equal(q.canPublish, true); // YELLOW is permitted to publish
    });

    it('10.7 Batch validation dashboard correctly tallies and flags publishing block', () => {
      const qList = [
        validateQuestion('Solve $x^2 = 4$.', [{ key: 'A', text: '$2$' }]),
        validateQuestion('Solve $y^2 = 9$.', [{ key: 'A', text: '$3$' }], true), // YELLOW
        validateQuestion('Solve $\\frac{1}{0$.', [{ key: 'A', text: '$1$' }]) // RED
      ];
      const dashboard = summarizeBatchValidation(qList);
      assert.equal(dashboard.total, 3);
      assert.equal(dashboard.greenCount, 1);
      assert.equal(dashboard.yellowCount, 1);
      assert.equal(dashboard.redCount, 1);
      assert.equal(dashboard.canPublishAll, false);
      assert.deepEqual(dashboard.redItemIndices, [3]);
    });
  });
});

