let s = `-(3x^{5} \\tan^{-1}(x^3))/(1+x^{6})^{\\frac{3}{2}} y=2x\\exp\\{ \\frac{x^{3}-\\tan^{-1}x^{3}}{\\sqrt{1+x^{6}}} \\}`;

// Fraction with power on denominator
s = s.replace(/\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*\(((?:[^()\n]|\([^()\n]*\))+?)\)\^(\{?[^{}\s]+\}?|\\(?:d?frac)\{[^{}]+\}\{[^{}]+\})/g, '\\dfrac{$1}{($2)^{$3}}');
// Fraction without power
s = s.replace(/\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*\(((?:[^()\n]|\([^()\n]*\))+?)\)/g, '\\dfrac{$1}{$2}');

console.log('Result:', s);

