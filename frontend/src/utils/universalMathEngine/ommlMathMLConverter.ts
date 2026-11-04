/**
 * OMML and MathML Structural Conversion Layer (Layer B)
 *
 * Converts Microsoft Word OMML and W3C MathML DOM trees into
 * KaTeX-compatible LaTeX while preserving mathematical structure.
 *
 * This layer reconstructs notation only. It never evaluates expressions.
 */

import {
  parseMarkupToDoc,
  getChildByLocalTag,
  getAllChildrenByLocalTag,
  getNodeText
} from './domAdapter';
import { reconstructUnicodeMath } from './unicodeMathReconstructor';

type DomNode = any;

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const CDATA_SECTION_NODE = 4;
const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';
const OMML_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/math';

function localNameOf(node: DomNode): string {
  if (!node) return '';
  const value = node.localName || node.nodeName || '';
  return String(value).replace(/^.*:/, '').toLowerCase();
}

function childElements(node: DomNode): DomNode[] {
  if (!node?.childNodes) return [];
  const result: DomNode[] = [];
  for (let i = 0; i < node.childNodes.length; i++) {
    if (node.childNodes[i]?.nodeType === ELEMENT_NODE) result.push(node.childNodes[i]);
  }
  return result;
}

function childByTag(node: DomNode, name: string): DomNode | null {
  // Prefer the project's namespace-aware/direct-child adapter.
  try {
    const found = getChildByLocalTag(node, name);
    if (found) return found;
  } catch {
    // Fall through to the local direct-child implementation.
  }
  const wanted = name.toLowerCase();
  return childElements(node).find(child => localNameOf(child) === wanted) || null;
}

function childrenByTag(node: DomNode, name: string): DomNode[] {
  try {
    const found = getAllChildrenByLocalTag(node, name);
    if (Array.isArray(found)) return found;
  } catch {
    // Fall through.
  }
  const wanted = name.toLowerCase();
  return childElements(node).filter(child => localNameOf(child) === wanted);
}

function attr(node: DomNode, name: string, namespace?: string): string | null {
  if (!node?.getAttribute) return null;
  try {
    if (namespace && typeof node.getAttributeNS === 'function') {
      const value = node.getAttributeNS(namespace, name);
      if (value !== null && value !== undefined) return String(value);
    }
  } catch {
    // Continue with qualified and unqualified lookups.
  }
  try {
    const qualified = node.getAttribute(`m:${name}`);
    if (qualified !== null && qualified !== undefined) return String(qualified);
  } catch {
    // Ignore unsupported DOM implementations.
  }
  try {
    const value = node.getAttribute(name);
    return value === null || value === undefined ? null : String(value);
  } catch {
    return null;
  }
}

function nodeText(node: DomNode): string {
  if (!node) return '';
  try {
    const value = getNodeText(node);
    if (typeof value === 'string') return value;
  } catch {
    // Use a safe fallback.
  }
  if (node.nodeType === TEXT_NODE || node.nodeType === CDATA_SECTION_NODE) {
    return String(node.nodeValue || '');
  }
  let result = '';
  if (node.childNodes) {
    for (let i = 0; i < node.childNodes.length; i++) result += nodeText(node.childNodes[i]);
  }
  return result;
}

function convertText(value: string): string {
  return reconstructUnicodeMath(value || '');
}

function hasMeaningfulContent(value: string): boolean {
  return Boolean(value && value.trim().length);
}

function escapeLatexDelimiter(value: string, side: 'left' | 'right'): string {
  const delimiter = (value || '').trim();
  if (!delimiter || delimiter === '∅' || delimiter === ' ') return side === 'left' ? '\\left.' : '\\right.';
  const map: Record<string, string> = {
    '(': side === 'left' ? '\\left(' : '\\right)',
    ')': side === 'left' ? '\\left)' : '\\right)',
    '[': side === 'left' ? '\\left[' : '\\right[',
    ']': side === 'left' ? '\\left]' : '\\right]',
    '{': side === 'left' ? '\\left\\{' : '\\right\\{',
    '}': side === 'left' ? '\\left\\}' : '\\right\\}',
    '|': side === 'left' ? '\\left|' : '\\right|',
    '‖': side === 'left' ? '\\left\\|' : '\\right\\|',
    '⌈': side === 'left' ? '\\left\\lceil' : '\\right\\lceil',
    '⌉': side === 'left' ? '\\left\\rceil' : '\\right\\rceil',
    '⌊': side === 'left' ? '\\left\\lfloor' : '\\right\\lfloor',
    '⌋': side === 'left' ? '\\left\\rfloor' : '\\right\\rfloor',
    '⟨': side === 'left' ? '\\left\\langle' : '\\right\\langle',
    '⟩': side === 'left' ? '\\left\\rangle' : '\\right\\rangle',
    '.': side === 'left' ? '\\left.' : '\\right.'
  };
  return map[delimiter] || (side === 'left' ? '\\left.' : '\\right.');
}

