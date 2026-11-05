/**
 * Input Format Detection Layer (Layer A)
 * Identifies the structural format of raw mathematical or textual input
 * without parsing, normalizing, or mutating the source expression.
 */

import type { InputFormatType } from './types.js';

// ============================================================================
// XML & Markup Structural Helpers (OMML, MathML, HTML)
// ============================================================================

/**
 * Recognizes genuine Office Math Markup Language (OMML) XML structures.
 * Requires actual XML tag pairing for `<oMath>` / `<oMathPara>` (prefixed or unprefixed)
 * combined with inner OMML structural child elements, or an XML tag with an `xmlns`
 * attribute declaring the Office Math namespace.
 * Avoids false positives on plain text mentioning the namespace URL or tag names.
 */
function isOmmlXml(text: string): boolean {
  const hasOmmlRootOpen = /<(?:[a-zA-Z0-9_-]+:)?(?:oMath|oMathPara)(?:\s[^>]*)?>/i.test(text);
  const hasOmmlRootClose = /<\/(?:[a-zA-Z0-9_-]+:)?(?:oMath|oMathPara)\s*>/i.test(text);

  if (hasOmmlRootOpen && hasOmmlRootClose) {
    return true;
  }

  // Handle self-contained OMML sub-fragments (e.g. pasted <m:f>, <m:rad>, <m:sSup>, <m:nary>)
  const hasOmmlNamespaceAttr =
    /<[a-zA-Z0-9_:-]+[^>]*\bxmlns(?::[a-zA-Z0-9_-]+)?\s*=\s*["']http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/math["'][^>]*>/i.test(
      text
    );
  const hasOmmlChildStruct =
    /<(?:[a-zA-Z0-9_-]+:)?(?:r|t|f|rad|sSup|sSub|sSubSup|nary|d|eqArr|m|limLow|limUpp)\b[^>]*>[\s\S]*?<\/(?:[a-zA-Z0-9_-]+:)?(?:r|t|f|rad|sSup|sSub|sSubSup|nary|d|eqArr|m|limLow|limUpp)\s*>/i.test(
      text
    );

  return hasOmmlNamespaceAttr && hasOmmlChildStruct;
}

/**
 * Recognizes genuine MathML XML structures.
 * Requires either a paired `<math>...</math>` element (with optional namespace prefix)
 * or a MathML structural container (`mfrac`, `msup`, `msub`, `msubsup`, `msqrt`, `mroot`,
 * `munder`, `mover`, `munderover`, `mtable`, `mrow`) that encloses actual MathML token
 * leaf elements (`<mi>`, `<mn>`, `<mo>`, `<mtext>`, `<mspace>`).
 * This prevents unrelated XML like `<root><mfrac>ordinary XML content</mfrac></root>`
 * from being misclassified as MathML.
 */
function isMathmlXml(text: string): boolean {
  const hasMathRoot =
    /<(?:[a-zA-Z0-9_-]+:)?math(?:\s[^>]*)?>[\s\S]*?<\/(?:[a-zA-Z0-9_-]+:)?math\s*>/i.test(text);

  if (hasMathRoot) {
    return true;
  }

  const hasMathmlLayoutTag =
    /<(?:[a-zA-Z0-9_-]+:)?(?:mfrac|msup|msub|msubsup|msqrt|mroot|munder|mover|munderover|mtable|mrow|mfenced|mmultiscripts)(?:\s[^>]*)?>[\s\S]*?<\/(?:[a-zA-Z0-9_-]+:)?(?:mfrac|msup|msub|msubsup|msqrt|mroot|munder|mover|munderover|mtable|mrow|mfenced|mmultiscripts)\s*>/i.test(
      text
    );

  const hasMathmlTokenTag =
    /<(?:[a-zA-Z0-9_-]+:)?(?:mi|mn|mo|mtext)\b[^>]*>[\s\S]*?<\/(?:[a-zA-Z0-9_-]+:)?(?:mi|mn|mo|mtext)\s*>/i.test(
      text
    );

  return hasMathmlLayoutTag && hasMathmlTokenTag;
}

