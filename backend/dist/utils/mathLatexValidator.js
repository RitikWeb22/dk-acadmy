/**
 * DK Academy - Mathematical LaTeX & Syntax Validation Engine
 * Validates extracted mathematical expressions against KaTeX / LaTeX grammar,
 * balanced delimiters, mathematical environments, and font corruption markers.
 * Backwards-compatible adapter backed by the Universal Mathematical Normalization Engine.
 */
import { validateLatex, validateStructuredQuestionLatex } from './universalMathEngine/index.js';
export function validateMathLatex(input) {
    return validateLatex(input);
}
export function validateQuestionLatexStructure(question) {
    return validateStructuredQuestionLatex(question);
}
