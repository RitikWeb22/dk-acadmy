/**
 * The paste decision used by MathInput.
 * Extracted so the builder and the paste harness call one function.
 * Behavior matches the previous inline handler: no new normalization rules.
 */
import { normalizeMathText } from './questionBulkParser';
import { normalizePastedQuestion, type NormalizedQuestionResult } from './universalDocxParser';

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

export function resolveMathInputPaste(clipboardPayload: unknown): MathInputPasteResolution {
  const { html, plain } = readClipboardPayload(clipboardPayload);
  const result = normalizePastedQuestion(clipboardPayload as never);
  const isCorrupted =
    !result.fullNormalizedText ||
    /\\frac\{\s*\}\{\s*\}/.test(result.fullNormalizedText) ||
    (plain.trim().length > 25 && result.fullNormalizedText.trim().length < plain.trim().length * 0.4);
  const usedPlainFallback = Boolean(isCorrupted && plain);
  if (usedPlainFallback) {
    result.fullNormalizedText = normalizeMathText(plain);
    result.statement = result.fullNormalizedText;
  }
  return {
    html,
    plain,
    result,
    usedPlainFallback,
    aborted: !result.fullNormalizedText,
  };
}
