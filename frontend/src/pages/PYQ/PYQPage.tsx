import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Home,
  ListOrdered,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Zap,
  Video,
  FileText,
  ShieldCheck,
  Download,
  Play,
  Search,
  BookOpen,
  Filter,
  AlertCircle,
  RotateCcw,
  Clock,
  Trophy,
  Calendar,
  BarChart2,
  Star
} from 'lucide-react';
import type { PYQExam, Subject, PYQUserResponse, PYQQuestion } from '../../types';
import { Container } from '../../components/ui/Container/Container';
import { PracticeProgress } from '../../components/pyq/PracticeProgress/PracticeProgress';
import { QuestionNavigator } from '../../components/pyq/QuestionNavigator/QuestionNavigator';
import { QuestionPracticeView } from '../../components/pyq/QuestionPracticeView/QuestionPracticeView';
import { PYQQuestionCard } from '../../components/pyq/PYQQuestionCard/PYQQuestionCard';
import { PYQEmptyState } from '../../components/pyq/PYQEmptyState/PYQEmptyState';
import { PYQVideoModal } from '../../components/pyq/PYQVideoModal/PYQVideoModal';
import { PYQCourseUnlockModal } from '../../components/pyq/PYQCourseUnlockModal/PYQCourseUnlockModal';
import { cmsService, CMS_EVENT_KEY } from '../../services/cmsService';
import { apiClient } from '../../services/apiClient';
import { paymentService } from '../../services/paymentService';
import { useStudentAuth } from '../../context/AuthContext';
import styles from './PYQPage.module.scss';

export interface LiveDppPyqSet {
  id: string;
  _id?: string;
  title: string;
  slug?: string;
  moduleType: string;
  subject: string;
  chapter?: string;
  examTarget?: string;
  badgeCode?: string;
  categoryLabel?: string;
  isFree?: boolean;
  price?: number;
  pdfUrl?: string;
  videoUrl?: string;
  videoWalkthroughUrl?: string;
  questionsCount?: number;
  solutionNote?: string;
  status?: string;
  scheduledDate?: string;
  questions: any[];
}

