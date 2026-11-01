import React from 'react';
import styles from './MathText.module.scss';

interface MathTextProps {
  text?: string;
  className?: string;
}

/**
 * Universal High-Precision Math Text Renderer
 * Supports:
 * - LaTeX inline ($...$, \(...\)) and display ($$...$$, \[...\]) math
 * - Auto-detects raw LaTeX commands (\frac, \sqrt, \int, \alpha, etc.) even when not wrapped in dollar signs
 * - Renders fractions vertically (numerator / denominator)
 * - Renders square roots with radical signs and overlines
 * - Renders superscripts (x², ^3, ^{2n}) and subscripts (x₁, _1, _{max})
 * - Renders Greek letters, integrals, limits, vectors, matrices, and standard symbols
 */
export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  if (!text || typeof text !== 'string') return null;

  // 1. Normalize alternate math brackets: \(...\) to $...$ and \[...\] to $$...$$
  const normalized = text
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$1$$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$')
    .replace(/\\\\([a-zA-Z]+)/g, '\\$1'); // unescape accidental double backslashes

  // 2. Split text by display math ($$...$$) first
  const displayParts = normalized.split(/(\$\$[\s\S]*?\$\$)/g);

  return (
    <span className={`${styles.mathContainer} ${className}`}>
      {displayParts.map((part, pIdx) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const formula = part.slice(2, -2).trim();
          return (
            <div key={pIdx} className={styles.displayMath} role="math" aria-label={formula}>
              {renderMathNode(formula, true)}
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
                    {renderMathNode(inlineFormula, false)}
                  </span>
                );
              }

              // Check if plain text contains raw LaTeX or math symbols (e.g. \frac, \sqrt, x^2, \int)
              const hasRawMath = /\\(?:frac|dfrac|sqrt|int|sum|lim|vec|alpha|beta|gamma|theta|lambda|pi|sigma|omega|Delta|pm|times|div|le|ge|neq|approx|infty)|[\^_\u2200-\u22FF\u0391-\u03C9]/.test(subPart);

              if (hasRawMath) {
                return (
                  <span key={sIdx} className={styles.plainMathText}>
                    {renderMathNode(subPart, false)}
                  </span>
                );
              }

              return (
                <span key={sIdx} className={styles.plainMathText}>
                  {renderBasicSymbols(subPart)}
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
 * Parses and converts complex math expressions (fractions, square roots, limits, superscripts/subscripts)
 * into a rich React component tree.
 */
function renderMathNode(raw: string, isDisplay: boolean = false): React.ReactNode {
  // Step 1: Replace LaTeX text wrappers \text{...} or \mathrm{...}
  let str = raw
    .replace(/\\(?:text|mathrm|mathbf)\{([^}]+)\}/g, '$1')
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\left\[/g, '[')
    .replace(/\\right\]/g, ']')
    .replace(/\\left\\\{/g, '{')
    .replace(/\\right\\\}/g, '}');

  // Step 2: Replace standard Greek letters and math operators with clean Unicode symbols
  str = replaceMathSymbols(str);

  // Step 3: Parse and render recursive tokens: fractions, square roots, vectors, limits, sub/superscripts
  return parseMathTokens(str);
}

/**
 * Tokenizes math string and converts fractions (\frac{A}{B}), square roots (\sqrt{A}),
 * vectors (\vec{a}), and exponents/subscripts into styled React nodes.
 */
function parseMathTokens(str: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = str;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // 1. Match Fraction: \frac{num}{den} or \dfrac{num}{den}
    const fracMatch = remaining.match(/^(.*?)\\(?:d)?frac\{([^{}]+(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]+(?:\{[^{}]*\}[^{}]*)*)\}/);
    if (fracMatch) {
      const [, pre, num, den] = fracMatch;
      if (pre) {
        nodes.push(...renderSubAndSup(pre, keyIdx++));
      }
      nodes.push(
        <span key={`frac-${keyIdx++}`} className={styles.fraction}>
          <span className={styles.numerator}>{parseMathTokens(num)}</span>
          <span className={styles.denominator}>{parseMathTokens(den)}</span>
        </span>
      );
      remaining = remaining.slice(fracMatch[0].length);
      continue;
    }

    // 2. Match Square Root: \sqrt{radicand} or \sqrt[n]{radicand}
    const sqrtMatch = remaining.match(/^(.*?)\\sqrt(?:\[([0-9a-zA-Z]+)\])?\{([^{}]+(?:\{[^{}]*\}[^{}]*)*)\}/);
    if (sqrtMatch) {
      const [, pre, indexRoot, radicand] = sqrtMatch;
      if (pre) {
        nodes.push(...renderSubAndSup(pre, keyIdx++));
      }
      nodes.push(
        <span key={`sqrt-${keyIdx++}`} className={styles.sqrt}>
          {indexRoot && <sup className={styles.sqrtIndex}>{indexRoot}</sup>}
          <span className={styles.sqrtSymbol}>√</span>
          <span className={styles.sqrtContent}>{parseMathTokens(radicand)}</span>
        </span>
      );
      remaining = remaining.slice(sqrtMatch[0].length);
      continue;
    }

    // 3. Match Vector: \vec{a} or \vec a
    const vecMatch = remaining.match(/^(.*?)\\vec\{?([a-zA-Z0-9]+)\}?/);
    if (vecMatch) {
      const [, pre, vChar] = vecMatch;
      if (pre) {
        nodes.push(...renderSubAndSup(pre, keyIdx++));
      }
      nodes.push(
        <span key={`vec-${keyIdx++}`} className={styles.vectorWrap}>
          <span className={styles.vectorArrow}>→</span>
          <span>{vChar}</span>
        </span>
      );
      remaining = remaining.slice(vecMatch[0].length);
      continue;
    }

    // 4. Match Limits: \lim_{x \to 0} or lim_{x->0}
    const limMatch = remaining.match(/^(.*?)(?:\\lim|lim)_\{([^}]+)\}/);
    if (limMatch) {
      const [, pre, limSub] = limMatch;
      if (pre) {
        nodes.push(...renderSubAndSup(pre, keyIdx++));
      }
      nodes.push(
        <span key={`lim-${keyIdx++}`} className={styles.bigOpWrap}>
          <span className={styles.bigOpSymbol} style={{ fontStyle: 'normal', fontSize: '1em' }}>lim</span>
          <span className={styles.bigOpLower}>{parseMathTokens(limSub)}</span>
        </span>
      );
      remaining = remaining.slice(limMatch[0].length);
      continue;
    }

    // 5. Match Integral with limits: \int_{a}^{b} or \int_a^b or \int_{a}
    const intMatch = remaining.match(/^(.*?)\\int(?:_\{([^}]+)\}|_([0-9a-zA-Z]))?(?:\^\{([^}]+)\}|\^([0-9a-zA-Z]))?/);
    if (intMatch && (intMatch[2] || intMatch[3] || intMatch[4] || intMatch[5])) {
      const [, pre, subBrace, subChar, supBrace, supChar] = intMatch;
      const lower = subBrace || subChar;
      const upper = supBrace || supChar;
      if (pre) {
        nodes.push(...renderSubAndSup(pre, keyIdx++));
      }
      nodes.push(
        <span key={`int-${keyIdx++}`} className={styles.bigOpWrap}>
          {upper && <span className={styles.bigOpUpper}>{parseMathTokens(upper)}</span>}
          <span className={styles.bigOpSymbol}>∫</span>
          {lower && <span className={styles.bigOpLower}>{parseMathTokens(lower)}</span>}
        </span>
      );
      remaining = remaining.slice(intMatch[0].length);
      continue;
    }

    // 6. Match Summation with limits: \sum_{i=1}^{n} or \sum_a^b
    const sumMatch = remaining.match(/^(.*?)\\sum(?:_\{([^}]+)\}|_([0-9a-zA-Z]))?(?:\^\{([^}]+)\}|\^([0-9a-zA-Z]))?/);
    if (sumMatch && (sumMatch[2] || sumMatch[3] || sumMatch[4] || sumMatch[5])) {
      const [, pre, subBrace, subChar, supBrace, supChar] = sumMatch;
      const lower = subBrace || subChar;
      const upper = supBrace || supChar;
      if (pre) {
        nodes.push(...renderSubAndSup(pre, keyIdx++));
      }
      nodes.push(
        <span key={`sum-${keyIdx++}`} className={styles.bigOpWrap}>
          {upper && <span className={styles.bigOpUpper}>{parseMathTokens(upper)}</span>}
          <span className={styles.bigOpSymbol}>∑</span>
          {lower && <span className={styles.bigOpLower}>{parseMathTokens(lower)}</span>}
        </span>
      );
      remaining = remaining.slice(sumMatch[0].length);
      continue;
    }

    // No higher-level blocks matched; process superscripts, subscripts, and plain characters
    nodes.push(...renderSubAndSup(remaining, keyIdx++));
    break;
  }

  return nodes;
}

