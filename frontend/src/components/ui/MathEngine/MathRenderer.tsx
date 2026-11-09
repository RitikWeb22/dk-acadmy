import React, { useMemo, useEffect, useRef } from 'react';
import katex from 'katex';
import styles from './MathEngine.module.scss';
import { parseContentToBlocks } from './mathParser';
import type { MathContentBlock } from './mathParser';
import { sanitizeFormula } from './sanitizeFormula';

export interface MathRendererProps {
  content?: string;
  blocks?: MathContentBlock[];
  displayMode?: boolean;
  className?: string;
  engine?: 'katex' | 'mathjax' | 'auto';
}

/**
 * Global declaration for MathJax in window
 */
declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: (HTMLElement | null)[]) => Promise<void>;
      typeset?: (elements?: (HTMLElement | null)[]) => void;
      startup?: {
        promise?: Promise<void>;
      };
    };
  }
}

/**
 * MathRenderer: Production-Grade Mathematical Typesetting Engine
 * Supports:
 * - Fractions, nested fractions, roots
 * - Definite & indefinite integrals, limits, summations
 * - Matrices (bmatrix, pmatrix, matrix), determinants (vmatrix)
 * - Piecewise cases, vectors, Greek symbols, floor / ceiling
 * - Graceful fallback on invalid syntax
 * - Responsive horizontal scroll container (zero clipping on mobile)
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
  content = '',
  blocks: propBlocks,
  displayMode = false,
  className = '',
  engine = 'katex'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Clean warning banners and leading stray dots from content
  const cleanedContent = useMemo(() => {
    if (!content) return '';
    return content
      .replace(/Word HTML dropped part of the question\.\s*The plain-text version was kept and needs review\.\s*/gi, '')
      .replace(/^[\s\u2022\u25E6\u25AA\u25CF.\-—]+\s*/g, '')
      .trim();
  }, [content]);

  // Parse structured blocks on the entire normalized content to avoid chopping multi-line formulas across line splits
  const blocks = useMemo(() => {
    if (propBlocks && propBlocks.length > 0) {
      return propBlocks.map((b, idx) => ({
        ...b,
        content: (idx === 0 ? b.content.replace(/^[\s\u2022\u25E6\u25AA\u25CF.\-—]+\s*/g, '') : b.content)
          .replace(/Word HTML dropped part of the question\.\s*The plain-text version was kept and needs review\.\s*/gi, '')
      })).filter(b => b.content.trim().length > 0 || b.type !== 'text');
    }
    if (!cleanedContent) return [];
    return parseContentToBlocks(cleanedContent);
  }, [cleanedContent, propBlocks]);

  // MathJax pass ONLY when explicitly requested via engine="mathjax" to prevent main-thread DOM lockups
  useEffect(() => {
    if (engine === 'mathjax' && window.MathJax?.typesetPromise && containerRef.current) {
      window.MathJax.typesetPromise([containerRef.current]).catch((err) => {
        console.warn('[MathJax Typeset Warning]:', err);
      });
    }
  }, [content, propBlocks, blocks, engine]);

  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className={`${styles.mathRoot} ${className}`}>
      {blocks.map((block) => {
        if (block.type === 'math_block' || displayMode) {
          return (
            <div key={block.id} className={styles.displayMathBlock}>
              <RenderMathExpression
                formula={block.content}
                isDisplay={true}
              />
            </div>
          );
        }

        if (block.type === 'math_inline') {
          return (
            <span key={block.id} className={styles.inlineMathWrapper}>
              <RenderMathExpression
                formula={block.content}
                isDisplay={false}
              />
            </span>
          );
        }

        return (
          <span key={block.id} className={styles.plainTextSpan}>
            {block.content.split('\n').map((l, idx, arr) => (
              <React.Fragment key={idx}>
                {l}
                {idx < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      })}
    </div>
  );
};

const KATEX_MACROS: Record<string, string> = {
  '\\R': '\\mathbb{R}',
  '\\N': '\\mathbb{N}',
  '\\Z': '\\mathbb{Z}',
  '\\Q': '\\mathbb{Q}',
  '\\C': '\\mathbb{C}',
  '\\d': '\\mathrm{d}',
  '\\diff': '\\frac{\\mathrm{d}#1}{\\mathrm{d}#2}',
};

/**
 * Typesets a single mathematical formula using KaTeX with safety boundaries
 */
const RenderMathExpression: React.FC<{ formula: string; isDisplay: boolean }> = ({
  formula,
  isDisplay
}) => {
  const renderedHtml = useMemo(() => {
    const cleanFormula = sanitizeFormula(formula);
    if (!cleanFormula) {
      return { html: '', error: null };
    }

    const baseOptions = {
      displayMode: isDisplay,
      throwOnError: false,
      output: 'htmlAndMathml' as const,
      strict: 'ignore' as const,
      trust: false,
      macros: KATEX_MACROS
    };

    try {
      let html = katex.renderToString(cleanFormula, baseOptions);

      // If KaTeX encountered an error node, attempt auto-balancing repair
      if (html.includes('katex-error')) {
        let repaired = cleanFormula
          .replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}\s*\{?\s*(?:\\,)?\s*(d[a-zA-Z])/gi, '\\dfrac{$1}{$2}')
          .replace(/\\(?:d?frac)\{\s*\}\s*\{\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}\s*\{\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}/gi, '\\dfrac{$1}{$2}')
          .replace(/\\(?:d?frac)\{\s*\}\s*(?:\\?\s*\{\s*)?[^a-zA-Z\n]{0,8}(d[a-zA-Z])[^a-zA-Z\n]{1,8}(d[a-zA-Z])\}?/gi, '\\dfrac{$1}{$2}')
          .replace(/\\(?:d?frac)\{\s*\}\s*\{\s*\}/g, '')
          .replace(/\\(?:d?frac)\{\s*\}\s*\{([^{}]+)\}/g, '\\dfrac{1}{$1}')
          .replace(/\\(?:d?frac)\{([^{}]+)\}\s*\{\s*\}/g, '\\dfrac{$1}{1}')
          .replace(/\\(?:d?frac)\{\s*\}\s*/g, '')
          .replace(/\\(?:d?frac)(?!\s*\{)/g, '')
          .replace(/(?:\\left\s*)+/g, '\\left')
          .replace(/(?:\\right\s*)+/g, '\\right')
          .replace(/\\left\s*\\left\s*([\[\(\{\|])/g, '\\left$1')
          .replace(/\\right\s*\\right\s*([\]\)\}\|])/g, '\\right$1')
          .replace(/,\s*\]/g, ']');

        if (!repaired.trim()) {
          return { html: '', error: null };
        }

        const leftCount = (repaired.match(/\\left(?:[\[\(\{\|.]|\\\{)/g) || []).length;
        const rightCount = (repaired.match(/\\right(?:[\]\)\}\|.]|\\\})/g) || []).length;
        if (leftCount > rightCount) {
          repaired += '\\right.'.repeat(leftCount - rightCount);
        } else if (rightCount > leftCount) {
          repaired = '\\left.'.repeat(rightCount - leftCount) + repaired;
        }

        try {
          const secondTry = katex.renderToString(repaired, baseOptions);

          if (!secondTry.includes('katex-error')) {
            html = secondTry;
          } else {
            // Third attempt: strip problematic \left / \right delimiters while keeping visible brackets
            const stripped = repaired
              .replace(/\\left\[/g, '[')
              .replace(/\\right\]/g, ']')
              .replace(/\\left\(/g, '(')
              .replace(/\\right\)/g, ')')
              .replace(/\\left\\\{/g, '\\{')
              .replace(/\\right\\\}/g, '\\}')
              .replace(/\\left[|.]/g, '')
              .replace(/\\right[|.]/g, '');
            const thirdTry = katex.renderToString(stripped, baseOptions);
            if (!thirdTry.includes('katex-error')) {
              html = thirdTry;
            } else {
              // Fourth attempt: strip stray & if outside alignment environment
              const noStrayAmp = stripped.replace(/&/g, ' ');
              const fourthTry = katex.renderToString(noStrayAmp, baseOptions);
              if (!fourthTry.includes('katex-error')) {
                html = fourthTry;
              } else if (!stripped.replace(/[\\{}]/g, '').trim()) {
                html = '';
              } else {
                // Final fallback: KaTeX could not render even after all repairs.
                // Show red inline error chip with original LaTeX expression
                html = `<span class="katex-error-inline" title="KaTeX rendering error" style="color:#dc2626;background-color:#fef2f2;border:1px solid #fecaca;border-radius:4px;padding:1px 5px;font-family:monospace;font-size:0.85em;display:inline-block;margin:0 2px;">${cleanFormula.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`;
              }
            }
          }
        } catch {}
      }

      return {
        html,
        error: null
      };
    } catch (err: any) {
      return {
        html: '',
        error: err?.message || 'Invalid LaTeX syntax'
      };
    }
  }, [formula, isDisplay]);

  if (renderedHtml.error) {
    return (
      <span
        className="katex-error-inline"
        title={renderedHtml.error}
        style={{
          color: '#dc2626',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '4px',
          padding: '1px 5px',
          fontFamily: 'monospace',
          fontSize: '0.85em',
          display: 'inline-block',
          margin: '0 2px'
        }}
      >
        {formula}
      </span>
    );
  }

  return (
    <span
      dangerouslySetInnerHTML={{ __html: renderedHtml.html }}
    />
  );
};

export default MathRenderer;
