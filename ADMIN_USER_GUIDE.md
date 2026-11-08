# DK Academy JEE — Admin & Faculty User Guide: Math Import & Render System

This guide is designed for coaching faculty, question-bank creators, and data-entry operators preparing tests for JEE Main, JEE Advanced, BITSAT, and DPPs.

---

## 1. Quick Start: Single Question Copy-Paste

When copying questions from Microsoft Word, PDF documents, or online portals:

1. **Copy the text directly** in Microsoft Word or the source browser (`Ctrl + C` or `Cmd + C`).
2. Open the **Test Series Builder** in the DK Academy Admin Panel.
3. Click the **"Paste Word Question"** button or paste directly into the **Question Statement** box (`Ctrl + V`).
4. The system automatically:
   - Reads the rich Word equation format (OMML / MathML).
   - Strips Word junk, non-breaking spaces, and thin space residues (`\, dx`).
   - Normalizes fractions, exponents, differentials, and roots into canonical `$ ... $` LaTeX.
   - Updates the live **KaTeX Preview** instantly.
5. Review the preview on the right. **Zero manual code fixes are required** for standard JEE math notation.

---

## 2. Bulk Test Paper Upload (.docx)

Instead of pasting questions one by one, you can import an entire 30-, 60-, or 90-question test paper in **one click**:

1. In the Test Series Builder header, click **"Bulk Import .DOCX"**.
2. Select your default subject (**Mathematics**, **Physics**, or **Chemistry**).
3. Drag and drop your `.docx` test paper or click to choose the file.
4. Click **"Analyze & Extract Questions"**:
   - The server extracts all equations using Pandoc / OMML parser.
   - Detects question numbers (`Q1.`, `1.`, `(1)`), options `(A)`, `(B)`, `(C)`, `(D)`, correct keys, and marks.
   - Categorizes questions into **Section A (Single Correct MCQ)** and **Section B (Numerical Value)**.
5. Review the extraction statistics (Total questions found, valid math count).
6. Click **"Add All Questions to Test Series"**. All questions are populated directly into your workspace.

---

## 3. The Math Health Dashboard

At the top of every Test Series Builder workspace, you will find the **Math Health Dashboard**:

![Health Dashboard Overview](file:///d:/whats-matter-series/cohort-2.0%20restart/resume-projects/dk-institue/frontend/src/components/ui/MathEngine/ValidationDashboard.tsx)

### Status Indicators:
- 🟢 **GREEN ("Valid KaTeX")**: The question renders cleanly in KaTeX without any errors. It is certified ready for student examination.
- 🟡 **YELLOW ("AI / OCR Repaired")**: The question was restored via OCR or AI repair. It renders cleanly, but admin review is recommended before publishing. **Publishing is permitted.**
- 🔴 **RED ("KaTeX Error")**: The question contains a syntax error (e.g. unclosed curly brace, broken delimiter, empty fraction, or unresolved `[CHECK: ...]` marker).
  - A red alert banner appears: **"Publishing Blocked — Fix Red items before publishing"**.
  - Click **"Jump to Red Q"** to instantly scroll to and focus on the broken question.
  - **The system will strictly prevent publishing a test series while any question is RED.**

---

## 4. One-Click AI Repair (Gemini 2.5 Flash)

If you encounter an old or damaged question with broken LaTeX syntax (marked with a 🔴 **RED** badge):

1. Click the **"✨ AI Repair"** button located on the top right of the Question Statement editor.
2. The system calls Google Gemini 2.5 Flash with strict mathematical repair prompts:
   - Balances unclosed braces and delimiters.
   - Reconstructs broken fractions or differentials from context.
   - Never hallucinates ambiguous expressions (emits `[CHECK: reason]` if truly illegible).
3. The **AI Math Repair Modal** opens:
   - Inspect the **Side-by-Side Live Preview** (Original vs. Repaired).
   - View the LaTeX diff.
4. Click **"Apply Repaired LaTeX"**. The badge updates from 🔴 **RED** to 🟡 **YELLOW** / 🟢 **GREEN**, immediately clearing the publishing block.

---

## 5. KaTeX Formatting Cheat Sheet for Faculty

For manual editing or fine-tuning, use these standard KaTeX conventions:

### Mathematical Conventions:
| Mathematical Item | Correct LaTeX Format | Example Output |
|---|---|---|
| **Inline Math** | `$x^2 + y^2 = r^2$` | $x^2 + y^2 = r^2$ |
| **Display Math** | `$$\int_0^\infty e^{-x} dx = 1$$` | Display equation |
| **Tall Fractions** | `\dfrac{a}{b}` or `\frac{a}{b}` | $\dfrac{a}{b}$ |
| **Differentials** | `\dfrac{dy}{dx}` or `dy`, `dx` | $\dfrac{dy}{dx}$ |
| **Radicals** | `\sqrt{x^2 + y^2}`, `\sqrt[3]{x}` | $\sqrt{x^2 + y^2}$ |
| **Exponentials** | `e^{x}`, `\exp\left\{ x \right\}` | $e^x$, $\exp\{x\}$ |
| **Trig & Inverse Trig** | `\sin^2 x`, `\tan^{-1}(x^3)` | $\sin^2 x$, $\tan^{-1}(x^3)$ |
| **Limits** | `\lim_{x\to 0} \dfrac{\sin x}{x}` | $\lim_{x\to 0} \dfrac{\sin x}{x}$ |
| **Piecewise Functions** | `\begin{cases} x^2 & x \ge 0 \\ -x & x < 0 \end{cases}` | Piecewise branches |
| **Matrices** | `\begin{pmatrix} a & b \\ c & d \end{pmatrix}` | $2 \times 2$ matrix |
| **Vectors** | `\vec{a}`, `\hat{i}`, `\hat{j}`, `\hat{k}` | $\vec{a}$, $\hat{i}$ |
| **Scalar Triple Product** | `[\vec{a} \; \vec{b} \; \vec{c}]` | $[\vec{a} \; \vec{b} \; \vec{c}]$ |

### Physics & Chemistry Conventions:
| Concept | Correct LaTeX Format | Example Output |
|---|---|---|
| **Chemical Formulas** | `\mathrm{H_2SO_4}`, `\mathrm{KMnO_4}` | $\mathrm{H_2SO_4}$ |
| **Equilibrium Reaction** | `\mathrm{N_2 + 3H_2 \rightleftharpoons 2NH_3}` | Reaction arrows |
| **Nuclear Decay** | `\mathrm{^{238}_{92}U \to ^{234}_{90}Th + ^4_2\alpha}` | Isotope notation |
| **Nernst Equation** | `E = E^\circ - \dfrac{0.0591}{n} \log Q` | Electrochemical equation |
| **Physics Units** | `v = 20 \text{ m/s}`, `F = 10 \text{ N}` | Units in roman text |
| **Angles & Degrees** | `45^\circ`, `90^\circ` | $45^\circ$ |

