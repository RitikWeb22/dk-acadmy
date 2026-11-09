function normalizeDocxMath(raw: string): string {
  let s = raw;

  // 1. Replace invisible function application & invisible times with spaces
  s = s.replace(/[\u2061\u2062\u2063\u2064]/g, ' ')
       .replace(/[\u200B-\u200F\uFEFF\u00AD\u034F\u180E\uFFF9-\uFFFC]/g, '')
       .replace(/[\u2013\u2014\u2212]/g, '-')
       .replace(/[\u201C\u201D]/g, '"')
       .replace(/[\u2018\u2019]/g, "'");

  // 2. Derivatives in plain text: dydx, d2ydx2, dy dx, dx dy, d2xdy2 (DO THIS FIRST BEFORE POWERS!)
  s = s.replace(/d2ydx2/gi, '\\dfrac{d^2y}{dx^2}');
  s = s.replace(/d2xdy2/gi, '\\dfrac{d^2x}{dy^2}');
  s = s.replace(/dydx/gi, '\\dfrac{dy}{dx}');
  s = s.replace(/dxdy/gi, '\\dfrac{dx}{dy}');
  s = s.replace(/(?<=[0-9a-zA-Z\)\}\]\s])dy\s+dx\b/gi, '\\dfrac{dy}{dx}');
  s = s.replace(/(?<=[0-9a-zA-Z\)\}\]\s])dx\s+dy\b/gi, '\\dfrac{dx}{dy}');

  // 3. Exponential attached inverse trig: etan-1 x -> e^{\tan^{-1} x}
  s = s.replace(/e(tan|sin|cos|cot|sec|cosec|csc)-1\s*([a-zA-Z0-9]+|\([a-zA-Z0-9]+\))/gi, 'e^{\\\\$1^{-1}($2)}');

  // Inverse trigonometric: tan-1, sin-1, cos-1, sec-1, cot-1, cosec-1
  s = s.replace(/(?<![a-zA-Z])(tan|sin|cos|sec|cot|cosec|csc)-1\b/gi, '\\$1^{-1}');
  s = s.replace(/\\(cosec)\^\{-1\}/gi, '\\csc^{-1}');

  // 4. Logarithms: loge x, logex, log2 x, log10 x
  s = s.replace(/\bloge\s*([a-zA-Z0-9\(])/gi, '\\log_e $1');
  s = s.replace(/\bloge\b/gi, '\\log_e');
  s = s.replace(/\blog2\s*([a-zA-Z0-9\(])/gi, '\\log_2 $1');
  s = s.replace(/\blog10\s*([a-zA-Z0-9\(])/gi, '\\log_{10} $1');
  s = s.replace(/\bcosec\b/gi, '\\csc');
  s = s.replace(/\blog\b(?![_a-zA-Z])/gi, '\\log');

  // Trig powers without backslash: cos2 x -> \cos^2 x, cos4 x -> \cos^4 x
  s = s.replace(/\b(sin|cos|tan|sec|cot|csc)([2-9])(?![0-9])/gi, '\\$1^{$2} ');
  s = s.replace(/\b(sin|cos|tan|sec|cot|csc)\b(?!\^)/gi, '\\$1');

  // 5. Greek letters
  const greek: Record<string, string> = {
    'α': '\\alpha ', 'β': '\\beta ', 'γ': '\\gamma ', 'δ': '\\delta ',
    'θ': '\\theta ', 'λ': '\\lambda ', 'μ': '\\mu ', 'π': '\\pi ',
    'σ': '\\sigma ', 'ω': '\\omega ', 'ϕ': '\\phi '
  };
  for (const [k, v] of Object.entries(greek)) {
    s = s.replaceAll(k, v);
  }

  // 6. Function evaluations: yπ4 -> y(\dfrac{\pi}{4}), yπ8 -> y(\dfrac{\pi}{8})
  s = s.replace(/y\s*\\pi\s*([2-9]|12|16|32)\b/gi, 'y\\left(\\dfrac{\\pi}{$1}\\right)');
  s = s.replace(/y'\\pi\s*([2-9]|12|16|32)\b/gi, "y'\\left(\\dfrac{\\pi}{$1}\\right)");
  s = s.replace(/y''\\pi\s*([2-9]|12|16|32)\b/gi, "y''\\left(\\dfrac{\\pi}{$1}\\right)");
  s = s.replace(/\by0=0\b/gi, 'y(0)=0');
  s = s.replace(/\bye-1=0\b/gi, 'y(e^{-1})=0');
  s = s.replace(/\by12=mn\b/gi, 'y\\left(\\dfrac{1}{2}\\right)=\\dfrac{m}{n}');

  // 7. Greek fractions: \pi 6 -> \dfrac{\pi}{6}, \pi 2 -> \dfrac{\pi}{2}
  s = s.replace(/\\pi\s*([2-9]|12|16|32)\b/g, '\\dfrac{\\pi}{$1}');

  // 8. Exponential powers: e\pi/2 -> e^{\pi/2}
  s = s.replace(/e\\pi\s*\/\s*([0-9]+)/gi, 'e^{\\dfrac{\\pi}{$1}}');

  // 9. Algebraic powers: x2 -> x^2, y2 -> y^2, x3 -> x^3, x4 -> x^4, etc.
  s = s.replace(/([a-zA-Z])([2-9])(?=[+\-*/=,)>\]\s\\]|$)/g, '$1^{$2}');

  // 10. Plain text fraction options:
  // e.g. 14 -> 1/4, 12 -> 1/2, 34 -> 3/4, 32 -> 3/2, 172 -> 17/2
  s = s.replace(/\b14(?=[a-zA-Z\\(]|$)/g, '\\dfrac{1}{4} ');
  s = s.replace(/\b12(?=[a-zA-Z\\(]|$)/g, '\\dfrac{1}{2} ');
  s = s.replace(/\b34(?=[a-zA-Z\\(]|$)/g, '\\dfrac{3}{4} ');
  s = s.replace(/\b32(?=[a-zA-Z\\(]|$)/g, '\\dfrac{3}{2} ');
  s = s.replace(/\b172\b/g, '\\dfrac{17}{2}');

  // 1e2 -> 1/e^2, 2e2 -> 2/e^2, 1e -> 1/e, 2e -> 2/e
  s = s.replace(/\b1e2\b/g, '\\dfrac{1}{e^2}');
  s = s.replace(/\b2e2\b/g, '\\dfrac{2}{e^2}');
  s = s.replace(/\b1e\b/g, '\\dfrac{1}{e}');

  // 11. Point coordinates: point \dfrac{\pi}{2},0 -> point (\dfrac{\pi}{2}, 0)
  s = s.replace(/(?<=\bpoint\s+)(\\dfrac\{\\pi\}\{[0-9]+\}|\d+)\s*,\s*(-?\d+)/gi, '\\left($1, $2\\right)');

  return s;
}

const tests = [
  "1+x2dydx+y=etan-1⁡x,y(1)=0",
  "2xloge⁡xdydx+2y=3xloge⁡x,x>0 and ye-1=0",
  "ey+1cos⁡x dx+eysin⁡x dy=0 passes through the point π2,0",
  "8ex+1d2ydx2-dydx=0",
  "A 14eπ/2-1B 121-eπ/2",
  "yπ4 is equal to(A) 1e2B 2e2",
  "A π6B π12 C π3 D π4",
  "A 17B 2C 172 D 12"
];

tests.forEach((t, i) => {
  console.log(`\nTest ${i + 1}:`);
  console.log('Original:\n', t);
  console.log('Normalized:\n', normalizeDocxMath(t));
});
