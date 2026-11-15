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
} from './domAdapter.js';
import { reconstructUnicodeMath } from './unicodeMathReconstructor.js';
import katex from 'katex';

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
  const withFn = (value || '').replace(
    /(?<![\\a-zA-Z])(arcsin|arccos|arctan|sinh|cosh|tanh|limsup|liminf|sin|cos|tan|cot|sec|csc|ln|log|exp|lim|max|min|sup|inf|det|gcd|lcm)(?!\w)/g,
    '\\$1'
  );
  let res = reconstructUnicodeMath(withFn);
  if (/^\{[^{}]+\}$/.test(res.trim())) {
    res = `\\{${res.trim().slice(1, -1)}\\}`;
  }
  return res;
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
    '[': side === 'left' ? '\\left[' : '\\right]',
    ']': side === 'left' ? '\\left[' : '\\right]',
    '{': side === 'left' ? '\\left\\{' : '\\right\\}',
    '}': side === 'left' ? '\\left\\{' : '\\right\\}',
    '|': side === 'left' ? '\\left|' : '\\right|',
    '‖': side === 'left' ? '\\left\\|' : '\\right\\|',
    '⌈': side === 'left' ? '\\left\\lceil ' : '\\right\\lceil',
    '⌉': side === 'left' ? '\\left\\rceil' : '\\right\\rceil',
    '⌊': side === 'left' ? '\\left\\lfloor ' : '\\right\\rfloor',
    '⌋': side === 'left' ? '\\left\\rfloor' : '\\right\\rfloor',
    '⟨': side === 'left' ? '\\left\\langle ' : '\\right\\langle',
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

/**
 * Safely concatenates LaTeX tokens, ensuring a command name (like \gamma or \in)
 * does not accidentally fuse with an adjacent alphanumeric character (like x -> \gammax).
 */
