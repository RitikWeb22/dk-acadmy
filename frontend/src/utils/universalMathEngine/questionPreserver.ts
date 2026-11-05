/**
 * Question Content Preservation Layer (Layer E)
 *
 * Splits pasted question text into statement / options / answer / solution /
 * shortcut, while keeping the original math content intact.
 */

import type { NormalizedOption, NormalizedQuestionResult } from './types';
import { detectInputFormat } from './inputDetector';
import { convertHtmlWithMath } from './ommlMathMLConverter';
import { reconstructLinearEquation } from './linearEquationParser';
import { validateLatex } from './latexValidator';

type OptionKey = 'A' | 'B' | 'C' | 'D';
const OPTION_KEYS: readonly OptionKey[] = ['A', 'B', 'C', 'D'];

export interface ExtractedQuestion {
  statement: string;
  options: NormalizedOption[];
  correctKey?: OptionKey;
  numericalAnswer?: string;
  stepSolution?: string;
  dkSirShortcut?: string;
}

export type PastedContent =
  | string
  | { getData(format: string): string }
  | { html?: string; text?: string }
  | null
  | undefined;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Normalise line endings, NBSP and zero-width characters. */
function cleanWhitespace(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
}

function toOptionKey(raw: string): OptionKey | null {
  if (raw.length !== 1) return null;
  const v = raw.toUpperCase();
  if (v >= 'A' && v <= 'D') return v as OptionKey;
  const idx = '1234'.indexOf(v);
  return idx >= 0 ? OPTION_KEYS[idx] : null;
}

/**
 * A labelled line such as "Answer: B", "Solution - ...", "DK Sir Shortcut: ...".
 * Anchored to the start of a line so words like "solution" inside the
 * question text are never mistaken for a section label.
 * Groups: 1 = shortcut, 2 = solution, 3 = answer, 4 = rest of line.
 */
const SECTION_LINE =
  /^[ \t]*(?:(DK\s*Sir\s*Shortcut|Inspection\s*Shortcut|Shortcut\s*Method)|(Step-by-step\s*Solution|Detailed\s*Solution|Solution|Explanation)|(Ans(?:wer)?|Correct(?:\s*(?:Key|Option|Answer|Value))?|Option|Value))[ \t]*[:=\-–][ \t]*(.*)$/i;

/** "... (D) 5   Ans: B" – answer written at the end of the last option line. */
const INLINE_ANSWER =
  /[ \t]+(?:Ans(?:wer)?|Correct(?:\s*(?:Key|Option|Answer))?)[ \t]*[:=\-–][ \t]*(\(?[A-Da-d1-4]\)?|[-−+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)[ \t]*$/im;

/** Interprets the text after an "Answer:" label. */
function parseAnswer(
  raw: string,
  hasOptions: boolean
): { correctKey?: OptionKey; numericalAnswer?: string } {
  const t = raw.trim();
  if (!t) return {};

  // "(B)", "B", "B)", "b."
  const letter = t.match(/^\(?([A-Da-d])\)?(?=$|[\s,;.)])/);
  if (letter) return { correctKey: toOptionKey(letter[1]) ?? undefined };

  // "(2)" is an option number
  const parenDigit = t.match(/^\(([1-4])\)/);
  if (parenDigit && hasOptions) return { correctKey: toOptionKey(parenDigit[1]) ?? undefined };

  // Plain number: option index only if the question really has options,
  // otherwise it is a numerical answer ("Answer: 3" with no options is 3, not C).
  const num = t.match(/^([-−+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)(?![A-Za-z0-9])/);
  if (num) {
    if (hasOptions && /^[1-4]$/.test(num[1])) {
      return { correctKey: toOptionKey(num[1]) ?? undefined };
    }
    return { numericalAnswer: num[1].replace('−', '-').replace(/^\+/, '') };
  }
  return {};
}

interface Marker {
  key: OptionKey;
  style: string;
  start: number; // where the marker begins
  end: number; // where the option text begins
}

/** Finds every "(A)", "A.", "A)", "(1)", "1." style marker. */
function findMarkers(text: string): Marker[] {
  const re = /(^|\s)(?:\(([A-Da-d1-4])\)|([A-Da-d1-4])([.)]))(?=\s)/g;
  const markers: Marker[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = m[2] ?? m[3];
    const key = toOptionKey(raw);
    if (!key) continue;
    const shape = m[2] !== undefined ? 'paren' : m[4];
    const kind = /\d/.test(raw) ? 'n' : raw === raw.toUpperCase() ? 'U' : 'l';
    markers.push({
      key,
      style: shape + kind,
      start: m.index + m[1].length,
      end: m.index + m[0].length,
    });
  }
  return markers;
}

/**
 * Picks the LAST consistent A→B→C→D run. Taking the last run means
 * sub-parts like "(a) ... (b) ..." or "1. ..." inside the statement are
 * not mistaken for the answer options.
 */
function findOptionSequence(markers: Marker[]): Marker[] | null {
  for (let d = markers.length - 1; d >= 0; d--) {
    if (markers[d].key !== 'D') continue;
    const style = markers[d].style;
    const seq: Marker[] = [markers[d]];
    let cursor = d;
    for (let k = 2; k >= 0; k--) {
      let found = -1;
      for (let i = cursor - 1; i >= 0; i--) {
        if (markers[i].key === OPTION_KEYS[k] && markers[i].style === style) {
          found = i;
          break;
        }
      }
      if (found < 0) break;
      seq.unshift(markers[found]);
      cursor = found;
    }
    if (seq.length === 4) return seq;
  }
  return null;
}