function wrapGroup(value: string): string {
  return `{${value || ''}}`;
}

function normalizeOperatorName(value: string): string {
  return (value || '').trim().replace(/^\\/, '').toLowerCase();
}

// ============================================================================
// 1. OMML TO LATEX CONVERSION
// ============================================================================

export function ommlNodeToLatex(node: any): string {
  if (!node) return '';

  if (node.nodeType === TEXT_NODE || node.nodeType === CDATA_SECTION_NODE) {
    const value = String(node.nodeValue || '');
    return value.trim() ? convertText(value) : '';
  }
  if (node.nodeType !== ELEMENT_NODE) return '';

  const name = localNameOf(node);

  switch (name) {
    case 'omath':
    case 'omathpara':
    case 'e':
    case 'num':
    case 'den':
    case 'sup':
    case 'sub':
    case 'deg':
    case 'lim':
    case 'fname':
    case 'mr':
    case 't':
    case 'r': {
      let result = '';
      for (const child of Array.from(node.childNodes || []) as DomNode[]) {
        if (name === 'r' && localNameOf(child) === 'rpr') continue;
        result += ommlNodeToLatex(child);
      }
      return result;
    }

    case 'f': {
      const numerator = childByTag(node, 'num');
      const denominator = childByTag(node, 'den');
      const num = numerator ? ommlNodeToLatex(numerator).trim() : '';
      const den = denominator ? ommlNodeToLatex(denominator).trim() : '';
      if (!num || !den) return num || den || '';
      return `\\frac{${num}}{${den}}`;
    }

    case 'ssup': {
      const base = childByTag(node, 'e');
      const exponent = childByTag(node, 'sup');
      const baseLatex = base ? ommlNodeToLatex(base).trim() : '';
      const supLatex = exponent ? ommlNodeToLatex(exponent).trim() : '';
      if (!baseLatex || !supLatex) return baseLatex;
      return `${baseLatex.length === 1 || /^\\[a-zA-Z]+$/.test(baseLatex) ? baseLatex : wrapGroup(baseLatex)}^{${supLatex}}`;
    }

    case 'ssub': {
      const base = childByTag(node, 'e');
      const subscript = childByTag(node, 'sub');
      const baseLatex = base ? ommlNodeToLatex(base).trim() : '';
      const subLatex = subscript ? ommlNodeToLatex(subscript).trim() : '';
      if (!baseLatex || !subLatex) return baseLatex;
      const op = normalizeOperatorName(baseLatex);
      const limitOperators = new Set(['lim', 'max', 'min', 'sup', 'inf', 'limsup', 'liminf', 'log', 'ln', 'gcd']);
      if (limitOperators.has(op)) return `\\${op}_{${subLatex}}`;
      return `${baseLatex.length === 1 || /^\\[a-zA-Z]+$/.test(baseLatex) ? baseLatex : wrapGroup(baseLatex)}_{${subLatex}}`;
    }

    case 'ssubsup': {
      const base = childByTag(node, 'e');
      const subscript = childByTag(node, 'sub');
      const exponent = childByTag(node, 'sup');
      const baseLatex = base ? ommlNodeToLatex(base).trim() : '';
      const subLatex = subscript ? ommlNodeToLatex(subscript).trim() : '';
      const supLatex = exponent ? ommlNodeToLatex(exponent).trim() : '';
      if (!baseLatex) return '';
      const op = normalizeOperatorName(baseLatex);
      const limitOperators = new Set(['lim', 'max', 'min', 'sup', 'inf', 'limsup', 'liminf', 'log', 'ln', 'int', 'sum', 'prod']);
      const renderedBase = limitOperators.has(op) ? `\\${op}` : (baseLatex.length === 1 || /^\\[a-zA-Z]+$/.test(baseLatex) ? baseLatex : wrapGroup(baseLatex));
      return `${renderedBase}${subLatex ? `_{${subLatex}}` : ''}${supLatex ? `^{${supLatex}}` : ''}`;
    }

    case 'rad': {
      const radicandNode = childByTag(node, 'e');
      const degreeNode = childByTag(node, 'deg');
      const radicand = radicandNode ? ommlNodeToLatex(radicandNode).trim() : '';
      const degree = degreeNode ? ommlNodeToLatex(degreeNode).trim() : '';
      if (!radicand) return '';
      return degree ? `\\sqrt[${degree}]{${radicand}}` : `\\sqrt{${radicand}}`;
    }

    case 'nary': {
      const properties = childByTag(node, 'narypr');
      const characterNode = properties ? childByTag(properties, 'chr') : null;
      const rawCharacter = characterNode ? attr(characterNode, 'val', OMML_NS) : null;
      const character = (rawCharacter || nodeText(characterNode) || '').trim();
      const normalized = character.toLowerCase();
      let operator = '';
      if (character === '∑' || normalized.includes('sum')) operator = '\\sum';
      else if (character === '∏' || normalized.includes('prod')) operator = '\\prod';
      else if (character === '∫' || normalized.includes('int')) operator = '\\int';
      else if (character === '∮') operator = '\\oint';
      else if (character === '∬') operator = '\\iint';
      else if (character === '∭') operator = '\\iiint';
      else if (character === '∯') operator = '\\oiint';
      else if (character === '∰') operator = '\\oiiint';
      else if (character === '⋃') operator = '\\bigcup';
      else if (character === '⋂') operator = '\\bigcap';
      else return ommlChildrenToLatex(node);

      const subNode = childByTag(node, 'sub');
      const supNode = childByTag(node, 'sup');
      const bodyNode = childByTag(node, 'e');
      const sub = subNode ? ommlNodeToLatex(subNode).trim() : '';
      const sup = supNode ? ommlNodeToLatex(supNode).trim() : '';
      const body = bodyNode ? ommlNodeToLatex(bodyNode).trim() : '';
      const bounds = `${sub ? `_{${sub}}` : ''}${sup ? `^{${sup}}` : ''}`;
      return `${operator}${bounds}${body ? ` ${body}` : ''}`;
    }

    case 'd': {
      const properties = childByTag(node, 'dpr');
      const beginNode = properties ? childByTag(properties, 'begchr') : null;
      const endNode = properties ? childByTag(properties, 'endchr') : null;
      const begin = beginNode ? (attr(beginNode, 'val', OMML_NS) ?? nodeText(beginNode)) : '(';
      const end = endNode ? (attr(endNode, 'val', OMML_NS) ?? nodeText(endNode)) : ')';
      const expressions = childrenByTag(node, 'e');
      const content = expressions.map(item => ommlNodeToLatex(item).trim()).filter(Boolean).join(' ');

      // Only classify as cases when the source has multiple explicit entries
      // and an invisible closing delimiter. A single grouped expression is not cases.
      const isCases = begin === '{' && (!end || end === '∅') && expressions.length > 1 &&
        expressions.every(item => childElements(item).length > 0);
      if (isCases) {
        return `\\begin{cases}${expressions.map(item => ommlNodeToLatex(item).trim()).filter(Boolean).join(' \\\\[6pt] ')}\\end{cases}`;
      }

      return `${escapeLatexDelimiter(begin, 'left')}${content}${escapeLatexDelimiter(end, 'right')}`;
    }

    case 'm': {
      const rowNodes = childrenByTag(node, 'mr');
      if (!rowNodes.length) return ommlChildrenToLatex(node);
      const rows = rowNodes.map(row => {
        const cells = childrenByTag(row, 'e').map(cell => ommlNodeToLatex(cell).trim());
        return cells.join(' & ');
      });
      return `\\begin{bmatrix}${rows.join(' \\\\ ')}\\end{bmatrix}`;
    }

    case 'limlow':
    case 'limupp': {
      const expression = childByTag(node, 'e');
      const limit = childByTag(node, 'lim');
      const rawOperator = expression ? ommlNodeToLatex(expression).trim() : 'lim';
      const operator = rawOperator.replace(/^\\?([a-zA-Z]+)$/, '$1');
      const condition = limit ? ommlNodeToLatex(limit).trim() : '';
      if (!condition) return `\\${operator}`;
      return name === 'limlow' ? `\\${operator}_{${condition}}` : `\\${operator}^{${condition}}`;
    }

    case 'func': {
      const functionNode = childByTag(node, 'fname');
      const argumentNode = childByTag(node, 'e');
      const functionName = functionNode ? ommlNodeToLatex(functionNode).trim() : '';
      const argument = argumentNode ? ommlNodeToLatex(argumentNode).trim() : '';
      if (!functionName) return argument;
      const command = functionName.startsWith('\\') ? functionName : `\\${functionName}`;
      const noParentheses = new Set(['\\lim', '\\max', '\\min', '\\sup', '\\inf', '\\limsup', '\\liminf']);
      return noParentheses.has(command) ? `${command}${argument ? ` ${argument}` : ''}` : `${command}${argument ? `\\left(${argument}\\right)` : ''}`;
    }

    case 'acc': {
      const properties = childByTag(node, 'accpr');
      const characterNode = properties ? childByTag(properties, 'chr') : null;
      const character = characterNode ? (attr(characterNode, 'val', OMML_NS) ?? nodeText(characterNode)) : '⃗';
      const expression = childByTag(node, 'e');
      const base = expression ? ommlNodeToLatex(expression).trim() : '';
      if (!base) return '';
      if (character === '⃗' || character === '→') return `\\vec{${base}}`;
      if (character === '̂' || character === '^') return `\\hat{${base}}`;
      if (character === '̅' || character === '¯' || character === '-') return `\\bar{${base}}`;
      if (character === '̇' || character === '.') return `\\dot{${base}}`;
      if (character === '̈' || character === '..') return `\\ddot{${base}}`;
      if (character === '̃' || character === '~') return `\\tilde{${base}}`;
      return `\\overset{${convertText(character)}}{${base}}`;
    }

    case 'box': {
      const expression = childByTag(node, 'e');
      return expression ? ommlNodeToLatex(expression) : ommlChildrenToLatex(node);
    }

    case 'groupchr': {
      const properties = childByTag(node, 'groupchrpr');
      const positionNode = properties ? childByTag(properties, 'pos') : null;
      const position = positionNode ? (attr(positionNode, 'val', OMML_NS) || nodeText(positionNode)).trim() : 'bot';
      const expression = childByTag(node, 'e');
      const base = expression ? ommlNodeToLatex(expression).trim() : '';
      if (!base) return '';
      return position === 'top' ? `\\overbrace{${base}}` : `\\underbrace{${base}}`;
    }

    default:
      return ommlChildrenToLatex(node);
  }
}

