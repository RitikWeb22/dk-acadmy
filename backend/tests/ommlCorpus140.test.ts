import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { parseMarkupToDoc } from '../src/utils/universalMathEngine/domAdapter.js';
import { ommlNodeToLatex } from '../src/utils/universalMathEngine/ommlMathMLConverter.js';
import { parseWordQuestions, preformatDocxOptions } from '../../frontend/src/utils/wordPasteParser';
import { normalizeMathString, normalizeOptionMath } from '../../frontend/src/utils/mathImportRenderSystem/pasteHandler';
import { normalizeCanonicalMath } from '../src/services/mathImport/mathNormalizer.js';

const require = createRequire(import.meta.url);
const katex = require('katex');

const corpusPath = path.resolve('C:/Users/krish/.gemini/antigravity/brain/5b875c6e-d22c-4eeb-a9a5-0bedee403066/.user_uploaded/media_1794776017961_d112eff7.json');
const corpusData = fs.existsSync(corpusPath)
  ? JSON.parse(fs.readFileSync(corpusPath, 'utf8'))
  : { cases: [], questions: [] };

describe('Part A: 140 OMML Equation Corpus Validation (E001 - E140)', () => {
  it('loads all 140 OMML test cases', () => {
    assert.strictEqual(corpusData.cases.length, 140, 'Should load 140 test cases from corpus.json');
  });

  for (const c of corpusData.cases) {
    it(`[${c.id}] ${c.title} (${c.category}) converts and renders in KaTeX`, () => {
      const doc = parseMarkupToDoc(c.omml, 'xml');
      assert.ok(doc, `XML document must parse for ${c.id}`);
      const root = doc.documentElement || doc;
      const rawLatex = ommlNodeToLatex(root);
      const converted = rawLatex.replace(/\s+/g, ' ').trim();
      assert.ok(converted.length > 0, `Converted LaTeX must not be empty for ${c.id}`);

      // Verify KaTeX renders without throw
      let renderOk = false;
      try {
        katex.renderToString(converted, { throwOnError: true, strict: false });
        renderOk = true;
      } catch (err: any) {
        assert.fail(`KaTeX failed on [${c.id}] "${converted}": ${err.message}`);
      }
      assert.ok(renderOk, `KaTeX should render ${c.id}`);
    });
  }
});

describe('Part B: 12 JEE Question Corpus Ingestion (Q1 - Q12)', () => {
  for (const q of corpusData.questions) {
    it(`Ingests Question [${q.id}] statement, options A-D, and key without loss`, () => {
      let pasteText = q.statement;
      if (q.options && q.options.length > 0) {
        pasteText += '\n' + q.options.map((opt: any) => `${opt.key} ${opt.text}`).join('\n');
      }
      if (q.correctKey) {
        pasteText += `\nAns: ${q.correctKey}`;
      }

      const parsedList = parseWordQuestions(pasteText);
      assert.strictEqual(parsedList.length, 1, `Should extract exactly 1 question for ${q.id}`);
      const parsed = parsedList[0];

      // Verify statement
      assert.ok(parsed.statement.length > 0, `Statement must not be empty for ${q.id}`);

      // Verify all 4 options
      assert.strictEqual(parsed.options.length, 4, `Must extract 4 options for ${q.id}`);
      assert.deepStrictEqual(
        parsed.options.map(o => o.key),
        ['A', 'B', 'C', 'D'],
        `Option keys must be A, B, C, D for ${q.id}`
      );

      // Verify correct key
      if (q.correctKey) {
        assert.strictEqual(parsed.correctKey, q.correctKey, `Correct key must match for ${q.id}`);
      }

      // Verify all options and statement render cleanly in KaTeX
      const testMathInString = (text: string, label: string) => {
        const matches = text.match(/\$([^$]+)\$/g);
        if (matches) {
          for (const m of matches) {
            const inner = m.slice(1, -1);
            try {
              katex.renderToString(inner, { throwOnError: true, strict: false });
            } catch (err: any) {
              assert.fail(`${label} KaTeX parse error in [${inner}]: ${err.message}`);
            }
          }
        }
      };

      testMathInString(parsed.statement, `${q.id} statement`);
      parsed.options.forEach(o => testMathInString(o.text, `${q.id} option ${o.key}`));
    });
  }
});

