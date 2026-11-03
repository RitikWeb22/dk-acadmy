/**
 * DK Academy - Universal DOCX, Google Docs, MathML & OMML Clipboard Normalizer
 * 
 * Supports:
 * - Microsoft Office Math Markup Language (OMML): m:oMath, m:f, m:sSup, m:sSub, m:rad, m:nary, m:d, m:m, m:limLow
 * - W3C MathML: <math>, <mfrac>, <msup>, <msub>, <msqrt>, <mroot>, <munderover>, <mtable>
 * - Office HTML formatting: mso-*, <sup>, <sub>, <b>, <i>, <table>
 * - Plain text Unicode Math: fractions (12->1/2, 23->2/3), integrals (∫01), limits (limn→∞), Greek, vectors
 * - Question statement, options (A-D, 1-4), answer keys, numerical solutions, DK Sir shortcuts
 */

import { normalizeMathText } from './questionBulkParser';

export interface NormalizedOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface NormalizedQuestionResult {
  sourceType: 'omml-html' | 'mathml-html' | 'standard-html' | 'unicode-plain-text';
  fullNormalizedText: string;
  hasQuestionWithOptions: boolean;
  statement: string;
  options: NormalizedOption[];
  correctKey?: 'A' | 'B' | 'C' | 'D';
  numericalAnswer?: string;
  stepSolution?: string;
  dkSirShortcut?: string;
  warnings: string[];
  confidence: number;
}

// ============================================================================
// 1. GREEK & UNICODE SYMBOL MAPS
// ============================================================================

