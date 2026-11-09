function cleanDefiniteIntegralArtifacts(text: string): string {
  let s = text;

  // 1. Clean margin limit repetition at start of line: e.g. 00The value -> The value, -1-1The value -> The value
  s = s.replace(/^[–\-−]?([0-9\pi\u03C0]+)\1\s*(?=[A-Za-z])/gm, '');
  s = s.replace(/^00\s*/gm, '');

  // 2. Clean Word Symbol font closing paren: e.g. (x - \pi @ -> (x - \pi)
  s = s.replace(/@/g, ')');

  // 3. Multi-line fractions in options: e.g.
  // (A) 1 loge(...)   (B) 2 loge(...)
  //     3                 3
  // Look for: (\d+)\s+(log[^\n\t]+)\s*[\n\r]+\s*(\d+)\b
  s = s.replace(/\b(\d+)\s+((?:loge|log_e|ln|log|\\[a-zA-Z]+)[^\n\r]+?)\s*[\n\r]+\s*(\d+)\b/gi, '\\dfrac{$1}{$3} $2');

  return s;
}

const def1 = `00The value of the integral ∫2
√𝑥(𝑥2+𝑥+1) (√𝑥+1)(√𝑥4+𝑥2+1)
d𝑥 is equal to:
(A) 1 log𝑒(3 − 2√2).	(B) 2 log𝑒(4 + √2)
3	3
C 2 log𝑒(3 + 2√2).	(D) 1 log𝑒(1 + 6√2)
3	3
JEE Main 2026 (Online) 8th April Evening Shift`;

const def2 = `If ∫𝜋/4 (cot (𝑥 − 𝜋@ cot (𝑥 + 𝜋@ + 1@ 𝑑𝑥 = 𝛼loge(√3 − 1), then 9𝛼2 is
𝜋/6	3	3
equal to 	.
JEE Main 2026 (Online) 8th April Evening Shift`;

console.log('Def 1:\n', cleanDefiniteIntegralArtifacts(def1));
console.log('\nDef 2:\n', cleanDefiniteIntegralArtifacts(def2));

