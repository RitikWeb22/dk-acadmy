/**
 * Universal Word / PDF Question Parser
 * Parses single or multiple questions copied from Microsoft Word, PDF, or websites.
 * Automatically separates:
 * - Question statement with KaTeX / LaTeX preservation
 * - Options A, B, C, D (or 1, 2, 3, 4)
 * - Exam / Shift metadata (e.g. JEE Main 2024 6th April Evening Shift)
 * - Answer key (e.g. Ans: A, Ans: 16)
 * - Solution derivation and speed shortcut trick
 */

export interface ParsedWordQuestion {
  statement: string;
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
  type: 'SINGLE_CORRECT' | 'NUMERICAL';
  correctKey: 'A' | 'B' | 'C' | 'D';
  numericalAnswer?: string;
  examTag?: string;
  solution?: string;
  shortcut?: string;
}

/**
 * Splits raw pasted text into individual question segments.
 */
export function splitIntoQuestionSegments(rawText: string): string[] {
  const text = rawText.trim();
  if (!text) return [];

  // Match question numbering at start of lines: e.g. "1.", "2.", "Q1.", "Question 2:"
  const splitRegex = /(?:^|\n\s*\n|\n)(?=(?:Q(?:uestion)?\.?\s*\d+|\d+[\.\:\)])\s*)/i;
  const rawParts = text.split(splitRegex).map((p) => p.trim()).filter((p) => p.length > 0);

  if (rawParts.length > 1) {
    return rawParts;
  }

  // Fallback: check if text has multiple questions separated by double newlines with distinct "is equal to" or "Ans:"
  const doubleNewlineParts = text.split(/\n\s*\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 0);
  if (doubleNewlineParts.length > 1) {
    return doubleNewlineParts;
  }

  return [text];
}

/**
 * Parses a single question text block into structured components.
 */
