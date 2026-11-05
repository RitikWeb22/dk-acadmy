/**
 * Records the string at every stage of the paste path MathInput and MathText use.
 * Observation only: it calls the production functions and does not change them.
 */
import { sanitizeFormula } from '../components/ui/MathEngine/sanitizeFormula';
import { parseContentToBlocks } from '../components/ui/MathEngine/mathParser';
import katex from 'katex';
import {
  convertHtmlWithMath,
  detectInputFormat,
  preprocessRawHtmlMathDetailed,
  reconstructLinearEquation,
} from './universalMathEngine';
import { readClipboardPayload, resolveMathInputPaste } from './mathInputPaste';

export interface PasteBlockSnapshot {
  type: string;
  content: string;
  rawSource: string;
  sanitized: string | null;
  katexOk: boolean | null;
  katexError: string | null;
}

export interface PastePipelineTrace {
  rawPlain: string;
  rawHtml: string;
  afterOmmlExtraction: string;
  ommlWarnings: string[];
  ommlNeedsReview: boolean;
  afterLatexConversion: string;
  afterNormalizer: string;
  afterDelimiterWrapping: string;
  delimiterWrappedByPipeline: boolean;
  afterPasteHandler: string;
  usedPlainFallback: boolean;
  mathInputOnChange: string;
  mathTextInput: string;
  blocks: PasteBlockSnapshot[];
  warnings: string[];
  needsReview: boolean;
  sourceType: string;
}

function katexCheck(formula: string): { ok: boolean; error: string | null } {
  try {
    katex.renderToString(formula, { throwOnError: true, strict: false });
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function traceMathInputPaste(clipboardPayload: unknown): PastePipelineTrace {
  const { html, plain } = readClipboardPayload(clipboardPayload);
  const omml = preprocessRawHtmlMathDetailed(html);
  const sourceType = detectInputFormat(html || plain);
  const hasRawMathMarkup = Boolean(html && /<(?:m:)?(?:oMath|oMathPara|math)\b/i.test(html));
  const isMathHtml =
    sourceType === 'omml-xml' || sourceType === 'mathml-xml' || sourceType === 'html-math' || hasRawMathMarkup;
  const afterLatexConversion = html && isMathHtml ? convertHtmlWithMath(html) : '';
  const afterNormalizer = reconstructLinearEquation(
    afterLatexConversion.trim() ? afterLatexConversion : plain
  );
  const resolved = resolveMathInputPaste(clipboardPayload);
  const stored = resolved.aborted
    ? ''
    : resolved.result.hasQuestionWithOptions
      ? resolved.result.statement
      : resolved.result.fullNormalizedText;
  const blocks = parseContentToBlocks(stored).map((block) => {
    if (block.type === 'text') {
      return {
        type: block.type,
        content: block.content,
        rawSource: block.rawSource,
        sanitized: null,
        katexOk: null,
        katexError: null,
      };
    }
    const sanitized = sanitizeFormula(block.content);
    const katexResult = katexCheck(sanitized);
    return {
      type: block.type,
      content: block.content,
      rawSource: block.rawSource,
      sanitized,
      katexOk: katexResult.ok,
      katexError: katexResult.error,
    };
  });

  return {
    rawPlain: plain,
    rawHtml: html,
    afterOmmlExtraction: omml.html,
    ommlWarnings: omml.warnings,
    ommlNeedsReview: omml.needsReview,
    afterLatexConversion,
    afterNormalizer,
    afterDelimiterWrapping: stored,
    delimiterWrappedByPipeline: /\$/.test(stored),
    afterPasteHandler: stored,
    usedPlainFallback: resolved.usedPlainFallback,
    mathInputOnChange: stored,
    mathTextInput: stored,
    blocks,
    warnings: [...(resolved.result.warnings || []), ...omml.warnings],
    needsReview: Boolean(resolved.result.warnings?.length) || omml.needsReview,
    sourceType: resolved.result.sourceType,
  };
}
