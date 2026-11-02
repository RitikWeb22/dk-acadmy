import React, { useMemo, useEffect, useRef } from 'react';
import katex from 'katex';
import styles from './MathEngine.module.scss';
import { parseContentToBlocks } from './mathParser';
import type { MathContentBlock } from './mathParser';
import { normalizeMathText } from '../../../utils/questionBulkParser';

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

  // If raw content string is provided, normalize entire content first (to collapse multi-line formulas like \log_e\left(\n27\n64\n\right)), then split by lines
  const lines = useMemo(() => {
    if (!content) return [];
    const normalized = normalizeMathText(content);
    return normalized.split(/\r?\n/).map((line, idx) => ({
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
          output: 'html',
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
    // Normalize any duplicated \left\left( or \right\right)
    .replace(/\\left\s*\\left\s*\(/g, '\\left(')
    .replace(/\\right\s*\\right\s*\)/g, '\\right)')
    // Normalize prime derivatives: ϕ^' (t) -> \phi'(t)
    .replace(/([a-zA-Z\\]+)\s*\^['′]\s*/g, "$1' ")
    // Normalize empty set phi
    .replace(/∅/g, '\\phi ')
    // Normalize unbraced fractions in powers: x^\frac{{2}}{2} -> x^{\frac{2}{2}}
    .replace(/\^\\frac\{\{([^}]+)\}\}\{([^}]+)\}/g, '^{\\frac{$1}{$2}}')
    .replace(/\^\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '^{\\frac{$1}{$2}}')
    // Normalize vectors: (OA) ⃗ -> \vec{OA}, a ⃗ -> \vec{a}, i ˆ -> \hat{i}
    .replace(/\(([A-Za-z]{1,3})\)\s*[\u20D7\u2192⃗]/g, '\\vec{$1}')
    .replace(/([a-zA-Z])\s*[\u20D7\u2192⃗]/g, '\\vec{$1}')
    .replace(/([ijk])\s*[\u0302\u02C6ˆ]/g, '\\hat{$1}')
    .replace(/⋅/g, ' \\cdot ')
    .replace(/×/g, ' \\times ')
    .replace(/∀/g, '\\forall ')
    .replace(/sint\b/g, '\\sin t')
    .replace(/sinxdx\b/g, '\\sin x\\,dx')
    .replace(/cos2([ABC])\b/g, '\\cos 2$1')
    // Exponential powers and arbitrary base powers with single or double parentheses:
    // e.g. e^((2-4x)) -> e^{2-4x}, e^(2-4x) -> e^{2-4x}, e^(-x) -> e^{-x}, x^(n+1) -> x^{n+1}
    .replace(/([a-zA-Z0-9_\)\]\}]|\\\w+)\^\(+([^()]+)\)+/g, '$1^{$2}')
    .replace(/e\^([0-9a-zA-Z]+)/g, 'e^{$1}')
    // Greek powers and unbraced variable exponents: \alpha^4 -> \alpha^{4}, \beta^4 -> \beta^{4}, x^2 -> x^{2}
    .replace(/\\(alpha|beta|gamma|theta|lambda|pi|phi|omega)\^([0-9a-zA-Z])(?![0-9a-zA-Z\{])/g, '\\$1^{$2}')
    .replace(/([a-zA-Z0-9_\)\]\}])\^([0-9a-zA-Z])(?![0-9a-zA-Z\{])/g, '$1^{$2}')
    // Tall bracket display fractions: \left(\frac -> \left(\dfrac
    .replace(/\\left\(\s*\\frac/g, '\\left(\\dfrac')
    .trim();

  // If formula contains connecting words inside math mode without \text, wrap them in \text{ ... }
  // to ensure proper spaces between words and prevent collapsed text
  res = res.replace(/(?<!\\)\b(is equal to|equal to|then|where|and|or|for|if|such that|be defined as|defined as)\b/gi, (match) => `\\text{ ${match} }`);

  return res;
}

export default MathRenderer;