/**
 * Checks whether a string contains paired HTML structural/formatting elements
 * (`<p>`, `<div>`, `<span>`, `<table>`, `<tr>`, `<td>`, `<sup>`, `<sub>`, `<article>`, `<section>`, `<body>`, `<html>`, `<math>`).
 * Void or unrelated inline prose mentions like "A website contains <p> and <div> tags"
 * without a corresponding closing tag (`</p>`, `</div>`) are ignored.
 */
function hasPairedHtmlDom(text: string): boolean {
  const htmlBlockOrInlineRegex =
    /<(p|div|span|table|thead|tbody|tr|td|th|sup|sub|ul|ol|li|article|section|body|html)(?:\s[^>]*)?>[\s\S]*?<\/\1\s*>/i;
  return htmlBlockOrInlineRegex.test(text);
}

/**
 * Strips HTML tags and comments to inspect the text content inside HTML markup.
 */
function stripHtmlTags(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/?[a-zA-Z][a-zA-Z0-9:-]*(?:\s[^>]*)?>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .trim();
}

/**
 * Checks whether an HTML string contains actual mathematical evidence:
 * - Embedded `<math>` (MathML) or `<m:oMath>` (OMML) inside HTML containers
 * - Explicit math-rendering classes/attributes (`math-tex`, `katex`, `MathJax`, `data-latex`, `data-mathml`)
 * - HTML `<sup>` or `<sub>` tags used in algebraic/numeric context (e.g., `x<sup>2</sup>`, `log<sub>10</sub>`, `10<sup>-5</sup>`)
 * - HTML math entities (`&radic;`, `&int;`, `&sum;`, `&infin;`, `&le;`, `&ge;`, `&ne;`, `&plusmn;`, `&alpha;`, `&beta;`, `&pi;`, `&times;`, `&divide;`)
 * - LaTeX, Word Linear, Unicode Math, or clear symbolic equations (`x + 2 = 5`, `2x - 3 = 7`) inside the text content.
 */
function isHtmlWithMath(text: string): boolean {
  if (!hasPairedHtmlDom(text)) {
    return false;
  }

  // 1. Embedded MathML or OMML inside outer HTML wrappers (<p>, <div>, etc.)
  if (isMathmlXml(text) || isOmmlXml(text)) {
    return true;
  }

  // 2. Math-specific HTML attributes/classes (KaTeX, MathJax, CKEditor math-tex, etc.)
  if (
    /\b(?:class|data-[a-zA-Z0-9_-]+)\s*=\s*["'][^"']*\b(?:math-tex|mathjax|katex|latex|equation|math-inline|math-display)\b/i.test(
      text
    )
  ) {
    return true;
  }

  // 3. HTML <sup> or <sub> attached to variables, numbers, or math functions (excludes 1<sup>st</sup>, 2<sup>nd</sup>, 3<sup>rd</sup>, 4<sup>th</sup>, ™/®)
  const supSubMatches = text.matchAll(
    /([a-zA-Z0-9)\]}])\s*<(sup|sub)(?:\s[^>]*)?>\s*([^<]+?)\s*<\/\2\s*>/gi
  );
  for (const match of supSubMatches) {
    const inner = match[3].trim();
    if (!/^(?:st|nd|rd|th|tm|sm|reg)$/i.test(inner)) {
      return true;
    }
  }

  // 4. Named or numeric HTML math entities
  if (
    /&(?:radic|int|sum|prod|infin|le|ge|ne|asymp|equiv|plusmn|minus|times|divide|part|nabla|isin|notin|sub|sup|sube|supe|cap|cup|there4|prop|ang|perp|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|tau|phi|omega|Delta|Sigma|Omega|Prime|prime);/i.test(
      text
    )
  ) {
    return true;
  }

  // 5. Inspect inner text stripped of HTML tags for LaTeX, Word Linear, Unicode Math, or symbolic equations
  const innerText = stripHtmlTags(text);
  if (
    isWordLinearFormat(innerText) ||
    hasExplicitLatex(innerText) ||
    hasUnicodeMathNotation(innerText)
  ) {
    return true;
  }

  // 6. Symbolic ASCII equations inside HTML (e.g., <p>Solve the equation x + 2 = 5.</p> or f(x) = 2x + 1)
  if (
    /\b(?:[a-zA-Z]\s*\(\s*[a-zA-Z]\s*\)|[0-9]*[a-zA-Z])\s*[+\-*/^]\s*[0-9a-zA-Z]+\s*[=<>]\s*[+\-]?\s*[0-9a-zA-Z]+/.test(
      innerText
    ) ||
    /\b[0-9a-zA-Z]+\s*[=<>]\s*[0-9]*[a-zA-Z]\s*[+\-*/^]\s*[0-9a-zA-Z]+/.test(innerText)
  ) {
    return true;
  }

  return false;
}