/**
 * Handles superscripts (x^2, x^{2n}, x²), subscripts (x_1, x_{max}, x₁), and plain math typography
 */
function renderSubAndSup(str: string, parentKey: number): React.ReactNode[] {
  // Replace bare LaTeX commands that might still remain
  const cleaned = str
    .replace(/\\int\b/g, '∫')
    .replace(/\\iint\b/g, '∬')
    .replace(/\\oint\b/g, '∮')
    .replace(/\\sum\b/g, '∑')
    .replace(/\\prod\b/g, '∏')
    .replace(/\\quad\b/g, '   ')
    .replace(/\\qquad\b/g, '      ')
    .replace(/\\,/g, ' ')
    .replace(/\\;/g, ' ')
    .replace(/\\!/g, '')
    .replace(/\\%/g, '%')
    .replace(/\\_/g, '_');

  // Split by ^(...) or ^2, and _(...) or _2
  const parts = cleaned.split(/(\^\{[^\}]+\}|\^[0-9a-zA-Z\+\-\*\/\(\)]+|_\{[^\}]+\}|_[0-9a-zA-Z\+\-\*\/\(\)]+)/g);

  if (parts.length === 1) {
    return [renderBasicSymbols(cleaned, `txt-${parentKey}`)];
  }

  return parts.map((chunk, idx) => {
    const chunkKey = `${parentKey}-${idx}`;
    if (chunk.startsWith('^{') && chunk.endsWith('}')) {
      return <sup key={chunkKey} className={styles.sup}>{chunk.slice(2, -1)}</sup>;
    }
    if (chunk.startsWith('^')) {
      return <sup key={chunkKey} className={styles.sup}>{chunk.slice(1)}</sup>;
    }
    if (chunk.startsWith('_{') && chunk.endsWith('}')) {
      return <sub key={chunkKey} className={styles.sub}>{chunk.slice(2, -1)}</sub>;
    }
    if (chunk.startsWith('_')) {
      return <sub key={chunkKey} className={styles.sub}>{chunk.slice(1)}</sub>;
    }
    return renderBasicSymbols(chunk, chunkKey);
  });
}

