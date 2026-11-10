import { autoWrapMathDelimiters, normalizeMathText } from '../../../utils/questionBulkParser';
import { wrapMathInDollars, convertWordEquationToLatex, normalizeAllRadicals, normalizePrimes } from '../../../utils/wordPasteParser';
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

  const cleanRawText = normalizePrimes(normalizeNewlines(rawText))
    .replace(/Word HTML dropped part of the question\.\s*The plain-text version was kept and needs review\.\s*/gi, '')
    .replace(/^[\s\u2022\u25E6\u25AA\u25CF.\-—]+\s*/g, '');

  // If the raw text is already a single complete delimited math block, return directly
  const trimmedDirect = cleanRawText.trim();
  if (
    (trimmedDirect.startsWith('$') && trimmedDirect.endsWith('$') && !trimmedDirect.slice(1, -1).includes('$')) ||
    (trimmedDirect.startsWith('$$') && trimmedDirect.endsWith('$$') && !trimmedDirect.slice(2, -2).includes('$$')) ||
    (trimmedDirect.startsWith('\\[') && trimmedDirect.endsWith('\\]') && !trimmedDirect.slice(2, -2).includes('\\]')) ||
    (trimmedDirect.startsWith('\\(') && trimmedDirect.endsWith('\\)') && !trimmedDirect.slice(2, -2).includes('\\)')) ||
    (trimmedDirect.startsWith('\\begin{') && trimmedDirect.includes('\\end{'))
  ) {
    const isBlock = trimmedDirect.startsWith('$$') || trimmedDirect.startsWith('\\[') || trimmedDirect.startsWith('\\begin{');
    const content = (trimmedDirect.startsWith('$$') || trimmedDirect.startsWith('\\['))
      ? trimmedDirect.slice(2, -2).trim()
      : trimmedDirect.startsWith('$')
      ? trimmedDirect.slice(1, -1).trim()
      : trimmedDirect.startsWith('\\(')
      ? trimmedDirect.slice(2, -2).trim()
      : trimmedDirect.trim();
    return [{
      id: 'blk-0',
      type: isBlock ? 'math_block' : 'math_inline',
      content: content.replace(/\\frac\b/g, '\\dfrac'),
      rawSource: trimmedDirect
    }];
  }

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

  // Final safety scrub: clean corrupted differentials, bare \dfrac{}, and orphan tokens
  text = text
    .replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}\s*\{?\s*(?:\\,)?\s*(d[a-zA-Z])/gi, '\\dfrac{$1}{$2}')
    .replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}\s*\{?\s*(?:\\,)?\s*([a-zA-Z]+)/gi, '\\dfrac{$1}{$2}')
    .replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])(?![a-zA-Z{])/gi, '\\dfrac{$1}{dx}')
    .replace(/\\(?:d?frac)\{\s*\}\s*\{\s*\}/g, '')
    .replace(/\\(?:d?frac)\{\s*\}\s*/g, '')
    .replace(/\\(?:d?frac)(?!\s*\{)/g, '')
    .replace(/\[\s*MATH_\d+\s*\]/gi, '')
    .replace(/⟦\s*MATH_\d+\s*⟧/gi, '')
    .replace(/\u27E6MATH_\d+\u27E7/g, '');

  text = normalizeAllRadicals(text);

  // Repair split math delimiters, such as ( \frac{y}{x} )^{3} or ( $\frac{y}{x}$ )^{3} or 6 $\sqrt{10}$
  text = text
    .replace(/(?<![a-zA-Z0-9_\$])(?:\\left\s*\(\s*|\(\s*)\s*\$?([-+]?\s*\\(?:d?frac)\{(?:[^{}]|\{[^{}]*\})*\}\{(?:[^{}]|\{[^{}]*\})*\}|[^()$\n]+?)\$?\s*(?:\\right\s*\)|\))\s*\^\s*((?:\{[^{}]*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}[^{}]*)*\}|[0-9a-zA-Z]+))(?![a-zA-Z0-9_\$])/g,
      (full, math, exp) => {
        const stripped = math.replace(/\\[a-zA-Z]+/g, ' ');
        if (/\b(?:let|the|and|is|are|in|on|at|of|to|for|with|then|if|which|where|be)\b/i.test(stripped)) {
          return full;
        }
        const expStr = exp.startsWith('{') ? exp : `{${exp}}`;
        return `$\\left(${math.replace(/^\$|\$$/g, '').trim()}\\right)^${expStr}$`;
      })
    .replace(/(?<![a-zA-Z0-9_\$])(?:\\left\s*\[\s*|\[\s*)\s*\$?([-+]?\s*\\(?:d?frac)\{(?:[^{}]|\{[^{}]*\})*\}\{(?:[^{}]|\{[^{}]*\})*\}|[^[\]$\n]+?)\$?\s*(?:\\right\s*\]|\])\s*\^\s*((?:\{[^{}]*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}[^{}]*)*\}|[0-9a-zA-Z]+))(?![a-zA-Z0-9_\$])/g,
      (_, math, exp) => {
        const expStr = exp.startsWith('{') ? exp : `{${exp}}`;
        return `$\\left[${math.trim()}\\right]^${expStr}$`;
      })
    .replace(/(?<![a-zA-Z0-9_\$])(?:\\left\s*\(\s*|\(\s*)\$([-+]?\s*\\(?:d?frac)\{(?:[^{}]|\{[^{}]*\})*\}\{(?:[^{}]|\{[^{}]*\})*\})\$(?:\s*\\right\s*\)|\s*\))(?![a-zA-Z0-9_\$])/g,
      (_, frac) => `$\\left(${frac.trim()}\\right)$`)
    .replace(/(?<![a-zA-Z0-9_\$])(\d+)\s*\$(\\(?:sqrt|cbrt)(?:\[[^\]]+\])?\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})\$/g,
      (_, coef, rad) => `$${coef}${rad}$`);

  // Delimiters supported:
  // 1. Display math: $$ ... $$ and \[ ... \]
  // 2. Inline math: $ ... $ and \( ... \) (including multiline inline math)
  // 3. AMS Environments without wrappers: \begin{cases}...\end{cases}, \begin{bmatrix}...\end{bmatrix}, etc.
  const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?:\\\$|[^\$])+?\$|\\\([\s\S]*?\\\)|\\begin\{(?:cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|aligned|align\*?)\}[\s\S]*?\\end\{(?:cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|aligned|align\*?)\})/g;

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

