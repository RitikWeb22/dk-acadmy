import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('frontend and backend universalMathEngine copies have not drifted', () => {
  const result = spawnSync(process.execPath, ['scripts/syncMathEngine.mjs', '--check'], {
    cwd: backendRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, `${result.stdout || ''}\n${result.stderr || ''}`);
});
