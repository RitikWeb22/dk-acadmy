import { Request, Response } from 'express';
import { normalizeMathInText } from '../utils/pdfQuestionExtractor.js';

interface FormatMathRequestBody {
  statement?: string;
  options?: Array<{ key: string; text: string }>;
  stepSolution?: string;
  dkSirShortcut?: string;
  targetExam?: string;
  model?: string;
}

/**
 * AI-Powered Mathematical KaTeX & LaTeX Formatter
 * Connects to Google Gemini API (gemini-2.5-flash / gemini-1.5-flash) with
 * graceful offline fallback to high-precision deterministic regex normalizer.
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

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
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
          res.status(200).json({
            success: true,
            aiPowered: true,
            modelUsed: preferredModel,
            data: aiResult
          });
          return;
        }
      } catch (geminiErr: any) {
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
}): Promise<any> {
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

      const jsonResponse = (await response.json()) as any;
      const candidateText = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) continue;

      const cleanJsonStr = candidateText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(cleanJsonStr);
      if (parsed && typeof parsed.statement === 'string') {
        return parsed;
      }
    } catch (err: any) {
      console.warn(`[Gemini API Attempt failed for ${model}]:`, err.message);
    }
  }

  return null;
}
