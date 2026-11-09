import { parseSingleQuestionBlock } from '../frontend/src/utils/wordPasteParser';
import katex from '../frontend/node_modules/katex/dist/katex.mjs';

function extractExamTagSafely(text: string): { text: string; examTag: string } {
  let s = text;
  let examTag = '';

  const examRegex = /(?:\[|\b|\s{2,})(JEE\s*(?:Main|Advanced)?\s*(?:-\s*\d{4}|\d{4})?\s*(?:\([^\)]+\)|Online|Offline)?\s*[\d\w\s\-–]*(?:Morning\s*Shift|Evening\s*Shift|Morning\s*Slot|Evening\s*Slot|Morning\s*Session|Evening\s*Session|Shift\s*\d|Slot\s*\d|Paper\s*\d|Shift|Slot|Offline|Online)\s*(?:I{1,3})?|AIEEE\s*\d{4}|BITSAT\s*\d{4})/i;

  const m = s.match(examRegex);
  if (m) {
    examTag = m[0].trim().replace(/^\[|\]$/g, '');
    s = s.replace(m[0], ' ');
  }
  return { text: s, examTag };
}

function preformatDocxOptions(text: string): string {
  let s = text;

  // Separate glued "toA", "is :A", "line :A", "equals :A" -> "... \n(A) "
  // MUST have a space or colon before A so "area" or "be a" is NEVER matched!
  s = s.replace(/(?<=\b(?:to|is|are|equal|equals|equals\s*:|line\s*:|curve\s*:|radius\s*:|interval\s*:|point\s*:|points\s*:|origin\s*:|by|value\s+of)\s+|[:=_\-]\s*)(A)(?=\s+[-+]?[0-9a-zA-Z\u0370-\u03FF\\(])/gi, '\n(A) ');

  // Separate glued B, C, D: e.g. "-1B 121", "π2(C)", "0(D)", "-π12B π2"
  s = s.replace(/([0-9a-zA-Z\u0370-\u03FF\)\}\]\.\-])\s*(?:\(([B-D])\)|\[([B-D])\]|([B-D]))(?=\s+[-+]?[0-9a-zA-Z\u0370-\u03FF\\(\$]|[-+])/g, (_m, prev, p1, p2, p3) => {
    const letter = p1 || p2 || p3;
    return `${prev}\n(${letter}) `;
  });

  // Ensure (A) on newline if bare A preceded by whitespace/exam tag
  s = s.replace(/(?:^|[\n\r]|\s{2,})A(?=\s+[-+]?[0-9a-zA-Z\u0370-\u03FF\\(])/g, '\n(A) ');

  return s;
}

function normalizeDocxMath(raw: string): string {
  let s = raw;

  // 1. Replace invisible function application & invisible times with spaces
  s = s.replace(/[\u2061\u2062\u2063\u2064]/g, ' ')
       .replace(/[\u200B-\u200F\uFEFF\u00AD\u034F\u180E\uFFF9-\uFFFC]/g, '')
       .replace(/[\u2013\u2014\u2212]/g, '-')
       .replace(/[\u201C\u201D]/g, '"')
       .replace(/[\u2018\u2019]/g, "'");

  // 2. Derivatives in plain text: dydx, d2ydx2, dy dx, dx dy, d2xdy2
  s = s.replace(/d2ydx2/gi, '\\dfrac{d^2y}{dx^2}');
  s = s.replace(/d2xdy2/gi, '\\dfrac{d^2x}{dy^2}');
  s = s.replace(/dydx/gi, '\\dfrac{dy}{dx}');
  s = s.replace(/dxdy/gi, '\\dfrac{dx}{dy}');
  s = s.replace(/(?<=[0-9a-zA-Z\)\}\]\s])dy\s+dx\b/gi, '\\dfrac{dy}{dx}');
  s = s.replace(/(?<=[0-9a-zA-Z\)\}\]\s])dx\s+dy\b/gi, '\\dfrac{dx}{dy}');

  // Insert space between coefficient/variable and function keyword (must use \b on function name!)
  s = s.replace(/([0-9a-zA-Z])(?=\b(?:loge|log2|log10|log|sin|cos|tan|sec|cot|csc)\b)/g, '$1 ');

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
  s = s.replace(/(?<=\s|[+\-=]|^)e\s*([a-zA-Z])(?=\s*[+\-=]|$)/g, 'e^{$1}');

  // 9. Algebraic powers: x2 -> x^2, y2 -> y^2, x3 -> x^3, x4 -> x^4, etc.
  s = s.replace(/([a-zA-Z])([2-9])(?=[+\-*/=,)>\]\s\\]|$)/g, '$1^{$2}');

  // 10. Plain text fraction options:
  // 121-e -> \dfrac{1}{2}(1-e), 141-e -> \dfrac{1}{4}(1-e)
  s = s.replace(/\b12\s*(?=1\s*[-+])/g, '\\dfrac{1}{2}(');
  s = s.replace(/\b14\s*(?=1\s*[-+])/g, '\\dfrac{1}{4}(');
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

