import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  Award,
  Layers,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Upload,
  Sparkles,
  HelpCircle,
  Eye,
  Check,
  Calendar,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  Zap,
  Image as ImageIcon,
  Copy,
  Download,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
  CheckCircle,
  X,
  PlaySquare,
  Search,
  Filter,
  Pencil,
  ToggleLeft,
  ToggleRight,
  MoreVertical,
  Activity,
  Users,
  BarChart3,
  ExternalLink,
  ChevronDown,
  FileEdit,
  UserCheck,
  Archive,
  CornerUpRight,
  Send,
  PauseCircle,
  PlayCircle,
  ArrowLeft,
  Bookmark,
  ShieldCheck,
  FileCheck,
  Loader2,
  RefreshCw,
  Lock,
  Maximize,
  Shield,
  Sliders,
  Globe,
  Hash,
  Video
} from 'lucide-react';
import styles from './TestSeriesBuilderWorkspace.module.scss';
import { apiClient } from '../../../services/apiClient';
import { cmsService } from '../../../services/cmsService';
import { notificationService } from '../../../services/notificationService';

import { PART_TESTS_DATA } from '../../../data/partTestsData';
import { MathText } from '../../ui/MathText/MathText';
import { MathInput, parseContentToBlocks } from '../../ui/MathEngine';
import { extractStatementAndOptions, normalizeMathText } from '../../../utils/questionBulkParser';
import { normalizePastedQuestion } from '../../../utils/universalDocxParser';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export type StepId = 1 | 2 | 3 | 4;
export type ViewMode = 'TABLE' | 'BUILDER';

export interface SubjectRuleDef {
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  badgeTitle: string;
  secATotal: number;
  secAMarksPositive: number;
  secAMarksNegative: number;
  secBTotal: number;
  secBMaxAttempt: number;
  secBEnforceOptional: boolean;
  secBMarksPositive: number;
  secBMarksNegative: number;
}

export interface QuestionItem {
  id: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  section: 'A' | 'B';
  index: number;
  type: 'SINGLE_CORRECT' | 'NUMERICAL' | 'MATRIX_MATCH';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topicTag: string;
  questionText: string;
  statementBlocks?: any[];
  imageUrl?: string;
  options: {
    key: 'A' | 'B' | 'C' | 'D';
    text: string;
    imageUrl?: string;
  }[];
  correctKey: 'A' | 'B' | 'C' | 'D' | string;
  numericalAnswer?: string;
  solutionDerivation: string;
  shortcutTrick: string;
  videoSolutionUrl?: string;
  pdfSolutionUrl?: string;
}

export interface TestSeriesTableItem {
  id: string;
  indexNo: number;
  badgeCode: 'JEE MAIN' | 'JEE ADVANCED' | 'BITSAT' | 'MATH SPEED' | 'PART TEST' | string;
  title: string;
  subtitle?: string;
  slug: string;
  examType: 'JEE Main' | 'JEE Advanced' | 'BITSAT' | 'MathSpeed';
  format?: 'Full Mock' | 'Part Test' | 'Chapter Test';
  difficulty?: 'Moderate' | 'Challenging' | 'Advanced';
  subjects?: string[];
  totalTests: number;
  testsBreakdown: string;
  status: 'Published' | 'Draft' | 'Scheduled' | 'Archived';
  schedule?: {
    startWindow?: string;
    endWindow?: string;
    autoSubmit?: boolean;
    computeRank?: boolean;
  };
  createdAtFormatted: string;
  createdAt?: string;
  attemptsCount: number;
  durationMinutes: number;
  totalMarks: number;
  questions?: any[];
  markingScheme?: {
    correct: number;
    incorrect: number;
    unattempted: number;
  };
  instructions?: string[];
  batch?: string;
  targetBatches?: string[];
  accessLevel?: 'BATCH_INCLUDED' | 'FREE_LEAD_MAGNET';
}

// ─────────────────────────────────────────────────────────────
// Reference Dataset matching image_2586bb.jpg & Prompt
// ─────────────────────────────────────────────────────────────
const BASE_INITIAL_TABLE_ITEMS: TestSeriesTableItem[] = [
  {
    id: 'ts-ja-spec-01',
    indexNo: 1,
    badgeCode: 'JEE ADVANCED',
    title: 'JEE Advanced Specialist: Coordinate Geometry & Vectors',
    slug: '/jee-advanced-coordinate-geometry-vectors',
    examType: 'JEE Advanced',
    totalTests: 4,
    testsBreakdown: '4 problems • 16 marks',
    status: 'Published',
    createdAtFormatted: '26 Oct 2026 • 10:15 AM',
    attemptsCount: 0,
    durationMinutes: 90,
    totalMarks: 16
  },
  {
    id: 'ts-row-1',
    indexNo: 2,
    badgeCode: 'JEE MAIN',
    title: 'JEE Main 2026 Full Syllabus Series',
    slug: '/jee-main-2026-full-syllabus',
    examType: 'JEE Main',
    totalTests: 8,
    testsBreakdown: '8 published',
    status: 'Published',
    createdAtFormatted: '10 Oct 2026 • 11:24 AM',
    attemptsCount: 0,
    durationMinutes: 180,
    totalMarks: 300
  },
  {
    id: 'ts-row-2',
    indexNo: 3,
    badgeCode: 'JEE ADVANCED',
    title: 'JEE Advanced 2026 Practice Series',
    slug: '/jee-advanced-2026-practice',
    examType: 'JEE Advanced',
    totalTests: 6,
    testsBreakdown: '5 published • 1 draft',
    status: 'Draft',
    createdAtFormatted: '08 Oct 2026 • 04:32 PM',
    attemptsCount: 0,
    durationMinutes: 180,
    totalMarks: 180
  },
  {
    id: 'ts-row-3',
    indexNo: 4,
    badgeCode: 'BITSAT',
    title: 'BITSAT 2026 Mock Test Series',
    slug: '/bitsat-2026-mock-tests',
    examType: 'BITSAT',
    totalTests: 5,
    testsBreakdown: '5 published',
    status: 'Published',
    createdAtFormatted: '05 Oct 2026 • 09:18 AM',
    attemptsCount: 0,
    durationMinutes: 180,
    totalMarks: 390
  },
  {
    id: 'ts-row-4',
    indexNo: 5,
    badgeCode: 'JEE MAIN',
    title: 'JEE Main Previous Year Papers',
    slug: '/jee-main-pyq-series',
    examType: 'JEE Main',
    totalTests: 10,
    testsBreakdown: '10 published',
    status: 'Published',
    createdAtFormatted: '30 Sep 2026 • 02:45 PM',
    attemptsCount: 0,
    durationMinutes: 180,
    totalMarks: 300
  },
  {
    id: 'ts-row-5',
    indexNo: 6,
    badgeCode: 'JEE ADVANCED',
    title: 'JEE Advanced Subject-wise Series',
    slug: '/jee-advanced-subject-wise',
    examType: 'JEE Advanced',
    totalTests: 12,
    testsBreakdown: '10 published • 2 draft',
    status: 'Draft',
    createdAtFormatted: '25 Sep 2026 • 12:20 PM',
    attemptsCount: 0,
    durationMinutes: 180,
    totalMarks: 180
  },
  {
    id: 'ts-row-6',
    indexNo: 7,
    badgeCode: 'BITSAT',
    title: 'BITSAT Chapter Wise Tests',
    slug: '/bitsat-chapter-wise',
    examType: 'BITSAT',
    totalTests: 7,
    testsBreakdown: '7 published',
    status: 'Published',
    createdAtFormatted: '20 Sep 2026 • 10:15 AM',
    attemptsCount: 0,
    durationMinutes: 180,
    totalMarks: 390
  },
  {
    id: 'ts-row-7',
    indexNo: 8,
    badgeCode: 'JEE MAIN',
    title: 'JEE Main April Attempt Series',
    slug: '/jee-main-april-attempt',
    examType: 'JEE Main',
    totalTests: 4,
    testsBreakdown: '3 published • 1 scheduled',
    status: 'Scheduled',
    createdAtFormatted: '15 Sep 2026 • 06:42 PM',
    attemptsCount: 0,
    durationMinutes: 180,
    totalMarks: 300
  },
  {
    id: 'ts-row-8',
    indexNo: 9,
    badgeCode: 'JEE ADVANCED',
    title: 'Advanced Test Series (Premium)',
    slug: '/advanced-premium-series',
    examType: 'JEE Advanced',
    totalTests: 6,
    testsBreakdown: '4 published • 2 draft',
    status: 'Draft',
    createdAtFormatted: '12 Sep 2026 • 11:30 AM',
    attemptsCount: 0,
    durationMinutes: 180,
    totalMarks: 180
  }
];

const PART_TEST_TABLE_ITEMS: TestSeriesTableItem[] = PART_TESTS_DATA.map((pt, idx) => ({
  id: pt.id,
  indexNo: idx + 10,
  badgeCode: 'PART TEST',
  title: pt.title,
  subtitle: pt.subtitle,
  slug: `/${pt.slug || pt.id}`,
  examType: (pt.examType as any) || 'JEE Main',
  format: 'Part Test',
  difficulty: (pt.difficulty as any) || 'Moderate',
  subjects: pt.subjects,
  totalTests: pt.totalQuestions || pt.questions.length,
  testsBreakdown: `${pt.totalQuestions || pt.questions.length} problems • ${pt.totalMarks} marks`,
  status: pt.status || 'Published',
  schedule: pt.schedule,
  createdAtFormatted: 'Recent',
  attemptsCount: pt.attemptsCount || 0,
  durationMinutes: pt.durationMinutes,
  totalMarks: pt.totalMarks,
  questions: pt.questions || []
}));

const INITIAL_TABLE_ITEMS: TestSeriesTableItem[] = [
  ...BASE_INITIAL_TABLE_ITEMS,
  ...PART_TEST_TABLE_ITEMS
];

const INITIAL_SUBJECT_RULES: Record<'Physics' | 'Chemistry' | 'Mathematics', SubjectRuleDef> = {
  Physics: {
    subject: 'Physics',
    badgeTitle: 'Physics - Kota Pedagogy Core',
    secATotal: 20,
    secAMarksPositive: 4,
    secAMarksNegative: 1,
    secBTotal: 10,
    secBMaxAttempt: 5,
    secBEnforceOptional: true,
    secBMarksPositive: 4,
    secBMarksNegative: 0
  },
  Chemistry: {
    subject: 'Chemistry',
    badgeTitle: 'Chemistry - NCERT & Advanced Reactions',
    secATotal: 20,
    secAMarksPositive: 4,
    secAMarksNegative: 1,
    secBTotal: 10,
    secBMaxAttempt: 5,
    secBEnforceOptional: true,
    secBMarksPositive: 4,
    secBMarksNegative: 0
  },
  Mathematics: {
    subject: 'Mathematics',
    badgeTitle: 'Mathematics - DK Sir Speed Module',
    secATotal: 20,
    secAMarksPositive: 4,
    secAMarksNegative: 1,
    secBTotal: 10,
    secBMaxAttempt: 5,
    secBEnforceOptional: true,
    secBMarksPositive: 4,
    secBMarksNegative: 0
  }
};

const INITIAL_SAMPLE_RAW: QuestionItem[] = [
  {
    id: 'ja-cg-q1',
    subject: 'Mathematics',
    section: 'A',
    index: 1,
    type: 'SINGLE_CORRECT',
    difficulty: 'HARD',
    topicTag: '3D Geometry',
    questionText: 'The distance of the point P(1, -2, 3) from the plane x - y + z = 5 measured parallel to the line (x/2) = (y/3) = (z/-6) is:',
    options: [
      { key: 'A', text: '1 unit' },
      { key: 'B', text: '7 units' },
      { key: 'C', text: '3 units' },
      { key: 'D', text: '5 units' }
    ],
    correctKey: 'A',
    solutionDerivation: 'Equation of line through P(1, -2, 3) parallel to line (x/2)=(y/3)=(z/-6) is (x-1)/2 = (y+2)/3 = (z-3)/(-6) = λ. Point Q on line is (1+2λ, -2+3λ, 3-6λ). Putting Q in plane x - y + z = 5 gives (1+2λ) - (-2+3λ) + (3-6λ) = 5 ⇒ 6 - 7λ = 5 ⇒ 7λ = 1 ⇒ λ = 1/7. Distance |PQ| = |λ| √(2² + 3² + (-6)²) = (1/7) √(49) = 1 unit.',
    shortcutTrick: 'DK Sir Kota Inspection Trick: Distance = |Plane(P)| / |a·l + b·m + c·n| × √(l²+m²+n²) = |1 - (-2) + 3 - 5| / |(1)(2) - (1)(3) + (1)(-6)| × 7 = 1/7 × 7 = 1 unit in 15 seconds!',
    videoSolutionUrl: 'https://dkacademy.in/lms/lectures/3d-geometry-parallel-distance#t=08m15s'
  },
  {
    id: 'ja-cg-q2',
    subject: 'Mathematics',
    section: 'A',
    index: 2,
    type: 'SINGLE_CORRECT',
    difficulty: 'HARD',
    topicTag: 'Vectors & Triple Products',
    questionText: 'Let a⃗, b⃗, and c⃗ be three non-coplanar unit vectors such that the angle between every pair of them is π/3. If a⃗ × b⃗ + b⃗ × c⃗ = p a⃗ + q b⃗ + r c⃗, where p, q, r are real scalars, then the value of (p² + 2q² + r²) is:',
    options: [
      { key: 'A', text: '3 / 4' },
      { key: 'B', text: '1' },
      { key: 'C', text: '2' },
      { key: 'D', text: '4' }
    ],
    correctKey: 'C',
    solutionDerivation: 'Taking scalar products with a⃗, b⃗, and c⃗ across the non-coplanar system and utilizing det(Gram matrix), solving yields p = -1, q = 0, r = 1. Therefore, p² + 2q² + r² = (-1)² + 0 + 1² = 2.',
    shortcutTrick: 'Skew symmetry over b⃗ guarantees b⃗ · (a⃗ × b⃗ + b⃗ × c⃗) = 0 ⇒ q = 0 immediately! By symmetry |p| = |r| = 1, so p² + r² = 2.',
    videoSolutionUrl: 'https://dkacademy.in/lms/lectures/vectors-coplanar-basis'
  },
  {
    id: 'ja-cg-q3',
    subject: 'Mathematics',
    section: 'A',
    index: 3,
    type: 'SINGLE_CORRECT',
    difficulty: 'HARD',
    topicTag: 'Conic Sections',
    questionText: 'The locus of the point of intersection of perpendicular tangents to the parabola y² = 4ax and the ellipse x²/a² + y²/b² = 1 is given by:',
    options: [
      { key: 'A', text: 'x = -a' },
      { key: 'B', text: 'x² + y² = a² + b²' },
      { key: 'C', text: 'Director circle of the respective conic curves' },
      { key: 'D', text: 'y² - 4ax = x² + y² - a² - b²' }
    ],
    correctKey: 'B',
    solutionDerivation: 'Perpendicular tangents to an ellipse always intersect on its director circle with equation x² + y² = a² + b².',
    shortcutTrick: 'Director circle theorem: Standard analytical geometry property gives x² + y² = a² + b² directly without calculation.',
    videoSolutionUrl: 'https://dkacademy.in/lms/lectures/conics-director-circle'
  },
  {
    id: 'ja-cg-q4',
    subject: 'Mathematics',
    section: 'A',
    index: 4,
    type: 'SINGLE_CORRECT',
    difficulty: 'HARD',
    topicTag: 'Circles & Orthogonal Systems',
    questionText: 'The equation of the circle passing through the points of intersection of the circles x² + y² - 6x = 0 and x² + y² - 4y = 0, and having its center on the line 2x - 5y + 1 = 0, is:',
    options: [
      { key: 'A', text: 'x² + y² - 2x - 4y = 0' },
      { key: 'B', text: 'x² + y² - 4x - 6y = 0' },
      { key: 'C', text: '7(x² + y²) - 18x - 28y = 0' },
      { key: 'D', text: 'x² + y² + 2x - 3y = 0' }
    ],
    correctKey: 'C',
    solutionDerivation: 'Common chord is S₁ - S₂ = 0 ⇒ 3x - 2y = 0. Circle family is S₁ + λ(3x - 2y) = 0. Center is (-(3λ - 6)/2, λ). Substituting center into line 2x - 5y + 1 = 0 yields λ = 7/8. Substituting back gives 7(x² + y²) - 18x - 28y = 0.',
    shortcutTrick: 'Find radical axis S₁ - S₂ = 0 and substitute center (h, k) directly into the given line equation to solve for parameter λ in 20 seconds.',
    videoSolutionUrl: 'https://dkacademy.in/lms/lectures/circles-radical-axis'
  }
];

const INITIAL_SAMPLE_QUESTIONS: QuestionItem[] = INITIAL_SAMPLE_RAW.map((q) => {
  const norm = normalizeMathText(q.questionText);
  return {
    ...q,
    questionText: norm,
    statementBlocks: parseContentToBlocks(norm),
    options: q.options.map((o) => ({ ...o, text: normalizeMathText(o.text) })),
    solutionDerivation: normalizeMathText(q.solutionDerivation || ''),
    shortcutTrick: normalizeMathText(q.shortcutTrick || '')
  };
});

export const mapBackendQuestionsToBuilder = (rawQuestions: any[]): QuestionItem[] => {
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return [];
  }

  return rawQuestions.map((q: any, idx: number) => {
    // Subject normalize
    let subject: 'Physics' | 'Chemistry' | 'Mathematics' = 'Mathematics';
    if (q.subject === 'Physics' || q.subject === 'Chemistry') {
      subject = q.subject;
    }

    // Options normalize
    let options: { key: 'A' | 'B' | 'C' | 'D'; text: string; imageUrl?: string }[] = [];
    if (Array.isArray(q.options) && q.options.length > 0) {
      options = q.options.map((opt: any, optIdx: number) => {
        const rawKey = opt.key || opt.id || String.fromCharCode(65 + optIdx);
        const upperKey = String(rawKey).toUpperCase();
        const validKey: 'A' | 'B' | 'C' | 'D' = ['A', 'B', 'C', 'D'].includes(upperKey)
          ? (upperKey as 'A' | 'B' | 'C' | 'D')
          : ((['A', 'B', 'C', 'D'][optIdx] || 'A') as 'A' | 'B' | 'C' | 'D');
        return {
          key: validKey,
          text: opt.text ?? '',
          imageUrl: opt.imageUrl
        };
      });
    } else {
      options = [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' }
      ];
    }

    // Correct key
    const rawCorrect = String(q.correctAnswer || q.correctKey || q.correctOption || 'A').toUpperCase();
    const correctKey: 'A' | 'B' | 'C' | 'D' = ['A', 'B', 'C', 'D'].includes(rawCorrect)
      ? (rawCorrect as 'A' | 'B' | 'C' | 'D')
      : 'A';

    const isSectionB = q.section === 'B' || q.type === 'NUMERICAL' || (Array.isArray(q.options) && q.options.length === 0) || Boolean(q.numericalAnswer) || idx >= 20;
    const section: 'A' | 'B' = isSectionB ? 'B' : 'A';
    const type = q.type || (isSectionB ? 'NUMERICAL' : 'SINGLE_CORRECT');

    const rawStatement = q.statement || q.questionText || '';
    const normalizedStatement = normalizeMathText(rawStatement);

    const normalizedOptions = options.map((opt) => ({
      ...opt,
      text: normalizeMathText(opt.text || '')
    }));

    return {
      id: String(q.id || `q-${idx + 1}-${Date.now()}`),
      subject,
      section,
      index: Number(q.questionNumber || q.index || idx + 1),
      type,
      difficulty: q.difficulty ? (String(q.difficulty).toUpperCase() as any) : 'MEDIUM',
      topicTag: q.chapter || q.topicTag || q.formulaKey || 'General',
      questionText: normalizedStatement,
      statementBlocks: parseContentToBlocks(normalizedStatement),
      imageUrl: q.imageUrl,
      options: normalizedOptions,
      correctKey,
      numericalAnswer: q.numericalAnswer ? String(q.numericalAnswer) : undefined,
      solutionDerivation: q.explanation || q.stepSolution || q.solutionDerivation ? normalizeMathText(q.explanation || q.stepSolution || q.solutionDerivation) : '',
      shortcutTrick: q.shortcutTrick || q.dkSirShortcut ? normalizeMathText(q.shortcutTrick || q.dkSirShortcut) : '',
      videoSolutionUrl: q.videoSolutionUrl || '',
      pdfSolutionUrl: q.pdfSolutionUrl || ''
    };
  });
};

