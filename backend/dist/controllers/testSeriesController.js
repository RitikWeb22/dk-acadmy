import { TestSeries } from '../models/TestSeries.js';
import { TestSubmission } from '../models/TestSubmission.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { CMSConfig } from '../models/CMS.js';
import { PART_TESTS_DATA } from '../data/partTestsData.js';
import { normalizeCanonicalMath, normalizeOptionMath } from '../services/mathImport/index.js';
import { broadcastTestSeriesCreated, broadcastTestSeriesUpdated, broadcastTestSeriesDeleted } from '../sockets/socket.js';
import { escapeRegex, getPagination } from '../utils/sanitize.js';
// Default starter dataset if DB is empty
const BASE_SEED_TEST_SERIES = [
    {
        id: 'test-ja-coord-geom-01',
        title: 'JEE Advanced Specialist: Coordinate Geometry & Vectors',
        subtitle: 'Focused practice on conic sections, straight lines, circles, planes, and 3D geometry.',
        slug: 'jee-advanced-specialist-coordinate-geometry-vectors',
        badgeCode: 'JEE ADVANCED',
        examType: 'JEE Advanced',
        format: 'Chapter Test',
        difficulty: 'Hard',
        durationMinutes: 90,
        totalQuestions: 4,
        totalMarks: 16,
        subjects: ['Mathematics'],
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Advanced section dedicated exclusively to JEE Mathematics high-weightage geometry domains.',
            'Marking Scheme: +4 marks for correct choice, -1 mark penalty for incorrect choice.',
            'Review your working equations carefully before locking answers.'
        ],
        questions: [
            {
                id: 'ja-cg-q1',
                questionNumber: 1,
                subject: 'Mathematics',
                chapter: '3D Geometry',
                statement: 'The distance of the point P(1, -2, 3) from the plane x - y + z = 5 measured parallel to the line (x/2) = (y/3) = (z/-6) is:',
                options: [
                    { id: 'A', text: '1 unit' },
                    { id: 'B', text: '7 units' },
                    { id: 'C', text: '3 units' },
                    { id: 'D', text: '5 units' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Line through (x₁, y₁, z₁) along vector <a, b, c>: (x - x₁)/a = (y - y₁)/b = (z - z₁)/c = λ',
                explanation: 'Any point on the line passing through P(1, -2, 3) parallel to the given line has coordinates Q(1 + 2λ, -2 + 3λ, 3 - 6λ). Since Q lies on the plane x - y + z = 5, substituting gives: (1 + 2λ) - (-2 + 3λ) + (3 - 6λ) = 5 ⇒ 6 - 7λ = 5 ⇒ 7λ = 1 ⇒ λ = 1/7. The distance PQ = |λ| √(2² + 3² + (-6)²) = (1/7) √(4 + 9 + 36) = (1/7) × 7 = 1 unit.',
                shortcutTrick: 'DK Sir Inspection Trick: Distance = |Plane(P)| / |a·l + b·m + c·n| × √(l²+m²+n²) = 1 unit in 15 seconds!',
                videoSolutionUrl: 'https://dkacademy.in/lms/lectures/3d-geometry-parallel-distance'
            },
            {
                id: 'ja-cg-q2',
                questionNumber: 2,
                subject: 'Mathematics',
                chapter: 'Vectors & Triple Products',
                statement: 'Let a⃗, b⃗, and c⃗ be three non-coplanar unit vectors such that the angle between every pair of them is π/3. If a⃗ × b⃗ + b⃗ × c⃗ = p a⃗ + q b⃗ + r c⃗, where p, q, r are real scalars, then the value of (p² + 2q² + r²) is:',
                options: [
                    { id: 'A', text: '3 / 4' },
                    { id: 'B', text: '1' },
                    { id: 'C', text: '2' },
                    { id: 'D', text: '4' }
                ],
                correctAnswer: 'C',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Vector triple product & scalar projection across non-coplanar basis',
                explanation: 'Taking dot products with a⃗, b⃗, and c⃗ across the non-coplanar basis yields p = -1, q = 0, r = 1. Hence p² + 2q² + r² = 2.',
                shortcutTrick: 'Skew symmetry over b⃗ gives q = 0 immediately! By symmetry |p| = |r| = 1, so p² + r² = 2.',
                videoSolutionUrl: 'https://dkacademy.in/lms/lectures/vectors-coplanar-basis'
            },
            {
                id: 'ja-cg-q3',
                questionNumber: 3,
                subject: 'Mathematics',
                chapter: 'Conic Sections',
                statement: 'The locus of the point of intersection of perpendicular tangents to the parabola y² = 4ax and the ellipse x²/a² + y²/b² = 1 is given by:',
                options: [
                    { id: 'A', text: 'x = -a' },
                    { id: 'B', text: 'x² + y² = a² + b²' },
                    { id: 'C', text: 'Director circle of the respective conic curves' },
                    { id: 'D', text: 'y² - 4ax = x² + y² - a² - b²' }
                ],
                correctAnswer: 'B',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Director circle of ellipse x² + y² = a² + b²; directrix of parabola x = -a',
                explanation: 'For perpendicular tangents to an ellipse, the locus is the director circle x² + y² = a² + b².',
                shortcutTrick: 'Standard analytical geometry property directly yields x² + y² = a² + b².',
                videoSolutionUrl: 'https://dkacademy.in/lms/lectures/conics-director-circle'
            },
            {
                id: 'ja-cg-q4',
                questionNumber: 4,
                subject: 'Mathematics',
                chapter: 'Circles & Orthogonal Systems',
                statement: 'The equation of the circle passing through the points of intersection of the circles x² + y² - 6x = 0 and x² + y² - 4y = 0, and having its center on the line 2x - 5y + 1 = 0, is:',
                options: [
                    { id: 'A', text: 'x² + y² - 2x - 4y = 0' },
                    { id: 'B', text: 'x² + y² - 4x - 6y = 0' },
                    { id: 'C', text: '7(x² + y²) - 18x - 28y = 0' },
                    { id: 'D', text: 'x² + y² + 2x - 3y = 0' }
                ],
                correctAnswer: 'C',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Family of circles: S₁ + λ(3x - 2y) = 0',
                explanation: 'The common chord is 3x - 2y = 0. Circle family has center (-(3λ - 6)/2, λ). Substituting into 2x - 5y + 1 = 0 yields λ = 7/8. This gives 7(x² + y²) - 18x - 28y = 0.',
                shortcutTrick: 'Find radical axis S₁ - S₂ = 0 and substitute center directly into the line equation to solve λ in 20 seconds.',
                videoSolutionUrl: 'https://dkacademy.in/lms/lectures/circles-radical-axis'
            }
        ],
        targetBatches: ['Ultimate 2-Year Live Classroom'],
        batch: 'Ultimate 2-Year Live Classroom',
        status: 'Published',
        attemptsCount: 342,
        totalTests: 4,
        testsBreakdown: { published: 4, draft: 0, scheduled: 0 }
    },
    {
        id: 'ts_jee_2026_01',
        title: 'JEE Main 2026 Full Syllabus Series',
        subtitle: 'NTA Exam Simulation with All-India Rank Predictor',
        slug: 'jee-main-2026-full-syllabus',
        badgeCode: 'JEE MAIN',
        examType: 'JEE Main',
        format: 'Full Mock',
        difficulty: 'Medium',
        durationMinutes: 180,
        totalQuestions: 75,
        totalMarks: 300,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        targetBatches: ['Ultimate 2-Year Live Classroom'],
        batch: 'Ultimate 2-Year Live Classroom',
        status: 'Published',
        attemptsCount: 312,
        totalTests: 8,
        testsBreakdown: { published: 6, draft: 1, scheduled: 1 }
    },
    {
        id: 'ts_jee_adv_02',
        title: 'JEE Advanced Rank Accelerator (Paper 1 & 2)',
        subtitle: 'Multi-correct, paragraph and numerical questions with IIT-JEE pedagogy',
        slug: 'jee-advanced-rank-accelerator',
        badgeCode: 'JEE ADVANCED',
        examType: 'JEE Advanced',
        format: 'Full Mock',
        difficulty: 'Hard',
        durationMinutes: 180,
        totalQuestions: 54,
        totalMarks: 180,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        targetBatches: ['Ultimate 2-Year Live Classroom'],
        batch: 'Ultimate 2-Year Live Classroom',
        status: 'Published',
        attemptsCount: 224,
        totalTests: 6,
        testsBreakdown: { published: 5, draft: 1, scheduled: 0 }
    },
    {
        id: 'ts_bitsat_03',
        title: 'BITSAT Speed & Accuracy Booster (130 Qs)',
        subtitle: 'Speed math and analytical logic sprint test series',
        slug: 'bitsat-speed-accuracy-booster',
        badgeCode: 'BITSAT',
        examType: 'BITSAT',
        format: 'Full Mock',
        difficulty: 'Medium',
        durationMinutes: 180,
        totalQuestions: 130,
        totalMarks: 390,
        subjects: ['Physics', 'Chemistry', 'Mathematics', 'Logical Reasoning', 'English'],
        targetBatches: ['Class 12 Crash Course: Target JEE 2027'],
        batch: 'Class 12 Crash Course: Target JEE 2027',
        status: 'Published',
        attemptsCount: 168,
        totalTests: 5,
        testsBreakdown: { published: 5, draft: 0, scheduled: 0 }
    },
    {
        id: 'ts_jee_calc_04',
        title: 'Integral Calculus & Differential Equations Deep Drill',
        subtitle: 'Definite integrals, area under curves and differential equations',
        slug: 'integral-calculus-differential-equations',
        badgeCode: 'JEE MAIN',
        examType: 'JEE Main',
        format: 'Chapter Test',
        difficulty: 'Hard',
        durationMinutes: 60,
        totalQuestions: 25,
        totalMarks: 100,
        subjects: ['Mathematics'],
        targetBatches: ['Ultimate 2-Year Live Classroom'],
        batch: 'Ultimate 2-Year Live Classroom',
        status: 'Published',
        attemptsCount: 96,
        totalTests: 4,
        testsBreakdown: { published: 4, draft: 0, scheduled: 0 }
    },
    {
        id: 'ts_chem_05',
        title: 'Organic Reaction Mechanisms & Named Reactions',
        subtitle: 'Sn1, Sn2, E1, E2, Aldol, Cannizzaro and Grignard reagents',
        slug: 'organic-reaction-mechanisms-named-reactions',
        badgeCode: 'JEE MAIN',
        examType: 'JEE Main',
        format: 'Chapter Test',
        difficulty: 'Medium',
        durationMinutes: 60,
        totalQuestions: 25,
        totalMarks: 100,
        subjects: ['Chemistry'],
        targetBatches: ['1-Year Repeater/Dropper Rank Accelerator'],
        batch: '1-Year Repeater/Dropper Rank Accelerator',
        status: 'Published',
        attemptsCount: 54,
        totalTests: 3,
        testsBreakdown: { published: 3, draft: 0, scheduled: 0 }
    },
    {
        id: 'ts_phy_06',
        title: 'Rotational Dynamics & Rigid Body Mechanics',
        subtitle: 'Moment of inertia, torque, pure rolling and angular momentum conservation',
        slug: 'rotational-dynamics-rigid-body-mechanics',
        badgeCode: 'JEE ADVANCED',
        examType: 'JEE Advanced',
        format: 'Chapter Test',
        difficulty: 'Hard',
        durationMinutes: 90,
        totalQuestions: 20,
        totalMarks: 80,
        subjects: ['Physics'],
        targetBatches: ['Ultimate 2-Year Live Classroom'],
        batch: 'Ultimate 2-Year Live Classroom',
        status: 'Published',
        attemptsCount: 38,
        totalTests: 4,
        testsBreakdown: { published: 4, draft: 0, scheduled: 0 }
    },
    {
        id: 'ts_electro_07',
        title: 'Electrodynamics & Magnetism Mastery Drill',
        subtitle: 'Gauss Law, Biot-Savart, Ampere circuits and electromagnetic induction',
        slug: 'electrodynamics-magnetism-mastery',
        badgeCode: 'JEE MAIN',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Hard',
        durationMinutes: 90,
        totalQuestions: 30,
        totalMarks: 120,
        subjects: ['Physics'],
        targetBatches: ['Ultimate 2-Year Live Classroom'],
        batch: 'Ultimate 2-Year Live Classroom',
        status: 'Published',
        attemptsCount: 14,
        totalTests: 4,
        testsBreakdown: { published: 4, draft: 0, scheduled: 0 }
    },
    {
        id: 'ts_draft_08',
        title: 'Modern Physics & Nuclear Chemistry Speed Test',
        subtitle: 'Photoelectric effect, de Broglie, Bohr model and radioactivity decay',
        slug: 'modern-physics-nuclear-chemistry',
        badgeCode: 'JEE MAIN',
        examType: 'JEE Main',
        format: 'Part Test',
        difficulty: 'Medium',
        durationMinutes: 60,
        totalQuestions: 25,
        totalMarks: 100,
        subjects: ['Physics', 'Chemistry'],
        targetBatches: ['Foundation Math Drill (Class 11)'],
        batch: 'Foundation Math Drill (Class 11)',
        status: 'Draft',
        attemptsCount: 0,
        totalTests: 2,
        testsBreakdown: { published: 0, draft: 2, scheduled: 0 }
    },
    {
        id: 'ts_draft_09',
        title: 'Algebra Sprint: Matrices, Determinants & Permutations',
        subtitle: 'High speed solving shortcuts for IIT JEE Algebra',
        slug: 'algebra-sprint-matrices-permutations',
        badgeCode: 'JEE ADVANCED',
        examType: 'JEE Advanced',
        format: 'Chapter Test',
        difficulty: 'Hard',
        durationMinutes: 75,
        totalQuestions: 20,
        totalMarks: 80,
        subjects: ['Mathematics'],
        targetBatches: ['Ultimate 2-Year Live Classroom'],
        batch: 'Ultimate 2-Year Live Classroom',
        status: 'Draft',
        attemptsCount: 0,
        totalTests: 3,
        testsBreakdown: { published: 0, draft: 3, scheduled: 0 }
    },
    {
        id: 'ts_draft_10',
        title: 'BITSAT English Proficiency & Verbal Logic Drill',
        subtitle: 'Vocabulary, analogies, reading comprehension and syntax rules',
        slug: 'bitsat-english-proficiency-logic',
        badgeCode: 'BITSAT',
        examType: 'BITSAT',
        format: 'Part Test',
        difficulty: 'Medium',
        durationMinutes: 45,
        totalQuestions: 30,
        totalMarks: 90,
        subjects: ['English', 'Logical Reasoning'],
        targetBatches: ['Class 12 Crash Course: Target JEE 2027'],
        batch: 'Class 12 Crash Course: Target JEE 2027',
        status: 'Draft',
        attemptsCount: 0,
        totalTests: 2,
        testsBreakdown: { published: 0, draft: 2, scheduled: 0 }
    },
    {
        id: 'ts_sched_11',
        title: 'All-India Open Scholarship CBT Mock Examination',
        subtitle: 'Nationwide CBT benchmark test with national percentile ranking',
        slug: 'all-india-open-scholarship-mock',
        badgeCode: 'JEE MAIN',
        examType: 'JEE Main',
        format: 'Full Mock',
        difficulty: 'Hard',
        durationMinutes: 180,
        totalQuestions: 75,
        totalMarks: 300,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        targetBatches: ['All Enrolled Aspirants'],
        batch: 'All Enrolled Aspirants',
        status: 'Scheduled',
        schedule: {
            startWindow: new Date('2026-11-05T14:30:00.000Z'),
            endWindow: new Date('2026-11-12T14:30:00.000Z'),
            autoSubmit: true,
            computeRank: true
        },
        attemptsCount: 0,
        totalTests: 1,
        testsBreakdown: { published: 0, draft: 0, scheduled: 1 }
    },
    {
        id: 'test-class8-olympiad-math-01',
        title: 'Class 8 Foundation & Olympiad Math Speed Mastery',
        subtitle: 'Algebraic expressions, linear equations, squares & square roots, geometry basics & mental shortcuts.',
        slug: 'class-8-foundation-olympiad-math-speed-mastery',
        badgeCode: 'CLASS 8',
        examType: 'Class 8',
        format: 'Full Mock',
        difficulty: 'Moderate',
        durationMinutes: 60,
        totalQuestions: 6,
        totalMarks: 24,
        subjects: ['Mathematics'],
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Foundation mock designed specifically for Class 8 school excellence and Olympiad readiness.',
            'Marking Scheme: +4 marks for correct choice, -1 mark penalty for incorrect choice.',
            'Apply DK Sir 20-30s inspection shortcuts for algebraic equations.'
        ],
        status: 'Published',
        isFree: true,
        targetClass: 'Class 8',
        targetCohort: 'Class 8',
        batch: 'Class 8 Foundation & Olympiad Batch',
        targetBatches: ['Class 8 Foundation & Olympiad Batch'],
        questions: [
            {
                id: 'c8-m-q1',
                questionNumber: 1,
                subject: 'Mathematics',
                chapter: 'Linear Equations in One Variable',
                statement: 'Solve for x: 3(x - 3) = 5(2x + 1). The value of x is:',
                options: [
                    { id: 'A', text: '-2' },
                    { id: 'B', text: '2' },
                    { id: 'C', text: '-14/7' },
                    { id: 'D', text: '-2/7' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Linear expansion: a(x - b) = c(dx + e)',
                explanation: '3(x - 3) = 5(2x + 1) ⇒ 3x - 9 = 10x + 5 ⇒ 3x - 10x = 5 + 9 ⇒ -7x = 14 ⇒ x = -2.'
            },
            {
                id: 'c8-m-q2',
                questionNumber: 2,
                subject: 'Mathematics',
                chapter: 'Squares and Square Roots',
                statement: 'What is the least natural number that must be added to 1750 to make it a perfect square?',
                options: [
                    { id: 'A', text: '14' },
                    { id: 'B', text: '16' },
                    { id: 'C', text: '24' },
                    { id: 'D', text: '12' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Perfect square proximity: 41² = 1681, 42² = 1764',
                explanation: 'We know 41² = 1681 and 42² = 1764. Since 1750 lies between 1681 and 1764, the next perfect square is 1764. The least number to add = 1764 - 1750 = 14.'
            },
            {
                id: 'c8-m-q3',
                questionNumber: 3,
                subject: 'Mathematics',
                chapter: 'Exponents and Powers',
                statement: 'If 2^(x-1) + 2^(x+1) = 320, find the integer value of x.',
                options: [
                    { id: 'A', text: '5' },
                    { id: 'B', text: '6' },
                    { id: 'C', text: '7' },
                    { id: 'D', text: '8' }
                ],
                correctAnswer: 'C',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Factor out common exponent: 2^(x-1)[1 + 2²] = 320',
                explanation: '2^(x-1) + 2^(x+1) = 2^(x-1)(1 + 2²) = 2^(x-1) × 5 = 320. Hence 2^(x-1) = 320/5 = 64 = 2⁶. Therefore x - 1 = 6 ⇒ x = 7.'
            },
            {
                id: 'c8-m-q4',
                questionNumber: 4,
                subject: 'Mathematics',
                chapter: 'Understanding Quadrilaterals',
                statement: 'The sum of all interior angles of a regular polygon is 1080°. How many sides does this polygon have?',
                options: [
                    { id: 'A', text: '6' },
                    { id: 'B', text: '7' },
                    { id: 'C', text: '8' },
                    { id: 'D', text: '10' }
                ],
                correctAnswer: 'C',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Interior angle sum = (n - 2) × 180°',
                explanation: '(n - 2) × 180° = 1080° ⇒ n - 2 = 1080/180 = 6 ⇒ n = 8 (Octagon).'
            },
            {
                id: 'c8-m-q5',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Algebraic Expressions & Identities',
                statement: 'If x + (1/x) = 5, find the value of x² + (1/x²).',
                options: [
                    { id: 'A', text: '23' },
                    { id: 'B', text: '25' },
                    { id: 'C', text: '27' },
                    { id: 'D', text: '21' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: '(x + 1/x)² = x² + 1/x² + 2',
                explanation: 'Squaring both sides: (x + 1/x)² = 5² ⇒ x² + 1/x² + 2 = 25 ⇒ x² + 1/x² = 25 - 2 = 23.'
            },
            {
                id: 'c8-m-q6',
                questionNumber: 6,
                subject: 'Mathematics',
                chapter: 'Mensuration',
                statement: 'A cylindrical water tank has radius 7 m and height 10 m. What is its total surface area? (Take π = 22/7)',
                options: [
                    { id: 'A', text: '748 m²' },
                    { id: 'B', text: '616 m²' },
                    { id: 'C', text: '440 m²' },
                    { id: 'D', text: '880 m²' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Total Surface Area = 2πr(r + h)',
                explanation: 'TSA = 2 × (22/7) × 7 × (7 + 10) = 44 × 17 = 748 m².'
            }
        ]
    },
    {
        id: 'test-class8-science-math-02',
        title: 'Class 8 Foundation Science & Math Diagnostic CBT',
        subtitle: 'Force & Pressure, Sound, Light, Rational Numbers & DK Sir 20-30s speed techniques.',
        slug: 'class-8-foundation-science-math-diagnostic-cbt',
        badgeCode: 'CLASS 8',
        examType: 'Class 8',
        format: 'Part Test',
        difficulty: 'Moderate',
        durationMinutes: 45,
        totalQuestions: 5,
        totalMarks: 20,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Multi-subject diagnostic test evaluating fundamental science and quantitative logic.',
            'Marking Scheme: +4 for correct option, -1 for incorrect option.',
            'Check all units carefully before finalizing response.'
        ],
        status: 'Published',
        isFree: true,
        targetClass: 'Class 8',
        targetCohort: 'Class 8',
        batch: 'Class 8 Foundation & Olympiad Batch',
        targetBatches: ['Class 8 Foundation & Olympiad Batch'],
        questions: [
            {
                id: 'c8-sm-q1',
                questionNumber: 1,
                subject: 'Physics',
                chapter: 'Force and Pressure',
                statement: 'A wooden block of weight 100 N rests on an area of 0.25 m². The pressure exerted by the block on the surface is:',
                options: [
                    { id: 'A', text: '400 Pa' },
                    { id: 'B', text: '25 Pa' },
                    { id: 'C', text: '250 Pa' },
                    { id: 'D', text: '100 Pa' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Pressure = Force / Area',
                explanation: 'Pressure = F / A = 100 N / 0.25 m² = 400 N/m² = 400 Pa.'
            },
            {
                id: 'c8-sm-q2',
                questionNumber: 2,
                subject: 'Physics',
                chapter: 'Sound',
                statement: 'A pendulum oscillates 40 times in 4 seconds. What is its frequency and time period?',
                options: [
                    { id: 'A', text: '10 Hz, 0.1 s' },
                    { id: 'B', text: '4 Hz, 0.25 s' },
                    { id: 'C', text: '0.1 Hz, 10 s' },
                    { id: 'D', text: '40 Hz, 4 s' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Frequency = Oscillations / Time, T = 1 / f',
                explanation: 'Frequency f = 40 / 4 = 10 Hz. Time period T = 1 / f = 1 / 10 = 0.1 s.'
            },
            {
                id: 'c8-sm-q3',
                questionNumber: 3,
                subject: 'Chemistry',
                chapter: 'Combustion and Flame',
                statement: 'Which zone of a candle flame is the hottest and is used by goldsmiths for melting gold and silver?',
                options: [
                    { id: 'A', text: 'Outer non-luminous zone (blue)' },
                    { id: 'B', text: 'Middle luminous zone (yellow)' },
                    { id: 'C', text: 'Innermost dark zone (black)' },
                    { id: 'D', text: 'Central zone' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Complete combustion in outer zone',
                explanation: 'The outermost zone undergoes complete combustion due to ample oxygen supply and is the hottest zone (blue in color).'
            },
            {
                id: 'c8-sm-q4',
                questionNumber: 4,
                subject: 'Mathematics',
                chapter: 'Rational Numbers',
                statement: 'The additive inverse of -7/19 added to the multiplicative inverse of 19/7 is equal to:',
                options: [
                    { id: 'A', text: '14/19' },
                    { id: 'B', text: '0' },
                    { id: 'C', text: '1' },
                    { id: 'D', text: '-14/19' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Additive inverse of a is -a; Multiplicative inverse of a/b is b/a',
                explanation: 'Additive inverse of -7/19 = 7/19. Multiplicative inverse of 19/7 = 7/19. Their sum = 7/19 + 7/19 = 14/19.'
            },
            {
                id: 'c8-sm-q5',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Comparing Quantities',
                statement: 'An article marked at ₹800 is sold for ₹704 after a festival discount. The discount percentage is:',
                options: [
                    { id: 'A', text: '12%' },
                    { id: 'B', text: '10%' },
                    { id: 'C', text: '15%' },
                    { id: 'D', text: '8%' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Discount % = (Discount / Marked Price) × 100',
                explanation: 'Discount = 800 - 704 = ₹96. Discount % = (96 / 800) × 100 = 12%.'
            }
        ]
    },
    {
        id: 'test-class9-foundation-math-01',
        title: 'Class 9 Foundation & IIT Bridge: Number Systems & Polynomials',
        subtitle: 'Coordinate geometry, polynomials, Heron formula & inspection rules for Class 9 students.',
        slug: 'class-9-foundation-iit-bridge-number-systems-polynomials',
        badgeCode: 'CLASS 9',
        examType: 'Class 9',
        format: 'Full Mock',
        difficulty: 'Moderate',
        durationMinutes: 60,
        totalQuestions: 5,
        totalMarks: 20,
        subjects: ['Mathematics'],
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Comprehensive Class 9 foundation mock bridging CBSE basics with early JEE problem concepts.',
            'Marking Scheme: +4 for correct choice, -1 for incorrect choice.'
        ],
        status: 'Published',
        isFree: true,
        targetClass: 'Class 9',
        targetCohort: 'Class 9',
        batch: 'Class 9 Foundation & Olympiad Batch',
        targetBatches: ['Class 9 Foundation & Olympiad Batch'],
        questions: [
            {
                id: 'c9-m-q1',
                questionNumber: 1,
                subject: 'Mathematics',
                chapter: 'Number Systems',
                statement: 'Express 0.2353535... (with 35 repeating) as a rational number p/q in simplest form:',
                options: [
                    { id: 'A', text: '233 / 990' },
                    { id: 'B', text: '235 / 999' },
                    { id: 'C', text: '235 / 990' },
                    { id: 'D', text: '23 / 99' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Shortcut: (Total number - Non-repeating part) / 990',
                explanation: 'Let x = 0.23535... 10x = 2.3535... and 1000x = 235.3535... Subtracting gives 990x = 233 ⇒ x = 233/990.'
            },
            {
                id: 'c9-m-q2',
                questionNumber: 2,
                subject: 'Mathematics',
                chapter: 'Polynomials',
                statement: 'If (x - 2) is a factor of polynomial P(x) = 2x³ - 3x² + kx - 6, find the value of k.',
                options: [
                    { id: 'A', text: '1' },
                    { id: 'B', text: '-1' },
                    { id: 'C', text: '2' },
                    { id: 'D', text: '-2' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Factor Theorem: P(2) = 0',
                explanation: 'P(2) = 2(8) - 3(4) + 2k - 6 = 16 - 12 + 2k - 6 = 2k - 2 = 0 ⇒ 2k = 2 ⇒ k = 1.'
            },
            {
                id: 'c9-m-q3',
                questionNumber: 3,
                subject: 'Mathematics',
                chapter: 'Coordinate Geometry',
                statement: 'The perpendicular distance of the point P(-3, 4) from the y-axis is:',
                options: [
                    { id: 'A', text: '3 units' },
                    { id: 'B', text: '4 units' },
                    { id: 'C', text: '5 units' },
                    { id: 'D', text: '-3 units' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Perpendicular distance from y-axis = |x-coordinate|',
                explanation: 'The perpendicular distance from the y-axis is the absolute value of the x-coordinate: |-3| = 3 units.'
            },
            {
                id: 'c9-m-q4',
                questionNumber: 4,
                subject: 'Mathematics',
                chapter: 'Herons Formula',
                statement: 'The perimeter of a triangular field is 540 m and its sides are in the ratio 25 : 17 : 12. Its area is:',
                options: [
                    { id: 'A', text: '9000 m²' },
                    { id: 'B', text: '4500 m²' },
                    { id: 'C', text: '18000 m²' },
                    { id: 'D', text: '6000 m²' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Herons Formula: Area = √[s(s-a)(s-b)(s-c)]',
                explanation: '25x + 17x + 12x = 54x = 540 ⇒ x = 10. Sides are 250, 170, 120. Semi-perimeter s = 270. Area = √[270 × 20 × 100 × 150] = 9000 m².'
            },
            {
                id: 'c9-m-q5',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Lines and Angles',
                statement: 'In a triangle ABC, if ∠A - ∠B = 15° and ∠B - ∠C = 30°, then ∠A is equal to:',
                options: [
                    { id: 'A', text: '80°' },
                    { id: 'B', text: '65°' },
                    { id: 'C', text: '35°' },
                    { id: 'D', text: '75°' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Angle sum property: ∠A + ∠B + ∠C = 180°',
                explanation: 'Let ∠B = y. Then ∠A = y + 15° and ∠C = y - 30°. Sum = (y + 15) + y + (y - 30) = 3y - 15 = 180° ⇒ 3y = 195° ⇒ y = 65°. Thus ∠A = 65° + 15° = 80°.'
            }
        ]
    },
    {
        id: 'test-class10-ntse-boards-01',
        title: 'Class 10 NTSE & Board Accelerator: Quadratic Equations & Trigonometry',
        subtitle: 'Core quadratic equations, arithmetic progressions, trigonometry & NTSE Stage 1 simulation.',
        slug: 'class-10-ntse-board-accelerator-quadratic-equations-trigonometry',
        badgeCode: 'CLASS 10',
        examType: 'Class 10',
        format: 'Full Mock',
        difficulty: 'Moderate',
        durationMinutes: 75,
        totalQuestions: 5,
        totalMarks: 20,
        subjects: ['Mathematics'],
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        instructions: [
            'Targeted for Class 10 CBSE Board & NTSE Stage 1 aspirants building JEE foundation.',
            'Marking Scheme: +4 for correct choice, -1 for incorrect choice.'
        ],
        status: 'Published',
        isFree: true,
        targetClass: 'Class 10',
        targetCohort: 'Class 10',
        batch: 'Class 10 NTSE & Foundation Batch',
        targetBatches: ['Class 10 NTSE & Foundation Batch'],
        questions: [
            {
                id: 'c10-m-q1',
                questionNumber: 1,
                subject: 'Mathematics',
                chapter: 'Quadratic Equations',
                statement: 'If the roots of the quadratic equation (k - 12)x² + 2(k - 12)x + 2 = 0 are real and equal, find the value of k (k ≠ 12):',
                options: [
                    { id: 'A', text: '14' },
                    { id: 'B', text: '12' },
                    { id: 'C', text: '16' },
                    { id: 'D', text: '10' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Equal roots condition: Discriminant D = b² - 4ac = 0',
                explanation: 'D = [2(k - 12)]² - 4(k - 12)(2) = 4(k - 12)[(k - 12) - 2] = 4(k - 12)(k - 14) = 0. Since k ≠ 12, k = 14.'
            },
            {
                id: 'c10-m-q2',
                questionNumber: 2,
                subject: 'Mathematics',
                chapter: 'Arithmetic Progressions',
                statement: 'If the nth term of an AP is given by aₙ = 5n - 3, then the sum of first 20 terms is:',
                options: [
                    { id: 'A', text: '990' },
                    { id: 'B', text: '1020' },
                    { id: 'C', text: '970' },
                    { id: 'D', text: '1050' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Sₙ = n/2 (a + l)',
                explanation: 'First term a₁ = 5(1) - 3 = 2. 20th term a₂₀ = 5(20) - 3 = 97. Sum S₂₀ = (20/2) × (2 + 97) = 10 × 99 = 990.'
            },
            {
                id: 'c10-m-q3',
                subject: 'Mathematics',
                questionNumber: 3,
                chapter: 'Trigonometry',
                statement: 'If tan θ + cot θ = 2, then the value of tan¹⁰ θ + cot¹⁰ θ is:',
                options: [
                    { id: 'A', text: '2' },
                    { id: 'B', text: '1' },
                    { id: 'C', text: '20' },
                    { id: 'D', text: '10' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'tan θ + 1/tan θ = 2 ⇒ tan θ = 1',
                explanation: 'tan θ + 1/tan θ = 2 ⇒ tan² θ - 2 tan θ + 1 = 0 ⇒ (tan θ - 1)² = 0 ⇒ tan θ = 1. Thus cot θ = 1. So tan¹⁰ θ + cot¹⁰ θ = 1¹⁰ + 1¹⁰ = 2.'
            },
            {
                id: 'c10-m-q4',
                questionNumber: 4,
                subject: 'Mathematics',
                chapter: 'Coordinate Geometry',
                statement: 'The coordinates of the point which divides the line segment joining (4, -3) and (8, 5) in the ratio 3 : 1 internally are:',
                options: [
                    { id: 'A', text: '(7, 3)' },
                    { id: 'B', text: '(7, -3)' },
                    { id: 'C', text: '(6, 1)' },
                    { id: 'D', text: '(5, 2)' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Section Formula: x = (mx₂ + nx₁)/(m + n), y = (my₂ + ny₁)/(m + n)',
                explanation: 'x = (3×8 + 1×4)/(3+1) = (24+4)/4 = 7. y = (3×5 + 1×(-3))/(3+1) = (15-3)/4 = 3. Point is (7, 3).'
            },
            {
                id: 'c10-m-q5',
                questionNumber: 5,
                subject: 'Mathematics',
                chapter: 'Circles',
                statement: 'From a point P, the length of the tangent to a circle is 24 cm and the distance of P from the center is 25 cm. The radius of the circle is:',
                options: [
                    { id: 'A', text: '7 cm' },
                    { id: 'B', text: '12 cm' },
                    { id: 'C', text: '15 cm' },
                    { id: 'D', text: '24.5 cm' }
                ],
                correctAnswer: 'A',
                marks: 4,
                negativeMarks: 1,
                formulaKey: 'Pythagorean Triplet: r² + L² = d²',
                explanation: 'The tangent is perpendicular to the radius at the point of contact. r = √(25² - 24²) = √(625 - 576) = √49 = 7 cm.'
            }
        ]
    }
];
const SEED_TEST_SERIES = [...BASE_SEED_TEST_SERIES, ...PART_TESTS_DATA];
// High-speed in-memory cache for live test series listing (TTL: 30 seconds)
export const invalidateTestSeriesCache = () => { };
export const getAllTestSeries = async (req, res) => {
    try {
        // Prevent browser & CDN caching so newly published tests appear instantly
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        const { examType, format, status, search, page, limit } = req.query;
        const filter = {};
        if (examType && examType !== 'ALL' && examType !== 'All') {
            filter.examType = examType;
        }
        if (format && format !== 'ALL' && format !== 'All') {
            filter.format = format;
        }
        if (status && status !== 'ALL' && status !== 'All') {
            filter.status = status;
        }
        if (search) {
            const q = escapeRegex(String(search).trim());
            filter.$or = [
                { title: { $regex: q, $options: 'i' } },
                { subtitle: { $regex: q, $options: 'i' } },
                { slug: { $regex: q, $options: 'i' } }
            ];
        }
        let items;
        let totalCount = 0;
        let paginationMeta = null;
        const projection = (req.query.includeQuestions === 'false' || req.query.excludeQuestions === 'true')
            ? { questions: 0, 'sections.questions': 0 }
            : {};
        if (limit) {
            const pagination = getPagination(page, limit, 20, 100);
            paginationMeta = pagination;
            const [fetchedItems, total] = await Promise.all([
                TestSeries.find(filter, projection)
                    .sort({ createdAt: -1 })
                    .skip(pagination.skip)
                    .limit(pagination.limit)
                    .lean()
                    .maxTimeMS(4000),
                TestSeries.countDocuments(filter)
            ]);
            items = fetchedItems;
            totalCount = total;
        }
        else {
            items = await TestSeries.find(filter, projection)
                .sort({ createdAt: -1 })
                .lean()
                .maxTimeMS(4000);
            totalCount = items.length;
        }
        // Exclude permanently deleted test series
        const deletedConfig = await CMSConfig.findOne({ key: 'deleted_test_series_ids' }).lean().catch(() => null);
        const deletedIds = Array.isArray(deletedConfig?.data) ? deletedConfig.data : [];
        // Filter DB items against deletedIds
        if (deletedIds.length > 0) {
            items = items.filter((it) => !deletedIds.includes(it.id) &&
                !deletedIds.includes(it.slug) &&
                !deletedIds.includes(String(it._id)) &&
                !deletedIds.includes(it.title));
            totalCount = items.length;
        }
        const isInitialized = await CMSConfig.findOne({ key: 'test_series_initialized' }).lean().catch(() => null);
        // Only inject starter seed dataset if collection has NEVER been initialized and no tests were ever deleted
        if (!isInitialized && items.length === 0 && deletedIds.length === 0) {
            let seedFiltered = SEED_TEST_SERIES;
            if (examType && examType !== 'ALL' && examType !== 'All') {
                const normExam = String(examType).toLowerCase();
                seedFiltered = seedFiltered.filter((s) => String(s.examType).toLowerCase() === normExam ||
                    (s.badgeCode && String(s.badgeCode).toLowerCase().includes(normExam)));
            }
            if (format && format !== 'ALL' && format !== 'All') {
                seedFiltered = seedFiltered.filter((s) => s.format === format);
            }
            if (seedFiltered.length > 0) {
                items = seedFiltered;
                totalCount = seedFiltered.length;
            }
        }
        const requester = req.user;
        const requesterRole = String(requester?.role || '').toUpperCase();
        const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'TEACHER', 'CMS_MANAGER', 'AUTHOR', 'FACULTY'].includes(requesterRole);
        const sanitizedItems = items.map((it) => {
            const obj = { ...it };
            const isScheduled = Boolean(obj.solutionRelease?.enabled &&
                Number(obj.solutionRelease?.releaseDelayHours) > 0);
            const allowSolutions = Boolean(isAdmin ||
                (!isScheduled && (req.query.includeSolutions === 'true' ||
                    req.query.view === 'review' ||
                    req.query.view === 'solutions' ||
                    req.query.view === 'results' ||
                    obj.schedule?.scheduleMode !== 'SCHEDULED_WINDOW')) ||
                obj.solutionRelease?.enabled === false ||
                !obj.solutionRelease ||
                Number(obj.solutionRelease?.releaseDelayHours) === 0);
            if (!allowSolutions && Array.isArray(obj.questions)) {
                obj.questions = sanitizeQuestionsForStudent(obj.questions);
            }
            if (!obj.markingScheme || typeof obj.markingScheme.correct !== 'number') {
                obj.markingScheme = { correct: 4, incorrect: 1, unattempted: 0 };
            }
            if (obj.solutionRelease && !allowSolutions) {
                obj.solutionRelease = {
                    enabled: Boolean(obj.solutionRelease.enabled),
                    releaseDelayHours: obj.solutionRelease.releaseDelayHours || 24,
                    hasPdf: Boolean(obj.solutionRelease.pdfUrl),
                    hasVideo: Boolean(obj.solutionRelease.videoUrl)
                };
            }
            return obj;
        });
        if (paginationMeta) {
            res.status(200).json({
                success: true,
                count: sanitizedItems.length,
                total: totalCount,
                page: paginationMeta.page,
                totalPages: Math.ceil(totalCount / paginationMeta.limit),
                hasMore: paginationMeta.page * paginationMeta.limit < totalCount,
                data: sanitizedItems
            });
            return;
        }
        res.status(200).json({
            success: true,
            count: sanitizedItems.length,
            data: sanitizedItems
        });
    }
    catch (error) {
        console.error('[getAllTestSeries Error]:', error?.message || error);
        res.status(200).json({
            success: true,
            count: 0,
            data: [],
            error: error?.message || 'DB query error'
        });
    }
};
const sanitizeQuestionsForStudent = (questions) => {
    if (!Array.isArray(questions))
        return [];
    return questions.map((q) => {
        const rawQ = q.toObject ? q.toObject() : { ...q };
        const { correctAnswer, numericalAnswer, formulaKey, explanation, explanationBlocks, shortcutTrick, videoSolutionUrl, pdfSolutionUrl, mathValidation, ...safeQ } = rawQ;
        return safeQ;
    });
};
export const getTestSeriesByIdOrSlug = async (req, res) => {
    try {
        const param = String(req.params.id);
        const item = await TestSeries.findOne({
            $or: [
                { id: param },
                { slug: param },
                { _id: param.match(/^[0-9a-fA-F]{24}$/) ? param : null }
            ]
        });
        const requester = req.user;
        const requesterRole = String(requester?.role || '').toUpperCase();
        const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'TEACHER', 'CMS_MANAGER', 'AUTHOR', 'FACULTY'].includes(requesterRole);
        const deletedConfig = await CMSConfig.findOne({ key: 'deleted_test_series_ids' }).lean().catch(() => null);
        const deletedIds = Array.isArray(deletedConfig?.data) ? deletedConfig.data : [];
        if (deletedIds.includes(param) || (item && (deletedIds.includes(item.id) || deletedIds.includes(item.slug) || deletedIds.includes(String(item._id)) || deletedIds.includes(item.title)))) {
            res.status(404).json({ success: false, message: 'Test Series not found' });
            return;
        }
        if (!item) {
            if (!deletedIds.includes(param)) {
                const fallbackItem = SEED_TEST_SERIES.find((s) => (s.id === param || s.slug === param) && !deletedIds.includes(s.id) && !deletedIds.includes(s.slug) && !deletedIds.includes(s.title));
                if (fallbackItem) {
                    const safeFallback = { ...fallbackItem };
                    const isScheduledFallback = Boolean(safeFallback.solutionRelease?.enabled &&
                        Number(safeFallback.solutionRelease?.releaseDelayHours) > 0);
                    const allowSolutions = Boolean(isAdmin ||
                        (!isScheduledFallback && (req.query.includeSolutions === 'true' ||
                            req.query.view === 'review' ||
                            req.query.view === 'solutions' ||
                            req.query.view === 'results' ||
                            safeFallback.schedule?.scheduleMode !== 'SCHEDULED_WINDOW')) ||
                        safeFallback.solutionRelease?.enabled === false ||
                        !safeFallback.solutionRelease ||
                        Number(safeFallback.solutionRelease?.releaseDelayHours) === 0);
                    if (!allowSolutions && Array.isArray(safeFallback.questions)) {
                        safeFallback.questions = sanitizeQuestionsForStudent(safeFallback.questions);
                    }
                    res.status(200).json({ success: true, data: safeFallback });
                    return;
                }
            }
            res.status(404).json({ success: false, message: 'Test Series not found' });
            return;
        }
        const raw = item.toObject ? item.toObject() : { ...item };
        // Check payment access if test is paid
        const isPaidTest = raw.accessMode === 'paid' || raw.isFree === false;
        if (isPaidTest && !isAdmin) {
            const studentId = requester?._id?.toString() || requester?.id;
            const enrolledCourses = requester?.enrolledCourses || [];
            const hasPurchased = studentId && ((Array.isArray(raw.unlockedStudents) && raw.unlockedStudents.includes(studentId)) ||
                enrolledCourses.some((c) => {
                    const cId = typeof c === 'string' ? c : c?.courseId || c?.id;
                    return cId === raw.id || cId === raw.slug || cId === String(raw._id);
                }));
            if (!hasPurchased) {
                raw.isLocked = true;
                raw.questions = [];
                res.status(200).json({
                    success: true,
                    data: raw,
                    isLocked: true,
                    message: 'Premium Test Series: Please complete course or test enrollment to access questions.'
                });
                return;
            }
        }
        const isScheduledRaw = Boolean(raw.solutionRelease?.enabled &&
            Number(raw.solutionRelease?.releaseDelayHours) > 0);
        const allowSolutions = Boolean(isAdmin ||
            (!isScheduledRaw && (req.query.includeSolutions === 'true' ||
                req.query.view === 'review' ||
                req.query.view === 'solutions' ||
                req.query.view === 'results' ||
                raw.schedule?.scheduleMode !== 'SCHEDULED_WINDOW')) ||
            raw.solutionRelease?.enabled === false ||
            !raw.solutionRelease ||
            Number(raw.solutionRelease?.releaseDelayHours) === 0);
        if (!allowSolutions && Array.isArray(raw.questions)) {
            raw.questions = sanitizeQuestionsForStudent(raw.questions);
            if (raw.solutionRelease) {
                raw.solutionRelease = {
                    enabled: Boolean(raw.solutionRelease.enabled),
                    releaseDelayHours: raw.solutionRelease.releaseDelayHours || 24,
                    hasPdf: Boolean(raw.solutionRelease.pdfUrl),
                    hasVideo: Boolean(raw.solutionRelease.videoUrl)
                };
            }
        }
        res.status(200).json({ success: true, data: raw });
    }
    catch (error) {
        const param = String(req.params.id);
        const fallbackItem = SEED_TEST_SERIES.find((s) => s.id === param || s.slug === param);
        if (fallbackItem) {
            const requesterRole = String(req.user?.role || '').toUpperCase();
            const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'TEACHER', 'CMS_MANAGER', 'AUTHOR', 'FACULTY'].includes(requesterRole);
            const safeFallback = { ...fallbackItem };
            const allowSolutions = Boolean(isAdmin ||
                req.query.includeSolutions === 'true' ||
                req.query.view === 'review' ||
                req.query.view === 'solutions' ||
                safeFallback.schedule?.scheduleMode !== 'SCHEDULED_WINDOW' ||
                safeFallback.solutionRelease?.enabled === false ||
                !safeFallback.solutionRelease);
            if (!allowSolutions && Array.isArray(safeFallback.questions)) {
                safeFallback.questions = sanitizeQuestionsForStudent(safeFallback.questions);
            }
            res.status(200).json({ success: true, data: safeFallback, isFallback: true });
            return;
        }
        res.status(500).json({ success: false, message: error.message });
    }
};
export const createTestSeries = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (!payload.title || !String(payload.title).trim()) {
            res.status(400).json({ success: false, message: 'Test Series title is required' });
            return;
        }
        // Normalize difficulty
        if (payload.difficulty) {
            const d = String(payload.difficulty).toLowerCase();
            if (d === 'moderate' || d === 'medium')
                payload.difficulty = 'Medium';
            else if (d === 'challenging' || d === 'hard' || d === 'advanced')
                payload.difficulty = 'Hard';
            else if (d === 'easy')
                payload.difficulty = 'Easy';
        }
        else {
            payload.difficulty = 'Medium';
        }
        // Normalize status enum ('Published' | 'Draft' | 'Scheduled' | 'Archived')
        if (payload.status) {
            const s = String(payload.status).toLowerCase();
            if (s === 'draft')
                payload.status = 'Draft';
            else if (s === 'scheduled')
                payload.status = 'Scheduled';
            else if (s === 'archived')
                payload.status = 'Archived';
            else
                payload.status = 'Published';
        }
        else {
            payload.status = 'Published';
        }
        // Normalize format enum ('Full Mock' | 'Part Test' | 'Chapter Test')
        if (payload.format) {
            const f = String(payload.format).toLowerCase();
            if (f.includes('part'))
                payload.format = 'Part Test';
            else if (f.includes('chapter'))
                payload.format = 'Chapter Test';
            else
                payload.format = 'Full Mock';
        }
        else {
            payload.format = 'Full Mock';
        }
        // Normalize examType & format if PartTest / MathSpeed
        if (payload.examType === 'PartTest' || payload.format === 'Part Test') {
            payload.format = 'Part Test';
            if (payload.examType === 'PartTest')
                payload.examType = 'JEE Main';
            payload.badgeCode = 'PART TEST';
        }
        else if (payload.examType === 'MathSpeed') {
            payload.badgeCode = 'MATH SPEED';
            payload.examType = 'JEE Main';
        }
        else if (payload.examType) {
            const et = String(payload.examType);
            if (et.toLowerCase().includes('adv'))
                payload.examType = 'JEE Advanced';
            else if (et.toLowerCase().includes('bits'))
                payload.examType = 'BITSAT';
            else
                payload.examType = 'JEE Main';
        }
        else {
            payload.examType = 'JEE Main';
        }
        // Normalize accessMode & accessLevel
        if (payload.accessMode) {
            payload.accessMode = String(payload.accessMode).toLowerCase() === 'paid' ? 'paid' : 'free';
        }
        if (payload.accessLevel) {
            payload.accessLevel = String(payload.accessLevel).toUpperCase().includes('FREE') ? 'FREE_LEAD_MAGNET' : 'BATCH_INCLUDED';
        }
        // Set badge code
        if (!payload.badgeCode) {
            payload.badgeCode =
                payload.format === 'Part Test'
                    ? 'PART TEST'
                    : payload.examType === 'JEE Advanced'
                        ? 'JEE ADVANCED'
                        : payload.examType === 'BITSAT'
                            ? 'BITSAT'
                            : payload.examType === 'MathSpeed'
                                ? 'MATH SPEED'
                                : 'JEE MAIN';
        }
        // Normalize questions array with Canonical KaTeX Math
        if (Array.isArray(payload.questions)) {
            payload.questions = payload.questions.map((q, idx) => {
                const rawStatement = q.statement || q.questionText || '';
                const normStatement = rawStatement ? normalizeCanonicalMath(rawStatement) : '';
                const cleanExplanation = q.explanation || q.stepSolution || q.solutionDerivation || '';
                const normExplanation = cleanExplanation ? normalizeCanonicalMath(cleanExplanation) : '';
                const cleanShortcut = q.shortcutTrick || q.dkSirShortcut || '';
                const normShortcut = cleanShortcut ? normalizeCanonicalMath(cleanShortcut) : '';
                const rawSec = String(q.section || '').toUpperCase();
                const cleanSection = rawSec.includes('B') || idx >= 20 || q.type === 'NUMERICAL' ? 'B' : 'A';
                const cleanType = q.type || (cleanSection === 'B' ? 'NUMERICAL' : 'SINGLE_CORRECT');
                const rawDiff = String(q.difficulty || 'Medium').toLowerCase();
                const normDiff = rawDiff.includes('easy') ? 'Easy' : rawDiff.includes('hard') ? 'Hard' : 'Medium';
                return {
                    id: q.id || `q-${idx + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    questionNumber: q.questionNumber || q.index || idx + 1,
                    subject: q.subject || 'Mathematics',
                    difficulty: normDiff,
                    chapter: q.chapter || q.topicTag || 'General',
                    section: cleanSection,
                    type: cleanType,
                    statement: normStatement,
                    statementBlocks: q.statementBlocks,
                    explanationBlocks: q.explanationBlocks,
                    imageUrl: q.imageUrl,
                    options: Array.isArray(q.options)
                        ? q.options.map((opt, optIdx) => ({
                            id: opt.id || opt.key || String.fromCharCode(65 + optIdx),
                            key: opt.key || opt.id || String.fromCharCode(65 + optIdx),
                            text: typeof opt.text === 'string' ? normalizeOptionMath(opt.text) : (opt.text ? String(opt.text) : ''),
                            imageUrl: opt.imageUrl
                        }))
                        : [],
                    correctAnswer: q.correctAnswer || q.correctOption || q.correctKey || (cleanSection === 'B' ? '' : 'A'),
                    numericalAnswer: q.numericalAnswer || (cleanSection === 'B' ? q.correctKey || q.correctAnswer : undefined),
                    marks: q.marks || 4,
                    negativeMarks: q.negativeMarks ?? (cleanSection === 'B' ? 0 : 1),
                    formulaKey: q.formulaKey || q.topicTag || '',
                    explanation: normExplanation,
                    shortcutTrick: normShortcut,
                    videoSolutionUrl: q.videoSolutionUrl || '',
                    pdfSolutionUrl: q.pdfSolutionUrl || ''
                };
            });
            payload.totalQuestions = payload.questions.length;
            if (!payload.totalMarks || payload.totalMarks === 0) {
                const posMark = payload.markingScheme?.correct || 4;
                payload.totalMarks = payload.questions.length * posMark;
            }
        }
        // Build base slug safely
        let baseSlug = (payload.slug || payload.title || 'test-series')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        if (!baseSlug) {
            baseSlug = `test-${Date.now().toString(36)}`;
        }
        // Check if updating an existing record by explicit MongoDB ID or payload ID
        let existing = null;
        if (payload._id && String(payload._id).match(/^[0-9a-fA-F]{24}$/)) {
            existing = await TestSeries.findById(payload._id);
        }
        else if (payload.id) {
            existing = await TestSeries.findOne({ id: payload.id });
        }
        if (existing) {
            // Ensure slug uniqueness among other documents
            let uniqueSlug = baseSlug;
            let counter = 1;
            while (await TestSeries.exists({ slug: uniqueSlug, _id: { $ne: existing._id } })) {
                uniqueSlug = `${baseSlug}-${counter++}`;
            }
            payload.slug = uniqueSlug;
            const updated = await TestSeries.findByIdAndUpdate(existing._id, payload, {
                returnDocument: 'after',
                runValidators: true
            });
            if (updated) {
                invalidateTestSeriesCache();
                broadcastTestSeriesUpdated(updated);
                res.status(200).json({
                    success: true,
                    message: 'Existing Test Series updated successfully in MongoDB',
                    data: updated
                });
                return;
            }
        }
        // Creating a fresh new test series
        // Guarantee unique id
        if (!payload.id || (await TestSeries.exists({ id: payload.id }))) {
            payload.id = `ts-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        }
        // Guarantee unique slug
        let uniqueSlug = baseSlug;
        let counter = 1;
        while (await TestSeries.exists({ slug: uniqueSlug })) {
            uniqueSlug = `${baseSlug}-${counter++}`;
        }
        payload.slug = uniqueSlug;
        const newTestSeries = await TestSeries.create(payload);
        invalidateTestSeriesCache();
        broadcastTestSeriesCreated(newTestSeries);
        res.status(201).json({
            success: true,
            message: 'Test Series created, saved to MongoDB and broadcast live via WebSocket',
            data: newTestSeries
        });
    }
    catch (error) {
        console.error('[createTestSeries Error]:', error);
        res.status(500).json({ success: false, message: error.message || 'Database error creating test series' });
    }
};
export const updateTestSeries = async (req, res) => {
    try {
        const param = String(req.params.id);
        const updates = { ...req.body };
        // Normalize difficulty
        if (updates.difficulty) {
            const d = String(updates.difficulty).toLowerCase();
            if (d === 'moderate' || d === 'medium')
                updates.difficulty = 'Medium';
            else if (d === 'challenging' || d === 'hard' || d === 'advanced')
                updates.difficulty = 'Hard';
            else if (d === 'easy')
                updates.difficulty = 'Easy';
        }
        // Normalize status enum ('Published' | 'Draft' | 'Scheduled' | 'Archived')
        if (updates.status) {
            const s = String(updates.status).toLowerCase();
            if (s === 'draft')
                updates.status = 'Draft';
            else if (s === 'scheduled')
                updates.status = 'Scheduled';
            else if (s === 'archived')
                updates.status = 'Archived';
            else
                updates.status = 'Published';
        }
        // Normalize format enum ('Full Mock' | 'Part Test' | 'Chapter Test')
        if (updates.format) {
            const f = String(updates.format).toLowerCase();
            if (f.includes('part'))
                updates.format = 'Part Test';
            else if (f.includes('chapter'))
                updates.format = 'Chapter Test';
            else
                updates.format = 'Full Mock';
        }
        // Normalize examType & format if PartTest / MathSpeed
        if (updates.examType === 'PartTest' || updates.format === 'Part Test') {
            updates.format = 'Part Test';
            if (updates.examType === 'PartTest')
                updates.examType = 'JEE Main';
            updates.badgeCode = 'PART TEST';
        }
        else if (updates.examType === 'MathSpeed') {
            updates.badgeCode = 'MATH SPEED';
            updates.examType = 'JEE Main';
        }
        else if (updates.examType) {
            const et = String(updates.examType);
            if (et.toLowerCase().includes('adv'))
                updates.examType = 'JEE Advanced';
            else if (et.toLowerCase().includes('bits'))
                updates.examType = 'BITSAT';
            else
                updates.examType = 'JEE Main';
        }
        // Normalize accessMode & accessLevel
        if (updates.accessMode) {
            updates.accessMode = String(updates.accessMode).toLowerCase() === 'paid' ? 'paid' : 'free';
        }
        if (updates.accessLevel) {
            updates.accessLevel = String(updates.accessLevel).toUpperCase().includes('FREE') ? 'FREE_LEAD_MAGNET' : 'BATCH_INCLUDED';
        }
        // Normalize questions array if updated
        if (Array.isArray(updates.questions)) {
            updates.questions = updates.questions.map((q, idx) => {
                const rawStatement = q.statement || q.questionText || '';
                const normStatement = rawStatement ? normalizeCanonicalMath(rawStatement) : '';
                const cleanExplanation = q.explanation || q.stepSolution || q.solutionDerivation || '';
                const normExplanation = cleanExplanation ? normalizeCanonicalMath(cleanExplanation) : '';
                const cleanShortcut = q.shortcutTrick || q.dkSirShortcut || '';
                const normShortcut = cleanShortcut ? normalizeCanonicalMath(cleanShortcut) : '';
                const rawSec = String(q.section || '').toUpperCase();
                const cleanSection = rawSec.includes('B') || idx >= 20 || q.type === 'NUMERICAL' ? 'B' : 'A';
                const cleanType = q.type || (cleanSection === 'B' ? 'NUMERICAL' : 'SINGLE_CORRECT');
                const rawDiff = String(q.difficulty || 'Medium').toLowerCase();
                const normDiff = rawDiff.includes('easy') ? 'Easy' : rawDiff.includes('hard') ? 'Hard' : 'Medium';
                return {
                    id: q.id || `q-${idx + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    questionNumber: q.questionNumber || q.index || idx + 1,
                    subject: q.subject || 'Mathematics',
                    difficulty: normDiff,
                    chapter: q.chapter || q.topicTag || 'General',
                    section: cleanSection,
                    type: cleanType,
                    statement: normStatement,
                    statementBlocks: q.statementBlocks,
                    explanationBlocks: q.explanationBlocks,
                    imageUrl: q.imageUrl,
                    options: Array.isArray(q.options)
                        ? q.options.map((opt, optIdx) => ({
                            id: opt.id || opt.key || String.fromCharCode(65 + optIdx),
                            key: opt.key || opt.id || String.fromCharCode(65 + optIdx),
                            text: typeof opt.text === 'string' ? normalizeOptionMath(opt.text) : (opt.text ? String(opt.text) : ''),
                            imageUrl: opt.imageUrl
                        }))
                        : [],
                    correctAnswer: q.correctAnswer || q.correctOption || q.correctKey || (cleanSection === 'B' ? '' : 'A'),
                    numericalAnswer: q.numericalAnswer || (cleanSection === 'B' ? q.correctKey || q.correctAnswer : undefined),
                    marks: q.marks || 4,
                    negativeMarks: q.negativeMarks ?? (cleanSection === 'B' ? 0 : 1),
                    formulaKey: q.formulaKey || q.topicTag || '',
                    explanation: normExplanation,
                    shortcutTrick: normShortcut,
                    videoSolutionUrl: q.videoSolutionUrl || '',
                    pdfSolutionUrl: q.pdfSolutionUrl || ''
                };
            });
            updates.totalQuestions = updates.questions.length;
        }
        const updated = await TestSeries.findOneAndUpdate({
            $or: [
                { id: param },
                { slug: param },
                { _id: param.match(/^[0-9a-fA-F]{24}$/) ? param : null }
            ]
        }, updates, { returnDocument: 'after', runValidators: true });
        if (!updated) {
            res.status(404).json({ success: false, message: 'Test Series not found' });
            return;
        }
        invalidateTestSeriesCache();
        broadcastTestSeriesUpdated(updated);
        res.status(200).json({
            success: true,
            message: 'Test Series updated successfully in MongoDB',
            data: updated
        });
    }
    catch (error) {
        console.error('[updateTestSeries Error]:', error);
        res.status(500).json({ success: false, message: error.message || 'Database error updating test series' });
    }
};
export const deleteTestSeries = async (req, res) => {
    try {
        const param = String(req.params.id);
        const cleanParam = param.replace(/^\//, '');
        const queryConditions = [
            { id: param },
            { id: cleanParam },
            { slug: param },
            { slug: cleanParam },
            { slug: `/${cleanParam}` },
            { title: param },
            { title: cleanParam }
        ];
        if (/^[0-9a-fA-F]{24}$/.test(cleanParam)) {
            queryConditions.push({ _id: cleanParam });
        }
        const slugified = cleanParam.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (slugified) {
            queryConditions.push({ slug: slugified });
            queryConditions.push({ slug: `/${slugified}` });
        }
        const deleted = await TestSeries.findOneAndDelete({ $or: queryConditions });
        // Blacklist permanently in CMSConfig so seeds or cache never resurrect it
        const toBlacklist = [param, cleanParam];
        if (deleted?.id)
            toBlacklist.push(deleted.id);
        if (deleted?._id)
            toBlacklist.push(String(deleted._id));
        if (deleted?.slug) {
            toBlacklist.push(deleted.slug);
            toBlacklist.push(deleted.slug.replace(/^\//, ''));
        }
        if (deleted?.title)
            toBlacklist.push(deleted.title);
        if (slugified)
            toBlacklist.push(slugified);
        try {
            const existingDeleted = await CMSConfig.findOne({ key: 'deleted_test_series_ids' });
            if (!existingDeleted) {
                await CMSConfig.create({
                    key: 'deleted_test_series_ids',
                    data: toBlacklist,
                    updatedBy: req.user?.email || 'Admin'
                });
            }
            else {
                const merged = Array.from(new Set([...(existingDeleted.data || []), ...toBlacklist]));
                existingDeleted.data = merged;
                await existingDeleted.save();
            }
        }
        catch (cmsErr) {
            console.warn('[deleteTestSeries] CMSConfig blacklist warning:', cmsErr);
        }
        const deletedId = deleted?.id || param;
        invalidateTestSeriesCache();
        broadcastTestSeriesDeleted(deletedId);
        if (deleted?._id && String(deleted._id) !== deletedId)
            broadcastTestSeriesDeleted(String(deleted._id));
        if (deleted?.slug && deleted.slug !== deletedId)
            broadcastTestSeriesDeleted(deleted.slug);
        res.status(200).json({
            success: true,
            message: 'Test Series deleted successfully',
            id: deletedId
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Student Test Submission with Individual Automated Solution Scheduling
 * Formula: solutionUnlockAt = submittedAt (Server Timestamp) + releaseDelayHours
 */
export const submitTestSeries = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { responses, timeSpentSeconds, clientSubmissionId } = req.body;
        const test = await TestSeries.findOne({
            $or: [{ id }, { slug: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
        });
        if (!test) {
            res.status(404).json({ success: false, message: 'Test Series not found' });
            return;
        }
        const studentId = req.user?.id || req.user?._id || req.body.studentId || `guest-${Date.now()}`;
        const studentEmail = req.user?.email || req.body.studentEmail || '';
        const studentName = req.user?.name || req.body.studentName || 'Student';
        // Prevent duplicate schedules for the same submission
        if (clientSubmissionId) {
            const existingSub = await TestSubmission.findOne({ submissionId: clientSubmissionId });
            if (existingSub) {
                res.status(200).json({
                    success: true,
                    message: 'Existing submission retrieved',
                    data: {
                        submissionId: existingSub.submissionId,
                        testId: existingSub.testId,
                        score: existingSub.score,
                        totalMarks: existingSub.totalMarks,
                        accuracy: existingSub.accuracy,
                        correctCount: existingSub.correctCount,
                        incorrectCount: existingSub.incorrectCount,
                        unattemptedCount: existingSub.unattemptedCount,
                        submittedAt: existingSub.submittedAt,
                        solutionSchedule: {
                            enabled: existingSub.solutionSchedule.enabled,
                            releaseDelayHours: existingSub.solutionSchedule.releaseDelayHours,
                            solutionUnlockAt: existingSub.solutionSchedule.solutionUnlockAt,
                            isUnlocked: new Date().getTime() >= new Date(existingSub.solutionSchedule.solutionUnlockAt).getTime(),
                            hasPdf: Boolean(existingSub.solutionSchedule.pdfSolutionUrl),
                            hasVideo: Boolean(existingSub.solutionSchedule.videoSolutionUrl)
                        }
                    }
                });
                return;
            }
        }
        // Evaluate responses against official test questions
        const markingCorrect = test.markingScheme?.correct ?? 4;
        const markingIncorrect = test.markingScheme?.incorrect ?? 1;
        let correctCount = 0;
        let incorrectCount = 0;
        let unattemptedCount = 0;
        let totalScore = 0;
        (test.questions || []).forEach((q) => {
            const qId = q.id || q._id;
            const resp = responses?.[qId];
            const isAnswered = Boolean(resp?.numericalValue?.trim() || resp?.selectedOption);
            if (q.isBonus) {
                correctCount += 1;
                totalScore += (q.marks || markingCorrect);
            }
            else if (!resp || !isAnswered) {
                unattemptedCount += 1;
            }
            else {
                let isCorrect = false;
                const normalizeStr = (val) => String(val ?? '').trim().toUpperCase();
                const isNum = q.type === 'NUMERICAL' || q.section === 'B' || (!q.options || q.options.length === 0);
                if (isNum) {
                    const studentVal = String(resp.numericalValue ?? resp.selectedOption ?? '').trim();
                    const correctVal = String(q.numericalAnswer ?? q.correctAnswer ?? q.correctKey ?? '').trim();
                    if (studentVal && correctVal && !isNaN(Number(studentVal)) && !isNaN(Number(correctVal))) {
                        isCorrect = Math.abs(Number(studentVal) - Number(correctVal)) < 0.001;
                    }
                    else {
                        isCorrect = studentVal.toLowerCase() === correctVal.toLowerCase();
                    }
                }
                else {
                    const studentChoice = normalizeStr(resp.selectedOption || resp.numericalValue);
                    const officialCorrect = normalizeStr(q.correctAnswer ?? q.correctKey ?? q.correctOption);
                    isCorrect = Boolean(studentChoice && officialCorrect && studentChoice === officialCorrect);
                }
                if (isCorrect) {
                    correctCount += 1;
                    totalScore += markingCorrect;
                }
                else {
                    incorrectCount += 1;
                    const penalty = isNum && q.negativeMarks === 0 ? 0 : markingIncorrect;
                    totalScore -= penalty;
                }
            }
        });
        const attemptedCount = correctCount + incorrectCount;
        const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
        const totalMarks = test.totalMarks || (test.questions?.length ? test.questions.length * markingCorrect : 300);
        // Calculate strict server timestamps for student-specific unlock
        const submittedAt = new Date(); // SERVER TIMESTAMP (Never test start or test creation time)
        const isReleaseScheduleEnabled = Boolean(test.solutionRelease?.enabled);
        const configuredDelay = Number(test.solutionRelease?.releaseDelayHours);
        const delayHours = isReleaseScheduleEnabled ? (!isNaN(configuredDelay) ? configuredDelay : 24) : 0;
        const solutionUnlockAt = (isReleaseScheduleEnabled && delayHours > 0)
            ? new Date(submittedAt.getTime() + delayHours * 60 * 60 * 1000)
            : submittedAt;
        const isUnlockedNow = !isReleaseScheduleEnabled || delayHours === 0 || submittedAt.getTime() >= solutionUnlockAt.getTime();
        const releaseStatus = isUnlockedNow ? 'UNLOCKED' : 'SCHEDULED';
        const submissionId = clientSubmissionId || `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        let newSubmission;
        try {
            newSubmission = await TestSubmission.create({
                submissionId,
                testId: test.id,
                studentId: String(studentId),
                studentEmail,
                studentName,
                submittedAt,
                timeSpentSeconds: Number(timeSpentSeconds) || 0,
                score: totalScore,
                totalMarks,
                accuracy,
                correctCount,
                incorrectCount,
                unattemptedCount,
                responses: responses || {},
                status: 'SUBMITTED',
                solutionSchedule: {
                    enabled: isReleaseScheduleEnabled,
                    pdfSolutionUrl: test.solutionRelease?.pdfUrl || '',
                    videoSolutionUrl: test.solutionRelease?.videoUrl || '',
                    releaseDelayHours: delayHours,
                    solutionUnlockAt,
                    releaseStatus
                }
            });
            // Clear student's in-progress autosaved draft upon finalized submission
            const progressKey = `progress_${test.id}_${studentId}`;
            await TestSubmission.deleteOne({ submissionId: progressKey }).catch(() => { });
        }
        catch (createErr) {
            // Graceful concurrency catch: if another request created this submissionId milliseconds ago, return it idempotently
            if (createErr?.code === 11000 || createErr?.name === 'MongoServerError') {
                const existingSub = await TestSubmission.findOne({ submissionId });
                if (existingSub) {
                    res.status(200).json({
                        success: true,
                        message: 'Existing submission retrieved',
                        data: {
                            submissionId: existingSub.submissionId,
                            testId: existingSub.testId,
                            score: existingSub.score,
                            totalMarks: existingSub.totalMarks,
                            accuracy: existingSub.accuracy,
                            correctCount: existingSub.correctCount,
                            incorrectCount: existingSub.incorrectCount,
                            unattemptedCount: existingSub.unattemptedCount,
                            submittedAt: existingSub.submittedAt,
                            solutionSchedule: {
                                enabled: existingSub.solutionSchedule.enabled,
                                releaseDelayHours: existingSub.solutionSchedule.releaseDelayHours,
                                solutionUnlockAt: existingSub.solutionSchedule.solutionUnlockAt,
                                isUnlocked: new Date().getTime() >= new Date(existingSub.solutionSchedule.solutionUnlockAt).getTime(),
                                hasPdf: Boolean(existingSub.solutionSchedule.pdfSolutionUrl),
                                hasVideo: Boolean(existingSub.solutionSchedule.videoSolutionUrl)
                            }
                        }
                    });
                    return;
                }
            }
            throw createErr;
        }
        // Increment attempts count on test
        await TestSeries.updateOne({ id: test.id }, { $inc: { attemptsCount: 1 } }).catch(() => { });
        // Return immediate scoring results & scheduling status (Never leak raw URLs here!)
        res.status(201).json({
            success: true,
            message: 'Test submitted and scheduled successfully',
            data: {
                submissionId: newSubmission.submissionId,
                testId: newSubmission.testId,
                score: newSubmission.score,
                totalMarks: newSubmission.totalMarks,
                accuracy: newSubmission.accuracy,
                correctCount: newSubmission.correctCount,
                incorrectCount: newSubmission.incorrectCount,
                unattemptedCount: newSubmission.unattemptedCount,
                submittedAt: newSubmission.submittedAt,
                solutionSchedule: {
                    enabled: isReleaseScheduleEnabled,
                    releaseDelayHours: delayHours,
                    solutionUnlockAt: newSubmission.solutionSchedule.solutionUnlockAt,
                    isUnlocked: isUnlockedNow,
                    hasPdf: Boolean(test.solutionRelease?.pdfUrl || newSubmission.solutionSchedule.pdfSolutionUrl),
                    hasVideo: Boolean(test.solutionRelease?.videoUrl || newSubmission.solutionSchedule.videoSolutionUrl)
                }
            }
        });
    }
    catch (error) {
        console.error('[submitTestSeries Error]:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Autosave student test progress periodically (responses, timeSpentSeconds).
 * Enables resilient state restoration across browser reloads or network drops.
 */
export const autosaveTestProgress = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { responses, timeSpentSeconds, clientSubmissionId, clientTimestamp } = req.body;
        const test = await TestSeries.findOne({
            $or: [{ id }, { slug: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
        });
        if (!test) {
            res.status(404).json({ success: false, message: 'Test Series not found' });
            return;
        }
        let studentId;
        if (req.user) {
            const authId = String(req.user._id || req.user.id);
            if (req.body.studentId && String(req.body.studentId) !== authId) {
                const role = String(req.user.role || '').toUpperCase();
                const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'TEACHER', 'CMS_MANAGER'].includes(role);
                if (!isAdmin) {
                    res.status(403).json({
                        success: false,
                        message: 'Forbidden: You cannot autosave progress for another student account.'
                    });
                    return;
                }
                studentId = String(req.body.studentId);
            }
            else {
                studentId = authId;
            }
        }
        else {
            const candidateGuestId = String(req.body.studentId || '');
            if (!candidateGuestId.startsWith('guest-')) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required. Non-guest progress requires a valid login session.'
                });
                return;
            }
            studentId = candidateGuestId;
        }
        const progressKey = `progress_${test.id}_${studentId}`;
        // 1. Guard against autosaving if the exam has already been finalized
        const finalizedExam = await TestSubmission.findOne({
            testId: test.id,
            studentId: String(studentId),
            status: 'SUBMITTED',
            submissionId: { $ne: progressKey }
        });
        if (finalizedExam) {
            res.status(409).json({
                success: false,
                message: 'Exam has already been finalized and submitted. Autosave rejected.',
                data: {
                    submissionId: finalizedExam.submissionId,
                    submittedAt: finalizedExam.submittedAt
                }
            });
            return;
        }
        // 2. Out-of-order jitter guard: Check if an existing draft has a newer client timestamp
        const incomingTimestamp = Number(clientTimestamp) || Date.now();
        const existingDraft = await TestSubmission.findOne({ submissionId: progressKey });
        if (existingDraft && existingDraft.clientTimestamp && incomingTimestamp < existingDraft.clientTimestamp) {
            res.status(200).json({
                success: true,
                ignored: true,
                message: 'Newer progress already recorded; ignoring delayed out-of-order packet',
                data: {
                    submissionId: existingDraft.submissionId,
                    testId: existingDraft.testId,
                    attemptVersion: existingDraft.attemptVersion,
                    lastSavedAt: existingDraft.lastSavedAt
                }
            });
            return;
        }
        // 3. Atomically update draft with optimistic version bump
        const updated = await TestSubmission.findOneAndUpdate({ submissionId: progressKey }, {
            $set: {
                testId: test.id,
                studentId: String(studentId),
                studentEmail: req.user?.email || req.body.studentEmail || '',
                studentName: req.user?.name || req.body.studentName || 'Student',
                timeSpentSeconds: Number(timeSpentSeconds) || 0,
                responses: responses || {},
                clientTimestamp: incomingTimestamp,
                lastSavedAt: new Date(),
                status: 'IN_PROGRESS',
                solutionSchedule: {
                    enabled: false,
                    releaseDelayHours: 24,
                    solutionUnlockAt: new Date(Date.now() + 24 * 3600 * 1000),
                    releaseStatus: 'DISABLED'
                }
            },
            $inc: { attemptVersion: 1 }
        }, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true });
        res.status(200).json({
            success: true,
            message: 'Progress autosaved successfully',
            data: {
                submissionId: updated.submissionId,
                testId: updated.testId,
                timeSpentSeconds: updated.timeSpentSeconds,
                attemptVersion: updated.attemptVersion,
                lastSavedAt: updated.lastSavedAt,
                updatedAt: updated.updatedAt
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Retrieve saved progress for an ongoing test attempt.
 */
export const getTestProgress = async (req, res) => {
    try {
        const id = String(req.params.id);
        const test = await TestSeries.findOne({
            $or: [{ id }, { slug: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
        });
        if (!test) {
            res.status(404).json({ success: false, message: 'Test Series not found' });
            return;
        }
        let studentId;
        if (req.user) {
            const authId = String(req.user._id || req.user.id);
            if (req.query.studentId && String(req.query.studentId) !== authId) {
                const role = String(req.user.role || '').toUpperCase();
                const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'TEACHER', 'CMS_MANAGER'].includes(role);
                if (!isAdmin) {
                    res.status(403).json({
                        success: false,
                        message: 'Forbidden: You cannot access test progress for another student account.'
                    });
                    return;
                }
                studentId = String(req.query.studentId);
            }
            else {
                studentId = authId;
            }
        }
        else {
            const candidateGuestId = String(req.query.studentId || '');
            if (!candidateGuestId.startsWith('guest-')) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required to access student test progress.'
                });
                return;
            }
            studentId = candidateGuestId;
        }
        const progressKey = `progress_${test.id}_${studentId}`;
        const progress = await TestSubmission.findOne({
            $or: [
                { submissionId: progressKey },
                { testId: test.id, studentId: String(studentId) }
            ]
        }).sort({ updatedAt: -1 });
        if (!progress) {
            res.status(200).json({ success: true, data: null, message: 'No saved progress found' });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                submissionId: progress.submissionId,
                testId: progress.testId,
                timeSpentSeconds: progress.timeSpentSeconds,
                responses: progress.responses,
                status: progress.status || 'IN_PROGRESS',
                isFinalized: progress.status === 'SUBMITTED',
                score: progress.status === 'SUBMITTED' ? progress.score : undefined,
                attemptVersion: progress.attemptVersion,
                lastSavedAt: progress.lastSavedAt || progress.updatedAt,
                updatedAt: progress.updatedAt
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Retrieve unlocked solutions after scheduled release delay.
 * Strict server validation: Rejects early requests with 403 Forbidden.
 */
export const getTestSeriesSubmissionSolution = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const submission = await TestSubmission.findOne({ submissionId });
        if (!submission) {
            res.status(404).json({ success: false, message: 'Submission record not found' });
            return;
        }
        // Ownership & Role Verification
        const requesterId = req.user?.id || req.user?._id;
        const isOwner = Boolean(requesterId && String(submission.studentId) === String(requesterId));
        const requesterRoleUpper = String(req.user?.role || '').toUpperCase();
        const isAdmin = Boolean(req.user && ['ADMIN', 'SUPER_ADMIN', 'TEACHER', 'CMS_MANAGER', 'AUTHOR', 'FACULTY'].includes(requesterRoleUpper));
        const isGuestSubmission = String(submission.studentId).startsWith('guest-');
        if (!isGuestSubmission && !isOwner && !isAdmin) {
            res.status(403).json({
                success: false,
                message: 'Access Denied: You are not authorized to access this submission’s solutions.'
            });
            return;
        }
        // If schedule release is disabled or delay is 0, solutions are immediately unlocked
        const isReleaseScheduleEnabled = Boolean(submission.solutionSchedule?.enabled);
        const unlockTime = submission.solutionSchedule?.solutionUnlockAt
            ? new Date(submission.solutionSchedule.solutionUnlockAt)
            : new Date(submission.submittedAt);
        const now = new Date();
        if (isReleaseScheduleEnabled && now.getTime() < unlockTime.getTime()) {
            res.status(403).json({
                success: false,
                isUnlocked: false,
                message: `Solutions are scheduled to unlock on ${unlockTime.toLocaleString('en-IN')}`,
                solutionUnlockAt: unlockTime,
                submittedAt: submission.submittedAt,
                releaseDelayHours: submission.solutionSchedule?.releaseDelayHours || 0,
                hasPdf: Boolean(submission.solutionSchedule?.pdfSolutionUrl),
                hasVideo: Boolean(submission.solutionSchedule?.videoSolutionUrl)
            });
            return;
        }
        // Unlocked! Always use configured URLs (fallback to test catalog snapshot)
        const test = await TestSeries.findOne({
            $or: [
                { id: submission.testId },
                { slug: submission.testId },
                { _id: String(submission.testId).match(/^[0-9a-fA-F]{24}$/) ? submission.testId : null }
            ].filter(Boolean)
        });
        const pdfUrl = test?.solutionRelease?.pdfUrl || submission.solutionSchedule?.pdfSolutionUrl || '';
        const videoUrl = test?.solutionRelease?.videoUrl || submission.solutionSchedule?.videoSolutionUrl || '';
        // Mark as UNLOCKED in DB
        if (submission.solutionSchedule.releaseStatus !== 'UNLOCKED') {
            submission.solutionSchedule.releaseStatus = 'UNLOCKED';
            await submission.save().catch(() => { });
        }
        // Collect question-level solutions
        const questionSolutions = (test?.questions || [])
            .map((q) => ({
            questionId: q.id || q._id,
            questionNumber: q.questionNumber,
            explanation: q.explanation || '',
            shortcutTrick: q.shortcutTrick || '',
            formulaKey: q.formulaKey || '',
            correctAnswer: q.correctAnswer || '',
            numericalAnswer: q.numericalAnswer || '',
            videoSolutionUrl: q.videoSolutionUrl || undefined,
            pdfSolutionUrl: q.pdfSolutionUrl || undefined
        }));
        res.status(200).json({
            success: true,
            isUnlocked: true,
            message: 'Solutions unlocked successfully',
            data: {
                submissionId: submission.submissionId,
                submittedAt: submission.submittedAt,
                solutionUnlockAt: submission.solutionSchedule.solutionUnlockAt,
                pdfSolutionUrl: pdfUrl || undefined,
                videoSolutionUrl: videoUrl || undefined,
                questionSolutions: questionSolutions.length > 0 ? questionSolutions : undefined,
                questions: test?.questions || []
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Public/Safe Status Check endpoint for countdown timer
 * Does NOT return raw solution URLs
 */
export const getTestSeriesSubmissionStatus = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const submission = await TestSubmission.findOne({ submissionId });
        if (!submission) {
            res.status(404).json({ success: false, message: 'Submission not found' });
            return;
        }
        const now = new Date();
        const unlockTime = new Date(submission.solutionSchedule.solutionUnlockAt);
        const isUnlocked = now.getTime() >= unlockTime.getTime();
        res.status(200).json({
            success: true,
            data: {
                submissionId: submission.submissionId,
                testId: submission.testId,
                submittedAt: submission.submittedAt,
                releaseDelayHours: submission.solutionSchedule.releaseDelayHours,
                solutionUnlockAt: submission.solutionSchedule.solutionUnlockAt,
                isUnlocked,
                enabled: submission.solutionSchedule.enabled,
                hasPdf: Boolean(submission.solutionSchedule.pdfSolutionUrl),
                hasVideo: Boolean(submission.solutionSchedule.videoSolutionUrl)
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Admin Overview: Total submissions, scheduled, unlocked, disabled, and URL status
 */
export const getTestSeriesSolutionAdminOverview = async (req, res) => {
    try {
        const id = String(req.params.id);
        const test = await TestSeries.findOne({
            $or: [{ id }, { slug: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
        });
        if (!test) {
            res.status(404).json({ success: false, message: 'Test Series not found' });
            return;
        }
        const testId = test.id;
        const now = new Date();
        const submissions = await TestSubmission.find({ testId });
        const totalSubmissions = submissions.length;
        let scheduledReleases = 0;
        let unlockedSubmissions = 0;
        let disabledReleases = 0;
        submissions.forEach((sub) => {
            if (!sub.solutionSchedule?.enabled) {
                disabledReleases++;
            }
            else if (new Date(sub.solutionSchedule.solutionUnlockAt).getTime() > now.getTime()) {
                scheduledReleases++;
            }
            else {
                unlockedSubmissions++;
            }
        });
        res.status(200).json({
            success: true,
            data: {
                testId,
                title: test.title,
                solutionRelease: test.solutionRelease || {
                    enabled: false,
                    pdfUrl: '',
                    videoUrl: '',
                    releaseDelayHours: 24
                },
                overview: {
                    totalSubmissions,
                    scheduledReleases,
                    unlockedSubmissions,
                    disabledReleases,
                    pdfConfigured: Boolean(test.solutionRelease?.pdfUrl),
                    videoConfigured: Boolean(test.solutionRelease?.videoUrl),
                    releaseDelayHours: test.solutionRelease?.releaseDelayHours || 24,
                    enabled: Boolean(test.solutionRelease?.enabled)
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Admin Solution Configuration Update
 * Validates Google Drive URL format, PDF URL, delay dropdown (12, 24, 48, 72)
 * Enforces at least one URL if enabled.
 * Does NOT reset existing students' scheduled unlock timers!
 */
export const updateTestSeriesSolutionConfig = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { enabled, pdfUrl, videoUrl, releaseDelayHours } = req.body;
        const test = await TestSeries.findOne({
            $or: [{ id }, { slug: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
        });
        if (!test) {
            res.status(404).json({ success: false, message: 'Test Series not found' });
            return;
        }
        const delay = [12, 24, 48, 72].includes(Number(releaseDelayHours)) ? Number(releaseDelayHours) : 24;
        const trimmedPdf = typeof pdfUrl === 'string' ? pdfUrl.trim() : '';
        const trimmedVideo = typeof videoUrl === 'string' ? videoUrl.trim() : '';
        // Validation: If enabling, at least one valid solution URL must be provided
        if (enabled) {
            if (!trimmedPdf && !trimmedVideo) {
                res.status(400).json({
                    success: false,
                    message: 'At least one valid solution URL (PDF, Google Drive Video, or YouTube Video) must be provided to enable Scheduled Solution Release.'
                });
                return;
            }
        }
        // Validate Video URL format (supports Google Drive and YouTube)
        const isDrive = trimmedVideo.includes('drive.google.com');
        const isYouTube = trimmedVideo.includes('youtube.com') || trimmedVideo.includes('youtu.be');
        const isValidHttp = trimmedVideo.startsWith('http://') || trimmedVideo.startsWith('https://');
        if (trimmedVideo && (!isValidHttp || (!isDrive && !isYouTube))) {
            res.status(400).json({
                success: false,
                message: 'Video Solution URL must be a valid Google Drive (drive.google.com) or YouTube (youtube.com / youtu.be) link.'
            });
            return;
        }
        // Validate PDF URL format
        if (trimmedPdf && !trimmedPdf.startsWith('http://') && !trimmedPdf.startsWith('https://')) {
            res.status(400).json({
                success: false,
                message: 'PDF Solution URL must start with http:// or https://.'
            });
            return;
        }
        test.solutionRelease = {
            enabled: Boolean(enabled),
            pdfUrl: trimmedPdf,
            videoUrl: trimmedVideo,
            releaseDelayHours: delay
        };
        await test.save();
        res.status(200).json({
            success: true,
            message: 'Scheduled solution release configuration updated successfully',
            data: test.solutionRelease
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Unlock Paid Test Series after verified Razorpay checkout
 */
export const unlockTestSeries = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { paymentId } = req.body;
        if (!paymentId) {
            res.status(400).json({ success: false, message: 'Payment reference ID is required to unlock content' });
            return;
        }
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const studentIdentifier = req.user._id?.toString() || req.user?.id;
        // Verify payment in Order database
        const verifiedOrder = await Order.findOne({
            $or: [
                { paymentId: String(paymentId).trim() },
                { orderId: String(paymentId).trim() }
            ],
            status: 'SUCCESS'
        });
        if (!verifiedOrder) {
            res.status(400).json({
                success: false,
                message: 'Payment verification failed: No completed transaction found for this reference'
            });
            return;
        }
        // Security check: ensure order belongs to authenticated student
        if (verifiedOrder.userId && verifiedOrder.userId.toString() !== studentIdentifier && verifiedOrder.studentEmail !== req.user.email) {
            res.status(403).json({
                success: false,
                message: 'Security violation: Payment transaction does not match this student account'
            });
            return;
        }
        const test = await TestSeries.findOne({
            $or: [{ id }, { slug: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
        });
        if (!test) {
            res.status(404).json({ success: false, message: 'Test Series not found' });
            return;
        }
        if (!Array.isArray(test.unlockedStudents)) {
            test.unlockedStudents = [];
        }
        if (!test.unlockedStudents.includes(studentIdentifier)) {
            test.unlockedStudents.push(studentIdentifier);
            await test.save();
        }
        // Also add to student's enrolledCourses if not already there
        const userToUpdate = await User.findById(studentIdentifier);
        if (userToUpdate) {
            const currentEnrolled = userToUpdate.enrolledCourses || [];
            const testKey = test.id || String(test._id);
            if (!currentEnrolled.map((c) => String(c)).includes(testKey)) {
                currentEnrolled.push(testKey);
                userToUpdate.enrolledCourses = currentEnrolled;
                await userToUpdate.save();
            }
        }
        res.status(200).json({
            success: true,
            message: 'Test Series unlocked and verified successfully',
            data: {
                testId: test.id,
                isUnlocked: true,
                paymentId
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