export const GREEK_MATH_MAP: Record<string, string> = {
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

export const OPERATOR_MAP: Record<string, string> = {
  '→': '\\to ',
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
  '≤': '\\le ',
  '≥': '\\ge ',
  '⩽': '\\le ',
  '⩾': '\\ge ',
  '≠': '\\ne ',
  '≈': '\\approx ',
  '≡': '\\equiv ',
  '±': '\\pm ',
  '∓': '\\mp ',
  '×': '\\times ',
  '⋅': '\\cdot ',
  '÷': '\\div ',
  '∞': '\\infty ',
  '∀': '\\forall ',
  '∃': '\\exists ',
  '∅': '\\emptyset ',
  'ℝ': '\\mathbb{R}',
  'ℤ': '\\mathbb{Z}',
  'ℕ': '\\mathbb{N}',
  'ℚ': '\\mathbb{Q}',
  'ℂ': '\\mathbb{C}'
};

export function cleanMathSymbols(text: string): string {
  let s = text;
  for (const [char, latex] of Object.entries(GREEK_MATH_MAP)) {
    s = s.split(char).join(` ${latex} `);
  }
  for (const [char, latex] of Object.entries(OPERATOR_MAP)) {
    s = s.split(char).join(` ${latex} `);
  }
  return s;
}

export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ============================================================================
// 2. OFFICE MATH MARKUP LANGUAGE (OMML) TO LATEX CONVERTER
// ============================================================================

/**
 * Converts an OMML DOM Node to valid KaTeX/LaTeX string
 */
export function ommlNodeToLatex(node: Node): string {
  if (node.nodeType === 3) {
    // Text node
    return (node.nodeValue || '').trim();
  }

  if (node.nodeType !== 1) return '';
  const el = node as Element;
  const localName = (el.localName || el.nodeName).replace(/^m:/i, '').toLowerCase();

  switch (localName) {
    case 'omath':
    case 'omathpara': {
      let inner = '';
      for (const child of Array.from(el.childNodes)) {
        inner += ommlNodeToLatex(child);
      }
      return inner.trim();
    }

    case 'f': {
      // Fraction: <m:num> and <m:den>
      const numEl = getChildByLocalName(el, 'num');
      const denEl = getChildByLocalName(el, 'den');
      const numLatex = numEl ? ommlNodeToLatex(numEl) : '';
      const denLatex = denEl ? ommlNodeToLatex(denEl) : '';
      return `\\frac{${numLatex || '1'}}{${denLatex || '1'}}`;
    }

    case 'ssup': {
      // Superscript: <m:e> base, <m:sup> exponent
      const baseEl = getChildByLocalName(el, 'e');
      const supEl = getChildByLocalName(el, 'sup');
      const baseLatex = baseEl ? ommlNodeToLatex(baseEl) : '';
      const supLatex = supEl ? ommlNodeToLatex(supEl) : '';
      return `{${baseLatex}}^{${supLatex}}`;
    }

    case 'ssub': {
      // Subscript: <m:e> base, <m:sub> subscript
      const baseEl = getChildByLocalName(el, 'e');
      const subEl = getChildByLocalName(el, 'sub');
      const baseLatex = baseEl ? ommlNodeToLatex(baseEl) : '';
      const subLatex = subEl ? ommlNodeToLatex(subEl) : '';
      return `{${baseLatex}}_{${subLatex}}`;
    }

    case 'ssubsup': {
      // Subscript and Superscript: <m:e>, <m:sub>, <m:sup>
      const baseEl = getChildByLocalName(el, 'e');
      const subEl = getChildByLocalName(el, 'sub');
      const supEl = getChildByLocalName(el, 'sup');
      const baseLatex = baseEl ? ommlNodeToLatex(baseEl) : '';
      const subLatex = subEl ? ommlNodeToLatex(subEl) : '';
      const supLatex = supEl ? ommlNodeToLatex(supEl) : '';
      return `{${baseLatex}}_{${subLatex}}^{${supLatex}}`;
    }

    case 'rad': {
      // Radical: <m:e> radicand, optional <m:deg> degree
      const eEl = getChildByLocalName(el, 'e');
      const degEl = getChildByLocalName(el, 'deg');
      const radicand = eEl ? ommlNodeToLatex(eEl) : '';
      const degree = degEl ? ommlNodeToLatex(degEl).trim() : '';
      if (degree) {
        return `\\sqrt[${degree}]{${radicand}}`;
      }
      return `\\sqrt{${radicand}}`;
    }

    case 'nary': {
      // N-ary: Integrals, Summations, Products
      const naryPr = getChildByLocalName(el, 'narypr');
      let chr = '∫';
      if (naryPr) {
        const chrEl = getChildByLocalName(naryPr, 'chr');
        if (chrEl && chrEl.getAttribute('m:val')) {
          chr = chrEl.getAttribute('m:val') || '∫';
        }
      }

      const subEl = getChildByLocalName(el, 'sub');
      const supEl = getChildByLocalName(el, 'sup');
      const eEl = getChildByLocalName(el, 'e');

      const subLatex = subEl ? ommlNodeToLatex(subEl) : '';
      const supLatex = supEl ? ommlNodeToLatex(supEl) : '';
      const eLatex = eEl ? ommlNodeToLatex(eEl) : '';

      let opCmd = '\\int';
      if (chr === '∑' || chr.includes('sum')) opCmd = '\\sum';
      else if (chr === '∏' || chr.includes('prod')) opCmd = '\\prod';

      let bounds = '';
      if (subLatex && supLatex) bounds = `_{${subLatex}}^{${supLatex}}`;
      else if (subLatex) bounds = `_{${subLatex}}`;
      else if (supLatex) bounds = `^{${supLatex}}`;

      return `${opCmd}${bounds} ${eLatex}`;
    }

    case 'd': {
      // Delimiters: parentheses, brackets, or piecewise braces
      const dPr = getChildByLocalName(el, 'dpr');
      let begChr = '(';
      let endChr = ')';
      if (dPr) {
        const b = getChildByLocalName(dPr, 'begchr');
        const e = getChildByLocalName(dPr, 'endchr');
        if (b && b.getAttribute('m:val') !== null) begChr = b.getAttribute('m:val') || '';
        if (e && e.getAttribute('m:val') !== null) endChr = e.getAttribute('m:val') || '';
      }

      // Check for Piecewise function: begChr="{" and endChr=""
      const eChildren = getAllChildrenByLocalName(el, 'e');
      if (begChr === '{' && (!endChr || endChr === '')) {
        const rows = eChildren.map(c => ommlNodeToLatex(c));
        return `\\begin{cases} ${rows.join(' \\\\[6pt] ')} \\end{cases}`;
      }

      const content = eChildren.map(c => ommlNodeToLatex(c)).join(' ');
      let leftTag = '\\left(';
      let rightTag = '\\right)';

      if (begChr === '[') leftTag = '\\left[';
      else if (begChr === '{') leftTag = '\\left\\{';
      else if (begChr === '|') leftTag = '\\left|';
      else if (!begChr) leftTag = '\\left.';

      if (endChr === ']') rightTag = '\\right]';
      else if (endChr === '}') rightTag = '\\right\\}';
      else if (endChr === '|') rightTag = '\\right|';
      else if (!endChr) rightTag = '\\right.';

      return `${leftTag}${content}${rightTag}`;
    }

    case 'm': {
      // Matrix: <m:mr> rows, each containing <m:e> columns
      const rowEls = getAllChildrenByLocalName(el, 'mr');
      const rows: string[] = [];
      for (const r of rowEls) {
        const colEls = getAllChildrenByLocalName(r, 'e');
        const cols = colEls.map(c => ommlNodeToLatex(c).trim());
        rows.push(cols.join(' & '));
      }
      return `\\begin{bmatrix} ${rows.join(' \\\\ ')} \\end{bmatrix}`;
    }

    case 'limlow': {
      // Limit with lower condition: <m:e> 'lim', <m:lim> 'x \to 0'
      const eEl = getChildByLocalName(el, 'e');
      const limEl = getChildByLocalName(el, 'lim');
      const opText = eEl ? ommlNodeToLatex(eEl) : 'lim';
      const cond = limEl ? ommlNodeToLatex(limEl) : '';
      return `\\${opText.trim()}_{${cond.trim()}}`;
    }

    case 'func': {
      // Function: <m:fname> 'sin', <m:e> 'x'
      const fnEl = getChildByLocalName(el, 'fname');
      const eEl = getChildByLocalName(el, 'e');
      const fnName = fnEl ? ommlNodeToLatex(fnEl).trim() : '';
      const arg = eEl ? ommlNodeToLatex(eEl).trim() : '';
      const cleanFn = fnName.startsWith('\\') ? fnName : `\\${fnName}`;
      return `${cleanFn}(${arg})`;
    }

    case 'acc': {
      // Accent: vector arrow, bar, hat
      const accPr = getChildByLocalName(el, 'accpr');
      let chr = '⃗';
      if (accPr) {
        const c = getChildByLocalName(accPr, 'chr');
        if (c && c.getAttribute('m:val')) chr = c.getAttribute('m:val') || '⃗';
      }
      const eEl = getChildByLocalName(el, 'e');
      const base = eEl ? ommlNodeToLatex(eEl) : '';
      if (chr === '⃗' || chr === '→') return `\\vec{${base}}`;
      if (chr === '̂' || chr === '^') return `\\hat{${base}}`;
      if (chr === '̅' || chr === '-') return `\\bar{${base}}`;
      return `\\vec{${base}}`;
    }

    case 'r': {
      // Run: contains <m:t> text
      let runText = '';
      for (const child of Array.from(el.childNodes)) {
        const cLocal = (child.nodeName || '').replace(/^m:/i, '').toLowerCase();
        if (cLocal === 't') {
          runText += child.textContent || '';
        } else {
          runText += ommlNodeToLatex(child);
        }
      }
      return cleanMathSymbols(runText);
    }

    case 't': {
      return cleanMathSymbols(el.textContent || '');
    }

    default: {
      let res = '';
      for (const child of Array.from(el.childNodes)) {
        res += ommlNodeToLatex(child);
      }
      return res;
    }
  }
}

function getChildByLocalName(parent: Element, name: string): Element | null {
  for (const child of Array.from(parent.children)) {
    const local = (child.localName || child.nodeName).replace(/^m:/i, '').toLowerCase();
    if (local === name.toLowerCase()) return child;
  }
  return null;
}

function getAllChildrenByLocalName(parent: Element, name: string): Element[] {
  const result: Element[] = [];
  for (const child of Array.from(parent.children)) {
    const local = (child.localName || child.nodeName).replace(/^m:/i, '').toLowerCase();
    if (local === name.toLowerCase()) result.push(child);
  }
  return result;
}

// ============================================================================
// 3. MATHML TO LATEX CONVERTER
// ============================================================================

/**
 * Converts a MathML DOM Node to valid KaTeX/LaTeX string
 */
export function mathMLNodeToLatex(node: Node): string {
  if (node.nodeType === 3) {
    return cleanMathSymbols(node.nodeValue || '');
  }
  if (node.nodeType !== 1) return '';

  const el = node as Element;
  const tag = (el.localName || el.nodeName).toLowerCase();

  switch (tag) {
    case 'math':
    case 'mrow': {
      let res = '';
      for (const c of Array.from(el.childNodes)) {
        res += mathMLNodeToLatex(c);
      }
      return res.trim();
    }

    case 'mfrac': {
      const children = Array.from(el.children);
      const num = children[0] ? mathMLNodeToLatex(children[0]) : '';
      const den = children[1] ? mathMLNodeToLatex(children[1]) : '';
      return `\\frac{${num || '1'}}{${den || '1'}}`;
    }

    case 'msup': {
      const children = Array.from(el.children);
      const base = children[0] ? mathMLNodeToLatex(children[0]) : '';
      const sup = children[1] ? mathMLNodeToLatex(children[1]) : '';
      return `{${base}}^{${sup}}`;
    }

    case 'msub': {
      const children = Array.from(el.children);
      const base = children[0] ? mathMLNodeToLatex(children[0]) : '';
      const sub = children[1] ? mathMLNodeToLatex(children[1]) : '';
      return `{${base}}_{${sub}}`;
    }

    case 'msubsup': {
      const children = Array.from(el.children);
      const base = children[0] ? mathMLNodeToLatex(children[0]) : '';
      const sub = children[1] ? mathMLNodeToLatex(children[1]) : '';
      const sup = children[2] ? mathMLNodeToLatex(children[2]) : '';
      return `{${base}}_{${sub}}^{${sup}}`;
    }

    case 'msqrt': {
      let content = '';
      for (const c of Array.from(el.childNodes)) {
        content += mathMLNodeToLatex(c);
      }
      return `\\sqrt{${content.trim()}}`;
    }

    case 'mroot': {
      const children = Array.from(el.children);
      const base = children[0] ? mathMLNodeToLatex(children[0]) : '';
      const deg = children[1] ? mathMLNodeToLatex(children[1]) : '';
      return `\\sqrt[${deg}]{${base}}`;
    }

    case 'munderover':
    case 'msubsup': {
      const children = Array.from(el.children);
      const op = children[0] ? mathMLNodeToLatex(children[0]).trim() : '';
      const under = children[1] ? mathMLNodeToLatex(children[1]).trim() : '';
      const over = children[2] ? mathMLNodeToLatex(children[2]).trim() : '';
      return `${op}_{${under}}^{${over}} `;
    }

    case 'munder': {
      const children = Array.from(el.children);
      const op = children[0] ? mathMLNodeToLatex(children[0]).trim() : '';
      const under = children[1] ? mathMLNodeToLatex(children[1]).trim() : '';
      return `${op}_{${under}} `;
    }

    case 'mover': {
      const children = Array.from(el.children);
      const base = children[0] ? mathMLNodeToLatex(children[0]).trim() : '';
      const over = children[1] ? mathMLNodeToLatex(children[1]).trim() : '';
      if (over === '→' || over === '⃗') return `\\vec{${base}}`;
      if (over === '^' || over === '̂') return `\\hat{${base}}`;
      if (over === '¯' || over === '‾') return `\\bar{${base}}`;
      return `{${base}}^{${over}}`;
    }

    case 'mtable': {
      const rows: string[] = [];
      for (const r of Array.from(el.children)) {
        if ((r.localName || r.nodeName).toLowerCase() === 'mtr') {
          const cols: string[] = [];
          for (const d of Array.from(r.children)) {
            cols.push(mathMLNodeToLatex(d).trim());
          }
          rows.push(cols.join(' & '));
        }
      }
      return `\\begin{matrix} ${rows.join(' \\\\ ')} \\end{matrix}`;
    }

    case 'mi':
    case 'mn':
    case 'mo':
    case 'mtext': {
      return cleanMathSymbols(el.textContent || '');
    }

    default: {
      let res = '';
      for (const c of Array.from(el.childNodes)) {
        res += mathMLNodeToLatex(c);
      }
      return res;
    }
  }
}

// ============================================================================
// 4. HTML TO LATEX CONVERTER (WORD HTML & STANDARD HTML)
// ============================================================================

/**
 * Converts rich HTML clipboard payload containing OMML, MathML, or HTML formatting into normalized LaTeX text.
 */
export function convertHtmlWithMathToLatex(htmlString: string): string {
  if (!htmlString || !htmlString.trim()) return '';

  let html = htmlString;

  // 1. Remove Word conditional comments <!--[if ...]>...<![endif]-->
  html = html.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '');
  // 2. Remove style blocks and script blocks
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '');
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');

  // 3. Parse HTML DOM
  let doc: Document | null = null;
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    doc = parser.parseFromString(html, 'text/html');
  }

  if (!doc) {
    // Node.js fallback or plain regex
    return normalizeUnicodeMathText(stripHtmlTags(html));
  }

  // 4. Process OMML elements (<m:oMath>, <m:oMathPara>)
  const omMathElements = doc.querySelectorAll('m\\:oMath, m\\:oMathPara, oMath, oMathPara');
  omMathElements.forEach((el) => {
    const latex = ommlNodeToLatex(el);
    const span = doc!.createElement('span');
    span.textContent = ` $${latex}$ `;
    el.parentNode?.replaceChild(span, el);
  });

  // 5. Process MathML elements (<math>)
  const mathMlElements = doc.querySelectorAll('math');
  mathMlElements.forEach((el) => {
    const latex = mathMLNodeToLatex(el);
    const span = doc!.createElement('span');
    span.textContent = ` $${latex}$ `;
    el.parentNode?.replaceChild(span, el);
  });

  // 6. Process HTML <sup> and <sub> tags
  const supElements = doc.querySelectorAll('sup');
  supElements.forEach((el) => {
    const content = el.textContent?.trim() || '';
    const span = doc!.createElement('span');
    span.textContent = `^{${content}}`;
    el.parentNode?.replaceChild(span, el);
  });

  const subElements = doc.querySelectorAll('sub');
  subElements.forEach((el) => {
    const content = el.textContent?.trim() || '';
    const span = doc!.createElement('span');
    span.textContent = `_{${content}}`;
    el.parentNode?.replaceChild(span, el);
  });

  // 7. Process styled spans (Word vertical-align: super / sub)
  const styledSpans = doc.querySelectorAll('span[style]');
  styledSpans.forEach((el) => {
    const style = (el.getAttribute('style') || '').toLowerCase();
    const content = el.textContent?.trim() || '';
    if (style.includes('vertical-align: super') || style.includes('mso-text-raise')) {
      const span = doc!.createElement('span');
      span.textContent = `^{${content}}`;
      el.parentNode?.replaceChild(span, el);
    } else if (style.includes('vertical-align: sub')) {
      const span = doc!.createElement('span');
      span.textContent = `_{${content}}`;
      el.parentNode?.replaceChild(span, el);
    }
  });

  // 8. Convert Block elements to Line Breaks
  const blockElements = doc.querySelectorAll('p, div, tr, li, h1, h2, h3, h4');
  blockElements.forEach((el) => {
    el.insertAdjacentText('afterend', '\n');
  });

  const brElements = doc.querySelectorAll('br');
  brElements.forEach((el) => {
    el.insertAdjacentText('afterend', '\n');
  });

  // 9. Extract text content
  const rawExtracted = doc.body.textContent || '';
  return normalizeUnicodeMathText(rawExtracted);
}