function joinLatexChunks(prev: string, next: string): string {
  if (!prev) return next;
  if (!next) return prev;
  if (/\\[a-zA-Z]+$/.test(prev) && /^[a-zA-Z0-9]/.test(next)) {
    return `${prev} ${next}`;
  }
  return prev + next;
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
        result = joinLatexChunks(result, ommlNodeToLatex(child));
      }
      return result;
    }

    case 'f': {
      const properties = childByTag(node, 'fpr');
      const typeNode = properties ? childByTag(properties, 'type') : null;
      const fType = typeNode ? (attr(typeNode, 'val', OMML_NS) || nodeText(typeNode)).trim() : 'bar';
      const numerator = childByTag(node, 'num');
      const denominator = childByTag(node, 'den');
      const num = numerator ? ommlNodeToLatex(numerator).trim() : '';
      const den = denominator ? ommlNodeToLatex(denominator).trim() : '';
      if (fType === 'noBar') {
        return `\\binom{${num}}{${den}}`;
      }
      if (!num && !den) return '';
      return `\\frac{${num || '1'}}{${den || '1'}}`;
    }

    case 'ssup': {
      const base = childByTag(node, 'e');
      const exponent = childByTag(node, 'sup');
      const baseLatex = base ? ommlNodeToLatex(base).trim() : '';
      const supLatex = exponent ? ommlNodeToLatex(exponent).trim() : '';
      if (!baseLatex || !supLatex) return baseLatex;
      if (/^(?:['′]|\\prime)$/.test(supLatex)) return `${baseLatex}'`;
      const op = normalizeOperatorName(baseLatex);
      const trigOperators = new Set(['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'sinh', 'cosh', 'tanh', 'log', 'ln']);
      if (trigOperators.has(op)) return `\\${op}^{${supLatex}}`;
      return `${baseLatex.length === 1 || /^\\[a-zA-Z]+$/.test(baseLatex) ? baseLatex : wrapGroup(baseLatex)}^{${supLatex}}`;
    }

    case 'ssub': {
      const base = childByTag(node, 'e');
      const subscript = childByTag(node, 'sub');
      const baseLatex = base ? ommlNodeToLatex(base).trim() : '';
      let subLatex = subscript ? ommlNodeToLatex(subscript).trim() : '';
      if (!baseLatex || !subLatex) return baseLatex;
      const op = normalizeOperatorName(baseLatex);
      if ((op === 'sum' || baseLatex === '\\sum') && /^"?aes"?$/i.test(subLatex.replace(/\s+/g, ''))) {
        subLatex = 'a \\in S';
      }
      const limitOperators = new Set(['lim', 'max', 'min', 'sup', 'inf', 'limsup', 'liminf', 'log', 'ln', 'gcd', 'sum', 'prod', 'int', 'oint', 'iint', 'iiint', 'bigcup', 'bigcap']);
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
      const properties = childByTag(node, 'radpr');
      const degHideNode = properties ? childByTag(properties, 'deghide') : null;
      const isDegHidden = degHideNode ? (attr(degHideNode, 'val', OMML_NS) === 'on' || attr(degHideNode, 'val', OMML_NS) === '1') : false;
      const degreeNode = isDegHidden ? null : childByTag(node, 'deg');
      const radicandNode = childByTag(node, 'e');
      const degree = degreeNode ? ommlNodeToLatex(degreeNode).trim() : '';
      const radicand = radicandNode ? ommlNodeToLatex(radicandNode).trim() : '';
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
      if (!character || character === '∫' || normalized.includes('int')) operator = '\\int';
      else if (character === '∑' || normalized.includes('sum')) operator = '\\sum';
      else if (character === '∏' || normalized.includes('prod')) operator = '\\prod';
      else if (character === '∮') operator = '\\oint';
      else if (character === '∬') operator = '\\iint';
      else if (character === '∭') operator = '\\iiint';
      else if (character === '∯') operator = '\\oiint';
      else if (character === '∰') operator = '\\oiiint';
      else if (character === '⋃') operator = '\\bigcup';
      else if (character === '⋂') operator = '\\bigcap';
      else operator = character.startsWith('\\') ? character : `\\${character}`;

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
      const sepNode = properties ? childByTag(properties, 'sepchr') : null;

      const rawBegin = beginNode ? (attr(beginNode, 'val', OMML_NS) ?? nodeText(beginNode)) : null;
      const rawEnd = endNode ? (attr(endNode, 'val', OMML_NS) ?? nodeText(endNode)) : null;
      const rawSep = sepNode ? (attr(sepNode, 'val', OMML_NS) ?? nodeText(sepNode)) : null;

      // When begin is explicitly set (e.g. '{') and end is omitted, end is empty (invisible '\right.'), NOT ')'
      const begin = rawBegin !== null ? rawBegin : '(';
      let end = rawEnd !== null ? rawEnd : '';

      const expressions = childrenByTag(node, 'e');

      // If end is missing, dot, or null, resolve matching closing delimiter:
      if (!end || end === '∅' || end === '.' || !end.trim()) {
        if (begin === '(') end = ')';
        else if (begin === '[') end = ']';
        else if (begin === '{') {
          // If it is NOT a cases environment and expressions <= 1, resolve to matching '}'
          // (prevents set curly braces from disappearing into '\right.')
          const matrixChild = expressions.length === 1 ? (childByTag(expressions[0], 'm') || childByTag(expressions[0], 'eqarr')) : null;
          if (expressions.length <= 1 && !matrixChild) {
            end = '}';
          } else {
            end = ''; // Keep empty for piecewise cases
          }
        }
      }
      const sep = rawSep !== null ? rawSep : ',';

      // Check if expression contains an inner matrix element <m:m> or equation array <m:eqArr>
      const matrixChild = expressions.length === 1 ? (childByTag(expressions[0], 'm') || childByTag(expressions[0], 'eqarr')) : null;
      if (matrixChild) {
        const isEqArr = localNameOf(matrixChild) === 'eqarr';
        let rows: string[] = [];
        if (isEqArr) {
          const rowNodes = childrenByTag(matrixChild, 'e');
          rows = rowNodes.map(r => ommlNodeToLatex(r).trim());
        } else {
          const rowNodes = childrenByTag(matrixChild, 'mr');
          rows = rowNodes.map(row => {
            const cells = childrenByTag(row, 'e').map(cell => ommlNodeToLatex(cell).trim());
            return cells.join(' & ');
          });
        }

        if (begin === '{' && (!end || end === '∅' || end === '.' || end === ' ' || !end.trim())) {
          return `\\begin{cases}${rows.join(' \\\\[6pt] ')}\\end{cases}`;
        }
        if (begin === '[' && end === ']') {
          return `\\begin{bmatrix}${rows.join(' \\\\ ')}\\end{bmatrix}`;
        }
        if (begin === '(' && end === ')') {
          return `\\begin{pmatrix}${rows.join(' \\\\ ')}\\end{pmatrix}`;
        }
        if (begin === '|' && end === '|') {
          return `\\begin{vmatrix}${rows.join(' \\\\ ')}\\end{vmatrix}`;
        }
        if (begin === '‖' && end === '‖') {
          return `\\begin{Vmatrix}${rows.join(' \\\\ ')}\\end{Vmatrix}`;
        }
      }

      // Only classify as cases when the source has multiple explicit entries
      // and an invisible closing delimiter.
      const isCases = begin === '{' && (!end || end === '∅' || end === '.' || end === ' ' || !end.trim()) && expressions.length > 1;
      if (isCases) {
        return `\\begin{cases}${expressions.map(item => ommlNodeToLatex(item).trim()).filter(Boolean).join(' \\\\[6pt] ')}\\end{cases}`;
      }

      const separator = sep ? (sep === ',' ? ', ' : sep === ';' ? '; ' : sep === '|' ? ' \\mid ' : ` ${sep} `) : ', ';
      const content = expressions.map(item => ommlNodeToLatex(item).trim()).filter(Boolean).join(separator);
      return `${escapeLatexDelimiter(begin, 'left')}${content}${escapeLatexDelimiter(end, 'right')}`;
    }

    case 'eqarr': {
      const expressions = childrenByTag(node, 'e');
      if (!expressions.length) return ommlChildrenToLatex(node);
      const rows = expressions.map(e => ommlNodeToLatex(e).trim());
      const body = rows.join(' \\\\ ');
      if (body.includes('&') || rows.length > 1) {
        return `\\begin{aligned} ${body} \\end{aligned}`;
      }
      return body;
    }

    case 'bar': {
      const properties = childByTag(node, 'barpr');
      const posNode = properties ? childByTag(properties, 'pos') : null;
      const pos = posNode ? (attr(posNode, 'val', OMML_NS) || nodeText(posNode)).trim() : 'top';
      const expression = childByTag(node, 'e');
      const base = expression ? ommlNodeToLatex(expression).trim() : '';
      if (!base) return '';
      return pos === 'bot' ? `\\underline{${base}}` : `\\overline{${base}}`;
    }

    case 'borderbox': {
      const expression = childByTag(node, 'e');
      const base = expression ? ommlNodeToLatex(expression).trim() : '';
      return base ? `\\boxed{${base}}` : '';
    }

    case 'spre': {
      const baseNode = childByTag(node, 'e');
      const subNode = childByTag(node, 'sub');
      const supNode = childByTag(node, 'sup');
      const base = baseNode ? ommlNodeToLatex(baseNode).trim() : '';
      const sub = subNode ? ommlNodeToLatex(subNode).trim() : '';
      const sup = supNode ? ommlNodeToLatex(supNode).trim() : '';
      const bounds = `${sub ? `_{${sub}}` : ''}${sup ? `^{${sup}}` : ''}`;
      return `{}${bounds}${base ? `{${base}}` : ''}`;
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
      const cleanName = functionName.replace(/^\\/, '');
      const STANDARD_MATH_FUNCS = new Set([
        'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
        'arcsin', 'arccos', 'arctan', 'arccot', 'arcsec', 'arccsc',
        'sinh', 'cosh', 'tanh', 'coth', 'sech', 'csch',
        'ln', 'log', 'exp', 'lg',
        'lim', 'limsup', 'liminf', 'max', 'min', 'sup', 'inf',
        'det', 'dim', 'ker', 'hom', 'arg', 'deg', 'gcd', 'lcm', 'Pr'
      ]);
      const command = functionName.startsWith('\\')
        ? functionName
        : STANDARD_MATH_FUNCS.has(cleanName)
        ? `\\${cleanName}`
        : functionName;
      const noParentheses = new Set(['\\lim', '\\max', '\\min', '\\sup', '\\inf', '\\limsup', '\\liminf']);
      if (!argument) return command;
      if (noParentheses.has(command) || argument.startsWith('\\left') || argument.startsWith('{') || argument.startsWith('(') || argument.startsWith('[')) {
        return `${command} ${argument}`;
      }
      return `${command}\\left(${argument}\\right)`;
    }

    case 'acc': {
      const properties = childByTag(node, 'accpr');
      const characterNode = properties ? childByTag(properties, 'chr') : null;
      const character = characterNode ? (attr(characterNode, 'val', OMML_NS) ?? nodeText(characterNode)) : '⃗';
      const expression = childByTag(node, 'e');
      const base = expression ? ommlNodeToLatex(expression).trim() : '';
      if (!base) return '';
      if (character === '⃗' || character === '→') return `\\vec{${base}}`;
      if (character === '̂' || character === '^' || character === 'ˆ') return `\\hat{${base}}`;
      if (character === '̅' || character === '¯' || character === '-') return `\\bar{${base}}`;
      if (character === '̇' || character === '.') return `\\dot{${base}}`;
      if (character === '̈' || character === '..') return `\\ddot{${base}}`;
      if (character === '⃛' || character === '...') return `\\dddot{${base}}`;
      if (character === '̃' || character === '~') return `\\tilde{${base}}`;
      if (character === '⃡' || character === '↔') return `\\overleftrightarrow{${base}}`;
      if (character === '̆') return `\\breve{${base}}`;
      if (character === '̌') return `\\check{${base}}`;
      if (character === '́') return `\\acute{${base}}`;
      if (character === '̀') return `\\grave{${base}}`;
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
    result = joinLatexChunks(result, ommlNodeToLatex(child));
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
    if (child?.nodeType === ELEMENT_NODE && localNameOf(child) === 'mo') {
      const rawMo = nodeText(child).trim();
      if (rawMo === '\u2062') {
        if (result && !result.endsWith(' ')) result += ' ';
        continue;
      }
      if (rawMo === '\u2146' || rawMo === '&dd;') {
        result = joinLatexChunks(result, 'd');
        continue;
      }
      const piece = mathMLNodeToLatex(child).trim();
      if (!piece) continue;
      if (result.trim() && /^(?:[+\-=]|\\(?:pm|mp|times|div|cdot|leq|geq|neq|approx|equiv|to|rightarrow))$/.test(piece)) {
        result = `${result.replace(/\s+$/, '')} ${piece} `;
      } else {
        result = result.endsWith(' ') ? `${result}${piece}` : joinLatexChunks(result, piece);
      }
      continue;
    }
    const piece = mathMLNodeToLatex(child);
    if (piece) {
      result = result.endsWith(' ') ? `${result}${piece}` : joinLatexChunks(result, piece);
    }
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
      if (tag === 'mover' && (over === '^' || over === '̂' || over === 'ˆ')) return `\\hat{${base}}`;
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
    case 'mo': {
      const txt = mathText(node);
      if (tag === 'mo') {
        if (txt === '{') return '\\{';
        if (txt === '}') return '\\}';
      }
      return txt;
    }

    case 'mtext': {
      const txt = mathText(node).trim();
      if (/^\\?\{[^{}]+\\?\}$/.test(txt)) {
        const inner = txt.replace(/^\\?\{/, '').replace(/\\?\}$/, '').trim();
        return `\\{${inner}\\} `;
      }
      return `\\text{${txt}}`;
    }

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

function sanitizeOmmlHtmlSnippet(snippet: string): string {
  return snippet
    // Strip HTML comments or conditional fallback markers inside the snippet
    .replace(/<!--[\s\S]*?-->/g, '')
    // Strip non-OMML presentational HTML wrapper tags that Word 15/16 injects with unquoted attributes
    .replace(/<\/?(?:span|i|b|u|font|sub|sup|o:p|st1:[a-z0-9_-]+)\b[^>]*>/gi, '')
    // Replace HTML named entities that are not predefined in strict XML
    .replace(/&nbsp;/gi, '&#160;')
    .replace(/&minus;/gi, '&#8722;')
    .replace(/&times;/gi, '&#215;')
    .replace(/&divide;/gi, '&#247;')
    .replace(/&le;/gi, '&#8804;')
    .replace(/&ge;/gi, '&#8805;')
    .replace(/&ne;/gi, '&#8800;')
    .replace(/&infin;/gi, '&#8734;')
    .replace(/&rarr;/gi, '&#8594;')
    .replace(/&sum;/gi, '&#8721;')
    .replace(/&prod;/gi, '&#8719;')
    .replace(/&radic;/gi, '&#8730;')
    .replace(/&int;/gi, '&#8747;')
    // Quote any remaining unquoted attribute values on XML tags
    .replace(/(\s[a-zA-Z_:][-a-zA-Z0-9_:.]*)=([^\s"'<>=`]+)/g, '$1="$2"');
}

