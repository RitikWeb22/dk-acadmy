import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useStudentAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  SlidersHorizontal,
  ChevronDown,
  Video,
  Award,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  PhoneCall,
  Phone,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Star,
  Zap,
  Target,
  Sparkles,
  Users,
  Trophy,
  TrendingUp,
  BarChart3,
  Headphones,
  Rocket,
  Atom,
  FlaskConical,
  Calculator,
  ClipboardCheck,
  Cloud,
  FileCheck
} from 'lucide-react';
import { Container } from '../../components/ui/Container/Container';
import { ReferenceCourseCard } from '../../components/courses/ReferenceCourseCard/ReferenceCourseCard';
import { CourseDemoModal } from '../../components/courses/CourseDemoModal/CourseDemoModal';
import { CourseSyllabusModal } from '../../components/courses/CourseSyllabusModal/CourseSyllabusModal';
import { cmsService, CMS_EVENT_KEY } from '../../services/cmsService';
import { getTargetYearLabel } from '../../data/coursesData';
import type { Course } from '../../types';
import styles from './CoursesPage.module.scss';

type ClassType = 'Class 11th' | 'Class 12th' | 'Dropper' | 'Class 10th Foundation' | 'All';
type ModeFilterType = 'All' | 'live' | 'recorded' | 'test-series' | 'dlp';
type SessionType = 'Session: 2026-27' | 'Session: 2027-28' | 'All Sessions';
type SortOption = 'popularity' | 'rating-desc' | 'price-asc' | 'price-desc' | 'start-date';
type ExamStructureTab = 'jee-main' | 'jee-advanced' | 'bitsat';

// ─── Course Structure Data Matrix ───
const COURSE_STRUCTURE_DATA: Record<
  ExamStructureTab,
  Array<{
    icon: React.ComponentType<{ size?: number; className?: string }>;
    name: string;
    details: string;
    desc: string;
  }>
> = {
  'jee-main': [
    {
      icon: Atom,
      name: 'Physics',
      details: 'Concepts + Practice',
      desc: 'Mechanics, Electrodynamics, Modern Physics & 10-Year PYQ Bank with NTA Pattern Drills'
    },
    {
      icon: FlaskConical,
      name: 'Chemistry',
      details: 'NCERT Focus + MCQs',
      desc: 'Physical Formulas, Inorganic NCERT Line-by-Line & Organic Reaction Mechanisms'
    },
    {
      icon: Calculator,
      name: 'Mathematics',
      details: 'Advanced Problem Solving',
      desc: 'DK Sir 20-30s Shortcuts, Calculus Mastery, Vectors-3D & High-Speed Accuracy Practice'
    },
    {
      icon: ClipboardCheck,
      name: 'Mock Tests',
      details: 'Full Syllabus Tests',
      desc: '30+ NTA-Pattern Computer-Based Tests with All-India Percentile Prediction & Analysis'
    }
  ],
  'jee-advanced': [
    {
      icon: Atom,
      name: 'Physics',
      details: 'Multi-Concept Rigor',
      desc: 'Rotational Dynamics, Variable Mass Systems, Wave Optics & Advanced Calculus Applications'
    },
    {
      icon: FlaskConical,
      name: 'Chemistry',
      details: 'Deep Mechanism Mastery',
      desc: 'Multi-Step Organic Syntheses, Qualitative Analysis, Coordination Chemistry & Thermodynamics'
    },
    {
      icon: Calculator,
      name: 'Mathematics',
      details: 'Olympiad & Advanced Problems',
      desc: 'Multi-Correct, Matrix Match, Comprehensive Paragraphs & DK Sir Advanced Shortcut Techniques'
    },
    {
      icon: ClipboardCheck,
      name: 'Mock Tests',
      details: 'Paper 1 & Paper 2 Simulation',
      desc: '25 Exhaustive 3-Hour Paper 1 + Paper 2 CBT Mocks with Negative Marking & Live Rank Analysis'
    }
  ],
  'bitsat': [
    {
      icon: Atom,
      name: 'Physics',
      details: 'Speed & Formula Drills',
      desc: 'High-Speed Formula Accuracy, Direct Concept MCQs & Negative-Marking Avoidance Strategy'
    },
    {
      icon: FlaskConical,
      name: 'Chemistry',
      details: 'Rapid NCERT Recall',
      desc: 'Fast-Paced Inorganic & Direct Organic Reactions with Instant Recall Techniques'
    },
    {
      icon: Calculator,
      name: 'Mathematics & Logic',
      details: '130-Question Speed Sprint',
      desc: 'Algebra, Trigonometry, Calculus plus English Proficiency & Logical Reasoning Drills'
    },
    {
      icon: ClipboardCheck,
      name: 'Mock Tests',
      details: 'Speed CBT Drills',
      desc: '20 Full BITSAT 130-Question Timed Simulations with Bonus Question Strategy'
    }
  ]
};

// ─── Verified Student Testimonials (Authentic DK Academy Records) ───
const VERIFIED_TESTIMONIALS = [
  {
    name: 'SHAURYA SINGH',
    score: 'JEE Mains: 99.5%ile',
    badge: 'TOP 0.1% CLUB',
    batch: '2 Year Classroom Program',
    quote: 'DK Sir’s conceptual shortcut inspection techniques and rigorous advanced problem sets helped me secure 99.5%ile in JEE Mains.',
    avatar: '/img/shaurya-singh.jpg'
  },
  {
    name: 'PANACHE THAKAR',
    score: 'JEE Mains: 97.8%ile',
    badge: 'TOP 2% MERIT',
    batch: '2 Year Classroom Program',
    quote: 'The small batch size and direct mentorship under DK Sir ensured every conceptual doubt was cleared from first principles.',
    avatar: '/img/PANACHE%20THAKAR.png'
  },
  {
    name: 'RISHABH ANAND',
    score: 'JEE Mains: 99.814%ile',
    badge: 'AIR 2146 (Advanced)',
    batch: '2 Year Classroom Program',
    quote: 'DK Sir’s non-standard calculus drills and 20–30s speed inspection methods made tackling multi-concept Advanced questions second nature.',
    avatar: '/img/RISHABH%20ANAND.png'
  }
];