function ommlChildrenToLatex(node: DomNode): string {
  let result = '';
  for (const child of Array.from(node?.childNodes || []) as DomNode[]) {
    result += ommlNodeToLatex(child);
  }
  return result;
}

// ============================================================================
// 2. MATHML TO LATEX CONVERSION
// ============================================================================

function mathChildren(node: DomNode): DomNode[] {
  return childElements(node);
}

function mathChild(node: DomNode, index: number): DomNode | null {
  return mathChildren(node)[index] || null;
}

function mathText(node: DomNode): string {
  return convertText(nodeText(node).trim());
}

function mathSpace(node: DomNode): string {
  const width = (attr(node, 'width') || '').trim();
  if (!width) return '\\;';
  if (/^-?0(?:em|ex|px|pt|%)?$/.test(width)) return '';
  const numeric = Number.parseFloat(width);
  if (!Number.isFinite(numeric)) return '\\;';
  if (numeric < 0) return '\\!';
  if (numeric <= 0.2) return '\\,';
  if (numeric <= 0.5) return '\\:';
  if (numeric <= 1) return '\\;';
  return '\\quad';
}

function serializeMathRow(node: DomNode): string {
  let result = '';
  for (const child of Array.from(node?.childNodes || []) as DomNode[]) {
    const piece = mathMLNodeToLatex(child);
    if (piece) result += piece;
  }
  return result;
}

