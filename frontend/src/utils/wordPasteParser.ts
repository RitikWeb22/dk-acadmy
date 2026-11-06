import { normalizeMathText } from './questionBulkParser';

/**
 * Universal Word / PDF Question Parser
 * Parses single or multiple questions copied from Microsoft Word, PDF, or websites.
 * Automatically separates:
 * - Question statement with KaTeX / LaTeX preservation
 * - Options A, B, C, D (or 1, 2, 3, 4, or unlabeled newlines)
 * - Exam / Shift metadata (e.g. JEE Main 2024 6th April Evening Shift)
 * - Answer key (e.g. Ans: A, Ans: 1, Ans: 16)
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
 * Smart Question Splitter:
 * Splits raw pasted text into individual question segments without
 * accidentally fragmenting numbered options (1., 2., 3., 4.) into separate questions.
 */
export function splitIntoQuestionSegments(rawText: string): string[] {
  const text = rawText.trim();
  if (!text) return [];

  // Check 1: Explicit "Question 1:", "Q.1:", "Q1." prefixes
  const explicitQRegex = /(?:^|\n\s*\n|\n)(?=(?:Q(?:uestion)?\.?\s*\d+[\.\:\)]?)\s*)/i;
  const explicitParts = text.split(explicitQRegex).map((p) => p.trim()).filter(Boolean);
  if (explicitParts.length > 1) {
    return explicitParts;
  }

  // Check 2: Separated by double newlines where each block starts with a question number e.g. "1.", "2."
  // Prevents splitting numbered options (1., 2., 3., 4.) that belong to the same question!
  const doubleNewlineBlocks = text.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
  if (doubleNewlineBlocks.length > 1) {
    const questionNumberedBlocks = doubleNewlineBlocks.filter((b) => /^(?:Q\d+|\d+[\.\:\)])/i.test(b));
    if (questionNumberedBlocks.length >= 2) {
      return doubleNewlineBlocks;
    }
  }

  // Check 3: Multiple "Ans:" or "Answer:" lines indicate multiple questions
  const ansMatches = [...text.matchAll(/(?:^|\n)\s*(?:Ans(?:wer)?|Correct\s*Option|Key)\s*[:=\-]?\s*[A-D1-4]/gi)];
  if (ansMatches.length > 1) {
    const multiQRegex = /(?:\n\s*\n|\n)(?=\d+[\.\:\)]\s+[A-Z])/gi;
    const parts = text.split(multiQRegex).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) return parts;
  }

  // Default: Single question block (keeps statement & all options intact)
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

  // 3. Extract Answer Key / Numerical Answer (Supports Ans: A, Ans: (B), Ans: 1 -> A, Ans: 2 -> B, etc.)
  const numToLetterMap: Record<string, 'A' | 'B' | 'C' | 'D'> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
  let correctKey: 'A' | 'B' | 'C' | 'D' = 'A';
  let numericalAnswer = '';

  const ansMatch = text.match(/(?:Ans(?:wer)?|Correct\s*Option|Key)\s*[:=\-]?\s*\(?([A-D1-4]|\-?\d+(?:\.\d+)?)\)?/i);
  if (ansMatch) {
    const rawVal = ansMatch[1].trim().toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(rawVal)) {
      correctKey = rawVal as 'A' | 'B' | 'C' | 'D';
    } else if (['1', '2', '3', '4'].includes(rawVal)) {
      correctKey = numToLetterMap[rawVal] || 'A';
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

  // 5. Extract Options (Supports A-D, 1-4, Bare Labels, and Blank/Unlabeled Newlines)
  const optionsMap: Record<string, string> = { A: '', B: '', C: '', D: '' };

  // Strategy 1: Standard markers with parens, brackets, or Option label: (A), [A], Option A, A., A:, A), (1), [1], 1., 1)
  const standardMarkerRegex = /(?:^|[\n\r]|\s{2,}|\s)(?:\(([A-D1-4])\)|\[([A-D1-4])\]|Option\s*\(?([A-D1-4])\)?[:.]?|([A-D1-4])[\.:\)])(?:\s+|$)/gi;
  let matches = [...text.matchAll(standardMarkerRegex)];

  // Strategy 2: Bare letter or bare number markers (e.g. "A -21. B 21." or "1 -21. 2 21. 3 19. 4 0" or newline "A 10\nB 20")
  if (matches.length < 2) {
    const bareMarkerRegex = /(?:^|[\n\r]|\s{2,})(?:Option\s+)?([A-D1-4])(?:\s*[\.:\)]|\s+)(?=\S)/gi;
    const bareMatches = [...text.matchAll(bareMarkerRegex)];
    const keys = bareMatches.map((m) => (m[1] || '').toUpperCase());
    if ((keys.includes('A') && keys.includes('B')) || (keys.includes('1') && keys.includes('2'))) {
      matches = bareMatches;
    }
  }

  // Strategy 3: Single-line sequential A ... B ... C ... D ... or 1 ... 2 ... 3 ... 4 ...
  if (matches.length < 2) {
    const singleLineMatchLetters = text.match(/(?:^|[\n\r])\s*A\s*[\.:\)]?\s+([\s\S]+?)\s+B\s*[\.:\)]?\s+([\s\S]+?)\s+C\s*[\.:\)]?\s+([\s\S]+?)\s+D\s*[\.:\)]?\s+([\s\S]+)$/i);
    const singleLineMatchNumbers = text.match(/(?:^|[\n\r])\s*1\s*[\.:\)]?\s+([\s\S]+?)\s+2\s*[\.:\)]?\s+([\s\S]+?)\s+3\s*[\.:\)]?\s+([\s\S]+?)\s+4\s*[\.:\)]?\s+([\s\S]+)$/i);
    const match = singleLineMatchLetters || singleLineMatchNumbers;
    if (match) {
      const statement = text.slice(0, match.index).trim();
      optionsMap.A = match[1].trim().replace(/\s*\.$/, '');
      optionsMap.B = match[2].trim().replace(/\s*\.$/, '');
      optionsMap.C = match[3].trim().replace(/\s*\.$/, '');
      optionsMap.D = match[4].trim().replace(/\s*\.$/, '');
      text = statement;
    }
  }

  if (matches.length >= 2) {
    const firstOptionIdx = matches[0].index ?? 0;
    const extractedStatement = text.slice(0, firstOptionIdx).trim();

    for (let i = 0; i < matches.length; i++) {
      const cur = matches[i];
      const rawK = (cur[1] || cur[2] || cur[3] || cur[4] || '').toUpperCase();
      const k = numToLetterMap[rawK] || (rawK as 'A' | 'B' | 'C' | 'D');
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

  // Strategy 4: Blank / Unlabeled Options (New Lines or Tab/Space Separated)
  // When options have NO marker (no A, B, C, D and no 1, 2, 3, 4)
  if (!optionsMap.A && !optionsMap.B) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    // Case 4a: Last 4 non-empty lines are options A, B, C, D
    if (lines.length >= 5) {
      const last4 = lines.slice(-4);
      if (last4.every((l) => l.length < 200)) {
        optionsMap.A = last4[0].replace(/\s*\.$/, '');
        optionsMap.B = last4[1].replace(/\s*\.$/, '');
        optionsMap.C = last4[2].replace(/\s*\.$/, '');
        optionsMap.D = last4[3].replace(/\s*\.$/, '');
        text = lines.slice(0, -4).join('\n').trim();
      }
    } else if (lines.length >= 2) {
      // Case 4b: Last line has 4 tokens separated by tabs or 3+ spaces
      const lastLine = lines[lines.length - 1];
      const tokens = lastLine.split(/\t+|\s{3,}/).map((t) => t.trim()).filter(Boolean);
      if (tokens.length === 4) {
        optionsMap.A = tokens[0].replace(/\s*\.$/, '');
        optionsMap.B = tokens[1].replace(/\s*\.$/, '');
        optionsMap.C = tokens[2].replace(/\s*\.$/, '');
        optionsMap.D = tokens[3].replace(/\s*\.$/, '');
        text = lines.slice(0, -1).join('\n').trim();
      }
    }
  }

  // 6. Mathematical & LaTeX Normalization (KaTeX / MathJax Compatibility)
  const normalizedStatement = normalizeMathText(text.trim());
  const finalOptions: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = [
    { key: 'A', text: normalizeMathText(optionsMap.A || '') },
    { key: 'B', text: normalizeMathText(optionsMap.B || '') },
    { key: 'C', text: normalizeMathText(optionsMap.C || '') },
    { key: 'D', text: normalizeMathText(optionsMap.D || '') }
  ];

  return {
    statement: normalizedStatement,
    options: finalOptions,
    type: 'SINGLE_CORRECT',
    correctKey,
    examTag: examTag || undefined,
    solution: solution ? normalizeMathText(solution) : undefined,
    shortcut: shortcut ? normalizeMathText(shortcut) : undefined
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


