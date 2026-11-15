/**
 * LaTeX Validation & Confidence System (Layer F)
 * Production-ready validation, diagnostics, and confidence scoring.
 */

import katex from 'katex';
import type { ValidationReport, ConversionFailureDiagnosis } from './types.js';

// ============================================================================
// Helper Utilities & Scanning Primitives
// ============================================================================

/**
 * Checks whether the character at index `pos` in `text` is escaped
 * by counting consecutive backslashes preceding it.
 * An odd number of preceding backslashes means the character is escaped.
 */
function isEscaped(text: string, pos: number): boolean {
  let backslashCount = 0;
  for (let i = pos - 1; i >= 0 && text[i] === '\\'; i--) {
    backslashCount++;
  }
  return (backslashCount % 2) === 1;
}

/**
 * Skips whitespace characters starting from index `pos`.
 */
function skipWhitespace(text: string, pos: number): number {
  while (pos < text.length && /\s/.test(text[pos])) {
    pos++;
  }
  return pos;
}

/**
 * Masks LaTeX comments (`% ... \n`), inline `\verb` / `\verb*` commands,
 * and verbatim environments (`verbatim`, `verbatim*`, `lstlisting`, `minted`)
 * with spaces while strictly preserving string length and newline positions.
 *
 * This ensures all structural validators (braces, environments, \left/\right,
 * fractions, radicals) ignore commented or verbatim tokens while index slices
 * into `rawText` continue to return accurate diagnostic snippets.
 */
function maskCommentsAndVerbatim(
  rawText: string,
  errors: string[],
  uncertainRegions: string[]
): string {
  const chars = rawText.split('');
  const len = chars.length;
  let i = 0;

  const maskRange = (start: number, end: number): void => {
    for (let k = start; k < end && k < len; k++) {
      if (chars[k] !== '\n' && chars[k] !== '\r') {
        chars[k] = ' ';
      }
    }
  };

  while (i < len) {
    // 1. Unescaped '%' starts a line comment until '\n' or '\r'
    if (chars[i] === '%' && !isEscaped(rawText, i)) {
      let end = i;
      while (end < len && chars[end] !== '\n' && chars[end] !== '\r') {
        end++;
      }
      maskRange(i, end);
      i = end;
      continue;
    }

    // 2. Check for unescaped backslash commands (\verb or \begin{verbatim})
    if (chars[i] === '\\' && !isEscaped(rawText, i)) {
      const rest = rawText.slice(i);

      // 2a. Inline \verb* or \verb
      const verbMatch = rest.match(/^\\verb(\*?)(?![a-zA-Z])/);
      if (verbMatch) {
        const cmdLen = verbMatch[0].length;
        const delimPos = i + cmdLen;

        if (delimPos >= len || chars[delimPos] === '\n' || chars[delimPos] === '\r') {
          errors.push('Missing delimiter or argument for \\verb');
          uncertainRegions.push(rawText.slice(i, Math.min(len, i + 15)).trim());
          maskRange(i, delimPos);
          i = delimPos;
          continue;
        }

        const delimChar = chars[delimPos];
        // In LaTeX, \verb without '*' cannot use space as a delimiter
        if (verbMatch[1] === '' && /\s/.test(delimChar)) {
          errors.push('Missing delimiter for \\verb');
          uncertainRegions.push(rawText.slice(i, Math.min(len, delimPos + 5)).trim());
          maskRange(i, delimPos);
          i = delimPos;
          continue;
        }

        let closePos = delimPos + 1;
        while (
          closePos < len &&
          chars[closePos] !== delimChar &&
          chars[closePos] !== '\n' &&
          chars[closePos] !== '\r'
        ) {
          closePos++;
        }

        if (closePos < len && chars[closePos] === delimChar) {
          maskRange(i, closePos + 1);
          i = closePos + 1;
          continue;
        } else {
          errors.push(`Unclosed \\verb${verbMatch[1]} delimiter "${delimChar}"`);
          uncertainRegions.push(rawText.slice(i, closePos).trim());
          maskRange(i, closePos);
          i = closePos;
          continue;
        }
      }

      // 2b. Verbatim environments: \begin{verbatim}, \begin{verbatim*}, \begin{lstlisting}, \begin{minted}
      const beginVerbMatch = rest.match(
        /^\\begin\s*\{(verbatim\*?|lstlisting|minted)\}/
      );
      if (beginVerbMatch) {
        const envName = beginVerbMatch[1];
        const envNameEscaped = envName.replace(/\*/g, '\\*');
        const endRegex = new RegExp(`\\\\end\\s*\\{${envNameEscaped}\\}`);
        const afterBeginPos = i + beginVerbMatch[0].length;
        const afterBeginRest = rawText.slice(afterBeginPos);
        const endMatch = endRegex.exec(afterBeginRest);

        if (endMatch) {
          const endBlockPos = afterBeginPos + endMatch.index + endMatch[0].length;
          maskRange(i, endBlockPos);
          i = endBlockPos;
          continue;
        } else {
          errors.push(`Unclosed LaTeX environment: \\begin{${envName}}`);
          uncertainRegions.push(
            rawText.slice(i, Math.min(len, i + 25)).trim()
          );
          maskRange(i, len);
          i = len;
          continue;
        }
      }
    }

    i++;
  }

  return chars.join('');
}

/**
 * Scans a mandatory brace-enclosed argument `{...}` starting at or after `startPos`.
 * Returns the inner content, start index of `{`, end index after `}`, or null if missing/unclosed.
 */
function scanBracedGroup(
  text: string,
  startPos: number
): { content: string; start: number; end: number } | null {
  const openPos = skipWhitespace(text, startPos);
  if (openPos >= text.length || text[openPos] !== '{' || isEscaped(text, openPos)) {
    return null;
  }

  let depth = 1;
  let i = openPos + 1;
  while (i < text.length) {
    if (!isEscaped(text, i)) {
      if (text[i] === '{') {
        depth++;
      } else if (text[i] === '}') {
        depth--;
        if (depth === 0) {
          return {
            content: text.slice(openPos + 1, i),
            start: openPos,
            end: i + 1
          };
        }
      }
    }
    i++;
  }

  // Unclosed brace group
  return null;
}

/**
 * Scans an optional bracket-enclosed argument `[...]` starting at or after `startPos`.
 */
