/**
 * Math Import & Render System - Core Mathematical Normalizer (Step 4 & Storage Rule)
 *
 * Implements:
 * 1. Unicode -> LaTeX conversion
 * 2. Word junk stripping (nbsp, zero-width spaces, smart quotes, MSO styles, paragraph artifacts)
 * 3. Bare LaTeX wrapping into canonical $...$ / $$...$$
 * 4. Linear equation residues: a/b -> \dfrac{a}{b}, dy/dx -> \dfrac{dy}{dx}, exp{...} -> \exp\left\{...\right\}
 * 5. Environment normalization: \begin{align} / \begin{align*} -> \begin{aligned}
 * 6. Storage canonicalization: unescape double backslashes, strip rendered HTML
 */
export const GREEK_UNICODE_MAP = {
    'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta',
    'ε': '\\epsilon', 'ζ': '\\zeta', 'η': '\\eta', 'θ': '\\theta',
    'ι': '\\iota', 'κ': '\\kappa', 'λ': '\\lambda', 'μ': '\\mu',
    'ν': '\\nu', 'ξ': '\\xi', 'π': '\\pi', 'ρ': '\\rho',
    'σ': '\\sigma', 'τ': '\\tau', 'υ': '\\upsilon', 'φ': '\\phi',
    'χ': '\\chi', 'ψ': '\\psi', 'ω': '\\omega',
    'Γ': '\\Gamma', 'Δ': '\\Delta', 'Θ': '\\Theta', 'Λ': '\\Lambda',
    'Ξ': '\\Xi', 'Π': '\\Pi', 'Σ': '\\Sigma', 'Υ': '\\Upsilon',
    'Φ': '\\Phi', 'Ψ': '\\Psi', 'Ω': '\\Omega'
};
export const OPERATOR_UNICODE_MAP = {
    '±': '\\pm', '∓': '\\mp', '×': '\\times', '÷': '\\div',
    '−': '-', '°': '^\\circ',
    '⋅': '\\cdot', '∙': '\\cdot', '∘': '\\circ', '∗': '*',
    '√': '\\sqrt', '∛': '\\sqrt[3]', '∜': '\\sqrt[4]',
    '∝': '\\propto', '∞': '\\infty', '∠': '\\angle',
    '∫': '\\int', '∬': '\\iint', '∭': '\\iiint', '∮': '\\oint',
    '∑': '\\sum', '∏': '\\prod',
    '≤': '\\le', '≥': '\\ge', '≠': '\\ne', '≈': '\\approx',
    '≡': '\\equiv', '∼': '\\sim', '≃': '\\simeq',
    '⊂': '\\subset', '⊃': '\\supset', '⊆': '\\subseteq', '⊇': '\\supseteq',
    '∈': '\\in', '∉': '\\notin', '∋': '\\owns',
    '∩': '\\cap', '∪': '\\cup', '∅': '\\emptyset',
    '→': '\\to', '⇒': '\\implies', '⇔': '\\iff', '↔': '\\leftrightarrow',
    '∀': '\\forall', '∃': '\\exists', '∇': '\\nabla', '∂': '\\partial'
};
/**
 * Strips all rendered HTML tags and unescapes HTML entities.
 * Storage Rule: Never store rendered HTML in the database.
 */
export function stripRenderedHtml(text) {
    if (!text)
        return '';
    return text
        // Remove scripts and styles completely
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        // Remove KaTeX rendered HTML containers if accidentally copied
        .replace(/<span class="katex-mathml">[\s\S]*?<\/span>/gi, '')
        .replace(/<span class="katex-html"[^>]*>[\s\S]*?<\/span>/gi, '')
        .replace(/<span class="katex"[^>]*>[\s\S]*?<\/span>/gi, '')
        // Convert <sup> and <sub> tags to LaTeX powers/indices before dropping tags
        .replace(/<sup>(.*?)<\/sup>/gi, '^{$1}')
        .replace(/<sub>(.*?)<\/sub>/gi, '_{$1}')
        // Drop remaining HTML tags
        .replace(/<[^>]+>/g, ' ')
        // Decode entities
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .trim();
}
/**
 * Normalizes double-escaped backslashes (\frac vs \\frac).
 * Storage Rule: Never store double-escaped backslashes.
 */
export function normalizeBackslashes(text) {
    if (!text)
        return '';
    // Avoid replacing legitimate matrix/cases linebreaks (\\ followed by whitespace or line end)
    // Replace \\command with \command
    return text.replace(/\\\\([a-zA-Z]+)/g, '\\$1');
}
/**
 * Strips Word junk: non-breaking spaces, zero-width characters, smart quotes, mso artifacts.
 */
