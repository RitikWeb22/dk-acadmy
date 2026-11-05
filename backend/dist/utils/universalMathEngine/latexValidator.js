/**
 * LaTeX Validation & Confidence System (Layer F)
 * Analyzes mathematical expressions against KaTeX / LaTeX syntax rules,
 * delimiter balance, environment nesting, and structural integrity.
 */
export function validateLatex(input) {
    const errors = [];
    const warnings = [];
    const uncertainRegions = [];
    if (!input || input.trim().length === 0) {
        return {
            isValid: false,
            confidence: 0,
            needsReview: true,
            errors: ['Empty mathematical expression'],
            warnings: [],
            uncertainRegions: ['empty']
        };
    }
    const text = input.trim();
    // 1. Check balanced curly braces { and } (excluding \{ and \})
    let openBraces = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '{' && (i === 0 || text[i - 1] !== '\\')) {
            openBraces++;
        }
        else if (text[i] === '}' && (i === 0 || text[i - 1] !== '\\')) {
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
    // 2. Check balanced LaTeX environments (\begin{env} ... \end{env})
    const beginMatches = [...text.matchAll(/\\begin\{([a-zA-Z*]+)\}/g)].map(m => m[1]);
    const endMatches = [...text.matchAll(/\\end\{([a-zA-Z*]+)\}/g)].map(m => m[1]);
    if (beginMatches.length !== endMatches.length) {
        errors.push(`Mismatched LaTeX environments: found ${beginMatches.length} \\begin and ${endMatches.length} \\end tags`);
    }
    else {
        // Stack-based environment check
        const stack = [];
        const envRegex = /\\(begin|end)\{([a-zA-Z*]+)\}/g;
        let match;
        while ((match = envRegex.exec(text)) !== null) {
            const type = match[1];
            const envName = match[2];
            if (type === 'begin') {
                stack.push(envName);
            }
            else {
                const top = stack.pop();
                if (top !== envName) {
                    warnings.push(`Environment nesting mismatch: \\begin{${top}} closed by \\end{${envName}}`);
                }
            }
        }
    }
    // 3. Check \left and \right delimiter pairing
    const leftCount = (text.match(/\\left[\(\[\{\.\|]/g) || []).length;
    const rightCount = (text.match(/\\right[\)\]\}\.\|]/g) || []).length;
    if (leftCount !== rightCount) {
        warnings.push(`Mismatched \\left (${leftCount}) and \\right (${rightCount}) delimiters`);
    }
    // 4. Detect unconverted legacy tokens or font artifacts
    const artifactPatterns = [
        { pattern: /[█┤]/g, label: 'Unconverted Word Equation linear-format token (█, ┤)' },
        { pattern: /[┬┴]/g, label: 'Unconverted Word Equation stacked limit token (┬, ┴)' },
        { pattern: /@&/g, label: 'Unconverted Word Equation alignment separator (@&)' },
        { pattern: /\\frac\{\s*\}\{\s*\}/g, label: 'Empty fraction \\frac{}{}' },
        { pattern: /\\sqrt\{\s*\}/g, label: 'Empty radical \\sqrt{}' },
        { pattern: /\\frac\{[^{}]*\}\s*$/g, label: 'Incomplete \\frac lacking denominator' }
    ];
    for (const { pattern, label } of artifactPatterns) {
        const match = text.match(pattern);
        if (match) {
            warnings.push(`Possible artifact: ${label} (${match[0]})`);
            uncertainRegions.push(match[0]);
        }
    }
    // 5. Check for valid fraction structure
    const fracMatches = [...text.matchAll(/\\(?:frac|dfrac)\{([^}]*)\}\{([^}]*)\}/g)];
    for (const m of fracMatches) {
        const num = m[1].trim();
        const den = m[2].trim();
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
        uncertainRegions: Array.from(new Set(uncertainRegions))
    };
}
/**
 * Validates an entire structured question statement and its options
 */
export function validateStructuredQuestionLatex(question) {
    const reasons = [];
    const uncertainRegions = [];
    let scoreSum = 0;
    let count = 0;
    // Validate Statement
    const stmtReport = validateLatex(question.statement || '');
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
                const optReport = validateLatex(opt.text);
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