function scanBracketedGroup(
  text: string,
  startPos: number
): { content: string; start: number; end: number } | null {
  const openPos = skipWhitespace(text, startPos);
  if (openPos >= text.length || text[openPos] !== '[' || isEscaped(text, openPos)) {
    return null;
  }

  let depth = 1;
  let i = openPos + 1;
  while (i < text.length) {
    if (!isEscaped(text, i)) {
      if (text[i] === '[') {
        depth++;
      } else if (text[i] === ']') {
        depth--;
        if (depth === 0) {
          return {
            content: text.slice(openPos + 1, i),
            start: openPos,
            end: i + 1
          };
        }
      }
    }
    i++;
  }

  return null;
}

/**
 * Supported named LaTeX delimiter commands after `\left` or `\right`.
 */
const VALID_NAMED_DELIMITERS = new Set([
  'langle', 'rangle',
  'lfloor', 'rfloor',
  'lceil', 'rceil',
  'vert', 'Vert',
  'lvert', 'rvert',
  'lVert', 'rVert',
  'backslash',
  'uparrow', 'downarrow', 'updownarrow',
  'Uparrow', 'Downarrow', 'Updownarrow',
  'lgroup', 'rgroup',
  'lmoustache', 'rmoustache'
]);

const VALID_ESCAPED_SYMBOL_DELIMITERS = new Set(['{', '}', '|', '[', ']', '/']);
const VALID_SINGLE_CHAR_DELIMITERS = new Set(['(', ')', '[', ']', '|', '.', '/', '<', '>']);

/**
 * Parses a LaTeX delimiter token immediately following `\left` or `\right` at `posAfterKeyword`.
 * Uses explicit character inspection rather than fragile regex classes.
 */
function parseDelimiter(
  text: string,
  posAfterKeyword: number
): { delimiter: string; endPos: number } | null {
  const delimStart = skipWhitespace(text, posAfterKeyword);
  if (delimStart >= text.length) {
    return null;
  }

  // Case 1: Escaped symbol or named command starting with '\'
  if (text[delimStart] === '\\') {
    const nextIdx = delimStart + 1;
    if (nextIdx >= text.length) {
      return null;
    }

    const nextChar = text[nextIdx];

    // Escaped single-character symbol like \{, \}, \|
    if (VALID_ESCAPED_SYMBOL_DELIMITERS.has(nextChar)) {
      return {
        delimiter: '\\' + nextChar,
        endPos: nextIdx + 1
      };
    }

    // Named alphabetic command like \langle, \vert, \backslash
    if (/[a-zA-Z]/.test(nextChar)) {
      let endIdx = nextIdx + 1;
      while (endIdx < text.length && /[a-zA-Z]/.test(text[endIdx])) {
        endIdx++;
      }
      const cmdName = text.slice(nextIdx, endIdx);
      if (VALID_NAMED_DELIMITERS.has(cmdName)) {
        return {
          delimiter: '\\' + cmdName,
          endPos: endIdx
        };
      }
    }

    return null;
  }

  // Case 2: Single-character delimiter like (, ), [, ], |, ., /, <, >
  const ch = text[delimStart];
  if (VALID_SINGLE_CHAR_DELIMITERS.has(ch)) {
    return {
      delimiter: ch,
      endPos: delimStart + 1
    };
  }

  return null;
}

/**
 * Delimiter Structural Compatibility Policy:
 * Validates structural pairing without inspecting or guessing the mathematical semantics
 * of the enclosed expression:
 * 1. Null delimiter `.` matches any valid opposite delimiter (e.g., `\left. ... \right|`).
 * 2. Symmetric pairs match: `()`, `[]`, `\{\}`, `<>`, `\langle\rangle`, `\lfloor\rfloor`,
 *    `\lceil\rceil`, `\lgroup\rgroup`, `\lmoustache\rmoustache`.
 * 3. Standard half-open interval combinations match symmetrically in both directions:
 *    - `[` (or `\[`) with `)` (e.g., `\left[a,b\right)`)
 *    - `(` with `]` (or `\]`) (e.g., `\left(a,b\right]`, `\left(x+1\right]`)
 *    - Reversed Bourbaki interval brackets `]` with `[` or `]`, and `[` with `[`
 * 4. Vertical bars match any vertical bar of the same tier:
 *    - Single bars: `|`, `\vert`, `\lvert`, `\rvert`
 *    - Double bars: `\|`, `\Vert`, `\lVert`, `\rVert`
 * 5. Cross-family pairings (such as `\left\{ ... \right]`, `\left\langle ... \right]`,
 *    `\left( ... \right\}`) are rejected as incompatible delimiter families.
 */
function areDelimitersCompatible(leftDelim: string, rightDelim: string): boolean {
  // 1. Blank delimiter '.' is always compatible on either side
  if (leftDelim === '.' || rightDelim === '.') {
    return true;
  }

  // 2. Canonicalize vertical bars and slashes
  const singleBars = new Set(['|', '\\vert', '\\lvert', '\\rvert']);
  const doubleBars = new Set(['\\|', '\\Vert', '\\lVert', '\\rVert']);
  if (singleBars.has(leftDelim) && singleBars.has(rightDelim)) {
    return true;
  }
  if (doubleBars.has(leftDelim) && doubleBars.has(rightDelim)) {
    return true;
  }
  if (
    (leftDelim === '/' && rightDelim === '/') ||
    (leftDelim === '\\/' && rightDelim === '\\/') ||
    (leftDelim === '\\backslash' && rightDelim === '\\backslash')
  ) {
    return true;
  }

  // 3. Structural pairs (including both standard half-open interval forms)
  const compatiblePairs: Record<string, string[]> = {
    '(': [')', ']', '\\]'],
    '[': [']', '\\]', ')', '['],
    '\\[': ['\\]', ']', ')'],
    ']': ['[', ']', ')'],
    '\\{': ['\\}'],
    '<': ['>'],
    '\\langle': ['\\rangle'],
    '\\lfloor': ['\\rfloor'],
    '\\lceil': ['\\rceil'],
    '\\lgroup': ['\\rgroup'],
    '\\lmoustache': ['\\rmoustache']
  };

  const allowedRight = compatiblePairs[leftDelim];
  if (allowedRight && allowedRight.includes(rightDelim)) {
    return true;
  }

  // 4. Arrows match any arrow delimiter
  const arrows = new Set([
    '\\uparrow', '\\downarrow', '\\updownarrow',
    '\\Uparrow', '\\Downarrow', '\\Updownarrow'
  ]);
  if (arrows.has(leftDelim) && arrows.has(rightDelim)) {
    return true;
  }

  return false;
}

