import { autoWrapMathDelimiters, normalizeMathText } from '../../../utils/questionBulkParser';
import { wrapMathInDollars, convertWordEquationToLatex } from '../../../utils/wordPasteParser';
import { normalizeMathString } from '../../../utils/mathImportRenderSystem/pasteHandler';

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
/**
 * Returns true when the entire string is a pure LaTeX formula with no prose —
 * i.e. it was produced by our OMML/linear-equation converter and is already
 * valid KaTeX.  Running normalizeMathText on it can only corrupt it.
 *
 * Heuristic: contains a LaTeX command (\frac, \lim, \sqrt, \int …) AND
 * does not already have $ delimiters AND has no sentence-starting prose words.
 */
function isPureLatexFormula(text: string): boolean {
  if (!text || text.includes('$')) return false;
  const hasLatexCmd = /\\(?:frac|dfrac|lim|int|sum|prod|sqrt|vec|hat|left|right|begin|binom|matrix|cases|alpha|beta|gamma|delta|theta|lambda|pi|sigma|phi|omega|infty|to|cdot|times|leq|geq|neq|in|mathbb|text)\b/.test(text);
  if (!hasLatexCmd) return false;
  // Reject if it contains English prose words (≥2 words that look like sentences)
  const stripped = text.replace(/\\[a-zA-Z]+/g, ' ');
  const words = stripped.match(/\b[a-zA-Z]{4,}\b/g) || [];
  const mathKeywords = new Set(['sqrt','frac','dfrac','left','right','lim','lim','int','sum','prod','infty','cdot','times','leq','geq','neq','text','mathbb','begin','cases','binom','matrix','alpha','beta','gamma','delta','theta','lambda','sigma','omega','phi','quad','qquad']);
  const proseWords = words.filter(w => !mathKeywords.has(w.toLowerCase()));
  return proseWords.length < 2;
}

/**
 * Normalizes line endings: converts \r\n to \n, handles literal \n strings
 * (not part of known LaTeX commands), and converts user /n newline shortcuts.
 */
export function normalizeNewlines(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\\n(?!(?:abla|atural|earrow|eg|eq|e|ewcommand|ewenvironment|ewline|i|oindent|olimits|ormalsize|ot|otin|prec|succ|sim|subset|supset|subseteq|supseteq|u|warrow)\b)/g, '\n')
    .replace(/(^|[\s.,;:!?)\]])\/n(?=[\s.,;:!?(\[]|$)/gi, '$1\n');
}

export function parseContentToBlocks(rawText: string): MathContentBlock[] {
  if (!rawText) return [];

  const cleanRawText = normalizeNewlines(rawText)
    .replace(/Word HTML dropped part of the question\.\s*The plain-text version was kept and needs review\.\s*/gi, '')
    .replace(/^[\s\u2022\u25E6\u25AA\u25CF.\-—]+\s*(?=[A-Za-z])/g, '');

  // Convert any double dollar display delimiters to single dollar inline delimiters
  const singleDollarText = cleanRawText.split('$$').join('$');

  let text: string;

  if (isPureLatexFormula(singleDollarText.trim())) {
    // Already-valid pure LaTeX formula — wrap directly
    text = `$${singleDollarText.trim()}$`;
  } else {
    // Universal math normalization: safely protects any existing $...$ and $$...$$ blocks,
    // and automatically normalizes and wraps all remaining bare math (differential equations, fractions, limits, etc.)
    text = normalizeMathString(singleDollarText);
  }

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
      // Plain text block: check if it contains un-delimited math or LaTeX expressions
      const hasUnwrappedMath =
        /\\(?:frac|dfrac|sqrt|lim|int|sum|prod|log_e|ln|sin|cos|tan|cot|sec|csc|alpha|beta|gamma|delta|theta|lambda|pi|sigma|phi|omega|infty|to|cdot|times|leq|geq|neq|pm|mp|mathbb|hat|vec|left|right)\b|\^\{[^{}]+\}|_[0-9a-zA-Z]+|\b(?:dy|dx|dt|dz)\b|\b[a-zA-Z]\s*=\s*[a-zA-Z]\s*\(|\b[a-zA-Z]\s*\([a-zA-Z0-9_+\-/*\\^\{\}\s.,]+\)\s*=|\b[a-zA-Z]\s*\([a-zA-Z0-9_+\-/*\\^\{\}\s./]+\)\s+(?:is\s+equal\s+to|equals\b)/i.test(part);

      if (hasUnwrappedMath) {
        const wrapped = wrapMathInDollars(convertWordEquationToLatex(part));
        if (wrapped.includes('$')) {
          const subParts = wrapped.split(/(\$[^\$\n]+?\$)/g);
          for (const sp of subParts) {
            if (!sp) continue;
            if (sp.startsWith('$') && sp.endsWith('$') && sp.length >= 2) {
              blocks.push({
                id: `blk-${blockIdx++}`,
                type: 'math_inline',
                content: sp.slice(1, -1).trim(),
                rawSource: sp
              });
            } else {
              blocks.push({
                id: `blk-${blockIdx++}`,
                type: 'text',
                content: sp,
                rawSource: sp
              });
            }
          }
          continue;
        }
      }

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