export function mathMLNodeToLatex(node: any): string {
  if (!node) return '';
  if (node.nodeType === TEXT_NODE || node.nodeType === CDATA_SECTION_NODE) {
    const value = String(node.nodeValue || '');
    return value.trim() ? convertText(value) : '';
  }
  if (node.nodeType !== ELEMENT_NODE) return '';

  const tag = localNameOf(node);

  switch (tag) {
    case 'math':
    case 'mrow':
      return serializeMathRow(node);

    case 'mfrac': {
      const numerator = mathChild(node, 0);
      const denominator = mathChild(node, 1);
      if (!numerator || !denominator) return serializeMathRow(node);
      const num = mathMLNodeToLatex(numerator).trim();
      const den = mathMLNodeToLatex(denominator).trim();
      if (!num || !den) return serializeMathRow(node);
      const linethickness = (attr(node, 'linethickness') || '').trim();
      if (linethickness === '0' || linethickness === '0px') {
        return `\\binom{${num}}{${den}}`;
      }
      return `\\frac{${num}}{${den}}`;
    }

    case 'msup':
    case 'msub':
    case 'msubsup': {
      const baseNode = mathChild(node, 0);
      const subNode = tag === 'msub' || tag === 'msubsup' ? mathChild(node, 1) : null;
      const supNode = tag === 'msup' ? mathChild(node, 1) : tag === 'msubsup' ? mathChild(node, 2) : null;
      if (!baseNode || (tag === 'msup' && !supNode) || (tag === 'msub' && !subNode) || (tag === 'msubsup' && (!subNode || !supNode))) {
        return serializeMathRow(node);
      }
      const base = mathMLNodeToLatex(baseNode).trim();
      const sub = subNode ? mathMLNodeToLatex(subNode).trim() : '';
      const sup = supNode ? mathMLNodeToLatex(supNode).trim() : '';
      if (!base) return '';
      const commandName = normalizeOperatorName(base);
      const limitOps = new Set(['lim', 'max', 'min', 'sup', 'inf', 'limsup', 'liminf', 'log', 'ln', 'gcd', 'int', 'sum', 'prod']);
      const renderedBase = limitOps.has(commandName) ? `\\${commandName}` :
        (base.length === 1 || /^\\[a-zA-Z]+$/.test(base) ? base : wrapGroup(base));
      return `${renderedBase}${sub ? `_{${sub}}` : ''}${sup ? `^{${sup}}` : ''}`;
    }

    case 'msqrt': {
      const content = serializeMathRow(node).trim();
      return content ? `\\sqrt{${content}}` : '';
    }

    case 'mroot': {
      const radicandNode = mathChild(node, 0);
      const degreeNode = mathChild(node, 1);
      if (!radicandNode || !degreeNode) return serializeMathRow(node);
      const radicand = mathMLNodeToLatex(radicandNode).trim();
      const degree = mathMLNodeToLatex(degreeNode).trim();
      return radicand && degree ? `\\sqrt[${degree}]{${radicand}}` : '';
    }

    case 'munderover':
    case 'munder':
    case 'mover': {
      const baseNode = mathChild(node, 0);
      if (!baseNode) return serializeMathRow(node);
      const base = mathMLNodeToLatex(baseNode).trim();
      const underNode = tag === 'munder' || tag === 'munderover' ? mathChild(node, 1) : null;
      const overNode = tag === 'mover' ? mathChild(node, 1) : tag === 'munderover' ? mathChild(node, 2) : null;
      const under = underNode ? mathMLNodeToLatex(underNode).trim() : '';
      const over = overNode ? mathMLNodeToLatex(overNode).trim() : '';
      const accent = attr(node, tag === 'mover' ? 'accent' : 'accentunder');
      if (tag === 'mover' && (over === '→' || over === '⃗')) return `\\vec{${base}}`;
      if (tag === 'mover' && (over === '^' || over === '̂')) return `\\hat{${base}}`;
      if (tag === 'mover' && (over === '¯' || over === '‾' || over === '̅')) return `\\bar{${base}}`;
      if (tag === 'mover' && (over === '˙' || over === '̇')) return `\\dot{${base}}`;
      if (tag === 'mover' && (over === '¨' || over === '̈')) return `\\ddot{${base}}`;
      if (tag === 'mover' && (over === '~' || over === '̃')) return `\\tilde{${base}}`;
      if (tag === 'mover' && accent !== 'false' && over) return `\\overset{${over}}{${base}}`;
      if (tag === 'munder' && accent === 'true' && under) return `\\underset{${under}}{${base}}`;
      if (tag === 'munder') return `${base}_{${under}}`;
      if (tag === 'mover') return `${base}^{${over}}`;
      return `${base}${under ? `_{${under}}` : ''}${over ? `^{${over}}` : ''}`;
    }

    case 'mtable': {
      const rows = childElements(node).filter(row => ['mtr', 'mlabeledtr'].includes(localNameOf(row)));
      if (!rows.length) return '';
      const renderedRows = rows.map(row => {
        const cells = childElements(row).filter(cell => localNameOf(cell) === 'mtd');
        return cells.map(cell => mathMLNodeToLatex(cell).trim()).join(' & ');
      });
      const environment = (attr(node, 'columnalign') || '').toLowerCase().includes('left') ? 'array' : 'matrix';
      if (environment === 'array') {
        const count = Math.max(1, ...renderedRows.map(row => row.split('&').length));
        return `\\begin{array}{${'l'.repeat(count)}}${renderedRows.join(' \\\\ ')}\\end{array}`;
      }
      return `\\begin{matrix}${renderedRows.join(' \\\\ ')}\\end{matrix}`;
    }

    case 'mfenced': {
      const open = attr(node, 'open') ?? '(';
      const close = attr(node, 'close') ?? ')';
      const separators = attr(node, 'separators') ?? ',';
      const children = mathChildren(node);
      const rendered = children.map(child => mathMLNodeToLatex(child).trim());
      const separatorChars = Array.from(separators.replace(/\s/g, ''));
      const body = rendered.map((part, index) => {
        if (index === 0) return part;
        return `${separatorChars[Math.min(index - 1, Math.max(0, separatorChars.length - 1))] || ','}${part}`;
      }).join('');
      return `${escapeLatexDelimiter(open, 'left')}${body}${escapeLatexDelimiter(close, 'right')}`;
    }

    case 'mi':
    case 'mn':
    case 'mo':
      return mathText(node);

    case 'mtext':
      return `\\text{${mathText(node).replace(/[{}]/g, '')}}`;

    case 'mspace':
      return mathSpace(node);

    case 'mstyle':
    case 'mpadded':
    case 'mphantom':
      return tag === 'mphantom' ? `\\phantom{${serializeMathRow(node)}}` : serializeMathRow(node);

    case 'menclose': {
      const notation = (attr(node, 'notation') || 'longdiv').split(/\s+/);
      const content = serializeMathRow(node);
      if (notation.includes('box')) return `\\boxed{${content}}`;
      if (notation.includes('roundedbox')) return `\\boxed{${content}}`;
      if (notation.includes('circle')) return `\\boxed{${content}}`;
      if (notation.includes('updiagonalstrike')) return `\\cancel{${content}}`;
      return content;
    }

    case 'semantics': {
      const children = childElements(node);
      const presentation = children.find(child => !['annotation', 'annotation-xml'].includes(localNameOf(child)));
      return presentation ? mathMLNodeToLatex(presentation) : '';
    }

    case 'annotation':
    case 'annotation-xml':
      return '';

    default:
      return serializeMathRow(node);
  }
}

