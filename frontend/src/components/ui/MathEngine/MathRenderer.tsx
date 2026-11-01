import React, { useMemo, useEffect, useRef } from 'react';
import katex from 'katex';
import styles from './MathEngine.module.scss';
import { parseContentToBlocks } from './mathParser';
import type { MathContentBlock } from './mathParser';

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

  // If raw content string is provided, split by lines to preserve user newlines and spacing strictly
  const lines = useMemo(() => {
    if (!content) return [];
    return content.split(/\r?\n/).map((line, idx) => ({
      id: `line-${idx}`,
      raw: line,
      blocks: parseContentToBlocks(line)
    }));
  }, [content]);

  // Fallback for pre-computed structured blocks
  const fallbackBlocks = useMemo(() => {
    if (propBlocks && propBlocks.length > 0) return propBlocks;
    return [];
  }, [propBlocks]);

  // MathJax pass for advanced LaTeX environments
  useEffect(() => {
    if ((engine === 'mathjax' || engine === 'auto') && window.MathJax?.typesetPromise && containerRef.current) {
      window.MathJax.typesetPromise([containerRef.current]).catch((err) => {
        console.warn('[MathJax Typeset Warning]:', err);
      });
    }
  }, [content, propBlocks, lines, engine]);

  if ((!lines || lines.length === 0) && (!fallbackBlocks || fallbackBlocks.length === 0)) {
    return null;
  }

  // Render line-by-line when raw content is available
  if (lines.length > 0) {
    return (
      <div ref={containerRef} className={`${styles.mathRoot} ${className}`}>
        {lines.map((line) => {
          if (!line.raw.trim()) {
            return <div key={line.id} className={styles.mathLineRow}>&nbsp;</div>;
          }

          return (
            <div key={line.id} className={styles.mathLineRow}>
              {line.blocks.map((block) => {
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

                return <span key={block.id} className={styles.plainTextSpan}>{block.content}</span>;
              })}
            </div>
          );
        })}
      </div>
    );
  }

  // Render pre-computed structured blocks
  return (
    <div ref={containerRef} className={`${styles.mathRoot} ${className}`}>
      {fallbackBlocks.map((block) => {
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
      return {
        html: katex.renderToString(cleanFormula, {
          displayMode: isDisplay,
          throwOnError: false,
          output: 'htmlAndMathml',
          strict: false,
          trust: false
        }),
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

/**
 * Sanitizes and pre-conditions formula strings to guarantee compatibility
 */
function sanitizeFormula(str: string): string {
  if (!str) return '';
  let res = str
    // Clean invisible Word formatting characters & hair spaces
    .replace(/[\u200A\u200B\u200C\u200D\u2060\u2061\u2062\u2063\u2064\uFEFF\u00A0]/g, ' ')
    // Remove argument placeholders
    .replace(/[▒□]/g, '')
    // Normalize double backslashes
    .replace(/\\\\([a-zA-Z]+)/g, '\\$1')
    // Normalize unicode minus
    .replace(/[\u2212\u2013\u2014]/g, '-')
    // Normalize curly quotes
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    // Clean leading dots from copy-pasting
    .replace(/^\s*\.\s*(?=[A-Za-z])/g, '')
    .trim();

  // If formula contains connecting words inside math mode without \text, wrap them in \text{ ... }
  // to ensure proper spaces between words and prevent collapsed text
  res = res.replace(/(?<!\\)\b(is equal to|equal to|then|where|and|or|for|if|such that|be defined as|defined as)\b/gi, (match) => `\\text{ ${match} }`);

  return res;
}

export default MathRenderer;
