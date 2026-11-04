/**
 * Isomorphic DOM/XML Parser Adapter
 * Provides a unified Document and Element interface across Browser and Node.js environments.
 * Prevents loss of mathematical markup (MathML, OMML, HTML) in server-side or test environments.
 */

// @ts-ignore
import { DOMParser as NodeDOMParser } from '@xmldom/xmldom';

// Dynamically obtain a DOMParser implementation
let cachedDOMParser: any = null;

export function getDOMParser(): any {
  if (cachedDOMParser) return cachedDOMParser;

  // 1. Browser environment: globalThis.DOMParser
  if (typeof globalThis !== 'undefined' && (globalThis as any).DOMParser) {
    cachedDOMParser = (globalThis as any).DOMParser;
    return cachedDOMParser;
  }

  // 2. Node.js environment: xmldom
  if (NodeDOMParser) {
    cachedDOMParser = NodeDOMParser;
    return cachedDOMParser;
  }

  return null;
}

/**
 * Safely parses XML or HTML markup into a DOM Document.
 * Never throws — returns null if parser is unavailable or string is empty.
 */
export function parseMarkupToDoc(markup: string, type: 'xml' | 'html'): any | null {
  if (!markup || !markup.trim()) return null;

  const ParserClass = getDOMParser();
  if (!ParserClass) return null;

  try {
    const parser = new ParserClass({
      errorHandler: {
        warning: () => {},
        error: () => {},
        fatalError: () => {}
      }
    });

    const mime = type === 'xml' ? 'text/xml' : 'text/html';
    return parser.parseFromString(markup, mime);
  } catch {
    return null;
  }
}

/**
 * Retrieves immediate children matching tag name ignoring XML namespace prefixes (e.g. 'm:num' -> 'num')
 */
export function getChildByLocalTag(parent: any, localTag: string): any | null {
  if (!parent || !parent.childNodes) return null;
  const target = localTag.toLowerCase();
  for (let i = 0; i < parent.childNodes.length; i++) {
    const node = parent.childNodes[i];
    if (node.nodeType === 1) { // ELEMENT_NODE
      const name = (node.localName || node.nodeName || '').replace(/^[a-zA-Z0-9_-]+:/, '').toLowerCase();
      if (name === target) return node;
    }
  }
  return null;
}

/**
 * Retrieves all immediate children matching tag name ignoring XML namespace prefixes
 */
export function getAllChildrenByLocalTag(parent: any, localTag: string): any[] {
  if (!parent || !parent.childNodes) return [];
  const target = localTag.toLowerCase();
  const result: any[] = [];
  for (let i = 0; i < parent.childNodes.length; i++) {
    const node = parent.childNodes[i];
    if (node.nodeType === 1) {
      const name = (node.localName || node.nodeName || '').replace(/^[a-zA-Z0-9_-]+:/, '').toLowerCase();
      if (name === target) result.push(node);
    }
  }
  return result;
}

/**
 * Retrieves text content recursively from node
 */
export function getNodeText(node: any): string {
  if (!node) return '';
  if (node.nodeType === 3) return node.nodeValue || '';
  if (node.textContent !== undefined) return node.textContent || '';
  let text = '';
  if (node.childNodes) {
    for (let i = 0; i < node.childNodes.length; i++) {
      text += getNodeText(node.childNodes[i]);
    }
  }
  return text;
}

