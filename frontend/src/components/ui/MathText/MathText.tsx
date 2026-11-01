import React, { useMemo } from 'react';
import katex from 'katex';
import styles from './MathText.module.scss';

interface MathTextProps {
  text?: string;
  className?: string;
  displayMode?: boolean;
}

/**
 * High-Precision KaTeX Mathematical Typography Renderer
 * Powered by KaTeX (NTA JEE / IIT Advanced standard)
 * 
 * Supports:
 * - Block Display Math: $$ ... $$ and \[ ... \]
 * - Inline Math: $ ... $ and \( ... \)
 * - Unwrapped Raw LaTeX Formulas: e.g. \cot^{-1}\left(\beta + \frac{1+\beta^2}{\alpha-\beta}\right)
 * - Greek letters: \alpha, \beta, \gamma, \theta, \lambda, \mu, \pi, \sigma, \omega...
 * - Advanced calculus: \int_{a}^{b}, \sum_{i=1}^{n}, \lim_{x \to 0}, \vec{v}, \sqrt{...}
 * - Inverse trigonometric & hyperbolic: \cot^{-1}, \sin^{-1}, \tan^{-1}...
 * - Nested fractions with dynamic sizing brackets \left( ... \right)
 */
export const MathText: React.FC<MathTextProps> = ({
  text,
  className = '',
  displayMode = false
}) => {
  if (!text || typeof text !== 'string') return null;

  const renderedContent = useMemo(() => {
    return renderMathString(text, displayMode);
  }, [text, displayMode]);

  return (
    <span
      className={`${styles.mathContainer} ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};

/**
 * Escapes HTML characters in plain text to prevent XSS
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Safely renders a LaTeX formula into HTML using KaTeX
 */
function renderKaTeX(formula: string, isDisplay: boolean): string {
  const clean = formula
    .trim()
    .replace(/\\\\([a-zA-Z]+)/g, '\\$1'); // unescape duplicate backslashes e.g. \\frac -> \frac

  try {
    return katex.renderToString(clean, {
      displayMode: isDisplay,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
      trust: false
    });
  } catch (err: any) {
    console.warn('[KaTeX Render Warning]:', err?.message || err);
    return `<span class="katex-fallback" style="font-family: 'Cambria Math', serif; font-style: italic;">${escapeHtml(clean)}</span>`;
  }
}

/**
 * Determines whether a string is a standalone raw LaTeX formula (without dollar signs)
 */
function isStandaloneMathFormula(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed) return false;

  // Prominent LaTeX operators/commands at start
  if (/^\\(?:cot|tan|sin|cos|sec|csc|log|ln|lim|int|sum|prod|frac|dfrac|sqrt|vec|alpha|beta|gamma|delta|theta|lambda|pi|sigma|omega|mathbf|mathrm|left|begin|matrix)\b/i.test(trimmed)) {
    return true;
  }

  // Contains math-specific commands and lacks typical English sentence words
  const hasMathCommands = /\\(?:frac|dfrac|sqrt|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Phi|Psi|Omega|cdot|times|div|pm|mp|le|ge|neq|approx|equiv|forall|exists|in|notin|subset|subseteq|cap|cup|int|sum|prod|lim|infty|partial|nabla|to|rightarrow|Rightarrow|Leftarrow|Leftrightarrow|left|right|cot|tan|sin|cos|sec|csc)\b/.test(trimmed);

  if (hasMathCommands) {
    // Check if it's primarily math or a prose sentence with math
    const commonProseWords = trimmed.match(/\b(the|is|are|was|were|then|find|where|given|value|which|following|statement|correct|incorrect|true|false|between|above|below)\b/gi);
    if (!commonProseWords || commonProseWords.length === 0) {
      return true;
    }
  }

  return false;
}

/**
 * Automatically wraps un-delimited LaTeX equations in $...$ or $$...$$
 */
function autoWrapMathDelimiters(text: string): string {
  if (!text || text.includes('$')) return text;

  const trimmed = text.trim();
  const hasLaTeX = /\\(?:cot|tan|sin|cos|sec|csc|log|ln|lim|int|sum|prod|frac|dfrac|sqrt|vec|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|lambda|mu|nu|xi|pi|rho|sigma|tau|phi|chi|psi|omega|left|right|begin|matrix)\b/.test(trimmed);

  if (!hasLaTeX) return text;

  if (isStandaloneMathFormula(trimmed)) {
    return `$$${trimmed}$$`;
  }

  // Enclose LaTeX formulas found in prose
  return text.replace(
    /(\\(?:cot|tan|sin|cos|sec|csc|log|ln|lim|int|sum|prod|frac|dfrac|sqrt|vec|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|lambda|mu|nu|xi|pi|rho|sigma|tau|phi|chi|psi|omega|left)[\s\S]*?)(?=(?:\s+(?:is|are|was|were|then|where|find|if|when|such|that)\b|[.,;?!]\s+[A-Z]|$))/gi,
    (match) => `$${match.trim()}$`
  );
}

/**
 * Main parser that parses text containing mixed math ($...$, $$...$$, \(...\), \[...\], raw LaTeX)
 * and returns safe HTML with KaTeX rendered nodes.
 */
function renderMathString(rawText: string, forceDisplay: boolean = false): string {
  let normalized = rawText
    // Unescape literal \n that might come from JSON or raw text
    .replace(/\\r\\n/g, '\n')
    // Convert \[...\] to $$...$$
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
    // Convert \(...\) to $...$
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  // Auto-wrap unescaped LaTeX expressions into $...$ or $$...$$
  normalized = autoWrapMathDelimiters(normalized);

  // If the entire string is a standalone formula without delimiters, render it directly
  if (!normalized.includes('$') && isStandaloneMathFormula(normalized)) {
    return `<div class="${styles.displayMathWrapper}">${renderKaTeX(normalized, true)}</div>`;
  }

  // Tokenize by math delimiters ($$...$$ and $...$)
  const tokenRegex = /(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g;
  const parts = normalized.split(tokenRegex);

  let htmlResult = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
      // Display Math
      const formula = part.slice(2, -2);
      htmlResult += `<div class="${styles.displayMathWrapper}">${renderKaTeX(formula, true)}</div>`;
    } else if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
      // Inline Math
      const formula = part.slice(1, -1);
      htmlResult += `<span class="${styles.inlineMathWrapper}">${renderKaTeX(formula, false)}</span>`;
    } else {
      // Plain text or unescaped inline formulas within text
      htmlResult += renderTextSegmentWithEmbeddedMath(part);
    }
  }

  return htmlResult;
}

/**
 * Handles plain text segments that may have unwrapped math snippets (e.g. \frac{1}{2}, x^2, \alpha)
 */
function renderTextSegmentWithEmbeddedMath(segment: string): string {
  // Check if segment has any LaTeX commands or math symbols
  const latexRegex = /(\\(?:cot|tan|sin|cos|sec|csc|log|ln|lim|int|sum|frac|dfrac|sqrt|vec|alpha|beta|gamma|delta|theta|lambda|pi|sigma|omega|pm|times|div|le|ge|neq|approx|infty)\b(?:\{[^}]*\}|\[[^\]]*\]|\^[0-9a-zA-Z{}-]+|_[0-9a-zA-Z{}-]+|\([^)]*\)|[a-zA-Z0-9_\^\{\}\+\-\=\/\* ]*)*)/g;

  if (!latexRegex.test(segment)) {
    // Safe standard text with preserved newlines
    return escapeHtml(segment).replace(/\n/g, '<br />');
  }

  // Reset regex index
  latexRegex.lastIndex = 0;

  const subParts = segment.split(latexRegex);
  let out = '';

  for (let j = 0; j < subParts.length; j++) {
    const sub = subParts[j];
    if (!sub) continue;

    if (sub.startsWith('\\') && isStandaloneMathFormula(sub)) {
      out += `<span class="${styles.inlineMathWrapper}">${renderKaTeX(sub, false)}</span>`;
    } else {
      out += escapeHtml(sub).replace(/\n/g, '<br />');
    }
  }

  return out;
}

export default MathText;
