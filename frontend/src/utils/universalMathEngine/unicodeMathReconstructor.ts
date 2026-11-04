/**
 * Unicode Mathematical Reconstruction Layer (Layer C)
 * Reconstructs mathematical Unicode superscripts, subscripts, Greek letters,
 * calculus operators, relational symbols, and cleans invisible formatting tokens.
 */

// Mapping for superscript characters
const SUPERSCRIPT_MAP: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')',
  'ⁿ': 'n', 'ⁱ': 'i', 'ᵃ': 'a', 'ᵇ': 'b', 'ᶜ': 'c',
  'ᵈ': 'd', 'ᵉ': 'e', 'ᶠ': 'f', 'ᵍ': 'g', 'ʰ': 'h',
  'ʲ': 'j', 'ᵏ': 'k', 'ˡ': 'l', 'ᵐ': 'm', 'ᵒ': 'o',
  'ᵖ': 'p', 'ʳ': 'r', 'ˢ': 's', 'ᵗ': 't', 'ᵘ': 'u',
  'ᵛ': 'v', 'ʷ': 'w', 'ˣ': 'x', 'ʸ': 'y', 'ᶻ': 'z'
};

// Mapping for subscript characters
const SUBSCRIPT_MAP: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  '₊': '+', '₋': '-', '₌': '=', '₍': '(', '₎': ')',
  'ₐ': 'a', 'ₑ': 'e', 'ₕ': 'h', 'ᵢ': 'i', 'ⱼ': 'j',
  'ₖ': 'k', 'ₗ': 'l', 'ₘ': 'm', 'ₙ': 'n', 'ₒ': 'o',
  'ₚ': 'p', 'ᵣ': 'r', 'ₛ': 's', 'ₜ': 't', 'ᵤ': 'u',
  'ᵥ': 'v', 'ₓ': 'x'
};

// Mapping for Greek letters
export const GREEK_LATEX_MAP: Record<string, string> = {
  'α': '\\alpha', 'Α': 'A',
  'β': '\\beta', 'Β': 'B',
  'γ': '\\gamma', 'Γ': '\\Gamma',
  'δ': '\\delta', 'Δ': '\\Delta',
  'ε': '\\epsilon', 'ϵ': '\\varepsilon',
  'ζ': '\\zeta',
  'η': '\\eta',
  'θ': '\\theta', 'ϑ': '\\vartheta', 'Θ': '\\Theta',
  'ι': '\\iota',
  'κ': '\\kappa',
  'λ': '\\lambda', 'Λ': '\\Lambda',
  'μ': '\\mu',
  'ν': '\\nu',
  'ξ': '\\xi', 'Ξ': '\\Xi',
  'π': '\\pi', 'Π': '\\Pi', '𝜋': '\\pi',
  'ρ': '\\rho', 'ϱ': '\\varrho',
  'σ': '\\sigma', 'Σ': '\\Sigma',
  'τ': '\\tau',
  'υ': '\\upsilon',
  'ϕ': '\\phi', 'φ': '\\varphi', 'Φ': '\\Phi',
  'χ': '\\chi',
  'ψ': '\\psi', 'Ψ': '\\Psi',
  'ω': '\\omega', 'Ω': '\\Omega'
};

// Mapping for relational and operational symbols
export const OPERATOR_LATEX_MAP: Record<string, string> = {
  '→': '\\to ',
  '⟶': '\\to ',
  '←': '\\leftarrow ',
  '↔': '\\leftrightarrow ',
  '⇒': '\\implies ',
  '⇔': '\\iff ',
  '∈': '\\in ',
  '∉': '\\notin ',
  '⊂': '\\subset ',
  '⊆': '\\subseteq ',
  '∪': '\\cup ',
  '∩': '\\cap ',
  '≤': '\\leq ',
  '≥': '\\geq ',
  '⩽': '\\leq ',
  '⩾': '\\geq ',
  '≠': '\\neq ',
  '≈': '\\approx ',
  '≡': '\\equiv ',
  '±': '\\pm ',
  '∓': '\\mp ',
  '×': '\\times ',
  '÷': '\\div ',
  '⋅': '\\cdot ',
  '·': '\\cdot ',
  '∙': '\\cdot ',
  '⋯': '\\dots ',
  '…': '\\dots ',
  '∞': '\\infty ',
  '∂': '\\partial ',
  '∇': '\\nabla ',
  '∀': '\\forall ',
  '∃': '\\exists ',
  '∅': '\\emptyset ',
  'ℝ': '\\mathbb{R}',
  'ℤ': '\\mathbb{Z}',
  'ℕ': '\\mathbb{N}',
  'ℚ': '\\mathbb{Q}',
  'ℂ': '\\mathbb{C}'
};

/**
 * Strips zero-width and invisible Word equation formatting artifacts
 */
