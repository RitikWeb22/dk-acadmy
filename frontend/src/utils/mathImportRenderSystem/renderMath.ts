/**
 * DK Academy JEE - Canonical Mathematical Typesetting Engine
 * 
 * ONE shared `renderMath` helper across:
 * - Editor live preview
 * - Question statement preview
 * - Option A, B, C, D previews
 * - Step-by-step solution derivations
 * - Student CBT examination view
 * - Results & Analytics review view
 * 
 * Rules:
 * 1. KaTeX 0.16+ with htmlAndMathml output
 * 2. Delimiters: $$...$$, $...$, \[...\], \(...\)
 * 3. throwOnError: false, strict: 'ignore'
 * 4. KaTeX fonts and CSS safely rendered
 * 5. `element.textContent` safe escaping so `< > &` never break HTML
 * 6. Invalid LaTeX displays a high-contrast inline red error chip with exact error reason
 */

// @ts-ignore
import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';

export interface RenderMathOptions {
  displayMode?: boolean;
  macros?: Record<string, string>;
  errorColor?: string;
  onError?: (err: Error) => void;
}

export const JEE_KATEX_MACROS: Record<string, string> = {
  '\\R': '\\mathbb{R}',
  '\\N': '\\mathbb{N}',
  '\\Z': '\\mathbb{Z}',
  '\\Q': '\\mathbb{Q}',
  '\\C': '\\mathbb{C}',
  '\\d': '\\mathrm{d}',
  '\\diff': '\\frac{\\mathrm{d}#1}{\\mathrm{d}#2}',
  '\\pd': '\\partial',
  '\\pdiff': '\\frac{\\partial#1}{\\partial#2}',
  '\\ihat': '\\hat{\\imath}',
  '\\jhat': '\\hat{\\jmath}',
  '\\khat': '\\hat{k}',
  '\\degree': '^\\circ'
};

/**
 * Renders mathematical text safely into the target container element.
 * Safe against XSS and HTML parsing bugs by assigning `textContent` first.
 */
export function renderMath(
  container: HTMLElement | null,
  text: string,
  options: RenderMathOptions = {}
): void {
  if (!container) return;

  if (!text || !text.trim()) {
    container.textContent = '';
    return;
  }

  // 1. Text Content safe escaping so < > & never break HTML parsing
  container.textContent = text;

  // 2. Invoke KaTeX auto-render on the text content
  try {
    renderMathInElement(container, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false,
      strict: 'ignore',
      errorColor: options.errorColor || '#ef4444',
      macros: {
        ...JEE_KATEX_MACROS,
        ...(options.macros || {})
      }
    });

    // 3. Post-process any .katex-error nodes to format as clean red inline chips
    const errorNodes = container.querySelectorAll('.katex-error');
    errorNodes.forEach((node) => {
      const errEl = node as HTMLElement;
      errEl.style.color = '#dc2626';
      errEl.style.backgroundColor = '#fef2f2';
      errEl.style.border = '1px solid #fecaca';
      errEl.style.borderRadius = '4px';
      errEl.style.padding = '1px 5px';
      errEl.style.fontFamily = 'monospace';
      errEl.style.fontSize = '0.85em';
      errEl.style.display = 'inline-block';
      errEl.style.margin = '0 2px';
    });
  } catch (err: any) {
    if (options.onError) {
      options.onError(err);
    }
  }
}
