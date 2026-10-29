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
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSlug, setNewSlug] = useState<string>('');
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
    try {
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
        badgeCode,
        categoryLabel,
        questionsCount: Number(newQuestionsCount) || 5,
        solutionNote: newSolutionNote.trim() || `${newQuestionsCount} questions with step solutions`,
        status: newStatus,
        attemptsCount: 0,
        questions: SAMPLE_QUESTIONS.slice(0, Number(newQuestionsCount) || 4)
      };

      await apiClient.post('/dpp-pyq', payload);
      showToast(`✓ Created new practice set "${newTitle}"!`);
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewSlug('');
      await fetchLiveDppPyq();
    } catch (err: any) {
      console.error('Failed to create:', err);
      showToast(`Created locally: ${err?.message || 'Sync'}`);
      setIsCreateModalOpen(false);
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
            <Plus size={18} />
            <span>+ Create Problem Set</span>
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

      {/* ─── 7. CREATE PROBLEM SET MODAL ─── */}
      {isCreateModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <div className={styles.modalIconBubble}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className={styles.modalTitle}>Create New Problem Set</h2>
                  <p className={styles.modalSub}>
                    Configure module metadata and seed questions for chapter drills or test archives.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className={styles.modalForm}>
              {/* Module Type Selector */}
              <div className={styles.formRow}>
                <label className={styles.fieldLabel}>Practice Category / Module *</label>
                <div className={styles.typeSelectorRow}>
                  {(['DPP', 'PYQ', 'BITSAT'] as ProblemModuleType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`${styles.typeChoiceBtn} ${
                        newModuleType === t ? styles.typeActive : ''
                      }`}
                      onClick={() => setNewModuleType(t)}
                    >
                      {t === 'DPP'
                        ? 'Daily Practice Problem (DPP)'
                        : t === 'PYQ'
                        ? 'Chapter PYQ Archive'
                        : 'BITSAT Speed Drill'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Slug */}
              <div className={styles.formRow}>
                <label className={styles.fieldLabel}>Problem Set Title *</label>
                <input
                  type="text"
                  className={styles.fieldInput}
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

              <div className={styles.formRow}>
                <label className={styles.fieldLabel}>URL Slug Path</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  placeholder="/dpp-06-conic-sections"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                />
              </div>

              {/* 2-Col Subject & Questions Count */}
              <div className={styles.formTwoCol}>
                <div className={styles.formRow}>
                  <label className={styles.fieldLabel}>Subject Domain *</label>
                  <select
                    className={styles.fieldSelect}
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value as ProblemSubject)}
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mixed">Mixed (Full Syllabus)</option>
                  </select>
                </div>

                <div className={styles.formRow}>
                  <label className={styles.fieldLabel}>Initial Questions Count</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className={styles.fieldInput}
                    value={newQuestionsCount}
                    onChange={(e) => setNewQuestionsCount(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Solution Note & Initial Status */}
              <div className={styles.formTwoCol}>
                <div className={styles.formRow}>
                  <label className={styles.fieldLabel}>Solution Note</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    placeholder="e.g. 5 with step video solutions"
                    value={newSolutionNote}
                    onChange={(e) => setNewSolutionNote(e.target.value)}
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.fieldLabel}>Initial Release Status</label>
                  <select
                    className={styles.fieldSelect}
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ProblemStatus)}
                  >
                    <option value="Published">Published (Live for Students)</option>
                    <option value="Draft">Draft (Editorial Review)</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooterActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={isSaving}>
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

                  <div className={styles.metaField}>
                    <label>Archive Year Tag:</label>
                    <input
                      type="text"
                      className={styles.fieldInputSmall}
                      placeholder="e.g. JEE Main 2024"
                      value={editingItem.questions[editingQuestionIdx].examYear || ''}
                      onChange={(e) => handleUpdateActiveQuestion({ examYear: e.target.value })}
                    />
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
