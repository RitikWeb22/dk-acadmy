/**
 * The paste decision used by MathInput.
 */
import { normalizePastedQuestion, type NormalizedQuestionResult } from './universalDocxParser';
import { PLAIN_TEXT_FALLBACK_WARNING, htmlResultLosesContent } from './pasteContentGuard';

export interface MathInputPasteResolution {
  html: string;
  plain: string;
  result: NormalizedQuestionResult;
  usedPlainFallback: boolean;
  aborted: boolean;
}

export function readClipboardPayload(clipboardPayload: unknown): { html: string; plain: string } {
  if (!clipboardPayload) return { html: '', plain: '' };
  if (typeof clipboardPayload === 'string') return { html: '', plain: clipboardPayload };

  const source = clipboardPayload as {
    getData?: (format: string) => string;
    html?: string;
    text?: string;
    plain?: string;
  };

  if (typeof source.getData === 'function') {
    let html = '';
    let plain = '';
    try {
      html = source.getData('text/html') || '';
    } catch {
      html = '';
    }
    try {
      plain = source.getData('text/plain') || source.getData('text') || '';
    } catch {
      plain = '';
    }
    return { html, plain };
  }

  return {
    html: source.html || '',
    plain: source.text || source.plain || '',
  };
}

function plainPath(plain: string, warning?: string): NormalizedQuestionResult {
  const result = normalizePastedQuestion(plain);
  if (warning) {
    result.warnings = [...(result.warnings || []), warning];
    result.needsReview = true;
  }
  return result;
}

export function resolveMathInputPaste(clipboardPayload: unknown): MathInputPasteResolution {
  const { html, plain } = readClipboardPayload(clipboardPayload);
  let result = normalizePastedQuestion(clipboardPayload as never);
  const htmlLostContent = Boolean(html && plain && htmlResultLosesContent(plain, result.fullNormalizedText));
  const isCorrupted =
    !result.fullNormalizedText || /\\frac\{\s*\}\{\s*\}/.test(result.fullNormalizedText);
  const usedPlainFallback = Boolean(plain && (htmlLostContent || isCorrupted));
  if (usedPlainFallback) {
    result = plainPath(plain, htmlLostContent ? PLAIN_TEXT_FALLBACK_WARNING : undefined);
  }
  return {
    html,
    plain,
    result,
    usedPlainFallback,
    aborted: !result.fullNormalizedText,
  };
}
