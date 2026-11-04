import { reconstructLinearEquation } from '../src/utils/universalMathEngine/linearEquationParser.js';

const cases = [
  { name: 'Test 1', input: '(lim)┬(y→0) (√(1+√(1+y^4 )) -√2)/y^4' },
  { name: 'Test 2', input: 'x² + y³' },
  { name: 'Test 3', input: '∑_(i=1)^n i²' },
  { name: 'Test 4', input: '√(1+√(1+x^4))' },
  { name: 'Test 5', input: '1/(1+1/x)' }
];

console.log('=== TESTING NEW UNIVERSAL LINEAR EQUATION PARSER ===\n');
for (const c of cases) {
  console.log(`[${c.name}] INPUT:    ${c.input}`);
  const out = reconstructLinearEquation(c.input);
  console.log(`         OUTPUT:   ${out}\n`);
}