// ============================================================================
// 3. HTML DOCUMENT MATH EXTRACTOR
// ============================================================================

function isMathMlElement(node: DomNode): boolean {
  if (!node || node.nodeType !== ELEMENT_NODE) return false;
  const name = localNameOf(node);
  if (name !== 'math') return false;
  const namespace = node.namespaceURI || '';
  return namespace === MATHML_NS || !namespace || String(node.nodeName || '').toLowerCase() === 'math';
}

function isOmmlElement(node: DomNode): boolean {
  if (!node || node.nodeType !== ELEMENT_NODE) return false;
  const name = localNameOf(node);
  if (name !== 'omath' && name !== 'omathpara') return false;
  const namespace = node.namespaceURI || '';
  const nodeName = String(node.nodeName || '').toLowerCase();
  return namespace === OMML_NS || nodeName.startsWith('m:') || !namespace;
}

function collectMathRoots(root: DomNode): DomNode[] {
  const found: DomNode[] = [];
  const visit = (node: DomNode) => {
    if (!node) return;
    if (isMathMlElement(node) || isOmmlElement(node)) {
      found.push(node);
      return;
    }
    if (node.childNodes) {
      for (let i = 0; i < node.childNodes.length; i++) visit(node.childNodes[i]);
    }
  };
  visit(root);
  return found;
}

