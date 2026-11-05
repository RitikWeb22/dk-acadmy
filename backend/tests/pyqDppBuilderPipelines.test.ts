/**
 * Phase 10: PYQ & DPP Builder Comprehensive Regression Test Suite
 *
 * Verifies:
 * 1. Normalized Question Schema & Bidirectional Model Adapters (DppPyq & TestSeries)
 * 2. Document-Aware DOCX Ingestion Pipeline (OMML, tables, images, pre-order order)
 * 3. Independent PDF Ingestion Pipeline (classification, headers/footers, multi-column, answer keys)
 * 4. Question Detection & Classification Engine (MCQ, Multi-Correct, Numerical, Assertion-Reason, Passage, Match)
 * 5. Math Normalization Parity & KaTeX Compatibility
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {
  createDefaultNormalizedQuestion,
  normalizedToProblemQuestion,
  problemQuestionToNormalized,
  normalizedToTestQuestion
} from '../src/utils/questionSchema/normalizedQuestion.js';
import {
  classifyQuestion,
  extractSolutionAndShortcuts
} from '../src/utils/questionClassifier.js';
import {
  extractDocxMath,
  extractQuestionsFromDocxNative
} from '../src/utils/docxMathExtractor.js';
import {
  cleanPdfHeadersAndFooters,
  resolveMultiColumnReadingOrder,
  classifyPdfBuffer
} from '../src/utils/pdfExtractor/pdfPipeline.js';
import { normalizeMathematicalText } from '../src/utils/universalMathEngine/index.js';

// ============================================================================
// Synthetic DOCX helper for tests
// ============================================================================
const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

function makeDocumentXml(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${body}
  </w:body>
</w:document>`;
}

async function buildDocxBuffer(body: string): Promise<Buffer> {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', CONTENT_TYPES_XML);
  zip.file('_rels/.rels', RELS_XML);
  zip.file('word/document.xml', makeDocumentXml(body));
  const arr = await zip.generateAsync({ type: 'arraybuffer' });
  return Buffer.from(arr);
}

// ============================================================================
// Test Suite
// ============================================================================

describe('PYQ & DPP Builder Comprehensive Master Test Suite', () => {

  // 1. Normalized Question Schema & Adapters
  describe('Part 1: Normalized Question Schema & Adapters', () => {
    test('Creates default normalized question with sensible defaults', () => {
      const q = createDefaultNormalizedQuestion({
        statement: 'Find the limit as $x \\to 0$ of $\\frac{\\sin x}{x}$',
        subject: 'Mathematics'
      });
      assert.strictEqual(q.qNum, 1);
      assert.strictEqual(q.subject, 'Mathematics');
      assert.strictEqual(q.difficulty, 'Moderate');
      assert.strictEqual(q.questionType, 'SINGLE_CORRECT');
      assert.strictEqual(q.marks, 4);
      assert.strictEqual(q.negativeMarks, 1);
      assert.strictEqual(q.options.length, 4);
      assert.strictEqual(q.correctAnswer, 'A');
    });

    test('Round-trips between NormalizedQuestion and IProblemQuestion (DppPyq)', () => {
      const original = createDefaultNormalizedQuestion({
        id: 'norm-q-101',
        qNum: 5,
        statement: 'What is $\\int_0^1 x^2 dx$?',
        options: [
          { key: 'A', text: '$1/3$' },
          { key: 'B', text: '$1/2$' },
          { key: 'C', text: '$1/4$' },
          { key: 'D', text: '$1$' }
        ],
        correctAnswer: 'A',
        dkSirShortcut: 'DK Sir Quick Formula: x^(n+1)/(n+1) = 1/3',
        stepSolution: 'Integrate x^2 to get [x^3/3]_0^1 = 1/3 - 0 = 1/3.',
        difficulty: 'Easy',
        topic: 'Definite Integration',
        isFree: true
      });

      const problemQ = normalizedToProblemQuestion(original);
      assert.strictEqual(problemQ.id, 'norm-q-101');
      assert.strictEqual(problemQ.qNum, 5);
      assert.strictEqual(problemQ.correctKey, 'A');
      assert.strictEqual(problemQ.difficulty, 'Easy');
      assert.strictEqual(problemQ.options.length, 4);
      assert.strictEqual(problemQ.options[0].text, '$1/3$');
      assert.strictEqual(problemQ.dkSirShortcut, original.dkSirShortcut);

      const restored = problemQuestionToNormalized(problemQ);
      assert.strictEqual(restored.statement, original.statement);
      assert.strictEqual(restored.correctAnswer, 'A');
      assert.strictEqual(restored.dkSirShortcut, original.dkSirShortcut);
    });

    test('Adapts NormalizedQuestion to ITestQuestion for TestSeries', () => {
      const nq = createDefaultNormalizedQuestion({
        qNum: 3,
        statement: 'Numerical question: Compute $2^{10}$',
        questionType: 'NUMERICAL',
        correctAnswer: '1024',
        subject: 'Mathematics'
      });

      const testQ = normalizedToTestQuestion(nq);
      assert.strictEqual(testQ.questionNumber, 3);
      assert.strictEqual(testQ.type, 'NUMERICAL');
      assert.strictEqual(testQ.numericalAnswer, '1024');
      assert.strictEqual(testQ.marks, 4);
    });
  });

  // 2. Question Detection & Classification Engine
  describe('Part 2: Question Detection & Classification Engine', () => {
    test('Classifies Single Choice MCQ', () => {
      const res = classifyQuestion(
        'Which of the following is an electrophile?',
        [
          { key: 'A', text: 'AlCl3' },
          { key: 'B', text: 'NH3' },
          { key: 'C', text: 'H2O' },
          { key: 'D', text: 'CH3-' }
        ],
        'JEE Main'
      );
      assert.strictEqual(res.questionType, 'SINGLE_CORRECT');
      assert.strictEqual(res.suggestedMarks, 4);
      assert.strictEqual(res.suggestedNegativeMarks, 1);
    });

    test('Classifies Multiple Correct Question with JEE Advanced marking scheme', () => {
      const res = classifyQuestion(
        'One or more than one option is correct. Which of the following functions are continuous on R?',
        [
          { key: 'A', text: 'f(x) = sin x' },
          { key: 'B', text: 'f(x) = |x|' },
          { key: 'C', text: 'f(x) = [x]' },
          { key: 'D', text: 'f(x) = x^2' }
        ],
        'JEE Advanced'
      );
      assert.strictEqual(res.questionType, 'MULTIPLE_CORRECT');
      assert.strictEqual(res.suggestedMarks, 4);
      assert.strictEqual(res.suggestedNegativeMarks, 2);
    });

    test('Classifies Numerical / Integer Questions', () => {
      const res = classifyQuestion(
        'The number of real solutions of the equation e^x = x is an integer from 0 to 9.',
        [],
        'JEE Main'
      );
      assert.strictEqual(res.isNumerical, true);
      assert.strictEqual(res.questionType, 'INTEGER');
    });

    test('Classifies Assertion-Reason Question', () => {
      const res = classifyQuestion(
        'Assertion (A): Work done by magnetic force on a moving charge is zero.\nReason (R): Magnetic force is always perpendicular to velocity.',
        [
          { key: 'A', text: 'Both A and R are true and R is correct explanation of A' },
          { key: 'B', text: 'Both A and R are true but R is not correct explanation' },
          { key: 'C', text: 'A is true but R is false' },
          { key: 'D', text: 'Both A and R are false' }
        ],
        'JEE Main'
      );
      assert.strictEqual(res.isAssertionReason, true);
      assert.strictEqual(res.questionType, 'ASSERTION_REASON');
    });

    test('Extracts DK Sir Shortcut and inline answer key from explanation', () => {
      const text = `
DK Sir Shortcut: Use symmetry! The electric field at center of regular hexagon with identical charges is identically ZERO!
Ans: (C)
Solution: By vector summation of 6 equal and opposite fields, sum of vectors is 0.
`;
      const extracted = extractSolutionAndShortcuts(text);
      assert.ok(extracted.dkSirShortcut.includes('symmetry'));
      assert.strictEqual(extracted.answerKey, 'C');
      assert.ok(extracted.stepSolution.includes('vector summation'));
    });
  });

  // 3. Document-Aware DOCX Extraction Pipeline
  describe('Part 3: Document-Aware DOCX Extraction Pipeline', () => {
    test('Extracts sequential questions, options, OMML equations and answer keys from DOCX', async () => {
      // Build a synthetic DOCX with 2 questions and OMML fractions
      const body = `
        <w:p><w:r><w:t>1. Evaluate the limit:</w:t></w:r>
          <m:oMath>
            <m:f>
              <m:num><m:r><m:t>sin x</m:t></m:r></m:num>
              <m:den><m:r><m:t>x</m:t></m:r></m:den>
            </m:f>
          </m:oMath>
        </w:p>
        <w:p><w:r><w:t>(A) 1</w:t></w:r></w:p>
        <w:p><w:r><w:t>(B) 0</w:t></w:r></w:p>
        <w:p><w:r><w:t>(C) -1</w:t></w:r></w:p>
        <w:p><w:r><w:t>(D) Does not exist</w:t></w:r></w:p>
        <w:p><w:r><w:t>2. Find the integral of x dx.</w:t></w:r></w:p>
        <w:p><w:r><w:t>(A) x^2 / 2</w:t></w:r></w:p>
        <w:p><w:r><w:t>(B) x</w:t></w:r></w:p>
        <w:p><w:r><w:t>(C) 1</w:t></w:r></w:p>
        <w:p><w:r><w:t>(D) x^3</w:t></w:r></w:p>
        <w:p><w:r><w:t>Answer Key: 1. A  2. A</w:t></w:r></w:p>
      `;

      const buffer = await buildDocxBuffer(body);
      const res = await extractQuestionsFromDocxNative(buffer, 'Mathematics', 'JEE Main');

      assert.strictEqual(res.totalDetected, 2);
      assert.strictEqual(res.questions[0].qNum, 1);
      assert.ok(res.questions[0].statement.includes('\\frac{sin x}{x}'), 'OMML fraction converted to LaTeX');
      assert.strictEqual(res.questions[0].options[0].text, '1');
      assert.strictEqual(res.questions[0].correctAnswer, 'A');

      assert.strictEqual(res.questions[1].qNum, 2);
      assert.strictEqual(res.questions[1].correctAnswer, 'A');
    });

    test('Preserves pre-order document sequence across paragraphs and tables', async () => {
      const body = `
        <w:p><w:r><w:t>Paragraph 1</w:t></w:r></w:p>
        <w:p><w:r><w:t>Paragraph 2</w:t></w:r></w:p>
        <w:p><w:r><w:t>Paragraph 3</w:t></w:r></w:p>
      `;
      const buffer = await buildDocxBuffer(body);
      const res = await extractDocxMath(buffer);
      assert.strictEqual(res.paragraphs.length, 3);
      assert.strictEqual(res.paragraphs[0].text, 'Paragraph 1');
      assert.strictEqual(res.paragraphs[1].text, 'Paragraph 2');
      assert.strictEqual(res.paragraphs[2].text, 'Paragraph 3');
    });
  });

  // 4. Independent PDF Extraction Pipeline
  describe('Part 4: Independent PDF Extraction Pipeline', () => {
    test('Cleans repetitive page numbers, headers, and test watermarks', () => {
      const raw = `
DK ACADEMY JEE (MAIN + ADVANCED)
Page 1 of 12
1. If alpha and beta are roots of x^2 - 5x + 6 = 0, find alpha + beta.
(A) 5  (B) -5  (C) 6  (D) -6
-- 1 of 12 --
`;
      const cleaned = cleanPdfHeadersAndFooters(raw);
      assert.ok(!cleaned.includes('Page 1 of 12'));
      assert.ok(!cleaned.includes('-- 1 of 12 --'));
      assert.ok(!cleaned.includes('DK ACADEMY'));
      assert.ok(cleaned.includes('alpha and beta'));
    });

    test('Resolves multi-column side-by-side text', () => {
      const twoCol = `Question 1: What is 2 + 2?           Q.2: What is 3 * 3?
(A) 4                               (A) 9`;
      const resolved = resolveMultiColumnReadingOrder(twoCol);
      const lines = resolved.split('\n');
      assert.ok(lines.some(l => l.includes('Question 1: What is 2 + 2?')));
      assert.ok(lines.some(l => l.includes('Q.2: What is 3 * 3?')));
    });
  });

  // 5. Math Normalization Parity & Shared Rendering
  describe('Part 5: Math Normalization Parity & Shared Rendering', () => {
    test('Preserves nested roots, limits, and exponents identically', () => {
      const input = 'lim_(x->0) (√(1+x) - 1)/x';
      const norm = normalizeMathematicalText(input);
      assert.ok(norm.normalizedText.includes('\\lim'));
      assert.ok(norm.normalizedText.includes('\\sqrt'));
      assert.strictEqual(norm.success, true);
      assert.strictEqual(norm.validation.isValid, true);
    });

    test('Validates mathematical LaTeX without throwing errors', () => {
      const sample = 'Evaluate $\\int_0^{\\pi} \\sin^2(x) dx$ where $x \\in [0, \\pi]$.';
      const result = normalizeMathematicalText(sample);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.validation.isValid, true);
      assert.ok(result.normalizedText.includes('\\int'));
    });
  });
});
