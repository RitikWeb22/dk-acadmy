const singleAtom = '(?:-?\\s*(?:[0-9]*\\s*\\\\[a-zA-Z]+(?:\\{[^}]*\\}|_(?:\\{[^}]*\\}|[0-9a-zA-Z]+)|\\^(?:\\{[^}]*\\}|[0-9a-zA-Z]+))*(?:\\s*[0-9a-zA-Z])?|(?<![a-zA-Z])[0-9]*\\s*[a-zA-Z](?![a-zA-Z])(?:_(?:\\{[^}]*\\}|[0-9a-zA-Z]+)|\\^(?:\\{[^}]*\\}|[0-9a-zA-Z]+))*|\\([^()\\n]{1,80}\\)|\\[[^\\[\\]\\n]{1,80}\\]|\\|[^|\\n]{1,80}\\|(?:\\^[0-9a-zA-Z]+|\\^\\{[^}]+\\})?|[0-9]+(?:\\.[0-9]+)?))';
const mathOp = '(?:[=+\\-−*/×⋅<>]|\\\\in\\b|\\\\ge\\b|\\\\le\\b|\\\\neq\\b|\\\\pm\\b|\\\\cdot|\\\\times)';
const compoundMath = new RegExp(`(?<![a-zA-Z0-9_\\$])(${singleAtom}\\s*${mathOp}\\s*${singleAtom}(?:\\s*${mathOp}\\s*${singleAtom}){0,6})(?![a-zA-Z0-9_\\$])`, 'g');

const text = String.raw`then \alpha+\beta is equal to`;
const m = compoundMath.exec(text);
console.log('Match for compoundMath:', m ? m[0] : 'NONE');