function splitStatementAndOptions(body: string): { statement: string; options: NormalizedOption[] } {
  const seq = findOptionSequence(findMarkers(body));
  if (!seq) return { statement: body.trim(), options: [] };

  const options: NormalizedOption[] = [];
  for (let i = 0; i < 4; i++) {
    const from = seq[i].end;
    const to = i < 3 ? seq[i + 1].start : body.length;
    let text = body.slice(from, to);
    // The last option ends at the first blank line, not at end of input.
    if (i === 3) text = text.split(/\n[ \t]*\n/)[0];
    text = text.trim();
    if (!text) return { statement: body.trim(), options: [] };
    options.push({ key: seq[i].key, text });
  }
  return { statement: body.slice(0, seq[0].start).trim(), options };
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export function extractStatementAndOptionsPreserving(rawText: string): ExtractedQuestion {
  if (!rawText || !rawText.trim()) {
    return { statement: '', options: [] };
  }

  const bodyLines: string[] = [];
  const shortcutLines: string[] = [];
  const solutionLines: string[] = [];
  let answerRaw: string | undefined;
  let current: 'body' | 'shortcut' | 'solution' = 'body';

  // Pass 1: split into sections line by line.
  for (const line of cleanWhitespace(rawText).split('\n')) {
    const m = line.match(SECTION_LINE);
    if (m) {
      const rest = m[4] ?? '';
      if (m[1]) {
        current = 'shortcut';
        shortcutLines.push(rest);
      } else if (m[2]) {
        current = 'solution';
        solutionLines.push(rest);
      } else {
        if (answerRaw === undefined) answerRaw = rest; // first answer wins
        current = 'body';
      }
      continue;
    }
    if (current === 'shortcut') shortcutLines.push(line);
    else if (current === 'solution') solutionLines.push(line);
    else bodyLines.push(line);
  }

  let body = bodyLines.join('\n');

  // Answer written inline at the end of the last option line.
  if (answerRaw === undefined) {
    const inline = body.match(INLINE_ANSWER);
    if (inline) {
      answerRaw = inline[1];
      body = body.replace(INLINE_ANSWER, '');
    }
  }

  // Pass 2: statement and options.
  const { statement, options } = splitStatementAndOptions(body);

  // Pass 3: interpret the answer now that we know whether options exist.
  const answer = answerRaw !== undefined ? parseAnswer(answerRaw, options.length === 4) : {};

  const stepSolution = solutionLines.join('\n').trim() || undefined;
  const dkSirShortcut = shortcutLines.join('\n').trim() || undefined;

  return {
    statement,
    options,
    correctKey: answer.correctKey,
    numericalAnswer: answer.correctKey ? undefined : answer.numericalAnswer,
    stepSolution,
    dkSirShortcut,
  };
}

function safeGetData(source: { getData(format: string): string }, format: string): string {
  try {
    return source.getData(format) || '';
  } catch {
    return '';
  }
}

function readClipboard(input: PastedContent): { html: string; plain: string } {
  if (!input) return { html: '', plain: '' };
  if (typeof input === 'string') return { html: '', plain: input };

  if ('getData' in input && typeof input.getData === 'function') {
    return {
      html: safeGetData(input, 'text/html'),
      plain: safeGetData(input, 'text/plain') || safeGetData(input, 'text'),
    };
  }

  const obj = input as { html?: string; text?: string };
  return { html: obj.html || '', plain: obj.text || '' };
}

export function normalizePastedQuestionContent(clipboardOrText: PastedContent): NormalizedQuestionResult {
  const { html, plain } = readClipboard(clipboardOrText);

  const sourceType = detectInputFormat(html || plain);
  const hasRawMathMarkup = Boolean(html && /<(?:m:)?(?:oMath|oMathPara|math)\b/i.test(html));
  const isMathHtml =
    sourceType === 'omml-xml' || sourceType === 'mathml-xml' || sourceType === 'html-math' || hasRawMathMarkup;

  // Prefer the structured HTML conversion when math markup is present;
  // fall back to the plain text if it produced nothing.
  let reconstructed = '';
  if (html && isMathHtml) {
    reconstructed = convertHtmlWithMath(html);
  }
  reconstructed = reconstructLinearEquation(reconstructed.trim() ? reconstructed : plain);

  const extracted = extractStatementAndOptionsPreserving(reconstructed);

  // Validate the options too, not just the statement.
  const report = validateLatex(
    [extracted.statement, ...extracted.options.map((o) => o.text)].join('\n')
  );

  return {
    sourceType,
    fullNormalizedText: reconstructed,
    hasQuestionWithOptions: extracted.options.length === 4,
    statement: extracted.statement,
    options: extracted.options,
    correctKey: extracted.correctKey,
    numericalAnswer: extracted.numericalAnswer,
    stepSolution: extracted.stepSolution,
    dkSirShortcut: extracted.dkSirShortcut,
    warnings: report.warnings,
    errors: report.errors,
    confidence: report.confidence,
    needsReview: report.needsReview,
  };
}