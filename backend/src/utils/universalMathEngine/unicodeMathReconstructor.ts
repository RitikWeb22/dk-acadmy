/**
 * Unicode Mathematical Reconstruction Layer (Layer C)
 *
 * Pipeline (order matters):
 *   1. cleanInvisibleCharacters   – strip/translate invisible Word-equation tokens
 *   2. normalizeMathAlphabets     – U+1D400–1D7FF bold/italic/script/... -> ASCII / Greek / \mathcal etc.
 *   3. reconstructGreekAndOperators – Greek + operators -> LaTeX (before scripts, so π², ℝⁿ work)
 *   4. reconstructUnicodeScripts  – super/subscript runs -> ^{..}_{..} in a single pass
 *   5. reconstructRadicals        – √ ∛ ∜ -> \sqrt{...}
 */

export interface ReconstructOptions {
  /** Rewrite `\in Z` / `\in R` (also \notin, \subset, \subseteq) to \mathbb{Z} / \mathbb{R}. Default: true */
  numberSets?: boolean;
}

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* -------------------------------------------------------------------------- */
/*  Script maps                                                               */
/* -------------------------------------------------------------------------- */

const SUPERSCRIPT_MAP: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')',
  'ⁿ': 'n', 'ⁱ': 'i', 'ᵃ': 'a', 'ᵇ': 'b', 'ᶜ': 'c',
  'ᵈ': 'd', 'ᵉ': 'e', 'ᶠ': 'f', 'ᵍ': 'g', 'ʰ': 'h',
  'ʲ': 'j', 'ᵏ': 'k', 'ˡ': 'l', 'ᵐ': 'm', 'ᵒ': 'o',
  'ᵖ': 'p', 'ʳ': 'r', 'ˢ': 's', 'ᵗ': 't', 'ᵘ': 'u',
  'ᵛ': 'v', 'ʷ': 'w', 'ˣ': 'x', 'ʸ': 'y', 'ᶻ': 'z',
  // superscript Greek
  'ᵝ': '\\beta', 'ᵞ': '\\gamma', 'ᵟ': '\\delta', 'ᵋ': '\\varepsilon',
  'ᶿ': '\\theta', 'ᵠ': '\\varphi', 'ᵡ': '\\chi'
};

const SUBSCRIPT_MAP: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  '₊': '+', '₋': '-', '₌': '=', '₍': '(', '₎': ')',
  'ₐ': 'a', 'ₑ': 'e', 'ₕ': 'h', 'ᵢ': 'i', 'ⱼ': 'j',
  'ₖ': 'k', 'ₗ': 'l', 'ₘ': 'm', 'ₙ': 'n', 'ₒ': 'o',
  'ₚ': 'p', 'ᵣ': 'r', 'ₛ': 's', 'ₜ': 't', 'ᵤ': 'u',
  'ᵥ': 'v', 'ₓ': 'x',
  // subscript Greek
  'ᵦ': '\\beta', 'ᵧ': '\\gamma', 'ᵨ': '\\rho', 'ᵩ': '\\varphi', 'ᵪ': '\\chi'
};

/* -------------------------------------------------------------------------- */
/*  Greek + operator maps (exported for compatibility)                        */
/* -------------------------------------------------------------------------- */

