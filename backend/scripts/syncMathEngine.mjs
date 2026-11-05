/**
 * Copies frontend/src/utils/universalMathEngine to the backend and adds the
 * .js extensions the backend compiler requires. --check fails when the backend
 * copy has drifted.
 *
 *   node scripts/syncMathEngine.mjs
 *   node scripts/syncMathEngine.mjs --check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(backendRoot, '..');
const sourceDir = path.join(repoRoot, 'frontend', 'src', 'utils', 'universalMathEngine');
const destDir = path.join(backendRoot, 'src', 'utils', 'universalMathEngine');

export function toBackendSource(source) {
  return source.replace(/(['"])(\.\.?\/[^'"]+?)\1/g, (match, quote, spec) => {
    if (spec.endsWith('.js')) return match;
    return `${quote}${spec}.js${quote}`;
  });
}

function filesIn(dir) {
  return fs.readdirSync(dir).filter((name) => name.endsWith('.ts')).sort();
}

const check = process.argv.includes('--check');
const sourceFiles = filesIn(sourceDir);
const destFiles = fs.existsSync(destDir) ? filesIn(destDir) : [];
let drifted = false;

if (sourceFiles.join('\n') !== destFiles.join('\n')) {
  drifted = true;
  console.error(`File list differs.\nFrontend: ${sourceFiles.join(', ')}\nBackend: ${destFiles.join(', ')}`);
}

for (const name of sourceFiles) {
  const expected = toBackendSource(fs.readFileSync(path.join(sourceDir, name), 'utf8'));
  const destPath = path.join(destDir, name);
  const actual = fs.existsSync(destPath) ? fs.readFileSync(destPath, 'utf8') : null;
  if (actual !== expected) {
    drifted = true;
    if (check) console.error(`Drift: ${name}`);
    else fs.writeFileSync(destPath, expected);
  }
}

if (!check && drifted) {
  console.log(`Synced ${sourceFiles.length} engine files into backend/src/utils/universalMathEngine`);
} else if (check && drifted) {
  process.exit(1);
} else if (check) {
  console.log(`Engine copies match (${sourceFiles.length} files).`);
}
