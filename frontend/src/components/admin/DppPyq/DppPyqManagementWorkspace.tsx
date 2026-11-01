import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  CheckCircle2,
  FileEdit,
  Calendar,
  UserCheck,
  Search,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Copy,
  ExternalLink,
  Zap,
  PauseCircle,
  Archive,
  Trash2,
  X,
  Clock,
  Crosshair,
  BookOpen,
  Filter,
  Check,
  AlertTriangle,
  Send,
  Sparkles,
  Download,
  Flame,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  FileText,
  RefreshCw,
  Loader2,
  Layers,
  Activity,
  Play,
  Video
} from 'lucide-react';
import styles from './DppPyqManagementWorkspace.module.scss';
import { apiClient } from '../../../services/apiClient';

export type ProblemModuleType = 'DPP' | 'PYQ' | 'BITSAT';
export type ProblemSubject = 'Mathematics' | 'Physics' | 'Chemistry' | 'Mixed';
export type ProblemStatus = 'Published' | 'Draft' | 'Scheduled' | 'Archived';

export interface ProblemQuestionItem {
  id: string;
  qNum: number;
  statement: string;
  topic: string;
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correctKey: 'A' | 'B' | 'C' | 'D';
  dkSirShortcut?: string;
  stepSolution: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  examYear?: string;
  isFree?: boolean;
  videoUrl?: string;
  pdfUrl?: string;
}

export interface DppPyqItem {
  id: string;
  _id?: string;
  indexNo: number;
  badgeCode: string; // e.g. "DPP • CHM", "DPP • PHY", "PYQ • MTH", "BITSAT"
  title: string;
  slug: string;
  moduleType: ProblemModuleType;
  subject: ProblemSubject;
  categoryLabel: string;
  chapter?: string;
  examTarget?: string;
  isFree?: boolean;
  price?: number;
  pdfUrl?: string;
  videoUrl?: string;
  videoWalkthroughUrl?: string;
  questionsCount: number;
  durationMinutes?: number;
  solutionNote: string;
  status: ProblemStatus;
  createdAtFormatted: string;
  createdAt?: string;
  scheduledDate?: string;
  attemptsCount: number;
  questions: ProblemQuestionItem[];
}

export const getSampleQuestionsForSubject = (
  subject: ProblemSubject,
  chapter?: string
): ProblemQuestionItem[] => {
  if (subject === 'Mathematics') {
    return [
      {
        id: `q-math-${Date.now()}-1`,
        qNum: 1,
        statement: 'A straight line L passing through the point P(2, 3) cuts the coordinate axes at A and B such that P divides AB internally in the ratio 1 : 2. If the line perpendicular to L passing through origin is y = mx, then value of m is:',
        topic: chapter || 'Straight Lines',
        options: [
          { key: 'A', text: '1/3' },
          { key: 'B', text: '4/3' },
          { key: 'C', text: '3/4' },
          { key: 'D', text: '-3/4' }
        ],
        correctKey: 'A',
        dkSirShortcut: 'DK Sir Section Formula: a = 3, b = 9. Slope of line = -3. Perpendicular slope m = 1/3 in 15s!',
        stepSolution: 'Let A=(a,0) and B=(0,b). Section formula gives a=3, b=9. Equation is x/3 + y/9 = 1 with slope -3. Perpendicular line slope is m = 1/3.',
        difficulty: 'Moderate',
        examYear: 'JEE Main 2024'
      },
      {
        id: `q-math-${Date.now()}-2`,
        qNum: 2,
        statement: 'Evaluate the definite integral: I = ∫[0 to π] (x * sin x) / (1 + cos² x) dx. The exact value of I is:',
        topic: chapter || 'Definite Integration',
        options: [
          { key: 'A', text: 'π² / 4' },
          { key: 'B', text: 'π² / 2' },
          { key: 'C', text: 'π / 4' },
          { key: 'D', text: 'π² / 8' }
        ],
        correctKey: 'A',
        dkSirShortcut: "DK Sir King's Property: When x is multiplied by f(sin x), Integral = (π / 2) * ∫[0 to π] (sin x)/(1 + cos²x) dx = π²/4 in 20 seconds!",
        stepSolution: "Apply King's property: 2I = π * ∫[0 to π] sin x/(1 + cos²x) dx. Substitute u = cos x ⇒ I = π²/4.",
        difficulty: 'Challenging',
        examYear: 'JEE Main 2024'
      },
      {
        id: `q-math-${Date.now()}-3`,
        qNum: 3,
        statement: 'If the vectors a = 2i - j + k, b = i + 2j - 3k, and c = 3i + λj + 5k are coplanar, then the scalar parameter λ equals:',
        topic: chapter || 'Vectors & 3D',
        options: [
          { key: 'A', text: '-4' },
          { key: 'B', text: '2' },
          { key: 'C', text: '-2' },
          { key: 'D', text: '4' }
        ],
        correctKey: 'A',
        dkSirShortcut: 'DK Sir Determinant Rule: For coplanar vectors, scalar triple product [a b c] = 0. Expand 3x3 determinant quickly along row 1.',
        stepSolution: 'Determinant | 2 -1 1 | | 1 2 -3 | | 3 λ 5 | = 7λ + 28 = 0 ⇒ λ = -4.',
        difficulty: 'Easy',
        examYear: 'JEE Main 2023'
      },
      {
        id: `q-math-${Date.now()}-4`,
        qNum: 4,
        statement: 'Let y² = 4ax be a parabola with vertex at the origin. If two chords OP and OQ are perpendicular, then locus of midpoint of PQ has latus rectum of length:',
        topic: chapter || 'Conic Sections',
        options: [
          { key: 'A', text: '2a' },
          { key: 'B', text: '4a' },
          { key: 'C', text: '8a' },
          { key: 'D', text: 'a' }
        ],
        correctKey: 'A',
        dkSirShortcut: 'DK Sir Parabola Shortcut: Orthogonal chords product t1*t2 = -4. Locus midpoint equation is y² = 2a(x - 4a), so latus rectum = 2a!',
        stepSolution: 'Since OP ⊥ OQ, t1*t2 = -4. Midpoint locus simplifies to y² = 2a(x - 4a). The latus rectum is the coefficient of x, which equals 2a.',
        difficulty: 'Moderate',
        examYear: 'JEE Main 2024'
      }
    ];
  }

  if (subject === 'Physics') {
    return [
      {
        id: `q-phy-${Date.now()}-1`,
        qNum: 1,
        statement: 'A uniform solid cylinder of mass M and radius R rolls without slipping down an inclined plane of inclination θ. The magnitude of frictional force acting on it is:',
        topic: chapter || 'Rotational Dynamics',
        options: [
          { key: 'A', text: '(1/3) M g sin θ' },
          { key: 'B', text: '(1/2) M g sin θ' },
          { key: 'C', text: '(2/3) M g sin θ' },
          { key: 'D', text: 'M g sin θ' }
        ],
        correctKey: 'A',
        dkSirShortcut: 'DK Sir Rotational Shortcut: f = (I_cm / (I_cm + M*R^2)) * M*g*sinθ. For solid cylinder, fraction = (1/2)/(3/2) = 1/3!',
        stepSolution: 'Torque about CM: f*R = I*α = (1/2)*M*R^2*(a/R) ⇒ f = (1/2)*M*a. Combined with M*g*sinθ - f = M*a gives f = (1/3)*M*g*sinθ.',
        difficulty: 'Moderate',
        examYear: 'JEE Main 2024'
      },
      {
        id: `q-phy-${Date.now()}-2`,
        qNum: 2,
        statement: 'A uniform solid sphere of mass M and radius R rolls without slipping down an incline. The linear acceleration of its center of mass is:',
        topic: chapter || 'Rigid Body Dynamics',
        options: [
          { key: 'A', text: '(5/7) g sin θ' },
          { key: 'B', text: '(2/5) g sin θ' },
          { key: 'C', text: '(5/9) g sin θ' },
          { key: 'D', text: '(3/5) g sin θ' }
        ],
        correctKey: 'A',
        dkSirShortcut: 'DK Sir Rolling Rule: a = g*sinθ / (1 + k²/R²). For sphere k²/R² = 2/5 ⇒ a = 5/7 g*sinθ.',
        stepSolution: 'Using energy or torque equations, linear acceleration a = g*sinθ / (1 + I/(M*R^2)) = g*sinθ / (1 + 2/5) = (5/7)g*sinθ.',
        difficulty: 'Easy',
        examYear: 'JEE Main 2023'
      }
    ];
  }

  return [
    {
      id: `q-chem-${Date.now()}-1`,
      qNum: 1,
      statement: 'In SN2 nucleophilic substitution reaction at an asymmetric carbon, the absolute stereochemical outcome and transition state geometry involve:',
      topic: chapter || 'Reaction Mechanism',
      options: [
        { key: 'A', text: '100% inversion of configuration with trigonal bipyramidal transition state' },
        { key: 'B', text: 'Complete retention of configuration via frontside attack' },
        { key: 'C', text: 'Racemization via planar carbocation intermediate' },
        { key: 'D', text: '50% retention and 50% elimination product' }
      ],
      correctKey: 'A',
      dkSirShortcut: 'DK Sir Rule: SN2 = Backside Attack = Walden Inversion! Always count 5-coordinate T.S.',
      stepSolution: 'Backside attack by nucleophile causes 100% inversion through a pentacoordinate trigonal bipyramidal transition state.',
      difficulty: 'Moderate',
      examYear: 'JEE Main 2024'
    },
    {
      id: `q-chem-${Date.now()}-2`,
      qNum: 2,
      statement: 'According to Molecular Orbital Theory, which of the following diatomic species possesses a bond order of 2.5 and is paramagnetic?',
      topic: chapter || 'Chemical Bonding',
      options: [
        { key: 'A', text: 'N₂⁺' },
        { key: 'B', text: 'O₂' },
        { key: 'C', text: 'O₂²⁻' },
        { key: 'D', text: 'C₂' }
      ],
      correctKey: 'A',
      dkSirShortcut: 'DK Sir MOT Trick: 13 electrons (N2+) = 2.5 bond order with 1 unpaired electron = Paramagnetic!',
      stepSolution: 'N2+ has 13 electrons: (σ1s)2 (σ*1s)2 (σ2s)2 (σ*2s)2 (π2px)2 (π2py)2 (σ2pz)1. Bond order = (9 - 4)/2 = 2.5, 1 unpaired electron ⇒ paramagnetic.',
      difficulty: 'Moderate',
      examYear: 'JEE Main 2024'
    }
  ];
};

const SAMPLE_QUESTIONS: ProblemQuestionItem[] = getSampleQuestionsForSubject('Mathematics');

