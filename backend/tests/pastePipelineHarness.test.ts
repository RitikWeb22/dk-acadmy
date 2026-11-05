/**
 * Runs the frontend MathInput paste path (resolveMathInputPaste) under happy-dom,
 * which is a browser HTML parser. These fixtures are synthetic until a real
 * capture.json replaces them. Expected-value assertions fail until the pipeline
 * is fixed; the stage trace in the failure is the Phase 1 diagnosis.
 */
import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Window } from 'happy-dom';
import katex from 'katex';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(here, 'fixtures', 'paste');

const dom = new Window();
const root = globalThis as typeof globalThis & {
  DOMParser: unknown;
  window: unknown;
  document: unknown;
};
root.DOMParser = dom.DOMParser;
root.window = dom;
root.document = dom.document;

const { traceMathInputPaste } = await import('../../frontend/src/utils/pastePipelineTrace.ts');
const { resolveMathInputPaste } = await import('../../frontend/src/utils/mathInputPaste.ts');
const { reconstructLinearEquation } = await import('../../frontend/src/utils/universalMathEngine/linearEquationParser.ts');

/**
 * Comparison rules for expectedStored. The expected strings themselves are not edited.
 * - A single-character exponent `{n}` is the same as `^n`, and `{ ' }` is the same as a prime.
 * - All whitespace is removed. KaTeX HTML is compared separately, so spacing is not part of the string check.
 */
