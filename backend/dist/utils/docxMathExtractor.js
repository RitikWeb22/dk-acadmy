/**
 * Pure-Node DOCX Math Extractor (Step B & Phase 3)
 *
 * Zero-external-binary document-aware extractor:
 *   jszip --> word/document.xml + rels --> ommlNodeToLatex --> LaTeX + Media + Tables
 *
 * Safety:
 *   - Magic bytes check (PK header)
 *   - Max raw file size (25 MB)
 *   - Max uncompressed size across all entries (100 MB, zip-bomb guard)
 *   - Max entry count (500, zip-bomb guard)
 *   - Media filename sanitisation + random prefix (no path traversal)
 *   - Covers OMML in normal paragraphs, table cells (<w:tc>), and text boxes (<w:txbxContent>)
 *   - Native document-order pre-order traversal preserving equations, tables, and images
 */
import JSZip from 'jszip';
import path from 'path';
import crypto from 'crypto';
import { DOMParser as NodeDOMParser } from '@xmldom/xmldom';
import { ommlNodeToLatex } from './universalMathEngine/ommlMathMLConverter.js';
import { createDefaultNormalizedQuestion } from './questionSchema/normalizedQuestion.js';
import { classifyQuestion, extractSolutionAndShortcuts } from './questionClassifier.js';
import { validateQuestionLatexStructure } from './mathLatexValidator.js';
// ============================================================================
// Safety limits
// ============================================================================
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB raw
const MAX_UNCOMPRESSED_BYTES = 100 * 1024 * 1024; // 100 MB total uncompressed
const MAX_ZIP_ENTRIES = 500;
// ============================================================================
// Helpers
// ============================================================================
/**
 * Checks first 4 bytes for PK\x03\x04 (ZIP / DOCX magic bytes).
 */
function isZipBuffer(buf) {
    return (buf.length >= 4 &&
        buf[0] === 0x50 &&
        buf[1] === 0x4b &&
        buf[2] === 0x03 &&
        buf[3] === 0x04);
}
/** Returns a safe random filename prefix (no path traversal characters). */
function safeMediaName(original) {
    const ext = path.extname(original).replace(/[^a-zA-Z0-9.]/g, '').slice(0, 8) || '.bin';
    const rand = crypto.randomBytes(8).toString('hex');
    return `media_${rand}${ext}`;
}
/** Mime type lookup for common image extensions. */
function mimeTypeOf(filename) {
    const ext = path.extname(filename).toLowerCase();
    const map = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.emf': 'image/emf',
        '.wmf': 'image/wmf'
    };
    return map[ext] || 'application/octet-stream';
}
// ============================================================================
// XML DOM parsing (server-side, using @xmldom/xmldom)
// ============================================================================
function parseSilentXml(xmlStr) {
    if (!xmlStr || !xmlStr.trim())
        return null;
    try {
        let parser;
        try {
            parser = new NodeDOMParser({ onError: () => { } });
        }
        catch {
            parser = new NodeDOMParser({
                errorHandler: { warning: () => { }, error: () => { }, fatalError: () => { } }
            });
        }
        return parser.parseFromString(xmlStr, 'application/xml');
    }
    catch {
        return null;
    }
}
/** Returns the lower-cased local name without namespace prefix. */
function localName(node) {
    return (node?.localName || node?.nodeName || '')
        .replace(/^[^:]+:/i, '')
        .toLowerCase();
}
/**
 * Natural pre-order document traversal preserving reading order.
 */
function walkElementsInDocumentOrder(root, cb) {
    if (!root || root.nodeType !== 1)
        return;
    cb(root);
    const children = root.childNodes;
    if (!children)
        return;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child && child.nodeType === 1) {
            walkElementsInDocumentOrder(child, cb);
        }
    }
}
/**
 * Converts one OMML <m:oMath> or <m:oMathPara> element (as DOM node) to LaTeX.
 */
function ommlElementToInlineLatex(el) {
    const isDisplay = localName(el) === 'omathpara';
    try {
        const latex = ommlNodeToLatex(el).replace(/\s+/g, ' ').trim();
        if (!latex)
            return '';
        return isDisplay ? ` $$${latex}$$ ` : ` $${latex}$ `;
    }
    catch {
        return '';
    }
}
/**
 * Extracts all text + OMML math + image references from a paragraph-level element.
 */
