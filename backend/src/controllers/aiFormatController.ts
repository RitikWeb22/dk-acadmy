import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeMathInText } from '../utils/pdfQuestionExtractor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FormatMathRequestBody {
  statement?: string;
  options?: Array<{ key: string; text: string }>;
  stepSolution?: string;
  dkSirShortcut?: string;
  targetExam?: string;
  model?: string;
  geminiApiKey?: string;
}

/**
 * Returns current Gemini API configuration status
 */
export const getGeminiConfig = async (_req: Request, res: Response): Promise<void> => {
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
export const updateGeminiConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { apiKey, model = 'gemini-2.5-flash' } = req.body;
    const cleanModel = model === 'gemini-3.8-flash' ? 'gemini-2.5-flash' : model;
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
          } else {
            envContent += `\nGEMINI_API_KEY=${String(apiKey).trim()}`;
          }
        }
        if (cleanModel) {
          if (/^GEMINI_MODEL=/m.test(envContent)) {
            envContent = envContent.replace(/^GEMINI_MODEL=.*$/m, `GEMINI_MODEL=${String(cleanModel).trim()}`);
          } else {
            envContent += `\nGEMINI_MODEL=${String(cleanModel).trim()}`;
          }
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
      }
    } catch (fsErr: any) {
      console.warn('[Gemini Config] Could not persist to .env:', fsErr.message);
    }

    res.status(200).json({
      success: true,
      configured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5),
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      message: 'Gemini configuration updated successfully'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update Gemini configuration', details: err.message });
  }
};

/**
 * AI-Powered Mathematical KaTeX & LaTeX Formatter
 * Connects to Google Gemini API (gemini-2.5-flash / gemini-2.0-flash / gemini-1.5-flash)
 * with graceful offline fallback to high-precision deterministic regex normalizer.
 */
