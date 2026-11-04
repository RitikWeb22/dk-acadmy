/**
 * OMML and MathML Structural Conversion Layer (Layer B)
 * Recursively converts W3C MathML and Microsoft OMML DOM trees into pristine KaTeX/LaTeX.
 * Completely eliminates the Node.js stripHtmlTags() structural loss.
 */

import {
  parseMarkupToDoc,
  getChildByLocalTag,
  getAllChildrenByLocalTag,
  getNodeText
} from './domAdapter';
import { reconstructUnicodeMath } from './unicodeMathReconstructor';

// ============================================================================
// 1. OMML TO LATEX CONVERSION
// ============================================================================

export function ommlNodeToLatex(node: any): string {
  if (!node) return '';

  // Text node
  if (node.nodeType === 3) {
    const val = node.nodeValue || '';
    if (!val.trim()) return '';
    return reconstructUnicodeMath(val);
  }

  // Not an element
  if (node.nodeType !== 1) return '';

  const localName = (node.localName || node.nodeName || '')
    .replace(/^m:/i, '')
    .toLowerCase();

  switch (localName) {
    case 'omath':
    case 'omathpara': {
      let inner = '';
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          inner += ommlNodeToLatex(node.childNodes[i]);
        }
      }
      return inner.trim();
    }

    case 'f': {
      // Fraction: <m:num> and <m:den>
      const numEl = getChildByLocalTag(node, 'num');
      const denEl = getChildByLocalTag(node, 'den');
      const numLatex = numEl ? ommlNodeToLatex(numEl).trim() : '1';
      const denLatex = denEl ? ommlNodeToLatex(denEl).trim() : '1';
      return `\\frac{${numLatex || '1'}}{${denLatex || '1'}}`;
    }

    case 'ssup': {
      // Superscript: <m:e> base, <m:sup> exponent
      const baseEl = getChildByLocalTag(node, 'e');
      const supEl = getChildByLocalTag(node, 'sup');
      const baseLatex = baseEl ? ommlNodeToLatex(baseEl).trim() : '';
      const supLatex = supEl ? ommlNodeToLatex(supEl).trim() : '';
      const cleanBase = baseLatex.replace(/^\{|\}$/g, '').trim();
      if (/^[a-zA-Z0-9]$/.test(cleanBase) || /^\\[a-zA-Z]+$/.test(cleanBase)) {
        return `${cleanBase}^{${supLatex}}`;
      }
      return `{${baseLatex}}^{${supLatex}}`;
    }

    case 'ssub': {
      // Subscript: <m:e> base, <m:sub> subscript
      const baseEl = getChildByLocalTag(node, 'e');
      const subEl = getChildByLocalTag(node, 'sub');
      const baseLatex = baseEl ? ommlNodeToLatex(baseEl).trim() : '';
      const subLatex = subEl ? ommlNodeToLatex(subEl).trim() : '';
      const cleanBase = baseLatex.replace(/^\{|\}$/g, '').trim();
      const mathOps = ['lim', 'max', 'min', 'sup', 'inf', 'limsup', 'liminf', 'log', 'ln', 'gcd'];
      if (mathOps.includes(cleanBase.toLowerCase())) {
        return `\\${cleanBase.toLowerCase()}_{${subLatex}}`;
      }
      if (/^[a-zA-Z0-9]$/.test(cleanBase) || /^\\[a-zA-Z]+$/.test(cleanBase)) {
        return `${cleanBase}_{${subLatex}}`;
      }
      return `{${baseLatex}}_{${subLatex}}`;
    }

    case 'ssubsup': {
      // Subscript and Superscript: <m:e>, <m:sub>, <m:sup>
      const baseEl = getChildByLocalTag(node, 'e');
      const subEl = getChildByLocalTag(node, 'sub');
      const supEl = getChildByLocalTag(node, 'sup');
      const baseLatex = baseEl ? ommlNodeToLatex(baseEl).trim() : '';
      const subLatex = subEl ? ommlNodeToLatex(subEl).trim() : '';
      const supLatex = supEl ? ommlNodeToLatex(supEl).trim() : '';
      const cleanBase = baseLatex.replace(/^\{|\}$/g, '').trim();
      const mathOps = ['lim', 'max', 'min', 'sup', 'inf', 'limsup', 'liminf', 'log', 'ln', 'int', 'sum', 'prod'];
      if (mathOps.includes(cleanBase.toLowerCase())) {
        return `\\${cleanBase.toLowerCase()}_{${subLatex}}^{${supLatex}}`;
      }
      return `{${baseLatex}}_{${subLatex}}^{${supLatex}}`;
    }

    case 'rad': {
      // Radical: <m:e> radicand, optional <m:deg> degree
      const eEl = getChildByLocalTag(node, 'e');
      const degEl = getChildByLocalTag(node, 'deg');
      const radicand = eEl ? ommlNodeToLatex(eEl).trim() : '';
      const degree = degEl ? ommlNodeToLatex(degEl).trim() : '';
      if (degree) {
        return `\\sqrt[${degree}]{${radicand}}`;
      }
      return `\\sqrt{${radicand}}`;
    }

    case 'nary': {
      // N-ary: Integrals, Summations, Products
      const naryPr = getChildByLocalTag(node, 'narypr');
      let chr = '∫';
      if (naryPr) {
        const chrEl = getChildByLocalTag(naryPr, 'chr');
        if (chrEl && chrEl.getAttribute) {
          chr = chrEl.getAttribute('m:val') || chrEl.getAttribute('val') || '∫';
        }
      }

      const subEl = getChildByLocalTag(node, 'sub');
      const supEl = getChildByLocalTag(node, 'sup');
      const eEl = getChildByLocalTag(node, 'e');

      const subLatex = subEl ? ommlNodeToLatex(subEl).trim() : '';
      const supLatex = supEl ? ommlNodeToLatex(supEl).trim() : '';
      const eLatex = eEl ? ommlNodeToLatex(eEl).trim() : '';

      let opCmd = '\\int';
      if (chr === '∑' || chr.toLowerCase().includes('sum')) opCmd = '\\sum';
      else if (chr === '∏' || chr.toLowerCase().includes('prod')) opCmd = '\\prod';

      let bounds = '';
      if (subLatex && supLatex) bounds = `_{${subLatex}}^{${supLatex}}`;
      else if (subLatex) bounds = `_{${subLatex}}`;
      else if (supLatex) bounds = `^{${supLatex}}`;

      return `${opCmd}${bounds} ${eLatex}`;
    }

    case 'd': {
      // Delimiters: parentheses, brackets, or piecewise braces
      const dPr = getChildByLocalTag(node, 'dpr');
      let begChr = '(';
      let endChr = ')';
      if (dPr) {
        const b = getChildByLocalTag(dPr, 'begchr');
        const e = getChildByLocalTag(dPr, 'endchr');
        if (b && b.getAttribute) begChr = b.getAttribute('m:val') ?? b.getAttribute('val') ?? '(';
        if (e && e.getAttribute) endChr = e.getAttribute('m:val') ?? e.getAttribute('val') ?? ')';
      }

      const eChildren = getAllChildrenByLocalTag(node, 'e');

      // Check for Piecewise function: begChr="{" and endChr=""
      if (begChr === '{' && (!endChr || endChr === '')) {
        const rows = eChildren.map(c => ommlNodeToLatex(c).trim());
        return `\\begin{cases} ${rows.join(' \\\\[6pt] ')} \\end{cases}`;
      }

      const content = eChildren.map(c => ommlNodeToLatex(c).trim()).join(' ');
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
      const rowEls = getAllChildrenByLocalTag(node, 'mr');
      const rows: string[] = [];
      for (const r of rowEls) {
        const colEls = getAllChildrenByLocalTag(r, 'e');
        const cols = colEls.map(c => ommlNodeToLatex(c).trim());
        rows.push(cols.join(' & '));
      }
      return `\\begin{bmatrix} ${rows.join(' \\\\ ')} \\end{bmatrix}`;
    }

    case 'limlow': {
      // Limit with lower condition: <m:e> 'lim', <m:lim> 'x \to 0'
      const eEl = getChildByLocalTag(node, 'e');
      const limEl = getChildByLocalTag(node, 'lim');
      const rawOpText = eEl ? ommlNodeToLatex(eEl) : 'lim';
      const opText = rawOpText.trim().replace(/^\{(.+)\}$/, '$1').trim();
      const cond = limEl ? ommlNodeToLatex(limEl).trim() : '';
      return `\\${opText}_{${cond}}`;
    }

    case 'limupp': {
      // Limit with upper condition
      const eEl = getChildByLocalTag(node, 'e');
      const limEl = getChildByLocalTag(node, 'lim');
      const rawOpText = eEl ? ommlNodeToLatex(eEl) : 'lim';
      const opText = rawOpText.trim().replace(/^\{(.+)\}$/, '$1').trim();
      const cond = limEl ? ommlNodeToLatex(limEl).trim() : '';
      return `\\${opText}^{${cond}}`;
    }

    case 'func': {
      // Function: <m:fname> 'sin', <m:e> 'x'
      const fnEl = getChildByLocalTag(node, 'fname');
      const eEl = getChildByLocalTag(node, 'e');
      const fnName = fnEl ? ommlNodeToLatex(fnEl).trim() : '';
      const arg = eEl ? ommlNodeToLatex(eEl).trim() : '';
      const cleanFn = fnName.startsWith('\\') ? fnName : `\\${fnName}`;
      const noParenOps = ['\\lim', '\\max', '\\min', '\\sup', '\\inf', '\\limsup', '\\liminf'];
      if (noParenOps.some(op => cleanFn === op || cleanFn.startsWith(op + '_') || cleanFn.startsWith(op + ' '))) {
        return `${cleanFn} ${arg}`;
      }
      return `${cleanFn}\\left(${arg}\\right)`;
    }

    case 'acc': {
      // Accent: vector arrow, bar, hat, dot, ddot
      const accPr = getChildByLocalTag(node, 'accpr');
      let chr = '⃗';
      if (accPr) {
        const c = getChildByLocalTag(accPr, 'chr');
        if (c && c.getAttribute) chr = c.getAttribute('m:val') ?? c.getAttribute('val') ?? '⃗';
      }
      const eEl = getChildByLocalTag(node, 'e');
      const base = eEl ? ommlNodeToLatex(eEl).trim() : '';
      if (chr === '⃗' || chr === '→') return `\\vec{${base}}`;
      if (chr === '̂' || chr === '^') return `\\hat{${base}}`;
      if (chr === '̅' || chr === '-') return `\\bar{${base}}`;
      if (chr === '̇' || chr === '.') return `\\dot{${base}}`;
      if (chr === '̈' || chr === '..') return `\\ddot{${base}}`;
      return `\\vec{${base}}`;
    }

    case 'box': {
      const eEl = getChildByLocalTag(node, 'e');
      return eEl ? ommlNodeToLatex(eEl) : '';
    }

    case 'groupchr': {
      const groupChrPr = getChildByLocalTag(node, 'groupchrpr');
      let pos = 'bot';
      if (groupChrPr) {
        const posEl = getChildByLocalTag(groupChrPr, 'pos');
        if (posEl && posEl.getAttribute) pos = posEl.getAttribute('m:val') ?? posEl.getAttribute('val') ?? 'bot';
      }
      const eEl = getChildByLocalTag(node, 'e');
      const base = eEl ? ommlNodeToLatex(eEl).trim() : '';
      return pos === 'top' ? `\\overbrace{${base}}` : `\\underbrace{${base}}`;
    }

    case 'r': {
      // Run: contains <m:t> text
      let runText = '';
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          const child = node.childNodes[i];
          const cLocal = (child.localName || child.nodeName || '').replace(/^m:/i, '').toLowerCase();
          if (cLocal === 't') {
            runText += getNodeText(child);
          } else {
            runText += ommlNodeToLatex(child);
          }
        }
      }
      return reconstructUnicodeMath(runText);
    }

    case 't': {
      return reconstructUnicodeMath(getNodeText(node));
    }

    default: {
      let res = '';
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          res += ommlNodeToLatex(node.childNodes[i]);
        }
      }
      return res;
    }
  }
}

