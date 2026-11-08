const badRegex = /\\exp\s*\{([^{}]*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}[^{}]*)*)\}/g;

const text = `Let the solution curve y=y(x) of the differential equation dy/(" " \\, dx)-(3x^{5} \\tan^{-1}(x^3 ))/(1+x^{6})^{\\frac{3}{2}} y=2x\\exp{ \\frac{x^{3}-\\tan^{-1}x^{3}}{\\sqrt{ (1+x^{6} )}} pass through the origin. Then y(1) is equal to :`;

console.log("Testing badRegex on unclosed \\exp text...");
const t0 = Date.now();
const res = text.replace(badRegex, "REPLACED");
console.log(`Took ${Date.now() - t0}ms`);