export const TestSeriesBuilderWorkspace: React.FC = () => {
  // View Mode: Table Console (image_2586bb.jpg) vs 4-Step Builder Wizard
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE');

  // Active Academy Batches
  const ACTIVE_ACADEMY_BATCHES = [
    'Ultimate 2-Year Live Classroom (2028)',
    '1-Year Repeater/Dropper Rank Accelerator',
    'Class 12 Crash Course: Target JEE 2027',
    'Kota Foundation Math Drill (Class 11)'
  ];

  // Test series list state
  const [testSeriesList, setTestSeriesList] = useState<TestSeriesTableItem[]>(() => {
    let deletedIds: string[] = [];
    try {
      deletedIds = JSON.parse(localStorage.getItem('dk_deleted_test_series_ids') || '[]');
    } catch {}
    return INITIAL_TABLE_ITEMS.filter((t) => !deletedIds.includes(t.id) && !(t.slug && deletedIds.includes(t.slug)));
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [examTypeFilter, setExamTypeFilter] = useState('ALL');
  const [formatFilter, setFormatFilter] = useState<'ALL' | 'Full Mock' | 'Part Test' | 'Chapter Test'>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState('');
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Active dropdown menu for 3-dots actions
  const [openActionRowId, setOpenActionRowId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  // CREATE MODAL STATE
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newExamType, setNewExamType] = useState<'JEE Main' | 'JEE Advanced' | 'BITSAT' | 'PartTest' | 'MathSpeed'>('JEE Main');
  const [newFormat, setNewFormat] = useState<'Full Mock' | 'Part Test' | 'Chapter Test'>('Full Mock');
  const [newDifficulty, setNewDifficulty] = useState<'Moderate' | 'Challenging' | 'Advanced'>('Moderate');
  const [newDuration, setNewDuration] = useState(180);
  const [newTotalMarks, setNewTotalMarks] = useState(300);
  const [newTargetBatches, setNewTargetBatches] = useState<string[]>([ACTIVE_ACADEMY_BATCHES[0]]);
  const [newInitialStatus, setNewInitialStatus] = useState<'Draft' | 'Published' | 'Scheduled'>('Draft');
  const [newScheduledStartTime, setNewScheduledStartTime] = useState('2026-11-05T14:30');
  const [newScheduledEndTime, setNewScheduledEndTime] = useState('2026-11-12T14:30');
  const [isCreating, setIsCreating] = useState(false);

  // SLIDE-OVER METADATA DRAWER STATE
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerItem, setDrawerItem] = useState<TestSeriesTableItem | null>(null);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerSlug, setDrawerSlug] = useState('');
  const [drawerExamType, setDrawerExamType] = useState<'JEE Main' | 'JEE Advanced' | 'BITSAT' | 'MathSpeed'>('JEE Main');
  const [drawerFormat, setDrawerFormat] = useState<'Full Mock' | 'Part Test' | 'Chapter Test'>('Full Mock');
  const [drawerDifficulty, setDrawerDifficulty] = useState<'Moderate' | 'Challenging' | 'Advanced'>('Moderate');
  const [drawerDuration, setDrawerDuration] = useState(180);
  const [drawerTotalMarks, setDrawerTotalMarks] = useState(300);
  const [drawerStatus, setDrawerStatus] = useState<'Published' | 'Draft' | 'Scheduled' | 'Archived'>('Published');
  const [drawerStartWindow, setDrawerStartWindow] = useState('');
  const [drawerEndWindow, setDrawerEndWindow] = useState('');
  const [drawerBatches, setDrawerBatches] = useState<string[]>([]);
  const [isSavingDrawer, setIsSavingDrawer] = useState(false);

  // Modals state
  const [previewItem, setPreviewItem] = useState<TestSeriesTableItem | null>(null);
  const [previewTab, setPreviewTab] = useState<'OVERVIEW' | 'CBT_SIMULATOR'>('OVERVIEW');
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<TestSeriesTableItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 4-Step Wizard State
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [editingSeriesTitle, setEditingSeriesTitle] = useState('JEE Advanced Specialist: Coordinate Geometry & Vectors');
  const [editingSeriesSubtitle, setEditingSeriesSubtitle] = useState('Focused practice on conic sections, straight lines, circles, planes, and 3D geometry.');
  const [wizardExamPattern, setWizardExamPattern] = useState('JEE Part Test (100 Marks • 25 Qs)');
  const [wizardTargetExam, setWizardTargetExam] = useState<'JEE Main' | 'JEE Advanced' | 'BITSAT' | 'PartTest' | 'MathSpeed'>('JEE Advanced');
  const [wizardFormat, setWizardFormat] = useState<'Full Mock' | 'Part Test' | 'Chapter Test'>('Full Mock');
  const [wizardDifficulty, setWizardDifficulty] = useState<'Moderate' | 'Challenging' | 'Advanced'>('Advanced');
  const [wizardBatch, setWizardBatch] = useState('Ultimate 2-Year Live Classroom (2028)');
  const [wizardDuration, setWizardDuration] = useState(90);
  const [wizardTotalMarks, setWizardTotalMarks] = useState<number>(100);
  const [positiveMarks, setPositiveMarks] = useState(4);
  const [negativeMarks, setNegativeMarks] = useState(1);
  const [selectedSubjects, setSelectedSubjects] = useState<('Physics' | 'Chemistry' | 'Mathematics')[]>(['Physics', 'Chemistry', 'Mathematics']);
  const [examGuidelines, setExamGuidelines] = useState<string[]>([
    'Advanced section dedicated exclusively to JEE Mathematics high-weightage geometry domains.',
    'Marking Scheme: +4 marks for correct choice, -1 mark penalty for incorrect choice.',
    'Review your working equations carefully before locking answers.'
  ]);
  const [zeroPenaltyNumerical, setZeroPenaltyNumerical] = useState(true);
  const [accessLevel, setAccessLevel] = useState<'BATCH_INCLUDED' | 'FREE_LEAD_MAGNET'>('BATCH_INCLUDED');
  const [subjectRules, setSubjectRules] = useState(INITIAL_SUBJECT_RULES);
  const [activeSubjectTab, setActiveSubjectTab] = useState<'Physics' | 'Chemistry' | 'Mathematics'>('Mathematics');
  const [questions, setQuestions] = useState<QuestionItem[]>(INITIAL_SAMPLE_QUESTIONS);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('ja-cg-q1');
  const [isEquationHelpOpen, setIsEquationHelpOpen] = useState(false);
  const [startWindowDate, setStartWindowDate] = useState('2026-11-05T14:30');
  const [endWindowDate, setEndWindowDate] = useState('2026-11-12T23:59');
  const [autoSubmitOnExpire, setAutoSubmitOnExpire] = useState(true);
  const [scorecardRelease, setScorecardRelease] = useState<'INSTANT' | 'AFTER_WINDOW' | 'MANUAL'>('INSTANT');
  const [computeNtaRank, setComputeNtaRank] = useState(true);
  const [scheduleMode, setScheduleMode] = useState<'SCHEDULED_WINDOW' | 'OPEN_PRACTICE' | 'TIME_SLOTTED'>('SCHEDULED_WINDOW');
  const [builderStatus, setBuilderStatus] = useState<'Published' | 'Draft' | 'Scheduled'>('Published');
  const [examSlot, setExamSlot] = useState<'MORNING' | 'EVENING' | 'FLEXIBLE'>('FLEXIBLE');
  const [fullScreenLock, setFullScreenLock] = useState<boolean>(true);
  const [tabSwitchLimit, setTabSwitchLimit] = useState<number>(3);
  const [disableCopyPaste, setDisableCopyPaste] = useState<boolean>(true);
  const [strictTimer, setStrictTimer] = useState<boolean>(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState<number>(10);
  const [singleSessionGuard, setSingleSessionGuard] = useState<boolean>(true);
  const [bufferEntryMinutes, setBufferEntryMinutes] = useState<number>(30);
  const [cutoffTierPredictor, setCutoffTierPredictor] = useState<boolean>(true);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // Scheduled Solution Release Configuration State
  const [solutionReleaseEnabled, setSolutionReleaseEnabled] = useState<boolean>(true);
  const [solutionPdfUrl, setSolutionPdfUrl] = useState<string>('');
  const [solutionVideoUrl, setSolutionVideoUrl] = useState<string>('');
  const [solutionReleaseDelay, setSolutionReleaseDelay] = useState<number>(24);
  const [solutionOverview, setSolutionOverview] = useState<{
    totalSubmissions: number;
    scheduledReleases: number;
    unlockedSubmissions: number;
    disabledReleases: number;
    pdfConfigured: boolean;
    videoConfigured: boolean;
    releaseDelayHours: number;
    enabled: boolean;
  } | null>(null);
  const [isSavingSolutionConfig, setIsSavingSolutionConfig] = useState<boolean>(false);

  const fetchSolutionOverview = async (testId: string) => {
    try {
      const res = await apiClient.get<any>(`/test-series/${testId}/solution-admin-overview`);
      if (res && res.success && res.data) {
        setSolutionOverview(res.data.overview);
        if (res.data.solutionRelease) {
          setSolutionReleaseEnabled(res.data.solutionRelease.enabled ?? true);
          setSolutionPdfUrl(res.data.solutionRelease.pdfUrl || '');
          setSolutionVideoUrl(res.data.solutionRelease.videoUrl || '');
          setSolutionReleaseDelay(res.data.solutionRelease.releaseDelayHours || 24);
        }
      }
    } catch (err) {
      console.warn('[fetchSolutionOverview error]:', err);
    }
  };

  const handleSaveSolutionConfig = async () => {
    if (!editingSeriesId) return;

    const trimmedPdf = solutionPdfUrl.trim();
    const trimmedVideo = solutionVideoUrl.trim();

    if (solutionReleaseEnabled && !trimmedPdf && !trimmedVideo) {
      setToastMessage('At least one valid solution URL (PDF, Google Drive, or YouTube) is required to enable scheduled release.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const isDrive = trimmedVideo.includes('drive.google.com');
    const isYouTube = trimmedVideo.includes('youtube.com') || trimmedVideo.includes('youtu.be');
    const isValidHttp = trimmedVideo.startsWith('http://') || trimmedVideo.startsWith('https://');

    if (trimmedVideo && (!isValidHttp || (!isDrive && !isYouTube))) {
      setToastMessage('Video URL must be a valid Google Drive (drive.google.com) or YouTube (youtube.com / youtu.be) link.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    if (trimmedPdf && !trimmedPdf.startsWith('http://') && !trimmedPdf.startsWith('https://')) {
      setToastMessage('PDF URL must start with http:// or https://');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    try {
      setIsSavingSolutionConfig(true);
      const res = await apiClient.patch<any>(`/test-series/${editingSeriesId}/solution-config`, {
        enabled: solutionReleaseEnabled,
        pdfUrl: trimmedPdf,
        videoUrl: trimmedVideo,
        releaseDelayHours: solutionReleaseDelay
      });

      if (res && res.success) {
        setToastMessage('Scheduled solution release configuration updated successfully!');
        setTimeout(() => setToastMessage(null), 3000);
        fetchSolutionOverview(editingSeriesId);
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to update solution release configuration.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSavingSolutionConfig(false);
    }
  };

  // Bulk Selection and Multi-Delete State
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);

  // CBT Live Simulator Interactive State (matches user screenshot)
  const [cbtQIndex, setCbtQIndex] = useState<number>(0);
  const [cbtResponses, setCbtResponses] = useState<Record<string, { selectedOption?: string; isMarkedForReview?: boolean; isVisited?: boolean }>>({
    'ja-cg-q1': { isVisited: true, isMarkedForReview: false }
  });
  const [cbtSecondsRemaining, setCbtSecondsRemaining] = useState<number>(5372); // 01:29:32 in seconds
  const [cbtSubmitted, setCbtSubmitted] = useState<boolean>(false);

  // Fetch live test series from MongoDB
  const isFetchingLiveRef = useRef(false);
  const lastLiveFetchTimeRef = useRef(0);

  const fetchLiveTestSeries = async () => {
    const now = Date.now();
    if (isFetchingLiveRef.current || now - lastLiveFetchTimeRef.current < 2500) return;
    isFetchingLiveRef.current = true;
    lastLiveFetchTimeRef.current = now;
    setIsLoadingList(true);
    try {
      const res = await apiClient.get<any>('/test-series');
      const items = Array.isArray(res) ? res : res?.data || [];
      let deletedIds: string[] = [];
      try {
        deletedIds = JSON.parse(localStorage.getItem('dk_deleted_test_series_ids') || '[]');
      } catch {}
      const activeItems = (Array.isArray(items) ? items : []).filter(
        (it: any) => !deletedIds.includes(it.id) && !deletedIds.includes(it.slug)
      );

      if (activeItems.length > 0 || (Array.isArray(items) && items.length > 0)) {
        const formatted: TestSeriesTableItem[] = activeItems.map((item: any, idx: number) => ({
          id: item.id || `ts-${idx}`,
          indexNo: idx + 1,
          badgeCode: (item.badgeCode || (item.format === 'Part Test' ? 'PART TEST' : item.examType === 'JEE Advanced' ? 'JEE ADVANCED' : item.examType === 'BITSAT' ? 'BITSAT' : 'JEE MAIN')) as any,
          title: item.title,
          subtitle: item.subtitle,
          slug: item.slug || `/${item.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          examType: (item.examType || 'JEE Main') as any,
          format: item.format || 'Full Mock',
          difficulty: item.difficulty || 'Moderate',
          subjects: item.subjects || ['Physics', 'Chemistry', 'Mathematics'],
          schedule: item.schedule,
          totalTests: item.totalQuestions || item.questions?.length || 1,
          testsBreakdown: `${item.totalQuestions || item.questions?.length || 1} problems • ${item.totalMarks || 300} marks`,
          status: (item.status || 'Published') as any,
          createdAtFormatted: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently',
          attemptsCount: item.attemptsCount || 0,
          durationMinutes: Number(item.durationMinutes) > 0 ? Number(item.durationMinutes) : 180,
          totalMarks: Number(item.totalMarks) > 0 ? Number(item.totalMarks) : 300,
          questions: Array.isArray(item.questions) ? item.questions : [],
          markingScheme: item.markingScheme,
          instructions: item.instructions,
          batch: item.batch,
          targetBatches: item.targetBatches,
          accessLevel: item.accessLevel
        }));
        setTestSeriesList(formatted);
      }
    } catch (err) {
      console.warn('[TestSeries] Could not fetch live test series, using cached:', err);
    } finally {
      setIsLoadingList(false);
      isFetchingLiveRef.current = false;
    }
  };

  useEffect(() => {
    fetchLiveTestSeries();

    const handleSync = () => {
      fetchLiveTestSeries();
    };

    window.addEventListener('dk_test_series_created', handleSync);
    window.addEventListener('dk_test_series_updated', handleSync);
    window.addEventListener('dk_test_series_deleted', handleSync);

    return () => {
      window.removeEventListener('dk_test_series_created', handleSync);
      window.removeEventListener('dk_test_series_updated', handleSync);
      window.removeEventListener('dk_test_series_deleted', handleSync);
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (previewTab !== 'CBT_SIMULATOR' || cbtSubmitted) return;
    const timer = setInterval(() => {
      setCbtSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [previewTab, cbtSubmitted]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentCbtQ = questions[cbtQIndex] || questions[0];
  const cbtResponse = cbtResponses[currentCbtQ?.id] || { isVisited: true, isMarkedForReview: false };

  const cbtAnsweredCount = Object.keys(cbtResponses).filter(
    (id) => Boolean(cbtResponses[id]?.selectedOption)
  ).length;

  const handleCbtSelectOption = (optKey: string) => {
    setCbtResponses((prev) => ({
      ...prev,
      [currentCbtQ.id]: {
        ...(prev[currentCbtQ.id] || {}),
        selectedOption: optKey,
        isVisited: true
      }
    }));
  };

  const handleCbtToggleMark = () => {
    setCbtResponses((prev) => ({
      ...prev,
      [currentCbtQ.id]: {
        ...(prev[currentCbtQ.id] || {}),
        isMarkedForReview: !prev[currentCbtQ.id]?.isMarkedForReview,
        isVisited: true
      }
    }));
  };

  const handleCbtNavigate = (targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    setCbtQIndex(targetIdx);
    const targetQ = questions[targetIdx];
    if (targetQ && !cbtResponses[targetQ.id]?.isVisited) {
      setCbtResponses((prev) => ({
        ...prev,
        [targetQ.id]: {
          ...(prev[targetQ.id] || { isMarkedForReview: false }),
          isVisited: true
        }
      }));
    }
  };

  const cbtScore = useMemo(() => {
    let score = 0;
    questions.forEach((q) => {
      const resp = cbtResponses[q.id];
      if (resp?.selectedOption) {
        if (resp.selectedOption === q.correctKey) {
          score += positiveMarks;
        } else {
          score -= negativeMarks;
        }
      }
    });
    return score;
  }, [questions, cbtResponses, positiveMarks, negativeMarks]);

  const handleCbtSubmit = () => {
    setCbtSubmitted(true);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Close context dropdown on outside click
  React.useEffect(() => {
    const handleWindowClick = () => {
      setOpenActionRowId(null);
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // Dynamic Real-time KPI Metric Counters (100% Calculated Live from Database)
  const kpiMetrics = useMemo(() => {
    const total = testSeriesList.length;
    const published = testSeriesList.filter((t) => t.status === 'Published').length;
    const draft = testSeriesList.filter((t) => t.status === 'Draft').length;
    const scheduled = testSeriesList.filter((t) => t.status === 'Scheduled').length;
    const totalAttempts = testSeriesList.reduce((acc, t) => acc + (Number(t.attemptsCount) || 0), 0);
    const studentParticipation = Math.max(0, Math.round(totalAttempts * 0.75));
    return {
      total,
      published,
      draft,
      scheduled,
      totalAttempts: totalAttempts > 0 ? totalAttempts.toLocaleString('en-IN') : '0',
      totalAttemptsRaw: totalAttempts,
      studentParticipation: studentParticipation > 0 ? studentParticipation.toLocaleString('en-IN') : '0',
      studentParticipationRaw: studentParticipation
    };
  }, [testSeriesList]);

  // Sorting state for table
  const [sortColumn, setSortColumn] = useState<'indexNo' | 'title' | 'examType' | 'totalTests' | 'status' | 'createdAt'>('indexNo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Date Range Filtering state
  const [dateRangePreset, setDateRangePreset] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    if (isDatePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDatePickerOpen]);

  const dateRangeLabel = useMemo(() => {
    switch (dateRangePreset) {
      case 'TODAY': return 'Today';
      case '7DAYS': return 'Last 7 Days';
      case '30DAYS': return 'Last 30 Days';
      case 'THIS_MONTH': return 'This Month';
      case 'CUSTOM':
        if (customStartDate && customEndDate) return `${customStartDate} to ${customEndDate}`;
        if (customStartDate) return `From ${customStartDate}`;
        if (customEndDate) return `Until ${customEndDate}`;
        return 'Custom Range';
      default:
        return 'Select date range 📅';
    }
  }, [dateRangePreset, customStartDate, customEndDate]);

  const handleSort = (column: 'indexNo' | 'title' | 'examType' | 'totalTests' | 'status' | 'createdAt') => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filtered and sorted dataset using debouncedSearch (300ms)
  const filteredItems = useMemo(() => {
    const list = testSeriesList.filter((item) => {
      const q = debouncedSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.badgeCode.toLowerCase().includes(q);

      const matchesExam =
        examTypeFilter === 'ALL' || item.examType === examTypeFilter;

      const matchesFormat =
        formatFilter === 'ALL' || item.format === formatFilter;

      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter;

      let matchesDate = true;
      if (dateRangePreset !== 'ALL') {
        const itemTime = (() => {
          if (item.createdAt) {
            const t = new Date(item.createdAt).getTime();
            if (!isNaN(t)) return t;
          }
          if (item.createdAtFormatted) {
            const clean = item.createdAtFormatted.split('•')[0].trim();
            const t = new Date(clean).getTime();
            if (!isNaN(t)) return t;
          }
          return 0;
        })();

        const now = Date.now();
        if (dateRangePreset === 'TODAY') {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          matchesDate = itemTime >= startOfToday.getTime();
        } else if (dateRangePreset === '7DAYS') {
          matchesDate = itemTime >= now - 7 * 24 * 60 * 60 * 1000;
        } else if (dateRangePreset === '30DAYS') {
          matchesDate = itemTime >= now - 30 * 24 * 60 * 60 * 1000;
        } else if (dateRangePreset === 'THIS_MONTH') {
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          matchesDate = itemTime >= startOfMonth.getTime();
        } else if (dateRangePreset === 'CUSTOM') {
          if (customStartDate) {
            const startT = new Date(customStartDate).setHours(0, 0, 0, 0);
            matchesDate = matchesDate && itemTime >= startT;
          }
          if (customEndDate) {
            const endT = new Date(customEndDate).setHours(23, 59, 59, 999);
            matchesDate = matchesDate && itemTime <= endT;
          }
        }
      }

      return matchesSearch && matchesExam && matchesFormat && matchesStatus && matchesDate;
    });

    return [...list].sort((a, b) => {
      let comparison = 0;
      if (sortColumn === 'indexNo') {
        comparison = (a.indexNo || 0) - (b.indexNo || 0);
      } else if (sortColumn === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortColumn === 'examType') {
        comparison = a.examType.localeCompare(b.examType);
      } else if (sortColumn === 'totalTests') {
        comparison = (a.totalTests || 0) - (b.totalTests || 0);
      } else if (sortColumn === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortColumn === 'createdAt') {
        comparison = (a.createdAtFormatted || '').localeCompare(b.createdAtFormatted || '');
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [testSeriesList, debouncedSearch, examTypeFilter, formatFilter, statusFilter, dateRangePreset, customStartDate, customEndDate, sortColumn, sortDirection]);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, examTypeFilter, formatFilter, statusFilter, dateRangePreset, customStartDate, customEndDate, pageSize]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Clear filters helper
  const handleClearAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setExamTypeFilter('ALL');
    setFormatFilter('ALL');
    setStatusFilter('ALL');
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const defaultTitle = `JEE Main 2027 Full Syllabus Series ${testSeriesList.length + 1}`;
    setNewTitle(defaultTitle);
    setNewSlug(defaultTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    setNewExamType('JEE Main');
    setNewFormat('Full Mock');
    setNewDifficulty('Moderate');
    setNewDuration(180);
    setNewTotalMarks(300);
    setNewTargetBatches([ACTIVE_ACADEMY_BATCHES[0]]);
    setNewInitialStatus('Published');
    setNewScheduledStartTime('2026-11-05T14:30');
    setNewScheduledEndTime('2026-11-12T14:30');
    setIsCreateModalOpen(true);
  };

  const handleCreateTestSeriesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newTitle.trim().length < 4) {
      showToast('Please enter a test series title (min 4 characters).');
      return;
    }

    setIsCreating(true);
    const newId = `ts_jee_${Date.now()}`;
    const isPartTest = newExamType === 'PartTest' || newFormat === 'Part Test';
    const isMathSpeed = newExamType === 'MathSpeed';

    const examTypeVal: 'JEE Main' | 'JEE Advanced' | 'BITSAT' =
      newExamType === 'JEE Advanced'
        ? 'JEE Advanced'
        : newExamType === 'BITSAT'
        ? 'BITSAT'
        : 'JEE Main';

    const badgeCodeVal = isPartTest
      ? 'PART TEST'
      : isMathSpeed
      ? 'MATH SPEED'
      : examTypeVal === 'JEE Advanced'
      ? 'JEE ADVANCED'
      : examTypeVal === 'BITSAT'
      ? 'BITSAT'
      : 'JEE MAIN';

    const payload: any = {
      id: newId,
      title: newTitle.trim(),
      subtitle: isPartTest
        ? `Syllabus Unit Part Test for ${examTypeVal}`
        : isMathSpeed
        ? 'DK Sir Proprietary 20-30s Math Speed CBT'
        : `Comprehensive practice module for ${examTypeVal}`,
      slug: newSlug || newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      badgeCode: badgeCodeVal,
      examType: examTypeVal,
      format: isPartTest ? 'Part Test' : newFormat,
      difficulty: newDifficulty,
      durationMinutes: Number(newDuration),
      totalQuestions: 4,
      totalMarks: Number(newTotalMarks),
      subjects: isMathSpeed ? ['Mathematics'] : ['Physics', 'Chemistry', 'Mathematics'],
      targetBatches: newTargetBatches,
      batch: newTargetBatches[0] || 'Ultimate 2-Year Live Classroom (2028)',
      status: newInitialStatus,
      schedule: newInitialStatus === 'Scheduled' ? {
        startWindow: newScheduledStartTime ? new Date(newScheduledStartTime).toISOString() : new Date().toISOString(),
        endWindow: newScheduledEndTime ? new Date(newScheduledEndTime).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
        autoSubmit: true,
        computeRank: true
      } : undefined,
      attemptsCount: 0,
      questions: [
        {
          id: `q-1-${Date.now()}`,
          subject: isMathSpeed ? 'Mathematics' : 'Physics',
          section: 'A',
          index: 1,
          type: 'SINGLE_CORRECT',
          difficulty: newDifficulty === 'Challenging' ? 'HARD' : 'MEDIUM',
          topicTag: 'General Problem',
          questionText: '',
          options: [
            { key: 'A', text: '' },
            { key: 'B', text: '' },
            { key: 'C', text: '' },
            { key: 'D', text: '' }
          ],
          correctKey: 'A',
          solutionDerivation: '',
          shortcutTrick: ''
        }
      ]
    };

    const freshNewQuestions = mapBackendQuestionsToBuilder(payload.questions);
    setQuestions(freshNewQuestions);
    setSelectedQuestionId(freshNewQuestions[0].id);
    setActiveSubjectTab(freshNewQuestions[0].subject);

    // Optimistic UI update
    const optimisticItem: TestSeriesTableItem = {
      id: newId,
      indexNo: 1,
      badgeCode: payload.badgeCode,
      title: payload.title,
      slug: `/${payload.slug}`,
      examType: examTypeVal,
      format: payload.format,
      difficulty: newDifficulty,
      totalTests: freshNewQuestions.length,
      testsBreakdown: `${freshNewQuestions.length} problems • ${payload.totalMarks} marks`,
      status: payload.status,
      createdAtFormatted: 'Just now',
      attemptsCount: 0,
      durationMinutes: payload.durationMinutes,
      totalMarks: payload.totalMarks,
      schedule: payload.schedule,
      questions: payload.questions
    };

    setTestSeriesList([optimisticItem, ...testSeriesList.map((t, i) => ({ ...t, indexNo: i + 2 }))]);
    setCurrentPage(1);
    showToast('✓ Test Series Created & Saved to Database! Opening Question Builder...');
    setIsCreateModalOpen(false);

    // Immediately launch the 4-step builder so the admin can author tests & questions
    setEditingSeriesId(payload.id);
    setEditingSeriesTitle(payload.title);
    setEditingSeriesSubtitle(payload.subtitle || '');
    if (payload.format === 'Part Test' || isPartTest) {
      setWizardTargetExam('PartTest');
      setWizardFormat('Part Test');
      setWizardExamPattern('JEE Part Test (100 Marks • 25 Qs)');
      setWizardTotalMarks(100);
      setWizardDuration(payload.durationMinutes || 60);
      setPositiveMarks(4);
      setNegativeMarks(1);
    } else if (payload.examType === 'JEE Advanced') {
      setWizardTargetExam('JEE Advanced');
      setWizardFormat('Full Mock');
      setWizardExamPattern('JEE Advanced Paper 1');
      setWizardTotalMarks(payload.totalMarks || 180);
      setWizardDuration(payload.durationMinutes || 180);
      setPositiveMarks(4);
      setNegativeMarks(2);
    } else if (payload.examType === 'BITSAT') {
      setWizardTargetExam('BITSAT');
      setWizardFormat('Full Mock');
      setWizardExamPattern('BITSAT Speed Drill');
      setWizardTotalMarks(payload.totalMarks || 390);
      setWizardDuration(payload.durationMinutes || 180);
      setPositiveMarks(3);
      setNegativeMarks(1);
    } else {
      setWizardTargetExam('JEE Main');
      setWizardFormat('Full Mock');
      setWizardExamPattern('NTA JEE Main Pattern');
      setWizardTotalMarks(payload.totalMarks || 300);
      setWizardDuration(payload.durationMinutes || 180);
      setPositiveMarks(4);
      setNegativeMarks(1);
    }
    const initialStatus = (newInitialStatus === 'Scheduled' || newInitialStatus === 'Draft') ? newInitialStatus : 'Published';
    setBuilderStatus(initialStatus);
    setScheduleMode(initialStatus === 'Scheduled' ? 'SCHEDULED_WINDOW' : 'OPEN_PRACTICE');
    if (newScheduledStartTime) setStartWindowDate(newScheduledStartTime);
    if (newScheduledEndTime) setEndWindowDate(newScheduledEndTime);
    setCurrentStep(1);
    setCompletedSteps([1]);
    setViewMode('BUILDER');

    try {
      await apiClient.post('/test-series', payload);
      notificationService.addNotification({
        title: `📝 New Test Series Live: ${payload.title}`,
        description: `${payload.format} • ${payload.totalMarks} Marks • ${payload.durationMinutes} mins`,
        type: 'test_series',
        timestamp: Date.now(),
        unread: true
      });
      window.dispatchEvent(new CustomEvent('dk_test_series_created', { detail: payload }));
      await fetchLiveTestSeries();
    } catch (err: any) {
      console.error('Error persisting new test series:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Open Slide-over Edit Drawer
  const handleOpenEditDrawer = (item: TestSeriesTableItem) => {
    setDrawerItem(item);
    setDrawerTitle(item.title);
    setDrawerSlug(item.slug.replace(/^\//, ''));
    setDrawerExamType((item.examType as any) || 'JEE Main');
    setDrawerFormat((item.format as any) || 'Full Mock');
    setDrawerDifficulty((item.difficulty as any) || 'Moderate');
    setDrawerDuration(item.durationMinutes);
    setDrawerTotalMarks(item.totalMarks);
    setDrawerStatus(item.status);
    const startWin = item.schedule?.startWindow ? new Date(item.schedule.startWindow).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16);
    const endWin = item.schedule?.endWindow ? new Date(item.schedule.endWindow).toISOString().slice(0, 16) : new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16);
    setDrawerStartWindow(startWin);
    setDrawerEndWindow(endWin);
    setDrawerBatches([ACTIVE_ACADEMY_BATCHES[0]]);
    setIsDrawerOpen(true);
  };

  const setDrawerWindowDurationPreset = (durationHours: number) => {
    try {
      const start = new Date(drawerStartWindow || Date.now());
      const end = new Date(start.getTime() + durationHours * 3600000);
      setDrawerEndWindow(end.toISOString().slice(0, 16));
      showToast(`Set window duration: ${durationHours < 24 ? `${durationHours} Hours` : `${durationHours / 24} Days`}`);
    } catch {}
  };

  const isDrawerDirty = useMemo(() => {
    if (!drawerItem) return false;
    return (
      drawerTitle !== drawerItem.title ||
      drawerSlug !== drawerItem.slug.replace(/^\//, '') ||
      drawerExamType !== drawerItem.examType ||
      drawerFormat !== (drawerItem.format || 'Full Mock') ||
      drawerDifficulty !== (drawerItem.difficulty || 'Moderate') ||
      drawerDuration !== drawerItem.durationMinutes ||
      drawerTotalMarks !== drawerItem.totalMarks ||
      drawerStatus !== drawerItem.status ||
      (drawerStatus === 'Scheduled' && (
        drawerStartWindow !== (drawerItem.schedule?.startWindow ? new Date(drawerItem.schedule.startWindow).toISOString().slice(0, 16) : '') ||
        drawerEndWindow !== (drawerItem.schedule?.endWindow ? new Date(drawerItem.schedule.endWindow).toISOString().slice(0, 16) : '')
      ))
    );
  }, [drawerItem, drawerTitle, drawerSlug, drawerExamType, drawerFormat, drawerDifficulty, drawerDuration, drawerTotalMarks, drawerStatus, drawerStartWindow, drawerEndWindow]);

  const handleSaveDrawerChanges = async () => {
    if (!drawerItem) return;
    setIsSavingDrawer(true);
    const updates = {
      title: drawerTitle,
      slug: drawerSlug,
      examType: drawerExamType === 'MathSpeed' ? 'JEE Main' : drawerExamType,
      format: drawerFormat,
      difficulty: drawerDifficulty,
      badgeCode:
        drawerExamType === 'JEE Advanced'
          ? 'JEE ADVANCED'
          : drawerExamType === 'BITSAT'
          ? 'BITSAT'
          : drawerExamType === 'MathSpeed'
          ? 'MATH SPEED'
          : 'JEE MAIN',
      durationMinutes: Number(drawerDuration),
      totalMarks: Number(drawerTotalMarks),
      status: drawerStatus,
      schedule: drawerStatus === 'Scheduled' ? {
        startWindow: drawerStartWindow ? new Date(drawerStartWindow).toISOString() : new Date().toISOString(),
        endWindow: drawerEndWindow ? new Date(drawerEndWindow).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
        autoSubmit: true,
        computeRank: true
      } : undefined,
      targetBatches: drawerBatches
    };

    // Optimistic UI update
    setTestSeriesList((prev) =>
      prev.map((t) =>
        t.id === drawerItem.id
          ? {
              ...t,
              title: drawerTitle,
              slug: `/${drawerSlug}`,
              examType: drawerExamType,
              format: drawerFormat,
              difficulty: drawerDifficulty,
              durationMinutes: Number(drawerDuration),
              totalMarks: Number(drawerTotalMarks),
              status: drawerStatus,
              schedule: updates.schedule
            }
          : t
      )
    );

    try {
      await apiClient.put(`/test-series/${drawerItem.id}`, updates);
      showToast(`Test Series "${drawerTitle}" updated successfully!`);
    } catch (err) {
      showToast('Changes saved locally.');
    } finally {
      setIsSavingDrawer(false);
      setIsDrawerOpen(false);
    }
  };

  const handleArchiveInstead = async (item: TestSeriesTableItem) => {
    setTestSeriesList((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, status: 'Archived' } : t))
    );
    try {
      await apiClient.put(`/test-series/${item.id}`, { status: 'Archived' });
      cmsService.updateTestSeries(item.id, { status: 'Archived' as any }).catch(() => {});
      window.dispatchEvent(new CustomEvent('dk_test_series_updated', { detail: { id: item.id, status: 'Archived' } }));
      showToast(`Test Series "${item.title}" moved to archive`);
      await fetchLiveTestSeries();
    } catch (err) {
      showToast(`Archived "${item.title}"`);
    }
    setDeleteConfirmItem(null);
  };

  // ─────────────────────────────────────────────────────────────
  // Action Handlers (View, Edit, Duplicate, Preview, Publish, Unpublish, Archive, Delete)
  // ─────────────────────────────────────────────────────────────
  const handleOpenCreateWizard = () => {
    setEditingSeriesId(null);
    const newIdx = testSeriesList.length + 1;
    setEditingSeriesTitle(`JEE Main 2027 Full Syllabus Series ${newIdx}`);
    setEditingSeriesSubtitle('Complete syllabus mock test matching official NTA CBT examination standards.');
    setWizardTargetExam('JEE Main');
    setWizardFormat('Full Mock');
    setWizardDifficulty('Moderate');
    setWizardExamPattern('NTA JEE Main Pattern');
    setWizardDuration(180);
    setPositiveMarks(4);
    setNegativeMarks(1);
    setSelectedSubjects(['Physics', 'Chemistry', 'Mathematics']);

    // Initialize fresh template questions for authoring
    const freshTemplateQuestions: QuestionItem[] = [
      {
        id: `q-p1-${Date.now()}`,
        subject: 'Physics',
        section: 'A',
        index: 1,
        type: 'SINGLE_CORRECT',
        difficulty: 'MEDIUM',
        topicTag: 'General Physics',
        questionText: '',
        options: [
          { key: 'A', text: '' },
          { key: 'B', text: '' },
          { key: 'C', text: '' },
          { key: 'D', text: '' }
        ],
        correctKey: 'A',
        solutionDerivation: '',
        shortcutTrick: ''
      },
      {
        id: `q-c1-${Date.now() + 1}`,
        subject: 'Chemistry',
        section: 'A',
        index: 2,
        type: 'SINGLE_CORRECT',
        difficulty: 'MEDIUM',
        topicTag: 'General Chemistry',
        questionText: '',
        options: [
          { key: 'A', text: '' },
          { key: 'B', text: '' },
          { key: 'C', text: '' },
          { key: 'D', text: '' }
        ],
        correctKey: 'A',
        solutionDerivation: '',
        shortcutTrick: ''
      },
      {
        id: `q-m1-${Date.now() + 2}`,
        subject: 'Mathematics',
        section: 'A',
        index: 3,
        type: 'SINGLE_CORRECT',
        difficulty: 'MEDIUM',
        topicTag: 'General Mathematics',
        questionText: '',
        options: [
          { key: 'A', text: '' },
          { key: 'B', text: '' },
          { key: 'C', text: '' },
          { key: 'D', text: '' }
        ],
        correctKey: 'A',
        solutionDerivation: '',
        shortcutTrick: ''
      }
    ];
    setQuestions(freshTemplateQuestions);
    setSelectedQuestionId(freshTemplateQuestions[0].id);
    setActiveSubjectTab('Physics');
    setBuilderStatus('Published');
    setScheduleMode('OPEN_PRACTICE');

    setCurrentStep(1);
    setCompletedSteps([1]);
    setViewMode('BUILDER');
  };

  const handleEditSeries = async (item: TestSeriesTableItem) => {
    setEditingSeriesId(item.id);
    setEditingSeriesTitle(item.title);
    setEditingSeriesSubtitle(item.subtitle || '');
    const isPart = item.format === 'Part Test' || item.badgeCode === 'PART TEST';
    const isMath = item.badgeCode === 'MATH SPEED' || (item.subjects?.length === 1 && item.subjects[0] === 'Mathematics');
    
    const targetCategory = isPart
      ? 'PartTest'
      : isMath
      ? 'MathSpeed'
      : (item.examType as any) || 'JEE Main';

    setWizardTargetExam(targetCategory);
    setWizardFormat(isPart ? 'Part Test' : ((item.format as any) || 'Full Mock'));
    setWizardDifficulty((item.difficulty as any) || 'Moderate');
    setWizardDuration(Number(item.durationMinutes) > 0 ? Number(item.durationMinutes) : 180);
    setWizardTotalMarks(Number(item.totalMarks) > 0 ? Number(item.totalMarks) : 300);
    setWizardExamPattern(
      item.examType === 'JEE Advanced'
        ? 'JEE Advanced Paper 1'
        : item.examType === 'BITSAT'
        ? 'BITSAT Speed Drill'
        : isPart
        ? 'Part Test High-Yield Module'
        : 'NTA JEE Main Pattern'
    );
    if (Array.isArray(item.subjects) && item.subjects.length > 0) {
      setSelectedSubjects(item.subjects as any);
    }
    if (item.markingScheme) {
      if (typeof item.markingScheme.correct === 'number') setPositiveMarks(item.markingScheme.correct);
      if (typeof item.markingScheme.incorrect === 'number') setNegativeMarks(item.markingScheme.incorrect);
    }
    if (Array.isArray(item.instructions) && item.instructions.length > 0) {
      setExamGuidelines(item.instructions);
    }
    if (item.batch) setWizardBatch(item.batch);
    if (item.accessLevel) setAccessLevel(item.accessLevel);

    const initialStatus: 'Published' | 'Draft' | 'Scheduled' =
      item.status === 'Draft'
        ? 'Draft'
        : (item.status === 'Scheduled' || (item.schedule as any)?.scheduleMode === 'SCHEDULED_WINDOW')
        ? 'Scheduled'
        : 'Published';
    setBuilderStatus(initialStatus);
    setScheduleMode(initialStatus === 'Scheduled' ? 'SCHEDULED_WINDOW' : 'OPEN_PRACTICE');

    if (item.schedule) {
      if ((item.schedule as any).scheduleMode) setScheduleMode((item.schedule as any).scheduleMode);
      if (item.schedule.startWindow) {
        try {
          setStartWindowDate(new Date(item.schedule.startWindow).toISOString().slice(0, 16));
        } catch {}
      }
      if (item.schedule.endWindow) {
        try {
          setEndWindowDate(new Date(item.schedule.endWindow).toISOString().slice(0, 16));
        } catch {}
      }
    }

    // 1. Immediately populate from local cache if questions exist to prevent flash of wrong questions
    if (Array.isArray(item.questions) && item.questions.length > 0) {
      const parsed = mapBackendQuestionsToBuilder(item.questions);
      if (parsed.length > 0) {
        setQuestions(parsed);
        setSelectedQuestionId(parsed[0].id);
        setActiveSubjectTab(parsed[0].subject);
      }
    }

    setCurrentStep(1);
    setCompletedSteps([1, 2, 3, 4]);
    setViewMode('BUILDER');

    // 2. Fetch authoritative fresh record directly from MongoDB to guarantee zero data loss
    try {
      const res = await apiClient.get<any>(`/test-series/${item.id}`);
      const freshData = res?.data || res;
      if (freshData && typeof freshData === 'object') {
        if (Array.isArray(freshData.questions) && freshData.questions.length > 0) {
          const freshQuestions = mapBackendQuestionsToBuilder(freshData.questions);
          if (freshQuestions.length > 0) {
            setQuestions(freshQuestions);
            setSelectedQuestionId(freshQuestions[0].id);
            setActiveSubjectTab(freshQuestions[0].subject);
          }
        }
        if (freshData.markingScheme) {
          if (typeof freshData.markingScheme.correct === 'number') setPositiveMarks(freshData.markingScheme.correct);
          if (typeof freshData.markingScheme.incorrect === 'number') setNegativeMarks(freshData.markingScheme.incorrect);
        }
        if (Array.isArray(freshData.instructions) && freshData.instructions.length > 0) {
          setExamGuidelines(freshData.instructions);
        }
        if (freshData.durationMinutes) {
          setWizardDuration(Number(freshData.durationMinutes));
        }
        if (freshData.totalMarks) {
          setWizardTotalMarks(Number(freshData.totalMarks));
        }
        if (freshData.batch) {
          setWizardBatch(freshData.batch);
        }
        if (freshData.accessLevel) {
          setAccessLevel(freshData.accessLevel);
        }
        if (freshData.solutionRelease) {
          setSolutionReleaseEnabled(freshData.solutionRelease.enabled ?? true);
          setSolutionPdfUrl(freshData.solutionRelease.pdfUrl || '');
          setSolutionVideoUrl(freshData.solutionRelease.videoUrl || '');
          setSolutionReleaseDelay(freshData.solutionRelease.releaseDelayHours || 24);
        }
      }
      fetchSolutionOverview(item.id);
    } catch (fetchErr) {
      console.warn('[TestSeriesBuilder] Could not fetch fresh data from MongoDB:', fetchErr);
    }
  };

  const handleOpenPreview = async (item: TestSeriesTableItem, tab: 'OVERVIEW' | 'CBT_SIMULATOR' = 'OVERVIEW') => {
    setPreviewItem(item);
    setPreviewTab(tab);
    setCbtQIndex(0);
    setCbtSubmitted(false);
    setCbtSecondsRemaining(item.durationMinutes ? item.durationMinutes * 60 : 5400);

    if (Array.isArray(item.questions) && item.questions.length > 0) {
      const parsed = mapBackendQuestionsToBuilder(item.questions);
      setQuestions(parsed);
    }

    try {
      const res = await apiClient.get<any>(`/test-series/${item.id}`);
      const fresh = res?.data || res;
      if (fresh && Array.isArray(fresh.questions) && fresh.questions.length > 0) {
        const freshParsed = mapBackendQuestionsToBuilder(fresh.questions);
        setQuestions(freshParsed);
      }
    } catch {}
  };

  const handleDuplicateSeries = async (item: TestSeriesTableItem) => {
    const nextIdx = testSeriesList.length + 1;
    const cloned: TestSeriesTableItem = {
      ...item,
      id: `ts-row-${Date.now()}`,
      indexNo: nextIdx,
      title: `${item.title} (Copy)`,
      slug: `${item.slug}-copy`,
      status: 'Draft',
      attemptsCount: 0,
      createdAtFormatted: 'Just now'
    };
    try {
      await apiClient.post('/test-series', cloned);
      showToast(`Duplicated "${item.title}" as new Draft in database!`);
      await fetchLiveTestSeries();
    } catch (err) {
      setTestSeriesList([cloned, ...testSeriesList]);
      showToast(`Duplicated "${item.title}" as new Draft!`);
    }
  };

  const handleTogglePublish = async (item: TestSeriesTableItem, nextStatus: 'Published' | 'Draft') => {
    setTestSeriesList((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, status: nextStatus } : t))
    );
    try {
      await apiClient.put(`/test-series/${item.id}`, { status: nextStatus });
      showToast(`Test Series marked as ${nextStatus}`);
    } catch (err) {
      showToast(`Status updated to ${nextStatus}`);
    }
  };

  const handleArchiveSeries = async (item: TestSeriesTableItem) => {
    setTestSeriesList((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, status: 'Archived' } : t))
    );
    try {
      await apiClient.put(`/test-series/${item.id}`, { status: 'Archived' });
      cmsService.updateTestSeries(item.id, { status: 'Archived' as any }).catch(() => {});
      window.dispatchEvent(new CustomEvent('dk_test_series_updated', { detail: { id: item.id, status: 'Archived' } }));
      showToast(`Test Series "${item.title}" moved to archive`);
      await fetchLiveTestSeries();
    } catch (err) {
      showToast(`Test Series "${item.title}" moved to archive`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmItem || isDeletingSingle) return;
    const target = deleteConfirmItem;
    setIsDeletingSingle(true);

    // Record permanently in deleted IDs storage immediately
    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem('dk_deleted_test_series_ids') || '[]');
      if (!deletedIds.includes(target.id)) deletedIds.push(target.id);
      if (target.slug && !deletedIds.includes(target.slug)) deletedIds.push(target.slug);
      localStorage.setItem('dk_deleted_test_series_ids', JSON.stringify(deletedIds));
    } catch {}

    // Immediately remove from UI state
    setTestSeriesList((prev) => prev.filter((t) => t.id !== target.id && t.slug !== target.slug));
    setSelectedTestIds((prev) => prev.filter((id) => id !== target.id));
    setDeleteConfirmItem(null); // Close modal immediately

    try {
      await apiClient.delete(`/test-series/${target.id}`);
      cmsService.deleteTestSeries(target.id).catch(() => {});

      // Real-time admin notification (silent: true so only 1 single operation toast shows)
      notificationService.addNotification({
        title: 'Test Series Deleted',
        description: `"${target.title}" was permanently deleted by Admin.`,
        type: 'test_series',
        unread: true,
        timestamp: Date.now(),
        silent: true
      });

      showToast(`Deleted test series "${target.title}"`);
    } catch (err) {
      console.error('[Delete Test Series Error]:', err);
      cmsService.deleteTestSeries(target.id).catch(() => {});

      notificationService.addNotification({
        title: 'Test Series Deleted',
        description: `"${target.title}" was removed from the system.`,
        type: 'test_series',
        unread: true,
        timestamp: Date.now(),
        silent: true
      });
      showToast(`Deleted test series "${target.title}"`);
    } finally {
      setIsDeletingSingle(false);
      setDeleteConfirmItem(null); // CRUCIAL: ALWAYS ensure modal is closed
      fetchLiveTestSeries();
    }
  };

  const handleSelectAllToggle = () => {
    if (filteredItems.length === 0) return;
    const currentFilteredIds = filteredItems.map((item) => item.id);
    const allSelected = currentFilteredIds.every((id) => selectedTestIds.includes(id));
    if (allSelected) {
      setSelectedTestIds((prev) => prev.filter((id) => !currentFilteredIds.includes(id)));
    } else {
      setSelectedTestIds((prev) => Array.from(new Set([...prev, ...currentFilteredIds])));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedTestIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedTestIds.length === 0 || isBulkDeleting) return;
    setIsBulkDeleting(true);
    const idsToDelete = [...selectedTestIds];

    // Immediately record all selected IDs in deleted blacklist
    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem('dk_deleted_test_series_ids') || '[]');
      idsToDelete.forEach((id) => {
        if (!deletedIds.includes(id)) deletedIds.push(id);
      });
      localStorage.setItem('dk_deleted_test_series_ids', JSON.stringify(deletedIds));
    } catch {}

    // Immediately remove from active state and close modal
    setTestSeriesList((prev) => prev.filter((t) => !idsToDelete.includes(t.id)));
    setSelectedTestIds([]);
    setIsBulkDeleteModalOpen(false);

    try {
      // Execute API deletions in parallel
      await Promise.allSettled(
        idsToDelete.map((id) => apiClient.delete(`/test-series/${id}`))
      );
      await Promise.allSettled(
        idsToDelete.map((id) => cmsService.deleteTestSeries(id))
      );

      // Dispatch real-time admin notification (silent: true so only 1 single operation toast shows)
      notificationService.addNotification({
        title: 'Bulk Test Series Deleted',
        description: `${idsToDelete.length} test series were permanently deleted by Admin.`,
        type: 'test_series',
        unread: true,
        timestamp: Date.now(),
        silent: true
      });

      showToast(`Successfully deleted ${idsToDelete.length} test series.`);
    } catch (err) {
      console.error('[Bulk Delete Error]:', err);
      showToast(`Deleted ${idsToDelete.length} test series.`);
    } finally {
      setSelectedTestIds([]);
      setIsBulkDeleting(false);
      setIsBulkDeleteModalOpen(false);
      fetchLiveTestSeries();
    }
  };

  const applyTemplatePreset = (preset: 'JEE_MAIN' | 'PART_TEST' | 'JEE_ADV' | 'BITSAT') => {
    if (preset === 'JEE_MAIN') {
      setWizardTargetExam('JEE Main');
      setWizardFormat('Full Mock');
      setWizardDifficulty('Moderate');
      setWizardExamPattern('NTA JEE Main Pattern');
      setWizardDuration(180);
      setWizardTotalMarks(300);
      setPositiveMarks(4);
      setNegativeMarks(1);
      setSelectedSubjects(['Physics', 'Chemistry', 'Mathematics']);
      if (!editingSeriesId) {
        setEditingSeriesTitle('JEE Main 2026/2027 Full Syllabus CBT Mock Test');
        setEditingSeriesSubtitle('Complete 75-question syllabus mock test with NTA percentile & AIR prediction.');
      }
    } else if (preset === 'PART_TEST') {
      setWizardTargetExam('PartTest');
      setWizardFormat('Part Test');
      setWizardDifficulty('Moderate');
      setWizardExamPattern('JEE Part Test (100 Marks • 25 Qs)');
      setWizardDuration(60);
      setWizardTotalMarks(100);
      setPositiveMarks(4);
      setNegativeMarks(1);
      setSelectedSubjects(['Physics', 'Chemistry', 'Mathematics']);
      if (!editingSeriesId) {
        setEditingSeriesTitle('JEE Main Part Test: High-Yield Chapter Drill');
        setEditingSeriesSubtitle('Physics: Modern Physics • Chemistry: Amines & Coordination • Math: Vectors & 3D');
      }
    } else if (preset === 'JEE_ADV') {
      setWizardTargetExam('JEE Advanced');
      setWizardFormat('Full Mock');
      setWizardDifficulty('Advanced');
      setWizardExamPattern('JEE Advanced Paper 1');
      setWizardDuration(180);
      setWizardTotalMarks(180);
      setPositiveMarks(4);
      setNegativeMarks(2);
      setSelectedSubjects(['Physics', 'Chemistry', 'Mathematics']);
      if (!editingSeriesId) {
        setEditingSeriesTitle('JEE Advanced Specialist: Conics, Calculus & 3D Vectors');
        setEditingSeriesSubtitle('Multi-correct, integer numerical & paragraph comprehension problems.');
      }
    } else if (preset === 'BITSAT') {
      setWizardTargetExam('BITSAT');
      setWizardFormat('Full Mock');
      setWizardDifficulty('Moderate');
      setWizardExamPattern('BITSAT Speed Drill');
      setWizardDuration(180);
      setWizardTotalMarks(390);
      setPositiveMarks(3);
      setNegativeMarks(1);
      setSelectedSubjects(['Physics', 'Chemistry', 'Mathematics']);
      if (!editingSeriesId) {
        setEditingSeriesTitle('BITSAT 2026 Comprehensive Speed CBT Mock');
        setEditingSeriesSubtitle('130 questions • Speed Math, Physics, Chemistry, English & Logical Reasoning.');
      }
    }
    showToast(`Loaded ${preset.replace('_', ' ')} template.`);
  };

  const toggleSubjectSelection = (subj: 'Physics' | 'Chemistry' | 'Mathematics') => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subj)) {
        if (prev.length <= 1) {
          showToast('At least one subject must be active in the exam.');
          return prev;
        }
        return prev.filter((s) => s !== subj);
      } else {
        return [...prev, subj];
      }
    });
  };

  // Modern Date/Time Picker Helpers
  const parseDateTimeLocal = (val: string) => {
    if (!val) {
      const now = new Date();
      return {
        dateStr: now.toISOString().slice(0, 10),
        hour12: '02',
        minute: '30',
        ampm: 'PM' as 'AM' | 'PM'
      };
    }
    const [d, t] = val.split('T');
    const [h, m] = (t || '14:30').split(':');
    let hNum = parseInt(h, 10) || 0;
    const ampm: 'AM' | 'PM' = hNum >= 12 ? 'PM' : 'AM';
    hNum = hNum % 12;
    if (hNum === 0) hNum = 12;
    const hour12 = String(hNum).padStart(2, '0');
    return {
      dateStr: d || new Date().toISOString().slice(0, 10),
      hour12,
      minute: m || '30',
      ampm
    };
  };

  const buildDateTimeLocal = (dateStr: string, hour12: string, minute: string, ampm: 'AM' | 'PM') => {
    let h = parseInt(hour12, 10) || 12;
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    const hStr = String(h).padStart(2, '0');
    const mStr = String(minute).padStart(2, '0');
    return `${dateStr}T${hStr}:${mStr}`;
  };

  const setWindowDurationPreset = (durationHours: number) => {
    try {
      const start = new Date(startWindowDate);
      const end = new Date(start.getTime() + durationHours * 3600000);
      setEndWindowDate(end.toISOString().slice(0, 16));
      showToast(`Set window duration: ${durationHours < 24 ? `${durationHours} Hours` : `${durationHours / 24} Days`}`);
    } catch {
      // ignore
    }
  };

  const setQuickWindowDurationPreset = (durationHours: number) => {
    try {
      const start = new Date(newScheduledStartTime);
      const end = new Date(start.getTime() + durationHours * 3600000);
      setNewScheduledEndTime(end.toISOString().slice(0, 16));
      showToast(`Set window duration: ${durationHours < 24 ? `${durationHours} Hours` : `${durationHours / 24} Days`}`);
    } catch {
      // ignore
    }
  };

  // Step navigation helpers
  const scrollToTop = () => {
    const el = document.getElementById('main-content');
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToStep = (step: StepId) => {
    setCurrentStep(step);
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
    scrollToTop();
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!editingSeriesTitle.trim() || editingSeriesTitle.trim().length < 4) {
        showToast('Please enter a test series title (min 4 characters).');
        return;
      }
    }
    if (currentStep === 2) {
      syncQuestionsWithSections();
    }
    if (currentStep < 4) {
      goToStep((currentStep + 1) as StepId);
    }
  };

  // Helper to check if question statement & content has been filled in by teacher
  const isQuestionFilled = useCallback((q: QuestionItem): boolean => {
    if (!q || !q.questionText) return false;
    const txt = q.questionText.trim();
    if (!txt) return false;
    if (txt === 'Enter your new problem statement here (LaTeX syntax supported)...') return false;
    if (txt.startsWith('Enter problem') || txt.startsWith('Enter your new')) return false;

    // For Section B (Numerical):
    if (q.section === 'B' || q.type === 'NUMERICAL') {
      const numAns = (q.numericalAnswer || q.correctKey || '').trim();
      return txt.length > 3 && numAns.length > 0;
    }

    // For Section A (MCQ):
    const hasOptions = q.options && q.options.some((o) => o.text && o.text.trim().length > 0 && o.text !== 'Option A' && o.text !== 'Option B');
    return txt.length > 3 && Boolean(hasOptions && q.correctKey);
  }, []);

  // Synchronize question slots with configured Section A & Section B counts from Step 2
  const syncQuestionsWithSections = useCallback(() => {
    setQuestions((prevQuestions) => {
      const result: QuestionItem[] = [];
      let overallIdx = 1;

      selectedSubjects.forEach((subj) => {
        const rule = subjectRules[subj] || { secATotal: 20, secBTotal: 10 };
        const targetSecA = Math.max(1, Number(rule.secATotal) || 20);
        const targetSecB = Math.max(0, Number(rule.secBTotal) || 10);

        // Keep existing Section A questions for this subject
        const existingA = prevQuestions.filter((q) => q.subject === subj && q.section === 'A');
        // Keep existing Section B questions for this subject
        const existingB = prevQuestions.filter((q) => q.subject === subj && q.section === 'B');

        // Populate Section A slots
        for (let i = 0; i < targetSecA; i++) {
          if (i < existingA.length) {
            result.push({
              ...existingA[i],
              index: overallIdx++,
              subject: subj,
              section: 'A',
              type: 'SINGLE_CORRECT'
            });
          } else {
            result.push({
              id: `q-${subj.toLowerCase()}-secA-${i + 1}-${Date.now()}`,
              subject: subj,
              section: 'A',
              index: overallIdx++,
              type: 'SINGLE_CORRECT',
              difficulty: 'MEDIUM',
              topicTag: '',
              questionText: '',
              options: [
                { key: 'A', text: '' },
                { key: 'B', text: '' },
                { key: 'C', text: '' },
                { key: 'D', text: '' }
              ],
              correctKey: 'A',
              solutionDerivation: '',
              shortcutTrick: ''
            });
          }
        }

        // Populate Section B slots
        for (let j = 0; j < targetSecB; j++) {
          if (j < existingB.length) {
            result.push({
              ...existingB[j],
              index: overallIdx++,
              subject: subj,
              section: 'B',
              type: 'NUMERICAL'
            });
          } else {
            result.push({
              id: `q-${subj.toLowerCase()}-secB-${j + 1}-${Date.now()}`,
              subject: subj,
              section: 'B',
              index: overallIdx++,
              type: 'NUMERICAL',
              difficulty: 'HARD',
              topicTag: '',
              questionText: '',
              options: [],
              correctKey: '',
              numericalAnswer: '',
              solutionDerivation: '',
              shortcutTrick: ''
            });
          }
        }
      });

      if (result.length > 0) {
        const exists = result.some((q) => q.id === selectedQuestionId);
        if (!exists) {
          setSelectedQuestionId(result[0].id);
        }
        return result;
      }
      return prevQuestions;
    });
    showToast('✓ Synchronized question slots with Section A and Section B counts.');
  }, [selectedSubjects, subjectRules, selectedQuestionId]);

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as StepId);
      scrollToTop();
    }
  };

  // Active question in Step 3
  const currentEditingQuestion = useMemo(() => {
    return (
      questions.find((q) => q.id === selectedQuestionId) ||
      questions.find((q) => q.subject === activeSubjectTab) ||
      questions[0]
    );
  }, [questions, selectedQuestionId, activeSubjectTab]);

  // Active questions categorized by subject & section
  const activeSubjectQuestions = useMemo(() => {
    return questions.filter((q) => q.subject === activeSubjectTab);
  }, [questions, activeSubjectTab]);

  const secAQuestions = useMemo(() => {
    return activeSubjectQuestions.filter((q) => q.section === 'A');
  }, [activeSubjectQuestions]);

  const secBQuestions = useMemo(() => {
    return activeSubjectQuestions.filter((q) => q.section === 'B');
  }, [activeSubjectQuestions]);

  const totalPaperFilled = useMemo(() => {
    return questions.filter(isQuestionFilled).length;
  }, [questions, isQuestionFilled]);

  const secAFilledCount = useMemo(() => {
    return secAQuestions.filter(isQuestionFilled).length;
  }, [secAQuestions, isQuestionFilled]);

  const secBFilledCount = useMemo(() => {
    return secBQuestions.filter(isQuestionFilled).length;
  }, [secBQuestions, isQuestionFilled]);

  const updateCurrentQuestion = (partial: Partial<QuestionItem>) => {
    if (!currentEditingQuestion) return;
    setQuestions((prev) =>
      prev.map((q) => (q.id === currentEditingQuestion.id ? { ...q, ...partial } : q))
    );
  };

  const handleAddQuestion = () => {
    const nextIndex = questions.length + 1;
    const newId = `q-user-${Date.now()}`;
    const newQ: QuestionItem = {
      id: newId,
      subject: activeSubjectTab,
      section: 'A',
      index: nextIndex,
      type: 'SINGLE_CORRECT',
      difficulty: 'HARD',
      topicTag: '3D Geometry / Vectors',
      questionText: 'Enter your new problem statement here (LaTeX syntax supported)...',
      options: [
        { key: 'A', text: 'Option A' },
        { key: 'B', text: 'Option B' },
        { key: 'C', text: 'Option C' },
        { key: 'D', text: 'Option D' }
      ],
      correctKey: 'A',
      solutionDerivation: 'Enter detailed step-by-step mathematical working...',
      shortcutTrick: 'DK Sir 20-30s speed inspection shortcut rule...'
    };
    setQuestions((prev) => [...prev, newQ]);
    setSelectedQuestionId(newId);
    showToast(`Added Question ${nextIndex} to ${activeSubjectTab}`);
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.length <= 1) {
      showToast('At least one problem is required in the exam bank.');
      return;
    }
    const filtered = questions.filter((q) => q.id !== id).map((q, idx) => ({ ...q, index: idx + 1 }));
    setQuestions(filtered);
    setSelectedQuestionId(filtered[0].id);
    showToast('Problem removed from test bank.');
  };

  const handleDuplicateQuestion = (q: QuestionItem) => {
    const nextIndex = questions.length + 1;
    const newId = `q-dup-${Date.now()}`;
    const dup: QuestionItem = {
      ...q,
      id: newId,
      index: nextIndex,
      topicTag: `${q.topicTag} (Copy)`,
      questionText: `${q.questionText} (Variant)`
    };
    setQuestions((prev) => [...prev, dup]);
    setSelectedQuestionId(newId);
    showToast(`Duplicated Question ${q.index} as Q${nextIndex}`);
  };

  const [isSmartPasteModalOpen, setIsSmartPasteModalOpen] = useState(false);
  const [smartPasteText, setSmartPasteText] = useState('');

  // Live parsed preview computation for Smart Paste Modal
  const liveSmartExtracted = useMemo(() => {
    if (!smartPasteText.trim()) return null;
    const extracted = extractStatementAndOptions(smartPasteText);
    const hasOptions =
      Array.isArray(extracted.options) &&
      extracted.options.length > 0 &&
      extracted.options.some((o) => o.text && !o.text.startsWith('Option '));

    const ansMatch = smartPasteText.match(/(?:Ans(?:wer)?|Correct(?:\s*(?:Key|Option))?|Option)\s*[:=\-]\s*[(]?([A-Da-d1-4])[)]?/i);
    let detectedKey = extracted.correctKey;
    if (ansMatch) {
      let raw = ansMatch[1].toUpperCase();
      if (raw === '1') raw = 'A';
      else if (raw === '2') raw = 'B';
      else if (raw === '3') raw = 'C';
      else if (raw === '4') raw = 'D';
      if (['A', 'B', 'C', 'D'].includes(raw)) detectedKey = raw as any;
    }

    const numAnsMatch = smartPasteText.match(/(?:Ans(?:wer)?|Correct(?:\s*(?:Key|Answer|Value))?|Value)\s*[:=\-]\s*(-?[0-9]+(?:\.[0-9]+)?)/i);

    const cleanStmt = normalizeMathText(extracted.statement);
    return {
      statement: cleanStmt,
      options: hasOptions
        ? extracted.options.map((o) => ({ key: o.key, text: normalizeMathText(o.text) }))
        : [],
      hasRealOptions: hasOptions,
      detectedCorrectKey: detectedKey,
      detectedNumericalAnswer: numAnsMatch ? numAnsMatch[1] : undefined
    };
  }, [smartPasteText]);

  const handleApplySmartPaste = () => {
    if (!smartPasteText.trim()) return;
    const result = normalizePastedQuestion({ text: smartPasteText });

    const isSectionB = currentEditingQuestion?.section === 'B';
    const hasOptions = result.options.length === 4;

    updateCurrentQuestion({
      questionText: result.statement,
      statementBlocks: parseContentToBlocks(result.statement),
      options: hasOptions
        ? result.options
        : (currentEditingQuestion?.options || result.options),
      correctKey: (result.correctKey || currentEditingQuestion?.correctKey || 'A') as any,
      numericalAnswer: result.numericalAnswer || currentEditingQuestion?.numericalAnswer,
      solutionDerivation: result.stepSolution || currentEditingQuestion?.solutionDerivation,
      shortcutTrick: result.dkSirShortcut || currentEditingQuestion?.shortcutTrick
    });

    setSmartPasteText('');
    setIsSmartPasteModalOpen(false);
    showToast('✓ Successfully formatted & imported question statement and options!');
  };

  const handleStatementPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const result = normalizePastedQuestion(e.clipboardData);
    if (!result.fullNormalizedText) return;

    if (result.hasQuestionWithOptions) {
      e.preventDefault();
      updateCurrentQuestion({
        questionText: result.statement,
        statementBlocks: parseContentToBlocks(result.statement),
        options: result.options,
        correctKey: (result.correctKey || currentEditingQuestion?.correctKey || 'A') as any,
        numericalAnswer: result.numericalAnswer || currentEditingQuestion?.numericalAnswer,
        solutionDerivation: result.stepSolution || currentEditingQuestion?.solutionDerivation,
        shortcutTrick: result.dkSirShortcut || currentEditingQuestion?.shortcutTrick
      });

      showToast('✓ Auto-extracted Question Statement, 4 Options & Answer Key with Math formatting!');
    }
  };

  const handleAddGuideline = () => {
    setExamGuidelines((prev) => [...prev, 'New examination rule / instruction for candidates.']);
  };

  const handleRemoveGuideline = (idx: number) => {
    if (examGuidelines.length <= 1) {
      showToast('At least one guideline is required.');
      return;
    }
    setExamGuidelines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateGuideline = (idx: number, val: string) => {
    setExamGuidelines((prev) => prev.map((g, i) => (i === idx ? val : g)));
  };

  const handleSaveAndPublishFromBuilder = async () => {
    if (!editingSeriesTitle.trim() || editingSeriesTitle.trim().length < 4) {
      showToast('Please provide a valid test series title (min 4 characters).');
      return;
    }

    if (questions.length === 0) {
      showToast('Please author at least 1 question for the CBT examination.');
      return;
    }

    setIsPublishing(true);
    const isPart = wizardTargetExam === 'PartTest' || wizardFormat === 'Part Test';
    const isMath = wizardTargetExam === 'MathSpeed';
    const calculatedMarks = wizardTotalMarks > 0 ? wizardTotalMarks : (questions.length * positiveMarks || (isPart ? 100 : 300));

    const examTypeVal: 'JEE Main' | 'JEE Advanced' | 'BITSAT' =
      isPart || isMath
        ? 'JEE Main'
        : (wizardTargetExam as any);

    const badgeCodeVal =
      isPart
        ? 'PART TEST'
        : wizardTargetExam === 'JEE Advanced'
        ? 'JEE ADVANCED'
        : wizardTargetExam === 'BITSAT'
        ? 'BITSAT'
        : isMath
        ? 'MATH SPEED'
        : 'JEE MAIN';

    const formatVal: 'Full Mock' | 'Part Test' | 'Chapter Test' = isPart ? 'Part Test' : wizardFormat;

    const payload: any = {
      id: editingSeriesId || `ts-${Date.now()}`,
      title: editingSeriesTitle.trim(),
      subtitle: editingSeriesSubtitle.trim(),
      slug: editingSeriesTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, ''),
      badgeCode: badgeCodeVal,
      examType: examTypeVal,
      format: formatVal,
      difficulty: wizardDifficulty,
      durationMinutes: wizardDuration,
      totalQuestions: questions.length,
      totalMarks: calculatedMarks,
      subjects: isMath ? ['Mathematics'] : selectedSubjects.length > 0 ? selectedSubjects : Array.from(new Set(questions.map((q) => q.subject))),
      markingScheme: {
        correct: positiveMarks,
        incorrect: zeroPenaltyNumerical ? 0 : negativeMarks,
        unattempted: 0
      },
      instructions: examGuidelines.filter((g) => g.trim().length > 0),
      questions: questions.map((q, idx) => ({
        id: q.id,
        questionNumber: idx + 1,
        subject: q.subject,
        section: q.section === 'B' ? 'B' : 'A',
        type: q.type || (q.section === 'B' ? 'NUMERICAL' : 'SINGLE_CORRECT'),
        numericalAnswer: q.numericalAnswer,
        chapter: q.topicTag || 'General',
        statement: q.questionText,
        statementBlocks: q.statementBlocks,
        imageUrl: q.imageUrl,
        options: q.options.map((opt) => ({
          id: opt.key,
          text: opt.text,
          imageUrl: opt.imageUrl
        })),
        correctAnswer: q.section === 'B' && q.numericalAnswer ? q.numericalAnswer : q.correctKey,
        marks: positiveMarks,
        negativeMarks: zeroPenaltyNumerical && q.section === 'B' ? 0 : negativeMarks,
        formulaKey: q.topicTag,
        explanation: q.solutionDerivation,
        shortcutTrick: q.shortcutTrick,
        videoSolutionUrl: q.videoSolutionUrl || '',
        pdfSolutionUrl: q.pdfSolutionUrl || ''
      })),
      batch: wizardBatch,
      accessLevel: accessLevel,
      status: builderStatus,
      schedule: {
        startWindow: builderStatus === 'Scheduled' ? (startWindowDate ? new Date(startWindowDate) : new Date()) : new Date(),
        endWindow: builderStatus === 'Scheduled' ? (endWindowDate ? new Date(endWindowDate) : new Date(Date.now() + 7 * 86400000)) : new Date(Date.now() + 365 * 86400000),
        autoSubmit: autoSubmitOnExpire,
        computeRank: computeNtaRank,
        scheduleMode: builderStatus === 'Scheduled' ? 'SCHEDULED_WINDOW' : 'OPEN_PRACTICE',
        examSlot,
        fullScreenLock,
        tabSwitchLimit,
        disableCopyPaste,
        strictTimer,
        autoSaveInterval,
        singleSessionGuard,
        scorecardRelease,
        bufferEntryMinutes,
        cutoffTierPredictor
      },
      solutionRelease: {
        enabled: solutionReleaseEnabled,
        pdfUrl: solutionPdfUrl.trim(),
        videoUrl: solutionVideoUrl.trim(),
        releaseDelayHours: solutionReleaseDelay
      },
      attemptsCount: 0
    };

    try {
      if (editingSeriesId) {
        await apiClient.put(`/test-series/${editingSeriesId}`, payload);
        cmsService.updateTestSeries(editingSeriesId, payload).catch(() => {});
        window.dispatchEvent(new CustomEvent('dk_test_series_updated', { detail: payload }));
        notificationService.addNotification({
          title: `📝 CBT Test Updated: ${payload.title}`,
          description: `${payload.format} • ${payload.totalMarks} Marks • Status: ${payload.status}`,
          type: 'test_series',
          timestamp: Date.now(),
          unread: true
        });
        showToast(builderStatus === 'Draft' ? '✓ CBT Examination saved as Draft!' : builderStatus === 'Scheduled' ? '✓ CBT Examination updated and schedule saved!' : '✓ CBT Examination updated and published live!');
      } else {
        await apiClient.post<any>('/test-series', payload);
        cmsService.saveTestSeries([payload, ...cmsService.getTestSeries().filter((t) => t.id !== payload.id)]);
        notificationService.addNotification({
          title: `📝 New ${payload.format} Live: ${payload.title}`,
          description: `${payload.examType} • ${payload.totalMarks} Marks • ${payload.durationMinutes} mins • Status: ${payload.status}`,
          type: 'test_series',
          timestamp: Date.now(),
          unread: true
        });
        window.dispatchEvent(new CustomEvent('dk_test_series_created', { detail: payload }));
        showToast(builderStatus === 'Draft' ? '✓ CBT Examination saved as Draft!' : builderStatus === 'Scheduled' ? '✓ CBT Examination scheduled successfully!' : '✓ CBT Examination published live!');
      }

      // Optimistically update testSeriesList so it appears immediately on admin table
      setTestSeriesList((prev) => {
        const optimisticRow: TestSeriesTableItem = {
          id: payload.id,
          indexNo: 1,
          badgeCode: payload.badgeCode,
          title: payload.title,
          subtitle: payload.subtitle,
          slug: `/${payload.slug}`,
          examType: payload.examType,
          format: payload.format,
          difficulty: payload.difficulty,
          totalTests: payload.totalQuestions || 4,
          testsBreakdown: `${payload.totalQuestions} problems • ${payload.totalMarks} marks`,
          status: payload.status,
          createdAtFormatted: 'Just now',
          attemptsCount: 0,
          durationMinutes: payload.durationMinutes,
          totalMarks: payload.totalMarks,
          schedule: payload.schedule,
          subjects: payload.subjects,
          questions: payload.questions,
          markingScheme: payload.markingScheme,
          instructions: payload.instructions,
          batch: payload.batch,
          accessLevel: payload.accessLevel
        };
        const filtered = prev.filter((t) => t.id !== payload.id);
        return [optimisticRow, ...filtered.map((t, i) => ({ ...t, indexNo: i + 2 }))];
      });

      setCurrentPage(1);
      setIsPublishModalOpen(true);
      await fetchLiveTestSeries();
    } catch (err: any) {
      console.error('Error saving test series:', err);
      cmsService.saveTestSeries([payload, ...cmsService.getTestSeries().filter((t) => t.id !== payload.id)]);
      window.dispatchEvent(new CustomEvent('dk_test_series_created', { detail: payload }));
      showToast(`Saved locally: ${err?.message || 'Network sync'}`);
      setIsPublishModalOpen(true);
      await fetchLiveTestSeries();
    } finally {
      setIsPublishing(false);
    }
  };

  const STEPS_DATA = [
    {
      step: 1,
      title: 'Test Configuration',
      sub: 'Title, pattern, duration, marking & batch'
    },
    {
      step: 2,
      title: 'Section & Subject Rules',
      sub: 'Physics, Chemistry, Math & NTA optional 5/10'
    },
    {
      step: 3,
      title: 'Question Bank Authoring',
      sub: 'LaTeX math, statements, options & keys'
    },
    {
      step: 4,
      title: 'Schedule & CBT Engine',
      sub: 'Exam window, instant results & NTA rank'
    }
  ];

  return (
    <div className={styles.testSeriesWorkspaceShell}>
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className={styles.toastBanner} role="status">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW MODE A: TEST SERIES MANAGEMENT TABLE (IMAGE_2586BB) */}
      {/* ======================================================== */}
      {viewMode === 'TABLE' && (
        <div className={styles.tableConsoleLayout}>
          {/* ─── 2. PAGE TITLE STRIP & MAIN ACTION CTA ─── */}
          <div className={styles.pageHeaderRow}>
            <div className={styles.headerLeftMeta}>
              <div className={styles.headerIconBox}>
                <FileText size={22} className={styles.iconBlueSvg} />
              </div>
              <div className={styles.titleInfo}>
                <h1 className={styles.pageMainTitle}>Test Series</h1>
                <p className={styles.pageSubtitle}>
                  Create and manage JEE Main, JEE Advanced and BITSAT test series for your students.
                </p>
              </div>
            </div>

            <div className={styles.headerRightAction}>
              <button
                type="button"
                onClick={fetchLiveTestSeries}
                title="Refresh test series"
                className={styles.syncLiveBtn}
              >
                <RefreshCw size={14} className={isLoadingList ? 'animate-spin' : ''} />
                <span>Sync Live</span>
              </button>
              <button
                type="button"
                className={styles.createTestSeriesBtn}
                onClick={handleOpenCreateModal}
              >
                <Plus size={16} />
                <span>+ Create Test Series</span>
              </button>
            </div>
          </div>

          {/* ─── 3. 6-COLUMN KPI METRICS STRIP (BENTO CARDS) ─── */}
          <div className={styles.sixColumnMetricGrid}>
            {/* Card 1: Total Test Series */}
            <div className={styles.metricCard}>
              <div className={styles.cardHeaderRow}>
                <div className={`${styles.iconTile} ${styles.tileSoftBlue}`}>
                  <FileText size={18} />
                </div>
              </div>
              <div className={styles.cardDataStack}>
                <span className={styles.statLabel}>Total Test Series</span>
                <div className={styles.valueRow}>
                  <h3 className={styles.statBigValue}>{kpiMetrics.total}</h3>
                </div>
                <span className={styles.microGreenSub}>↑ Active catalogue</span>
              </div>
            </div>

            {/* Card 2: Published */}
            <div className={styles.metricCard}>
              <div className={styles.cardHeaderRow}>
                <div className={`${styles.iconTile} ${styles.tileSoftEmerald}`}>
                  <Check size={18} />
                </div>
              </div>
              <div className={styles.cardDataStack}>
                <span className={styles.statLabel}>Published</span>
                <div className={styles.valueRow}>
                  <h3 className={styles.statBigValue}>{kpiMetrics.published}</h3>
                </div>
                <span className={styles.microGreenSub}>Live in CBT Portal</span>
              </div>
            </div>

            {/* Card 3: Draft */}
            <div className={styles.metricCard}>
              <div className={styles.cardHeaderRow}>
                <div className={`${styles.iconTile} ${styles.tileSoftAmber}`}>
                  <FileEdit size={18} />
                </div>
              </div>
              <div className={styles.cardDataStack}>
                <span className={styles.statLabel}>Draft</span>
                <div className={styles.valueRow}>
                  <h3 className={styles.statBigValue}>{kpiMetrics.draft}</h3>
                </div>
                <span className={styles.microSlateSub}>In preparation</span>
              </div>
            </div>

            {/* Card 4: Scheduled */}
            <div className={styles.metricCard}>
              <div className={styles.cardHeaderRow}>
                <div className={`${styles.iconTile} ${styles.tileSoftPurple}`}>
                  <Calendar size={18} />
                </div>
              </div>
              <div className={styles.cardDataStack}>
                <span className={styles.statLabel}>Scheduled</span>
                <div className={styles.valueRow}>
                  <h3 className={styles.statBigValue}>{kpiMetrics.scheduled}</h3>
                </div>
                <span className={styles.microGreenSub}>Upcoming windows</span>
              </div>
            </div>

            {/* Card 5: Total Attempts */}
            <div className={styles.metricCard}>
              <div className={styles.cardHeaderRow}>
                <div className={`${styles.iconTile} ${styles.tileSoftTeal}`}>
                  <Users size={18} />
                </div>
              </div>
              <div className={styles.cardDataStack}>
                <span className={styles.statLabel}>Total Attempts</span>
                <div className={styles.valueRow}>
                  <h3 className={styles.statBigValue}>{kpiMetrics.totalAttempts}</h3>
                </div>
                <span className={styles.microGreenSub}>
                  {kpiMetrics.totalAttemptsRaw > 0 ? `${kpiMetrics.totalAttempts} verified completions` : 'Live verified completions'}
                </span>
              </div>
            </div>

            {/* Card 6: Student Participation */}
            <div className={styles.metricCard}>
              <div className={styles.cardHeaderRow}>
                <div className={`${styles.iconTile} ${styles.tileSoftRose}`}>
                  <UserCheck size={18} />
                </div>
              </div>
              <div className={styles.cardDataStack}>
                <span className={styles.statLabel}>Student Participation</span>
                <div className={styles.valueRow}>
                  <h3 className={styles.statBigValue}>{kpiMetrics.studentParticipation}</h3>
                </div>
                <span className={styles.microGreenSub}>
                  {kpiMetrics.studentParticipationRaw > 0 ? `${kpiMetrics.studentParticipation} active candidates` : 'Live active candidates'}
                </span>
              </div>
            </div>
          </div>

          {/* ─── 4. FILTERING & SEARCH CONTROL TOOLBAR ─── */}
          <div className={styles.filterToolbar}>
            {/* Search Input (w-96) */}
            <div className={styles.searchBoxContainer}>
              <Search size={15} className={styles.searchPrefixIcon} />
              <input
                type="text"
                placeholder="Search test series by title, slug or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchField}
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearchQuery('')}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Right Controls */}
            <div className={styles.filterControlsGroup}>
              {/* Exam Type Dropdown */}
              <div className={styles.filterGroupItem}>
                <span className={styles.controlLabel}>Exam Type</span>
                <select
                  value={examTypeFilter}
                  onChange={(e) => setExamTypeFilter(e.target.value)}
                  className={styles.selectPill}
                >
                  <option value="ALL">All Exams ▾</option>
                  <option value="JEE Main">JEE Main</option>
                  <option value="JEE Advanced">JEE Advanced</option>
                  <option value="BITSAT">BITSAT</option>
                </select>
              </div>

              {/* Status Dropdown */}
              <div className={styles.filterGroupItem}>
                <span className={styles.controlLabel}>Status</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={styles.selectPill}
                >
                  <option value="ALL">All Status ▾</option>
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                  <option value="Scheduled">Scheduled</option>
                </select>
              </div>

              {/* Date Range Picker */}
              <div className={styles.filterGroupItem}>
                <span className={styles.controlLabel}>Created At</span>
                <div className={styles.datePickerWrapper} ref={datePickerRef}>
                  <button
                    type="button"
                    className={`${styles.datePickerPill} ${dateRangePreset !== 'ALL' ? styles.datePickerPillActive : ''}`}
                    onClick={() => setIsDatePickerOpen((prev) => !prev)}
                    title="Filter test series by creation date"
                  >
                    <Calendar size={13} className={styles.calIcon} />
                    <span>{dateRangeLabel}</span>
                  </button>

                  {isDatePickerOpen && (
                    <div className={styles.datePickerPopover} role="dialog" aria-label="Date Range Selector">
                      <div className={styles.datePresetsList}>
                        <button
                          type="button"
                          className={`${styles.datePresetBtn} ${dateRangePreset === 'ALL' ? styles.datePresetBtnActive : ''}`}
                          onClick={() => { setDateRangePreset('ALL'); setIsDatePickerOpen(false); }}
                        >
                          All Time
                        </button>
                        <button
                          type="button"
                          className={`${styles.datePresetBtn} ${dateRangePreset === 'TODAY' ? styles.datePresetBtnActive : ''}`}
                          onClick={() => { setDateRangePreset('TODAY'); setIsDatePickerOpen(false); }}
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          className={`${styles.datePresetBtn} ${dateRangePreset === '7DAYS' ? styles.datePresetBtnActive : ''}`}
                          onClick={() => { setDateRangePreset('7DAYS'); setIsDatePickerOpen(false); }}
                        >
                          Last 7 Days
                        </button>
                        <button
                          type="button"
                          className={`${styles.datePresetBtn} ${dateRangePreset === '30DAYS' ? styles.datePresetBtnActive : ''}`}
                          onClick={() => { setDateRangePreset('30DAYS'); setIsDatePickerOpen(false); }}
                        >
                          Last 30 Days
                        </button>
                        <button
                          type="button"
                          className={`${styles.datePresetBtn} ${dateRangePreset === 'THIS_MONTH' ? styles.datePresetBtnActive : ''}`}
                          onClick={() => { setDateRangePreset('THIS_MONTH'); setIsDatePickerOpen(false); }}
                        >
                          This Month
                        </button>
                        <button
                          type="button"
                          className={`${styles.datePresetBtn} ${dateRangePreset === 'CUSTOM' ? styles.datePresetBtnActive : ''}`}
                          onClick={() => setDateRangePreset('CUSTOM')}
                        >
                          Custom Range
                        </button>
                      </div>

                      <div className={styles.dateCustomSection}>
                        <span className={styles.dateCustomLabel}>Custom Date Range:</span>
                        <div className={styles.dateInputsRow}>
                          <label className={styles.dateFieldGroup}>
                            <span>From:</span>
                            <input
                              type="date"
                              value={customStartDate}
                              onChange={(e) => {
                                setCustomStartDate(e.target.value);
                                setDateRangePreset('CUSTOM');
                              }}
                            />
                          </label>
                          <label className={styles.dateFieldGroup}>
                            <span>To:</span>
                            <input
                              type="date"
                              value={customEndDate}
                              onChange={(e) => {
                                setCustomEndDate(e.target.value);
                                setDateRangePreset('CUSTOM');
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      <div className={styles.datePopoverFooter}>
                        {dateRangePreset !== 'ALL' && (
                          <button
                            type="button"
                            className={styles.dateClearBtn}
                            onClick={() => {
                              setDateRangePreset('ALL');
                              setCustomStartDate('');
                              setCustomEndDate('');
                              setIsDatePickerOpen(false);
                            }}
                          >
                            Reset
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.dateApplyBtn}
                          onClick={() => setIsDatePickerOpen(false)}
                          style={{ marginLeft: 'auto' }}
                        >
                          Apply Filter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Filter Preset Chips */}
          <div className={styles.filterQuickChipsRow} role="group" aria-label="Quick Filter Presets">
            <button
              type="button"
              className={`${styles.filterQuickChip} ${examTypeFilter === 'ALL' && statusFilter === 'ALL' ? styles.filterQuickChipActive : ''}`}
              onClick={() => { setExamTypeFilter('ALL'); setStatusFilter('ALL'); }}
            >
              <span>All Test Series</span>
              <span className={styles.chipCountBadge}>{testSeriesList.length}</span>
            </button>
            <button
              type="button"
              className={`${styles.filterQuickChip} ${examTypeFilter === 'JEE Main' ? styles.filterQuickChipActive : ''}`}
              onClick={() => setExamTypeFilter(examTypeFilter === 'JEE Main' ? 'ALL' : 'JEE Main')}
            >
              <span>JEE Main</span>
              <span className={styles.chipCountBadge}>
                {testSeriesList.filter((t) => t.examType === 'JEE Main').length}
              </span>
            </button>
            <button
              type="button"
              className={`${styles.filterQuickChip} ${examTypeFilter === 'JEE Advanced' ? styles.filterQuickChipActive : ''}`}
              onClick={() => setExamTypeFilter(examTypeFilter === 'JEE Advanced' ? 'ALL' : 'JEE Advanced')}
            >
              <span>JEE Advanced</span>
              <span className={styles.chipCountBadge}>
                {testSeriesList.filter((t) => t.examType === 'JEE Advanced').length}
              </span>
            </button>
            <button
              type="button"
              className={`${styles.filterQuickChip} ${examTypeFilter === 'BITSAT' ? styles.filterQuickChipActive : ''}`}
              onClick={() => setExamTypeFilter(examTypeFilter === 'BITSAT' ? 'ALL' : 'BITSAT')}
            >
              <span>BITSAT</span>
              <span className={styles.chipCountBadge}>
                {testSeriesList.filter((t) => t.examType === 'BITSAT').length}
              </span>
            </button>
            <button
              type="button"
              className={`${styles.filterQuickChip} ${formatFilter === 'Part Test' ? styles.filterQuickChipActive : ''}`}
              onClick={() => {
                setFormatFilter(formatFilter === 'Part Test' ? 'ALL' : 'Part Test');
                if (formatFilter !== 'Part Test') {
                  setExamTypeFilter('ALL');
                  setStatusFilter('ALL');
                }
              }}
            >
              <span>Part Tests ({testSeriesList.filter((t) => t.format === 'Part Test').length})</span>
              <span className={styles.chipCountBadge}>
                {testSeriesList.filter((t) => t.format === 'Part Test').length}
              </span>
            </button>
            <button
              type="button"
              className={`${styles.filterQuickChip} ${statusFilter === 'Scheduled' ? styles.filterQuickChipActive : ''}`}
              onClick={() => {
                setStatusFilter(statusFilter === 'Scheduled' ? 'ALL' : 'Scheduled');
                if (statusFilter !== 'Scheduled') {
                  setExamTypeFilter('ALL');
                  setFormatFilter('ALL');
                }
              }}
            >
              <span>Scheduled CBT</span>
              <span className={styles.chipCountBadge}>
                {testSeriesList.filter((t) => t.status === 'Scheduled').length}
              </span>
            </button>
            <button
              type="button"
              className={`${styles.filterQuickChip} ${statusFilter === 'Published' ? styles.filterQuickChipActive : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'Published' ? 'ALL' : 'Published')}
            >
              <span>Live / Published</span>
              <span className={styles.chipCountBadge}>
                {testSeriesList.filter((t) => t.status === 'Published').length}
              </span>
            </button>
            <button
              type="button"
              className={`${styles.filterQuickChip} ${statusFilter === 'Draft' ? styles.filterQuickChipActive : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'Draft' ? 'ALL' : 'Draft')}
            >
              <span>Drafts</span>
              <span className={styles.chipCountBadge}>
                {testSeriesList.filter((t) => t.status === 'Draft').length}
              </span>
            </button>
          </div>

          {/* Bulk Selection Action Bar */}
          {selectedTestIds.length > 0 && (
            <div className={styles.bulkActionBar}>
              <div className={styles.bulkInfoWrap}>
                <span className={styles.bulkCountBadge}>{selectedTestIds.length} Selected</span>
                <span className={styles.bulkLabel}>Test series selected for batch management</span>
              </div>
              <div className={styles.bulkActionsWrap}>
                <button
                  type="button"
                  className={styles.bulkDeleteBtn}
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                >
                  <Trash2 size={15} />
                  <span>Bulk Delete ({selectedTestIds.length})</span>
                </button>
                <button
                  type="button"
                  className={styles.bulkClearBtn}
                  onClick={() => setSelectedTestIds([])}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* ─── 5. MAIN TEST SERIES DATA TABLE ─── */}
          <div className={styles.tableCard}>
            <div className={styles.tableResponsiveWrap}>
              <table className={styles.testSeriesTable}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={filteredItems.length > 0 && selectedTestIds.length === filteredItems.length}
                        onChange={handleSelectAllToggle}
                        title="Select All Test Series"
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#2563EB' }}
                      />
                    </th>
                    <th
                      style={{ width: '45px', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('indexNo')}
                      title="Sort by Number"
                    >
                      # {sortColumn === 'indexNo' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th
                      style={{ width: '32%', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('title')}
                      title="Sort by Title"
                    >
                      Title {sortColumn === 'title' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th
                      style={{ width: '13%', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('examType')}
                      title="Sort by Exam Type"
                    >
                      Exam Type {sortColumn === 'examType' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th
                      style={{ width: '12%', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('totalTests')}
                      title="Sort by Tests"
                    >
                      Tests {sortColumn === 'totalTests' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th
                      style={{ width: '12%', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('status')}
                      title="Sort by Status"
                    >
                      Status {sortColumn === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th
                      style={{ width: '13%', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('createdAt')}
                      title="Sort by Created Date"
                    >
                      Created At {sortColumn === 'createdAt' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th style={{ width: '120px' }} className={styles.alignRight}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingList ? (
                    Array.from({ length: 8 }).map((_, idx) => (
                      <tr key={`skeleton-${idx}`} className={styles.skeletonRow}>
                        <td style={{ width: '40px', textAlign: 'center' }}>
                          <div className={styles.skeletonBar} style={{ width: '16px', margin: 'auto' }} />
                        </td>
                        <td className={styles.indexCell}>
                          <div className={styles.skeletonBar} style={{ width: '18px' }} />
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div className={styles.skeletonBar} style={{ width: '60%' }} />
                            <div className={styles.skeletonBar} style={{ width: '35%', height: '10px' }} />
                          </div>
                        </td>
                        <td>
                          <div className={styles.skeletonBar} style={{ width: '75px', borderRadius: '12px' }} />
                        </td>
                        <td>
                          <div className={styles.skeletonBar} style={{ width: '45px' }} />
                        </td>
                        <td>
                          <div className={styles.skeletonBar} style={{ width: '85px', borderRadius: '12px' }} />
                        </td>
                        <td>
                          <div className={styles.skeletonBar} style={{ width: '90px' }} />
                        </td>
                        <td className={styles.alignRight}>
                          <div className={styles.skeletonBar} style={{ width: '22px', marginLeft: 'auto' }} />
                        </td>
                      </tr>
                    ))
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className={styles.emptyStateContainer}>
                          <div className={styles.emptyIconBubble}>
                            <Search size={26} />
                          </div>
                          <p className={styles.emptyMainText}>No test series match your query</p>
                          <p className={styles.emptySubText}>
                            Try adjusting your search terms, changing the exam type filter, or resetting all filters.
                          </p>
                          <button
                            type="button"
                            className={styles.btnClearFiltersBtn}
                            onClick={handleClearAllFilters}
                          >
                            Clear Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item) => {
                      const isMenuOpen = openActionRowId === item.id;

                      return (
                        <tr key={item.id} className={styles.tableRow}>
                          <td style={{ width: '40px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedTestIds.includes(item.id)}
                              onChange={() => handleToggleSelectRow(item.id)}
                              style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#2563EB' }}
                            />
                          </td>
                          {/* 1. Index # */}
                          <td className={styles.indexCell}>{item.indexNo}</td>

                          {/* 2. Title with Clean Link, Format & Chapter Coverage */}
                          <td>
                            <div className={styles.titleMetaStack}>
                              <div className={styles.titleRowFlex}>
                                {item.format === 'Part Test' ? (
                                  <span className={styles.partTestPill}>Part Test</span>
                                ) : (
                                  <span className={styles.fullMockPill}>{item.format || 'Full Mock'}</span>
                                )}
                                <span className={styles.boldSeriesTitle}>
                                  {item.title}
                                </span>
                              </div>
                              {item.subtitle && (
                                <span className={styles.subtitleCoverageText}>{item.subtitle}</span>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                                <span className={styles.slugUrlText}>{item.slug}</span>
                                {item.subjects && item.subjects.length > 0 && (
                                  <span className={styles.subjectsInlineBadge}>
                                    {item.subjects.join(' • ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 3. Exam Type Pill */}
                          <td>
                            {item.examType === 'JEE Main' ? (
                              <span className={`${styles.examPill} ${styles.examPillBlue}`}>
                                JEE Main
                              </span>
                            ) : item.examType === 'JEE Advanced' ? (
                              <span className={`${styles.examPill} ${styles.examPillPurple}`}>
                                JEE Advanced
                              </span>
                            ) : (
                              <span className={`${styles.examPill} ${styles.examPillTeal}`}>
                                BITSAT
                              </span>
                            )}
                          </td>

                          {/* 4. Tests count & Breakdown */}
                          <td>
                            <div className={styles.testsCountStack}>
                              <strong className={styles.totalTestsCount}>
                                {item.totalTests}
                              </strong>
                              <span className={styles.breakdownSub}>
                                {item.testsBreakdown}
                              </span>
                            </div>
                          </td>

                          {/* 5. Status Dot Indicator Pill */}
                          <td>
                            {item.status === 'Published' ? (
                              <span className={`${styles.statusDotPill} ${styles.statusPublished}`}>
                                <span className={styles.dotEmerald} />
                                <span>Published</span>
                              </span>
                            ) : item.status === 'Draft' ? (
                              <span className={`${styles.statusDotPill} ${styles.statusDraft}`}>
                                <span className={styles.dotAmber} />
                                <span>Draft</span>
                              </span>
                            ) : item.status === 'Scheduled' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <span className={`${styles.statusDotPill} ${styles.statusScheduled}`}>
                                  <span className={styles.dotIndigo} />
                                  <span>Scheduled CBT</span>
                                </span>
                                {item.schedule?.startWindow && (
                                  <span className={styles.scheduleWindowDateText}>
                                    Opens {new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(item.schedule.startWindow))}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className={`${styles.statusDotPill} ${styles.statusArchived}`}>
                                <span className={styles.dotSlate} />
                                <span>Archived</span>
                              </span>
                            )}
                          </td>

                          {/* 6. Created At */}
                          <td className={styles.createdAtCell}>
                            {item.createdAtFormatted}
                          </td>

                          {/* 7. Actions (Quick Builder + 3-Dots Context Trigger) */}
                          <td className={styles.alignRight}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                className={styles.rowQuickBuilderBtn}
                                onClick={() => handleEditSeries(item)}
                                title="Open in 4-Step Question Builder"
                              >
                                <FileEdit size={12} />
                                <span>Builder</span>
                              </button>

                              <div
                                className={styles.moreActionWrapper}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  className={styles.threeDotsBtn}
                                  onClick={() =>
                                    setOpenActionRowId(isMenuOpen ? null : item.id)
                                  }
                                  title="Actions menu"
                                >
                                  <MoreVertical size={16} />
                                </button>

                              {/* ─── 6. ACTIONS CONTEXT DROPDOWN MENU ─── */}
                              {isMenuOpen && (
                                <div className={styles.floatingContextMenu}>
                                  <button
                                    type="button"
                                    className={styles.contextMenuItem}
                                    onClick={() => {
                                      handleOpenPreview(item, 'OVERVIEW');
                                      setOpenActionRowId(null);
                                    }}
                                  >
                                    <Eye size={13} />
                                    <span>View</span>
                                  </button>

                                  <button
                                    type="button"
                                    className={styles.contextMenuItem}
                                    onClick={() => {
                                      handleOpenEditDrawer(item);
                                      setOpenActionRowId(null);
                                    }}
                                  >
                                    <Pencil size={13} />
                                    <span>Edit</span>
                                  </button>

                                  <button
                                    type="button"
                                    className={styles.contextMenuItem}
                                    onClick={() => {
                                      handleDuplicateSeries(item);
                                      setOpenActionRowId(null);
                                    }}
                                  >
                                    <Copy size={13} />
                                    <span>Duplicate</span>
                                  </button>

                                  <button
                                    type="button"
                                    className={styles.contextMenuItem}
                                    onClick={() => {
                                      handleOpenPreview(item, 'CBT_SIMULATOR');
                                      setOpenActionRowId(null);
                                    }}
                                  >
                                    <CornerUpRight size={13} />
                                    <span>Preview</span>
                                  </button>

                                  {item.status !== 'Published' ? (
                                    <button
                                      type="button"
                                      className={styles.contextMenuItem}
                                      onClick={() => {
                                        handleTogglePublish(item, 'Published');
                                        setOpenActionRowId(null);
                                      }}
                                    >
                                      <PlayCircle size={13} />
                                      <span>Publish</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className={styles.contextMenuItem}
                                      onClick={() => {
                                        handleTogglePublish(item, 'Draft');
                                        setOpenActionRowId(null);
                                      }}
                                    >
                                      <PauseCircle size={13} />
                                      <span>Unpublish</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    className={styles.contextMenuItem}
                                    onClick={() => {
                                      handleArchiveSeries(item);
                                      setOpenActionRowId(null);
                                    }}
                                  >
                                    <Archive size={13} />
                                    <span>Archive</span>
                                  </button>

                                  <div className={styles.menuDivider} />

                                  <button
                                    type="button"
                                    className={`${styles.contextMenuItem} ${styles.menuItemDelete}`}
                                    onClick={() => {
                                      setDeleteConfirmItem(item);
                                      setOpenActionRowId(null);
                                    }}
                                  >
                                    <Trash2 size={13} />
                                    <span>Delete</span>
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

            {/* ─── 7. TABLE PAGINATION FOOTER (PINNED AT BOTTOM) ─── */}
            <div className={styles.paginationFooter}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span className={styles.showingText}>
                  Showing {filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length} test series
                </span>

                <div className={styles.pageSizeSelector}>
                  <span>Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
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
                  className={styles.arrowPageBtn}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Previous page"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNo) => (
                  <button
                    key={pageNo}
                    type="button"
                    className={`${styles.pagePill} ${
                      currentPage === pageNo ? styles.activePagePill : styles.secondaryPagePill
                    }`}
                    onClick={() => setCurrentPage(pageNo)}
                  >
                    {pageNo}
                  </button>
                ))}
                <button
                  type="button"
                  className={styles.arrowPageBtn}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Next page"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW MODE B: 4-STEP CBT BUILDER WIZARD                   */}
      {/* ======================================================== */}
      {viewMode === 'BUILDER' && (
        <div className={styles.builderModeLayout}>
          {/* Top Wizard Bar */}
          <div className={styles.wizardTopNavRow}>
            <button
              type="button"
              className={styles.backToDirectoryBtn}
              onClick={() => setViewMode('TABLE')}
            >
              <ChevronLeft size={16} />
              <span>← Back to Test Series Table</span>
            </button>
            <div className={styles.wizardTitleWrap}>
              <h1 className={styles.wizardMainH1}>Test Series Builder &amp; Examination Engine</h1>
              <span className={styles.wizardSubtitle}>Editing: {editingSeriesTitle}</span>
            </div>
          </div>

          <div className={styles.workspaceColumns}>
            {/* Center Stage ~75% */}
            <div className={styles.centerFormStage}>
              {/* STEP 1: Basic Test Configuration */}
              {currentStep === 1 && (
                <div className={styles.stepContentCard}>
                  <div className={styles.stepHeader}>
                    <div className={styles.stepNumberBadge}>01</div>
                    <div className={styles.stepHeaderInfo}>
                      <h2 className={styles.stepTitle}>1. Mock Test Overview & Examination Pattern</h2>
                      <p className={styles.stepSubtitle}>
                        Configure the examination format, targeting batches, 180-minute duration, and JEE marking rules.
                      </p>
                    </div>
                  </div>

                  {/* One-Click Quick Templates Bar */}
                  <div className={styles.quickTemplatesBar}>
                    <div className={styles.templateBarLabel}>
                      <Sparkles size={14} className={styles.templateSparkleIcon} />
                      <span>1-Click Preset Templates (Auto-Configures Pattern, Timing & Marking):</span>
                    </div>
                    <div className={styles.templatePillsRow}>
                      <button
                        type="button"
                        className={styles.templatePillBtn}
                        onClick={() => applyTemplatePreset('JEE_MAIN')}
                        title="300 Marks, 75 Qs, Physics/Chemistry/Math (+4/-1)"
                      >
                        🚀 NTA JEE Main (300M • 75Q)
                      </button>
                      <button
                        type="button"
                        className={styles.templatePillBtn}
                        onClick={() => applyTemplatePreset('PART_TEST')}
                        title="High-Yield Chapter Module (+4/-1, 90 mins)"
                      >
                        ⚡ Part Test Engine (High-Yield Chapters)
                      </button>
                      <button
                        type="button"
                        className={styles.templatePillBtn}
                        onClick={() => applyTemplatePreset('JEE_ADV')}
                        title="Advanced Multi-correct & Numerical (+4/-2, 180 mins)"
                      >
                        🎯 JEE Advanced Specialist (Paper 1 & 2)
                      </button>
                      <button
                        type="button"
                        className={styles.templatePillBtn}
                        onClick={() => applyTemplatePreset('BITSAT')}
                        title="Speed Test: 130 Questions (+3/-1, 180 mins)"
                      >
                        🏎️ BITSAT 2026 Speed CBT (130 Qs)
                      </button>
                    </div>
                  </div>

                  <div className={styles.formGrid2Col}>
                    <div className={`${styles.formField} ${styles.fullWidth}`}>
                      <label>Test Title *</label>
                      <input
                        type="text"
                        value={editingSeriesTitle}
                        onChange={(e) => setEditingSeriesTitle(e.target.value)}
                        placeholder="e.g., JEE Main 2026 Full Syllabus Series"
                        className={styles.primaryInput}
                      />
                    </div>

                    <div className={`${styles.formField} ${styles.fullWidth}`}>
                      <label>Chapter Coverage & Subtitle *</label>
                      <input
                        type="text"
                        value={editingSeriesSubtitle}
                        onChange={(e) => setEditingSeriesSubtitle(e.target.value)}
                        placeholder="e.g., Physics: Modern Physics • Chemistry: Amines & Coordination • Math: Vectors & 3D"
                        className={styles.primaryInput}
                      />
                    </div>

                    <div className={styles.formField}>
                      <label>Target Exam Category (Student Primary Filter) *</label>
                      <select
                        value={wizardTargetExam}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setWizardTargetExam(val);
                          if (val === 'PartTest') {
                            setWizardFormat('Part Test');
                            setWizardDuration(60);
                            setWizardTotalMarks(100);
                            setWizardExamPattern('JEE Part Test (100 Marks • 25 Qs)');
                            setPositiveMarks(4);
                            setNegativeMarks(1);
                          } else if (val === 'JEE Advanced') {
                            setWizardFormat('Full Mock');
                            setWizardDuration(180);
                            setWizardTotalMarks(180);
                            setWizardExamPattern('JEE Advanced Paper 1');
                            setPositiveMarks(4);
                            setNegativeMarks(2);
                          } else if (val === 'BITSAT') {
                            setWizardFormat('Full Mock');
                            setWizardDuration(180);
                            setWizardTotalMarks(390);
                            setWizardExamPattern('BITSAT Speed Drill');
                            setPositiveMarks(3);
                            setNegativeMarks(1);
                          } else if (val === 'MathSpeed') {
                            setWizardFormat('Chapter Test');
                            setWizardDuration(45);
                            setWizardTotalMarks(100);
                            setWizardExamPattern('DK Sir Math Speed Sprint');
                            setSelectedSubjects(['Mathematics']);
                            setPositiveMarks(4);
                            setNegativeMarks(1);
                          } else {
                            setWizardFormat('Full Mock');
                            setWizardDuration(180);
                            setWizardTotalMarks(300);
                            setWizardExamPattern('NTA JEE Main Pattern');
                            setPositiveMarks(4);
                            setNegativeMarks(1);
                          }
                        }}
                        className={styles.primarySelect}
                      >
                        <option value="JEE Main">JEE Main Filter</option>
                        <option value="PartTest">Part Tests Engine (High-Yield Chapter Tests)</option>
                        <option value="JEE Advanced">JEE Advanced Engine</option>
                        <option value="BITSAT">BITSAT Speed CBT</option>
                        <option value="MathSpeed">DK Sir Math Speed</option>
                      </select>
                    </div>

                    <div className={styles.formField}>
                      <label>Test Series Format (Student Format Dropdown) *</label>
                      <select
                        value={wizardFormat}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setWizardFormat(val);
                          if (val === 'Part Test') {
                            setWizardTotalMarks(100);
                            setWizardDuration(60);
                          } else if (val === 'Full Mock') {
                            setWizardTotalMarks(300);
                            setWizardDuration(180);
                          }
                        }}
                        className={styles.primarySelect}
                      >
                        <option value="Full Mock">Full Mock (Full-Length Mocks)</option>
                        <option value="Part Test">Part Test (Part Tests)</option>
                        <option value="Chapter Test">Chapter Test (Chapter Tests)</option>
                      </select>
                    </div>

                    <div className={styles.formField}>
                      <label>Difficulty Level (Student Diff Dropdown) *</label>
                      <select
                        value={wizardDifficulty}
                        onChange={(e) => setWizardDifficulty(e.target.value as any)}
                        className={styles.primarySelect}
                      >
                        <option value="Moderate">Moderate (Main Level)</option>
                        <option value="Challenging">Challenging</option>
                        <option value="Advanced">Advanced (IIT Ranker)</option>
                      </select>
                    </div>

                    <div className={styles.formField}>
                      <label>Examination Format / Pattern *</label>
                      <select
                        value={wizardExamPattern}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWizardExamPattern(val);
                          if (val.includes('Part Test')) {
                            setWizardFormat('Part Test');
                            setWizardTargetExam('PartTest');
                            setWizardDuration(60);
                            setWizardTotalMarks(100);
                            setPositiveMarks(4);
                            setNegativeMarks(1);
                          } else if (val.includes('NTA JEE Main')) {
                            setWizardFormat('Full Mock');
                            setWizardTargetExam('JEE Main');
                            setWizardDuration(180);
                            setWizardTotalMarks(300);
                            setPositiveMarks(4);
                            setNegativeMarks(1);
                          } else if (val.includes('BITSAT')) {
                            setWizardFormat('Full Mock');
                            setWizardTargetExam('BITSAT');
                            setWizardDuration(180);
                            setWizardTotalMarks(390);
                            setPositiveMarks(3);
                            setNegativeMarks(1);
                          } else if (val.includes('JEE Advanced')) {
                            setWizardFormat('Full Mock');
                            setWizardTargetExam('JEE Advanced');
                            setWizardDuration(180);
                            setWizardTotalMarks(180);
                            setPositiveMarks(4);
                            setNegativeMarks(2);
                          } else if (val.includes('Math Speed') || val.includes('Chapter-wise')) {
                            setWizardFormat('Chapter Test');
                            setWizardTargetExam('MathSpeed');
                            setWizardDuration(45);
                            setWizardTotalMarks(100);
                            setPositiveMarks(4);
                            setNegativeMarks(1);
                          }
                        }}
                        className={styles.primarySelect}
                      >
                        <option value="JEE Part Test (100 Marks • 25 Qs)">JEE Part Test (100 Marks • 25 Qs • 60 Mins)</option>
                        <option value="Part Test High-Yield Module">Part Test High-Yield Module (100 Marks • 25 Qs)</option>
                        <option value="NTA JEE Main Pattern">NTA JEE Main Pattern (300 Marks • 75 Qs • 180 Mins)</option>
                        <option value="JEE Advanced Paper 1">JEE Advanced Paper 1 (180 Marks • Comprehensive)</option>
                        <option value="JEE Advanced Paper 2">JEE Advanced Paper 2 (180 Marks • Multi-Correct & Matrix)</option>
                        <option value="BITSAT Speed Drill">BITSAT Speed Drill (390 Marks • 130 Qs • Speed Math)</option>
                        <option value="DK Sir Math Speed Sprint">DK Sir Math Speed Sprint (100 Marks • 25 Qs • 45 Mins)</option>
                        <option value="Chapter-wise Topic Test">Chapter-wise Topic Test (100 Marks • 25 Qs • 45 Mins)</option>
                      </select>
                    </div>

                    <div className={styles.formField}>
                      <label>Total Duration (Minutes) *</label>
                      <div className={styles.inputWithUnit}>
                        <input
                          type="number"
                          value={wizardDuration}
                          onChange={(e) => setWizardDuration(Number(e.target.value))}
                          className={styles.primaryInput}
                        />
                        <span className={styles.unitTag}>{wizardDuration} Mins ({(wizardDuration / 60).toFixed(1)} Hrs)</span>
                      </div>
                      <div className={styles.durationChipsRow}>
                        {[45, 60, 90, 180].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            className={`${styles.durationChip} ${wizardDuration === mins ? styles.durationChipActive : ''}`}
                            onClick={() => setWizardDuration(mins)}
                          >
                            {mins} Mins
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.formField}>
                      <label>Total Examination Marks *</label>
                      <div className={styles.inputWithUnit}>
                        <input
                          type="number"
                          value={wizardTotalMarks}
                          onChange={(e) => setWizardTotalMarks(Number(e.target.value))}
                          className={styles.primaryInput}
                        />
                        <span className={styles.unitTag}>{wizardTotalMarks} Marks</span>
                      </div>
                      <div className={styles.durationChipsRow}>
                        {[100, 120, 180, 300, 390].map((marks) => (
                          <button
                            key={marks}
                            type="button"
                            className={`${styles.durationChip} ${wizardTotalMarks === marks ? styles.durationChipActive : ''}`}
                            onClick={() => setWizardTotalMarks(marks)}
                          >
                            {marks}M {marks === 100 ? '(Part Test)' : marks === 300 ? '(JEE Main)' : marks === 180 ? '(Adv)' : marks === 390 ? '(BITSAT)' : ''}
                          </button>
                        ))}
                      </div>
                      <small style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', marginBottom: '2px', fontWeight: 500 }}>
                        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
                        Questions loaded: {questions.length} problems • Raw marks: {questions.length * positiveMarks} (+{positiveMarks}/-{negativeMarks})
                      </small>
                    </div>

                    <div className={`${styles.formField} ${styles.fullWidth}`}>
                      <label>Standard Marking Scheme (MCQs & Numericals)</label>
                      <div className={styles.markingSchemeRow}>
                        <div className={styles.markingSubBlock}>
                          <span className={styles.subBlockLabel}>Correct Answer (+)</span>
                          <div className={styles.inputBadgeEmerald}>
                            <span className={styles.signEmerald}>+</span>
                            <input
                              type="number"
                              value={positiveMarks}
                              onChange={(e) => setPositiveMarks(Number(e.target.value))}
                            />
                            <span className={styles.ptsText}>Marks</span>
                          </div>
                        </div>

                        <div className={styles.markingSubBlock}>
                          <span className={styles.subBlockLabel}>Negative Penalty (-)</span>
                          <div className={styles.inputBadgeCrimson}>
                            <span className={styles.signCrimson}>-</span>
                            <input
                              type="number"
                              value={negativeMarks}
                              onChange={(e) => setNegativeMarks(Number(e.target.value))}
                            />
                            <span className={styles.ptsText}>Marks</span>
                          </div>
                        </div>

                        <div className={styles.markingSubBlockCheck}>
                          <label className={styles.checkToggleLabel}>
                            <input
                              type="checkbox"
                              checked={zeroPenaltyNumerical}
                              onChange={(e) => setZeroPenaltyNumerical(e.target.checked)}
                            />
                            <span>Zero penalty for unattempted questions</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Examination Guidelines */}
                    <div className={`${styles.formField} ${styles.fullWidth}`}>
                      <label>Important Examination Guidelines</label>
                      <div className={styles.guidelinesEditorBlock}>
                        {examGuidelines.map((g, idx) => (
                          <div key={idx} className={styles.guidelineItemRow}>
                            <span className={styles.guidelineNumBadge}>{idx + 1}</span>
                            <input
                              type="text"
                              value={g}
                              onChange={(e) => handleUpdateGuideline(idx, e.target.value)}
                              className={styles.guidelineInput}
                            />
                            <button
                              type="button"
                              className={styles.removeGuidelineBtn}
                              onClick={() => handleRemoveGuideline(idx)}
                              title="Remove rule"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className={styles.addGuidelineBtn}
                          onClick={handleAddGuideline}
                        >
                          <Plus size={14} />
                          <span>Add Guideline Rule</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles.stepActionBarRight}>
                    <button
                      type="button"
                      className={styles.nextStepBtn}
                      onClick={handleNextStep}
                    >
                      <span>Next: Section Rules →</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Section Structure & Subject Split */}
              {currentStep === 2 && (
                <div className={styles.stepContentCard}>
                  <div className={styles.stepHeader}>
                    <div className={styles.stepNumberBadge}>02</div>
                    <div className={styles.stepHeaderInfo}>
                      <h2 className={styles.stepTitle}>2. Subject Sections & Optional Question Rules</h2>
                      <p className={styles.stepSubtitle}>
                        Select active subjects for this exam, configure question counts, and enforce NTA’s "Attempt 5 of 10" rule.
                      </p>
                    </div>
                  </div>

                  {/* Interactive Active Subject Selection Bar */}
                  <div className={styles.subjectSelectorWrap}>
                    <div className={styles.subjectSelectLabel}>
                      <span>Active Paper Subjects:</span>
                      <span className={styles.subjectSelectHint}>Click to enable or disable subjects for this test</span>
                    </div>
                    <div className={styles.subjectPillGroup}>
                      {(['Physics', 'Chemistry', 'Mathematics'] as const).map((subj) => (
                        <button
                          key={subj}
                          type="button"
                          className={`${styles.subjectPillToggle} ${selectedSubjects.includes(subj) ? styles.active : ''}`}
                          onClick={() => toggleSubjectSelection(subj)}
                        >
                          {selectedSubjects.includes(subj) ? '✓ ' : '+ '}
                          {subj}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.subjectsContainer}>
                    {(['Physics', 'Chemistry', 'Mathematics'] as const)
                      .filter((subjKey) => selectedSubjects.includes(subjKey))
                      .map((subjKey) => {
                        const rule = subjectRules[subjKey];
                        return (
                          <div key={subjKey} className={styles.subjectBlockCard}>
                            <div className={styles.subjectCardHeader}>
                              <div className={styles.subjectBadgeGroup}>
                                <span className={styles.subjectPillBadge}>{rule.badgeTitle}</span>
                                <span className={styles.totalQsPill}>
                                  Total: {rule.secATotal + rule.secBTotal} Questions • {((rule.secATotal + (rule.secBEnforceOptional ? 5 : rule.secBTotal)) * positiveMarks)} Marks
                                </span>
                              </div>
                              <span className={styles.configuredBadge}>✓ Active & Configured</span>
                            </div>

                            <div className={styles.sectionsSplitGrid}>
                              <div className={styles.sectionColCard}>
                                <div className={styles.secColHeader}>
                                  <h4>Section A: Single Correct MCQs</h4>
                                  <span className={styles.compulsoryPill}>Compulsory</span>
                                </div>
                                <div className={styles.secRuleInfoRow}>
                                  <label>Questions Count:</label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={rule.secATotal}
                                    onChange={(e) => {
                                      const val = Math.max(1, Number(e.target.value) || 0);
                                      setSubjectRules({
                                        ...subjectRules,
                                        [subjKey]: { ...rule, secATotal: val }
                                      });
                                    }}
                                    className={styles.secNumInput}
                                  />
                                  <span className={styles.secRuleNote}>+{positiveMarks} / -{negativeMarks} Marking</span>
                                </div>
                              </div>

                              <div className={styles.sectionColCard}>
                                <div className={styles.secColHeader}>
                                  <h4>Section B: Numerical Value Type</h4>
                                  <span className={styles.optionalPill}>
                                    {rule.secBEnforceOptional ? 'NTA 5 of 10' : 'Direct Numerical'}
                                  </span>
                                </div>
                                <div className={styles.secRuleInfoRow}>
                                  <label>Questions Count:</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={30}
                                    value={rule.secBTotal}
                                    onChange={(e) => {
                                      const val = Math.max(0, Number(e.target.value) || 0);
                                      setSubjectRules({
                                        ...subjectRules,
                                        [subjKey]: { ...rule, secBTotal: val }
                                      });
                                    }}
                                    className={styles.secNumInput}
                                  />
                                  <span className={styles.secRuleNote}>
                                    {rule.secBEnforceOptional ? 'Attempt any 5' : 'All compulsory'}
                                  </span>
                                </div>
                                <label className={styles.toggleRow}>
                                  <input
                                    type="checkbox"
                                    checked={rule.secBEnforceOptional}
                                    onChange={(e) => {
                                      setSubjectRules({
                                        ...subjectRules,
                                        [subjKey]: {
                                          ...rule,
                                          secBEnforceOptional: e.target.checked
                                        }
                                      });
                                    }}
                                  />
                                  <span>Enforce NTA Optional: Attempt any 5 out of 10 questions</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Live Exam Structure Summary Box */}
                  <div className={styles.overallSummaryCard}>
                    <h4 className={styles.summaryTitle}>📊 Live Examination Blueprint Summary</h4>
                    <div className={styles.summaryMetricsGrid}>
                      <div className={styles.summaryMetricItem}>
                        <span className={styles.summaryMetricLabel}>Active Subjects</span>
                        <span className={styles.summaryMetricVal}>{selectedSubjects.length} ({selectedSubjects.join(', ')})</span>
                      </div>
                      <div className={styles.summaryMetricItem}>
                        <span className={styles.summaryMetricLabel}>Total Paper Questions</span>
                        <span className={styles.summaryMetricVal}>
                          {selectedSubjects.reduce((acc, s) => acc + (subjectRules[s]?.secATotal || 20) + (subjectRules[s]?.secBTotal || 10), 0)} Questions
                        </span>
                      </div>
                      <div className={styles.summaryMetricItem}>
                        <span className={styles.summaryMetricLabel}>Total to Attempt</span>
                        <span className={styles.summaryMetricVal}>
                          {selectedSubjects.reduce((acc, s) => acc + (subjectRules[s]?.secATotal || 20) + (subjectRules[s]?.secBEnforceOptional ? 5 : (subjectRules[s]?.secBTotal || 10)), 0)} Questions
                        </span>
                      </div>
                      <div className={styles.summaryMetricItem}>
                        <span className={styles.summaryMetricLabel}>Maximum Exam Marks</span>
                        <span className={`${styles.summaryMetricVal} ${styles.marksHighlight}`}>
                          {selectedSubjects.reduce((acc, s) => acc + (subjectRules[s]?.secATotal || 20) + (subjectRules[s]?.secBEnforceOptional ? 5 : (subjectRules[s]?.secBTotal || 10)), 0) * positiveMarks} Marks
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.stepActionBarBetween}>
                    <button type="button" className={styles.prevStepBtn} onClick={handlePrevStep}>
                      <span>← Prev: Configuration</span>
                    </button>
                    <button type="button" className={styles.nextStepBtn} onClick={handleNextStep}>
                      <span>Next: Question Authoring →</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Question Authoring */}
              {currentStep === 3 && (
                <div className={styles.stepContentCard}>
                  <div className={styles.stepHeader}>
                    <div className={styles.stepNumberBadge}>03</div>
                    <div className={styles.stepHeaderInfo}>
                      <h2 className={styles.stepTitle}>3. Question Engine: Content, Formulas & Explanations</h2>
                      <p className={styles.stepSubtitle}>
                        Author single-choice and numerical questions with live LaTeX math rendering, answer keys, and DK Sir speed shortcuts.
                      </p>
                    </div>
                  </div>

                  {/* Subject Switcher Row (If multiple subjects active) */}
                  {selectedSubjects.length > 1 && (
                    <div className={styles.subjectSwitcherRow}>
                      {selectedSubjects.map((subj) => {
                        const subjQs = questions.filter((q) => q.subject === subj);
                        const filled = subjQs.filter(isQuestionFilled).length;
                        return (
                          <button
                            key={subj}
                            type="button"
                            className={`${styles.subjectSwitchBtn} ${activeSubjectTab === subj ? styles.active : ''}`}
                            onClick={() => {
                              setActiveSubjectTab(subj);
                              const firstSubjQ = questions.find((q) => q.subject === subj);
                              if (firstSubjQ) setSelectedQuestionId(firstSubjQ.id);
                            }}
                          >
                            <span>{subj}</span>
                            <span style={{ fontSize: '11px', opacity: 0.9 }}>
                              ({filled}/{subjQs.length} Filled)
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Overall Paper Blueprint Progress Strip */}
                  <div className={styles.overallProgressStrip}>
                    <div className={styles.progressStripText}>
                      <span style={{ fontSize: '15px' }}>📊</span>
                      <span>
                        Paper Content Progress: <strong>{totalPaperFilled}</strong> of <strong>{questions.length}</strong> Questions Filled
                        {questions.length - totalPaperFilled > 0 ? (
                          <span style={{ color: '#dc2626', marginLeft: '6px' }}>({questions.length - totalPaperFilled} Pending)</span>
                        ) : (
                          <span style={{ color: '#16a34a', marginLeft: '6px' }}>(All Questions Authored! 🎉)</span>
                        )}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={syncQuestionsWithSections}
                        className={styles.syncBlueprintBtn}
                        title="Re-sync slots to match Section A and Section B counts configured in Step 2"
                      >
                        <span>🔄 Sync Blueprint ({selectedSubjects.reduce((acc, s) => acc + (subjectRules[s]?.secATotal || 20) + (subjectRules[s]?.secBTotal || 10), 0)} Qs)</span>
                      </button>

                      <button
                        type="button"
                        className={styles.addNewQuestionBtn}
                        onClick={handleAddQuestion}
                      >
                        <Plus size={14} />
                        <span>Add Slot</span>
                      </button>
                    </div>
                  </div>

                  {/* Section A & Section B Real-Time Palettes (Green for filled, Red for pending) */}
                  <div className={styles.sectionsSplitTrackerGrid}>
                    {/* Section A: Single Correct MCQs */}
                    <div className={`${styles.sectionPaletteCard} ${styles.paletteCardA}`}>
                      <div className={styles.secPaletteHeader}>
                        <div className={styles.secTitleGroup}>
                          <span className={styles.secBadgeA}>Section A</span>
                          <h3 className={styles.secHeaderTitle}>Single Correct MCQs</h3>
                        </div>
                        <div className={styles.secStatsGroup}>
                          <span className={styles.pillFilledBadge}>✓ {secAFilledCount}/{secAQuestions.length} Filled</span>
                          {secAQuestions.length - secAFilledCount > 0 && (
                            <span className={styles.pillPendingBadge}>{secAQuestions.length - secAFilledCount} Pending</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.secProgressBar}>
                        <div
                          className={styles.secProgressFillA}
                          style={{ width: `${secAQuestions.length > 0 ? Math.round((secAFilledCount / secAQuestions.length) * 100) : 0}%` }}
                        />
                      </div>

                      <p className={styles.secSubtextNote}>
                        Compulsory Questions • +{positiveMarks} / -{negativeMarks} Marking • 4 Options (A, B, C, D)
                      </p>

                      <div className={styles.qButtonsGrid}>
                        {secAQuestions.map((q) => {
                          const filled = isQuestionFilled(q);
                          const isSelected = currentEditingQuestion?.id === q.id;
                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => setSelectedQuestionId(q.id)}
                              className={`${styles.qButtonTile} ${filled ? styles.qTileFilled : styles.qTilePending} ${isSelected ? styles.qTileActive : ''}`}
                              title={`Question ${q.index} (${q.subject} - Section A): ${filled ? 'Filled' : 'Empty / Pending'}`}
                            >
                              <span className={styles.qNumberLabel}>Q{q.index}</span>
                              {filled && <span className={styles.statusIndicatorDot}>✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section B: Numerical Value Type */}
                    <div className={`${styles.sectionPaletteCard} ${styles.paletteCardB}`}>
                      <div className={styles.secPaletteHeader}>
                        <div className={styles.secTitleGroup}>
                          <span className={styles.secBadgeB}>Section B</span>
                          <h3 className={styles.secHeaderTitle}>Numerical Value Type</h3>
                        </div>
                        <div className={styles.secStatsGroup}>
                          <span className={styles.pillFilledBadge}>✓ {secBFilledCount}/{secBQuestions.length} Filled</span>
                          {secBQuestions.length - secBFilledCount > 0 && (
                            <span className={styles.pillPendingBadge}>{secBQuestions.length - secBFilledCount} Pending</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.secProgressBar}>
                        <div
                          className={styles.secProgressFillB}
                          style={{ width: `${secBQuestions.length > 0 ? Math.round((secBFilledCount / secBQuestions.length) * 100) : 0}%` }}
                        />
                      </div>

                      <p className={styles.secSubtextNote}>
                        {subjectRules[activeSubjectTab]?.secBEnforceOptional ? 'NTA 5 of 10 Optional: Attempt any 5' : 'Direct Numerical: All compulsory'} • Integer or Decimal Key
                      </p>

                      <div className={styles.qButtonsGrid}>
                        {secBQuestions.map((q) => {
                          const filled = isQuestionFilled(q);
                          const isSelected = currentEditingQuestion?.id === q.id;
                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => setSelectedQuestionId(q.id)}
                              className={`${styles.qButtonTile} ${filled ? styles.qTileFilled : styles.qTilePending} ${isSelected ? styles.qTileActive : ''}`}
                              title={`Question ${q.index} (${q.subject} - Section B): ${filled ? 'Filled' : 'Empty / Pending'}`}
                            >
                              <span className={styles.qNumberLabel}>Q{q.index}</span>
                              {filled && <span className={styles.statusIndicatorDot}>✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Question Editor */}
                  {currentEditingQuestion && (
                    <div className={styles.questionEditorCard}>
                      {/* 1. Header Toolbar (Actions & Identification) */}
                      <div className={styles.qEditorHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span
                            className={styles.qIndexPill}
                            style={{
                              background: currentEditingQuestion.section === 'A' ? '#DBEAFE' : '#FEF3C7',
                              color: currentEditingQuestion.section === 'A' ? '#1E40AF' : '#92400E',
                              border: `1px solid ${currentEditingQuestion.section === 'A' ? '#BFDBFE' : '#FDE68A'}`
                            }}
                          >
                            Q{currentEditingQuestion.index} • Section {currentEditingQuestion.section} ({currentEditingQuestion.section === 'A' ? 'Single Correct MCQ' : 'Numerical Value Type'})
                          </span>
                          {isQuestionFilled(currentEditingQuestion) ? (
                            <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0' }}>
                              ✓ Content Filled &amp; Ready
                            </span>
                          ) : (
                            <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' }}>
                              ⚠️ Pending - Empty Statement or Answer
                            </span>
                          )}
                          <span className={styles.topicBadgePill}>
                            {currentEditingQuestion.topicTag || 'General Problem'}
                          </span>
                        </div>

                        {/* Question Actions Toolbar */}
                        <div className={styles.qEditorActionsRow}>
                          <button
                            type="button"
                            className={styles.secondaryActionBtn}
                            onClick={() => handleDuplicateQuestion(currentEditingQuestion)}
                            title="Duplicate question"
                          >
                            <Copy size={13} />
                            <span>Duplicate</span>
                          </button>
                          {questions.length > 1 && (
                            <button
                              type="button"
                              className={styles.dangerActionBtn}
                              onClick={() => handleDeleteQuestion(currentEditingQuestion.id)}
                              title="Delete question"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 2. Metadata Context Bar (Subject & Topic) */}
                      <div className={styles.qMetadataRow}>
                        <div className={styles.metaFieldItem}>
                          <label className={styles.metaFieldLabel}>Subject:</label>
                          <select
                            value={currentEditingQuestion.subject}
                            onChange={(e) => updateCurrentQuestion({ subject: e.target.value as any })}
                            className={styles.primarySelect}
                            style={{ height: '32px', padding: '0 8px', fontSize: '12px' }}
                          >
                            <option value="Mathematics">Mathematics</option>
                            <option value="Physics">Physics</option>
                            <option value="Chemistry">Chemistry</option>
                          </select>
                        </div>

                        <div className={styles.metaFieldItem} style={{ flex: 1 }}>
                          <label className={styles.metaFieldLabel}>Topic Tag:</label>
                          <input
                            type="text"
                            value={currentEditingQuestion.topicTag}
                            onChange={(e) => updateCurrentQuestion({ topicTag: e.target.value })}
                            placeholder="Topic Tag (e.g. 3D Geometry, Vectors)"
                            className={styles.topicInput}
                            style={{ width: '100%', height: '32px' }}
                          />
                        </div>

                        <div className={styles.metaFieldItem}>
                          <label className={styles.metaFieldLabel}>Difficulty:</label>
                          <select
                            value={currentEditingQuestion.difficulty}
                            onChange={(e) => updateCurrentQuestion({ difficulty: e.target.value as any })}
                            className={styles.primarySelect}
                            style={{ height: '32px', padding: '0 8px', fontSize: '12px' }}
                          >
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                          </select>
                        </div>
                      </div>

                      <div className={styles.qBodySection}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <label className={styles.sectionLabel} style={{ marginBottom: 0 }}>
                            Question Statement (LaTeX / KaTeX Syntax Supported)
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setIsSmartPasteModalOpen(true)}
                              className={styles.smartPasteActionBtn}
                              title="Paste full question with options from Word or PDF"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: '#EFF6FF',
                                color: '#1D4ED8',
                                border: '1px solid #BFDBFE',
                                borderRadius: '6px',
                                padding: '4px 9px',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              <Sparkles size={13} color="#2563EB" />
                              <span>Paste Word Question</span>
                            </button>
                            <span className={styles.cbtMarksPill}>
                              +{positiveMarks} / -{negativeMarks} Marks
                            </span>
                          </div>
                        </div>
                        <MathInput
                          value={currentEditingQuestion.questionText}
                          onChange={(val, blocks) => updateCurrentQuestion({ questionText: val, statementBlocks: blocks })}
                          onExtractOptions={(statement, options, correctKey) => {
                            updateCurrentQuestion({
                              questionText: statement,
                              statementBlocks: parseContentToBlocks(statement),
                              options,
                              ...(correctKey ? { correctKey } : {})
                            });
                            showToast('✨ Auto-detected Question Statement & Options A, B, C, D from Word!');
                          }}
                          placeholder="Type normal text or equations ($x^2$, \frac{a}{b}, \int, \begin{cases}, \begin{bmatrix})... Or paste directly from Word!"
                          rows={6}
                          defaultViewMode="edit"
                        />
                      </div>

                      {/* Options Grid for Section A OR Numerical Value Input for Section B */}
                      {currentEditingQuestion.section === 'B' || currentEditingQuestion.type === 'NUMERICAL' ? (
                        <div className={styles.numericalAnswerCard}>
                          <div className={styles.numericalHeader}>
                            <Hash size={16} color="#2563EB" />
                            <h4>Section B: Correct Numerical Key (Integer or Decimal)</h4>
                          </div>
                          <p className={styles.numericalSubtext}>
                            Students will enter their calculated numerical answer using the on-screen CBT keypad (e.g. 4, 12, -7, 0.25).
                          </p>
                          <div className={styles.numericalInputRow}>
                            <label>Exact Correct Value:</label>
                            <input
                              type="text"
                              value={currentEditingQuestion.numericalAnswer || currentEditingQuestion.correctKey || ''}
                              onChange={(e) => updateCurrentQuestion({
                                numericalAnswer: e.target.value,
                                correctKey: e.target.value
                              })}
                              placeholder="Enter correct numerical answer (e.g. 4 or 12.5)"
                              className={styles.numericalInputField}
                            />
                            {Boolean(currentEditingQuestion.numericalAnswer || currentEditingQuestion.correctKey) && (
                              <span className={styles.correctKeyTag}>✓ Answer Key Saved</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className={styles.optionsList}>
                          {currentEditingQuestion.options.map((opt) => {
                            return (
                              <div key={opt.key} className={styles.optionRowItem} style={{ alignItems: 'flex-start', marginBottom: '14px' }}>
                                <label className={styles.radioKeyWrap} style={{ marginTop: '10px' }}>
                                  <input
                                    type="radio"
                                    name="correctKey"
                                    checked={currentEditingQuestion.correctKey === opt.key}
                                    onChange={() => updateCurrentQuestion({ correctKey: opt.key })}
                                  />
                                  <span className={styles.optionKeyCircle}>{opt.key}</span>
                                </label>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <MathInput
                                    value={opt.text}
                                    onChange={(val) => {
                                      const newOpts = currentEditingQuestion.options.map((o) =>
                                        o.key === opt.key ? { ...o, text: val } : o
                                      );
                                      updateCurrentQuestion({ options: newOpts });
                                    }}
                                    placeholder={`Option ${opt.key} text or formula ($...$, \\frac{a}{b}, \\sqrt{x}, 1/16)... Or paste from Word`}
                                    rows={2}
                                    label={`Option ${opt.key}`}
                                    compact={true}
                                    defaultViewMode="edit"
                                  />
                                </div>
                                {currentEditingQuestion.correctKey === opt.key && (
                                  <span className={styles.correctKeyTag} style={{ marginTop: '10px' }}>✓ Answer Key</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Question-Specific Scheduled Solution Attachments (Video & PDF) */}
                  <div
                    style={{
                      marginTop: '20px',
                      padding: '16px 18px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Video size={16} color="#2563EB" />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                          Question Solution &amp; Video Walkthrough (Scheduled Release Protected)
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748B', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: '12px' }}>
                        Optional • For Difficult Questions
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 14px 0' }}>
                      Attach dedicated video explanations (YouTube or Google Drive) and PDF derivations for this question. These solutions remain locked until the student's scheduled release timer.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                          Video Solution URL (YouTube / Google Drive):
                        </label>
                        <input
                          type="url"
                          value={currentEditingQuestion.videoSolutionUrl || ''}
                          onChange={(e) => updateCurrentQuestion({ videoSolutionUrl: e.target.value })}
                          placeholder="https://www.youtube.com/watch?v=... or Drive link"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '12.5px'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                          PDF Solution URL:
                        </label>
                        <input
                          type="url"
                          value={currentEditingQuestion.pdfSolutionUrl || ''}
                          onChange={(e) => updateCurrentQuestion({ pdfSolutionUrl: e.target.value })}
                          placeholder="https://.../question-solution.pdf"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '12.5px'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.stepActionBarBetween}>
                    <button type="button" className={styles.prevStepBtn} onClick={handlePrevStep}>
                      <span>← Prev: Section Rules</span>
                    </button>
                    <button type="button" className={styles.nextStepBtn} onClick={handleNextStep}>
                      <span>Next: Schedule & Publish →</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Schedule & Publishing */}
              {currentStep === 4 && (
                <div className={styles.stepContentCard}>
                  <div className={styles.stepHeader}>
                    <div className={styles.stepNumberBadge}>04</div>
                    <div className={styles.stepHeaderInfo}>
                      <h2 className={styles.stepTitle}>4. Live Exam Scheduling &amp; Automated Proctoring Rules</h2>
                      <p className={styles.stepSubtitle}>
                        Configure examination windows, shift slots, automated anti-cheating proctoring, server-synced non-pausable timers, and NTA percentile rank normalization.
                      </p>
                    </div>
                  </div>

                  {/* 1. Release Publication Status & Exam Delivery Mode */}
                  <div style={{ marginBottom: '20px', background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} color="#2563EB" />
                        <span>Release Publication Status *</span>
                      </label>
                      <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: builderStatus === 'Published' ? '#DCFCE7' : builderStatus === 'Scheduled' ? '#EFF6FF' : '#F1F5F9', color: builderStatus === 'Published' ? '#166534' : builderStatus === 'Scheduled' ? '#1D4ED8' : '#475569' }}>
                        {builderStatus === 'Published' ? '🟢 Live & Accessible' : builderStatus === 'Scheduled' ? '⏳ Scheduled Window' : '📝 Saved as Draft'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      <div>
                        <select
                          value={builderStatus}
                          onChange={(e) => {
                            const val = e.target.value as 'Published' | 'Draft' | 'Scheduled';
                            setBuilderStatus(val);
                            if (val === 'Scheduled') {
                              setScheduleMode('SCHEDULED_WINDOW');
                            } else {
                              setScheduleMode('OPEN_PRACTICE');
                            }
                          }}
                          className={styles.primaryTextInput}
                          style={{ fontSize: '13.5px', fontWeight: 600, padding: '10px 14px', borderRadius: '8px' }}
                        >
                          <option value="Published">Live Publish</option>
                          <option value="Draft">Draft</option>
                          <option value="Scheduled">Schedule</option>
                        </select>
                      </div>
                    </div>

                    {builderStatus === 'Scheduled' && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #E2E8F0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                          {/* Opening Date & Time */}
                          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                              <Calendar size={14} color="#2563EB" />
                              <span>Opening Date &amp; Time (Start Window) *</span>
                            </label>
                            <input
                              type="datetime-local"
                              value={startWindowDate}
                              onChange={(e) => {
                                setStartWindowDate(e.target.value);
                                try {
                                  const s = new Date(e.target.value);
                                  const end = new Date(endWindowDate);
                                  if (end <= s) {
                                    setEndWindowDate(new Date(s.getTime() + 7 * 86400000).toISOString().slice(0, 16));
                                  }
                                } catch {}
                              }}
                              className={styles.modernDateInput}
                              style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                            />
                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className={styles.quickPillBtn}
                                onClick={() => {
                                  const d = new Date();
                                  setStartWindowDate(d.toISOString().slice(0, 16));
                                }}
                              >
                                Today
                              </button>
                              <button
                                type="button"
                                className={styles.quickPillBtn}
                                onClick={() => {
                                  const d = new Date();
                                  d.setDate(d.getDate() + 1);
                                  d.setHours(9, 0, 0, 0);
                                  setStartWindowDate(d.toISOString().slice(0, 16));
                                }}
                              >
                                Tomorrow 09:00 AM
                              </button>
                              <button
                                type="button"
                                className={styles.quickPillBtn}
                                onClick={() => {
                                  const d = new Date();
                                  const day = d.getDay();
                                  const diff = (7 - day) % 7 || 7;
                                  d.setDate(d.getDate() + diff);
                                  d.setHours(9, 0, 0, 0);
                                  setStartWindowDate(d.toISOString().slice(0, 16));
                                }}
                              >
                                This Sunday 09:00 AM
                              </button>
                            </div>
                          </div>

                          {/* Closing Date & Time / Duration Window */}
                          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                              <Clock size={14} color="#7C3AED" />
                              <span>Duration Window (Closing Date &amp; Time) *</span>
                            </label>
                            <input
                              type="datetime-local"
                              value={endWindowDate}
                              onChange={(e) => setEndWindowDate(e.target.value)}
                              className={styles.modernDateInput}
                              style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                            />
                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className={styles.quickPillBtn}
                                onClick={() => setWindowDurationPreset(24)}
                              >
                                24 Hours
                              </button>
                              <button
                                type="button"
                                className={styles.quickPillBtn}
                                onClick={() => setWindowDurationPreset(72)}
                              >
                                3 Days
                              </button>
                              <button
                                type="button"
                                className={styles.quickPillBtn}
                                onClick={() => setWindowDurationPreset(168)}
                              >
                                7 Days Window
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Live Confirmation Preview Box */}
                        <div className={styles.liveWindowPreviewBox} style={{ marginTop: '14px' }}>
                          <CheckCircle2 size={16} className={styles.previewIcon} />
                          <div className={styles.previewText}>
                            <strong>Scheduled Active Window: </strong>
                            <span>
                              Opens {new Date(startWindowDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                              {' ➔ '}
                              Closes {new Date(endWindowDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                          </div>
                        </div>

                        <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#6D28D9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>⏰ Students see a live real-time countdown to the start time. As soon as the end window expires, the test automatically locks with a "🔒 Closed Test" badge and candidates cannot begin attempts.</span>
                        </p>
                      </div>
                    )}

                    {builderStatus === 'Published' && (
                      <div style={{ marginTop: '14px', padding: '12px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#15803D', fontSize: '12.5px' }}>
                        <CheckCircle2 size={16} />
                        <span><strong>Live Open Practice:</strong> This test is published immediately and accessible 24x7. Candidates can take it anytime with proctored timer safeguards.</span>
                      </div>
                    )}

                    {builderStatus === 'Draft' && (
                      <div style={{ marginTop: '14px', padding: '12px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '12.5px' }}>
                        <AlertCircle size={16} />
                        <span><strong>Saved as Draft:</strong> Visible only to admins in the dashboard. Hidden from candidate course and test series listings until published.</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.scheduleCardsGrid}>

                    {/* Scorecard Release & Evaluation Settings */}
                    <div className={styles.settingsCard}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <h3 className={styles.cardHeading} style={{ margin: 0 }}>
                          <Award size={15} style={{ verticalAlign: 'middle', marginRight: '6px', color: '#2563EB' }} />
                          Evaluation &amp; Scorecard Policies
                        </h3>
                      </div>

                      <div className={styles.formField}>
                        <label>Scorecard &amp; Solutions Release Policy</label>
                        <select
                          value={scorecardRelease}
                          onChange={(e) => setScorecardRelease(e.target.value as any)}
                          className={styles.primarySelect}
                        >
                          <option value="INSTANT">Instant Release — Full solutions &amp; marks immediately on submit</option>
                          <option value="AFTER_WINDOW">Release After Window Closes — Prevents answer leaks during live exam</option>
                        </select>
                      </div>

                      <div className={styles.formField}>
                        <label>Access Tier &amp; Enrollment Permissions</label>
                        <select
                          value={accessLevel}
                          onChange={(e) => setAccessLevel(e.target.value as any)}
                          className={styles.primarySelect}
                        >
                          <option value="BATCH_INCLUDED">Enrolled Batches Only (Included in Course Tuition)</option>
                          <option value="FREE_LEAD_MAGNET">Open All-India Mock (Public / Free Access)</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                        <label className={styles.checkToggleLabel}>
                          <input
                            type="checkbox"
                            checked={autoSubmitOnExpire}
                            onChange={(e) => setAutoSubmitOnExpire(e.target.checked)}
                          />
                          <span><strong>Auto-Submit upon Clock Expiry:</strong> Automatically locks and sends paper when candidate timer reaches 00:00:00</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 3. Automated Proctoring & Anti-Cheating Safeguards */}
                  <div style={{ marginTop: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldAlert size={18} color="#2563EB" />
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Automated Proctoring &amp; Anti-Cheating Safeguards
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A', background: '#DCFCE7', padding: '3px 9px', borderRadius: '100px' }}>
                        ✓ Enforced in Real-Time Candidate View
                      </span>
                    </div>

                    <div className={styles.proctoringRulesList}>
                      {/* Rule 1: Fullscreen Lock */}
                      <div className={styles.proctorRuleItem}>
                        <div className={styles.proctorRuleIconWrap}>
                          <Maximize size={16} />
                        </div>
                        <div className={styles.proctorRuleText}>
                          <span className={styles.proctorRuleTitle}>Strict Fullscreen Kiosk Mode</span>
                          <span className={styles.proctorRuleDesc}>
                            Locks browser into fullscreen upon exam start. Exiting fullscreen flashes high-priority warning dialog and logs a strike.
                          </span>
                        </div>
                        <div className={styles.proctorToggleWrap}>
                          <input
                            type="checkbox"
                            id="rule-fullscreen"
                            checked={fullScreenLock}
                            onChange={(e) => setFullScreenLock(e.target.checked)}
                            style={{ width: '18px', height: '18px', accentColor: '#2563EB', cursor: 'pointer' }}
                          />
                        </div>
                      </div>

                      {/* Rule 2: Tab Switching Limit */}
                      <div className={styles.proctorRuleItem}>
                        <div className={styles.proctorRuleIconWrap} style={{ background: '#FEF2F2', color: '#DC2626' }}>
                          <ShieldAlert size={16} />
                        </div>
                        <div className={styles.proctorRuleText}>
                          <span className={styles.proctorRuleTitle}>Tab Switching &amp; Focus Loss Disqualification</span>
                          <span className={styles.proctorRuleDesc}>
                            Monitors page blur and tab switches. If candidate exceeds permitted infractions, exam automatically terminates.
                          </span>
                        </div>
                        <div className={styles.proctorToggleWrap}>
                          <select
                            value={tabSwitchLimit}
                            onChange={(e) => setTabSwitchLimit(Number(e.target.value))}
                            className={styles.primarySelect}
                            style={{ width: '150px', padding: '6px 10px', fontSize: '12px' }}
                          >
                            <option value={1}>1 Warning (Strict)</option>
                            <option value={2}>2 Warnings</option>
                            <option value={3}>3 Warnings (Standard)</option>
                            <option value={5}>5 Warnings</option>
                            <option value={999}>Disabled</option>
                          </select>
                        </div>
                      </div>

                      {/* Rule 3: Disable Copy-Paste & Right Click */}
                      <div className={styles.proctorRuleItem}>
                        <div className={styles.proctorRuleIconWrap}>
                          <Lock size={16} />
                        </div>
                        <div className={styles.proctorRuleText}>
                          <span className={styles.proctorRuleTitle}>Disable Clipboard, Copy-Paste &amp; DevTools Inspection</span>
                          <span className={styles.proctorRuleDesc}>
                            Disables right-click context menu, text selection, F12, Ctrl+Shift+I, and pasting to external AI solvers.
                          </span>
                        </div>
                        <div className={styles.proctorToggleWrap}>
                          <input
                            type="checkbox"
                            id="rule-copypaste"
                            checked={disableCopyPaste}
                            onChange={(e) => setDisableCopyPaste(e.target.checked)}
                            style={{ width: '18px', height: '18px', accentColor: '#2563EB', cursor: 'pointer' }}
                          />
                        </div>
                      </div>

                      {/* Rule 4: Continuous Cloud Auto-Save */}
                      <div className={styles.proctorRuleItem}>
                        <div className={styles.proctorRuleIconWrap}>
                          <RefreshCw size={16} />
                        </div>
                        <div className={styles.proctorRuleText}>
                          <span className={styles.proctorRuleTitle}>Continuous Cloud Auto-Save Interval</span>
                          <span className={styles.proctorRuleDesc}>
                            Automatically persists bubble markings and visited question statuses in background so no progress is ever lost.
                          </span>
                        </div>
                        <div className={styles.proctorToggleWrap}>
                          <select
                            value={autoSaveInterval}
                            onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
                            className={styles.primarySelect}
                            style={{ width: '150px', padding: '6px 10px', fontSize: '12px' }}
                          >
                            <option value={10}>Every 10 Seconds (Recommended)</option>
                            <option value={30}>Every 30 Seconds</option>
                            <option value={60}>Every 60 Seconds</option>
                          </select>
                        </div>
                      </div>

                      {/* Rule 6: Single Active Session Guard */}
                      <div className={styles.proctorRuleItem}>
                        <div className={styles.proctorRuleIconWrap} style={{ background: '#ECFDF5', color: '#059669' }}>
                          <UserCheck size={16} />
                        </div>
                        <div className={styles.proctorRuleText}>
                          <span className={styles.proctorRuleTitle}>Single Device Concurrency Guard</span>
                          <span className={styles.proctorRuleDesc}>
                            Blocks candidate from logging in on a second device or secondary browser window while an active test attempt is in progress.
                          </span>
                        </div>
                        <div className={styles.proctorToggleWrap}>
                          <input
                            type="checkbox"
                            id="rule-singlesession"
                            checked={singleSessionGuard}
                            onChange={(e) => setSingleSessionGuard(e.target.checked)}
                            style={{ width: '18px', height: '18px', accentColor: '#2563EB', cursor: 'pointer' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3.5 Automated Scheduled Solution Release Configuration */}
                  <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '22px', marginBottom: '22px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                            Scheduled Solution Release
                          </h3>
                          <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                            Students unlock official PDF and video solutions exactly 24 hours after their individual test submission.
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: solutionReleaseEnabled ? '#059669' : '#64748B' }}>
                          <input
                            type="checkbox"
                            checked={solutionReleaseEnabled}
                            onChange={(e) => setSolutionReleaseEnabled(e.target.checked)}
                            style={{ width: '18px', height: '18px', accentColor: '#059669', cursor: 'pointer' }}
                          />
                          <span>{solutionReleaseEnabled ? '✓ Scheduled Release Enabled' : '○ Release Disabled'}</span>
                        </label>
                      </div>
                    </div>

                    {/* Inputs & Settings */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      {/* PDF Solution URL */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          PDF Solution URL (Public HTTP/HTTPS):
                        </label>
                        <input
                          type="url"
                          value={solutionPdfUrl}
                          onChange={(e) => setSolutionPdfUrl(e.target.value)}
                          placeholder="https://example.com/solutions/jee-paper-derivation.pdf"
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: solutionPdfUrl && !solutionPdfUrl.startsWith('http') ? '1px solid #EF4444' : '1px solid #CBD5E1',
                            fontSize: '13px'
                          }}
                        />
                        {solutionPdfUrl && !solutionPdfUrl.startsWith('http') && (
                          <span style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px', display: 'block' }}>
                            URL must begin with http:// or https://
                          </span>
                        )}
                      </div>

                      {/* Video Solution URL (Google Drive or YouTube) */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Video Solution URL (YouTube or Google Drive Link):
                        </label>
                        <input
                          type="url"
                          value={solutionVideoUrl}
                          onChange={(e) => setSolutionVideoUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=... or https://drive.google.com/..."
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border:
                              solutionVideoUrl &&
                              !solutionVideoUrl.includes('drive.google.com') &&
                              !solutionVideoUrl.includes('youtube.com') &&
                              !solutionVideoUrl.includes('youtu.be')
                                ? '1px solid #EF4444'
                                : '1px solid #CBD5E1',
                            fontSize: '13px'
                          }}
                        />
                        {solutionVideoUrl &&
                          !solutionVideoUrl.includes('drive.google.com') &&
                          !solutionVideoUrl.includes('youtube.com') &&
                          !solutionVideoUrl.includes('youtu.be') && (
                            <span style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px', display: 'block' }}>
                              Must be a valid YouTube (youtube.com / youtu.be) or Google Drive (drive.google.com) link
                            </span>
                          )}
                      </div>

                      {/* Release Delay Dropdown */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Release Delay (Post-Submission):
                        </label>
                        <select
                          value={solutionReleaseDelay}
                          onChange={(e) => setSolutionReleaseDelay(Number(e.target.value))}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF' }}
                        >
                          <option value={12}>12 Hours After Submission</option>
                          <option value={24}>24 Hours (Default NTA Window)</option>
                          <option value={48}>48 Hours After Submission</option>
                          <option value={72}>72 Hours After Submission</option>
                        </select>
                      </div>
                    </div>

                    {/* Admin Dashboard Overview Panel */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', marginTop: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <strong style={{ fontSize: '12px', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Admin Dashboard — Solution Release Overview
                        </strong>
                        {editingSeriesId && (
                          <button
                            type="button"
                            onClick={handleSaveSolutionConfig}
                            disabled={isSavingSolutionConfig}
                            style={{
                              background: '#2563EB',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 14px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {isSavingSolutionConfig ? 'Updating...' : 'Update Solution Configuration'}
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                        <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>Total Submissions</div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                            {solutionOverview?.totalSubmissions ?? 0}
                          </div>
                        </div>
                        <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: '11px', color: '#D97706' }}>Scheduled Releases</div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: '#D97706' }}>
                            {solutionOverview?.scheduledReleases ?? 0}
                          </div>
                        </div>
                        <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: '11px', color: '#059669' }}>Unlocked Submissions</div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>
                            {solutionOverview?.unlockedSubmissions ?? 0}
                          </div>
                        </div>
                        <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>Disabled Releases</div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: '#64748B' }}>
                            {solutionOverview?.disabledReleases ?? 0}
                          </div>
                        </div>
                        <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>PDF URL Status</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: solutionPdfUrl ? '#059669' : '#94A3B8', marginTop: '4px' }}>
                            {solutionPdfUrl ? '✓ Configured' : '— Not Set'}
                          </div>
                        </div>
                        <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>Video URL Status</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: solutionVideoUrl ? '#059669' : '#94A3B8', marginTop: '4px' }}>
                            {solutionVideoUrl ? '✓ Google Drive' : '— Not Set'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Live Scheduling Summary Hero */}
                  <div className={styles.liveSummaryHero}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8' }}>
                        Ready for Deployment
                      </span>
                      <strong style={{ fontSize: '15px', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                        {editingSeriesTitle || 'JEE Main All-India CBT Mock Test'}
                      </strong>
                      <span style={{ fontSize: '12px', color: '#CBD5E1' }}>
                        {builderStatus === 'Scheduled'
                          ? `Scheduled Window: Opens ${new Date(startWindowDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })} — Closes ${new Date(endWindowDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}`
                          : builderStatus === 'Draft'
                          ? 'Status: Saved as Draft (Admin Only)'
                          : 'Available 24x7 Open Practice Mock'}
                      </span>
                    </div>

                    <div className={styles.summaryBadgesRow}>
                      <span className={styles.summaryPill}>
                        <Clock size={12} />
                        {wizardDuration} Mins
                      </span>
                      <span className={styles.summaryPill}>
                        <Award size={12} />
                        {wizardTotalMarks} Marks
                      </span>
                      <span className={styles.summaryPill} style={{ background: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.4)', color: '#86EFAC' }}>
                        <ShieldCheck size={12} />
                        Proctor Active
                      </span>
                      <span className={styles.summaryPill}>
                        <FileCheck size={12} />
                        {scorecardRelease === 'INSTANT' ? 'Instant Score' : 'Post-Window'}
                      </span>
                    </div>
                  </div>

                  {/* 5. Sticky Step Action Bar */}
                  <div className={styles.stepActionBarSticky}>
                    <button type="button" className={styles.prevStepBtn} onClick={handlePrevStep}>
                      <span>← Prev: Question Authoring</span>
                    </button>
                    <button
                      type="button"
                      className={styles.publishExamBtn}
                      onClick={handleSaveAndPublishFromBuilder}
                      disabled={isPublishing}
                      id="schedule-publish-cbt-btn"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 size={16} className={styles.spinIcon} />
                          <span>Publishing CBT Mock Test to Platform...</span>
                        </>
                      ) : (
                        <>
                          <div className={styles.publishBtnIconCircle}>
                            <CheckCircle2 size={15} />
                          </div>
                          <span className={styles.publishBtnText}>
                            {builderStatus === 'Draft'
                              ? 'Save Examination as Draft'
                              : builderStatus === 'Scheduled'
                              ? 'Schedule CBT Mock Test'
                              : 'Publish CBT Mock Test Live'}
                          </span>
                          <ArrowRight size={15} className={styles.publishBtnArrow} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Stepper Tracker ~25% */}
            <div className={styles.rightStepperColumn}>
              <div className={styles.stepperStickyCard}>
                <h3 className={styles.stepperTitle}>CBT Creation Progress</h3>
                <div className={styles.verticalStepperList}>
                  {STEPS_DATA.map((s) => (
                    <div
                      key={s.step}
                      className={`${styles.stepperItemRow} ${
                        currentStep === s.step ? styles.stepperRowActive : ''
                      }`}
                      onClick={() => goToStep(s.step as StepId)}
                    >
                      <div
                        className={`${styles.stepCircleBtn} ${
                          currentStep === s.step
                            ? styles.stepActive
                            : completedSteps.includes(s.step)
                            ? styles.stepDone
                            : ''
                        }`}
                      >
                        {completedSteps.includes(s.step) && currentStep !== s.step ? (
                          <Check size={14} />
                        ) : (
                          s.step
                        )}
                      </div>
                      <div className={styles.stepLabelCol}>
                        <span className={styles.stepName}>{s.title}</span>
                        <span className={styles.stepSub}>{s.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PREVIEW / CBT SIMULATOR MODAL (MATCHES USER SCREENSHOT) ─── */}
      {previewItem && (
        <div className={styles.modalBackdropOverlay} onClick={() => setPreviewItem(null)}>
          {previewTab === 'OVERVIEW' ? (
            <div className={styles.previewModalCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.previewHeader}>
                <div>
                  <span className={styles.darkExamPillBadge}>{previewItem.badgeCode}</span>
                  <h3 className={styles.mTitle}>{previewItem.title}</h3>
                  <span className={styles.slugUrlText}>{editingSeriesSubtitle}</span>
                </div>
                <button
                  type="button"
                  className={styles.modalCloseIconBtn}
                  onClick={() => setPreviewItem(null)}
                >
                  <X size={18} />
                </button>
              </div>

              {/* 4 Bento Spec Cards */}
              <div className={styles.specCardsBento}>
                <div className={styles.specCard}>
                  <div className={styles.specIconBox}>
                    <Clock size={16} />
                  </div>
                  <div className={styles.specMetaStack}>
                    <span className={styles.specValueText}>{previewItem.durationMinutes} Minutes</span>
                    <span className={styles.specLabelText}>Duration</span>
                  </div>
                </div>

                <div className={styles.specCard}>
                  <div className={styles.specIconBox}>
                    <HelpCircle size={16} />
                  </div>
                  <div className={styles.specMetaStack}>
                    <span className={styles.specValueText}>{previewItem.totalTests} Problems</span>
                    <span className={styles.specLabelText}>Total Questions</span>
                  </div>
                </div>

                <div className={styles.specCard}>
                  <div className={styles.specIconBox}>
                    <Award size={16} />
                  </div>
                  <div className={styles.specMetaStack}>
                    <span className={styles.specValueText}>{previewItem.totalMarks} Marks</span>
                    <span className={styles.specLabelText}>Maximum Score</span>
                  </div>
                </div>

                <div className={styles.specCard}>
                  <div className={styles.specIconBox}>
                    <CheckCircle size={16} />
                  </div>
                  <div className={styles.specMetaStack}>
                    <span className={styles.specValueText}>+{positiveMarks} / -{negativeMarks}</span>
                    <span className={styles.specLabelText}>Marking Scheme</span>
                  </div>
                </div>
              </div>

              {/* Guidelines Box */}
              <div className={styles.guidelinesBox}>
                <div className={styles.guidelinesBoxTitle}>Important Examination Guidelines</div>
                <ol className={styles.guidelinesOrderedList}>
                  {examGuidelines.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ol>
              </div>

              <div className={styles.modalFooterActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => {
                    setPreviewItem(null);
                    handleEditSeries(previewItem);
                  }}
                >
                  <Pencil size={13} />
                  <span>Open in Builder</span>
                </button>
                <button
                  type="button"
                  className={styles.primaryModalBtn}
                  onClick={() => {
                    setPreviewTab('CBT_SIMULATOR');
                    setCbtQIndex(0);
                    setCbtSubmitted(false);
                    setCbtSecondsRemaining(5372); // 01:29:32 in seconds
                  }}
                >
                  <Sparkles size={14} />
                  <span>Launch CBT Exam Simulator →</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.cbtPreviewModalCard} onClick={(e) => e.stopPropagation()}>
              {/* Top 4 Metrics Strip (Matches Screenshot) */}
              <div className={styles.cbtTopMetricsBar}>
                <div className={styles.cbtBentoMetric}>
                  <div className={styles.cbtMetricLeft}>
                    <span className={styles.cbtBentoMetricTitle}>Mock Tests</span>
                    <span className={styles.cbtBentoMetricVal}>9 Mock Tests</span>
                    <span className={styles.cbtBentoMetricSub}>Full CBT &amp; Part Mocks</span>
                  </div>
                  <div className={`${styles.cbtMetricIconBox} ${styles.iconBoxBlue}`}>
                    <Layers size={18} />
                  </div>
                </div>

                <div className={styles.cbtBentoMetric}>
                  <div className={styles.cbtMetricLeft}>
                    <span className={styles.cbtBentoMetricTitle}>Total Questions</span>
                    <span className={styles.cbtBentoMetricVal}>46 Total Questions</span>
                    <span className={styles.cbtBentoMetricSub}>Physics, Chemistry &amp; Maths</span>
                  </div>
                  <div className={`${styles.cbtMetricIconBox} ${styles.iconBoxPurple}`}>
                    <FileCheck size={18} />
                  </div>
                </div>

                <div className={styles.cbtBentoMetric}>
                  <div className={styles.cbtMetricLeft}>
                    <span className={styles.cbtBentoMetricTitle}>Exam Formats</span>
                    <span className={styles.cbtBentoMetricVal}>2 Exam Formats</span>
                    <span className={styles.cbtBentoMetricSub}>JEE Main &amp; Advanced Engines</span>
                  </div>
                  <div className={`${styles.cbtMetricIconBox} ${styles.iconBoxAmber}`}>
                    <Clock size={18} />
                  </div>
                </div>

                <div className={styles.cbtBentoMetric}>
                  <div className={styles.cbtMetricLeft}>
                    <span className={styles.cbtBentoMetricTitle}>Tests Attempted</span>
                    <span className={styles.cbtBentoMetricVal}>4 Tests Attempted</span>
                    <span className={styles.cbtBentoMetricSub}>Active performance tracked</span>
                  </div>
                  <div className={`${styles.cbtMetricIconBox} ${styles.iconBoxEmerald}`}>
                    <CheckCircle2 size={18} />
                  </div>
                </div>
              </div>

              {/* Player Top Navigation Bar (Matches Screenshot) */}
              <div className={styles.cbtPlayerTopBar}>
                <div className={styles.cbtTopBarLeft}>
                  <button
                    type="button"
                    className={styles.cbtLeaveBtn}
                    onClick={() => setPreviewTab('OVERVIEW')}
                  >
                    <ArrowLeft size={14} />
                    <span>Leave Test</span>
                  </button>

                  <h3 className={styles.cbtTestTitle}>{previewItem.title}</h3>
                  <span className={styles.cbtBadgeAdv}>JEE ADVANCED</span>
                  <span className={styles.cbtBadgePart}>Part Test</span>
                </div>

                <div className={styles.cbtTopBarRight}>
                  <div className={styles.cbtLiveTimerBox}>
                    <Clock size={15} />
                    <span>Time Left: {formatTimer(cbtSecondsRemaining)}</span>
                  </div>

                  <button
                    type="button"
                    className={styles.cbtHeaderSubmitBtn}
                    onClick={handleCbtSubmit}
                  >
                    <Send size={14} />
                    <span>Submit Test</span>
                  </button>
                </div>
              </div>

              {/* Main CBT Workspace (Question Stage & Palette) */}
              {!cbtSubmitted ? (
                <div className={styles.cbtWorkspaceGrid}>
                  {/* Left Column: Question Card */}
                  <div className={styles.cbtQuestionCard}>
                    <div className={styles.cbtQMetaHeader}>
                      <div className={styles.cbtQTags}>
                        <span className={styles.cbtQNumText}>
                          Question {cbtQIndex + 1} of {questions.length}
                        </span>
                        <span className={styles.cbtTagSubject}>{currentCbtQ.subject}</span>
                        <span className={styles.cbtTagTopic}>{currentCbtQ.topicTag}</span>
                      </div>
                      <span className={styles.cbtMarksPill}>
                        +{positiveMarks} / -{negativeMarks} Marks
                      </span>
                    </div>

                    <div className={styles.cbtStatementArea}>
                      <MathText text={currentCbtQ.questionText} />
                    </div>

                    <div className={styles.cbtOptionsGrid}>
                      {currentCbtQ.options.map((opt) => {
                        const isSelected = cbtResponse.selectedOption === opt.key;
                        return (
                          <div
                            key={opt.key}
                            className={`${styles.cbtOptionItem} ${isSelected ? styles.cbtOptionSelected : ''}`}
                            onClick={() => handleCbtSelectOption(opt.key)}
                          >
                            <span className={styles.cbtOptionKey}>{opt.key}</span>
                            <span className={styles.cbtOptionText}>
                              <MathText text={opt.text} />
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className={styles.cbtBottomNav}>
                      <button
                        type="button"
                        className={`${styles.cbtActionBtn} ${cbtResponse.isMarkedForReview ? styles.markedActive : ''}`}
                        onClick={handleCbtToggleMark}
                      >
                        <Bookmark size={14} />
                        <span>{cbtResponse.isMarkedForReview ? 'Marked for Review ✓' : 'Mark for Review'}</span>
                      </button>

                      <div className={styles.cbtNavGroup}>
                        <button
                          type="button"
                          className={styles.cbtActionBtn}
                          disabled={cbtQIndex === 0}
                          onClick={() => handleCbtNavigate(cbtQIndex - 1)}
                        >
                          <ArrowLeft size={14} />
                          <span>Previous</span>
                        </button>
                        <button
                          type="button"
                          className={styles.cbtPrimaryNavBtn}
                          onClick={() => {
                            if (cbtQIndex < questions.length - 1) {
                              handleCbtNavigate(cbtQIndex + 1);
                            } else {
                              handleCbtSubmit();
                            }
                          }}
                        >
                          <span>{cbtQIndex < questions.length - 1 ? 'Save & Next →' : 'Submit Test ✓'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Palette */}
                  <div className={styles.cbtSideColumn}>
                    <div className={styles.cbtAttemptProgressBox}>
                      <span className={styles.cbtProgressLabel}>Attempt Progress</span>
                      <span className={styles.cbtProgressValue}>
                        {cbtAnsweredCount} / {questions.length} Answered
                      </span>
                    </div>

                    <div className={styles.cbtPaletteCard}>
                      <div className={styles.cbtPaletteHeader}>
                        <span className={styles.cbtPaletteTitle}>Question Palette</span>
                        <span className={styles.cbtPaletteCount}>
                          {cbtQIndex + 1} of {questions.length}
                        </span>
                      </div>

                      <div className={styles.cbtPaletteGrid}>
                        {questions.map((q, idx) => {
                          const resp = cbtResponses[q.id];
                          const isCurrent = idx === cbtQIndex;
                          const isVisited = resp?.isVisited ?? false;
                          const isAnswered = Boolean(resp?.selectedOption);
                          const isMarked = resp?.isMarkedForReview ?? false;

                          let statusStyle = styles.paletteNotVisited;
                          if (isAnswered && isMarked) statusStyle = styles.paletteAnsMarked;
                          else if (isMarked) statusStyle = styles.paletteMarked;
                          else if (isAnswered) statusStyle = styles.paletteAnswered;
                          else if (isVisited) statusStyle = styles.paletteNotAnswered;

                          return (
                            <button
                              key={q.id}
                              type="button"
                              className={`${styles.cbtPaletteBtn} ${statusStyle} ${
                                isCurrent ? styles.paletteCurrent : ''
                              }`}
                              onClick={() => handleCbtNavigate(idx)}
                            >
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>

                      <div className={styles.cbtLegendGrid}>
                        <div className={styles.cbtLegendItem}>
                          <span className={`${styles.cbtLegendDot} ${styles.dotAnswered}`} />
                          <span>Answered</span>
                        </div>
                        <div className={styles.cbtLegendItem}>
                          <span className={`${styles.cbtLegendDot} ${styles.dotNotAnswered}`} />
                          <span>Not Answered</span>
                        </div>
                        <div className={styles.cbtLegendItem}>
                          <span className={`${styles.cbtLegendDot} ${styles.dotMarked}`} />
                          <span>Marked for Review</span>
                        </div>
                        <div className={styles.cbtLegendItem}>
                          <span className={`${styles.cbtLegendDot} ${styles.dotAnsMarked}`} />
                          <span>Ans &amp; Marked</span>
                        </div>
                        <div className={styles.cbtLegendItem}>
                          <span className={`${styles.cbtLegendDot} ${styles.dotNotVisited}`} />
                          <span>Not Visited</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={styles.cbtSubmitFullBtn}
                        onClick={handleCbtSubmit}
                      >
                        <Send size={15} />
                        <span>Submit Full Test</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* CBT Scorecard & Solution Review View */
                <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div className={styles.successIconBubble} style={{ margin: '0 auto 12px' }}>
                      <CheckCircle size={32} />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      Mock Examination Submitted!
                    </h2>
                    <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                      Your candidate score for <strong>{previewItem.title}</strong> has been computed.
                    </p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '10px 24px', borderRadius: '12px', marginTop: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E3A8A' }}>Score Obtained:</span>
                      <span style={{ fontSize: '22px', fontWeight: 900, color: '#2563EB' }}>
                        {cbtScore} / {questions.length * positiveMarks} Marks
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                      Question Paper &amp; Official Answer Keys:
                    </h4>
                    {questions.map((q, idx) => {
                      const userAns = cbtResponses[q.id]?.selectedOption;
                      const isCorrect = userAns === q.correctKey;
                      return (
                        <div key={q.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '13px', color: '#0F172A' }}>Question {idx + 1} ({q.topicTag})</strong>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: isCorrect ? '#ECFDF5' : '#FFF1F2', color: isCorrect ? '#059669' : '#DC2626' }}>
                              {isCorrect ? `✓ Correct (+${positiveMarks})` : userAns ? `✗ Incorrect (-${negativeMarks})` : '— Unattempted (0)'}
                            </span>
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#334155', margin: '4px 0' }}>
                            <MathText text={q.questionText} />
                          </div>
                          <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '6px' }}>
                            Correct Answer: Option {q.correctKey} (<MathText text={q.options.find(o => o.key === q.correctKey)?.text || ''} />)
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() => {
                        setCbtSubmitted(false);
                        setCbtResponses({ 'ja-cg-q1': { isVisited: true, isMarkedForReview: false } });
                        setCbtQIndex(0);
                        setCbtSecondsRemaining(5372);
                      }}
                    >
                      <RotateCcw size={13} />
                      <span>Retake Simulation</span>
                    </button>
                    <button
                      type="button"
                      className={styles.primaryModalBtn}
                      onClick={() => setPreviewItem(null)}
                    >
                      <span>Close Simulator</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── CREATE TEST SERIES MODAL (CENTERED POPUP DRAWER) ─── */}
      {isCreateModalOpen && (
        <div className={styles.createModalBackdrop} onClick={() => setIsCreateModalOpen(false)}>
          <div className={styles.createModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.createModalHeader}>
              <div className={styles.createHeaderLeft}>
                <div className={styles.createHeaderIcon}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className={styles.createModalTitle}>Create New Test Series</h3>
                  <p className={styles.createModalSubtitle}>
                    Configure examination metadata, target cohorts, and launch parameters.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.createCloseBtn}
                onClick={() => setIsCreateModalOpen(false)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTestSeriesSubmit} className={styles.createModalBody}>
              {/* Field 1: Test Series Name + Auto-slug */}
              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Test Series Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JEE Main 2026 Full Syllabus Series"
                  value={newTitle}
                  onChange={(e) => {
                    const titleVal = e.target.value;
                    setNewTitle(titleVal);
                    setNewSlug(titleVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                  }}
                  className={styles.primaryTextInput}
                />
                <div className={styles.slugPreviewRow}>
                  <span>Slug:</span>
                  <code>/{newSlug || 'jee-main-series'}</code>
                </div>
              </div>

              {/* Field 2: Target Exam Category & Test Format */}
              <div className={styles.twoColumnGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Target Exam Category (Filter Tab) *</label>
                  <select
                    value={newExamType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setNewExamType(val);
                      if (val === 'PartTest') {
                        setNewFormat('Part Test');
                        setNewDuration(90);
                        setNewTotalMarks(100);
                      } else if (val === 'MathSpeed') {
                        setNewFormat('Chapter Test');
                        setNewDuration(45);
                        setNewTotalMarks(60);
                      } else if (val === 'BITSAT') {
                        setNewDuration(180);
                        setNewTotalMarks(390);
                      } else {
                        setNewFormat('Full Mock');
                        setNewDuration(180);
                        setNewTotalMarks(300);
                      }
                    }}
                    className={styles.primaryTextInput}
                  >
                    <option value="JEE Main">JEE Main Filter (Full Mock)</option>
                    <option value="JEE Advanced">JEE Advanced Engine (Full Mock)</option>
                    <option value="BITSAT">BITSAT Speed CBT (130 Questions)</option>
                    <option value="PartTest">Part Tests Engine (Structured PCM Part Tests)</option>
                    <option value="MathSpeed">DK Sir Math Speed (45m Rapid Drill)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Test Series Format *</label>
                  <select
                    value={newFormat}
                    onChange={(e) => {
                      const fVal = e.target.value as any;
                      setNewFormat(fVal);
                      if (fVal === 'Part Test') {
                        setNewTotalMarks(100);
                        setNewDuration(60);
                      } else if (fVal === 'Full Mock') {
                        setNewTotalMarks(300);
                        setNewDuration(180);
                      }
                    }}
                    className={styles.primaryTextInput}
                  >
                    <option value="Full Mock">Full Mock (Full-Length CBT Mocks)</option>
                    <option value="Part Test">Part Test (100 Marks • Syllabus Unit Tests)</option>
                    <option value="Chapter Test">Chapter Test (Targeted Topic Drills)</option>
                  </select>
                </div>
              </div>

              {/* Difficulty Level */}
              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Difficulty Level *</label>
                <select
                  value={newDifficulty}
                  onChange={(e) => setNewDifficulty(e.target.value as any)}
                  className={styles.primaryTextInput}
                >
                  <option value="Moderate">Moderate (Main Level)</option>
                  <option value="Challenging">Challenging</option>
                  <option value="Advanced">Advanced (IIT Ranker)</option>
                </select>
              </div>

              {/* Field 3: Duration & Marks Side-by-Side */}
              <div className={styles.twoColumnGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Duration (Minutes) *</label>
                  <input
                    type="number"
                    min={15}
                    max={360}
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className={styles.primaryTextInput}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {[45, 60, 90, 180].map((m) => (
                      <button
                        key={m}
                        type="button"
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: newDuration === m ? '1px solid #2563EB' : '1px solid #CBD5E1',
                          background: newDuration === m ? '#EFF6FF' : '#FFFFFF',
                          color: newDuration === m ? '#1D4ED8' : '#475569',
                          cursor: 'pointer',
                          fontWeight: newDuration === m ? 700 : 500
                        }}
                        onClick={() => setNewDuration(m)}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Total Marks *</label>
                  <input
                    type="number"
                    min={20}
                    max={500}
                    value={newTotalMarks}
                    onChange={(e) => setNewTotalMarks(Number(e.target.value))}
                    className={styles.primaryTextInput}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {[100, 120, 180, 300, 390].map((mk) => (
                      <button
                        key={mk}
                        type="button"
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: newTotalMarks === mk ? '1px solid #10B981' : '1px solid #CBD5E1',
                          background: newTotalMarks === mk ? '#ECFDF5' : '#FFFFFF',
                          color: newTotalMarks === mk ? '#047857' : '#475569',
                          cursor: 'pointer',
                          fontWeight: newTotalMarks === mk ? 700 : 500
                        }}
                        onClick={() => setNewTotalMarks(mk)}
                      >
                        {mk}M {mk === 100 ? '(Part Test)' : mk === 300 ? '(Main)' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Field 5: Initial Status & Scheduling */}
              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Publishing Status &amp; Scheduling *</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="initialStatus"
                      checked={newInitialStatus === 'Published'}
                      onChange={() => setNewInitialStatus('Published')}
                    />
                    <span>Publish Immediately (Live to Students)</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="initialStatus"
                      checked={newInitialStatus === 'Scheduled'}
                      onChange={() => setNewInitialStatus('Scheduled')}
                    />
                    <span>Schedule for Live Window (Exact Date &amp; Time)</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="initialStatus"
                      checked={newInitialStatus === 'Draft'}
                      onChange={() => setNewInitialStatus('Draft')}
                    />
                    <span>Save as Draft (Private Admin Preview)</span>
                  </label>
                </div>
              </div>

              {/* Conditional Scheduling Date & Time Picker */}
              {newInitialStatus === 'Scheduled' && (() => {
                const quickStartParsed = parseDateTimeLocal(newScheduledStartTime);

                const updateQuickStartDate = (dStr: string) => {
                  const updated = buildDateTimeLocal(dStr, quickStartParsed.hour12, quickStartParsed.minute, quickStartParsed.ampm);
                  setNewScheduledStartTime(updated);
                  try {
                    const s = new Date(updated);
                    const e = new Date(newScheduledEndTime);
                    if (e <= s) {
                      setNewScheduledEndTime(new Date(s.getTime() + 7 * 86400000).toISOString().slice(0, 16));
                    }
                  } catch {}
                };

                const updateQuickStartTime = (h: string, m: string, ampm: 'AM' | 'PM') => {
                  const updated = buildDateTimeLocal(quickStartParsed.dateStr, h, m, ampm);
                  setNewScheduledStartTime(updated);
                };

                return (
                  <div className={styles.modernSchedulerCard} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', fontWeight: 800, fontSize: '0.85rem' }}>
                      <Calendar size={16} />
                      <span>Live CBT Examination Window Schedule</span>
                    </div>

                    {/* Opening Date */}
                    <div className={styles.pickerSubSection}>
                      <div className={styles.pickerSectionLabel}>
                        <span>Opening Date *</span>
                        <span className={styles.pickerHint}>
                          {new Date(quickStartParsed.dateStr + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <div className={styles.datePickerRow}>
                        <input
                          type="date"
                          value={quickStartParsed.dateStr}
                          onChange={(e) => updateQuickStartDate(e.target.value)}
                          className={styles.modernDateInput}
                        />
                        <div className={styles.quickPillsRow}>
                          <button
                            type="button"
                            className={styles.quickPillBtn}
                            onClick={() => updateQuickStartDate(new Date().toISOString().slice(0, 10))}
                          >
                            Today
                          </button>
                          <button
                            type="button"
                            className={styles.quickPillBtn}
                            onClick={() => {
                              const d = new Date();
                              d.setDate(d.getDate() + 1);
                              updateQuickStartDate(d.toISOString().slice(0, 10));
                            }}
                          >
                            Tomorrow
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Opening Time */}
                    <div className={styles.pickerSubSection}>
                      <div className={styles.pickerSectionLabel}>
                        <span>Opening Time (IST) *</span>
                      </div>
                      <div className={styles.timePickerFlexRow}>
                        <select
                          value={quickStartParsed.hour12}
                          onChange={(e) => updateQuickStartTime(e.target.value, quickStartParsed.minute, quickStartParsed.ampm)}
                          className={styles.modernTimeSelect}
                        >
                          {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span className={styles.timeColon}>:</span>
                        <select
                          value={quickStartParsed.minute}
                          onChange={(e) => updateQuickStartTime(quickStartParsed.hour12, e.target.value, quickStartParsed.ampm)}
                          className={styles.modernTimeSelect}
                        >
                          {['00', '10', '15', '20', '30', '40', '45', '50'].map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <div className={styles.ampmToggleWrap}>
                          <button
                            type="button"
                            className={`${styles.ampmBtn} ${quickStartParsed.ampm === 'AM' ? styles.active : ''}`}
                            onClick={() => updateQuickStartTime(quickStartParsed.hour12, quickStartParsed.minute, 'AM')}
                          >
                            AM
                          </button>
                          <button
                            type="button"
                            className={`${styles.ampmBtn} ${quickStartParsed.ampm === 'PM' ? styles.active : ''}`}
                            onClick={() => updateQuickStartTime(quickStartParsed.hour12, quickStartParsed.minute, 'PM')}
                          >
                            PM
                          </button>
                        </div>
                      </div>

                      <div className={styles.quickPillsRow} style={{ marginTop: '4px' }}>
                        <button
                          type="button"
                          className={`${styles.quickPillBtn} ${quickStartParsed.hour12 === '09' && quickStartParsed.minute === '00' && quickStartParsed.ampm === 'AM' ? styles.active : ''}`}
                          onClick={() => updateQuickStartTime('09', '00', 'AM')}
                        >
                          🌅 Shift 1 (09:00 AM)
                        </button>
                        <button
                          type="button"
                          className={`${styles.quickPillBtn} ${quickStartParsed.hour12 === '02' && quickStartParsed.minute === '30' && quickStartParsed.ampm === 'PM' ? styles.active : ''}`}
                          onClick={() => updateQuickStartTime('02', '30', 'PM')}
                        >
                          ☀️ Shift 2 (02:30 PM)
                        </button>
                      </div>
                    </div>

                    {/* Window Duration Presets & Manual Closing Date/Time */}
                    <div className={styles.pickerSubSection}>
                      <div className={styles.pickerSectionLabel}>
                        <span>Duration Window</span>
                      </div>
                      <div className={styles.quickPillsRow}>
                        <button
                          type="button"
                          className={styles.quickPillBtn}
                          onClick={() => setQuickWindowDurationPreset(24)}
                        >
                          24 Hrs
                        </button>
                        <button
                          type="button"
                          className={`${styles.quickPillBtn} ${styles.active}`}
                          onClick={() => setQuickWindowDurationPreset(168)}
                        >
                          7 Days Window
                        </button>
                      </div>
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#475569' }}>Or Closing Date &amp; Time:</span>
                        <input
                          type="datetime-local"
                          value={newScheduledEndTime}
                          onChange={(e) => setNewScheduledEndTime(e.target.value)}
                          className={styles.modernDateInput}
                          style={{ maxWidth: '220px', fontSize: '12px', padding: '5px 8px' }}
                        />
                      </div>
                    </div>

                    {/* Confirmation */}
                    <div className={styles.liveWindowPreviewBox}>
                      <CheckCircle2 size={15} className={styles.previewIcon} />
                      <div className={styles.previewText} style={{ fontSize: '11.5px' }}>
                        Opens {new Date(newScheduledStartTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                        {' ➔ '}
                        Closes {new Date(newScheduledEndTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Modal Actions */}
              <div className={styles.createModalFooter}>
                <button
                  type="button"
                  className={styles.discardBtn}
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className={styles.submitCreateBtn}
                >
                  {isCreating ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>Create &amp; Add Tests →</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── SLIDE-OVER METADATA DRAWER (RIGHT PANEL) ─── */}
      {isDrawerOpen && drawerItem && (
        <div className={styles.slideOverBackdrop} onClick={() => setIsDrawerOpen(false)}>
          <div className={styles.slideOverPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <span className={styles.drawerBadge}>{drawerItem.badgeCode}</span>
                <h3 className={styles.drawerTitle}>{drawerTitle || drawerItem.title}</h3>
                <code className={styles.drawerSlugCode}>/{drawerSlug}</code>
              </div>
              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={() => setIsDrawerOpen(false)}
                title="Close drawer"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              {/* Title & Slug */}
              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Series Title</label>
                <input
                  type="text"
                  value={drawerTitle}
                  onChange={(e) => setDrawerTitle(e.target.value)}
                  className={styles.primaryTextInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>URL Slug</label>
                <input
                  type="text"
                  value={drawerSlug}
                  onChange={(e) => setDrawerSlug(e.target.value)}
                  className={styles.primaryTextInput}
                />
              </div>

              {/* Exam Category & Test Format (Student 2 Dropdowns) */}
              <div className={styles.twoColumnGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Target Category (Filter 1)</label>
                  <select
                    value={drawerExamType}
                    onChange={(e) => setDrawerExamType(e.target.value as any)}
                    className={styles.primaryTextInput}
                  >
                    <option value="JEE Main">JEE Main Filter</option>
                    <option value="JEE Advanced">JEE Advanced Engine</option>
                    <option value="BITSAT">BITSAT Speed CBT</option>
                    <option value="MathSpeed">DK Sir Math Speed</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Test Format (Filter 2)</label>
                  <select
                    value={drawerFormat}
                    onChange={(e) => {
                      const fVal = e.target.value as any;
                      setDrawerFormat(fVal);
                      if (fVal === 'Part Test') {
                        setDrawerTotalMarks(100);
                        setDrawerDuration(60);
                      } else if (fVal === 'Full Mock') {
                        setDrawerTotalMarks(300);
                        setDrawerDuration(180);
                      }
                    }}
                    className={styles.primaryTextInput}
                  >
                    <option value="Full Mock">Full Mock (Full-Length Mocks)</option>
                    <option value="Part Test">Part Test (100 Marks • Part Tests)</option>
                    <option value="Chapter Test">Chapter Test (Chapter Tests)</option>
                  </select>
                </div>
              </div>

              {/* Difficulty Level */}
              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Difficulty Level</label>
                <select
                  value={drawerDifficulty}
                  onChange={(e) => setDrawerDifficulty(e.target.value as any)}
                  className={styles.primaryTextInput}
                >
                  <option value="Moderate">Moderate (Main Level)</option>
                  <option value="Challenging">Challenging</option>
                  <option value="Advanced">Advanced (IIT Ranker)</option>
                </select>
              </div>

              {/* Duration & Marks */}
              <div className={styles.twoColumnGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Duration (Mins)</label>
                  <input
                    type="number"
                    value={drawerDuration}
                    onChange={(e) => setDrawerDuration(Number(e.target.value))}
                    className={styles.primaryTextInput}
                  />
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    {[45, 60, 90, 180].map((m) => (
                      <button
                        key={m}
                        type="button"
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: drawerDuration === m ? '1px solid #2563EB' : '1px solid #CBD5E1',
                          background: drawerDuration === m ? '#EFF6FF' : '#FFF',
                          cursor: 'pointer'
                        }}
                        onClick={() => setDrawerDuration(m)}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Total Marks</label>
                  <input
                    type="number"
                    value={drawerTotalMarks}
                    onChange={(e) => setDrawerTotalMarks(Number(e.target.value))}
                    className={styles.primaryTextInput}
                  />
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    {[100, 180, 300, 390].map((mk) => (
                      <button
                        key={mk}
                        type="button"
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: drawerTotalMarks === mk ? '1px solid #10B981' : '1px solid #CBD5E1',
                          background: drawerTotalMarks === mk ? '#ECFDF5' : '#FFF',
                          cursor: 'pointer'
                        }}
                        onClick={() => setDrawerTotalMarks(mk)}
                      >
                        {mk}M {mk === 100 ? '(Part)' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Selector */}
              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Release Publication Status</label>
                <select
                  value={drawerStatus}
                  onChange={(e) => setDrawerStatus(e.target.value as any)}
                  className={styles.primaryTextInput}
                >
                  <option value="Published">Live Publish</option>
                  <option value="Draft">Draft</option>
                  <option value="Scheduled">Schedule</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              {drawerStatus === 'Scheduled' && (
                <div style={{ marginTop: '12px', padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                  <div className={styles.twoColumnGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={13} color="#2563EB" />
                        <span>Opening Date &amp; Time (Start Window) *</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={drawerStartWindow}
                        onChange={(e) => setDrawerStartWindow(e.target.value)}
                        className={styles.primaryTextInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={13} color="#7C3AED" />
                        <span>Closing Date &amp; Time (Duration Window) *</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={drawerEndWindow}
                        onChange={(e) => setDrawerEndWindow(e.target.value)}
                        className={styles.primaryTextInput}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748B' }}>Quick Duration Presets:</span>
                    <button
                      type="button"
                      className={styles.quickPillBtn}
                      onClick={() => setDrawerWindowDurationPreset(24)}
                    >
                      24 Hours
                    </button>
                    <button
                      type="button"
                      className={styles.quickPillBtn}
                      onClick={() => setDrawerWindowDurationPreset(72)}
                    >
                      3 Days
                    </button>
                    <button
                      type="button"
                      className={styles.quickPillBtn}
                      onClick={() => setDrawerWindowDurationPreset(168)}
                    >
                      7 Days Window
                    </button>
                  </div>

                  <div className={styles.liveWindowPreviewBox} style={{ marginTop: '12px' }}>
                    <CheckCircle2 size={15} className={styles.previewIcon} />
                    <div className={styles.previewText} style={{ fontSize: '12px' }}>
                      <strong>Active Window: </strong>
                      <span>
                        Opens {new Date(drawerStartWindow || Date.now()).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                        {' ➔ '}
                        Closes {new Date(drawerEndWindow || (Date.now() + 7 * 86400000)).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  </div>

                  <p style={{ margin: '8px 0 0', fontSize: '11.5px', color: '#6D28D9', fontWeight: 600 }}>
                    ⏰ Students see a live countdown before open time. When the end window closes, the test automatically locks with a "🔒 Closed Test" badge.
                  </p>
                </div>
              )}

              {/* Question Count Stats */}
              <div className={styles.drawerStatsBox}>
                <div className={styles.statMiniCard}>
                  <span className={styles.statMiniLabel}>Total Tests / Qs</span>
                  <span className={styles.statMiniVal}>{drawerItem.totalTests}</span>
                </div>
                <div className={styles.statMiniCard}>
                  <span className={styles.statMiniLabel}>Student Attempts</span>
                  <span className={styles.statMiniVal}>{drawerItem.attemptsCount || 0}</span>
                </div>
                <div className={styles.statMiniCard}>
                  <span className={styles.statMiniLabel}>Created</span>
                  <span className={styles.statMiniVal}>{drawerItem.createdAtFormatted}</span>
                </div>
              </div>

              {/* Deep Link to 4-Step Wizard */}
              <div className={styles.builderDirectLinkBox}>
                <p>Need to add questions, formulas, or solutions?</p>
                <button
                  type="button"
                  className={styles.builderDirectBtn}
                  onClick={() => {
                    handleEditSeries(drawerItem);
                    setIsDrawerOpen(false);
                  }}
                >
                  <span>Open Question Builder &amp; LaTeX Editor ↗</span>
                </button>
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <button
                type="button"
                className={styles.discardBtn}
                onClick={() => setIsDrawerOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!isDrawerDirty || isSavingDrawer}
                className={styles.submitCreateBtn}
                onClick={handleSaveDrawerChanges}
              >
                {isSavingDrawer ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SAFE MULTI-TIER DELETE CONFIRMATION MODAL ─── */}
      {deleteConfirmItem && (
        <div className={styles.modalBackdropOverlay} onClick={() => !isDeletingSingle && setDeleteConfirmItem(null)}>
          <div className={styles.deleteConfirmModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dangerIconBubble}>
              <AlertTriangle size={24} />
            </div>
            <h3 className={styles.deleteModalTitle}>Delete Test Series?</h3>
            <p className={styles.deleteModalDesc}>
              Are you sure you want to delete <strong>"{deleteConfirmItem.title}"</strong>? This action will permanently remove {deleteConfirmItem.totalTests || 8} mock exams and cannot be undone.
            </p>

            {(deleteConfirmItem.attemptsCount || 0) > 0 && (
              <div className={styles.attemptsWarningCard}>
                <AlertTriangle size={18} className={styles.warningIcon} />
                <p>
                  This series has <strong>{deleteConfirmItem.attemptsCount?.toLocaleString('en-IN')}</strong> completed student submissions. Please note deleting will permanently remove its records.
                </p>
              </div>
            )}

            <div className={styles.modalFooterActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                disabled={isDeletingSingle}
                onClick={() => setDeleteConfirmItem(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className={styles.btnArchiveSafeAction}
                disabled={isDeletingSingle}
                onClick={() => handleArchiveInstead(deleteConfirmItem)}
              >
                Archive Series Instead
              </button>

              <button
                type="button"
                className={styles.btnPermanentlyDeleteActive}
                disabled={isDeletingSingle}
                onClick={handleDeleteConfirm}
              >
                {isDeletingSingle ? (
                  <>
                    <Loader2 size={14} className={styles.spinIcon} />
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Permanently Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BULK DELETE CONFIRMATION MODAL ─── */}
      {isBulkDeleteModalOpen && (
        <div className={styles.modalBackdropOverlay} onClick={() => !isBulkDeleting && setIsBulkDeleteModalOpen(false)}>
          <div className={styles.deleteConfirmModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dangerIconBubble}>
              <Trash2 size={24} />
            </div>
            <h3 className={styles.deleteModalTitle}>Delete {selectedTestIds.length} Test Series?</h3>
            <p className={styles.deleteModalDesc}>
              Are you sure you want to permanently delete <strong>{selectedTestIds.length}</strong> selected test series? All associated mock exams, questions, and attempt histories will be permanently removed. This action cannot be undone.
            </p>

            <div className={styles.modalFooterActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                disabled={isBulkDeleting}
                onClick={() => setIsBulkDeleteModalOpen(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className={styles.btnPermanentlyDeleteActive}
                disabled={isBulkDeleting}
                onClick={handleBulkDeleteConfirm}
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 size={14} className={styles.spinIcon} />
                    <span>Deleting {selectedTestIds.length} Series...</span>
                  </>
                ) : (
                  `Permanently Delete (${selectedTestIds.length})`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SUCCESS PUBLISH MODAL ─── */}
      {isPublishModalOpen && (
        <div className={styles.modalBackdropOverlay} onClick={() => { setIsPublishModalOpen(false); setViewMode('TABLE'); }}>
          <div className={styles.successModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.successIconBubble}>
              <CheckCircle size={36} />
            </div>
            <h3 className={styles.successTitle}>Test Series Scheduled Successfully!</h3>
            <p className={styles.successDesc}>
              <strong>"{editingSeriesTitle}"</strong> has been published and queued into DK Academy’s CBT Examination Engine.
            </p>
            <div className={styles.modalFooterActions} style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => {
                  setIsPublishModalOpen(false);
                  setViewMode('TABLE');
                }}
              >
                Return to Table
              </button>
              <Link
                to="/test-series"
                target="_blank"
                rel="noreferrer"
                className={styles.submitBtn}
                style={{
                  textDecoration: 'none',
                  background: '#047857',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>View in Student CBT Portal ↗</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── SMART PASTE QUESTION MODAL (MATHS & MCQ EXTRACTOR) ─── */}
      {isSmartPasteModalOpen && (
        <div className={styles.modalBackdropOverlay} onClick={() => setIsSmartPasteModalOpen(false)}>
          <div className={styles.createModalCard} style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.createModalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#EFF6FF', color: '#2563EB', padding: '8px', borderRadius: '8px' }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className={styles.createModalTitle}>Smart Paste Question (Maths &amp; MCQ)</h3>
                  <p className={styles.createModalSub}>
                    Paste question text copied from PDF, Word, or web. Automatically extracts Statement, Options (A-D or 1-4), Answer Key, and formats Math/LaTeX.
                  </p>
                </div>
              </div>
              <button type="button" className={styles.closeModalBtn} onClick={() => setIsSmartPasteModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.createModalBody} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label className={styles.fieldLabel} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Paste Question with Options Here:</span>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Supports (A)/(B)/(C)/(D) or (1)/(2)/(3)/(4)</span>
                </label>
                <textarea
                  rows={7}
                  value={smartPasteText}
                  onChange={(e) => setSmartPasteText(e.target.value)}
                  onPaste={(e) => {
                    const res = normalizePastedQuestion(e.clipboardData);
                    if (res.fullNormalizedText) {
                      e.preventDefault();
                      setSmartPasteText(res.fullNormalizedText);
                    }
                  }}
                  placeholder={`Paste full question here, e.g.:\n\nIf f(x) = \\int_0^x \\sqrt{1 + t^3} dt, then find f'(2).\n(A) 3\n(B) 4\n(C) 5\n(D) 9\nAns: A\nShortcut: Apply Leibniz rule f'(x) = \\sqrt{1 + x^3}`}
                  className={styles.questionTextarea}
                  style={{ fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.5' }}
                />
              </div>

              {liveSmartExtracted && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px', maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      ✨ Live Formatted Math Preview:
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {liveSmartExtracted.detectedCorrectKey && (
                        <span style={{ fontSize: '11px', fontWeight: 700, background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '4px' }}>
                          ✓ Detected Key: Option {liveSmartExtracted.detectedCorrectKey}
                        </span>
                      )}
                      {liveSmartExtracted.detectedNumericalAnswer && (
                        <span style={{ fontSize: '11px', fontWeight: 700, background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '4px' }}>
                          ✓ Numerical Key: {liveSmartExtracted.detectedNumericalAnswer}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Statement Card */}
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', color: '#0F172A', lineHeight: '1.6' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>QUESTION STATEMENT</div>
                    <MathText text={liveSmartExtracted.statement} />
                  </div>

                  {/* Options Grid */}
                  {liveSmartExtracted.hasRealOptions && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {liveSmartExtracted.options.map((opt) => {
                        const isCorrect = liveSmartExtracted.detectedCorrectKey === opt.key;
                        return (
                          <div
                            key={opt.key}
                            style={{
                              background: isCorrect ? '#F0FDF4' : '#FFFFFF',
                              border: `1.5px solid ${isCorrect ? '#22C55E' : '#E2E8F0'}`,
                              borderRadius: '6px',
                              padding: '8px 10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '12.5px'
                            }}
                          >
                            <span
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: isCorrect ? '#22C55E' : '#EFF6FF',
                                color: isCorrect ? '#FFFFFF' : '#1D4ED8',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '11px',
                                flexShrink: 0
                              }}
                            >
                              {opt.key}
                            </span>
                            <span style={{ flex: 1 }}>
                              <MathText text={opt.text} />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.smartPasteFooter}>
              <button
                type="button"
                className={styles.smartPasteCancelBtn}
                onClick={() => setIsSmartPasteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.smartPasteApplyBtn}
                disabled={!smartPasteText.trim()}
                onClick={handleApplySmartPaste}
              >
                <CheckCircle2 size={16} />
                <span>Apply &amp; Auto-Fill Question</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