// ============================================================================
// Word Linear / UnicodeMath Helpers
// ============================================================================

/**
 * Recognizes Microsoft Word Equation Editor Linear Format / UnicodeMath representations.
 * Looks for structural Word Linear markers and macros rather than isolated characters.
 */
function isWordLinearFormat(text: string): boolean {
  // 1. High-confidence Word Equation box/delimiter/alignment control tokens
  if (/[█┤]/.test(text) || /@&/.test(text)) {
    return true;
  }

  // 2. Stacked limit/n-ary operators using ┬ (above) and ┴ (below) in mathematical context
  if (
    /(?:\blim\b|\bmax\b|\bmin\b|[∑∏∫∮⋃⋂]|\\\w+)\s*[┬┴]/.test(text) ||
    /[┬┴]\s*\(/.test(text) ||
    /\([^()]+\)\s*[┬┴]\s*\([^()]+\)/.test(text)
  ) {
    return true;
  }

  // 3. Word Linear structural commands: \matrix(...), \eqarray(...), \cases(...), \close, \open
  if (
    /\\(?:matrix|eqarray|cases|funcapply|norm|underbar|overbar)\s*\(/i.test(text)
  ) {
    return true;
  }

  // 4. Word Linear n-ary radical/fraction/integral constructs such as √(n&x)
  if (/[√∛∜]\s*\([^()&]+&[^()]+\)/.test(text)) {
    return true;
  }

  return false;
}

// ============================================================================
// LaTeX & Mixed Prose Classification Helpers
// ============================================================================

/**
 * Comprehensive set of standard LaTeX mathematical and structural command names.
 * Excludes Windows path components or arbitrary non-LaTeX words.
 */
const KNOWN_LATEX_COMMANDS_REGEX =
  /\\(?:frac|dfrac|tfrac|cfrac|binom|sqrt|root|int|iint|iiint|oint|sum|prod|coprod|lim|limsup|liminf|sup|inf|max|min|det|dim|ker|hom|arg|deg|gcd|lcm|Pr|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|coth|log|ln|lg|exp|begin|end|left|right|bigl|bigr|Bigl|Bigr|biggl|biggr|Biggl|Biggr|middle|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|mu|nu|xi|pi|varpi|rho|varrho|sigma|varsigma|tau|upsilon|phi|varphi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|infty|partial|nabla|forall|exists|nexists|emptyset|varnothing|in|notin|ni|subset|supset|subseteq|supseteq|cup|cap|bigcup|bigcap|setminus|times|div|pm|mp|cdot|cdots|ldots|vdots|ddots|ast|star|circ|bullet|oplus|ominus|otimes|oslash|odot|leq|le|geq|ge|neq|ne|approx|equiv|cong|sim|simeq|propto|perp|parallel|mid|nmid|angle|triangle|to|rightarrow|leftarrow|leftrightarrow|Rightarrow|Leftarrow|Leftrightarrow|mapsto|implies|iff|mathbb|mathcal|mathfrak|mathscr|mathrm|mathbf|mathsf|mathtt|mathit|text|textbf|textit|textrm|operatorname|hat|check|breve|acute|grave|tilde|bar|vec|dot|ddot|overline|underline|overbrace|underbrace|widehat|widetilde|overrightarrow|overleftarrow|not|quad|qquad|hspace|vspace|phantom|boxed|cancel|bcancel|xcancel|color|displaystyle|textstyle|scriptstyle|scriptscriptstyle)(?![a-zA-Z])/;

/**
 * Checks whether `text` contains genuine LaTeX syntax (commands, math environments,
 * explicit math delimiters `$...$`, `$$...$$`, `\(...\)`, `\[...\]`, or braced scripts `^{...}`, `_{...}`).
 */
function hasExplicitLatex(text: string): boolean {
  // Strip Windows file paths (e.g. C:\Users\...) before checking backslash commands
  const cleaned = text.replace(/\b[a-zA-Z]:\\[^\s]+/g, ' ');

  // 1. Known LaTeX command
  if (KNOWN_LATEX_COMMANDS_REGEX.test(cleaned)) {
    return true;
  }

  // 2. Explicit LaTeX math mode delimiters: $$...$$, \[...\], \(...\), or inline $...$
  if (
    /\$\$[\s\S]+?\$\$/.test(cleaned) ||
    /\\\[[\s\S]+?\\\]/.test(cleaned) ||
    /\\\([\s\S]+?\\\)/.test(cleaned)
  ) {
    return true;
  }

  // Inline $...$: require paired $ on the same paragraph without looking like currency ($50 ... $100)
  const inlineDollarMatches = cleaned.matchAll(/\$([^$\n]+)\$/g);
  for (const m of inlineDollarMatches) {
    const inner = m[1].trim();
    // Currency check: if inner starts with digits and contains plain prose words like "and" or "to", skip
    if (
      inner.length > 0 &&
      !/^\d+(?:[.,]\d+)?\s+[a-zA-Z]{2,}/.test(inner) &&
      (/[\\^_{}=<>+\-*/()]/.test(inner) || /^[a-zA-Z0-9]+$/.test(inner) || KNOWN_LATEX_COMMANDS_REGEX.test(inner))
    ) {
      return true;
    }
  }

  // 3. Braced superscripts/subscripts or escaped braces: x^{2}, a_{n+1}, \{x\}
  if (
    /[a-zA-Z0-9)\]}]\s*[\^_]\s*\{[^{}]+\}/.test(cleaned) ||
    /\\\{[\s\S]+?\\\}/.test(cleaned)
  ) {
    return true;
  }

  // 4. Unbraced LaTeX caret superscripts in clear mathematical context: x^2 + y^2
  if (/(?:^|[^\w\\])[a-zA-Z0-9)]+\^(?:\d+|[a-zA-Z])(?![\w])/.test(cleaned)) {
    return true;
  }

  return false;
}

