/**
 * Math Import & Render System - Mathpix OCR Fallback Service (Step 3)
 *
 * For MathType WMF/EMF/PNG image equations and scanned question documents:
 * - Sends base64 image payload to Mathpix OCR API
 * - Receives LaTeX transcription
 * - Wraps output into canonical KaTeX $...$ / $$...$$
 * - Marks question/option with sourceType: "ocr-sourced" and status: "YELLOW" (review suggested)
 */

import { normalizeCanonicalMath } from './mathNormalizer.js';
import { validateTextField } from './mathValidator.js';
import type { ItemValidationResult } from './types.js';

export interface MathpixOcrResult {
  success: boolean;
  latex: string;
  sourceType: 'ocr-sourced';
  validation: ItemValidationResult;
  confidence: number;
  error?: string;
}

/**
 * Performs Mathpix OCR on an image buffer or base64 data URI.
 */
export async function performMathpixOcr(
  imageBufferOrBase64: Buffer | string,
  mimeType: string = 'image/png'
): Promise<MathpixOcrResult> {
  const appId = process.env.MATHPIX_APP_ID || '';
  const appKey = process.env.MATHPIX_APP_KEY || '';

  let base64Image: string;
  if (Buffer.isBuffer(imageBufferOrBase64)) {
    base64Image = `data:${mimeType};base64,${imageBufferOrBase64.toString('base64')}`;
  } else if (imageBufferOrBase64.startsWith('data:')) {
    base64Image = imageBufferOrBase64;
  } else {
    base64Image = `data:${mimeType};base64,${imageBufferOrBase64}`;
  }

  // Graceful fallback if Mathpix API keys are unconfigured
  if (!appId || !appKey || appId.trim().length < 3 || appKey.trim().length < 3) {
    const fallbackLatex = '[CHECK: Mathpix OCR credentials not configured. Please enter MATHPIX_APP_ID and MATHPIX_APP_KEY.]';
    return {
      success: false,
      latex: fallbackLatex,
      sourceType: 'ocr-sourced',
      confidence: 0,
      validation: {
        status: 'YELLOW',
        isValid: true,
        issues: [{ type: 'check_marker', message: 'Mathpix API key unconfigured' }]
      },
      error: 'MATHPIX_CREDENTIALS_MISSING'
    };
  }

  try {
    const response = await fetch('https://api.mathpix.com/v3/text', {
      method: 'POST',
      headers: {
        'app_id': appId.trim(),
        'app_key': appKey.trim(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        src: base64Image,
        formats: ['text', 'latex_styled'],
        math_inline_delimiters: ['$', '$'],
        math_display_delimiters: ['$$', '$$'],
        data_options: {
          include_latex: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mathpix API HTTP ${response.status}: ${errorText}`);
    }

    const data: any = await response.json();
    const rawLatex = data.text || data.latex_styled || '';
    const confidence = typeof data.confidence === 'number' ? data.confidence : 0.95;

    // Normalize output LaTeX
    const normalized = normalizeCanonicalMath(rawLatex);
    const validation = validateTextField(normalized, true /* isOcrOrAiSourced */);

    return {
      success: true,
      latex: normalized,
      sourceType: 'ocr-sourced',
      confidence,
      validation
    };
  } catch (err: any) {
    const fallbackLatex = `[CHECK: OCR conversion error - ${err.message}]`;
    return {
      success: false,
      latex: fallbackLatex,
      sourceType: 'ocr-sourced',
      confidence: 0,
      validation: {
        status: 'YELLOW',
        isValid: true,
        issues: [{ type: 'check_marker', message: err.message }]
      },
      error: err.message
    };
  }
}

