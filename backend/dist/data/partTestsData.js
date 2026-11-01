// 20 Structured JEE Part Tests
export const PART_TESTS_DATA = [
    // ─── 01. PART TEST 01 ───
    {
        id: 'part-test-01',
        title: 'JEE Main Part Test 01: Kinematics, Mole Concept & Quadratic Equations',
        subtitle: 'Class 11 Foundation Unit: 1D/2D Motion, Stoichiometry, Roots of Equations',
        slug: 'jee-main-part-test-01-kinematics-mole-concept-quadratics',
        badgeCode: 'PART TEST',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Medium',
        durationMinutes: 90,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        status: 'Published',
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Comprehensive Part Test covering foundational units across Physics, Chemistry, and Mathematics.',
            'Marking Scheme: +4 marks for correct choice, -1 mark penalty for incorrect choice.',
            'Solve using DK Sir 20-30s speed inspection tricks wherever possible.'
        ],
        questions: [
            {
                id: 'pt01-p1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Kinematics in 1D & 2D',
                statement: 'A projectile is launched from ground level with speed u at an angle θ to the horizontal. If the horizontal range is 4 times the maximum height reached, then the angle of projection θ is:',
                options: [
                    { id: 'A', text: '30°' },
                    { id: 'B', text: '45°' },
                    { id: 'C', text: '60°' },
                    { id: 'D', text: 'tan⁻¹(2)' }
                ],
                correctAnswer: 'B',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'R = 4H cot θ',
                explanation: 'We know R = (u² sin 2θ)/g and H = (u² sin² θ)/(2g). The standard relation gives R = 4H cot θ. Given R = 4H, we get cot θ = 1, which means θ = 45°.',
                shortcutTrick: 'DK Sir Kota Rule: Range equals 4 times Maximum Height if and only if launch angle is exactly 45°.'
            },
            {
                id: 'pt01-p2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Motion Under Gravity',
                statement: 'A particle is dropped from the top of a tower of height H. It traverses a distance equal to (7/16)H in the last second of its fall. The height H of the tower is (take g = 10 m/s²):',
                options: [
                    { id: 'A', text: '40 m' },
                    { id: 'B', text: '80 m' },
                    { id: 'C', text: '125 m' },
                    { id: 'D', text: '180 m' }
                ],
                correctAnswer: 'B',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Distance in nth second: sₙ = u + (g/2)(2n - 1)',
                explanation: 'Total time t: H = 1/2 g t². Distance in last second = (g/2)(2t - 1) = (7/16)H. Dividing gives (2t - 1)/t² = 7/16 ⇒ 7t² - 32t + 16 = 0 ⇒ (7t - 4)(t - 4) = 0. Since t > 1, t = 4 s. Hence H = 1/2 × 10 × 4² = 80 m.',
                shortcutTrick: 'Galileo odd-number sequence: successive 1-second drops are 1x, 3x, 5x, 7x. Total 1+3+5+7 = 16x. The 4th second is 7/16 of total! So t = 4s, H = 80 m in 5 seconds!'
            },
            {
                id: 'pt01-c1',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'Mole Concept & Stoichiometry',
                statement: 'What is the mass of precipitate formed when 50 mL of 16.9% solution of AgNO₃ is mixed with 50 mL of 5.8% NaCl solution? (Ag = 108, N = 14, O = 16, Na = 23, Cl = 35.5)',
                options: [
                    { id: 'A', text: '7.17 g' },
                    { id: 'B', text: '14.34 g' },
                    { id: 'C', text: '3.58 g' },
                    { id: 'D', text: '28.70 g' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃; Limiting reagent stoichiometry',
                explanation: 'AgNO₃ in 50 mL = (16.9/100) × 50 = 8.45 g. Molar mass of AgNO₃ = 170 g/mol. Moles = 8.45 / 170 = 0.0497 mol ≈ 0.05 mol. NaCl in 50 mL = (5.8/100) × 50 = 2.9 g. Molar mass NaCl = 58.5 g/mol. Moles = 2.9 / 58.5 = 0.0496 mol ≈ 0.05 mol. AgCl precipitated = 0.05 mol × 143.5 g/mol = 7.175 g.',
                shortcutTrick: 'Equimolar 0.05 mol reaction directly yields 0.05 × 143.5 = 7.17 g.'
            },
            {
                id: 'pt01-c2',
                questionNumber: 4,
                subject: 'Chemistry',
                chapter: 'Redox Reactions',
                statement: 'The oxidation state of chromium in CrO₅ (butterfly structure) and iron in Fe₃O₄ are respectively:',
                options: [
                    { id: 'A', text: '+10 and +8/3' },
                    { id: 'B', text: '+6 and +8/3' },
                    { id: 'C', text: '+6 and +2' },
                    { id: 'D', text: '+4 and +3' }
                ],
                correctAnswer: 'B',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Peroxide linkage gives -1 per oxygen; Fe₃O₄ is mixed oxide FeO·Fe₂O₃',
                explanation: 'CrO₅ has a butterfly structure with one oxo group (O²⁻) and two peroxo bridges (each peroxo has -1 per oxygen). Therefore, Cr + 1(-2) + 4(-1) = 0 ⇒ Cr = +6. Fe₃O₄ has formula FeO·Fe₂O₃: 3Fe = +8 ⇒ average oxidation state = +8/3.',
                shortcutTrick: 'Cr cannot exceed its valence of +6! Any answer with +10 is eliminated instantly.'
            },
            {
                id: 'pt01-m1',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Quadratic Equations',
                statement: 'If α and β are the roots of the equation x² - 6x - 2 = 0 with α > β, and aₙ = αⁿ - βⁿ for n ≥ 1, then the value of (a₁₀ - 2a₈) / (2a₉) is:',
                options: [
                    { id: 'A', text: '1' },
                    { id: 'B', text: '2' },
                    { id: 'C', text: '3' },
                    { id: 'D', text: '4' }
                ],
                correctAnswer: 'C',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Newton’s Sum Formula: aₙ₊₂ - 6aₙ₊₁ - 2aₙ = 0',
                explanation: 'Since α and β satisfy x² - 6x - 2 = 0, multiplying by x⁸ gives α¹⁰ - 6α⁹ - 2α⁸ = 0 and β¹⁰ - 6β⁹ - 2β⁸ = 0. Subtracting yields a₁₀ - 6a₉ - 2a₈ = 0 ⇒ a₁₀ - 2a₈ = 6a₉. Hence (a₁₀ - 2a₈) / (2a₉) = 6a₉ / (2a₉) = 3.',
                shortcutTrick: 'DK Sir Kota Newton Formula Trick: a₁₀ - 2a₈ = 6a₉ directly from polynomial coefficients! Ratio = 6/2 = 3 in 5 seconds flat!'
            },
            {
                id: 'pt01-m2',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Theory of Equations',
                statement: 'The set of all real values of parameter m for which both roots of the quadratic equation x² - 2mx + m² - 1 = 0 are greater than -2 and less than 4 is:',
                options: [
                    { id: 'A', text: '(-1, 3)' },
                    { id: 'B', text: '(-2, 4)' },
                    { id: 'C', text: '[0, 3]' },
                    { id: 'D', text: '(-∞, -1) ∪ (3, ∞)' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Factorization: (x - m)² - 1 = 0 ⇒ x = m ± 1',
                explanation: 'The equation is (x - m)² = 1 ⇒ x = m - 1, m + 1. For both roots to lie in (-2, 4): m - 1 > -2 ⇒ m > -1, and m + 1 < 4 ⇒ m < 3. Therefore, m ∈ (-1, 3).',
                shortcutTrick: 'Directly factorize: roots are simply m - 1 and m + 1. -2 < m - 1 and m + 1 < 4 gives -1 < m < 3 immediately!'
            }
        ]
    },
    // ─── 02. PART TEST 02 ───
    {
        id: 'part-test-02',
        title: 'JEE Main Part Test 02: Newton\'s Laws, Periodic Table & Sequence Series',
        subtitle: 'Class 11 Mechanics & Algebra: Friction, Periodic Trends, AP/GP/AGP',
        slug: 'jee-main-part-test-02-newton-laws-periodic-table-sequence-series',
        badgeCode: 'PART TEST',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Medium',
        durationMinutes: 90,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        status: 'Published',
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Focus on friction threshold conditions, ionization energy anomalies, and harmonic/arithmetic series sums.'
        ],
        questions: [
            {
                id: 'pt02-p1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Newton\'s Laws of Motion & Friction',
                statement: 'A block of mass 2 kg is placed on a rough horizontal surface with coefficient of static friction μₛ = 0.5. A horizontal force F = 8 N is applied on the block. The friction force acting on the block is (g = 10 m/s²):',
                options: [
                    { id: 'A', text: '10 N' },
                    { id: 'B', text: '8 N' },
                    { id: 'C', text: '2 N' },
                    { id: 'D', text: '0 N' }
                ],
                correctAnswer: 'B',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'f_static ≤ μₛ N; static friction is self-adjusting',
                explanation: 'Max static friction f_max = μₛ mg = 0.5 × 2 × 10 = 10 N. Since applied force F = 8 N < f_max, the block does not move. The static friction adjusts exactly to match the applied force: f = 8 N.',
                shortcutTrick: 'Kota Trap Alert: Friction is NOT always μN! If body is at rest, friction = applied force = 8 N.'
            },
            {
                id: 'pt02-p2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Constraint Motion & Tension',
                statement: 'Two masses m₁ = 3 kg and m₂ = 5 kg are connected by a light string over a frictionless pulley. The acceleration of the system and tension in the string are respectively (g = 10 m/s²):',
                options: [
                    { id: 'A', text: '2.5 m/s² and 37.5 N' },
                    { id: 'B', text: '3.0 m/s² and 45.0 N' },
                    { id: 'C', text: '2.0 m/s² and 30.0 N' },
                    { id: 'D', text: '4.0 m/s² and 40.0 N' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'a = (m₂ - m₁)g / (m₁ + m₂); T = 2m₁m₂g / (m₁ + m₂)',
                explanation: 'a = (5 - 3) × 10 / (5 + 3) = 20 / 8 = 2.5 m/s². T = 2 × 3 × 5 × 10 / 8 = 300 / 8 = 37.5 N.',
                shortcutTrick: 'Standard Atwood formula: a = Δm/M × g = 2/8 × 10 = 2.5 m/s².'
            },
            {
                id: 'pt02-c1',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'Periodic Classification & Trends',
                statement: 'The correct order of first ionization energy for the elements B, C, N, and O is:',
                options: [
                    { id: 'A', text: 'B < C < O < N' },
                    { id: 'B', text: 'B < C < N < O' },
                    { id: 'C', text: 'C < B < N < O' },
                    { id: 'D', text: 'B < N < C < O' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Half-filled 2p³ configuration of Nitrogen gives higher stability than Oxygen 2p⁴',
                explanation: 'Ionization energy increases across a period: B < C. However, Nitrogen (2p³) has a half-filled, extra stable subshell compared to Oxygen (2p⁴), making it harder to remove an electron from N than from O. Hence B < C < O < N.',
                shortcutTrick: 'Classic NCERT exception: N > O because half-filled 2p³ subshell resists ionization.'
            },
            {
                id: 'pt02-c2',
                questionNumber: 4,
                subject: 'Chemistry',
                chapter: 'Atomic Structure',
                statement: 'The ratio of the radius of the 2nd Bohr orbit of Li²⁺ to that of the 3rd Bohr orbit of He⁺ is:',
                options: [
                    { id: 'A', text: '8 / 27' },
                    { id: 'B', text: '27 / 8' },
                    { id: 'C', text: '4 / 9' },
                    { id: 'D', text: '2 / 3' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'rₙ ∝ n² / Z',
                explanation: 'r = 0.529 (n² / Z). For Li²⁺: n = 2, Z = 3 ⇒ r₁ = 2² / 3 = 4/3. For He⁺: n = 3, Z = 2 ⇒ r₂ = 3² / 2 = 9/2. Ratio = (4/3) / (9/2) = (4/3) × (2/9) = 8/27.',
                shortcutTrick: 'r₁ / r₂ = (n₁² / Z₁) / (n₂² / Z₂) = (4/3) / (9/2) = 8/27 in 10 seconds.'
            },
            {
                id: 'pt02-m1',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Sequences & Series',
                statement: 'If the sum of the first 2n terms of the AP 2, 5, 8, ... is equal to the sum of the first n terms of the AP 57, 59, 61, ..., then n equals:',
                options: [
                    { id: 'A', text: '10' },
                    { id: 'B', text: '11' },
                    { id: 'C', text: '12' },
                    { id: 'D', text: '13' }
                ],
                correctAnswer: 'B',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'S_k = (k/2)[2a + (k - 1)d]',
                explanation: 'For first AP (a = 2, d = 3): S_2n = (2n/2)[4 + (2n - 1)3] = n[6n + 1]. For second AP (a = 57, d = 2): S_n = (n/2)[114 + (n - 1)2] = (n/2)[2n + 112] = n[n + 56]. Equating gives 6n + 1 = n + 56 ⇒ 5n = 55 ⇒ n = 11.',
                shortcutTrick: 'Cancel factor n immediately: 6n + 1 = n + 56 ⇒ 5n = 55 ⇒ n = 11.'
            },
            {
                id: 'pt02-m2',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Binomial Theorem',
                statement: 'The term independent of x in the binomial expansion of (x + 1/x²)⁶ is:',
                options: [
                    { id: 'A', text: '15' },
                    { id: 'B', text: '20' },
                    { id: 'C', text: '10' },
                    { id: 'D', text: '30' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'General term T_r+1 = ⁶Cᵣ (x)⁶⁻ʳ (x⁻²)ʳ = ⁶Cᵣ x⁶⁻³ʳ',
                explanation: 'For term independent of x, 6 - 3r = 0 ⇒ r = 2. The coefficient is ⁶C₂ = (6 × 5) / 2 = 15.',
                shortcutTrick: 'Power index formula: r = (n · p) / (p + q) = (6 × 1) / (1 + 2) = 2. Term = ⁶C₂ = 15.'
            }
        ]
    },
    // ─── 03. PART TEST 03 ───
    {
        id: 'part-test-03',
        title: 'JEE Main Part Test 03: Work Energy Power, Chemical Bonding & Trigonometry',
        subtitle: 'Class 11 Core: Conservative Forces, Molecular Orbitals, Trigonometric Equations',
        slug: 'jee-main-part-test-03-work-energy-chemical-bonding-trig',
        badgeCode: 'PART TEST',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Hard',
        durationMinutes: 90,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        status: 'Published',
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Focus on work-energy theorem with variable forces, MOT bond orders, and sub-multiple angle trigonometric identities.'
        ],
        questions: [
            {
                id: 'pt03-p1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Work, Energy & Power',
                statement: 'A position-dependent force F = (7 - 2x + 3x²) N acts on a body of mass 2 kg and displaces it from x = 0 to x = 5 m. The work done by the force is:',
                options: [
                    { id: 'A', text: '135 J' },
                    { id: 'B', text: '150 J' },
                    { id: 'C', text: '70 J' },
                    { id: 'D', text: '270 J' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'W = ∫ F dx from x₁ to x₂',
                explanation: 'W = ∫₀⁵ (7 - 2x + 3x²) dx = [7x - x² + x³]₀⁵ = 7(5) - 25 + 125 = 35 - 25 + 125 = 135 J.',
                shortcutTrick: 'Standard single integral evaluation: 35 - 25 + 125 = 135 J.'
            },
            {
                id: 'pt03-p2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Collisions & Momentum',
                statement: 'A ball of mass m moving with velocity v collides head-on elastically with another ball of mass 2m at rest. The fraction of initial kinetic energy retained by the striking ball is:',
                options: [
                    { id: 'A', text: '1 / 9' },
                    { id: 'B', text: '4 / 9' },
                    { id: 'C', text: '8 / 9' },
                    { id: 'D', text: '1 / 3' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'v₁ = (m₁ - m₂)u₁ / (m₁ + m₂)',
                explanation: 'v₁ = (m - 2m)v / (m + 2m) = -v/3. KE_final / KE_initial = (v₁/v)² = (-1/3)² = 1/9.',
                shortcutTrick: 'Velocity ratio = (m - 2m)/(m + 2m) = -1/3. Square gives energy ratio 1/9 directly.'
            },
            {
                id: 'pt03-c1',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'Chemical Bonding & MOT',
                statement: 'According to Molecular Orbital Theory (MOT), which of the following diatomic species is paramagnetic with a bond order of 1.0?',
                options: [
                    { id: 'A', text: 'B₂' },
                    { id: 'B', text: 'C₂' },
                    { id: 'C', text: 'N₂' },
                    { id: 'D', text: 'O₂' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'B₂ (10 electrons): σ1s² σ*1s² σ2s² σ*2s² (π2p_x¹ = π2p_y¹)',
                explanation: 'B₂ has 10 valence electrons. The two valence electrons enter degenerate π2p_x and π2p_y orbitals singly according to Hund\'s rule, giving 2 unpaired electrons (paramagnetic) and bond order = (6 - 4)/2 = 1.0.',
                shortcutTrick: 'B₂ and O₂ are the two standard paramagnetic homonuclear diatomics with unpaired electrons.'
            },
            {
                id: 'pt03-c2',
                questionNumber: 4,
                subject: 'Chemistry',
                chapter: 'VSEPR Theory & Hybridization',
                statement: 'The shape and number of lone pairs on the central atom in XeF₄ are respectively:',
                options: [
                    { id: 'A', text: 'Square planar, 2 lone pairs' },
                    { id: 'B', text: 'Tetrahedral, 0 lone pairs' },
                    { id: 'C', text: 'See-saw, 1 lone pair' },
                    { id: 'D', text: 'Square pyramidal, 1 lone pair' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Steric number = 4 (bonds) + 2 (lone pairs) = 6 (sp³d² hybridization)',
                explanation: 'Xe has 8 valence electrons. 4 are used in forming Xe-F single bonds, leaving 4 non-bonding electrons (2 lone pairs). Steric number 6 with 2 lone pairs occupies axial positions to minimize repulsion, yielding a Square Planar geometry.',
                shortcutTrick: 'XeF₄ has 2 lone pairs above and below the plane: square planar.'
            },
            {
                id: 'pt03-m1',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Trigonometric Equations',
                statement: 'The number of solutions of the equation sin(2x) + cos(2x) = 1 in the interval [0, 2π] is:',
                options: [
                    { id: 'A', text: '4' },
                    { id: 'B', text: '5' },
                    { id: 'C', text: '3' },
                    { id: 'D', text: '2' }
                ],
                correctAnswer: 'B',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Divide by √2: sin(2x + π/4) = 1/√2',
                explanation: 'sin(2x + π/4) = sin(π/4). For x ∈ [0, 2π], θ = 2x + π/4 ∈ [π/4, 4π + π/4]. The angles where sin θ = 1/√2 are π/4, 3π/4, 9π/4, 11π/4, 17π/4. This yields 5 distinct solutions for x.',
                shortcutTrick: 'Include endpoints: x = 0, π/4, π, 5π/4, 2π. Exactly 5 solutions in [0, 2π].'
            },
            {
                id: 'pt03-m2',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Trigonometric Identities',
                statement: 'The exact value of cos(20°) cos(40°) cos(80°) is equal to:',
                options: [
                    { id: 'A', text: '1 / 8' },
                    { id: 'B', text: '1 / 16' },
                    { id: 'C', text: '1 / 4' },
                    { id: 'D', text: '3 / 8' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'cos(θ) cos(60° - θ) cos(60° + θ) = (1/4) cos(3θ)',
                explanation: 'For θ = 20°: cos(20°) cos(40°) cos(80°) = (1/4) cos(60°) = (1/4) × (1/2) = 1/8.',
                shortcutTrick: 'DK Sir Standard Identity: cos(θ) cos(60-θ) cos(60+θ) = 1/4 cos(3θ) = 1/4 × 1/2 = 1/8 in 3 seconds!'
            }
        ]
    },
    // ─── 04. PART TEST 04 ───
    {
        id: 'part-test-04',
        title: 'JEE Main Part Test 04: Center of Mass, Gaseous State & Permutations',
        subtitle: 'Class 11 Dynamics & Combinatorics: Momentum Conservation, Real Gases, PnC',
        slug: 'jee-main-part-test-04-center-of-mass-gaseous-state-permutations',
        badgeCode: 'PART TEST',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Hard',
        durationMinutes: 90,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        status: 'Published',
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Focus on variable mass systems, van der Waals equation critical constants, and circular permutations.'
        ],
        questions: [
            {
                id: 'pt04-p1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Center of Mass & Linear Momentum',
                statement: 'A projectile of mass m is fired with velocity v at an angle θ. At the top of its trajectory, it explodes into two equal fragments. One fragment retraces its path back to the launch point. The speed of the second fragment immediately after explosion is:',
                options: [
                    { id: 'A', text: '3 v cos θ' },
                    { id: 'B', text: '2 v cos θ' },
                    { id: 'C', text: 'v cos θ' },
                    { id: 'D', text: '4 v cos θ' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Conservation of linear momentum: m v_top = (m/2) v₁ + (m/2) v₂',
                explanation: 'At the top, velocity is horizontal: v_top = v cos θ. Initial momentum = m v cos θ. The first fragment retraces its path, so v₁ = -v cos θ. By conservation of momentum: m v cos θ = (m/2)(-v cos θ) + (m/2)v₂ ⇒ v cos θ = -(1/2)v cos θ + (1/2)v₂ ⇒ (1/2)v₂ = (3/2)v cos θ ⇒ v₂ = 3 v cos θ.',
                shortcutTrick: 'Momentum conservation: 1 = -0.5 + 0.5(v₂/u) ⇒ v₂ = 3u = 3 v cos θ.'
            },
            {
                id: 'pt04-p2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Center of Mass of Truncated Bodies',
                statement: 'From a uniform circular disc of radius R, a smaller circular disc of radius R/2 is cut out such that its perimeter touches the perimeter of the original disc. The distance of the center of mass of the remaining portion from the center of the original disc is:',
                options: [
                    { id: 'A', text: 'R / 6' },
                    { id: 'B', text: 'R / 4' },
                    { id: 'C', text: 'R / 3' },
                    { id: 'D', text: 'R / 8' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'X_cm = (M₁ x₁ - M₂ x₂) / (M₁ - M₂)',
                explanation: 'Original disc mass M₁ = π R² σ, centered at x₁ = 0. Removed disc mass M₂ = π (R/2)² σ = M₁ / 4, centered at x₂ = R/2. X_cm = [0 - (M₁/4)(R/2)] / [M₁ - M₁/4] = -(R/8) / (3/4) = -R / 6.',
                shortcutTrick: 'Standard mass-removal formula: x = -x₂ / [(R/r)² - 1] = -(R/2) / [4 - 1] = -R/6.'
            },
            {
                id: 'pt04-c1',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'States of Matter & Real Gases',
                statement: 'The van der Waals constant \'a\' for gases O₂, N₂, NH₃, and CH₄ are 1.36, 1.39, 4.17, and 2.25 L² atm mol⁻² respectively. The gas which can be most easily liquefied is:',
                options: [
                    { id: 'A', text: 'NH₃' },
                    { id: 'B', text: 'CH₄' },
                    { id: 'C', text: 'N₂' },
                    { id: 'D', text: 'O₂' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Higher van der Waals constant \'a\' indicates stronger intermolecular attractive forces and higher critical temperature T_c',
                explanation: 'The van der Waals parameter \'a\' is a direct measure of intermolecular attractive forces. Greater \'a\' means higher critical temperature T_c = 8a / (27Rb), making liquefaction easiest. NH₃ has the highest \'a\' = 4.17 due to strong intermolecular hydrogen bonding.',
                shortcutTrick: 'Maximum \'a\' = maximum attractive force = easiest to liquefy (NH₃).'
            },
            {
                id: 'pt04-c2',
                questionNumber: 4,
                subject: 'Chemistry',
                chapter: 'Gas Laws & Maxwell Speed Distribution',
                statement: 'The ratio between the root mean square speed (u_rms), average speed (u_avg), and most probable speed (u_mp) of gas molecules at a given temperature is:',
                options: [
                    { id: 'A', text: '√3 : √(8/π) : √2 ≈ 1.224 : 1.128 : 1' },
                    { id: 'B', text: '√2 : √(8/π) : √3' },
                    { id: 'C', text: '1 : 1 : 1' },
                    { id: 'D', text: '3 : 2.5 : 2' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'u_rms = √(3RT/M), u_avg = √(8RT/πM), u_mp = √(2RT/M)',
                explanation: 'u_rms : u_avg : u_mp = √3 : √(8/π) : √2 = 1.732 : 1.595 : 1.414 = 1.224 : 1.128 : 1.',
                shortcutTrick: 'RAM Rule: RMS > Average > Most Probable.'
            },
            {
                id: 'pt04-m1',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Permutations & Combinations',
                statement: 'The number of 5-digit numbers that can be formed using digits 1, 2, 3, 4, 5 without repetition which are divisible by 4 is:',
                options: [
                    { id: 'A', text: '24' },
                    { id: 'B', text: '36' },
                    { id: 'C', text: '18' },
                    { id: 'D', text: '48' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'A number is divisible by 4 if its last two digits form a multiple of 4',
                explanation: 'Pairs of last two digits from {1, 2, 3, 4, 5} divisible by 4 are: 12, 24, 32, 52 (4 valid pairs). For each pair, the remaining 3 positions can be filled in 3! = 6 ways. Total numbers = 4 × 6 = 24.',
                shortcutTrick: '4 ending pairs × 3! = 4 × 6 = 24 in 10 seconds.'
            },
            {
                id: 'pt04-m2',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Circular Permutations & Grouping',
                statement: 'In how many ways can 5 boys and 5 girls be seated around a round table such that no two girls sit together?',
                options: [
                    { id: 'A', text: '4! × 5!' },
                    { id: 'B', text: '5! × 5!' },
                    { id: 'C', text: '4! × 4!' },
                    { id: 'D', text: '10!' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Circular arrangement of n items = (n - 1)!; gap method for alternating seats',
                explanation: 'First arrange 5 boys around the circle in (5 - 1)! = 4! ways. This creates 5 distinct gaps between boys. Seat the 5 girls in these 5 gaps in 5! ways. Total arrangements = 4! × 5! = 24 × 120 = 2,880.',
                shortcutTrick: 'Gap method around circle: (5-1)! × 5! = 4! × 5!.'
            }
        ]
    },
    // ─── 05. PART TEST 05 ───
    {
        id: 'part-test-05',
        title: 'JEE Main Part Test 05: Rotational Motion, Thermodynamics & Straight Lines',
        subtitle: 'High-Yield Class 11: Torque & Angular Momentum, First Law, 2D Geometry',
        slug: 'jee-main-part-test-05-rotational-motion-thermodynamics-straight-lines',
        badgeCode: 'PART TEST',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Hard',
        durationMinutes: 90,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        status: 'Published',
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Focus on rolling without slipping, adiabatic PV relations, and family of straight lines passing through intersection points.'
        ],
        questions: [
            {
                id: 'pt05-p1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Rotational Dynamics & Rolling',
                statement: 'A solid cylinder and a hollow cylinder of equal mass and radius roll down an inclined plane without slipping starting from rest. The ratio of their linear accelerations is:',
                options: [
                    { id: 'A', text: '4 / 3' },
                    { id: 'B', text: '3 / 4' },
                    { id: 'C', text: '2 / 1' },
                    { id: 'D', text: '5 / 3' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'a = g sin θ / (1 + k²/R²)',
                explanation: 'For solid cylinder: k²/R² = 1/2 ⇒ a_solid = g sin θ / (1 + 1/2) = (2/3) g sin θ. For hollow cylinder: k²/R² = 1 ⇒ a_hollow = g sin θ / (1 + 1) = (1/2) g sin θ. Ratio = (2/3) / (1/2) = 4/3.',
                shortcutTrick: 'a ∝ 1/(1 + I/mR²). Solid cylinder: 1/(1.5); Hollow: 1/2. Ratio = 2 / 1.5 = 4/3.'
            },
            {
                id: 'pt05-p2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Angular Momentum Conservation',
                statement: 'A uniform circular platform of mass 100 kg and radius 2 m rotates freely with angular velocity 10 rpm. A person of mass 50 kg standing at the rim walks to the center. The new angular speed of the platform is:',
                options: [
                    { id: 'A', text: '20 rpm' },
                    { id: 'B', text: '15 rpm' },
                    { id: 'C', text: '25 rpm' },
                    { id: 'D', text: '30 rpm' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'L = I₁ ω₁ = I₂ ω₂',
                explanation: 'Initial MOI = I_disc + I_man = 1/2 M R² + m R² = 1/2(100)(4) + 50(4) = 200 + 200 = 400 kg·m². When at center, man\'s MOI = 0, so I_final = 200 kg·m². Conservation of angular momentum gives 400 × 10 = 200 × ω₂ ⇒ ω₂ = 20 rpm.',
                shortcutTrick: 'Total inertia halves from 400 to 200, so angular velocity must double from 10 to 20 rpm.'
            },
            {
                id: 'pt05-c1',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'Chemical Thermodynamics',
                statement: 'One mole of an ideal monoatomic gas (C_v = 3/2 R) expands adiabatically against a constant external pressure of 1 atm from an initial volume of 2 L to 10 L at initial temperature 300 K. The final temperature of the gas is:',
                options: [
                    { id: 'A', text: '235 K' },
                    { id: 'B', text: '180 K' },
                    { id: 'C', text: '270 K' },
                    { id: 'D', text: '150 K' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'ΔU = q + w; for adiabatic q = 0 ⇒ n C_v (T₂ - T₁) = -P_ext (V₂ - V₁)',
                explanation: 'w = -P_ext ΔV = -1 atm × (10 - 2) L = -8 L·atm = -8 × 101.3 J ≈ -810.4 J. Since q = 0, ΔU = w ⇒ 1 × (3/2) × 8.314 × (T₂ - 300) = -810.4 ⇒ 12.47 (T₂ - 300) = -810.4 ⇒ T₂ - 300 = -65 K ⇒ T₂ ≈ 235 K.',
                shortcutTrick: 'Irreversible expansion: n C_v ΔT = -P_ext ΔV. Simple algebra yields ~235 K.'
            },
            {
                id: 'pt05-c2',
                questionNumber: 4,
                subject: 'Chemistry',
                chapter: 'Enthalpy & Hess Law',
                statement: 'For the reaction: 2 C(s) + 3 H₂(g) → C₂H₆(g), the standard enthalpy change is called:',
                options: [
                    { id: 'A', text: 'Standard enthalpy of formation of ethane' },
                    { id: 'B', text: 'Standard enthalpy of combustion of carbon' },
                    { id: 'C', text: 'Standard enthalpy of hydrogenation' },
                    { id: 'D', text: 'Standard bond enthalpy of C-C' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Enthalpy of formation is the change when 1 mole of compound is formed from elements in their standard states',
                explanation: 'C(s) as graphite and H₂(g) are standard reference elemental states. Forming 1 mole of C₂H₆ from its constituent elements in standard state defines the standard molar enthalpy of formation ΔH_f°.',
                shortcutTrick: '1 mole synthesized from pure constituent elements in reference states = Enthalpy of Formation.'
            },
            {
                id: 'pt05-m1',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Straight Lines & Slope',
                statement: 'The distance between the parallel lines 3x + 4y = 9 and 6x + 8y + 15 = 0 is:',
                options: [
                    { id: 'A', text: '3.3 units' },
                    { id: 'B', text: '2.5 units' },
                    { id: 'C', text: '4.5 units' },
                    { id: 'D', text: '1.8 units' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'd = |c₁ - c₂| / √(a² + b²) after equating coefficients',
                explanation: 'Multiply first line by 2: 6x + 8y - 18 = 0. Second line is 6x + 8y + 15 = 0. d = |15 - (-18)| / √(6² + 8²) = 33 / 10 = 3.3 units.',
                shortcutTrick: 'Match coefficients first! 6x + 8y - 18 = 0 vs 6x + 8y + 15 = 0: gap = 33 / 10 = 3.3 units.'
            },
            {
                id: 'pt05-m2',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Family of Lines & Concurrent Lines',
                statement: 'If the lines 2x + y - 3 = 0, 5x + ky - 3 = 0, and 3x - y - 2 = 0 are concurrent, then the value of k is:',
                options: [
                    { id: 'A', text: '-2' },
                    { id: 'B', text: '3' },
                    { id: 'C', text: '-1' },
                    { id: 'D', text: '2' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Point of intersection of line 1 & line 3 must satisfy line 2',
                explanation: 'Solve 2x + y = 3 and 3x - y = 2. Adding yields 5x = 5 ⇒ x = 1, y = 1. Substitute (1, 1) into second line: 5(1) + k(1) - 3 = 0 ⇒ k + 2 = 0 ⇒ k = -2.',
                shortcutTrick: 'Directly add line 1 & 3: (1, 1). Plug into line 2: 5 + k - 3 = 0 ⇒ k = -2 in 5 seconds.'
            }
        ]
    },
    // ─── 06. PART TEST 06 ───
    {
        id: 'part-test-06',
        title: 'JEE Main Part Test 06: Gravitation, Thermochemistry & Circles',
        subtitle: 'Class 11 Field Physics & Coordinate Geometry: Orbital Velocity, Enthalpy, Circles',
        slug: 'jee-main-part-test-06-gravitation-thermochemistry-circles',
        badgeCode: 'PART TEST',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Medium',
        durationMinutes: 90,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        status: 'Published',
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Focus on satellite energy, resonance bond dissociation enthalpies, and circle tangents from external points.'
        ],
        questions: [
            {
                id: 'pt06-p1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Gravitation & Satellites',
                statement: 'The escape speed from Earth\'s surface is v_e. A body is projected from Earth\'s surface with speed 2 v_e. Its speed in interstellar space (far away from Earth) is:',
                options: [
                    { id: 'A', text: '√3 v_e' },
                    { id: 'B', text: 'v_e' },
                    { id: 'C', text: '2 v_e' },
                    { id: 'D', text: '√5 v_e' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Conservation of mechanical energy: 1/2 m v² - G M m / R = 1/2 m v_∞²',
                explanation: 'Initial energy = 1/2 m (2 v_e)² - 1/2 m v_e² = 1/2 m [4 v_e² - v_e²] = 1/2 m (3 v_e²). Equating to final kinetic energy 1/2 m v_∞² gives v_∞ = √3 v_e.',
                shortcutTrick: 'Energy subtraction rule: v_final = √(v_proj² - v_esc²) = √(4 - 1) v_e = √3 v_e.'
            },
            {
                id: 'pt06-p2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Variation of Gravity g',
                statement: 'The height h above the Earth\'s surface at which the acceleration due to gravity becomes g/9 (where R is the radius of Earth) is:',
                options: [
                    { id: 'A', text: '2 R' },
                    { id: 'B', text: '3 R' },
                    { id: 'C', text: '√3 R' },
                    { id: 'D', text: '8 R' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'g_h = g / (1 + h/R)²',
                explanation: 'g_h / g = 1/9 ⇒ (1 + h/R)² = 9 ⇒ 1 + h/R = 3 ⇒ h = 2R.',
                shortcutTrick: 'g becomes 1/n² at distance r = n R from center. Here n = 3, so r = 3R, height h = 3R - R = 2R.'
            },
            {
                id: 'pt06-c1',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'Thermochemistry & Bond Energy',
                statement: 'Given that bond energies of H-H, Cl-Cl, and H-Cl are 430, 240, and 430 kJ/mol respectively, ΔH for the reaction H₂(g) + Cl₂(g) → 2 HCl(g) is:',
                options: [
                    { id: 'A', text: '-190 kJ' },
                    { id: 'B', text: '+190 kJ' },
                    { id: 'C', text: '-380 kJ' },
                    { id: 'D', text: '+380 kJ' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'ΔH_rxn = Σ BE(reactants) - Σ BE(products)',
                explanation: 'ΔH = [BE(H-H) + BE(Cl-Cl)] - 2 × BE(H-Cl) = [430 + 240] - 2(430) = 670 - 860 = -190 kJ.',
                shortcutTrick: 'ΔH = 240 - 430 = -190 kJ.'
            },
            {
                id: 'pt06-c2',
                questionNumber: 4,
                subject: 'Chemistry',
                chapter: 'Spontaneity & Gibbs Energy',
                statement: 'For a process at constant pressure and temperature, the condition for spontaneity in terms of Gibbs free energy change (ΔG) and total entropy change (ΔS_total) is:',
                options: [
                    { id: 'A', text: 'ΔG < 0 and ΔS_total > 0' },
                    { id: 'B', text: 'ΔG > 0 and ΔS_total < 0' },
                    { id: 'C', text: 'ΔG = 0 and ΔS_total = 0' },
                    { id: 'D', text: 'ΔG < 0 and ΔS_total < 0' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Second Law of Thermodynamics: ΔG = -T ΔS_total',
                explanation: 'Spontaneous processes must increase the entropy of the universe: ΔS_total > 0. Since ΔG = -T ΔS_total at constant T and P, ΔG must be negative (< 0).',
                shortcutTrick: 'Spontaneous = energy decreases (ΔG < 0) and universe entropy increases (ΔS_total > 0).'
            },
            {
                id: 'pt06-m1',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Circles & Tangents',
                statement: 'The length of the tangent drawn from the point (5, 1) to the circle x² + y² + 6x - 4y - 3 = 0 is:',
                options: [
                    { id: 'A', text: '7 units' },
                    { id: 'B', text: '5 units' },
                    { id: 'C', text: '√49 = 7' },
                    { id: 'D', text: '6 units' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'L = √S₁',
                explanation: 'S₁ = 5² + 1² + 6(5) - 4(1) - 3 = 25 + 1 + 30 - 4 - 3 = 49. Length of tangent L = √S₁ = √49 = 7 units.',
                shortcutTrick: 'Plug point directly: 25 + 1 + 30 - 4 - 3 = 49. Square root is 7.'
            },
            {
                id: 'pt06-m2',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Common Tangents to Circles',
                statement: 'The number of common tangents that can be drawn to the two circles x² + y² = 16 and x² + y² - 12x + 32 = 0 is:',
                options: [
                    { id: 'A', text: '3' },
                    { id: 'B', text: '4' },
                    { id: 'C', text: '2' },
                    { id: 'D', text: '1' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Circles touching externally have distance between centers C₁C₂ = r₁ + r₂',
                explanation: 'Circle 1: C₁(0, 0), r₁ = 4. Circle 2: x² + y² - 12x + 32 = 0 ⇒ (x - 6)² + y² = 4 ⇒ C₂(6, 0), r₂ = 2. Distance C₁C₂ = 6. Since r₁ + r₂ = 4 + 2 = 6 = C₁C₂, the two circles touch each other externally. Two external touching circles admit exactly 3 common tangents.',
                shortcutTrick: 'C₁C₂ = r₁ + r₂ = 6 ⇒ External touch ⇒ Exactly 3 common tangents (2 direct + 1 transverse).'
            }
        ]
    },
    // ─── 07. PART TEST 07 ───
    {
        id: 'part-test-07',
        title: 'JEE Main Part Test 07: Fluid Mechanics, Chemical Equilibrium & Parabola',
        subtitle: 'Class 11 Hydrodynamics & Conics: Bernoulli Theorem, Le Chatelier, Parabola',
        slug: 'jee-main-part-test-07-fluid-mechanics-chemical-equilibrium-parabola',
        badgeCode: 'PART TEST',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Medium',
        durationMinutes: 90,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        status: 'Published',
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Focus on Torricelli efflux speed, Le Chatelier pressure shifts, and focal chords of parabolas.'
        ],
        questions: [
            {
                id: 'pt07-p1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Fluid Mechanics & Hydrodynamics',
                statement: 'A tank filled with water has a small hole at depth h = 5 m below the free water surface. The speed of efflux of water through the hole is (g = 10 m/s²):',
                options: [
                    { id: 'A', text: '10 m/s' },
                    { id: 'B', text: '5 m/s' },
                    { id: 'C', text: '14.1 m/s' },
                    { id: 'D', text: '20 m/s' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Torricelli\'s Law: v = √(2gh)',
                explanation: 'v = √(2 × 10 × 5) = √100 = 10 m/s.',
                shortcutTrick: 'Direct Torricelli: √(2 × 10 × 5) = 10 m/s in 2 seconds.'
            },
            {
                id: 'pt07-p2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Surface Tension & Excess Pressure',
                statement: 'The excess pressure inside a spherical soap bubble of radius r in air with surface tension T is:',
                options: [
                    { id: 'A', text: '4T / r' },
                    { id: 'B', text: '2T / r' },
                    { id: 'C', text: 'T / r' },
                    { id: 'D', text: '8T / r' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Soap bubble has two free liquid-air surfaces: ΔP = 2(2T/r) = 4T/r',
                explanation: 'A liquid drop has one free surface (ΔP = 2T/r). A soap bubble has an inner and outer liquid-gas interface, doubling the excess pressure: ΔP = 4T / r.',
                shortcutTrick: 'Bubble has 2 surfaces: 2 × (2T/r) = 4T/r.'
            },
            {
                id: 'pt07-c1',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'Chemical Equilibrium & Le Chatelier',
                statement: 'For the exothermic reaction: N₂(g) + 3 H₂(g) ⇌ 2 NH₃(g), ΔH < 0, the yield of NH₃ increases with:',
                options: [
                    { id: 'A', text: 'High pressure and low temperature' },
                    { id: 'B', text: 'Low pressure and high temperature' },
                    { id: 'C', text: 'High pressure and high temperature' },
                    { id: 'D', text: 'Low pressure and low temperature' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Le Chatelier Principle: Δn_g = 2 - 4 = -2 < 0; ΔH < 0 (exothermic)',
                explanation: 'Since Δn_g = -2, increasing pressure shifts equilibrium towards fewer moles (forward, producing more NH₃). Since the reaction is exothermic, lowering temperature shifts equilibrium forward to release heat. Hence optimal yield requires high pressure and low temperature.',
                shortcutTrick: 'Haber process condition: high pressure favors volume reduction, low temp favors exothermic.'
            },
            {
                id: 'pt07-c2',
                questionNumber: 4,
                subject: 'Chemistry',
                chapter: 'Equilibrium Constant Relations',
                statement: 'The relation between equilibrium constants K_p and K_c for the dissociation PCl₅(g) ⇌ PCl₃(g) + Cl₂(g) is:',
                options: [
                    { id: 'A', text: 'K_p = K_c (RT)' },
                    { id: 'B', text: 'K_p = K_c / (RT)' },
                    { id: 'C', text: 'K_p = K_c (RT)²' },
                    { id: 'D', text: 'K_p = K_c' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'K_p = K_c (RT)^(Δn_g)',
                explanation: 'Δn_g = (moles of gaseous products) - (moles of gaseous reactants) = (1 + 1) - 1 = 1. Therefore K_p = K_c (RT)¹ = K_c (RT).',
                shortcutTrick: 'Δn = 2 - 1 = 1 ⇒ K_p = K_c (RT).'
            },
            {
                id: 'pt07-m1',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Parabola & Focal Chord',
                statement: 'If one end of a focal chord of the parabola y² = 16x is (1, 4), then the coordinates of the other end are:',
                options: [
                    { id: 'A', text: '(16, -16)' },
                    { id: 'B', text: '(4, -8)' },
                    { id: 'C', text: '(8, -8)' },
                    { id: 'D', text: '(9, -12)' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Parametric points (at², 2at) on focal chord satisfy t₁ t₂ = -1',
                explanation: 'y² = 4ax with 4a = 16 ⇒ a = 4. Point (1, 4) has 2at₁ = 4 ⇒ 2(4)t₁ = 4 ⇒ t₁ = 1/2. Check: at₁² = 4(1/4) = 1 (matches). For focal chord, t₂ = -1/t₁ = -1 / (1/2) = -2. The other end is (at₂², 2at₂) = (4(-2)², 2(4)(-2)) = (16, -16).',
                shortcutTrick: 'DK Sir Focal Chord Rule: t₁ t₂ = -1. t₁ = 1/2 ⇒ t₂ = -2 ⇒ (4×4, 8×(-2)) = (16, -16).'
            },
            {
                id: 'pt07-m2',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Tangents to Parabola',
                statement: 'The equation of the tangent to the parabola y² = 8x with slope m = 2 is:',
                options: [
                    { id: 'A', text: 'y = 2x + 1' },
                    { id: 'B', text: 'y = 2x + 2' },
                    { id: 'C', text: 'y = 2x - 1' },
                    { id: 'D', text: '2x - y + 4 = 0' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'y = mx + a/m',
                explanation: 'y² = 4ax ⇒ 4a = 8 ⇒ a = 2. Tangent in slope form: y = mx + a/m = 2x + 2/2 = 2x + 1.',
                shortcutTrick: 'y = mx + a/m = 2x + 2/2 = 2x + 1 in 3 seconds.'
            }
        ]
    },
    // ─── 08. PART TEST 08 ───
    {
        id: 'part-test-08',
        title: 'JEE Main Part Test 08: Thermal Properties, Ionic Equilibrium & Ellipse/Hyperbola',
        subtitle: 'Class 11 Heat & Coordinate: Conduction, pH & Buffer Solutions, Conic Geometry',
        slug: 'jee-main-part-test-08-thermal-properties-ionic-equilibrium-conics',
        badgeCode: 'PART TEST',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Hard',
        durationMinutes: 90,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        status: 'Published',
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Focus on equivalent thermal resistance, Henderson-Hasselbalch equation, and director circles of conics.'
        ],
        questions: [
            {
                id: 'pt08-p1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Heat Transfer & Conduction',
                statement: 'Two rods of identical dimensions with thermal conductivities K₁ and K₂ are connected in series. The effective thermal conductivity of the combined rod is:',
                options: [
                    { id: 'A', text: '2 K₁ K₂ / (K₁ + K₂)' },
                    { id: 'B', text: '(K₁ + K₂) / 2' },
                    { id: 'C', text: '√(K₁ K₂)' },
                    { id: 'D', text: 'K₁ K₂ / (K₁ + K₂)' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'R_eq = R₁ + R₂; L_eq / (K_eq A) = L / (K₁ A) + L / (K₂ A)',
                explanation: '2L / K_eq = L/K₁ + L/K₂ ⇒ 2 / K_eq = (K₁ + K₂) / (K₁ K₂) ⇒ K_eq = 2 K₁ K₂ / (K₁ + K₂).',
                shortcutTrick: 'Series combination of thermal conductors is harmonic mean: 2 K₁ K₂ / (K₁ + K₂).'
            },
            {
                id: 'pt08-p2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Stefan-Boltzmann Radiation',
                statement: 'A black body radiates heat at the rate of E W/m² at temperature 27°C. If the temperature is raised to 327°C, the radiated rate becomes:',
                options: [
                    { id: 'A', text: '16 E' },
                    { id: 'B', text: '8 E' },
                    { id: 'C', text: '4 E' },
                    { id: 'D', text: '2 E' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'E ∝ T⁴ (in Kelvin)',
                explanation: 'T₁ = 27 + 273 = 300 K. T₂ = 327 + 273 = 600 K. T₂ / T₁ = 2. Radiated energy E₂ / E₁ = (T₂ / T₁)⁴ = 2⁴ = 16. Hence E₂ = 16 E.',
                shortcutTrick: 'Always convert to Kelvin: 300K to 600K doubles temperature. 2⁴ = 16x radiation.'
            },
            {
                id: 'pt08-c1',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'Ionic Equilibrium & Buffer Solutions',
                statement: 'The pH of a buffer solution prepared by mixing 50 mL of 0.2 M CH₃COOH and 50 mL of 0.2 M CH₃COONa is (pK_a of CH₃COOH = 4.74):',
                options: [
                    { id: 'A', text: '4.74' },
                    { id: 'B', text: '5.04' },
                    { id: 'C', text: '4.44' },
                    { id: 'D', text: '7.00' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Henderson-Hasselbalch: pH = pK_a + log([Salt]/[Acid])',
                explanation: 'Equal moles of salt (CH₃COONa) and acid (CH₃COOH) are present. [Salt] / [Acid] = 1, and log(1) = 0. Therefore pH = pK_a = 4.74.',
                shortcutTrick: 'Equimolar acid and salt buffer ⇒ pH = pK_a directly.'
            },
            {
                id: 'pt08-c2',
                questionNumber: 4,
                subject: 'Chemistry',
                chapter: 'Solubility Product (K_sp)',
                statement: 'If the solubility product of a sparingly soluble salt AB₂ is K_sp = 4 × 10⁻¹², its molar solubility \'s\' in pure water is:',
                options: [
                    { id: 'A', text: '1 × 10⁻⁴ mol/L' },
                    { id: 'B', text: '2 × 10⁻⁶ mol/L' },
                    { id: 'C', text: '1 × 10⁻⁶ mol/L' },
                    { id: 'D', text: '2 × 10⁻⁴ mol/L' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'For AB₂: K_sp = s (2s)² = 4s³',
                explanation: 'K_sp = 4s³ = 4 × 10⁻¹² ⇒ s³ = 10⁻¹² ⇒ s = 10⁻⁴ mol/L.',
                shortcutTrick: '4s³ = 4 × 10⁻¹² ⇒ s = 10⁻⁴ mol/L in 3 seconds.'
            },
            {
                id: 'pt08-m1',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Ellipse & Eccentricity',
                statement: 'The eccentricity of the ellipse 9x² + 25y² = 225 is:',
                options: [
                    { id: 'A', text: '4 / 5' },
                    { id: 'B', text: '3 / 5' },
                    { id: 'C', text: '16 / 25' },
                    { id: 'D', text: '2 / 5' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'x²/25 + y²/9 = 1; e = √(1 - b²/a²)',
                explanation: 'a² = 25, b² = 9. e = √(1 - 9/25) = √(16/25) = 4/5.',
                shortcutTrick: 'e = √(1 - 9/25) = 4/5.'
            },
            {
                id: 'pt08-m2',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Hyperbola & Asymptotes',
                statement: 'The angle between the asymptotes of the hyperbola x² - 3y² = 3 is:',
                options: [
                    { id: 'A', text: '60°' },
                    { id: 'B', text: '90°' },
                    { id: 'C', text: '120°' },
                    { id: 'D', text: '45°' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Asymptotes equation: x²/a² - y²/b² = 0 ⇒ y = ±(b/a)x; 2θ = 2 tan⁻¹(b/a)',
                explanation: 'x²/3 - y²/1 = 1 ⇒ a = √3, b = 1. Asymptotes are y = ±(1/√3)x ⇒ slopes are tan θ = 1/√3 ⇒ θ = 30°. The total angle between asymptotes is 2θ = 2(30°) = 60°.',
                shortcutTrick: '2 tan⁻¹(b/a) = 2 tan⁻¹(1/√3) = 2(30°) = 60°.'
            }
        ]
    },
    // ─── 09. PART TEST 09 ───
    {
        id: 'part-test-09',
        title: 'JEE Main Part Test 09: SHM, Organic Chemistry Basics (GOC) & Complex Numbers',
        subtitle: 'Crucial Transition Unit: Oscillations, Inductive/Resonance Effects, Argand Plane',
        slug: 'jee-main-part-test-09-shm-goc-complex-numbers',
        badgeCode: 'PART TEST',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Hard',
        durationMinutes: 90,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        status: 'Published',
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Focus on spring-mass combinations, carbocation stability hierarchies, and cube roots of unity.'
        ],
        questions: [
            {
                id: 'pt09-p1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Simple Harmonic Motion (SHM)',
                statement: 'A particle executes SHM with amplitude A. The displacement from mean position at which its kinetic energy equals its potential energy is:',
                options: [
                    { id: 'A', text: 'A / √2' },
                    { id: 'B', text: 'A / 2' },
                    { id: 'C', text: '√3 A / 2' },
                    { id: 'D', text: 'A / 4' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'KE = 1/2 k (A² - x²); PE = 1/2 k x²',
                explanation: 'KE = PE ⇒ 1/2 k (A² - x²) = 1/2 k x² ⇒ A² - x² = x² ⇒ 2x² = A² ⇒ x = A / √2.',
                shortcutTrick: 'KE = PE occurs at x = A / √2.'
            },
            {
                id: 'pt09-p2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Spring Combination Time Period',
                statement: 'Two identical springs each of spring constant k are connected in parallel and support a mass m. The time period of vertical oscillations is:',
                options: [
                    { id: 'A', text: '2π √(m / 2k)' },
                    { id: 'B', text: '2π √(2m / k)' },
                    { id: 'C', text: '2π √(m / k)' },
                    { id: 'D', text: 'π √(m / k)' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'k_parallel = k₁ + k₂ = 2k; T = 2π √(m / k_eq)',
                explanation: 'In parallel combination, effective spring constant k_eq = k + k = 2k. Time period T = 2π √(m / k_eq) = 2π √(m / 2k).',
                shortcutTrick: 'Parallel springs add stiffness: k_eff = 2k ⇒ T = 2π √(m / 2k).'
            },
            {
                id: 'pt09-c1',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'General Organic Chemistry (GOC)',
                statement: 'The correct order of stability of the following carbocations is: (I) (CH₃)₃C⁺, (II) (CH₃)₂CH⁺, (III) CH₃CH₂⁺, (IV) C₆H₅CH₂⁺:',
                options: [
                    { id: 'A', text: 'I > IV > II > III' },
                    { id: 'B', text: 'IV > I > II > III' },
                    { id: 'C', text: 'I > II > IV > III' },
                    { id: 'D', text: 'IV > II > I > III' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Tertiary butyl carbocation has 9 hyperconjugative α-hydrogens, stabilizing it more than benzyl carbocation',
                explanation: 'tert-Butyl carbocation (I) has 9 hyperconjugative structures, making it slightly more stable in gas phase and solution than the resonance-stabilized benzyl cation (IV), followed by secondary (6 α-H) and primary (3 α-H): I > IV > II > III.',
                shortcutTrick: '3° alkyl with 9 α-hydrogens exceeds benzyl in standard stability indices.'
            },
            {
                id: 'pt09-c2',
                questionNumber: 4,
                subject: 'Chemistry',
                chapter: 'Aromaticity & Hückel Rule',
                statement: 'Which of the following planar cyclic species is anti-aromatic according to Hückel\'s rule (4n π-electrons)?',
                options: [
                    { id: 'A', text: 'Cyclobutadiene' },
                    { id: 'B', text: 'Benzene' },
                    { id: 'C', text: 'Cyclopentadienyl anion' },
                    { id: 'D', text: 'Tropylium cation' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Anti-aromatic: planar, completely conjugated ring with 4n π electrons (n = 1 ⇒ 4 π e⁻)',
                explanation: 'Cyclobutadiene is a planar cyclic conjugated ring with 4 π-electrons (4n with n = 1). This makes it highly unstable and anti-aromatic. Benzene, cyclopentadienyl anion, and tropylium cation all have 6 π-electrons (4n + 2, n = 1), making them aromatic.',
                shortcutTrick: '4 π-electrons in conjugated planar ring = textbook anti-aromatic.'
            },
            {
                id: 'pt09-m1',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Complex Numbers & Geometry',
                statement: 'If |z - 4 / z| = 2, then the maximum value of |z| is:',
                options: [
                    { id: 'A', text: '√5 + 1' },
                    { id: 'B', text: '√5 - 1' },
                    { id: 'C', text: '2' },
                    { id: 'D', text: '√3 + 1' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Triangle Inequality: |z| - |4/z| ≤ |z - 4/z| = 2',
                explanation: '|z| - 4/|z| ≤ 2 ⇒ |z|² - 2|z| - 4 ≤ 0. Solving the equality gives roots |z| = (2 ± √(4 + 16)) / 2 = 1 ± √5. Since |z| > 0, the maximum possible value is √5 + 1.',
                shortcutTrick: 'Standard formula for |z - a/z| = b: max |z| = (b + √(b² + 4a)) / 2 = (2 + √(4 + 16)) / 2 = 1 + √5.'
            },
            {
                id: 'pt09-m2',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Cube Roots of Unity',
                statement: 'If ω is a non-real complex cube root of unity, then the value of (1 - ω + ω²)⁵ + (1 + ω - ω²)⁵ is:',
                options: [
                    { id: 'A', text: '32' },
                    { id: 'B', text: '-32' },
                    { id: 'C', text: '16' },
                    { id: 'D', text: '0' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: '1 + ω + ω² = 0 ⇒ 1 + ω² = -ω and 1 + ω = -ω²',
                explanation: '1 - ω + ω² = (1 + ω²) - ω = -ω - ω = -2ω. 1 + ω - ω² = -ω² - ω² = -2ω². Sum of 5th powers = (-2ω)⁵ + (-2ω²)⁵ = -32(ω⁵ + ω¹⁰) = -32(ω² + ω) = -32(-1) = 32.',
                shortcutTrick: '-32(ω² + ω) = -32(-1) = 32 in 5 seconds.'
            }
        ]
    },
    // ─── 10. PART TEST 10 ───
    {
        id: 'part-test-10',
        title: 'JEE Main Part Test 10: Waves & Sound, Hydrocarbons & Probability',
        subtitle: 'Class 11 Capstone Part Test: Doppler Effect, Alkanes/Alkenes, Bayes Theorem',
        slug: 'jee-main-part-test-10-waves-sound-hydrocarbons-probability',
        badgeCode: 'PART TEST',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Hard',
        durationMinutes: 90,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        status: 'Published',
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Focus on Doppler frequency shifts with moving source & observer, electrophilic addition mechanisms, and conditional probability.'
        ],
        questions: [
            {
                id: 'pt10-p1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Doppler Effect in Sound',
                statement: 'A whistle producing sound of frequency 600 Hz is moving towards a stationary observer with speed 30 m/s. The velocity of sound in air is 330 m/s. The apparent frequency heard by the observer is:',
                options: [
                    { id: 'A', text: '660 Hz' },
                    { id: 'B', text: '550 Hz' },
                    { id: 'C', text: '630 Hz' },
                    { id: 'D', text: '700 Hz' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'f\' = f [v / (v - v_s)]',
                explanation: 'f\' = 600 × [330 / (330 - 30)] = 600 × (330 / 300) = 600 × 1.1 = 660 Hz.',
                shortcutTrick: 'Frequency increases by factor 330/300 = 1.1. 600 × 1.1 = 660 Hz.'
            },
            {
                id: 'pt10-p2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Organ Pipes & Harmonics',
                statement: 'A closed organ pipe and an open organ pipe of same length produce 4 beats/s when sounding in their fundamental modes. If the length of the open pipe is doubled, the beat frequency with the original closed pipe becomes:',
                options: [
                    { id: 'A', text: '0 beats/s (resonance)' },
                    { id: 'B', text: '2 beats/s' },
                    { id: 'C', text: '4 beats/s' },
                    { id: 'D', text: '8 beats/s' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'f_closed = v / 4L; f_open = v / 2L',
                explanation: 'f_closed = v / 4L, and f_open = v / 2L. When length of open pipe is doubled (2L), its fundamental frequency becomes v / (2 × 2L) = v / 4L, which is identical to the closed pipe fundamental frequency. Hence the beat frequency is 0 (exact unison).',
                shortcutTrick: 'Doubling open pipe makes fundamental v/(4L), identical to closed pipe v/(4L). Beats = 0.'
            },
            {
                id: 'pt10-c1',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'Hydrocarbons & Ozonolysis',
                statement: 'Reductive ozonolysis (O₃ / Zn-H₂O) of an alkene produces equal moles of ethanal and propanone. The IUPAC name of the original alkene is:',
                options: [
                    { id: 'A', text: '2-Methylbut-2-ene' },
                    { id: 'B', text: '3-Methylbut-1-ene' },
                    { id: 'C', text: 'Pent-2-ene' },
                    { id: 'D', text: '2-Methylbut-1-ene' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Join carbonyl fragments with double bond: CH₃-CH=O + O=C(CH₃)₂ → CH₃-CH=C(CH₃)₂',
                explanation: 'Ethanal is CH₃-CHO. Propanone is (CH₃)₂C=O. Rejoining at the carbonyl oxygens gives CH₃-CH=C(CH₃)₂, which is 2-methylbut-2-ene.',
                shortcutTrick: 'Delete oxygen and glue the carbons: CH₃-CH=C(CH₃)₂ is 2-methylbut-2-ene.'
            },
            {
                id: 'pt10-c2',
                questionNumber: 4,
                subject: 'Chemistry',
                chapter: 'Markownikoff Addition',
                statement: 'Addition of HBr to propene in the presence of benzoyl peroxide yields 1-bromopropane via:',
                options: [
                    { id: 'A', text: 'Free radical mechanism (Kharasch effect)' },
                    { id: 'B', text: 'Electrophilic addition via carbocation' },
                    { id: 'C', text: 'Nucleophilic substitution' },
                    { id: 'D', text: 'Electrophilic aromatic substitution' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Peroxide effect operates specifically with HBr via bromine free radicals',
                explanation: 'In the presence of peroxides, HBr adds anti-Markovnikov via a free radical chain reaction. The bromine radical attacks the terminal carbon to form the more stable 2° alkyl radical, resulting in 1-bromopropane.',
                shortcutTrick: 'Peroxide + HBr = Anti-Markovnikov free radical addition.'
            },
            {
                id: 'pt10-m1',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Conditional Probability',
                statement: 'A box contains 5 red and 3 black balls. Two balls are drawn successively without replacement. If the first ball drawn is red, the probability that the second ball is black is:',
                options: [
                    { id: 'A', text: '3 / 7' },
                    { id: 'B', text: '3 / 8' },
                    { id: 'C', text: '5 / 7' },
                    { id: 'D', text: '1 / 2' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'P(B|R) = black balls remaining / total balls remaining',
                explanation: 'After removing one red ball, 4 red and 3 black balls remain (7 total). Probability of black on 2nd draw = 3 / 7.',
                shortcutTrick: 'Remaining black / remaining total = 3 / 7.'
            },
            {
                id: 'pt10-m2',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Bayes Theorem',
                statement: 'In an entrance exam, 70% candidates pass Mathematics and 60% pass Physics. If 50% pass both subjects, the probability that a candidate passes Mathematics given that he passed Physics is:',
                options: [
                    { id: 'A', text: '5 / 6' },
                    { id: 'B', text: '5 / 7' },
                    { id: 'C', text: '6 / 7' },
                    { id: 'D', text: '1 / 2' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'P(M|P) = P(M ∩ P) / P(P)',
                explanation: 'P(M|P) = 0.50 / 0.60 = 5 / 6.',
                shortcutTrick: 'Both / Physics = 50 / 60 = 5/6 in 2 seconds.'
            }
        ]
    },
    // ─── 11. PART TEST 11 ───
    {
        id: 'part-test-11',
        title: 'JEE Main Part Test 11: Electrostatics, Solid State & Relations and Functions',
        subtitle: 'Class 12 Opening Unit: Coulomb Law & Gauss Field, Crystal Lattices, Functions',
        slug: 'jee-main-part-test-11-electrostatics-solid-state-functions',
        badgeCode: 'PART TEST',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Medium',
        durationMinutes: 90,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        status: 'Published',
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Focus on electric flux through cubic surfaces, packing fraction of FCC/BCC, and domain/range of composite functions.'
        ],
        questions: [
            {
                id: 'pt11-p1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Electrostatics & Gauss\'s Law',
                statement: 'A point charge q is placed at the center of an open face of a cube. The electric flux passing through the cube is:',
                options: [
                    { id: 'A', text: 'q / (2 ε₀)' },
                    { id: 'B', text: 'q / (8 ε₀)' },
                    { id: 'C', text: 'q / (6 ε₀)' },
                    { id: 'D', text: 'q / ε₀' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Symmetry construction: enclose charge with an identical adjacent cube',
                explanation: 'Placing an identical cube adjacent to the open face fully encloses charge q within a combined closed surface of two cubes. Total flux = q / ε₀. By symmetry, the flux through one cube is (1/2)(q / ε₀) = q / (2 ε₀).',
                shortcutTrick: 'Symmetry enclosure: charge on a face is shared by 2 cubes ⇒ q/(2ε₀).'
            },
            {
                id: 'pt11-p2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Electric Dipole & Potential',
                statement: 'The electric potential at a point on the equatorial line of an electric dipole of dipole moment p at distance r is:',
                options: [
                    { id: 'A', text: 'Zero' },
                    { id: 'B', text: 'k p / r²' },
                    { id: 'C', text: '2 k p / r³' },
                    { id: 'D', text: '-k p / r²' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'V = k p cos θ / r²; on equatorial plane θ = 90° ⇒ cos 90° = 0',
                explanation: 'Any point on the perpendicular bisector (equatorial plane) of an electric dipole is equidistant from the positive and negative charges: V = kq/d + k(-q)/d = 0.',
                shortcutTrick: 'Equatorial line is an equipotential surface with potential identically equal to zero.'
            },
            {
                id: 'pt11-c1',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'Solutions & Colligative Properties',
                statement: 'The van \'t Hoff factor (i) for a 0.1 M aqueous solution of K₄[Fe(CN)₆] that is 80% ionized is:',
                options: [
                    { id: 'A', text: '4.2' },
                    { id: 'B', text: '3.8' },
                    { id: 'C', text: '5.0' },
                    { id: 'D', text: '4.8' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'i = 1 + (n - 1)α',
                explanation: 'K₄[Fe(CN)₆] dissociates into 4 K⁺ + [Fe(CN)₆]⁴⁻, so n = 4 + 1 = 5 ions. Degree of dissociation α = 0.80. i = 1 + (5 - 1)(0.80) = 1 + 4(0.80) = 1 + 3.2 = 4.2.',
                shortcutTrick: 'i = 1 + (5-1)×0.8 = 1 + 3.2 = 4.2 in 3 seconds.'
            },
            {
                id: 'pt11-c2',
                questionNumber: 4,
                subject: 'Chemistry',
                chapter: 'Elevation in Boiling Point',
                statement: 'A solution of 6 g urea (M = 60) in 100 g water shows boiling point elevation of ΔT_b. If 18 g glucose (M = 180) is dissolved in 200 g water, the boiling point elevation will be:',
                options: [
                    { id: 'A', text: 'ΔT_b / 2' },
                    { id: 'B', text: 'ΔT_b' },
                    { id: 'C', text: '2 ΔT_b' },
                    { id: 'D', text: 'ΔT_b / 4' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'ΔT_b = K_b × molality (m)',
                explanation: 'Urea moles = 6/60 = 0.1 mol in 100 g water ⇒ molality m₁ = (0.1 / 0.1 kg) = 1.0 m. Glucose moles = 18/180 = 0.1 mol in 200 g water ⇒ molality m₂ = (0.1 / 0.2 kg) = 0.5 m. Since m₂ = m₁ / 2, the elevation is ΔT_b / 2.',
                shortcutTrick: 'Same moles in double solvent mass = half molality = half ΔT_b.'
            },
            {
                id: 'pt11-m1',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Relations and Functions',
                statement: 'The domain of the function f(x) = √(ln(x - 2)) is:',
                options: [
                    { id: 'A', text: '[3, ∞)' },
                    { id: 'B', text: '(2, ∞)' },
                    { id: 'C', text: '[2, ∞)' },
                    { id: 'D', text: '(3, ∞)' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'ln(u) ≥ 0 ⇒ u ≥ 1',
                explanation: 'Inside the square root: ln(x - 2) ≥ 0 ⇒ x - 2 ≥ e⁰ = 1 ⇒ x ≥ 3. Since x > 2 is automatically satisfied for x ≥ 3, the domain is [3, ∞).',
                shortcutTrick: 'Square root requires ln ≥ 0 ⇒ argument ≥ 1 ⇒ x - 2 ≥ 1 ⇒ x ≥ 3.'
            },
            {
                id: 'pt11-m2',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Inverse Trigonometric Functions',
                statement: 'The principal value of cos⁻¹(cos(7π / 6)) is equal to:',
                options: [
                    { id: 'A', text: '5π / 6' },
                    { id: 'B', text: '7π / 6' },
                    { id: 'C', text: 'π / 6' },
                    { id: 'D', text: '-π / 6' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Principal branch of cos⁻¹(x) is [0, π]',
                explanation: '7π/6 lies outside [0, π]. Using cos(2π - θ) = cos θ: cos(7π/6) = cos(2π - 5π/6) = cos(5π/6). Since 5π/6 ∈ [0, π], cos⁻¹(cos(7π/6)) = 5π/6.',
                shortcutTrick: '2π - 7π/6 = 5π/6, which falls squarely in [0, π].'
            }
        ]
    },
    // ─── 12. PART TEST 12 ───
    {
        id: 'part-test-12',
        title: 'JEE Main Part Test 12: Capacitance, Electrochemistry & Matrices Determinants',
        subtitle: 'Class 12 Circuits & Linear Systems: Dielectrics, Nernst Equation, Cramer Rule',
        slug: 'jee-main-part-test-12-capacitance-electrochemistry-matrices',
        badgeCode: 'PART TEST',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Medium',
        durationMinutes: 90,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        status: 'Published',
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Focus on dielectric insertion with/without battery, Nernst equation cell EMF, and matrix adjoint properties.'
        ],
        questions: [
            {
                id: 'pt12-p1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Capacitance & Dielectrics',
                statement: 'A parallel plate capacitor is charged by a battery and then disconnected. A slab of dielectric constant K is then inserted between the plates. The electric field E and stored energy U change by factors of:',
                options: [
                    { id: 'A', text: '1/K and 1/K' },
                    { id: 'B', text: 'K and K' },
                    { id: 'C', text: '1/K and K' },
                    { id: 'D', text: 'Constant and 1/K' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Charge Q is conserved when disconnected: E = Q/(K A ε₀), U = Q²/(2KC)',
                explanation: 'With battery disconnected, charge Q remains constant. Capacitance increases to K C₀. Potential V = Q/C decreases to V₀/K. Electric field E = V/d = E₀/K. Energy U = Q²/(2C) = U₀/K. Both decrease by factor 1/K.',
                shortcutTrick: 'Disconnected battery: Charge Q is conserved! C increases K times ⇒ E and U both drop by 1/K.'
            },
            {
                id: 'pt12-p2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Capacitor Networks',
                statement: 'Three capacitors of capacitance 2 μF, 3 μF, and 6 μF are connected in series across a 12 V supply. The charge on the 3 μF capacitor is:',
                options: [
                    { id: 'A', text: '12 μC' },
                    { id: 'B', text: '24 μC' },
                    { id: 'C', text: '6 μC' },
                    { id: 'D', text: '36 μC' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: '1/C_eq = 1/2 + 1/3 + 1/6 = 1 μF; Q = C_eq V',
                explanation: '1/C_eq = 3/6 + 2/6 + 1/6 = 6/6 = 1 ⇒ C_eq = 1 μF. Total charge Q = C_eq V = 1 μF × 12 V = 12 μC. In series, charge on every capacitor is identical = 12 μC.',
                shortcutTrick: 'Series combination of 2, 3, 6 μF is 1 μF. Q = 1 × 12 = 12 μC on each capacitor.'
            },
            {
                id: 'pt012-c1',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'Electrochemistry & Nernst Equation',
                statement: 'For the cell: Zn | Zn²⁺(0.01 M) || Cu²⁺(1.0 M) | Cu, the cell potential E_cell at 298 K is (given E°_cell = 1.10 V):',
                options: [
                    { id: 'A', text: '1.16 V' },
                    { id: 'B', text: '1.04 V' },
                    { id: 'C', text: '1.10 V' },
                    { id: 'D', text: '1.13 V' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'E_cell = E° - (0.0591/n) log([Zn²⁺]/[Cu²⁺])',
                explanation: 'E = 1.10 - (0.0591/2) log(0.01 / 1.0) = 1.10 - 0.0295 log(10⁻²) = 1.10 - 0.0295(-2) = 1.10 + 0.059 ≈ 1.159 V ≈ 1.16 V.',
                shortcutTrick: '1.10 + 0.0591 = 1.16 V.'
            },
            {
                id: 'pt12-c2',
                questionNumber: 4,
                subject: 'Chemistry',
                chapter: 'Kohlrausch Law & Conductance',
                statement: 'The molar conductivity of an electrolyte at infinite dilution (Λ°_m) can be calculated by extrapolating the plot of Λ_m against √C for:',
                options: [
                    { id: 'A', text: 'Strong electrolytes only (e.g. KCl, NaCl)' },
                    { id: 'B', text: 'Weak electrolytes only (e.g. CH₃COOH)' },
                    { id: 'C', text: 'Both strong and weak electrolytes' },
                    { id: 'D', text: 'Colloidal solutions only' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Debye-Hückel-Onsager equation: Λ_m = Λ°_m - A √C',
                explanation: 'Debye-Hückel-Onsager equation is linear for strong electrolytes, allowing direct extrapolation to zero concentration. For weak electrolytes, Λ_m increases asymptotically as C → 0, requiring Kohlrausch\'s Law of independent migration of ions.',
                shortcutTrick: 'Linear extrapolation works ONLY for strong electrolytes.'
            },
            {
                id: 'pt12-m1',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Matrices & Adjoint Properties',
                statement: 'If A is a 3 × 3 non-singular matrix with det(A) = 3, then det(adj(adj(A))) is equal to:',
                options: [
                    { id: 'A', text: '81' },
                    { id: 'B', text: '27' },
                    { id: 'C', text: '243' },
                    { id: 'D', text: '9' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: '|adj(adj(A))| = |A|^{(n - 1)²}',
                explanation: 'For an n × n matrix, |adj(adj(A))| = |A|^{(n - 1)²}. Here n = 3 and |A| = 3. Power = (3 - 1)² = 2² = 4. Value = 3⁴ = 81.',
                shortcutTrick: 'Formula: |A|^{(n-1)²} = 3^{(3-1)²} = 3⁴ = 81 in 3 seconds.'
            },
            {
                id: 'pt12-m2',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Determinants & Cramer\'s Rule',
                statement: 'The system of linear equations x + y + z = 6, x + 2y + 3z = 10, x + 2y + λz = μ has infinitely many solutions if (λ, μ) is equal to:',
                options: [
                    { id: 'A', text: '(3, 10)' },
                    { id: 'B', text: '(3, 8)' },
                    { id: 'C', text: '(2, 10)' },
                    { id: 'D', text: '(4, 12)' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Infinitely many solutions require Δ = 0 and Δ_x = Δ_y = Δ_z = 0',
                explanation: 'Observe equation 2: x + 2y + 3z = 10. Equation 3 is x + 2y + λz = μ. For infinite solutions, the left-hand side and right-hand side of equation 3 must match equation 2: λ = 3 and μ = 10.',
                shortcutTrick: 'Inspection: Compare Row 2 and Row 3 directly. They become identical when λ = 3, μ = 10.'
            }
        ]
    },
    // ─── 13. PART TEST 13 ───
    {
        id: 'part-test-13',
        title: 'JEE Main Part Test 13: Current Electricity, Chemical Kinetics & Limits Continuity',
        subtitle: 'Class 12 Circuit Networks & Calculus: Kirchhoff Laws, Rate Laws, L\'Hopital',
        slug: 'jee-main-part-test-13-current-electricity-kinetics-limits',
        badgeCode: 'PART TEST',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Hard',
        durationMinutes: 90,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        status: 'Published',
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Focus on potentiometer sensitivity, half-life integrated rate laws, and standard indeterminate limits.'
        ],
        questions: [
            {
                id: 'pt13-p1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Current Electricity & Kirchhoff\'s Laws',
                statement: 'In a Wheatstone bridge network with resistances P = 10 Ω, Q = 20 Ω, R = 15 Ω, the resistance S required in the fourth arm to balance the bridge is:',
                options: [
                    { id: 'A', text: '30 Ω' },
                    { id: 'B', text: '25 Ω' },
                    { id: 'C', text: '7.5 Ω' },
                    { id: 'D', text: '40 Ω' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'P / Q = R / S',
                explanation: 'For bridge balance: P/Q = R/S ⇒ 10/20 = 15/S ⇒ 1/2 = 15/S ⇒ S = 30 Ω.',
                shortcutTrick: 'Q is 2× P, so S must be 2× R = 30 Ω.'
            },
            {
                id: 'pt13-p2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Drift Velocity & Mobility',
                statement: 'When a steady current I flows through a metallic conductor of non-uniform cross-section, the quantity that remains constant throughout the conductor is:',
                options: [
                    { id: 'A', text: 'Electric current only' },
                    { id: 'B', text: 'Current density' },
                    { id: 'C', text: 'Electric field' },
                    { id: 'D', text: 'Drift velocity' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Conservation of charge: dq/dt = I is invariant across cross-sections',
                explanation: 'By conservation of charge in steady state, current I is the same through every cross-section. Current density J = I/A, Electric field E = J/σ, and drift velocity v_d = J/(ne) all vary inversely with cross-sectional area A.',
                shortcutTrick: 'Current I is constant; everything else depends on area A.'
            },
            {
                id: 'pt13-c1',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'Chemical Kinetics & First Order Reactions',
                statement: 'A first-order reaction has a half-life of 20 minutes. The time required for 75% completion of the reaction is:',
                options: [
                    { id: 'A', text: '40 minutes' },
                    { id: 'B', text: '60 minutes' },
                    { id: 'C', text: '30 minutes' },
                    { id: 'D', text: '80 minutes' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 't_75% = 2 × t_1/2',
                explanation: '75% completion leaves 25% (1/4 = (1/2)²) unreacted, which takes exactly 2 half-lives: 2 × 20 = 40 minutes.',
                shortcutTrick: '75% is 2 half-lives: 2 × 20 = 40 min.'
            },
            {
                id: 'pt13-c2',
                questionNumber: 4,
                subject: 'Chemistry',
                chapter: 'Arrhenius Equation & Activation Energy',
                statement: 'If the rate constant of a reaction doubles when temperature increases from 300 K to 310 K, the activation energy E_a is approximately (R = 8.314 J/(mol·K)):',
                options: [
                    { id: 'A', text: '53.6 kJ/mol' },
                    { id: 'B', text: '26.8 kJ/mol' },
                    { id: 'C', text: '107.2 kJ/mol' },
                    { id: 'D', text: '12.4 kJ/mol' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'ln(k₂/k₁) = (E_a / R) [(T₂ - T₁) / (T₁ T₂)]',
                explanation: 'ln(2) = 0.693 = (E_a / 8.314) × [10 / (300 × 310)]. E_a = 0.693 × 8.314 × 93000 / 10 ≈ 53,590 J/mol ≈ 53.6 kJ/mol.',
                shortcutTrick: 'Standard rule of thumb: doubling per 10°C at room temp implies E_a ≈ 53 kJ/mol.'
            },
            {
                id: 'pt13-m1',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Limits & L\'Hopital\'s Rule',
                statement: 'The value of the limit lim_{x → 0} (e^{x²} - cos x) / x² is equal to:',
                options: [
                    { id: 'A', text: '3 / 2' },
                    { id: 'B', text: '1 / 2' },
                    { id: 'C', text: '1' },
                    { id: 'D', text: '2' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Series expansion: e^{x²} = 1 + x² + ..., cos x = 1 - x²/2 + ...',
                explanation: 'e^{x²} - cos x = (1 + x²) - (1 - x²/2) = x² + x²/2 = (3/2) x². Dividing by x² yields 3/2.',
                shortcutTrick: 'DK Sir Maclaurin Inspection: (1 + x² - (1 - x²/2)) / x² = 1 + 1/2 = 3/2 in 3 seconds.'
            },
            {
                id: 'pt13-m2',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Continuity & Differentiability',
                statement: 'If f(x) = |x - 1| + |x - 2|, then the number of points where f(x) is not differentiable is:',
                options: [
                    { id: 'A', text: '2 points (at x = 1 and x = 2)' },
                    { id: 'B', text: '1 point' },
                    { id: 'C', text: '0 points' },
                    { id: 'D', text: 'Infinite points' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Absolute value functions have sharp corners where the interior expression vanishes',
                explanation: 'f(x) has sharp corners at x = 1 and x = 2 where left and right derivatives do not match. Hence f is non-differentiable at exactly 2 points.',
                shortcutTrick: 'Modulus functions have sharp corners at their roots: x = 1 and x = 2.'
            }
        ]
    },
    // ─── 14. PART TEST 14 ───
    {
        id: 'part-test-14',
        title: 'JEE Main Part Test 14: Moving Charges & Magnetism, Surface Chemistry & Differentiation (MOD)',
        subtitle: 'Magnetic Forces, Biot-Savart, Adsorption & Kota Inspection Differentiation',
        slug: 'jee-main-part-test-14-moving-charges-surface-chemistry-mod',
        badgeCode: 'PART TEST',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Medium',
        durationMinutes: 90,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        status: 'Published',
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Focus on helical motion in uniform magnetic fields, Freundlich adsorption isotherm, and logarithmic differentiation.'
        ],
        questions: [
            {
                id: 'pt14-p1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Magnetic Force & Cyclotron Motion',
                statement: 'A proton and an α-particle enter a uniform perpendicular magnetic field with equal kinetic energy. The ratio of their radii of curvature (r_p / r_α) is:',
                options: [
                    { id: 'A', text: '1 : 1' },
                    { id: 'B', text: '1 : 2' },
                    { id: 'C', text: '2 : 1' },
                    { id: 'D', text: '1 : 4' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'r = p / (q B) = √(2 m K) / (q B)',
                explanation: 'r ∝ √m / q. For proton: √1 / 1 = 1. For α-particle: m = 4, q = 2 ⇒ √4 / 2 = 2/2 = 1. Ratio r_p / r_α = 1 : 1.',
                shortcutTrick: 'Ratio is √m / q. √4 / 2 = 1. Equal radii!'
            },
            {
                id: 'pt14-p2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Biot-Savart Law & Circular Coils',
                statement: 'The magnetic field at the center of a circular coil of radius R carrying current I is B. The magnetic field at a point on its axis at distance x = R from center is:',
                options: [
                    { id: 'A', text: 'B / (2√2)' },
                    { id: 'B', text: 'B / 2' },
                    { id: 'C', text: 'B / 4' },
                    { id: 'D', text: 'B / 8' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'B_axis = μ₀ I R² / [2 (R² + x²)^(3/2)]',
                explanation: 'At center (x = 0): B₀ = μ₀ I / (2R). At x = R: B_axis = μ₀ I R² / [2(2R²)^(3/2)] = μ₀ I / [2R · 2√2] = B₀ / (2√2).',
                shortcutTrick: '1 / (1 + (x/R)²)^(3/2) at x = R gives 1 / 2^(3/2) = 1/(2√2).'
            },
            {
                id: 'pt14-c1',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'Surface Chemistry & Adsorption',
                statement: 'In the Freundlich adsorption isotherm x/m = k P^(1/n), the value of 1/n lies between:',
                options: [
                    { id: 'A', text: '0 and 1' },
                    { id: 'B', text: '1 and 2' },
                    { id: 'C', text: '-1 and 0' },
                    { id: 'D', text: '0 and 2' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'At high pressure 1/n = 0 (saturation); at low pressure 1/n = 1',
                explanation: 'The factor 1/n ranges from 0 (adsorption independent of pressure at saturation) to 1 (adsorption directly proportional to pressure at low pressures). Hence 0 ≤ 1/n ≤ 1.',
                shortcutTrick: 'NCERT key fact: 1/n is between 0 and 1 (typical value 0.1 to 0.5).'
            },
            {
                id: 'pt14-c2',
                questionNumber: 4,
                subject: 'Chemistry',
                chapter: 'Colloidal State & Hardy-Schulze Rule',
                statement: 'According to the Hardy-Schulze rule, the most effective coagulating ion for a negatively charged arsenic sulphide (As₂S₃) sol is:',
                options: [
                    { id: 'A', text: 'Al³⁺' },
                    { id: 'B', text: 'Ba²⁺' },
                    { id: 'C', text: 'Na⁺' },
                    { id: 'D', text: 'PO₄³⁻' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Coagulating power increases rapidly with the valency of the active flocculating ion',
                explanation: 'For a negatively charged sol, cations cause coagulation. Greater positive charge gives higher coagulating power: Al³⁺ > Ba²⁺ > Na⁺.',
                shortcutTrick: 'Maximum positive charge (Al³⁺) has highest coagulating power for negative sol.'
            },
            {
                id: 'pt14-m1',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Methods of Differentiation',
                statement: 'If y = x^{x^{x... ∞}}, then x(dy/dx) is equal to:',
                options: [
                    { id: 'A', text: 'y² / (1 - y ln x)' },
                    { id: 'B', text: 'y / (1 - y ln x)' },
                    { id: 'C', text: 'y² / (1 + y ln x)' },
                    { id: 'D', text: 'y² ln x' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'y = x^y ⇒ ln y = y ln x',
                explanation: 'Differentiating ln y = y ln x implicitly: (1/y)(dy/dx) = (dy/dx) ln x + y/x ⇒ (dy/dx)[1/y - ln x] = y/x ⇒ (dy/dx)[(1 - y ln x)/y] = y/x ⇒ x(dy/dx) = y² / (1 - y ln x).',
                shortcutTrick: 'DK Sir Standard Infinite Tower Trick: x(dy/dx) = y² / (1 - y ln x).'
            },
            {
                id: 'pt14-m2',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Parametric Differentiation',
                statement: 'If x = a(θ + sin θ) and y = a(1 - cos θ), then dy/dx at θ = π/2 is:',
                options: [
                    { id: 'A', text: '1' },
                    { id: 'B', text: '0' },
                    { id: 'C', text: '√3' },
                    { id: 'D', text: '-1' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'dy/dx = (dy/dθ) / (dx/dθ) = a sin θ / [a(1 + cos θ)] = tan(θ/2)',
                explanation: 'dy/dx = a sin θ / [a(1 + cos θ)] = 2 sin(θ/2) cos(θ/2) / [2 cos²(θ/2)] = tan(θ/2). At θ = π/2, tan(π/4) = 1.',
                shortcutTrick: 'Cycloid slope formula: dy/dx = tan(θ/2) = tan(45°) = 1.'
            }
        ]
    },
    // ─── 15. PART TEST 15 ───
    {
        id: 'part-test-15',
        title: 'JEE Main Part Test 15: Magnetism and Matter, Coordination Compounds & Application of Derivatives (AOD)',
        subtitle: 'Hysteresis, Crystal Field Theory (CFT), Maxima-Minima & Tangent Normals',
        slug: 'jee-main-part-test-15-magnetism-coordination-aod',
        badgeCode: 'PART TEST',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Hard',
        durationMinutes: 90,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        status: 'Published',
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Focus on magnetic dip angles, crystal field splitting energy (CFSE), and Rolle’s theorem verification.'
        ],
        questions: [
            {
                id: 'pt15-p1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Magnetism & Matter',
                statement: 'At a certain place, the horizontal and vertical components of Earth\'s magnetic field are equal. The angle of dip at that place is:',
                options: [
                    { id: 'A', text: '45°' },
                    { id: 'B', text: '30°' },
                    { id: 'C', text: '60°' },
                    { id: 'D', text: '90°' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'tan δ = B_V / B_H',
                explanation: 'Since B_V = B_H, tan δ = 1 ⇒ dip angle δ = 45°.',
                shortcutTrick: 'Equal components means tan δ = 1 ⇒ 45°.'
            },
            {
                id: 'pt15-p2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Magnetic Susceptibility',
                statement: 'A material having negative magnetic susceptibility (χ < 0) belongs to the category of:',
                options: [
                    { id: 'A', text: 'Diamagnetic materials' },
                    { id: 'B', text: 'Paramagnetic materials' },
                    { id: 'C', text: 'Ferromagnetic materials' },
                    { id: 'D', text: 'Ferrimagnetic materials' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Diamagnetic substances are feebly repelled by magnetic fields: χ < 0 and μ_r < 1',
                explanation: 'Diamagnetic materials acquire feeble magnetization in a direction opposite to the applied magnetic field, giving negative susceptibility.',
                shortcutTrick: 'Negative susceptibility = Diamagnetic exclusively.'
            },
            {
                id: 'pt15-c1',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'Coordination Compounds & CFT',
                statement: 'The spin-only magnetic moment of [Fe(H₂O)₆]²⁺ complex is approximately (Fe = 26):',
                options: [
                    { id: 'A', text: '4.90 BM' },
                    { id: 'B', text: '5.92 BM' },
                    { id: 'C', text: '2.83 BM' },
                    { id: 'D', text: '0.00 BM' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'μ = √(n(n + 2)) BM; Fe²⁺ (3d⁶) with weak field ligand H₂O has 4 unpaired electrons',
                explanation: 'H₂O is a weak field ligand, so no pairing occurs: configuration is t₂g⁴ eg², giving n = 4 unpaired electrons. μ = √(4(4 + 2)) = √24 ≈ 4.90 BM.',
                shortcutTrick: 'n = 4 unpaired electrons ⇒ μ = 4.9 BM.'
            },
            {
                id: 'pt15-c2',
                questionNumber: 4,
                subject: 'Chemistry',
                chapter: 'Isomerism in Coordination Complexes',
                statement: 'The number of geometrical isomers possible for the square planar complex [Pt(NH₃)(Br)(Cl)(py)] is:',
                options: [
                    { id: 'A', text: '3' },
                    { id: 'B', text: '2' },
                    { id: 'C', text: '4' },
                    { id: 'D', text: '1' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Square planar [Mabcd] forms exactly 3 geometrical isomers',
                explanation: 'Fixing one ligand (e.g. NH₃) and placing each of the other three ligands (Br, Cl, py) trans to it gives 3 distinct geometrical isomers.',
                shortcutTrick: 'Mabcd square planar always forms 3 geometrical isomers.'
            },
            {
                id: 'pt15-m1',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Application of Derivatives (Maxima & Minima)',
                statement: 'The minimum value of f(x) = x + 1/x for x > 0 is:',
                options: [
                    { id: 'A', text: '2' },
                    { id: 'B', text: '1' },
                    { id: 'C', text: '0' },
                    { id: 'D', text: '4' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'AM ≥ GM inequality for positive reals: (x + 1/x)/2 ≥ √(x · 1/x) = 1',
                explanation: 'By AM-GM inequality, (x + 1/x)/2 ≥ 1 ⇒ x + 1/x ≥ 2, with equality holding when x = 1.',
                shortcutTrick: 'AM ≥ GM directly yields minimum 2 at x = 1.'
            },
            {
                id: 'pt15-m2',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Tangents & Normals',
                statement: 'The slope of the normal to the curve y = 2x² + 3 sin x at x = 0 is:',
                options: [
                    { id: 'A', text: '-1 / 3' },
                    { id: 'B', text: '3' },
                    { id: 'C', text: '1 / 3' },
                    { id: 'D', text: '-3' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'm_normal = -1 / (dy/dx)',
                explanation: 'dy/dx = 4x + 3 cos x. At x = 0: dy/dx = 0 + 3(1) = 3. Slope of normal = -1 / (dy/dx) = -1/3.',
                shortcutTrick: 'Tangent slope = 3 ⇒ Normal slope = -1/3.'
            }
        ]
    },
    // ─── 16. PART TEST 16 ───
    {
        id: 'part-test-16',
        title: 'JEE Main Part Test 16: Electromagnetic Induction (EMI), p-Block Elements & Indefinite Integration',
        subtitle: 'Faraday Induction, Group 15-18 Trends, Integration Shortcuts',
        slug: 'jee-main-part-test-16-emi-p-block-indefinite-integration',
        badgeCode: 'PART TEST',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Hard',
        durationMinutes: 90,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        status: 'Published',
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Focus on motional EMF, oxoacids of phosphorus/sulfur, and algebraic/trigonometric substitution integration.'
        ],
        questions: [
            {
                id: 'pt16-p1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Electromagnetic Induction',
                statement: 'A conducting rod of length L rotates with constant angular speed ω about one end in a plane perpendicular to a uniform magnetic field B. The induced EMF between its ends is:',
                options: [
                    { id: 'A', text: '1/2 B ω L²' },
                    { id: 'B', text: 'B ω L²' },
                    { id: 'C', text: '2 B ω L²' },
                    { id: 'D', text: '1/4 B ω L²' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'e = ∫ (ω r) B dr = 1/2 B ω L²',
                explanation: 'Each element dr at distance r moves with speed v = ω r. Induced EMF dε = B v dr = B ω r dr. Integrating from 0 to L gives ε = 1/2 B ω L².',
                shortcutTrick: 'Rotational motional EMF is always 1/2 B ω L².'
            },
            {
                id: 'pt16-p2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Self-Inductance & Energy',
                statement: 'When current in a coil changes from 5 A to 2 A in 0.1 s, an average EMF of 30 V is induced in the coil. The self-inductance of the coil is:',
                options: [
                    { id: 'A', text: '1.0 H' },
                    { id: 'B', text: '0.5 H' },
                    { id: 'C', text: '2.0 H' },
                    { id: 'D', text: '1.5 H' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'ε = -L (ΔI / Δt)',
                explanation: '|ε| = L |ΔI / Δt| ⇒ 30 = L × (3 / 0.1) = 30 L ⇒ L = 1.0 H.',
                shortcutTrick: 'ΔI/Δt = 30 A/s. EMF = 30 V ⇒ L = 1 H.'
            },
            {
                id: 'pt16-c1',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'p-Block Elements (Group 15 & 16)',
                statement: 'The basicity of orthophosphoric acid (H₃PO₄) and phosphorous acid (H₃PO₃) are respectively:',
                options: [
                    { id: 'A', text: '3 and 2' },
                    { id: 'B', text: '3 and 3' },
                    { id: 'C', text: '2 and 1' },
                    { id: 'D', text: '3 and 1' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Only ionizable P-OH hydrogens contribute to acid basicity',
                explanation: 'H₃PO₄ has three P-OH bonds (tribasic, basicity = 3). H₃PO₃ has two P-OH bonds and one non-ionizable P-H bond (dibasic, basicity = 2).',
                shortcutTrick: 'Number of P-OH bonds: H₃PO₄ has 3; H₃PO₃ has 2.'
            },
            {
                id: 'pt16-c2',
                questionNumber: 4,
                subject: 'Chemistry',
                chapter: 'Noble Gas Compounds',
                statement: 'The hybridization and structure of XeOF₄ are respectively:',
                options: [
                    { id: 'A', text: 'sp³d², square pyramidal' },
                    { id: 'B', text: 'sp³d, see-saw' },
                    { id: 'C', text: 'sp³d², octahedral' },
                    { id: 'D', text: 'sp³d³, pentagonal bipyramidal' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Steric number = 1 (O) + 4 (F) + 1 (lone pair) = 6 (sp³d²)',
                explanation: 'Xe has 8 valence electrons. 2 form Xe=O, 4 form Xe-F bonds, leaving 1 lone pair. 5 bond pairs + 1 lone pair = steric number 6 (sp³d²), giving Square Pyramidal shape.',
                shortcutTrick: '5 bonds + 1 lone pair = square pyramidal.'
            },
            {
                id: 'pt16-m1',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Indefinite Integration (By Parts)',
                statement: 'The integral ∫ e^x (sin x + cos x) dx is equal to:',
                options: [
                    { id: 'A', text: 'e^x sin x + C' },
                    { id: 'B', text: 'e^x cos x + C' },
                    { id: 'C', text: '-e^x cos x + C' },
                    { id: 'D', text: 'e^x (sin x - cos x) + C' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: '∫ e^x [f(x) + f\'(x)] dx = e^x f(x) + C',
                explanation: 'Let f(x) = sin x. Then f\'(x) = cos x. By the standard theorem ∫ e^x [f(x) + f\'(x)] dx = e^x f(x) + C = e^x sin x + C.',
                shortcutTrick: 'DK Sir Inspection Trick: e^x [f(x) + f\'(x)] = e^x sin x + C directly.'
            },
            {
                id: 'pt16-m2',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Standard Algebraic Substitution',
                statement: 'The integral ∫ dx / (x² + 2x + 2) is equal to:',
                options: [
                    { id: 'A', text: 'tan⁻¹(x + 1) + C' },
                    { id: 'B', text: 'ln(x + 1) + C' },
                    { id: 'C', text: '1/2 tan⁻¹(x + 1) + C' },
                    { id: 'D', text: 'sin⁻¹(x + 1) + C' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Complete the square: x² + 2x + 2 = (x + 1)² + 1²',
                explanation: '∫ dx / ((x + 1)² + 1) = tan⁻¹(x + 1) + C.',
                shortcutTrick: '1 / ((x+1)² + 1) integrates directly to tan⁻¹(x + 1).'
            }
        ]
    },
    // ─── 17. PART TEST 17 ───
    {
        id: 'part-test-17',
        title: 'JEE Main Part Test 17: Alternating Current (AC), d & f-Block Elements & Definite Integration',
        subtitle: 'LCR Resonance, Transition Elements & Lanthanoids, King\'s Property',
        slug: 'jee-main-part-test-17-ac-d-block-definite-integration',
        badgeCode: 'PART TEST',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Hard',
        durationMinutes: 90,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        status: 'Published',
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Focus on resonance Q-factor, lanthanoid contraction consequences, and King\'s property of definite integrals.'
        ],
        questions: [
            {
                id: 'pt17-p1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Alternating Current & Resonance',
                statement: 'In a series LCR circuit with R = 10 Ω, L = 0.1 H, and C = 10 μF, the resonant angular frequency ω₀ is:',
                options: [
                    { id: 'A', text: '1000 rad/s' },
                    { id: 'B', text: '100 rad/s' },
                    { id: 'C', text: '500 rad/s' },
                    { id: 'D', text: '2000 rad/s' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'ω₀ = 1 / √(L C)',
                explanation: 'ω₀ = 1 / √(0.1 × 10 × 10⁻⁶) = 1 / √(10⁻⁶) = 1 / 10⁻³ = 1000 rad/s.',
                shortcutTrick: '1 / √(10⁻⁶) = 1000 rad/s in 3 seconds.'
            },
            {
                id: 'pt17-p2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Power in AC Circuits',
                statement: 'An AC source V = 200 sin(100t) V is connected across an inductor of inductance 0.5 H. The average power consumed over a complete cycle is:',
                options: [
                    { id: 'A', text: '0 W' },
                    { id: 'B', text: '400 W' },
                    { id: 'C', text: '200 W' },
                    { id: 'D', text: '100 W' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'P_avg = V_rms I_rms cos φ; for pure inductor φ = 90° ⇒ cos 90° = 0',
                explanation: 'In a pure inductor, current lags voltage by π/2 (90°). The power factor cos φ = cos(90°) = 0, so average power consumed is 0 W.',
                shortcutTrick: 'Pure inductor consumes ZERO average power.'
            },
            {
                id: 'pt17-c1',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'd and f-Block Elements',
                statement: 'The almost identical atomic and ionic radii of Zr (4d series) and Hf (5d series) is explained by:',
                options: [
                    { id: 'A', text: 'Lanthanoid contraction' },
                    { id: 'B', text: 'Actinoid contraction' },
                    { id: 'C', text: 'Diagonal relationship' },
                    { id: 'D', text: 'Inert pair effect' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Poor shielding of 14 4f electrons causes continuous decrease in atomic radii',
                explanation: 'Filling of the 4f subshell before 5d causes poor shielding of outer electrons from the increasing nuclear charge (Lanthanoid Contraction). As a result, 4d and 5d elements of the same group (e.g. Zr and Hf) have nearly identical atomic radii (~160 pm).',
                shortcutTrick: 'Zr and Hf twin radii = classic Lanthanoid contraction.'
            },
            {
                id: 'pt17-c2',
                questionNumber: 4,
                subject: 'Chemistry',
                chapter: 'Potassium Permanganate Titrations',
                statement: 'In acidic medium, one mole of KMnO₄ oxidizes how many moles of Fe²⁺ to Fe³⁺?',
                options: [
                    { id: 'A', text: '5 moles' },
                    { id: 'B', text: '1 mole' },
                    { id: 'C', text: '3 moles' },
                    { id: 'D', text: '2.5 moles' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'MnO₄⁻ + 8 H⁺ + 5 e⁻ → Mn²⁺ + 4 H₂O (n-factor of KMnO₄ = 5)',
                explanation: 'In acidic medium, Mn changes from +7 to +2 (consumes 5 electrons). Each Fe²⁺ loses 1 electron (Fe²⁺ → Fe³⁺ + e⁻). Hence 1 mole of KMnO₄ oxidizes 5 moles of Fe²⁺.',
                shortcutTrick: 'Equivalents equate: 1 mol × 5 = moles(Fe²⁺) × 1 ⇒ 5 moles.'
            },
            {
                id: 'pt17-m1',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Definite Integrals (King\'s Property)',
                statement: 'The value of the definite integral I = ∫₀^{π/2} (sin³ x) / (sin³ x + cos³ x) dx is:',
                options: [
                    { id: 'A', text: 'π / 4' },
                    { id: 'B', text: 'π / 2' },
                    { id: 'C', text: '1' },
                    { id: 'D', text: 'π / 8' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'King\'s Property: ∫_a^b f(x) dx = ∫_a^b f(a + b - x) dx',
                explanation: 'Applying King\'s property with a + b - x = π/2 - x gives I = ∫₀^{π/2} (cos³ x) / (cos³ x + sin³ x) dx. Adding the two expressions gives 2I = ∫₀^{π/2} 1 dx = π/2 ⇒ I = π / 4.',
                shortcutTrick: 'DK Sir King\'s Rule: Symmetrical integral from 0 to π/2 = (Upper - Lower) / 2 = (π/2 - 0) / 2 = π/4.'
            },
            {
                id: 'pt17-m2',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Leibniz Rule for Differentiation of Integrals',
                statement: 'If F(x) = ∫₀^{x²} √(1 + t³) dt, then F\'(x) is equal to:',
                options: [
                    { id: 'A', text: '2x √(1 + x⁶)' },
                    { id: 'B', text: '√(1 + x⁶)' },
                    { id: 'C', text: '2x √(1 + x³)' },
                    { id: 'D', text: 'x² √(1 + x⁶)' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'd/dx [∫_a^{g(x)} f(t) dt] = f(g(x)) · g\'(x)',
                explanation: 'By Leibniz Rule: F\'(x) = √(1 + (x²)³) · d/dx(x²) = √(1 + x⁶) · 2x = 2x √(1 + x⁶).',
                shortcutTrick: 'Plug upper limit into integrand and multiply by derivative of upper limit: 2x √(1 + x⁶).'
            }
        ]
    },
    // ─── 18. PART TEST 18 ───
    {
        id: 'part-test-18',
        title: 'JEE Main Part Test 18: Electromagnetic Waves, Haloalkanes & Differential Equations',
        subtitle: 'Displacement Current, SN1/SN2 Mechanisms, Linear Differential Equations',
        slug: 'jee-main-part-test-18-em-waves-haloalkanes-differential-eq',
        badgeCode: 'PART TEST',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Medium',
        durationMinutes: 90,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        status: 'Published',
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Focus on Poynting vector energy density, stereochemical inversion in SN2, and integrating factors (IF).'
        ],
        questions: [
            {
                id: 'pt18-p1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Electromagnetic Waves',
                statement: 'In an electromagnetic wave propagating along the +x direction, the electric field vector oscillates along the +y axis. The magnetic field vector B oscillates along:',
                options: [
                    { id: 'A', text: '+z axis' },
                    { id: 'B', text: '-z axis' },
                    { id: 'C', text: '+x axis' },
                    { id: 'D', text: '-y axis' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Wave propagation vector v̂ = Ê × B̂',
                explanation: 'The direction of wave propagation is given by the Poynting vector direction Ŝ = Ê × B̂. Since propagation is in +î and Ê is in +ĵ: î = ĵ × k̂. Hence B must oscillate along +k̂ (+z axis).',
                shortcutTrick: 'Right hand rule: ĵ × k̂ = î.'
            },
            {
                id: 'pt18-p2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Displacement Current',
                statement: 'A parallel plate capacitor is being charged. The displacement current between the plates is equal to:',
                options: [
                    { id: 'A', text: 'Conduction current in the connecting wires' },
                    { id: 'B', text: 'Zero' },
                    { id: 'C', text: 'Half of the conduction current' },
                    { id: 'D', text: 'Double of the conduction current' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Maxwell\'s continuity equation: I_c = I_d = ε₀ (dΦ_E / dt)',
                explanation: 'By Maxwell\'s generalized Ampère-Maxwell law, total current is continuous. In the connecting wires current is conduction (I_c), while between the capacitor plates current is entirely displacement current (I_d = I_c).',
                shortcutTrick: 'Displacement current equals conduction current by charge continuity.'
            },
            {
                id: 'pt18-c1',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'Haloalkanes & Nucleophilic Substitution',
                statement: 'Which of the following alkyl halides reacts fastest by an S_N2 mechanism?',
                options: [
                    { id: 'A', text: 'CH₃-Br' },
                    { id: 'B', text: 'CH₃-CH₂-Br' },
                    { id: 'C', text: '(CH₃)₂CH-Br' },
                    { id: 'D', text: '(CH₃)₃C-Br' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'S_N2 reactivity order: Methyl > 1° > 2° > 3° (least steric hindrance)',
                explanation: 'S_N2 occurs in a single concerted step with backside attack of the nucleophile. Steric hindrance slows down the reaction. Methyl bromide has minimal steric hindrance and reacts fastest.',
                shortcutTrick: 'S_N2 favors unhindered methyl halide.'
            },
            {
                id: 'pt18-c2',
                questionNumber: 4,
                subject: 'Chemistry',
                chapter: 'Optical Inversion & Walden Inversion',
                statement: 'Reaction of optically active 2-bromooctane with hydroxide ion (OH⁻) via S_N2 proceeds with:',
                options: [
                    { id: 'A', text: 'Complete inversion of configuration (Walden inversion)' },
                    { id: 'B', text: 'Complete retention of configuration' },
                    { id: 'C', text: '50% retention and 50% inversion (racemization)' },
                    { id: 'D', text: 'No substitution occurs' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'S_N2 proceeds via backside attack, inverting the stereochemical umbrella',
                explanation: 'S_N2 involves nucleophilic backside attack opposite the leaving group, causing a 100% inversion of stereochemical configuration (Walden Inversion).',
                shortcutTrick: 'S_N2 = Walden Inversion; S_N1 = Racemization.'
            },
            {
                id: 'pt18-m1',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Linear Differential Equations',
                statement: 'The integrating factor (IF) for the linear differential equation dy/dx + (2x / (1 + x²)) y = 1 / (1 + x²)² is:',
                options: [
                    { id: 'A', text: '1 + x²' },
                    { id: 'B', text: 'ln(1 + x²)' },
                    { id: 'C', text: '1 / (1 + x²)' },
                    { id: 'D', text: 'e^{1 + x²}' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'IF = e^{∫ P dx} = e^{∫ (2x / (1 + x²)) dx}',
                explanation: '∫ P dx = ∫ (2x / (1 + x²)) dx = ln(1 + x²). IF = e^{ln(1 + x²)} = 1 + x².',
                shortcutTrick: 'e^{ln(1 + x²)} = 1 + x².'
            },
            {
                id: 'pt18-m2',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Order and Degree of Differential Equations',
                statement: 'The order and degree of the differential equation [1 + (dy/dx)²]^{3/2} = d²y/dx² are respectively:',
                options: [
                    { id: 'A', text: 'Order = 2, Degree = 2' },
                    { id: 'B', text: 'Order = 2, Degree = 3' },
                    { id: 'C', text: 'Order = 1, Degree = 2' },
                    { id: 'D', text: 'Order = 2, Degree = 1' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Squaring eliminates fractional exponent: [1 + (dy/dx)²]³ = (d²y/dx²)²',
                explanation: 'Highest order derivative is d²y/dx² (Order = 2). Squaring both sides to make it polynomial in derivatives yields [1 + (dy/dx)²]³ = (d²y/dx²)². The power of highest derivative is 2, so Degree = 2.',
                shortcutTrick: 'Highest derivative is 2nd derivative. Squaring gives power 2 ⇒ Order 2, Degree 2.'
            }
        ]
    },
    // ─── 19. PART TEST 19 ───
    {
        id: 'part-test-19',
        title: 'JEE Main Part Test 19: Ray & Wave Optics, Carbonyl Compounds & Area Under Curves',
        subtitle: 'Lens Maker Formula, Interference/Diffraction, Aldehydes-Ketones, Quadrature',
        slug: 'jee-main-part-test-19-optics-carbonyl-compounds-area',
        badgeCode: 'PART TEST',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Hard',
        durationMinutes: 90,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        status: 'Scheduled',
        schedule: {
            startWindow: '2026-11-05T09:00:00.000Z',
            endWindow: '2026-11-05T12:00:00.000Z',
            autoSubmit: true,
            computeRank: true
        },
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'SCHEDULED CBT SIMULATION: Opens on 05 Nov 2026 at 09:00 AM IST.',
            'Auto-submits strictly when 90 minutes expire.',
            'Focus on YDSE fringe shift with mica sheet, Cannizzaro/Aldol condensations, and parabolic area quadrature.'
        ],
        questions: [
            {
                id: 'pt19-p1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Ray Optics & Lens Maker Formula',
                statement: 'A convex lens of focal length f in air (refractive index μ_g = 1.5) is immersed in water (μ_w = 4/3). Its new focal length f_w in water is:',
                options: [
                    { id: 'A', text: '4 f' },
                    { id: 'B', text: '2 f' },
                    { id: 'C', text: 'f / 4' },
                    { id: 'D', text: '1.5 f' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: '1/f_air = (1.5 - 1)(1/R₁ - 1/R₂); 1/f_water = [(1.5 / 1.333) - 1](1/R₁ - 1/R₂)',
                explanation: 'In air: 1/f = 0.5 K. In water: 1/f_w = (1.5 / (4/3) - 1) K = (9/8 - 1) K = (1/8) K. Ratio: f_w / f = 0.5 / (1/8) = 4 ⇒ f_w = 4f.',
                shortcutTrick: 'Kota Standard Shortcut: Glass lens in water has focal length 4× its air value.'
            },
            {
                id: 'pt19-p2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Wave Optics & Interference (YDSE)',
                statement: 'In Young\'s double slit experiment, when a thin transparent sheet of mica of thickness t and refractive index μ is placed in front of one slit, the fringe shift Δy is:',
                options: [
                    { id: 'A', text: '(D / d) (μ - 1) t' },
                    { id: 'B', text: '(d / D) (μ - 1) t' },
                    { id: 'C', text: '(D / d) (μ + 1) t' },
                    { id: 'D', text: '(D / d) μ t' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Path difference introduced = (μ - 1)t; Δy = (D / d) Δx',
                explanation: 'Introducing the mica sheet introduces extra optical path (μ - 1)t. The fringe pattern shifts towards the side with the sheet by Δy = (D/d)(μ - 1)t.',
                shortcutTrick: 'Standard formula: Δy = (D/d)(μ - 1)t.'
            },
            {
                id: 'pt19-c1',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'Aldehydes & Ketones (Aldol / Cannizzaro)',
                statement: 'Which of the following aldehydes does NOT undergo aldol condensation due to lack of α-hydrogens, but instead undergoes Cannizzaro reaction?',
                options: [
                    { id: 'A', text: 'Benzaldehyde and Formaldehyde' },
                    { id: 'B', text: 'Acetaldehyde and Benzaldehyde' },
                    { id: 'C', text: 'Propanal and Acetone' },
                    { id: 'D', text: 'Ethanal only' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Cannizzaro requires aldehydes with no α-hydrogen (disproportionation into alcohol and carboxylate salt)',
                explanation: 'Both benzaldehyde (C₆H₅CHO) and formaldehyde (HCHO) lack α-hydrogens. In concentrated alkali, they undergo self-oxidation-reduction (Cannizzaro reaction).',
                shortcutTrick: 'No α-hydrogen = Cannizzaro (HCHO, PhCHO).'
            },
            {
                id: 'pt19-c2',
                questionNumber: 4,
                subject: 'Chemistry',
                chapter: 'Haloform Reaction',
                statement: 'Which of the following compounds gives a yellow precipitate of iodoform (CHI₃) when warmed with I₂ and aqueous NaOH?',
                options: [
                    { id: 'A', text: 'Ethanol and Acetone' },
                    { id: 'B', text: 'Methanol and Benzaldehyde' },
                    { id: 'C', text: 'Formaldehyde and Pentan-3-one' },
                    { id: 'D', text: 'Acetic acid' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Requires CH₃-C=O or CH₃-CH(OH)- group',
                explanation: 'The haloform test is positive for compounds containing a methyl ketone (CH₃-CO-) group or methyl carbinol (CH₃-CH(OH)-) group. Acetone has CH₃-CO- and ethanol oxidizes to CH₃-CHO, both giving iodoform.',
                shortcutTrick: 'Ethanol is the only 1° alcohol giving positive iodoform test.'
            },
            {
                id: 'pt19-m1',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Area Under Curves (Quadrature)',
                statement: 'The area of the region bounded by the parabolas y² = 4x and x² = 4y is:',
                options: [
                    { id: 'A', text: '16 / 3 sq units' },
                    { id: 'B', text: '8 / 3 sq units' },
                    { id: 'C', text: '32 / 3 sq units' },
                    { id: 'D', text: '4 / 3 sq units' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Area between y² = 4ax and x² = 4by is (16/3) ab',
                explanation: 'Here 4a = 4 ⇒ a = 1, and 4b = 4 ⇒ b = 1. Area = (16/3) ab = (16/3)(1)(1) = 16/3 sq units.',
                shortcutTrick: 'Archimedes Theorem for intersecting parabolas: Area = 16ab / 3 = 16(1)(1)/3 = 16/3.'
            },
            {
                id: 'pt19-m2',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Area Bounded by Line and Curve',
                statement: 'The area enclosed between the curve y = x² and the line y = 4 is:',
                options: [
                    { id: 'A', text: '32 / 3 sq units' },
                    { id: 'B', text: '16 / 3 sq units' },
                    { id: 'C', text: '8 / 3 sq units' },
                    { id: 'D', text: '64 / 3 sq units' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Area = 2 ∫₀² (4 - x²) dx',
                explanation: 'Intersection points are x = ±2. By symmetry: Area = 2 [4x - x³/3]₀² = 2 [8 - 8/3] = 2 [16/3] = 32/3 sq units.',
                shortcutTrick: 'Standard parabola-line cap: (2/3) × base × height = (2/3) × 4 × 4 = 32/3 sq units.'
            }
        ]
    },
    // ─── 20. PART TEST 20 ───
    {
        id: 'part-test-20',
        title: 'JEE Main Part Test 20: Modern Physics & Semiconductors, Amines & 3D Vector Geometry',
        subtitle: 'Photoelectric Effect, Logic Gates & Diodes, Diazonium Salts, 3D Geometry',
        slug: 'jee-main-part-test-20-modern-physics-semiconductors-amines-3d',
        badgeCode: 'PART TEST',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Hard',
        durationMinutes: 90,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        status: 'Scheduled',
        schedule: {
            startWindow: '2026-11-08T09:00:00.000Z',
            endWindow: '2026-11-08T12:00:00.000Z',
            autoSubmit: true,
            computeRank: true
        },
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'SCHEDULED CBT SIMULATION: Opens on 08 Nov 2026 at 09:00 AM IST.',
            'Auto-submits strictly when 90 minutes expire.',
            'Capstone Part Test covering high-tempo modern physics, diazonium coupling, and shortest distance between skew lines.'
        ],
        questions: [
            {
                id: 'pt20-p1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Photoelectric Effect',
                statement: 'When light of frequency 2ν₀ (where ν₀ is threshold frequency) is incident on a metal plate, the maximum velocity of emitted electrons is v₁. When frequency is increased to 5ν₀, the maximum velocity becomes v₂. The ratio v₁ / v₂ is:',
                options: [
                    { id: 'A', text: '1 : 2' },
                    { id: 'B', text: '1 : 4' },
                    { id: 'C', text: '2 : 5' },
                    { id: 'D', text: '1 : √2' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: '1/2 m v² = hν - hν₀',
                explanation: '1/2 m v₁² = h(2ν₀) - hν₀ = hν₀. 1/2 m v₂² = h(5ν₀) - hν₀ = 4 hν₀. Dividing yields (v₁ / v₂)² = 1 / 4 ⇒ v₁ / v₂ = 1 / 2.',
                shortcutTrick: 'Energy ratio = 1 : 4 ⇒ Velocity ratio = √1 : √4 = 1 : 2.'
            },
            {
                id: 'pt20-p2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Semiconductors & Logic Gates',
                statement: 'In the circuit below, the two inputs A and B are connected to a NOR gate followed by a NOT gate. The combination functions as:',
                options: [
                    { id: 'A', text: 'OR gate' },
                    { id: 'B', text: 'AND gate' },
                    { id: 'C', text: 'NAND gate' },
                    { id: 'D', text: 'XOR gate' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'NOT(NOR(A, B)) = NOT(NOT(A + B)) = A + B',
                explanation: 'A NOR gate performs NOT(A + B). Passing through a subsequent NOT gate cancels the inversion: NOT(NOT(A + B)) = A + B (OR gate).',
                shortcutTrick: 'Double negation cancels out: NOT(NOR) = OR.'
            },
            {
                id: 'pt20-c1',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'Amines & Diazonium Salts',
                statement: 'Aniline reacts with NaNO₂ and dilute HCl at 0-5°C to form benzene diazonium chloride. When this solution is treated with β-naphthol in alkaline medium, it produces a brilliant:',
                options: [
                    { id: 'A', text: 'Orange-red azo dye' },
                    { id: 'B', text: 'Deep blue precipitate' },
                    { id: 'C', text: 'Yellow oil' },
                    { id: 'D', text: 'Colorless solution' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Azo coupling reaction: C₆H₅-N₂⁺ Cl⁻ + C₁₀H₇OH → C₆H₅-N=N-C₁₀H₆OH',
                explanation: 'Benzene diazonium chloride couples with β-naphthol (2-naphthol) in alkaline medium at the 1-position to yield 1-(phenyldiazenyl)naphthalen-2-ol, an intense orange-red azo dye.',
                shortcutTrick: 'β-naphthol test with diazonium salt produces orange azo dye.'
            },
            {
                id: 'pt20-c2',
                questionNumber: 4,
                subject: 'Chemistry',
                chapter: 'Basicity of Amines',
                statement: 'The correct order of basic strength of aliphatic methyl amines in aqueous solution is:',
                options: [
                    { id: 'A', text: '(CH₃)₂NH > CH₃NH₂ > (CH₃)₃N > NH₃ (2° > 1° > 3° > NH₃)' },
                    { id: 'B', text: '(CH₃)₃N > (CH₃)₂NH > CH₃NH₂ > NH₃' },
                    { id: 'C', text: 'CH₃NH₂ > (CH₃)₂NH > (CH₃)₃N > NH₃' },
                    { id: 'D', text: '(CH₃)₂NH > (CH₃)₃N > CH₃NH₂ > NH₃' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Aqueous basicity balances inductive (+I), solvation, and steric hindrance',
                explanation: 'For methyl-substituted amines in aqueous medium, the combined balance of inductive effect, hydration enthalpy of conjugate cations, and steric factors yields the order: 2° (213) > 1° > 3° > NH₃.',
                shortcutTrick: 'Kota Rule: Methyl series code is "213" (2° > 1° > 3° > NH₃).'
            },
            {
                id: 'pt20-m1',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: '3D Geometry (Shortest Distance)',
                statement: 'The shortest distance between the skew lines (x - 1)/2 = (y - 2)/3 = (z - 3)/4 and (x - 2)/3 = (y - 4)/4 = (z - 5)/5 is:',
                options: [
                    { id: 'A', text: '1 / √6' },
                    { id: 'B', text: '1 / 6' },
                    { id: 'C', text: '2 / √6' },
                    { id: 'D', text: '0 (intersecting)' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'd = |(a₂ - a₁) · (b₁ × b₂)| / |b₁ × b₂|',
                explanation: 'a₂ - a₁ = (1, 2, 2). b₁ = (2, 3, 4), b₂ = (3, 4, 5). b₁ × b₂ = î(15 - 16) - ĵ(10 - 12) + k̂(8 - 9) = (-1, 2, -1). |b₁ × b₂| = √(1 + 4 + 1) = √6. Dot product: 1(-1) + 2(2) + 2(-1) = -1 + 4 - 2 = 1. Shortest distance = |1| / √6 = 1/√6.',
                shortcutTrick: 'Numerator = det |1 2 2 / 2 3 4 / 3 4 5| = 1. Denom = |(-1, 2, -1)| = √6. Distance = 1/√6.'
            },
            {
                id: 'pt20-m2',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Vector Algebra (Scalar Triple Product)',
                statement: 'If a⃗ = î + ĵ + k̂, b⃗ = î - ĵ + k̂, and c⃗ = î + 2ĵ - k̂, then the volume of the parallelopiped with coterminous edges a⃗, b⃗, c⃗ is:',
                options: [
                    { id: 'A', text: '4 cu units' },
                    { id: 'B', text: '2 cu units' },
                    { id: 'C', text: '6 cu units' },
                    { id: 'D', text: '8 cu units' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'V = |[a⃗ b⃗ c⃗]| = |det(components)|',
                explanation: 'det = 1(1 - 2) - 1(-1 - 1) + 1(2 - (-1)) = 1(-1) - 1(-2) + 1(3) = -1 + 2 + 3 = 4 cu units.',
                shortcutTrick: 'Standard 3x3 determinant = -1 + 2 + 3 = 4 cu units.'
            }
        ]
    }
];