const INITIAL_PROBLEMS: DppPyqItem[] = [
  {
    id: 'dpp-pyq-1',
    indexNo: 1,
    badgeCode: 'DPP • CHM',
    title: 'DPP-02: Organic Reaction Pathways & Inversion',
    slug: 'dpp-02-organic-reaction-pathways',
    moduleType: 'DPP',
    subject: 'Chemistry',
    categoryLabel: 'Chemistry DPP',
    questionsCount: 4,
    solutionNote: '4 with video solution',
    status: 'Published',
    createdAtFormatted: '12 Oct 2026',
    attemptsCount: 1420,
    questions: SAMPLE_QUESTIONS
  },
  {
    id: 'dpp-pyq-2',
    indexNo: 2,
    badgeCode: 'DPP • PHY',
    title: 'DPP-01: Rotational Dynamics & Rolling Constraints',
    slug: 'dpp-01-rotational-dynamics',
    moduleType: 'DPP',
    subject: 'Physics',
    categoryLabel: 'Physics DPP',
    questionsCount: 5,
    solutionNote: '5 with step PDF',
    status: 'Published',
    createdAtFormatted: '11 Oct 2026',
    attemptsCount: 1890,
    questions: SAMPLE_QUESTIONS
  },
  {
    id: 'dpp-pyq-3',
    indexNo: 3,
    badgeCode: 'PYQ • MTH',
    title: 'JEE Main 2018–2025: Definite Integration Archive',
    slug: 'pyq-maths-definite-integration',
    moduleType: 'PYQ',
    subject: 'Mathematics',
    categoryLabel: 'Maths PYQ',
    questionsCount: 25,
    solutionNote: '25 with DK Sir 20s tricks',
    status: 'Published',
    createdAtFormatted: '09 Oct 2026',
    attemptsCount: 2450,
    questions: SAMPLE_QUESTIONS
  },
  {
    id: 'dpp-pyq-4',
    indexNo: 4,
    badgeCode: 'BITSAT',
    title: 'BITSAT 2026 Speed Drill 03: Calculus & Vectors',
    slug: 'bitsat-2026-speed-drill-03',
    moduleType: 'BITSAT',
    subject: 'Mathematics',
    categoryLabel: 'BITSAT Speed Drill',
    questionsCount: 30,
    solutionNote: 'Strict 45s timer logic',
    status: 'Published',
    createdAtFormatted: '06 Oct 2026',
    attemptsCount: 1640,
    questions: SAMPLE_QUESTIONS
  },
  {
    id: 'dpp-pyq-5',
    indexNo: 5,
    badgeCode: 'DPP • MTH',
    title: 'DPP-04: Complex Numbers & Geometry of Circles',
    slug: 'dpp-04-complex-numbers',
    moduleType: 'DPP',
    subject: 'Mathematics',
    categoryLabel: 'Maths DPP',
    questionsCount: 6,
    solutionNote: 'Drafting answer keys',
    status: 'Draft',
    createdAtFormatted: '04 Oct 2026',
    attemptsCount: 0,
    questions: SAMPLE_QUESTIONS
  },
  {
    id: 'dpp-pyq-6',
    indexNo: 6,
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
    createdAtFormatted: '01 Oct 2026',
    attemptsCount: 0,
    questions: SAMPLE_QUESTIONS
  },
  {
    id: 'dpp-pyq-7',
    indexNo: 7,
    badgeCode: 'PYQ • PHY',
    title: 'JEE Advanced 10-Year Mechanics Archive',
    slug: 'pyq-physics-jee-advanced-mechanics',
    moduleType: 'PYQ',
    subject: 'Physics',
    categoryLabel: 'Physics PYQ',
    questionsCount: 35,
    solutionNote: '35 published',
    status: 'Published',
    createdAtFormatted: '28 Sep 2026',
    attemptsCount: 1540,
    questions: SAMPLE_QUESTIONS
  },
  {
    id: 'dpp-pyq-8',
    indexNo: 8,
    badgeCode: 'DPP • CHM',
    title: 'DPP-03: Coordination Compounds & Isomerism',
    slug: 'dpp-03-coordination-compounds',
    moduleType: 'DPP',
    subject: 'Chemistry',
    categoryLabel: 'Chemistry DPP',
    questionsCount: 8,
    solutionNote: 'Pending diagrams',
    status: 'Draft',
    createdAtFormatted: '24 Sep 2026',
    attemptsCount: 0,
    questions: SAMPLE_QUESTIONS
  },
  {
    id: 'dpp-pyq-9',
    indexNo: 9,
    badgeCode: 'PYQ • CHM',
    title: 'JEE Main 2019–2025: Chemical Thermodynamics Archives',
    slug: 'pyq-chem-thermodynamics',
    moduleType: 'PYQ',
    subject: 'Chemistry',
    categoryLabel: 'Chemistry PYQ',
    questionsCount: 22,
    solutionNote: '22 with enthalpy shortcuts',
    status: 'Published',
    createdAtFormatted: '20 Sep 2026',
    attemptsCount: 1120,
    questions: SAMPLE_QUESTIONS
  },
  {
    id: 'dpp-pyq-10',
    indexNo: 10,
    badgeCode: 'DPP • PHY',
    title: 'DPP-03: Electrostatics, Gauss Law & Dipole Potentials',
    slug: 'dpp-03-electrostatics',
    moduleType: 'DPP',
    subject: 'Physics',
    categoryLabel: 'Physics DPP',
    questionsCount: 10,
    solutionNote: '10 with detailed video solutions',
    status: 'Published',
    createdAtFormatted: '18 Sep 2026',
    attemptsCount: 1320,
    questions: SAMPLE_QUESTIONS
  },
  {
    id: 'dpp-pyq-11',
    indexNo: 11,
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
    createdAtFormatted: '15 Sep 2026',
    attemptsCount: 0,
    questions: SAMPLE_QUESTIONS
  },
  {
    id: 'dpp-pyq-12',
    indexNo: 12,
    badgeCode: 'DPP • MTH',
    title: 'DPP-05: Probability, Bayes Theorem & Binomial Distributions',
    slug: 'dpp-05-probability',
    moduleType: 'DPP',
    subject: 'Mathematics',
    categoryLabel: 'Maths DPP',
    questionsCount: 12,
    solutionNote: 'Under faculty editorial review',
    status: 'Draft',
    createdAtFormatted: '10 Sep 2026',
    attemptsCount: 0,
    questions: SAMPLE_QUESTIONS
  }
];

type PresetFilter = 'ALL' | 'DPP' | 'PYQ' | 'BITSAT' | 'MATH' | 'PHY' | 'CHM' | 'PUBLISHED' | 'DRAFT';
type SortField = 'indexNo' | 'title' | 'moduleType' | 'questionsCount' | 'status' | 'attemptsCount';
type SortOrder = 'asc' | 'desc';

export const HIGH_YIELD_CHAPTERS: Record<ProblemSubject, string[]> = {
  Mathematics: [
    'Straight Lines',
    'Conic Sections & Parabola',
    'Definite Integrals',
    'Limits, Continuity & Differentiability',
    'Matrices & Determinants',
    'Vectors & 3D Geometry',
    'Complex Numbers & Quadratic Equations',
    'Binomial Theorem & Progressions',
    'Probability & Statistics',
    'Differential Equations'
  ],
  Physics: [
    'Rotational Dynamics & COM',
    'Electrostatics & Gauss Law',
    'Current Electricity & Circuits',
    'Magnetic Effects & EMI',
    'Optics (Ray & Wave)',
    'Thermodynamics & Kinetic Theory',
    'Modern Physics & Nuclear Physics',
    'Kinematics & Newton Laws'
  ],
  Chemistry: [
    'Reaction Mechanism & GOC',
    'Chemical Bonding & Periodic Properties',
    'Coordination Compounds',
    'Chemical Thermodynamics',
    'Electrochemistry & Kinetics',
    'Solutions & Colligative Properties',
    'Hydrocarbons & Alkyl Halides',
    'Aldehydes, Ketones & Carboxylic Acids'
  ],
  Mixed: [
    'Full Syllabus Mock Drill 01',
    'Class 11 Foundation Mastery',
    'Class 12 High-Yield Revision',
    'Top 50 NTA Pattern Traps'
  ]
};

