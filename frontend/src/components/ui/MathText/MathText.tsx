import React from 'react';
import styles from './MathText.module.scss';

interface MathTextProps {
  text: string;
  className?: string;
}

/**
 * MathText renders text containing LaTeX ($...$ or $$...$$) and mathematical notations
 * with clean KaTeX/MathJax-styled typography, proper line-height, and sub/superscript formatting.
 */
export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // Split text by display math ($$...$$) first
  const displayParts = text.split(/(\$\$[\s\S]*?\$\$)/g);

  return (
    <span className={`${styles.mathContainer} ${className}`}>
      {displayParts.map((part, pIdx) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const formula = part.slice(2, -2).trim();
          return (
            <div key={pIdx} className={styles.displayMath} role="math" aria-label={formula}>
              {renderFormattedMath(formula)}
            </div>
          );
        }

        // Split regular text by inline math ($...$)
        const inlineParts = part.split(/(\$[^\$]+?\$)/g);
        return (
          <React.Fragment key={pIdx}>
            {inlineParts.map((subPart, sIdx) => {
              if (subPart.startsWith('$') && subPart.endsWith('$')) {
                const inlineFormula = subPart.slice(1, -1).trim();
                return (
                  <span key={sIdx} className={styles.inlineMath} role="math" aria-label={inlineFormula}>
                    {renderFormattedMath(inlineFormula)}
                  </span>
                );
              }
              // Render plain text with math symbols enhanced
              return (
                <span key={sIdx} className={styles.plainMathText}>
                  {renderMathSymbols(subPart)}
                </span>
              );
            })}
          </React.Fragment>
        );
      })}
    </span>
  );
};

/**
 * Enhances plain text math expressions like exponents (x², θ), integrals (∫₀^(π/2)),
 * greek symbols, fractions, and operators with typographic formatting.
 */
function renderMathSymbols(str: string): React.ReactNode {
  // Replace patterns like ^(...) or ^2 with superscripts, _(...) or _2 with subscripts
  const parts = str.split(/(\^\{[^\}]+\}|\^[0-9a-zA-Z\+\-\*\/]+|_\{[^\}]+\}|_[0-9a-zA-Z\+\-\*\/]+)/g);

  if (parts.length === 1) {
    return str;
  }

  return parts.map((chunk, idx) => {
    if (chunk.startsWith('^{') && chunk.endsWith('}')) {
      return <sup key={idx} className={styles.sup}>{chunk.slice(2, -1)}</sup>;
    }
    if (chunk.startsWith('^')) {
      return <sup key={idx} className={styles.sup}>{chunk.slice(1)}</sup>;
    }
    if (chunk.startsWith('_{') && chunk.endsWith('}')) {
      return <sub key={idx} className={styles.sub}>{chunk.slice(2, -1)}</sub>;
    }
    if (chunk.startsWith('_')) {
      return <sub key={idx} className={styles.sub}>{chunk.slice(1)}</sub>;
    }
    return chunk;
  });
}

function renderFormattedMath(formula: string): React.ReactNode {
  // Convert standard LaTeX fragments to clean Unicode / math typography
  let cleaned = formula
    .replace(/\\int/g, '∫')
    .replace(/\\pi/g, 'π')
    .replace(/\\theta/g, 'θ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\omega/g, 'ω')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\infty/g, '∞')
    .replace(/\\approx/g, '≈')
    .replace(/\\neq/g, '≠')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\cdot/g, '·')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)');

  return renderMathSymbols(cleaned);
}

export default MathText;