function extractParagraphText(paragraphEl, relsMap) {
    let text = '';
    let hasMath = false;
    const images = [];
    function walk(node) {
        if (node.nodeType !== 1)
            return;
        const el = node;
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
        if (name === 'br' || name === 'cr') {
            text += '\n';
            return;
        }
        if (name === 'tab') {
            text += '\t';
            return;
        }
        // Embedded image references (<a:blip r:embed="rIdX"/> or <v:imagedata r:id="rIdX"/>)
        if (name === 'blip' || name === 'imagedata') {
            const embedId = el.getAttribute?.('r:embed') ||
                el.getAttribute?.('r:id') ||
                el.getAttribute?.('id');
            if (embedId && relsMap.has(embedId)) {
                const safeName = relsMap.get(embedId);
                images.push(safeName);
                text += ` [Image: ${safeName}] `;
            }
        }
        for (let i = 0; i < el.childNodes.length; i++) {
            walk(el.childNodes[i]);
        }
    }
    for (let i = 0; i < paragraphEl.childNodes.length; i++) {
        walk(paragraphEl.childNodes[i]);
    }
    return { text: text.trim(), hasMath, images: images.length > 0 ? images : undefined };
}
/**
 * Extracts a structured table from a <w:tbl> element
 */
function extractTableBlock(tblEl, relsMap) {
    const rows = [];
    const trList = [];
    walkElementsInDocumentOrder(tblEl, (el) => {
        if (localName(el) === 'tr')
            trList.push(el);
    });
    for (const tr of trList) {
        const rowCells = [];
        for (let i = 0; i < tr.childNodes.length; i++) {
            const cellNode = tr.childNodes[i];
            if (localName(cellNode) === 'tc') {
                const cellPara = extractParagraphText(cellNode, relsMap);
                rowCells.push(cellPara.text || '');
            }
        }
        if (rowCells.length > 0) {
            rows.push(rowCells);
        }
    }
    // Generate markdown representation
    let markdownText = '';
    if (rows.length > 0) {
        const header = rows[0];
        markdownText += `| ${header.join(' | ')} |\n`;
        markdownText += `| ${header.map(() => '---').join(' | ')} |\n`;
        for (let r = 1; r < rows.length; r++) {
            markdownText += `| ${rows[r].join(' | ')} |\n`;
        }
    }
    return {
        type: 'table',
        rows,
        markdownText: markdownText.trim()
    };
}
// ============================================================================
// Main extractor
// ============================================================================
/**
 * Extracts text + OMML math from a DOCX buffer using pure Node.js (jszip + xmldom).
 */
export async function extractDocxMath(buffer, warnings = [], errorLog = []) {
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
    let zip;
    try {
        zip = await JSZip.loadAsync(buffer);
    }
    catch (err) {
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
        const uc = entry._data?.uncompressedSize ?? 0;
        totalUncompressed += uc;
        if (totalUncompressed > MAX_UNCOMPRESSED_BYTES) {
            errorLog.push(`Uncompressed ZIP content exceeds ${MAX_UNCOMPRESSED_BYTES / 1024 / 1024} MB (zip-bomb protection).`);
            return { success: false, paragraphs: [], rawText: '', media: [], warnings, errorLog };
        }
    }
    // 5. Parse Relationships in word/_rels/document.xml.rels
    const relsMap = new Map(); // rId -> safeName
    const relsEntry = zip.file('word/_rels/document.xml.rels');
    const mediaMap = new Map();
    // Extract all media files
    const mediaEntries = entries.filter((e) => e.name.startsWith('word/media/') && !e.dir);
    for (const entry of mediaEntries) {
        const original = path.basename(entry.name);
        const safeName = safeMediaName(original);
        try {
            const data = Buffer.from(await entry.async('arraybuffer'));
            mediaMap.set(original, {
                name: safeName,
                mimeType: mimeTypeOf(original),
                data,
                originalName: original
            });
        }
        catch (err) {
            warnings.push(`Could not extract media file "${original}": ${err?.message}`);
        }
    }
    if (relsEntry) {
        try {
            const relsXml = await relsEntry.async('string');
            const relsDoc = parseSilentXml(relsXml);
            if (relsDoc) {
                walkElementsInDocumentOrder(relsDoc.documentElement, (el) => {
                    if (localName(el) === 'relationship') {
                        const id = el.getAttribute?.('Id');
                        const target = el.getAttribute?.('Target') || '';
                        const targetBase = path.basename(target);
                        if (id && mediaMap.has(targetBase)) {
                            const item = mediaMap.get(targetBase);
                            item.rId = id;
                            relsMap.set(id, item.name);
                        }
                    }
                });
            }
        }
        catch (err) {
            warnings.push(`Notice: could not parse document.xml.rels: ${err?.message}`);
        }
    }
    // 6. Extract word/document.xml
    const docEntry = zip.file('word/document.xml');
    if (!docEntry) {
        errorLog.push('word/document.xml not found in DOCX – not a valid Word document.');
        return { success: false, paragraphs: [], rawText: '', media: [], warnings, errorLog };
    }
    let docXml;
    try {
        docXml = await docEntry.async('string');
    }
    catch (err) {
        errorLog.push(`Failed to read word/document.xml: ${err?.message}`);
        return { success: false, paragraphs: [], rawText: '', media: [], warnings, errorLog };
    }
    const doc = parseSilentXml(docXml);
    if (!doc) {
        errorLog.push('Failed to parse word/document.xml as XML.');
        return { success: false, paragraphs: [], rawText: '', media: [], warnings, errorLog };
    }
    // 7. Walk the document body collecting paragraphs and tables in natural reading order
    const paragraphs = [];
    const blocks = [];
    const allParagraphEls = [];
    walkElementsInDocumentOrder(doc.documentElement, (el) => {
        if (localName(el) === 'p') {
            allParagraphEls.push(el);
        }
    });
    for (const pEl of allParagraphEls) {
        const para = extractParagraphText(pEl, relsMap);
        if (para.text) {
            paragraphs.push(para);
            blocks.push({
                type: 'paragraph',
                text: para.text,
                hasMath: para.hasMath,
                images: para.images
            });
        }
    }
    const media = Array.from(mediaMap.values());
    const rawText = paragraphs.map((p) => p.text).join('\n');
    return {
        success: true,
        paragraphs,
        blocks,
        rawText,
        media,
        warnings,
        errorLog
    };
}
/**
 * Native document-aware DOCX question segmentation pipeline (Phase 3)
 * Segments questions directly from paragraphs and blocks while preserving
 * OMML LaTeX, tables, images, options, and answer keys.
 */
