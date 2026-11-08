let s = `2x\\exp\\{ \\frac{x^{3}-\\tan^{-1}x^{3}}{\\sqrt{1+x^{6}}} \\} pass through the origin`;
s = s.replace(/\\?exp\s*\\?\{([\s\S]*?)\\?\}(?=\s+(?:pass|through|origin|is|equal|where|then|and)\b|[,;.]|$)/gi, (m, inner) => {
  const cleanInner = inner.replace(/\\frac\b/g, '\\dfrac');
  return `\\exp\\left\\{${cleanInner.trim()}\\right\\}`;
});
console.log('Result:', s);