/**
 * Standard mathematical keywords allowed as standalone tokens inside pure mathematical expressions
 * (e.g., "x = 1 and y = 2", "x > 0 for all x", "where k is constant").
 * Conversational question/instructional words ("Find", "value", "Solve", "Evaluate", "If", "is", "required")
 * are intentionally NOT in this set so sentences are classified as `mixed`.
 */
const MATH_CONNECTOR_WORDS = new Set([
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'coth',
  'log', 'ln', 'lg', 'exp', 'lim', 'limsup', 'liminf',
  'sup', 'inf', 'max', 'min', 'det', 'dim', 'ker', 'hom', 'deg', 'gcd', 'lcm', 'mod', 'rem',
  'and', 'or', 'xor', 'not'
]);

/**
 * Determines whether a string containing LaTeX is a standalone `latex` expression
 * or `mixed` (LaTeX mathematical notation embedded inside English/Hindi prose).
 */
function classifyLatexOrMixed(text: string): 'latex' | 'mixed' {
  const trimmed = text.trim();

  // Case 1: Entire input is wrapped in a single pair of display or inline math delimiters
  if (
    (/^\$\$[\s\S]+\$\$$/.test(trimmed) && !/\$\$[\s\S]+\$\$[\s\S]+\$\$/.test(trimmed)) ||
    (/^\\\[[\s\S]+\\\]$/.test(trimmed) && !/\\\]/.test(trimmed.slice(2, -2))) ||
    (/^\\\([\s\S]+\\\)$/.test(trimmed) && !/\\\)/.test(trimmed.slice(2, -2))) ||
    (/^\$[^$\n]+\$$/.test(trimmed)) ||
    (/^\\begin\s*\{([a-zA-Z*]+)\}[\s\S]+\\end\s*\{\1\}$/.test(trimmed))
  ) {
    return 'latex';
  }

  // Case 2: If explicit math delimiters ($...$, $$...$$, \(...\), \[...\]) exist inside the string,
  // strip the delimited math blocks and inspect the surrounding text for prose.
  const hasExplicitDelimiters =
    /\$\$[\s\S]+?\$\$|\$[^$\n]+\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)/.test(trimmed);

  if (hasExplicitDelimiters) {
    const outsideDelimiters = trimmed
      .replace(/\$\$[\s\S]+?\$\$/g, ' ')
      .replace(/\\\[[\s\S]+?\\\]/g, ' ')
      .replace(/\\\([\s\S]+?\\\)/g, ' ')
      .replace(/\$[^$\n]+\$/g, ' ')
      .trim();

    if ( hasNaturalLanguageProse(outsideDelimiters) ) {
      return 'mixed';
    }
    return 'latex';
  }

  // Case 3: Un-delimited LaTeX (e.g., `\lim_{x \to 0} \frac{\sin x}{x}` vs `Find the limit \lim_{x \to 0} \frac{\sin x}{x}`)
  // Strip out valid LaTeX text macros (\text{...}, \mathrm{...}, \operatorname{...}), environments, and LaTeX commands.
  const withoutLatexConstructs = trimmed
    .replace(/\\(?:text|textbf|textit|textrm|mathrm|mathbf|mathsf|mathtt|mathit|operatorname)\s*\{[^{}]*\}/g, ' ')
    .replace(/\\(?:begin|end)\s*\{[a-zA-Z*]+\}/g, ' ')
    .replace(/\\[a-zA-Z]+/g, ' ');

  if (hasNaturalLanguageProse(withoutLatexConstructs)) {
    return 'mixed';
  }

  return 'latex';
}