// ============================================================================
// Core Validators
// ============================================================================

/**
 * Validates brace parity on masked text while slicing diagnostic snippets from `rawText`.
 */
function validateBraceParity(
  maskedText: string,
  rawText: string,
  errors: string[],
  uncertainRegions: string[]
): void {
  let openBraces = 0;
  for (let i = 0; i < maskedText.length; i++) {
    if (!isEscaped(maskedText, i)) {
      if (maskedText[i] === '{') {
        openBraces++;
      } else if (maskedText[i] === '}') {
        openBraces--;
        if (openBraces < 0) {
          errors.push('Unmatched closing brace "}" detected');
          const snippetStart = Math.max(0, i - 15);
          const snippetEnd = Math.min(rawText.length, i + 16);
          uncertainRegions.push(rawText.slice(snippetStart, snippetEnd).trim());
          return;
        }
      }
    }
  }

  if (openBraces > 0) {
    errors.push(`${openBraces} unclosed opening brace "{" detected`);
    uncertainRegions.push(rawText.slice(Math.max(0, rawText.length - 20)).trim());
  }
}

/**
 * Validates LaTeX \begin{env} ... \end{env} using a stack with lookahead recovery.
 * Preserves outer open environments when an inner environment is left unclosed,
 * avoiding cascading false mismatches.
 */
function validateEnvironments(
  maskedText: string,
  rawText: string,
  errors: string[],
  uncertainRegions: string[]
): void {
  const envRegex = /\\(begin|end)\s*\{([a-zA-Z*]+)\}/g;
  let match: RegExpExecArray | null;
  const stack: Array<{ name: string; index: number }> = [];

  while ((match = envRegex.exec(maskedText)) !== null) {
    if (isEscaped(maskedText, match.index)) {
      continue;
    }

    const type = match[1];
    const envName = match[2];

    if (type === 'begin') {
      stack.push({ name: envName, index: match.index });
    } else {
      if (stack.length === 0) {
        errors.push(`Unexpected \\end{${envName}} without matching \\begin`);
        uncertainRegions.push(rawText.slice(match.index, match.index + match[0].length));
      } else if (stack[stack.length - 1].name === envName) {
        stack.pop();
      } else {
        // Mismatch at top of stack: search deeper in the stack to recover cleanly
        let matchIdx = -1;
        for (let i = stack.length - 2; i >= 0; i--) {
          if (stack[i].name === envName) {
            matchIdx = i;
            break;
          }
        }

        if (matchIdx !== -1) {
          // Everything above matchIdx was left unclosed before this closing tag
          while (stack.length - 1 > matchIdx) {
            const unclosed = stack.pop()!;
            errors.push(
              `Environment nesting mismatch: \\begin{${unclosed.name}} was not closed before \\end{${envName}}`
            );
            uncertainRegions.push(
              rawText.slice(unclosed.index, match.index + match[0].length).trim()
            );
          }
          // Pop the matched outer environment
          stack.pop();
        } else {
          // Check if there is a subsequent \end for top.name in the remaining masked text
          const remainingText = maskedText.slice(match.index + match[0].length);
          const topNameEscaped = stack[stack.length - 1].name.replace(/\*/g, '\\*');
          const hasLaterEndForTop = new RegExp(`\\\\end\\s*\\{${topNameEscaped}\\}`).test(
            remainingText
          );

          if (hasLaterEndForTop) {
            errors.push(
              `Unexpected \\end{${envName}} inside \\begin{${stack[stack.length - 1].name}}`
            );
            uncertainRegions.push(rawText.slice(match.index, match.index + match[0].length));
          } else {
            const top = stack.pop()!;
            errors.push(
              `Environment nesting mismatch: \\begin{${top.name}} closed by \\end{${envName}}`
            );
            uncertainRegions.push(
              rawText.slice(top.index, match.index + match[0].length).trim()
            );
          }
        }
      }
    }
  }

  while (stack.length > 0) {
    const unclosed = stack.pop()!;
    errors.push(`Unclosed LaTeX environment: \\begin{${unclosed.name}}`);
    uncertainRegions.push(
      rawText.slice(unclosed.index, Math.min(rawText.length, unclosed.index + 25)).trim()
    );
  }
}

/**
 * Validates \left and \right delimiter pairing and structural compatibility.
 */
function validateLeftRightDelimiters(
  maskedText: string,
  rawText: string,
  errors: string[],
  warnings: string[],
  uncertainRegions: string[]
): void {
  const lrRegex = /\\(left|right)(?![a-zA-Z])/g;
  let match: RegExpExecArray | null;
  const stack: Array<{ delimiter: string; index: number }> = [];

  while ((match = lrRegex.exec(maskedText)) !== null) {
    if (isEscaped(maskedText, match.index)) {
      continue;
    }

    const type = match[1];
    const delimInfo = parseDelimiter(maskedText, match.index + match[0].length);

    if (!delimInfo) {
      errors.push(`Missing or invalid delimiter following \\${type}`);
      uncertainRegions.push(
        rawText.slice(match.index, Math.min(rawText.length, match.index + 12)).trim()
      );
      continue;
    }

    if (type === 'left') {
      stack.push({ delimiter: delimInfo.delimiter, index: match.index });
    } else {
      if (stack.length === 0) {
        errors.push(`Unexpected \\right delimiter "${delimInfo.delimiter}" without matching \\left`);
        uncertainRegions.push(rawText.slice(match.index, delimInfo.endPos));
      } else {
        const top = stack.pop()!;
        if (!areDelimitersCompatible(top.delimiter, delimInfo.delimiter)) {
          const snippet = rawText.slice(top.index, delimInfo.endPos).trim();
          warnings.push(
            `Incompatible \\left${top.delimiter} and \\right${delimInfo.delimiter} delimiter pair`
          );
          errors.push(
            `Delimiter mismatch: \\left${top.delimiter} paired with \\right${delimInfo.delimiter}`
          );
          uncertainRegions.push(snippet);
        }
      }
    }
  }

  while (stack.length > 0) {
    const unclosed = stack.pop()!;
    const msg = `Unmatched \\left delimiter "${unclosed.delimiter}"`;
    errors.push(msg);
    warnings.push(msg);
    uncertainRegions.push(
      rawText.slice(unclosed.index, Math.min(rawText.length, unclosed.index + 15)).trim()
    );
  }
}

/**
 * Validates fraction commands (\frac, \dfrac, \tfrac) with balanced argument scanning.
 */
