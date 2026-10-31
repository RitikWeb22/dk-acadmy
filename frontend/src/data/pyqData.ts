import type { PYQQuestion } from '../types';

export const PYQ_QUESTIONS: PYQQuestion[] = [
  // --- FEATURED OFFICIAL JEE MAIN MATHEMATICS QUESTIONS ---
  {
    id: 'pyq-main-math-straight-lines-featured',
    exam: 'JEE Main',
    year: 2024,
    subject: 'Mathematics',
    chapter: 'Straight Lines',
    topic: 'Coordinate Geometry & Family of Lines',
    type: 'Single Choice MCQ',
    marks: '+4 / -1',
    statement: 'A straight line L passing through the point P(2, 3) cuts the coordinate axes at A and B such that P divides AB internally in the ratio 1 : 2. If the equation of a line perpendicular to L passing through the origin is y = mx, then the value of m is:',
    options: [
      { id: 'A', text: '1/3' },
      { id: 'B', text: '4/3' },
      { id: 'C', text: '3/4' },
      { id: 'D', text: '-3/4' }
    ],
    correctAnswer: 'A',
    formulaKey: 'Intercept form: x/a + y/b = 1; Section Formula: (x, y) = ((m x₂ + n x₁)/(m + n), (m y₂ + n y₁)/(m + n))',
    explanation: 'Let A = (a, 0) and B = (0, b). Using the section formula with ratio AP:PB = 1:2: (2·a + 1·0)/3 = 2 ⇒ a = 3, and (2·0 + 1·b)/3 = 3 ⇒ b = 9. The line equation is x/3 + y/9 = 1 ⇒ 3x + y = 9. The slope of line L is -3. The slope of the line perpendicular to L is m = -1/(-3) = 1/3.',
    isFree: true,
    youtubeUrl: '/videos/1.mp4',
    videoUrl: '/videos/1.mp4',
    pdfUrl: '/assets/downloads/st line-2.pdf',
    courseId: 'jee-pyq-archive-mastery',
    courseName: '10-Year JEE Chapter-Wise PYQ Mastery Course',
    videoDuration: '05:12'
  },
  {
    id: 'pyq-main-math-parabola-featured',
    exam: 'JEE Main',
    year: 2024,
    subject: 'Mathematics',
    chapter: 'Parabola',
    topic: 'Conic Sections & Latus Rectum',
    type: 'Single Choice MCQ',
    marks: '+4 / -1',
    statement: 'Let O be the vertex of the parabola y² = 4ax and its chords OP and OQ are perpendicular to each other. If the locus of the midpoint of the line segment PQ is a conic, then the length of its latus rectum is:',
    options: [
      { id: 'A', text: '2a' },
      { id: 'B', text: '4a' },
      { id: 'C', text: '8a' },
      { id: 'D', text: 'a' }
    ],
    correctAnswer: 'A',
    formulaKey: 'Parametric points: P(at₁², 2at₁), Q(at₂², 2at₂). For OP ⊥ OQ: t₁ t₂ = -4',
    explanation: 'Since OP is perpendicular to OQ, the product of parametric parameters is t₁ t₂ = -4. Let the midpoint of PQ be (h, k). Then 2h = a(t₁² + t₂²) and 2k = 2a(t₁ + t₂). Since (t₁ + t₂)² = t₁² + t₂² + 2t₁t₂ = (2h/a) - 8. From 2k = 2a(t₁ + t₂), we have (t₁ + t₂)² = k²/a². Equating both yields k²/a² = 2h/a - 8 ⇒ y² = 2a(x - 4a). This is a parabola with latus rectum equal to 2a.',
    isFree: true,
    youtubeUrl: '/videos/2.mp4',
    videoUrl: '/videos/2.mp4',
    pdfUrl: '/assets/downloads/parabola -1.pdf',
    courseId: 'jee-pyq-archive-mastery',
    courseName: '10-Year JEE Chapter-Wise PYQ Mastery Course',
    videoDuration: '14:20'
  },
  // --- JEE MAIN QUESTIONS ---
  // [1] Free Question 1 of 5
  {
    id: 'pyq-main-2024-phy-01',
    exam: 'JEE Main',
    year: 2024,
    subject: 'Physics',
    chapter: 'Rigid Body Dynamics',
    topic: 'Moment of Inertia',
    type: 'Single Choice MCQ',
    marks: '+4 / -1',
    statement: 'A uniform solid sphere of mass M and radius R rolls without slipping down an inclined plane of inclination θ. The acceleration of the center of mass of the sphere is:',
    options: [
      { id: 'A', text: '(5/7) g sin θ' },
      { id: 'B', text: '(2/5) g sin θ' },
      { id: 'C', text: '(5/9) g sin θ' },
      { id: 'D', text: '(3/5) g sin θ' }
    ],
    correctAnswer: 'A',
    formulaKey: 'a_cm = (g sin θ) / (1 + I_cm / (M R²))',
    explanation: 'For pure rolling down an inclined plane, the linear acceleration is given by a = (g sin θ) / (1 + k²/R²). For a uniform solid sphere, I_cm = (2/5) M R², so k²/R² = 2/5. Substituting this into the formula gives: a = (g sin θ) / (1 + 2/5) = (5/7) g sin θ.',
    isFree: true,
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    courseId: 'jee-pyq-archive-mastery',
    courseName: '10-Year JEE Chapter-Wise PYQ Mastery Course',
    videoDuration: '12:45'
  },
  // [2] Free Question 2 of 5
  {
    id: 'pyq-main-2024-chem-01',
    exam: 'JEE Main',
    year: 2024,
    subject: 'Chemistry',
    chapter: 'Chemical Bonding',
    topic: 'Molecular Orbital Theory',
    type: 'Single Choice MCQ',
    marks: '+4 / -1',
    statement: 'According to Molecular Orbital Theory, which of the following diatomic species possesses a bond order of 2.5 and is paramagnetic?',
    options: [
      { id: 'A', text: 'N₂⁺' },
      { id: 'B', text: 'O₂' },
      { id: 'C', text: 'C₂' },
      { id: 'D', text: 'O₂²⁻' }
    ],
    correctAnswer: 'A',
    formulaKey: 'Bond Order = ½ (N_b - N_a)',
    explanation: 'For N₂⁺ (13 electrons): Configuration is σ1s² σ*1s² σ2s² σ*2s² π2px² = π2py² σ2pz¹. N_b = 9, N_a = 4. Bond Order = ½ (9 - 4) = 2.5. Because there is 1 unpaired electron in the σ2pz orbital, N₂⁺ is paramagnetic.',
    isFree: true,
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    courseId: 'jee-pyq-archive-mastery',
    courseName: '10-Year JEE Chapter-Wise PYQ Mastery Course',
    videoDuration: '09:20'
  },
  // [3] Free Question 3 of 5
  {
    id: 'pyq-main-2024-math-01',
    exam: 'JEE Main',
    year: 2024,
    subject: 'Mathematics',
    chapter: 'Integral Calculus',
    topic: 'Definite Integrals',
    type: 'Single Choice MCQ',
    marks: '+4 / -1',
    statement: 'The value of the definite integral ∫₀^(π/2) (sin³ x) / (sin³ x + cos³ x) dx is:',
    options: [
      { id: 'A', text: 'π/4' },
      { id: 'B', text: 'π/2' },
      { id: 'C', text: 'π/3' },
      { id: 'D', text: '0' }
    ],
    correctAnswer: 'A',
    formulaKey: 'King’s Property: ∫ₐᵇ f(x) dx = ∫ₐᵇ f(a + b - x) dx',
    explanation: 'Let I = ∫₀^(π/2) (sin³ x) / (sin³ x + cos³ x) dx. By King’s Property (replacing x with π/2 - x): I = ∫₀^(π/2) (cos³ x) / (cos³ x + sin³ x) dx. Adding both equations yields 2I = ∫₀^(π/2) 1 dx = π/2. Therefore, I = π/4.',
    isFree: true,
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    courseId: 'jee-pyq-archive-mastery',
    courseName: '10-Year JEE Chapter-Wise PYQ Mastery Course',
    videoDuration: '15:10'
  },
  // [4] Free Question 4 of 5
  {
    id: 'pyq-main-2023-phy-02',
    exam: 'JEE Main',
    year: 2023,
    subject: 'Physics',
    chapter: 'Electrostatics',
    topic: 'Gauss’s Law & Electric Flux',
    type: 'Single Choice MCQ',
    marks: '+4 / -1',
    statement: 'A point charge q is placed at one corner of a cube of side length L. The total electric flux passing through the entire surface of the cube is:',
    options: [
      { id: 'A', text: 'q / (8 ε₀)' },
      { id: 'B', text: 'q / (6 ε₀)' },
      { id: 'C', text: 'q / (24 ε₀)' },
      { id: 'D', text: 'q / ε₀' }
    ],
    correctAnswer: 'A',
    formulaKey: 'Φ_total = q_enclosed / ε₀',
    explanation: 'By symmetry, 8 identical cubes sharing the common corner vertex are required to symmetrically enclose the charge q. Hence, the flux passing through one complete cube is exactly 1/8 of the total flux: Φ = q / (8 ε₀).',
    isFree: true,
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    courseId: 'jee-pyq-archive-mastery',
    courseName: '10-Year JEE Chapter-Wise PYQ Mastery Course',
    videoDuration: '08:50'
  },
  // [5] Free Question 5 of 5
  {
    id: 'pyq-main-2023-chem-02',
    exam: 'JEE Main',
    year: 2023,
    subject: 'Chemistry',
    chapter: 'Haloalkanes & Alkyl Halides',
    topic: 'Nucleophilic Substitution',
    type: 'Single Choice MCQ',
    marks: '+4 / -1',
    statement: 'Which of the following alkyl halides undergoes nucleophilic substitution via the SN1 pathway at the fastest rate?',
    options: [
      { id: 'A', text: 'tert-Butyl bromide [(CH₃)₃C-Br]' },
      { id: 'B', text: 'Isopropyl bromide [(CH₃)₂CH-Br]' },
      { id: 'C', text: 'Ethyl bromide [CH₃CH₂-Br]' },
      { id: 'D', text: 'Methyl bromide [CH₃-Br]' }
    ],
    correctAnswer: 'A',
    formulaKey: 'SN1 rate ∝ Stability of carbocation intermediate',
    explanation: 'The rate-determining step in an SN1 mechanism is the formation of a carbocation intermediate. The tertiary (3°) carbocation formed from (CH₃)₃C-Br is stabilized by 9 hyperconjugative α-hydrogens and inductive effects, making its rate the fastest among the options.',
    isFree: true,
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    courseId: 'jee-pyq-archive-mastery',
    courseName: '10-Year JEE Chapter-Wise PYQ Mastery Course',
    videoDuration: '11:15'
  },
  // [6] Paid Question 1 (Locked for non-enrolled students)
  {
    id: 'pyq-main-2023-math-02',
    exam: 'JEE Main',
    year: 2023,
    subject: 'Mathematics',
    chapter: 'Matrices & Determinants',
    topic: 'System of Linear Equations',
    type: 'Single Choice MCQ',
    marks: '+4 / -1',
    statement: 'If the system of linear equations x + y + z = 6, x + 2y + 3z = 10, and x + 2y + λz = μ has infinitely many solutions, then the value of (λ + μ) is:',
    options: [
      { id: 'A', text: '13' },
      { id: 'B', text: '10' },
      { id: 'C', text: '12' },
      { id: 'D', text: '7' }
    ],
    correctAnswer: 'A',
    formulaKey: 'Condition for infinitely many solutions: Δ = 0 and Δ_x = Δ_y = Δ_z = 0',
    explanation: 'Comparing equation 2 (x + 2y + 3z = 10) and equation 3 (x + 2y + λz = μ), for infinite solutions the two equations must be linearly dependent (or identical), which requires λ = 3 and μ = 10. Thus, λ + μ = 3 + 10 = 13.',
    isFree: false,
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    courseId: 'jee-pyq-archive-mastery',
    courseName: '10-Year JEE Chapter-Wise PYQ Mastery Course',
    videoDuration: '14:35'
  },

  // --- JEE ADVANCED QUESTIONS ---
  // [7] Paid Question 2 (Locked)
  {
    id: 'pyq-adv-2024-phy-01',
    exam: 'JEE Advanced',
    year: 2024,
    subject: 'Physics',
    chapter: 'Rigid Body Dynamics',
    topic: 'Angular Momentum Conservation',
    type: 'Single Choice MCQ',
    marks: '+4 / -2',
    statement: 'A thin horizontal circular disc of mass M and radius R rotates about a vertical axis through its center with angular speed ω₀. Two small particles, each of mass m, are gently placed on opposite ends of a diameter of the disc. The new angular speed of the system is:',
    options: [
      { id: 'A', text: '[M / (M + 4m)] ω₀' },
      { id: 'B', text: '[M / (M + 2m)] ω₀' },
      { id: 'C', text: '[(M + 2m) / M] ω₀' },
      { id: 'D', text: '[M / (M + m)] ω₀' }
    ],
    correctAnswer: 'A',
    formulaKey: 'L_initial = L_final ⇒ I₁ ω₁ = I₂ ω₂',
    explanation: 'Initial moment of inertia: I₁ = ½ M R². When two masses m are placed at distance R from the axis, I₂ = ½ M R² + 2(m R²) = (½ M + 2m) R² = [(M + 4m)/2] R². By conservation of angular momentum about the vertical axis: I₁ ω₀ = I₂ ω_final ⇒ (½ M R²) ω₀ = [(M + 4m)/2] R² ω_final ⇒ ω_final = [M / (M + 4m)] ω₀.',
    isFree: false,
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    courseId: 'jee-pyq-archive-mastery',
    courseName: '10-Year JEE Chapter-Wise PYQ Mastery Course',
    videoDuration: '18:40'
  },
  // [8] Paid Question 3 (Locked)
  {
    id: 'pyq-adv-2024-chem-01',
    exam: 'JEE Advanced',
    year: 2024,
    subject: 'Chemistry',
    chapter: 'Coordination Chemistry',
    topic: 'Crystal Field Theory & Magnetic Moments',
    type: 'Single Choice MCQ',
    marks: '+4 / -2',
    statement: 'For the octahedral complex [Fe(CN)₆]³⁻, the hybridization of the central iron ion, the d-electron configuration, and the spin-only magnetic moment in Bohr Magnetons (BM) are, respectively:',
    options: [
      { id: 'A', text: 'd²sp³, t₂g⁵ eg⁰, 1.73 BM' },
      { id: 'B', text: 'sp³d², t₂g³ eg², 5.92 BM' },
      { id: 'C', text: 'd²sp³, t₂g⁴ eg¹, 3.87 BM' },
      { id: 'D', text: 'sp³d², t₂g⁵ eg⁰, 1.73 BM' }
    ],
    correctAnswer: 'A',
    formulaKey: 'μ = √(n(n + 2)) BM, where n = number of unpaired electrons',
    explanation: 'In [Fe(CN)₆]³⁻, Iron is in the +3 oxidation state (Fe³⁺: [Ar] 3d⁵). Since CN⁻ is a strong field ligand, pairing occurs: t₂g⁵ eg⁰. There is n = 1 unpaired electron. The inner d-orbitals participate in hybridization giving d²sp³. Spin-only magnetic moment μ = √(1(3)) = √3 ≈ 1.73 BM.',
    isFree: false,
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    courseId: 'jee-pyq-archive-mastery',
    courseName: '10-Year JEE Chapter-Wise PYQ Mastery Course',
    videoDuration: '16:05'
  },
  // [9] Paid Question 4 (Locked)
  {
    id: 'pyq-adv-2024-math-01',
    exam: 'JEE Advanced',
    year: 2024,
    subject: 'Mathematics',
    chapter: 'Integral Calculus',
    topic: 'Leibniz Integral Rule',
    type: 'Single Choice MCQ',
    marks: '+4 / -2',
    statement: 'Let f: ℝ → ℝ be a continuous function such that ∫₀^(x²) f(t) dt = x² cos(πx) for all x ∈ ℝ. The value of f(4) is:',
    options: [
      { id: 'A', text: '1' },
      { id: 'B', text: '-1' },
      { id: 'C', text: '0' },
      { id: 'D', text: '2' }
    ],
    correctAnswer: 'A',
    formulaKey: 'Leibniz Rule: d/dx [∫_{u(x)}^{v(x)} f(t) dt] = f(v(x)) v\'(x) - f(u(x)) u\'(x)',
    explanation: 'Differentiating both sides with respect to x using Leibniz rule: f(x²) · (2x) = 2x cos(πx) - π x² sin(πx). For x ≠ 0, divide both sides by 2x: f(x²) = cos(πx) - (π/2) x sin(πx). To find f(4), set x = 2: f(2²) = f(4) = cos(2π) - (π/2)(2) sin(2π) = 1 - 0 = 1.',
    isFree: false,
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    courseId: 'jee-pyq-archive-mastery',
    courseName: '10-Year JEE Chapter-Wise PYQ Mastery Course',
    videoDuration: '20:15'
  },
  // [10] Paid Question 5 (Locked)
  {
    id: 'pyq-adv-2023-phy-02',
    exam: 'JEE Advanced',
    year: 2023,
    subject: 'Physics',
    chapter: 'Thermodynamics',
    topic: 'Cyclic Processes & Efficiency',
    type: 'Single Choice MCQ',
    marks: '+4 / -2',
    statement: 'One mole of an ideal monoatomic gas undergoes a cycle consisting of an isobaric expansion at pressure P₀ from volume V₀ to 2V₀, followed by an isochoric cooling to pressure P₀/2, and then an isothermal compression back to (P₀, V₀). The net work done by the gas in one complete cycle is:',
    options: [
      { id: 'A', text: 'P₀ V₀ [1 - ln 2]' },
      { id: 'B', text: 'P₀ V₀ [½ - ln 2]' },
      { id: 'C', text: 'P₀ V₀ [1 + ln 2]' },
      { id: 'D', text: '½ P₀ V₀' }
    ],
    correctAnswer: 'A',
    formulaKey: 'W_net = W_isobaric + W_isochoric + W_isothermal',
    explanation: 'Work done during isobaric expansion (V₀ → 2V₀ at P₀): W₁ = P₀ (2V₀ - V₀) = P₀ V₀. Work during isochoric process (V = 2V₀, P₀ → P₀/2): W₂ = 0. Notice at state 2: P = P₀/2, V = 2V₀, so P·V = P₀ V₀. The isothermal compression at temperature T = P₀ V₀ / R back to V₀ gives: W₃ = n R T ln(V_final / V_initial) = P₀ V₀ ln(V₀ / 2V₀) = - P₀ V₀ ln 2. Total work: W_net = W₁ + W₂ + W₃ = P₀ V₀ - P₀ V₀ ln 2 = P₀ V₀ (1 - ln 2).',
    isFree: false,
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    courseId: 'jee-pyq-archive-mastery',
    courseName: '10-Year JEE Chapter-Wise PYQ Mastery Course',
    videoDuration: '19:30'
  },
  // [11] Paid Question 6 (Locked)
  {
    id: 'pyq-adv-2023-chem-02',
    exam: 'JEE Advanced',
    year: 2023,
    subject: 'Chemistry',
    chapter: 'Chemical Equilibrium',
    topic: 'Thermodynamics of Equilibrium',
    type: 'Single Choice MCQ',
    marks: '+4 / -2',
    statement: 'For an endothermic chemical reaction A(g) ⇌ B(g) + C(g), with ΔH° > 0, increasing the temperature from T₁ to T₂ at constant pressure will:',
    options: [
      { id: 'A', text: 'Increase the equilibrium constant K_p and shift equilibrium to the right' },
      { id: 'B', text: 'Decrease the equilibrium constant K_p and shift equilibrium to the left' },
      { id: 'C', text: 'Leave K_p unchanged while increasing the rate of reaction' },
      { id: 'D', text: 'Shift equilibrium to the left according to Le Chatelier’s principle' }
    ],
    correctAnswer: 'A',
    formulaKey: 'van ’t Hoff Equation: ln(K₂ / K₁) = (ΔH° / R) [1/T₁ - 1/T₂]',
    explanation: 'By the van ’t Hoff isochore, when ΔH° > 0 (endothermic), an increase in temperature (T₂ > T₁) makes the right side of the equation positive, meaning K₂ > K₁. Therefore, the equilibrium constant increases and the reaction shifts toward the forward direction (producing more B and C).',
    isFree: false,
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    courseId: 'jee-pyq-archive-mastery',
    courseName: '10-Year JEE Chapter-Wise PYQ Mastery Course',
    videoDuration: '13:50'
  },
  // [12] Paid Question 7 (Locked)
  {
    id: 'pyq-adv-2023-math-02',
    exam: 'JEE Advanced',
    year: 2023,
    subject: 'Mathematics',
    chapter: '3D Geometry',
    topic: 'Shortest Distance Between Skew Lines',
    type: 'Single Choice MCQ',
    marks: '+4 / -2',
    statement: 'The shortest distance between the lines (x - 1)/2 = (y - 2)/3 = (z - 3)/4 and (x - 2)/3 = (y - 4)/4 = (z - 5)/5 is:',
    options: [
      { id: 'A', text: '1 / √6' },
      { id: 'B', text: '1 / √3' },
      { id: 'C', text: '2 / √6' },
      { id: 'D', text: '0 (Intersecting lines)' }
    ],
    correctAnswer: 'A',
    formulaKey: 'd = |(a₂ - a₁) · (b₁ × b₂)| / |b₁ × b₂|',
    explanation: 'Let point A = (1, 2, 3), vector b₁ = (2, 3, 4). Let point B = (2, 4, 5), vector b₂ = (3, 4, 5). Difference vector (a₂ - a₁) = (1, 2, 2). Cross product b₁ × b₂ = i(15 - 16) - j(10 - 12) + k(8 - 9) = (-1, 2, -1). Magnitude |b₁ × b₂| = √((-1)² + 2² + (-1)²) = √6. Dot product: (a₂ - a₁) · (b₁ × b₂) = 1(-1) + 2(2) + 2(-1) = -1 + 4 - 2 = 1. Therefore, shortest distance d = |1| / √6 = 1 / √6.',
    isFree: false,
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    courseId: 'jee-pyq-archive-mastery',
    courseName: '10-Year JEE Chapter-Wise PYQ Mastery Course',
    videoDuration: '22:10'
  }
];

// Comprehensive 25-Year JEE Archive: 2002 through 2026
export const PYQ_YEARS: number[] = Array.from({ length: 2026 - 2002 + 1 }, (_, i) => 2026 - i);
export const PYQ_SUBJECTS: ('All' | 'Physics' | 'Chemistry' | 'Mathematics')[] = [
  'All',
  'Physics',
  'Chemistry',
  'Mathematics'
];