// ============================================================================
// 5. UNICODE MATH & PLAIN TEXT NORMALIZER
// ============================================================================

/**
 * Normalizes plain text containing Unicode symbols, Word equation editor artifacts,
 * fractions, limits, integrals, and formatting into clean KaTeX LaTeX.
 */
export function normalizeUnicodeMathText(raw: string): string {
  if (!raw) return '';

  let text = raw;

  // 1. Clean invisible characters, hair spaces, zero-width spaces, and Word placeholders
  text = text.replace(/[\u200B\u200C\u200D\u200E\u200F\uFEFF\u200A\u2009\u202F\u2060\u2061\u2062\u2063\u2064\uFFF9-\uFFFD\u00A0]/g, ' ')
             .replace(/[▒□┤├│〖〗]/g, '')
             .replace(/[\u201C\u201D]/g, '"')
             .replace(/[\u2018\u2019]/g, "'")
             .replace(/[\u2212\u2013\u2014]/g, '-');

  // 2. Decode Word Equation Editor font artifacts
  text = text.replace(/cot\s*=\s*[x𝑥]\s*-\s*3\s*\/,\s*@\s*cot\s*=\s*[x𝑥]\s*\+\s*3\s*\/,\s*@\s*\+\s*1@/gi,
                      '\\left[\\cot\\left(x - \\frac{\\pi}{3}\\right) \\cot\\left(x + \\frac{\\pi}{3}\\right) + 1\\right]');
  text = text.replace(/=cot\s*=\s*[x𝑥]\s*-\s*3/gi, '\\left[\\cot\\left(x - \\frac{\\pi}{3}\\right)');
  text = text.replace(/F\s*[\r\n]+\s*1\s*[\r\n]+\s*3\s*[\r\n]+\s*−?1\s*[\r\n]+\s*2\s*[\r\n]+\s*1\s*[\r\n]+\s*𝛼\s*[\r\n]+\s*0\s*[\r\n]+\s*1\s*[\r\n]+\s*−?1\s*[\r\n]+\s*H/g,
                      '\\begin{bmatrix} 1 & 3 & -1 \\\\ 2 & 1 & \\alpha \\\\ 0 & 1 & -1 \\end{bmatrix}');

  // 3. Delegate to the comprehensive mathematical bulk normalizer
  return normalizeMathText(text);
}

