import { autoWrapMathDelimiters, normalizeMathText } from '../../../utils/questionBulkParser';

/**
 * Mathematical Structured Content Block Definition
 */
export interface MathContentBlock {
  id: string;
  type: 'text' | 'math_inline' | 'math_block';
  content: string; // The equation body or plain text
  rawSource: string; // Original delimiter-wrapped source e.g. $\alpha$ or $$\int...$$
}

/**
 * Tokenizes a mixed string of text and mathematical expressions into structured blocks.
 * Preserves the exact mathematical source for MongoDB storage and lossless re-editing.
 */
export function parseContentToBlocks(rawText: string): MathContentBlock[] {
  if (!rawText) return [];

  // Normalize Word equations, unicode math, powers, and fractions
  const normalized = normalizeMathText(rawText);

  // Automatically wrap un-delimited LaTeX if delimiters are absent
  const text = autoWrapMathDelimiters(normalized);

  // Delimiters supported:
  // 1. Display math: $$ ... $$ and \[ ... \]
  // 2. Inline math: $ ... $ and \( ... \)
  // 3. AMS Environments without wrappers: \begin{cases}...\end{cases}, \begin{bmatrix}...\end{bmatrix}, etc.
  const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]+?\$|\\\([\s\S]*?\\\)|\\begin\{(?:cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|aligned|align\*?)\}[\s\S]*?\\end\{(?:cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|aligned|align\*?)\})/g;

  const parts = text.split(regex);
  const blocks: MathContentBlock[] = [];
  let blockIdx = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    // Check if this part is a display math block
    if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
      blocks.push({
        id: `blk-${blockIdx++}`,
        type: 'math_block',
        content: part.slice(2, -2).trim(),
        rawSource: part
      });
    } else if (part.startsWith('\\[') && part.endsWith('\\]') && part.length >= 4) {
      blocks.push({
        id: `blk-${blockIdx++}`,
        type: 'math_block',
        content: part.slice(2, -2).trim(),
        rawSource: part
      });
    } else if (part.startsWith('\\begin{') && part.includes('\\end{')) {
      // Standalone AMS environment
      blocks.push({
        id: `blk-${blockIdx++}`,
        type: 'math_block',
        content: part.trim(),
        rawSource: `$$${part.trim()}$$`
      });
    } else if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
      // Inline math
      blocks.push({
        id: `blk-${blockIdx++}`,
        type: 'math_inline',
        content: part.slice(1, -1).trim(),
        rawSource: part
      });
    } else if (part.startsWith('\\(') && part.endsWith('\\)') && part.length >= 4) {
      // Inline LaTeX math
      blocks.push({
        id: `blk-${blockIdx++}`,
        type: 'math_inline',
        content: part.slice(2, -2).trim(),
        rawSource: part
      });
    } else {
      // Plain text block
      blocks.push({
        id: `blk-${blockIdx++}`,
        type: 'text',
        content: part,
        rawSource: part
      });
    }
  }

  return blocks;
}

/**
 * Re-assembles structured content blocks back into a pristine text string.
 */
export function serializeBlocksToText(blocks: MathContentBlock[]): string {
  if (!Array.isArray(blocks)) return '';
  return blocks.map((b) => b.rawSource || b.content || '').join('');
}

