# Word Equation Architecture & Paste Pipeline Ingestion

## 1. Word Equation Clipboard Structure & The Unit Parsing Bug

### The Raw Word Structure
When copying equations from desktop Microsoft Word (Office 365 / Word 2016+), Word places both the native OMML (Office Math Markup Language) and a plain-text downlevel fallback into the `text/html` clipboard payload:

```html
<!--[if gte msEquation 12]>
<m:oMathPara>
  <m:oMath>
    <m:rad>
      <m:radPr><m:degHide m:val="1"/></m:radPr>
      <m:e>
        <m:r><m:t>1+</m:t></m:r>
        <m:rad>
          <m:radPr><m:degHide m:val="1"/></m:radPr>
          <m:e>
            <m:r><m:t>1+</m:t></m:r>
            <m:sSup>
              <m:e><m:r><m:t>y</m:t></m:r></m:e>
              <m:sup><m:r><m:t>4</m:t></m:r></m:sup>
            </m:sSup>
          </m:e>
        </m:rad>
      </m:e>
    </m:rad>
  </m:oMath>
</m:oMathPara>
<![endif]-->
<![if !msEquation]>
<span style='mso-spacerun:yes'> </span>√(1+√(1+y^4 ))
<![endif]>
```

Word also produces `<xml><!--[if gte mso 9]>...<![endif]--></xml>` variants.

### The Problem
Previously:
1. Regex matching on `<m:oMath>` or `<m:oMathPara>` lacked backreferences:
   `/<(?:m:)?(?:oMathPara|oMath)\b[\s\S]*?<\/(?:m:)?(?:oMathPara|oMath)>/i`
   When an `<m:oMathPara>` wrapped an `<m:oMath>`, the non-greedy search terminated early at `</m:oMath>`, leaving an unclosed `<m:oMathPara>` trailing tag and malformed XML.
2. The conditional OMML comment and the following `<![if !msEquation]>...<![endif]>` fallback were handled in disconnected passes. If comments were stripped first, the plain-text fallback would leak into the question text; or if the fallback was removed unconditionally, invalid OMML left empty holes with no math.

### The Fix
In `preprocessRawHtmlMathDetailed` (in `ommlMathMLConverter.ts`):
- Each Word equation is extracted as **ONE unified atomic unit**: the conditional block (`<!--[if gte msEquation ...]>...<![endif]-->` or `<xml>`) plus its immediate adjacent downlevel fallback (`<![if !msEquation]>...<![endif]>`).
- The OMML is extracted, validated, and converted to LaTeX.
- **Atomic Replacement**:
  - If KaTeX validation passes: the entire unit (both comment and fallback) is replaced with the clean, delimited LaTeX string (`$...$`).
  - If KaTeX validation fails: the fallback text is preserved so equations are never deleted, and `needsReview = true` is set on the extraction result.

---

## 2. The `sanitizeFormula` Regex Bug and Fix

### The Problem
In `frontend/src/components/ui/MathEngine/sanitizeFormula.ts`, an aggressive cleanup regex existed:
```typescript
// Corrupting regex (removed):
res = res.replace(/(\^\{[^{}]+(?:\{[^{}]*\}[^{}]*)*)\}\}/g, '$1}');
```
This regex was intended to fix double braces on exponents (e.g., `x^{{2}}`). However, for nested radical expressions where an exponent occurs inside the radical (e.g. `\sqrt{1+\sqrt{1+y^{4}}}`), the exponent closing brace `}` followed immediately by the radical closing brace `}` formed `^{4}}`. The regex matched this and removed the inner radical's closing brace, producing:
```latex
\sqrt{1+\sqrt{1+y^{4}}   <-- missing closing brace for inner \sqrt!
```
KaTeX threw `KaTeX parse error: Expected '}', got 'EOF'`.

### The Fix
1. The faulty regex was removed entirely.
2. Single-character exponent normalization (`y^4` -> `y^{4}`) and unbraced fraction handling (`x^\frac{1}{2}` -> `x^{\frac{1}{2}}`) run with safe negative lookahead.
3. Auto-balancing for `\left` / `\right` and curly braces preserves structural radicals.
4. Regression test added in `backend/tests/pastePipelineHarness.test.ts` verifying that `sanitizeFormula` keeps nested radicals intact with exponents written both as `y^4` and `y^{4}`.

---

## 3. How to Add a New Fixture from `/admin/paste-debug`

To add a real clipboard capture to the automated test harness:

1. **Capture**:
   - Open the web application and navigate to `/admin/paste-debug`.
   - Paste clipboard content from Microsoft Word, Google Docs, or a web portal into the test input area.
   - The page records raw `text/plain`, raw `text/html`, and the pipeline transformation stages.
   - Click **Export Capture JSON** to download or copy the JSON capture.

2. **Add to Fixtures**:
   - Place the file in `backend/tests/fixtures/paste/<fixture-name>.json`.
   - Schema:
     ```json
     {
       "name": "descriptive-fixture-name",
       "synthetic": false,
       "label": "word_365_paste",
       "plain": "raw plain text here",
       "html": "raw html from clipboard here",
       "expectedStored": "$clean LaTeX with delimiters$"
     }
     ```
   - Set `"synthetic": false` for captures recorded from real applications. Keep synthetic test cases labelled `"synthetic": true`.

3. **Verify Harness**:
   - Run the frontend-backend paste harness test:
     ```bash
     node --import ./backend/node_modules/tsx/dist/loader.mjs --test backend/tests/pastePipelineHarness.test.ts
     ```
   - The test will automatically load the new fixture, verify token preservation, validate KaTeX rendering, and assert idempotent equation reconstruction.