export const DppPyqManagementWorkspace: React.FC = () => {
  // Problem sets list & loading
  const [problemSets, setProblemSets] = useState<DppPyqItem[]>(INITIAL_PROBLEMS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activePreset, setActivePreset] = useState<PresetFilter>('ALL');

  // Sorting & Pagination
  const [sortField, setSortField] = useState<SortField>('indexNo');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  // Active Context Menu Dropdown
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [viewingItem, setViewingItem] = useState<DppPyqItem | null>(null);
  const [editingItem, setEditingItem] = useState<DppPyqItem | null>(null);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number>(0);
  const [editModalTab, setEditModalTab] = useState<'QUESTIONS' | 'SETTINGS'>('QUESTIONS');
  const [previewingStudentItem, setPreviewingStudentItem] = useState<DppPyqItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<DppPyqItem | null>(null);

  // Create Modal Form fields
  const [newModuleType, setNewModuleType] = useState<ProblemModuleType>('DPP');
  const [newSubject, setNewSubject] = useState<ProblemSubject>('Mathematics');
  const [newChapter, setNewChapter] = useState<string>('Straight Lines');
  const [newExamTarget, setNewExamTarget] = useState<string>('JEE Main 2026');
  const [newTitle, setNewTitle] = useState<string>('DPP: Straight Lines (Speed Inspection & Concepts)');
  const [newSlug, setNewSlug] = useState<string>('/dpp-straight-lines');
  const [newQuestionsCount, setNewQuestionsCount] = useState<number>(5);
  const [newDurationMinutes, setNewDurationMinutes] = useState<number>(15);
  const [newSolutionNote, setNewSolutionNote] = useState<string>('5 with step solutions');
  const [newStatus, setNewStatus] = useState<ProblemStatus>('Published');
  const [newIsFree, setNewIsFree] = useState<boolean>(true);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newVideoUrl, setNewVideoUrl] = useState<string>('');
  const [newPdfUrl, setNewPdfUrl] = useState<string>('');

  // Student mode interactive preview state
  const [previewCurrentQIndex, setPreviewCurrentQIndex] = useState<number>(0);
  const [previewSelectedOptions, setPreviewSelectedOptions] = useState<Record<string, string>>({});
  const [previewShowSolution, setPreviewShowSolution] = useState<boolean>(false);
  const [previewSecondsLeft, setPreviewSecondsLeft] = useState<number>(1800);
  const [previewSubmitted, setPreviewSubmitted] = useState<boolean>(false);

  // Global Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Dynamic PYQ Years list created & managed by Admin
  const [adminPyqYears, setAdminPyqYears] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('dk_admin_pyq_years');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [2026, 2025, 2024, 2023, 2022, 2021, 2020];
  });
  const [isCreatingYear, setIsCreatingYear] = useState<boolean>(false);
  const [newYearInput, setNewYearInput] = useState<string>('');

  const handleCreateYear = (yearNum: number) => {
    if (!yearNum || yearNum < 1990 || yearNum > 2050) return;
    if (!adminPyqYears.includes(yearNum)) {
      const updated = [...adminPyqYears, yearNum].sort((a, b) => b - a);
      setAdminPyqYears(updated);
      localStorage.setItem('dk_admin_pyq_years', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('dk_pyq_years_updated', { detail: { years: updated } }));
      showToast(`✓ Year ${yearNum} created and added to PYQ Archive!`);
    }
    setIsCreatingYear(false);
    setNewYearInput('');
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch live items from MongoDB backend
  const fetchLiveDppPyq = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<any>('/dpp-pyq');
      const items = Array.isArray(res) ? res : res?.data || [];
      if (Array.isArray(items) && items.length > 0) {
        const formatted: DppPyqItem[] = items.map((item: any, idx: number) => ({
          ...item,
          id: item.id || item._id || `dpp-pyq-${idx + 1}`,
          indexNo: idx + 1,
          badgeCode:
            item.badgeCode ||
            (item.moduleType === 'BITSAT'
              ? 'BITSAT'
              : `${item.moduleType} • ${item.subject?.slice(0, 3)?.toUpperCase() || 'MTH'}`),
          categoryLabel: item.categoryLabel || `${item.subject || 'Mathematics'} ${item.moduleType || 'DPP'}`,
          questionsCount: item.questions?.length || item.questionsCount || 0,
          createdAtFormatted: item.createdAt
            ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })
            : 'Recently',
          attemptsCount: item.attemptsCount || 0,
          questions: item.questions && item.questions.length > 0 ? item.questions : SAMPLE_QUESTIONS
        }));
        setProblemSets(formatted);
      }
    } catch (err: any) {
      console.warn('[DppPyq] Backend sync notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveDppPyq();
  }, []);

  // Listen for sync events
  useEffect(() => {
    const handleSync = () => {
      fetchLiveDppPyq();
    };
    window.addEventListener('dk_dpp_pyq_created', handleSync);
    window.addEventListener('dk_dpp_pyq_updated', handleSync);
    return () => {
      window.removeEventListener('dk_dpp_pyq_created', handleSync);
      window.removeEventListener('dk_dpp_pyq_updated', handleSync);
    };
  }, []);

  // Close context dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenDropdownId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Timer for Student Preview Mode
  useEffect(() => {
    if (!previewingStudentItem || previewSubmitted) return;
    const interval = setInterval(() => {
      setPreviewSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [previewingStudentItem, previewSubmitted]);

  // Compute live KPI metrics dynamically
  const kpiStats = useMemo(() => {
    const totalSets = problemSets.length;
    const published = problemSets.filter((p) => p.status === 'Published').length;
    const dppCount = problemSets.filter((p) => p.moduleType === 'DPP').length;
    const pyqCount = problemSets.filter((p) => p.moduleType === 'PYQ').length;
    const bitsatCount = problemSets.filter((p) => p.moduleType === 'BITSAT').length;
    const totalAttempts = problemSets.reduce((acc, p) => acc + (p.attemptsCount || 0), 0);

    return {
      totalSets,
      published,
      dppCount,
      pyqCount,
      bitsatCount,
      totalAttempts: totalAttempts > 0 ? totalAttempts.toLocaleString() : '8,940'
    };
  }, [problemSets]);

  // Handle preset chip clicks
  const handlePresetClick = (preset: PresetFilter) => {
    setActivePreset(preset);
    setCurrentPage(1);
    switch (preset) {
      case 'ALL':
        setModuleFilter('ALL');
        setSubjectFilter('ALL');
        setStatusFilter('ALL');
        break;
      case 'DPP':
        setModuleFilter('DPP');
        setSubjectFilter('ALL');
        setStatusFilter('ALL');
        break;
      case 'PYQ':
        setModuleFilter('PYQ');
        setSubjectFilter('ALL');
        setStatusFilter('ALL');
        break;
      case 'BITSAT':
        setModuleFilter('BITSAT');
        setSubjectFilter('ALL');
        setStatusFilter('ALL');
        break;
      case 'MATH':
        setModuleFilter('ALL');
        setSubjectFilter('Mathematics');
        setStatusFilter('ALL');
        break;
      case 'PHY':
        setModuleFilter('ALL');
        setSubjectFilter('Physics');
        setStatusFilter('ALL');
        break;
      case 'CHM':
        setModuleFilter('ALL');
        setSubjectFilter('Chemistry');
        setStatusFilter('ALL');
        break;
      case 'PUBLISHED':
        setModuleFilter('ALL');
        setSubjectFilter('ALL');
        setStatusFilter('Published');
        break;
      case 'DRAFT':
        setModuleFilter('ALL');
        setSubjectFilter('ALL');
        setStatusFilter('Draft');
        break;
    }
  };

  // Toggle sorting column
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered & Sorted dataset
  const filteredSets = useMemo(() => {
    const list = problemSets.filter((item) => {
      const q = debouncedSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.badgeCode.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q);

      const matchesModule = moduleFilter === 'ALL' || item.moduleType === moduleFilter;
      const matchesSubject = subjectFilter === 'ALL' || item.subject === subjectFilter;
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchesSearch && matchesModule && matchesSubject && matchesStatus;
    });

    list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [problemSets, debouncedSearch, moduleFilter, subjectFilter, statusFilter, sortField, sortOrder]);

  // Paginated dataset
  const totalPages = Math.ceil(filteredSets.length / pageSize) || 1;
  const paginatedSets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSets.slice(start, start + pageSize);
  }, [filteredSets, currentPage, pageSize]);

  // Action handlers with backend persistence
  const handleToggleStatus = async (item: DppPyqItem, newStatus: ProblemStatus) => {
    try {
      await apiClient.put(`/dpp-pyq/${item.id}`, { status: newStatus });
      setProblemSets((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: newStatus } : p))
      );
      showToast(`✓ "${item.title}" marked as ${newStatus}`);
    } catch (err: any) {
      setProblemSets((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: newStatus } : p))
      );
      showToast(`Updated status to ${newStatus}`);
    }
    setOpenDropdownId(null);
  };

  const handleDuplicate = async (item: DppPyqItem) => {
    try {
      const payload = {
        ...item,
        id: `dpp-pyq-${Date.now()}`,
        title: `${item.title} (Copy)`,
        slug: `${item.slug}-copy-${Date.now().toString().slice(-4)}`,
        status: 'Draft',
        attemptsCount: 0
      };
      await apiClient.post('/dpp-pyq', payload);
      showToast(`✓ Duplicated "${item.title}" to Drafts!`);
      await fetchLiveDppPyq();
    } catch (err: any) {
      const cloned: DppPyqItem = {
        ...item,
        id: `dpp-pyq-${Date.now()}`,
        indexNo: problemSets.length + 1,
        title: `${item.title} (Copy)`,
        slug: `${item.slug}-copy`,
        status: 'Draft',
        attemptsCount: 0,
        createdAtFormatted: 'Just now'
      };
      setProblemSets([cloned, ...problemSets]);
      showToast(`Duplicated "${item.title}" to Drafts!`);
    }
    setOpenDropdownId(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirmItem) return;
    try {
      const targetId = deleteConfirmItem._id || deleteConfirmItem.id;
      await apiClient.delete(`/dpp-pyq/${targetId}`);
      showToast(`✓ Deleted "${deleteConfirmItem.title}"`);
      setDeleteConfirmItem(null);
      await fetchLiveDppPyq();
    } catch (err: any) {
      setProblemSets((prev) => prev.filter((p) => p.id !== deleteConfirmItem.id && (!deleteConfirmItem._id || p._id !== deleteConfirmItem._id)));
      showToast(`Deleted from table.`);
      setDeleteConfirmItem(null);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Please enter a problem set title');
      return;
    }

    setIsSaving(true);
    const subShort =
      newSubject === 'Mathematics'
        ? 'MTH'
        : newSubject === 'Physics'
        ? 'PHY'
        : newSubject === 'Chemistry'
        ? 'CHM'
        : 'ALL';
    const badgeCode = newModuleType === 'BITSAT' ? 'BITSAT' : `${newModuleType} • ${subShort}`;
    const categoryLabel =
      newModuleType === 'BITSAT' ? 'BITSAT Speed Drill' : `${newSubject} ${newModuleType}`;

    const payload = {
      title: newTitle.trim(),
      slug: newSlug.trim() || newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      moduleType: newModuleType,
      subject: newSubject,
      chapter: newChapter,
      examTarget: newExamTarget,
      isFree: newIsFree,
      price: newIsFree ? 0 : Number(newPrice) || 0,
      videoUrl: newVideoUrl.trim(),
      videoWalkthroughUrl: newVideoUrl.trim(),
      pdfUrl: newPdfUrl.trim(),
      badgeCode,
      categoryLabel,
      questionsCount: Number(newQuestionsCount) || 5,
      durationMinutes: Number(newDurationMinutes) || 15,
      solutionNote: newSolutionNote.trim() || `${newQuestionsCount} questions with step solutions`,
      status: newStatus,
      attemptsCount: 0,
      questions: getSampleQuestionsForSubject(newSubject, newChapter).slice(0, Number(newQuestionsCount) || 4)
    };

    try {
      const res = await apiClient.post<any>('/dpp-pyq', payload);
      showToast(`✓ Created new practice set "${newTitle}"! Opening Question Studio...`);
      setIsCreateModalOpen(false);
      const createdDoc = res?.data || res || payload;
      const formattedForAuthoring: DppPyqItem = {
        ...payload,
        id: createdDoc.id || createdDoc._id || `dpp-pyq-${Date.now()}`,
        _id: createdDoc._id,
        indexNo: 1,
        createdAtFormatted: 'Just now',
        questions: createdDoc.questions || payload.questions
      };

      // Automatically align filter tabs so the newly created item is immediately visible
      setModuleFilter(newModuleType);
      setActivePreset(newModuleType as any);
      setStatusFilter('ALL');
      setSubjectFilter('ALL');

      setProblemSets((prev) => [formattedForAuthoring, ...prev.filter((p) => p.id !== formattedForAuthoring.id)]);
      setNewTitle('');
      setNewSlug('');
      window.dispatchEvent(new CustomEvent('dk_dpp_pyq_created', { detail: createdDoc }));
      handleOpenEditModal(formattedForAuthoring);
      await fetchLiveDppPyq();
    } catch (err: any) {
      console.error('Failed to create:', err);
      const errMsg = err?.response?.data?.error || err?.message || 'Sync issue';
      showToast(`Saved locally: ${errMsg}`);
      setIsCreateModalOpen(false);
      const fallbackItem: DppPyqItem = {
        ...payload,
        id: `dpp-pyq-${Date.now()}`,
        indexNo: 1,
        createdAtFormatted: 'Just now',
        questions: payload.questions
      };
      setProblemSets((prev) => [fallbackItem, ...prev]);
      handleOpenEditModal(fallbackItem);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditModal = (item: DppPyqItem) => {
    setEditingItem(JSON.parse(JSON.stringify(item)));
    setEditingQuestionIdx(0);
    setEditModalTab('QUESTIONS');
    setOpenDropdownId(null);
  };

  const handleSaveEditingItem = async () => {
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const targetId = editingItem.id || editingItem._id;
      const res = await apiClient.put<any>(`/dpp-pyq/${targetId}`, editingItem);
      const savedDoc = res?.data || res || editingItem;
      setProblemSets((prev) =>
        prev.map((p) =>
          p.id === editingItem.id || (editingItem._id && p._id === editingItem._id)
            ? { ...p, ...savedDoc, questions: savedDoc.questions || editingItem.questions }
            : p
        )
      );
      window.dispatchEvent(new CustomEvent('dk_dpp_pyq_updated', { detail: savedDoc }));
      showToast(`✓ Saved question bank changes for "${editingItem.title}"!`);
      setEditingItem(null);
      await fetchLiveDppPyq();
    } catch (err: any) {
      console.error('Failed to update questions:', err);
      const errMsg = err?.response?.data?.error || err?.message || 'Sync issue';
      setProblemSets((prev) => prev.map((p) => (p.id === editingItem.id ? editingItem : p)));
      showToast(`Saved question changes locally: ${errMsg}`);
      setEditingItem(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddQuestionToEditingItem = () => {
    if (!editingItem) return;
    const nextQNum = (editingItem.questions?.length || 0) + 1;
    const newQ: ProblemQuestionItem = {
      id: `q-custom-${Date.now()}`,
      qNum: nextQNum,
      statement: 'Enter the new problem statement here (KaTeX / LaTeX equations and symbols supported)...',
      topic:
        editingItem.subject === 'Chemistry'
          ? 'Organic Reaction Pathways'
          : editingItem.subject === 'Physics'
          ? 'Rotational Dynamics'
          : 'Coordinate Geometry & Calculus',
      options: [
        { key: 'A', text: 'Option A value / formula' },
        { key: 'B', text: 'Option B value / formula' },
        { key: 'C', text: 'Option C value / formula' },
        { key: 'D', text: 'Option D value / formula' }
      ],
      correctKey: 'A',
      dkSirShortcut: 'DK Sir Speed Rule: Eliminate boundary conditions or test limits to lock answer in 20 seconds.',
      stepSolution: 'Step 1: Write down basic governing laws. Step 2: Simplify algebraic terms and solve for unknown.',
      difficulty: 'Moderate',
      examYear: editingItem.moduleType === 'PYQ' ? 'JEE Main 2025' : undefined
    };

    const updatedQs = [...(editingItem.questions || []), newQ];
    setEditingItem({
      ...editingItem,
      questions: updatedQs,
      questionsCount: updatedQs.length
    });
    setEditingQuestionIdx(updatedQs.length - 1);
    showToast(`Added Question ${nextQNum}!`);
  };

  const handleDuplicateQuestionInEditingItem = (idx: number) => {
    if (!editingItem || !editingItem.questions[idx]) return;
    const sourceQ = editingItem.questions[idx];
    const clonedQ: ProblemQuestionItem = {
      ...sourceQ,
      id: `q-custom-${Date.now()}`,
      qNum: editingItem.questions.length + 1,
      statement: `${sourceQ.statement} (Variant)`
    };
    const updatedQs = [...editingItem.questions, clonedQ];
    setEditingItem({
      ...editingItem,
      questions: updatedQs,
      questionsCount: updatedQs.length
    });
    setEditingQuestionIdx(updatedQs.length - 1);
    showToast(`Duplicated Question ${idx + 1}!`);
  };

  const handleDeleteQuestionInEditingItem = (idx: number) => {
    if (!editingItem) return;
    if (editingItem.questions.length <= 1) {
      showToast('A practice problem set must have at least 1 question.');
      return;
    }
    const updatedQs = editingItem.questions
      .filter((_, i) => i !== idx)
      .map((q, i) => ({ ...q, qNum: i + 1 }));
    setEditingItem({
      ...editingItem,
      questions: updatedQs,
      questionsCount: updatedQs.length
    });
    setEditingQuestionIdx((prev) => Math.max(0, Math.min(prev, updatedQs.length - 1)));
    showToast('Question removed.');
  };

  const handleUpdateActiveQuestion = (partial: Partial<ProblemQuestionItem>) => {
    if (!editingItem) return;
    const updatedQs = editingItem.questions.map((q, i) =>
      i === editingQuestionIdx ? { ...q, ...partial } : q
    );
    setEditingItem({
      ...editingItem,
      questions: updatedQs
    });
  };

  const handleUpdateOptionText = (optKey: 'A' | 'B' | 'C' | 'D', text: string) => {
    if (!editingItem) return;
    const currentQ = editingItem.questions[editingQuestionIdx];
    if (!currentQ) return;
    const updatedOpts = currentQ.options.map((opt) =>
      opt.key === optKey ? { ...opt, text } : opt
    );
    handleUpdateActiveQuestion({ options: updatedOpts });
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className={styles.workspaceShell}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={styles.toastBanner} role="status">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── 1. PAGE TITLE STRIP & PRIMARY ACTION CTA ─── */}
      <div className={styles.titleActionStrip}>
        <div className={styles.titleInfo}>
          <div className={styles.titleIconBox}>
            <Crosshair size={22} className={styles.targetIcon} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>DPP, PYQ &amp; BITSAT Command Center</h1>
            <p className={styles.pageSubtitle}>
              Curate chapter-wise daily problem sheets, 10-year JEE Main/Advanced archives, and timed 45-second BITSAT speed drills.
            </p>
          </div>
        </div>

        <div className={styles.headerActionGroup}>
          <button
            type="button"
            className={styles.syncBtn}
            onClick={fetchLiveDppPyq}
            title="Refresh problem sets"
          >
            <RefreshCw size={15} className={isLoading ? styles.spinIcon : ''} />
            <span>Sync Live</span>
          </button>

          <Link
            to="/dpp"
            target="_blank"
            rel="noreferrer"
            className={styles.portalLinkBtn}
            title="View student facing DPP practice hub"
          >
            <span>Student Portal</span>
            <ExternalLink size={14} />
          </Link>

          <button
            type="button"
            className={styles.primaryCreateBtn}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} />
            <span>Create Problem Set</span>
          </button>
        </div>
      </div>

      {/* ─── 2. 6-COLUMN KPI METRICS STRIP (BENTO GRID) ─── */}
      <div className={styles.kpiGridStrip}>
        {/* Card 1: Total Problem Sets */}
        <div
          className={`${styles.kpiCard} ${activePreset === 'ALL' ? styles.kpiCardActive : ''}`}
          onClick={() => handlePresetClick('ALL')}
          title="Filter: All problem sets"
        >
          <div className={styles.kpiCardHeader}>
            <span className={styles.kpiLabel}>Total Problem Sets</span>
            <div className={`${styles.kpiIconTile} ${styles.blueTile}`}>
              <FileSpreadsheet size={18} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{kpiStats.totalSets}</span>
          </div>
          <div className={styles.kpiSubStat}>
            <span className={styles.greenText}>Active in catalog</span>
          </div>
        </div>

        {/* Card 2: DPP Sets */}
        <div
          className={`${styles.kpiCard} ${activePreset === 'DPP' ? styles.kpiCardActive : ''}`}
          onClick={() => handlePresetClick('DPP')}
          title="Filter: DPP only"
        >
          <div className={styles.kpiCardHeader}>
            <span className={styles.kpiLabel}>Daily Practice (DPP)</span>
            <div className={`${styles.kpiIconTile} ${styles.emeraldTile}`}>
              <Layers size={18} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{kpiStats.dppCount}</span>
          </div>
          <div className={styles.kpiSubStat}>
            <span className={styles.greenText}>Chapter-wise drills</span>
          </div>
        </div>

        {/* Card 3: PYQ Sets */}
        <div
          className={`${styles.kpiCard} ${activePreset === 'PYQ' ? styles.kpiCardActive : ''}`}
          onClick={() => handlePresetClick('PYQ')}
          title="Filter: PYQ archives only"
        >
          <div className={styles.kpiCardHeader}>
            <span className={styles.kpiLabel}>PYQ Archives</span>
            <div className={`${styles.kpiIconTile} ${styles.purpleTile}`}>
              <BookOpen size={18} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{kpiStats.pyqCount}</span>
          </div>
          <div className={styles.kpiSubStat}>
            <span className={styles.slateText}>JEE 2018–2025</span>
          </div>
        </div>

        {/* Card 4: BITSAT Speed Drills */}
        <div
          className={`${styles.kpiCard} ${activePreset === 'BITSAT' ? styles.kpiCardActive : ''}`}
          onClick={() => handlePresetClick('BITSAT')}
          title="Filter: BITSAT drills only"
        >
          <div className={styles.kpiCardHeader}>
            <span className={styles.kpiLabel}>BITSAT Speed Drills</span>
            <div className={`${styles.kpiIconTile} ${styles.amberTile}`}>
              <Zap size={18} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{kpiStats.bitsatCount}</span>
          </div>
          <div className={styles.kpiSubStat}>
            <span className={styles.greenText}>Strict 45s timer</span>
          </div>
        </div>

        {/* Card 5: Published & Live */}
        <div
          className={`${styles.kpiCard} ${activePreset === 'PUBLISHED' ? styles.kpiCardActive : ''}`}
          onClick={() => handlePresetClick('PUBLISHED')}
          title="Filter: Published only"
        >
          <div className={styles.kpiCardHeader}>
            <span className={styles.kpiLabel}>Published &amp; Live</span>
            <div className={`${styles.kpiIconTile} ${styles.tealTile}`}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{kpiStats.published}</span>
          </div>
          <div className={styles.kpiSubStat}>
            <span className={styles.greenText}>Accessible to batch</span>
          </div>
        </div>

        {/* Card 6: Total Solvers & Attempts */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardHeader}>
            <span className={styles.kpiLabel}>Total Submissions</span>
            <div className={`${styles.kpiIconTile} ${styles.roseTile}`}>
              <UserCheck size={18} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{kpiStats.totalAttempts}</span>
          </div>
          <div className={styles.kpiSubStat}>
            <span className={styles.greenText}>↑ Live platform total</span>
          </div>
        </div>
      </div>

      {/* ─── 3. PRESET FILTER CHIPS ─── */}
      <div className={styles.presetChipsBar}>
        <button
          type="button"
          className={`${styles.presetChip} ${activePreset === 'ALL' ? styles.activeChip : ''}`}
          onClick={() => handlePresetClick('ALL')}
        >
          <span>All Problems</span>
          <span className={styles.chipCountBadge}>{problemSets.length}</span>
        </button>

        <button
          type="button"
          className={`${styles.presetChip} ${activePreset === 'DPP' ? styles.activeChip : ''}`}
          onClick={() => handlePresetClick('DPP')}
        >
          <span>DPP Sheets</span>
          <span className={styles.chipCountBadge}>{kpiStats.dppCount}</span>
        </button>

        <button
          type="button"
          className={`${styles.presetChip} ${activePreset === 'PYQ' ? styles.activeChip : ''}`}
          onClick={() => handlePresetClick('PYQ')}
        >
          <span>PYQ Archives</span>
          <span className={styles.chipCountBadge}>{kpiStats.pyqCount}</span>
        </button>

        <button
          type="button"
          className={`${styles.presetChip} ${activePreset === 'BITSAT' ? styles.activeChip : ''}`}
          onClick={() => handlePresetClick('BITSAT')}
        >
          <span>BITSAT Drills</span>
          <span className={styles.chipCountBadge}>{kpiStats.bitsatCount}</span>
        </button>

        <div className={styles.chipDivider} />

        <button
          type="button"
          className={`${styles.presetChip} ${activePreset === 'MATH' ? styles.activeChip : ''}`}
          onClick={() => handlePresetClick('MATH')}
        >
          <span>Mathematics</span>
        </button>

        <button
          type="button"
          className={`${styles.presetChip} ${activePreset === 'PHY' ? styles.activeChip : ''}`}
          onClick={() => handlePresetClick('PHY')}
        >
          <span>Physics</span>
        </button>

        <button
          type="button"
          className={`${styles.presetChip} ${activePreset === 'CHM' ? styles.activeChip : ''}`}
          onClick={() => handlePresetClick('CHM')}
        >
          <span>Chemistry</span>
        </button>

        <div className={styles.chipDivider} />

        <button
          type="button"
          className={`${styles.presetChip} ${activePreset === 'PUBLISHED' ? styles.activeChip : ''}`}
          onClick={() => handlePresetClick('PUBLISHED')}
        >
          <span>Published ({kpiStats.published})</span>
        </button>

        <button
          type="button"
          className={`${styles.presetChip} ${activePreset === 'DRAFT' ? styles.activeChip : ''}`}
          onClick={() => handlePresetClick('DRAFT')}
        >
          <span>Drafts ({problemSets.filter((p) => p.status === 'Draft').length})</span>
        </button>
      </div>

      {/* ─── 4. FILTERING & SEARCH CONTROL TOOLBAR ─── */}
      <div className={styles.toolbarContainer}>
        {/* Search Bar */}
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search problems by chapter, topic, code or slug..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdowns Control Strip */}
        <div className={styles.filterControlsGroup}>
          {/* Module Type */}
          <div className={styles.filterControlItem}>
            <label className={styles.filterLabel}>Type:</label>
            <select
              className={styles.filterSelect}
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Types</option>
              <option value="DPP">Daily Practice Problem (DPP)</option>
              <option value="PYQ">Chapter PYQ</option>
              <option value="BITSAT">BITSAT Speed Drill</option>
            </select>
          </div>

          {/* Subject */}
          <div className={styles.filterControlItem}>
            <label className={styles.filterLabel}>Subject:</label>
            <select
              className={styles.filterSelect}
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

          {/* Status */}
          <div className={styles.filterControlItem}>
            <label className={styles.filterLabel}>Status:</label>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── 4B. ARCHIVE YEARS MANAGEMENT STRIP ─── */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '12px',
        padding: '12px 18px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>📅 PYQ Archive Years ({adminPyqYears.length}):</span>
          </span>
          {adminPyqYears.map((yr) => (
            <span
              key={yr}
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                padding: '3px 9px',
                borderRadius: '6px'
              }}
            >
              {yr}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isCreatingYear ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="number"
                autoFocus
                placeholder="Year (e.g. 2019, 2018)"
                value={newYearInput}
                onChange={(e) => setNewYearInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const y = Number(newYearInput);
                    if (y) handleCreateYear(y);
                  } else if (e.key === 'Escape') {
                    setIsCreatingYear(false);
                  }
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1.5px solid #2563eb',
                  fontSize: '12px',
                  width: '140px',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const y = Number(newYearInput);
                  if (y) handleCreateYear(y);
                }}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Save Year
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingYear(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ✕ Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreatingYear(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Plus size={14} />
              <span>+ Add / Create Archive Year</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── 5. MAIN DATA TABLE ─── */}
      <div className={styles.tableCardContainer}>
        <div className={styles.tableResponsive}>
          <table className={styles.mainDataTable}>
            <thead>
              <tr>
                <th
                  style={{ width: '45px', textAlign: 'center' }}
                  className={styles.sortableTh}
                  onClick={() => handleSort('indexNo')}
                >
                  <div className={styles.thContentRow}>
                    <span>#</span>
                    <span className={`${styles.sortArrow} ${sortField === 'indexNo' ? styles.sortActive : ''}`}>
                      {sortField === 'indexNo' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </div>
                </th>
                <th
                  style={{ minWidth: '260px' }}
                  className={styles.sortableTh}
                  onClick={() => handleSort('title')}
                >
                  <div className={styles.thContentRow}>
                    <span>TITLE &amp; REFERENCE</span>
                    <span className={`${styles.sortArrow} ${sortField === 'title' ? styles.sortActive : ''}`}>
                      {sortField === 'title' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </div>
                </th>
                <th
                  style={{ width: '150px' }}
                  className={styles.sortableTh}
                  onClick={() => handleSort('moduleType')}
                >
                  <div className={styles.thContentRow}>
                    <span>CATEGORY / TYPE</span>
                    <span className={`${styles.sortArrow} ${sortField === 'moduleType' ? styles.sortActive : ''}`}>
                      {sortField === 'moduleType' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </div>
                </th>
                <th
                  style={{ width: '150px' }}
                  className={styles.sortableTh}
                  onClick={() => handleSort('questionsCount')}
                >
                  <div className={styles.thContentRow}>
                    <span>PROBLEMS</span>
                    <span className={`${styles.sortArrow} ${sortField === 'questionsCount' ? styles.sortActive : ''}`}>
                      {sortField === 'questionsCount' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </div>
                </th>
                <th
                  style={{ width: '120px' }}
                  className={styles.sortableTh}
                  onClick={() => handleSort('status')}
                >
                  <div className={styles.thContentRow}>
                    <span>STATUS</span>
                    <span className={`${styles.sortArrow} ${sortField === 'status' ? styles.sortActive : ''}`}>
                      {sortField === 'status' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </div>
                </th>
                <th
                  style={{ width: '110px' }}
                  className={styles.sortableTh}
                  onClick={() => handleSort('attemptsCount')}
                >
                  <div className={styles.thContentRow}>
                    <span>ATTEMPTS</span>
                    <span className={`${styles.sortArrow} ${sortField === 'attemptsCount' ? styles.sortActive : ''}`}>
                      {sortField === 'attemptsCount' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </div>
                </th>
                <th style={{ width: '150px' }}>CREATED AT</th>
                <th style={{ width: '180px', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8}>
                    <div className={styles.loadingStateContainer}>
                      <Loader2 size={24} className={styles.spinIcon} />
                      <span>Loading problem sets...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedSets.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyRowCell}>
                    <div className={styles.emptyStateContainer}>
                      <AlertTriangle size={32} className={styles.emptyIcon} />
                      <p className={styles.emptyTitle}>No problem sets match your criteria</p>
                      <p className={styles.emptySub}>
                        Try adjusting your keyword or reset filters to view all repository modules.
                      </p>
                      <button
                        type="button"
                        className={styles.resetFiltersBtn}
                        onClick={() => {
                          setSearchQuery('');
                          setModuleFilter('ALL');
                          setSubjectFilter('ALL');
                          setStatusFilter('ALL');
                          setActivePreset('ALL');
                        }}
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSets.map((item, rowIdx) => {
                  const isDropdownOpen = openDropdownId === item.id;
                  const itemIndex = (currentPage - 1) * pageSize + rowIdx + 1;

                  return (
                    <tr key={item.id} className={styles.tableRow}>
                      <td className={styles.indexCell}>{itemIndex}</td>

                      <td className={styles.titleCell}>
                        <div className={styles.titleWrapper}>
                          <span
                            className={`${styles.badgeCodePill} ${
                              item.moduleType === 'BITSAT'
                                ? styles.badgeBitsat
                                : item.moduleType === 'PYQ'
                                ? styles.badgePyq
                                : styles.badgeDpp
                            }`}
                          >
                            {item.badgeCode}
                          </span>
                          <div className={styles.titleTexts}>
                            <span className={styles.primaryTitle}>{item.title}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                              <span className={styles.slugUrl}>{item.slug}</span>
                              {item.isFree === false ? (
                                <span style={{ color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '10.5px' }}>
                                  🔒 Locked (₹{item.price || 499})
                                </span>
                              ) : (
                                <span style={{ color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '10.5px' }}>
                                  ✓ Free Access
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`${styles.categoryPill} ${
                            item.subject === 'Physics'
                              ? styles.pillBlue
                              : item.subject === 'Chemistry'
                              ? styles.pillEmerald
                              : item.subject === 'Mathematics'
                              ? styles.pillPurple
                              : styles.pillAmber
                          }`}
                        >
                          {item.categoryLabel}
                        </span>
                      </td>

                      <td>
                        <div className={styles.problemsCell}>
                          <span className={styles.problemCountText}>
                            {item.questionsCount} Problems
                          </span>
                          <span className={styles.problemSubNote}>{item.solutionNote}</span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`${styles.statusDotPill} ${
                            item.status === 'Published'
                              ? styles.statusPublished
                              : item.status === 'Draft'
                              ? styles.statusDraft
                              : item.status === 'Scheduled'
                              ? styles.statusScheduled
                              : styles.statusArchived
                          }`}
                        >
                          <span className={styles.statusDot} />
                          <span>{item.status}</span>
                        </span>
                      </td>

                      <td>
                        <span className={styles.attemptsCountBadge}>
                          {item.attemptsCount.toLocaleString()}
                        </span>
                      </td>

                      <td className={styles.dateCell}>
                        <span>{item.createdAtFormatted}</span>
                        {item.scheduledDate && (
                          <div className={styles.scheduledSubText}>
                            <Calendar size={11} />
                            <span>{item.scheduledDate}</span>
                          </div>
                        )}
                      </td>

                      <td className={styles.actionCell}>
                        <div className={styles.inlineActionGroup}>
                          {/* Inline Edit Questions button */}
                          <button
                            type="button"
                            className={styles.btnActionEdit}
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit questions in authoring studio"
                          >
                            <Pencil size={13} />
                            <span>Edit</span>
                          </button>

                          {/* Inline Student Solver preview button */}
                          <button
                            type="button"
                            className={styles.btnActionSolve}
                            onClick={() => {
                              setPreviewingStudentItem(item);
                              setPreviewCurrentQIndex(0);
                              setPreviewSelectedOptions({});
                              setPreviewShowSolution(false);
                              setPreviewSubmitted(false);
                              setPreviewSecondsLeft(1800);
                            }}
                            title="Test-drive in Student Practice Simulator"
                          >
                            <Play size={13} />
                            <span>Solve</span>
                          </button>

                          {/* 3-dots Context Menu */}
                          <div
                            className={styles.actionMenuWrapper}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className={`${styles.actionTriggerBtn} ${
                                isDropdownOpen ? styles.triggerActive : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(isDropdownOpen ? null : item.id);
                              }}
                              title="More options"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {isDropdownOpen && (
                              <div className={styles.contextDropdownMenu}>
                                <button
                                  type="button"
                                  className={styles.menuItemBtn}
                                  onClick={() => {
                                    setViewingItem(item);
                                    setOpenDropdownId(null);
                                  }}
                                >
                                  <Eye size={14} />
                                  <span>View Overview</span>
                                </button>

                                <button
                                  type="button"
                                  className={styles.menuItemBtn}
                                  onClick={() => handleDuplicate(item)}
                                >
                                  <Copy size={14} />
                                  <span>Duplicate Set</span>
                                </button>

                                {item.status !== 'Published' ? (
                                  <button
                                    type="button"
                                    className={styles.menuItemBtn}
                                    onClick={() => handleToggleStatus(item, 'Published')}
                                  >
                                    <Check size={14} />
                                    <span>Publish to Students</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className={styles.menuItemBtn}
                                    onClick={() => handleToggleStatus(item, 'Draft')}
                                  >
                                    <PauseCircle size={14} />
                                    <span>Unpublish to Draft</span>
                                  </button>
                                )}

                                <div className={styles.menuDivider} />

                                <button
                                  type="button"
                                  className={`${styles.menuItemBtn} ${styles.dangerItem}`}
                                  onClick={() => {
                                    setDeleteConfirmItem(item);
                                    setOpenDropdownId(null);
                                  }}
                                >
                                  <Trash2 size={14} />
                                  <span>Delete Set</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── 6. PAGINATION FOOTER ─── */}
        <div className={styles.paginationFooter}>
          <div className={styles.paginationInfo}>
            <span>
              Showing {filteredSets.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filteredSets.length)} of {filteredSets.length} problem sets
            </span>

            <div className={styles.pageSizeWrapper}>
              <span>Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={styles.pageSizeSelect}
              >
                <option value={5}>5</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>

          <div className={styles.paginationControls}>
            <button
              type="button"
              className={styles.pageArrowBtn}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              title="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                className={`${styles.pageNumberBtn} ${
                  currentPage === pg ? styles.activePage : ''
                }`}
                onClick={() => setCurrentPage(pg)}
              >
                {pg}
              </button>
            ))}

            <button
              type="button"
              className={styles.pageArrowBtn}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              title="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 4B. ARCHIVE YEARS MANAGEMENT STRIP ─── */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '12px',
        padding: '12px 18px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>📅 PYQ Archive Years ({adminPyqYears.length}):</span>
          </span>
          {adminPyqYears.map((yr) => (
            <span
              key={yr}
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                padding: '3px 9px',
                borderRadius: '6px'
              }}
            >
              {yr}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isCreatingYear ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="number"
                autoFocus
                placeholder="Year (e.g. 2019, 2018)"
                value={newYearInput}
                onChange={(e) => setNewYearInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const y = Number(newYearInput);
                    if (y) handleCreateYear(y);
                  } else if (e.key === 'Escape') {
                    setIsCreatingYear(false);
                  }
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1.5px solid #2563eb',
                  fontSize: '12px',
                  width: '140px',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const y = Number(newYearInput);
                  if (y) handleCreateYear(y);
                }}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Save Year
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingYear(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ✕ Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreatingYear(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Plus size={14} />
              <span>+ Add / Create Archive Year</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── 7. CREATE PROBLEM SET MODAL (PREMIUM CURRICULUM AUTHORING STUDIO) ─── */}
      {isCreateModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
          <div className={styles.modalCardEnhanced} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <div className={styles.modalIconTileGradient}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <div className={styles.modalPreHeadingRow}>
                    <span className={styles.modalPreBadge}>CURRICULUM BUILDER</span>
                    <span className={styles.modalDot}>•</span>
                    <span className={styles.modalHintText}>DPP • PYQ • BITSAT</span>
                  </div>
                  <h2 className={styles.modalTitle}>Create New Problem Set</h2>
                </div>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsCreateModalOpen(false)}
                title="Close modal (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className={styles.modalFormEnhanced}>
              {/* Step 1: Category Selector Cards */}
              <div className={styles.formSectionBox}>
                <div className={styles.fieldSectionHeading}>
                  <span>1. Practice Module &amp; Category *</span>
                  <span className={styles.requiredIndicator}>Select format</span>
                </div>
                <div className={styles.categoryCardsGrid}>
                  {/* Card 1: DPP */}
                  <div
                    role="button"
                    tabIndex={0}
                    className={`${styles.categoryCard} ${newModuleType === 'DPP' ? styles.categoryCardActiveDpp : ''}`}
                    onClick={() => {
                      setNewModuleType('DPP');
                      if (newChapter) {
                        setNewTitle(`DPP: ${newChapter} (Speed Shortcuts)`);
                        setNewSlug(`/dpp-${newChapter.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`);
                      }
                    }}
                  >
                    <div className={styles.categoryCardTop}>
                      <div className={`${styles.catIconPill} ${styles.catDppIcon}`}>
                        <Flame size={18} />
                      </div>
                      <span className={styles.catBadgePill}>DPP Drill</span>
                    </div>
                    <div className={styles.catCardBody}>
                      <h4 className={styles.catCardTitle}>Daily Practice (DPP)</h4>
                      <p className={styles.catCardDesc}>
                        Chapter-wise high yield drills with 20-30s speed inspection shortcuts.
                      </p>
                    </div>
                    <div className={styles.catSelectionIndicator}>
                      <div className={styles.catRadioDot} />
                    </div>
                  </div>

                  {/* Card 2: PYQ */}
                  <div
                    role="button"
                    tabIndex={0}
                    className={`${styles.categoryCard} ${newModuleType === 'PYQ' ? styles.categoryCardActivePyq : ''}`}
                    onClick={() => {
                      setNewModuleType('PYQ');
                      if (newChapter) {
                        setNewTitle(`PYQ Archive: ${newChapter} (${newExamTarget})`);
                        setNewSlug(`/pyq-${newChapter.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`);
                      }
                    }}
                  >
                    <div className={styles.categoryCardTop}>
                      <div className={`${styles.catIconPill} ${styles.catPyqIcon}`}>
                        <BookOpen size={18} />
                      </div>
                      <span className={styles.catBadgePill}>PYQ Bank</span>
                    </div>
                    <div className={styles.catCardBody}>
                      <h4 className={styles.catCardTitle}>JEE Main &amp; Adv PYQs</h4>
                      <p className={styles.catCardDesc}>
                        Solved past exam archives with video solutions and step answers.
                      </p>
                    </div>
                    <div className={styles.catSelectionIndicator}>
                      <div className={styles.catRadioDot} />
                    </div>
                  </div>

                  {/* Card 3: BITSAT */}
                  <div
                    role="button"
                    tabIndex={0}
                    className={`${styles.categoryCard} ${newModuleType === 'BITSAT' ? styles.categoryCardActiveBitsat : ''}`}
                    onClick={() => {
                      setNewModuleType('BITSAT');
                      setNewExamTarget('BITSAT 2026');
                      setNewSolutionNote('Strict 45s timer format with step solutions');
                      if (newChapter) {
                        setNewTitle(`BITSAT Speed Drill: ${newChapter} Rapid Fire`);
                        setNewSlug(`/bitsat-${newChapter.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`);
                      }
                    }}
                  >
                    <div className={styles.categoryCardTop}>
                      <div className={`${styles.catIconPill} ${styles.catBitsatIcon}`}>
                        <Zap size={18} />
                      </div>
                      <span className={styles.catBadgePill}>Speed Test</span>
                    </div>
                    <div className={styles.catCardBody}>
                      <h4 className={styles.catCardTitle}>BITSAT Speed Drill</h4>
                      <p className={styles.catCardDesc}>
                        Rapid-fire timer CBT mode calibrated for speed and accuracy.
                      </p>
                    </div>
                    <div className={styles.catSelectionIndicator}>
                      <div className={styles.catRadioDot} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Subject, Chapter & High-Yield Topic */}
              <div className={styles.formSectionBox}>
                <div className={styles.fieldSectionHeading}>
                  <span>2. Subject Domain &amp; Chapter Selection *</span>
                  <span className={styles.sectionSubtitle}>1-Click populate title</span>
                </div>

                <div className={styles.formTwoColGrid}>
                  <div className={styles.fieldItem}>
                    <label className={styles.fieldLabel}>Subject Domain *</label>
                    <select
                      className={styles.fieldSelectEnhanced}
                      value={newSubject}
                      onChange={(e) => {
                        const sub = e.target.value as ProblemSubject;
                        setNewSubject(sub);
                        const firstCh = HIGH_YIELD_CHAPTERS[sub]?.[0] || 'Chapter 1';
                        setNewChapter(firstCh);
                        if (newModuleType === 'DPP') {
                          setNewTitle(`DPP: ${firstCh} (DK Sir Inspection)`);
                          setNewSlug(`/dpp-${firstCh.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`);
                        } else if (newModuleType === 'PYQ') {
                          setNewTitle(`PYQ Archive: ${firstCh} (${newExamTarget})`);
                          setNewSlug(`/pyq-${firstCh.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`);
                        } else {
                          setNewTitle(`BITSAT Drill: ${firstCh}`);
                          setNewSlug(`/bitsat-${firstCh.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`);
                        }
                      }}
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Mixed">Mixed (Full Syllabus Mock)</option>
                    </select>
                  </div>

                  <div className={styles.fieldItem}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label className={styles.fieldLabel}>Target Examination &amp; Year</label>
                      {!isCreatingYear && (
                        <button
                          type="button"
                          onClick={() => setIsCreatingYear(true)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#2563eb',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          + Create Year
                        </button>
                      )}
                    </div>

                    {isCreatingYear ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="number"
                          autoFocus
                          placeholder="e.g. 2002"
                          value={newYearInput}
                          onChange={(e) => setNewYearInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const y = Number(newYearInput);
                              if (y) {
                                handleCreateYear(y);
                                setNewExamTarget(`JEE Main ${y}`);
                                if (newModuleType === 'PYQ') {
                                  setNewTitle(`PYQ Archive: ${newChapter} (JEE Main ${y})`);
                                }
                              }
                            } else if (e.key === 'Escape') {
                              setIsCreatingYear(false);
                            }
                          }}
                          className={styles.fieldInputEnhanced}
                          style={{ maxWidth: '140px', height: '36px' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const y = Number(newYearInput);
                            if (y) {
                              handleCreateYear(y);
                              setNewExamTarget(`JEE Main ${y}`);
                              if (newModuleType === 'PYQ') {
                                setNewTitle(`PYQ Archive: ${newChapter} (JEE Main ${y})`);
                              }
                            }
                          }}
                          style={{
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0 12px',
                            height: '36px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCreatingYear(false)}
                          style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px' }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <select
                        className={styles.fieldSelectEnhanced}
                        value={newExamTarget}
                        onChange={(e) => {
                          if (e.target.value === '__CREATE_NEW_YEAR__') {
                            setIsCreatingYear(true);
                          } else {
                            setNewExamTarget(e.target.value);
                          }
                        }}
                      >
                        {adminPyqYears.map((yr) => (
                          <React.Fragment key={yr}>
                            <option value={`JEE Main ${yr}`}>JEE Main {yr}</option>
                            <option value={`JEE Advanced ${yr}`}>JEE Advanced {yr}</option>
                          </React.Fragment>
                        ))}
                        <option value="BITSAT 2026">BITSAT 2026</option>
                        <option value="Class 11/12 Foundation">Class 11/12 Foundation</option>
                        <option value="__CREATE_NEW_YEAR__">+ Create / Add Custom Year...</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* High-yield Chapter Quick Pick Pills */}
                <div className={styles.chapterQuickPickRow}>
                  <span className={styles.quickPickPrompt}>High-Yield Chapters:</span>
                  <div className={styles.chapterPillsStrip}>
                    {(HIGH_YIELD_CHAPTERS[newSubject] || []).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        className={`${styles.chapterPill} ${newChapter === ch ? styles.chapterPillActive : ''}`}
                        onClick={() => {
                          setNewChapter(ch);
                          if (newModuleType === 'DPP') {
                            setNewTitle(`DPP: ${ch} (Speed Inspection & Concepts)`);
                            setNewSlug(`/dpp-${ch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`);
                          } else if (newModuleType === 'PYQ') {
                            setNewTitle(`PYQ Archive: ${ch} (${newExamTarget})`);
                            setNewSlug(`/pyq-${ch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`);
                          } else {
                            setNewTitle(`BITSAT Speed Drill: ${ch}`);
                            setNewSlug(`/bitsat-${ch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`);
                          }
                        }}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 3: Title & Custom Slug */}
              <div className={styles.formSectionBox}>
                <div className={styles.fieldSectionHeading}>
                  <span>3. Problem Set Title &amp; Web URL *</span>
                </div>

                <div className={styles.fieldItem}>
                  <label className={styles.fieldLabel}>Display Title *</label>
                  <input
                    type="text"
                    className={styles.fieldInputEnhanced}
                    placeholder="e.g. DPP-06: Conic Sections & Hyperbola Dynamics"
                    value={newTitle}
                    onChange={(e) => {
                      setNewTitle(e.target.value);
                      if (!newSlug || newSlug.startsWith('/')) {
                        setNewSlug(
                          `/${e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)+/g, '')}`
                        );
                      }
                    }}
                    required
                  />
                </div>

                <div className={styles.fieldItem} style={{ marginTop: '12px' }}>
                  <label className={styles.fieldLabel}>URL Slug Path</label>
                  <div className={styles.slugInputContainer}>
                    <span className={styles.slugPrefix}>dkacademy.in/practice</span>
                    <input
                      type="text"
                      className={styles.slugInputField}
                      placeholder="/dpp-06-conic-sections"
                      value={newSlug.startsWith('/') ? newSlug : `/${newSlug}`}
                      onChange={(e) => setNewSlug(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Questions, Solution Note & Status */}
              <div className={styles.formSectionBox}>
                <div className={styles.fieldSectionHeading}>
                  <span>4. Drill Parameters &amp; Release Status</span>
                </div>

                <div className={styles.formThreeColGrid}>
                  <div className={styles.fieldItem}>
                    <label className={styles.fieldLabel}>Questions Count</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      className={styles.fieldInputEnhanced}
                      value={newQuestionsCount}
                      onChange={(e) => {
                        const count = Number(e.target.value);
                        setNewQuestionsCount(count);
                        setNewSolutionNote(`${count} with step solutions`);
                      }}
                    />
                  </div>

                  <div className={styles.fieldItem}>
                    <label className={styles.fieldLabel}>Fixed Timer Duration (Minutes) *</label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      className={styles.fieldInputEnhanced}
                      placeholder="e.g. 15 mins"
                      value={newDurationMinutes}
                      onChange={(e) => setNewDurationMinutes(Number(e.target.value))}
                    />
                  </div>

                  <div className={styles.fieldItem}>
                    <label className={styles.fieldLabel}>Solution Note</label>
                    <input
                      type="text"
                      className={styles.fieldInputEnhanced}
                      placeholder="e.g. 5 with step video solutions"
                      value={newSolutionNote}
                      onChange={(e) => setNewSolutionNote(e.target.value)}
                    />
                  </div>

                  <div className={styles.fieldItem}>
                    <label className={styles.fieldLabel}>Release Status</label>
                    <select
                      className={styles.fieldSelectEnhanced}
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as ProblemStatus)}
                    >
                      <option value="Published">Published (Live for Students)</option>
                      <option value="Draft">Draft (Editorial Review)</option>
                      <option value="Scheduled">Scheduled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 5: Access & Monetization Control */}
              <div className={styles.formSectionBox}>
                <div className={styles.fieldSectionHeading}>
                  <span>5. Access &amp; Monetization Control *</span>
                  <span className={styles.requiredIndicator}>Student Access Mode</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '10px' }}>
                  <div
                    onClick={() => {
                      setNewIsFree(true);
                      setNewPrice(0);
                    }}
                    style={{
                      border: newIsFree ? '2px solid #16a34a' : '1.5px solid #e2e8f0',
                      background: newIsFree ? '#f0fdf4' : '#ffffff',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '13.5px', color: newIsFree ? '#15803d' : '#334155' }}>
                        ✓ 100% Free Practice
                      </span>
                      {newIsFree && <span style={{ fontSize: '11px', background: '#16a34a', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>ACTIVE</span>}
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Visible to all students directly. Zero payment required.
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setNewIsFree(false);
                      if (!newPrice) setNewPrice(499);
                    }}
                    style={{
                      border: !newIsFree ? '2px solid #7c3aed' : '1.5px solid #e2e8f0',
                      background: !newIsFree ? '#faf5ff' : '#ffffff',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '13.5px', color: !newIsFree ? '#6d28d9' : '#334155' }}>
                        🔒 Paid / Locked (Monetized)
                      </span>
                      {!newIsFree && <span style={{ fontSize: '11px', background: '#7c3aed', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>LOCKED</span>}
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Requires student course enrollment or payment to unlock full questions.
                    </span>
                  </div>
                </div>

                {!newIsFree && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Unlock Fee (₹):</label>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value))}
                      style={{
                        width: '120px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1.5px solid #7c3aed',
                        fontWeight: 700,
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Aspirants pay this amount to unlock full solutions.</span>
                  </div>
                )}
              </div>

              {/* Step 6: Video Walkthrough & Solution PDF */}
              <div className={styles.formSectionBox}>
                <div className={styles.fieldSectionHeading}>
                  <span>6. Video Walkthrough &amp; Solution PDF *</span>
                  <span className={styles.requiredIndicator}>Optional Attachments</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginTop: '10px' }}>
                  <div className={styles.fieldItem}>
                    <label className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Video size={14} style={{ color: '#ef4444' }} />
                      <span>YouTube Solution Video URL:</span>
                    </label>
                    <input
                      type="url"
                      className={styles.fieldInputEnhanced}
                      placeholder="e.g. https://www.youtube.com/watch?v=... or /videos/lec1.mp4"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                    />
                  </div>

                  <div className={styles.fieldItem}>
                    <label className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} style={{ color: '#10b981' }} />
                      <span>Downloadable Solution PDF URL:</span>
                    </label>
                    <input
                      type="text"
                      className={styles.fieldInputEnhanced}
                      placeholder="e.g. /assets/downloads/straight-lines.pdf or https://..."
                      value={newPdfUrl}
                      onChange={(e) => setNewPdfUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Live Card Preview Box */}
              <div className={styles.livePreviewCardBox}>
                <div className={styles.previewBoxHeader}>
                  <span className={styles.previewBadgeTitle}>LIVE CARD PREVIEW</span>
                  <span className={styles.previewNote}>How students will see this in the practice hub</span>
                </div>
                <div className={styles.previewCardRow}>
                  <div className={styles.previewBadge}>
                    {newModuleType === 'BITSAT'
                      ? 'BITSAT'
                      : `${newModuleType} • ${newSubject.slice(0, 3).toUpperCase()}`}
                  </div>
                  <div className={styles.previewCardDetails}>
                    <h5 className={styles.previewTitleText}>
                      {newTitle.trim() || 'Untitled Practice Problem Set'}
                    </h5>
                    <div className={styles.previewMetaRow}>
                      <span>{newQuestionsCount} Questions</span>
                      <span>•</span>
                      <span>{newSolutionNote || 'Step video solutions'}</span>
                      <span>•</span>
                      <span className={newStatus === 'Published' ? styles.statusGreen : styles.statusAmber}>
                        ● {newStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className={styles.modalFooterActionsEnhanced}>
                <div className={styles.footerHint}>
                  <span>💡 Tip: You can edit and author individual question statements right after saving.</span>
                </div>
                <div className={styles.footerBtnGroup}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.btnPrimaryEnhanced} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className={styles.spinIcon} />
                        <span>Saving to Database...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Create &amp; Author Questions</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 8. VIEW OVERVIEW MODAL ─── */}
      {viewingItem && (
        <div className={styles.modalOverlay} onClick={() => setViewingItem(null)}>
          <div className={styles.modalCardWide} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <span className={styles.badgeCodePill}>{viewingItem.badgeCode}</span>
                <div>
                  <h2 className={styles.modalTitle}>{viewingItem.title}</h2>
                  <p className={styles.modalSub}>
                    {viewingItem.categoryLabel} • {viewingItem.questionsCount} Problems • {viewingItem.solutionNote}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setViewingItem(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalScrollBody}>
              <div className={styles.viewOverviewStrip}>
                <div className={styles.miniStat}>
                  <span className={styles.miniLabel}>Category</span>
                  <span className={styles.miniVal}>{viewingItem.categoryLabel}</span>
                </div>
                <div className={styles.miniStat}>
                  <span className={styles.miniLabel}>Status</span>
                  <span className={styles.miniVal}>{viewingItem.status}</span>
                </div>
                <div className={styles.miniStat}>
                  <span className={styles.miniLabel}>Aspirant Attempts</span>
                  <span className={styles.miniVal}>{viewingItem.attemptsCount.toLocaleString()}</span>
                </div>
                <div className={styles.miniStat}>
                  <span className={styles.miniLabel}>Created</span>
                  <span className={styles.miniVal}>{viewingItem.createdAtFormatted}</span>
                </div>
              </div>

              <h3 className={styles.sectionHeaderTitle}>Curated Question Repository</h3>

              <div className={styles.questionsListStacked}>
                {viewingItem.questions.map((q, idx) => (
                  <div key={q.id || idx} className={styles.questionCardBox}>
                    <div className={styles.qCardTop}>
                      <div className={styles.qCardNumBadge}>Question {idx + 1}</div>
                      <span className={styles.qTopicTag}>{q.topic}</span>
                      <span className={styles.qDifficultyTag}>{q.difficulty}</span>
                      {q.examYear && <span className={styles.qYearTag}>{q.examYear}</span>}
                    </div>

                    <p className={styles.qStatementText}>{q.statement}</p>

                    <div className={styles.optionsGridTwoCol}>
                      {q.options.map((opt) => (
                        <div
                          key={opt.key}
                          className={`${styles.optPreviewBox} ${
                            opt.key === q.correctKey ? styles.optCorrect : ''
                          }`}
                        >
                          <span className={styles.optKeyBadge}>{opt.key}</span>
                          <span className={styles.optText}>{opt.text}</span>
                          {opt.key === q.correctKey && (
                            <span className={styles.correctKeyIndicator}>✓ Correct Key</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {q.dkSirShortcut && (
                      <div className={styles.dkSirTrickStrip}>
                        <Flame size={16} className={styles.flameIcon} />
                        <div>
                          <strong>Kota Pedagogy Speed Shortcut:</strong> {q.dkSirShortcut}
                        </div>
                      </div>
                    )}

                    <div className={styles.solutionTextStrip}>
                      <strong>Step Solution:</strong> {q.stepSolution}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.modalFooterActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setViewingItem(null)}
              >
                Close
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => {
                  handleOpenEditModal(viewingItem);
                  setViewingItem(null);
                }}
              >
                <Pencil size={15} />
                <span>Edit Question Bank</span>
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => {
                  setPreviewingStudentItem(viewingItem);
                  setViewingItem(null);
                }}
              >
                <Play size={15} />
                <span>Launch Interactive Student Solver</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 9. QUESTION BANK AUTHORING STUDIO MODAL ─── */}
      {editingItem && (
        <div className={styles.modalOverlay} onClick={() => setEditingItem(null)}>
          <div className={styles.modalCardStudio} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <span className={styles.badgeCodePill}>{editingItem.badgeCode}</span>
                <div>
                  <h2 className={styles.modalTitle}>Question Bank Authoring Studio</h2>
                  <p className={styles.modalSub}>
                    Curate problems, KaTeX equations, options, correct keys, and DK Sir speed shortcuts for <strong>"{editingItem.title}"</strong>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setEditingItem(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Studio Navigation Tabs: Switch Questions vs Settings */}
            <div className={styles.studioTabBar}>
              <div className={styles.studioQuestionsTabs}>
                {editingItem.questions.map((q, idx) => (
                  <button
                    key={q.id || idx}
                    type="button"
                    className={`${styles.qTabBtn} ${
                      editingQuestionIdx === idx ? styles.qTabActive : ''
                    }`}
                    onClick={() => setEditingQuestionIdx(idx)}
                  >
                    <span>Q{idx + 1}</span>
                    <span className={styles.qTopicMini}>{q.topic?.slice(0, 10)}</span>
                  </button>
                ))}

                <button
                  type="button"
                  className={styles.addQTabBtn}
                  onClick={handleAddQuestionToEditingItem}
                  title="Add new question"
                >
                  <Plus size={14} />
                  <span>Add Q</span>
                </button>
              </div>

              <div className={styles.qActionButtonsBar}>
                <button
                  type="button"
                  className={styles.smallActionBtn}
                  onClick={() => handleDuplicateQuestionInEditingItem(editingQuestionIdx)}
                  title="Duplicate active question"
                >
                  <Copy size={13} />
                  <span>Duplicate</span>
                </button>
                {editingItem.questions.length > 1 && (
                  <button
                    type="button"
                    className={`${styles.smallActionBtn} ${styles.dangerSmallBtn}`}
                    onClick={() => handleDeleteQuestionInEditingItem(editingQuestionIdx)}
                    title="Delete active question"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Question Editor Body */}
            {editingItem.questions[editingQuestionIdx] && (
              <div className={styles.studioEditorBody}>
                {/* Meta Row: Topic, Difficulty, Exam Year */}
                <div className={styles.editorMetaRow}>
                  <div className={styles.metaField}>
                    <label>Topic / Chapter Tag:</label>
                    <input
                      type="text"
                      className={styles.fieldInputSmall}
                      value={editingItem.questions[editingQuestionIdx].topic}
                      onChange={(e) => handleUpdateActiveQuestion({ topic: e.target.value })}
                    />
                  </div>

                  <div className={styles.metaField}>
                    <label>Difficulty Rating:</label>
                    <select
                      className={styles.fieldSelectSmall}
                      value={editingItem.questions[editingQuestionIdx].difficulty}
                      onChange={(e) =>
                        handleUpdateActiveQuestion({ difficulty: e.target.value as any })
                      }
                    >
                      <option value="Easy">Easy</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Challenging">Challenging</option>
                    </select>
                  </div>

                  <div className={styles.metaField} style={{ flex: '1 1 100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>
                        Archive Exam Year:
                      </label>
                      {!isCreatingYear && (
                        <button
                          type="button"
                          onClick={() => setIsCreatingYear(true)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#2563eb',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          + Create New Year
                        </button>
                      )}
                    </div>

                    {isCreatingYear && (
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
                        <input
                          type="number"
                          autoFocus
                          placeholder="e.g. 2002, 2008, 2011"
                          value={newYearInput}
                          onChange={(e) => setNewYearInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const y = Number(newYearInput);
                              if (y) {
                                handleCreateYear(y);
                                handleUpdateActiveQuestion({ examYear: `JEE ${y}` });
                              }
                            } else if (e.key === 'Escape') {
                              setIsCreatingYear(false);
                            }
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #2563eb',
                            fontSize: '12px',
                            outline: 'none',
                            width: '180px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const y = Number(newYearInput);
                            if (y) {
                              handleCreateYear(y);
                              handleUpdateActiveQuestion({ examYear: `JEE ${y}` });
                            }
                          }}
                          style={{
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Create &amp; Apply
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCreatingYear(false)}
                          style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Quick Year Selection Chips */}
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {adminPyqYears.map((yr) => {
                        const currentYearStr = String(editingItem.questions[editingQuestionIdx].examYear || '');
                        const isSelected = currentYearStr.includes(String(yr));
                        return (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => handleUpdateActiveQuestion({ examYear: `JEE ${yr}` })}
                            style={{
                              padding: '3px 9px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: isSelected ? 700 : 500,
                              cursor: 'pointer',
                              border: isSelected ? '1px solid #2563eb' : '1px solid #cbd5e1',
                              background: isSelected ? '#eff6ff' : '#f8fafc',
                              color: isSelected ? '#1d4ed8' : '#334155',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isSelected ? '✓ ' : ''}{yr}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: '6px' }}>
                      <input
                        type="text"
                        className={styles.fieldInputSmall}
                        placeholder="Custom label e.g. JEE Main 2002 Shift-1"
                        value={editingItem.questions[editingQuestionIdx].examYear || ''}
                        onChange={(e) => handleUpdateActiveQuestion({ examYear: e.target.value })}
                        style={{ width: '100%', fontSize: '12px' }}
                      />
                    </div>

                    {/* Paper & Question Monetization Controls */}
                    <div style={{ marginTop: '10px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>
                          Question Access:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateActiveQuestion({ isFree: true })}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: editingItem.questions[editingQuestionIdx].isFree !== false ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                            background: editingItem.questions[editingQuestionIdx].isFree !== false ? '#dcfce7' : '#ffffff',
                            color: editingItem.questions[editingQuestionIdx].isFree !== false ? '#15803d' : '#64748b'
                          }}
                        >
                          ✓ Free Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateActiveQuestion({ isFree: false })}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: editingItem.questions[editingQuestionIdx].isFree === false ? '1.5px solid #7c3aed' : '1px solid #cbd5e1',
                            background: editingItem.questions[editingQuestionIdx].isFree === false ? '#ede9fe' : '#ffffff',
                            color: editingItem.questions[editingQuestionIdx].isFree === false ? '#6d28d9' : '#64748b'
                          }}
                        >
                          🔒 Locked (Paid)
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>
                          Entire Paper:
                        </span>
                        <select
                          value={editingItem.isFree === false ? 'PAID' : 'FREE'}
                          onChange={(e) => {
                            const isPaid = e.target.value === 'PAID';
                            setEditingItem({
                              ...editingItem,
                              isFree: !isPaid,
                              price: isPaid ? (editingItem.price || 499) : 0
                            });
                          }}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            border: '1px solid #cbd5e1'
                          }}
                        >
                          <option value="FREE">✓ Free Set (₹0)</option>
                          <option value="PAID">🔒 Paid / Locked Set</option>
                        </select>
                        {editingItem.isFree === false && (
                          <input
                            type="number"
                            min={0}
                            step={10}
                            value={editingItem.price ?? 499}
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                price: Number(e.target.value)
                              })
                            }
                            placeholder="Price ₹"
                            style={{
                              width: '75px',
                              padding: '3px 6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              borderRadius: '4px',
                              border: '1.5px solid #7c3aed'
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Problem Statement Textarea & Live KaTeX preview */}
                <div className={styles.statementEditorSection}>
                  <label className={styles.sectionSmallLabel}>
                    Problem Statement (KaTeX LaTeX formulas supported):
                  </label>
                  <textarea
                    rows={3}
                    className={styles.statementTextarea}
                    value={editingItem.questions[editingQuestionIdx].statement}
                    onChange={(e) => handleUpdateActiveQuestion({ statement: e.target.value })}
                  />
                  <div className={styles.mathLivePreviewBox}>
                    <span className={styles.previewTag}>CANDIDATE VIEW PREVIEW:</span>
                    <p className={styles.previewFormulaText}>
                      {editingItem.questions[editingQuestionIdx].statement}
                    </p>
                  </div>
                </div>

                {/* 4 Options Grid with Correct Key radio */}
                <div className={styles.optionsEditorSection}>
                  <label className={styles.sectionSmallLabel}>
                    Answer Choices &amp; Answer Key (Select the correct option):
                  </label>
                  <div className={styles.optionsStack}>
                    {editingItem.questions[editingQuestionIdx].options.map((opt) => {
                      const isCorrect =
                        editingItem.questions[editingQuestionIdx].correctKey === opt.key;
                      return (
                        <div
                          key={opt.key}
                          className={`${styles.optEditorRow} ${
                            isCorrect ? styles.optEditorCorrect : ''
                          }`}
                        >
                          <label className={styles.optRadioWrap}>
                            <input
                              type="radio"
                              name={`correct-key-${editingQuestionIdx}`}
                              checked={isCorrect}
                              onChange={() => handleUpdateActiveQuestion({ correctKey: opt.key })}
                            />
                            <span className={styles.optLetterKey}>{opt.key}</span>
                          </label>
                          <input
                            type="text"
                            className={styles.optInputText}
                            value={opt.text}
                            onChange={(e) => handleUpdateOptionText(opt.key, e.target.value)}
                            placeholder={`Enter Option ${opt.key} value / equation...`}
                          />
                          {isCorrect && (
                            <span className={styles.answerKeyTag}>✓ Correct Key</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* DK Sir Kota 20-30s Speed Shortcut Box */}
                <div className={styles.kotaTrickCardEditor}>
                  <div className={styles.trickHeader}>
                    <Flame size={16} />
                    <strong>DK Sir Kota 20-30s Speed Inspection Trick:</strong>
                  </div>
                  <textarea
                    rows={2}
                    className={styles.trickTextarea}
                    value={editingItem.questions[editingQuestionIdx].dkSirShortcut || ''}
                    onChange={(e) => handleUpdateActiveQuestion({ dkSirShortcut: e.target.value })}
                    placeholder="Provide quick inspection trick, dimensional elimination, or King's property shortcut..."
                  />
                </div>

                {/* Detailed Step-by-Step Mathematical Derivation Solution */}
                <div className={styles.solutionCardEditor}>
                  <div className={styles.solutionHeader}>
                    <FileText size={16} />
                    <strong>Comprehensive Step-by-Step Mathematical Derivation:</strong>
                  </div>
                  <textarea
                    rows={3}
                    className={styles.solutionTextarea}
                    value={editingItem.questions[editingQuestionIdx].stepSolution || ''}
                    onChange={(e) => handleUpdateActiveQuestion({ stepSolution: e.target.value })}
                    placeholder="Provide detailed algebraic steps, integral limits, or physics force equations..."
                  />
                </div>

                {/* Question-Level YouTube Solution URL & Solution PDF URL */}
                <div style={{ marginTop: '14px', padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Sparkles size={16} style={{ color: '#2563eb' }} />
                    <strong style={{ fontSize: '13px', color: '#1e293b' }}>
                      Question Video Solution &amp; PDF Solutions:
                    </strong>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        <Video size={13} style={{ color: '#ef4444' }} />
                        <span>YouTube / Video Solution URL:</span>
                      </label>
                      <input
                        type="url"
                        className={styles.fieldInputSmall}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                        placeholder="https://www.youtube.com/watch?v=... or /videos/q1.mp4"
                        value={editingItem.questions[editingQuestionIdx].videoUrl || ''}
                        onChange={(e) => handleUpdateActiveQuestion({ videoUrl: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        <FileText size={13} style={{ color: '#10b981' }} />
                        <span>Downloadable Solution PDF URL:</span>
                      </label>
                      <input
                        type="text"
                        className={styles.fieldInputSmall}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                        placeholder="/assets/downloads/solution-q1.pdf or https://..."
                        value={editingItem.questions[editingQuestionIdx].pdfUrl || ''}
                        onChange={(e) => handleUpdateActiveQuestion({ pdfUrl: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Also Set-level video and pdf links and timer duration */}
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block' }}>
                        Fixed Timer Duration (Minutes):
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={180}
                        className={styles.fieldInputSmall}
                        style={{ width: '100%', boxSizing: 'border-box', fontSize: '11.5px' }}
                        placeholder="e.g. 15 mins"
                        value={editingItem.durationMinutes ?? 15}
                        onChange={(e) => setEditingItem({ ...editingItem, durationMinutes: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block' }}>
                        Overall Paper Walkthrough Video:
                      </label>
                      <input
                        type="url"
                        className={styles.fieldInputSmall}
                        style={{ width: '100%', boxSizing: 'border-box', fontSize: '11.5px' }}
                        placeholder="Full Paper Video: https://www.youtube.com/..."
                        value={editingItem.videoUrl || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, videoUrl: e.target.value, videoWalkthroughUrl: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block' }}>
                        Overall Paper Solution PDF:
                      </label>
                      <input
                        type="text"
                        className={styles.fieldInputSmall}
                        style={{ width: '100%', boxSizing: 'border-box', fontSize: '11.5px' }}
                        placeholder="Full Paper PDF: /assets/downloads/..."
                        value={editingItem.pdfUrl || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, pdfUrl: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.modalFooterActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setEditingItem(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleSaveEditingItem}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className={styles.spinIcon} />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Save All Questions &amp; Publish Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 10. STUDENT PRACTICE SIMULATOR MODAL ─── */}
      {previewingStudentItem && (
        <div className={styles.modalOverlay} onClick={() => setPreviewingStudentItem(null)}>
          <div className={styles.cbtPreviewModal} onClick={(e) => e.stopPropagation()}>
            {/* Topbar: Title, Timer, Quit */}
            <div className={styles.cbtTopbar}>
              <div className={styles.cbtTopbarLeft}>
                <span className={styles.badgeCodePill}>{previewingStudentItem.badgeCode}</span>
                <span className={styles.cbtTestTitle}>{previewingStudentItem.title}</span>
              </div>
              <div className={styles.cbtTopbarRight}>
                <div className={styles.cbtTimerBadge}>
                  <Clock size={16} />
                  <span>Time Left: {formatTimer(previewSecondsLeft)}</span>
                </div>
                <button
                  type="button"
                  className={styles.quitCbtBtn}
                  onClick={() => setPreviewingStudentItem(null)}
                >
                  <X size={16} />
                  <span>Exit Simulator</span>
                </button>
              </div>
            </div>

            {/* CBT Body: Left Problem Card, Right Palette */}
            <div className={styles.cbtWorkspaceGrid}>
              {/* Question Screen */}
              <div className={styles.cbtCardStage}>
                <div className={styles.cbtCardHeader}>
                  <span className={styles.qIndexPill}>
                    Question {previewCurrentQIndex + 1} of {previewingStudentItem.questions.length}
                  </span>
                  <span className={styles.markingPill}>+4 Marks / -1 Negative</span>
                </div>

                <div className={styles.cbtStatementArea}>
                  {previewingStudentItem.questions[previewCurrentQIndex]?.statement}
                </div>

                {/* Candidate Option Choices */}
                <div className={styles.cbtOptionsList}>
                  {previewingStudentItem.questions[previewCurrentQIndex]?.options.map((opt) => {
                    const qId = previewingStudentItem.questions[previewCurrentQIndex].id;
                    const isSelected = previewSelectedOptions[qId] === opt.key;
                    const isCorrect =
                      opt.key === previewingStudentItem.questions[previewCurrentQIndex].correctKey;

                    return (
                      <div
                        key={opt.key}
                        className={`${styles.cbtOptChoice} ${
                          isSelected ? styles.optSelectedChoice : ''
                        } ${previewShowSolution && isCorrect ? styles.optHighlightCorrect : ''}`}
                        onClick={() => {
                          if (previewSubmitted) return;
                          setPreviewSelectedOptions({
                            ...previewSelectedOptions,
                            [qId]: opt.key
                          });
                        }}
                      >
                        <span className={styles.cbtOptKey}>{opt.key}</span>
                        <span className={styles.optContentText}>{opt.text}</span>
                        {previewShowSolution && isCorrect && (
                          <span className={styles.correctKeyTag}>✓ Correct Key</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* DK Sir Kota Trick Callout */}
                {previewShowSolution && (
                  <div className={styles.studentSolutionRevealBlock}>
                    {previewingStudentItem.questions[previewCurrentQIndex]?.dkSirShortcut && (
                      <div className={styles.studentTrickBox}>
                        <Flame size={16} className={styles.flameIcon} />
                        <div>
                          <strong>DK Sir Kota 20-30s Inspection Trick:</strong>{' '}
                          {previewingStudentItem.questions[previewCurrentQIndex].dkSirShortcut}
                        </div>
                      </div>
                    )}
                    <div className={styles.studentDerivationBox}>
                      <strong>Detailed Step Solution:</strong>{' '}
                      {previewingStudentItem.questions[previewCurrentQIndex]?.stepSolution}
                    </div>
                  </div>
                )}

                {/* Navigation Bar */}
                <div className={styles.cbtNavigationFooter}>
                  <button
                    type="button"
                    className={styles.cbtPrevBtn}
                    disabled={previewCurrentQIndex === 0}
                    onClick={() => {
                      setPreviewCurrentQIndex((p) => Math.max(0, p - 1));
                      setPreviewShowSolution(false);
                    }}
                  >
                    ← Previous
                  </button>

                  <button
                    type="button"
                    className={styles.toggleSolutionBtn}
                    onClick={() => setPreviewShowSolution(!previewShowSolution)}
                  >
                    <Zap size={14} />
                    <span>{previewShowSolution ? 'Hide Solution' : 'Reveal Solution & DK Sir Trick'}</span>
                  </button>

                  <button
                    type="button"
                    className={styles.cbtNextBtn}
                    disabled={
                      previewCurrentQIndex === previewingStudentItem.questions.length - 1
                    }
                    onClick={() => {
                      setPreviewCurrentQIndex((p) =>
                        Math.min(previewingStudentItem.questions.length - 1, p + 1)
                      );
                      setPreviewShowSolution(false);
                    }}
                  >
                    Next Problem →
                  </button>
                </div>
              </div>

              {/* Right Palette */}
              <div className={styles.paletteCard}>
                <h3 className={styles.paletteTitle}>Question Palette</h3>
                <div className={styles.paletteGrid}>
                  {previewingStudentItem.questions.map((q, idx) => {
                    const isAnswered = Boolean(previewSelectedOptions[q.id]);
                    const isCurrent = previewCurrentQIndex === idx;

                    return (
                      <button
                        key={q.id || idx}
                        type="button"
                        className={`${styles.paletteBtn} ${
                          isCurrent ? styles.paletteCurrent : ''
                        } ${isAnswered ? styles.paletteAnswered : ''}`}
                        onClick={() => {
                          setPreviewCurrentQIndex(idx);
                          setPreviewShowSolution(false);
                        }}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className={styles.paletteLegend}>
                  <div className={styles.legendItem}>
                    <span className={`${styles.legendBox} ${styles.legendAnswered}`} />
                    <span>Attempted</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={`${styles.legendBox} ${styles.legendUnanswered}`} />
                    <span>Unattempted</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={`${styles.legendBox} ${styles.legendCurrent}`} />
                    <span>Active Viewing</span>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.cbtSubmitBtn}
                  onClick={() => {
                    setPreviewSubmitted(true);
                    setPreviewShowSolution(true);
                    showToast('Simulator practice set submitted! Solutions revealed.');
                  }}
                >
                  <Check size={16} />
                  <span>Submit Practice Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 11. DELETE CONFIRMATION DIALOG ─── */}
      {deleteConfirmItem && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirmItem(null)}>
          <div className={styles.confirmDialogCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIconBubble}>
              <Trash2 size={24} />
            </div>
            <h3 className={styles.dialogTitle}>Delete Problem Set?</h3>
            <p className={styles.dialogDesc}>
              Are you sure you want to delete <strong>"{deleteConfirmItem.title}"</strong>? This will permanently remove its question bank from the server.
            </p>
            <div className={styles.dialogFooterActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setDeleteConfirmItem(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={handleDeleteConfirmed}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DppPyqManagementWorkspace;
