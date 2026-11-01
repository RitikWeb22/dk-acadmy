import type { ProblemQuestionItem } from '../components/admin/DppPyq/DppPyqManagementWorkspace';

/**
 * Universal Bulk Question Parser
 * Supports:
 * 1. JSON Array of questions
 * 2. CSV / TSV with headers or standard column order
 * 3. Plain Text question banks (Q1. ... A) ... B) ... Ans: A)
 */
export function parseBulkQuestions(
  rawInput: string,
  defaultTopic: string = 'General',
  defaultYear?: string
): { questions: ProblemQuestionItem[]; errors: string[] } {
  const errors: string[] = [];
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
        const statement = item.statement || item.question || item.title || `Question ${qNum}`;
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
            return {
              key,
              text: typeof opt === 'string' ? opt : opt.text || `Option ${oIdx + 1}`
            };
          });
        } else if (item.optionA || item.A) {
          options = [
            { key: 'A', text: item.optionA || item.A || '' },
            { key: 'B', text: item.optionB || item.B || '' },
            { key: 'C', text: item.optionC || item.C || '' },
            { key: 'D', text: item.optionD || item.D || '' }
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
          stepSolution: item.stepSolution || item.solution || item.explanation || 'Step solution provided.',
          dkSirShortcut: item.dkSirShortcut || item.shortcut || '',
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
    // Check if first row is header
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

      const statement = row[0]?.trim() || `Question ${idx + 1}`;
      const optA = row[1]?.trim() || 'Option A';
      const optB = row[2]?.trim() || 'Option B';
      const optC = row[3]?.trim() || 'Option C';
      const optD = row[4]?.trim() || 'Option D';
      
      const rawAns = (row[5] || 'A').trim().toUpperCase().charAt(0);
      const correctKey = (['A', 'B', 'C', 'D'].includes(rawAns) ? rawAns : 'A') as 'A' | 'B' | 'C' | 'D';
      
      const stepSolution = row[6]?.trim() || 'Step-by-step solution provided.';
      const dkSirShortcut = row[7]?.trim() || '';
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

  // 3. Try Structured Text Parser (e.g. Q1. ... A) ... B) ... Ans: A)
  const textQuestions = parseStructuredText(text, defaultTopic, defaultYear);
  if (textQuestions.length > 0) {
    return { questions: textQuestions, errors: [] };
  }

  return {
    questions: [],
    errors: [
      'Could not parse questions. Please use CSV format with at least 5 columns, standard JSON, or numbered blocks (Q1. ... A) ... B) ... Ans: A).'
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
      // Tab separated support
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
 * Parse plain-text questions in various Indian entrance exam format variants
 */
function parseStructuredText(
  text: string,
  defaultTopic: string,
  defaultYear?: string
): ProblemQuestionItem[] {
  const questions: ProblemQuestionItem[] = [];

  // Split by Question markers (e.g. Q1., Q 2., 1., Question 1:)
  const qBlocks = text.split(/(?:^|\n)(?=(?:Q(?:uestion)?\s*\d+[\.\:\)]|\d+[\.\)]\s+))/i);

  qBlocks.forEach((rawBlock, idx) => {
    const block = rawBlock.trim();
    if (!block || block.length < 10) return;

    // Clean leading Q1. or 1.
    const cleanBlock = block.replace(/^(?:Q(?:uestion)?\s*\d+[\.\:\)]|\d+[\.\)])\s*/i, '');

    // Extract options: A) ... B) ... C) ... D) or (A) ... (B) ...
    const optAMatch = cleanBlock.match(/(?:^|\n|\s)[(]?A[).:\-]\s*([\s\S]+?)(?=(?:[(]?[B-D][).:\-]|Ans(?:wer)?|Correct|Sol(?:ution)?|$))/i);
    const optBMatch = cleanBlock.match(/(?:^|\n|\s)[(]?B[).:\-]\s*([\s\S]+?)(?=(?:[(]?[C-D][).:\-]|Ans(?:wer)?|Correct|Sol(?:ution)?|$))/i);
    const optCMatch = cleanBlock.match(/(?:^|\n|\s)[(]?C[).:\-]\s*([\s\S]+?)(?=(?:[(]?D[).:\-]|Ans(?:wer)?|Correct|Sol(?:ution)?|$))/i);
    const optDMatch = cleanBlock.match(/(?:^|\n|\s)[(]?D[).:\-]\s*([\s\S]+?)(?=(?:Ans(?:wer)?|Correct|Sol(?:ution)?|Shortcut|Video|PDF|$))/i);

    // Extract Answer / Correct Key
    const ansMatch = cleanBlock.match(/(?:Ans(?:wer)?|Correct(?:\s*Key)?|Option)\s*[:=\-]\s*[(]?([A-Da-d])[)]?/i);
    const rawKey = ansMatch ? ansMatch[1].toUpperCase() : 'A';
    const correctKey = (['A', 'B', 'C', 'D'].includes(rawKey) ? rawKey : 'A') as 'A' | 'B' | 'C' | 'D';

    // Extract Solution
    const solMatch = cleanBlock.match(/(?:Sol(?:ution)?|Expl(?:anation)?)\s*[:=\-]\s*([\s\S]+?)(?=(?:Shortcut|Video|PDF|Topic|$))/i);
    const stepSolution = solMatch ? solMatch[1].trim() : 'Step solution provided.';

    // Extract DK Sir Shortcut
    const shortcutMatch = cleanBlock.match(/(?:Shortcut|Trick|DK\s*Sir)\s*[:=\-]\s*([^\n]+)/i);
    const dkSirShortcut = shortcutMatch ? shortcutMatch[1].trim() : '';

    // Extract Video & PDF
    const videoMatch = cleanBlock.match(/(?:Video(?:\s*URL)?|YouTube)\s*[:=\-]\s*(https?:\/\/[^\s\n]+)/i);
    const videoUrl = videoMatch ? videoMatch[1].trim() : '';

    const pdfMatch = cleanBlock.match(/(?:PDF(?:\s*URL)?)\s*[:=\-]\s*(https?:\/\/[^\s\n]+)/i);
    const pdfUrl = pdfMatch ? pdfMatch[1].trim() : '';

    // Extract Statement (everything before Option A or before options)
    let statement = cleanBlock;
    const firstOptIndex = cleanBlock.search(/(?:^|\n|\s)[(]?A[).:\-]/i);
    if (firstOptIndex !== -1) {
      statement = cleanBlock.substring(0, firstOptIndex).trim();
    } else {
      statement = cleanBlock.split('\n')[0].trim();
    }

    if (!statement) {
      statement = `Question ${idx + 1}`;
    }

    const optA = optAMatch ? optAMatch[1].trim() : 'Option A';
    const optB = optBMatch ? optBMatch[1].trim() : 'Option B';
    const optC = optCMatch ? optCMatch[1].trim() : 'Option C';
    const optD = optDMatch ? optDMatch[1].trim() : 'Option D';

    questions.push({
      id: `q-text-${Date.now()}-${idx + 1}`,
      qNum: idx + 1,
      statement,
      topic: defaultTopic,
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
      difficulty: 'Moderate',
      examYear: defaultYear || 'JEE Main 2025',
      isFree: true
    });
  });

  return questions;
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
      '"The value of the definite integral from 0 to pi/2 of (sin^3 x)/(sin^3 x + cos^3 x) dx is:"',
      '"pi/4"',
      '"pi/2"',
      '"0"',
      '"1"',
      '"A"',
      '"By applying Kings property integral f(a+b-x)dx, 2I = integral 1 dx from 0 to pi/2 => 2I = pi/2 => I = pi/4."',
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
      '"Given sqrt(x^2 + y^2) = 2|x|. Squaring both sides yields x^2 + y^2 = 4x^2 => 3x^2 - y^2 = 0."',
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