export function parseSingleQuestionBlock(rawBlock: string): ParsedWordQuestion {
  // Normalize unicode spaces and strip invisible Word/PDF mathematical formatting markers
  let text = rawBlock
    .replace(/[\u200B-\u200D\uFEFF\u2060\u2061]/g, '')
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
    .trim();

  // 1. Remove leading question numbers e.g. "1.", "2.", "Q.1:", "Question 2:"
  text = text.replace(/^\s*(?:Q(?:uestion)?\.?\s*\d+|\d+[\.\:\)])\s*/i, '').trim();

  // 2. Extract Solution & Shortcut if present
  let solution = '';
  let shortcut = '';

  const shortcutMatch = text.match(/(?:DK\s*Sir\s*Shortcut|Shortcut|Speed\s*Trick)\s*[:=\-]\s*([\s\S]+?)(?=\n\s*(?:Ans|Solution|$))/i);
  if (shortcutMatch) {
    shortcut = shortcutMatch[1].trim();
    text = text.replace(shortcutMatch[0], '').trim();
  }

  const solutionMatch = text.match(/(?:Solution|Explanation|Step\s*Solution)\s*[:=\-]\s*([\s\S]+?)(?=\n\s*(?:Ans|Shortcut|$))/i);
  if (solutionMatch) {
    solution = solutionMatch[1].trim();
    text = text.replace(solutionMatch[0], '').trim();
  }

  // 3. Extract Answer Key / Numerical Answer
  let correctKey: 'A' | 'B' | 'C' | 'D' = 'A';
  let numericalAnswer = '';

  const ansMatch = text.match(/(?:Ans(?:wer)?|Correct\s*Option|Key)\s*[:=\-]?\s*\(?([A-D1-4]|\-?\d+(?:\.\d+)?)\)?/i);
  if (ansMatch) {
    const rawVal = ansMatch[1].trim();
    if (['A', 'B', 'C', 'D'].includes(rawVal.toUpperCase())) {
      correctKey = rawVal.toUpperCase() as any;
    } else if (['1', '2', '3', '4'].includes(rawVal)) {
      const map: Record<string, 'A' | 'B' | 'C' | 'D'> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
      correctKey = map[rawVal] || 'A';
    } else {
      numericalAnswer = rawVal;
    }
    text = text.replace(ansMatch[0], '').trim();
  }

  // 4. Extract Exam / Shift Tag (e.g. JEE Main 2024 (Online) 6th April Evening Shift)
  let examTag = '';
  const examTagMatch = text.match(/\b(JEE\s*(?:Main|Advanced)?(?:\s*\d{4})?[^\n]*?(?:Shift|Morning|Evening|Paper\s*\d|Session\s*\d)?)\b/i) ||
                       text.match(/\[(JEE\s*(?:Main|Advanced)?[^\]]+)\]/i) ||
                       text.match(/\b(BITSAT\s*\d{4}[^\n]*)/i);

  if (examTagMatch) {
    examTag = examTagMatch[1].trim().replace(/^\[|\]$/g, '');
    text = text.replace(examTagMatch[0], '').trim();
  }

  // 5. Extract Options (A, B, C, D)
  // Supports:
  // - Bare letters: A -21.   B 21.   C 19.   D 0
  // - Parenthesis/brackets: (A) ... (B) ... or [A] ... [B] ...
  // - Dotted/colon: A. ... B. ... C. ... D. ... or Option A: ...
  // - Numbered: (1) ... (2) ... (3) ... (4) ... or 1. ... 2. ...
  const optionsMap: Record<string, string> = { A: '', B: '', C: '', D: '' };

  // Strategy 1: Standard markers with parens, brackets, or Option label: (A), [A], Option A, A., A:, A)
  const standardMarkerRegex = /(?:^|[\n\r]|\s{2,}|\s)(?:\(([A-D1-4])\)|\[([A-D1-4])\]|Option\s*\(?([A-D1-4])\)?[:.]?|([A-D])[\.:\)])(?:\s+|$)/gi;
  let matches = [...text.matchAll(standardMarkerRegex)];

  // Strategy 2: Bare letter markers (e.g. "A -21.   B 21.   C 19.   D 0" or newline "A 10\nB 20")
  // Note: Delimiters are space, dot, colon, or closing paren. Minus/hyphen is explicitly excluded so negative numbers like "-21" are preserved!
  if (matches.length < 2) {
    const bareLetterRegex = /(?:^|[\n\r]|\s{2,})(?:Option\s+)?([A-D])(?:\s*[\.:\)]|\s+)(?=\S)/gi;
    const bareMatches = [...text.matchAll(bareLetterRegex)];
    const keys = bareMatches.map((m) => (m[1] || '').toUpperCase());
    if (keys.includes('A') && keys.includes('B')) {
      matches = bareMatches;
    }
  }

  // Strategy 3: Single-line sequential A ... B ... C ... D ...
  if (matches.length < 2) {
    const singleLineMatch = text.match(/(?:^|[\n\r])\s*A\s*[\.:\)]?\s+([\s\S]+?)\s+B\s*[\.:\)]?\s+([\s\S]+?)\s+C\s*[\.:\)]?\s+([\s\S]+?)\s+D\s*[\.:\)]?\s+([\s\S]+)$/i);
    if (singleLineMatch) {
      const statement = text.slice(0, singleLineMatch.index).trim();
      optionsMap.A = singleLineMatch[1].trim().replace(/\s*\.$/, '');
      optionsMap.B = singleLineMatch[2].trim().replace(/\s*\.$/, '');
      optionsMap.C = singleLineMatch[3].trim().replace(/\s*\.$/, '');
      optionsMap.D = singleLineMatch[4].trim().replace(/\s*\.$/, '');
      text = statement;
    }
  }

  if (matches.length >= 2) {
    const mapNum: Record<string, 'A' | 'B' | 'C' | 'D'> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
    const firstOptionIdx = matches[0].index ?? 0;
    const extractedStatement = text.slice(0, firstOptionIdx).trim();

    for (let i = 0; i < matches.length; i++) {
      const cur = matches[i];
      const rawK = (cur[1] || cur[2] || cur[3] || cur[4] || '').toUpperCase();
      const k = mapNum[rawK] || (rawK as 'A' | 'B' | 'C' | 'D');
      const start = (cur.index ?? 0) + cur[0].length;
      const end = (i + 1 < matches.length) ? (matches[i + 1].index ?? text.length) : text.length;
      let optVal = text.slice(start, end).trim();
      // Strip trailing punctuation dot if present (e.g. "-21." -> "-21")
      optVal = optVal.replace(/\s*\.$/, '');
      if (['A', 'B', 'C', 'D'].includes(k)) {
        optionsMap[k] = optVal;
      }
    }
    text = extractedStatement;
  }

  // 6. Question Always Has Options (Single Correct MCQ with Option A, B, C, D)
  const finalOptions: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = [
    { key: 'A', text: optionsMap.A || '' },
    { key: 'B', text: optionsMap.B || '' },
    { key: 'C', text: optionsMap.C || '' },
    { key: 'D', text: optionsMap.D || '' }
  ];

  return {
    statement: text.trim(),
    options: finalOptions,
    type: 'SINGLE_CORRECT',
    correctKey,
    examTag: examTag || undefined,
    solution: solution || undefined,
    shortcut: shortcut || undefined
  };
}

/**
 * Main parser entry point: parses text into array of structured questions.
 */
export function parseWordQuestions(rawText: string): ParsedWordQuestion[] {
  const segments = splitIntoQuestionSegments(rawText);
  if (segments.length === 0) return [];
  return segments.map((seg) => parseSingleQuestionBlock(seg));
}