export const GREEK_LATEX_MAP: Record<string, string> = {
  'Α': 'A', 'α': '\\alpha',
  'Β': 'B', 'β': '\\beta',
  'Γ': '\\Gamma', 'γ': '\\gamma',
  'Δ': '\\Delta', '∆': '\\Delta', 'δ': '\\delta',
  'Ε': 'E', 'ε': '\\varepsilon', 'ϵ': '\\epsilon',
  'Ζ': 'Z', 'ζ': '\\zeta',
  'Η': 'H', 'η': '\\eta',
  'Θ': '\\Theta', 'ϴ': '\\Theta', 'θ': '\\theta', 'ϑ': '\\vartheta',
  'Ι': 'I', 'ι': '\\iota',
  'Κ': 'K', 'κ': '\\kappa', 'ϰ': '\\varkappa',
  'Λ': '\\Lambda', 'λ': '\\lambda',
  'Μ': 'M', 'μ': '\\mu', 'µ': '\\mu',
  'Ν': 'N', 'ν': '\\nu',
  'Ξ': '\\Xi', 'ξ': '\\xi',
  'Ο': 'O', 'ο': 'o',
  'Π': '\\Pi', 'π': '\\pi', '𝜋': '\\pi', 'ϖ': '\\varpi',
  'Ρ': 'P', 'ρ': '\\rho', 'ϱ': '\\varrho',
  'Σ': '\\Sigma', 'σ': '\\sigma', 'ς': '\\varsigma',
  'Τ': 'T', 'τ': '\\tau',
  'Υ': '\\Upsilon', 'υ': '\\upsilon',
  'Φ': '\\Phi', 'ϕ': '\\phi', 'φ': '\\varphi',
  'Χ': 'X', 'χ': '\\chi',
  'Ψ': '\\Psi', 'ψ': '\\psi',
  'Ω': '\\Omega', '\u2126': '\\Omega', 'ω': '\\omega'
};

export const OPERATOR_LATEX_MAP: Record<string, string> = {
  // arrows / logic
  '→': '\\to', '⟶': '\\to', '←': '\\leftarrow', '↔': '\\leftrightarrow',
  '↦': '\\mapsto', '⇒': '\\implies', '⟹': '\\implies', '⇔': '\\iff', '⟺': '\\iff',
  '⟸': '\\impliedby', '↑': '\\uparrow', '↓': '\\downarrow',
  '∀': '\\forall', '∃': '\\exists', '¬': '\\neg', '∧': '\\land', '∨': '\\lor',
  '∴': '\\therefore', '∵': '\\because', '⊢': '\\vdash', '⊨': '\\models',
  // sets
  '∈': '\\in', '∉': '\\notin', '∋': '\\ni',
  '⊂': '\\subset', '⊆': '\\subseteq', '⊃': '\\supset', '⊇': '\\supseteq',
  '⊄': '\\not\\subset', '⊊': '\\subsetneq', '∖': '\\setminus',
  '∪': '\\cup', '∩': '\\cap', '⋃': '\\bigcup', '⋂': '\\bigcap', '∅': '\\emptyset',
  // relations
  '≤': '\\leq', '≥': '\\geq', '⩽': '\\leq', '⩾': '\\geq',
  '≠': '\\neq', '≈': '\\approx', '≡': '\\equiv', '≅': '\\cong',
  '≃': '\\simeq', '∼': '\\sim', '∝': '\\propto', '≪': '\\ll', '≫': '\\gg',
  '⊥': '\\perp', '∥': '\\parallel', '∣': '\\mid', '‖': '\\|',
  // arithmetic
  '±': '\\pm', '∓': '\\mp', '×': '\\times', '÷': '\\div',
  '⋅': '\\cdot', '·': '\\cdot', '∙': '\\cdot', '∘': '\\circ', '∗': '\\ast',
  '⊕': '\\oplus', '⊗': '\\otimes', '°': '^\\circ',
  // dots
  '⋯': '\\cdots', '…': '\\dots', '⋮': '\\vdots', '⋱': '\\ddots',
  // calculus / big operators (no trailing space so ∑ᵢ₌₁ⁿ can attach scripts)
  '∑': '\\sum', '∏': '\\prod', '∐': '\\coprod',
  '∫': '\\int', '∬': '\\iint', '∭': '\\iiint', '∮': '\\oint',
  '∂': '\\partial', '∇': '\\nabla', '∞': '\\infty',
  // brackets
  '⟨': '\\langle', '⟩': '\\rangle', '⌊': '\\lfloor', '⌋': '\\rfloor',
  '⌈': '\\lceil', '⌉': '\\rceil',
  // misc
  '∠': '\\angle', '△': '\\triangle', 'ℓ': '\\ell', 'ℏ': '\\hbar', 'ℵ': '\\aleph',
  'ℜ': '\\Re', 'ℑ': '\\Im',
  // number sets
  'ℝ': '\\mathbb{R}', 'ℤ': '\\mathbb{Z}', 'ℕ': '\\mathbb{N}',
  'ℚ': '\\mathbb{Q}', 'ℂ': '\\mathbb{C}', 'ℍ': '\\mathbb{H}', 'ℙ': '\\mathbb{P}',
  // vulgar fractions
  '½': '\\frac{1}{2}', '⅓': '\\frac{1}{3}', '⅔': '\\frac{2}{3}',
  '¼': '\\frac{1}{4}', '¾': '\\frac{3}{4}'
};