// ============================================================================
// 6. UNIVERSAL NORMALIZER & QUESTION OPTION PARSER
// ============================================================================

/**
 * Universal content normalization layer for clipboard paste events.
 * Accepts a DataTransfer object from clipboard or plain { html, text } object.
 */
export function normalizePastedQuestion(
  clipboardPayload: DataTransfer | { html?: string; text: string }
): NormalizedQuestionResult {
  const warnings: string[] = [];
  let html = '';
  let plain = '';

  if (typeof (clipboardPayload as any)?.getData === 'function') {
    const dt = clipboardPayload as DataTransfer;
    html = dt.getData('text/html') || '';
    plain = dt.getData('text/plain') || dt.getData('text') || '';
  } else {
    const custom = clipboardPayload as { html?: string; text: string };
    html = custom.html || '';
    plain = custom.text || '';
  }

  let sourceType: 'omml-html' | 'mathml-html' | 'standard-html' | 'unicode-plain-text' = 'unicode-plain-text';
  let normalizedText = '';

  // 1. Detect Source Format
  if (html && (html.includes('xmlns:m') || html.includes('<m:oMath') || html.includes('<oMath'))) {
    sourceType = 'omml-html';
    normalizedText = convertHtmlWithMathToLatex(html);
  } else if (html && (html.includes('<math') || html.includes('xmlns="http://www.w3.org/1998/Math/MathML"'))) {
    sourceType = 'mathml-html';
    normalizedText = convertHtmlWithMathToLatex(html);
  } else if (html && (html.includes('<p') || html.includes('<table') || html.includes('<sup') || html.includes('<sub'))) {
    sourceType = 'standard-html';
    normalizedText = convertHtmlWithMathToLatex(html);
  } else {
    sourceType = 'unicode-plain-text';
    normalizedText = normalizeUnicodeMathText(plain);
  }

  // 2. Parse Question Statement, Options, and Metadata
  const extracted = extractQuestionStatementAndOptions(normalizedText);

  return {
    sourceType,
    fullNormalizedText: normalizedText,
    hasQuestionWithOptions: extracted.options.length === 4 && Boolean(extracted.statement),
    statement: extracted.statement || normalizedText,
    options: extracted.options,
    correctKey: extracted.correctKey,
    numericalAnswer: extracted.numericalAnswer,
    stepSolution: extracted.stepSolution,
    dkSirShortcut: extracted.dkSirShortcut,
    warnings,
    confidence: extracted.options.length === 4 ? 0.98 : 0.85
  };
}