function validateFractions(
  maskedText: string,
  rawText: string,
  errors: string[],
  uncertainRegions: string[]
): void {
  const fracRegex = /\\(?:d|t)?frac(?![a-zA-Z])/g;
  let match: RegExpExecArray | null;

  while ((match = fracRegex.exec(maskedText)) !== null) {
    if (isEscaped(maskedText, match.index)) {
      continue;
    }

    const startPos = match.index + match[0].length;
    const numArg = scanBracedGroup(maskedText, startPos);

    if (!numArg) {
      const nextCharPos = skipWhitespace(maskedText, startPos);
      if (nextCharPos < maskedText.length && maskedText[nextCharPos] === '{') {
        // Brace parity already reports this unclosed "{".
      } else {
        errors.push(`Incomplete ${match[0]} lacking numerator`);
      }
      uncertainRegions.push(
        rawText.slice(match.index, Math.min(rawText.length, startPos + 10)).trim()
      );
      continue;
    }

    const denArg = scanBracedGroup(maskedText, numArg.end);
    if (!denArg) {
      const nextCharPos = skipWhitespace(maskedText, numArg.end);
      if (nextCharPos < maskedText.length && maskedText[nextCharPos] === '{') {
        // Brace parity already reports this unclosed "{".
      } else {
        errors.push(`Incomplete ${match[0]} lacking denominator`);
      }
      uncertainRegions.push(
        rawText.slice(match.index, Math.min(rawText.length, numArg.end + 5)).trim()
      );
      continue;
    }

    const num = numArg.content.trim();
    const den = denArg.content.trim();
    const rawNum = rawText.slice(numArg.start + 1, numArg.end - 1).trim();
    const rawDen = rawText.slice(denArg.start + 1, denArg.end - 1).trim();

    if (num.length === 0 && den.length === 0) {
      errors.push(`empty fraction ${match[0]}{}{}`);
      uncertainRegions.push(rawText.slice(match.index, denArg.end));
    } else if (num.length === 0) {
      errors.push(`empty fraction with empty numerator ${match[0]}{}{${rawDen}}`);
      uncertainRegions.push(rawText.slice(match.index, denArg.end));
    } else if (den.length === 0) {
      errors.push(`Incomplete fraction with empty denominator ${match[0]}{${rawNum}}{}`);
      uncertainRegions.push(rawText.slice(match.index, denArg.end));
    }
  }
}

/**
 * Commands that cannot serve as a valid standalone token radicand for an unbraced `\sqrt`.
 */
const STRUCTURAL_LATEX_COMMANDS = new Set([
  'begin', 'end', 'left', 'right', 'frac', 'dfrac', 'tfrac', 'sqrt', 'text', 'mathrm', 'mathbf', 'verb'
]);

/**
 * Validates radical commands (\sqrt) with optional root index (\sqrt[n]{x}).
 * Supports braced radicands (\sqrt{x}), single-token alphanumeric radicands (\sqrt x),
 * and single control-sequence token radicands (\sqrt\alpha, \sqrt\pi).
 */
function validateRadicals(
  maskedText: string,
  rawText: string,
  errors: string[],
  uncertainRegions: string[]
): void {
  const sqrtRegex = /\\sqrt(?![a-zA-Z])/g;
  let match: RegExpExecArray | null;

  while ((match = sqrtRegex.exec(maskedText)) !== null) {
    if (isEscaped(maskedText, match.index)) {
      continue;
    }

    let cursor = match.index + match[0].length;
    const nextCharPos = skipWhitespace(maskedText, cursor);

    // Check for optional index: \sqrt[3]{x}
    if (nextCharPos < maskedText.length && maskedText[nextCharPos] === '[') {
      const optIndex = scanBracketedGroup(maskedText, nextCharPos);
      if (!optIndex) {
        errors.push('Unclosed or malformed optional index bracket in \\sqrt[...]');
        uncertainRegions.push(
          rawText.slice(match.index, Math.min(rawText.length, nextCharPos + 15)).trim()
        );
        continue;
      }
      if (optIndex.content.trim().length === 0) {
        errors.push('Empty optional root index in \\sqrt[]{...}');
        uncertainRegions.push(rawText.slice(match.index, optIndex.end));
      }
      cursor = optIndex.end;
    }

    const radArg = scanBracedGroup(maskedText, cursor);
    if (!radArg) {
      const checkChar = skipWhitespace(maskedText, cursor);
      if (checkChar < maskedText.length && maskedText[checkChar] === '{') {
        errors.push('Unclosed radicand brace in \\sqrt');
        uncertainRegions.push(
          rawText.slice(match.index, Math.min(rawText.length, cursor + 10)).trim()
        );
        continue;
      }

      // Support single alphanumeric token radicand: \sqrt x, \sqrt 2
      if (checkChar < maskedText.length && /[a-zA-Z0-9]/.test(maskedText[checkChar])) {
        continue;
      }

      // Support single control-sequence token radicand: \sqrt\alpha, \sqrt\pi
      if (checkChar < maskedText.length && maskedText[checkChar] === '\\') {
        const cmdMatch = maskedText.slice(checkChar + 1).match(/^([a-zA-Z]+)/);
        if (cmdMatch && !STRUCTURAL_LATEX_COMMANDS.has(cmdMatch[1])) {
          continue;
        }
      }

      errors.push('Missing radicand argument for \\sqrt');
      uncertainRegions.push(
        rawText.slice(match.index, Math.min(rawText.length, cursor + 10)).trim()
      );
      continue;
    }

    if (radArg.content.trim().length === 0) {
      errors.push('Empty radical \\sqrt{}');
      uncertainRegions.push(rawText.slice(match.index, radArg.end));
    }
  }
}

/**
 * Detects Word Equation linear-format tokens and other raw transcription artifacts.
 */
function detectArtifacts(
  text: string,
  warnings: string[],
  uncertainRegions: string[]
): void {
  const artifactSpecs = [
    { regex: /[█┤]/g, label: 'Unconverted Word Equation linear-format token (█, ┤)' },
    { regex: /[┬┴]/g, label: 'Unconverted Word Equation stacked limit token (┬, ┴)' },
    { regex: /@&/g, label: 'Unconverted Word Equation alignment separator (@&)' },
    { regex: /[\uFFFD]/g, label: 'Replacement character artifact' }
  ];

  for (const { regex, label } of artifactSpecs) {
    let match: RegExpExecArray | null;
    let found = false;
    while ((match = regex.exec(text)) !== null) {
      found = true;
      uncertainRegions.push(match[0]);
    }
    if (found) {
      warnings.push(`Possible artifact: ${label}`);
    }
  }
}

