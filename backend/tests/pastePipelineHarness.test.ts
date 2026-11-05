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

interface PasteFixture {
  name: string;
  synthetic: boolean;
  label: string;
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
  return (text.match(/[A-Za-z0-9]+/g) || []).map((token) => token.toLowerCase());
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

  for (const fixture of loadFixtures()) {
    test(`fixture ${fixture.name} matches expected stored value and I1-I7`, () => {
      assert.equal(fixture.synthetic, true, `${fixture.name} must stay labelled synthetic until a real capture replaces it`);
      assert.equal(fixture.label, 'synthetic');

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

      assert.equal(stored, fixture.expectedStored, report);
      assert.deepEqual(lost, [], `I1 lost tokens\n${report}`);
      assert.equal(trace.delimiterWrappedByPipeline, true, `I3 math must be stored inside $...$\n${report}`);
      assert.equal(undelimitedLatexInText, false, `I5 text blocks still contain raw LaTeX commands\n${report}`);
      if (mathBlocks.length > 0) {
        assert.equal(mathBlocks.every((block) => block.katexOk), true, `KaTeX rejected a math block\n${report}`);
      }
    });
  }
});