/**
 * Checks if a stripped text fragment contains natural language prose in English or Hindi (Devanagari).
 */
function hasNaturalLanguageProse(fragment: string): boolean {
  if (!fragment || fragment.trim().length === 0) {
    return false;
  }

  // 1. Check for Devanagari (Hindi) words (2 or more Devanagari characters)
  if (/[\u0900-\u097F]{2,}/.test(fragment)) {
    return true;
  }

  // 2. Extract alphabetic words of length >= 2
  const words = fragment.match(/\b[a-zA-Z]{2,}\b/g) || [];
  let proseWordCount = 0;

  for (const w of words) {
    const lower = w.toLowerCase();
    if (!MATH_CONNECTOR_WORDS.has(lower)) {
      proseWordCount++;
    }
  }

  // Two or more non-math words (e.g. "Find the", "The value", "is required") indicate surrounding prose
  return proseWordCount >= 2;
}

// ============================================================================
// Unicode Mathematical Notation Helpers
// ============================================================================

/**
 * Checks whether `text` contains genuine Unicode mathematical notation:
 * - Radicals (`√`, `∛`, `∜`)
 * - Superscripts and subscripts (`⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎`)
 * - Relational and binary math operators (`×`, `÷`, `±`, `∓`, `≤`, `≥`, `≠`, `≈`, `≡`, `∝`, `∞`, `∑`, `∏`, `∫`, `∮`, `∂`, `∇`, `∈`, `∉`, `⊂`, `⊆`, `∪`, `∩`, `∀`, `∃`, `∅`, `∠`, `⊥`, `∥`, `⇒`, `⇔`, `→`, `↔`)
 * - Number set symbols (`ℝ`, `ℤ`, `ℕ`, `ℚ`, `ℂ`)
 * - Greek letters (`α-ω`, `Α-Ω`) used in mathematical expressions
 * Excludes non-mathematical decorative symbols, emojis, currency symbols, or general punctuation.
 */