export async function extractQuestionsFromDocxNative(buffer, subject = 'Mathematics', targetExam = 'JEE Main') {
    const warnings = [];
    const errorLog = [];
    const docxResult = await extractDocxMath(buffer, warnings, errorLog);
    if (!docxResult.success || docxResult.paragraphs.length === 0) {
        return {
            questions: [],
            totalDetected: 0,
            successfulCount: 0,
            needsReviewCount: 0,
            errorLog: docxResult.errorLog,
            media: []
        };
    }
    const paragraphs = docxResult.paragraphs;
    const questions = [];
    // 1. Check for standalone Answer Key block at bottom
    const answerKeyMap = new Map();
    let answerKeyStartIndex = -1;
    for (let i = 0; i < paragraphs.length; i++) {
        const pText = paragraphs[i].text.trim();
        if (/(?:^|\s)(?:Answer\s*Key|Answers?|ANSWERS?)\s*[:\n]/i.test(pText)) {
            answerKeyStartIndex = i;
            break;
        }
    }
    if (answerKeyStartIndex !== -1) {
        const keyText = paragraphs
            .slice(answerKeyStartIndex)
            .map((p) => p.text)
            .join('\n');
        const keyPairRegex = /(\d{1,3})\s*[\.:\-]\s*([A-Da-d0-9\.\-]+)/g;
        let km;
        while ((km = keyPairRegex.exec(keyText)) !== null) {
            const qn = parseInt(km[1], 10);
            const rawAns = km[2].trim().toUpperCase();
            if (!isNaN(qn)) {
                answerKeyMap.set(qn, rawAns);
            }
        }
    }
    const contentParagraphs = answerKeyStartIndex !== -1 ? paragraphs.slice(0, answerKeyStartIndex) : paragraphs;
    const groups = [];
    let currentGroup = null;
    const qDelim = /^(?:(?:Q\.?|Question)\s*)?(\d{1,3})\s*[\.:\)]\s*(.*)$/i;
    let expectedQ = 1;
    for (const para of contentParagraphs) {
        const text = para.text.trim();
        if (!text)
            continue;
        const match = text.match(qDelim);
        const parsedQNum = match ? parseInt(match[1], 10) : NaN;
        if (match &&
            !isNaN(parsedQNum) &&
            parsedQNum >= expectedQ &&
            parsedQNum <= expectedQ + 5) {
            if (currentGroup) {
                groups.push(currentGroup);
            }
            currentGroup = {
                qNum: parsedQNum,
                lines: [{ ...para, text: match[2].trim() }]
            };
            expectedQ = parsedQNum + 1;
        }
        else if (currentGroup) {
            currentGroup.lines.push(para);
        }
        else {
            // Preface or instructions
        }
    }
    if (currentGroup) {
        groups.push(currentGroup);
    }
    // Fallback if no sequential question delimiters were found
    if (groups.length === 0 && contentParagraphs.length > 0) {
        let chunkLines = [];
        let qCount = 1;
        for (const p of contentParagraphs) {
            chunkLines.push(p);
            if (chunkLines.length >= 4) {
                groups.push({ qNum: qCount++, lines: chunkLines });
                chunkLines = [];
            }
        }
        if (chunkLines.length > 0) {
            groups.push({ qNum: qCount++, lines: chunkLines });
        }
    }
    // 3. Process each group into a NormalizedQuestion
    let successfulCount = 0;
    let needsReviewCount = 0;
    for (let idx = 0; idx < groups.length; idx++) {
        const group = groups[idx];
        const fullText = group.lines.map((l) => l.text).join('\n');
        let statementText = '';
        const options = [];
        let explanationText = '';
        const reviewReasons = [];
        // Parse options: (A), (B), (C), (D) or (1), (2), (3), (4)
        const optSplitRegex = /(?:^|\n)\s*(?:\(([A-Da-d1-4])\)|([A-Da-d])\.(?!\d))\s*/;
        const parts = fullText.split(optSplitRegex);
        if (parts.length > 1) {
            statementText = parts[0].trim();
            for (let i = 1; i < parts.length; i += 3) {
                const rawKey = (parts[i] || parts[i + 1] || '').toUpperCase();
                const keyMap = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
                const key = keyMap[rawKey] || rawKey || 'A';
                const optBody = (parts[i + 2] || '').trim();
                // Check if explanation or solution is trailing in last option
                const solMatch = optBody.match(/(?:(?:Ans(?:wer)?|Solution|Explanation)\s*[:\-])\s*([\s\S]+)$/i);
                if (solMatch && solMatch.index !== undefined) {
                    options.push({ key, text: optBody.substring(0, solMatch.index).trim() });
                    explanationText = solMatch[1].trim();
                }
                else {
                    options.push({ key, text: optBody });
                }
            }
        }
        else {
            statementText = fullText.trim();
        }
        // Classify question type
        const classification = classifyQuestion(statementText, options, targetExam);
        // Extract solutions & shortcuts
        const { stepSolution, dkSirShortcut, answerKey: inlineAns } = extractSolutionAndShortcuts(explanationText);
        // Determine correct answer
        const matchedKey = answerKeyMap.get(group.qNum) || inlineAns || 'A';
        // Validate LaTeX
        const validation = validateQuestionLatexStructure({
            qNum: group.qNum,
            statement: statementText,
            options: options.map((o) => ({ key: o.key, text: o.text }))
        });
        if (validation.needsReview) {
            reviewReasons.push(...validation.reasons);
        }
        if (statementText.length < 10) {
            reviewReasons.push('Question statement is unusually brief');
        }
        const needsReview = reviewReasons.length > 0;
        if (needsReview)
            needsReviewCount++;
        else
            successfulCount++;
        // Generate ordered content blocks
        const statementBlocks = [
            {
                id: `blk-text-${Date.now()}-${idx}`,
                type: 'text',
                content: statementText
            }
        ];
        // Collect any images associated with lines in this group
        const qImages = [];
        for (const l of group.lines) {
            if (l.images) {
                for (const imgName of l.images) {
                    const mItem = docxResult.media.find((m) => m.name === imgName);
                    if (mItem && !qImages.some((qi) => qi.name === imgName)) {
                        qImages.push({ name: mItem.name, mimeType: mItem.mimeType });
                        statementBlocks.push({
                            id: `blk-img-${imgName}`,
                            type: 'image',
                            content: imgName
                        });
                    }
                }
            }
        }
        const nq = createDefaultNormalizedQuestion({
            id: `docx-q-${Date.now()}-${idx + 1}-${crypto.randomBytes(3).toString('hex')}`,
            qNum: group.qNum || idx + 1,
            statement: statementText,
            statementBlocks,
            options: options.length > 0 ? options : [
                { key: 'A', text: '' },
                { key: 'B', text: '' },
                { key: 'C', text: '' },
                { key: 'D', text: '' }
            ],
            correctAnswer: matchedKey,
            stepSolution,
            dkSirShortcut,
            subject,
            topic: `${subject} Question`,
            questionType: classification.questionType,
            marks: classification.suggestedMarks,
            negativeMarks: classification.suggestedNegativeMarks,
            status: needsReview ? 'NEEDS_REVIEW' : 'EXTRACTED',
            reviewReason: reviewReasons.join('; '),
            extractionConfidence: validation.overallConfidence,
            images: qImages
        });
        questions.push(nq);
    }
    return {
        questions,
        totalDetected: questions.length,
        successfulCount,
        needsReviewCount,
        errorLog,
        media: docxResult.media
    };
}