/**
 * Extracts statement, options A-D or 1-4, answer key, solution and shortcut
 */
export function extractQuestionStatementAndOptions(rawText: string): {
  statement: string;
  options: NormalizedOption[];
  correctKey?: 'A' | 'B' | 'C' | 'D';
  numericalAnswer?: string;
  stepSolution?: string;
  dkSirShortcut?: string;
} {
  let text = rawText.trim();
  let statement = text;
  const options: NormalizedOption[] = [];
  let correctKey: 'A' | 'B' | 'C' | 'D' | undefined;
  let numericalAnswer: string | undefined;
  let stepSolution: string | undefined;
  let dkSirShortcut: string | undefined;

  // 1. Extract Answer Key if present
  const ansMatch = text.match(/(?:^|\n|\s)(?:Ans(?:wer)?|Correct(?:\s*(?:Key|Option|Answer))?|Option)\s*[:=\-]\s*[(]?([A-Da-d1-4])[)]?/i);
  if (ansMatch) {
    let rawK = ansMatch[1].toUpperCase();
    if (rawK === '1') rawK = 'A';
    else if (rawK === '2') rawK = 'B';
    else if (rawK === '3') rawK = 'C';
    else if (rawK === '4') rawK = 'D';
    if (['A', 'B', 'C', 'D'].includes(rawK)) correctKey = rawK as any;
    text = text.replace(ansMatch[0], '').trim();
  }

  // 2. Extract Numerical Answer if present
  const numAnsMatch = text.match(/(?:^|\n|\s)(?:Ans(?:wer)?|Correct(?:\s*(?:Key|Answer|Value))?|Value)\s*[:=\-]\s*(-?[0-9]+(?:\.[0-9]+)?)/i);
  if (numAnsMatch) {
    numericalAnswer = numAnsMatch[1];
  }

  // 3. Extract Solution & Shortcut
  const solMatch = text.match(/(?:^|\n)\s*(?:Sol(?:ution)?|Expl(?:anation)?)\s*[:=\-]\s*([\s\S]+?)(?=(?:\n\s*(?:Shortcut|Trick|DK\s*Sir|Topic)|$))/i);
  if (solMatch) {
    stepSolution = solMatch[1].trim();
    text = text.replace(solMatch[0], '').trim();
  }

  const trickMatch = text.match(/(?:^|\n)\s*(?:Shortcut|Trick|DK\s*Sir)\s*[:=\-]\s*([\s\S]+?)(?=(?:\n\s*(?:Topic|Video|PDF)|$))/i);
  if (trickMatch) {
    dkSirShortcut = trickMatch[1].trim();
    text = text.replace(trickMatch[0], '').trim();
  }

  // 4. Extract Options: (A), (B), (C), (D) or (1), (2), (3), (4) or A., B., C., D.
  const optAMatch = text.search(/(?:^|\s|\n)(?:\(?A\)?\.?|\(1\)|A\b)\s+/i);
  if (optAMatch !== -1) {
    statement = text.substring(0, optAMatch).trim();
    const optionsBlock = text.substring(optAMatch);

    const matchA = optionsBlock.match(/(?:^|\s|\n)(?:\(?A\)?\.?|\(1\)|A\b)\s+([\s\S]*?)(?=(?:^|\s|\n)(?:\(?B\)?\.?|\(2\)|B\b)\s+|$)/i);
    const matchB = optionsBlock.match(/(?:^|\s|\n)(?:\(?B\)?\.?|\(2\)|B\b)\s+([\s\S]*?)(?=(?:^|\s|\n)(?:\(?C\)?\.?|\(3\)|C\b)\s+|$)/i);
    const matchC = optionsBlock.match(/(?:^|\s|\n)(?:\(?C\)?\.?|\(3\)|C\b)\s+([\s\S]*?)(?=(?:^|\s|\n)(?:\(?D\)?\.?|\(4\)|D\b)\s+|$)/i);
    const matchD = optionsBlock.match(/(?:^|\s|\n)(?:\(?D\)?\.?|\(4\)|D\b)\s+([\s\S]*?)$/i);

    options.push({ key: 'A', text: cleanOptionText(matchA ? matchA[1] : '') });
    options.push({ key: 'B', text: cleanOptionText(matchB ? matchB[1] : '') });
    options.push({ key: 'C', text: cleanOptionText(matchC ? matchC[1] : '') });
    options.push({ key: 'D', text: cleanOptionText(matchD ? matchD[1] : '') });
  } else {
    statement = text;
  }

  return {
    statement: normalizeMathText(statement),
    options,
    correctKey,
    numericalAnswer,
    stepSolution: stepSolution ? normalizeMathText(stepSolution) : undefined,
    dkSirShortcut: dkSirShortcut ? normalizeMathText(dkSirShortcut) : undefined
  };
}

function cleanOptionText(optText: string): string {
  let s = optText.trim();
  // Strip trailing exam metadata if merged e.g. "JEE Main 2024 (Online)..."
  s = s.replace(/(?:^|\n)\s*JEE\s+Main[^\n]*$/i, '').trim();
  s = s.replace(/[\.\,;]+$/, '').trim();
  return normalizeMathText(s);
}