/**
 * Detects incomplete or truncated LaTeX commands (trailing backslashes, cutoffs).
 */
function validateIncompleteCommands(
  maskedText: string,
  rawText: string,
  errors: string[],
  uncertainRegions: string[]
): void {
  // Check for trailing backslash at end of expression
  if (/(?:^|[^\\])\\[\s]*$/.test(maskedText)) {
    errors.push('Incomplete LaTeX command: trailing backslash at end of expression');
    uncertainRegions.push(rawText.slice(Math.max(0, rawText.length - 10)).trim());
  }

  // Detect cutoffs / incomplete command tokens (e.g. \sqr , \fra , \dfra , \tbeg )
  const incompleteCmdRegex = /\\(sqr|fra|dfra|tbeg|inft|lims)(?![a-zA-Z])/g;
  let m: RegExpExecArray | null;
  while ((m = incompleteCmdRegex.exec(maskedText)) !== null) {
    if (!isEscaped(maskedText, m.index)) {
      errors.push(`Incomplete or truncated LaTeX command: \\${m[1]}`);
      uncertainRegions.push(rawText.slice(m.index, Math.min(rawText.length, m.index + 10)).trim());
    }
  }
}

/**
 * Commands that require mandatory arguments.
 */
function validateMissingArguments(
  maskedText: string,
  rawText: string,
  errors: string[],
  uncertainRegions: string[]
): void {
  // Two mandatory braced arguments: \binom, \overset, \underset, \stackrel, \cfrac
  const twoArgRegex = /\\(binom|overset|underset|stackrel|cfrac)(?![a-zA-Z])/g;
  let m: RegExpExecArray | null;
  while ((m = twoArgRegex.exec(maskedText)) !== null) {
    if (isEscaped(maskedText, m.index)) continue;
    const startPos = m.index + m[0].length;
    const arg1 = scanBracedGroup(maskedText, startPos);
    if (!arg1) {
      errors.push(`Missing first argument for \\${m[1]}`);
      uncertainRegions.push(rawText.slice(m.index, Math.min(rawText.length, startPos + 10)).trim());
      continue;
    }
    const arg2 = scanBracedGroup(maskedText, arg1.end);
    if (!arg2) {
      errors.push(`Missing second argument for \\${m[1]}`);
      uncertainRegions.push(rawText.slice(m.index, Math.min(rawText.length, arg1.end + 10)).trim());
    }
  }

  // One mandatory braced argument: \mathbf, \mathrm, \mathit, \mathbb, \mathcal, \operatorname, \text
  const oneArgRegex = /\\(mathbf|mathrm|mathit|mathbb|mathcal|operatorname|text)(?![a-zA-Z])/g;
  while ((m = oneArgRegex.exec(maskedText)) !== null) {
    if (isEscaped(maskedText, m.index)) continue;
    const startPos = m.index + m[0].length;
    const arg = scanBracedGroup(maskedText, startPos);
    if (!arg) {
      errors.push(`Missing argument for \\${m[1]}`);
      uncertainRegions.push(rawText.slice(m.index, Math.min(rawText.length, startPos + 10)).trim());
    }
  }
}

/**
 * Commands that are unsupported in KaTeX.
 */
const UNSUPPORTED_KATEX_COMMANDS = new Set([
  'label', 'ref', 'cite', 'pageref', 'footnote', 'footnotetext',
  'usepackage', 'documentclass', 'input', 'include',
  'newcommand', 'renewcommand', 'providecommand', 'def', 'let',
  'tabular', 'minipage', 'parbox', 'makebox', 'framebox',
  'xymatrix', 'tikz', 'tikzpicture', 'pstree', 'pstricks',
  'eqnarray', 'eqnarray*', 'table', 'figure',
  'selectfont', 'fontsize', 'chapter', 'section', 'subsection'
]);

function validateUnsupportedCommands(
  maskedText: string,
  rawText: string,
  errors: string[],
  uncertainRegions: string[]
): void {
  const cmdRegex = /\\([a-zA-Z*]+)/g;
  let m: RegExpExecArray | null;
  while ((m = cmdRegex.exec(maskedText)) !== null) {
    if (isEscaped(maskedText, m.index)) continue;
    const cmdName = m[1];
    if (UNSUPPORTED_KATEX_COMMANDS.has(cmdName)) {
      errors.push(`Unsupported LaTeX command in KaTeX: \\${cmdName}`);
      uncertainRegions.push(rawText.slice(m.index, m.index + m[0].length));
    }
  }
}

/**
 * Validates LaTeX expression with KaTeX without throwing.
 */
export function validateWithKaTeX(
  latex: string,
  isDisplay: boolean = false
): { isValid: boolean; error?: string } {
  if (!latex || !latex.trim()) return { isValid: false, error: 'Empty formula' };
  try {
    let katexModule: any = (katex as any)?.default || katex;
    if (!katexModule || typeof katexModule.renderToString !== 'function') {
      const g: any = typeof globalThis !== 'undefined' ? globalThis : {};
      katexModule = g.katex || (typeof (globalThis as any).window !== 'undefined' ? (globalThis as any).window.katex : null);
    }

    if (katexModule && typeof katexModule.renderToString === 'function') {
      katexModule.renderToString(latex, {
        displayMode: isDisplay,
        throwOnError: true,
        strict: false
      });
    }
    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, error: err?.message || 'KaTeX validation error' };
  }
}

export function isFormulaValidKaTeX(latex: string, isDisplay: boolean = false): boolean {
  return validateWithKaTeX(latex, isDisplay).isValid;
}

/**
 * Detects and repairs accidental double-escaping (e.g. \\frac -> \frac).
 */
export function detectAndRepairDoubleEscaping(latex: string): {
  hasDoubleEscaping: boolean;
  repaired: string;
  issues: string[];
} {
  if (!latex) return { hasDoubleEscaping: false, repaired: '', issues: [] };
  const issues: string[] = [];

  const mathCmds = new Set([
    'frac', 'dfrac', 'tfrac', 'cfrac', 'sqrt', 'alpha', 'beta', 'gamma', 'delta', 'theta', 'lambda',
    'pi', 'sigma', 'phi', 'omega', 'in', 'notin', 'subset', 'cap', 'cup', 'times', 'div',
    'pm', 'mp', 'le', 'ge', 'ne', 'neq', 'infty', 'to', 'leftarrow', 'rightarrow',
    'sum', 'prod', 'int', 'lim', 'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln',
    'exp', 'left', 'right', 'mathbf', 'mathrm', 'text', 'mathbb', 'binom'
  ]);

  let hasDoubleEscaping = false;
  const repaired = latex.replace(/(?<!\\)\\\\([a-zA-Z]+)(?![a-zA-Z])/g, (match, cmd) => {
    if (mathCmds.has(cmd.toLowerCase())) {
      hasDoubleEscaping = true;
      issues.push(`Accidental double escaping: \\\\${cmd} replaced with \\${cmd}`);
      return `\\${cmd}`;
    }
    return match;
  });

  return { hasDoubleEscaping, repaired, issues };
}

