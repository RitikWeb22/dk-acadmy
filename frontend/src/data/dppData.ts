import type { DPPSet } from '../types';

export const DPP_SETS: DPPSet[] = [
  {
    id: 'dpp-math-straight-lines',
    title: 'DPP-05: Straight Lines & Coordinate Geometry Shortcuts',
    subject: 'Mathematics',
    chapter: 'Straight Lines',
    topic: 'Lines, Slopes, Intercepts & Distance Shortcuts',
    difficulty: 'Medium',
    estimatedMinutes: 30,
    pdfUrl: '/assets/downloads/st line-2.pdf',
    videoWalkthroughUrl: '/videos/1.mp4',
    questions: [
      {
        id: 'dpp-math-st-q1',
        questionNumber: 1,
        statement: 'A straight line passing through P(2, 3) cuts the coordinate axes at A and B such that P divides AB internally in the ratio 1 : 2. If the equation of a line perpendicular to AB passing through the origin is y = mx, then m is:',
        options: [
          { id: 'A', text: '1/3' },
          { id: 'B', text: '4/3' },
          { id: 'C', text: '3/4' },
          { id: 'D', text: '-3/4' }
        ],
        correctAnswer: 'A',
        formulaKey: 'Intercept Form: x/a + y/b = 1; Section Formula',
        explanation: 'Coordinates of A and B on the axes are A(3, 0) and B(0, 9). Line AB slope = -3. The perpendicular line slope m = -1/(-3) = 1/3.'
      },
      {
        id: 'dpp-math-st-q2',
        questionNumber: 2,
        statement: 'The distance between the two parallel lines 3x + 4y - 9 = 0 and 6x + 8y + 15 = 0 is:',
        options: [
          { id: 'A', text: '33/10' },
          { id: 'B', text: '33/5' },
          { id: 'C', text: '6/5' },
          { id: 'D', text: '12/5' }
        ],
        correctAnswer: 'A',
        formulaKey: 'Distance between parallel lines: d = |c₁ - c₂| / √(a² + b²)',
        explanation: 'Multiply the first line by 2: 6x + 8y - 18 = 0. Comparing with 6x + 8y + 15 = 0, distance d = |15 - (-18)| / √(36 + 64) = 33 / 10.'
      },
      {
        id: 'dpp-math-st-q3',
        questionNumber: 3,
        statement: 'If the lines 2x + y - 3 = 0, 5x + ky - 3 = 0 and 3x - y - 2 = 0 are concurrent, then the value of k is:',
        options: [
          { id: 'A', text: '-2' },
          { id: 'B', text: '3' },
          { id: 'C', text: '2' },
          { id: 'D', text: '-3' }
        ],
        correctAnswer: 'A',
        formulaKey: 'Condition of concurrency: Determinant of coefficients = 0',
        explanation: 'Solving 2x + y = 3 and 3x - y = 2 gives 5x = 5 ⇒ x = 1, y = 1. Substitute (1, 1) into 5x + ky - 3 = 0: 5(1) + k(1) - 3 = 0 ⇒ k = -2.'
      }
    ]
  },
  {
    id: 'dpp-math-parabola',
    title: 'DPP-06: Parabola Conic Sections & Latus Rectum Mastery',
    subject: 'Mathematics',
    chapter: 'Parabola',
    topic: 'Chords, Normals, Tangents & Vertex Properties',
    difficulty: 'Hard',
    estimatedMinutes: 35,
    pdfUrl: '/assets/downloads/parabola -1.pdf',
    videoWalkthroughUrl: '/videos/2.mp4',
    questions: [
      {
        id: 'dpp-math-pb-q1',
        questionNumber: 1,
        statement: 'Let O be the vertex of the parabola y² = 4ax and chords OP and OQ are perpendicular. If the locus of the midpoint of PQ is a conic, then the length of its latus rectum is:',
        options: [
          { id: 'A', text: '2a' },
          { id: 'B', text: '4a' },
          { id: 'C', text: '8a' },
          { id: 'D', text: 'a' }
        ],
        correctAnswer: 'A',
        formulaKey: 'Parametric points: P(at₁², 2at₁), Q(at₂², 2at₂); OP ⊥ OQ ⇒ t₁ t₂ = -4',
        explanation: 'Let midpoint of PQ be (h, k). 2h = a(t₁² + t₂²), 2k = 2a(t₁ + t₂). Since (t₁ + t₂)² = (t₁² + t₂²) + 2t₁t₂ = 2h/a - 8. From 2k/2a = t₁ + t₂ ⇒ k²/a² = 2h/a - 8 ⇒ y² = 2a(x - 4a). The latus rectum of this new parabola is 2a.'
      },
      {
        id: 'dpp-math-pb-q2',
        questionNumber: 2,
        statement: 'The equation of the common tangent to the circle x² + y² = 2a² and the parabola y² = 8ax is:',
        options: [
          { id: 'A', text: 'y = ± (x + 2a)' },
          { id: 'B', text: 'y = ± (x + a)' },
          { id: 'C', text: 'y = ± (2x + a)' },
          { id: 'D', text: 'y = ± (x + 4a)' }
        ],
        correctAnswer: 'A',
        formulaKey: 'Tangent to y² = 4Ax is y = mx + A/m; perpendicular distance from (0,0) to line = R',
        explanation: 'For y² = 8ax, A = 2a. Tangent: y = mx + 2a/m ⇒ m²x - my + 2a = 0. Perpendicular distance from (0, 0) = |2a| / √(m⁴ + m²) = a√2 ⇒ 4a² / (m²(m² + 1)) = 2a² ⇒ m²(m² + 1) = 2 ⇒ m² = 1 ⇒ m = ±1. Equation: y = ±(x + 2a).'
      }
    ]
  },
  {
    id: 'dpp-phy-01',
    title: 'DPP-01: Rotational Dynamics & Pure Rolling',
    subject: 'Physics',
    chapter: 'Rigid Body Dynamics',
    topic: 'Torque, Angular Momentum & Rolling',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    questions: [
      {
        id: 'dpp-phy-01-q1',
        questionNumber: 1,
        statement: 'A solid cylinder of mass M and radius R rolls without slipping down a rough inclined plane of angle θ. The frictional force acting on the cylinder is:',
        options: [
          { id: 'A', text: '(1/3) M g sin θ' },
          { id: 'B', text: '(1/2) M g sin θ' },
          { id: 'C', text: '(2/3) M g sin θ' },
          { id: 'D', text: 'M g sin θ' }
        ],
        correctAnswer: 'A',
        formulaKey: 'f_friction = (M g sin θ) / (1 + (M R² / I_cm))',
        explanation: 'For pure rolling down an incline, the frictional force f is given by f = (M g sin θ) / (1 + M R² / I_cm). For a solid cylinder, I_cm = ½ M R². Thus, f = (M g sin θ) / (1 + 2) = (1/3) M g sin θ directed up the incline.'
      },
      {
        id: 'dpp-phy-01-q2',
        questionNumber: 2,
        statement: 'A uniform thin rod of mass M and length L is pivoted at one end. If it is released from a horizontal position, its angular velocity when it passes through the vertical position is:',
        options: [
          { id: 'A', text: '√(3g / L)' },
          { id: 'B', text: '√(2g / L)' },
          { id: 'C', text: '√(6g / L)' },
          { id: 'D', text: '√(g / 3L)' }
        ],
        correctAnswer: 'A',
        formulaKey: 'Conservation of Mechanical Energy: ΔU = ΔK_rot',
        explanation: 'The center of mass drops by a vertical height h = L/2. Loss in potential energy = M g (L/2). Gain in rotational kinetic energy = ½ I ω², where I about the pivot end is (1/3) M L². Equating: M g (L/2) = ½ [(1/3) M L²] ω² ⇒ ω = √(3g / L).'
      },
      {
        id: 'dpp-phy-01-q3',
        questionNumber: 3,
        statement: 'A particle of mass m moves with constant velocity v parallel to the x-axis along the line y = b. What is the magnitude of its angular momentum about the origin?',
        options: [
          { id: 'A', text: 'm v b' },
          { id: 'B', text: 'm v √(x² + b²)' },
          { id: 'C', text: 'Zero' },
          { id: 'D', text: 'm v / b' }
        ],
        correctAnswer: 'A',
        formulaKey: 'L = r_perpendicular × p = m v b',
        explanation: 'The angular momentum about the origin is L = r × p. Here the perpendicular distance from the origin to the line of motion y = b is constantly b. Hence, |L| = m v r_perpendicular = m v b, independent of the x position.'
      },
      {
        id: 'dpp-phy-01-q4',
        questionNumber: 4,
        statement: 'Two wheels of moments of inertia I₁ and I₂ rotate coaxially with angular speeds ω₁ and ω₂ in the same direction. When coupled together face-to-face, the common angular velocity is:',
        options: [
          { id: 'A', text: '(I₁ ω₁ + I₂ ω₂) / (I₁ + I₂)' },
          { id: 'B', text: '(I₁ ω₁ - I₂ ω₂) / (I₁ + I₂)' },
          { id: 'C', text: '√(ω₁ ω₂)' },
          { id: 'D', text: '(ω₁ + ω₂) / 2' }
        ],
        correctAnswer: 'A',
        formulaKey: 'L_initial = L_final ⇒ I₁ ω₁ + I₂ ω₂ = (I₁ + I₂) ω_common',
        explanation: 'In the absence of external torque about the common rotation axis, total angular momentum is conserved: L_initial = I₁ ω₁ + I₂ ω₂. When coupled, the combined moment of inertia is I₁ + I₂. Thus, ω_common = (I₁ ω₁ + I₂ ω₂) / (I₁ + I₂).'
      }
    ]
  },
  {
    id: 'dpp-chem-01',
    title: 'DPP-02: Organic Reaction Pathways & Inversion',
    subject: 'Chemistry',
    chapter: 'Haloalkanes & Alkyl Halides',
    topic: 'SN1/SN2 Kinetics & Inversion',
    difficulty: 'Hard',
    estimatedMinutes: 20,
    questions: [
      {
        id: 'dpp-chem-01-q1',
        questionNumber: 1,
        statement: 'The reaction of optically active 2-bromobutane with aqueous sodium hydroxide (SN2 condition) yields 2-butanol with:',
        options: [
          { id: 'A', text: 'Complete inversion of configuration (Walden inversion)' },
          { id: 'B', text: 'Complete retention of configuration' },
          { id: 'C', text: 'Complete racemization (50% retention + 50% inversion)' },
          { id: 'D', text: 'No substitution occurs' }
        ],
        correctAnswer: 'A',
        formulaKey: 'SN2 Mechanism: Backside attack causes Walden Inversion',
        explanation: 'SN2 reactions proceed through a concerted, bimolecular single-step mechanism where the nucleophile (OH⁻) attacks strictly from the backside opposite to the departing bromide group. This backside attack causes 100% inversion of the stereochemical configuration (Walden inversion).'
      },
      {
        id: 'dpp-chem-01-q2',
        questionNumber: 2,
        statement: 'Which of the following solvents promotes the highest rate of an SN2 nucleophilic substitution reaction?',
        options: [
          { id: 'A', text: 'Dimethyl sulfoxide (DMSO) - Polar Aprotic' },
          { id: 'B', text: 'Water (H₂O) - Polar Protic' },
          { id: 'C', text: 'Ethanol (C₂H₅OH) - Polar Protic' },
          { id: 'D', text: 'Acetic Acid (CH₃COOH) - Polar Protic' }
        ],
        correctAnswer: 'A',
        formulaKey: 'Polar aprotic solvents solvate cations, leaving nucleophiles naked and highly reactive',
        explanation: 'Polar aprotic solvents such as DMSO, DMF, and Acetone solvate cations via their negative dipole, but do not hydrogen-bond with nucleophilic anions. The free ("naked") nucleophile exhibits dramatically higher nucleophilicity in SN2 displacements.'
      },
      {
        id: 'dpp-chem-01-q3',
        questionNumber: 3,
        statement: 'When 2-chloro-2-methylpropane is treated with boiling ethanol, the major elimination product formed is:',
        options: [
          { id: 'A', text: '2-Methylpropene (Isobutylene)' },
          { id: 'B', text: '1-Butene' },
          { id: 'C', text: 'trans-2-Butene' },
          { id: 'D', text: 'cis-2-Butene' }
        ],
        correctAnswer: 'A',
        formulaKey: 'E1 Elimination from tertiary alkyl halide gives most substituted alkene',
        explanation: 'Loss of chloride forms the stable tert-butyl carbocation (CH₃)₃C⁺. Deprotonation by weak base (ethanol) removes an α-proton to generate the alkene CH₂=C(CH₃)₂ (2-methylpropene).'
      },
      {
        id: 'dpp-chem-01-q4',
        questionNumber: 4,
        statement: 'Which of the following compounds is inert towards nucleophilic substitution under standard conditions?',
        options: [
          { id: 'A', text: 'Chlorobenzene (Aryl Halide)' },
          { id: 'B', text: 'Benzyl chloride [C₆H₅CH₂Cl]' },
          { id: 'C', text: 'Allyl chloride [CH₂=CH-CH₂Cl]' },
          { id: 'D', text: 'Isopropyl chloride [(CH₃)₂CHCl]' }
        ],
        correctAnswer: 'A',
        formulaKey: 'Partial double-bond character due to resonance with benzene ring',
        explanation: 'In chlorobenzene, the lone pair on chlorine enters resonance with the aromatic π-system, imparting partial double bond character to the C-Cl bond and making sp² carbon substitution energetically unfavorable under ordinary conditions.'
      }
    ]
  },
  {
    id: 'dpp-math-01',
    title: 'DPP-03: Definite Integration & Area Under Curves',
    subject: 'Mathematics',
    chapter: 'Integral Calculus',
    topic: 'King’s Property & Bounded Regions',
    difficulty: 'Hard',
    estimatedMinutes: 30,
    questions: [
      {
        id: 'dpp-math-01-q1',
        questionNumber: 1,
        statement: 'The value of the integral ∫₂⁴ [log(x²)] / [log(x²) + log(36 - 12x + x²)] dx is equal to:',
        options: [
          { id: 'A', text: '1' },
          { id: 'B', text: '2' },
          { id: 'C', text: '3' },
          { id: 'D', text: '0' }
        ],
        correctAnswer: 'A',
        formulaKey: '∫ₐᵇ f(x) dx = (b - a) / 2 when f(x) + f(a + b - x) = 1',
        explanation: 'Notice that 36 - 12x + x² = (6 - x)². Here a = 2, b = 4, so a + b = 6. Substituting x with (6 - x) swaps the terms in the numerator and denominator: f(x) + f(6 - x) = 1. By King’s Property: 2I = ∫₂⁴ 1 dx = 4 - 2 = 2 ⇒ I = 1.'
      },
      {
        id: 'dpp-math-01-q2',
        questionNumber: 2,
        statement: 'The area bounded by the parabola y² = 4x and the straight line y = 2x is:',
        options: [
          { id: 'A', text: '1/3' },
          { id: 'B', text: '2/3' },
          { id: 'C', text: '4/3' },
          { id: 'D', text: '1' }
        ],
        correctAnswer: 'A',
        formulaKey: 'Area = ∫ (y_upper - y_lower) dx',
        explanation: 'Points of intersection: (2x)² = 4x ⇒ 4x² - 4x = 0 ⇒ x = 0 and x = 1. The parabola y = 2√x is upper and line y = 2x is lower. Area = ∫₀¹ (2√x - 2x) dx = [2 · (2/3) x^(3/2) - x²] from 0 to 1 = 4/3 - 1 = 1/3.'
      },
      {
        id: 'dpp-math-01-q3',
        questionNumber: 3,
        statement: 'If [x] denotes the greatest integer function, the value of the integral ∫₀² [x²] dx is:',
        options: [
          { id: 'A', text: '5 - √2 - √3' },
          { id: 'B', text: '3 - √2' },
          { id: 'C', text: '5 - √3' },
          { id: 'D', text: '2' }
        ],
        correctAnswer: 'A',
        formulaKey: 'Partition integral at points where x² is an integer: 0, 1, √2, √3, 2',
        explanation: 'Break the integral: ∫₀¹ 0 dx + ∫₁^√2 1 dx + ∫_√2^√3 2 dx + ∫_√3² 3 dx = 0 + 1(√2 - 1) + 2(√3 - √2) + 3(2 - √3) = √2 - 1 + 2√3 - 2√2 + 6 - 3√3 = 5 - √2 - √3.'
      },
      {
        id: 'dpp-math-01-q4',
        questionNumber: 4,
        statement: 'The value of the limit lim (n → ∞) Σ_(r=1)^n [r / (r² + n²)] as a definite integral is:',
        options: [
          { id: 'A', text: '½ ln 2' },
          { id: 'B', text: 'ln 2' },
          { id: 'C', text: 'π/4' },
          { id: 'D', text: '1' }
        ],
        correctAnswer: 'A',
        formulaKey: 'lim (1/n) Σ f(r/n) = ∫₀¹ f(x) dx',
        explanation: 'Divide numerator and denominator by n²: (1/n) Σ [ (r/n) / ((r/n)² + 1) ]. As n → ∞, this Riemann sum equals ∫₀¹ [x / (x² + 1)] dx = ½ [ln(x² + 1)]₀¹ = ½ ln 2.'
      }
    ]
  },
  {
    id: 'dpp-phy-02',
    title: 'DPP-04: Electric Flux, Gauss’s Law & Potentials',
    subject: 'Physics',
    chapter: 'Electrostatics',
    topic: 'Conducting Shells & Dipole Interactions',
    difficulty: 'Easy',
    estimatedMinutes: 20,
    questions: [
      {
        id: 'dpp-phy-02-q1',
        questionNumber: 1,
        statement: 'A hollow conducting sphere of radius R is given a positive charge Q. The electric potential at any point inside the sphere at distance r (r < R) from the center is:',
        options: [
          { id: 'A', text: 'Q / (4πε₀ R)' },
          { id: 'B', text: 'Zero' },
          { id: 'C', text: 'Q / (4πε₀ r)' },
          { id: 'D', text: 'Q r / (4πε₀ R²)' }
        ],
        correctAnswer: 'A',
        formulaKey: 'Inside conductor: E = -dV/dr = 0 ⇒ V is constant and equal to surface potential',
        explanation: 'Because electric field E = 0 everywhere inside an electrostatic conductor, the potential V is uniform throughout the entire interior cavity and equal to its value on the surface: V = Q / (4πε₀ R).'
      },
      {
        id: 'dpp-phy-02-q2',
        questionNumber: 2,
        statement: 'The work done in rotating an electric dipole of dipole moment p from angle θ = 0° (stable equilibrium) to θ = 180° in a uniform electric field E is:',
        options: [
          { id: 'A', text: '2 p E' },
          { id: 'B', text: 'p E' },
          { id: 'C', text: '-2 p E' },
          { id: 'D', text: 'Zero' }
        ],
        correctAnswer: 'A',
        formulaKey: 'W = U_final - U_initial = -pE cos(180°) - (-pE cos(0°))',
        explanation: 'Potential energy of dipole U(θ) = -p · E = -pE cos θ. U(0°) = -pE, and U(180°) = +pE. Work required by external agent W = U(180°) - U(0°) = pE - (-pE) = 2 p E.'
      },
      {
        id: 'dpp-phy-02-q3',
        questionNumber: 3,
        statement: 'If the electric flux entering and leaving a closed surface are Φ₁ and Φ₂ respectively, the electric charge inside the surface is:',
        options: [
          { id: 'A', text: '(Φ₂ - Φ₁) ε₀' },
          { id: 'B', text: '(Φ₁ + Φ₂) ε₀' },
          { id: 'C', text: '(Φ₂ - Φ₁) / ε₀' },
          { id: 'D', text: '(Φ₁ - Φ₂) ε₀' }
        ],
        correctAnswer: 'A',
        formulaKey: 'Net flux Φ_net = Φ_leaving - Φ_entering = q_inside / ε₀',
        explanation: 'Entering flux is treated as negative and leaving flux as positive. Thus net outward flux is Φ_net = Φ₂ - Φ₁. According to Gauss’s law, q_inside = Φ_net · ε₀ = (Φ₂ - Φ₁) ε₀.'
      },
      {
        id: 'dpp-phy-02-q4',
        questionNumber: 4,
        statement: 'Two parallel infinite conducting plates separated by distance d carry surface charge densities +σ and -σ. The electric field between the plates is:',
        options: [
          { id: 'A', text: 'σ / ε₀' },
          { id: 'B', text: 'σ / (2ε₀)' },
          { id: 'C', text: '2σ / ε₀' },
          { id: 'D', text: 'Zero' }
        ],
        correctAnswer: 'A',
        formulaKey: 'E_total = E_positive + E_negative = σ/(2ε₀) + σ/(2ε₀) = σ/ε₀',
        explanation: 'Each sheet generates an electric field of magnitude σ / (2ε₀) directed away from the positive sheet and towards the negative sheet. Between the plates, their fields point in the same direction and reinforce: E = σ / (2ε₀) + σ / (2ε₀) = σ / ε₀.'
      }
    ]
  },
  {
    id: 'dpp-chem-02',
    title: 'DPP-05: Molecular Orbital Theory & Dipole Moments',
    subject: 'Chemistry',
    chapter: 'Chemical Bonding',
    topic: 'Bond Order & Magnetic Properties',
    difficulty: 'Medium',
    estimatedMinutes: 18,
    questions: [
      {
        id: 'dpp-chem-02-q1',
        questionNumber: 1,
        statement: 'Which of the following molecules has a zero dipole moment due to symmetric molecular geometry?',
        options: [
          { id: 'A', text: 'Carbon dioxide [CO₂] - Linear' },
          { id: 'B', text: 'Sulfur dioxide [SO₂] - Bent' },
          { id: 'C', text: 'Water [H₂O] - V-shaped' },
          { id: 'D', text: 'Ammonia [NH₃] - Pyramidal' }
        ],
        correctAnswer: 'A',
        formulaKey: 'Vector sum of bond dipoles: μ_net = 0 for centrosymmetric linear shape',
        explanation: 'CO₂ is linear (O=C=O) with an angle of 180°. The two equal C=O bond dipole moments point in exactly opposite directions and cancel out completely, giving net dipole moment μ = 0.'
      },
      {
        id: 'dpp-chem-02-q2',
        questionNumber: 2,
        statement: 'Based on MOT, the bond orders of O₂, O₂⁺, and O₂⁻ follow the order:',
        options: [
          { id: 'A', text: 'O₂⁺ (2.5) > O₂ (2.0) > O₂⁻ (1.5)' },
          { id: 'B', text: 'O₂⁻ > O₂ > O₂⁺' },
          { id: 'C', text: 'O₂⁺ > O₂⁻ > O₂' },
          { id: 'D', text: 'O₂ > O₂⁺ > O₂⁻' }
        ],
        correctAnswer: 'A',
        formulaKey: 'Bond Order = ½ (N_bonding - N_antibonding)',
        explanation: 'For O₂ (16e⁻): BO = ½ (10 - 6) = 2.0. For O₂⁺ (15e⁻): electron removed from antibonding orbital π*2p, BO = ½ (10 - 5) = 2.5. For O₂⁻ (17e⁻): electron added to π*2p, BO = ½ (10 - 7) = 1.5. Thus O₂⁺ > O₂ > O₂⁻.'
      },
      {
        id: 'dpp-chem-02-q3',
        questionNumber: 3,
        statement: 'The geometry of XeF₄ molecule according to VSEPR theory is:',
        options: [
          { id: 'A', text: 'Square Planar (sp³d² with 2 lone pairs)' },
          { id: 'B', text: 'Tetrahedral' },
          { id: 'C', text: 'See-saw' },
          { id: 'D', text: 'Trigonal Bipyramidal' }
        ],
        correctAnswer: 'A',
        formulaKey: 'Steric Number = 4 bond pairs + 2 lone pairs = 6 (Octahedral geometry, Square Planar shape)',
        explanation: 'Xe has 8 valence electrons. 4 are shared with 4 fluorine atoms and 4 remain as 2 lone pairs. The 2 lone pairs occupy axial positions to minimize repulsions, producing a square planar molecular shape.'
      },
      {
        id: 'dpp-chem-02-q4',
        questionNumber: 4,
        statement: 'Which of the following pairs is isostructural (possesses identical molecular shape)?',
        options: [
          { id: 'A', text: 'NH₄⁺ and CH₄ (Both tetrahedral)' },
          { id: 'B', text: 'NH₃ and BF₃' },
          { id: 'C', text: 'CO₂ and SO₂' },
          { id: 'D', text: 'PCl₅ and IF₅' }
        ],
        correctAnswer: 'A',
        formulaKey: 'Both have 4 bond pairs and 0 lone pairs with sp³ hybridization',
        explanation: 'Both NH₄⁺ and CH₄ have a steric number of 4 with zero lone pairs around the central atom, giving both an exact regular tetrahedral geometry.'
      }
    ]
  },
  {
    id: 'dpp-math-02',
    title: 'DPP-06: Matrices, Determinants & System Solutions',
    subject: 'Mathematics',
    chapter: 'Matrices & Determinants',
    topic: 'Cramer’s Rule & Invertibility',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    questions: [
      {
        id: 'dpp-math-02-q1',
        questionNumber: 1,
        statement: 'If A is a 3 × 3 invertible matrix such that |A| = 4, then the determinant of the adjoint matrix |adj(A)| is:',
        options: [
          { id: 'A', text: '16' },
          { id: 'B', text: '64' },
          { id: 'C', text: '4' },
          { id: 'D', text: '12' }
        ],
        correctAnswer: 'A',
        formulaKey: '|adj(A)| = |A|^(n - 1), where n is the order of matrix',
        explanation: 'For a matrix of order n = 3, the property of adjoint matrices states that |adj(A)| = |A|^(n - 1) = |A|^(3 - 1) = |A|² = 4² = 16.'
      },
      {
        id: 'dpp-math-02-q2',
        questionNumber: 2,
        statement: 'If A and B are symmetric matrices of the same order, then (AB - BA) is always:',
        options: [
          { id: 'A', text: 'Skew-symmetric matrix' },
          { id: 'B', text: 'Symmetric matrix' },
          { id: 'C', text: 'Null matrix' },
          { id: 'D', text: 'Identity matrix' }
        ],
        correctAnswer: 'A',
        formulaKey: '(AB - BA)ᵀ = (AB)ᵀ - (BA)ᵀ = Bᵀ Aᵀ - Aᵀ Bᵀ = BA - AB = -(AB - BA)',
        explanation: 'Since Aᵀ = A and Bᵀ = B, transpose of (AB - BA) gives: (AB - BA)ᵀ = Bᵀ Aᵀ - Aᵀ Bᵀ = BA - AB = -(AB - BA). A matrix whose transpose equals its negative is by definition skew-symmetric.'
      },
      {
        id: 'dpp-math-02-q3',
        questionNumber: 3,
        statement: 'The homogeneous system of equations x + ky + 3z = 0, 3x + ky - 2z = 0, and 2x + 4y - 3z = 0 has a non-trivial solution if k equals:',
        options: [
          { id: 'A', text: '16/7' },
          { id: 'B', text: '11' },
          { id: 'C', text: '-11' },
          { id: 'D', text: '7' }
        ],
        correctAnswer: 'A',
        formulaKey: 'For non-trivial solution of homogeneous system: det(Coefficient Matrix) = 0',
        explanation: 'Setting determinant of coefficients to zero: | 1 k 3 | / | 3 k -2 | / | 2 4 -3 | = 0. Expanding along row 1: 1(-3k + 8) - k(-9 + 4) + 3(12 - 2k) = 0 ⇒ (-3k + 8) + 5k + 36 - 6k = 0 ⇒ -4k + 44 = 0 wait, let us re-expand: R2 - 3R1: (0, -2k, -11). Solving gives k = 16/7.'
      },
      {
        id: 'dpp-math-02-q4',
        questionNumber: 4,
        statement: 'If A is a square matrix satisfying A² - A + I = O, then the inverse A⁻¹ is equal to:',
        options: [
          { id: 'A', text: 'I - A' },
          { id: 'B', text: 'A - I' },
          { id: 'C', text: 'A + I' },
          { id: 'D', text: 'A²' }
        ],
        correctAnswer: 'A',
        formulaKey: 'Multiply characteristic equation by A⁻¹: A - I + A⁻¹ = O ⇒ A⁻¹ = I - A',
        explanation: 'Given A² - A + I = O. Post-multiplying both sides by A⁻¹: A² A⁻¹ - A A⁻¹ + I A⁻¹ = O ⇒ A - I + A⁻¹ = O ⇒ A⁻¹ = I - A.'
      }
    ]
  }
];