function hasUnicodeMathNotation(text: string): boolean {
  // 1. Unambiguous mathematical operators, radicals, calculus/set symbols, number sets, and sub/superscripts
  if (
    /[√∛∜×÷±∓≤≥≠≈≡≅≃∝∞∑∏∫∬∭∮∂∇→↔⇒⇔↦∈∉⊂⊃⊆⊇∪∩∅∀∃∠⊥∥ℝℤℕℚℂ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎]/.test(
      text
    )
  ) {
    return true;
  }

  // 2. Greek letters: require mathematical context (adjacent operators, numbers, parens, or standalone variable tokens)
  if (/[\u0391-\u03C9]/.test(text)) {
    if (
      /[\u0391-\u03C9]\s*(?:[=<>+\-*/^(),0-9]|[\u0391-\u03C9])/.test(text) ||
      /(?:[=<>+\-*/^(),0-9])\s*[\u0391-\u03C9]/.test(text) ||
      /(?:^|\s)[\u0391-\u03C9](?:\s|$)/.test(text)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Determines whether a string containing Unicode mathematical symbols is pure `unicode-math`
 * or `mixed` (Unicode mathematical notation embedded inside a natural-language sentence,
 * such as "The value of x² is required.").
 */
function classifyUnicodeMathOrMixed(text: string): 'unicode-math' | 'mixed' {
  // Remove mathematical sub-expressions (variables attached to superscripts/subscripts, numbers, operators)
  // and check if natural language prose remains.
  const strippedOfUnicodeMathTokens = text
    // Remove tokens containing superscripts/subscripts like x², y₁, 10⁻⁵
    .replace(/[a-zA-Z0-9]+[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎]+/g, ' ')
    // Remove single-letter math variables adjacent to math operators
    .replace(/\b[a-zA-Z]\b(?=\s*[=<>+\-*/×÷±∓≤≥≠≈≡∝∈∉⊂⊆∪∩])/g, ' ')
    .replace(/(?<=[=<>+\-*/×÷±∓≤≥≠≈≡∝∈∉⊂⊆∪∩]\s*)\b[a-zA-Z]\b/g, ' ');

  if (hasNaturalLanguageProse(strippedOfUnicodeMathTokens)) {
    return 'mixed';
  }

  return 'unicode-math';
}

// ============================================================================
// Public Entry Point
// ============================================================================

export function detectInputFormat(rawInput: string): InputFormatType {
  if (!rawInput || typeof rawInput !== 'string') {
    return 'plain-text';
  }

  const text = rawInput.trim();
  if (text.length === 0) {
    return 'plain-text';
  }

  // 1. Check if the outer document is HTML markup (<p>, <div>, <span>, <table>, etc.)
  //    Wait: pure <math>...</math> or <m:oMath>...</m:oMath> without outer HTML tags
  //    must be classified as 'mathml-xml' / 'omml-xml'.
  const hasOuterHtml = hasPairedHtmlDom(text);

  if (!hasOuterHtml) {
    // 1a. Pure OMML (Office Math Markup Language)
    if (isOmmlXml(text)) {
      return 'omml-xml';
    }

    // 1b. Pure MathML
    if (isMathmlXml(text)) {
      return 'mathml-xml';
    }
  } else {
    // Outer HTML tags are present: verify if the HTML actually contains mathematical content.
    // Generic website HTML without math (e.g. "<div>Hello, welcome to our website.</div>")
    // will NOT match `isHtmlWithMath` and will fall through to 'plain-text'.
    if (isHtmlWithMath(text)) {
      return 'html-math';
    }
    return 'plain-text';
  }

  // 2. Detect Word Linear / UnicodeMath Format
  if (isWordLinearFormat(text)) {
    return 'word-linear';
  }

  // 3. Detect LaTeX and Mixed (LaTeX + Prose)
  if (hasExplicitLatex(text)) {
    return classifyLatexOrMixed(text);
  }

  // 4. Detect Unicode Mathematical Notation and Mixed (Unicode Math + Prose)
  if (hasUnicodeMathNotation(text)) {
    return classifyUnicodeMathOrMixed(text);
  }

  // 5. Fallback: Plain Text (including non-math XML or generic text)
  return 'plain-text';
}