// Merged lookup (values trimmed so spacing is decided contextually, not by the map).
const SYMBOL_MAP = new Map<string, string>();
for (const [k, v] of Object.entries(GREEK_LATEX_MAP)) SYMBOL_MAP.set(k, v.trim());
for (const [k, v] of Object.entries(OPERATOR_LATEX_MAP)) SYMBOL_MAP.set(k, v.trim());

const SYMBOL_RE = new RegExp(
  Array.from(SYMBOL_MAP.keys()).map(escapeRegExp).join('|'),
  'gu'
);

/* -------------------------------------------------------------------------- */
/*  1. Invisible characters                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Strips zero-width / invisible Word equation artifacts, but keeps their meaning:
 *   U+2061 function application  -> space when it separates a name from an argument (sin⁡x -> sin x)
 *   U+2062 invisible times       -> space between two alphanumerics (x⁢y -> x y)
 *   U+2063 invisible separator   -> ","
 *   U+2064 invisible plus        -> "+"  (mixed numbers: 1⁤1/2)
 */
export function cleanInvisibleCharacters(text: string): string {
  if (!text) return '';
  return text
    .replace(/([A-Za-z0-9)}])[\u2061\u2062](?=[A-Za-z0-9\\])/g, '$1 ')
    .replace(/\u2063/g, ',')
    .replace(/\u2064/g, '+')
    // ZWSP, ZWNJ, ZWJ, LRM, RLM, WJ, BOM, function application / times (remaining),
    // soft hyphen, combining grapheme joiner, Mongolian vowel separator, interlinear annotation chars
    .replace(/[\u200B-\u200F\u2060-\u2064\uFEFF\u00AD\u034F\u180E\uFFF9-\uFFFC]/g, '')
    // exotic spaces -> normal space
    .replace(/[\u2000-\u200A\u202F\u205F\u00A0\u3000]/g, ' ')
    // quotes
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    // primes
    .replace(/\u2032/g, "'")
    .replace(/\u2033/g, "''")
    .replace(/\u2034/g, "'''")
    // minus / dashes
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    // fraction slash / division slash
    .replace(/[\u2044\u2215]/g, '/');
}

/* -------------------------------------------------------------------------- */
/*  2. Mathematical alphanumerics (U+1D400–U+1D7FF)                           */
/* -------------------------------------------------------------------------- */

interface LatinBlock { start: number; wrap?: 'mathcal' | 'mathfrak' | 'mathbb'; wrapLower?: boolean }

const LATIN_BLOCKS: LatinBlock[] = [
  { start: 0x1D400 },                                          // bold
  { start: 0x1D434 },                                          // italic
  { start: 0x1D468 },                                          // bold italic
  { start: 0x1D49C, wrap: 'mathcal' },                         // script
  { start: 0x1D4D0, wrap: 'mathcal' },                         // bold script
  { start: 0x1D504, wrap: 'mathfrak', wrapLower: true },       // fraktur
  { start: 0x1D538, wrap: 'mathbb' },                          // double-struck
  { start: 0x1D56C, wrap: 'mathfrak', wrapLower: true },       // bold fraktur
  { start: 0x1D5A0 }, { start: 0x1D5D4 }, { start: 0x1D608 }, { start: 0x1D63C }, // sans variants
  { start: 0x1D670 }                                           // monospace
];

// Each Greek block has 58 code points in this order.
const GREEK_BLOCK_CHARS =
  'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡϴΣΤΥΦΧΨΩ' + '∇' + 'αβγδεζηθικλμνξοπρςστυφχψω' + '∂' + 'ϵϑϰϕϱϖ';
const GREEK_BLOCK_STARTS = [0x1D6A8, 0x1D6E2, 0x1D71C, 0x1D756, 0x1D790];

