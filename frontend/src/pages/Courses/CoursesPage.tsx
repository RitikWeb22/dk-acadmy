import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Megaphone,
  ShieldCheck,
  ArrowRight,
  Star,
  GraduationCap,
  Zap,
  Building2,
  Target,
  Minus,
  MessageCircle,
  Sparkles,
  Users,
  Trophy,
  TrendingUp,
  Flame
} from 'lucide-react';
import { Container } from '../../components/ui/Container/Container';
import { ReferenceCourseCard } from '../../components/courses/ReferenceCourseCard/ReferenceCourseCard';
import { CourseDemoModal } from '../../components/courses/CourseDemoModal/CourseDemoModal';
import { CourseSyllabusModal } from '../../components/courses/CourseSyllabusModal/CourseSyllabusModal';
import { cmsService, CMS_EVENT_KEY } from '../../services/cmsService';
import {
  getTargetYearLabel,
  STUDENT_TESTIMONIALS,
  FACULTY_HIGHLIGHTS,
  COURSES_FAQS,
  COURSE_COMPARISON_MATRIX
} from '../../data/coursesData';
import type { Course } from '../../types';
import styles from './CoursesPage.module.scss';

type ClassType = 'Class 11th' | 'Class 12th' | 'Dropper' | 'Class 10th Foundation' | 'All';
type ModeFilterType = 'All' | 'live' | 'recorded' | 'test-series' | 'dlp';
type SessionType = 'Session: 2026-27' | 'Session: 2027-28' | 'All Sessions';
type SortOption = 'popularity' | 'rating-desc' | 'price-asc' | 'price-desc' | 'start-date';