function convertMathDomNode(node: DomNode): string | null {
  try {
    const latex = isMathMlElement(node) ? mathMLNodeToLatex(node) : ommlNodeToLatex(node);
    const clean = String(latex || '').trim();
    return clean ? ` $${clean}$ ` : null;
  } catch {
    return null;
  }
}

function htmlDomToText(node: DomNode): string {
  if (!node) return '';
  if (node.nodeType === TEXT_NODE || node.nodeType === CDATA_SECTION_NODE) return String(node.nodeValue || '');
  if (node.nodeType !== ELEMENT_NODE && node.nodeType !== 9 && node.nodeType !== 11) return '';

  const tag = localNameOf(node);
  if (tag === 'script' || tag === 'style' || tag === 'noscript') return '';
  if (tag === 'br') return '\n';
  if (tag === 'sup' || tag === 'sub') {
    const content = Array.from(node.childNodes || []).map((child: DomNode) => htmlDomToText(child)).join('').trim();
    return content ? (tag === 'sup' ? `^{${content}}` : `_{${content}}`) : '';
  }

  let content = '';
  if (node.childNodes) {
    for (let i = 0; i < node.childNodes.length; i++) content += htmlDomToText(node.childNodes[i]);
  }
  if (['p', 'div', 'tr', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) return `${content}\n\n`;
  if (tag === 'td' || tag === 'th') return `${content} `;
  return content;
}

function getBrowserDOMParser(): any {
  const root: any = typeof globalThis !== 'undefined' ? globalThis : {};
  const candidates = [root.DOMParser, root.window?.DOMParser, root.self?.DOMParser];
  for (const candidate of candidates) {
    if (typeof candidate === 'function') return candidate;
  }
  return null;
}

function parseHtmlDocument(html: string): DomNode | null {
  const Parser = getBrowserDOMParser();
  if (!Parser) return null;
  try {
    const doc = new Parser().parseFromString(html, 'text/html');
    return doc?.documentElement ? doc : null;
  } catch {
    return null;
  }
}

function fallbackRegexHtmlToLatex(html: string): string {
  let result = html;
  // This fallback is intentionally conservative and is only used without an HTML DOM parser.
  result = result.replace(/<math\b[\s\S]*?<\/math>/gi, match => {
    const doc = parseMarkupToDoc(match, 'xml');
    if (!doc) return match;
    const latex = mathMLNodeToLatex(doc.documentElement || doc).trim();
    return latex ? ` $${latex}$ ` : match;
  });
  result = result.replace(/<(?:m:)?oMathPara\b[\s\S]*?<\/(?:m:)?oMathPara>/gi, match => {
    const doc = parseMarkupToDoc(match, 'xml');
    if (!doc) return match;
    const latex = ommlNodeToLatex(doc.documentElement || doc).trim();
    return latex ? ` $${latex}$ ` : match;
  });
  result = result.replace(/<(?:m:)?oMath\b[\s\S]*?<\/(?:m:)?oMath>/gi, match => {
    const doc = parseMarkupToDoc(match, 'xml');
    if (!doc) return match;
    const latex = ommlNodeToLatex(doc.documentElement || doc).trim();
    return latex ? ` $${latex}$ ` : match;
  });
  return result.replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|tr|li|h[1-6])>/gi, '\n\n')
    .replace(/<[^>]*>/g, ' ');
}

export function convertHtmlWithMath(htmlString: string): string {
  if (typeof htmlString !== 'string' || !htmlString.trim()) return '';

  const doc = parseHtmlDocument(htmlString);
  if (!doc) {
    return reconstructUnicodeMath(fallbackRegexHtmlToLatex(htmlString))
      .replace(/\u00A0/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  const mathRoots = collectMathRoots(doc);
  for (const mathNode of mathRoots) {
    const converted = convertMathDomNode(mathNode);
    if (!converted || !mathNode.parentNode) continue;
    try {
      const textNode = (mathNode.ownerDocument || doc).createTextNode(converted);
      mathNode.parentNode.replaceChild(textNode, mathNode);
    } catch {
      // Leave the original node untouched if replacement fails.
    }
  }

  const extracted = htmlDomToText(doc);
  return reconstructUnicodeMath(extracted)
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
