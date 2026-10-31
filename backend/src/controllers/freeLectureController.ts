import type { Request, Response } from 'express';
import { FreeLecture, type IFreeLecture } from '../models/FreeLecture.js';
import {
  broadcastFreeLectureCreated,
  broadcastFreeLectureUpdated,
  broadcastFreeLectureDeleted
} from '../sockets/socket.js';

const SEED_FREE_LECTURES = [
  // Track 1: Mathematics - Differential Calculus Shortcuts
  {
    id: 'lec-math-01',
    title: 'Lecture 1: Limits & Indeterminate Forms — 20s Inspection Rule',
    subject: 'Mathematics',
    trackId: 'free-math-calculus-shortcuts',
    trackTitle: 'Differential Calculus Shortcuts',
    order: 1,
    duration: '54 min',
    isFree: true,
    price: 0,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-01: Limits & L-Hopital Shortcuts',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Dharmendra Kumar (DK Sir)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 12 & Dropper',
    description: 'Master DK Sir 20-second visual inspection technique for indeterminate forms 0/0 and ∞/∞.',
    status: 'Published'
  },
  {
    id: 'lec-math-02',
    title: 'Lecture 2: Continuity & Differentiability — Graphical Edge Cases',
    subject: 'Mathematics',
    trackId: 'free-math-calculus-shortcuts',
    trackTitle: 'Differential Calculus Shortcuts',
    order: 2,
    duration: '58 min',
    isFree: true,
    price: 0,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-02: Non-Differentiable Cusps & Corners',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Dharmendra Kumar (DK Sir)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 12 & Dropper',
    description: 'Detecting cusps, node points, and corner discontinuities without tedious algebra.',
    status: 'Published'
  },
  {
    id: 'lec-math-03',
    title: 'Lecture 3: Definite Integration — King & Queen Property Shortcuts',
    subject: 'Mathematics',
    trackId: 'free-math-calculus-shortcuts',
    trackTitle: 'Differential Calculus Shortcuts',
    order: 3,
    duration: '62 min',
    isFree: true,
    price: 0,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-03: Definite Integral Symmetry Drills',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Dharmendra Kumar (DK Sir)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 12 & Dropper',
    description: 'Symmetry folding, interval transformation, and instant evaluation methods.',
    status: 'Published'
  },
  {
    id: 'lec-math-04',
    title: 'Lecture 4: Leibniz Rule & Differential Equations Formation',
    subject: 'Mathematics',
    trackId: 'free-math-calculus-shortcuts',
    trackTitle: 'Differential Calculus Shortcuts',
    order: 4,
    duration: '51 min',
    isFree: true,
    price: 0,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-04: Variable Separable & Integrating Factors',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Dharmendra Kumar (DK Sir)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 12 & Dropper',
    description: 'Differentiating under integral signs and forming differential equations in 3 lines.',
    status: 'Published'
  },
  {
    id: 'lec-math-05',
    title: 'Lecture 5: Maxima & Minima Optimization Problems without Second Derivative',
    subject: 'Mathematics',
    trackId: 'free-math-calculus-shortcuts',
    trackTitle: 'Differential Calculus Shortcuts',
    order: 5,
    duration: '59 min',
    isFree: true,
    price: 0,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-05: Optimization & Tangent Constraints',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Dharmendra Kumar (DK Sir)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 12 & Dropper',
    description: 'First derivative sign changes and geometric symmetry for word problems.',
    status: 'Published'
  },
  // Paid lectures 6 to 10 for Math
  {
    id: 'lec-math-06',
    title: 'Lecture 6: Area Under Curves & Bounding Polygons (Full Batch)',
    subject: 'Mathematics',
    trackId: 'free-math-calculus-shortcuts',
    trackTitle: 'Differential Calculus Shortcuts',
    order: 6,
    duration: '65 min',
    isFree: false,
    price: 499,
    discountPrice: 999,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-06: Parabola-Line Intersections',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Dharmendra Kumar (DK Sir)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 12 & Dropper',
    description: 'Premium masterclass covering Archimedes parabola area formula and fast integration.',
    status: 'Published'
  },
  {
    id: 'lec-math-07',
    title: 'Lecture 7: Vector Calculus & 3D Geometry Projections (Full Batch)',
    subject: 'Mathematics',
    trackId: 'free-math-calculus-shortcuts',
    trackTitle: 'Differential Calculus Shortcuts',
    order: 7,
    duration: '70 min',
    isFree: false,
    price: 499,
    discountPrice: 999,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-07: Coplanarity & Shortest Distance',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Dharmendra Kumar (DK Sir)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 12 & Dropper',
    description: 'Shortest distance between skew lines and scalar triple product matrix tricks.',
    status: 'Published'
  },
  {
    id: 'lec-math-08',
    title: 'Lecture 8: Complex Numbers Geometry & De Moivre (Full Batch)',
    subject: 'Mathematics',
    trackId: 'free-math-calculus-shortcuts',
    trackTitle: 'Differential Calculus Shortcuts',
    order: 8,
    duration: '68 min',
    isFree: false,
    price: 499,
    discountPrice: 999,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-08: Argand Planes & Rotation Theorem',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Dharmendra Kumar (DK Sir)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 12 & Dropper',
    description: 'Euler form, rotation theorem in Argand plane and nth roots of unity.',
    status: 'Published'
  },
  {
    id: 'lec-math-09',
    title: 'Lecture 9: Probability & Bayes Theorem Tree Method (Full Batch)',
    subject: 'Mathematics',
    trackId: 'free-math-calculus-shortcuts',
    trackTitle: 'Differential Calculus Shortcuts',
    order: 9,
    duration: '60 min',
    isFree: false,
    price: 499,
    discountPrice: 999,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-09: Conditional Probability Matrices',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Dharmendra Kumar (DK Sir)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 12 & Dropper',
    description: 'Conditional probability, total probability and Bayes formula fast tree methods.',
    status: 'Published'
  },
  {
    id: 'lec-math-10',
    title: 'Lecture 10: JEE Advanced Multi-Concept Calculus Sprint (Full Batch)',
    subject: 'Mathematics',
    trackId: 'free-math-calculus-shortcuts',
    trackTitle: 'Differential Calculus Shortcuts',
    order: 10,
    duration: '75 min',
    isFree: false,
    price: 599,
    discountPrice: 1199,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-10: Advanced Mixed Problems Master Sheet',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Dharmendra Kumar (DK Sir)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 12 & Dropper',
    description: 'Rank booster multi-concept problem sprint solving previous 10-year IIT dilemmas.',
    status: 'Published'
  },

  // Track 2: Physics - Mechanics Mastery
  {
    id: 'lec-phys-01',
    title: "Lecture 1: Newton's Laws & Constraint Relations (String & Wedge)",
    subject: 'Physics',
    trackId: 'free-physics-mechanics-mastery',
    trackTitle: 'Mechanics Mastery & Kinematics',
    order: 1,
    duration: '56 min',
    isFree: true,
    price: 0,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-01: Pulley Constraints & Virtual Work',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Senior Physics Faculty (Ex-IITian)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 11 & 12',
    description: 'Virtual work method and tension dot product for complex multi-pulley systems.',
    status: 'Published'
  },
  {
    id: 'lec-phys-02',
    title: 'Lecture 2: Friction & Pseudo-Force in Non-Inertial Frames',
    subject: 'Physics',
    trackId: 'free-physics-mechanics-mastery',
    trackTitle: 'Mechanics Mastery & Kinematics',
    order: 2,
    duration: '52 min',
    isFree: true,
    price: 0,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-02: Two-Block Friction & Wedges',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Senior Physics Faculty (Ex-IITian)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 11 & 12',
    description: 'Two-block and three-block friction thresholds under accelerated frames.',
    status: 'Published'
  },
  {
    id: 'lec-phys-03',
    title: 'Lecture 3: Work-Energy Theorem & Conservative Field Potential Wells',
    subject: 'Physics',
    trackId: 'free-physics-mechanics-mastery',
    trackTitle: 'Mechanics Mastery & Kinematics',
    order: 3,
    duration: '60 min',
    isFree: true,
    price: 0,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-03: Variable Force Work & Springs',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Senior Physics Faculty (Ex-IITian)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 11 & 12',
    description: 'Potential energy graphs U(x), equilibrium points, and conservative line integrals.',
    status: 'Published'
  },
  {
    id: 'lec-phys-04',
    title: 'Lecture 4: Center of Mass Velocity, Truncated Bodies & Momentum Conservation',
    subject: 'Physics',
    trackId: 'free-physics-mechanics-mastery',
    trackTitle: 'Mechanics Mastery & Kinematics',
    order: 4,
    duration: '57 min',
    isFree: true,
    price: 0,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-04: Explosion & Collision Kinetics',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Senior Physics Faculty (Ex-IITian)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 11 & 12',
    description: 'Negative mass method for truncated discs/spheres and impulse-momentum theorem.',
    status: 'Published'
  },
  {
    id: 'lec-phys-05',
    title: 'Lecture 5: Rotational Kinematics & Instantaneous Center of Zero Velocity',
    subject: 'Physics',
    trackId: 'free-physics-mechanics-mastery',
    trackTitle: 'Mechanics Mastery & Kinematics',
    order: 5,
    duration: '64 min',
    isFree: true,
    price: 0,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-05: Pure Rolling & Slipping Transitions',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Senior Physics Faculty (Ex-IITian)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 11 & 12',
    description: 'Instantaneous axis of rotation (ICOR) for fast rolling without slipping solutions.',
    status: 'Published'
  },
  // Paid lectures 6 to 10 for Physics
  {
    id: 'lec-phys-06',
    title: 'Lecture 6: Moment of Inertia Tensor & Parallel Axis Shortcuts (Full Batch)',
    subject: 'Physics',
    trackId: 'free-physics-mechanics-mastery',
    trackTitle: 'Mechanics Mastery & Kinematics',
    order: 6,
    duration: '62 min',
    isFree: false,
    price: 499,
    discountPrice: 999,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-06: Composite Bodies MOI',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Senior Physics Faculty (Ex-IITian)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 11 & 12',
    description: 'Parallel and perpendicular axes theorems applied to 3D composite structures.',
    status: 'Published'
  },

  // Track 3: Chemistry - General Organic Chemistry (GOC) Mechanisms
  {
    id: 'lec-chem-01',
    title: 'Lecture 1: Electronic Displacement Effects (Inductive, Hyperconjugation & Mesomeric)',
    subject: 'Chemistry',
    trackId: 'free-chemistry-goc-mechanisms',
    trackTitle: 'GOC Reaction Mechanisms',
    order: 1,
    duration: '53 min',
    isFree: true,
    price: 0,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-01: Carbocation & Free Radical Stabilities',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Senior Chemistry Faculty (Ex-IITian)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 11 & 12',
    description: 'Stability hierarchy of reaction intermediates (+I, -I, +M, -M and hyperconjugation).',
    status: 'Published'
  },
  {
    id: 'lec-chem-02',
    title: 'Lecture 2: Aromaticity, Anti-Aromaticity & Hückel (4n+2) Annulene Exceptions',
    subject: 'Chemistry',
    trackId: 'free-chemistry-goc-mechanisms',
    trackTitle: 'GOC Reaction Mechanisms',
    order: 2,
    duration: '49 min',
    isFree: true,
    price: 0,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-02: Heterocyclic Ring Aromaticity',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Senior Chemistry Faculty (Ex-IITian)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 11 & 12',
    description: 'Hückel rule, tub conformations of cyclooctatetraene, and tropylium ion stability.',
    status: 'Published'
  },
  {
    id: 'lec-chem-03',
    title: 'Lecture 3: Acidic & Basic Strengths in Substituted Benzenes (Ortho & SIR Effect)',
    subject: 'Chemistry',
    trackId: 'free-chemistry-goc-mechanisms',
    trackTitle: 'GOC Reaction Mechanisms',
    order: 3,
    duration: '57 min',
    isFree: true,
    price: 0,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-03: pKa Comparison & Basicity Orders',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Senior Chemistry Faculty (Ex-IITian)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 11 & 12',
    description: 'Steric inhibition of resonance (SIR) and ortho-effect on benzoic acids and anilines.',
    status: 'Published'
  },
  {
    id: 'lec-chem-04',
    title: 'Lecture 4: Nucleophilic Substitution Mechanisms: SN1 vs SN2 Kinetic Profiles',
    subject: 'Chemistry',
    trackId: 'free-chemistry-goc-mechanisms',
    trackTitle: 'GOC Reaction Mechanisms',
    order: 4,
    duration: '63 min',
    isFree: true,
    price: 0,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-04: Stereochemical Inversion & Retention',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Senior Chemistry Faculty (Ex-IITian)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 11 & 12',
    description: 'Walden inversion, solvent polarity influence, and substrate steric hindrance.',
    status: 'Published'
  },
  {
    id: 'lec-chem-05',
    title: 'Lecture 5: Elimination Reactions: E1, E2 & E1cB Regioselectivity (Saytzeff vs Hofmann)',
    subject: 'Chemistry',
    trackId: 'free-chemistry-goc-mechanisms',
    trackTitle: 'GOC Reaction Mechanisms',
    order: 5,
    duration: '55 min',
    isFree: true,
    price: 0,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-05: Dehydrohalogenation Substrates',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Senior Chemistry Faculty (Ex-IITian)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 11 & 12',
    description: 'Anti-periplanar geometry requirement for E2 and poor leaving group E1cB pathways.',
    status: 'Published'
  },
  // Paid lectures 6 for Chemistry
  {
    id: 'lec-chem-06',
    title: 'Lecture 6: Electrophilic Aromatic Substitution (EAS) Regiospecificity (Full Batch)',
    subject: 'Chemistry',
    trackId: 'free-chemistry-goc-mechanisms',
    trackTitle: 'GOC Reaction Mechanisms',
    order: 6,
    duration: '62 min',
    isFree: false,
    price: 499,
    discountPrice: 999,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/img/dk-sir.jpg',
    dppName: 'DPP-06: Friedel-Crafts Alkylation & Acylation',
    dppUrl: '/sample-dpp.pdf',
    notesPdfUrl: '/sample-notes.pdf',
    facultyName: 'Senior Chemistry Faculty (Ex-IITian)',
    targetExam: 'JEE Main & Advanced 2026/27',
    targetClass: 'Class 11 & 12',
    description: 'Friedel-Crafts carbocation rearrangements and directing effects of halogens.',
    status: 'Published'
  }
];

