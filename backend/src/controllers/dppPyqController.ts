import type { Request, Response } from 'express';
import { DppPyq } from '../models/DppPyq.js';
import {
  broadcastDppPyqCreated,
  broadcastDppPyqUpdated,
  broadcastDppPyqDeleted
} from '../sockets/socket.js';

const SEED_QUESTIONS = [
  {
    id: 'q-sample-1',
    qNum: 1,
    statement:
      'In SN2 nucleophilic substitution reaction at an asymmetric carbon, the absolute stereochemical outcome and transition state geometry involve:',
    topic: 'Reaction Mechanism',
    options: [
      { key: 'A', text: '100% inversion of configuration with trigonal bipyramidal transition state' },
      { key: 'B', text: 'Complete retention of configuration via frontside attack' },
      { key: 'C', text: 'Racemization via planar carbocation intermediate' },
      { key: 'D', text: '50% retention and 50% elimination product' }
    ],
    correctKey: 'A',
    dkSirShortcut: 'DK Sir Rule: SN2 = Backside Attack = Walden Inversion! Always count 5-coordinate T.S.',
    stepSolution:
      'In SN2 mechanism, the attacking nucleophile enters from the opposite face to the leaving group (180° angle). This forces inversion of configuration at the stereocenter and passes through a pentacoordinate trigonal bipyramidal transition state.',
    difficulty: 'Moderate'
  },
  {
    id: 'q-sample-2',
    qNum: 2,
    statement:
      'A uniform solid cylinder of mass M and radius R rolls without slipping down an inclined plane of inclination θ. The magnitude of frictional force acting on it is:',
    topic: 'Rotational Dynamics',
    options: [
      { key: 'A', text: '(1/3) M g sin θ' },
      { key: 'B', text: '(1/2) M g sin θ' },
      { key: 'C', text: '(2/3) M g sin θ' },
      { key: 'D', text: 'M g sin θ' }
    ],
    correctKey: 'A',
    dkSirShortcut: 'DK Sir Rotational Shortcut: f = (I_cm / (I_cm + M*R^2)) * M*g*sinθ. For solid cylinder, fraction = (1/2)/(3/2) = 1/3!',
    stepSolution:
      'Using translational equation: M*g*sinθ - f = M*a. Using rotational equation about CM: f*R = I*α = (1/2)*M*R^2*(a/R) ⇒ f = (1/2)*M*a. Solving both yields f = (1/3)*M*g*sinθ.',
    difficulty: 'Moderate'
  },
  {
    id: 'q-sample-3',
    qNum: 3,
    statement:
      'Evaluate the definite integral: I = ∫[0 to π] (x * sin x) / (1 + cos² x) dx. The exact value of I is:',
    topic: 'Definite Integration',
    options: [
      { key: 'A', text: 'π² / 4' },
      { key: 'B', text: 'π² / 2' },
      { key: 'C', text: 'π / 4' },
      { key: 'D', text: 'π² / 8' }
    ],
    correctKey: 'A',
    dkSirShortcut: "DK Sir King's Property: When x is multiplied by f(sin x), Integral = (π / 2) * ∫[0 to π] (sin x)/(1 + cos²x) dx = π²/4 in 20 seconds!",
    stepSolution:
      "Apply King's property: I = ∫[0 to π] ((π - x) sin x)/(1 + cos²x) dx. Adding with original gives 2I = π * ∫[0 to π] sin x/(1 + cos²x) dx. Substitute u = cos x, du = -sin x dx ⇒ I = π²/4.",
    difficulty: 'Challenging',
    examYear: 'JEE Main 2024'
  },
  {
    id: 'q-sample-4',
    qNum: 4,
    statement:
      'If the vectors a = 2i - j + k, b = i + 2j - 3k, and c = 3i + λj + 5k are coplanar, then the scalar parameter λ equals:',
    topic: 'Vectors & 3D',
    options: [
      { key: 'A', text: '-4' },
      { key: 'B', text: '2' },
      { key: 'C', text: '-2' },
      { key: 'D', text: '4' }
    ],
    correctKey: 'A',
    dkSirShortcut: 'DK Sir Determinant Rule: For coplanar vectors, scalar triple product [a b c] = 0. Expand 3x3 determinant quickly along row 1.',
    stepSolution:
      'Determinant | 2, -1, 1 | | 1, 2, -3 | | 3, λ, 5 | = 2(10 + 3λ) - (-1)(5 - (-9)) + 1(λ - 6) = 7λ + 28 = 0 ⇒ λ = -4.',
    difficulty: 'Easy'
  }
];

