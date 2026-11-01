import type { ProblemQuestionItem } from '../components/admin/DppPyq/DppPyqManagementWorkspace';

/**
 * Normalizes math and LaTeX typography in copied/pasted text:
 * - Converts \(...\) to $...$ and \[...\] to $$...$$
 * - Normalizes smart quotes and unicode minus
 * - Normalizes double backslashes
 * - Preserves fractions, exponents, Greek symbols, and matrices
 */
export function normalizeMathText(raw: string): string {
  if (!raw) return '';
  return raw
    // Normalize curly quotes & apostrophes
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    // Normalize unicode minus to standard hyphen-minus
    .replace(/\u2212/g, '-')
    // Normalize double backslashes (e.g. \\frac -> \frac)
    .replace(/\\\\([a-zA-Z]+)/g, '\\$1')
    // Normalize alternate LaTeX delimiters safely with callbacks
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, p1) => `$$${p1}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, p1) => `$${p1}$`)
    .trim();
}

/**
 * Universal Bulk Question Parser
 * Supports:
 * 1. JSON Array of questions
 * 2. CSV / TSV with headers or standard column order
 * 3. Plain Text question banks (Q1. ... (A) ... (B) ... (C) ... (D) ... Ans: A)
 * 4. NTA / JEE numbered option styles: (1), (2), (3), (4)
 */
export function parseBulkQuestions(
  rawInput: string,
  defaultTopic: string = 'General',
  defaultYear?: string
): { questions: ProblemQuestionItem[]; errors: string[] } {
  const text = (rawInput || '').trim();

  if (!text) {
    return { questions: [], errors: ['No text provided to parse.'] };
  }

  // 1. Try JSON Array parsing
  if (text.startsWith('[') || text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const validQuestions: ProblemQuestionItem[] = items.map((item, idx) => {
        const qNum = typeof item.qNum === 'number' ? item.qNum : idx + 1;
        const statement = normalizeMathText(item.statement || item.question || item.title || `Question ${qNum}`);
        const topic = item.topic || defaultTopic;

        const validKeys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
        let options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = [
          { key: 'A', text: 'Option A' },
          { key: 'B', text: 'Option B' },
          { key: 'C', text: 'Option C' },
          { key: 'D', text: 'Option D' }
        ];

        if (Array.isArray(item.options) && item.options.length > 0) {
          options = item.options.map((opt: any, oIdx: number) => {
            const rawKey = typeof opt === 'object' && opt?.key ? String(opt.key).trim().toUpperCase() : '';
            const key: 'A' | 'B' | 'C' | 'D' = validKeys.includes(rawKey as any)
              ? (rawKey as 'A' | 'B' | 'C' | 'D')
              : validKeys[oIdx] || 'A';
            const optText = typeof opt === 'string' ? opt : opt.text || `Option ${oIdx + 1}`;
            return {
              key,
              text: normalizeMathText(optText)
            };
          });
        } else if (item.optionA || item.A) {
          options = [
            { key: 'A', text: normalizeMathText(item.optionA || item.A || '') },
            { key: 'B', text: normalizeMathText(item.optionB || item.B || '') },
            { key: 'C', text: normalizeMathText(item.optionC || item.C || '') },
            { key: 'D', text: normalizeMathText(item.optionD || item.D || '') }
          ];
        }

        const rawKey = String(item.correctKey || item.answer || item.correct || 'A').trim().toUpperCase();
        const correctKey = (['A', 'B', 'C', 'D'].includes(rawKey) ? rawKey : 'A') as 'A' | 'B' | 'C' | 'D';

        return {
          id: item.id || `q-bulk-${Date.now()}-${idx + 1}`,
          qNum,
          statement,
          topic,
          options,
          correctKey,
          stepSolution: normalizeMathText(item.stepSolution || item.solution || item.explanation || 'Step solution provided.'),
          dkSirShortcut: normalizeMathText(item.dkSirShortcut || item.shortcut || ''),
          difficulty: ['Easy', 'Moderate', 'Challenging'].includes(item.difficulty) ? item.difficulty : 'Moderate',
          examYear: item.examYear || defaultYear || 'JEE Main 2025',
          videoUrl: item.videoUrl || item.youtubeUrl || '',
          pdfUrl: item.pdfUrl || '',
          isFree: item.isFree !== false
        };
      });

      if (validQuestions.length > 0) {
        return { questions: validQuestions, errors: [] };
      }
    } catch {
      // Not valid JSON, proceed to CSV / Text parser
    }
  }

  // 2. Try CSV Parsing
  const csvRows = parseCSV(text);
  if (csvRows.length >= 2 && csvRows[0].length >= 5) {
    const firstRowStr = csvRows[0].join(' ').toLowerCase();
    const isHeader =
      firstRowStr.includes('question') ||
      firstRowStr.includes('statement') ||
      firstRowStr.includes('option') ||
      firstRowStr.includes('correct');

    const dataRows = isHeader ? csvRows.slice(1) : csvRows;
    const questions: ProblemQuestionItem[] = [];

    dataRows.forEach((row, idx) => {
      if (row.length < 5 || !row[0]?.trim()) return;

      const statement = normalizeMathText(row[0]?.trim() || `Question ${idx + 1}`);
      const optA = normalizeMathText(row[1]?.trim() || 'Option A');
      const optB = normalizeMathText(row[2]?.trim() || 'Option B');
      const optC = normalizeMathText(row[3]?.trim() || 'Option C');
      const optD = normalizeMathText(row[4]?.trim() || 'Option D');

      const rawAns = (row[5] || 'A').trim().toUpperCase().charAt(0);
      const correctKey = (['A', 'B', 'C', 'D'].includes(rawAns) ? rawAns : 'A') as 'A' | 'B' | 'C' | 'D';

      const stepSolution = normalizeMathText(row[6]?.trim() || 'Step-by-step solution provided.');
      const dkSirShortcut = normalizeMathText(row[7]?.trim() || '');
      const videoUrl = row[8]?.trim() || '';
      const pdfUrl = row[9]?.trim() || '';
      const topic = row[10]?.trim() || defaultTopic;
      const rawDiff = row[11]?.trim() || 'Moderate';
      const difficulty = (['Easy', 'Moderate', 'Challenging'].includes(rawDiff) ? rawDiff : 'Moderate') as any;
      const examYear = row[12]?.trim() || defaultYear || 'JEE Main 2025';
      const rawFree = row[13]?.trim()?.toLowerCase();
      const isFree = rawFree === 'false' ? false : true;

      questions.push({
        id: `q-csv-${Date.now()}-${idx + 1}`,
        qNum: idx + 1,
        statement,
        topic,
        options: [
          { key: 'A', text: optA },
          { key: 'B', text: optB },
          { key: 'C', text: optC },
          { key: 'D', text: optD }
        ],
        correctKey,
        stepSolution,
        dkSirShortcut,
        videoUrl,
        pdfUrl,
        difficulty,
        examYear,
        isFree
      });
    });

    if (questions.length > 0) {
      return { questions, errors: [] };
    }
  }

  // 3. Try Structured Text Parser with Math & Indian Examination Normalization
  const textQuestions = parseStructuredText(text, defaultTopic, defaultYear);
  if (textQuestions.length > 0) {
    return { questions: textQuestions, errors: [] };
  }

  return {
    questions: [],
    errors: [
      'Could not parse questions. Please use CSV format with at least 5 columns, standard JSON, or numbered blocks (Q1. ... (A) ... (B) ... (C) ... (D) ... Ans: A).'
    ]
  };
}

/**
 * Standard CSV line & quote parser
 */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if (char === '\t' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parses plain-text questions in various Indian entrance exam format variants.
 * Handles Math equations containing variables A, B, C, D without corrupting options.
 */
function parseStructuredText(
  text: string,
  defaultTopic: string,
  defaultYear?: string
): ProblemQuestionItem[] {
  const questions: ProblemQuestionItem[] = [];

  // Split by question markers:
  // Must be at line start, e.g. "Q1.", "Question 1:", "Problem 1.", "1. " followed by a letter or formula
  const qBlocks = text
    .split(/(?:^|\n)(?=\s*(?:Q(?:uestion)?\s*#?\s*\d+[\.\:\)]|\bProblem\s*\d+[\.\:\)]|\bQ\d+[\.\:\)]|(?:\d{1,3}[\.\)]\s+(?=[A-Z\$\\\*\#]))))/i)
    .filter((b) => b.trim().length > 0);

  // If text didn't split into multiple questions, treat whole input as 1 question block
  const blocksToProcess = qBlocks.length > 0 ? qBlocks : [text];

  blocksToProcess.forEach((rawBlock, idx) => {
    const block = rawBlock.trim();
    if (!block || block.length < 8) return;

    // Clean leading Q1. or 1.
    const cleanBlock = block.replace(/^\s*(?:Q(?:uestion)?\s*#?\s*\d+[\.\:\)]|\bProblem\s*\d+[\.\:\)]|\bQ\d+[\.\:\)]|\d{1,3}[\.\)]\s*)\s*/i, '');

    // Extract Answer / Correct Key
    const ansMatch = cleanBlock.match(/(?:Ans(?:wer)?|Correct(?:\s*(?:Key|Option))?|Option)\s*[:=\-]\s*[(]?([A-Da-d1-4])[)]?/i);
    let rawAns = ansMatch ? ansMatch[1].toUpperCase() : 'A';
    // Map NTA 1,2,3,4 to A,B,C,D
    if (rawAns === '1') rawAns = 'A';
    else if (rawAns === '2') rawAns = 'B';
    else if (rawAns === '3') rawAns = 'C';
    else if (rawAns === '4') rawAns = 'D';
    const correctKey = (['A', 'B', 'C', 'D'].includes(rawAns) ? rawAns : 'A') as 'A' | 'B' | 'C' | 'D';

    // Extract Solution
    const solMatch = cleanBlock.match(/(?:^|\n)\s*(?:Sol(?:ution)?|Expl(?:anation)?)\s*[:=\-]\s*([\s\S]+?)(?=(?:\n\s*(?:Shortcut|Trick|DK\s*Sir|Video|PDF|Topic)|$))/i);
    const stepSolution = solMatch ? normalizeMathText(solMatch[1]) : 'Step solution provided.';

    // Extract DK Sir Shortcut
    const shortcutMatch = cleanBlock.match(/(?:^|\n)\s*(?:Shortcut|Trick|DK\s*Sir)\s*[:=\-]\s*([\s\S]+?)(?=(?:\n\s*(?:Video|PDF|Topic)|$))/i);
    const dkSirShortcut = shortcutMatch ? normalizeMathText(shortcutMatch[1]) : '';

    // Extract Video & PDF
    const videoMatch = cleanBlock.match(/(?:Video(?:\s*URL)?|YouTube)\s*[:=\-]\s*(https?:\/\/[^\s\n]+)/i);
    const videoUrl = videoMatch ? videoMatch[1].trim() : '';

    const pdfMatch = cleanBlock.match(/(?:PDF(?:\s*URL)?)\s*[:=\-]\s*(https?:\/\/[^\s\n]+)/i);
    const pdfUrl = pdfMatch ? pdfMatch[1].trim() : '';

    // Separate question text from metadata (remove Sol, Shortcut, Video, PDF from body)
    let body = cleanBlock;
    const metaIndex = cleanBlock.search(/(?:^|\n)\s*(?:Ans(?:wer)?|Correct(?:\s*Key)?|Sol(?:ution)?|Expl(?:anation)?|Shortcut|DK\s*Sir|Video|PDF)\s*[:=\-]/i);
    if (metaIndex !== -1) {
      body = cleanBlock.substring(0, metaIndex).trim();
    }

    // Now extract statement and options A, B, C, D (or 1, 2, 3, 4)
    const { statement, options } = extractStatementAndOptions(body);

    questions.push({
      id: `q-text-${Date.now()}-${idx + 1}`,
      qNum: idx + 1,
      statement: normalizeMathText(statement || `Question ${idx + 1}`),
      topic: defaultTopic,
      options: options.map((opt) => ({
        key: opt.key,
        text: normalizeMathText(opt.text)
      })),
      correctKey,
      stepSolution,
      dkSirShortcut,
      videoUrl,
      pdfUrl,
      difficulty: 'Moderate',
      examYear: defaultYear || 'JEE Main 2025',
      isFree: true
    });
  });

  return questions;
}

/**
 * Robustly separates Question Statement and 4 MCQ Options.
 * Protects math equations with letters A, B, C, D from being treated as options.
 */
export function extractStatementAndOptions(text: string): {
  statement: string;
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
} {
  const defaultOptions: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = [
    { key: 'A', text: 'Option A' },
    { key: 'B', text: 'Option B' },
    { key: 'C', text: 'Option C' },
    { key: 'D', text: 'Option D' }
  ];

  if (!text) {
    return { statement: '', options: defaultOptions };
  }

  // Strategy A: Options on separate lines (standard format)
  // Look for lines beginning with (A), (B), (C), (D) or A), B), C), D) or A., B., C., D.
  // Or (1), (2), (3), (4) or 1), 2), 3), 4) or 1., 2., 3., 4.
  const linePattern = /(?:^|\n)\s*(?:\(([A-Da-d1-4])\)|\[([A-Da-d1-4])\]|([A-Da-d1-4])[).:\-])\s+/g;
  const matches: { index: number; key: string; length: number }[] = [];
  let m: RegExpExecArray | null;

  while ((m = linePattern.exec(text)) !== null) {
    const rawKey = (m[1] || m[2] || m[3]).toUpperCase();
    matches.push({
      index: m.index,
      key: rawKey,
      length: m[0].length
    });
  }

  // Check if we found sequentially distinct options (either A,B,C,D or 1,2,3,4)
  const letters = ['A', 'B', 'C', 'D'];
  const numbers = ['1', '2', '3', '4'];

  const letterMatches = matches.filter((item) => letters.includes(item.key));
  const numberMatches = matches.filter((item) => numbers.includes(item.key));

  let activeMatches = letterMatches.length >= 2 ? letterMatches : numberMatches.length >= 2 ? numberMatches : [];

  // Strategy B: If not found on line starts, try inline pattern with strict sequence (A)... (B)... (C)... (D)...
  if (activeMatches.length < 2) {
    const inlinePattern = /(?:\s+|^)(?:\(([A-Da-d1-4])\)|\[([A-Da-d1-4])\]|([A-Da-d1-4])\))\s+/g;
    const inlineMatches: { index: number; key: string; length: number }[] = [];
    let im: RegExpExecArray | null;
    while ((im = inlinePattern.exec(text)) !== null) {
      inlineMatches.push({
        index: im.index,
        key: (im[1] || im[2] || im[3]).toUpperCase(),
        length: im[0].length
      });
    }

    const inlineLetters = inlineMatches.filter((item) => letters.includes(item.key));
    const inlineNumbers = inlineMatches.filter((item) => numbers.includes(item.key));
    if (inlineLetters.length >= 2) activeMatches = inlineLetters;
    else if (inlineNumbers.length >= 2) activeMatches = inlineNumbers;
  }

  // If options were detected, slice statement and each option cleanly
  if (activeMatches.length >= 2) {
    const firstOptIndex = activeMatches[0].index;
    const statement = text.substring(0, firstOptIndex).trim();

    const optionsMap: Record<'A' | 'B' | 'C' | 'D', string> = {
      A: 'Option A',
      B: 'Option B',
      C: 'Option C',
      D: 'Option D'
    };

    activeMatches.forEach((curr, i) => {
      const next = activeMatches[i + 1];
      const start = curr.index + curr.length;
      const end = next ? next.index : text.length;
      const optBody = text.substring(start, end).trim();

      // Normalize key (1->A, 2->B, etc.)
      let optKey: 'A' | 'B' | 'C' | 'D' = 'A';
      if (curr.key === 'A' || curr.key === '1') optKey = 'A';
      else if (curr.key === 'B' || curr.key === '2') optKey = 'B';
      else if (curr.key === 'C' || curr.key === '3') optKey = 'C';
      else if (curr.key === 'D' || curr.key === '4') optKey = 'D';

      if (optBody) {
        optionsMap[optKey] = optBody;
      }
    });

    return {
      statement: statement || 'Question',
      options: [
        { key: 'A', text: optionsMap.A },
        { key: 'B', text: optionsMap.B },
        { key: 'C', text: optionsMap.C },
        { key: 'D', text: optionsMap.D }
      ]
    };
  }

  // Fallback: No options detected, entire text is statement
  return {
    statement: text.trim(),
    options: defaultOptions
  };
}

/**
 * Generates and triggers download of the standard Questions CSV Template
 */
export function downloadQuestionsTemplateCsv(): void {
  const headers = [
    'Question Statement',
    'Option A',
    'Option B',
    'Option C',
    'Option D',
    'Correct Key (A/B/C/D)',
    'Step Solution',
    'DK Sir Kota Shortcut',
    'Video Solution URL',
    'PDF Solution URL',
    'Topic',
    'Difficulty (Easy/Moderate/Challenging)',
    'Exam Year',
    'Is Free Preview (TRUE/FALSE)'
  ];

  const sampleRows = [
    [
      '"If the vectors a = 2i - j + k, b = i + 2j - 3k, and c = 3i + pj + 5k are coplanar, then the scalar parameter p equals:"',
      '"-4"',
      '"2"',
      '"0"',
      '"6"',
      '"A"',
      '"For coplanar vectors, the scalar triple product [a b c] = 0. Expanding determinant gives 7p + 28 = 0 => p = -4."',
      '"DK Sir 20s Inspection Shortcut: Substitute p = -4 into row 3; rows 1 and 2 linearly sum to give zero determinant."',
      '"https://www.youtube.com/watch?v=dQw4w9WgXcQ"',
      '"https://example.com/vectors-notes.pdf"',
      '"Vectors & 3D Geometry"',
      '"Moderate"',
      '"JEE Main 2025"',
      '"TRUE"'
    ],
    [
      '"The value of the definite integral \\int_{0}^{\\pi/2} \\frac{\\sin^3 x}{\\sin^3 x + \\cos^3 x} dx is:"',
      '"\\pi/4"',
      '"\\pi/2"',
      '"0"',
      '"1"',
      '"A"',
      '"By applying Kings property \\int f(a+b-x)dx, 2I = \\int 1 dx from 0 to \\pi/2 => 2I = \\pi/2 => I = \\pi/4."',
      '"DK Sir Symmetry Rule: Any integral of the form sin^n x / (sin^n x + cos^n x) on [0, pi/2] is always (b-a)/2 = pi/4."',
      '"https://www.youtube.com/watch?v=dQw4w9WgXcQ"',
      '"https://example.com/integral-notes.pdf"',
      '"Definite Integrals"',
      '"Easy"',
      '"JEE Advanced 2024"',
      '"FALSE"'
    ],
    [
      '"The locus of a point whose distance from the origin is twice its distance from the y-axis is:"',
      '"x^2 + y^2 = 4x^2"',
      '"3x^2 - y^2 = 0"',
      '"x^2 - 3y^2 = 0"',
      '"y^2 - 4x^2 = 0"',
      '"B"',
      '"Given \\sqrt{x^2 + y^2} = 2|x|. Squaring both sides yields x^2 + y^2 = 4x^2 => 3x^2 - y^2 = 0."',
      '"DK Sir Coordinate Rule: Direct algebraic distance definition."',
      '""',
      '""',
      '"Straight Lines & Locus"',
      '"Moderate"',
      '"JEE Main 2023"',
      '"TRUE"'
    ]
  ];

  const csvContent = [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'dk_academy_pyq_bulk_questions_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