const questions = [
  // Q1
  `1.Let y=y(x) be the solution of the differential equation 1+x2dydx+y=etan-1⁡x,y(1)=0. Then y(0) is
A 14eπ/2-1B 121-eπ/2
C 141-eπ/2       JEE Main 2024 (Online) 6th April Morning ShiftD 12eπ/2-1`,

  // Q2
  `2. Let y=y(x) be the solution of the differential equation 2xloge⁡xdydx+2y=3xloge⁡x,x>0 and ye-1=0. Then, y(e) is equal toA -3eB -32eC -23e JEE Main 2024 (Online) 6th April Morning ShiftD -2e`,

  // Q3
  `3.If the solution y(x) of the given differential equation ey+1cos⁡x dx+eysin⁡x dy=0 passes through the point π2,0, then the value of eyπ6 is equal to  JEE Main 2024 (Online) 6th April Evening Shift`,

  // Q4
  `4.Suppose the solution of the differential equation dydx=(2+α)x-βy+2βx-2αy-(βγ-4α) represents a circle passing through origin. Then the radius of this circle is :A 17B 2C 172    JEE Main 2024 (Online) 6th April Evening ShiftD 12`,

  // Q5
  `5.Let y=y(x) be the solution of the differential equation
dy dx+2x1+x22y=xe11+x2;y(0)=0
Then the area enclosed by the curve f(x)=y(x)e-11+x2 and the line y-x=4 is  
JEE Main 2024 (Online) 5th April Evening Shift`,

  // Q6
  `6. The differential equation of the family of circles passing through the origin and having centre at the line y=x is :
A  x2-y2+2xydx=x2-y2+2xydyB x2+y2-2xydx=x2+y2+2xydy
C x2+y2+2xydx=x2+y2-2xydyD x2-y2+2xydx=x2-y2-2xydy
JEE Main 2024 (Online) 5th April Evening Shift`,

  // Q7
  `7. If y=y(x) is the solution of the differential equation dy dx+2y=sin⁡(2x),y(0)=34, then yπ8 is equal to :
A e-π/8B eπ/4C e-π/4    JEE Main 2024 (Online) 5th April Morning ShiftD eπ/8`,

  // Q8
  `8. Let y=y(x) be the solution of the differential equation 1+y2etan⁡xdx+cos2⁡x1+e2tan⁡xdy=0,y(0)=1. Then yπ4 is equal to(A) 1e2B 2e2
C 2e JEE Main 2024 (Online) 8th April Morning ShiftD 1e`,

  // Q9
  `9. Let f(x) be a positive function such that the area bounded by y=f(x),y=0 from x=0 to x=a>0 is e-a+4a2+a-1. Then the differential equation, whose general solution is y=c1f(x)+c2, where c1 and c2 are arbitrary constants, is
A 8ex+1d2ydx2-dydx=0B 8ex+1d2ydx2+dydx=0
C 8ex-1d2ydx2-dydx=0  JEE Main 2024 (Online) 8th April Morning ShiftD 8ex-1d2ydx2+dydx=0`,

  // Q10
  `10. Let α|x|=|y|exy-β,α,β∈N be the solution of the differential equation x dy-y dx+xy(x dy+y dx)=0,y(1)=2. Then α+β is equal to  
JEE Main 2024 (Online) 8th April Evening Shift`
];

questions.forEach((q, idx) => {
  console.log(`\n=================== QUESTION ${idx + 1} ===================`);
  const tagRes = extractExamTagSafely(q);
  const formatted = preformatDocxOptions(tagRes.text);
  const normalized = normalizeDocxMath(formatted);

  console.log('Cleaned Block:\n', normalized);
  console.log('Exam Tag:', tagRes.examTag);
});
