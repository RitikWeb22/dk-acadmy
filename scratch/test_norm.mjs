import fs from 'fs';

// Read questionBulkParser.ts
const code = fs.readFileSync('./frontend/src/utils/questionBulkParser.ts', 'utf8');

// Strip TypeScript imports and types simply
const stripped = code
  .replace(/import type [^;]+;/g, '')
  .replace(/import [^;]+;/g, '')
  .replace(/: string\[\]/g, '')
  .replace(/: string/g, '')
  .replace(/: number/g, '')
  .replace(/: boolean/g, '')
  .replace(/: any/g, '')
  .replace(/: MathContentBlock\[\]/g, '')
  .replace(/: ProblemQuestionItem\[\]/g, '')
  .replace(/export function /g, 'function ')
  .replace(/export const /g, 'const ');

const mod = {};
const fn = new Function('exports', stripped + '\nexports.normalizeMathText = normalizeMathText; exports.autoWrapMathDelimiters = autoWrapMathDelimiters;');
fn(mod);

const input = `The value of the integral \\int ^2
0
\\sqrt{x(x^2 + x + 1)}
(\\sqrt{x} + 1)\\sqrt{x^4 + x^2 + 1} dx is equal to:`;

console.log('--- Normalized ---');
const norm = mod.normalizeMathText(input);
console.log(norm);

console.log('--- Auto Wrapped ---');
console.log(mod.autoWrapMathDelimiters(norm));

