import { TestSeries } from '../models/TestSeries.js';
import { TestSubmission } from '../models/TestSubmission.js';
import { PART_TESTS_DATA } from '../data/partTestsData.js';
import { normalizeMathematicalText } from '../utils/universalMathEngine/index.js';
import { broadcastTestSeriesCreated, broadcastTestSeriesUpdated, broadcastTestSeriesDeleted } from '../sockets/socket.js';
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
                shortcutTrick: 'DK Sir Kota Inspection Trick: Distance = |Plane(P)| / |a·l + b·m + c·n| × √(l²+m²+n²) = 1 unit in 15 seconds!',
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
        title: 'Kota Advanced Rank Accelerator (Paper 1 & 2)',
        subtitle: 'Multi-correct, paragraph and numerical questions with Kota pedagogy',
        slug: 'kota-advanced-rank-accelerator',
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
        targetBatches: ['Kota Foundation Math Drill (Class 11)'],
        batch: 'Kota Foundation Math Drill (Class 11)',
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
    }
];
const SEED_TEST_SERIES = [...BASE_SEED_TEST_SERIES, ...PART_TESTS_DATA];
export const getAllTestSeries = async (req, res) => {
    try {
        const { examType, format, status, search } = req.query;
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
            const q = String(search).trim();
            filter.$or = [
                { title: { $regex: q, $options: 'i' } },
                { subtitle: { $regex: q, $options: 'i' } },
                { slug: { $regex: q, $options: 'i' } }
            ];
        }
        // Ensure legacy items have correct formats
        await TestSeries.updateOne({ id: 'test-ja-coord-geom-01', format: 'Part Test' }, { $set: { format: 'Chapter Test' } }).catch(() => { });
        let items = await TestSeries.find(filter).sort({ createdAt: -1 });
        // Only seed initial default test series if database collection is completely empty
        if (items.length === 0 && Object.keys(filter).length === 0) {
            for (const seed of SEED_TEST_SERIES) {
                await TestSeries.findOneAndUpdate({ slug: seed.slug }, seed, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true });
            }
            items = await TestSeries.find({}).sort({ createdAt: -1 });
        }
        const sanitizedItems = items.map((it) => {
            const obj = it.toObject ? it.toObject() : { ...it };
            if (!obj.markingScheme || typeof obj.markingScheme.correct !== 'number') {
                obj.markingScheme = { correct: 4, incorrect: 1, unattempted: 0 };
            }
            if (obj.solutionRelease) {
                obj.solutionRelease = {
                    enabled: Boolean(obj.solutionRelease.enabled),
                    releaseDelayHours: obj.solutionRelease.releaseDelayHours || 24,
                    hasPdf: Boolean(obj.solutionRelease.pdfUrl),
                    hasVideo: Boolean(obj.solutionRelease.videoUrl)
                };
            }
            return obj;
        });
        res.status(200).json({
            success: true,
            count: sanitizedItems.length,
            data: sanitizedItems
        });
    }
    catch (error) {
        console.error('[getAllTestSeries Notice]: Serving fallback test series during DB reconnection:', error?.message || error);
        res.status(200).json({
            success: true,
            count: SEED_TEST_SERIES.length,
            data: SEED_TEST_SERIES,
            isFallback: true
        });
    }
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
        if (!item) {
            const fallbackItem = SEED_TEST_SERIES.find((s) => s.id === param || s.slug === param);
            if (fallbackItem) {
                res.status(200).json({ success: true, data: fallbackItem });
                return;
            }
            res.status(404).json({ success: false, message: 'Test Series not found' });
            return;
        }
        const raw = item.toObject ? item.toObject() : { ...item };
        const requesterRole = String(req.user?.role || '').toUpperCase();
        const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'TEACHER', 'CMS_MANAGER', 'AUTHOR', 'FACULTY'].includes(requesterRole);
        if (!isAdmin && raw.solutionRelease) {
            raw.solutionRelease = {
                enabled: Boolean(raw.solutionRelease.enabled),
                releaseDelayHours: raw.solutionRelease.releaseDelayHours || 24,
                hasPdf: Boolean(raw.solutionRelease.pdfUrl),
                hasVideo: Boolean(raw.solutionRelease.videoUrl)
            };
        }
        res.status(200).json({ success: true, data: raw });
    }
    catch (error) {
        const param = String(req.params.id);
        const fallbackItem = SEED_TEST_SERIES.find((s) => s.id === param || s.slug === param);
        if (fallbackItem) {
            res.status(200).json({ success: true, data: fallbackItem, isFallback: true });
            return;
        }
        res.status(500).json({ success: false, message: error.message });
    }
};
export const createTestSeries = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (!payload.title) {
            res.status(400).json({ success: false, message: 'Test Series title is required' });
            return;
        }
        if (!payload.id) {
            payload.id = `ts-${Date.now()}`;
        }
        if (!payload.slug) {
            payload.slug = payload.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
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
        // Normalize questions array
        if (Array.isArray(payload.questions)) {
            payload.questions = payload.questions.map((q, idx) => {
                const rawStatement = q.statement || q.questionText || '';
                const normStatement = rawStatement ? normalizeMathematicalText(rawStatement).normalizedText : '';
                const cleanExplanation = q.explanation || q.stepSolution || q.solutionDerivation || '';
                const normExplanation = cleanExplanation ? normalizeMathematicalText(cleanExplanation).normalizedText : '';
                const cleanShortcut = q.shortcutTrick || q.dkSirShortcut || '';
                const normShortcut = cleanShortcut ? normalizeMathematicalText(cleanShortcut).normalizedText : '';
                return {
                    id: q.id || `q-${idx + 1}-${Date.now()}`,
                    questionNumber: q.questionNumber || q.index || idx + 1,
                    subject: q.subject || 'Mathematics',
                    chapter: q.chapter || q.topicTag || 'General',
                    section: q.section || (idx >= 20 || q.type === 'NUMERICAL' ? 'B' : 'A'),
                    type: q.type || (q.section === 'B' || idx >= 20 ? 'NUMERICAL' : 'SINGLE_CORRECT'),
                    statement: normStatement,
                    statementBlocks: q.statementBlocks,
                    explanationBlocks: q.explanationBlocks,
                    imageUrl: q.imageUrl,
                    options: Array.isArray(q.options)
                        ? q.options.map((opt, optIdx) => ({
                            id: opt.id || opt.key || String.fromCharCode(65 + optIdx),
                            key: opt.key || opt.id || String.fromCharCode(65 + optIdx),
                            text: opt.text ? normalizeMathematicalText(opt.text).normalizedText : '',
                            imageUrl: opt.imageUrl
                        }))
                        : [],
                    correctAnswer: q.correctAnswer || q.correctOption || q.correctKey || 'A',
                    numericalAnswer: q.numericalAnswer || (q.section === 'B' ? q.correctKey || q.correctAnswer : undefined),
                    marks: q.marks || 4,
                    negativeMarks: q.negativeMarks ?? 1,
                    formulaKey: q.formulaKey || q.topicTag,
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
        // Check if test series with this id, slug or title already exists to prevent duplicate creation
        const normalizedSlug = payload.slug || payload.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        payload.slug = normalizedSlug;
        const queryOr = [];
        if (payload.id)
            queryOr.push({ id: payload.id });
        if (normalizedSlug)
            queryOr.push({ slug: normalizedSlug });
        if (payload.title) {
            queryOr.push({ title: { $regex: new RegExp(`^${payload.title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
        }
        const existing = queryOr.length > 0 ? await TestSeries.findOne({ $or: queryOr }) : null;
        if (existing) {
            const updated = await TestSeries.findByIdAndUpdate(existing._id, payload, {
                returnDocument: 'after',
                runValidators: true
            });
            if (updated) {
                broadcastTestSeriesUpdated(updated);
                res.status(200).json({
                    success: true,
                    message: 'Existing Test Series updated successfully',
                    data: updated
                });
                return;
            }
        }
        const newTestSeries = await TestSeries.create(payload);
        broadcastTestSeriesCreated(newTestSeries);
        res.status(201).json({
            success: true,
            message: 'Test Series created, saved to MongoDB and broadcast live via WebSocket',
            data: newTestSeries
        });
    }
    catch (error) {
        console.error('[createTestSeries Error]:', error);
        res.status(500).json({ success: false, message: error.message });
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
                const normStatement = rawStatement ? normalizeMathematicalText(rawStatement).normalizedText : '';
                const cleanExplanation = q.explanation || q.stepSolution || q.solutionDerivation || '';
                const normExplanation = cleanExplanation ? normalizeMathematicalText(cleanExplanation).normalizedText : '';
                const cleanShortcut = q.shortcutTrick || q.dkSirShortcut || '';
                const normShortcut = cleanShortcut ? normalizeMathematicalText(cleanShortcut).normalizedText : '';
                return {
                    id: q.id || `q-${idx + 1}-${Date.now()}`,
                    questionNumber: q.questionNumber || q.index || idx + 1,
                    subject: q.subject || 'Mathematics',
                    chapter: q.chapter || q.topicTag || 'General',
                    section: q.section || (idx >= 20 || q.type === 'NUMERICAL' ? 'B' : 'A'),
                    type: q.type || (q.section === 'B' || idx >= 20 ? 'NUMERICAL' : 'SINGLE_CORRECT'),
                    statement: normStatement,
                    statementBlocks: q.statementBlocks,
                    explanationBlocks: q.explanationBlocks,
                    imageUrl: q.imageUrl,
                    options: Array.isArray(q.options)
                        ? q.options.map((opt, optIdx) => ({
                            id: opt.id || opt.key || String.fromCharCode(65 + optIdx),
                            key: opt.key || opt.id || String.fromCharCode(65 + optIdx),
                            text: opt.text ? normalizeMathematicalText(opt.text).normalizedText : '',
                            imageUrl: opt.imageUrl
                        }))
                        : [],
                    correctAnswer: q.correctAnswer || q.correctOption || q.correctKey || 'A',
                    numericalAnswer: q.numericalAnswer || (q.section === 'B' ? q.correctKey || q.correctAnswer : undefined),
                    marks: q.marks || 4,
                    negativeMarks: q.negativeMarks ?? 1,
                    formulaKey: q.formulaKey || q.topicTag,
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
        }, updates, { new: true, runValidators: true });
        if (!updated) {
            res.status(404).json({ success: false, message: 'Test Series not found' });
            return;
        }
        broadcastTestSeriesUpdated(updated);
        res.status(200).json({
            success: true,
            message: 'Test Series updated successfully',
            data: updated
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const deleteTestSeries = async (req, res) => {
    try {
        const param = String(req.params.id);
        const deleted = await TestSeries.findOneAndDelete({
            $or: [
                { id: param },
                { slug: param },
                { _id: param.match(/^[0-9a-fA-F]{24}$/) ? param : null }
            ]
        });
        const deletedId = deleted?.id || param;
        broadcastTestSeriesDeleted(deletedId);
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
            if (!resp || !isAnswered) {
                unattemptedCount += 1;
            }
            else {
                let isCorrect = false;
                const isNum = q.type === 'NUMERICAL' || q.section === 'B' || (!q.options || q.options.length === 0);
                if (isNum) {
                    const studentVal = (resp.numericalValue ?? resp.selectedOption ?? '').trim();
                    const correctVal = String(q.numericalAnswer ?? q.correctAnswer ?? '').trim();
                    if (studentVal && correctVal && !isNaN(Number(studentVal)) && !isNaN(Number(correctVal))) {
                        isCorrect = Math.abs(Number(studentVal) - Number(correctVal)) < 0.001;
                    }
                    else {
                        isCorrect = studentVal.toLowerCase() === correctVal.toLowerCase();
                    }
                }
                else {
                    isCorrect = resp.selectedOption === q.correctAnswer;
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
        const delayHours = [12, 24, 48, 72].includes(Number(test.solutionRelease?.releaseDelayHours))
            ? Number(test.solutionRelease?.releaseDelayHours)
            : 24;
        const solutionUnlockAt = new Date(submittedAt.getTime() + delayHours * 60 * 60 * 1000);
        const hasAnySolutionUrl = Boolean(test.solutionRelease?.pdfUrl || test.solutionRelease?.videoUrl);
        const isReleaseEnabled = Boolean(test.solutionRelease?.enabled && hasAnySolutionUrl);
        const submissionId = clientSubmissionId || `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const newSubmission = await TestSubmission.create({
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
            solutionSchedule: {
                enabled: isReleaseEnabled,
                pdfSolutionUrl: test.solutionRelease?.pdfUrl || '',
                videoSolutionUrl: test.solutionRelease?.videoUrl || '',
                releaseDelayHours: delayHours,
                solutionUnlockAt,
                releaseStatus: isReleaseEnabled ? 'SCHEDULED' : 'DISABLED'
            }
        });
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
                    enabled: isReleaseEnabled,
                    releaseDelayHours: delayHours,
                    solutionUnlockAt: newSubmission.solutionSchedule.solutionUnlockAt,
                    isUnlocked: false,
                    hasPdf: Boolean(test.solutionRelease?.pdfUrl),
                    hasVideo: Boolean(test.solutionRelease?.videoUrl)
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
        const isOwner = requesterId && String(submission.studentId) === String(requesterId);
        const requesterRoleUpper = String(req.user?.role || '').toUpperCase();
        const isAdmin = Boolean(req.user && ['ADMIN', 'SUPER_ADMIN', 'TEACHER', 'CMS_MANAGER', 'AUTHOR', 'FACULTY'].includes(requesterRoleUpper));
        const isGuest = String(submission.studentId).startsWith('guest-') || !requesterId;
        if (!isOwner && !isAdmin && !isGuest) {
            res.status(403).json({
                success: false,
                message: 'Access Denied: You are not authorized to access this submission’s solutions.'
            });
            return;
        }
        if (!submission.solutionSchedule.enabled) {
            res.status(400).json({
                success: false,
                message: 'Scheduled solution release is disabled for this test.'
            });
            return;
        }
        // Strict Server-Side Time Enforcement
        const now = new Date();
        const unlockTime = new Date(submission.solutionSchedule.solutionUnlockAt);
        if (now.getTime() < unlockTime.getTime()) {
            res.status(403).json({
                success: false,
                isUnlocked: false,
                message: `Solutions are locked. They will automatically unlock on ${unlockTime.toLocaleString('en-IN')}`,
                solutionUnlockAt: unlockTime,
                submittedAt: submission.submittedAt,
                releaseDelayHours: submission.solutionSchedule.releaseDelayHours,
                hasPdf: Boolean(submission.solutionSchedule.pdfSolutionUrl),
                hasVideo: Boolean(submission.solutionSchedule.videoSolutionUrl)
            });
            return;
        }
        // Unlocked! Always use configured URLs (fallback to submission snapshot if test changed)
        const test = await TestSeries.findOne({ id: submission.testId });
        const pdfUrl = test?.solutionRelease?.pdfUrl || submission.solutionSchedule.pdfSolutionUrl || '';
        const videoUrl = test?.solutionRelease?.videoUrl || submission.solutionSchedule.videoSolutionUrl || '';
        // Mark as UNLOCKED in DB
        if (submission.solutionSchedule.releaseStatus !== 'UNLOCKED') {
            submission.solutionSchedule.releaseStatus = 'UNLOCKED';
            await submission.save().catch(() => { });
        }
        // Collect question-level solutions for difficult questions
        const questionSolutions = (test?.questions || [])
            .map((q) => ({
            questionId: q.id || q._id,
            questionNumber: q.questionNumber,
            videoSolutionUrl: q.videoSolutionUrl || undefined,
            pdfSolutionUrl: q.pdfSolutionUrl || undefined
        }))
            .filter((q) => q.videoSolutionUrl || q.pdfSolutionUrl);
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
                questionSolutions: questionSolutions.length > 0 ? questionSolutions : undefined
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
        const { paymentId, studentId } = req.body;
        const studentIdentifier = studentId || req.user?.id || req.user?._id?.toString();
        const test = await TestSeries.findOne({
            $or: [{ id }, { slug: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
        });
        if (!test) {
            res.status(404).json({ success: false, message: 'Test Series not found' });
            return;
        }
        if (studentIdentifier) {
            if (!Array.isArray(test.unlockedStudents)) {
                test.unlockedStudents = [];
            }
            if (!test.unlockedStudents.includes(studentIdentifier)) {
                test.unlockedStudents.push(studentIdentifier);
                await test.save();
            }
        }
        res.status(200).json({
            success: true,
            message: 'Test Series unlocked successfully',
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