export const CoursesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { student, isAuthenticated, enrollCourse } = useStudentAuth();
  const { showToast } = useToast();

  // 2-Column Demo Video Modal & Detailed Syllabus Modal State
  const [demoModalCourse, setDemoModalCourse] = useState<Course | null>(null);
  const [syllabusModalCourse, setSyllabusModalCourse] = useState<Course | null>(null);

  // 1. Initial sync with CMS / MongoDB backend
  const [coursesCatalog, setCoursesCatalog] = useState<Course[]>(() => cmsService.getCourses());

  useEffect(() => {
    // 1. Fetch live courses from MongoDB backend via API
    cmsService.fetchCoursesFromAPI().then((liveCourses) => {
      if (liveCourses && liveCourses.length > 0) {
        setCoursesCatalog(liveCourses);
      }
    }).catch(() => {});

    // 2. Real-time WebSocket / storage event listeners
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

  // Announcement banner dismiss state
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // Filter state derived directly from searchParams (single source of truth for URL sharing & Navbar navigation)
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
    // 1. Prioritize explicit ?class= parameter from Level dropdown/modal
    if (urlClass) {
      if (urlClass.includes('foundation') || urlClass.includes('8-10') || urlClass.includes('8–10') || urlClass.includes('10')) return 'Class 10th Foundation';
      if (urlClass.includes('dropper') || urlClass.includes('repeater')) return 'Dropper';
      if (urlClass.includes('12')) return 'Class 12th';
      if (urlClass.includes('11')) return 'Class 11th';
    }
    // 2. Secondary check for ?category= parameter
    if (urlCategory) {
      if (urlCategory.includes('foundation') || urlCategory.includes('8-10') || urlCategory.includes('8–10') || urlCategory.includes('10')) return 'Class 10th Foundation';
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
  const [selectedSession, setSelectedSession] = useState<SessionType>('Session: 2026-27');
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [selectedLanguage, setSelectedLanguage] = useState<'All' | 'Hinglish' | 'English'>('All');
  const [selectedRating, setSelectedRating] = useState<'All' | 4.8 | 4.5 | 4.0>('All');

  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isRatingDropdownOpen, setIsRatingDropdownOpen] = useState(false);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'All' | 'Free' | 'Paid'>('All');

  // Mutually-exclusive toggle helpers for dropdowns
  const toggleLangDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLangDropdownOpen((prev) => !prev);
    setIsRatingDropdownOpen(false);
    setIsClassDropdownOpen(false);
    setIsSubjectDropdownOpen(false);
    setIsSortDropdownOpen(false);
  };

  const toggleRatingDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRatingDropdownOpen((prev) => !prev);
    setIsLangDropdownOpen(false);
    setIsClassDropdownOpen(false);
    setIsSubjectDropdownOpen(false);
    setIsSortDropdownOpen(false);
  };

  const toggleClassDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsClassDropdownOpen((prev) => !prev);
    setIsLangDropdownOpen(false);
    setIsRatingDropdownOpen(false);
    setIsSubjectDropdownOpen(false);
    setIsSortDropdownOpen(false);
  };

  const toggleSubjectDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSubjectDropdownOpen((prev) => !prev);
    setIsLangDropdownOpen(false);
    setIsRatingDropdownOpen(false);
    setIsClassDropdownOpen(false);
    setIsSortDropdownOpen(false);
  };

  // FAQ Accordion active index
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Form states
  const [counsellorPhone, setCounsellorPhone] = useState('');
  const [counsellorSubmitted, setCounsellorSubmitted] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const ratingRef = useRef<HTMLDivElement>(null);
  const classRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLDivElement>(null);

  // Target Year for the active class & session
  const dynamicTargetYear = useMemo(() => {
    return getTargetYearLabel(selectedClass, selectedSession);
  }, [selectedClass, selectedSession]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortDropdownOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
      if (ratingRef.current && !ratingRef.current.contains(e.target as Node)) {
        setIsRatingDropdownOpen(false);
      }
      if (classRef.current && !classRef.current.contains(e.target as Node)) {
        setIsClassDropdownOpen(false);
      }
      if (subjectRef.current && !subjectRef.current.contains(e.target as Node)) {
        setIsSubjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter & Sort Courses based on ALL dropdowns and URL params
  const filteredCourses = useMemo(() => {
    const catParam = (searchParams.get('category') || searchParams.get('class'))?.toLowerCase();
    const hasExplicitClass = Boolean(searchParams.get('class'));

    return coursesCatalog.filter((course) => {
      // 1. Subject Filter (DK Sir Math Special or explicit subject filter)
      if (selectedSubject !== 'All') {
        const subjLower = selectedSubject.toLowerCase();
        const hasExplicitSubject = course.subjects?.some((s) => s.toLowerCase() === subjLower);
        const inTitle = course.title?.toLowerCase().includes(subjLower);
        const inDesc = course.description?.toLowerCase().includes(subjLower);
        // Comprehensive JEE courses cover Physics, Chemistry, AND Mathematics
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

      // 2. Category Filter from URL / Sub-nav (only if not overridden by explicit class param)
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

      // 3. Class / Level Filter if selected via tab/chip or Level dropdown
      if (selectedClass !== 'All') {
        const tClass = (course.targetClass || '').toLowerCase();
        const cLevel = ((course as any).level || '').toLowerCase();
        const combined = `${tClass} ${cLevel}`;
        if (selectedClass === 'Class 11th' && !combined.includes('11')) return false;
        if (selectedClass === 'Class 12th' && !combined.includes('12')) return false;
        if (selectedClass === 'Dropper' && !combined.includes('drop') && !combined.includes('repeat')) return false;
        if (selectedClass === 'Class 10th Foundation' && !combined.includes('10') && !combined.includes('found') && !combined.includes('9') && !combined.includes('8')) return false;
      }

      // 4. Delivery Mode Filter (Live / DLP / Test Series)
      if (selectedMode !== 'All') {
        if (selectedMode === 'dlp') {
          if (course.courseType !== 'dlp' && course.mode !== 'Self-Paced' && course.courseType !== 'recorded') return false;
        } else if (selectedMode === 'test-series') {
          if (course.courseType !== 'test-series' && course.mode !== 'Online Test Series') return false;
        } else if (selectedMode === 'live') {
          if (course.courseType !== 'live' && course.mode !== 'Live' && course.mode !== 'Live + Recorded') return false;
        }
      }

      // 5. Tier Filter (Free vs Paid)
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

      // 8. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inTitle = course.title?.toLowerCase().includes(query);
        const inDesc = course.description?.toLowerCase().includes(query);
        const inFeatures = course.features?.some((f) => f.toLowerCase().includes(query));
        const inClass = course.targetClass?.toLowerCase().includes(query);
        const inSubjects = course.subjects?.some((s) => s.toLowerCase().includes(query));
        if (!inTitle && !inDesc && !inFeatures && !inClass && !inSubjects) return false;
      }

      return true;
    }).map((c) => ({
      ...c,
      targetYear: c.targetYear || dynamicTargetYear
    })).sort((a, b) => {
      if (sortBy === 'rating-desc') {
        const rA = (a as any).rating || 4.8;
        const rB = (b as any).rating || 4.8;
        return rB - rA;
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
      // Default: Popularity
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return (b.enrolledCount || 0) - (a.enrolledCount || 0);
    });
  }, [coursesCatalog, selectedClass, selectedMode, selectedSubject, selectedTier, selectedLanguage, selectedRating, sortBy, dynamicTargetYear, searchParams, searchQuery]);

  // ─── Responsive Pagination: Exactly 3 Rows per page ───
  // Large Desktop (>1240px: 4 cols) = 12 items (3 rows)
  // Standard/Laptop (901px-1240px: 3 cols) = 9 items (3 rows)
  // Tablet (601px-900px: 2 cols) = 6 items (3 rows)
  // Mobile (<=600px: 1 col) = 6 items
  const [itemsPerPage, setItemsPerPage] = useState<number>(() => {
    if (typeof window === 'undefined') return 12;
    if (window.innerWidth > 1240) return 12;
    if (window.innerWidth > 900) return 9;
    return 6;
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const targetItems = width > 1240 ? 12 : width > 900 ? 9 : 6;
      setItemsPerPage((prev) => (prev !== targetItems ? targetItems : prev));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Total pages & safe current page calculation
  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Reset to page 1 whenever any filter or search changes
  const filterKey = `${selectedClass}|${selectedMode}|${selectedSubject}|${selectedTier}|${selectedLanguage}|${selectedRating}|${sortBy}|${searchQuery}|${searchParams.toString()}`;
  const prevFilterKey = useRef(filterKey);

  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      prevFilterKey.current = filterKey;
      setCurrentPage(1);
    }
  }, [filterKey]);

  // Paginated course slice
  const paginatedCourses = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return filteredCourses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCourses, safeCurrentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const headingEl = document.getElementById('courses-grid-heading');
    if (headingEl) {
      headingEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Generate page numbers with ellipsis
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

  // Applied filter count for badge
  const activeFiltersCount =
    (selectedMode === 'All' ? 0 : 1) +
    (selectedSubject === 'All' ? 0 : 1) +
    (selectedTier === 'All' ? 0 : 1) +
    (selectedClass === 'All' ? 0 : 1) +
    (selectedLanguage === 'All' ? 0 : 1) +
    (selectedRating === 'All' ? 0 : 1) +
    (searchQuery.trim() ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedSession('Session: 2026-27');
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

  // Dynamic Page H1 Heading based on selection
  const getDynamicHeading = () => {
    if (selectedSubject === 'Mathematics') return 'DK Sir IIT JEE Mathematics Special Batches';
    const cat = urlCategory;
    if (cat?.includes('crash')) return 'JEE Rapid Crash Courses & Rank Booster Batches';
    if (cat?.includes('foundation')) return 'Class 8–10 Foundation & Olympiad Batches';
    if (cat?.includes('dropper')) return 'JEE Dropper & Repeater Batches: Target JEE 2027';
    if (cat?.includes('11') || selectedClass === 'Class 11th') return 'JEE Main & Advanced Courses for Class 11th';
    if (cat?.includes('12') || selectedClass === 'Class 12th') return 'JEE Main & Advanced Courses for Class 12th';
    if (cat?.includes('main')) return 'JEE Main & Advanced Comprehensive Batches';
    if (selectedClass === 'Class 10th Foundation') return 'Foundation & Early Olympiad Courses';
    return 'All Online JEE & Foundation Courses';
  };

  // Dynamic Subtitle based on selection
  const getDynamicSubtitle = () => {
    if (selectedSubject === 'Mathematics') {
      return 'Mentored directly by DK Sir (Dharmendra Kumar). Master concept clarity, time-saving graphical tricks, 20-to-30-second shortcut techniques, and chapter-wise PYQ solutions for Class 11th, 12th & Droppers.';
    }
    const cat = urlCategory;
    if (cat?.includes('crash')) {
      return 'Intensive high-yield problem solving, full syllabus revisions, and exam-simulation CBT tests designed to jumpstart your percentile in the final weeks.';
    }
    if (cat?.includes('foundation') || selectedClass === 'Class 10th Foundation') {
      return 'Build solid mathematical aptitude, science concepts, and Olympiad problem-solving skills (IOQM, PRMO, NSEJS) early under DK Sir and Kota faculty.';
    }
    if (cat?.includes('dropper') || selectedClass === 'Dropper') {
      return 'High-tempo 10-month intensive rank improvement programs covering Class 11 & 12 syllabus with DK Sir’s 20-30s shortcuts and weekly all-India CBT mock test simulations.';
    }
    if (cat?.includes('11') || selectedClass === 'Class 11th') {
      return 'Complete 2-year JEE foundation and Advanced mastery program for Class 11th aspirants targeting IIT JEE 2028 with Kota-pedagogy curriculum.';
    }
    if (cat?.includes('12') || selectedClass === 'Class 12th') {
      return 'Class 12th board + JEE Advanced rank accelerator curriculum with complete Class 11 revision, daily DPPs, and all-India test series.';
    }
    if (cat?.includes('main')) {
      return 'Targeting top IIT ranks with Kota-pedagogy curriculum, daily problem sets (DPP), live doubt counters, and all-India CBT mock test simulations.';
    }
    return `Targeting ${dynamicTargetYear} with Kota-pedagogy curriculum, daily problem sets (DPP), and all-India CBT mock test simulations.`;
  };

  // Breadcrumb label
  const getBreadcrumbLabel = () => {
    if (selectedSubject === 'Mathematics') return 'DK Sir Math Special';
    const cat = urlCategory;
    if (cat?.includes('crash')) return 'Crash Courses';
    if (cat?.includes('foundation') || selectedClass === 'Class 10th Foundation') return 'Class 8–10 Foundation';
    if (cat?.includes('dropper') || selectedClass === 'Dropper') return 'Droppers & Repeaters (Target JEE 2027)';
    if (cat?.includes('11') || selectedClass === 'Class 11th') return 'Class 11th JEE';
    if (cat?.includes('12') || selectedClass === 'Class 12th') return 'Class 12th JEE';
    if (cat?.includes('main')) return selectedClass === 'All' ? `JEE Main & Advanced (${dynamicTargetYear})` : `${selectedClass} JEE Main & Advanced`;
    return selectedClass === 'All' ? 'All Batches' : `${selectedClass} (${dynamicTargetYear})`;
  };

  // Quick category tabs list
  const categoryChips = [
    { id: 'all', label: 'All Batches', isMath: false, isCrash: false, classVal: 'All' },
    { id: 'c11', label: 'Class 11', isMath: false, isCrash: false, classVal: 'Class 11th' },
    { id: 'c12', label: 'Class 12', isMath: false, isCrash: false, classVal: 'Class 12th' },
    { id: 'dropper', label: 'Droppers', isMath: false, isCrash: false, classVal: 'Dropper' },
    { id: 'crash', label: 'Crash Courses', isMath: false, isCrash: true, classVal: 'All' },
    { id: 'foundation', label: 'Foundation (8–10)', isMath: false, isCrash: false, classVal: 'Class 10th Foundation' },
    { id: 'math-special', label: 'DK Sir Math Special', isMath: true, isCrash: false, classVal: 'All' }
  ];

  // Quick Trending Search Pills for instant discovery
  const trendingSearchTags = [
    { label: 'Calculus by DK Sir', type: 'subject', value: 'Mathematics' },
    { label: 'Class 11th Batches', type: 'category', value: 'Class 11th' },
    { label: 'Droppers 2027', type: 'category', value: 'Dropper' },
    { label: 'Kota DLP Modules', type: 'mode', value: 'dlp' },
    { label: 'All-India CBT Test Series', type: 'mode', value: 'test-series' },
    { label: 'Class 12th JEE', type: 'category', value: 'Class 12th' }
  ];

  const handleTrendingTagClick = (tag: typeof trendingSearchTags[0]) => {
    const nextParams = new URLSearchParams();
    if (tag.type === 'subject') {
      nextParams.set('subject', tag.value);
    } else if (tag.type === 'category') {
      nextParams.set('category', tag.value);
    } else if (tag.type === 'mode') {
      nextParams.set('mode', tag.value);
    }
    setSearchParams(nextParams);
    setSearchQuery('');
  };

  const handleChipClick = (chip: typeof categoryChips[0]) => {
    const nextParams = new URLSearchParams();
    if (chip.isMath) {
      nextParams.set('subject', 'Mathematics');
    } else if (chip.isCrash) {
      nextParams.set('category', 'Crash Course');
    } else if (chip.classVal !== 'All') {
      if (chip.classVal === 'Class 10th Foundation') nextParams.set('category', 'Foundation');
      else if (chip.classVal === 'Dropper') nextParams.set('category', 'Dropper');
      else if (chip.classVal === 'Class 12th') nextParams.set('category', 'Class 12th');
      else if (chip.classVal === 'Class 11th') nextParams.set('category', 'Class 11th');
      else nextParams.set('category', 'JEE Main');
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

  // Structured Data Schema for Course Listing
  const jsonLdSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${getDynamicHeading()} • DK Academy JEE`,
    description: `Comprehensive IIT JEE Main and Advanced batches for ${selectedClass} (${dynamicTargetYear}). Live classes, Kota DLP modules, and CBT test series.`,
    itemListElement: filteredCourses.map((c, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'Course',
        name: c.title,
        description: c.description,
        provider: {
          '@type': 'EducationalOrganization',
          name: 'DK Academy JEE',
          sameAs: 'https://dkacademyjee.com'
        },
        offers: {
          '@type': 'Offer',
          price: c.numericPrice,
          priceCurrency: 'INR',
          category: c.targetClass,
          availability: 'https://schema.org/InStock'
        }
      }
    }))
  };

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      {/* Top Promotional Announcement Banner */}
      {!isBannerDismissed && (
        <aside className={styles.topPromoBanner} aria-label="Special scholarship announcement">
          <Container size="wide">
            <div className={styles.promoInner}>
              <Link to="/test-series" className={styles.promoContent}>
                <span className={styles.promoTag}>
                  <Megaphone size={14} aria-hidden="true" />
                  <span>Real Practice Begins!</span>
                </span>
                <span className={styles.promoText}>
                  Up to 90% Scholarship on DK Academy Admission Test • Next CBT Slot Available This Sunday
                </span>
                <ChevronRight size={16} className={styles.promoChevron} aria-hidden="true" />
              </Link>
              <button
                type="button"
                className={styles.dismissBannerBtn}
                onClick={() => setIsBannerDismissed(true)}
                aria-label="Dismiss announcement banner"
              >
                <X size={15} />
              </button>
            </div>
          </Container>
        </aside>
      )}

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
            <li>
              <Link to="/courses">Courses</Link>
            </li>
            <li>
              <ChevronRight size={13} className={styles.breadcrumbDivider} aria-hidden="true" />
            </li>
            <li aria-current="page" className={styles.activeBreadcrumb}>
              {getBreadcrumbLabel()}
            </li>
          </ol>
        </Container>
      </nav>

      {/* Header Hero Section */}
      <section className={styles.headerSection}>
        <Container size="wide">
          <div className={styles.heroMainGrid}>
            <div className={styles.pageHeadingLeft}>
              {/* Admissions & Pedagogy Status Badge */}
              <div className={styles.eyebrowBadge}>
                <span className={styles.livePulseDot} aria-hidden="true">
                  <span className={styles.pulseRing} />
                  <span className={styles.pulseCore} />
                </span>
                <span className={styles.eyebrowHighlight}>Admissions Open 2026–27</span>
                <span className={styles.eyebrowDivider}>•</span>
                <span className={styles.eyebrowPedagogy}>
                  <Sparkles size={13} className={styles.eyebrowSparkle} aria-hidden="true" />
                  Kota Pedagogy in Janakpuri, New Delhi
                </span>
              </div>

              {/* Title & Subtitle */}
              <h1 className={styles.pageTitle}>{getDynamicHeading()}</h1>
              <p className={styles.pageSubtitle}>{getDynamicSubtitle()}</p>

              {/* Enhanced Interactive Search Console */}
              <div className={styles.searchHeroContainer}>
                <div className={styles.heroSearchWrap}>
                  <div className={styles.searchIconBox}>
                    <Search size={18} className={styles.searchIcon} aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by topic (Calculus, Mechanics, Organic), batch name, or faculty..."
                    className={styles.heroSearchInput}
                    aria-label="Search courses by keyword"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      className={styles.clearSearchBtn}
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search query"
                    >
                      <X size={15} />
                    </button>
                  ) : (
                    <span className={styles.searchBadgeHint}>Search</span>
                  )}
                </div>

                {/* Popular Trending Search Chips */}
                <div className={styles.trendingTagsRow}>
                  <span className={styles.trendingLabel}>
                    <Flame size={13} className={styles.flameIcon} aria-hidden="true" />
                    <span>Popular:</span>
                  </span>
                  <div className={styles.trendingList}>
                    {trendingSearchTags.map((tag) => (
                      <button
                        key={tag.label}
                        type="button"
                        className={styles.trendingTagChip}
                        onClick={() => handleTrendingTagClick(tag)}
                        title={`Filter by ${tag.label}`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Redesigned 4-Metric Trust & Social Proof Cards Grid */}
          <div className={styles.socialProofGrid} aria-label="DK Academy Trust Statistics">
            {/* 1. Students Enrolled */}
            <div className={styles.statCard}>
              <div className={`${styles.statIconBadge} ${styles.iconBadgeBlue}`}>
                <Users size={22} aria-hidden="true" />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumberRow}>
                  <span className={styles.statNumber}>12,400+</span>
                </div>
                <span className={styles.statLabel}>Students Enrolled</span>
                <span className={styles.statSubText}>Active Pan-India & Offline</span>
              </div>
            </div>

            {/* 2. IITian Selections */}
            <div className={styles.statCard}>
              <div className={`${styles.statIconBadge} ${styles.iconBadgeAmber}`}>
                <Trophy size={22} aria-hidden="true" />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumberRow}>
                  <span className={styles.statNumber}>1,420+</span>
                </div>
                <span className={styles.statLabel}>IITian Selections</span>
                <span className={styles.statSubText}>Top 500 AIRs in Advanced</span>
              </div>
            </div>

            {/* 3. Student Rating */}
            <div className={styles.statCard}>
              <div className={`${styles.statIconBadge} ${styles.iconBadgeGold}`}>
                <Star size={22} fill="#f59e0b" color="#f59e0b" aria-hidden="true" />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumberRow}>
                  <span className={styles.statNumber}>4.9</span>
                  <span className={styles.statMax}>/ 5.0</span>
                </div>
                <span className={styles.statLabel}>Avg. Student Rating</span>
                <span className={styles.statSubText}>3,850+ Verified Reviews</span>
              </div>
            </div>

            {/* 4. Recommendation Rate */}
            <div className={styles.statCard}>
              <div className={`${styles.statIconBadge} ${styles.iconBadgeEmerald}`}>
                <TrendingUp size={22} aria-hidden="true" />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumberRow}>
                  <span className={styles.statNumber}>94%</span>
                </div>
                <span className={styles.statLabel}>Recommendation Rate</span>
                <span className={styles.statSubText}>Alumni & Parent Endorsed</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Sticky Filter Bar (Matching Reference Screenshot) */}
      <section className={styles.stickyFilterSection} aria-label="Course Filters Bar">
        <Container size="wide">
          <div className={styles.filterToolbar}>
            {/* Scrollable Pills & Dropdowns Row */}
            <div className={styles.filterPillsScroll} role="toolbar" aria-label="Course Filters">
              {/* 1. "All filters" Button with Sliders Icon */}
              <button
                type="button"
                className={`${styles.allFiltersBtn} ${activeFiltersCount > 0 ? styles.allFiltersActive : ''}`}
                onClick={() => setIsFiltersModalOpen(true)}
                aria-label={`Open all filters (${activeFiltersCount} active)`}
              >
                <SlidersHorizontal size={14} aria-hidden="true" />
                <span>All filters</span>
                {activeFiltersCount > 0 && (
                  <span className={styles.filterCountBadge}>{activeFiltersCount}</span>
                )}
              </button>

              {/* 2. Fast Category Pills */}
              {categoryChips.map((chip) => {
                const isSelected = chip.isMath
                  ? selectedSubject === 'Mathematics'
                  : chip.isCrash
                  ? Boolean(urlCategory?.includes('crash'))
                  : selectedSubject !== 'Mathematics' && !urlCategory?.includes('crash') && selectedClass === chip.classVal;

                return (
                  <button
                    key={chip.id}
                    type="button"
                    className={`${styles.filterPill} ${isSelected ? styles.filterPillActive : ''}`}
                    onClick={() => handleChipClick(chip)}
                  >
                    {chip.label}
                  </button>
                );
              })}

              {/* 3. Fast Mode Pills */}
              <button
                type="button"
                className={`${styles.filterPill} ${selectedMode === 'test-series' ? styles.filterPillActive : ''}`}
                onClick={() => handleModeChange(selectedMode === 'test-series' ? 'All' : 'test-series')}
              >
                <Award size={13} aria-hidden="true" />
                <span>Practice Tests</span>
              </button>

              <button
                type="button"
                className={`${styles.filterPill} ${selectedMode === 'live' ? styles.filterPillActive : ''}`}
                onClick={() => handleModeChange(selectedMode === 'live' ? 'All' : 'live')}
              >
                <Video size={13} aria-hidden="true" />
                <span>Live Batches</span>
              </button>

              <button
                type="button"
                className={`${styles.filterPill} ${selectedMode === 'dlp' ? styles.filterPillActive : ''}`}
                onClick={() => handleModeChange(selectedMode === 'dlp' ? 'All' : 'dlp')}
              >
                <BookOpen size={13} aria-hidden="true" />
                <span>Self-Paced / DLP</span>
              </button>

              {/* 4. Dropdown Filter: Language */}
              <div className={styles.dropdownWrapper} ref={langRef}>
                <button
                  type="button"
                  className={`${styles.dropdownPill} ${selectedLanguage !== 'All' ? styles.dropdownPillActive : ''}`}
                  onClick={toggleLangDropdown}
                  aria-expanded={isLangDropdownOpen}
                >
                  <span>{selectedLanguage === 'All' ? 'Language' : selectedLanguage}</span>
                  <ChevronDown size={13} aria-hidden="true" />
                </button>
                {isLangDropdownOpen && (
                  <div className={styles.floatingDropdown} role="listbox">
                    {['All', 'Hinglish', 'English'].map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        className={`${styles.dropdownItem} ${selectedLanguage === lang ? styles.activeDropdownItem : ''}`}
                        onClick={() => {
                          setSelectedLanguage(lang as any);
                          setIsLangDropdownOpen(false);
                        }}
                      >
                        {lang === 'All' ? 'All Languages' : lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Dropdown Filter: Ratings */}
              <div className={styles.dropdownWrapper} ref={ratingRef}>
                <button
                  type="button"
                  className={`${styles.dropdownPill} ${selectedRating !== 'All' ? styles.dropdownPillActive : ''}`}
                  onClick={toggleRatingDropdown}
                  aria-expanded={isRatingDropdownOpen}
                >
                  <span>{selectedRating === 'All' ? 'Ratings' : `${selectedRating} ★ & up`}</span>
                  <ChevronDown size={13} aria-hidden="true" />
                </button>
                {isRatingDropdownOpen && (
                  <div className={styles.floatingDropdown} role="listbox">
                    <button
                      type="button"
                      className={`${styles.dropdownItem} ${selectedRating === 'All' ? styles.activeDropdownItem : ''}`}
                      onClick={() => {
                        setSelectedRating('All');
                        setIsRatingDropdownOpen(false);
                      }}
                    >
                      All Ratings
                    </button>
                    <button
                      type="button"
                      className={`${styles.dropdownItem} ${selectedRating === 4.8 ? styles.activeDropdownItem : ''}`}
                      onClick={() => {
                        setSelectedRating(4.8);
                        setIsRatingDropdownOpen(false);
                      }}
                    >
                      ★ 4.8 &amp; up (Top Rated)
                    </button>
                    <button
                      type="button"
                      className={`${styles.dropdownItem} ${selectedRating === 4.5 ? styles.activeDropdownItem : ''}`}
                      onClick={() => {
                        setSelectedRating(4.5);
                        setIsRatingDropdownOpen(false);
                      }}
                    >
                      ★ 4.5 &amp; up
                    </button>
                    <button
                      type="button"
                      className={`${styles.dropdownItem} ${selectedRating === 4.0 ? styles.activeDropdownItem : ''}`}
                      onClick={() => {
                        setSelectedRating(4.0);
                        setIsRatingDropdownOpen(false);
                      }}
                    >
                      ★ 4.0 &amp; up
                    </button>
                  </div>
                )}
              </div>

              {/* 6. Dropdown Filter: Level / Class */}
              <div className={styles.dropdownWrapper} ref={classRef}>
                <button
                  type="button"
                  className={`${styles.dropdownPill} ${selectedClass !== 'All' ? styles.dropdownPillActive : ''}`}
                  onClick={toggleClassDropdown}
                  aria-expanded={isClassDropdownOpen}
                >
                  <span>{selectedClass === 'All' ? 'Level' : selectedClass}</span>
                  <ChevronDown size={13} aria-hidden="true" />
                </button>
                {isClassDropdownOpen && (
                  <div className={styles.floatingDropdown} role="listbox">
                    {(['All', 'Class 11th', 'Class 12th', 'Dropper', 'Class 10th Foundation'] as ClassType[]).map((cls) => (
                      <button
                        key={cls}
                        type="button"
                        className={`${styles.dropdownItem} ${selectedClass === cls ? styles.activeDropdownItem : ''}`}
                        onClick={() => {
                          const nextParams = new URLSearchParams(searchParams);
                          if (cls === 'All') {
                            nextParams.delete('category');
                            nextParams.delete('class');
                          } else {
                            nextParams.set('class', cls);
                            nextParams.delete('category');
                          }
                          setSearchParams(nextParams);
                          setIsClassDropdownOpen(false);
                        }}
                      >
                        {cls === 'All' ? 'All Levels' : cls}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 7. Dropdown Filter: Subject */}
              <div className={styles.dropdownWrapper} ref={subjectRef}>
                <button
                  type="button"
                  className={`${styles.dropdownPill} ${selectedSubject !== 'All' ? styles.dropdownPillActive : ''}`}
                  onClick={toggleSubjectDropdown}
                  aria-expanded={isSubjectDropdownOpen}
                >
                  <span>{selectedSubject === 'All' ? 'Subject' : selectedSubject}</span>
                  <ChevronDown size={13} aria-hidden="true" />
                </button>
                {isSubjectDropdownOpen && (
                  <div className={styles.floatingDropdown} role="listbox">
                    {['All', 'Mathematics', 'Physics', 'Chemistry'].map((subj) => (
                      <button
                        key={subj}
                        type="button"
                        className={`${styles.dropdownItem} ${selectedSubject === subj ? styles.activeDropdownItem : ''}`}
                        onClick={() => {
                          const nextParams = new URLSearchParams(searchParams);
                          if (subj === 'All') {
                            nextParams.delete('subject');
                          } else {
                            nextParams.set('subject', subj.toLowerCase());
                          }
                          setSearchParams(nextParams);
                          setIsSubjectDropdownOpen(false);
                        }}
                      >
                        {subj === 'All' ? 'All Subjects' : subj}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Results Count & Detached Sort Bar */}
      <section className={styles.resultsInfoSection}>
        <Container size="wide">
          <div className={styles.resultsInfoRow}>
            <div className={styles.resultsLeftCol}>
              <span className={styles.resultsCount}>
                Showing{' '}
                <strong>
                  {filteredCourses.length === 0
                    ? 0
                    : totalPages > 1
                    ? `${(safeCurrentPage - 1) * itemsPerPage + 1}–${Math.min(
                        safeCurrentPage * itemsPerPage,
                        filteredCourses.length
                      )}`
                    : filteredCourses.length}
                </strong>{' '}
                of <strong>{filteredCourses.length}</strong>{' '}
                {filteredCourses.length === 1 ? 'course' : 'courses'}
              </span>

              {activeFiltersCount > 0 && (
                <div className={styles.activeTagsWrap}>
                  {searchQuery && (
                    <span className={styles.activeTag}>
                      Search: "{searchQuery}"
                      <button type="button" onClick={() => setSearchQuery('')} aria-label="Remove search filter">
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {selectedSubject !== 'All' && (
                    <span className={styles.activeTag}>
                      Subject: {selectedSubject}
                      <button
                        type="button"
                        onClick={() => {
                          const next = new URLSearchParams(searchParams);
                          next.delete('subject');
                          setSearchParams(next);
                        }}
                        aria-label="Remove subject filter"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {selectedClass !== 'All' && (
                    <span className={styles.activeTag}>
                      Class: {selectedClass}
                      <button
                        type="button"
                        onClick={() => {
                          const next = new URLSearchParams(searchParams);
                          next.delete('class');
                          next.delete('category');
                          setSearchParams(next);
                        }}
                        aria-label="Remove class filter"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {selectedMode !== 'All' && (
                    <span className={styles.activeTag}>
                      Mode: {selectedMode === 'live' ? 'Live Online' : selectedMode === 'test-series' ? 'Practice Tests' : 'DLP'}
                      <button type="button" onClick={() => handleModeChange('All')} aria-label="Remove mode filter">
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {selectedRating !== 'All' && (
                    <span className={styles.activeTag}>
                      Rating: {selectedRating}★+
                      <button type="button" onClick={() => setSelectedRating('All')} aria-label="Remove rating filter">
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {selectedLanguage !== 'All' && (
                    <span className={styles.activeTag}>
                      Language: {selectedLanguage}
                      <button type="button" onClick={() => setSelectedLanguage('All')} aria-label="Remove language filter">
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  <button type="button" className={styles.resetAllBtn} onClick={resetAllFilters}>
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Detached Sort Dropdown: positioned cleanly on the right above course grid */}
            <div className={styles.sortWrapper} ref={sortRef}>
              <span className={styles.sortLabel}>Sort by:</span>
              <button
                type="button"
                className={styles.sortBtn}
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                aria-expanded={isSortDropdownOpen}
                aria-haspopup="listbox"
                aria-label={`Sort courses, currently: ${sortBy}`}
              >
                <span className={styles.sortCurrent}>
                  {sortBy === 'popularity'
                    ? 'Most Relevant'
                    : sortBy === 'rating-desc'
                    ? 'Highest Rated'
                    : sortBy === 'price-asc'
                    ? 'Price: Low to High'
                    : sortBy === 'price-desc'
                    ? 'Price: High to Low'
                    : 'Starting Soonest'}
                </span>
                <ChevronDown size={13} aria-hidden="true" />
              </button>

              {isSortDropdownOpen && (
                <div className={styles.floatingDropdown} role="listbox">
                  <button
                    type="button"
                    className={`${styles.dropdownItem} ${sortBy === 'popularity' ? styles.activeDropdownItem : ''}`}
                    onClick={() => {
                      setSortBy('popularity');
                      setIsSortDropdownOpen(false);
                    }}
                  >
                    Most Relevant
                  </button>
                  <button
                    type="button"
                    className={`${styles.dropdownItem} ${sortBy === 'rating-desc' ? styles.activeDropdownItem : ''}`}
                    onClick={() => {
                      setSortBy('rating-desc');
                      setIsSortDropdownOpen(false);
                    }}
                  >
                    Highest Rated
                  </button>
                  <button
                    type="button"
                    className={`${styles.dropdownItem} ${sortBy === 'price-asc' ? styles.activeDropdownItem : ''}`}
                    onClick={() => {
                      setSortBy('price-asc');
                      setIsSortDropdownOpen(false);
                    }}
                  >
                    Price: Low to High
                  </button>
                  <button
                    type="button"
                    className={`${styles.dropdownItem} ${sortBy === 'price-desc' ? styles.activeDropdownItem : ''}`}
                    onClick={() => {
                      setSortBy('price-desc');
                      setIsSortDropdownOpen(false);
                    }}
                  >
                    Price: High to Low
                  </button>
                  <button
                    type="button"
                    className={`${styles.dropdownItem} ${sortBy === 'start-date' ? styles.activeDropdownItem : ''}`}
                    onClick={() => {
                      setSortBy('start-date');
                      setIsSortDropdownOpen(false);
                    }}
                  >
                    Starting Soonest
                  </button>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Main Course Listing 3-Column Grid */}
      <section className={styles.courseSection} aria-labelledby="courses-grid-heading">
        <Container size="wide">
          {/* Section H2 Heading preserving heading outline */}
          <h2 id="courses-grid-heading" className={styles.courseSectionHeading}>
            {selectedClass === 'All' ? 'All Batches & Available Programs' : `${selectedClass} Batches & Programs`}
          </h2>
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

              {/* 3-Row Pagination Bar */}
              {totalPages > 1 && (
                <nav className={styles.paginationCard} aria-label="Course list pagination">
                  <div className={styles.paginationInfo}>
                    <span>
                      Showing <strong>{(safeCurrentPage - 1) * itemsPerPage + 1}</strong>–
                      <strong>{Math.min(safeCurrentPage * itemsPerPage, filteredCourses.length)}</strong> of{' '}
                      <strong>{filteredCourses.length}</strong> courses
                    </span>
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
                            className={`${styles.pageNumberBtn} ${
                              safeCurrentPage === page ? styles.activePage : ''
                            }`}
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
                Try selecting a different category, clearing search terms, or resetting all filters to see available batches.
              </p>
              <button type="button" className={styles.emptyResetBtn} onClick={resetAllFilters}>
                Reset all filters
              </button>
            </div>
          )}
        </Container>
      </section>

      {/* ─── 1. Academic Counsellor Lead Capture Section ─── */}
      <section className={styles.counsellorSection} id="counsellor-section-anchor">
        <Container size="wide">
          <div className={styles.counsellorCard}>
            <div className={styles.counsellorGrid}>
              {/* Left Column: Value Prop & Mentors */}
              <div className={styles.counsellorLeft}>
                <div className={styles.liveCounselorPill}>
                  <span className={styles.pulsingGreenDot} />
                  <span>Senior Academic Mentors Available Now</span>
                </div>

                <h2 className={styles.counsellorHeading}>
                  Confused about which batch fits your JEE preparation?
                </h2>

                <p className={styles.counsellorSubtext}>
                  Get a personalized 1-on-1 study roadmap, syllabus pacing strategy, and fee scholarship assessment directly from DK Sir’s senior Kota mentoring team.
                </p>

                {/* Key Benefits List */}
                <div className={styles.counsellorPerks}>
                  <div className={styles.perkItem}>
                    <div className={styles.perkCheckCircle}>
                      <CheckCircle2 size={16} />
                    </div>
                    <span>Personalized 1-on-1 study roadmap &amp; target year timeline</span>
                  </div>
                  <div className={styles.perkItem}>
                    <div className={styles.perkCheckCircle}>
                      <CheckCircle2 size={16} />
                    </div>
                    <span>DK Sir scholarship waiver &amp; merit score evaluation</span>
                  </div>
                  <div className={styles.perkItem}>
                    <div className={styles.perkCheckCircle}>
                      <CheckCircle2 size={16} />
                    </div>
                    <span>Delhi Janakpuri offline center batch seat availability</span>
                  </div>
                </div>

                {/* Direct Hotline Strip */}
                <div className={styles.directHelplineStrip}>
                  <div className={styles.phoneIconBox}>
                    <Phone size={16} />
                  </div>
                  <div className={styles.helplineTextGroup}>
                    <span className={styles.helplineLabel}>Direct Janakpuri Desk Hotline:</span>
                    <div className={styles.phoneNumbersList}>
                      <a href="tel:9325987875" className={styles.phoneLink}>9325987875</a>
                      <span className={styles.phoneDivider}>•</span>
                      <a href="tel:9717159062" className={styles.phoneLink}>9717159062</a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: High-Conversion Instant Callback Card */}
              <div className={styles.counsellorRight}>
                <div className={styles.callbackBox}>
                  <div className={styles.callbackBoxHeader}>
                    <h3 className={styles.callbackBoxTitle}>Request Free Counselor Callback</h3>
                    <p className={styles.callbackBoxSubtitle}>
                      Enter your mobile number. A senior mentor will call back within 15 minutes.
                    </p>
                  </div>

                  <form onSubmit={handleCounsellorSubmit} className={styles.callbackForm}>
                    <div className={styles.callbackInputGroup}>
                      <label htmlFor="counsellor-mobile-input" className={styles.callbackInputLabel}>
                        Mobile Number
                      </label>
                      <div className={styles.callbackPhoneRow}>
                        <div className={styles.countryCodeBadge}>+91</div>
                        <input
                          id="counsellor-mobile-input"
                          type="tel"
                          value={counsellorPhone}
                          onChange={(e) => setCounsellorPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="10-digit mobile number"
                          className={styles.callbackTextInput}
                          aria-label="Enter 10-digit mobile number for callback"
                          maxLength={10}
                        />
                      </div>
                    </div>

                    <button type="submit" className={styles.callbackSubmitBtn}>
                      <PhoneCall size={16} />
                      <span>Request Instant Callback</span>
                      <ArrowRight size={16} />
                    </button>
                  </form>

                  {counsellorSubmitted && (
                    <div className={styles.counsellorSuccessNotice} role="alert">
                      <CheckCircle2 size={18} />
                      <span>Callback requested! Our admissions counsellor will call you within 15 minutes.</span>
                    </div>
                  )}

                  <div className={styles.callbackOrDivider}>
                    <span>OR CHAT INSTANTLY</span>
                  </div>

                  <a
                    href="https://wa.me/918826444207?text=Hi%20DK%20Academy%2C%20I%20need%20academic%20counseling%20for%20JEE%20batches"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.whatsappCallbackBtn}
                  >
                    <MessageCircle size={17} />
                    <span>Chat with Academic Counselor on WhatsApp</span>
                  </a>

                  <div className={styles.privacyGuaranteeStrip}>
                    <ShieldCheck size={14} />
                    <span>100% Confidential · Zero Spam · Direct Mentorship</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── 2. Why Choose DK Academy Feature Strip ─── */}
      <section className={styles.whyDkAcademySection}>
        <Container size="wide">
          <div className={styles.sectionHeaderCenter}>
            <div className={styles.eyebrowBadge}>
              <Sparkles size={13} />
              <span>KOTA PEDAGOGY IN DELHI</span>
            </div>
            <h2 className={styles.sectionTitleCenter}>Why 12,400+ Aspirants Choose DK Academy</h2>
            <p className={styles.sectionDescCenter}>
              Founded by Dharmendra Kumar (DK Sir), renowned across Kota and Delhi for trademark 20–30 second mathematical shortcuts, rigorous Kota problem sets, and individual concept engineering.
            </p>
          </div>

          <div className={styles.whyCardsGrid}>
            {[
              {
                title: 'Mentored by DK Sir (Dharmendra Kumar)',
                desc: 'Led directly by renowned IIT JEE Mathematics mentor DK Sir, specializing in conceptual engineering and 20-to-30-second problem-solving techniques.',
                icon: GraduationCap,
                pill: 'Founder & Kota Pedagogy',
                highlight: '20+ Yrs Track Record',
                theme: 'blue'
              },
              {
                title: 'Short Tricks & Speed Challenges',
                desc: 'Master time-saving methods and shortcut techniques designed to solve complex multi-concept JEE Advanced problems with maximum precision.',
                icon: Zap,
                pill: 'Math Speed Multiplier',
                highlight: '20–30s Solving Method',
                theme: 'amber'
              },
              {
                title: 'Online + Offline Janakpuri Center',
                desc: 'Attend live online batches from anywhere or physical classroom sessions at our modern coaching center in Janakpuri, New Delhi.',
                icon: Building2,
                pill: 'Hybrid Flexibility',
                highlight: 'Delhi Center + Live App',
                theme: 'violet'
              },
              {
                title: 'Chapter-wise PYQs & 1:1 Mentorship',
                desc: 'Exhaustive chapter-by-chapter Previous Year Question (PYQ) video solutions, solved DPPs, and individual one-on-one progress tracking.',
                icon: Target,
                pill: 'Rank Engineering',
                highlight: '15+ Years Solved Archives',
                theme: 'emerald'
              }
            ].map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div key={idx} className={`${styles.whyCard} ${styles[`whyCard_${item.theme}`]}`}>
                  <div className={styles.whyCardHeader}>
                    <div className={`${styles.whyIconContainer} ${styles[`iconContainer_${item.theme}`]}`}>
                      <IconComp size={22} strokeWidth={1.8} />
                    </div>
                    <span className={`${styles.whyPillBadge} ${styles[`pillBadge_${item.theme}`]}`}>
                      {item.pill}
                    </span>
                  </div>

                  <h3 className={styles.whyCardTitle}>{item.title}</h3>
                  <p className={styles.whyCardDesc}>{item.desc}</p>

                  <div className={styles.whyCardFooter}>
                    <span className={styles.whyHighlightText}>
                      <CheckCircle2 size={14} className={styles.whyHighlightCheck} />
                      {item.highlight}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ─── 3. Course Format Comparison Table ─── */}
      <section className={styles.compareSection}>
        <Container size="wide">
          <div className={styles.sectionHeaderCenter}>
            <div className={styles.eyebrowBadge}>
              <SlidersHorizontal size={13} />
              <span>CHOOSE YOUR LEARNING PATH</span>
            </div>
            <h2 className={styles.sectionTitleCenter}>Comparison: Live vs Self-Study vs Test Series</h2>
            <p className={styles.sectionDescCenter}>
              Compare pedagogy features, material formats, doubt-solving support, and pricing across our 3 delivery modes.
            </p>
          </div>

          {/* Desktop Comparison Table */}
          <div className={styles.tableResponsiveWrapper}>
            <table className={styles.comparisonTable}>
              <thead>
                <tr>
                  <th className={styles.featureColHeader}>
                    <span className={styles.featureHeaderLabel}>Features &amp; Deliverables</span>
                    <span className={styles.featureHeaderSub}>Complete breakdown</span>
                  </th>

                  {/* Column 1: Live Classroom (Featured) */}
                  <th className={`${styles.planColHeader} ${styles.featuredColHeader}`}>
                    <div className={styles.popularBadge}>
                      <Sparkles size={11} />
                      <span>MOST POPULAR · RECOMMENDED</span>
                    </div>
                    <div className={styles.planHeaderTitle}>Live Classroom Batch</div>
                    <div className={styles.planHeaderPrice}>From ₹48,000/yr</div>
                    <p className={styles.planHeaderSub}>Online live classes + offline Janakpuri access</p>
                    <button
                      type="button"
                      onClick={() => {
                        handleModeChange('live');
                        document.getElementById('courses-grid-heading')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={styles.planHeaderCtaBtnPrimary}
                    >
                      <span>Explore Live Batches</span>
                      <ArrowRight size={14} />
                    </button>
                  </th>

                  {/* Column 2: Self-Study DLP */}
                  <th className={styles.planColHeader}>
                    <div className={styles.standardBadge}>FULL SYLLABUS DLP</div>
                    <div className={styles.planHeaderTitle}>Self-Study DLP Pack</div>
                    <div className={styles.planHeaderPrice}>From ₹18,000</div>
                    <p className={styles.planHeaderSub}>Recorded video archive + 18 printed books</p>
                    <button
                      type="button"
                      onClick={() => {
                        handleModeChange('dlp');
                        document.getElementById('courses-grid-heading')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={styles.planHeaderCtaBtnSecondary}
                    >
                      <span>View DLP Pack</span>
                      <ArrowRight size={14} />
                    </button>
                  </th>

                  {/* Column 3: Online CBT Test Series */}
                  <th className={styles.planColHeader}>
                    <div className={styles.standardBadge}>ALL INDIA CBT</div>
                    <div className={styles.planHeaderTitle}>Online CBT Test Series</div>
                    <div className={styles.planHeaderPrice}>From ₹2,999</div>
                    <p className={styles.planHeaderSub}>NTA-level CBT mock tests + video solutions</p>
                    <button
                      type="button"
                      onClick={() => {
                        handleModeChange('test-series');
                        document.getElementById('courses-grid-heading')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={styles.planHeaderCtaBtnSecondary}
                    >
                      <span>Explore Test Series</span>
                      <ArrowRight size={14} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(COURSE_COMPARISON_MATRIX.rows || []).map((row, idx) => {
                  const isLast = idx === (COURSE_COMPARISON_MATRIX.rows || []).length - 1;
                  return (
                    <tr key={idx} className={`${styles.tableRow} ${isLast ? styles.feeHighlightRow : ''}`}>
                      <td className={styles.featureCell}>
                        <div className={styles.featureTitleWrap}>
                          <span className={styles.featureNameText}>{row.feature}</span>
                        </div>
                      </td>

                      {/* Live Column Cell */}
                      <td className={`${styles.planCell} ${styles.featuredCell}`}>
                        {row.live === '—' ? (
                          <span className={styles.dashMuted}>
                            <Minus size={14} />
                          </span>
                        ) : (
                          <div className={styles.cellContentWrap}>
                            <CheckCircle2 size={16} className={styles.cellCheckIcon} />
                            <span className={styles.cellBoldText}>{row.live}</span>
                          </div>
                        )}
                      </td>

                      {/* DLP Column Cell */}
                      <td className={styles.planCell}>
                        {row.dlp === '—' ? (
                          <span className={styles.dashMuted}>
                            <Minus size={14} />
                          </span>
                        ) : (
                          <div className={styles.cellContentWrap}>
                            <span className={styles.cellRegularText}>{row.dlp}</span>
                          </div>
                        )}
                      </td>

                      {/* Test Column Cell */}
                      <td className={styles.planCell}>
                        {row.test === '—' ? (
                          <span className={styles.dashMuted}>
                            <Minus size={14} />
                          </span>
                        ) : (
                          <div className={styles.cellContentWrap}>
                            <span className={styles.cellRegularText}>{row.test}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      {/* Verified Student Testimonials */}
      <section className={styles.studentTestimonialsSection}>
        <Container size="wide">
          <div className={styles.sectionHeaderCenter}>
            <span className={styles.preTitle}>Proven Track Record</span>
            <h2 className={styles.sectionTitleCenter}>Success Stories from DK Academy IITians</h2>
            <p className={styles.sectionDescCenter}>
              Hear from our top rankers who mastered speed solving and secured admission to top IITs and NITs.
            </p>
          </div>

          <div className={styles.testimonialsGrid}>
            {STUDENT_TESTIMONIALS.map((t, idx) => (
              <div key={idx} className={styles.testimonialCard}>
                <div className={styles.testimonialHeader}>
                  <img src={t.avatar} alt={t.name} className={styles.studentPhoto} />
                  <div className={styles.studentInfo}>
                    <div className={styles.nameRow}>
                      <span className={styles.studentName}>{t.name}</span>
                      <span className={styles.verifiedBadge}>
                        <ShieldCheck size={12} aria-hidden="true" />
                        <span>Verified</span>
                      </span>
                    </div>
                    <span className={styles.studentRank}>{t.rank}</span>
                    <span className={styles.studentBatch}>{t.batch}</span>
                  </div>
                </div>
                <p className={styles.quoteText}>&ldquo;{t.quote}&rdquo;</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Expert Faculty Highlights */}
      <section className={styles.facultySection}>
        <Container size="wide">
          <div className={styles.sectionHeaderCenter}>
            <span className={styles.preTitle}>Master Mentors</span>
            <h2 className={styles.sectionTitleCenter}>Learn Directly from Kota Veterans &amp; IITians</h2>
            <p className={styles.sectionDescCenter}>
              Our faculty members bring 15+ years of Kota coaching pedagogy to give you an unfair advantage in JEE.
            </p>
          </div>

          <div className={styles.facultyGrid}>
            {FACULTY_HIGHLIGHTS.map((f, idx) => (
              <div key={idx} className={styles.facultyCard}>
                <img src={f.avatar} alt={f.name} className={styles.facultyPhoto} />
                <h3 className={styles.facultyName}>{f.name}</h3>
                <span className={styles.facultyRole}>{f.role}</span>
                <span className={styles.facultyExp}>{f.experience}</span>
                <span className={styles.facultySpecPill}>{f.specialty}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ Accordion Section */}
      <section className={styles.faqSection}>
        <Container size="wide">
          <div className={styles.sectionHeaderCenter}>
            <span className={styles.preTitle}>Got Questions?</span>
            <h2 className={styles.sectionTitleCenter}>Frequently Asked Questions</h2>
            <p className={styles.sectionDescCenter}>
              Everything you need to know about batch admissions, payment options, study materials, and demo lectures.
            </p>
          </div>

          <div className={styles.faqList}>
            {COURSES_FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className={styles.faqItem}>
                  <button
                    type="button"
                    className={styles.faqQuestionBtn}
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      size={18}
                      className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <div className={styles.faqAnswerBody}>
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Advanced Filters Modal */}
      {isFiltersModalOpen && (
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
                Filter JEE Batches
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
              {/* Filter Group: Target Class */}
              <div className={styles.filterGroup}>
                <span className={styles.filterGroupTitle}>Target Class / Aspirant Type</span>
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

              {/* Filter Group: Delivery Mode */}
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
                        ? 'Live Classroom'
                        : mVal === 'dlp'
                        ? 'Self-Study DLP'
                        : 'CBT Test Series'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Group: Fee Tier */}
              <div className={styles.filterGroup}>
                <span className={styles.filterGroupTitle}>Course Fee Tier</span>
                <div className={styles.filterChipGrid}>
                  {(['All', 'Free', 'Paid'] as const).map((tierVal) => (
                    <button
                      key={tierVal}
                      type="button"
                      className={`${styles.filterSelectChip} ${selectedTier === tierVal ? styles.activeSelectChip : ''}`}
                      onClick={() => setSelectedTier(tierVal)}
                    >
                      {tierVal === 'All' ? 'All Batches' : tierVal === 'Free' ? 'Free Masterclasses' : 'Comprehensive Paid'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Group: Subject */}
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
                      {subj === 'All' ? 'All Subjects' : subj}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Group: Ratings */}
              <div className={styles.filterGroup}>
                <span className={styles.filterGroupTitle}>Minimum Student Rating</span>
                <div className={styles.filterChipGrid}>
                  {[
                    { label: 'All Ratings', val: 'All' as const },
                    { label: '★ 4.8 & up (Top Rated)', val: 4.8 as const },
                    { label: '★ 4.5 & up', val: 4.5 as const },
                    { label: '★ 4.0 & up', val: 4.0 as const }
                  ].map((rItem) => (
                    <button
                      key={String(rItem.val)}
                      type="button"
                      className={`${styles.filterSelectChip} ${selectedRating === rItem.val ? styles.activeSelectChip : ''}`}
                      onClick={() => setSelectedRating(rItem.val)}
                    >
                      {rItem.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Group: Language */}
              <div className={styles.filterGroup}>
                <span className={styles.filterGroupTitle}>Instruction Language</span>
                <div className={styles.filterChipGrid}>
                  {(['All', 'Hinglish', 'English'] as const).map((lVal) => (
                    <button
                      key={lVal}
                      type="button"
                      className={`${styles.filterSelectChip} ${selectedLanguage === lVal ? styles.activeSelectChip : ''}`}
                      onClick={() => setSelectedLanguage(lVal)}
                    >
                      {lVal === 'All' ? 'All Languages' : lVal}
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
        </div>
      )}

      {/* 2-Column Demo Video Modal */}
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

      {/* Detailed Syllabus Curriculum Modal */}
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
    </main>
  );
};

export default CoursesPage;