export function cleanInvisibleCharacters(text: string): string {
  if (!text) return '';
  return text
    // Strip zero-width & invisible format characters:
    // U+200B (ZWSP), U+200C (ZWNJ), U+200D (ZWJ), U+200E (LRM), U+200F (RLM), U+FEFF (BOM), U+2060 (WJ)
    // U+2061 (FUNCTION APPLICATION), U+2062 (INVISIBLE TIMES), U+2063 (INVISIBLE SEPARATOR), U+2064 (INVISIBLE PLUS)
    .replace(/[\u200B\u200C\u200D\u200E\u200F\uFEFF\u2060\u2061\u2062\u2063\u2064\uFFF9-\uFFFD]/g, '')
    // Normalize hair space (U+200A), thin space (U+2009), narrow non-breaking space (U+202F), non-breaking space (U+00A0)
    .replace(/[\u200A\u2009\u202F\u00A0]/g, ' ')
    // Normalize typographical quotes and dashes
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2212\u2013\u2014]/g, '-');
}

/**
 * Normalizes mathematical bold and italic Unicode alphabetic symbols into standard ASCII letters
 */
export function normalizeMathAlphabets(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u{1D451}\u{1D41D}\u{1D485}]/gu, 'd')
    .replace(/[\u{1D465}\u{1D431}\u{1D499}]/gu, 'x')
    .replace(/[\u{1D466}\u{1D432}\u{1D49A}]/gu, 'y')
    .replace(/[\u{1D467}\u{1D433}\u{1D49B}]/gu, 'z')
    .replace(/[\u{1D461}\u{1D42D}\u{1D495}]/gu, 't')
    .replace(/[\u{1D453}\u{1D41F}\u{1D487}]/gu, 'f')
    .replace(/[\u{1D44E}\u{1D41A}\u{1D482}]/gu, 'a')
    .replace(/[\u{1D44F}\u{1D41B}\u{1D483}]/gu, 'b')
    .replace(/[\u{1D450}\u{1D41C}\u{1D484}]/gu, 'c')
    .replace(/[\u{1D45B}\u{1D427}\u{1D48F}]/gu, 'n')
    .replace(/[\u{1D45F}\u{1D42B}\u{1D493}]/gu, 'r');
}

/**
 * Reconstructs Unicode superscripts:
 * e.g. x² + y³ -> x^2 + y^3
 * e.g. i² -> i^2
 * e.g. x¹² -> x^{12}
 * e.g. 2ⁿ -> 2^n
 */
export function reconstructUnicodeSuperscripts(text: string): string {
  if (!text) return '';
  const superChars = Object.keys(SUPERSCRIPT_MAP).join('');
  const superRegex = new RegExp(`([0-9a-zA-Z\\)\\}\\]])([${superChars}]+)`, 'g');

  return text.replace(superRegex, (_match, base, supStr) => {
    let mapped = '';
    for (const ch of supStr) {
      mapped += SUPERSCRIPT_MAP[ch] || ch;
    }
    if (mapped.length === 1) {
      return `${base}^${mapped}`;
    }
    return `${base}^{${mapped}}`;
  });
}

/**
 * Reconstructs Unicode subscripts:
 * e.g. x₁ + x₂ -> x_1 + x_2
 * e.g. aᵢ -> a_i
 * e.g. x₁₂ -> x_{12}
 */
export function reconstructUnicodeSubscripts(text: string): string {
  if (!text) return '';
  const subChars = Object.keys(SUBSCRIPT_MAP).join('');
  const subRegex = new RegExp(`([0-9a-zA-Z\\)\\}\\]])([${subChars}]+)`, 'g');

  return text.replace(subRegex, (_match, base, subStr) => {
    let mapped = '';
    for (const ch of subStr) {
      mapped += SUBSCRIPT_MAP[ch] || ch;
    }
    if (mapped.length === 1) {
      return `${base}_${mapped}`;
    }
    return `${base}_{${mapped}}`;
  });
}

/**
 * Reconstructs Greek letters and math operators, with care not to break existing LaTeX command names
 */
export function reconstructGreekAndOperators(text: string): string {
  if (!text) return '';
  let s = text;

  // Replace Greek letters with safe spacing so \pi followed by x becomes \pi x
  for (const [char, latex] of Object.entries(GREEK_LATEX_MAP)) {
    if (s.includes(char)) {
      const regex = new RegExp(char + '(?=[a-zA-Z0-9])', 'g');
      s = s.replace(regex, `${latex} `);
      s = s.split(char).join(latex);
    }
  }

  // Replace Operators
  for (const [char, latex] of Object.entries(OPERATOR_LATEX_MAP)) {
    if (s.includes(char)) {
      s = s.split(char).join(latex);
    }
  }

  // Standardize sets e.g. where α,β∈Z -> where \alpha,\beta \in \mathbb{Z}
  s = s.replace(/\\in\s*(?:Z|\\mathbb\{Z\})\b/g, '\\in \\mathbb{Z}');
  s = s.replace(/\\in\s*(?:R|\\mathbb\{R\})\b/g, '\\in \\mathbb{R}');

  return s;
}

/**
 * Main entrance for Layer C Unicode reconstruction
 */
export function reconstructUnicodeMath(text: string): string {
  if (!text) return '';

  let s = cleanInvisibleCharacters(text);
  s = normalizeMathAlphabets(s);
  s = reconstructUnicodeSuperscripts(s);
  s = reconstructUnicodeSubscripts(s);
  s = reconstructGreekAndOperators(s);

  return s;
}
