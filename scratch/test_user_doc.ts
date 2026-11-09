function preformatDocxOptions(text: string): string {
  let s = text;

  // Separate glued "to(A)" -> "to\n(A)"
  s = s.replace(/([0-9a-zA-Z:])\s*(\([A-D]\)|\[[A-D]\])/g, '$1\n$2');

  // Separate glued "toA", "is :A", "line :A" -> "... \n(A) "
  s = s.replace(/(?<=\bto|\bis\s*:|[:=_\-])\s*(A)(?=\s+[-+]?[0-9a-zA-Z\u0370-\u03FF\\(])/gi, '\n(A) ');

  // Separate bare A preceded by whitespace
  s = s.replace(/(?<=\b(?:to|is|are|equal|equals|equals\s*:|line\s*:|curve\s*:|radius\s*:|interval\s*:|point\s*:|points\s*:|origin\s*:|by|value\s+of)\s+)(A)(?=\s+[-+]?[0-9a-zA-Z\u0370-\u03FF\\(])/gi, '\n(A) ');

  // Separate glued B, C, D: e.g. "-1B 121", "1e2B 2e2", "π2(C)", "0(D)", "-π12B π2"
  s = s.replace(/([0-9a-zA-Z\u0370-\u03FF\)\}\]\.\-])\s*(?:\(([B-D])\)|\[([B-D])\]|([B-D]))(?=\s+[-+]?[0-9a-zA-Z\u0370-\u03FF\\(\$]|[-+])/g, (_m, prev, p1, p2, p3) => {
    const letter = p1 || p2 || p3;
    return `${prev}\n(${letter}) `;
  });

  // Ensure (A) on newline if bare A preceded by newline/whitespace
  s = s.replace(/(?:^|[\n\r]|\s{2,})A(?=\s+[-+]?[0-9a-zA-Z\u0370-\u03FF\\(])/g, '\n(A) ');

  return s;
}

const q2 = `2. Let y=y(x) be the solution of the differential equation 2xloge⁡xdydx+2y=3xloge⁡x,x>0 and ye-1=0. Then, y(e) is equal toA -3eB -32eC -23e JEE Main 2024 (Online) 6th April Morning ShiftD -2e`;
const q8 = `8. Let y=y(x) be the solution of the differential equation 1+y2etan⁡xdx+cos2⁡x1+e2tan⁡xdy=0,y(0)=1. Then yπ4 is equal to(A) 1e2B 2e2
C 2e JEE Main 2024 (Online) 8th April Morning ShiftD 1e`;

console.log('Q2:\n', preformatDocxOptions(q2));
console.log('\nQ8:\n', preformatDocxOptions(q8));