const SEED_DPP_PYQ_ITEMS = [
  {
    id: 'dpp-pyq-1',
    badgeCode: 'DPP • CHM',
    title: 'DPP-02: Organic Reaction Pathways & Inversion',
    slug: 'dpp-02-organic-reaction-pathways',
    moduleType: 'DPP',
    subject: 'Chemistry',
    categoryLabel: 'Chemistry DPP',
    questionsCount: 4,
    solutionNote: '4 with video solution',
    status: 'Published',
    attemptsCount: 1420,
    questions: SEED_QUESTIONS
  },
  {
    id: 'dpp-pyq-2',
    badgeCode: 'DPP • PHY',
    title: 'DPP-01: Rotational Dynamics & Rolling Constraints',
    slug: 'dpp-01-rotational-dynamics',
    moduleType: 'DPP',
    subject: 'Physics',
    categoryLabel: 'Physics DPP',
    questionsCount: 5,
    solutionNote: '5 with step PDF',
    status: 'Published',
    attemptsCount: 1890,
    questions: SEED_QUESTIONS
  },
  {
    id: 'dpp-pyq-3',
    badgeCode: 'PYQ • MTH',
    title: 'JEE Main 2018–2025: Definite Integration Archive',
    slug: 'pyq-maths-definite-integration',
    moduleType: 'PYQ',
    subject: 'Mathematics',
    categoryLabel: 'Maths PYQ',
    questionsCount: 25,
    solutionNote: '25 with DK Sir 20s tricks',
    status: 'Published',
    attemptsCount: 2450,
    questions: SEED_QUESTIONS
  },
  {
    id: 'dpp-pyq-4',
    badgeCode: 'BITSAT',
    title: 'BITSAT 2026 Speed Drill 03: Calculus & Vectors',
    slug: 'bitsat-2026-speed-drill-03',
    moduleType: 'BITSAT',
    subject: 'Mathematics',
    categoryLabel: 'BITSAT Speed Drill',
    questionsCount: 30,
    solutionNote: 'Strict 45s timer logic',
    status: 'Published',
    attemptsCount: 1640,
    questions: SEED_QUESTIONS
  },
  {
    id: 'dpp-pyq-5',
    badgeCode: 'DPP • MTH',
    title: 'DPP-04: Complex Numbers & Geometry of Circles',
    slug: 'dpp-04-complex-numbers',
    moduleType: 'DPP',
    subject: 'Mathematics',
    categoryLabel: 'Maths DPP',
    questionsCount: 6,
    solutionNote: 'Drafting answer keys',
    status: 'Draft',
    attemptsCount: 0,
    questions: SEED_QUESTIONS
  },
  {
    id: 'dpp-pyq-6',
    badgeCode: 'BITSAT',
    title: 'BITSAT Full Syllabus Speed Drill 04',
    slug: 'bitsat-speed-drill-04',
    moduleType: 'BITSAT',
    subject: 'Mixed',
    categoryLabel: 'BITSAT Speed Drill',
    questionsCount: 30,
    solutionNote: 'Ready for auto-release',
    status: 'Scheduled',
    scheduledDate: '30 Oct 2026 • 09:00 AM',
    attemptsCount: 0,
    questions: SEED_QUESTIONS
  },
  {
    id: 'dpp-pyq-7',
    badgeCode: 'PYQ • PHY',
    title: 'JEE Advanced 10-Year Mechanics Archive',
    slug: 'pyq-physics-jee-advanced-mechanics',
    moduleType: 'PYQ',
    subject: 'Physics',
    categoryLabel: 'Physics PYQ',
    questionsCount: 35,
    solutionNote: '35 published',
    status: 'Published',
    attemptsCount: 1540,
    questions: SEED_QUESTIONS
  },
  {
    id: 'dpp-pyq-8',
    badgeCode: 'DPP • CHM',
    title: 'DPP-03: Coordination Compounds & Isomerism',
    slug: 'dpp-03-coordination-compounds',
    moduleType: 'DPP',
    subject: 'Chemistry',
    categoryLabel: 'Chemistry DPP',
    questionsCount: 8,
    solutionNote: 'Pending diagrams',
    status: 'Draft',
    attemptsCount: 0,
    questions: SEED_QUESTIONS
  },
  {
    id: 'dpp-pyq-9',
    badgeCode: 'PYQ • CHM',
    title: 'JEE Main 2019–2025: Chemical Thermodynamics Archives',
    slug: 'pyq-chem-thermodynamics',
    moduleType: 'PYQ',
    subject: 'Chemistry',
    categoryLabel: 'Chemistry PYQ',
    questionsCount: 22,
    solutionNote: '22 with enthalpy shortcuts',
    status: 'Published',
    attemptsCount: 1120,
    questions: SEED_QUESTIONS
  },
  {
    id: 'dpp-pyq-10',
    badgeCode: 'DPP • PHY',
    title: 'DPP-03: Electrostatics, Gauss Law & Dipole Potentials',
    slug: 'dpp-03-electrostatics',
    moduleType: 'DPP',
    subject: 'Physics',
    categoryLabel: 'Physics DPP',
    questionsCount: 10,
    solutionNote: '10 with detailed video solutions',
    status: 'Published',
    attemptsCount: 1320,
    questions: SEED_QUESTIONS
  },
  {
    id: 'dpp-pyq-11',
    badgeCode: 'BITSAT',
    title: 'BITSAT 2026 Physics Rapid Fire: Optics & Modern Physics',
    slug: 'bitsat-rapid-fire-optics',
    moduleType: 'BITSAT',
    subject: 'Physics',
    categoryLabel: 'BITSAT Speed Drill',
    questionsCount: 25,
    solutionNote: 'Speed timing test format',
    status: 'Scheduled',
    scheduledDate: '05 Nov 2026 • 10:00 AM',
    attemptsCount: 0,
    questions: SEED_QUESTIONS
  },
  {
    id: 'dpp-pyq-12',
    badgeCode: 'DPP • MTH',
    title: 'DPP-05: Probability, Bayes Theorem & Binomial Distributions',
    slug: 'dpp-05-probability',
    moduleType: 'DPP',
    subject: 'Mathematics',
    categoryLabel: 'Maths DPP',
    questionsCount: 12,
    solutionNote: 'Under faculty editorial review',
    status: 'Draft',
    attemptsCount: 0,
    questions: SEED_QUESTIONS
  }
];