export const PYQPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlExam = searchParams.get('exam');
  const urlSubject = searchParams.get('subject');
  const urlSetId = searchParams.get('set');

  const { student, isAuthenticated } = useStudentAuth();

  // All PYQ sets fetched directly from MongoDB /api/v1/dpp-pyq
  const [pyqSets, setPyqSets] = useState<LiveDppPyqSet[]>([]);
  const [isLoadingSets, setIsLoadingSets] = useState<boolean>(true);

  // Active Selected Set ID ("uske andar jaake pr questions jaisa hai")
  const [selectedSetId, setSelectedSetId] = useState<string | null>(urlSetId);

  // Filters for Catalog View
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<'All' | Subject>(() => {
    if (urlSubject === 'Mathematics') return 'Mathematics';
    if (urlSubject === 'Physics') return 'Physics';
    if (urlSubject === 'Chemistry') return 'Chemistry';
    return 'All';
  });
  const [selectedExam, setSelectedExam] = useState<'All' | 'JEE Main' | 'JEE Advanced'>(() => {
    if (urlExam === 'JEE Advanced') return 'JEE Advanced';
    if (urlExam === 'JEE Main') return 'JEE Main';
    return 'All';
  });
  const [selectedYear, setSelectedYear] = useState<'All' | number>('All');
  const [selectedAccess, setSelectedAccess] = useState<'All' | 'Free' | 'Pro'>('All');

  // Dynamic PYQ Years list synced with Admin
  const [adminYears, setAdminYears] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('dk_admin_pyq_years');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [2026, 2025, 2024, 2023, 2022, 2021, 2020];
  });

  // 1-second interval for real-time live scheduled paper countdowns
  const [nowTime, setNowTime] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCountdown = (scheduledDate?: string) => {
    if (!scheduledDate) return null;
    const target = new Date(scheduledDate).getTime();
    if (isNaN(target)) return null;
    const diff = target - nowTime;
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return {
      days,
      hours,
      minutes,
      seconds,
      text: `${days > 0 ? `${days}d ` : ''}${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
    };
  };

  // Practice session state for questions inside an opened set
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
  const [responses, setResponses] = useState<Record<string, PYQUserResponse>>({});

  // Video and Unlock modal state
  const [activeVideoQuestion, setActiveVideoQuestion] = useState<PYQQuestion | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [lockedTargetNumber, setLockedTargetNumber] = useState<number | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync all live PYQ sets from backend API
  const fetchLiveSets = async () => {
    setIsLoadingSets(true);
    try {
      const res = await apiClient.get<any>('/dpp-pyq');
      const list = Array.isArray(res) ? res : res?.data || [];
      const pyqsOnly = (Array.isArray(list) ? list : []).filter((item: any) => {
        const modType = String(item.moduleType || item.type || '').toUpperCase();
        return modType === 'PYQ';
      });

      if (pyqsOnly.length > 0) {
        setPyqSets(pyqsOnly);
      } else {
        // Fallback to sample sets if empty
        const sampleSets: LiveDppPyqSet[] = [
          {
            id: 'dpp-pyq-3',
            title: 'JEE Main 2018–2025: Definite Integration Archive',
            moduleType: 'PYQ',
            subject: 'Mathematics',
            chapter: 'Definite Integration',
            examTarget: 'JEE Main 2025',
            badgeCode: 'PYQ • MTH',
            categoryLabel: 'Maths PYQ',
            isFree: true,
            price: 0,
            questionsCount: 4,
            solutionNote: '4 with DK Sir 20s tricks',
            questions: []
          }
        ];
        setPyqSets(sampleSets);
      }
    } catch (err) {
      console.warn('Failed to fetch live PYQ sets:', err);
    } finally {
      setIsLoadingSets(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchLiveSets();

    const handleSync = () => {
      if (isMounted) fetchLiveSets();
    };

    window.addEventListener(CMS_EVENT_KEY, handleSync);
    window.addEventListener('dk_dpp_pyq_created', handleSync);
    window.addEventListener('dk_dpp_pyq_updated', handleSync);

    const handleYearsUpdate = (e: any) => {
      if (e?.detail?.years && Array.isArray(e.detail.years) && isMounted) {
        setAdminYears(e.detail.years);
      }
    };
    window.addEventListener('dk_pyq_years_updated', handleYearsUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener(CMS_EVENT_KEY, handleSync);
      window.removeEventListener('dk_dpp_pyq_created', handleSync);
      window.removeEventListener('dk_dpp_pyq_updated', handleSync);
      window.removeEventListener('dk_pyq_years_updated', handleYearsUpdate);
    };
  }, []);

  // Compute all available archive years from admin + database sets + questions
  const availableYears = useMemo(() => {
    const years = new Set<number>(adminYears);
    pyqSets.forEach((set) => {
      if (set.examTarget) {
        const matches = set.examTarget.match(/\b(19\d\d|20\d\d)\b/g);
        if (matches) matches.forEach((m) => years.add(Number(m)));
      }
      if (Array.isArray(set.questions)) {
        set.questions.forEach((q: any) => {
          const y = Number(q.year) || (q.examYear ? parseInt(String(q.examYear).replace(/\D/g, ''), 10) : 0);
          if (y > 1990 && y < 2050) years.add(y);
        });
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [adminYears, pyqSets]);

  // Sync selectedSetId with URL
  useEffect(() => {
    const currentParam = searchParams.get('set');
    if (currentParam !== selectedSetId) {
      const nextParams = new URLSearchParams(searchParams);
      if (selectedSetId) {
        nextParams.set('set', selectedSetId);
      } else {
        nextParams.delete('set');
      }
      setSearchParams(nextParams, { replace: true });
    }
  }, [selectedSetId]);

  // Find the actively selected PYQ set
  const activeSet = useMemo(() => {
    if (!selectedSetId) return null;
    return pyqSets.find(
      (s) => String(s.id) === String(selectedSetId) || String(s._id) === String(selectedSetId)
    ) || null;
  }, [selectedSetId, pyqSets]);

  // Convert active set questions to PYQQuestion format for solving view
  const setQuestions = useMemo<PYQQuestion[]>(() => {
    if (!activeSet || !Array.isArray(activeSet.questions) || activeSet.questions.length === 0) {
      return [];
    }

    return activeSet.questions
      .filter((q: any) => {
        const stmt = String(q.statement || '').toLowerCase();
        return !stmt.includes('enter the new problem statement here');
      })
      .map((q: any, idx: number) => {
        const yearNum =
          Number(q.year) ||
          (q.examYear ? parseInt(String(q.examYear).replace(/\D/g, ''), 10) : 0) ||
          (activeSet.examTarget ? parseInt(String(activeSet.examTarget).replace(/\D/g, ''), 10) : 0) ||
          2026;

        const targetExam = String(activeSet.examTarget || '').toLowerCase().includes('advanced')
          ? 'JEE Advanced'
          : 'JEE Main';

        return {
          id: `${activeSet.id || activeSet._id || 'pyq'}_q_${q.id || idx + 1}`,
          exam: targetExam as any,
          year: yearNum,
          subject: (activeSet.subject === 'Physics' || activeSet.subject === 'Chemistry'
            ? activeSet.subject
            : 'Mathematics') as any,
          chapter: activeSet.chapter || q.topic || 'General Practice',
          topic: q.topic || activeSet.title,
          type: 'Single Choice MCQ',
          marks: '+4 / -1',
          statement: q.statement || 'Problem Statement',
          options:
            Array.isArray(q.options) && q.options.length > 0
              ? q.options.map((opt: any, optIdx: number) => ({
                  id: opt.key || opt.id || ['A', 'B', 'C', 'D'][optIdx] || 'A',
                  text: opt.text || ''
                }))
              : [
                  { id: 'A', text: 'Option A' },
                  { id: 'B', text: 'Option B' },
                  { id: 'C', text: 'Option C' },
                  { id: 'D', text: 'Option D' }
                ],
          correctAnswer: q.correctKey || q.correctAnswer || 'A',
          formulaKey: q.dkSirShortcut || 'DK Sir 20s Inspection Shortcut Rule',
          explanation: q.stepSolution || q.explanation || 'Detailed step-by-step solution.',
          isFree: activeSet.isFree !== false ? true : (q.isFree === true || idx === 0),
          youtubeUrl: q.videoUrl || q.youtubeUrl || activeSet.videoUrl || activeSet.videoWalkthroughUrl || '',
          videoUrl: q.videoUrl || activeSet.videoUrl || '',
          pdfUrl: q.pdfUrl || activeSet.pdfUrl || '',
          courseId: activeSet.id || activeSet._id || 'jee-pyq-archive-mastery',
          courseName: activeSet.title,
          videoDuration: q.videoDuration || ''
        };
      });
  }, [activeSet]);

  // Course enrollment & paper unlock status for student
  const [unlockedSetIds, setUnlockedSetIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dk_unlocked_pyq_sets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isEnrolled = useMemo(() => {
    const setId = activeSet?.id || activeSet?._id || '';
    if (unlockedSetIds.includes(setId)) return true;
    if (!student?.enrolledCourseIds) return false;
    return (
      student.enrolledCourseIds.includes(setId) ||
      student.enrolledCourseIds.includes('jee-pyq-archive-mastery') ||
      student.enrolledCourseIds.includes('jee-main-advanced-2yr-ultimate') ||
      student.enrolledCourseIds.includes('jee-rankers-crash-course-2026')
    );
  }, [student, activeSet, unlockedSetIds]);

  // Access rule for individual question inside active set
  const isQuestionAccessible = (q: PYQQuestion, index: number): boolean => {
    if (activeSet?.isFree !== false) return true;
    if (isEnrolled) return true;
    if (q.isFree === true) return true;
    if (q.isFree === false) return false;
    // If the entire paper is marked locked/paid and this question is not explicitly free, lock it
    if (activeSet?.isFree === false) return false;
    return false;
  };

  const [modalTargetSet, setModalTargetSet] = useState<LiveDppPyqSet | null>(null);

  const handleEnrollCourse = async () => {
    if (!isAuthenticated || !student) {
      showToast('Please log in to your student account to unlock PYQ Papers.');
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    const targetSet = modalTargetSet || activeSet;
    if (!targetSet) return;
    const price = targetSet.price ?? 499;
    const setId = targetSet.id || targetSet._id || 'pyq-paper';
    const paperTitle = targetSet.title || 'PYQ Complete Paper';

    try {
      await paymentService.initiateCourseCheckout({
        amount: price,
        courseId: setId,
        courseTitle: paperTitle,
        studentName: student.name || 'Aspirant',
        studentEmail: student.email || 'student@dkacademy.in',
        studentPhone: student.phone || '9999999999',
        onSuccess: (paymentId: string) => {
          setIsUnlockModalOpen(false);
          setUnlockedSetIds((prev) => {
            const next = Array.from(new Set([...prev, setId]));
            try {
              localStorage.setItem('dk_unlocked_pyq_sets', JSON.stringify(next));
            } catch {}
            return next;
          });
          showToast(`🎉 Payment of ₹${price} Successful (Txn #${paymentId.slice(-6)})! Complete paper unlocked.`);
        },
        onError: (errMsg: string) => {
          // STRICT RULE: DO NOT UNLOCK IF USER CLOSES, CANCELS OR FAILS PAYMENT
          showToast(errMsg && !errMsg.includes('closed') ? `Payment failed: ${errMsg}` : 'Payment not completed. Paper remains locked.');
        }
      });
    } catch {
      showToast('Payment window closed or cancelled. Paper remains locked.');
    }
  };

  const handleOpenUnlockModal = (qNumber?: number, specificSet?: LiveDppPyqSet) => {
    if (!isAuthenticated || !student) {
      showToast('Please log in to your student account to unlock PYQ Papers.');
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    if (specificSet) {
      setModalTargetSet(specificSet);
    } else {
      setModalTargetSet(activeSet);
    }
    setLockedTargetNumber(qNumber);
    setIsUnlockModalOpen(true);
  };
  

  // Filter sets in catalog view
  const filteredSets = useMemo(() => {
    return pyqSets.filter((set) => {
      if (selectedSubject !== 'All' && set.subject !== selectedSubject) {
        return false;
      }
      if (selectedExam !== 'All') {
        const examTargetStr = String(set.examTarget || '').toLowerCase();
        if (selectedExam === 'JEE Advanced' && !examTargetStr.includes('advanced')) {
          return false;
        }
        if (selectedExam === 'JEE Main' && examTargetStr.includes('advanced')) {
          return false;
        }
      }
      if (selectedYear !== 'All') {
        const yrStr = String(selectedYear);
        const matchesTarget = String(set.examTarget || '').includes(yrStr);
        const matchesTitle = String(set.title || '').includes(yrStr);
        const matchesQuestions =
          Array.isArray(set.questions) &&
          set.questions.some(
            (q: any) =>
              String(q.year || '').includes(yrStr) ||
              String(q.examYear || '').includes(yrStr)
          );
        if (!matchesTarget && !matchesTitle && !matchesQuestions) {
          return false;
        }
      }
      if (selectedAccess === 'Free' && set.isFree === false && (set.price || 0) > 0) {
        return false;
      }
      if (selectedAccess === 'Pro' && (set.isFree !== false || (set.price || 0) === 0)) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = (set.title || '').toLowerCase().includes(q);
        const matchesChapter = (set.chapter || '').toLowerCase().includes(q);
        const matchesSubject = (set.subject || '').toLowerCase().includes(q);
        const matchesExam = (set.examTarget || '').toLowerCase().includes(q);
        return matchesTitle || matchesChapter || matchesSubject || matchesExam;
      }
      return true;
    });
  }, [pyqSets, selectedSubject, selectedExam, selectedYear, selectedAccess, searchQuery]);

  // User response handlers inside active set
  const handleSelectOption = (questionId: string, optionId: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        selectedOption: optionId,
        isEvaluated: false
      }
    }));
  };

  const handleCheckAnswer = (questionId: string, correctAnswer: string) => {
    setResponses((prev) => {
      const current = prev[questionId];
      if (!current?.selectedOption) return prev;
      return {
        ...prev,
        [questionId]: {
          ...current,
          isEvaluated: true,
          isCorrect: current.selectedOption === correctAnswer
        }
      };
    });
  };

  const handleResetQuestion = (questionId: string) => {
    setResponses((prev) => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });
  };

  const handleToggleMarkForReview = (questionId: string) => {
    setResponses((prev) => {
      const current = prev[questionId] || { isEvaluated: false };
      return {
        ...prev,
        [questionId]: {
          ...current,
          isMarkedForReview: !current.isMarkedForReview
        }
      };
    });
  };

  // Progress calculations for active set
  const questionIds = useMemo(() => setQuestions.map((q) => q.id), [setQuestions]);

  const stats = useMemo(() => {
    let answered = 0;
    let correct = 0;
    let evaluated = 0;

    questionIds.forEach((id) => {
      const resp = responses[id];
      if (resp?.selectedOption) answered += 1;
      if (resp?.isEvaluated) {
        evaluated += 1;
        if (resp?.isCorrect) correct += 1;
      }
    });

    return { answered, correct, evaluated };
  }, [questionIds, responses]);

  const currentQuestion =
    activeQuestionIndex !== null && setQuestions[activeQuestionIndex]
      ? setQuestions[activeQuestionIndex]
      : null;

  return (
    <main className={styles.page}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={styles.floatingToast} role="alert">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <section className={styles.headerSection}>
        <Container size="wide">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <ol className={styles.breadcrumbList}>
              <li className={styles.breadcrumbItem}>
                <Link to="/" className={styles.breadcrumbLink}>
                  <Home size={14} className={styles.homeIcon} />
                  <span>Home</span>
                </Link>
              </li>
              <li className={styles.breadcrumbSeparator} aria-hidden="true">
                <ChevronRight size={14} />
              </li>
              <li className={styles.breadcrumbItem}>
                <span
                  className={activeSet ? styles.breadcrumbLink : styles.breadcrumbCurrent}
                  onClick={() => {
                    if (activeSet) {
                      setSelectedSetId(null);
                      setActiveQuestionIndex(null);
                    }
                  }}
                  style={{ cursor: activeSet ? 'pointer' : 'default' }}
                >
                  PYQ Bank
                </span>
              </li>
              {activeSet && (
                <>
                  <li className={styles.breadcrumbSeparator} aria-hidden="true">
                    <ChevronRight size={14} />
                  </li>
                  <li className={styles.breadcrumbItem}>
                    <span className={styles.breadcrumbCurrent} aria-current="page">
                      {activeSet.title}
                    </span>
                  </li>
                </>
              )}
            </ol>
          </nav>

          {/* Hero Section Content */}
          {!activeSet ? (
            <div className={styles.heroGrid}>
              {/* Left Column: Heading, Pedagogy, CTAs */}
              <div className={styles.heroLeftCol}>
                <div className={styles.heroEyebrowBadge}>
                  <Star size={13} className={styles.eyebrowStarIcon} fill="#eab308" />
                  <span>Official PYQ Question Bank</span>
                </div>

                <h1 className={styles.heroHeading}>
                  Practice Previous Year{' '}
                  <span className={styles.heroHeadingAccent}>
                    JEE
                    <svg
                      className={styles.headingWaveUnderline}
                      viewBox="0 0 120 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 8C25 2 45 10 70 4C95 -2 108 8 118 6"
                        stroke="#2563EB"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>{' '}
                  Questions
                </h1>

                <p className={styles.heroDescription}>
                  Solve past JEE Main &amp; Advanced papers authored by senior faculty.
                  Master speed with DK Sir 20-30s inspection shortcuts, step-by-step solutions, and video explanations.
                </p>

                {/* 4 Feature Pills */}
                <div className={styles.pedagogyPillsRow}>
                  <div className={styles.pedagogyPill}>
                    <Zap size={14} className={styles.pillIconBlue} aria-hidden="true" />
                    <span>DK Sir 20-30s Inspection Tricks</span>
                  </div>
                  <div className={styles.pedagogyPill}>
                    <Play size={13} className={styles.pillIconSky} aria-hidden="true" fill="currentColor" />
                    <span>Video Solution Walkthroughs</span>
                  </div>
                  <div className={styles.pedagogyPill}>
                    <Download size={14} className={styles.pillIconEmerald} aria-hidden="true" />
                    <span>Downloadable PDF Solutions</span>
                  </div>
                  <div className={styles.pedagogyPill}>
                    <CheckCircle2 size={14} className={styles.pillIconGreen} aria-hidden="true" />
                    <span>Direct Admit Verified Content</span>
                  </div>
                </div>

                {/* Action CTAs */}
                <div className={styles.heroCtaRow}>
                  <button
                    type="button"
                    className={styles.heroPrimaryBtn}
                    onClick={() => {
                      const el = document.getElementById('pyq-catalog-anchor');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <Play size={14} fill="currentColor" />
                    <span>Chapter-Wise PYQs</span>
                    <ArrowRight size={14} />
                  </button>

                  <Link to="/dpp" className={styles.heroSecondaryBtn}>
                    <BarChart2 size={15} />
                    <span>Daily Practice Problems (DPP)</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: 3D Illustration & Floating Score Badge */}
              <div className={styles.heroRightCol}>
                <div className={styles.heroVisualCard}>
                  {/* Organic wave backdrop aura */}
                  <div className={styles.heroWaveBackdrop} aria-hidden="true" />

                  {/* Score Higher Badge at top right */}
                  <div className={styles.scoreHigherBadge}>
                    <span>Score Higher</span>
                    <svg width="52" height="10" viewBox="0 0 52 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M2 7C14 2.5 32 8.5 50 3" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>

                  {/* 3D Illustrated Paper Sheet */}
                  <img
                    src="/images/jee-pyq-hero-sheet.png"
                    alt="JEE Previous Year Papers 3D Illustration - DK Academy"
                    className={styles.heroSheetImage}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Active Set Top Title when solving a set */
            <div className={styles.activeSetIntroHeader}>
              <div className={styles.activeSetBadges}>
                <span className={styles.examTargetBadge}>
                  {activeSet.examTarget || 'JEE Main'}
                </span>
                <span
                  className={
                    activeSet.subject === 'Physics'
                      ? styles.subjectPillPhy
                      : activeSet.subject === 'Chemistry'
                      ? styles.subjectPillChem
                      : styles.subjectPillMath
                  }
                >
                  {activeSet.subject}
                </span>
              </div>
              <h1 className={styles.activeSetPageTitle}>{activeSet.title}</h1>
            </div>
          )}
        </Container>
      </section>

      {/* ─── MAIN CONTENT: CATALOG VIEW vs ACTIVE SET WORKSPACE ─── */}
      <section className={styles.workspaceSection}>
        <Container size="wide">
          {!activeSet ? (
            /* ═══════════════════════════════════════════════════════════════
               1. CATALOG VIEW: Direct PYQ Titles Created by Admin
               ═══════════════════════════════════════════════════════════════ */
            <div className={styles.catalogSection}>
              {/* Filter & Search Bar Card */}
              <div id="pyq-catalog-anchor" className={styles.searchFilterCard}>
                {/* Search Bar Row */}
                <div className={styles.searchBarRow}>
                  <div className={styles.searchInputGroup}>
                    <Search size={18} className={styles.searchFieldIcon} />
                    <input
                      type="text"
                      className={styles.searchInputField}
                      placeholder="Search PYQ papers by title, chapter, or year..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className={styles.clearSearchBtn}
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles.searchSubmitBtn}
                    onClick={() => {
                      const el = document.getElementById('pyq-catalog-anchor');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <span>Search</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* Dropdowns Toolbar Row */}
                <div className={styles.filterDropdownsRow}>
                  {/* Dropdown 1: Target Exam */}
                  <div className={styles.filterDropdownItem}>
                    <label htmlFor="pyq-exam-select" className={styles.filterLabelWrap}>
                      <Trophy size={14} className={styles.filterIconGold} />
                      <span>Exam Target</span>
                    </label>
                    <select
                      id="pyq-exam-select"
                      className={styles.filterSelectControl}
                      value={selectedExam}
                      onChange={(e) => setSelectedExam(e.target.value as any)}
                    >
                      <option value="All">All Exams (Main &amp; Adv)</option>
                      <option value="JEE Main">JEE Main</option>
                      <option value="JEE Advanced">JEE Advanced</option>
                    </select>
                  </div>

                  {/* Dropdown 2: Subject */}
                  <div className={styles.filterDropdownItem}>
                    <label htmlFor="pyq-subject-select" className={styles.filterLabelWrap}>
                      <BookOpen size={14} className={styles.filterIconBlue} />
                      <span>Subject</span>
                    </label>
                    <select
                      id="pyq-subject-select"
                      className={styles.filterSelectControl}
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value as any)}
                    >
                      <option value="All">All Subjects</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                    </select>
                  </div>

                  {/* Dropdown 3: Exam Year */}
                  <div className={styles.filterDropdownItem}>
                    <label htmlFor="pyq-year-select" className={styles.filterLabelWrap}>
                      <Calendar size={14} className={styles.filterIconIndigo} />
                      <span>Exam Year</span>
                    </label>
                    <select
                      id="pyq-year-select"
                      className={styles.filterSelectControl}
                      value={selectedYear}
                      onChange={(e) =>
                        setSelectedYear(e.target.value === 'All' ? 'All' : Number(e.target.value))
                      }
                    >
                      <option value="All">All Archive Years</option>
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dropdown 4: Access Type */}
                  <div className={styles.filterDropdownItem}>
                    <label htmlFor="pyq-access-select" className={styles.filterLabelWrap}>
                      <Lock size={14} className={styles.filterIconPurple} />
                      <span>Access</span>
                    </label>
                    <select
                      id="pyq-access-select"
                      className={styles.filterSelectControl}
                      value={selectedAccess}
                      onChange={(e) => setSelectedAccess(e.target.value as any)}
                    >
                      <option value="All">All Papers</option>
                      <option value="Free">Free Access Only</option>
                      <option value="Pro">Pro / Premium Papers</option>
                    </select>
                  </div>

                  {/* Clear / Reset Filters */}
                  {(selectedExam !== 'All' ||
                    selectedSubject !== 'All' ||
                    selectedYear !== 'All' ||
                    selectedAccess !== 'All' ||
                    searchQuery.trim().length > 0) && (
                    <div className={styles.resetFiltersWrap}>
                      <button
                        type="button"
                        className={styles.resetFiltersBtn}
                        onClick={() => {
                          setSelectedExam('All');
                          setSelectedSubject('All');
                          setSelectedYear('All');
                          setSelectedAccess('All');
                          setSearchQuery('');
                        }}
                      >
                        <RotateCcw size={13} />
                        <span>Reset</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* PYQ Sets Grid */}
              {isLoadingSets ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                  <p style={{ fontWeight: 600 }}>Loading official PYQ papers from database...</p>
                </div>
              ) : filteredSets.length > 0 ? (
                <div className={styles.setsCatalogGrid}>
                  {filteredSets.map((set) => {
                    const qCount = Array.isArray(set.questions)
                      ? set.questions.length
                      : set.questionsCount || 0;
                    const isSetFree = set.isFree !== false;
                    const setId = set.id || set._id || '';
                    const isSetUnlocked = isSetFree || (setId ? unlockedSetIds.includes(setId) : false) || Boolean(student?.enrolledCourseIds && setId && student.enrolledCourseIds.includes(setId));
                    const hasFreeQuestions = isSetFree || (Array.isArray(set.questions) && set.questions.some((q: any) => q.isFree === true));
                    const priceVal = set.price || 499;

                    const subClass =
                      set.subject === 'Physics'
                        ? styles.subjectPillPhy
                        : set.subject === 'Chemistry'
                        ? styles.subjectPillChem
                        : styles.subjectPillMath;

                    const countdown =
                      set.status === 'Scheduled' && set.scheduledDate
                        ? getCountdown(set.scheduledDate)
                        : null;
                    const isScheduledLocked = Boolean(countdown);

                    return (
                      <article
                        key={set.id || set._id}
                        className={styles.pyqSetCard}
                        onClick={() => {
                          if (isScheduledLocked) {
                            showToast(
                              `⏰ Scheduled: Opens in ${countdown?.text} (${new Date(set.scheduledDate!).toLocaleString()})`
                            );
                            return;
                          }
                          // If paper is locked with no free questions, prompt to pay/unlock directly
                          if (!isSetUnlocked && !hasFreeQuestions) {
                            handleOpenUnlockModal(undefined, set);
                            return;
                          }
                          setSelectedSetId(set.id || set._id || null);
                          setActiveQuestionIndex(null);
                        }}
                      >
                        <div className={styles.setCardTop}>
                          <span className={subClass}>
                            {set.badgeCode || `${set.subject} • PYQ`}
                          </span>
                          <span className={styles.examTargetBadge}>
                            {set.examTarget || 'JEE Main'}
                          </span>
                          {isScheduledLocked ? (
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#7c3aed', background: '#faf5ff', border: '1px solid #ddd6fe', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={11} />
                              <span>Opens in {countdown?.text}</span>
                            </span>
                          ) : isSetUnlocked ? (
                            <span className={styles.freeAccessBadge}>
                              ✓ {isSetFree ? '100% Free Practice' : 'Paper Unlocked'}
                            </span>
                          ) : hasFreeQuestions ? (
                            <span className={styles.lockedAccessBadge} style={{ background: '#f5f3ff', color: '#7c3aed', borderColor: '#ddd6fe' }}>
                              <Lock size={12} />
                              <span>Free Preview • ₹{priceVal}</span>
                            </span>
                          ) : (
                            <span className={styles.lockedAccessBadge}>
                              <Lock size={12} />
                              <span>Locked • ₹{priceVal}</span>
                            </span>
                          )}
                        </div>

                        <h3 className={styles.setCardTitle}>{set.title}</h3>

                        <div className={styles.setCardMeta}>
                          <span className={styles.chapterTag}>
                            {set.chapter || set.categoryLabel || 'Full Chapter'}
                          </span>
                          <span>•</span>
                          <span>{set.subject}</span>
                        </div>

                        <div className={styles.setCardFeatures}>
                          <div className={styles.featureItem}>
                            <Zap size={13} style={{ color: '#2563eb' }} />
                            <span>DK Sir 20-30s Inspection Shortcuts</span>
                          </div>
                          <div className={styles.featureItem}>
                            <CheckCircle2 size={13} style={{ color: '#16a34a' }} />
                            <span>Detailed Step-by-Step KaTeX Solutions</span>
                          </div>
                        </div>

                        <div className={styles.setCardFooter}>
                          <span className={styles.qCountBadge}>{qCount} Questions</span>
                          {isScheduledLocked ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#7c3aed', background: '#ede9fe', padding: '6px 12px', borderRadius: '8px' }}>
                              <Clock size={13} />
                              <span>Opens {new Date(set.scheduledDate!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                          ) : isSetUnlocked ? (
                            <span className={styles.openSetBtn}>
                              <span>Practice Questions</span>
                              <ArrowRight size={14} />
                            </span>
                          ) : hasFreeQuestions ? (
                            <span className={styles.openSetBtn} style={{ background: '#f5f3ff', color: '#7c3aed', borderColor: '#ddd6fe' }}>
                              <span>Free Preview &amp; Solve</span>
                              <ArrowRight size={14} />
                            </span>
                          ) : (
                            <span
                              className={styles.openLockedSetBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenUnlockModal(undefined, set);
                              }}
                            >
                              <Lock size={13} />
                              <span>Unlock Complete Paper (₹{priceVal})</span>
                              <ArrowRight size={14} />
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyStateContainer}>
                  <img
                    src="/images/pyq-empty-search.png"
                    alt="No PYQ Papers Found - DK Academy"
                    className={styles.emptyStateIllustration}
                  />
                  <h3 className={styles.emptyStateHeading}>No PYQ Papers Found</h3>
                  <p className={styles.emptyStateDesc}>
                    We couldn&apos;t find any papers matching your current search or filter combination.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSubject('All');
                      setSelectedExam('All');
                      setSelectedYear('All');
                      setSelectedAccess('All');
                    }}
                    className={styles.emptyStateResetBtn}
                  >
                    <RotateCcw size={14} />
                    <span>Reset All Filters</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ═══════════════════════════════════════════════════════════════
               2. ACTIVE SET SOLVING WORKSPACE ("uske andar jaake pr questions")
               ═══════════════════════════════════════════════════════════════ */
            <div>
              {/* Active Set Top Header Bar */}
              <div className={styles.activeSetHeaderBar}>
                <div className={styles.activeSetTopRow}>
                  <button
                    type="button"
                    className={styles.backToSetsBtn}
                    onClick={() => {
                      setSelectedSetId(null);
                      setActiveQuestionIndex(null);
                    }}
                  >
                    <ArrowLeft size={15} />
                    <span>Back to All PYQ Sets</span>
                  </button>

                  <div className={styles.activeSetBadges}>
                    <span className={styles.examTargetBadge}>
                      {activeSet.examTarget || 'JEE Main'}
                    </span>
                    <span
                      className={
                        activeSet.subject === 'Physics'
                          ? styles.subjectPillPhy
                          : activeSet.subject === 'Chemistry'
                          ? styles.subjectPillChem
                          : styles.subjectPillMath
                      }
                    >
                      {activeSet.subject}
                    </span>
                    {activeSet.isFree !== false ? (
                      <span className={styles.freeAccessBadge}>✓ Free Access</span>
                    ) : (
                      <span className={styles.lockedAccessBadge}>
                        <Lock size={12} />
                        <span>Premium • ₹{activeSet.price || 499}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.activeSetTitleWrap}>
                  <h2 className={styles.activeSetTitle}>{activeSet.title}</h2>
                  <div className={styles.setCardMeta} style={{ margin: 0 }}>
                    <span className={styles.chapterTag}>
                      {activeSet.chapter || 'Chapter Practice'}
                    </span>
                    <span>•</span>
                    <span>{setQuestions.length} Questions</span>
                    <span>•</span>
                    <span>{activeSet.solutionNote || 'Complete Step Solutions Included'}</span>
                  </div>
                </div>

                {/* PDF & Video Solution Links if available */}
                {(activeSet.pdfUrl || activeSet.videoUrl || activeSet.videoWalkthroughUrl) && (
                  <div className={styles.activeSetActionsRow}>
                    {activeSet.pdfUrl && (
                      <a
                        href={activeSet.pdfUrl}
                        download
                        className={styles.resourceBtn}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download size={14} />
                        <span>Download Solution PDF</span>
                      </a>
                    )}
                    {(activeSet.videoUrl || activeSet.videoWalkthroughUrl) && (
                      <button
                        type="button"
                        className={styles.resourceBtn}
                        onClick={() => {
                          const vUrl = activeSet.videoUrl || activeSet.videoWalkthroughUrl;
                          if (vUrl) {
                            window.open(vUrl, '_blank', 'noopener,noreferrer');
                          }
                        }}
                      >
                        <Play size={14} fill="currentColor" />
                        <span>Watch Video Walkthrough</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Locked Notice Banner if Set is Paid & Student not Enrolled */}
              {activeSet.isFree === false && !isEnrolled && (
                <div className={styles.lockedSetBanner}>
                  <div className={styles.lockedLeft}>
                    <div className={styles.lockIconCircle}>
                      <Lock size={18} />
                    </div>
                    <div className={styles.lockedTextWrap}>
                      <strong>Premium PYQ Paper</strong>
                      <span>
                        Question 1 is unlocked for preview. Unlock all {setQuestions.length} questions, DK Sir shortcuts, and PDF solutions.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.unlockBannerBtn}
                    onClick={() => handleOpenUnlockModal(1)}
                  >
                    <Lock size={14} />
                    <span>Unlock Full Paper • ₹{activeSet.price || 499}</span>
                  </button>
                </div>
              )}

              {/* Questions Practice Stage */}
              {setQuestions.length > 0 ? (
                <div className={styles.contentLayout}>
                  {/* Left Column: Focused Practice View OR Questions List */}
                  <div className={styles.mainColumn}>
                    {currentQuestion && activeQuestionIndex !== null ? (
                      <QuestionPracticeView
                        question={currentQuestion}
                        currentIndex={activeQuestionIndex}
                        totalQuestions={setQuestions.length}
                        userResponse={responses[currentQuestion.id]}
                        isUnlocked={isQuestionAccessible(currentQuestion, activeQuestionIndex)}
                        paperVideoUrl={activeSet.videoUrl || activeSet.videoWalkthroughUrl}
                        paperPdfUrl={activeSet.pdfUrl}
                        paperPrice={activeSet.price ?? 499}
                        onSelectOption={(optId) => handleSelectOption(currentQuestion.id, optId)}
                        onCheckAnswer={() =>
                          handleCheckAnswer(currentQuestion.id, currentQuestion.correctAnswer)
                        }
                        onResetQuestion={() => handleResetQuestion(currentQuestion.id)}
                        onPrevQuestion={() =>
                          setActiveQuestionIndex((prev) => Math.max(0, (prev ?? 0) - 1))
                        }
                        onNextQuestion={() =>
                          setActiveQuestionIndex((prev) =>
                            Math.min(setQuestions.length - 1, (prev ?? 0) + 1)
                          )
                        }
                        onBackToList={() => setActiveQuestionIndex(null)}
                        onOpenVideo={(q) => setActiveVideoQuestion(q)}
                        onUnlockCourse={() => handleOpenUnlockModal(activeQuestionIndex + 1)}
                        onToggleMarkForReview={() =>
                          handleToggleMarkForReview(currentQuestion.id)
                        }
                      />
                    ) : (
                      <div className={styles.listView}>
                        <div className={styles.listHeader}>
                          <div className={styles.listTitleWrap}>
                            <ListOrdered size={18} className={styles.listIcon} />
                            <h2 className={styles.listHeading}>
                              Questions in this Paper ({setQuestions.length})
                            </h2>
                          </div>
                          <span className={styles.listTip}>
                            {activeSet.isFree !== false || isEnrolled
                              ? 'All questions unlocked • Click any question to practice'
                              : 'Question 1 is Free Preview • Unlock paper for full access'}
                          </span>
                        </div>

                        <div className={styles.cardsGrid}>
                          {setQuestions.map((q, idx) => (
                            <PYQQuestionCard
                              key={q.id}
                              question={q}
                              index={idx}
                              userResponse={responses[q.id]}
                              isUnlocked={isQuestionAccessible(q, idx)}
                              paperPrice={activeSet.price ?? 499}
                              onOpenQuestion={(i) => setActiveQuestionIndex(i)}
                              onOpenVideo={(selectedQ) => setActiveVideoQuestion(selectedQ)}
                              onUnlockCourse={() => handleOpenUnlockModal(idx + 1)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Question Palette & Progress */}
                  <aside className={styles.sidebarColumn}>
                    <div className={styles.paletteWrapper}>
                      <QuestionNavigator
                        totalCount={setQuestions.length}
                        currentIndex={activeQuestionIndex ?? 0}
                        onSelectIndex={(idx) => setActiveQuestionIndex(idx)}
                        responses={responses}
                        questionIds={questionIds}
                        isEnrolled={activeSet.isFree !== false || isEnrolled}
                        freeCount={activeSet.isFree !== false ? setQuestions.length : setQuestions.filter((q, i) => isQuestionAccessible(q, i)).length}
                        isAccessible={(idx) => isQuestionAccessible(setQuestions[idx], idx)}
                        onToggleMarkForReview={handleToggleMarkForReview}
                      />
                    </div>

                    <div className={styles.progressWrapper}>
                      <PracticeProgress
                        totalQuestions={setQuestions.length}
                        answeredCount={stats.answered}
                        correctCount={stats.correct}
                        evaluatedCount={stats.evaluated}
                      />
                    </div>
                  </aside>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <AlertCircle size={36} style={{ color: '#f59e0b', margin: '0 auto 10px' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                    No Questions authored in this PYQ set yet
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    Questions can be authored or added in the Admin Command Center.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedSetId(null)}
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Back to PYQ Bank
                  </button>
                </div>
              )}
            </div>
          )}
        </Container>
      </section>

      {/* Video Solution Modal */}
      <PYQVideoModal
        isOpen={Boolean(activeVideoQuestion)}
        onClose={() => setActiveVideoQuestion(null)}
        question={activeVideoQuestion}
      />

      {/* Course / Set Unlock Modal */}
      <PYQCourseUnlockModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        onEnroll={handleEnrollCourse}
        questionNumber={lockedTargetNumber}
        paperTitle={modalTargetSet?.title || activeSet?.title}
        paperPrice={modalTargetSet?.price ?? activeSet?.price ?? 499}
      />
    </main>
  );
};

export default PYQPage;
