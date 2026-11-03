/**
 * Comprehensive Mathematical Regression Test Suite
 * Tests all 15 JEE examination math categories to ensure 100% reliable conversion.
 */
import { normalizeMathInText } from '../src/utils/pdfQuestionExtractor.js';

interface TestCase {
  category: string;
  input: string;
  expectPatterns: RegExp[];
}

const testCases: TestCase[] = [
  {
    category: '1. Simple fractions',
    input: 'Find the value of \\frac{3}{4} + \\frac{1}{2}.',
    expectPatterns: [/\\frac\{3\}\{4\}/, /\\frac\{1\}\{2\}/]
  },
  {
    category: '2. Nested fractions',
    input: 'Evaluate \\frac{1}{1 + \\frac{1}{x}} as x approaches infinity.',
    expectPatterns: [/\\frac\{1\}\{1 \+ \\frac\{1\}\{x\}\}/]
  },
  {
    category: '3. Square roots & radicals',
    input: 'Let f(x) = \\sqrt(x^2 + 1) be defined on R.',
    expectPatterns: [/\\sqrt\{x\^2 \+ 1\}/]
  },
  {
    category: '4. Limits (with lower bounds & arrows)',
    input: 'Calculate {lim}_{r \\to x} \\frac{r^2 - x^2}{r - x}.',
    expectPatterns: [/\\lim_\{r \\to x\}/]
  },
  {
    category: '5. Superscripts and subscripts (e^a & nested powers)',
    input: 'Then the value of ea, such that f(a) = 0 and x^(2) + y^(3) = 1.',
    expectPatterns: [/\$e\^\{a\}\$/, /x\^\{2\}/, /y\^\{3\}/]
  },
  {
    category: '6. Integrals (definite & multiline)',
    input: 'Find ∫ 0^1 x^2 dx and \\int_{-\\frac{\\pi}{4}}^{\\frac{\\pi}{4}} \\cot(x) dx.',
    expectPatterns: [/\\int/, /\\cot\(x\)/]
  },
  {
    category: '7. Summations',
    input: 'Compute \\sum_{k=1}^n \\frac{1}{k(k+1)}.',
    expectPatterns: [/\\sum_\{k=1\}\^n/]
  },
  {
    category: '8. Piecewise functions & brackets',
    input: 'Let f(x) = \\begin{cases} x & x > 0 \\\\ -x & x \\le 0 \\end{cases}.',
    expectPatterns: [/\\begin\{cases\}/, /\\end\{cases\}/]
  },
  {
    category: '9. Matrices (preserving column ampersands & rows)',
    input: 'Let A = \\begin{bmatrix} 1 & 3 \\\\ 2 & 1 \\end{bmatrix}.',
    expectPatterns: [/\\begin\{bmatrix\} 1 & 3 \\\\ 2 & 1 \\end\{bmatrix\}/]
  },
  {
    category: '10. Greatest integer / Floor / Modulus',
    input: 'If [x] denotes the greatest integer function, find [2.7] + |x - 1|.',
    expectPatterns: [/\[x\]/, /\[2\.7\]/]
  },
  {
    category: '11. Equations in options (A, B, C, D)',
    input: '(A) \\frac{\\pi}{4}  (B) \\frac{\\pi}{2}  (C) 1  (D) 0',
    expectPatterns: [/\\frac\{\\pi\}\{4\}/, /\\frac\{\\pi\}\{2\}/]
  },
  {
    category: '12. Mixed Hindi/English text preservation',
    input: 'यदि f(x) सतत है और (If f(x) is continuous), then find the value of f(0).',
    expectPatterns: [/यदि f\(x\) सतत है/]
  },
  {
    category: '13. Multiple equations in one statement',
    input: 'Let f(x) = x^2 and g(x) = 2x + 1. If f(g(x)) = 9, find x.',
    expectPatterns: [/f\(x\)/, /g\(x\)/, /f\(g\(x\)\)/]
  },
  {
    category: '14. Image-based equations placeholder',
    input: '[EQUATION_IMAGE: diagram_01.png] The circuit diagram shows...',
    expectPatterns: [/EQUATION_IMAGE/]
  },
  {
    category: '15. Corrupted JEE Question (User Benchmark Sample)',
    input: 'Let f(x) = \\sqrt(\\lim_{\\vec{r}x} {\\frac{2r^{2} [( $f(r))^{2}f(x)f(r)]}{r^{2} - x^{2}}^{3} e^(\\frac{f(r)}{r})))$ be differentiable in (-\\infty, 8) \\cup $10, \\infty )$ and $f(1) = 15$. Then the value of ea, such that f(a) 0$, is equal to. ( )',
    expectPatterns: [
      /\\lim_\{r \\to x\}/,
      /\$e\^\{a\}\$/,
      /f\(a\) = 0/,
      /\\cup\s*\(10,\s*\\infty\)/,
      /\\sqrt\{/
    ]
  }
];

console.log('=== RUNNING JEE MATHEMATICS 15-CATEGORY REGRESSION TEST SUITE ===\n');

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const normalized = normalizeMathInText(tc.input);
  let ok = true;
  for (const pat of tc.expectPatterns) {
    if (!pat.test(normalized)) {
      ok = false;
      console.error(`[FAIL] ${tc.category}`);
      console.error(`  Expected pattern: ${pat}`);
      console.error(`  Normalized output: ${normalized}`);
      break;
    }
  }

  if (ok) {
    passed++;
    console.log(`[PASS] ${tc.category}`);
  } else {
    failed++;
  }
}

console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${testCases.length}) ===`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL 15 MATHEMATICAL REGRESSION CATEGORIES VERIFIED 100% PASS!');
  process.exit(0);
}