function canonicalizeStoredMath(value: string): string {
  return value
    .replace(/\^\{\s*([0-9a-zA-Z])\s*\}/g, '^$1')
    .replace(/\^\{\s*['′]\s*\}/g, "'")
    .replace(/\{\s*['′]\s*\}/g, "'")
    .replace(/\s+/g, '');
}

function katexHtml(value: string): string {
  const formulas = [...value.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g)].map((match) => match[1] ?? match[2]);
  return formulas
    .map((formula) => {
      const canonical = formula
        .replace(/\^\{\s*([0-9a-zA-Z])\s*\}/g, '^$1')
        .replace(/_\{\s*([0-9a-zA-Z])\s*\}/g, '_$1')
        .replace(/\^\{\s*['′]\s*\}/g, "'")
        .replace(/\{\s*['′]\s*\}/g, "'");
      return katex.renderToString(canonical, { throwOnError: true, displayMode: false });
    })
    .join('\n')
    .replace(/<annotation\b[\s\S]*?<\/annotation>/g, '');
}

interface PasteFixture {
  name: string;
  synthetic: boolean;
  label: string;
  needsReview?: boolean;
  note?: string;
  plain: string;
  html: string;
  expectedStored: string;
}

function loadFixtures(): PasteFixture[] {
  return fs
    .readdirSync(fixtureDir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(fixtureDir, name), 'utf8')) as PasteFixture);
}

function clipboard(html: string, plain: string) {
  return {
    getData(format: string) {
      if (format === 'text/html') return html;
      if (format === 'text/plain' || format === 'text') return plain;
      return '';
    },
  };
}

function wordTokens(text: string): string[] {
  const unfolded = text
    .replace(/\\([a-zA-Z]+)/g, ' $1 ')
    .replace(/([0-9])([a-zA-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])([0-9])/g, '$1 $2')
    .replace(/([a-zA-Z0-9])(?=(?:sin|cos|tan|cot|sec|csc|log|ln|lim)\b)/gi, '$1 ');
  return (unfolded.match(/[A-Za-z0-9]+/g) || []).map((token) => token.toLowerCase());
}

function missingTokens(plain: string, stored: string): string[] {
  const have = new Set(wordTokens(stored));
  return wordTokens(plain).filter((token) => !have.has(token));
}

describe('MathInput paste harness (happy-dom, frontend path)', () => {
  test('browser HTML parser is installed before the engine loads', () => {
    const parser = new (root.DOMParser as new () => { parseFromString(m: string, t: string): { body: { textContent: string } } })();
    const doc = parser.parseFromString('<p>Keep <!--hidden--> <![if !msEquation]>f(x)<![endif]></p>', 'text/html');
    assert.match(doc.body.textContent || '', /Keep/);
    assert.equal((doc.body.textContent || '').includes('hidden'), false);
  });

  test('trace records every stage the builder uses', () => {
    const trace = traceMathInputPaste(clipboard('', 'lim(x->0) (sin x)/x = 1'));
    for (const key of [
      'rawPlain',
      'rawHtml',
      'afterOmmlExtraction',
      'afterLatexConversion',
      'afterNormalizer',
      'afterDelimiterWrapping',
      'afterPasteHandler',
      'mathInputOnChange',
      'mathTextInput',
    ]) {
      assert.equal(typeof (trace as Record<string, unknown>)[key], 'string', key);
    }
    assert.equal(trace.mathTextInput, trace.mathInputOnChange);
    const resolved = resolveMathInputPaste(clipboard('', 'lim(x->0) (sin x)/x = 1'));
    assert.equal(trace.afterPasteHandler, resolved.result.fullNormalizedText);
  });

  test('sanitizeFormula preserves nested radicals with y^4 and y^{4} (regression test)', async () => {
    const { sanitizeFormula } = await import('../../frontend/src/components/ui/MathEngine/sanitizeFormula.ts');

    const input1 = '\\sqrt{1+\\sqrt{1+y^4}}';
    const res1 = sanitizeFormula(input1);
    assert.equal(res1.endsWith('}}'), true, `Expected ending in }} but got: ${res1}`);
    assert.doesNotThrow(() => katex.renderToString(res1, { throwOnError: true }));

    const input2 = '\\sqrt{1+\\sqrt{1+y^{4}}}';
    const res2 = sanitizeFormula(input2);
    assert.equal(res2.endsWith('}}'), true, `Expected ending in }} but got: ${res2}`);
    assert.doesNotThrow(() => katex.renderToString(res2, { throwOnError: true }));

    // Both render to identical KaTeX HTML
    assert.equal(katexHtml(`$${res1}$`), katexHtml(`$${res2}$`));
  });

  test('ensureMathDelimiters cleanly wraps limits with tall brackets and nested radicals', () => {
    const input = 'The value of \\lim_{x \\to 0} 2\\left(\\frac{1-\\cos x\\sqrt{\\cos 2x}\\cdot\\cos 3x\\cdots\\sqrt{\\cos 10x}}{x^2}\\right) is ( ).';
    const trace = traceMathInputPaste(clipboard('', input));
    assert.equal(
      trace.mathInputOnChange,
      'The value of $\\lim_{x \\to 0} 2\\left(\\frac{1-\\cos x\\sqrt{\\cos 2x}\\cdot\\cos 3x\\cdots\\sqrt{\\cos 10x}}{x^2}\\right)$ is ( ).'
    );
    assert.equal(trace.blocks.some((b) => b.type === 'text' && b.content.includes('\\frac')), false);
    assert.equal(trace.blocks.every((b) => b.type === 'text' || b.katexOk), true);
  });

  for (const fixture of loadFixtures()) {
    test(`fixture ${fixture.name} matches expected stored value and I1-I7`, () => {
      if (fixture.synthetic) {
        // Synthetic fixtures: strict checks — must stay labelled synthetic and use clean expected values.
        assert.equal(fixture.label, 'synthetic', `${fixture.name}: synthetic fixtures must have label="synthetic"`);
      } else {
        // Real captures from /admin/paste-debug: label must be a Word/source label, not 'synthetic'.
        assert.notEqual(fixture.label, 'synthetic', `${fixture.name}: real captures must not have label="synthetic"`);
      }

      const payload = clipboard(fixture.html, fixture.plain);
      const trace = traceMathInputPaste(payload);
      const stored = trace.mathInputOnChange;
      const lost = missingTokens(fixture.plain, stored);
      const mathBlocks = trace.blocks.filter((block) => block.type !== 'text');
      const textBlocks = trace.blocks.filter((block) => block.type === 'text');
      const undelimitedLatexInText = textBlocks.some((block) => /\\(?:frac|sqrt|lim|begin)\b/.test(block.content));

      const report = [
        `stored: ${JSON.stringify(stored)}`,
        `expected: ${JSON.stringify(fixture.expectedStored)}`,
        `sourceType: ${trace.sourceType}`,
        `usedPlainFallback: ${trace.usedPlainFallback}`,
        `delimiterWrappedByPipeline: ${trace.delimiterWrappedByPipeline}`,
        `lost tokens: ${lost.join(', ') || '(none)'}`,
        `omml warnings: ${trace.ommlWarnings.join(' | ') || '(none)'}`,
        `afterOmmlExtraction: ${JSON.stringify(trace.afterOmmlExtraction)}`,
        `afterLatexConversion: ${JSON.stringify(trace.afterLatexConversion)}`,
        `afterNormalizer: ${JSON.stringify(trace.afterNormalizer)}`,
        `afterPasteHandler: ${JSON.stringify(trace.afterPasteHandler)}`,
        `blocks: ${JSON.stringify(trace.blocks.map((block) => ({ type: block.type, content: block.content, katexOk: block.katexOk })))}`,
      ].join('\n');

      if (!fixture.needsReview) {
        // Full assertion: stored value must match expected (after canonicalization) and render identically via KaTeX.
        assert.equal(canonicalizeStoredMath(stored), canonicalizeStoredMath(fixture.expectedStored), report);
        assert.equal(katexHtml(stored), katexHtml(fixture.expectedStored), `KaTeX HTML differs\n${report}`);
      } else {
        // needsReview=true: only assert the stored value hasn't silently changed from the recorded baseline.
        // A change here means the pipeline changed behaviour on a known-broken fixture — investigate before updating.
        assert.equal(
          canonicalizeStoredMath(stored),
          canonicalizeStoredMath(fixture.expectedStored),
          `needsReview fixture ${fixture.name} produced a different result than the frozen baseline — update expectedStored intentionally\n${report}`,
        );
      }

      const once = reconstructLinearEquation(fixture.plain);
      assert.equal(reconstructLinearEquation(once), once, 'reconstructLinearEquation is not idempotent');
      assert.deepEqual(lost, [], `I1 lost tokens\n${report}`);
      assert.equal(trace.delimiterWrappedByPipeline, true, `I3 math must be stored inside $...$\n${report}`);
      if (!fixture.needsReview) {
        // Only assert I5 and per-block KaTeX for fixtures that are not marked as needing review.
        assert.equal(undelimitedLatexInText, false, `I5 text blocks still contain raw LaTeX commands\n${report}`);
        if (mathBlocks.length > 0) {
          assert.equal(mathBlocks.every((block) => block.katexOk), true, `KaTeX rejected a math block\n${report}`);
        }
      }
    });
  }
});
