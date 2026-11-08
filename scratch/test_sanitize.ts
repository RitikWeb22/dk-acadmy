import { sanitizeFormula } from '../frontend/src/components/ui/MathEngine/sanitizeFormula';
import katex from '../frontend/node_modules/katex/dist/katex.mjs';

const formula = `f(x)=\\begin{cases} 1/x log_e(\\dfrac{1+x/a}{1-x/b}), & x < 0 \\\\ k, & x=0 \\\\ \\dfrac{\\cos^2x-\\sin^2x-1}{ \\sqrt (x^2+1)-1}, & x > 0 \\end{cases}`;

console.log("Original formula:\n", formula);
const sanitized = sanitizeFormula(formula);
console.log("\nSanitized formula:\n", sanitized);

try {
  const html = katex.renderToString(sanitized, { displayMode: false, throwOnError: true });
  console.log("\nKaTeX succeeded! html length:", html.length);
} catch (e) {
  console.error("\nKaTeX threw error:", e);
}

