import { extractExamTagSafely, preformatDocxOptions, normalizeDocxMath } from '../frontend/src/utils/wordPasteParser';
import { normalizeMathString, normalizeOptionMath } from '../frontend/src/utils/mathImportRenderSystem/pasteHandler';

// Let's test Question 100, Question 102, and Question 1 with the safe pipeline:
const q100 = `100 . If y=y(x) is the solution of the differential equation 1+ e 2 x dy dx +2 1+ y 2 e x =0 and y(0)=0 , then 6 y ' (0)+ y log e ⁡ 3 2 is equal to (A) 2 JEE Main 2022 (Online) 29th June Evening Shift ( B ) -2 ( C ) -4 ( D ) -1`;

console.log('--- Original ---');
console.log(q100);

// 1. Normalize docx math artifacts (dydx, invisible chars, etc.)
let t100 = normalizeDocxMath(q100);
console.log('\n--- normalizeDocxMath ---');
console.log(t100);

// 2. Extract exam tag safely
const { text: withoutExam, examTag } = extractExamTagSafely(t100);
console.log('\n--- Exam Tag ---:', examTag);
console.log('--- Without Exam ---:', withoutExam);

// 3. Preformat docx options
const preformatted = preformatDocxOptions(withoutExam);
console.log('\n--- Preformatted ---:');
console.log(preformatted);

