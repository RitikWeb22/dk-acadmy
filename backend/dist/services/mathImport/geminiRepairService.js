/**
 * Math Import & Render System - Gemini AI Mathematical Repair Service (Step 5)
 *
 * Invoked ONLY for items that still fail KaTeX validation after normalisation.
 * Connects to Google Gemini API (model: gemini-2.5-flash) with strict prompt:
 *   "Fix LaTeX formatting only. Do NOT change numbers, symbols or meaning.
 *    If something is missing/ambiguous return [CHECK: reason] instead of guessing.
 *    Return JSON only."
 *
 * Keeps original text and returns diff + audit trail.
 */
import { normalizeCanonicalMath } from './mathNormalizer.js';
import { validateQuestion } from './mathValidator.js';
const STRICT_SYSTEM_PROMPT = `You are a strict LaTeX/KaTeX mathematical syntax repair engine for Indian competitive exams (JEE Main, JEE Advanced, BITSAT).
CRITICAL RULES:
1. Fix LaTeX formatting ONLY (wrap math in $...$ or $$...$$, fix broken fractions, unescaped commands, unbalanced braces, linear residues).
2. Do NOT change numbers, symbols, variable names, or mathematical meaning.
3. If any expression or symbol is missing, corrupted beyond recognition, or ambiguous, return [CHECK: reason] instead of guessing.
4. Convert align / align* environments to aligned.
5. Return JSON ONLY with no outer markdown code fences or conversational text.

Expected JSON format:
{
  "statement": "string with corrected KaTeX math",
  "options": [
    { "key": "A", "text": "string with corrected KaTeX math" }
  ],
  "changes": ["list of fixes made"],
  "hasCheckMarkers": false,
  "confidence": 0.98
}`;
/**
 * Repairs failing question LaTeX using Gemini API.
 */
export async function repairMathWithGemini(input, options = {}) {
    const originalStatement = input.statement || '';
    const originalOptions = input.options || [];
    const apiKey = options.apiKey ||
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        '';
    const model = options.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    if (!apiKey || apiKey.trim().length < 5) {
        const normStatement = normalizeCanonicalMath(originalStatement);
        const normOptions = originalOptions.map((o) => ({
            key: o.key,
            text: normalizeCanonicalMath(o.text)
        }));
        const validation = validateQuestion(normStatement, normOptions, true);
        return {
            success: false,
            repairedStatement: normStatement,
            repairedOptions: normOptions,
            originalStatement,
            originalOptions,
            changes: ['Applied offline in-engine deterministic normalizer (Gemini API key unconfigured)'],
            hasCheckMarkers: normStatement.includes('[CHECK'),
            validation,
            modelUsed: 'offline-deterministic',
            confidence: 0.85,
            diffSummary: 'Normalized with in-engine rules without Gemini',
            error: 'GEMINI_KEY_UNCONFIGURED'
        };
    }
    const userPrompt = `Repair the following question and options for KaTeX compatibility:\n\n` +
        `Statement:\n${originalStatement}\n\n` +
        `Options:\n${originalOptions.map((o) => `(${o.key}) ${o.text}`).join('\n')}\n\n` +
        (input.validationIssues && input.validationIssues.length > 0
            ? `Validation issues detected:\n${input.validationIssues.join('\n')}`
            : '');
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: `${STRICT_SYSTEM_PROMPT}\n\n${userPrompt}` }]
                    }
                ],
                generationConfig: {
                    temperature: 0.0,
                    responseMimeType: 'application/json'
                }
            })
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API HTTP ${response.status}: ${errText}`);
        }
        const data = await response.json();
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const parsed = JSON.parse(rawContent.trim());
        const repairedStatement = normalizeCanonicalMath(parsed.statement || originalStatement);
        const repairedOptions = Array.isArray(parsed.options) && parsed.options.length > 0
            ? parsed.options.map((o) => ({
                key: String(o.key).toUpperCase(),
                text: normalizeCanonicalMath(o.text || '')
            }))
            : originalOptions.map((o) => ({ key: o.key, text: normalizeCanonicalMath(o.text) }));
        const changes = Array.isArray(parsed.changes) ? parsed.changes : ['Corrected LaTeX delimiters and environments'];
        const hasCheckMarkers = Boolean(parsed.hasCheckMarkers || repairedStatement.includes('[CHECK'));
        const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.95;
        // Run KaTeX validation on AI result
        const validation = validateQuestion(repairedStatement, repairedOptions, true /* isOcrOrAiSourced */);
        return {
            success: true,
            repairedStatement,
            repairedOptions,
            originalStatement,
            originalOptions,
            changes,
            hasCheckMarkers,
            validation,
            modelUsed: model,
            confidence,
            diffSummary: `Fixed ${changes.length} formatting issue(s) via ${model}`
        };
    }
    catch (err) {
        // Graceful fallback to deterministic normalizer
        const normStatement = normalizeCanonicalMath(originalStatement);
        const normOptions = originalOptions.map((o) => ({
            key: o.key,
            text: normalizeCanonicalMath(o.text)
        }));
        const validation = validateQuestion(normStatement, normOptions, true);
        return {
            success: false,
            repairedStatement: normStatement,
            repairedOptions: normOptions,
            originalStatement,
            originalOptions,
            changes: [`Gemini call error: ${err.message}. Normalized with in-engine rules.`],
            hasCheckMarkers: true,
            validation,
            modelUsed: 'offline-deterministic',
            confidence: 0.8,
            diffSummary: 'Fallback to deterministic rules',
            error: err.message
        };
    }
}
