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
  AlertCircle
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
  questions: any[];
}

export const PYQPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlExam = searchParams.get('exam');
  const urlSubject = searchParams.get('subject');
  const urlSetId = searchParams.get('set');

  const { student } = useStudentAuth();

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

    return () => {
      isMounted = false;
      window.removeEventListener(CMS_EVENT_KEY, handleSync);
      window.removeEventListener('dk_dpp_pyq_created', handleSync);
      window.removeEventListener('dk_dpp_pyq_updated', handleSync);
    };
  }, []);

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
          youtubeUrl: q.videoUrl || activeSet.videoUrl || activeSet.videoWalkthroughUrl || '',
          videoUrl: q.videoUrl || activeSet.videoUrl || '',
          pdfUrl: q.pdfUrl || activeSet.pdfUrl || '/assets/downloads/st line-2.pdf',
          courseId: activeSet.id || activeSet._id || 'jee-pyq-archive-mastery',
          courseName: activeSet.title,
          videoDuration: '05:00'
        };
      });
  }, [activeSet]);

  // Course enrollment status for student
  const isEnrolled = useMemo(() => {
    if (!student?.enrolledCourseIds) return false;
    const setId = activeSet?.id || activeSet?._id || '';
    return (
      student.enrolledCourseIds.includes(setId) ||
      student.enrolledCourseIds.includes('jee-pyq-archive-mastery') ||
      student.enrolledCourseIds.includes('jee-main-advanced-2yr-ultimate') ||
      student.enrolledCourseIds.includes('jee-rankers-crash-course-2026')
    );
  }, [student, activeSet]);

  // Access rule for individual question inside active set
  const isQuestionAccessible = (q: PYQQuestion, index: number): boolean => {
    if (activeSet?.isFree !== false) return true;
    if (isEnrolled) return true;
    if (q.isFree === true) return true;
    if (index === 0) return true; // First question free preview
    return false;
  };

  const handleEnrollCourse = () => {
    const targetCourse = activeSet?.id || 'jee-pyq-archive-mastery';
    navigate(`/payment/${targetCourse}`);
  };

  const handleOpenUnlockModal = (qNumber?: number) => {
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
  }, [pyqSets, selectedSubject, selectedExam, searchQuery]);

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

          {/* Page Introduction */}
          <div className={styles.introWrapper}>
            <div className={styles.pageEyebrow}>
              <span className={styles.livePulseDot} aria-hidden="true">
                <span className={styles.pulseRing} />
                <span className={styles.pulseCore} />
              </span>
              <span className={styles.eyebrowHighlight}>Official PYQ Question Bank</span>
              <span className={styles.eyebrowDivider}>•</span>
              <span className={styles.eyebrowTag}>JEE Main &amp; Advanced Chapter-Wise</span>
            </div>

            <h1 className={styles.pageTitle}>
              Practice Previous Year <span className={styles.titleHighlight}>JEE Questions</span>
            </h1>
            <p className={styles.pageDescription}>
              Solved past JEE Main &amp; Advanced papers authored by Kota faculty.
              Master speed with DK Sir 20-30s inspection shortcuts, step-by-step solutions, and video explanations.
            </p>

            {/* Quick Pedagogy Proof Badges */}
            <div className={styles.pedagogyBadgesRow}>
              <div className={styles.pedagogyBadge}>
                <Zap size={14} className={styles.badgeIconBlue} aria-hidden="true" />
                <span>DK Sir 20-30s Inspection Tricks</span>
              </div>
              <div className={styles.pedagogyBadge}>
                <Video size={14} className={styles.badgeIconRed} aria-hidden="true" />
                <span>Video Solution Walkthroughs</span>
              </div>
              <div className={styles.pedagogyBadge}>
                <FileText size={14} className={styles.badgeIconEmerald} aria-hidden="true" />
                <span>Downloadable Kota PDF Solutions</span>
              </div>
              <div className={styles.pedagogyBadge}>
                <ShieldCheck size={14} className={styles.badgeIconPurple} aria-hidden="true" />
                <span>Direct Admin Verified Content</span>
              </div>
            </div>
          </div>

          {/* Quick Practice Hub Switcher */}
          <div className={styles.hubTabs} role="navigation" aria-label="Practice modes">
            <span className={`${styles.hubTab} ${styles.hubTabActive}`}>
              <FileText size={15} aria-hidden="true" />
              <span>Chapter-Wise PYQs</span>
            </span>
            <Link to="/dpp" className={styles.hubTab}>
              <Zap size={15} aria-hidden="true" />
              <span>Daily Practice Problems (DPP)</span>
            </Link>
            <Link to="/test-series" className={styles.hubTab}>
              <ListOrdered size={15} aria-hidden="true" />
              <span>Full CBT Test Series</span>
            </Link>
          </div>
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
              {/* Filter & Search Bar */}
              <div className={styles.catalogFilterBar}>
                <div className={styles.catalogSearchBox}>
                  <Search size={18} className={styles.searchIcon} />
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search PYQ papers by title, chapter, or year..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className={styles.catalogSubjectPills}>
                  {(['All', 'Mathematics', 'Physics', 'Chemistry'] as const).map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      className={`${styles.subjectFilterPill} ${
                        selectedSubject === sub ? styles.subjectFilterPillActive : ''
                      }`}
                      onClick={() => setSelectedSubject(sub)}
                    >
                      {sub}
                    </button>
                  ))}
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
                    const priceVal = set.price || 499;

                    const subClass =
                      set.subject === 'Physics'
                        ? styles.subjectPillPhy
                        : set.subject === 'Chemistry'
                        ? styles.subjectPillChem
                        : styles.subjectPillMath;

                    return (
                      <article
                        key={set.id || set._id}
                        className={styles.pyqSetCard}
                        onClick={() => {
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
                          {isSetFree ? (
                            <span className={styles.freeAccessBadge}>
                              ✓ 100% Free Practice
                            </span>
                          ) : (
                            <span className={styles.lockedAccessBadge}>
                              <Lock size={12} />
                              <span>Premium • ₹{priceVal}</span>
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
                            <span>DK Sir Kota Inspection Shortcuts</span>
                          </div>
                          <div className={styles.featureItem}>
                            <CheckCircle2 size={13} style={{ color: '#16a34a' }} />
                            <span>Detailed Step-by-Step KaTeX Solutions</span>
                          </div>
                        </div>

                        <div className={styles.setCardFooter}>
                          <span className={styles.qCountBadge}>{qCount} Questions</span>
                          {isSetFree ? (
                            <span className={styles.openSetBtn}>
                              <span>Practice Questions</span>
                              <ArrowRight size={14} />
                            </span>
                          ) : (
                            <span className={styles.openLockedSetBtn}>
                              <Lock size={13} />
                              <span>Unlock &amp; Solve</span>
                              <ArrowRight size={14} />
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <BookOpen size={40} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>No PYQ papers found</h3>
                  <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    Try searching for another chapter or reset the filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSubject('All');
                      setSelectedExam('All');
                    }}
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
                    Reset Filters
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
                          const targetQ = setQuestions[0];
                          if (targetQ) setActiveVideoQuestion(targetQ);
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
                        Question 1 is unlocked for preview. Unlock all {setQuestions.length} questions, DK Sir Kota shortcuts, and PDF solutions.
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
                    <QuestionNavigator
                      totalCount={setQuestions.length}
                      currentIndex={activeQuestionIndex ?? 0}
                      onSelectIndex={(idx) => setActiveQuestionIndex(idx)}
                      responses={responses}
                      questionIds={questionIds}
                      isEnrolled={activeSet.isFree !== false || isEnrolled}
                      freeCount={activeSet.isFree !== false ? setQuestions.length : 1}
                      onToggleMarkForReview={handleToggleMarkForReview}
                    />

                    <PracticeProgress
                      totalQuestions={setQuestions.length}
                      answeredCount={stats.answered}
                      correctCount={stats.correct}
                      evaluatedCount={stats.evaluated}
                    />
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
      />
    </main>
  );
};

export default PYQPage;