export interface MathSegment {
  type: 'inline' | 'block' | 'text';
  content: string;
  raw: string;
  start: number;
  end: number;
}

/**
 * Extracts inline math ($...$, \(...\)) and block math ($$...$$, \[...\], \begin{...}) separately.
 */
export function extractMathSegments(text: string): MathSegment[] {
  if (!text) return [];
  const segments: MathSegment[] = [];

  const mathRegex = /(\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\\begin\{(equation\*?|align\*?|gather\*?|multline\*?|aligned|cases|matrix|bmatrix|pmatrix|vmatrix)\}([\s\S]*?)\\end\{\4\}|\$([^\$\n]+?)\$|\\\(([\s\S]*?)\\\))/g;

  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      const textSlice = text.slice(lastIdx, match.index);
      if (textSlice.trim().length > 0) {
        segments.push({
          type: 'text',
          content: textSlice,
          raw: textSlice,
          start: lastIdx,
          end: match.index
        });
      }
    }

    const fullMatch = match[0];
    const isBlock = fullMatch.startsWith('$$') || fullMatch.startsWith('\\[') || fullMatch.startsWith('\\begin{');
    const content = match[2] ?? match[3] ?? match[5] ?? match[6] ?? match[7] ?? '';

    segments.push({
      type: isBlock ? 'block' : 'inline',
      content: content.trim(),
      raw: fullMatch,
      start: match.index,
      end: match.index + fullMatch.length
    });

    lastIdx = match.index + fullMatch.length;
  }

  if (lastIdx < text.length) {
    const tail = text.slice(lastIdx);
    if (tail.trim().length > 0) {
      segments.push({
        type: 'text',
        content: tail,
        raw: tail,
        start: lastIdx,
        end: text.length
      });
    }
  }

  return segments;
}

/**
 * Returns true if text is purely a LaTeX formula with minimal or no English prose words.
 */
function isPureLatexFormula(text: string): boolean {
  if (!text || text.includes('$')) return false;
  const hasLatexCmd = /\\(?:frac|dfrac|lim|int|sum|prod|sqrt|vec|hat|left|right|begin|binom|matrix|cases|alpha|beta|gamma|delta|theta|lambda|pi|sigma|phi|omega|infty|to|cdot|times|leq|geq|neq|in|mathbb|text)\b/.test(text);
  if (!hasLatexCmd) return false;
  const stripped = text.replace(/\\[a-zA-Z]+/g, ' ');
  const words = stripped.match(/\b[a-zA-Z]{4,}\b/g) || [];
  const mathKeywords = new Set(['sqrt','frac','dfrac','left','right','lim','int','sum','prod','infty','cdot','times','leq','geq','neq','text','mathbb','begin','cases','binom','matrix','alpha','beta','gamma','delta','theta','lambda','sigma','omega','phi','quad','qquad']);
  const proseWords = words.filter(w => !mathKeywords.has(w.toLowerCase()));
  return proseWords.length < 2;
}

/**
 * Separately validates inline and block math segments within a document or question string.
 */
export function validateMathExpressionsSeparately(text: string): {
  inlineSegments: MathSegment[];
  blockSegments: MathSegment[];
  textSegments: MathSegment[];
  allValid: boolean;
  reports: ValidationReport[];
} {
  const segments = extractMathSegments(text);
  const inlineSegments = segments.filter(s => s.type === 'inline');
  const blockSegments = segments.filter(s => s.type === 'block');
  const textSegments = segments.filter(s => s.type === 'text');

  const reports: ValidationReport[] = [];
  let allValid = true;

  for (const seg of [...inlineSegments, ...blockSegments]) {
    const rep = validateLatex(seg.content);
    const kv = validateWithKaTeX(seg.content, seg.type === 'block');
    if (!kv.isValid && kv.error) {
      rep.isValid = false;
      rep.errors.push(`KaTeX syntax error: ${kv.error}`);
    }
    if (!rep.isValid) allValid = false;
    reports.push(rep);
  }

  return {
    inlineSegments,
    blockSegments,
    textSegments,
    allValid,
    reports
  };
}

/**
 * Diagnoses a mathematical conversion failure while preserving original equation data.
 */
export function diagnoseMathematicalConversionFailure(
  rawEquation: string,
  convertedLatex?: string,
  context?: {
    questionId?: string;
    qNum?: number;
    expressionIndex?: number;
  }
): ConversionFailureDiagnosis {
  const errors: string[] = [];
  const warnings: string[] = [];
  let canRetry = true;
  let retrySuggestedFix: string | undefined;

  if (!rawEquation || !rawEquation.trim()) {
    errors.push('No mathematical equation data available');
    canRetry = false;
  } else {
    const report = validateLatex(convertedLatex || rawEquation);
    errors.push(...report.errors);
    warnings.push(...report.warnings);

    if (errors.some(e => e.includes('delimiter') || e.includes('\\right') || e.includes('\\left'))) {
      retrySuggestedFix = 'Sanitize and balance delimiters with \\left( ... \\right)';
    } else if (errors.some(e => e.includes('brace') || e.includes('{'))) {
      retrySuggestedFix = 'Re-balance grouping curly braces';
    } else if (errors.some(e => e.includes('fraction') || e.includes('\\frac'))) {
      retrySuggestedFix = 'Reconstruct missing fraction numerator or denominator';
    } else if (errors.some(e => e.includes('radical') || e.includes('\\sqrt'))) {
      retrySuggestedFix = 'Wrap radicand in explicit braces \\sqrt{...}';
    }
  }

  return {
    questionId: context?.questionId,
    qNum: context?.qNum,
    expressionIndex: context?.expressionIndex,
    rawEquation: rawEquation || '',
    convertedLatex,
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings)),
    canRetry,
    retrySuggestedFix
  };
}

