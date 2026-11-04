const eq = String.raw`\lim_{x \to \frac{1}{a}} \frac{16(1-\cos(2+x-2x^{2}))}{(1-ax)^{2}} = \alpha+\beta\sqrt{17}`;

const nonLatex = eq.replace(/\\[a-zA-Z]+/g, ' ');
const proseTest = /\b(?:let|and|the|is|are|in|on|at|of|to|for|with|then|if|which|where|satisfying|between|perpendicular)\b/i;

console.log('Prose test with nonLatex:', proseTest.test(nonLatex));
