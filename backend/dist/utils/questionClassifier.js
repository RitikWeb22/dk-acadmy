/**
 * Question Detection, Segmentation & Classification Engine (Phase 6)
 *
 * Reliably classifies question types:
 * - Single correct MCQ
 * - Multiple correct MCQ
 * - Numerical answer questions
 * - Integer-type questions
 * - Assertion-Reason
 * - Passage / Comprehension based
 * - Match the following (List I/II or Column I/II)
 *
 * Also calculates standard exam-specific marking schemes (JEE Main, Advanced, NEET, BITSAT).
 */
/**
 * Classifies a question statement and its options into an exact QuestionType
 */
export function classifyQuestion(statement, options, targetExam = 'JEE Main') {
    const text = (statement || '').trim();
    const lower = text.toLowerCase();
    const indicators = [];
    const exam = (targetExam || 'JEE Main').toLowerCase();
    // 1. Check for Passage / Comprehension
    const isPassage = /comprehension|passage\s*(?:based|paragraph)|read\s+the\s+following\s+passage|paragraph\s+for\s+questions/i.test(lower);
    if (isPassage) {
        indicators.push('Contains passage/comprehension directive');
    }
    // 2. Check for Assertion-Reason
    const isAssertionReason = /(?:assertion\s*\(?a\)?[\s\S]*reason\s*\(?r\)?)|(?:statement\s*1[\s\S]*statement\s*2)/i.test(lower) ||
        /both\s+assertion\s+and\s+reason\s+are\s+true/i.test(lower);
    if (isAssertionReason) {
        indicators.push('Identified Assertion-Reason structure');
    }
    // 3. Check for Match the Following
    const isMatchFollowing = /match\s+the\s+following|column\s*i[\s\S]*column\s*ii|list\s*i[\s\S]*list\s*ii/i.test(lower);
    if (isMatchFollowing) {
        indicators.push('Identified Column/List match matrix');
    }
    // 4. Check for Multiple Correct
    const isMultipleCorrect = /one\s+or\s+more\s+(?:than\s+one\s+)?options?\s+(?:are|is)\s+correct|more\s+than\s+one\s+correct|select\s+all\s+(?:that\s+apply|correct)/i.test(lower);
    if (isMultipleCorrect) {
        indicators.push('Multiple correct directive detected');
    }
    // 5. Check for Numerical / Integer
    const filledOptions = (options || []).filter((o) => o.text && o.text.trim().length > 0);
    const isIntegerDirective = /answer\s+is\s+a\s+(?:non-negative\s+)?integer|integer\s+type|numerical\s+value|round\s+off\s+to/i.test(lower);
    const isNumerical = filledOptions.length === 0 || (filledOptions.length <= 1 && isIntegerDirective);
    let questionType = 'SINGLE_CORRECT';
    let confidence = 90;
    if (isPassage) {
        questionType = 'PASSAGE';
        confidence = 95;
    }
    else if (isAssertionReason) {
        questionType = 'ASSERTION_REASON';
        confidence = 95;
    }
    else if (isMatchFollowing) {
        questionType = 'MATCH_FOLLOWING';
        confidence = 95;
    }
    else if (isMultipleCorrect) {
        questionType = 'MULTIPLE_CORRECT';
        confidence = 92;
    }
    else if (isNumerical) {
        const isStrictInteger = /integer\s+(?:from\s+0\s+to\s+9|keypad|value\s+between)/i.test(lower);
        questionType = isStrictInteger ? 'INTEGER' : 'NUMERICAL';
        confidence = isIntegerDirective ? 95 : 85;
    }
    else {
        questionType = 'SINGLE_CORRECT';
    }
    // Calculate default marks & negative marks based on target exam
    let suggestedMarks = 4;
    let suggestedNegativeMarks = 1;
    if (exam.includes('advanced')) {
        if (questionType === 'MULTIPLE_CORRECT') {
            suggestedMarks = 4;
            suggestedNegativeMarks = 2;
        }
        else if (questionType === 'NUMERICAL' || questionType === 'INTEGER') {
            suggestedMarks = 3;
            suggestedNegativeMarks = 0;
        }
        else {
            suggestedMarks = 3;
            suggestedNegativeMarks = 1;
        }
    }
    else if (exam.includes('bitsat')) {
        suggestedMarks = 3;
        suggestedNegativeMarks = 1;
    }
    else if (exam.includes('neet')) {
        suggestedMarks = 4;
        suggestedNegativeMarks = 1;
    }
    else if (exam.includes('cuet')) {
        suggestedMarks = 5;
        suggestedNegativeMarks = 1;
    }
    else {
        // Default JEE Main
        suggestedMarks = 4;
        suggestedNegativeMarks = questionType === 'NUMERICAL' || questionType === 'INTEGER' ? 1 : 1;
    }
    return {
        questionType,
        confidence,
        indicators,
        suggestedMarks,
        suggestedNegativeMarks,
        isAssertionReason,
        isPassage,
        isMatchFollowing,
        isNumerical
    };
}
/**
 * Extracts solutions, DK Sir Shortcuts, and answer references from explanation text
 */
export function extractSolutionAndShortcuts(explanationText) {
    if (!explanationText) {
        return { stepSolution: '', dkSirShortcut: '' };
    }
    let text = explanationText.trim();
    let dkSirShortcut = '';
    let answerKey = undefined;
    // Check for DK Sir Shortcut / Trick
    const shortcutMatch = text.match(/(?:DK\s*Sir\s*Shortcut|Shortcut\s*(?:Trick)?|Alternative\s*Method|Quick\s*Method)\s*[:\-]\s*([\s\S]+?)(?=(?:\n\s*(?:Step|Solution|Ans|$)))/i);
    if (shortcutMatch) {
        dkSirShortcut = shortcutMatch[1].trim();
    }
    // Check for inline Answer Key (e.g. "Ans: (B)" or "Correct Option: C")
    const ansMatch = text.match(/(?:Ans(?:wer)?|Correct\s*Option)\s*[:\-\.]\s*\(?([A-Da-d0-9\.\-]+)\)?/i);
    if (ansMatch) {
        answerKey = ansMatch[1].trim().toUpperCase();
    }
    // Remove duplicate shortcut labels from main stepSolution if present
    let stepSolution = text;
    if (dkSirShortcut && shortcutMatch) {
        stepSolution = text.replace(shortcutMatch[0], '').trim();
    }
    return {
        stepSolution,
        dkSirShortcut,
        answerKey
    };
}