// Helper to seed default lectures if collection is empty
const ensureSeedData = async (): Promise<void> => {
  const count = await FreeLecture.countDocuments({});
  if (count === 0) {
    console.log('[FreeLecture] Seeding initial 17 Kota demo masterclasses with 5-free rule...');
    await FreeLecture.insertMany(SEED_FREE_LECTURES);
  }
};

/**
 * GET /api/v1/free-lectures
 * Query params: subject, trackId, isFree, search, status
 */
export const getFreeLectures = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureSeedData();

    const { subject, trackId, isFree, search, status } = req.query;
    const filter: any = {};

    if (subject && subject !== 'All') {
      filter.subject = subject;
    }
    if (trackId && trackId !== 'All') {
      filter.trackId = trackId;
    }
    if (isFree !== undefined && isFree !== '') {
      filter.isFree = isFree === 'true';
    }
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { trackTitle: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { dppName: { $regex: q, $options: 'i' } }
      ];
    }

    const lectures = await FreeLecture.find(filter).sort({ trackId: 1, order: 1 });

    const totalLectures = await FreeLecture.countDocuments({});
    const freeCount = await FreeLecture.countDocuments({ isFree: true });
    const paidCount = await FreeLecture.countDocuments({ isFree: false });

    res.status(200).json({
      success: true,
      data: lectures,
      summary: {
        total: totalLectures,
        freeCount,
        paidCount
      }
    });
  } catch (error: any) {
    console.error('Error fetching free lectures:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch free lectures', details: error.message });
  }
};

