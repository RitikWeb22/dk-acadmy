/**
 * DK Academy - Universal Mathematical Question Normalization Engine
 *
 * Production-Grade Pipeline for:
 * - Microsoft Word (OMML & Word Linear Format)
 * - Google Docs & MathML
 * - OCR & PDF extraction
 * - Unicode Mathematical notation (superscripts, subscripts, radicals, operators)
 * - LaTeX structural parsing and validation
 * - JEE Main & Advanced question preservation
 */
import { detectInputFormat } from './inputDetector.js';
import { convertHtmlWithMath } from './ommlMathMLConverter.js';
import { reconstructLinearEquation } from './linearEquationParser.js';
import { validateLatex, validateStructuredQuestionLatex } from './latexValidator.js';
import { normalizePastedQuestionContent } from './questionPreserver.js';
export * from './types.js';
export * from './inputDetector.js';
export * from './domAdapter.js';
export * from './unicodeMathReconstructor.js';
export * from './ommlMathMLConverter.js';
export * from './linearEquationParser.js';
export * from './latexValidator.js';
export * from './questionPreserver.js';
/**
 * Universal Master Normalizer
 * High-level production pipeline that accepts any raw mathematical string or markup,
 * auto-detects the format, performs multi-layer structural reconstruction,
 * runs structural LaTeX validation, and produces structured metadata.
 */
export function normalizeMathematicalText(rawInput, options = {}) {
    if (!rawInput || typeof rawInput !== 'string') {
        const emptyValidation = {
            isValid: false,
            confidence: 0,
            needsReview: true,
            errors: ['Empty mathematical input'],
            warnings: [],
            uncertainRegions: ['empty']
        };
        return {
            success: false,
            normalizedText: '',
            sourceType: 'plain-text',
            confidence: 0,
            warnings: [],
            errors: ['Empty mathematical input'],
            needsReview: true,
            validation: emptyValidation
        };
    }
    const sourceType = detectInputFormat(rawInput);
    let processed = rawInput;
    // 1. If HTML / MathML / OMML markup is detected, perform structural DOM extraction first
    if (sourceType === 'omml-xml' || sourceType === 'mathml-xml' || sourceType === 'html-math') {
        processed = convertHtmlWithMath(processed);
    }
    // 2. Perform Word Linear and Unicode Mathematical structural reconstruction
    processed = reconstructLinearEquation(processed);
    // 3. Structural validation & integrity check
    const validation = validateLatex(processed);
    return {
        success: validation.isValid,
        normalizedText: processed,
        sourceType,
        confidence: validation.confidence,
        warnings: validation.warnings,
        errors: validation.errors,
        needsReview: validation.needsReview,
        validation
    };
}
/**
 * Backward-Compatible Adapter: reconstructWordEquationLinearFormat
 * Drop-in replacement for existing reconstructWordEquationLinearFormat callers
 */
export function reconstructWordEquationLinearFormat(rawText) {
    if (!rawText)
        return '';
    return reconstructLinearEquation(rawText);
}
/**
 * Backward-Compatible Adapter: normalizeMathInText
 * Drop-in replacement for existing normalizeMathInText callers
 */
export function normalizeMathInText(rawText) {
    if (!rawText)
        return '';
    const result = normalizeMathematicalText(rawText);
    return result.normalizedText;
}
/**
 * Backward-Compatible Adapter: normalizePastedQuestion
 * Drop-in replacement for existing normalizePastedQuestion callers
 */
export function normalizePastedQuestion(clipboard) {
    return normalizePastedQuestionContent(clipboard);
}
/**
 * Backward-Compatible Adapter: validateMathLatex
 * Drop-in replacement for existing validateMathLatex callers
 */
export function validateMathLatex(input) {
    return validateLatex(input);
}
/**
 * Backward-Compatible Adapter: validateQuestionLatexStructure
 * Drop-in replacement for existing validateQuestionLatexStructure callers
 */
export function validateQuestionLatexStructure(question) {
    return validateStructuredQuestionLatex(question);
}