// ============================================================================
// 2. MATHML TO LATEX CONVERSION
// ============================================================================

export function mathMLNodeToLatex(node: any): string {
  if (!node) return '';

  if (node.nodeType === 3) {
    const val = node.nodeValue || '';
    if (!val.trim()) return '';
    return reconstructUnicodeMath(val);
  }

  if (node.nodeType !== 1) return '';

  const tag = (node.localName || node.nodeName || '').replace(/^[a-z]+:/i, '').toLowerCase();

  switch (tag) {
    case 'math':
    case 'mrow': {
      let res = '';
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          const piece = mathMLNodeToLatex(node.childNodes[i]);
          if (piece) {
            const isUnarySign = res === '-' || res === '+';
            const needsSpace = res &&
              !res.endsWith('{') &&
              !res.endsWith('\\') &&
              !isUnarySign &&
              !piece.startsWith('^') &&
              !piece.startsWith('_');
            res += (needsSpace ? ' ' : '') + piece;
          }
        }
      }
      return res.replace(/\s+/g, ' ').trim();
    }

    case 'mfrac': {
      const children = getElementChildren(node);
      const num = children[0] ? mathMLNodeToLatex(children[0]).trim() : '1';
      const den = children[1] ? mathMLNodeToLatex(children[1]).trim() : '1';
      return `\\frac{${num || '1'}}{${den || '1'}}`;
    }

    case 'msup': {
      const children = getElementChildren(node);
      const base = children[0] ? mathMLNodeToLatex(children[0]).trim() : '';
      const sup = children[1] ? mathMLNodeToLatex(children[1]).trim() : '';
      const cleanBase = base.replace(/^\{|\}$/g, '').trim();
      if (/^[a-zA-Z0-9]$/.test(cleanBase) || /^\\[a-zA-Z]+$/.test(cleanBase)) {
        return `${cleanBase}^{${sup}}`;
      }
      return `{${base}}^{${sup}}`;
    }

    case 'msub': {
      const children = getElementChildren(node);
      const base = children[0] ? mathMLNodeToLatex(children[0]).trim() : '';
      const sub = children[1] ? mathMLNodeToLatex(children[1]).trim() : '';
      const cleanBase = base.replace(/^\{|\}$/g, '').trim();
      const mathOps = ['lim', 'max', 'min', 'sup', 'inf', 'limsup', 'liminf', 'log', 'ln', 'gcd'];
      if (mathOps.includes(cleanBase.toLowerCase())) {
        return `\\${cleanBase.toLowerCase()}_{${sub}}`;
      }
      if (/^[a-zA-Z0-9]$/.test(cleanBase) || /^\\[a-zA-Z]+$/.test(cleanBase)) {
        return `${cleanBase}_{${sub}}`;
      }
      return `{${base}}_{${sub}}`;
    }

    case 'msubsup': {
      const children = getElementChildren(node);
      const base = children[0] ? mathMLNodeToLatex(children[0]).trim() : '';
      const sub = children[1] ? mathMLNodeToLatex(children[1]).trim() : '';
      const sup = children[2] ? mathMLNodeToLatex(children[2]).trim() : '';
      const cleanBase = base.replace(/^\{|\}$/g, '').trim();
      const mathOps = ['lim', 'max', 'min', 'sup', 'inf', 'limsup', 'liminf', 'log', 'ln', 'int', 'sum', 'prod'];
      if (mathOps.includes(cleanBase.toLowerCase())) {
        return `\\${cleanBase.toLowerCase()}_{${sub}}^{${sup}}`;
      }
      return `{${base}}_{${sub}}^{${sup}}`;
    }

    case 'msqrt': {
      let content = '';
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          content += mathMLNodeToLatex(node.childNodes[i]);
        }
      }
      return `\\sqrt{${content.trim()}}`;
    }

    case 'mroot': {
      const children = getElementChildren(node);
      const base = children[0] ? mathMLNodeToLatex(children[0]).trim() : '';
      const deg = children[1] ? mathMLNodeToLatex(children[1]).trim() : '';
      return `\\sqrt[${deg}]{${base}}`;
    }

    case 'munderover': {
      const children = getElementChildren(node);
      const op = children[0] ? mathMLNodeToLatex(children[0]).trim() : '';
      const under = children[1] ? mathMLNodeToLatex(children[1]).trim() : '';
      const over = children[2] ? mathMLNodeToLatex(children[2]).trim() : '';
      return `${op}_{${under}}^{${over}} `;
    }

    case 'munder': {
      const children = getElementChildren(node);
      const op = children[0] ? mathMLNodeToLatex(children[0]).trim() : '';
      const under = children[1] ? mathMLNodeToLatex(children[1]).trim() : '';
      return `${op}_{${under}} `;
    }

    case 'mover': {
      const children = getElementChildren(node);
      const base = children[0] ? mathMLNodeToLatex(children[0]).trim() : '';
      const over = children[1] ? mathMLNodeToLatex(children[1]).trim() : '';
      if (over === '→' || over === '⃗') return `\\vec{${base}}`;
      if (over === '^' || over === '̂') return `\\hat{${base}}`;
      if (over === '¯' || over === '‾') return `\\bar{${base}}`;
      return `{${base}}^{${over}}`;
    }

    case 'mtable': {
      const rows: string[] = [];
      const trs = getAllChildrenByLocalTag(node, 'mtr');
      for (const r of trs) {
        const cols = getAllChildrenByLocalTag(r, 'mtd').map(c => mathMLNodeToLatex(c).trim());
        rows.push(cols.join(' & '));
      }
      return `\\begin{matrix} ${rows.join(' \\\\ ')} \\end{matrix}`;
    }

    case 'mfenced': {
      let open = '(';
      let close = ')';
      if (node.getAttribute) {
        if (node.getAttribute('open') !== null) open = node.getAttribute('open');
        if (node.getAttribute('close') !== null) close = node.getAttribute('close');
      }
      let inner = '';
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          inner += mathMLNodeToLatex(node.childNodes[i]);
        }
      }
      return `\\left${open}${inner.trim()}\\right${close}`;
    }

    case 'mi':
    case 'mn':
    case 'mo':
    case 'mtext': {
      const txt = getNodeText(node).trim();
      return reconstructUnicodeMath(txt);
    }

    default: {
      let res = '';
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          res += mathMLNodeToLatex(node.childNodes[i]);
        }
      }
      return res;
    }
  }
}

