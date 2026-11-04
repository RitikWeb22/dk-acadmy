/**
 * DK Academy - Mathematical LaTeX & Syntax Validation Engine
 * Validates extracted mathematical expressions against KaTeX / LaTeX grammar,
 * balanced delimiters, mathematical environments, and font corruption markers.
 */

export interface MathValidationReport {
  isValid: boolean;
  confidence: number; // 0.0 to 1.0
  needsReview: boolean;
  errors: string[];
  warnings: string[];
  uncertainRegions: string[];
}

/**
 * Validates a single LaTeX or mathematical text string
 */
export function validateMathLatex(input: string): MathValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const uncertainRegions: string[] = [];

  if (!input || input.trim().length === 0) {
    return {
      isValid: false,
      confidence: 0,
      needsReview: true,
      errors: ['Empty expression'],
      warnings: [],
      uncertainRegions: ['empty']
    };
  }

  const text = input.trim();

  // 1. Check balanced curly braces { and } (excluding escaped \{ and \})
  let openBraces = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{' && (i === 0 || text[i - 1] !== '\\')) {
      openBraces++;
    } else if (text[i] === '}' && (i === 0 || text[i - 1] !== '\\')) {
      openBraces--;
      if (openBraces < 0) {
        errors.push('Unmatched closing brace "}" detected');
        break;
      }
    }
  }
  if (openBraces > 0) {
    errors.push(`${openBraces} unclosed opening brace "{" detected`);
  }

  // 2. Check balanced environments (\begin{env} ... \end{env})
  const beginMatches = [...text.matchAll(/\\begin\{([a-zA-Z*]+)\}/g)].map(m => m[1]);
  const endMatches = [...text.matchAll(/\\end\{([a-zA-Z*]+)\}/g)].map(m => m[1]);

  if (beginMatches.length !== endMatches.length) {
    errors.push(`Mismatched LaTeX environments: found ${beginMatches.length} \\begin and ${endMatches.length} \\end tags`);
  } else {
    for (let i = 0; i < beginMatches.length; i++) {
      if (beginMatches[i] !== endMatches[endMatches.length - 1 - i]) {
        // Warning if environment names don't align in stack order
        warnings.push(`Environment nesting mismatch: \\begin{${beginMatches[i]}} paired with \\end{${endMatches[endMatches.length - 1 - i]}}`);
      }
    }
  }

  // 3. Check \left and \right delimiter balance
  const leftCount = (text.match(/\\left[\(\[\{\.\|]/g) || []).length;
  const rightCount = (text.match(/\\right[\)\]\}\.\|]/g) || []).length;
  if (leftCount !== rightCount) {
    warnings.push(`Mismatched \\left (${leftCount}) and \\right (${rightCount}) delimiters`);
  }

  // 4. Detect unparsed font artifacts or equation editor corruptions
  const artifactPatterns = [
    { pattern: /#\$|\$!|\$"|\$&|\$'/g, label: 'Unmapped Equation Editor polynomial variables ($!, $", $\')' },
    { pattern: /[█┤]/g, label: 'Unconverted Word Equation linear-format token (█, ┤)' },
    { pattern: /@&/g, label: 'Unconverted Word Equation alignment separator (@&)' },
    { pattern: /\/012|012(?!\d)/g, label: 'Unmapped Cambria Math sine glyph (/012)' },
    { pattern: /9:0/g, label: 'Unmapped Cambria Math cosine glyph (9:0)' },
    { pattern: /<:=/g, label: 'Unmapped Cambria Math logarithm/limit symbol' },
    { pattern: /\\int\s*\^\s*\d+\s*\n\s*\d+/g, label: 'Unstitched multi-line integral limits' },
    { pattern: /\\frac\{[^{}]*\}\s*$/g, label: 'Incomplete \\frac lacking denominator' },
    { pattern: /\\sqrt\s*$/g, label: 'Dangling radical \\sqrt with missing radicand' }
  ];

  for (const { pattern, label } of artifactPatterns) {
    const match = text.match(pattern);
    if (match) {
      warnings.push(`Possible font artifact: ${label} (${match[0]})`);
      uncertainRegions.push(match[0]);
    }
  }

  // 5. Check for valid fraction structure
  const fracMatches = [...text.matchAll(/\\(?:frac|dfrac)\{([^}]*)\}\{([^}]*)\}/g)];
  for (const match of fracMatches) {
    const num = match[1].trim();
    const den = match[2].trim();
    if (!num || !den) {
      errors.push(`Incomplete empty fraction \\frac{${num}}{${den}}`);
    }
  }

  // 6. Compute Confidence Score
  let confidence = 0.98;
  if (errors.length > 0) {
    confidence -= errors.length * 0.25;
  }
  if (warnings.length > 0) {
    confidence -= warnings.length * 0.10;
  }
  if (uncertainRegions.length > 0) {
    confidence -= uncertainRegions.length * 0.15;
  }

  confidence = Math.max(0.1, Math.min(1.0, Math.round(confidence * 100) / 100));
  const isValid = errors.length === 0;
  const needsReview = !isValid || confidence < 0.90 || warnings.length > 0 || uncertainRegions.length > 0;

  return {
    isValid,
    confidence,
    needsReview,
    errors,
    warnings,
    uncertainRegions
  };
}

/**
 * Validates an entire structured question object
 */
export function validateQuestionLatexStructure(question: {
  qNum: number;
  statement: string;
  options: { key: string; text: string }[];
}): {
  overallConfidence: number;
  needsReview: boolean;
  reasons: string[];
  uncertainRegions: string[];
} {
  const reasons: string[] = [];
  const uncertainRegions: string[] = [];
  let scoreSum = 0;
  let count = 0;

  // Validate Statement
  const stmtReport = validateMathLatex(question.statement);
  scoreSum += stmtReport.confidence;
  count++;
  if (!stmtReport.isValid) {
    reasons.push(`Statement LaTeX error: ${stmtReport.errors.join('; ')}`);
  }
  if (stmtReport.warnings.length > 0) {
    reasons.push(`Statement warning: ${stmtReport.warnings.join('; ')}`);
  }
  uncertainRegions.push(...stmtReport.uncertainRegions);

  // Validate Options
  if (Array.isArray(question.options)) {
    question.options.forEach((opt) => {
      if (opt.text && (opt.text.includes('\\') || opt.text.includes('$') || opt.text.includes('^'))) {
        const optReport = validateMathLatex(opt.text);
        scoreSum += optReport.confidence;
        count++;
        if (!optReport.isValid) {
          reasons.push(`Option ${opt.key} LaTeX error: ${optReport.errors.join('; ')}`);
        }
        uncertainRegions.push(...optReport.uncertainRegions);
      }
    });
  }

  const overallConfidence = count > 0 ? Math.round((scoreSum / count) * 100) / 100 : 0.95;
  const needsReview = reasons.length > 0 || overallConfidence < 0.90;

  return {
    overallConfidence,
    needsReview,
    reasons,
    uncertainRegions: Array.from(new Set(uncertainRegions))
  };
}

