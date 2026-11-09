const s = "Then, y(e) is equal toA -3eB -32eC -23e JEE Main 2024 (Online) 6th April Morning ShiftD -2e";

const res = s.replace(/(?<=\bto|\bis\s*:|[:=_\-])\s*(A)(?=\s+[-+]?[0-9a-zA-Z\u0370-\u03FF\\(])/gi, '\n(A) ');
console.log('Result:\n', res);

const checkArea = "Then the area enclosed by the curve";
console.log('Area check:\n', checkArea.replace(/(?<=\bto|\bis\s*:|[:=_\-])\s*(A)(?=\s+[-+]?[0-9a-zA-Z\u0370-\u03FF\\(])/gi, '\n(A) '));