export const CoursesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { student, isAuthenticated, enrollCourse } = useStudentAuth();
  const { showToast } = useToast();

  // Modals state
  const [demoModalCourse, setDemoModalCourse] = useState<Course | null>(null);
  const [syllabusModalCourse, setSyllabusModalCourse] = useState<Course | null>(null);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);

  // Active exam structure tab
  const [structureTab, setStructureTab] = useState<ExamStructureTab>('jee-main');

  // Backend live courses sync
  const [coursesCatalog, setCoursesCatalog] = useState<Course[]>(() => cmsService.getCourses());

  useEffect(() => {
    cmsService
      .fetchCoursesFromAPI()
      .then((liveCourses) => {
        if (liveCourses && liveCourses.length > 0) {
          setCoursesCatalog(liveCourses);
        }
      })
      .catch(() => {});

    const handleCmsUpdate = () => {
      setCoursesCatalog(cmsService.getCourses());
    };

    window.addEventListener(CMS_EVENT_KEY, handleCmsUpdate);
    window.addEventListener('dk_course_created', handleCmsUpdate);
    window.addEventListener('dk_course_updated', handleCmsUpdate);
    window.addEventListener('dk_course_deleted', handleCmsUpdate);
    window.addEventListener('dk_payment_success', handleCmsUpdate);

    return () => {
      window.removeEventListener(CMS_EVENT_KEY, handleCmsUpdate);
      window.removeEventListener('dk_course_created', handleCmsUpdate);
      window.removeEventListener('dk_course_updated', handleCmsUpdate);
      window.removeEventListener('dk_course_deleted', handleCmsUpdate);
      window.removeEventListener('dk_payment_success', handleCmsUpdate);
    };
  }, []);

  // Filter state derived from searchParams
  const urlCategory = searchParams.get('category')?.toLowerCase();
  const urlSubject = searchParams.get('subject')?.toLowerCase();
  const urlMode = searchParams.get('mode')?.toLowerCase();
  const urlClass = searchParams.get('class')?.toLowerCase();

  const selectedSubject: 'All' | 'Physics' | 'Chemistry' | 'Mathematics' = useMemo(() => {
    if (urlSubject === 'mathematics' || urlSubject === 'math') return 'Mathematics';
    if (urlSubject === 'physics') return 'Physics';
    if (urlSubject === 'chemistry') return 'Chemistry';
    return 'All';
  }, [urlSubject]);

  const selectedClass: ClassType = useMemo((): ClassType => {
    if (urlClass) {
      if (urlClass.includes('foundation') || urlClass.includes('8-10') || urlClass.includes('10')) return 'Class 10th Foundation';
      if (urlClass.includes('dropper') || urlClass.includes('repeater')) return 'Dropper';
      if (urlClass.includes('12')) return 'Class 12th';
      if (urlClass.includes('11')) return 'Class 11th';
    }
    if (urlCategory) {
      if (urlCategory.includes('foundation') || urlCategory.includes('8-10') || urlCategory.includes('10')) return 'Class 10th Foundation';
      if (urlCategory.includes('dropper') || urlCategory.includes('repeater')) return 'Dropper';
      if (urlCategory.includes('12')) return 'Class 12th';
      if (urlCategory.includes('11')) return 'Class 11th';
    }
    return 'All';
  }, [urlCategory, urlClass]);

  const selectedMode: ModeFilterType = useMemo(() => {
    if (urlMode && ['live', 'recorded', 'test-series', 'dlp'].includes(urlMode)) {
      return urlMode as ModeFilterType;
    }
    return 'All';
  }, [urlMode]);

  const handleModeChange = (newMode: ModeFilterType) => {
    const nextParams = new URLSearchParams(searchParams);
    if (newMode === 'All') {
      nextParams.delete('mode');
    } else {
      nextParams.set('mode', newMode);
    }
    setSearchParams(nextParams);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession] = useState<SessionType>('Session: 2026-27');
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [selectedLanguage, setSelectedLanguage] = useState<'All' | 'Hinglish' | 'English'>('All');
  const [selectedRating, setSelectedRating] = useState<'All' | 4.8 | 4.5 | 4.0>('All');
  const [selectedTier, setSelectedTier] = useState<'All' | 'Free' | 'Paid'>('All');

  // Active Dropdown Portal state
  const [activeDropdown, setActiveDropdown] = useState<{
    id: 'lang' | 'rating' | 'class' | 'subject' | 'sort';
    top: number;
    left?: number;
    right?: number;
    minWidth?: number;
  } | null>(null);

  const toggleDropdown = (
    id: 'lang' | 'rating' | 'class' | 'subject' | 'sort',
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    if (activeDropdown?.id === id) {
      setActiveDropdown(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownEstimatedWidth = 200;
    const willOverflowRight = rect.left + dropdownEstimatedWidth > window.innerWidth - 12;

    setActiveDropdown({
      id,
      top: rect.bottom + 6,
      left: willOverflowRight ? undefined : Math.max(12, rect.left),
      right: willOverflowRight ? Math.max(12, window.innerWidth - rect.right) : undefined,
      minWidth: Math.max(rect.width, 185)
    });
  };

  const closeDropdown = () => setActiveDropdown(null);

  useEffect(() => {
    if (!activeDropdown) return;
    const handleScrollOrResize = () => setActiveDropdown(null);
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest(`.${styles.floatingDropdownPortal}`) &&
        !target.closest(`.${styles.dropdownPill}`)
      ) {
        setActiveDropdown(null);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const dynamicTargetYear = useMemo(() => {
    return getTargetYearLabel(selectedClass, selectedSession);
  }, [selectedClass, selectedSession]);

  // Lead counselor form state
  const [counsellorPhone, setCounsellorPhone] = useState('');
  const [counsellorSubmitted, setCounsellorSubmitted] = useState(false);

  // Filter & Sort Courses
  const filteredCourses = useMemo(() => {
    const catParam = (searchParams.get('category') || searchParams.get('class'))?.toLowerCase();
    const hasExplicitClass = Boolean(searchParams.get('class'));

    return coursesCatalog
      .filter((course) => {
        // 1. Subject Filter
        if (selectedSubject !== 'All') {
          const subjLower = selectedSubject.toLowerCase();
          const hasExplicitSubject = course.subjects?.some((s) => s.toLowerCase() === subjLower);
          const inTitle = course.title?.toLowerCase().includes(subjLower);
          const inDesc = course.description?.toLowerCase().includes(subjLower);
          const isComprehensiveJee =
            (course.targetExam?.includes('JEE') || course.category?.includes('JEE')) &&
            !course.title?.toLowerCase().includes('math only') &&
            !course.title?.toLowerCase().includes('physics only') &&
            !course.title?.toLowerCase().includes('chemistry only') &&
            (!course.subjects || course.subjects.length > 1 || course.subjects.includes(selectedSubject));

          if (!hasExplicitSubject && !inTitle && !inDesc && !isComprehensiveJee) {
            return false;
          }
        }

        // 2. Category Filter from URL / Sub-nav
        if (catParam && !hasExplicitClass) {
          if (catParam.includes('foundation') || catParam.includes('8-10') || catParam.includes('8–10')) {
            const isFound = course.category === 'Foundation' || course.targetClass === 'Class 10th Foundation' || course.title.toLowerCase().includes('foundation');
            if (!isFound) return false;
          } else if (catParam.includes('dropper') || catParam.includes('repeater')) {
            const isDrop = course.targetClass === 'Dropper' || course.title.toLowerCase().includes('dropper');
            if (!isDrop) return false;
          } else if (catParam.includes('crash')) {
            const isCrash = course.category === 'Crash Course' || course.targetExam === 'Crash Course' || course.title.toLowerCase().includes('crash') || course.badge?.toLowerCase().includes('crash');
            if (!isCrash) return false;
          } else if (catParam.includes('12')) {
            const isC12 = course.targetClass === 'Class 12th' || course.title.toLowerCase().includes('12');
            if (!isC12) return false;
          } else if (catParam.includes('11')) {
            const isC11 = course.targetClass === 'Class 11th' || course.title.toLowerCase().includes('11');
            if (!isC11) return false;
          } else if (catParam.includes('main')) {
            const isJeeMain = course.category === 'JEE Main' || course.category === 'JEE Advanced' || course.targetExam?.includes('JEE Main') || course.targetExam?.includes('JEE Advanced');
            if (!isJeeMain) return false;
          }
        }

        // 3. Class Filter
        if (selectedClass !== 'All') {
          const tClass = (course.targetClass || '').toLowerCase();
          const cLevel = ((course as any).level || '').toLowerCase();
          const combined = `${tClass} ${cLevel}`;
          if (selectedClass === 'Class 11th' && !combined.includes('11')) return false;
          if (selectedClass === 'Class 12th' && !combined.includes('12')) return false;
          if (selectedClass === 'Dropper' && !combined.includes('drop') && !combined.includes('repeat')) return false;
          if (selectedClass === 'Class 10th Foundation' && !combined.includes('10') && !combined.includes('found') && !combined.includes('9') && !combined.includes('8')) return false;
        }

        // 4. Mode Filter
        if (selectedMode !== 'All') {
          if (selectedMode === 'dlp') {
            if (course.courseType !== 'dlp' && course.mode !== 'Self-Paced' && course.courseType !== 'recorded') return false;
          } else if (selectedMode === 'test-series') {
            if (course.courseType !== 'test-series' && course.mode !== 'Online Test Series') return false;
          } else if (selectedMode === 'live') {
            if (course.courseType !== 'live' && course.mode !== 'Live' && course.mode !== 'Live + Recorded') return false;
          }
        }

        // 5. Tier Filter
        if (selectedTier !== 'All') {
          if (selectedTier === 'Free' && course.tier !== 'Free' && (course.numericPrice || 0) > 0) return false;
          if (selectedTier === 'Paid' && (course.tier === 'Free' || (course.numericPrice || 0) === 0)) return false;
        }

        // 6. Language Filter
        if (selectedLanguage !== 'All') {
          const langStr = (course.language || 'Hinglish (Hindi + Eng)').toLowerCase();
          if (selectedLanguage === 'Hinglish') {
            if (!langStr.includes('hinglish') && !langStr.includes('hindi')) return false;
          } else if (selectedLanguage === 'English') {
            if (!langStr.includes('eng')) return false;
          }
        }

        // 7. Rating Filter
        if (selectedRating !== 'All') {
          const courseRating = course.rating || (course.isPopular ? 4.9 : 4.7);
          if (courseRating < selectedRating) return false;
        }

        // 8. Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const inTitle = course.title?.toLowerCase().includes(q);
          const inDesc = course.description?.toLowerCase().includes(q);
          const inFeatures = course.features?.some((f) => f.toLowerCase().includes(q));
          const inClass = course.targetClass?.toLowerCase().includes(q);
          const inSubjects = course.subjects?.some((s) => s.toLowerCase().includes(q));
          if (!inTitle && !inDesc && !inFeatures && !inClass && !inSubjects) return false;
        }

        return true;
      })
      .map((c) => ({
        ...c,
        targetYear: c.targetYear || dynamicTargetYear
      }))
      .sort((a, b) => {
        if (sortBy === 'rating-desc') {
          return ((b as any).rating || 4.8) - ((a as any).rating || 4.8);
        }
        if (sortBy === 'price-asc') {
          return (a.numericPrice || 0) - (b.numericPrice || 0);
        }
        if (sortBy === 'price-desc') {
          return (b.numericPrice || 0) - (a.numericPrice || 0);
        }
        if (sortBy === 'start-date') {
          return (a.batchStartDate || '9999').localeCompare(b.batchStartDate || '9999');
        }
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return (b.enrolledCount || 0) - (a.enrolledCount || 0);
      });
  }, [
    coursesCatalog,
    selectedClass,
    selectedMode,
    selectedSubject,
    selectedTier,
    selectedLanguage,
    selectedRating,
    sortBy,
    dynamicTargetYear,
    searchParams,
    searchQuery
  ]);

  // Responsive Pagination
  const [itemsPerPage, setItemsPerPage] = useState<number>(() => {
    if (typeof window === 'undefined') return 12;
    if (window.innerWidth > 1240) return 12;
    if (window.innerWidth > 900) return 8;
    return 6;
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const target = w > 1240 ? 12 : w > 900 ? 8 : 6;
      setItemsPerPage((prev) => (prev !== target ? target : prev));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const filterKey = `${selectedClass}|${selectedMode}|${selectedSubject}|${selectedTier}|${selectedLanguage}|${selectedRating}|${sortBy}|${searchQuery}|${searchParams.toString()}`;
  const prevFilterKey = useRef(filterKey);

  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      prevFilterKey.current = filterKey;
      setCurrentPage(1);
    }
  }, [filterKey]);

  const paginatedCourses = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return filteredCourses.slice(start, start + itemsPerPage);
  }, [filteredCourses, safeCurrentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const headingEl = document.getElementById('choose-your-course');
    if (headingEl) {
      headingEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (safeCurrentPage <= 3) {
      pages.push(1, 2, 3, 4, 'ellipsis-end', totalPages);
    } else if (safeCurrentPage >= totalPages - 2) {
      pages.push(1, 'ellipsis-start', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, 'ellipsis-start', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, 'ellipsis-end', totalPages);
    }
    return pages;
  }, [totalPages, safeCurrentPage]);

  const activeFiltersCount =
    (selectedMode === 'All' ? 0 : 1) +
    (selectedSubject === 'All' ? 0 : 1) +
    (selectedTier === 'All' ? 0 : 1) +
    (selectedClass === 'All' ? 0 : 1) +
    (selectedLanguage === 'All' ? 0 : 1) +
    (selectedRating === 'All' ? 0 : 1) +
    (searchQuery.trim() ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedTier('All');
    setSelectedLanguage('All');
    setSelectedRating('All');
    setSortBy('popularity');
    setSearchQuery('');
    setSearchParams({});
  };

  const handleEnrollCardClick = (course: Course) => {
    if (!isAuthenticated || !student) {
      showToast('Please login to enroll or purchase this course.', 'info');
      navigate(`/login?redirect=${encodeURIComponent(`/payment/${course.id}`)}`);
      return;
    }
    const isPaid = course.tier !== 'Free' && (!course.numericPrice || course.numericPrice > 0);
    if (isPaid) {
      navigate(`/payment/${course.id}`);
    } else {
      enrollCourse(course.id);
      showToast(`Enrolled in ${course.title}! Opening LMS...`, 'success');
      navigate(`/learn/${course.id}`);
    }
  };

  const categoryChips = [
    { id: 'all', label: 'All Batches', isMath: false, isCrash: false, isMain: false, classVal: 'All' },
    { id: 'jee-main', label: 'JEE Main', isMath: false, isCrash: false, isMain: true, classVal: 'All' },
    { id: 'c11', label: 'Class 11', isMath: false, isCrash: false, isMain: false, classVal: 'Class 11th' },
    { id: 'c12', label: 'Class 12', isMath: false, isCrash: false, isMain: false, classVal: 'Class 12th' },
    { id: 'dropper', label: 'Droppers', isMath: false, isCrash: false, isMain: false, classVal: 'Dropper' },
    { id: 'crash', label: 'Crash Courses', isMath: false, isCrash: true, isMain: false, classVal: 'All' },
    { id: 'foundation', label: 'Foundation (8–10)', isMath: false, isCrash: false, isMain: false, classVal: 'Class 10th Foundation' },
    { id: 'math-special', label: 'DK Sir Math Special', isMath: true, isCrash: false, isMain: false, classVal: 'All' }
  ];

  const handleChipClick = (chip: (typeof categoryChips)[0]) => {
    const nextParams = new URLSearchParams();
    if (chip.isMath) {
      nextParams.set('subject', 'Mathematics');
    } else if (chip.isCrash) {
      nextParams.set('category', 'Crash Course');
    } else if (chip.isMain) {
      nextParams.set('category', 'JEE Main');
    } else if (chip.classVal !== 'All') {
      if (chip.classVal === 'Class 10th Foundation') nextParams.set('category', 'Foundation');
      else if (chip.classVal === 'Dropper') nextParams.set('category', 'Dropper');
      else if (chip.classVal === 'Class 12th') nextParams.set('category', 'Class 12th');
      else if (chip.classVal === 'Class 11th') nextParams.set('category', 'Class 11th');
    }
    if (urlMode) nextParams.set('mode', urlMode);
    setSearchParams(nextParams);
  };

  const handleCounsellorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = counsellorPhone.replace(/\D/g, '');
    if (!clean || clean.length < 10) {
      showToast('Please enter a valid 10-digit Indian mobile number.', 'error');
      return;
    }
    setCounsellorSubmitted(true);
    showToast('Callback requested! Our academic counsellor will contact you shortly.', 'success');
    setTimeout(() => {
      setCounsellorPhone('');
    }, 3000);
  };

  const scrollToCourses = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const el = document.getElementById('choose-your-course');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main className={styles.page}>
      {/* Breadcrumb Navigation */}
      <nav className={styles.breadcrumbNav} aria-label="Breadcrumb">
        <Container size="wide">
          <ol className={styles.breadcrumbList}>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <ChevronRight size={13} className={styles.breadcrumbDivider} aria-hidden="true" />
            </li>
            <li aria-current="page" className={styles.activeBreadcrumb}>
              Courses
            </li>
          </ol>
        </Container>
      </nav>

      {/* ─── 1. HERO SECTION ─── */}
      <section className={styles.heroSection} aria-label="DK Academy Hero">
        <div className={styles.heroBackgroundGlow} aria-hidden="true" />
        <Container size="wide">
          <div className={styles.heroGrid}>
            {/* Left Content */}
            <div className={styles.heroContentLeft}>
              <div className={styles.heroEyebrowBadge}>
                <Sparkles size={14} className={styles.sparkleIcon} aria-hidden="true" />
                <span>Your Success, Our Mission</span>
              </div>

              <h1 className={styles.heroHeading}>
                Crack <span className={styles.heroGradientHighlight}>JEE</span> with Confidence
              </h1>

              <p className={styles.heroDescription}>
                Expert-led courses, unlimited practice and smart performance analysis – all in one place.
              </p>

              <div className={styles.heroCtaGroup}>
                <Link to="/test-series" className={styles.heroPrimaryBtn}>
                  <span>Start Free Test</span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <a href="#choose-your-course" onClick={scrollToCourses} className={styles.heroSecondaryBtn}>
                  Explore Courses
                </a>
              </div>
            </div>

            {/* Right Educational Visual */}
            <div className={styles.heroVisualRight}>
              <div className={styles.heroVisualCard}>
                <div className={styles.heroVisualCircleBackdrop} aria-hidden="true" />
                <img
                  src="/img/RISHABH%20ANAND.png"
                  alt="Rishabh Anand - JEE Advanced AIR 2146 (99.814%ile)"
                  className={styles.heroStudentImage}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (!img.src.includes('IMG_5099')) {
                      img.src = '/img/IMG_5099.JPG.jpeg';
                    }
                  }}
                />
                <div className={styles.dreamIitBadge}>
                  <Cloud size={16} className={styles.cloudIcon} aria-hidden="true" />
                  <span>Dream IIT</span>
                </div>
                <div className={styles.heroAchieverPill}>
                  <Trophy size={14} className={styles.trophyIcon} aria-hidden="true" />
                  <span>Rishabh Anand • AIR 2146 (99.814%ile)</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Horizontal Feature Strip Below Hero ─── */}
      <section className={styles.featureStripSection} aria-label="Platform Highlights">
        <Container size="wide">
          <div className={styles.featureStripGrid}>
            {/* 1. Top Quality Study Material */}
            <div className={styles.featureStripCard}>
              <div className={styles.featureIconBadge} style={{ background: '#fef3c7', color: '#d97706' }}>
                <Trophy size={20} aria-hidden="true" />
              </div>
              <div className={styles.featureStripText}>
                <span className={styles.featureStripTitle}>Top Quality Study Material</span>
                <span className={styles.featureStripSubtitle}>Kota curriculum &amp; modules</span>
              </div>
            </div>

            {/* 2. Unlimited Mock Tests */}
            <div className={styles.featureStripCard}>
              <div className={styles.featureIconBadge} style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Zap size={20} aria-hidden="true" />
              </div>
              <div className={styles.featureStripText}>
                <span className={styles.featureStripTitle}>Unlimited Mock Tests</span>
                <span className={styles.featureStripSubtitle}>NTA CBT pattern simulations</span>
              </div>
            </div>

            {/* 3. Detailed Performance Analytics */}
            <div className={styles.featureStripCard}>
              <div className={styles.featureIconBadge} style={{ background: '#ecfdf5', color: '#059669' }}>
                <BarChart3 size={20} aria-hidden="true" />
              </div>
              <div className={styles.featureStripText}>
                <span className={styles.featureStripTitle}>Detailed Performance Analytics</span>
                <span className={styles.featureStripSubtitle}>Speed, accuracy &amp; percentile</span>
              </div>
            </div>

            {/* 4. 24/7 Doubt Support */}
            <div className={styles.featureStripCard}>
              <div className={styles.featureIconBadge} style={{ background: '#eef2ff', color: '#4f46e5' }}>
                <Headphones size={20} aria-hidden="true" />
              </div>
              <div className={styles.featureStripText}>
                <span className={styles.featureStripTitle}>24/7 Doubt Support</span>
                <span className={styles.featureStripSubtitle}>Faculty clinics &amp; instant app</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── 2. COURSES SECTION ("Choose Your Course") ─── */}
      <section className={styles.coursesSection} id="choose-your-course" aria-labelledby="courses-heading">
        <Container size="wide">
          <div className={styles.sectionHeaderCenter}>
            <span className={styles.sectionEyebrow}>— Our Courses</span>
            <h2 id="courses-heading" className={styles.sectionTitle}>
              Choose Your Course
            </h2>
            <p className={styles.sectionSubtitle}>
              Tailored classroom programs, full syllabus DLP modules, and all-India test series led by DK Sir.
            </p>
          </div>

          {/* Filter & Search Toolbar */}
          <div className={styles.filterToolbarWrap}>
            {/* Top row: Category Pills */}
            <div className={styles.filterTopRow}>
              <div className={styles.categoryPillsScroll} role="tablist" aria-label="Course categories">
                <button
                  type="button"
                  className={`${styles.allFiltersTriggerBtn} ${activeFiltersCount > 0 ? styles.allFiltersActive : ''}`}
                  onClick={() => setIsFiltersModalOpen(true)}
                  aria-label={`Open all filters (${activeFiltersCount} active)`}
                >
                  <SlidersHorizontal size={14} aria-hidden="true" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && <span className={styles.filterCountBadge}>{activeFiltersCount}</span>}
                </button>

                {categoryChips.map((chip) => {
                  const isSelected = chip.isMath
                    ? selectedSubject === 'Mathematics'
                    : chip.isCrash
                    ? Boolean(urlCategory?.includes('crash'))
                    : chip.isMain
                    ? Boolean(urlCategory?.includes('main'))
                    : selectedSubject !== 'Mathematics' &&
                      !urlCategory?.includes('crash') &&
                      !urlCategory?.includes('main') &&
                      selectedClass === chip.classVal;

                  return (
                    <button
                      key={chip.id}
                      type="button"
                      className={`${styles.categoryPill} ${isSelected ? styles.categoryPillActive : ''}`}
                      onClick={() => handleChipClick(chip)}
                      role="tab"
                      aria-selected={isSelected}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom row: Search & Secondary Filters */}
            <div className={styles.filterBottomRow}>
              <div className={styles.searchBoxWrap}>
                <Search size={16} className={styles.searchIcon} aria-hidden="true" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search batches by keyword, topic or class..."
                  className={styles.searchInput}
                  aria-label="Search courses"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className={styles.clearSearchBtn}
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className={styles.dropdownFiltersGroup}>
                {/* Mode Filter: Live */}
                <button
                  type="button"
                  className={`${styles.dropdownPill} ${selectedMode === 'live' ? styles.dropdownPillActive : ''}`}
                  onClick={() => handleModeChange(selectedMode === 'live' ? 'All' : 'live')}
                >
                  <Video size={13} aria-hidden="true" />
                  <span>Live Batches</span>
                </button>

                {/* Mode Filter: Practice Tests */}
                <button
                  type="button"
                  className={`${styles.dropdownPill} ${selectedMode === 'test-series' ? styles.dropdownPillActive : ''}`}
                  onClick={() => handleModeChange(selectedMode === 'test-series' ? 'All' : 'test-series')}
                >
                  <Award size={13} aria-hidden="true" />
                  <span>Test Series</span>
                </button>

                {/* Mode Filter: DLP */}
                <button
                  type="button"
                  className={`${styles.dropdownPill} ${selectedMode === 'dlp' ? styles.dropdownPillActive : ''}`}
                  onClick={() => handleModeChange(selectedMode === 'dlp' ? 'All' : 'dlp')}
                >
                  <BookOpen size={13} aria-hidden="true" />
                  <span>Self-Paced / DLP</span>
                </button>

                {/* Dropdown: Sort */}
                <button
                  type="button"
                  className={styles.dropdownPill}
                  onClick={(e) => toggleDropdown('sort', e)}
                  aria-expanded={activeDropdown?.id === 'sort'}
                >
                  <span>
                    Sort:{' '}
                    {sortBy === 'popularity'
                      ? 'Popular'
                      : sortBy === 'rating-desc'
                      ? 'Highest Rated'
                      : sortBy === 'price-asc'
                      ? 'Price: Low'
                      : 'Price: High'}
                  </span>
                  <ChevronDown size={13} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Course Cards Grid */}
          {filteredCourses.length > 0 ? (
            <>
              <div className={styles.fourColGrid}>
                {paginatedCourses.map((course) => (
                  <ReferenceCourseCard
                    key={course.id}
                    course={course}
                    onEnroll={handleEnrollCardClick}
                    onDemo={(c) => setDemoModalCourse(c)}
                    onSyllabus={(c) => setSyllabusModalCourse(c)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className={styles.paginationCard} aria-label="Course list pagination">
                  <div className={styles.paginationInfo}>
                    Showing <strong>{(safeCurrentPage - 1) * itemsPerPage + 1}</strong>–
                    <strong>{Math.min(safeCurrentPage * itemsPerPage, filteredCourses.length)}</strong> of{' '}
                    <strong>{filteredCourses.length}</strong> courses
                  </div>

                  <div className={styles.paginationControls}>
                    <button
                      type="button"
                      className={styles.pageArrowBtn}
                      onClick={() => handlePageChange(safeCurrentPage - 1)}
                      disabled={safeCurrentPage <= 1}
                      aria-label="Previous Page"
                    >
                      <ChevronLeft size={16} />
                      <span>Previous</span>
                    </button>

                    <div className={styles.pageNumbers}>
                      {pageNumbers.map((page, idx) =>
                        typeof page === 'number' ? (
                          <button
                            key={page}
                            type="button"
                            className={`${styles.pageNumberBtn} ${safeCurrentPage === page ? styles.activePage : ''}`}
                            onClick={() => handlePageChange(page)}
                            aria-label={`Page ${page}`}
                            aria-current={safeCurrentPage === page ? 'page' : undefined}
                          >
                            {page}
                          </button>
                        ) : (
                          <span key={`ellipsis-${idx}`} className={styles.pageEllipsis}>
                            …
                          </span>
                        )
                      )}
                    </div>

                    <button
                      type="button"
                      className={styles.pageArrowBtn}
                      onClick={() => handlePageChange(safeCurrentPage + 1)}
                      disabled={safeCurrentPage >= totalPages}
                      aria-label="Next Page"
                    >
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </nav>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrap}>
                <Search size={32} />
              </div>
              <h3 className={styles.emptyTitle}>No courses match your active filters</h3>
              <p className={styles.emptySubtitle}>
                Try clearing your search query or selecting a different category to explore available batches.
              </p>
              <button type="button" className={styles.emptyResetBtn} onClick={resetAllFilters}>
                Reset all filters
              </button>
            </div>
          )}
        </Container>
      </section>

      {/* ─── 3. MOCK TEST PROMOTIONAL SECTION ("Practice with Purpose") ─── */}
      <section className={styles.mockTestSection} aria-labelledby="mock-test-heading">
        <Container size="wide">
          <div className={styles.mockTestGrid}>
            {/* Left Column: Visual Mock Test Card */}
            <div className={styles.mockTestBannerCard}>
              <img
                src="/images/mock-test-banner-hd.png"
                alt="JEE CBT Mock Test Paper"
                className={styles.mockTestBgImage}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (!img.src.includes('mock-test-banner-crop')) {
                    img.src = '/images/mock-test-banner-crop.png';
                  }
                }}
              />
              <div className={styles.mockTestBannerContent}>
                <h3 className={styles.mockTestBannerTitle}>
                  Take <span>Mock Tests</span>
                </h3>
                <p className={styles.mockTestBannerSubtitle}>Analyze. Improve. Excel.</p>
                <Link to="/test-series" className={styles.mockTestStartBtn}>
                  <span>Start Test</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Right Column: Features and CTA */}
            <div className={styles.mockTestRightCol}>
              <span className={styles.sectionEyebrow}>— Test Series</span>
              <h2 id="mock-test-heading" className={styles.mockTestHeading}>
                Practice with Purpose
              </h2>

              <div className={styles.mockFeaturesList}>
                <div className={styles.mockFeatureItem}>
                  <CheckCircle2 size={20} className={styles.mockCheckIcon} aria-hidden="true" />
                  <div className={styles.mockFeatureTextGroup}>
                    <span className={styles.mockFeatureItemTitle}>Real Exam Pattern</span>
                    <span className={styles.mockFeatureItemDesc}>
                      Simulate actual NTA CBT interface with negative marking and sectional timer.
                    </span>
                  </div>
                </div>

                <div className={styles.mockFeatureItem}>
                  <CheckCircle2 size={20} className={styles.mockCheckIcon} aria-hidden="true" />
                  <div className={styles.mockFeatureTextGroup}>
                    <span className={styles.mockFeatureItemTitle}>Detailed Analysis</span>
                    <span className={styles.mockFeatureItemDesc}>
                      Instant subject-wise accuracy, speed breakdown, and step-by-step video solutions.
                    </span>
                  </div>
                </div>

                <div className={styles.mockFeatureItem}>
                  <CheckCircle2 size={20} className={styles.mockCheckIcon} aria-hidden="true" />
                  <div className={styles.mockFeatureTextGroup}>
                    <span className={styles.mockFeatureItemTitle}>All India Ranking</span>
                    <span className={styles.mockFeatureItemDesc}>
                      Live nationwide percentile prediction and benchmarking against top aspirants.
                    </span>
                  </div>
                </div>
              </div>

              <Link to="/test-series" className={styles.mockExploreBtn}>
                <span>Explore All Tests</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── 4. STATISTICS SECTION ─── */}
      <section className={styles.statsSection} aria-label="DK Academy Platform Statistics">
        <Container size="wide">
          <div className={styles.statsBannerCard}>
            <div className={styles.statsLeftContent}>
              <h3 className={styles.statsHeading}>Join 500+ Students on DK Academy JEE</h3>
              <p className={styles.statsSubtitle}>Be a part of our growing community of achievers.</p>
            </div>

            <div className={styles.statsMetricsRow}>
              {/* Stat 1: Students */}
              <div className={styles.statMetricItem}>
                <div className={styles.statIconBox}>
                  <Users size={24} aria-hidden="true" />
                </div>
                <div>
                  <div className={styles.statNumberText}>500+</div>
                  <div className={styles.statLabelText}>Students</div>
                </div>
              </div>

              {/* Stat 2: Tests Attempted */}
              <div className={styles.statMetricItem}>
                <div className={styles.statIconBox}>
                  <FileCheck size={24} aria-hidden="true" />
                </div>
                <div>
                  <div className={styles.statNumberText}>100+</div>
                  <div className={styles.statLabelText}>Tests Attempted</div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── 5. COURSE STRUCTURE SECTION ("As per Latest Exam Pattern") ─── */}
      <section className={styles.structureSection} aria-labelledby="structure-heading">
        <Container size="wide">
          <div className={styles.sectionHeaderCenter}>
            <span className={styles.sectionEyebrow}>— Course Structure</span>
            <h2 id="structure-heading" className={styles.sectionTitle}>
              As per Latest Exam Pattern
            </h2>
            <p className={styles.sectionSubtitle}>
              Curriculum aligned strictly with the updated NTA syllabus, NCERT framework, and IIT Bombay/Madras guidelines.
            </p>
          </div>

          {/* Interactive Exam Tabs */}
          <div className={styles.structureTabsRow} role="tablist" aria-label="Exam structure selection">
            <button
              type="button"
              className={`${styles.structureTabBtn} ${structureTab === 'jee-main' ? styles.structureTabActive : ''}`}
              onClick={() => setStructureTab('jee-main')}
              role="tab"
              aria-selected={structureTab === 'jee-main'}
            >
              JEE Main
            </button>
            <button
              type="button"
              className={`${styles.structureTabBtn} ${structureTab === 'jee-advanced' ? styles.structureTabActive : ''}`}
              onClick={() => setStructureTab('jee-advanced')}
              role="tab"
              aria-selected={structureTab === 'jee-advanced'}
            >
              JEE Advanced
            </button>
            <button
              type="button"
              className={`${styles.structureTabBtn} ${structureTab === 'bitsat' ? styles.structureTabActive : ''}`}
              onClick={() => setStructureTab('bitsat')}
              role="tab"
              aria-selected={structureTab === 'bitsat'}
            >
              BITSAT
            </button>
          </div>

          {/* Structure Comparison Card */}
          <div className={styles.structureCard}>
            {COURSE_STRUCTURE_DATA[structureTab].map((row, idx) => {
              const IconComp = row.icon;
              return (
                <div key={idx} className={styles.structureRow}>
                  <div className={styles.structureSubjectCol}>
                    <div className={styles.structureSubjectIcon}>
                      <IconComp size={20} aria-hidden="true" />
                    </div>
                    <span className={styles.structureSubjectName}>{row.name}</span>
                  </div>

                  <div className={styles.structureDetailsCol}>
                    <span className={styles.structureDetailsBold}>{row.details}</span>
                    <span className={styles.structureDetailsDesc}>{row.desc}</span>
                  </div>

                  <div className={styles.structureStatusCol}>
                    <CheckCircle2 size={20} aria-label="Included in curriculum" />
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ─── 6. STUDENT TESTIMONIALS SECTION ("Real Stories. Real Results.") ─── */}
      <section className={styles.testimonialsSection} aria-labelledby="testimonials-heading">
        <Container size="wide">
          <div className={styles.sectionHeaderCenter}>
            <span className={styles.sectionEyebrow}>— What Our Students Say</span>
            <h2 id="testimonials-heading" className={styles.sectionTitle}>
              Real Stories. Real Results.
            </h2>
            <p className={styles.sectionSubtitle}>
              Hear from DK Academy aspirants who mastered speed-solving and scored 99+ percentiles in JEE.
            </p>
          </div>

          <div className={styles.testimonialsGrid}>
            {VERIFIED_TESTIMONIALS.map((t, idx) => (
              <div key={idx} className={styles.testimonialCard}>
                <div className={styles.testimonialAvatarWrap}>
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className={styles.testimonialAvatar}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (!img.src.includes('RISHABH')) {
                        img.src = '/img/RISHABH%20ANAND.png';
                      }
                    }}
                  />
                </div>
                <p className={styles.testimonialQuote}>&ldquo;{t.quote}&rdquo;</p>
                <div className={styles.testimonialAuthorGroup}>
                  <div className={styles.testimonialAuthorName}>{t.name}</div>
                  <div className={styles.testimonialMetaRow}>
                    <span className={styles.testimonialRankBadge}>{t.score}</span>
                    <span className={styles.testimonialClubBadge}>{t.badge}</span>
                  </div>
                  <div className={styles.testimonialBatchName}>{t.batch}</div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ─── 7. WHY CHOOSE DK ACADEMY? SECTION ("Your Perfect Study Partner") ─── */}
      <section className={styles.whySection} aria-labelledby="why-heading">
        <Container size="wide">
          <div className={styles.sectionHeaderCenter}>
            <span className={styles.sectionEyebrow}>Why Choose DK Academy?</span>
            <h2 id="why-heading" className={styles.sectionTitle}>
              Your Perfect Study Partner
            </h2>
            <p className={styles.sectionSubtitle}>
              Rigorous Kota pedagogy, trademark shortcut methods, and personalized tracking for every student.
            </p>
          </div>

          <div className={styles.whyCardsGrid}>
            {/* Card 1: Expert Faculty */}
            <div className={styles.whyCard}>
              <div className={styles.whyIconBox} style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Rocket size={24} aria-hidden="true" />
              </div>
              <h3 className={styles.whyCardTitle}>Expert Faculty &amp; Quality Content</h3>
              <p className={styles.whyCardDesc}>
                Kota pedagogy led directly by Dharmendra Kumar (DK Sir) with 10+ years of proven coaching excellence.
              </p>
            </div>

            {/* Card 2: Smart Test Series */}
            <div className={styles.whyCard}>
              <div className={styles.whyIconBox} style={{ background: '#ecfdf5', color: '#059669' }}>
                <Target size={24} aria-hidden="true" />
              </div>
              <h3 className={styles.whyCardTitle}>Smart Test Series &amp; Analysis</h3>
              <p className={styles.whyCardDesc}>
                Authentic NTA-standard CBT test series with instant percentile, accuracy analysis, and question insights.
              </p>
            </div>

            {/* Card 3: Track Your Progress */}
            <div className={styles.whyCard}>
              <div className={styles.whyIconBox} style={{ background: '#fffbeb', color: '#d97706' }}>
                <TrendingUp size={24} aria-hidden="true" />
              </div>
              <h3 className={styles.whyCardTitle}>Track Your Progress in Real-Time</h3>
              <p className={styles.whyCardDesc}>
                Real-time analytics monitor chapter completion, problem-solving speed, and areas needing revision.
              </p>
            </div>

            {/* Card 4: Dedicated Support */}
            <div className={styles.whyCard}>
              <div className={styles.whyIconBox} style={{ background: '#eef2ff', color: '#4f46e5' }}>
                <Headphones size={24} aria-hidden="true" />
              </div>
              <h3 className={styles.whyCardTitle}>Dedicated Support Always</h3>
              <p className={styles.whyCardDesc}>
                24/7 doubts clearing through live faculty clinics, student portal resolution, and academic mentor guidance.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── 8. COUNSELOR CALLBACK & SUPPORT STRIP ─── */}
      <section className={styles.counsellorSection} aria-label="Academic Counseling">
        <Container size="wide">
          <div className={styles.counsellorCard}>
            <div className={styles.counsellorGrid}>
              <div>
                <h3 className={styles.counsellorHeading}>Need Help Choosing the Right Batch?</h3>
                <p className={styles.counsellorSubtext}>
                  Speak directly with DK Sir’s senior academic mentors for a personalized study roadmap and batch guidance.
                </p>
                <div className={styles.helplineList}>
                  <span>Direct Desk Helpline:</span>
                  <a href="tel:9325987875">9325987875</a>
                  <span>•</span>
                  <a href="tel:9717159062">9717159062</a>
                </div>
              </div>

              <div>
                <form onSubmit={handleCounsellorSubmit} className={styles.callbackForm}>
                  <input
                    type="tel"
                    value={counsellorPhone}
                    onChange={(e) => setCounsellorPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit mobile number"
                    className={styles.callbackInput}
                    maxLength={10}
                    aria-label="Enter mobile number for callback"
                  />
                  <button type="submit" className={styles.callbackBtn}>
                    <PhoneCall size={15} style={{ marginRight: '6px' }} />
                    <span>Get Callback</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Advanced Filters Modal (Portal to body to prevent any overflow/transform traps) */}
      {isFiltersModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="filters-modal-title"
            onClick={() => setIsFiltersModalOpen(false)}
          >
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 id="filters-modal-title" className={styles.modalTitle}>
                  Filter Batches
                </h3>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setIsFiltersModalOpen(false)}
                  aria-label="Close filters modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.modalBody}>
                {/* Target Class */}
                <div className={styles.filterGroup}>
                  <span className={styles.filterGroupTitle}>Target Class / Aspirant</span>
                  <div className={styles.filterChipGrid}>
                    {(['All', 'Class 11th', 'Class 12th', 'Dropper', 'Class 10th Foundation'] as ClassType[]).map((cVal) => (
                      <button
                        key={cVal}
                        type="button"
                        className={`${styles.filterSelectChip} ${selectedClass === cVal ? styles.activeSelectChip : ''}`}
                        onClick={() => {
                          const nextParams = new URLSearchParams(searchParams);
                          if (cVal === 'All') {
                            nextParams.delete('class');
                            nextParams.delete('category');
                          } else {
                            nextParams.set('class', cVal);
                            nextParams.delete('category');
                          }
                          setSearchParams(nextParams);
                        }}
                      >
                        {cVal}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delivery Mode */}
                <div className={styles.filterGroup}>
                  <span className={styles.filterGroupTitle}>Delivery Mode</span>
                  <div className={styles.filterChipGrid}>
                    {(['All', 'live', 'dlp', 'test-series'] as ModeFilterType[]).map((mVal) => (
                      <button
                        key={mVal}
                        type="button"
                        className={`${styles.filterSelectChip} ${selectedMode === mVal ? styles.activeSelectChip : ''}`}
                        onClick={() => handleModeChange(mVal)}
                      >
                        {mVal === 'All'
                          ? 'All Modes'
                          : mVal === 'live'
                          ? 'Live Batches'
                          : mVal === 'dlp'
                          ? 'Self-Paced / DLP'
                          : 'CBT Test Series'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fee Tier */}
                <div className={styles.filterGroup}>
                  <span className={styles.filterGroupTitle}>Fee Tier</span>
                  <div className={styles.filterChipGrid}>
                    {(['All', 'Free', 'Paid'] as const).map((tierVal) => (
                      <button
                        key={tierVal}
                        type="button"
                        className={`${styles.filterSelectChip} ${selectedTier === tierVal ? styles.activeSelectChip : ''}`}
                        onClick={() => setSelectedTier(tierVal)}
                      >
                        {tierVal === 'All' ? 'All Batches' : tierVal === 'Free' ? 'Free Access' : 'Comprehensive Paid'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div className={styles.filterGroup}>
                  <span className={styles.filterGroupTitle}>Subject Focus</span>
                  <div className={styles.filterChipGrid}>
                    {['All', 'Mathematics', 'Physics', 'Chemistry'].map((subj) => (
                      <button
                        key={subj}
                        type="button"
                        className={`${styles.filterSelectChip} ${selectedSubject === subj ? styles.activeSelectChip : ''}`}
                        onClick={() => {
                          const nextParams = new URLSearchParams(searchParams);
                          if (subj === 'All') nextParams.delete('subject');
                          else nextParams.set('subject', subj.toLowerCase());
                          setSearchParams(nextParams);
                        }}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalResetBtn}
                  onClick={() => {
                    resetAllFilters();
                    setIsFiltersModalOpen(false);
                  }}
                >
                  Reset All
                </button>
                <button
                  type="button"
                  className={styles.modalApplyBtn}
                  onClick={() => setIsFiltersModalOpen(false)}
                >
                  Apply Filters ({filteredCourses.length} Batches)
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Demo Video Modal */}
      {demoModalCourse && (
        <CourseDemoModal
          course={demoModalCourse}
          isOpen={Boolean(demoModalCourse)}
          onClose={() => setDemoModalCourse(null)}
          onOpenSyllabus={(c) => {
            setDemoModalCourse(null);
            setSyllabusModalCourse(c);
          }}
        />
      )}

      {/* Syllabus Modal */}
      {syllabusModalCourse && (
        <CourseSyllabusModal
          course={syllabusModalCourse}
          isOpen={Boolean(syllabusModalCourse)}
          onClose={() => setSyllabusModalCourse(null)}
          onOpenDemo={(c) => {
            setSyllabusModalCourse(null);
            setDemoModalCourse(c);
          }}
        />
      )}

      {/* Floating Portal Dropdowns */}
      {activeDropdown &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className={styles.floatingDropdownPortal}
            style={{
              position: 'fixed',
              top: `${activeDropdown.top}px`,
              ...(activeDropdown.left !== undefined ? { left: `${activeDropdown.left}px` } : {}),
              ...(activeDropdown.right !== undefined ? { right: `${activeDropdown.right}px` } : {}),
              minWidth: `${activeDropdown.minWidth || 185}px`,
              zIndex: 99999
            }}
            role="listbox"
          >
            {activeDropdown.id === 'sort' && (
              <>
                {[
                  { val: 'popularity', label: 'Most Relevant' },
                  { val: 'rating-desc', label: 'Highest Rated' },
                  { val: 'price-asc', label: 'Price: Low to High' },
                  { val: 'price-desc', label: 'Price: High to Low' },
                  { val: 'start-date', label: 'Starting Soonest' }
                ].map((sOption) => (
                  <button
                    key={sOption.val}
                    type="button"
                    className={`${styles.dropdownItem} ${sortBy === sOption.val ? styles.activeDropdownItem : ''}`}
                    onClick={() => {
                      setSortBy(sOption.val as any);
                      closeDropdown();
                    }}
                  >
                    {sOption.label}
                  </button>
                ))}
              </>
            )}
          </div>,
          document.body
        )}
    </main>
  );
};

export default CoursesPage;
