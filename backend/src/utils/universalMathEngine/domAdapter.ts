/**
 * Isomorphic DOM/XML Parser Adapter for Frontend
 *
 * Notes:
 * - Markup is only ever parsed via DOMParser.parseFromString(); it is never
 *   inserted into the live document (no innerHTML), and scripts inside
 *   parsed documents are not executed.
 * - Text extraction here is PLAIN TEXT only. MathML / OMML converters must
 *   walk the real node tree (via the child-lookup helpers below) and must not
 *   rely on getNodeText() to reconstruct mathematical structure.
 */

let cachedDOMParser: any = null;

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const CDATA_SECTION_NODE = 4;
const PROCESSING_INSTRUCTION_NODE = 7;
const COMMENT_NODE = 8;
const DOCUMENT_NODE = 9;
const DOCUMENT_FRAGMENT_NODE = 11;

// Namespaces used by browsers when they report an XML parse failure.
const FIREFOX_PARSERERROR_NS = 'http://www.mozilla.org/newlayout/xml/parsererror.xml';
const XHTML_NS = 'http://www.w3.org/1999/xhtml';

/**
 * Returns the DOMParser constructor if available, otherwise null.
 * The result is cached after the first successful detection.
 */
export function getDOMParser(): any {
  if (cachedDOMParser) return cachedDOMParser;

  // Each global is probed independently (own guard + own try/catch) so that an
  // invalid, non-callable, or throwing candidate never blocks the next one.
  const readers: Array<() => any> = [
    () => (typeof globalThis !== 'undefined' ? (globalThis as any).DOMParser : undefined),
    () => (typeof (globalThis as any).window !== 'undefined' ? (globalThis as any).window.DOMParser : undefined),
    () => (typeof (globalThis as any).self !== 'undefined' ? (globalThis as any).self.DOMParser : undefined),
  ];

  for (const read of readers) {
    try {
      const candidate = read();
      if (typeof candidate === 'function') {
        cachedDOMParser = candidate;
        return cachedDOMParser;
      }
    } catch {
      // Restricted/sandboxed global access: skip this candidate.
    }
  }

  // Node.js fallback (tests / server-side runtime): dynamically probe @xmldom/xmldom if available
  try {
    const g: any = typeof globalThis !== 'undefined' ? globalThis : {};
    const proc = g.process;
    if (proc?.versions?.node) {
      if (typeof g.DOMParser === 'function') {
        cachedDOMParser = g.DOMParser;
        return cachedDOMParser;
      }
      const nodeRequire = typeof g.require === 'function' ? g.require : null;
      const required = nodeRequire?.('@xmldom/xmldom') || loadXmldomWithCreateRequire();
      if (required?.DOMParser) {
        const Parser = required.DOMParser;
        cachedDOMParser = class SilentDOMParser extends Parser {
          constructor() {
            try {
              super({ onError: () => {} });
            } catch {
              super({ errorHandler: { warning: () => {}, error: () => {}, fatalError: () => {} } });
            }
          }
        };
        return cachedDOMParser;
      }
    }
  } catch {
    // xmldom not installed or unreachable
  }

  return null;
}

