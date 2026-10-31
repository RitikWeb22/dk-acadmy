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
  Play
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
  questionsCount: number;
  solutionNote: string;
  status: ProblemStatus;
  createdAtFormatted: string;
  createdAt?: string;
  scheduledDate?: string;
  attemptsCount: number;
  questions: ProblemQuestionItem[];
}

const SAMPLE_QUESTIONS: ProblemQuestionItem[] = [
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
      'Using translational equation: M*g*sinθ - f = M*a. Using rotational equation about CM: f*R = I*α = (1/2)*M*R^2*(a/R) ⇒ f = (1/2)*M*a. Solving both yields a = (2/3)*g*sinθ and f = (1/3)*M*g*sinθ.',
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
  const [newSolutionNote, setNewSolutionNote] = useState<string>('5 with step solutions');
  const [newStatus, setNewStatus] = useState<ProblemStatus>('Published');

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
      await apiClient.delete(`/dpp-pyq/${deleteConfirmItem.id}`);
      showToast(`✓ Deleted "${deleteConfirmItem.title}"`);
      setDeleteConfirmItem(null);
      await fetchLiveDppPyq();
    } catch (err: any) {
      setProblemSets((prev) => prev.filter((p) => p.id !== deleteConfirmItem.id));
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
      badgeCode,
      categoryLabel,
      questionsCount: Number(newQuestionsCount) || 5,
      solutionNote: newSolutionNote.trim() || `${newQuestionsCount} questions with step solutions`,
      status: newStatus,
      attemptsCount: 0,
      questions: SAMPLE_QUESTIONS.slice(0, Number(newQuestionsCount) || 4)
    };

    try {
      const res = await apiClient.post<any>('/dpp-pyq', payload);
      showToast(`✓ Created new practice set "${newTitle}"! Opening Question Studio...`);
      setIsCreateModalOpen(false);
      const createdDoc = res?.data || res || payload;
      const formattedForAuthoring: DppPyqItem = {
        ...payload,
        id: createdDoc.id || createdDoc._id || `dpp-pyq-${Date.now()}`,
        indexNo: problemSets.length + 1,
        createdAtFormatted: 'Just now',
        questions: payload.questions
      };
      setNewTitle('');
      setNewSlug('');
      window.dispatchEvent(new CustomEvent('dk_dpp_pyq_created', { detail: payload }));
      handleOpenEditModal(formattedForAuthoring);
      await fetchLiveDppPyq();
    } catch (err: any) {
      console.error('Failed to create:', err);
      showToast(`Created locally: ${err?.message || 'Sync'}`);
      setIsCreateModalOpen(false);
      handleOpenEditModal({
        ...payload,
        id: `dpp-pyq-${Date.now()}`,
        indexNo: problemSets.length + 1,
        createdAtFormatted: 'Just now',
        questions: payload.questions
      });
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
      await apiClient.put(`/dpp-pyq/${editingItem.id}`, editingItem);
      window.dispatchEvent(new CustomEvent('dk_dpp_pyq_updated', { detail: editingItem }));
      showToast(`✓ Saved question bank changes for "${editingItem.title}"!`);
      setEditingItem(null);
      await fetchLiveDppPyq();
    } catch (err: any) {
      setProblemSets((prev) => prev.map((p) => (p.id === editingItem.id ? editingItem : p)));
      showToast(`Saved question changes locally.`);
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
                            <span className={styles.slugUrl}>{item.slug}</span>
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
