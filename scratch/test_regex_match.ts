const text = String.raw`\lim_{x \to \frac{1}{a}} \frac{16(1-\cos(2+x-2x^{2}))}{(1-ax)^{2}} = \alpha+\beta\sqrt{17}, where \alpha,\beta\in \mathbb{Z}`;

const limitEqRegex = /(?<![a-zA-Z0-9_\$])(\\(?:lim|sum|prod)(?:_\{[^{}]+\}|_[0-9a-zA-Z]+|\^\{[^{}]+\}|\^[0-9a-zA-Z]+)*\s*[\s\S]+?=\s*[^,;.\n]+?)(?=\s*[,;.]|\s+(?:and|if|then|where|when|for)\b|$)/g;

const match = limitEqRegex.exec(text);
console.log('Match found:', match ? match[1] : 'NONE');

