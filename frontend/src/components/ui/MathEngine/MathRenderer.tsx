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
  engine = 'auto'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse structured blocks on the entire normalized content to avoid chopping multi-line formulas across line splits
  const blocks = useMemo(() => {
    if (propBlocks && propBlocks.length > 0) return propBlocks;
    if (!content) return [];
    return parseContentToBlocks(content);
  }, [content, propBlocks]);

  // MathJax pass for advanced LaTeX environments
  useEffect(() => {
    if ((engine === 'mathjax' || engine === 'auto') && window.MathJax?.typesetPromise && containerRef.current) {
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

/**
 * Typesets a single mathematical formula using KaTeX with safety boundaries
 */
const RenderMathExpression: React.FC<{ formula: string; isDisplay: boolean }> = ({
  formula,
  isDisplay
}) => {
  const renderedHtml = useMemo(() => {
    const cleanFormula = sanitizeFormula(formula);

    try {
      let html = katex.renderToString(cleanFormula, {
        displayMode: isDisplay,
        throwOnError: false,
        output: 'html',
        strict: false,
        trust: false
      });

      // If KaTeX encountered an error node, attempt auto-balancing repair
      if (html.includes('katex-error')) {
        let repaired = cleanFormula
          .replace(/(?:\\left\s*)+/g, '\\left')
          .replace(/(?:\\right\s*)+/g, '\\right')
          .replace(/\\left\s*\\left\s*([\[\(\{\|])/g, '\\left$1')
          .replace(/\\right\s*\\right\s*([\]\)\}\|])/g, '\\right$1')
          .replace(/,\s*\]/g, ']');

        const leftCount = (repaired.match(/\\left(?:[\[\(\{\|.]|\\\{)/g) || []).length;
        const rightCount = (repaired.match(/\\right(?:[\]\)\}\|.]|\\\})/g) || []).length;
        if (leftCount > rightCount) {
          repaired += '\\right.'.repeat(leftCount - rightCount);
        } else if (rightCount > leftCount) {
          repaired = '\\left.'.repeat(rightCount - leftCount) + repaired;
        }

        try {
          const secondTry = katex.renderToString(repaired, {
            displayMode: isDisplay,
            throwOnError: false,
            output: 'html',
            strict: false,
            trust: false
          });

          if (!secondTry.includes('katex-error')) {
            html = secondTry;
          } else {
            // Third attempt: strip problematic \left / \right delimiters while keeping interior content
            const stripped = repaired
              .replace(/\\left[\[\(\{\|.]/g, '[')
              .replace(/\\right[\]\)\}\|.]/g, ']')
              .replace(/\\left\\\{/g, '{')
              .replace(/\\right\\\}/g, '}');
            const thirdTry = katex.renderToString(stripped, {
              displayMode: isDisplay,
              throwOnError: false,
              output: 'html',
              strict: false,
              trust: false
            });
            if (!thirdTry.includes('katex-error')) {
              html = thirdTry;
            } else {
              // Final fallback: KaTeX could not render even after all repairs.
              // Show the original cleanFormula in a monospace span so the user
              // still sees readable LaTeX instead of backslash-stripped garbage.
              html = `<span class="katex-fallback" style="font-family:monospace;font-size:0.9em;color:#b45309">${cleanFormula.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`;
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
      <span className={styles.mathErrorFallback} title={renderedHtml.error}>
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
