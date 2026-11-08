import { parseWordMatricesAndCases, wrapMathInDollars } from '../frontend/src/utils/wordPasteParser';

function enhanceCasesRow(s: string): string {
  let res = s;
  // Remove zero-width function application char \u2061
  res = res.replace(/[\u2061\u200B-\u200D\uFEFF]/g, '');
  // Linear fraction: 1/x -> \dfrac{1}{x}
  res = res.replace(/(?<![a-zA-Z0-9_\\])(\d+)\s*\/\s*([a-zA-Z])(?![a-zA-Z0-9_])/g, '\\dfrac{$1}{$2}');
  // Linear fraction: x/a -> \dfrac{x}{a}
  res = res.replace(/(?<=[(,=+\-*\/]\s*)([a-zA-Z])\s*\/\s*([a-zA-Z0-9])(?=\s*[),=+;\-*\/])/g, '\\dfrac{$1}{$2}');
  // log_e -> \log_e
  res = res.replace(/(?<!\\)\blog_e\b/g, '\\log_e');
  // (cos^2x-sin^2x-1)/(√(x^2+1)-1)
  res = res.replace(/√\s*\(([^()]+)\)/g, '\\sqrt{$1}');
  res = res.replace(/\\sqrt\s*\(([^()]+)\)/g, '\\sqrt{$1}');
  res = res.replace(
    /\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*\(((?:[^()\n]|\([^()\n]*\))+?)\)/g,
    '\\dfrac{$1}{$2}'
  );
  // Trig spacing: cos^2x -> \cos^2 x
  res = res.replace(/(?<!\\)\b(sin|cos|tan|cot|sec|csc)\^([0-9]+)\s*([a-zA-Z])/g, '\\$1^{$2} $3');
  // Big parens around fraction after log_e: \log_e(\dfrac{...}{...}) -> \log_e\left(\dfrac{...}{...}\right)
  res = res.replace(/\\log_e\s*\(\s*(\\dfrac\{[^{}]+\}\{[^{}]+\})\s*\)/g, '\\log_e\\left($1\\right)');

  return res;
}

const row1 = `1/x log_e⁡((1+x/a)/(1-x/b))`;
const row3 = `(cos^2⁡x-sin^2⁡x-1)/(√(x^2+1)-1)`;

console.log("Row 1 enhanced:\n", enhanceCasesRow(row1));
console.log("Row 3 enhanced:\n", enhanceCasesRow(row3));

// Multi-fraction test:
let text = `then 1/a+1/b+4/k is equal to :`;
text = text.replace(
  /(?<![$\w])(\d+\/[a-zA-Z0-9]+(?:\s*[+\-*/]\s*\d+\/[a-zA-Z0-9]+)+)(?=\s+(?:is|equal)|\s*[,;.]|$)/g,
  (m) => {
    const formatted = m.replace(/(\d+)\/([a-zA-Z0-9]+)/g, '\\dfrac{$1}{$2}');
    return `$${formatted}$`;
  }
);
console.log("Fraction addition enhanced:\n", text);

