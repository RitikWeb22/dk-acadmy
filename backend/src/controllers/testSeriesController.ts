import type { Request, Response } from 'express';
import { TestSeries } from '../models/TestSeries.js';
import {
  broadcastTestSeriesCreated,
  broadcastTestSeriesUpdated,
  broadcastTestSeriesDeleted
} from '../sockets/socket.js';

// Default starter dataset if DB is empty
const SEED_TEST_SERIES = [
  {
    id: 'test-ja-coord-geom-01',
    title: 'JEE Advanced Specialist: Coordinate Geometry & Vectors',
    subtitle: 'Focused practice on conic sections, straight lines, circles, planes, and 3D geometry.',
    slug: 'jee-advanced-specialist-coordinate-geometry-vectors',
    badgeCode: 'JEE ADVANCED',
    examType: 'JEE Advanced',
    format: 'Part Test',
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
    attemptsCount: 0,
    totalTests: 1,
    testsBreakdown: { published: 0, draft: 0, scheduled: 1 }
  }
];

export const getAllTestSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { examType, format, status, search } = req.query;
    const filter: any = {};

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

    let items = await TestSeries.find(filter).sort({ createdAt: -1 });

    // Ensure all 12 starter test series exist if database has fewer
    if (items.length < SEED_TEST_SERIES.length && Object.keys(filter).length === 0) {
      for (const seed of SEED_TEST_SERIES) {
        await TestSeries.findOneAndUpdate(
          { slug: seed.slug },
          seed,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      items = await TestSeries.find({}).sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error: any) {
    console.error('[getAllTestSeries Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTestSeriesByIdOrSlug = async (req: Request, res: Response): Promise<void> => {
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
      res.status(404).json({ success: false, message: 'Test Series not found' });
      return;
    }

    res.status(200).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTestSeries = async (req: Request, res: Response): Promise<void> => {
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

    // Set badge code
    if (!payload.badgeCode) {
      payload.badgeCode =
        payload.examType === 'JEE Advanced'
          ? 'JEE ADVANCED'
          : payload.examType === 'BITSAT'
          ? 'BITSAT'
          : 'JEE MAIN';
    }

    // Calculate totals
    if (Array.isArray(payload.questions)) {
      payload.totalQuestions = payload.questions.length;
      if (!payload.totalMarks || payload.totalMarks === 0) {
        const posMark = payload.markingScheme?.correct || 4;
        payload.totalMarks = payload.questions.length * posMark;
      }
    }

    // Check if test series with this id or slug already exists
    const existing = await TestSeries.findOne({
      $or: [{ id: payload.id }, { slug: payload.slug }]
    });

    if (existing) {
      const updated = await TestSeries.findByIdAndUpdate(existing._id, payload, {
        new: true,
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
  } catch (error: any) {
    console.error('[createTestSeries Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTestSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const param = String(req.params.id);
    const updates = { ...req.body };

    const updated = await TestSeries.findOneAndUpdate(
      {
        $or: [
          { id: param },
          { slug: param },
          { _id: param.match(/^[0-9a-fA-F]{24}$/) ? param : null }
        ]
      },
      updates,
      { new: true, runValidators: true }
    );

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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTestSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const param = String(req.params.id);

    const deleted = await TestSeries.findOneAndDelete({
      $or: [
        { id: param },
        { slug: param },
        { _id: param.match(/^[0-9a-fA-F]{24}$/) ? param : null }
      ]
    });

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Test Series not found' });
      return;
    }

    broadcastTestSeriesDeleted(deleted.id || String(deleted._id));

    res.status(200).json({
      success: true,
      message: 'Test Series deleted successfully',
      id: deleted.id
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