// Letterlike-symbol "holes" that sit outside the 1D4xx blocks.
const LETTERLIKE_MAP = new Map<string, string>([
  ['ℎ', 'h'], ['ℊ', 'g'], ['ℯ', 'e'], ['ℴ', 'o'],
  ['ℋ', '\\mathcal{H}'], ['ℬ', '\\mathcal{B}'], ['ℰ', '\\mathcal{E}'], ['ℱ', '\\mathcal{F}'],
  ['ℐ', '\\mathcal{I}'], ['ℒ', '\\mathcal{L}'], ['ℳ', '\\mathcal{M}'], ['ℛ', '\\mathcal{R}'],
  ['ℭ', '\\mathfrak{C}'], ['ℌ', '\\mathfrak{H}'], ['ℨ', '\\mathfrak{Z}']
]);

function mapMathCodePoint(ch: string, cp: number): string {
  const ll = LETTERLIKE_MAP.get(ch);
  if (ll !== undefined) return ll;
  if (cp < 0x1D400 || cp > 0x1D7FF) return ch;

  for (const b of LATIN_BLOCKS) {
    if (cp >= b.start && cp < b.start + 52) {
      const i = cp - b.start;
      const upper = i < 26;
      const letter = String.fromCharCode((upper ? 65 + i : 97 + i - 26));
      if (b.wrap && (upper || b.wrapLower)) return `\\${b.wrap}{${letter}}`;
      return letter;
    }
  }
  if (cp === 0x1D6A4) return 'i'; // dotless i
  if (cp === 0x1D6A5) return 'j'; // dotless j

  for (const start of GREEK_BLOCK_STARTS) {
    if (cp >= start && cp < start + 58) return GREEK_BLOCK_CHARS[cp - start];
  }
  if (cp >= 0x1D7CE && cp <= 0x1D7FF) return String((cp - 0x1D7CE) % 10); // all digit styles
  return ch;
}

/**
 * Normalizes mathematical bold/italic/sans/mono letters, digits and Greek into plain characters.
 * Script, fraktur and double-struck capitals keep their meaning as \mathcal / \mathfrak / \mathbb.
 */