export const formatMathWithAi = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      statement = '',
      options = [],
      stepSolution = '',
      dkSirShortcut = '',
      targetExam = 'JEE Main & Advanced',
      model
    } = req.body as FormatMathRequestBody;

    if (!statement && (!options || options.length === 0)) {
      res.status(400).json({ error: 'Question statement or options are required for formatting.' });
      return;
    }

    const apiKey =
      (req.body as any)?.geminiApiKey ||
      (req.headers['x-gemini-api-key'] as string) ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      '';
    const preferredModel = (model === 'gemini-3.8-flash' ? 'gemini-2.5-flash' : model) || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (apiKey && apiKey.trim().length > 5) {
      try {
        const { result: aiResult, modelUsed, error: geminiError } = await callGeminiMathFormatter({
          statement,
          options,
          stepSolution,
          dkSirShortcut,
          targetExam,
          apiKey: apiKey.trim(),
          modelName: preferredModel
        });

        if (aiResult) {
          const rawStmt = aiResult.correctedQuestion || aiResult.statement || statement;
          const sanitizedStatement = normalizeMathInText(rawStmt);

          const rawOpts = Array.isArray(aiResult.correctedOptions) && aiResult.correctedOptions.length > 0
            ? aiResult.correctedOptions
            : Array.isArray(aiResult.options) && aiResult.options.length > 0
            ? aiResult.options
            : options;

          const sanitizedOptions = rawOpts.map((o: any) => ({
            key: o.key,
            text: normalizeMathInText(o.text || '')
          }));

          res.status(200).json({
            success: true,
            aiPowered: true,
            modelUsed,
            confidence: typeof aiResult.confidence === 'number' ? aiResult.confidence : 0.95,
            changes: aiResult.changes || ['Reconstructed mathematical LaTeX expressions'],
            uncertainExpressions: aiResult.uncertainExpressions || [],
            requiresManualReview: Boolean(aiResult.requiresManualReview),
            reason: aiResult.reason || 'KaTeX mathematical syntax verified and reconstructed',
            data: {
              statement: sanitizedStatement,
              correctedQuestion: sanitizedStatement,
              options: sanitizedOptions,
              correctedOptions: sanitizedOptions,
              changes: aiResult.changes || ['Reconstructed mathematical LaTeX expressions'],
              uncertainExpressions: aiResult.uncertainExpressions || [],
              requiresManualReview: Boolean(aiResult.requiresManualReview),
              confidence: typeof aiResult.confidence === 'number' ? aiResult.confidence : 0.95,
              reason: aiResult.reason || 'KaTeX mathematical syntax verified and reconstructed',
              stepSolution: aiResult.stepSolution ? normalizeMathInText(aiResult.stepSolution) : (stepSolution ? normalizeMathInText(stepSolution) : ''),
              dkSirShortcut: aiResult.dkSirShortcut ? normalizeMathInText(aiResult.dkSirShortcut) : (dkSirShortcut ? normalizeMathInText(dkSirShortcut) : '')
            }
          });
          return;
        }

        // Gemini returned a specific error (e.g. invalid key or quota)
        if (geminiError) {
          const cleanedStatement = normalizeMathInText(statement);
          const cleanedOptions = Array.isArray(options)
            ? options.map((opt) => ({ key: opt.key, text: normalizeMathInText(opt.text || '') }))
            : [];

          res.status(200).json({
            success: false,
            aiPowered: false,
            error: geminiError.code,
            message: geminiError.message,
            modelUsed: 'in-engine-normalizer',
            data: {
              statement: cleanedStatement,
              correctedQuestion: cleanedStatement,
              options: cleanedOptions,
              correctedOptions: cleanedOptions,
              changes: ['Applied in-engine deterministic normalizer (Gemini error: ' + geminiError.message + ')'],
              uncertainExpressions: [],
              requiresManualReview: true,
              confidence: 0.85,
              reason: geminiError.message,
              stepSolution: stepSolution ? normalizeMathInText(stepSolution) : stepSolution,
              dkSirShortcut: dkSirShortcut ? normalizeMathInText(dkSirShortcut) : dkSirShortcut
            }
          });
          return;
        }
      } catch (geminiErr: any) {
        console.warn('[Gemini AI Formatting Notice]:', geminiErr.message, '- Falling back to in-engine normalizer');
      }
    }

    // High-precision deterministic fallback when Gemini is unconfigured
    const cleanedStatement = normalizeMathInText(statement);
    const cleanedOptions = Array.isArray(options)
      ? options.map((opt) => ({
          key: opt.key,
          text: normalizeMathInText(opt.text || '')
        }))
      : [];

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
  } catch (err: any) {
    console.error('Error in formatMathWithAi:', err);
    res.status(500).json({ error: 'Failed to format mathematical content', details: err.message });
  }
};

/**
 * Invokes Google Gemini REST API to reconstruct mathematical LaTeX structures
 */
