/**
 * Pure-Node DOCX Math Extractor (Step B)
 *
 * Replaces mammoth + Python docx_math_extractor.py with a zero-external-binary
 * approach that works on Hostinger shared hosting:
 *
 *   jszip  -->  word/document.xml  -->  ommlNodeToLatex  -->  LaTeX
 *
 * Safety:
 *   - Magic bytes check (PK header)
 *   - Max raw file size (25 MB)
 *   - Max uncompressed size across all entries (100 MB, zip-bomb guard)
 *   - Max entry count (500, zip-bomb guard)
 *   - Media filename sanitisation + random prefix (no path traversal)
 *   - Covers OMML in normal paragraphs, table cells (<w:tc>), and text boxes (<w:txbxContent>)
 */

import JSZip from 'jszip';
import path from 'path';
import crypto from 'crypto';
import { DOMParser as NodeDOMParser } from '@xmldom/xmldom';
import { ommlNodeToLatex } from './universalMathEngine/ommlMathMLConverter.js';

// Use `any` for all DOM node types (backend has no lib: ["DOM"] in tsconfig)
type AnyDoc = any;
type AnyEl = any;
type AnyNode = any;

// ============================================================================
// Safety limits
// ============================================================================
const MAX_FILE_BYTES = 25 * 1024 * 1024;      // 25 MB raw
const MAX_UNCOMPRESSED_BYTES = 100 * 1024 * 1024; // 100 MB total uncompressed
const MAX_ZIP_ENTRIES = 500;

// ============================================================================
// Types
// ============================================================================
export interface DocxParagraph {
  /** Full text of the paragraph with math rendered as $...$ or $$...$$ */
  text: string;
  /** True if the paragraph contained at least one OMML equation */
  hasMath: boolean;
}

export interface DocxExtractionResult {
  success: boolean;
  paragraphs: DocxParagraph[];
  /** Raw concatenated text (paragraphs joined by '\n') */
  rawText: string;
  /** Extracted media files as { name: string; data: Buffer }[] */
  media: Array<{ name: string; mimeType: string; data: Buffer }>;
  warnings: string[];
  errorLog: string[];
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Checks first 4 bytes for PK\x03\x04 (ZIP / DOCX magic bytes).
 */
function isZipBuffer(buf: Buffer): boolean {
  return buf.length >= 4 &&
    buf[0] === 0x50 && buf[1] === 0x4B &&
    buf[2] === 0x03 && buf[3] === 0x04;
}

/** Returns a safe random filename prefix (no path traversal characters). */
function safeMediaName(original: string): string {
  const ext = path.extname(original).replace(/[^a-zA-Z0-9.]/g, '').slice(0, 8) || '.bin';
  const rand = crypto.randomBytes(8).toString('hex');
  return `media_${rand}${ext}`;
}

/** Mime type lookup for common image extensions. */
function mimeTypeOf(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const map: Record<string, string> = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.bmp': 'image/bmp', '.webp': 'image/webp',
    '.svg': 'image/svg+xml', '.emf': 'image/emf', '.wmf': 'image/wmf',
  };
  return map[ext] || 'application/octet-stream';
}

// ============================================================================
// XML DOM parsing (server-side, using @xmldom/xmldom)
// ============================================================================

function parseSilentXml(xmlStr: string): AnyDoc | null {
  if (!xmlStr || !xmlStr.trim()) return null;
  try {
    // @xmldom/xmldom ≥0.9 uses onError; ≤0.8 used errorHandler object.
    let parser: any;
    try {
      parser = new NodeDOMParser({ onError: () => {} } as any);
    } catch {
      parser = new NodeDOMParser({ errorHandler: { warning: () => {}, error: () => {}, fatalError: () => {} } } as any);
    }
    return parser.parseFromString(xmlStr, 'application/xml') as AnyDoc;
  } catch {
    return null;
  }
}

// ============================================================================
// OMML/text extraction from a word/document.xml DOM
// ============================================================================

/** Returns the lower-cased local name without namespace prefix. */
function localName(node: AnyNode): string {
  return ((node as AnyEl).localName || node.nodeName || '')
    .replace(/^[^:]+:/i, '').toLowerCase();
}

/** Collect all direct and nested element children matching local tag names. */
function walkElements(root: AnyEl, cb: (el: AnyEl) => void) {
  const stack: AnyEl[] = [root];
  while (stack.length) {
    const el = stack.pop()!;
    cb(el);
    for (let i = 0; i < el.childNodes.length; i++) {
      const child = el.childNodes[i];
      if (child.nodeType === 1) stack.push(child as AnyEl);
    }
  }
}

/**
 * Converts one OMML <m:oMath> or <m:oMathPara> element (as DOM node) to LaTeX.
 * Returns e.g. "$\lim_{x\to0}\frac{\sin x}{x}$" or "$$...$$" for display.
 */
function ommlElementToInlineLatex(el: AnyEl): string {
  const isDisplay = localName(el) === 'omathpara';
  try {
    const latex = ommlNodeToLatex(el).replace(/\s+/g, ' ').trim();
    if (!latex) return '';
    return isDisplay ? ` $$${latex}$$ ` : ` $${latex}$ `;
  } catch {
    return '';
  }
}

/**
 * Extracts all text + math from a paragraph-level container element.
 */