/**
 * GET /api/v1/free-lectures/:id
 */
export const getFreeLectureById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const lecture = await FreeLecture.findOne({ $or: [{ id }, { _id: id }] });

    if (!lecture) {
      res.status(404).json({ success: false, error: 'Lecture not found' });
      return;
    }

    res.status(200).json({ success: true, data: lecture });
  } catch (error: any) {
    console.error('Error fetching lecture by id:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lecture', details: error.message });
  }
};

/**
 * POST /api/v1/free-lectures
 * Create a new video lecture with free/paid rule and pricing
 */
export const createFreeLecture = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      subject = 'Mathematics',
      trackId = 'free-math-calculus-shortcuts',
      trackTitle = 'Differential Calculus Shortcuts',
      order,
      duration = '45 min',
      isFree,
      price = 0,
      discountPrice = 0,
      videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnailUrl = '/img/dk-sir.jpg',
      dppName,
      dppUrl,
      notesPdfUrl,
      facultyName = 'Dharmendra Kumar (DK Sir)',
      targetExam = 'JEE Main & Advanced 2026/27',
      targetClass = 'Class 11 & 12',
      description,
      tags,
      badge,
      status = 'Published'
    } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ success: false, error: 'Lecture title is required' });
      return;
    }

    // Determine order if not specified
    let lectureOrder = Number(order);
    if (!lectureOrder || isNaN(lectureOrder)) {
      const highestOrder = await FreeLecture.findOne({ trackId }).sort({ order: -1 });
      lectureOrder = highestOrder ? highestOrder.order + 1 : 1;
    }

    // Free vs Paid policy: If order <= 5 and isFree not explicitly set false, default to free
    const finalIsFree = isFree !== undefined ? Boolean(isFree) : lectureOrder <= 5;
    const finalPrice = finalIsFree ? 0 : Number(price) || 499;

    const generatedId = `lec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newLecture = new FreeLecture({
      id: generatedId,
      title: title.trim(),
      subject,
      trackId,
      trackTitle,
      order: lectureOrder,
      duration,
      isFree: finalIsFree,
      price: finalPrice,
      discountPrice: Number(discountPrice) || (finalIsFree ? 0 : 999),
      videoUrl,
      thumbnailUrl,
      dppName: dppName || `DPP-0${lectureOrder}: Practice Sheet`,
      dppUrl: dppUrl || '/sample-dpp.pdf',
      notesPdfUrl: notesPdfUrl || '/sample-notes.pdf',
      facultyName,
      targetExam,
      targetClass,
      description: description || '',
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      badge: badge || '',
      status
    });

    const saved = await newLecture.save();
    broadcastFreeLectureCreated(saved);

    res.status(201).json({ success: true, message: 'Lecture created successfully', data: saved });
  } catch (error: any) {
    console.error('Error creating free lecture:', error);
    res.status(500).json({ success: false, error: 'Failed to create lecture', details: error.message });
  }
};

/**
 * PUT /api/v1/free-lectures/:id
 * Update an existing video lecture (including free/paid toggle and pricing)
 */
export const updateFreeLecture = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };

    // If toggling to free, reset price to 0
    if (payload.isFree === true) {
      payload.price = 0;
      payload.discountPrice = 0;
    } else if (payload.isFree === false && (!payload.price || Number(payload.price) === 0)) {
      payload.price = 499;
    }

    const updated = await FreeLecture.findOneAndUpdate(
      { $or: [{ id }, { _id: id }] },
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, error: 'Lecture not found' });
      return;
    }

    broadcastFreeLectureUpdated(updated);
    res.status(200).json({ success: true, message: 'Lecture updated successfully', data: updated });
  } catch (error: any) {
    console.error('Error updating free lecture:', error);
    res.status(500).json({ success: false, error: 'Failed to update lecture', details: error.message });
  }
};

/**
 * DELETE /api/v1/free-lectures/:id
 * Delete a video lecture
 */
export const deleteFreeLecture = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await FreeLecture.findOneAndDelete({ $or: [{ id }, { _id: id }] });

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Lecture not found' });
      return;
    }

    broadcastFreeLectureDeleted(deleted.id || String(id));
    res.status(200).json({ success: true, message: 'Lecture deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting free lecture:', error);
    res.status(500).json({ success: false, error: 'Failed to delete lecture', details: error.message });
  }
};

/**
 * POST /api/v1/free-lectures/enforce-5-free
 * Automatically enforces the "First 5 Videos Free, remainder Paid" rule
 */
export const enforce5FreeRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackId } = req.body;
    const filter = trackId ? { trackId } : {};

    const tracks = await FreeLecture.distinct('trackId', filter);

    let updatedCount = 0;
    for (const tid of tracks) {
      const lectures = await FreeLecture.find({ trackId: tid }).sort({ order: 1 });
      for (let i = 0; i < lectures.length; i++) {
        const isFree = i < 5;
        const price = isFree ? 0 : (lectures[i].price > 0 ? lectures[i].price : 499);
        await FreeLecture.updateOne(
          { _id: lectures[i]._id },
          { $set: { isFree, price, order: i + 1 } }
        );
        updatedCount++;
      }
    }

    const allLectures = await FreeLecture.find({}).sort({ trackId: 1, order: 1 });

    res.status(200).json({
      success: true,
      message: `Enforced 5-free rule across ${tracks.length} track(s). Updated ${updatedCount} lectures.`,
      data: allLectures
    });
  } catch (error: any) {
    console.error('Error enforcing 5-free rule:', error);
    res.status(500).json({ success: false, error: 'Failed to enforce 5-free rule', details: error.message });
  }
};