async function callGeminiMathFormatter(params: {
  statement: string;
  options: Array<{ key: string; text: string }>;
  stepSolution?: string;
  dkSirShortcut?: string;
  targetExam: string;
  apiKey: string;
  modelName: string;
}): Promise<{ result: any | null; modelUsed: string; error?: { code: string; message: string } }> {
  const { statement, options, stepSolution, dkSirShortcut, targetExam, apiKey, modelName } = params;

  // Clean model name and build robust list of valid production models
  const cleanModelName = modelName === 'gemini-3.8-flash' ? 'gemini-2.5-flash' : modelName;
  const modelsToTry = [
    cleanModelName,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ].filter((m, i, arr) => m && arr.indexOf(m) === i);

  const prompt = `You are an expert mathematical typesetting and mathematical document reconstruction engine.
Your task is to repair corrupted mathematical notation while preserving the original mathematical meaning.

Rules:
1. Never invent missing operators, numbers, variables, brackets, or mathematical relationships.
2. Never silently guess an ambiguous expression.
3. Preserve all readable original text.
4. Correct LaTeX syntax only when the intended expression is unambiguous.
5. Detect missing symbols and mark uncertain regions.
6. Distinguish between a rendering problem and actual missing source information.
7. Preserve question statements, options, diagrams, units, and answer choices.
8. Return valid JSON only.
9. Include confidence and uncertainty information.
10. If the original meaning cannot be recovered, explicitly request the original DOCX or an image of the question.

Input Examination Content to Reconstruct (${targetExam}):
Question Statement: """${statement}"""
Options: ${JSON.stringify(options)}
Step Solution: """${stepSolution || ''}"""
DK Sir Shortcut: """${dkSirShortcut || ''}"""

Return ONLY a valid, raw JSON object (without markdown fences, or inside \`\`\`json \`\`\`) with this exact schema:
{
  "correctedQuestion": "<reconstructed KaTeX statement with $...$ for math formulas>",
  "correctedOptions": [
    { "key": "A", "text": "<formatted option A with $...$>" },
    { "key": "B", "text": "<formatted option B with $...$>" },
    { "key": "C", "text": "<formatted option C with $...$>" },
    { "key": "D", "text": "<formatted option D with $...$>" }
  ],
  "changes": ["<list of specific fixes made to mathematical expressions>"],
  "uncertainExpressions": ["<list of unrecoverable or ambiguous expressions, if any>"],
  "requiresManualReview": false,
  "confidence": 0.95,
  "reason": "<summary of reconstruction analysis>"
}`;

  let lastError: { code: string; message: string } | undefined;

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

        if (response.status === 400 && errText.includes('API key not valid')) {
          lastError = { code: 'GEMINI_INVALID_KEY', message: 'API key not valid. Please pass a valid Google Gemini API key.' };
          break; // Don't retry other models with an invalid key
        } else if (response.status === 429) {
          lastError = { code: 'GEMINI_QUOTA_EXCEEDED', message: 'Gemini API rate limit or quota exceeded. Please check Google AI Studio.' };
        } else {
          lastError = { code: `HTTP_${response.status}`, message: `Gemini API returned status ${response.status}` };
        }
        continue;
      }

      const jsonResponse = (await response.json()) as any;
      const candidateText = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) continue;

      const parsed = robustParseGeminiJson(candidateText);
      if (parsed && (typeof parsed.correctedQuestion === 'string' || typeof parsed.statement === 'string' || Array.isArray(parsed.correctedOptions) || Array.isArray(parsed.options))) {
        return { result: parsed, modelUsed: model };
      }
    } catch (err: any) {
      console.warn(`[Gemini API Attempt failed for ${model}]:`, err.message);
      lastError = { code: 'NETWORK_ERROR', message: err.message };
    }
  }

  return { result: null, modelUsed: cleanModelName, error: lastError };
}

/**
 * Robust JSON parser designed for LLM outputs containing raw LaTeX equations
 * Safely handles unescaped backslashes, invalid JSON escape characters, and markdown wraps.
 */
function robustParseGeminiJson(rawText: string): any {
  if (!rawText) return null;
  const cleanJsonStr = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // Attempt 1: Direct JSON parse
  try {
    return JSON.parse(cleanJsonStr);
  } catch {}

  // Attempt 2: Sanitize unescaped LaTeX backslashes
  try {
    const sanitized = cleanJsonStr.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\');
    return JSON.parse(sanitized);
  } catch {}

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
  } catch {}

  // Attempt 4: Safe Regex Field Extraction Fallback
  try {
    const extractField = (fieldName: string): string => {
      const marker = `"${fieldName}"`;
      const idx = cleanJsonStr.indexOf(marker);
      if (idx === -1) return '';
      const colonIdx = cleanJsonStr.indexOf(':', idx + marker.length);
      if (colonIdx === -1) return '';
      const startQuote = cleanJsonStr.indexOf('"', colonIdx + 1);
      if (startQuote === -1) return '';
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
      if (endQuote === -1) return '';
      return cleanJsonStr.slice(startQuote + 1, endQuote).replace(/\\"/g, '"');
    };

    const correctedQuestion = extractField('correctedQuestion') || extractField('statement');
    const options: Array<{ key: string; text: string }> = [];
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
  } catch {}

  return null;
}
