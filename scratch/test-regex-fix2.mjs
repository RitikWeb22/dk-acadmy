let eq = "be the solution of the differential equation y(x+1) dx-x^{2} dy=0";
const m = eq.match(/^(.*?\b(?:differential\s+equation|solution\s+curve|equation|curve)\s*[:,]?\s*)(.+)$/i);
console.log('Match found?');
if (m) {
  console.log('Lead part:', m[1]);
  console.log('Math part:', m[2]);
} else {
  console.log('No match');
}

