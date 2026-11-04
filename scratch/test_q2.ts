let q2 = `Let a>0 be a root of the equation 2x^2+x-2=0. If lim_(x→1/a) 16(1-cos⁡(2+x-2x^2 ))/((1-ax)^2 )=α+β√17, where α,β∈Z, then α+β is equal to`;

// Greek letter conversion
q2 = q2.replace(/α/g, '\\alpha')
       .replace(/β/g, '\\beta')
       .replace(/∈\s*Z\b/g, '\\in \\mathbb{Z}')
       .replace(/∈/g, '\\in ');

console.log('Q2 with Greek:', q2);