export function normalizeMathAlphabets(text: string): string {
  if (!text) return '';
  if (!/[\u2100-\u214F\u{1D400}-\u{1D7FF}]/u.test(text)) return text;
  let out = '';
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    out += cp < 0x2100 ? ch : mapMathCodePoint(ch, cp);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*  3. Greek + operators                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Greek letters and math operators -> LaTeX.
 * A space is inserted only when a command name would otherwise run into a following
 * letter/digit (e.g. πx -> \pi x, but α,β -> \alpha,\beta).
 */
export function reconstructGreekAndOperators(
  text: string,
  options: ReconstructOptions = {}
): string {
  if (!text) return '';
  const { numberSets = true } = options;

  let s = text.replace(SYMBOL_RE, (match: string, offset: number, whole: string) => {
    const latex = SYMBOL_MAP.get(match)!;
    if (!/\\[A-Za-z]+$/.test(latex)) return latex; // doesn't end in a command name

    const rest = whole.slice(offset + match.length, offset + match.length + 2);
    if (!rest) return latex;
    const next = String.fromCodePoint(rest.codePointAt(0)!);
    const nextOut = SYMBOL_MAP.get(next) ?? next;
    return /^[A-Za-z0-9]/.test(nextOut) ? `${latex} ` : latex;
  });

  if (numberSets) {
    // where α,β∈Z -> where \alpha,\beta \in \mathbb{Z}
    s = s.replace(
      /\\(in|notin|subseteq|subset)(?![A-Za-z])\s*(Z|R)\b/g,
      '\\$1 \\mathbb{$2}'
    );
  }
  return s;
}

/* -------------------------------------------------------------------------- */
/*  4. Super / subscripts (single pass so  ∑ᵢ₌₁ⁿ  ->  \sum_{i=1}^n  works)     */
/* -------------------------------------------------------------------------- */

// Base = ASCII alnum, Greek, letterlike symbols (ℝ, ℓ…), or a closing bracket.
const SCRIPT_BASE = '[0-9A-Za-z\\u0370-\\u03FF\\u2100-\\u214F)}\\]]';

function buildScriptRegex(sup: boolean, sub: boolean): RegExp {
  const chars = [
    ...(sup ? Object.keys(SUPERSCRIPT_MAP) : []),
    ...(sub ? Object.keys(SUBSCRIPT_MAP) : [])
  ].join('');
  return new RegExp(`(${SCRIPT_BASE})([${chars}]+)`, 'g');
}

const SCRIPT_RE_BOTH = buildScriptRegex(true, true);
const SCRIPT_RE_SUP = buildScriptRegex(true, false);
const SCRIPT_RE_SUB = buildScriptRegex(false, true);

function convertScripts(text: string, re: RegExp): string {
  re.lastIndex = 0;
  return text.replace(re, (_m: string, base: string, run: string) => {
    let out = base;
    let kind: '^' | '_' | null = null;
    let buf = '';
    const flush = () => {
      if (kind && buf) out += kind + (buf.length === 1 ? buf : `{${buf}}`);
      buf = '';
    };
    for (const ch of run) {
      const isSup = Object.prototype.hasOwnProperty.call(SUPERSCRIPT_MAP, ch);
      const k: '^' | '_' = isSup ? '^' : '_';
      if (k !== kind) { flush(); kind = k; }
      buf += isSup ? SUPERSCRIPT_MAP[ch] : SUBSCRIPT_MAP[ch];
    }
    flush();
    return out;
  });
}

/** x² -> x^2, x¹² -> x^{12}, 2ⁿ -> 2^n, x⁻¹ -> x^{-1} */
export function reconstructUnicodeSuperscripts(text: string): string {
  return text ? convertScripts(text, SCRIPT_RE_SUP) : '';
}

/** x₁ -> x_1, aᵢ -> a_i, x₁₂ -> x_{12} */
export function reconstructUnicodeSubscripts(text: string): string {
  return text ? convertScripts(text, SCRIPT_RE_SUB) : '';
}

/** Both kinds in one pass, preserving order: x₁² -> x_1^2, ∑ᵢ₌₁ⁿ -> \sum_{i=1}^n */
export function reconstructUnicodeScripts(text: string): string {
  return text ? convertScripts(text, SCRIPT_RE_BOTH) : '';
}

/* -------------------------------------------------------------------------- */
/*  5. Radicals                                                               */
/* -------------------------------------------------------------------------- */

const RADICAL_INDEX = new Map<string, string>([['√', ''], ['∛', '[3]'], ['∜', '[4]']]);
const RADICAL_TOKEN = /\\[A-Za-z]+(?:\{[^{}]*\})?|\d+(?:\.\d+)?|[A-Za-z]/y;

/** √(x+1) -> \sqrt{x+1}, √x -> \sqrt{x}, ∛8 -> \sqrt[3]{8} */
function reconstructRadicals(text: string): string {
  if (!text || !/[√∛∜]/.test(text)) return text || '';

  let out = '';
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    const idx = RADICAL_INDEX.get(ch);
    if (idx === undefined) { out += ch; i++; continue; }

    const j = i + 1;
    if (text[j] === '(') {
      let depth = 0;
      let k = j;
      for (; k < text.length; k++) {
        if (text[k] === '(') depth++;
        else if (text[k] === ')' && --depth === 0) break;
      }
      if (k < text.length) {
        out += `\\sqrt${idx}{${reconstructRadicals(text.slice(j + 1, k))}}`;
        i = k + 1;
        continue;
      }
    }
    RADICAL_TOKEN.lastIndex = j;
    const m = RADICAL_TOKEN.exec(text);
    if (m) {
      out += `\\sqrt${idx}{${m[0]}}`;
      i = j + m[0].length;
    } else {
      out += `\\sqrt${idx}`;
      i = j;
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*  Main entrance                                                             */
/* -------------------------------------------------------------------------- */

export function reconstructUnicodeMath(text: string, options: ReconstructOptions = {}): string {
  if (!text) return '';

  let s = cleanInvisibleCharacters(text);
  s = normalizeMathAlphabets(s);
  s = reconstructGreekAndOperators(s, options);
  s = reconstructUnicodeScripts(s);
  s = reconstructRadicals(s);

  return s;
}