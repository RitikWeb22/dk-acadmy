import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeMathInText } from '../utils/pdfQuestionExtractor.js';
import { reconstructWordEquationLinearFormat } from '../utils/wordEquationReconstructor.js';
import { validateQuestionLatexStructure } from '../utils/mathLatexValidator.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Returns current Gemini API configuration status
 */
export const getGeminiConfig = async (_req, res) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    res.status(200).json({
        configured: Boolean(apiKey && apiKey.trim().length > 5),
        model,
        previewKey: apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : ''
    });
};
/**
 * Updates Gemini API key and model in memory and persists to .env
 */
export const updateGeminiConfig = async (req, res) => {
    try {
        const { apiKey, model = 'gemini-2.5-flash' } = req.body;
        const cleanModel = model || 'gemini-2.5-flash';
        if (apiKey !== undefined) {
            process.env.GEMINI_API_KEY = String(apiKey).trim();
        }
        if (cleanModel) {
            process.env.GEMINI_MODEL = String(cleanModel).trim();
        }
        // Persist to backend/.env if accessible
        try {
            const envPath = path.resolve(__dirname, '../../.env');
            if (fs.existsSync(envPath)) {
                let envContent = fs.readFileSync(envPath, 'utf8');
                if (apiKey !== undefined) {
                    if (/^GEMINI_API_KEY=/m.test(envContent)) {
                        envContent = envContent.replace(/^GEMINI_API_KEY=.*$/m, `GEMINI_API_KEY=${String(apiKey).trim()}`);
                    }
                    else {
                        envContent += `\nGEMINI_API_KEY=${String(apiKey).trim()}`;
                    }
                }
                if (cleanModel) {
                    if (/^GEMINI_MODEL=/m.test(envContent)) {
                        envContent = envContent.replace(/^GEMINI_MODEL=.*$/m, `GEMINI_MODEL=${String(cleanModel).trim()}`);
                    }
                    else {
                        envContent += `\nGEMINI_MODEL=${String(cleanModel).trim()}`;
                    }
                }
                fs.writeFileSync(envPath, envContent, 'utf8');
            }
        }
        catch (fsErr) {
            console.warn('[Gemini Config] Could not persist to .env:', fsErr.message);
        }
        res.status(200).json({
            success: true,
            configured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5),
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
            message: 'Gemini configuration updated successfully'
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update Gemini configuration', details: err.message });
    }
};
/**
 * AI-Powered Mathematical KaTeX & LaTeX Formatter
 * Connects to Google Gemini API (gemini-3.8-flash)
 * with graceful offline fallback to high-precision deterministic regex normalizer.
 */
export const formatMathWithAi = async (req, res) => {
    try {
        const { statement = '', options = [], stepSolution = '', dkSirShortcut = '', targetExam = 'JEE Main & Advanced', model } = req.body;
        if (!statement && (!options || options.length === 0)) {
            res.status(400).json({ error: 'Question statement or options are required for formatting.' });
            return;
        }
        // 1. High-Precision Preprocessing Layer: Reconstruct legacy Word linear-format structures (piecewise, matrices, etc.)
        const preprocessedStatement = normalizeMathInText(reconstructWordEquationLinearFormat(statement));
        const preprocessedOptions = Array.isArray(options)
            ? options.map((opt) => ({
                key: opt.key,
                text: normalizeMathInText(reconstructWordEquationLinearFormat(opt.text || ''))
            }))
            : [];
        const preprocessedStepSolution = stepSolution
            ? normalizeMathInText(reconstructWordEquationLinearFormat(stepSolution))
            : '';
        const preprocessedDkSirShortcut = dkSirShortcut
            ? normalizeMathInText(reconstructWordEquationLinearFormat(dkSirShortcut))
            : '';
        const apiKey = req.body?.geminiApiKey ||
            req.headers['x-gemini-api-key'] ||
            process.env.GEMINI_API_KEY ||
            process.env.GOOGLE_API_KEY ||
            '';
        const preferredModel = model || process.env.GEMINI_MODEL || 'gemini-3.8-flash';
        if (apiKey && apiKey.trim().length > 5) {
            try {
                const { result: aiResult, modelUsed, error: geminiError } = await callGeminiMathFormatter({
                    statement: preprocessedStatement,
                    options: preprocessedOptions,
                    stepSolution: preprocessedStepSolution,
                    dkSirShortcut: preprocessedDkSirShortcut,
                    targetExam,
                    apiKey: apiKey.trim(),
                    modelName: preferredModel
                });
                if (aiResult) {
                    const rawStmt = aiResult.correctedQuestion || aiResult.statement || preprocessedStatement;
                    let sanitizedStatement = normalizeMathInText(reconstructWordEquationLinearFormat(rawStmt));
                    // Run mathematical LaTeX validation on AI output
                    const validationReport = validateQuestionLatexStructure({
                        qNum: 1,
                        statement: sanitizedStatement,
                        options: []
                    });
                    // If AI corrupted structure or left legacy tokens, fall back to robust deterministic preprocessed statement
                    if (sanitizedStatement.includes('█') ||
                        sanitizedStatement.includes('┤') ||
                        validationReport.reasons.length > 0 || validationReport.needsReview) {
                        sanitizedStatement = preprocessedStatement;
                    }
                    const rawOpts = Array.isArray(aiResult.correctedOptions) && aiResult.correctedOptions.length > 0
                        ? aiResult.correctedOptions
                        : Array.isArray(aiResult.options) && aiResult.options.length > 0
                            ? aiResult.options
                            : preprocessedOptions;
                    const sanitizedOptions = rawOpts.map((o) => ({
                        key: o.key,
                        text: normalizeMathInText(reconstructWordEquationLinearFormat(o.text || ''))
                    }));
                    res.status(200).json({
                        success: true,
                        aiPowered: true,
                        modelUsed,
                        confidence: typeof aiResult.confidence === 'number' ? aiResult.confidence : 0.98,
                        changes: aiResult.changes || ['Reconstructed mathematical LaTeX expressions'],
                        uncertainExpressions: aiResult.uncertainExpressions || [],
                        requiresManualReview: Boolean(aiResult.requiresManualReview || validationReport.needsReview),
                        reason: aiResult.reason || 'KaTeX mathematical syntax verified and reconstructed',
                        data: {
                            statement: sanitizedStatement,
                            correctedQuestion: sanitizedStatement,
                            options: sanitizedOptions,
                            correctedOptions: sanitizedOptions,
                            changes: aiResult.changes || ['Reconstructed mathematical LaTeX expressions'],
                            uncertainExpressions: aiResult.uncertainExpressions || [],
                            requiresManualReview: Boolean(aiResult.requiresManualReview || validationReport.needsReview),
                            confidence: typeof aiResult.confidence === 'number' ? aiResult.confidence : 0.98,
                            reason: aiResult.reason || 'KaTeX mathematical syntax verified and reconstructed',
                            stepSolution: aiResult.stepSolution ? normalizeMathInText(reconstructWordEquationLinearFormat(aiResult.stepSolution)) : preprocessedStepSolution,
                            dkSirShortcut: aiResult.dkSirShortcut ? normalizeMathInText(reconstructWordEquationLinearFormat(aiResult.dkSirShortcut)) : preprocessedDkSirShortcut
                        }
                    });
                    return;
                }
                // Gemini returned a specific error (e.g. invalid key or quota)
                if (geminiError) {
                    res.status(200).json({
                        success: false,
                        aiPowered: false,
                        error: geminiError.code,
                        message: geminiError.message,
                        modelUsed: 'in-engine-normalizer',
                        data: {
                            statement: preprocessedStatement,
                            correctedQuestion: preprocessedStatement,
                            options: preprocessedOptions,
                            correctedOptions: preprocessedOptions,
                            changes: ['Applied in-engine deterministic normalizer (Gemini notice: ' + geminiError.message + ')'],
                            uncertainExpressions: [],
                            requiresManualReview: false,
                            confidence: 0.95,
                            reason: geminiError.message,
                            stepSolution: preprocessedStepSolution,
                            dkSirShortcut: preprocessedDkSirShortcut
                        }
                    });
                    return;
                }
            }
            catch (geminiErr) {
                console.warn('[Gemini AI Formatting Notice]:', geminiErr.message, '- Falling back to in-engine normalizer');
            }
        }
        // High-precision deterministic fallback when Gemini is unconfigured
        const cleanedStatement = preprocessedStatement;
        const cleanedOptions = preprocessedOptions;
        const isUnconfigured = !apiKey || apiKey.trim().length <= 5;
        res.status(200).json({
            success: !isUnconfigured,
            aiPowered: false,
            error: isUnconfigured ? 'GEMINI_KEY_NOT_CONFIGURED' : undefined,
            message: isUnconfigured
                ? 'Gemini API key is not configured. Formatted with high-precision in-engine KaTeX normalizer. Configure API key to enable Gemini AI correction.'
                : 'Formatted with in-engine KaTeX normalizer.',
            modelUsed: 'in-engine-normalizer',
            confidence: 0.90,
            changes: ['Applied high-precision KaTeX normalizer to fractions, limits, radicals, and Greek symbols'],
            uncertainExpressions: [],
            requiresManualReview: false,
            reason: 'Formatted with deterministic KaTeX mathematical rules',
            data: {
                statement: cleanedStatement,
                correctedQuestion: cleanedStatement,
                options: cleanedOptions,
                correctedOptions: cleanedOptions,
                changes: ['Applied high-precision KaTeX normalizer to fractions, limits, radicals, and Greek symbols'],
                uncertainExpressions: [],
                requiresManualReview: false,
                confidence: 0.90,
                reason: 'Formatted with deterministic KaTeX mathematical rules',
                stepSolution: stepSolution ? normalizeMathInText(stepSolution) : stepSolution,
                dkSirShortcut: dkSirShortcut ? normalizeMathInText(dkSirShortcut) : dkSirShortcut
            }
        });
    }
    catch (err) {
        console.error('Error in formatMathWithAi:', err);
        res.status(500).json({ error: 'Failed to format mathematical content', details: err.message });
    }
};
/**
 * Invokes Google Gemini REST API to reconstruct mathematical LaTeX structures
 */
async function callGeminiMathFormatter(params) {
    const { statement, options, stepSolution, dkSirShortcut, targetExam, apiKey, modelName } = params;
    // Clean model name and build robust list of production models with gemini-3.8-flash first
    const cleanModelName = modelName || process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    const modelsToTry = [
        cleanModelName,
        'gemini-3.8-flash',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash'
    ].filter((m, i, arr) => m && arr.indexOf(m) === i);
    const prompt = `You are a Senior Mathematical Typesetting Engineer and KaTeX Document Processing Specialist for JEE Advanced & Main examination content.
Your task is to repair, reconstruct, and typeset mathematical questions into production-grade KaTeX-compatible LaTeX.

CRITICAL MATHEMATICAL TYPESETTING RULES:
1. PIECEWISE FUNCTIONS:
   - For piecewise / cases functions, ALWAYS format as a LaTeX \\begin{cases} ... \\end{cases} environment within display math \\[ ... \\].
   - Example format:
     \\[
     f(x)=
     \\begin{cases}
     2\\sin\\left(-\\dfrac{\\pi x}{2}\\right), & x < -1,\\[6pt]
     \\left|ax^2+x+b\\right|, & -1 \\leq x \\leq 1,\\[6pt]
     \\sin(\\pi x), & x > 1.
     \\end{cases}
     \\]
   - Separate expression and condition with '&'.
   - Terminate intermediate rows with ',\\[6pt]' and the final row with '.' or ','.
   - NEVER place '$' or '\\[' inside the \\begin{cases} environment.
2. LEGACY WORD EQUATION LINEAR-FORMAT TOKENS:
   - Recognize tokens from Microsoft Word Equation Editor (UnicodeMath):
     - '█' = piecewise/cases structure marker
     - '@' = row separator
     - '&' = alignment / column separator
     - '┤' = closing invisible delimiter
   - NEVER leave '█', '@', or '┤' in the final output!
   - Domain mappings: f:R→R -> \\(f:\\mathbb{R}\\to\\mathbb{R}\\).
3. ABSOLUTE VALUE & BRACKETS:
   - Convert absolute values |...| to \\left| ... \\right|.
   - Use \\left( ... \\right) and \\left[ ... \\right] for tall expressions and fractions.
4. CALCULUS, TRIGONOMETRY & RELATIONS:
   - Standard commands: \\sin, \\cos, \\tan, \\cot, \\sec, \\csc, \\ln, \\log, \\exp, \\sqrt.
   - For limits: \\lim_{x \\to a} or \\lim_{n \\to \\infty}.
   - For fractions: prefer \\dfrac{...}{...} for clear display readability.
   - Relations: \\leq, \\geq, \\neq, \\in, \\subset, \\cup, \\cap, \\to.
   - Number sets: \\mathbb{R}, \\mathbb{Z}, \\mathbb{N}, \\mathbb{C}, \\mathbb{Q}.
5. PRESERVATION RULES:
   - Never delete a condition or row.
   - Never remove an absolute value or alter mathematical operators.
   - Never merge separate piecewise rows or reorder them.
   - Never invent missing expressions. Preserve incomplete sentences and questions exactly as provided.
   - Wrap inline formulas in $...$ or \\(...\\) and display equations in \\[ ... \\].

Input Examination Content (${targetExam}):
Question Statement: """${statement}"""
Options: ${JSON.stringify(options)}
Step Solution: """${stepSolution || ''}"""
DK Sir Shortcut: """${dkSirShortcut || ''}"""

Return ONLY a valid, raw JSON object (without markdown fences, or inside \`\`\`json \`\`\`) with this exact schema:
{
  "correctedQuestion": "<reconstructed KaTeX statement>",
  "correctedOptions": [
    { "key": "A", "text": "<formatted option A>" },
    { "key": "B", "text": "<formatted option B>" },
    { "key": "C", "text": "<formatted option C>" },
    { "key": "D", "text": "<formatted option D>" }
  ],
  "changes": ["<list of specific fixes made to mathematical expressions>"],
  "uncertainExpressions": ["<list of unrecoverable or ambiguous expressions, if any>"],
  "requiresManualReview": false,
  "confidence": 0.98,
  "reason": "<summary of reconstruction analysis>"
}`;
    let lastError;
    for (const model of modelsToTry) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout to prevent proxy 504
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: prompt }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 2048,
                        responseMimeType: 'application/json'
                    }
                })
            });
            if (!response.ok) {
                const errText = await response.text();
                console.warn(`[Gemini API Model ${model} HTTP ${response.status}]:`, errText.slice(0, 200));
                if (response.status === 400 && errText.includes('API key not valid')) {
                    lastError = { code: 'GEMINI_INVALID_KEY', message: 'API key not valid. Please pass a valid Google Gemini API key.' };
                    break; // Don't retry other models with an invalid key
                }
                else if (response.status === 429) {
                    lastError = { code: 'GEMINI_QUOTA_EXCEEDED', message: 'Gemini API rate limit or quota exceeded. Please check Google AI Studio.' };
                }
                else {
                    lastError = { code: `HTTP_${response.status}`, message: `Gemini API returned status ${response.status}` };
                }
                continue;
            }
            const jsonResponse = (await response.json());
            const candidateText = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!candidateText)
                continue;
            const parsed = robustParseGeminiJson(candidateText);
            if (parsed && (typeof parsed.correctedQuestion === 'string' || typeof parsed.statement === 'string' || Array.isArray(parsed.correctedOptions) || Array.isArray(parsed.options))) {
                return { result: parsed, modelUsed: model };
            }
        }
        catch (err) {
            const isAbort = err.name === 'AbortError' || err.message?.includes('aborted');
            console.warn(`[Gemini API Attempt failed for ${model}]:`, isAbort ? 'Timed out after 7s' : err.message);
            lastError = { code: isAbort ? 'TIMEOUT' : 'NETWORK_ERROR', message: isAbort ? 'Request timed out' : err.message };
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    return { result: null, modelUsed: cleanModelName, error: lastError };
}
/**
 * Robust JSON parser designed for LLM outputs containing raw LaTeX equations
 * Safely handles unescaped backslashes, invalid JSON escape characters, and markdown wraps.
 */
