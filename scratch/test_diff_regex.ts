const proseLead = '(?:Let|If|Suppose|Given|Define|Find|Evaluate|Calculate|Show|Consider)\\b\\s*[:,]?\\s*';
const proseStops = '(?:pass|passes|passing|touch|touches|touching|intersect|intersects|has|have|having|where|when|such|if|then|and|with|at|for|is|are|represented|representing|given)\\b';

const diffEqRegex = new RegExp(`(${proseLead})?([a-zA-Z0-9_^{}()'|\\\\+\\-*/\\s.]*?\\b(?:d\\^?[0-9]?[a-zA-Z]?\\/d[a-zA-Z]\\^?[0-9]?|\\\\(?:d?frac)\\{d\\^?[0-9]?[a-zA-Z]?\\}\\{d[a-zA-Z]\\^?[0-9]?\\}|dy|dx|dt|dz)\\b[a-zA-Z0-9_^{}()'|\\\\+\\-*/\\s.]*?=[a-zA-Z0-9_^{}()'|\\\\+\\-*/\\s.]+?)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'gi');

const testStrings = [
  `If a curve y=f(x), passing through the point (1,2), is the solution of the differential equation, 2x^{2} dy=(2xy+y^{2}) \\, dx, then f( 1/2 ) is equal to :`,
  `If x^{3} dy+xy \\, dx=x^{2} dy+2y \\, dx,y(2)=e and x > 1 , then y(4) is equal to:`,
  `Let y=f(x) be the solution of the differential equation y(x+1) \\, dx-x^{2} dy=0,y(1)=e. Then \\lim_{x\\to 0^+} f(x) is equal to`,
  `If the function \nf(x)={■(1/x log_e⁡((1+x/a)/(1-x/b))&,x<0 @k&,x=0@(cos^2⁡x-sin^2⁡x-1)/(√(x^2+1)-1)&,x>0)┤   is continuous at x=0 , then 1/a+1/b+4/k is equal to : \n                                                              [JEE Main 2021 (Online) 31st August Morning Slot]\n(1)\t-5\t(2)\t5\t(3)\t-4\t(4)\t4`
];

for (let i = 0; i < testStrings.length; i++) {
  const s = testStrings[i];
  console.log(`\nTesting string ${i+1}...`);
  const t0 = Date.now();
  const res = s.replace(diffEqRegex, (m) => `[MATCH: ${m}]`);
  console.log(`Took ${Date.now() - t0}ms`);
  console.log(res);
}