function getElementChildren(node: any): any[] {
  if (!node || !node.childNodes) return [];
  const list: any[] = [];
  for (let i = 0; i < node.childNodes.length; i++) {
    if (node.childNodes[i].nodeType === 1) {
      list.push(node.childNodes[i]);
    }
  }
  return list;
}

function decodeHtmlMathEntities(html: string): string {
  return html
    .replace(/&alpha;/gi, 'α')
    .replace(/&beta;/gi, 'β')
    .replace(/&gamma;/gi, 'γ')
    .replace(/&delta;/gi, 'δ')
    .replace(/&epsilon;/gi, 'ε')
    .replace(/&theta;/gi, 'θ')
    .replace(/&lambda;/gi, 'λ')
    .replace(/&mu;/gi, 'μ')
    .replace(/&pi;/gi, 'π')
    .replace(/&sigma;/gi, 'σ')
    .replace(/&phi;/gi, 'φ')
    .replace(/&omega;/gi, 'ω')
    .replace(/&le;/gi, '≤')
    .replace(/&ge;/gi, '≥')
    .replace(/&ne;/gi, '≠')
    .replace(/&approx;/gi, '≈')
    .replace(/&plusmn;/gi, '±')
    .replace(/&times;/gi, '×')
    .replace(/&divide;/gi, '÷')
    .replace(/&infin;/gi, '∞')
    .replace(/&sum;/gi, '∑')
    .replace(/&prod;/gi, '∏')
    .replace(/&int;/gi, '∫')
    .replace(/&part;/gi, '∂')
    .replace(/&radic;/gi, '√')
    .replace(/&cup;/gi, '∪')
    .replace(/&cap;/gi, '∩')
    .replace(/&isin;/gi, '∈')
    .replace(/&notin;/gi, '∉')
    .replace(/&rarr;/gi, '→')
    .replace(/&larr;/gi, '←')
    .replace(/&harr;/gi, '↔')
    .replace(/&rArr;/gi, '⇒')
    .replace(/&lArr;/gi, '⇐')
    .replace(/&hArr;/gi, '⇔')
    .replace(/&sdot;/gi, '⋅')
    .replace(/&middot;/gi, '·')
    .replace(/&dd;/gi, 'd')
    .replace(/&nbsp;/gi, ' ');
}

