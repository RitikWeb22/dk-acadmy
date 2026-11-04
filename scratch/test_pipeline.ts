import { convertAllFractions } from '../frontend/src/utils/questionBulkParser.ts';

// Let's test enhanced convertAllFractions
function enhancedConvertAllFractions(input: string): string {
  let str = input;
  let changed = true;
  let iterations = 0;

  while (changed && iterations < 20) {
    changed = false;
    iterations++;

    for (let i = 0; i < str.length; i++) {
      if (str[i] === '/' && (i === 0 || str[i - 1] !== '\\')) {
        let leftEnd = i - 1;
        while (leftEnd >= 0 && /\s/.test(str[leftEnd])) leftEnd--;
        if (leftEnd < 0) continue;

        let leftStart = -1;
        if (str[leftEnd] === ')' || str[leftEnd] === '}') {
          const closeChar = str[leftEnd];
          const openChar = closeChar === ')' ? '(' : '{';
          let depth = 0;
          let p = leftEnd;
          while (p >= 0) {
            if (str[p] === closeChar) depth++;
            else if (str[p] === openChar) {
              depth--;
              if (depth === 0) {
                leftStart = p;
                // Check if preceded by a LaTeX command like \cos(...) or a coefficient like 16(...) or -2(...)
                let cmdCheck = p - 1;
                while (cmdCheck >= 0 && /\s/.test(str[cmdCheck])) cmdCheck--;
                const tokenEnd = cmdCheck;
                while (cmdCheck >= 0 && /[a-zA-Z0-9]/.test(str[cmdCheck])) cmdCheck--;
                if (cmdCheck >= 0 && str[cmdCheck] === '\\') {
                  leftStart = cmdCheck;
                } else if (tokenEnd >= cmdCheck + 1 && /^[0-9]+$/.test(str.substring(cmdCheck + 1, tokenEnd + 1))) {
                  leftStart = cmdCheck + 1;
                  if (leftStart > 0 && (str[leftStart - 1] === '-' || str[leftStart - 1] === '+') && (leftStart === 1 || /[\s=(]/.test(str[leftStart - 2]))) {
                    leftStart--;
                  }
                }
                break;
              }
            }
            p--;
          }
        } else {
          let p = leftEnd;
          while (p >= 0 && /[a-zA-Z0-9]/.test(str[p])) p--;
          if (p >= 0 && str[p] === '\\') p--;
          leftStart = p + 1;
        }

        if (leftStart < 0 || leftStart > leftEnd) continue;

        let rightStart = i + 1;
        while (rightStart < str.length && /\s/.test(str[rightStart])) rightStart++;
        if (rightStart >= str.length) continue;

        let rightEnd = -1;
        if (str[rightStart] === '(' || str[rightStart] === '{') {
          const openChar = str[rightStart];
          const closeChar = openChar === '(' ? ')' : '}';
          let depth = 0;
          let p = rightStart;
          while (p < str.length) {
            if (str[p] === openChar) depth++;
            else if (str[p] === closeChar) {
              depth--;
              if (depth === 0) {
                rightEnd = p;
                if (p + 1 < str.length && str[p + 1] === '^') {
                  let expP = p + 2;
                  if (str[expP] === '{') {
                    let expDepth = 0;
                    while (expP < str.length) {
                      if (str[expP] === '{') expDepth++;
                      else if (str[expP] === '}') {
                        expDepth--;
                        if (expDepth === 0) { rightEnd = expP; break; }
                      }
                      expP++;
                    }
                  } else if (/[0-9a-zA-Z]/.test(str[expP])) {
                    rightEnd = expP;
                  }
                }
                break;
              }
            }
            p++;
          }
        } else {
          let p = rightStart;
          if (str[p] === '\\') {
            p++;
            while (p < str.length && /[a-zA-Z]/.test(str[p])) p++;
          } else {
            while (p < str.length && /[a-zA-Z0-9]/.test(str[p])) p++;
          }
          rightEnd = p - 1;
        }

        if (rightEnd < rightStart) continue;

        let num = str.substring(leftStart, leftEnd + 1).trim();
        let den = str.substring(rightStart, rightEnd + 1).trim();

        if (num.startsWith('(') && num.endsWith(')')) {
          let inner = num.slice(1, -1).trim();
          let d = 0, bal = true;
          for (let c of inner) {
            if (c === '(') d++;
            else if (c === ')') { d--; if (d < 0) { bal = false; break; } }
          }
          if (bal && d === 0) num = inner;
        }

        if (den.startsWith('(') && den.endsWith(')') && !den.includes('^')) {
          let inner = den.slice(1, -1).trim();
          let d = 0, bal = true;
          for (let c of inner) {
            if (c === '(') d++;
            else if (c === ')') { d--; if (d < 0) { bal = false; break; } }
          }
          if (bal && d === 0) den = inner;
        }

        const frac = `\\frac{${num}}{${den}}`;
        str = str.substring(0, leftStart) + frac + str.substring(rightEnd + 1);
        changed = true;
        break;
      }
    }
  }

  return str;
}

const test = `16(1-cos(2+x-2x^2 ))/((1-ax)^2 )`;
console.log('Original:', test);
console.log('Converted:', enhancedConvertAllFractions(test));

