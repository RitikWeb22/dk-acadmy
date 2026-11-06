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
  let text = rawBlock.trim();

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

  // 5. Extract Options
  // Support: (A) ... (B) ... (C) ... (D) ... or (1) ... (2) ... (3) ... (4) ...
  // or A) ... B) ... C) ... D) ... or [A] ... [B] ... [C] ... [D] ...
  const optionsMap: Record<string, string> = { A: '', B: '', C: '', D: '' };
  let hasRealOptions = false;

  // Try Pattern 1: (A)/(B)/(C)/(D) or [A]/[B]/[C]/[D] or A)/B)/C)/D)
  const optionRegexLetters = /(?:^|\n|\s{2,}|\t)(?:\(?([A-D])[\)\.]|\[([A-D])\])\s*([\s\S]*?)(?=(?:(?:\(?([A-D])[\)\.]|\[([A-D])\])|\n\s*(?:Ans|Solution|Shortcut)|$))/gi;
  const letterMatches = [...text.matchAll(optionRegexLetters)];

  if (letterMatches.length >= 4) {
    hasRealOptions = true;
    letterMatches.forEach((m) => {
      const key = (m[1] || m[2]).toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        optionsMap[key] = m[3].trim();
      }
    });

    // Remove options from statement
    const firstOptionIndex = text.search(/(?:^|\n|\s{2,}|\t)(?:\(?([A-D])[\)\.]|\[([A-D])\])/i);
    if (firstOptionIndex !== -1) {
      text = text.substring(0, firstOptionIndex).trim();
    }
  } else {
    // Try Pattern 2: (1)/(2)/(3)/(4) or 1)/2)/3)/4)
    const optionRegexNumbers = /(?:^|\n|\s{2,}|\t)(?:\(?([1-4])[\)\.]|\[([1-4])\])\s*([\s\S]*?)(?=(?:(?:\(?([1-4])[\)\.]|\[([1-4])\])|\n\s*(?:Ans|Solution|Shortcut)|$))/gi;
    const numberMatches = [...text.matchAll(optionRegexNumbers)];

    if (numberMatches.length >= 4) {
      hasRealOptions = true;
      const numToLetter: Record<string, 'A' | 'B' | 'C' | 'D'> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
      numberMatches.forEach((m) => {
        const numKey = m[1] || m[2];
        const letterKey = numToLetter[numKey];
        if (letterKey) {
          optionsMap[letterKey] = m[3].trim();
        }
      });

      const firstOptionIndex = text.search(/(?:^|\n|\s{2,}|\t)(?:\(?([1-4])[\)\.]|\[([1-4])\])/);
      if (firstOptionIndex !== -1) {
        text = text.substring(0, firstOptionIndex).trim();
      }
    }
  }

  // 6. Determine Question Type
  // If no options are present or if the statement ends with "is equal to _" / numerical blank
  const isNumerical =
    !hasRealOptions ||
    Boolean(numericalAnswer) ||
    /is\s*equal\s*to\s*(?:_|\:|\.+|$)/i.test(text) ||
    /find\s+the\s+value\s+of\s*$/i.test(text) ||
    /integer\s*answer/i.test(text);

  const finalType: 'SINGLE_CORRECT' | 'NUMERICAL' = isNumerical && !hasRealOptions ? 'NUMERICAL' : 'SINGLE_CORRECT';

  const finalOptions: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = hasRealOptions
    ? [
        { key: 'A', text: optionsMap.A },
        { key: 'B', text: optionsMap.B },
        { key: 'C', text: optionsMap.C },
        { key: 'D', text: optionsMap.D }
      ]
    : [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' }
      ];

  return {
    statement: text.trim(),
    options: finalOptions,
    type: finalType,
    correctKey,
    numericalAnswer: numericalAnswer || undefined,
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