function extractParagraphText(paragraphEl: AnyEl): DocxParagraph {
  let text = '';
  let hasMath = false;

  function walk(node: AnyNode) {
    if (node.nodeType !== 1) return;
    const el = node as AnyEl;
    const name = localName(el);

    if (name === 'omath' || name === 'omathpara') {
      const latex = ommlElementToInlineLatex(el);
      if (latex) {
        text += latex;
        hasMath = true;
      }
      return;
    }

    if (name === 't') {
      text += el.textContent || '';
      return;
    }

    if (name === 'br') {
      text += '\n';
      return;
    }

    for (let i = 0; i < el.childNodes.length; i++) {
      walk(el.childNodes[i]);
    }
  }

  for (let i = 0; i < paragraphEl.childNodes.length; i++) {
    walk(paragraphEl.childNodes[i]);
  }

  return { text: text.trim(), hasMath };
}

// ============================================================================
// Main extractor
// ============================================================================

/**
 * Extracts text + OMML math from a DOCX buffer using pure Node.js (jszip + xmldom).
 * No Python, no Pandoc, no mammoth required.
 */
export async function extractDocxMath(
  buffer: Buffer,
  warnings: string[] = [],
  errorLog: string[] = []
): Promise<DocxExtractionResult> {
  // 1. Magic bytes check
  if (!isZipBuffer(buffer)) {
    errorLog.push('File is not a valid DOCX (missing PK ZIP header). Rejecting.');
    return { success: false, paragraphs: [], rawText: '', media: [], warnings, errorLog };
  }

  // 2. Size limit
  if (buffer.length > MAX_FILE_BYTES) {
    errorLog.push(`File too large: ${(buffer.length / 1024 / 1024).toFixed(1)} MB > 25 MB limit.`);
    return { success: false, paragraphs: [], rawText: '', media: [], warnings, errorLog };
  }

  // 3. Load zip
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch (err: any) {
    errorLog.push(`Failed to unzip file: ${err?.message}`);
    return { success: false, paragraphs: [], rawText: '', media: [], warnings, errorLog };
  }

  // 4. Zip-bomb: check entry count and total uncompressed size
  const entries = Object.values(zip.files);
  if (entries.length > MAX_ZIP_ENTRIES) {
    errorLog.push(`ZIP has ${entries.length} entries > ${MAX_ZIP_ENTRIES} limit (zip-bomb protection).`);
    return { success: false, paragraphs: [], rawText: '', media: [], warnings, errorLog };
  }

  let totalUncompressed = 0;
  for (const entry of entries) {
    // JSZip stores _data.uncompressedSize for already-opened entries
    const uc = (entry as any)._data?.uncompressedSize ?? 0;
    totalUncompressed += uc;
    if (totalUncompressed > MAX_UNCOMPRESSED_BYTES) {
      errorLog.push(`Uncompressed ZIP content exceeds ${MAX_UNCOMPRESSED_BYTES / 1024 / 1024} MB (zip-bomb protection).`);
      return { success: false, paragraphs: [], rawText: '', media: [], warnings, errorLog };
    }
  }

  // 5. Extract word/document.xml
  const docEntry = zip.file('word/document.xml');
  if (!docEntry) {
    errorLog.push('word/document.xml not found in DOCX – not a valid Word document.');
    return { success: false, paragraphs: [], rawText: '', media: [], warnings, errorLog };
  }

  let docXml: string;
  try {
    docXml = await docEntry.async('string');
  } catch (err: any) {
    errorLog.push(`Failed to read word/document.xml: ${err?.message}`);
    return { success: false, paragraphs: [], rawText: '', media: [], warnings, errorLog };
  }

  // 6. Parse XML
  const doc = parseSilentXml(docXml);
  if (!doc) {
    errorLog.push('Failed to parse word/document.xml as XML.');
    return { success: false, paragraphs: [], rawText: '', media: [], warnings, errorLog };
  }

  // 7. Walk the document body collecting paragraphs from:
  //    - normal <w:p> inside body
  //    - <w:tc> (table cells)
  //    - <w:txbxContent> (text boxes)
  const paragraphs: DocxParagraph[] = [];

  // Find all <w:p> elements anywhere in the document (covers tables + text boxes)
  const allParagraphEls: AnyEl[] = [];
  walkElements(doc.documentElement as AnyEl, (el: AnyEl) => {
    if (localName(el) === 'p') {
      allParagraphEls.push(el);
    }
  });

  for (const pEl of allParagraphEls) {
    const para = extractParagraphText(pEl);
    if (para.text) {
      paragraphs.push(para);
    }
  }

  // 8. Extract media files (images) with safe names
  const media: Array<{ name: string; mimeType: string; data: Buffer }> = [];
  const mediaEntries = entries.filter(e => e.name.startsWith('word/media/') && !e.dir);
  for (const entry of mediaEntries) {
    const original = path.basename(entry.name);
    const safeName = safeMediaName(original);
    try {
      const data = Buffer.from(await entry.async('arraybuffer'));
      media.push({ name: safeName, mimeType: mimeTypeOf(original), data });
    } catch (err: any) {
      warnings.push(`Could not extract media file "${original}": ${err?.message}`);
    }
  }

  const rawText = paragraphs.map(p => p.text).join('\n');

  return {
    success: true,
    paragraphs,
    rawText,
    media,
    warnings,
    errorLog
  };
}