export function stripWordJunk(text) {
    if (!text)
        return '';
    let s = parseWordMatricesAndCases(text);
    return s
        // Non-breaking spaces and zero-width spaces
        .replace(/[\u00A0\u200B\u200C\u200D\u2060\uFEFF]/g, ' ')
        // Strip dropped HTML banner warning if copied into text
        .replace(/Word HTML dropped part of the question\.\s*The plain-text version was kept and needs review\.\s*/gi, '')
        // Word smart quotes
        .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
        .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
        // Word dashes
        .replace(/[\u2013\u2014]/g, '-')
        // Word equation placeholders and box tokens
        .replace(/□\s*\(\s*\)/g, '')
        .replace(/[▒□┤├│〖〗■█]/g, '')
        // Stray leading numbering or dots e.g. ". If a curve" -> "If a curve"
        .replace(/^\s*(?:\d+\.|\.)\s*(?=[A-Za-z])/g, '')
        // Spacing quotes in Word e.g. dy/(" " \, dx)
        .replace(/([0-9a-zA-Z])\s*["']\s*["']\s*([0-9a-zA-Z])/g, '$1 $2')
        .replace(/"\s*"/g, ' ')
        .replace(/'\s+'/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
/**
 * Robust balanced matrix and cases parser:
 * Identifies Word / UnicodeMath matrices and piecewise case functions
 * including {■(...)┤, [■(...)┤, [■(...)], (■(...)), |■(...)|, etc.
 * Uses balanced parenthesis counting to safely preserve nested brackets/parens.
 */
export function parseWordMatricesAndCases(input) {
    let s = input;
    const markerRegex = /(?:([a-zA-Z]\s*\([a-zA-Z0-9_]+\)\s*=\s*))?([{\[(\|]?)\s*(?:[■█]|\\matrix|\\eqarray|\\cases)\s*\(/g;
    let match;
    while ((match = markerRegex.exec(s)) !== null) {
        const fullMatchStart = match.index;
        const lhs = match[1] || '';
        const openDelimiter = match[2];
        const parenStartIndex = match.index + match[0].length;
        let depth = 1;
        let parenEndIndex = -1;
        for (let i = parenStartIndex; i < s.length; i++) {
            if (s[i] === '(')
                depth++;
            else if (s[i] === ')') {
                depth--;
                if (depth === 0) {
                    parenEndIndex = i;
                    break;
                }
            }
        }
        if (parenEndIndex === -1) {
            continue;
        }
        const body = s.slice(parenStartIndex, parenEndIndex);
        let afterParenIndex = parenEndIndex + 1;
        while (afterParenIndex < s.length && /\s/.test(s[afterParenIndex])) {
            afterParenIndex++;
        }
        let closeDelimiter = '';
        let replaceEndIndex = parenEndIndex + 1;
        if (afterParenIndex < s.length && /[┤│\]\)\|}]/.test(s[afterParenIndex])) {
            closeDelimiter = s[afterParenIndex];
            replaceEndIndex = afterParenIndex + 1;
        }
        let env = 'matrix';
        if (closeDelimiter === '┤' || closeDelimiter === '│' || openDelimiter === '{' || match[0].includes('cases')) {
            env = 'cases';
        }
        else if (openDelimiter === '[' || closeDelimiter === ']') {
            env = 'bmatrix';
        }
        else if (openDelimiter === '(' || closeDelimiter === ')') {
            env = 'pmatrix';
        }
        else if (openDelimiter === '|' || closeDelimiter === '|') {
            env = 'vmatrix';
        }
        const rawRows = body.split('@');
        const formattedRows = rawRows.map((row) => {
            let r = row.trim();
            r = r.replace(/□\s*\(\s*\)/g, '').replace(/□/g, '');
            if (r.includes('&')) {
                const parts = r.split('&');
                let col1 = parts[0].trim();
                let col2 = parts.slice(1).join('&').trim();
                if (col2.startsWith(',')) {
                    col2 = col2.replace(/^,\s*/, '').trim();
                    if (!col1.endsWith(','))
                        col1 = col1 + ',';
                }
                else if (!col1.endsWith(',') && env === 'cases') {
                    col1 = col1 + ',';
                }
                col2 = col2.replace(/^\(\s*\)\s*/, '');
                col2 = col2.replace(/[≥\u2265]|>=/g, ' \\ge ')
                    .replace(/[≤\u2264]|<=/g, ' \\le ')
                    .replace(/[≠\u2260]|!=/g, ' \\ne ')
                    .replace(/</g, ' < ')
                    .replace(/>/g, ' > ');
                col2 = col2.replace(/\s+/g, ' ').trim();
                col1 = col1.replace(/[≥\u2265]/g, ' \\ge ').replace(/[≤\u2264]/g, ' \\le ');
                return `${col1} & ${col2}`;
            }
            return r;
        });
        const latexEnv = `\\begin{${env}} ${formattedRows.join(' \\\\ ')} \\end{${env}}`;
        const fullLatex = lhs ? `${lhs}${latexEnv}` : latexEnv;
        const replacement = `$${fullLatex}$`;
        s = s.slice(0, fullMatchStart) + replacement + s.slice(replaceEndIndex);
        markerRegex.lastIndex = fullMatchStart + replacement.length;
    }
    // Semicolon determinants inside | ... |: | 1 a a²; 1 b b²; 1 c c² | or | a1 a2 a3; b1 b2 b3; c1 c2 c3 |
    s = s.replace(/(?<![a-zA-Z0-9_\\|])\|\s*([^;|]+(?:;[^;|]+)+)\s*\|(?![a-zA-Z0-9_\\|])/g, (_m, body) => {
        const rows = body.split(';').map((row) => {
            const trimmed = row.trim();
            const cells = trimmed.includes(',')
                ? trimmed.split(',').map((c) => c.trim())
                : trimmed.split(/\s+/).map((c) => c.trim());
            return cells.join(' & ');
        });
        return `\\begin{vmatrix} ${rows.join(' \\\\ ')} \\end{vmatrix}`;
    });
    // Nested bracket matrices: [[1,2,3],[0,-1,4],[2,1,0]]
    s = s.replace(/\[\s*(\[[^\[\]]+\](?:\s*,\s*\[[^\[\]]+\])+)\s*\]/g, (_m, body) => {
        const rowMatches = body.match(/\[([^\[\]]+)\]/g);
        if (!rowMatches)
            return _m;
        const rows = rowMatches.map((r) => {
            const inner = r.replace(/^\[\s*/, '').replace(/\s*\]$/, '');
            const cells = inner.split(',').map((c) => c.trim());
            return cells.join(' & ');
        });
        return `\\begin{bmatrix} ${rows.join(' \\\\ ')} \\end{bmatrix}`;
    });
    // Piecewise / cases with semicolons: f(x) = { x²+2x+1, x<0 ; sin(x), 0≤x≤π ; e^(-x), x>π }
    s = s.replace(/(?:([a-zA-Z]\s*\([a-zA-Z0-9_,\s]+\)\s*=\s*))?\{\s*([^;{}]+(?:;[^;{}]+)+)\s*\}/g, (_m, lhs, body) => {
        const branches = body.split(';').map((br) => {
            const trimmed = br.trim();
            const commaIdx = trimmed.indexOf(',');
            if (commaIdx !== -1) {
                const val = trimmed.slice(0, commaIdx).trim();
                const cond = trimmed.slice(commaIdx + 1).trim();
                return `${val}, & ${cond}`;
            }
            return trimmed;
        });
        const env = `\\begin{cases} ${branches.join(' \\\\ ')} \\end{cases}`;
        return lhs ? `${lhs}${env}` : env;
    });
    // Domain & codomain: Let f,g:R→R or f:R->R
    s = s.replace(/\b([a-zA-Z](?:\s*,\s*[a-zA-Z])*)\s*:\s*([RNZQ])\s*(?:→|->|\\to)\s*([RNZQ])\b/g, (_m, funcs, d, cd) => {
        const formattedFuncs = funcs.split(',').map((f) => f.trim()).join(', ');
        return `$${formattedFuncs} : \\mathbb{${d}} \\to \\mathbb{${cd}}$`;
    });
    // Composite functions: fog, gof
    s = s.replace(/(?<=\b(?:function|composite\s+function|the)\s+)(fog|gof)\b/gi, (_m, comp) => {
        const f1 = comp[0];
        const f2 = comp[2];
        return `$${f1} \\circ ${f2}$`;
    });
    // Greatest integer brackets: [x] denote -> $[x]$ denotes
    s = s.replace(/\[\s*([a-zA-Z0-9])\s*\]\s*denote\b/gi, '$[$1]$ denotes');
    s = s.replace(/(?<=\bwhere\s+)\[\s*([a-zA-Z0-9])\s*\]/gi, '$[$1]$');
    return s;
}
/**
 * Replaces Unicode mathematical characters with canonical LaTeX commands.
 */
export function convertUnicodeMathToLatex(text) {
    if (!text)
        return '';
    let res = text;
    // Greek letters
    for (const [uni, cmd] of Object.entries(GREEK_UNICODE_MAP)) {
        res = res.replaceAll(uni, ` ${cmd} `);
    }
    // Operators and symbols
    for (const [uni, cmd] of Object.entries(OPERATOR_UNICODE_MAP)) {
        res = res.replaceAll(uni, ` ${cmd} `);
    }
    // Belong to relations and English phrases
    res = res.replace(/\b([a-zA-Z\u0370-\u03FF\\][0-9a-zA-Z_\\^{}'′]*(?:\s*,\s*[a-zA-Z\u0370-\u03FF\\][0-9a-zA-Z_\\^{}'′]*)*)\s+belongs?\s+to\s+/gi, '$1 \\in ');
    res = res.replace(/[∈\u2208]/g, ' \\in ');
    res = res.replace(/[∉\u2209]/g, ' \\notin ');
    // Unspaced cosec / cot functions
    res = res.replace(/\bcosec\s*([a-zA-Z])\b/gi, '\\csc $1');
    res = res.replace(/cosec([a-zA-Z])(?=[a-zA-Z\s\(\)\[\]]|$)/gi, '\\csc $1 ');
    res = res.replace(/\bcot\s*([a-zA-Z])\b/gi, '\\cot $1');
    res = res.replace(/cot([a-zA-Z])(?=[a-zA-Z\s\(\)\[\]]|$)/gi, '\\cot $1 ');
    // Combining vector arrow U+20D7: a⃗ -> \vec{a}
    res = res.replace(/([a-zA-Z])\u20D7/gu, '\\vec{$1}');
    // Blackboard bold mathematical sets
    res = res.replace(/[ℝ\u211D]/gu, '\\mathbb{R}');
    res = res.replace(/[ℕ\u2115]/gu, '\\mathbb{N}');
    res = res.replace(/[ℤ\u2124]/gu, '\\mathbb{Z}');
    res = res.replace(/[ℚ\u211A]/gu, '\\mathbb{Q}');
    res = res.replace(/[ℂ\u2102]/gu, '\\mathbb{C}');
    // Binomial coefficient: C(n,r) -> \binom{n}{r}
    res = res.replace(/\bC\s*\(\s*([a-zA-Z0-9]+)\s*,\s*([a-zA-Z0-9]+)\s*\)/g, '\\binom{$1}{$2}');
    // Radical with superscript index: ⁴√(x⁸+1) -> \sqrt[4]{x^8+1}
    const supToRootNum = {
        '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', 'ⁿ': 'n'
    };
    res = res.replace(/([²³⁴⁵⁶⁷⁸⁹ⁿ])\s*[√](?:\(([^()]+)\)|\[([^\[\]]+)\]|([a-zA-Z0-9]+))/g, (_m, sup, p1, p2, p3) => {
        const root = supToRootNum[sup] || sup;
        const body = p1 || p2 || p3;
        return `\\sqrt[${root}]{${body}}`;
    });
    // Group consecutive subscripts: e.g. ᵣ₌₀ -> _{r=0}, ₙ₌₁ -> _{n=1}
    const fullSubMap = {
        '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
        '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
        '₊': '+', '₋': '-', '₌': '=',
        'ᵣ': 'r', 'ₙ': 'n', 'ₖ': 'k', 'ᵢ': 'i', 'ⱼ': 'j', 'ₘ': 'm',
        'ₚ': 'p', 'ₛ': 's', 'ₜ': 't', 'ₐ': 'a', 'ₑ': 'e', 'ₒ': 'o', 'ₓ': 'x'
    };
    res = res.replace(/([₀₁₂₃₄₅₆₇₈₉₊₋₌ᵣₙₖᵢⱼₘₚₛₜₐₑₒₓ]+)/gu, (match) => {
        const content = Array.from(match).map((c) => fullSubMap[c] || c).join('');
        return `_{${content}}`;
    });
    // Group consecutive superscripts: e.g. ⁻¹ -> ^{-1}, ⁿ⁻ʳ -> ^{n-r}
    const fullSupMap = {
        '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
        '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
        '⁺': '+', '⁻': '-', '⁼': '=',
        'ⁿ': 'n', 'ⁱ': 'i', 'ʳ': 'r'
    };
    res = res.replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼ⁿⁱʳ]+)/gu, (match) => {
        const content = Array.from(match).map((c) => fullSupMap[c] || c).join('');
        return `^{${content}}`;
    });
    // Summation, product, and integral operators before limits/subscripts
    res = res.replace(/(?:\\Sigma|Σ|∑)\s*(?=_[{0-9a-zA-Z]|\^)/g, '\\sum ');
    res = res.replace(/(?:\\Pi|∏)\s*(?=_[{0-9a-zA-Z]|\^)/g, '\\prod ');
    res = res.replace(/∫\s*(?=_[{0-9a-zA-Z]|\^)/g, '\\int ');
    // Superscript numbers: ², ³, ⁴, ⁿ
    const superMap = {
        '⁰': '^{0}', '¹': '^{1}', '²': '^{2}', '³': '^{3}', '⁴': '^{4}',
        '⁵': '^{5}', '⁶': '^{6}', '⁷': '^{7}', '⁸': '^{8}', '⁹': '^{9}',
        '⁺': '^{+}', '⁻': '^{-}', 'ⁿ': '^{n}'
    };
    for (const [sup, exp] of Object.entries(superMap)) {
        res = res.replaceAll(sup, exp);
    }
    // Subscript numbers: ₀, ₁, ₂, ...
    const subMap = {
        '₀': '_{0}', '₁': '_{1}', '₂': '_{2}', '₃': '_{3}', '₄': '_{4}',
        '₅': '_{5}', '₆': '_{6}', '₇': '_{7}', '₈': '_{8}', '₉': '_{9}',
        '₊': '_{+}', '₋': '_{-}'
    };
    for (const [sub, ind] of Object.entries(subMap)) {
        res = res.replaceAll(sub, ind);
    }
    // Word mathematical italic & bold alphanumeric symbols (e.g. 𝑥, 𝑦, 𝑧) -> ASCII a-z, A-Z
    res = res.replace(/[\u{1D400}-\u{1D7FF}]/gu, (char) => {
        const cp = char.codePointAt(0);
        if (!cp)
            return char;
        if (cp >= 0x1D400 && cp <= 0x1D419)
            return String.fromCharCode(cp - 0x1D400 + 65);
        if (cp >= 0x1D41A && cp <= 0x1D433)
            return String.fromCharCode(cp - 0x1D41A + 97);
        if (cp >= 0x1D434 && cp <= 0x1D44D)
            return String.fromCharCode(cp - 0x1D434 + 65);
        if (cp >= 0x1D44E && cp <= 0x1D467)
            return String.fromCharCode(cp - 0x1D44E + 97);
        return char;
    });
    return res;
}
export function fixNestedExponents(text) {
    let result = '';
    let i = 0;
    while (i < text.length) {
        if (text[i] === '^' && text[i + 1] === '(') {
            let depth = 1;
            let j = i + 2;
            while (j < text.length && depth > 0) {
                if (text[j] === '(')
                    depth++;
                else if (text[j] === ')')
                    depth--;
                j++;
            }
            if (depth === 0) {
                const inner = text.slice(i + 2, j - 1);
                result += `^{${fixNestedExponents(inner)}}`;
                i = j;
                continue;
            }
        }
        result += text[i];
        i++;
    }
    return result;
}
export function normalizePrimes(text) {
    if (!text)
        return '';
    return text
        // Normalize unicode primes and LaTeX prime macros
        .replace(/[\u2034]/g, "'''")
        .replace(/[\u2033]/g, "''")
        .replace(/[\u2032]/g, "'")
        .replace(/\\prime\s*\\prime\s*\\prime/g, "'''")
        .replace(/\\prime\s*\\prime/g, "''")
        .replace(/\\prime/g, "'")
        // Double quotes used as double primes on variables or closing brackets: y" -> y'', )" -> )''
        .replace(/([a-zA-Z\)\]\}])\s*["\u201D]/g, "$1''")
        // Normalize prime derivatives in powers: y^{''} -> y'', ϕ^' (t) -> \phi'(t)
        .replace(/([a-zA-Z\\\)\]\}]+)\s*\^\s*\{?\s*['′’`´]\s*['′’`´]\s*['′’`´]\s*\}?/g, "$1'''")
        .replace(/([a-zA-Z\\\)\]\}]+)\s*\^\s*\{?\s*['′’`´]\s*['′’`´]\s*\}?/g, "$1''")
        .replace(/([a-zA-Z\\\)\]\}]+)\s*\^\s*\{?\s*['′’`´]\s*\}?/g, "$1'")
        // Strip illegal prime / quote superscripts on digits e.g. 0^' or 0^{'} or 0' -> 0
        .replace(/(\d+)\s*\^\s*\{?\s*['′’`´]+\s*\}?/g, '$1')
        .replace(/(\d+)\s*['′’`´]+/g, '$1')
        .replace(/\^\s*\{?\s*['′’`´]\s*\}?/g, "'")
        // Collapse any spaces between or before prime ticks: y' ' -> y'', y' ' ' -> y'''
        .replace(/([a-zA-Z\\\)\]\}])\s*['’`´]\s+['’`´]\s+['’`´]/g, "$1'''")
        .replace(/([a-zA-Z\\\)\]\}])\s*['’`´]\s+['’`´]/g, "$1''")
        .replace(/([a-zA-Z\\\)\]\}])\s+['’`´](?!['’`´])/g, "$1'")
        // Any remaining spaced prime pairs: ' ' -> ''
        .replace(/['’`´]\s+['’`´]/g, "''");
}
/**
 * Robust balanced fraction converter for complex fractions
 */
export function convertFractionsBalanced(text) {
    let s = text;
    let slashIdx;
    let searchStart = 0;
    while ((slashIdx = s.indexOf('/', searchStart)) !== -1) {
        if (slashIdx > 0 && s[slashIdx - 1] === '\\') {
            searchStart = slashIdx + 1;
            continue;
        }
        // If inside \text{...}, leave text fractions intact (e.g. \text{m/s})
        const textPrefix = s.substring(Math.max(0, slashIdx - 40), slashIdx);
        if (/\\text\{[^{}]*$/.test(textPrefix)) {
            searchStart = slashIdx + 1;
            continue;
        }
        let numEnd = slashIdx;
        while (numEnd > 0 && /\s/.test(s[numEnd - 1]))
            numEnd--;
        if (numEnd === 0) {
            searchStart = slashIdx + 1;
            continue;
        }
        let num = '';
        let numStart = -1;
        if (s[numEnd - 1] === ')') {
            let depth = 1;
            let j = numEnd - 2;
            while (j >= 0 && depth > 0) {
                if (s[j] === ')')
                    depth++;
                else if (s[j] === '(')
                    depth--;
                j--;
            }
            if (depth === 0) {
                numStart = j + 1;
                num = s.substring(numStart + 1, numEnd - 1).trim();
            }
        }
        else {
            let j = numEnd - 1;
            let braceDepth = 0;
            while (j >= 0) {
                const c = s[j];
                if (c === '}') {
                    braceDepth++;
                    j--;
                }
                else if (c === '{') {
                    if (braceDepth > 0) {
                        braceDepth--;
                        j--;
                    }
                    else {
                        break;
                    }
                }
                else if (braceDepth > 0) {
                    j--;
                }
                else if (c === '^' && (j === 0 || s[j - 1] === '(' || s[j - 1] === ')' || s[j - 1] === ' ' || s[j - 1] === '=')) {
                    break;
                }
                else if (/[0-9a-zA-Z_\\]/.test(c) || c === '^') {
                    j--;
                }
                else {
                    break;
                }
            }
            numStart = j + 1;
            num = s.substring(numStart, numEnd).trim();
        }
        if (!num || numStart === -1) {
            searchStart = slashIdx + 1;
            continue;
        }
        let denStart = slashIdx + 1;
        while (denStart < s.length && /\s/.test(s[denStart]))
            denStart++;
        if (denStart >= s.length) {
            searchStart = slashIdx + 1;
            continue;
        }
        let den = '';
        let denEnd = -1;
        if (s[denStart] === '(') {
            let depth = 1;
            let j = denStart + 1;
            while (j < s.length && depth > 0) {
                if (s[j] === '(')
                    depth++;
                else if (s[j] === ')')
                    depth--;
                j++;
            }
            if (depth === 0) {
                denEnd = j;
                den = s.substring(denStart + 1, denEnd - 1).trim();
                if (denEnd < s.length && s[denEnd] === '^') {
                    let expStart = denEnd + 1;
                    while (expStart < s.length && /\s/.test(s[expStart]))
                        expStart++;
                    if (expStart < s.length) {
                        if (s[expStart] === '(' || s[expStart] === '{') {
                            const closeChar = s[expStart] === '(' ? ')' : '}';
                            let expDepth = 1;
                            let k = expStart + 1;
                            while (k < s.length && expDepth > 0) {
                                if (s[k] === s[expStart])
                                    expDepth++;
                                else if (s[k] === closeChar)
                                    expDepth--;
                                k++;
                            }
                            if (expDepth === 0) {
                                let innerExp = s.substring(expStart + 1, k - 1).trim();
                                innerExp = innerExp.replace(/(\d+)\s*\/\s*(\d+)/, '\\frac{$1}{$2}');
                                den = `(${den})^{${innerExp}}`;
                                denEnd = k;
                            }
                        }
                        else if (/[0-9a-zA-Z]/.test(s[expStart])) {
                            den = `(${den})^{${s[expStart]}}`;
                            denEnd = expStart + 1;
                        }
                    }
                }
            }
        }
        else if (s.startsWith('\\sqrt', denStart) || s.startsWith('√', denStart)) {
            let k = denStart + (s.startsWith('\\sqrt', denStart) ? 5 : 1);
            while (k < s.length && /\s/.test(s[k]))
                k++;
            if (s[k] === '{' || s[k] === '(') {
                const closeChar = s[k] === '{' ? '}' : ')';
                let depth = 1;
                let m = k + 1;
                while (m < s.length && depth > 0) {
                    if (s[m] === s[k])
                        depth++;
                    else if (s[m] === closeChar)
                        depth--;
                    m++;
                }
                if (depth === 0) {
                    let innerRad = s.substring(k + 1, m - 1).trim();
                    if (innerRad.startsWith('(') && innerRad.endsWith(')'))
                        innerRad = innerRad.slice(1, -1).trim();
                    den = `\\sqrt{${innerRad}}`;
                    denEnd = m;
                }
            }
        }
        else {
            let j = denStart;
            let braceDepth = 0;
            while (j < s.length) {
                const c = s[j];
                if (c === '{') {
                    braceDepth++;
                    j++;
                }
                else if (c === '}') {
                    if (braceDepth > 0) {
                        braceDepth--;
                        j++;
                    }
                    else {
                        break;
                    }
                }
                else if (braceDepth > 0) {
                    j++;
                }
                else if (/[0-9a-zA-Z_\\]/.test(c) || c === '^') {
                    j++;
                }
                else {
                    break;
                }
            }
            denEnd = j;
            den = s.substring(denStart, denEnd).trim();
        }
        if (!den || denEnd === -1) {
            searchStart = slashIdx + 1;
            continue;
        }
        const frac = `\\dfrac{${num}}{${den}}`;
        s = s.substring(0, numStart) + frac + s.substring(denEnd);
        searchStart = numStart + frac.length;
    }
    return s;
}
/**
 * Converts exp{ ... } or \exp{ ... } with balanced braces into visible \exp\left\{ ... \right\}
 */
export function convertExpBraces(text) {
    let s = text;
    const expBraceRegex = /\\?exp\s*(?:\\?\{|\{)/gi;
    let match;
    let result = '';
    let lastIndex = 0;
    while ((match = expBraceRegex.exec(s)) !== null) {
        result += s.substring(lastIndex, match.index);
        const startInner = expBraceRegex.lastIndex;
        let depth = 1;
        let i = startInner;
        let foundClose = false;
        for (; i < s.length; i++) {
            if (s[i] === '{' && (i === 0 || s[i - 1] !== '\\'))
                depth++;
            else if (s[i] === '}' && (i === 0 || s[i - 1] !== '\\')) {
                depth--;
                if (depth === 0) {
                    foundClose = true;
                    break;
                }
            }
            else if (depth === 1 && /\b(pass|through|origin|is\s+equal|equal\s+to|where|then)\b/i.test(s.substring(i, i + 15))) {
                break;
            }
        }
        let inner = s.substring(startInner, i).trim();
        let innerDepth = 0;
        for (let j = 0; j < inner.length; j++) {
            if (inner[j] === '{' && (j === 0 || inner[j - 1] !== '\\'))
                innerDepth++;
            else if (inner[j] === '}' && (j === 0 || inner[j - 1] !== '\\'))
                innerDepth--;
        }
        while (innerDepth > 0) {
            inner += '}';
            innerDepth--;
        }
        inner = inner.replace(/\\frac\b/g, '\\dfrac');
        result += `\\exp\\left\\{${inner}\\right\\}`;
        lastIndex = foundClose ? i + 1 : i;
        expBraceRegex.lastIndex = lastIndex;
    }
    result += s.substring(lastIndex);
    return result;
}
/**
 * Converts literal mathematical curly braces (sets, fractional part, intervals, etc.)
 * into visible \{ and \} while preserving LaTeX macro syntax groups (e.g. \frac{a}{b}, ^{2}, \text{...}).
 */
export function convertLiteralCurlyBraces(latex) {
    if (!latex || !latex.includes('{'))
        return latex;
    const oneArgMacros = new Set([
        'sqrt', 'text', 'textbf', 'textit', 'textrm', 'textsf', 'texttt', 'textnormal',
        'mathrm', 'mathbf', 'mathit', 'mathsf', 'mathtt', 'mathbb', 'mathcal', 'mathfrak', 'mathscr', 'bm', 'boldsymbol',
        'begin', 'end',
        'vec', 'hat', 'bar', 'tilde', 'dot', 'ddot', 'dddot', 'check', 'acute', 'grave', 'breve', 'mathring',
        'overbrace', 'underbrace', 'overline', 'underline', 'overleftarrow', 'overrightarrow', 'overleftrightarrow',
        'boxed', 'color', 'phantom', 'vphantom', 'hphantom',
        'cancel', 'bcancel', 'xcancel', 'cancelto',
        'operatorname', 'operatornamewithlimits', 'tag', 'label'
    ]);
    const twoArgMacros = new Set([
        'frac', 'dfrac', 'cfrac', 'tfrac',
        'binom', 'overset', 'underset', 'stackrel', 'pmod', 'pod',
        'textcolor', 'colorbox'
    ]);
    let result = '';
    let i = 0;
    const pendingMacros = [];
    const braceStack = [];
    function findMatchingBrace(str, startIdx) {
        let d = 1;
        for (let k = startIdx + 1; k < str.length; k++) {
            if (str[k] === '\\') {
                k++;
                continue;
            }
            if (str[k] === '{')
                d++;
            else if (str[k] === '}') {
                d--;
                if (d === 0)
                    return k;
            }
        }
        return -1;
    }
    function isSetContent(inner, prevStr) {
        if (/,/.test(inner))
            return true;
        if (/(?:^|\s)[x-z0-9]\s*[:|]\s*[a-zA-Z0-9]/.test(inner))
            return true;
        if (/\\in|\\notin|\\subset|\\subseteq|\\cup|\\cap/.test(inner))
            return true;
        if (/(?:\\in|\\notin|\\subset|\\subseteq|\\cup|\\cap|=|\\setminus)\s*$/.test(prevStr.trim()))
            return true;
        return false;
    }
    while (i < latex.length) {
        const ch = latex[i];
        if (ch === '\\') {
            if (latex[i + 1] === '{' || latex[i + 1] === '}') {
                result += latex.slice(i, i + 2);
                i += 2;
                continue;
            }
            const matchDelimiter = latex.slice(i).match(/^\\(left|right|big|Big|bigg|Bigg)\s*\\?([{}])/);
            if (matchDelimiter) {
                result += matchDelimiter[0];
                i += matchDelimiter[0].length;
                continue;
            }
            const macroMatch = latex.slice(i).match(/^\\([a-zA-Z]+)/);
            if (macroMatch) {
                const macroName = macroMatch[1];
                result += macroMatch[0];
                i += macroMatch[0].length;
                let expected = 0;
                if (twoArgMacros.has(macroName))
                    expected = 2;
                else if (oneArgMacros.has(macroName))
                    expected = 1;
                if (expected > 0) {
                    while (i < latex.length && /\s/.test(latex[i])) {
                        result += latex[i];
                        i++;
                    }
                    if (macroName === 'sqrt' && latex[i] === '[') {
                        let opt = '[';
                        i++;
                        while (i < latex.length && latex[i] !== ']') {
                            opt += latex[i];
                            i++;
                        }
                        if (i < latex.length) {
                            opt += ']';
                            i++;
                        }
                        result += opt;
                        while (i < latex.length && /\s/.test(latex[i])) {
                            result += latex[i];
                            i++;
                        }
                    }
                    if (latex[i] === '{') {
                        pendingMacros.push({ name: macroName, remainingArgs: expected });
                    }
                }
                continue;
            }
            result += ch;
            i++;
            continue;
        }
        if (ch === '^' || ch === '_') {
            result += ch;
            i++;
            while (i < latex.length && /\s/.test(latex[i])) {
                result += latex[i];
                i++;
            }
            if (latex[i] === '{') {
                pendingMacros.push({ name: ch, remainingArgs: 1 });
            }
            continue;
        }
        if (ch === '{') {
            const topPending = pendingMacros[pendingMacros.length - 1];
            if (topPending && topPending.remainingArgs > 0 && (!topPending.activeDepth || topPending.activeDepth === 0)) {
                topPending.remainingArgs--;
                topPending.activeDepth = 1;
                braceStack.push({ kind: 'syntax', macroOwner: topPending });
                result += '{';
                i++;
                continue;
            }
            if (braceStack.length === 0) {
                braceStack.push({ kind: 'literal' });
                result += '\\{';
                i++;
                continue;
            }
            const closeIdx = findMatchingBrace(latex, i);
            const inner = closeIdx > i ? latex.slice(i + 1, closeIdx) : '';
            const prev = result;
            if (isSetContent(inner, prev)) {
                braceStack.push({ kind: 'literal' });
                result += '\\{';
                i++;
            }
            else {
                braceStack.push({ kind: 'syntax' });
                result += '{';
                i++;
            }
            continue;
        }
        if (ch === '}') {
            const top = braceStack.pop();
            if (top && top.kind === 'literal') {
                result += '\\}';
            }
            else {
                result += '}';
            }
            if (top && top.macroOwner) {
                top.macroOwner.activeDepth = 0;
                if (top.macroOwner.remainingArgs === 0) {
                    pendingMacros.pop();
                }
            }
            i++;
            continue;
        }
        if (pendingMacros.length > 0 && !/\s/.test(ch)) {
            const topPending = pendingMacros[pendingMacros.length - 1];
            if (topPending && topPending.remainingArgs > 0 && (!topPending.activeDepth || topPending.activeDepth === 0)) {
                pendingMacros.pop();
            }
        }
        result += ch;
        i++;
    }
    while (braceStack.length > 0) {
        const top = braceStack.pop();
        result += top && top.kind === 'literal' ? '\\}' : '}';
    }
    return result;
}
/**
 * Repairs linear equations residues:
 * - dy/(" " \, dx) -> \dfrac{dy}{dx}
 * - a/b -> \dfrac{a}{b}
 * - exp{...} -> \exp\left\{...\right\}
 * - tan^{-1}x -> \tan^{-1}(x)
 * - \begin{align} / \begin{align*} -> \begin{aligned}
 */
export function repairLinearMathResidues(text) {
    if (!text)
        return '';
    let s = text;
    // Clean leading bullet, number, or dot: ". If a curve..." -> "If a curve..."
    s = s.replace(/^[\s\u2022\u25E6\u25AA\u25CF.\-—]+\s*(?=[A-Za-z])/g, '');
    s = s.replace(/^Q(?:uestion)?\s*\.?\s*\d+\s*[:.)\-—]\s*/gi, '');
    // Strip illegal prime / quote superscripts on digits e.g. 0^' or 0^{'} or 0' -> 0
    s = s.replace(/(\d+)\s*\^\s*\{?\s*['′]\s*\}?/g, '$1')
        .replace(/(\d+)\s*['′]/g, '$1')
        .replace(/([a-zA-Z\\]+)\s*\^\s*\{?\s*['′]\s*\}?/g, "$1'")
        .replace(/\^\s*\{?\s*['′]\s*\}?/g, "'");
    // PDF / Word clipboard circumflex and hat accent artifacts:
    // e.g. x ^\in [0,3] -> \hat{x} \in [0,3], x `\in -> \hat{x} \in, x ˆ\in -> \hat{x} \in, x ̂ -> \hat{x}
    s = s.replace(/([a-zA-Z])\s*[\^ˆ`\u0302]\s*(?=\\in\b|\\notin\b|[∈∉⊆⊂]|<=|>=|<|>|=|!=|≠)/g, '\\hat{$1} ');
    s = s.replace(/([a-zA-Z])\u0302/g, '\\hat{$1}');
    // Extra spaces inside function call parens: f'(x ) -> f'(x), g'(x ) -> g'(x)
    s = s.replace(/([a-zA-Z]['′]?)\s*\(\s*([a-zA-Z0-9_\\]+)\s+\)/g, '$1($2)');
    // Glued min / max operators before functions or delimiters:
    // e.g. minf'(x) -> \min f'(x), maxg'(x) -> \max g'(x), maxf(x) -> \max f(x), min(a,b) -> \min(a,b)
    s = s.replace(/(?<![a-zA-Z\\])(min|max)(?=[fghxyzuvwFGHXYZUVW](?:'|\(|\b))/gi, (_m, op) => `\\${op.toLowerCase()} `);
    s = s.replace(/(?<![a-zA-Z\\])(min|max)(?=\s*[({_\\|])/gi, (_m, op) => `\\${op.toLowerCase()} `);
    s = s.replace(/(?<![a-zA-Z\\])\b(min|max)\b(?!\s*(?:imum|imal|imize|or|ors|ority|ute|us)\b)(?=\s+[a-zA-Z0-9])/gi, (_m, op) => `\\${op.toLowerCase()}`);
    // Word linear limits: (lim)┬(h→0) or (lim)┬(h->0) or lim┬(x→0) or (lim)_(h→0) or lim_(x→0)
    s = s.replace(/(?:\(?\\?lim\)?)\s*[┬┴]\s*\(([^()]+)\)/gi, (_m, cond) => {
        const c = cond.trim().replace(/[→⟶]|->|(?<!\\)to\b/g, '\\to ').replace(/\\infty|\u221E|\binf\b/gi, '\\infty');
        return `\\lim_{${c.trim()}}`;
    });
    s = s.replace(/(?:\\?lim|\(lim\))_\s*\(([^()]+)\)/gi, (_m, cond) => {
        const c = cond.trim().replace(/[→⟶]|->|(?<!\\)to\b/g, '\\to ').replace(/\\infty|\u221E|\binf\b/gi, '\\infty');
        return `\\lim_{${c.trim()}}`;
    });
    // Word summations: ∑_(r=1)^k or ∑_{r=1}^k
    s = s.replace(/[∑\u2211]\s*_\s*([({])([^(){}]+)([)}])(?:\s*\^\s*([({]?)([0-9a-zA-Z_+-\\^]+)([)}]?))?/g, (_m, _o1, lower, _c1, _o2, upper) => {
        const up = upper ? `^{${upper.trim()}}` : '';
        return `\\sum_{${lower.trim()}}${up}`;
    });
    // Word products: ∏_(i=1)^n
    s = s.replace(/[∏\u220F]\s*_\s*([({])([^(){}]+)([)}])(?:\s*\^\s*([({]?)([0-9a-zA-Z_+-\\^]+)([)}]?))?/g, (_m, _o1, lower, _c1, _o2, upper) => {
        const up = upper ? `^{${upper.trim()}}` : '';
        return `\\prod_{${lower.trim()}}${up}`;
    });
    // Function dot multiplication: f(x).f(y) -> f(x) \cdot f(y)
    s = s.replace(/([a-zA-Z]\s*\([^()]+\))\s*\.\s*([a-zA-Z]\s*\([^()]+\))/g, '$1 \\cdot $2');
    // Semicolon determinants inside | ... |: | 1 a a²; 1 b b²; 1 c c² | or | a1 a2 a3; b1 b2 b3; c1 c2 c3 |
    s = s.replace(/(?<![a-zA-Z0-9_\\|])\|\s*([^;|]+(?:;[^;|]+)+)\s*\|(?![a-zA-Z0-9_\\|])/g, (_m, body) => {
        const rows = body.split(';').map((row) => {
            const trimmed = row.trim();
            const cells = trimmed.includes(',')
                ? trimmed.split(',').map((c) => c.trim())
                : trimmed.split(/\s+/).map((c) => c.trim());
            return cells.join(' & ');
        });
        return `\\begin{vmatrix} ${rows.join(' \\\\ ')} \\end{vmatrix}`;
    });
    // Nested bracket matrices: [[1,2,3],[0,-1,4],[2,1,0]]
    s = s.replace(/\[\s*(\[[^\[\]]+\](?:\s*,\s*\[[^\[\]]+\])+)\s*\]/g, (_m, body) => {
        const rowMatches = body.match(/\[([^\[\]]+)\]/g);
        if (!rowMatches)
            return _m;
        const rows = rowMatches.map((r) => {
            const inner = r.replace(/^\[\s*/, '').replace(/\s*\]$/, '');
            const cells = inner.split(',').map((c) => c.trim());
            return cells.join(' & ');
        });
        return `\\begin{bmatrix} ${rows.join(' \\\\ ')} \\end{bmatrix}`;
    });
    // Piecewise / cases with semicolons: f(x) = { x²+2x+1, x<0 ; sin(x), 0≤x≤π ; e^(-x), x>π }
    s = s.replace(/(?:([a-zA-Z]\s*\([a-zA-Z0-9_,\s]+\)\s*=\s*))?\{\s*([^;{}]+(?:;[^;{}]+)+)\s*\}/g, (_m, lhs, body) => {
        const branches = body.split(';').map((br) => {
            const trimmed = br.trim();
            const commaIdx = trimmed.indexOf(',');
            if (commaIdx !== -1) {
                const val = trimmed.slice(0, commaIdx).trim();
                const cond = trimmed.slice(commaIdx + 1).trim();
                return `${val}, & ${cond}`;
            }
            return trimmed;
        });
        const env = `\\begin{cases} ${branches.join(' \\\\ ')} \\end{cases}`;
        return lhs ? `${lhs}${env}` : env;
    });
    // Domain & codomain: Let f,g:R→R or f:R->R
    s = s.replace(/\b([a-zA-Z](?:\s*,\s*[a-zA-Z])*)\s*:\s*([RNZQ])\s*(?:[→⟶]|->|\\to)\s*([RNZQ])\b/g, (_m, funcs, d, cd) => {
        const formattedFuncs = funcs.split(',').map((f) => f.trim()).join(', ');
        return `${formattedFuncs} : \\mathbb{${d}} \\to \\mathbb{${cd}}`;
    });
    s = s.replace(/[→⟶]|(?<=[0-9a-zA-Z\s])->(?=[0-9a-zA-Z\s])/g, ' \\to ');
    s = s.replace(/(\\in|\\notin|\\subset|\\subseteq|\\to)\s*([RNZQ])\b/g, '$1 \\mathbb{$2}');
    s = s.replace(/\b(on|in)\s+R\b/g, '$1 \\mathbb{R}');
    // 1. Differential residues from Word: dy/(" " \, dx), dy/(dx), dy/dx, d^n/dx^n
    // Strip stray copy-paste artifacts like $&, $& $, & $, & f(x)
    s = s.replace(/\$\s*&\s*\$?/g, '');
    s = s.replace(/&\s*\$/g, '');
    s = s.replace(/(?<!\\begin\{[^}]*)\$\s*&/g, '');
    // Auto-close unclosed \begin{cases} (only when \end{cases} is missing in the block)
    if (/\\begin\{cases\}/i.test(s) && !/\\end\{cases\}/i.test(s)) {
        s = s.replace(/\\begin\{cases\}([\s\S]*?)(?=\b(?:Then|where|when)\b|$)/gi, (match, body) => {
            const cleanedBody = body.replace(/\$/g, '').trimEnd();
            return `\\begin{cases}${cleanedBody} \\end{cases} `;
        });
    }
    // Convert function composition: (fog)(x) -> (f \circ g)(x), fog(x) -> (f \circ g)(x)
    s = s.replace(/(?<![a-zA-Z0-9_\$])\(([a-zA-Z])\s*o\s*([a-zA-Z])\)\s*\(\s*([a-zA-Z0-9]+)\s*\)/g, '($1 \\circ $2)($3)');
    s = s.replace(/\b([fg])\s*o\s*([fg])\s*\(\s*([a-zA-Z0-9]+)\s*\)/g, '($1 \\circ $2)($3)');
    // Greek letter fractions with powers: \pi^2/32 -> \dfrac{\pi^2}{32}, \pi/2 -> \dfrac{\pi}{2}
    s = s.replace(/(\\[a-zA-Z]+)\s*\^/g, '$1^');
    s = s.replace(/(\\(?:pi|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|xi|rho|sigma|tau|phi|chi|psi|omega)(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\/\s*([0-9a-zA-Z]+)/g, '\\dfrac{$1}{$2}');
    // Differentials: dy/(" "\, dx) -> \dfrac{dy}{dx}, d^n/dx^n -> \dfrac{d^n}{dx^n}
    s = s.replace(/\b(d(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?[a-zA-Z]?)\s*\/\s*\(\s*(?:["'][^"']*["'])?\s*(?:\\,)?\s*(d[a-zA-Z](?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\)/g, '\\dfrac{$1}{$2}');
    s = s.replace(/\b(d(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?[a-zA-Z]?)\s*\/\s*(d[a-zA-Z](?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)(?![a-zA-Z0-9_^{])/g, '\\dfrac{$1}{$2}');
    s = s.replace(/\bd\/dx\s*\[/g, '\\dfrac{d}{dx}\\left[');
    s = s.replace(/(?<!\\)\b(det)\b(?!\s*[\\])/g, '\\$1');
    s = s.replace(/\(\s*["'][^"']*["']\s*(?:\\,)?\s*(d[a-zA-Z])\s*\)/g, '\\,$1');
    // Repair corrupted differential residues:
    s = s.replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}\s*\{?\s*(?:\\,)?\s*(d[a-zA-Z])/gi, '\\dfrac{$1}{$2}');
    s = s.replace(/\\(?:d?frac)\{\s*\}\s*\{\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}\s*\{\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}/gi, '\\dfrac{$1}{$2}');
    s = s.replace(/\\(?:d?frac)\{\s*\}\s*(?:\\?\s*\{\s*)?[^a-zA-Z\n]{0,8}(d[a-zA-Z])[^a-zA-Z\n]{1,8}(d[a-zA-Z])\}?/gi, '\\dfrac{$1}{$2}');
    s = s.replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\}\s*\{?\s*(?:\\,)?\s*([a-zA-Z]+)/gi, '\\dfrac{$1}{$2}');
    s = s.replace(/\\(?:d?frac)\{\s*\}\s*(?:\{\s*\})?\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])\s*\/\s*(?:\\,)?\s*(d[a-zA-Z])/gi, '\\dfrac{$1}{$2}');
    s = s.replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*(d[a-zA-Z])(?![a-zA-Z{])/gi, '\\dfrac{$1}{dx}');
    s = s.replace(/\\(?:d?frac)\{\s*\}\s*\\?\s*(?:\\,)?\s*([a-zA-Z]+)\s*\}\s*\{?\s*(?:\\,)?\s*([a-zA-Z]+)/gi, '\\dfrac{$1}{$2}');
    s = s.replace(/\\(?:d?frac)\{\s*(?:\\,)?\s*([a-zA-Z]+)\s*\}\s*\{\s*(?:\\,)?\s*([a-zA-Z]+)\s*\}/gi, '\\dfrac{$1}{$2}');
    s = s.replace(/\\(?:d?frac)\{\s*\}\s*(?:\\,)?\s*([a-zA-Z]+)\s*\/\s*(?:\\,)?\s*([a-zA-Z]+)/g, '\\dfrac{$1}{$2}');
    // Separate glued math functions: 2xexp -> 2x exp, xexp -> x exp, 2xsin -> 2x sin
    s = s.replace(/([0-9a-zA-Z])\s*(sin|cos|tan|cot|sec|csc|log_e|ln|log|exp)\b/gi, '$1 $2');
    // Double parens on radicals: √((1+x^6)) or \sqrt((1+x^6)) or 4√2
    s = s.replace(/√\s*\(\s*\(\s*([^()]+)\s*\)\s*\)/g, '\\sqrt{$1}');
    s = s.replace(/\\?sqrt\s*\(\s*\(\s*([^()]+)\s*\)\s*\)/g, '\\sqrt{$1}');
    s = s.replace(/(\d+)\s*√\s*(\d+)/g, '$1\\sqrt{$2}');
    s = s.replace(/√\s*(\d+)/g, '\\sqrt{$1}');
    // Join words hyphenated across a newline: e.g. differ-\nential -> differential
    s = s.replace(/([a-zA-Z])-\s*[\r\n]+\s*([a-zA-Z])/g, '$1$2');
    // Only connect math closing brackets directly preceding prose continuation verbs across a newline:
    s = s.replace(/([\]\)])\s*[\r\n]+\s*(pass(?:es)?|touch(?:es)?|intersect(?:s)?|where|when|such|then|with)\b/gi, '$1 $2');
    s = s.replace(/([a-zA-Z0-9\]\)])passthrough\b/gi, '$1 pass through');
    s = s.replace(/(?<!\\[a-zA-Z]*)([a-zA-Z0-9\]\)])\s*(pass(?:es)?\s+through|touch(?:es)?|intersect(?:s)?|where|when|such|then|with)\b/gi, '$1 $2');
    // Normalize prime derivatives e.g. y' ' -> y'', y" -> y''
    s = normalizePrimes(s);
    // Convert complex balanced fractions and exp{...} braces
    s = convertFractionsBalanced(s);
    s = convertExpBraces(s);
    s = convertLiteralCurlyBraces(s);
    s = convertLiteralCurlyBraces(s);
    // 2. Word linear fractions with nested parens and exponents: (3x^{5} \tan^{-1}(x^3))/(1+x^{6})^{\frac{3}{2}}
    s = s.replace(/\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*\(((?:[^()\n]|\([^()\n]*\))+?)\)\^(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\([0-9a-zA-Z_+/\\-]+\)|[A-Za-z0-9_+\-]+)/g, (_, num, den, exp) => {
        let expClean = exp.trim();
        if (expClean.startsWith('(') && expClean.endsWith(')')) {
            expClean = expClean.slice(1, -1).trim();
        }
        if (expClean.includes('/')) {
            expClean = expClean.replace(/(\d+)\s*\/\s*(\d+)/g, '\\dfrac{$1}{$2}');
        }
        const expStr = expClean.startsWith('{') ? expClean : `{${expClean}}`;
        return `\\dfrac{${num}}{(${den})^${expStr}}`;
    });
    s = s.replace(/\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*\(((?:[^()\n]|\([^()\n]*\))+?)\)/g, '\\dfrac{$1}{$2}');
    s = s.replace(/(?<![a-zA-Z0-9_\\])\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*([A-Za-z0-9_\\^{}]+)/g, '\\dfrac{$1}{$2}');
    s = s.replace(/(?<![a-zA-Z0-9_\\])([A-Za-z0-9_\\^{}]+)\s*\/\s*\(((?:[^()\n]|\([^()\n]*\))+?)\)/g, '\\dfrac{$1}{$2}');
    // Radical fractions: e.g. x/√(x^2-y^2) or x/\sqrt{x^2-y^2} -> \dfrac{x}{\sqrt{x^2-y^2}} (safely swallow stray Word trailing brace)
    s = s.replace(/([a-zA-Z0-9]+)\s*\/\s*\\?sqrt\s*\{([^}]+)\}\s*\}?/gi, '\\dfrac{$1}{\\sqrt{$2}}');
    s = s.replace(/([a-zA-Z0-9]+)\s*\/\s*\\?sqrt\s*\(([^)]+)\)\s*\}?/gi, '\\dfrac{$1}{\\sqrt{$2}}');
    s = s.replace(/([a-zA-Z0-9]+)\s*\/\s*√\s*\(([^()]+)\)\s*\}?/g, '\\dfrac{$1}{\\sqrt{$2}}');
    s = s.replace(/([a-zA-Z0-9]+)\s*\/\s*(\\(?:sqrt|cbrt)\{(?:[^{}]|\{[^{}]*\})*\})\s*\}?/g, '\\dfrac{$1}{$2}');
    s = s.replace(/\(((?:[^()\n]|\([^()\n]*\))+?)\)\s*\/\s*(\\(?:sqrt|cbrt)\{(?:[^{}]|\{[^{}]*\})*\})\s*\}?/g, '\\dfrac{$1}{$2}');
    s = s.replace(/(\\(?:sqrt|cbrt)\{(?:[^{}]|\{[^{}]*\})*\})\s*\/\s*([a-zA-Z0-9]+)/g, '\\dfrac{$1}{$2}');
    // Exponential fraction: e.g. e^{y/x} or e^(y/x) -> e^{\frac{y}{x}}
    s = s.replace(/e\s*\^\s*\{?\s*([a-zA-Z0-9]+)\s*\/\s*([a-zA-Z0-9]+)\s*\}?/g, 'e^{\\frac{$1}{$2}}');
    // Convert square brackets enclosing vertical fractions to \left[ ... \right]
    s = s.replace(/(?<!\\left\s*)\[\s*([^[\]]*?\\(?:d?frac)\{(?:[^{}]|\{[^{}]*\})*\}\{(?:[^{}]|\{[^{}]*\})*\}[\s\S]*?)\s*\](?!\s*\\right)/g, '\\left[ $1 \\right]');
    // Clean duplicated delimiters: \left\left[ -> \left[
    s = s.replace(/(?:\\left\s*)+\[/g, '\\left[');
    s = s.replace(/(?:\\right\s*)+\]/g, '\\right]');
    s = s.replace(/(?:\\left\s*)+\(/g, '\\left(');
    s = s.replace(/(?:\\right\s*)+\)/g, '\\right)');
    // 3. Exponential cleanup: \exp\{ ... \} with balanced braces
    const expRegex = /\\?exp\s*\\?\{/gi;
    let expMatch;
    let expResult = '';
    let expLastIndex = 0;
    while ((expMatch = expRegex.exec(s)) !== null) {
        expResult += s.substring(expLastIndex, expMatch.index);
        const startInner = expRegex.lastIndex;
        let depth = 1;
        let i = startInner;
        let foundClose = false;
        for (; i < s.length; i++) {
            const ch = s[i];
            const prev = i > 0 ? s[i - 1] : '';
            if (ch === '{' && prev !== '\\') {
                depth++;
            }
            else if (ch === '}' && prev !== '\\') {
                depth--;
                if (depth === 0) {
                    foundClose = true;
                    break;
                }
            }
            else if (depth === 1 && /\b(pass|through|origin|is|equal|where|then|and)\b/i.test(s.substring(i, i + 8))) {
                break;
            }
        }
        let inner = s.substring(startInner, i).trim();
        let innerDepth = 0;
        for (let j = 0; j < inner.length; j++) {
            if (inner[j] === '{' && (j === 0 || inner[j - 1] !== '\\'))
                innerDepth++;
            else if (inner[j] === '}' && (j === 0 || inner[j - 1] !== '\\'))
                innerDepth--;
        }
        while (innerDepth > 0) {
            inner += '}';
            innerDepth--;
        }
        inner = inner.replace(/\\frac\b/g, '\\dfrac');
        expResult += `\\exp\\left\\{${inner}\\right\\}`;
        expLastIndex = foundClose ? i + 1 : i;
        expRegex.lastIndex = expLastIndex;
    }
    expResult += s.substring(expLastIndex);
    s = expResult;
    s = s.replace(/\\?exp\s*\(\s*([^()]+)\s*\)/g, '\\exp\\left($1\\right)');
    // 4. Inverse trigonometric notation: tan^(-1) -> \tan^{-1}
    s = s.replace(/\\?(sin|cos|tan|cot|sec|csc)\s*\^\s*(?:\{\s*-?\s*1\s*\}|\(\s*-?\s*1\s*\))\s*\(\s*([a-zA-Z0-9_\^]+)\s*\)/gi, '\\$1^{-1}($2)');
    s = s.replace(/\\?(sin|cos|tan|cot|sec|csc)\s*\^\s*(?:\{\s*-?\s*1\s*\}|\(\s*-?\s*1\s*\))\s*(?![\\(])([a-zA-Z0-9]+(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)/gi, '\\$1^{-1}($2)');
    s = s.replace(/\\?(sin|cos|tan|cot|sec|csc)\s*\^\s*(?:\{\s*-?\s*1\s*\}|\(\s*-?\s*1\s*\))/gi, '\\$1^{-1}');
    s = s.replace(/(?<!\\)\b(sin|cos|tan|cot|sec|csc)\b/gi, '\\$1');
    // Fractions inside \exp: \frac -> \dfrac
    s = s.replace(/\\exp\\left\\\{([\s\S]*?)\\right\\\}/g, (_, inner) => {
        const upgraded = inner.replace(/\\frac\b/g, '\\dfrac');
        return `\\exp\\left\\{${upgraded}\\right\\}`;
    });
    // 5. Align environments: KaTeX requires 'aligned' inside math mode instead of top-level 'align' / 'align*'
    s = s.replace(/\\begin\{align\*?\}/g, '\\begin{aligned}');
    s = s.replace(/\\end\{align\*?\}/g, '\\end{aligned}');
    // 6. Simple numeric fractions in options/text: e.g. 1/2, -1/2 -> \dfrac{1}{2}
    s = s.replace(/(?<![a-zA-Z0-9_\/\^\\])([-+]?\d+)\s*\/\s*(\d+)(?![a-zA-Z0-9_\/])/g, '\\dfrac{$1}{$2}');
    // Number over variable: 1/x -> \dfrac{1}{x}, 1/x^2 -> \dfrac{1}{x^2}, 1/a -> \dfrac{1}{a}, 4/k -> \dfrac{4}{k}
    s = s.replace(/(?<![a-zA-Z0-9_\\])([-+]?\d+)\s*\/\s*([a-zA-Z](?:_[a-zA-Z0-9]+|_[0-9]+)?(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)(?![a-zA-Z0-9_])/g, '\\dfrac{$1}{$2}');
    // Variable over number: x/2 -> \dfrac{x}{2}
    s = s.replace(/(?<![a-zA-Z0-9_\\])([-+]?[a-zA-Z](?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\/\s*(\d+)(?![a-zA-Z0-9_])/g, '\\dfrac{$1}{$2}');
    // Variable over variable: x/a -> \dfrac{x}{a}, x/b -> \dfrac{x}{b}, a/b -> \dfrac{a}{b} (not inside \text{...})
    s = s.replace(/(?<![a-zA-Z0-9_\\])([-+]?[a-zA-Z](?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\/\s*([a-zA-Z](?:_[a-zA-Z0-9]+|_[0-9]+)?(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)(?![a-zA-Z0-9_])/g, (match, v1, v2, offset, full) => {
        const before = full.substring(Math.max(0, offset - 20), offset);
        if (/\\text\{[^{}]*$/.test(before))
            return match;
        return `\\dfrac{${v1}}{${v2}}`;
    });
    // Greek letter fractions: \pi/2 -> \dfrac{\pi}{2}, \pi/4 -> \dfrac{\pi}{4}
    s = s.replace(/(\\(?:pi|alpha|beta|gamma|theta|lambda|mu|omega)(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\/\s*([a-zA-Z0-9]+)/g, '\\dfrac{$1}{$2}');
    s = s.replace(/(?<![a-zA-Z0-9_\\])([-+]?\d+)\s*\/\s*(\\(?:pi|alpha|beta|gamma|theta|lambda|mu|omega)(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)/g, '\\dfrac{$1}{$2}');
    // Upgrade \frac to \dfrac for proper "upon" height
    s = s.replace(/\\frac\b/g, '\\dfrac');
    // 7. Redundant parentheses in radicals: \sqrt{(x+1)} -> \sqrt{x+1}
    s = s.replace(/\\sqrt\(\s*([^()]+)\s*\)/g, '\\sqrt{$1}');
    s = s.replace(/\\sqrt\{\s*\(([^()]+)\)\s*\}/g, '\\sqrt{$1}');
    // 8. Insert space after semicolons/commas when followed directly by initial conditions or variables (e.g. "dx;y(2)=e" or "0,y(1)=e")
    s = s.replace(/([0-9a-zA-Z_)\\])\s*([;,])\s*([a-zA-Z]\s*(?:\([^()]+\)|=))/g, '$1$2 $3');
    return s;
}
const PROSE_LIST = 'if|let|the|be|is|are|in|on|at|by|for|to|of|and|or|then|than|where|when|what|which|who|how|why|such|that|with|from|into|curve|passing|through|solution|differential|equation|point|points|value|values|find|evaluate|calculate|equal|equals|given|suppose|assume|consider|hence|therefore|show|prove|origin|axis|plane|line|slope';
const PROSE_GUARD = '(?!(?:' + PROSE_LIST + ')\\b)';
const MATH_COEFF_VAR = '(?<![a-zA-Z])' + PROSE_GUARD + '[0-9]*[a-zA-Z]{1,3}(?:\\^\\{?[^{}]+\\}?|_\\{?[^{}]+\\}?)*(?![a-zA-Z])';
const MATH_NUM = '(?<![a-zA-Z0-9])[0-9]+(?:\\.[0-9]+)?(?![a-zA-Z0-9])';
const MATH_CMD = '\\\\[a-zA-Z]+(?:\\^\\{?[^{}]+\\}?|_\\{?[^{}]+\\}?)*';
const MATH_PAREN = '\\([^()\\n]+\\)(?:\\^\\{?[^{}]+\\}?)*';
const MATH_ATOM = '(?:' + [MATH_CMD, MATH_PAREN, MATH_COEFF_VAR, MATH_NUM].join('|') + ')';
const MATH_OPERATOR = '(?:[+\\-*/=><≤≥≠])';
const MATH_UNIT = '(?:' + MATH_ATOM + '|' + MATH_OPERATOR + ')';
const DIFF_SIDE = '(?:' + MATH_UNIT + '(?:\\s*' + MATH_UNIT + ')*)';
const DIFF_EQ = new RegExp('(?<![$\\w])(' + DIFF_SIDE + '\\s*=\\s*' + DIFF_SIDE + ')(?=(?:\\s*[,;.]|\\s+(?:then|where|when|if|and|pass|through|at|with)\\b|$))', 'gi');
/**
 * Ensures all mathematical expressions are properly enclosed in $...$ (inline) or $$...$$ (display),
 * leaving English prose strictly outside delimiters.
 */
export function wrapBareLatexInDollars(text) {
    if (!text)
        return '';
    let s = text.trim();
    // If already pure wrapped formula
    if (s.startsWith('$') && s.endsWith('$') && !s.slice(1, -1).includes('$')) {
        return s;
    }
    // Step 1: Protect existing delimited blocks using non-word tokens ⟦MATH_idx⟧ (including multiline inline math)
    const protectedBlocks = [];
    s = s.replace(/\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?:\\\$|[^\$])+?\$|\\\([\s\S]*?\\\)/g, (m) => {
        const key = `\u27E6MATH_${protectedBlocks.length}\u27E7`;
        protectedBlocks.push(m);
        return key;
    });
    const protect = (mathContent) => {
        let clean = mathContent.trim();
        if (!clean)
            return '';
        let trail = '';
        const m = clean.match(/([,;.]+)$/);
        if (m) {
            trail = m[1];
            clean = clean.slice(0, -trail.length).trim();
        }
        // Unpack any nested ⟦MATH_...⟧ tokens already inside clean so tokens never nest
        let unpackPasses = 0;
        while (/\u27E6MATH_(\d+)\u27E7/.test(clean) && unpackPasses < 10) {
            clean = clean.replace(/\u27E6MATH_(\d+)\u27E7/g, (_, id) => {
                const inner = protectedBlocks[Number(id)] || '';
                return inner.replace(/^\$|\$$/g, '').trim();
            });
            unpackPasses++;
        }
        const key = `\u27E6MATH_${protectedBlocks.length}\u27E7`;
        protectedBlocks.push(`$${clean}$`);
        return ` ${key}${trail} `;
    };
    // Strip stray comma in backslash-comma outside math so clauses are not cut short
    s = s.replace(/\\,\s*/g, ' ');
    const proseLead = '(?:Let|If|Suppose|Given|Define|Find|Evaluate|Calculate|Show|Consider)\\b\\s*[:,]?\\s*';
    const proseStops = '(?:pass|passes|passing|touch|touches|touching|intersect|intersects|has|have|having|where|when|such|if|then|and|with|at|for|is|are|represented|representing|given|\\\\forall|\\\\exists|\\\\in|[∀∃∈∉])\\b';
    // 1. Environments (with optional LHS: f(x) = \begin{cases} ... \end{cases} or A = \begin{pmatrix} ... \end{pmatrix})
    s = s.replace(new RegExp(`(${proseLead})?((?:[a-zA-Z]\\s*(?:\\([^()\\n]*\\))?\\s*=\\s*)?\\\\begin\\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|aligned)\\}[\\s\\S]+?\\\\end\\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|aligned)\\})`, 'g'), (_, lead, m) => (lead ? lead + ' ' : '') + protect(m));
    // 1b. Function mappings: e.g. f : \mathbb{R} \to \mathbb{R}
    s = s.replace(/(?<![a-zA-Z0-9_\$])([a-zA-Z]\s*:\s*(?:\\mathbb\{[A-Z]\}|[A-Z])\s*\\to\s*(?:\\mathbb\{[A-Z]\}|[A-Z]))(?![a-zA-Z0-9_\$])/g, (_, m) => protect(m));
    // 3. Symmetric 3D Line Equations: \frac{x-x1}{a} = \frac{y-y1}{b} = \frac{z-z1}{c}
    s = s.replace(new RegExp(`(?<![$\\w])((?:\\\\(?:d?frac)\\{[^{}]+\\}\\{[^{}]+\\}|[a-zA-Z0-9_+-]+)\\s*=\\s*(?:\\\\(?:d?frac)\\{[^{}]+\\}\\{[^{}]+\\}|[a-zA-Z0-9_+-]+)\\s*=\\s*(?:\\\\(?:d?frac)\\{[^{}]+\\}\\{[^{}]+\\}|[a-zA-Z0-9_+-]+))(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'gi'), (_, m) => protect(m));
    // 4. Integrals: \int ... dx, with optional LHS (e.g. g(x) = \int... or \alpha = \int...) or optional scalar coefficient (e.g. \frac{2}{\pi} \int...) or RHS equation (e.g. \int... dt = 2x - 1)
    const intCoeff = `(?:[a-zA-Z\\u0370-\\u03FF\\\\][0-9a-zA-Z_\\^{}'′]*(?:\\s*\\([^()\\n]+\\))?\\s*=\\s*|[-+]?(?:\\\\(?:d?frac)\\{[^{}]+\\}\\{[^{}]+\\}|[0-9a-zA-Z_]+(?:\\/[0-9a-zA-Z_]+)?)\\s*)?`;
    const intRhsPattern = `(?:\\s*=\\s*(?:\\\\(?:d?frac|sqrt|cbrt|sin|cos|tan|cot|sec|csc|log|ln|exp|cdot|times)\\{[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\}|[-+*/0-9a-zA-Z_\\\\^'′{}()\\[\\]\\s.]|\\^\\{[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\})+?)?`;
    s = s.replace(new RegExp(`(${proseLead})?(${intCoeff}\\\\(?:int|iint|iiint|oint)(?:_[^{}\\s]+|_\\{\\s*[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\s*\\}|\\^[^{}\\s]+|\\^\\{\\s*[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\s*\\})*\\s*[\\s\\S]+?(?:\\\\,?\\s*d[a-zA-Z]|dx|dy|dt|dz|du|dv|d\\theta|dr)(?![a-zA-Z])${intRhsPattern})(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'gi'), (fullMatch, lead, math) => {
        const activeLead = lead || '';
        return (activeLead ? activeLead + ' ' : '') + protect(math);
    });
    // 5. Limits, Summations, Products: \lim_{...} ... (stop strictly before prose)
    s = s.replace(new RegExp(`(?<![$\\w])(\\\\(?:lim|sum|prod)(?:_[^{}\\s]+|_\\{\\s*[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\s*\\}|\\^[^{}\\s]+|\\^\\{\\s*[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\s*\\})*\\s*(?:[-a-zA-Z0-9_^{}()'|\\\\+*/\\[\\]\\s.]*?[-a-zA-Z0-9_^{}()'|\\\\+*/\\]]))(?=\\s+${proseStops}|\\s*[,;.]|$)`, 'gi'), (_, m) => protect(m));
    // 6. Differential equations with explicit differentials: 2x^2 dy = (2xy+y^2) dx OR y(x+1) dx - x^2 dy = 0 OR [ ... ] x \dfrac{dy}{dx} = ...
    s = s.replace(new RegExp(`(${proseLead})?([-a-zA-Z0-9_^{}()'|\\\\+*/\\[\\]\\s.]*?\\b(?:d\\^?[0-9]?[a-zA-Z]?\\/d[a-zA-Z]\\^?[0-9]?|\\\\(?:d?frac)\\{d\\^?[0-9]?[a-zA-Z]?\\}\\{d[a-zA-Z]\\^?[0-9]?\\}|dy|dx|dt|dz)\\b[-a-zA-Z0-9_^{}()'|\\\\+*/\\[\\]\\s.]*?=[-a-zA-Z0-9_^{}()'|\\\\+*/\\[\\]\\s.]+?)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'gi'), (fullMatch, lead, eq) => {
        let activeLead = lead || '';
        let activeEq = eq;
        const introMatch = activeEq.match(/^(.*?\b(?:(?:solution\s+curve\s+of\s+the\s+)?differential\s+equation|solution\s+curve|equation|curve|relation)\s*[:,]?\s*)([\s\S]+)$/i);
        if (introMatch) {
            activeLead += introMatch[1];
            activeEq = introMatch[2];
        }
        const nonLatex = activeEq.replace(/\\[a-zA-Z]+/g, ' ');
        if (/\b(?:let|the|curve|passes|passing|through|solution|find|evaluate)\b/i.test(nonLatex)) {
            return fullMatch;
        }
        return (activeLead ? activeLead + ' ' : '') + protect(activeEq);
    });
    // 7. Vector Equations & Triple Products: \vec{r} = \vec{a} + \lambda \vec{b}, [\vec{a} \; \vec{b} \; \vec{c}]
    s = s.replace(/(?<![$\w])(\[\s*\\vec\{[^{}]+\}[\s\S]+?\\vec\{[^{}]+\}\s*\])/g, (_, m) => protect(m));
    s = s.replace(new RegExp(`(?<![$\\w])(\\\\vec\\{[^{}]+\\}\\s*=\\s*[^,;.\\n]+?)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'gi'), (_, m) => protect(m));
    // 8. General equations with LaTeX operators / functions: A^{-1} = ..., E = E^\circ - ...
    s = s.replace(new RegExp(`(${proseLead})?([-a-zA-Z0-9_^{}()'|\\\\+*/\\[\\],\\s.]+=([-a-zA-Z0-9_^{}()'|\\\\+*/\\[\\],\\s.]|\\\\(?:d?frac)\\{[^{}]+\\}\\{[^{}]+\\})+)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'g'), (fullMatch, lead, eq) => {
        let activeLead = lead || '';
        let activeEq = eq;
        const introMatch = activeEq.match(/^(.*?\b(?:(?:solution\s+curve\s+of\s+the\s+)?differential\s+equation|solution\s+curve|equation|curve|relation)\s*[:,]?\s*)([\s\S]+)$/i);
        if (introMatch) {
            activeLead += introMatch[1];
            activeEq = introMatch[2];
        }
        if (!/(\\[a-zA-Z]+|\^|_|\b(?:det|Tr|adj|sgn|sin|cos|tan|log|ln|exp)\b)/.test(activeEq)) {
            return fullMatch;
        }
        const nonLatex = activeEq.replace(/\\[a-zA-Z]+/g, ' ');
        if (/\b(?:let|the|and|for|with|where|when|if|then|is|are|find|curve|line|plane)\b/i.test(nonLatex)) {
            return fullMatch;
        }
        return (activeLead ? activeLead + ' ' : '') + protect(activeEq);
    });
    // 8b. Functional equations: f(x+y) = f(x) \cdot f(y) or f(xy) = f(x) + f(y)
    s = s.replace(new RegExp(`(?<![$\\w])([a-zA-Z]\\s*\\([^()\\n]+\\)\\s*=\\s*[-+*/a-zA-Z0-9_\\\\^{}()'|\\[\\]\\s.]*?[a-zA-Z0-9_^{}()'|\\[\\]\\\\)])(?=\\s+${proseStops}|\\s*[,;.]|$)`, 'gi'), (fullMatch, eq) => {
        const nonLatex = eq.replace(/\\[a-zA-Z]+/g, ' ');
        if (/\b(?:let|the|and|for|with|where|when|if|then|is|are|find)\b/i.test(nonLatex)) {
            return fullMatch;
        }
        return protect(eq);
    });
    // 9. Initial conditions / evaluations: y(2)=e, y(1)=e, f'(0), f(1/2), y(4)
    s = s.replace(new RegExp(`(?<![$\\w])([a-zA-Z]\\s*(?:'*\\s*\\([a-zA-Z0-9_+\\-/*\\\\^\\{\\}\\s.,]+\\)|'\\s*\\(\\s*0\\s*\\))\\s*=\\s*[-+*/a-zA-Z0-9_\\\\^{}()]+?)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'g'), (fullMatch, eq) => {
        const nonLatex = eq.replace(/\\[a-zA-Z]+/g, ' ');
        if (/\b(?:let|and|the|is|are|in|on|at|of|to|for|with|then|if|which|where)\b/i.test(nonLatex)) {
            return fullMatch;
        }
        return protect(eq);
    });
    // 10. Angles with degree symbol: \sin 45^\circ or 45^\circ
    s = s.replace(/(?<![$\w])((?:\\(?:sin|cos|tan|cot|sec|csc)\s*)?[0-9]+(?:\.[0-9]+)?\s*\^\s*\\circ)/g, (_, m) => protect(m));
    // 11. Curve definitions: y=f(x) or y=y(x)
    s = s.replace(/(?<![$\w])([a-zA-Z]\s*=\s*[a-zA-Z]\s*\([a-zA-Z0-9_+\-/*\s\\]+\))(?![$\w])/g, (_, m) => protect(m));
    // 11b. Point coordinates: point (1,2) or points (1,0) and (2\alpha, \alpha)
    s = s.replace(/(?<=\b(?:point|points|at|through|from)\s+)((?:\(\s*[^,()\n]+\s*,\s*[^,()\n]+(?:\s*,\s*[^,()\n]+)?\s*\)\s*(?:and|,)\s*)*\(\s*[^,()\n]+\s*,\s*[^,()\n]+(?:\s*,\s*[^,()\n]+)?\s*\))/gi, (m) => {
        return m.replace(/\(\s*[^,()\n]+\s*,\s*[^,()\n]+(?:\s*,\s*[^,()\n]+)?\s*\)/g, (pt) => protect(pt));
    });
    // 12a. Chain inequalities: e.g. 0 < x < \dfrac{\pi}{2} or 0 < x_1 < x_2 < 3 or -1 \le x \le 1
    s = s.replace(/(?<![$\w])([-+]?[0-9a-zA-Z_^{}()'′\\]+(?:\/[-+]?[0-9a-zA-Z_^{}()'′\\]+)?(?:\s*(?:<|>|<=|>=|≤|≥|\\le\b|\\ge\b|\\leq\b|\\geq\b)\s*[-+]?(?:\\(?:d?frac)\{[^{}]+\}\{[^{}]+\}|[0-9a-zA-Z_^{}()'′\\]+)){2,})(?![$\w])/gi, (_, m) => protect(m));
    // 12. Inequalities & non-equalities: x > 1, f'(x) < g'(x), \alpha, \beta > 0, f(x) \ne 0, \det A \neq 0
    s = s.replace(new RegExp(`(?<![$\\w])([-+*/0-9a-zA-Z_\\\\^{}()'′]+(?:\\s*[-+*/]\\s*[-+*/0-9a-zA-Z_\\\\^{}()'′]+)*\\s*(?:[><≤≥≠]|<=|>=|\\\\(?:ne\\b|neq\\b|le\\b|ge\\b|leq\\b|geq\\b))\\s*[-+*/0-9a-zA-Z_\\\\^{}()'′]+(?:\\s*[-+*/]\\s*[-+*/0-9a-zA-Z_\\\\^{}()'′]+)*)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'gi'), (fullMatch, eq) => {
        const nonLatex = eq.replace(/\\[a-zA-Z]+/g, ' ');
        if (/\b(?:if|then|and|where|when|for|let|is|are|the|statement|statements)\b/i.test(nonLatex))
            return fullMatch;
        if (!/[0-9a-zA-Z]/.test(eq))
            return fullMatch;
        return protect(eq.trim());
    });
    // 13. Single function terms / derivatives: f'(0), y(4), f( \dfrac{1}{2} ), f( 1/2 )
    s = s.replace(/(?<![$\w])([a-zA-Z]'*\s*\(\s*(?:\\(?:d?frac)\{[^{}]+\}\{[^{}]+\}|\d+\s*\/\s*\d+|[0-9a-zA-Z_+\-/*]+)\s*\))(?![$\w])/g, (_, m) => {
        const fracNorm = m.replace(/\(\s*(\d+)\s*\/\s*(\d+)\s*\)/, '\\left(\\dfrac{$1}{$2}\\right)')
            .replace(/\(\s*(\\d?frac\{[^{}]+\}\{[^{}]+\})\s*\)/, '\\left($1\\right)');
        return protect(fracNorm);
    });
    // 13b. Expressions before "is equal to" / "equals" / "is"
    // e.g. "then 6(y'(0) + (y(log_e √3))^2) is equal to", "then the value of 3\alpha^2 is equal to", "then the value of (\log_e |1 + \alpha| - \dfrac{3\pi}{4}) is"
    s = s.replace(/\b(then\s+(?:the\s+)?value\s+of|the\s+value\s+of|value\s+of|then|and|if|where|find|evaluate)\s+((?:[^,;.\n]|\.(?=\d))+?)\s+(is\s+equal\s+to|equals\b|is\b)(?:\s*[:=_\-]+|\s*(?=\[|\d|$))?/gi, (fullMatch, lead, expr, tail) => {
        let trimmed = expr.trim();
        trimmed = trimmed.replace(/(?<![a-zA-Z0-9_\\])([-+]?\d+)\s*\/\s*(\d+)(?![a-zA-Z0-9_])/g, '\\dfrac{$1}{$2}');
        if (/[0-9\+\-\*\/\^_{}\(\)\[\]\\|]/.test(trimmed) && !/\b(?:are|the|number|points|statement|curves?)\b/i.test(trimmed)) {
            let formatted = trimmed;
            if (formatted.startsWith('(') && formatted.endsWith(')') && !formatted.slice(1, -1).includes('(')) {
                formatted = `\\left(${formatted.slice(1, -1).trim()}\\right)`;
            }
            return `${lead} ${protect(formatted)} ${tail}`;
        }
        return fullMatch;
    });
    // 14b. Generalized set membership relations (MUST run BEFORE standalone \mathbb{R} / \mathbb{N} so \mathbb is not stolen):
    // e.g. x \in S, x, y \in S, l, m, n \in \mathbb{N}, \forall x \in (0, \pi/2), x \in \mathbb{R}, x \in [0, 1], x \in \{...\}
    s = s.replace(/(?<![$\w])((?:\\forall\s+|\\exists\s+|[∀∃]\s*)?[a-zA-Z\u0370-\u03FF\\][0-9a-zA-Z_\\^{}'′]*(?:\s*,\s*[a-zA-Z\u0370-\u03FF\\][0-9a-zA-Z_\\^{}'′]*)*\s*(?:\\(?:in|notin)|[∈∉])\s*(?:\\mathbb\{[A-Z]\}|[A-Z]|[\[\(][^()\[\]\n]+[\]\)]|\\?\{[^{}\n]+?\\?\}))(?![$\w])/g, (_, m) => protect(m));
    // Greatest integer inequality: e.g. "greatest integer \le t" -> "greatest integer $\le t$"
    s = s.replace(/(?<=\bgreatest\s+integer\s+(?:function\s+)?)(?:\\le|\\ge|<=|>=|≤|≥)\s*([a-zA-Z0-9]+)/gi, (_, v) => protect(`\\le ${v}`));
    // 13c. Standalone blackboard bold sets: \mathbb{R}, \mathbb{N}, etc.
    s = s.replace(/(?<![$\w])(\\(?:mathbb|mathbf|mathcal)\{[A-Z]\})(?![$\w])/g, (_, m) => protect(m));
    // 13d. Function composition expressions: e.g. (f \circ g)(x) or (fog)(x)
    s = s.replace(/(?<![$\w])(\([a-zA-Z]\s*\\circ\s*[a-zA-Z]\)\s*(?:\([^()\n]+\))?)(?![$\w])/gi, (_m, expr) => protect(expr));
    // 14a. Modulus / Absolute Value expressions: e.g. |1 + \alpha|, |x|, \log_e |1 + \alpha|, \ln |x|, |f(x)|
    s = s.replace(/(?<![$\w|\\])(\\log(?:_[0-9a-zA-Z]+)?\s*|\\ln\s*)?(\|(?:[^{}|\n]|\\{[^{}]*\\})+\|)(?![$\w|])/g, (m) => protect(m));
    // 14b-2. Standalone trig / inverse trig / math functions with arguments: e.g. \tan^{-1} x, \sin x, \cos(2x)
    s = s.replace(/(?<![$\w\\])(\\(?:sin|cos|tan|cot|sec|csc|log|ln|exp)(?:\^\{?-?1\}?|\^[0-9]+)?(?:\s*\([^()\n]+\)|\s+[a-zA-Z0-9]+))(?![$\w])/g, (m) => protect(m));
    // 14c. Simple variable assignments after at/for/where/when/if: at x = 0, for x = 1
    s = s.replace(new RegExp(`(?<=\\b(?:at|for|where|when|if|with)\\s+)([a-zA-Z]\\s*=\\s*[-+]?[0-9a-zA-Z_\\\\^{}()]+)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'g'), (_, m) => protect(m));
    // 14d. Parenthesized or bracketed fractions with optional exponents:
    // e.g. (\dfrac{y}{x})^{3}, \left(\dfrac{y}{x}\right)^3, \left[\dfrac{y}{x}\right]^2, (\dfrac{1}{2})^n
    s = s.replace(/(?<![a-zA-Z0-9_\$\\])(?:\\left\s*\(\s*|\(\s*)([-+]?\s*\\(?:d?frac)\{(?:[^{}]|\{[^{}]*\})*\}\{(?:[^{}]|\{[^{}]*\})*\}[\s\S]*?)(?:\\right\s*\)|\))(?:\s*\^\s*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|[0-9a-zA-Z]+))?(?![a-zA-Z0-9_\$])/g, (m) => {
        let cleaned = m.trim();
        let exp = '';
        const expMatch = cleaned.match(/\^\s*(\{[\s\S]+\}|[0-9a-zA-Z]+)$/);
        if (expMatch) {
            exp = `^${expMatch[1]}`;
            cleaned = cleaned.slice(0, cleaned.length - expMatch[0].length).trim();
        }
        if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
            cleaned = cleaned.slice(1, -1).trim();
        }
        else if (cleaned.startsWith('\\left(') && cleaned.endsWith('\\right)')) {
            cleaned = cleaned.slice(6, -7).trim();
        }
        return protect(`\\left(${cleaned}\\right)${exp}`);
    });
    s = s.replace(/(?<![a-zA-Z0-9_\$\\])(?:\\left\s*\[\s*|\[\s*)([-+]?\s*\\(?:d?frac)\{(?:[^{}]|\{[^{}]*\})*\}\{(?:[^{}]|\{[^{}]*\})*\}[\s\S]*?)(?:\\right\s*\]|\])(?:\s*\^\s*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|[0-9a-zA-Z]+))?(?![a-zA-Z0-9_\$])/g, (m) => {
        let cleaned = m.trim();
        let exp = '';
        const expMatch = cleaned.match(/\^\s*(\{[\s\S]+\}|[0-9a-zA-Z]+)$/);
        if (expMatch) {
            exp = `^${expMatch[1]}`;
            cleaned = cleaned.slice(0, cleaned.length - expMatch[0].length).trim();
        }
        if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
            cleaned = cleaned.slice(1, -1).trim();
        }
        else if (cleaned.startsWith('\\left[') && cleaned.endsWith('\\right]')) {
            cleaned = cleaned.slice(6, -7).trim();
        }
        return protect(`\\left[${cleaned}\\right]${exp}`);
    });
    // General parenthesized math expressions with powers: e.g. (1+x^6)^{3/2}, (x+1)^2
    s = s.replace(/(?<![a-zA-Z0-9_\$\\])(?:\\left\s*\(\s*|\(\s*)([-+0-9a-zA-Z_\\^\{\}\s/+\-*.,]+?)(?:\\right\s*\)|\))\s*\^\s*((?:\{[^{}]*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}[^{}]*)*\}|[0-9a-zA-Z]+))(?![a-zA-Z0-9_\$])/g, (full, inner, exp) => {
        const stripped = inner.replace(/\\[a-zA-Z]+/g, ' ');
        if (/\b(?:let|the|and|is|are|in|on|at|of|to|for|with|then|if|which|where|be)\b/i.test(stripped)) {
            return full;
        }
        const expStr = exp.startsWith('{') ? exp : `{${exp}}`;
        return protect(`\\left(${inner.trim()}\\right)^${expStr}`);
    });
    // 14e. Radicals with optional leading coefficient: e.g. 6\sqrt{10}, 2\sqrt{2}, \sqrt{x^2+1}
    s = s.replace(/(?<![a-zA-Z0-9_\$\\])([-+]?\s*\d*\s*\\(?:sqrt|cbrt)(?:\[[^\]]+\])?\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})(?![a-zA-Z0-9_\$])/g, (_, m) => protect(m.trim()));
    // Clean empty \dfrac{} or \frac{} so they are never protected into standalone invalid $\dfrac{}$
    s = s.replace(/\\(?:d?frac)\{\s*\}\s*\{\s*\}/g, '');
    s = s.replace(/\\(?:d?frac)\{\s*\}\s*/g, '');
    s = s.replace(/\\(?:d?frac)(?!\s*\{)/g, '');
    // Expressions after "square root of" / "cube root of": e.g. "square root of \frac{a^2}{4} + ... - \frac{3}{4}", "(4a+5b+5c)^2 - (5a+4b+4c)^2"
    s = s.replace(new RegExp(`(?<=\\b(?:square\\s+root\\s+of|cube\\s+root\\s+of)\\s+)([-+0-9a-zA-Z_\\\\^'′{}()\\[\\]\\s/+\\-*.,]+?)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'gi'), (fullMatch, expr) => {
        const stripped = expr.replace(/\\[a-zA-Z]+/g, ' ');
        if (/\b(?:let|the|and|for|with|where|when|if|then|is|are)\b/i.test(stripped))
            return fullMatch;
        if (/[0-9a-zA-Z_\\^{}()+\-*/]/.test(expr)) {
            return protect(expr);
        }
        return fullMatch;
    });
    // Compound fraction sums/differences: e.g. \dfrac{a^2}{4} + \dfrac{1}{a^2} - \dfrac{1}{a} + \dfrac{a}{2} - \dfrac{3}{4}
    s = s.replace(new RegExp(`(?<![$\\w])((?:[-+]?\\s*\\\\(?:d?frac)\\{[^{}]+\\}\\{[^{}]+\\}|[-+]?[0-9a-zA-Z_\\\\^{}()]+)(?:\\s*[-+*/]\\s*[-+]?(?:\\\\(?:d?frac)\\{[^{}]+\\}\\{[^{}]+\\}|\\\\(?:sqrt|cbrt)\\{[^{}]+\\}|[0-9a-zA-Z_\\\\^{}()]+))+)(?=\\s*[,;.]|\\s+${proseStops}|$)`, 'gi'), (fullMatch, expr) => {
        if (!/\\(?:d?frac|sqrt|cbrt)\{/.test(expr))
            return fullMatch;
        const stripped = expr.replace(/\\[a-zA-Z]+/g, ' ');
        if (/\b(?:let|the|and|for|with|where|when|if|then|is|are|find|curve|line|plane)\b/i.test(stripped)) {
            return fullMatch;
        }
        return protect(expr);
    });
    // 15. Remaining standalone LaTeX commands with balanced braces
    s = s.replace(new RegExp(`(?<![$\\w])(\\\\(?:d?frac)\\{(?:[^{}]|\\{[^{}]*\\})+\\}\\{(?:[^{}]|\\{[^{}]*\\})+\\}|\\\\(?:sqrt|vec|hat|bar|dot|ddot|tilde|mathbf|mathrm|text|operatorname)\\{(?:[^{}]|\\{[^{}]*\\})*\\}(?:[A-Za-z0-9_^{}\\\\()[\\]+\\-*/\\s.]*[A-Za-z0-9_^{}\\\\()[\\]+\\-*/])?|\\\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|infty|times|div|pm|mp|le|ge|ne|approx|sim|to|partial|nabla|degree|circ)(?![a-zA-Z]))(?=\\s*[,;.]|\\s+${proseStops}|$|\\s+[a-zA-Z]{3,})`, 'gi'), (fullMatch, cmd) => protect(cmd));
    // 1. Expand any remaining nested ⟦MATH_...⟧ tokens inside protectedBlocks
    for (let p = 0; p < 10; p++) {
        let changed = false;
        for (let i = 0; i < protectedBlocks.length; i++) {
            if (/[\u27E6⟦\[]MATH_?(\d+)[\u27E7⟧\]]/i.test(protectedBlocks[i])) {
                protectedBlocks[i] = protectedBlocks[i].replace(/[\u27E6⟦\[]MATH_?(\d+)[\u27E7⟧\]]/gi, (_, id) => {
                    const inner = protectedBlocks[Number(id)] || '';
                    return inner.replace(/^\$|\$$/g, '').trim();
                });
                changed = true;
            }
        }
        if (!changed)
            break;
    }
    // 2. Restore all protected blocks into s recursively with global regex
    let restorePasses = 0;
    while (/[\u27E6⟦\[]MATH_?(\d+)[\u27E7⟧\]]/i.test(s) && restorePasses < 10) {
        s = s.replace(/[\u27E6⟦\[]MATH_?(\d+)[\u27E7⟧\]]/gi, (_, id) => {
            const block = protectedBlocks[Number(id)];
            return block !== undefined ? block : '';
        });
        restorePasses++;
    }
    // 3. Final safety cleanup: remove any leftover orphan tokens
    s = s.replace(/\u27E6MATH_\d+\u27E7/g, '');
    s = s.replace(/\[\|MATH_\d+\|\]/g, '');
    s = s.replace(/___PROT_\d+___/g, '');
    s = s.replace(/\[\s*MATH_\d+\s*\]/gi, '');
    s = s.replace(/⟦\s*MATH_\d+\s*⟧/gi, '');
    s = s.replace(/\\(?:d?frac)\{\s*\}\s*\{\s*\}/g, '');
    s = s.replace(/\\(?:d?frac)\{\s*\}\s*/g, '');
    s = s.replace(/\\(?:d?frac)(?!\s*\{)/g, '');
    // 4. Clean adjacent dollars and spacing
    s = s.replace(/\$\s*\$/g, ' ');
    s = s.replace(/\$\$+/g, '$');
    s = s.replace(/\s+,/g, ',');
    s = s.replace(/\s+\./g, '.');
    s = s.replace(/[^\S\r\n]+/g, ' ').trim();
    return s;
}
/**
 * Normalizes mathematical option text (fractions, logarithms, powers, single numbers).
 * Leaves descriptive English choices ("None of these", "Both A and B") as plain text.
 */
export function normalizeOptionMath(raw) {
    if (!raw)
        return '';
    let s = raw.trim();
    s = s.replace(/\s*\.$/, '');
    s = s.replace(/\\\\([a-zA-Z]+)/g, '\\$1');
    // PDF / Word clipboard circumflex and hat accent artifacts:
    // e.g. x ^\in [0,3] -> \hat{x} \in [0,3], x `\in -> \hat{x} \in, x ˆ\in -> \hat{x} \in, x ̂ -> \hat{x}
    s = s.replace(/([a-zA-Z])\s*[\^ˆ`\u0302]\s*(?=\\in\b|\\notin\b|[∈∉⊆⊂]|<=|>=|<|>|=|!=|≠)/g, '\\hat{$1} ');
    s = s.replace(/([a-zA-Z])\u0302/g, '\\hat{$1}');
    s = s.replace(/([a-zA-Z])\s*[\^ˆ`]\s+(?=[0-9a-zA-Z_\\([{])/g, '\\hat{$1} ');
    // Extra spaces inside function call parens: f'(x ) -> f'(x), g'(x ) -> g'(x)
    s = s.replace(/([a-zA-Z]['′]?)\s*\(\s*([a-zA-Z0-9_\\]+)\s+\)/g, '$1($2)');
    // Glued min / max operators before functions or delimiters:
    // e.g. minf'(x) -> \min f'(x), maxg'(x) -> \max g'(x), maxf(x) -> \max f(x), min(a,b) -> \min(a,b)
    s = s.replace(/(?<![a-zA-Z\\])(min|max)(?=[fghxyzuvwFGHXYZUVW](?:'|\(|\b))/gi, (_m, op) => `\\${op.toLowerCase()} `);
    s = s.replace(/(?<![a-zA-Z\\])(min|max)(?=\s*[({_\\|])/gi, (_m, op) => `\\${op.toLowerCase()} `);
    s = s.replace(/(?<![a-zA-Z\\])\b(min|max)\b(?!\s*(?:imum|imal|imize|or|ors|ority|ute|us)\b)(?=\s+[a-zA-Z0-9])/gi, (_m, op) => `\\${op.toLowerCase()}`);
    if ((s.startsWith('$') && s.endsWith('$') && !s.slice(1, -1).includes('$')) ||
        (s.startsWith('\\(') && s.endsWith('\\)')) ||
        (s.startsWith('\\[') && s.endsWith('\\]'))) {
        return s.replace(/\\frac\b/g, '\\dfrac');
    }
    // Check if option contains English prose (e.g. "there exists \hat{x} \in [0,3] such that...", "Both A and B")
    const PROSE_PATTERN = /\b(?:there\s+exists?|there\s+exist|such\s+that|where|when|for\s+all|for\s+every|for\s+some|which|is|are|was|were|be|been|has|have|strictly|increasing|decreasing|monotonic|continuous|differentiable|roots?|solutions?|real|distinct|at\s+least|at\s+most|exactly|none|both|neither|either|cannot|can|not|true|false|correct|incorrect|statement|above|below)\b/i;
    const hasProse = PROSE_PATTERN.test(s);
    const hasMath = /[\\^_\d+*/=><≤≥≠∈∉∀∃]/.test(s) || /[a-zA-Z]\s*\([^()]+\)/.test(s);
    if (hasProse) {
        if (hasMath) {
            return normalizeCanonicalMath(s);
        }
        return s;
    }
    // 1. Plain text fraction and exponential tokens in options
    s = s.replace(/\b1\s+2\s*(?:exp|\\exp)\b/gi, '\\dfrac{1}{2} \\exp');
    s = s.replace(/\b1\s+4\s*(?:exp|\\exp)\b/gi, '\\dfrac{1}{4} \\exp');
    s = s.replace(/\b2\s*(?:exp|\\exp)\b/gi, '2 \\exp');
    s = s.replace(/(?<!\\)\bexp\b/gi, '\\exp');
    s = s.replace(/\\exp\s+(?!\\left)([-+]?[0-9a-zA-Z\\^{}_/]+(?:\s*[-+]\s*[-+]?[0-9a-zA-Z\\^{}_/]+)*)/g, '\\exp\\left($1\\right)');
    s = s.replace(/\b1\s+2\b/g, '\\dfrac{1}{2}');
    s = s.replace(/\b1\s+4\b/g, '\\dfrac{1}{4}');
    s = s.replace(/\b3\s+4\b/g, '\\dfrac{3}{4}');
    s = s.replace(/\b3\s+8\b/g, '\\dfrac{3}{8}');
    s = s.replace(/\b5\s+2\b/g, '\\dfrac{5}{2}');
    s = s.replace(/\b17\s+2\b/g, '\\dfrac{17}{2}');
    s = s.replace(/[-−]\s*3\s+2e\b/gi, '-\\dfrac{3}{2e}');
    s = s.replace(/[-−]\s*2\s+3e\b/gi, '-\\dfrac{2}{3e}');
    s = s.replace(/[-−]\s*3\s+e\b/gi, '-\\dfrac{3}{e}');
    s = s.replace(/[-−]\s*2\s+e\b/gi, '-\\dfrac{2}{e}');
    s = s.replace(/\\pi\s*([2-9]|12|16|32)\b/g, '\\dfrac{\\pi}{$1}');
    s = s.replace(/e\s*\\pi\s*\/\s*([0-9]+)/gi, 'e^{\\dfrac{\\pi}{$1}}');
    // 1b. Logarithm conversions: log_e 2 -> \log_e 2, ln x -> \ln x
    s = s.replace(/(?<!\\)\blog_([a-zA-Z0-9]+|\{[^{}]+\})/g, '\\log_{$1}');
    s = s.replace(/(?<!\\)\b(log|ln)\b/g, '\\$1');
    // Exponents with nested parens e.g. (8)^(1/4) -> (8)^{1/4} and prime derivatives
    s = fixNestedExponents(s);
    s = normalizePrimes(s);
    // 2. Fractions: balanced parentheses and nested fractions (e.g. 3/(1+(8)^(1/4)), 1/(1-log_e 2))
    s = convertFractionsBalanced(s);
    s = s.replace(/(?<![a-zA-Z0-9_\\])(-?[0-9a-zA-Z_\\^{}]+)\s*\/\s*\(([^\(\)\n]+)\)/g, '\\dfrac{$1}{$2}');
    s = s.replace(/\(([^\(\)\n]+)\)\s*\/\s*(-?[0-9a-zA-Z_\\^{}]+)(?![a-zA-Z0-9_\\])/g, '\\dfrac{$1}{$2}');
    s = s.replace(/\(([^\(\)\n]+)\)\s*\/\s*\(([^\(\)\n]+)\)/g, '\\dfrac{$1}{$2}');
    s = s.replace(/(?<![a-zA-Z0-9_\/])(-?\d+)\s*\/\s*(\d+)(?![a-zA-Z0-9_\/])/g, '\\dfrac{$1}{$2}');
    // 3. Unicode math in options
    s = s.replace(/[\u200B-\u200F\u2060-\u2064\uFEFF\u00AD\u034F\u180E\uFFF9-\uFFFC]/g, '')
        .replace(/−/g, '-')
        .replace(/°/g, '^\\circ')
        .replace(/×/g, '\\times')
        .replace(/÷/g, '\\div')
        .replace(/π/g, '\\pi ')
        .replace(/α/g, '\\alpha ');
    // Radicals: 4√2 -> 4\sqrt{2}, √((...)) -> \sqrt{...}
    s = s.replace(/√\s*\(\s*\(\s*([^()]+)\s*\)\s*\)/g, '\\sqrt{$1}');
    s = s.replace(/\\?sqrt\s*\(\s*\(\s*([^()]+)\s*\)\s*\)/g, '\\sqrt{$1}');
    s = s.replace(/(\d+)\s*√\s*(\d+)/g, '$1\\sqrt{$2}');
    s = s.replace(/√\s*(\d+)/g, '\\sqrt{$1}');
    s = s.replace(/√\s*\(([^()]+)\)/g, '\\sqrt{$1}');
    s = s.replace(/√\s*\{([^{}]+)\}/g, '\\sqrt{$1}');
    s = s.replace(/√\s*([a-zA-Z]+)/g, '\\sqrt{$1}');
    s = s.replace(/√/g, '\\sqrt ');
    // 4. Exponentials and square roots (including nested fraction arguments)
    s = s.replace(/\\?exp\s*\(\s*\(\s*([^()]+)\s*\)\s*\/\s*\(\s*([^()]+)\s*\)\s*\)/gi, '\\exp\\left(\\dfrac{$1}{$2}\\right)');
    s = s.replace(/\\?exp\s*\(\s*\(\s*([^()]+)\s*\)\s*\/\s*([^()]+)\s*\)/gi, '\\exp\\left(\\dfrac{$1}{$2}\\right)');
    s = s.replace(/\\?exp\s*\(\s*([^/()]+)\s*\/\s*\(\s*([^()]+)\s*\)\s*\)/gi, '\\exp\\left(\\dfrac{$1}{$2}\\right)');
    s = s.replace(/\\?exp\s*\(\s*([^/()]+)\s*\/\s*([^/()]+)\s*\)/gi, '\\exp\\left(\\dfrac{$1}{$2}\\right)');
    s = s.replace(/\\?exp\s*\(\s*\(\s*([^()]+)\s*\)\s*\)/gi, '\\exp\\left($1\\right)');
    s = convertExpBraces(s);
    s = convertLiteralCurlyBraces(s);
    s = s.replace(/\\?exp\s*\(\s*([^()]+)\s*\)/g, '\\exp\\left($1\\right)');
    s = s.replace(/\\?sqrt\s*\(\s*([^()]+)\s*\)/g, '\\sqrt{$1}');
    s = s.replace(/\\frac\b/g, '\\dfrac');
    s = s.replace(/(\\(?:pi|alpha|beta|gamma|theta|lambda|mu|omega)(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?)\s*\/\s*([a-zA-Z0-9]+)/g, '\\dfrac{$1}{$2}');
    s = sanitizeDelimiters(s);
    // Pure math option: wrap in $ ... $
    const isMathExpr = /[\^_\\]|\b\d+\b|[+\-*/=><≤≥≠]/.test(s);
    if (isMathExpr) {
        return `$${s}$`;
    }
    return s;
}
/**
 * Sanitizes and repairs unclosed, missing, or mismatched \left and \right delimiters.
 * Handles recurring real-world JEE copy-paste and Word/OCR corruptions:
 * - \right\tan or \right \tan -> \right) \tan
 * - \right\cos, \right\sin, \right\sqrt, \right\dfrac, etc.
 * - \left( ... \right. -> \left( ... \right)
 * - \left[ ... \right. -> \left[ ... \right]
 * - Stray orphan $\right.$ or \right. with no \left
 * - Preserves legitimate piecewise cases \left\{ \begin{cases} ... \end{cases} \right.
 */
export function sanitizeDelimiters(text) {
    if (!text)
        return '';
    let s = text;
    // 1. Strip orphan $\right.$ or $\left.$ with no paired delimiter across the whole string
    s = s.replace(/\$\s*\\right\s*\.\s*\$/g, '');
    s = s.replace(/\$\s*\\left\s*\.\s*\$/g, '');
    s = s.replace(/(^|[\s.,;:!?])\\right\s*\.(?=\s*[\s.,;:!?]|$)/g, '$1');
    // Valid right delimiter commands in LaTeX:
    const validRightDelimCmds = '(?:[}\\\\|]|rangle|rceil|rfloor|rgroup|rmoustache|vert|Vert|uparrow|downarrow|updownarrow|Uparrow|Downarrow|Updownarrow)\\b';
    // 2a. Fix \right followed immediately (or with spaces) by a non-delimiter LaTeX command:
    const nonDelimCmdRegex = new RegExp(`\\\\right\\s*(\\\\(?!(?:${validRightDelimCmds}))[a-zA-Z]+)`, 'g');
    s = s.replace(nonDelimCmdRegex, (_m, cmd) => `\\right) ${cmd}`);
    // 2b. Fix \right followed by whitespace and non-delimiter characters:
    const validSingleRightDelims = '[\\]\\)\\}\\/\\|.]';
    s = s.replace(new RegExp(`\\\\right\\s+(?!${validSingleRightDelims}|\\\\(?:${validRightDelimCmds}))`, 'g'), '\\right) ');
    // 2c. Fix \right followed immediately by closing curly brace, dollar sign, or end of string:
    s = s.replace(/\\right\s*(?=\}|\$|$)/g, '\\right) ');
    // 2d. Fix \left followed by non-delimiter LaTeX command:
    const validLeftDelimCmds = '(?:[{\\\\|]|langle|lceil|lfloor|lgroup|lmoustache|vert|Vert|uparrow|downarrow|updownarrow|Uparrow|Downarrow|Updownarrow)\\b';
    const nonDelimLeftCmdRegex = new RegExp(`\\\\left\\s*(\\\\(?!(?:${validLeftDelimCmds}))[a-zA-Z]+)`, 'g');
    s = s.replace(nonDelimLeftCmdRegex, (_m, cmd) => `\\left( ${cmd}`);
    // 3. Fix \left( ... \right. where opening is '(' but closing is dummy dot '.'
    s = s.replace(/(\\left\s*\(\s*(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*?)\\right\s*\./g, '$1\\right)');
    s = s.replace(/(\\left\s*\[\s*(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*?)\\right\s*\./g, '$1\\right]');
    // For \left\{ ... \right., only change to \right\} if NOT enclosing an environment (cases, matrix, aligned, array)
    s = s.replace(/(\\left\s*\\\{\s*(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*?)\\right\s*\./g, (full, inner) => {
        if (/\\begin\{(?:cases|matrix|pmatrix|bmatrix|vmatrix|aligned|array)\}/.test(inner)) {
            return full;
        }
        return `${inner}\\right\\}`;
    });
    // 4. Clean orphan \right. or \right) inside formulas where there is NO corresponding \left
    const leftMatches = s.match(/\\left(?:[\[\(\{\|.]|\\\{)/g) || [];
    const rightMatches = s.match(/\\right(?:[\]\)\}\|.]|\\\})/g) || [];
    if (rightMatches.length > leftMatches.length) {
        s = s.replace(/\\right\s*\./g, (m) => {
            const curL = (s.match(/\\left(?:[\[\(\{\|.]|\\\{)/g) || []).length;
            const curR = (s.match(/\\right(?:[\]\)\}\|.]|\\\})/g) || []).length;
            if (curR > curL)
                return '';
            return m;
        });
    }
    // 5. Final balance: if more \left than \right, balance with \right.
    const finalL = (s.match(/\\left(?:[\[\(\{\|.]|\\\{)/g) || []).length;
    const finalR = (s.match(/\\right(?:[\]\)\}\|.]|\\\})/g) || []).length;
    if (finalL > finalR) {
        s += '\\right.'.repeat(finalL - finalR);
    }
    return s;
}
/**
 * Master Normalization Pipeline (Step 4 & Storage Rule).
 * Transforms raw pasted or extracted text into canonical KaTeX-ready LaTeX.
 */
export function normalizeCanonicalMath(raw) {
    if (!raw)
        return '';
    // 1. Strip rendered HTML (Storage Rule)
    let text = stripRenderedHtml(raw);
    // 2. Strip Word junk (nbsp, zero-width, smart quotes, etc.)
    text = stripWordJunk(text);
    // 3. Normalize double-escaped backslashes (Storage Rule)
    text = normalizeBackslashes(text);
    // 4. Convert Unicode math to LaTeX
    text = convertUnicodeMathToLatex(text);
    // 5. Repair linear math residues (fractions, differentials, exp, etc.)
    text = repairLinearMathResidues(text);
    // 6. Wrap bare LaTeX in $...$ leaving plain English outside
    text = wrapBareLatexInDollars(text);
    // 7. Sanitize & balance unclosed/corrupted delimiters (\right \tan, \left( ... \right., etc.)
    text = sanitizeDelimiters(text);
    return text;
}
