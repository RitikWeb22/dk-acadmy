export interface MathToolbarItem {
  label: string;
  template: string;
  description: string;
  cursorOffset?: number; // Cursor position relative to insertion
}

export interface MathToolbarCategory {
  name: string;
  items: MathToolbarItem[];
}

export const JEE_MATH_TOOLBAR: MathToolbarCategory[] = [
  {
    name: 'Algebra',
    items: [
      { label: 'a/b', template: '\\frac{a}{b}', description: 'Fraction' },
      { label: 'x²', template: 'x^{2}', description: 'Power / Superscript' },
      { label: 'xₙ', template: 'x_{n}', description: 'Subscript' },
      { label: '√x', template: '\\sqrt{x}', description: 'Square Root' },
      { label: 'ⁿ√x', template: '\\sqrt[n]{x}', description: 'nth Root' },
      { label: '[x]', template: '[x]', description: 'Greatest Integer Function' },
      { label: '⌊x⌋', template: '\\lfloor x \\rfloor', description: 'Floor Function' },
      { label: '⌈x⌉', template: '\\lceil x \\rceil', description: 'Ceiling Function' },
      { label: '|x|', template: '|x|', description: 'Absolute Value' },
      { label: 'log_e', template: '\\log_e(x)', description: 'Natural Log' },
      { label: 'ln', template: '\\ln(x)', description: 'Log Natural' }
    ]
  },
  {
    name: 'Calculus',
    items: [
      { label: '∫ dx', template: '\\int f(x)\\,dx', description: 'Indefinite Integral' },
      { label: '∫ₐᵇ', template: '\\int_{a}^{b} f(x)\\,dx', description: 'Definite Integral' },
      { label: '∬', template: '\\iint_{D} f(x,y)\\,dx\\,dy', description: 'Double Integral' },
      { label: 'lim', template: '\\lim_{x \\to 0} f(x)', description: 'Limit' },
      { label: 'lim_{n→∞}', template: '\\lim_{n \\to \\infty} a_n', description: 'Limit at Infinity' },
      { label: '∑', template: '\\sum_{i=1}^{n} a_i', description: 'Summation' },
      { label: '∏', template: '\\prod_{i=1}^{n} a_i', description: 'Product' },
      { label: 'dy/dx', template: '\\frac{dy}{dx}', description: 'First Derivative' },
      { label: 'd²y/dx²', template: '\\frac{d^2y}{dx^2}', description: 'Second Derivative' },
      { label: '∂f/∂x', template: '\\frac{\\partial f}{\\partial x}', description: 'Partial Derivative' }
    ]
  },
  {
    name: 'Matrices & Cases',
    items: [
      {
        label: 'Cases f(x)',
        template: '\n$$\nf(x) = \\begin{cases}\n  e^{\\min(x^2, x-[x])}, & x \\in [0, 1) \\\\\n  e^{[x - \\ln x]}, & x \\in [1, 2]\n\\end{cases}\n$$\n',
        description: 'Piecewise Function'
      },
      {
        label: '[Matrix 3×3]',
        template: '\n$$\nA = \\begin{bmatrix}\n  1 & 2 & 3 \\\\\n  4 & 5 & 6 \\\\\n  7 & 8 & 9\n\\end{bmatrix}\n$$\n',
        description: '3×3 Bracket Matrix'
      },
      {
        label: '|Det 3×3|',
        template: '\n$$\n\\begin{vmatrix}\n  a & b & c \\\\\n  d & e & f \\\\\n  g & h & i\n\\end{vmatrix}\n$$\n',
        description: '3×3 Determinant'
      },
      {
        label: '(Matrix 2×2)',
        template: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
        description: '2×2 Parentheses Matrix'
      },
      {
        label: 'Aligned Eq',
        template: '\n$$\n\\begin{aligned}\n  2x + 3y &= 7 \\\\\n  x - y &= 1\n\\end{aligned}\n$$\n',
        description: 'Aligned System of Equations'
      }
    ]
  },
  {
    name: 'Vectors',
    items: [
      { label: 'a⃗', template: '\\vec{a}', description: 'Vector a' },
      { label: 'b⃗', template: '\\vec{b}', description: 'Vector b' },
      { label: 'î + ĵ + k̂', template: 'x\\hat{i} + y\\hat{j} + z\\hat{k}', description: 'Standard Cartesian Basis' },
      { label: 'a⃗ · b⃗', template: '\\vec{a} \\cdot \\vec{b}', description: 'Scalar Dot Product' },
      { label: 'a⃗ × b⃗', template: '\\vec{a} \\times \\vec{b}', description: 'Vector Cross Product' },
      {
        label: 'Det Cross',
        template: '\n$$\n\\vec{a} \\times \\vec{b} = \\begin{vmatrix}\n  \\hat{i} & \\hat{j} & \\hat{k} \\\\\n  a_1 & a_2 & a_3 \\\\\n  b_1 & b_2 & b_3\n\\end{vmatrix}\n$$\n',
        description: 'Determinant Form of Cross Product'
      },
      { label: '[a⃗ b⃗ c⃗]', template: '[\\vec{a}\\; \\vec{b}\\; \\vec{c}]', description: 'Scalar Triple Product' }
    ]
  },
  {
    name: 'Symbols & Greek',
    items: [
      { label: 'α', template: '\\alpha', description: 'alpha' },
      { label: 'β', template: '\\beta', description: 'beta' },
      { label: 'γ', template: '\\gamma', description: 'gamma' },
      { label: 'θ', template: '\\theta', description: 'theta' },
      { label: 'λ', template: '\\lambda', description: 'lambda' },
      { label: 'π', template: '\\pi', description: 'pi' },
      { label: 'σ', template: '\\sigma', description: 'sigma' },
      { label: 'ω', template: '\\omega', description: 'omega' },
      { label: 'Δ', template: '\\Delta', description: 'Delta' },
      { label: '∈', template: '\\in', description: 'Element of' },
      { label: '∉', template: '\\notin', description: 'Not element of' },
      { label: '⊂', template: '\\subset', description: 'Subset' },
      { label: '⊆', template: '\\subseteq', description: 'Subset or equal' },
      { label: '∪', template: '\\cup', description: 'Union' },
      { label: '∩', template: '\\cap', description: 'Intersection' },
      { label: '→', template: '\\to', description: 'Tends to / Maps to' },
      { label: '⇒', template: '\\implies', description: 'Implies' },
      { label: '⇔', template: '\\iff', description: 'If and only if' },
      { label: '∞', template: '\\infty', description: 'Infinity' },
      { label: '±', template: '\\pm', description: 'Plus or minus' },
      { label: '≠', template: '\\neq', description: 'Not equal' },
      { label: '≤', template: '\\le', description: 'Less than or equal' },
      { label: '≥', template: '\\ge', description: 'Greater than or equal' },
      { label: 'ℝ', template: '\\mathbb{R}', description: 'Real Numbers' },
      { label: 'ℂ', template: '\\mathbb{C}', description: 'Complex Numbers' }
    ]
  }
];

