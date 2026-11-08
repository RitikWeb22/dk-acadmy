import katex from '../frontend/node_modules/katex/dist/katex.mjs';

const formula = `f(x) = \\begin{cases} \\dfrac{1}{x} \\log_e\\left(\\dfrac{1+\\dfrac{x}{a}}{1-\\dfrac{x}{b}}\\right), & x < 0 \\\\ k, & x=0 \\\\ \\dfrac{\\cos^{2} x-\\sin^{2} x-1}{\\sqrt{x^2+1}-1}, & x > 0 \\end{cases}`;

const res = katex.renderToString(formula, { displayMode: true, throwOnError: true });
console.log("KaTeX rendered successfully! HTML length:", res.length);

