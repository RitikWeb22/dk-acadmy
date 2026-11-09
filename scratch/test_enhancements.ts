import katex from '../frontend/node_modules/katex/dist/katex.mjs';

const testStrs = [
  "then 6(y'(0) + (y(\\log_e \\sqrt{3}))^2) is equal to",
  "then the value of 3\\alpha^2 is equal to",
  "Then y(2) is equal to:",
  "then (f \\circ g)(x) is equal to",
  "then 1/a + 1/b + 4/k is equal to"
];

for (const t of testStrs) {
  const m = t.match(/(?<=\b(?:then|and|if|where|find|evaluate|value\s+of)\s+)([-+]?[0-9a-zA-Z_^{}()'|\\\\+\\-*/\\[\\]\\s.]+?)(?=\s+(?:is\s+equal\s+to|equals\b)(?:\s*[:=_\-]+)?|\s*[,;.]|$)/i);
  if (m) {
    console.log(`Matched: "${m[1].trim()}" in "${t}"`);
    try {
      katex.renderToString(m[1].trim(), { throwOnError: true });
      console.log('  -> KaTeX valid!');
    } catch (e: any) {
      console.log('  -> KaTeX err:', e.message);
    }
  } else {
    console.log('NO MATCH in:', t);
  }
}