// ============================================================================
// 3. HTML DOCUMENT MATH EXTRACTOR
// ============================================================================

export function convertHtmlWithMath(htmlString: string): string {
  if (!htmlString || !htmlString.trim()) return '';

  let html = decodeHtmlMathEntities(htmlString);

  // 1. Unwrap Word math inside conditional comments instead of deleting it
  html = html.replace(/<!--\[if[^\]]*\]>([\s\S]*?<m:oMath[\s\S]*?)<!\[endif\]-->/gi, '$1');
  html = html.replace(/<!--\[if[^\]]*\]>([\s\S]*?<math[\s\S]*?)<!\[endif\]-->/gi, '$1');
  html = html.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '');
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '');
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');

  // 2. Process MathML blocks with dedicated XML DOM parser
  html = html.replace(/<math\b[\s\S]*?<\/math>/gi, (match) => {
    let xmlStr = match;
    if (!xmlStr.includes('xmlns')) {
      xmlStr = xmlStr.replace(/<math/i, '<math xmlns="http://www.w3.org/1998/Math/MathML"');
    }
    const xmlDoc = parseMarkupToDoc(xmlStr, 'xml');
    if (xmlDoc && (xmlDoc.documentElement || xmlDoc)) {
      const latex = mathMLNodeToLatex(xmlDoc.documentElement || xmlDoc).replace(/\s+/g, ' ').trim();
      return ` $${latex}$ `;
    }
    return match;
  });

  // 3. Process OMML blocks with dedicated XML DOM parser
  html = html.replace(/<(?:m:)?oMathPara\b[\s\S]*?<\/(?:m:)?oMathPara>/gi, (match) => {
    let xmlStr = match;
    if (!xmlStr.includes('xmlns:m')) {
      xmlStr = xmlStr.replace(/<(?:m:)?oMathPara/i, '<m:oMathPara xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"');
    }
    const xmlDoc = parseMarkupToDoc(xmlStr, 'xml');
    if (xmlDoc && (xmlDoc.documentElement || xmlDoc)) {
      const latex = ommlNodeToLatex(xmlDoc.documentElement || xmlDoc).replace(/\s+/g, ' ').trim();
      return ` $${latex}$ `;
    }
    return match;
  });

  html = html.replace(/<(?:m:)?oMath\b[\s\S]*?<\/(?:m:)?oMath>/gi, (match) => {
    let xmlStr = match;
    if (!xmlStr.includes('xmlns:m')) {
      xmlStr = xmlStr.replace(/<(?:m:)?oMath/i, '<m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"');
    }
    const xmlDoc = parseMarkupToDoc(xmlStr, 'xml');
    if (xmlDoc && (xmlDoc.documentElement || xmlDoc)) {
      const latex = ommlNodeToLatex(xmlDoc.documentElement || xmlDoc).replace(/\s+/g, ' ').trim();
      return ` $${latex}$ `;
    }
    return match;
  });

  // 4. Process HTML sup and sub tags, stripping inner spans or whitespace
  html = html.replace(/<sup>([\s\S]*?)<\/sup>/gi, (_m, content) => {
    const cleanContent = content.replace(/<[^>]+>/g, '').trim();
    return `^{${cleanContent}}`;
  });
  html = html.replace(/<sub>([\s\S]*?)<\/sub>/gi, (_m, content) => {
    const cleanContent = content.replace(/<[^>]+>/g, '').trim();
    return `_{${cleanContent}}`;
  });

  // 5. Clean remaining HTML tags while preserving line breaks and table cells
  html = html.replace(/<br\s*\/?>/gi, '\n');
  html = html.replace(/<\/(?:p|div|tr|li|h[1-6])>/gi, '\n\n');
  html = html.replace(/<(?:td|th)\b[^>]*>/gi, ' ');
  // Strip inline formatting tags without introducing spaces
  html = html.replace(/<\/?(?:span|b|strong|i|em|u|font|a|code|mark|small)\b[^>]*>/gi, '');
  html = html.replace(/<[^>]+>/g, ' ');

  // Clean unintended whitespace before exponents and subscripts
  html = html.replace(/\s+(\^\{[^{}]+\}|_\{[^{}]+\})/g, '$1');

  return reconstructUnicodeMath(html).replace(/\u00A0/g, ' ').replace(/[ \t]+/g, ' ').trim();
}

