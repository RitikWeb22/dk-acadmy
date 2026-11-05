/**
 * Node.js --import setup: runs before any ES modules are evaluated.
 * Injects @xmldom/xmldom as the DOMParser into globalThis so the frontend
 * universalMathEngine can be run in Node.js (parity tests) without bundling
 * @xmldom/xmldom into the browser bundle.
 *
 * Usage: npx tsx --import ./tests/setup/injectXmldom.mjs --test <test-file>
 * (Note: tsx re-exports --import to Node.js via the loader chain.)
 */

import { DOMParser as NodeDOMParser } from '@xmldom/xmldom';

if (typeof NodeDOMParser === 'function' && typeof globalThis.DOMParser !== 'function') {
  // @xmldom/xmldom >=0.9 uses onError; <=0.8 used errorHandler object.
  // Try the new API first; fall back to old API if constructor throws.
  globalThis.DOMParser = class SilentNodeDOMParser extends NodeDOMParser {
    constructor() {
      try {
        super({ onError: () => {} });
      } catch {
        super({ errorHandler: { warning: () => {}, error: () => {}, fatalError: () => {} } });
      }
    }
  };
}
