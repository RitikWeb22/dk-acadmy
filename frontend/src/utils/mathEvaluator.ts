/**
 * Pure Mathematical Arithmetic Evaluator
 * Fully CSP-compliant (does NOT use eval() or new Function())
 * Supports: +, -, *, /, ^, parentheses, decimals, unary minus, and live parsing
 */

export interface MathEvalResult {
  success: boolean;
  result?: number;
  formatted?: string;
  error?: string;
}

export function evaluateArithmeticExpression(rawExpr: string): MathEvalResult {
  if (!rawExpr || !rawExpr.trim()) {
    return { success: false, error: 'Empty' };
  }

  // Normalize operators
  const sanitized = rawExpr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/,/g, '')
    .replace(/\s+/g, '');

  if (!sanitized) {
    return { success: false, error: 'Empty' };
  }

  // Tokenize
  const tokens: (number | string)[] = [];
  let i = 0;
  let expectUnary = true;

  while (i < sanitized.length) {
    const ch = sanitized[i];

    if (ch === '+' || ch === '*' || ch === '/' || ch === '^' || ch === '(') {
      tokens.push(ch);
      expectUnary = true;
      i++;
    } else if (ch === ')') {
      tokens.push(ch);
      expectUnary = false;
      i++;
    } else if (ch === '-') {
      if (expectUnary) {
        // Look ahead to see if followed by digits or decimal
        let numStr = '-';
        i++;
        while (i < sanitized.length && /[0-9.]/.test(sanitized[i])) {
          numStr += sanitized[i];
          i++;
        }
        if (numStr === '-') {
          // Unary minus before parenthesis e.g. -(5 + 2)
          tokens.push(-1);
          tokens.push('*');
          expectUnary = true;
        } else {
          const val = parseFloat(numStr);
          if (isNaN(val)) return { success: false, error: 'Invalid number' };
          tokens.push(val);
          expectUnary = false;
        }
      } else {
        tokens.push('-');
        expectUnary = true;
        i++;
      }
    } else if (/[0-9.]/.test(ch)) {
      let numStr = '';
      while (i < sanitized.length && /[0-9.]/.test(sanitized[i])) {
        numStr += sanitized[i];
        i++;
      }
      const val = parseFloat(numStr);
      if (isNaN(val)) return { success: false, error: 'Invalid number' };
      tokens.push(val);
      expectUnary = false;
    } else {
      return { success: false, error: `Invalid symbol: ${ch}` };
    }
  }

  // Operator precedence map
  const precedence: Record<string, number> = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    '^': 3
  };

  const values: number[] = [];
  const ops: string[] = [];

  const applyTopOp = (): boolean => {
    if (ops.length === 0 || values.length < 2) return false;
    const op = ops.pop()!;
    const b = values.pop()!;
    const a = values.pop()!;
    let res = 0;
    if (op === '+') res = a + b;
    else if (op === '-') res = a - b;
    else if (op === '*') res = a * b;
    else if (op === '/') {
      if (b === 0) return false; // Division by zero
      res = a / b;
    } else if (op === '^') {
      res = Math.pow(a, b);
    }
    values.push(res);
    return true;
  };

  for (let j = 0; j < tokens.length; j++) {
    const t = tokens[j];
    if (typeof t === 'number') {
      values.push(t);
    } else if (t === '(') {
      ops.push(t);
    } else if (t === ')') {
      while (ops.length > 0 && ops[ops.length - 1] !== '(') {
        if (!applyTopOp()) return { success: false, error: 'Math error' };
      }
      if (ops.length === 0 || ops[ops.length - 1] !== '(') {
        return { success: false, error: 'Parentheses mismatch' };
      }
      ops.pop(); // Remove '('
    } else if (t in precedence) {
      while (
        ops.length > 0 &&
        ops[ops.length - 1] !== '(' &&
        precedence[ops[ops.length - 1]] >= precedence[t]
      ) {
        if (!applyTopOp()) return { success: false, error: 'Math error' };
      }
      ops.push(t);
    }
  }

  while (ops.length > 0) {
    if (ops[ops.length - 1] === '(' || ops[ops.length - 1] === ')') {
      return { success: false, error: 'Parentheses mismatch' };
    }
    if (!applyTopOp()) return { success: false, error: 'Math error' };
  }

  if (values.length !== 1 || isNaN(values[0]) || !isFinite(values[0])) {
    return { success: false, error: 'Incomplete expression' };
  }

  const rawVal = values[0];
  const rounded = Math.round(rawVal * 1000000) / 1000000;

  return {
    success: true,
    result: rounded,
    formatted: String(rounded)
  };
}