function robustParseGeminiJson(rawText) {
    if (!rawText)
        return null;
    const cleanJsonStr = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    // Attempt 1: Direct JSON parse
    try {
        return JSON.parse(cleanJsonStr);
    }
    catch { }
    // Attempt 2: Sanitize unescaped LaTeX backslashes
    try {
        const sanitized = cleanJsonStr.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\');
        return JSON.parse(sanitized);
    }
    catch { }
    // Attempt 3: Double escape common LaTeX command starters that clash with JSON control chars
    try {
        const fixedLatex = cleanJsonStr
            .replace(/\\frac/g, '\\\\frac')
            .replace(/\\text/g, '\\\\text')
            .replace(/\\times/g, '\\\\times')
            .replace(/\\tau/g, '\\\\tau')
            .replace(/\\theta/g, '\\\\theta')
            .replace(/\\to/g, '\\\\to')
            .replace(/\\right/g, '\\\\right')
            .replace(/\\rho/g, '\\\\rho')
            .replace(/\\beta/g, '\\\\beta')
            .replace(/\\begin/g, '\\\\begin')
            .replace(/\\bar/g, '\\\\bar')
            .replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\');
        return JSON.parse(fixedLatex);
    }
    catch { }
    // Attempt 4: Safe Regex Field Extraction Fallback
    try {
        const extractField = (fieldName) => {
            const marker = `"${fieldName}"`;
            const idx = cleanJsonStr.indexOf(marker);
            if (idx === -1)
                return '';
            const colonIdx = cleanJsonStr.indexOf(':', idx + marker.length);
            if (colonIdx === -1)
                return '';
            const startQuote = cleanJsonStr.indexOf('"', colonIdx + 1);
            if (startQuote === -1)
                return '';
            let endQuote = -1;
            let i = startQuote + 1;
            while (i < cleanJsonStr.length) {
                if (cleanJsonStr[i] === '"') {
                    let bsCount = 0;
                    let j = i - 1;
                    while (j >= startQuote && cleanJsonStr[j] === '\\') {
                        bsCount++;
                        j--;
                    }
                    if (bsCount % 2 === 0) {
                        endQuote = i;
                        break;
                    }
                }
                i++;
            }
            if (endQuote === -1)
                return '';
            return cleanJsonStr.slice(startQuote + 1, endQuote).replace(/\\"/g, '"');
        };
        const correctedQuestion = extractField('correctedQuestion') || extractField('statement');
        const options = [];
        const optRegex = /\{\s*"key"\s*:\s*"([A-D])"\s*,\s*"text"\s*:\s*"([\s\S]*?)(?="[\s\n]*\})/gi;
        let optMatch;
        while ((optMatch = optRegex.exec(cleanJsonStr)) !== null) {
            options.push({ key: optMatch[1], text: optMatch[2].replace(/\\"/g, '"') });
        }
        if (correctedQuestion || options.length > 0) {
            return {
                correctedQuestion,
                statement: correctedQuestion,
                correctedOptions: options,
                options,
                changes: ['Extracted via robust fallback parser'],
                uncertainExpressions: [],
                requiresManualReview: true,
                confidence: 0.85,
                reason: 'Extracted with regex fallback parser',
                stepSolution: extractField('stepSolution'),
                dkSirShortcut: extractField('dkSirShortcut')
            };
        }
    }
    catch { }
    return null;
}