export const getAllDppPyq = async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await DppPyq.countDocuments();
    if (count === 0) {
      console.log('[DppPyq] Database empty. Auto-seeding initial DPP & PYQ sets...');
      await DppPyq.insertMany(SEED_DPP_PYQ_ITEMS);
      console.log('[DppPyq] Successfully seeded initial problem sets.');
    }

    const { moduleType, subject, status, search } = req.query;
    const filter: any = {};

    if (moduleType && moduleType !== 'ALL') {
      filter.moduleType = moduleType;
    }
    if (subject && subject !== 'ALL') {
      filter.subject = subject;
    }
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (search && typeof search === 'string' && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { slug: { $regex: search.trim(), $options: 'i' } },
        { categoryLabel: { $regex: search.trim(), $options: 'i' } },
        { badgeCode: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const items = await DppPyq.find(filter).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error: any) {
    console.error('Error fetching DPP/PYQ items:', error);
    res.status(500).json({ error: 'Failed to fetch DPP/PYQ items', details: error.message });
  }
};

export const getDppPyqByIdOrSlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await DppPyq.findOne({
      $or: [{ id }, { slug: id }]
    });

    if (!item) {
      res.status(404).json({ error: 'DPP/PYQ item not found' });
      return;
    }

    res.status(200).json(item);
  } catch (error: any) {
    console.error('Error fetching DPP/PYQ item:', error);
    res.status(500).json({ error: 'Failed to fetch DPP/PYQ item', details: error.message });
  }
};

export const createDppPyq = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    if (!payload.title || !payload.title.trim()) {
      res.status(400).json({ error: 'Problem set title is required' });
      return;
    }

    const baseSlug = payload.slug
      ? payload.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const existingSlug = await DppPyq.findOne({ slug: baseSlug });
    const finalSlug = existingSlug ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const newItem = new DppPyq({
      ...payload,
      id: payload.id || `dpp-pyq-${Date.now()}`,
      slug: finalSlug,
      badgeCode:
        payload.badgeCode ||
        (payload.moduleType === 'BITSAT'
          ? 'BITSAT'
          : `${payload.moduleType} • ${payload.subject ? payload.subject.slice(0, 3).toUpperCase() : 'MTH'}`),
      categoryLabel:
        payload.categoryLabel ||
        `${payload.subject || 'Mathematics'} ${payload.moduleType || 'DPP'}`,
      questionsCount: payload.questions ? payload.questions.length : (payload.questionsCount || 0),
      attemptsCount: payload.attemptsCount || 0,
      status: payload.status || 'Published'
    });

    const saved = await newItem.save();
    broadcastDppPyqCreated(saved);
    res.status(201).json(saved);
  } catch (error: any) {
    console.error('Error creating DPP/PYQ item:', error);
    res.status(500).json({ error: 'Failed to create DPP/PYQ item', details: error.message });
  }
};

export const updateDppPyq = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.questions && Array.isArray(updates.questions)) {
      updates.questionsCount = updates.questions.length;
    }

    const updated = await DppPyq.findOneAndUpdate(
      { $or: [{ id }, { _id: id }] },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).json({ error: 'DPP/PYQ item not found' });
      return;
    }

    broadcastDppPyqUpdated(updated);
    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating DPP/PYQ item:', error);
    res.status(500).json({ error: 'Failed to update DPP/PYQ item', details: error.message });
  }
};

export const deleteDppPyq = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await DppPyq.findOneAndDelete({
      $or: [{ id }, { _id: id }]
    });

    if (!deleted) {
      res.status(404).json({ error: 'DPP/PYQ item not found' });
      return;
    }

    broadcastDppPyqDeleted(deleted.id || String(id));
    res.status(200).json({ success: true, message: 'DPP/PYQ set deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting DPP/PYQ item:', error);
    res.status(500).json({ error: 'Failed to delete DPP/PYQ item', details: error.message });
  }
};