function loadXmldomWithCreateRequire(): { DOMParser?: new (...args: any[]) => any } | null {
  try {
    const proc = (globalThis as any).process;
    const createRequire = proc?.getBuiltinModule?.('module')?.createRequire;
    if (typeof createRequire !== 'function') return null;
    if (typeof import.meta.url === 'string') {
      try {
        return createRequire(import.meta.url)('@xmldom/xmldom');
      } catch {
        // Fall through to CWD
      }
    }
    if (typeof proc?.cwd === 'function') {
      const candidates = [
        proc.cwd() + '/',
        proc.cwd() + '/backend/',
      ];
      for (const base of candidates) {
        try {
          const res = createRequire(base)('@xmldom/xmldom');
          if (res?.DOMParser) return res;
        } catch {
          // Keep trying
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Lower-cased local name of an element, without any namespace prefix.
 * Prefers native localName; falls back to stripping a prefix from nodeName.
 */
function getLocalNameLower(node: any): string {
  let name: any = node.localName;
  if (typeof name !== 'string' || name === '') {
    name = node.nodeName;
    if (typeof name !== 'string') return '';
    const colon = name.indexOf(':');
    if (colon !== -1) name = name.slice(colon + 1);
  }
  return name.toLowerCase();
}

/**
 * Normalises a user-supplied tag to a lower-cased local name.
 * Accepts both "mi" and "m:mi" / "mml:mi" forms. Returns null if invalid.
 */
function normalizeTarget(localTag: any): string | null {
  if (typeof localTag !== 'string') return null;
  let target = localTag.trim();
  if (!target) return null;
  const colon = target.indexOf(':');
  if (colon !== -1) target = target.slice(colon + 1);
  return target ? target.toLowerCase() : null;
}

function isElementNode(node: any): boolean {
  return !!node && typeof node === 'object' && node.nodeType === ELEMENT_NODE;
}

/**
 * True only for a <parsererror> element in a namespace that browsers use for
 * their own error reports. An element merely NAMED "parsererror" (no namespace
 * or an unrelated one) is ordinary document content, not a parse failure.
 */
function isBrowserParserErrorElement(node: any): boolean {
  if (!isElementNode(node)) return false;
  if (getLocalNameLower(node) !== 'parsererror') return false;
  const ns = node.namespaceURI;
  return ns === FIREFOX_PARSERERROR_NS || ns === XHTML_NS;
}

/**
 * True if any DIRECT child element of `parent` is a browser parser-error element.
 */
function hasDirectParserErrorChild(parent: any): boolean {
  const children = parent && parent.childNodes;
  if (!children) return false;
  for (let i = 0; i < children.length; i++) {
    if (isBrowserParserErrorElement(children[i])) return true;
  }
  return false;
}

/**
 * True if the parsed document is unusable or represents an XML parse failure.
 *
 * Browsers do not throw on malformed XML; they return a document containing an
 * error report whose shape differs by engine:
 *   - Firefox:       the ROOT element is <parsererror> in the Mozilla
 *                    parsererror namespace.
 *   - Chrome/Safari: a <parsererror> in the XHTML namespace is inserted as a
 *                    direct child of the root (partial parse), or the root
 *                    becomes XHTML <html> with the error under <body>.
 *
 * Detection is deliberately conservative: it only inspects the root, the
 * root's direct children, and (for an XHTML <html> root) the direct children
 * of its <body>, and it requires a known browser error namespace. A
 * <parsererror> element anywhere else, or in another/no namespace, is treated
 * as legitimate content so valid generic XML is not rejected.
 */
function hasParserError(doc: any): boolean {
  try {
    if (!doc || typeof doc !== 'object') return true;
    const root = doc.documentElement;
    if (!root) return true;

    // Firefox (and any engine that makes the error the root).
    if (isBrowserParserErrorElement(root)) return true;

    // Chrome/Safari: error inserted directly under the root.
    if (hasDirectParserErrorChild(root)) return true;

    // Chrome/Safari: root replaced by XHTML <html><body><parsererror>.
    if (root.namespaceURI === XHTML_NS && getLocalNameLower(root) === 'html') {
      const body = getChildByLocalTag(root, 'body');
      if (body && hasDirectParserErrorChild(body)) return true;
    }

    return false;
  } catch {
    return true;
  }
}

/**
 * Parses markup into a Document. Returns null for empty/invalid input,
 * unavailable DOMParser, parser exceptions, or malformed XML.
 */
export function parseMarkupToDoc(markup: string, type: 'xml' | 'html'): any | null {
  if (typeof markup !== 'string') return null;

  // Strip BOM and surrounding whitespace; a leading space before <?xml ...?>
  // would otherwise make otherwise-valid XML fail to parse.
  const trimmed = markup.replace(/^\uFEFF/, '').trim();
  if (!trimmed) return null;

  const ParserClass = getDOMParser();
  if (!ParserClass) return null;

  try {
    const parser = new ParserClass();

    if (type === 'xml') {
      const doc = parser.parseFromString(trimmed, 'text/xml');
      return hasParserError(doc) ? null : doc;
    }

    // Preserve original HTML behaviour (any non-'xml' type is parsed as HTML).
    const doc = parser.parseFromString(markup, 'text/html');
    if (!doc || typeof doc !== 'object' || !doc.documentElement) return null;
    return doc;
  } catch {
    return null;
  }
}

/**
 * First DIRECT child element whose local name matches (case-insensitive,
 * namespace prefix ignored). Not recursive.
 */
export function getChildByLocalTag(parent: any, localTag: string): any | null {
  try {
    if (!parent || !parent.childNodes) return null;
    const target = normalizeTarget(localTag);
    if (!target) return null;

    const children = parent.childNodes;
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (isElementNode(node) && getLocalNameLower(node) === target) return node;
    }
  } catch {
    // Unexpected node shape: fall through to "not found".
  }
  return null;
}

/**
 * All DIRECT child elements whose local name matches (case-insensitive,
 * namespace prefix ignored). Not recursive.
 */
export function getAllChildrenByLocalTag(parent: any, localTag: string): any[] {
  const result: any[] = [];
  try {
    if (!parent || !parent.childNodes) return result;
    const target = normalizeTarget(localTag);
    if (!target) return result;

    const children = parent.childNodes;
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (isElementNode(node) && getLocalNameLower(node) === target) result.push(node);
    }
  } catch {
    // Return whatever was collected safely.
  }
  return result;
}

/**
 * Plain-text content of a node (text + CDATA descendants only).
 * This is NOT mathematical structure reconstruction.
 */
export function getNodeText(node: any): string {
  if (!node || typeof node !== 'object') return '';

  try {
    const type = node.nodeType;

    if (type === TEXT_NODE || type === CDATA_SECTION_NODE) {
      return node.nodeValue || '';
    }
    if (type === COMMENT_NODE || type === PROCESSING_INSTRUCTION_NODE) {
      return '';
    }

    // Document: textContent is null, so use the root element.
    if (type === DOCUMENT_NODE) {
      return node.documentElement ? getNodeText(node.documentElement) : '';
    }

    // Fast path: native textContent (elements, fragments) already excludes
    // comments and processing instructions and includes CDATA.
    if (typeof node.textContent === 'string') return node.textContent;

    // Fallback for DOM-like objects lacking textContent. Iterative to avoid
    // stack overflow on deeply nested input.
    if (!node.childNodes) return '';
    let text = '';
    const stack: any[] = [];
    for (let i = node.childNodes.length - 1; i >= 0; i--) stack.push(node.childNodes[i]);

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || typeof current !== 'object') continue;
      const t = current.nodeType;

      if (t === TEXT_NODE || t === CDATA_SECTION_NODE) {
        text += current.nodeValue || '';
      } else if (
        (t === ELEMENT_NODE || t === DOCUMENT_FRAGMENT_NODE) &&
        current.childNodes
      ) {
        for (let i = current.childNodes.length - 1; i >= 0; i--) {
          stack.push(current.childNodes[i]);
        }
      }
    }
    return text;
  } catch {
    return '';
  }
}