/**
 * Converts a raw OMML XML element string directly to LaTeX.
 * Injects required OpenXML math and word namespaces if omitted.
 */
function convertRawOmmlSnippetToLatex(snippet: string): string {
  if (!snippet) return '';
  const cleanedSnippet = sanitizeOmmlHtmlSnippet(snippet).trim();
  const withNs = cleanedSnippet.includes('xmlns:m')
    ? cleanedSnippet
    : cleanedSnippet.replace(
        /^<([a-zA-Z0-9_-]+:)?(oMathPara|oMath)\b/i,
        '<$1$2 xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
      );
  const doc = parseMarkupToDoc(withNs, 'xml');
  if (!doc) return '';
  let latex = ommlNodeToLatex(doc.documentElement || doc).trim();
  // Post-clean: number sets like \in R -> \in \mathbb{R} and \to R -> \to \mathbb{R} (except tuples (a,b) \in R in relation R)
  latex = latex.replace(/(?<!\)\s*)\\(in|notin|subseteq|subset|to|rightarrow|mapsto)(?![A-Za-z])\s*(Z|R|N|Q|C)\b/g, '\\$1 \\mathbb{$2}');
  latex = latex.replace(/(\(\s*[-+0-9a-zA-Z_\\^'′]+\s*,\s*[-+0-9a-zA-Z_\\^'′]+\s*\)\s*\\(?:in|notin)\s*)\\mathbb\{R\}/g, '$1R');
  latex = latex.replace(/:\s*(Z|R|N|Q|C)\s*\\(to|rightarrow|mapsto)\b/g, ': \\mathbb{$1} \\$2');
  // Escape unescaped finite set curly braces: e.g. {-2,-1,0,1,2} -> \{-2,-1,0,1,2\}
  latex = latex.replace(/(?<!\\)\{([-+0-9a-zA-Z_\\^'′\s.,\-/*]+?)(?<!\\)\}/g, (m, inner) => {
    if (/,/.test(inner)) return `\\{${inner.trim().replace(/\s*,\s*/g, ', ')}\\}`;
    return m;
  });
  // Ensure space between big operator with subscript/superscript and following alphanumeric token
  latex = latex.replace(/(\\(?:sum|prod|int|lim)_(?:\{[^{}]*\}|[a-zA-Z0-9])(?:\^(?:\{[^{}]*\}|[a-zA-Z0-9]))?)(?=[a-zA-Z0-9])/g, '$1 ');
  // Corrupted floor bracket paired with closing brace: e.g. \lfloor f(t)} -> \{f(t)\}
  latex = latex.replace(/\\lfloor\s*([^{\n\r}]+?)\}/g, '\\{$1\\}');
  latex = latex.replace(/\\lfloor\s*\\left\(\s*([^()]+)\s*\\right\)\s*\}/g, '\\{\\left($1\\right)\\}');
  // Math operators
  latex = latex.replace(/(?<![\\a-zA-Z])(min|max|sup|inf|gcd|lcm|det)\b(?![a-zA-Z])/g, '\\$1');
  // Normal English words inside math conditions
  latex = latex.replace(/(?<=[0-9a-zA-Z\s>≤<≥=])\b(and|if|for|when|where|or)\b(?=[0-9a-zA-Z\s>≤<≥=])/g, '\\text{ $1 }');
  latex = latex.replace(/([0-9a-zA-Z])and([0-9a-zA-Z])/g, '$1 \\text{ and } $2');
  latex = latex.replace(/\\text\{\s*([a-zA-Z]+)\s*\}\s*\\text\{\s*([a-zA-Z]+)\s*\}/g, '\\text{ $1 $2 }');
  // Quotes used for spacing inside math: e.g. " " -> ' '
  latex = latex.replace(/["']\s*["']/g, ' ');
  latex = latex.replace(/"\s*([a-zA-Z\s]+?)\s*"/g, '\\text{ $1 }');
  return latex;
}

/**
 * Validates LaTeX expression with KaTeX without throwing.
 */
function validateWithKaTeX(latex: string): { isValid: boolean; error?: string } {
  if (!latex || !latex.trim()) return { isValid: false, error: 'Empty formula' };
  if (/\\frac\{\s*\}\{\s*\}/.test(latex) || /\\frac\{\s*\}\{/.test(latex) || /\\frac\{[^{}]*\}\{\s*\}/.test(latex)) {
    return { isValid: false, error: 'Empty fraction structure' };
  }
  try {
    let katexModule: any = (katex as any)?.default || katex;
    if (!katexModule || typeof katexModule.renderToString !== 'function') {
      const g: any = typeof globalThis !== 'undefined' ? globalThis : {};
      katexModule = g.katex || (typeof (globalThis as any).window !== 'undefined' ? (globalThis as any).window.katex : null);
    }

    if (katexModule && typeof katexModule.renderToString === 'function') {
      katexModule.renderToString(latex, { throwOnError: true, strict: false });
    }
    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, error: err?.message || 'KaTeX validation failed' };
  }
}

function fallbackPlainText(rawFallback: string | undefined): string {
  if (!rawFallback) return '';
  return rawFallback.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * One Word equation is the conditional comment that contains <m:oMath> plus the
 * following <![if !msEquation]> fallback. The LaTeX replaces that whole unit,
 * so it is not left inside an HTML comment. The fallback is removed only after
 * KaTeX accepts the LaTeX.
 */
function replaceWordEquationUnits(rawHtml: string): HtmlMathPreprocessResult {
  const warnings: string[] = [];
  let needsReview = false;
  const unitRe = /<!--\[if\s+gte\s+(?:msEquation|mso)\s+\d+\]>([\s\S]*?)<!\[endif\]-->(\s*<!\[if\s+!msEquation\]>([\s\S]*?)<!\[endif\]>)?/gi;

  let html = rawHtml.replace(unitRe, (full, inner: string, _fallbackBlock: string | undefined, rawFallback: string | undefined) => {
    if (!/<(?:m:)?(?:oMath|oMathPara)\b/i.test(inner)) return full;
    return replaceOneEquation(inner, rawFallback, warnings, (flag) => {
      needsReview = needsReview || flag;
    });
  });

  html = html.replace(/<(?:m:)?(oMathPara|oMath)\b[\s\S]*?<\/(?:m:)?\1>/gi, (full, tag: string) => {
    return replaceOneEquation(full, undefined, warnings, (flag) => {
      needsReview = needsReview || flag;
    }, /oMathPara/i.test(tag));
  });

  return { html, warnings, needsReview };
}

function replaceOneEquation(
  container: string,
  rawFallback: string | undefined,
  warnings: string[],
  markReview: (flag: boolean) => void,
  forceDisplay?: boolean
): string {
  const eqRe = /<(?:m:)?(oMathPara|oMath)\b[\s\S]*?<\/(?:m:)?\1>/gi;
  const snippets = [...container.matchAll(eqRe)];
  if (!snippets.length) {
    const fallback = fallbackPlainText(rawFallback);
    return fallback ? ` ${fallback} ` : ' ';
  }

  let convertedCount = 0;
  const replaced = container.replace(eqRe, (fullSnippet, tag: string) => {
    const isDisplay = forceDisplay ?? /oMathPara/i.test(tag);
    const latex = convertRawOmmlSnippetToLatex(fullSnippet);
    if (!latex.trim()) {
      const rawTextContent = fullSnippet
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;|&#160;/gi, '')
        .replace(/[□▒\s\u2000-\u200F\u2060-\u2064\u00A0()]/g, '')
        .trim();
      const hasBrokenStructure = /<(?:m:)?(?:f|rad|nary|limLow|limUpp)\b/i.test(fullSnippet);
      if (!rawTextContent && !hasBrokenStructure) {
        return ' ';
      }
    }
    const validation = validateWithKaTeX(latex);
    if (latex && validation.isValid) {
      convertedCount++;
      return isDisplay ? ` $$${latex}$$ ` : ` $${latex}$ `;
    }
    markReview(true);
    warnings.push(`[KaTeX Validation Warning]: Failed to validate equation "${latex}": ${validation.error || 'conversion failed'}.`);
    return latex ? (isDisplay ? ` $$${latex}$$ ` : ` $${latex}$ `) : ' ';
  });

  if (convertedCount === 0 && rawFallback) {
    const fallback = fallbackPlainText(rawFallback);
    if (fallback) return ` ${fallback} `;
  }

  return replaced.replace(/<\/?xml\b[^>]*>/gi, '');
}

export interface HtmlMathPreprocessResult {
  html: string;
  warnings: string[];
  needsReview: boolean;
}

/**
 * Preprocesses raw HTML strings to locate Word OMML (<m:oMath>, <m:oMathPara>)
 * even when nested inside Microsoft Office conditional comments (<!--[if gte mso 9]><xml>...).
 * Only drops Word's fallback text (<![if !msEquation]>...) if the equation converts AND passes
 * KaTeX validation. If conversion or validation fails, keeps the fallback text and flags needsReview.
 */
export function preprocessRawHtmlMathDetailed(rawHtml: string): HtmlMathPreprocessResult {
  if (!rawHtml || typeof rawHtml !== 'string') {
    return { html: '', warnings: [], needsReview: false };
  }

  let result = rawHtml;
  const warnings: string[] = [];
  let needsReview = false;

  const hasOmml = /<(?:m:)?(?:oMath|oMathPara)\b/i.test(result);
  if (hasOmml) {
    const replaced = replaceWordEquationUnits(result);
    result = replaced.html;
    warnings.push(...replaced.warnings);
    needsReview = needsReview || replaced.needsReview;
    result = result.replace(/<!--\[if supportFields\]>[\s\S]*?field-separator[\s\S]*?<!\[endif\]>[\s\S]*?<!--\[if supportFields\]>[\s\S]*?field-end[\s\S]*?<!\[endif\]>/gi, '');
    result = result.replace(/<!--\[if supportFields\]>[\s\S]*?<!\[endif\]>/gi, '');
  }

  // Convert MathML <math> tags if present in the raw markup
  if (/<math\b/i.test(result)) {
    result = result.replace(/<math\b[\s\S]*?<\/math>/gi, (match) => {
      let xmlStr = sanitizeOmmlHtmlSnippet(match).replace(/&dd;/gi, '&#8518;');
      if (!xmlStr.includes('xmlns')) {
        xmlStr = xmlStr.replace(/<math/i, '<math xmlns="http://www.w3.org/1998/Math/MathML"');
      }
      const doc = parseMarkupToDoc(xmlStr, 'xml');
      if (!doc) return match;
      const isDisplay = /display=["']block["']/i.test(match);
      const latex = mathMLNodeToLatex(doc.documentElement || doc).trim();
      if (!latex) return match;
      const validation = validateWithKaTeX(latex);
      if (!validation.isValid) {
        needsReview = true;
        warnings.push(`[KaTeX Validation Warning]: MathML expression "${latex}" failed validation: ${validation.error}`);
      }
      return isDisplay ? ` $$${latex}$$ ` : ` $${latex}$ `;
    });
  }

  return { html: result, warnings, needsReview };
}

export function preprocessRawHtmlMath(rawHtml: string): string {
  return preprocessRawHtmlMathDetailed(rawHtml).html;
}

function decodeHtmlMathEntities(text: string): string {
  const entityMap: Record<string, string> = {
    '&nbsp;': ' ',
    '&alpha;': 'α',
    '&beta;': 'β',
    '&gamma;': 'γ',
    '&delta;': 'δ',
    '&epsilon;': 'ε',
    '&theta;': 'θ',
    '&lambda;': 'λ',
    '&mu;': 'μ',
    '&pi;': 'π',
    '&sigma;': 'σ',
    '&phi;': 'φ',
    '&omega;': 'ω',
    '&Delta;': 'Δ',
    '&Omega;': 'Ω',
    '&le;': '≤',
    '&ge;': '≥',
    '&ne;': '≠',
    '&asymp;': '≈',
    '&equiv;': '≡',
    '&sum;': '∑',
    '&prod;': '∏',
    '&int;': '∫',
    '&infin;': '∞',
    '&radic;': '√',
    '&part;': '∂',
    '&pm;': '±',
    '&times;': '×',
    '&divide;': '÷',
    '&minus;': '−',
    '&rarr;': '→',
    '&rArr;': '⇒',
    '&isin;': '∈',
    '&notin;': '∉',
    '&sub;': '⊂',
    '&sube;': '⊆',
    '&cup;': '∪',
    '&cap;': '∩',
    '&dd;': 'd',
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&'
  };
  return text.replace(/&[a-zA-Z]+;/g, (ent) => entityMap[ent] ?? ent);
}

function fallbackRegexHtmlToLatex(html: string): string {
  let result = html
    .replace(/<head\b[\s\S]*?<\/head>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<xml\b[\s\S]*?<\/xml>/gi, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '');
  // This fallback is intentionally conservative and is only used without an HTML DOM parser.
  result = result.replace(/<math\b[\s\S]*?<\/math>/gi, match => {
    const doc = parseMarkupToDoc(sanitizeOmmlHtmlSnippet(match).replace(/&dd;/gi, '&#8518;'), 'xml');
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
  result = result.replace(/<sup\b[^>]*>([\s\S]*?)<\/sup>/gi, (_m, inner: string) => {
    const content = decodeHtmlMathEntities(inner.replace(/<[^>]*>/g, '').trim());
    return content ? `^{${content}}` : '';
  });
  result = result.replace(/<sub\b[^>]*>([\s\S]*?)<\/sub>/gi, (_m, inner: string) => {
    const content = decodeHtmlMathEntities(inner.replace(/<[^>]*>/g, '').trim());
    return content ? `_{${content}}` : '';
  });
  const stashed: string[] = [];
  result = result.replace(/\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\begin\{(?:cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|aligned|align\*?)\}[\s\S]*?\\end\{(?:cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|aligned|align\*?)\}|\\\([\s\S]*?\\\)|\$[^\$\n]+?\$/g, m => {
    const tok = `___FALLBACK_MATH_${stashed.length}___`;
    stashed.push(m);
    return tok;
  });
  result = result.replace(/<\/?(?:span|b|strong|i|em|u|font|meta|a)\b[^>]*>/gi, '');
  result = result.replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|tr|li|h[1-6])>/gi, '\n\n')
    .replace(/<[^>]*>/g, ' ');
  result = result.replace(/___FALLBACK_MATH_(\d+)___/g, (_, i) => stashed[Number(i)] || '');
  return decodeHtmlMathEntities(result);
}

export function convertHtmlWithMath(htmlString: string): string {
  if (typeof htmlString !== 'string' || !htmlString.trim()) return '';

  // Preprocess raw HTML string: search for OMML in conditional comments and strip fallbacks
  const preprocessed = preprocessRawHtmlMath(htmlString);

  // Stash already-converted LaTeX expressions ($...$, $$...$$, display environments)
  // so that relational operators like '<' and '>' inside math are never mistaken for HTML tags.
  const stashedMath: string[] = [];
  const protectedHtml = preprocessed.replace(
    /\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\begin\{(?:cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|aligned|align\*?)\}[\s\S]*?\\end\{(?:cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|aligned|align\*?)\}|\\\([\s\S]*?\\\)|\$[^\$\n]+?\$/g,
    (m) => {
      const token = `___HTML_MATH_STASH_${stashedMath.length}___`;
      stashedMath.push(m);
      return token;
    }
  );

  const doc = parseHtmlDocument(protectedHtml);
  if (!doc) {
    const rawResult = fallbackRegexHtmlToLatex(protectedHtml);
    const normalizedText = reconstructUnicodeMath(rawResult);
    const restored = normalizedText.replace(/___HTML_MATH_STASH_(\d+)___/g, (_, idx) => stashedMath[Number(idx)] || '');
    return restored
      .replace(/\u00A0/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/[ \t]*\n[ \t]*/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
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
  const normalizedText = reconstructUnicodeMath(extracted);
  const restored = normalizedText.replace(/___HTML_MATH_STASH_(\d+)___/g, (_, idx) => stashedMath[Number(idx)] || '');
  return restored
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
