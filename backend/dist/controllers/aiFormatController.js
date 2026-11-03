import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeMathInText } from '../utils/pdfQuestionExtractor.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Returns current Gemini API configuration status
 */
export const getGeminiConfig = async (_req, res) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
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
        const { apiKey, model = 'gemini-3.8-flash' } = req.body;
        if (apiKey !== undefined) {
            process.env.GEMINI_API_KEY = String(apiKey).trim();
        }
        if (model) {
            process.env.GEMINI_MODEL = String(model).trim();
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
                if (model) {
                    if (/^GEMINI_MODEL=/m.test(envContent)) {
                        envContent = envContent.replace(/^GEMINI_MODEL=.*$/m, `GEMINI_MODEL=${String(model).trim()}`);
                    }
                    else {
                        envContent += `\nGEMINI_MODEL=${String(model).trim()}`;
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
            model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
            message: 'Gemini configuration updated successfully'
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update Gemini configuration', details: err.message });
    }
};
/**
 * AI-Powered Mathematical KaTeX & LaTeX Formatter
 * Connects to Google Gemini API (gemini-3.8-flash with fallback to gemini-2.5-flash / gemini-2.0-flash / gemini-1.5-flash)
 * with graceful offline fallback to high-precision deterministic regex normalizer.
 */
export const formatMathWithAi = async (req, res) => {
    try {
        const { statement = '', options = [], stepSolution = '', dkSirShortcut = '', targetExam = 'JEE Main & Advanced', model } = req.body;
        if (!statement && (!options || options.length === 0)) {
            res.status(400).json({ error: 'Question statement or options are required for formatting.' });
            return;
        }
        const apiKey = req.body?.geminiApiKey ||
            req.headers['x-gemini-api-key'] ||
            process.env.GEMINI_API_KEY ||
            process.env.GOOGLE_API_KEY ||
            '';
        const preferredModel = model || process.env.GEMINI_MODEL || 'gemini-3.8-flash';
        if (apiKey) {
            try {
                const aiResult = await callGeminiMathFormatter({
                    statement,
                    options,
                    stepSolution,
                    dkSirShortcut,
                    targetExam,
                    apiKey,
                    modelName: preferredModel
                });
                if (aiResult) {
                    const sanitizedStatement = normalizeMathInText(aiResult.statement || statement);
                    const sanitizedOptions = Array.isArray(aiResult.options) && aiResult.options.length > 0
                        ? aiResult.options.map((o) => ({ key: o.key, text: normalizeMathInText(o.text || '') }))
                        : Array.isArray(options)
                            ? options.map((opt) => ({ key: opt.key, text: normalizeMathInText(opt.text || '') }))
                            : [];
                    res.status(200).json({
                        success: true,
                        aiPowered: true,
                        modelUsed: preferredModel,
                        data: {
                            ...aiResult,
                            statement: sanitizedStatement,
                            options: sanitizedOptions,
                            stepSolution: aiResult.stepSolution ? normalizeMathInText(aiResult.stepSolution) : (stepSolution ? normalizeMathInText(stepSolution) : ''),
                            dkSirShortcut: aiResult.dkSirShortcut ? normalizeMathInText(aiResult.dkSirShortcut) : (dkSirShortcut ? normalizeMathInText(dkSirShortcut) : '')
                        }
                    });
                    return;
                }
            }
            catch (geminiErr) {
                console.warn('[Gemini AI Formatting Notice]:', geminiErr.message, '- Falling back to in-engine normalizer');
            }
        }
        // High-precision deterministic fallback when Gemini is offline or unconfigured
        const cleanedStatement = normalizeMathInText(statement);
        const cleanedOptions = Array.isArray(options)
            ? options.map((opt) => ({
                key: opt.key,
                text: normalizeMathInText(opt.text || '')
            }))
            : [];
        res.status(200).json({
            success: true,
            aiPowered: false,
            modelUsed: 'in-engine-normalizer',
            data: {
                statement: cleanedStatement,
                options: cleanedOptions,
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
    // List of models to try in order
    const modelsToTry = [
        modelName,
        'gemini-3.8-flash',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro'
    ].filter((m, i, arr) => m && arr.indexOf(m) === i);
    const prompt = `You are a Senior Mathematical OCR & KaTeX LaTeX Reconstruction Specialist for competitive examination questions (${targetExam}).
Your task is to fix, reconstruct and typeset the following examination question, options, and solution into 100% accurate, error-free KaTeX/LaTeX.

Strict Formatting & OCR Correction Rules:
1. Reconstruct all mathematical expressions into standard LaTeX:
   - Fractions: \\frac{a}{b} or \\dfrac{a}{b}
   - Definite Integrals: \\int_a^b with correct lower-to-upper limits (never inverted). E.g. \\int_{\\frac{\\pi}{6}}^{\\frac{\\pi}{4}}
   - Piecewise functions: \\begin{cases} ... \\end{cases}
   - Matrices / Determinants: \\begin{bmatrix} ... \\end{bmatrix} or \\begin{vmatrix} ... \\end{vmatrix}
   - Logarithms: \\log_e(x), \\ln(x) (clean redundant double backslashes and broken parentheses like \\\\log_e(()\\sqrt{3} - 1) -> \\log_e(\\sqrt{3} - 1))
   - Trigonometric OCR Artifacts:
     * Fix corrupted cotangent/trig expressions from PDF/Word extractions:
       e.g. "[cot =x - 3 ,] cot =x + 3 ,] + 1] dx" or "\\left[\\cot =x - 3" must be reconstructed to:
       "\\left( \\cot\\left(x - \\frac{\\pi}{3}\\right) \\cot\\left(x + \\frac{\\pi}{3}\\right) + 1 \\right) dx"
     * Reconstruct angles where fractions were misread as "=x - 3" or "=x + 3" into \\left(x - \\frac{\\pi}{3}\\right) and \\left(x + \\frac{\\pi}{3}\\right)
   - Brackets: clean, balanced \\left( ... \\right), \\left[ ... \\right]. Never output duplicated "\\left\\left[" or unclosed "\\left[" that crash KaTeX.
2. Mixed Prose & Math:
   - Wrap mathematical formulas in single dollar $ ... $.
   - Keep English prose words like "If", "Let", "then", "is equal to", "find", "where", "for all" outside $ ... $ as clean English text.
3. Multiple Choice Options (A, B, C, D):
   - Format each option cleanly with LaTeX formulas.

Input Question Data to Format:
Statement: """${statement}"""
Options: ${JSON.stringify(options)}
Step Solution: """${stepSolution || ''}"""
DK Sir Shortcut: """${dkSirShortcut || ''}"""

Return ONLY a valid, raw JSON object (without markdown code fences, or inside \`\`\`json \`\`\`) with this exact schema:
{
  "statement": "<reconstructed KaTeX statement>",
  "options": [
    { "key": "A", "text": "<formatted option A>" },
    { "key": "B", "text": "<formatted option B>" },
    { "key": "C", "text": "<formatted option C>" },
    { "key": "D", "text": "<formatted option D>" }
  ],
  "stepSolution": "<formatted step solution or empty>",
  "dkSirShortcut": "<formatted shortcut or empty>"
}`;
    for (const model of modelsToTry) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                continue;
            }
            const jsonResponse = (await response.json());
            const candidateText = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!candidateText)
                continue;
            const cleanJsonStr = candidateText
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/\s*```$/i, '')
                .trim();
            const parsed = JSON.parse(cleanJsonStr);
            if (parsed && typeof parsed.statement === 'string') {
                return parsed;
            }
        }
        catch (err) {
            console.warn(`[Gemini API Attempt failed for ${model}]:`, err.message);
        }
    }
    return null;
}