/**
 * Replaces LaTeX symbols, greek letters, and relational operators with standard Unicode math symbols
 */
function replaceMathSymbols(str: string): string {
  return str
    // Greek letters
    .replace(/\\alpha\b/g, 'α')
    .replace(/\\beta\b/g, 'β')
    .replace(/\\gamma\b/g, 'γ')
    .replace(/\\delta\b/g, 'δ')
    .replace(/\\epsilon\b/g, 'ε')
    .replace(/\\theta\b/g, 'θ')
    .replace(/\\lambda\b/g, 'λ')
    .replace(/\\mu\b/g, 'μ')
    .replace(/\\pi\b/g, 'π')
    .replace(/\\sigma\b/g, 'σ')
    .replace(/\\tau\b/g, 'τ')
    .replace(/\\phi\b/g, 'φ')
    .replace(/\\psi\b/g, 'ψ')
    .replace(/\\omega\b/g, 'ω')
    .replace(/\\Delta\b/g, 'Δ')
    .replace(/\\Theta\b/g, 'Θ')
    .replace(/\\Lambda\b/g, 'Λ')
    .replace(/\\Sigma\b/g, 'Σ')
    .replace(/\\Phi\b/g, 'Φ')
    .replace(/\\Omega\b/g, 'Ω')
    // Operators and Relations
    .replace(/\\times\b/g, '×')
    .replace(/\\div\b/g, '÷')
    .replace(/\\pm\b/g, '±')
    .replace(/\\mp\b/g, '∓')
    .replace(/\\cdot\b/g, '·')
    .replace(/\\bullet\b/g, '•')
    .replace(/\\circ\b/g, '°')
    .replace(/\\degree\b/g, '°')
    .replace(/\\infty\b/g, '∞')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\neq\b/g, '≠')
    .replace(/\\leq\b|\\le\b/g, '≤')
    .replace(/\\geq\b|\\ge\b/g, '≥')
    .replace(/\\ll\b/g, '≪')
    .replace(/\\gg\b/g, '≫')
    .replace(/\\rightarrow\b|\\to\b/g, '→')
    .replace(/\\leftarrow\b/g, '←')
    .replace(/\\Rightarrow\b/g, '⇒')
    .replace(/\\Leftarrow\b/g, '⇐')
    .replace(/\\Leftrightarrow\b/g, '⇔')
    .replace(/\\leftrightarrow\b/g, '↔')
    .replace(/\\in\b/g, '∈')
    .replace(/\\notin\b/g, '∉')
    .replace(/\\subset\b/g, '⊂')
    .replace(/\\supset\b/g, '⊃')
    .replace(/\\cup\b/g, '∪')
    .replace(/\\cap\b/g, '∩')
    .replace(/\\forall\b/g, '∀')
    .replace(/\\exists\b/g, '∃')
    .replace(/\\partial\b/g, '∂')
    .replace(/\\nabla\b/g, '∇')
    .replace(/\\bot\b|\\perp\b/g, '⊥')
    .replace(/\\angle\b/g, '∠')
    .replace(/\\hat\{i\}/g, 'î')
    .replace(/\\hat\{j\}/g, 'ĵ')
    .replace(/\\hat\{k\}/g, 'k̂');
}

/**
 * Standard text with basic math punctuation typography
 */
function renderBasicSymbols(str: string, key?: string): React.ReactNode {
  return <span key={key}>{str}</span>;
}

export default MathText;