// ============================================================================
// Deterministic Confidence Scoring
// ============================================================================

/**
 * Computes deterministic, explainable confidence score in [0.0, 1.0].
 *
 * Scoring Strategy:
 * - Base score: 1.0.
 * - Deduplicate errors, warnings, and uncertain regions before penalty computation.
 * - Serious structural errors: -0.22 per distinct error message.
 * - Warnings (formatting/ambiguities/artifacts): -0.06 per distinct warning.
 * - Uncertain regions: -0.04 per distinct region.
 * - If errors exist, maximum permitted confidence is capped at 0.45.
 * - Minimum score is bounded at 0.05 (empty input is explicitly 0.0).
 */
function computeConfidence(
  errors: string[],
  warnings: string[],
  uncertainRegions: string[]
): number {
  const uniqueErrors = Array.from(new Set(errors));
  const uniqueWarnings = Array.from(new Set(warnings));
  const uniqueUncertain = Array.from(new Set(uncertainRegions));

  let score = 1.0;
  score -= uniqueErrors.length * 0.22;
  score -= uniqueWarnings.length * 0.06;
  score -= uniqueUncertain.length * 0.04;

  if (uniqueErrors.length > 0) {
    score = Math.min(score, 0.45);
  }

  score = Math.max(0.05, Math.min(1.0, Math.round(score * 100) / 100));
  return score;
}

// ============================================================================
// Public API Implementations
// ============================================================================

/**
 * Validates reconstructed mathematical LaTeX and diagnostics.
 * Preserves the exact public signature and ValidationReport shape.
 */
export function validateLatex(input: string): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const uncertainRegions: string[] = [];

  if (!input || input.trim().length === 0) {
    return {
      isValid: false,
      confidence: 0,
      needsReview: true,
      errors: ['Empty mathematical expression'],
      warnings: [],
      uncertainRegions: ['empty']
    };
  }

  const rawText = input.trim();

  // Pre-mask LaTeX comments (% ...) and verbatim regions (\verb, verbatim environments)
  // while preserving character indices and line breaks.
  const maskedText = maskCommentsAndVerbatim(rawText, errors, uncertainRegions);

  // 1. Brace parity with multi-escape counting
  validateBraceParity(maskedText, rawText, errors, uncertainRegions);

  // 2. Environment nesting and parity with stack lookahead recovery
  validateEnvironments(maskedText, rawText, errors, uncertainRegions);

  // 3. Delimiter syntax, balance, and structural compatibility (\left & \right)
  validateLeftRightDelimiters(maskedText, rawText, errors, warnings, uncertainRegions);

  // 4. Balanced fraction parsing
  validateFractions(maskedText, rawText, errors, uncertainRegions);

  // 5. Radical arguments and optional index parsing
  validateRadicals(maskedText, rawText, errors, uncertainRegions);

  // 6. Word Linear & transcription artifact detection
  detectArtifacts(rawText, warnings, uncertainRegions);

  // 7. Missing arguments detection
  validateMissingArguments(maskedText, rawText, errors, uncertainRegions);

  // 8. Incomplete commands detection
  validateIncompleteCommands(maskedText, rawText, errors, uncertainRegions);

  // 9. Unsupported commands detection
  validateUnsupportedCommands(maskedText, rawText, errors, uncertainRegions);

  // 10. Accidental double escaping detection
  const doubleEscapeInfo = detectAndRepairDoubleEscaping(rawText);
  if (doubleEscapeInfo.hasDoubleEscaping) {
    warnings.push(...doubleEscapeInfo.issues);
  }

  // 11. Mathematical KaTeX engine validation
  let katexValid = true;
  const segments = extractMathSegments(rawText);
  const mathSegments = segments.filter(s => s.type !== 'text');

  if (mathSegments.length > 0) {
    for (const seg of mathSegments) {
      const kv = validateWithKaTeX(seg.content, seg.type === 'block');
      if (!kv.isValid && kv.error) {
        katexValid = false;
        errors.push(`KaTeX syntax error: ${kv.error}`);
        uncertainRegions.push(seg.content);
      }
    }
  } else if (isPureLatexFormula(rawText)) {
    const kv = validateWithKaTeX(rawText, false);
    if (!kv.isValid && kv.error) {
      katexValid = false;
      errors.push(`KaTeX syntax error: ${kv.error}`);
      uncertainRegions.push(rawText);
    }
  }

  const confidence = computeConfidence(errors, warnings, uncertainRegions);
  const isValid = errors.length === 0;
  const needsReview = !isValid || confidence < 0.90 || warnings.length > 0 || uncertainRegions.length > 0;

  return {
    isValid,
    confidence,
    needsReview,
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings)),
    uncertainRegions: Array.from(new Set(uncertainRegions)),
    katexValid
  };
}

/**
 * Common prose slash constructs and physical measurement units that should NOT
 * cause an ordinary text option to be classified as a mathematical fraction.
 */
const PROSE_SLASH_CONSTRUCTS_REGEX =
  /\b(?:and\/or|either\/or|w\/o|c\/o|n\/a|a\/c|i\/o|b\/w|s\/o|d\/o|w\/e|yes\/no|true\/false|on\/off|he\/she|his\/her|him\/her)\b/gi;

const COMMON_UNIT_SLASH_REGEX =
  /\b(?:km\/h|km\/hr|km\/s|m\/s|cm\/s|mm\/s|ft\/s|mi\/h|mi\/hr|mph|kg\/m|g\/cm|mg\/L|mol\/L|g\/mol|kg\/L|N\/m|J\/kg|J\/mol|J\/K|W\/m|V\/m|A\/m|C\/m|rad\/s|rev\/min|rpm|bits\/s|bytes\/s|kb\/s|mb\/s|gb\/s|dB\/m|l\/km|km\/l)\b/gi;

/**
 * Conservative mathematical candidate heuristic for structured MCQ options:
 * - Excludes URLs (`http://`, `https://`, `ftp://`, `www.`) and Windows/Unix file paths.
 * - Recognizes explicit LaTeX commands (`\frac`, `\sqrt`, etc.) and math mode `$`.
 * - Recognizes mathematical superscripts (`^`), Unicode superscripts/subscripts (`x₁`, `x²`),
 *   and mathematical subscripts (`x_1`, `a_{n}`) while excluding `snake_case` identifiers (`user_name`).
 * - Recognizes Greek letters (`α`, `β`, `π`, `Δ`, `Ω`), number-set symbols (`ℝ`, `ℤ`, `ℕ`, `ℚ`, `ℂ`),
 *   and Unicode mathematical operators (`∝`, `∠`, `≡`, `√`, `∫`, `∑`, `∏`, `±`, `≤`, `≥`, `≠`, `∞`, etc.).
 * - Strips calendar dates (`DD/MM/YYYY`), common prose slashes (`and/or`, `w/o`, `c/o`), and standard
 *   measurement units (`km/h`, `m/s`, `mol/L`) before checking for clear mathematical ratios (`1/2`, `3/4`, `x/y`, `a/2`).
 */