function findElementsMatching(root: any, targetTags: string[]): any[] {
  const result: any[] = [];
  const lowerTargets = new Set(targetTags.map(t => t.toLowerCase()));

  function traverse(node: any) {
    if (!node) return;
    if (node.nodeType === 1) {
      const local = (node.localName || node.nodeName || '').replace(/^[a-z0-9_-]+:/i, '').toLowerCase();
      if (lowerTargets.has(local)) {
        result.push(node);
        return; // Don't traverse into converted math subtrees
      }
    }
    if (node.childNodes) {
      for (let i = 0; i < node.childNodes.length; i++) {
        traverse(node.childNodes[i]);
      }
    }
  }

  traverse(root);
  return result;
}

function replaceElementWithText(el: any, text: string) {
  if (!el.parentNode) return;
  const owner = el.ownerDocument || el;
  if (owner && owner.createTextNode) {
    const textNode = owner.createTextNode(text);
    el.parentNode.replaceChild(textNode, el);
  } else {
    el.nodeValue = text;
  }
}

/**
 * Fallback regex extractor if DOMParser is somehow not available
 */
function fallbackRegexHtmlToLatex(html: string): string {
  let s = html;
  // Replace <math>...</math>
  s = s.replace(/<math[\s\S]*?<\/math>/gi, (match) => {
    const xmlDoc = parseMarkupToDoc(match, 'xml');
    if (xmlDoc) return ` $${mathMLNodeToLatex(xmlDoc.documentElement || xmlDoc)}$ `;
    return match;
  });
  // Replace <m:oMath>...</m:oMath>
  s = s.replace(/<(?:m:)?oMath[\s\S]*?<\/(?:m:)?oMath>/gi, (match) => {
    const xmlDoc = parseMarkupToDoc(match, 'xml');
    if (xmlDoc) return ` $${ommlNodeToLatex(xmlDoc.documentElement || xmlDoc)}$ `;
    return match;
  });

  // Strip remaining HTML tags
  s = s.replace(/<[^>]+>/g, ' ');
  return reconstructUnicodeMath(s);
}

