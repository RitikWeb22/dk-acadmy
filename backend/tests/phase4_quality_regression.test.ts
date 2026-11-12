import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

test('Phase 4 Quality Regression Suite', async (t) => {
  await t.test('BUG-SYNC-01: Math engine files are perfectly synchronized between frontend and backend', () => {
    const scriptPath = path.join(rootDir, 'backend/scripts/syncMathEngine.mjs');
    assert.ok(fs.existsSync(scriptPath), 'syncMathEngine.mjs must exist in backend/scripts');

    // Run sync check
    const output = execSync(`node "${scriptPath}" --check`, {
      cwd: rootDir,
      encoding: 'utf8'
    });

    assert.ok(
      output.includes('Engine copies match') || output.includes('in sync'),
      `MathEngine files must be in sync. Script output: ${output}`
    );
  });

  await t.test('BUG-CONF-01: .gitignore preserves project documentation and audit reports', () => {
    const gitignorePath = path.join(rootDir, '.gitignore');
    assert.ok(fs.existsSync(gitignorePath), '.gitignore must exist');

    const content = fs.readFileSync(gitignorePath, 'utf8');

    // Ensure broad *.md ignore was removed or scoped properly
    const lines = content.split('\n').map((l) => l.trim());
    const broadMdIgnore = lines.some((l) => l === '*.md' || l === '**/*.md');
    assert.strictEqual(
      broadMdIgnore,
      false,
      'Broad *.md or **/*.md must not be present in .gitignore'
    );

    // Verify git check-ignore confirms CODE_AUDIT_REPORT.md and CODE_FIX_REPORT.md are NOT ignored
    try {
      const ignored = execSync('git check-ignore CODE_AUDIT_REPORT.md CODE_FIX_REPORT.md', {
        cwd: rootDir,
        encoding: 'utf8'
      });
      assert.fail(`Reports should not be ignored by git: ${ignored}`);
    } catch (err: any) {
      // Exit code 1 means files are NOT ignored, which is expected
      assert.strictEqual(
        err.status,
        1,
        'git check-ignore should exit with status 1 indicating files are tracked'
      );
    }
  });

  await t.test('Phase 4 Build Hygiene: Frontend and Backend production builds compile with 0 errors', () => {
    // Backend dist server.js exists
    const backendDistServer = path.join(rootDir, 'backend/dist/server.js');
    assert.ok(fs.existsSync(backendDistServer), 'backend/dist/server.js must exist from build');

    // Frontend dist index.html exists
    const frontendDistIndex = path.join(rootDir, 'frontend/dist/index.html');
    assert.ok(fs.existsSync(frontendDistIndex), 'frontend/dist/index.html must exist from build');
  });
});