function isMathCandidate(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return false;
  }

  // 1. Strip out URLs and common file paths (e.g. C:\path\file or /usr/local/bin)
  const withoutUrlsAndPaths = trimmed
    .replace(/\b(?:https?|ftp):\/\/[^\s]+|\bwww\.[^\s]+/gi, '')
    .replace(/\b[a-zA-Z]:\\[^\s]+/g, '')
    .replace(/(?:^|\s)\/[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)+/g, ' ');

  if (withoutUrlsAndPaths.trim().length === 0) {
    return false;
  }

  // 2. Explicit math mode delimiter or ASCII superscript
  if (withoutUrlsAndPaths.includes('$') || withoutUrlsAndPaths.includes('^')) {
    return true;
  }

  // 3. Recognizable LaTeX command (e.g., \frac, \sqrt, \alpha, \{)
  if (/\\(?:[a-zA-Z]{2,}|[{|[\]()])/.test(withoutUrlsAndPaths)) {
    return true;
  }

  // 4. Mathematical subscript: single letter/digit/closing-delimiter followed by _ and single char/digit or {...}
  //    Excludes ordinary snake_case words like user_name or a_b_c.
  if (
    /(?:^|[^a-zA-Z0-9_])([a-zA-Z0-9}|\])])_(?:\{[^{}]*\}|[0-9a-zA-Z])(?![a-zA-Z0-9_])/.test(
      withoutUrlsAndPaths
    )
  ) {
    return true;
  }

  // 5. Unicode Greek letters (α-ω, Α-Ω), Unicode superscripts/subscripts (⁰-₉),
  //    double-struck sets (ℝ, ℤ, ℕ, ℚ, ℂ), and mathematical operators (∝, ∠, ≡, √, ∫, ∑, etc.)
  if (
    /[\u0370-\u03FF\u2070-\u209F\u00B2\u00B3\u00B9\u2100-\u214F\u2200-\u22FF√∫∑∏±≤≥≠∞≈÷×→⇒⇔∈∉⊂⊆∪∩∂∇°∝∠≡≃≅∼⊥∥∀∃∅ℝℤℕℚℂ]/.test(
      withoutUrlsAndPaths
    )
  ) {
    return true;
  }

  // 6. Clean out calendar dates, prose slash idioms, and standard physical units before testing for mathematical fractions
  const cleanedForFractions = withoutUrlsAndPaths
    .replace(/\b\d{1,4}\s*\/\s*\d{1,2}\s*\/\s*\d{1,4}\b/g, ' ')
    .replace(PROSE_SLASH_CONSTRUCTS_REGEX, ' ')
    .replace(COMMON_UNIT_SLASH_REGEX, ' ');

  // 7. Clear mathematical ratios/fractions: numeric (1/2, 3/4), mixed (a/2, 1/x), or single-letter algebraic (x/y)
  if (
    /(?:^|[^\w/])(?:\d+\s*\/\s*\d+|[a-zA-Z]\s*\/\s*\d+|\d+\s*\/\s*[a-zA-Z]|[a-zA-Z]\s*\/\s*[a-zA-Z])(?![\w/])/.test(
      cleanedForFractions
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Validates a structured question (statement + multiple options).
 * Preserves the exact public signature and returned property types.
 */
export function validateStructuredQuestionLatex(question: {
  qNum?: number;
  statement: string;
  options?: Array<{ key: string; text: string }>;
}): {
  overallConfidence: number;
  needsReview: boolean;
  reasons: string[];
  uncertainRegions: string[];
} {
  const reasons: string[] = [];
  const uncertainRegions: string[] = [];
  let scoreSum = 0;
  let count = 0;

  // 1. Statement Validation
  const stmtText = question.statement || '';
  const stmtReport = validateLatex(stmtText);
  scoreSum += stmtReport.confidence;
  count++;

  if (!stmtReport.isValid) {
    reasons.push(`Statement LaTeX error: ${stmtReport.errors.join('; ')}`);
  }
  if (stmtReport.warnings.length > 0) {
    reasons.push(`Statement warning: ${stmtReport.warnings.join('; ')}`);
  }
  uncertainRegions.push(...stmtReport.uncertainRegions);

  // 2. Options Validation
  if (Array.isArray(question.options)) {
    question.options.forEach((opt) => {
      const optText = opt.text ? opt.text.trim() : '';

      if (optText.length === 0) {
        reasons.push(`Option ${opt.key} is empty`);
        uncertainRegions.push(`Option ${opt.key}: [empty]`);
        scoreSum += 0.2;
        count++;
        return;
      }

      if (isMathCandidate(optText)) {
        const optReport = validateLatex(optText);
        scoreSum += optReport.confidence;
        count++;

        if (!optReport.isValid) {
          reasons.push(`Option ${opt.key} LaTeX error: ${optReport.errors.join('; ')}`);
        }
        if (optReport.warnings.length > 0) {
          reasons.push(`Option ${opt.key} warning: ${optReport.warnings.join('; ')}`);
        }
        uncertainRegions.push(...optReport.uncertainRegions);
      } else {
        // Plain textual option: validate artifacts only (e.g. Word linear symbols in prose)
        const textWarnings: string[] = [];
        const textUncertain: string[] = [];
        detectArtifacts(optText, textWarnings, textUncertain);

        if (textWarnings.length > 0) {
          reasons.push(`Option ${opt.key} warning: ${textWarnings.join('; ')}`);
          uncertainRegions.push(...textUncertain);
          scoreSum += 0.75;
          count++;
        }
      }
    });
  }

  const overallConfidence = count > 0 ? Math.round((scoreSum / count) * 100) / 100 : 0.95;
  const needsReview = reasons.length > 0 || overallConfidence < 0.90 || stmtReport.needsReview;

  return {
    overallConfidence,
    needsReview,
    reasons: Array.from(new Set(reasons)),
    uncertainRegions: Array.from(new Set(uncertainRegions))
  };
}