describe('Part C: Question and Option Boundary Invariants (User Requirement 9)', () => {
  it('identifies standard enclosed letter options (A), (B), (C), (D)', () => {
    const raw = `Let f(x) = 2x + 1. Find f(2).
(A) 5
(B) 4
(C) 3
(D) 2
Ans: A`;
    const res = parseWordQuestions(raw);
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res[0].correctKey, 'A');
    assert.strictEqual(res[0].options[0].text, '5');
  });

  it('identifies bare letter options A, B, C, D on separate lines', () => {
    const raw = `The value of integral is
A 10
B 20
C 30
D 40
Ans: B`;
    const res = parseWordQuestions(raw);
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res[0].correctKey, 'B');
    assert.strictEqual(res[0].options[1].text, '20');
  });

  it('identifies numbered options (1), (2), (3), (4) mapped to A, B, C, D', () => {
    const raw = `Evaluate the limit
(1) 0
(2) 1
(3) 2
(4) \\infty
Ans: (2)`;
    const res = parseWordQuestions(raw);
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res[0].correctKey, 'B');
    assert.strictEqual(res[0].options[0].text, '0');
    assert.strictEqual(res[0].options[1].text, '1');
  });

  it('identifies exam name, year, and shift metadata cleanly', () => {
    const raw = `JEE Main 2023 (Online) 1st February Morning Shift
27. Let f(x)=2x + tan^(-1) x and g(x)=\\log_e (\\sqrt{1 + x^2}+x), x \\in [0,3]. Then
A there exists x ^\\in [0,3] such that f'(x )<g'(x )
B there exist 0<x_1<x_2<3 such that f(x)<g(x),\\forall \\in (x_1,x_2 )
C minf'(x)=1 + maxg'(x)
D maxf(x)>maxg(x)
Ans: A`;
    const res = parseWordQuestions(raw);
    assert.strictEqual(res.length, 1);
    assert.ok(res[0].examTag?.includes('JEE Main 2023'), 'Must extract JEE Main 2023 exam tag');
    assert.ok(res[0].statement.includes('f(x)=2x + \\tan^{-1}(x)'), 'Statement must have normalized tan^-1');
    assert.strictEqual(res[0].options.length, 4);
    assert.strictEqual(res[0].correctKey, 'A');

    // Verify option A converts hat accent artifact cleanly
    assert.ok(res[0].options[0].text.includes('\\hat{x}'), 'Option A must convert x ^\\in to \\hat{x} \\in');
    assert.ok(!res[0].options[0].text.includes('^\\in'), 'Option A must not have invalid ^\\in');

    // Verify option C and D normalize min/max
    assert.ok(res[0].options[2].text.includes('\\min') && res[0].options[2].text.includes('\\max'), 'Option C must normalize \\min and \\max');
    assert.ok(res[0].options[3].text.includes('\\max'), 'Option D must normalize \\max');
  });

  it('never splits probability notation P(A) or P(B) into option labels', () => {
    const raw = `If P(A)=1/2 and P(B)=1/3 with A, B independent, then P(A ∩ B) is
A 1/6
B 5/6
C 1/5
D 2/3
Ans: A`;
    const res = parseWordQuestions(raw);
    assert.strictEqual(res.length, 1);
    assert.ok(res[0].statement.includes('P(A)'), 'Statement must preserve P(A)');
    assert.ok(res[0].statement.includes('P(B)'), 'Statement must preserve P(B)');
    assert.ok(!res[0].statement.includes('P\n(A)'), 'Statement must not split P(A) onto newline');
    assert.strictEqual(res[0].options[0].key, 'A');
    assert.ok(res[0].options[0].text.includes('1/6') || res[0].options[0].text.includes('\\dfrac{1}{6}'));
  });

  it('preserves multi-statement questions with relation statements (I) and (II)', () => {
    const raw = `Consider the relation R on the set {-2, -1, 0, 1, 2} defined by (a, b) \\in R if and only if 1 + ab > 0
Then, among the statements :
(I) The number of elements in R is 17
(II) R is an equivalence relation
A Only I is true
B Only II is true
C Both I and II are true
D Neither I nor II is true
Ans: A`;
    const res = parseWordQuestions(raw);
    assert.strictEqual(res.length, 1);
    assert.ok(res[0].statement.includes('(I)'), 'Statement must preserve statement (I)');
    assert.ok(res[0].statement.includes('(II)'), 'Statement must preserve statement (II)');
    assert.ok(res[0].statement.includes('\\{-2, -1, 0, 1, 2\\}'), 'Must format set braces');
    assert.strictEqual(res[0].options.length, 4);
    assert.strictEqual(res[0].options[0].text, 'Only I is true');
  });

  it('extracts multiple questions cleanly from a single document', () => {
    const raw = `Question 1:
Let f(x) = x^2. Find f'(3).
A 6
B 5
C 4
D 3
Ans: A

Question 2:
Evaluate \\int_0^1 x dx.
A 1/2
B 1/3
C 1/4
D 1
Ans: A`;
    const res = parseWordQuestions(raw);
    assert.strictEqual(res.length, 2, 'Must extract exactly 2 questions');
    assert.strictEqual(res[0].correctKey, 'A');
    assert.strictEqual(res[1].correctKey, 'A');
    assert.strictEqual(res[0].options.length, 4);
    assert.strictEqual(res[1].options.length, 4);
  });
});
