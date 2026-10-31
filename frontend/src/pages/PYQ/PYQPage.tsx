import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ChevronRight,
  Home,
  ListOrdered,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  Zap,
  Video,
  FileText,
  ShieldCheck,
  Download,
  Play
} from 'lucide-react';
import type { PYQExam, Subject, PYQUserResponse } from '../../types';
import { Container } from '../../components/ui/Container/Container';
import { ExamSelector } from '../../components/pyq/ExamSelector/ExamSelector';
import { PYQFilters } from '../../components/pyq/PYQFilters/PYQFilters';
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
import { getCustomPyqYears } from '../../data/pyqData';
import type { PYQQuestion } from '../../types';
import styles from './PYQPage.module.scss';

export const PYQPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlExam = searchParams.get('exam');
  const urlSubject = searchParams.get('subject');

  const { student, enrollCourse } = useStudentAuth();

  const [pyqList, setPyqList] = useState<PYQQuestion[]>(() => cmsService.getPYQs());

  React.useEffect(() => {
    const syncAllPYQs = async () => {
      try {
        const cmsItems = await cmsService.fetchPYQsFromAPI();
        const dppPyqRes = await apiClient.get<any>('/dpp-pyq');
        const dppPyqList = Array.isArray(dppPyqRes) ? dppPyqRes : dppPyqRes?.data || [];

        const liveQuestions: PYQQuestion[] = [];
        if (Array.isArray(dppPyqList)) {
          dppPyqList.forEach((set: any) => {
            if (set.moduleType === 'PYQ' && Array.isArray(set.questions)) {
              set.questions.forEach((q: any, idx: number) => {
                const yearNum = Number(q.year) || (q.examYear ? parseInt(String(q.examYear).replace(/\D/g, ''), 10) : 2024);
                liveQuestions.push({
                  id: q.id || `pyq-${set.id}-${idx + 1}`,
                  exam: (set.examTarget?.includes('Advanced') ? 'JEE Advanced' : 'JEE Main') as any,
                  year: yearNum,
                  subject: (set.subject === 'Physics' || set.subject === 'Chemistry' ? set.subject : 'Mathematics') as any,
                  chapter: set.chapter || 'Coordinate Geometry',
                  topic: q.topic || set.title || 'JEE Practice',
                  type: 'Single Choice MCQ',
                  marks: '+4 / -1',
                  statement: q.statement || 'Question statement',
                  options: Array.isArray(q.options)
                    ? q.options.map((opt: any) => ({
                        id: opt.key || opt.id || 'A',
                        text: opt.text || ''
                      }))
                    : [
                        { id: 'A', text: 'Option A' },
                        { id: 'B', text: 'Option B' },
                        { id: 'C', text: 'Option C' },
                        { id: 'D', text: 'Option D' }
                      ],
                  correctAnswer: q.correctKey || q.correctAnswer || 'A',
                  formulaKey: q.dkSirShortcut || 'DK Sir 20s Inspection Rule',
                  explanation: q.stepSolution || q.explanation || 'Detailed step-by-step solution.',
                  isFree: q.isFree !== false,
                  youtubeUrl: q.videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                  videoUrl: q.videoUrl || '/videos/1.mp4',
                  pdfUrl: q.pdfUrl || '/assets/downloads/st line-2.pdf',
                  courseId: 'jee-pyq-archive-mastery',
                  courseName: set.title || '10-Year JEE Chapter-Wise PYQ Mastery Course',
                  videoDuration: '05:00'
                });
              });
            }
          });
        }

        const combinedMap = new Map<string, PYQQuestion>();
        (cmsItems || []).forEach((q) => combinedMap.set(q.id, q));
        liveQuestions.forEach((q) => combinedMap.set(q.id, q));
        const combined = Array.from(combinedMap.values());
        if (combined.length > 0) {
          setPyqList(combined);
          localStorage.setItem('dk_cms_pyqs', JSON.stringify(combined));
        }
      } catch (err) {
        console.warn('Error loading PYQs:', err);
      }
    };

    syncAllPYQs();

    window.addEventListener(CMS_EVENT_KEY, syncAllPYQs);
    window.addEventListener('dk_dpp_pyq_created', syncAllPYQs);
    window.addEventListener('dk_dpp_pyq_updated', syncAllPYQs);

    return () => {
      window.removeEventListener(CMS_EVENT_KEY, syncAllPYQs);
      window.removeEventListener('dk_dpp_pyq_created', syncAllPYQs);
      window.removeEventListener('dk_dpp_pyq_updated', syncAllPYQs);
    };
  }, []);

  // Course enrollment status
  const isEnrolled = useMemo(() => {
    if (!student?.enrolledCourseIds) return false;
    return (
      student.enrolledCourseIds.includes('jee-pyq-archive-mastery') ||
      student.enrolledCourseIds.includes('jee-main-advanced-2yr-ultimate') ||
      student.enrolledCourseIds.includes('jee-rankers-crash-course-2026')
    );
  }, [student]);

  // Video and Unlock modal state
  const [activeVideoQuestion, setActiveVideoQuestion] = useState<PYQQuestion | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [lockedTargetNumber, setLockedTargetNumber] = useState<number | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleEnrollCourse = () => {
    enrollCourse('jee-pyq-archive-mastery');
    showToast('Enrolled in 10-Year JEE PYQ Mastery Course! All questions, YouTube videos & PDF solutions unlocked.');
  };

  const handleOpenUnlockModal = (qNumber?: number) => {
    setLockedTargetNumber(qNumber);
    setIsUnlockModalOpen(true);
  };

  // Exam selection
  const [selectedExam, setSelectedExam] = useState<PYQExam>(() => {
    if (urlExam === 'JEE Advanced') return 'JEE Advanced';
    return 'JEE Main';
  });

  // Question Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<'All' | Subject>(() => {
    if (urlSubject === 'Mathematics') return 'Mathematics';
    if (urlSubject === 'Physics') return 'Physics';
    if (urlSubject === 'Chemistry') return 'Chemistry';
    return 'All';
  });
  const [selectedYear, setSelectedYear] = useState<number | string>('All');
  const [selectedChapter, setSelectedChapter] = useState('All');

  // Practice session state
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
  const [responses, setResponses] = useState<Record<string, PYQUserResponse>>({});

  // Reset chapter & active question when exam or subject changes
  const handleExamChange = (exam: PYQExam) => {
    setSelectedExam(exam);
    setSelectedChapter('All');
    setActiveQuestionIndex(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('exam', exam);
    setSearchParams(nextParams);
  };

  const handleSubjectChange = (subject: 'All' | Subject) => {
    setSelectedSubject(subject);
    setSelectedChapter('All');
    setActiveQuestionIndex(null);
    const nextParams = new URLSearchParams(searchParams);
    if (subject === 'All') {
      nextParams.delete('subject');
    } else {
      nextParams.set('subject', subject);
    }
    setSearchParams(nextParams);
  };

  // Derive available chapters for current exam and subject
  const availableChapters = useMemo(() => {
    const chapters = new Set<string>();
    pyqList.forEach((q) => {
      const matchesExam =
        !q.exam ||
        q.exam === selectedExam ||
        q.exam.includes(selectedExam) ||
        q.exam.includes('JEE Main & Advanced');
      if (matchesExam) {
        if (selectedSubject === 'All' || q.subject === selectedSubject) {
          if (q.chapter) chapters.add(q.chapter);
        }
      }
    });
    return Array.from(chapters).sort();
  }, [selectedExam, selectedSubject, pyqList]);

  // Derive available years dynamically from questions & admin custom created years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    pyqList.forEach((q) => {
      const qYear = Number(q.year) || ((q as any).examYear ? parseInt(String((q as any).examYear).replace(/\D/g, ''), 10) : 0);
      if (qYear > 1990 && qYear < 2050) {
        years.add(qYear);
      }
    });
    getCustomPyqYears().forEach((y) => years.add(y));
    [2026, 2025, 2024, 2023, 2022, 2021].forEach((y) => years.add(y));
    return Array.from(years).sort((a, b) => b - a);
  }, [pyqList]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return pyqList.filter((q) => {
      const matchesExam =
        !q.exam ||
        q.exam === selectedExam ||
        q.exam.includes(selectedExam) ||
        q.exam.includes('JEE Main & Advanced');
      if (!matchesExam) return false;

      if (selectedSubject !== 'All' && q.subject && q.subject !== selectedSubject) return false;

      if (selectedYear !== 'All') {
        const qYear = Number(q.year) || ((q as any).examYear ? parseInt(String((q as any).examYear).replace(/\D/g, ''), 10) : 2024);
        if (qYear !== Number(selectedYear)) {
          return false;
        }
      }

      if (selectedChapter !== 'All' && q.chapter && q.chapter !== selectedChapter) return false;

      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchesStatement = q.statement.toLowerCase().includes(query);
        const matchesTopic = q.topic.toLowerCase().includes(query);
        const matchesChapter = q.chapter.toLowerCase().includes(query);
        const matchesSubject = q.subject.toLowerCase().includes(query);
        return matchesStatement || matchesTopic || matchesChapter || matchesSubject;
      }

      return true;
    });
  }, [selectedExam, selectedSubject, selectedYear, selectedChapter, searchQuery, pyqList]);

  // Access rule: 5 questions free preview, remainder unlocked upon course enrollment
  const isQuestionAccessible = (q: PYQQuestion, index: number): boolean => {
    if (isEnrolled) return true;
    if (q.isFree === true) return true;
    if (index < 5) return true;
    return false;
  };

  // Check if any filter is active
  const isFilterActive =
    searchQuery.trim().length > 0 ||
    selectedSubject !== 'All' ||
    selectedYear !== 'All' ||
    selectedChapter !== 'All';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSubject('All');
    setSelectedYear('All');
    setSelectedChapter('All');
    setActiveQuestionIndex(null);
  };

  // User response handlers
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

  // Progress calculations
  const questionIds = useMemo(() => filteredQuestions.map((q) => q.id), [filteredQuestions]);

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
    activeQuestionIndex !== null && filteredQuestions[activeQuestionIndex]
      ? filteredQuestions[activeQuestionIndex]
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
                <span className={styles.breadcrumbCurrent} aria-current="page">
                  PYQ Question Bank
                </span>
              </li>
            </ol>
          </nav>

          {/* Page Introduction */}
          <div className={styles.introWrapper}>
            <div className={styles.pageEyebrow}>
              <span className={styles.livePulseDot} aria-hidden="true">
                <span className={styles.pulseRing} />
                <span className={styles.pulseCore} />
              </span>
              <span className={styles.eyebrowHighlight}>Official Question Bank Archive</span>
              <span className={styles.eyebrowDivider}>•</span>
              <span className={styles.eyebrowTag}>JEE Main &amp; Advanced 2015–2025</span>
            </div>

            <h1 className={styles.pageTitle}>
              Practice Previous Year <span className={styles.titleHighlight}>JEE Questions</span>
            </h1>
            <p className={styles.pageDescription}>
              Build exam confidence with solved past JEE Main &amp; Advanced questions.
              Includes side-by-side DK Sir YouTube video solution walkthroughs and downloadable Kota step-by-step PDF solutions.
            </p>

            {/* Quick Pedagogy Proof Badges */}
            <div className={styles.pedagogyBadgesRow}>
              <div className={styles.pedagogyBadge}>
                <Zap size={14} className={styles.badgeIconBlue} aria-hidden="true" />
                <span>DK Sir 20-30s Inspection Tricks</span>
              </div>
              <div className={styles.pedagogyBadge}>
                <Video size={14} className={styles.badgeIconRed} aria-hidden="true" />
                <span>YouTube Video Walkthroughs</span>
              </div>
              <div className={styles.pedagogyBadge}>
                <FileText size={14} className={styles.badgeIconEmerald} aria-hidden="true" />
                <span>Downloadable Kota PDF Solutions</span>
              </div>
              <div className={styles.pedagogyBadge}>
                <ShieldCheck size={14} className={styles.badgeIconPurple} aria-hidden="true" />
                <span>Authentic NTA &amp; IIT Question Bank</span>
              </div>
            </div>
          </div>

          {/* Modern Course Association Access Banner */}
          <div className={styles.courseHeaderBanner}>
            <div className={styles.courseBannerLeft}>
              <div className={styles.courseBannerTag}>
                <Sparkles size={14} aria-hidden="true" />
                <span>10-Year JEE Chapter-Wise PYQ Mastery Course</span>
              </div>
              <h2 className={styles.courseBannerTitle}>
                Instant Access to 500+ Video Solutions &amp; Step-by-Step PDF Papers
              </h2>
              <div className={styles.courseBannerPoints}>
                <div className={styles.bannerPoint}>
                  <CheckCircle2 size={15} className={styles.checkGreen} aria-hidden="true" />
                  <span><strong>Free Preview:</strong> First 5 questions in every topic are 100% Free with zero registration.</span>
                </div>
                <div className={styles.bannerPoint}>
                  <CheckCircle2 size={15} className={styles.checkGreen} aria-hidden="true" />
                  <span><strong>Course Enrollment:</strong> Unlocks all remaining questions, full video walkthroughs &amp; PDF test sheets.</span>
                </div>
              </div>
            </div>

            <div className={styles.courseBannerRight}>
              {isEnrolled ? (
                <div className={styles.enrolledStatusCard}>
                  <div className={styles.enrolledIconCircle}>
                    <CheckCircle2 size={20} className={styles.checkGreen} aria-hidden="true" />
                  </div>
                  <div className={styles.enrolledStatusText}>
                    <span className={styles.enrolledStatusTitle}>Full Course Enrolled</span>
                    <span className={styles.enrolledStatusSub}>All 500+ PYQs, Videos &amp; PDFs Unlocked</span>
                  </div>
                </div>
              ) : (
                <div className={styles.unlockCtaCard}>
                  <div className={styles.priceRow}>
                    <div className={styles.previewTagPill}>
                      <span className={styles.counterDot} aria-hidden="true" />
                      <span>5 Free Preview</span>
                    </div>
                    <div className={styles.priceFigures}>
                      <span className={styles.strikePrice}>₹2,999</span>
                      <span className={styles.mainPrice}>₹1,499</span>
                      <span className={styles.discountBadge}>50% OFF</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenUnlockModal()}
                    className={styles.bannerUnlockBtn}
                    aria-label="Unlock full 10-year JEE PYQ course for 1,499 rupees"
                  >
                    <Lock size={15} aria-hidden="true" />
                    <span>Unlock Full Course</span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                  <span className={styles.guaranteeText}>Instant LMS Access · Lifetime Validity</span>
                </div>
              )}
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

          {/* Exam Selection Toggle */}
          <ExamSelector
            selectedExam={selectedExam}
            onSelectExam={handleExamChange}
          />

          {/* Filter Controls */}
          <PYQFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedSubject={selectedSubject}
            onSelectSubject={handleSubjectChange}
            selectedYear={selectedYear}
            onSelectYear={setSelectedYear}
            selectedChapter={selectedChapter}
            onSelectChapter={setSelectedChapter}
            availableChapters={availableChapters}
            availableYears={availableYears}
            isFilterActive={isFilterActive}
            onResetFilters={handleResetFilters}
            resultCount={filteredQuestions.length}
          />
        </Container>
      </section>

      {/* Main Question Workspace */}
      <section className={styles.workspaceSection} aria-label="Question Solving Workspace">
        <Container size="wide">
          {filteredQuestions.length > 0 ? (
            <div className={styles.contentLayout}>
              {/* Left Column: Focused Practice View or Question List */}
              <div className={styles.mainColumn}>
                {currentQuestion && activeQuestionIndex !== null ? (
                  <QuestionPracticeView
                    question={currentQuestion}
                    currentIndex={activeQuestionIndex}
                    totalQuestions={filteredQuestions.length}
                    userResponse={responses[currentQuestion.id]}
                    isUnlocked={isQuestionAccessible(currentQuestion, activeQuestionIndex)}
                    onSelectOption={(optId) => handleSelectOption(currentQuestion.id, optId)}
                    onCheckAnswer={() =>
                      handleCheckAnswer(currentQuestion.id, currentQuestion.correctAnswer)
                    }
                    onResetQuestion={() => handleResetQuestion(currentQuestion.id)}
                    onPrevQuestion={() => setActiveQuestionIndex((prev) => Math.max(0, (prev ?? 0) - 1))}
                    onNextQuestion={() =>
                      setActiveQuestionIndex((prev) =>
                        Math.min(filteredQuestions.length - 1, (prev ?? 0) + 1)
                      )
                    }
                    onBackToList={() => setActiveQuestionIndex(null)}
                    onOpenVideo={(q) => setActiveVideoQuestion(q)}
                    onUnlockCourse={() => handleOpenUnlockModal(activeQuestionIndex + 1)}
                    onToggleMarkForReview={() => handleToggleMarkForReview(currentQuestion.id)}
                  />
                ) : (
                  <div className={styles.listView}>
                    <div className={styles.listHeader}>
                      <div className={styles.listTitleWrap}>
                        <ListOrdered size={18} className={styles.listIcon} />
                        <h2 className={styles.listHeading}>
                          {selectedExam} Question Bank ({filteredQuestions.length})
                        </h2>
                      </div>
                      <span className={styles.listTip}>
                        {isEnrolled
                          ? 'All questions unlocked • Click any question to practice'
                          : 'First 5 questions are 100% Free • Remaining require course enrollment'}
                      </span>
                    </div>

                    {/* Featured Chapter-Wise PYQ Booklets & Video Solutions Spotlight */}
                    <div className={styles.spotlightBanner}>
                      <div className={styles.spotlightMedia}>
                        <img
                          src="/images/pyq-straight-lines-banner.jpg"
                          alt="JEE Main PYQs Straight Lines by DK Sir"
                          className={styles.spotlightImg}
                        />
                      </div>
                      <div className={styles.spotlightDetails}>
                        <div className={styles.spotlightBadge}>
                          <Sparkles size={14} />
                          <span>Official DK Academy PYQ Release</span>
                        </div>
                        <h3 className={styles.spotlightTitle}>
                          JEE Main Mathematics: Straight Lines &amp; Parabola PYQs
                        </h3>
                        <p className={styles.spotlightDesc}>
                          Download verified Kota classroom chapter-wise PYQ sheets with complete answer keys, concept-based speed shortcuts, and HD video walkthroughs by DK Sir.
                        </p>
                        
                        <div className={styles.spotlightActions}>
                          <a
                            href="/assets/downloads/st line-2.pdf"
                            download="JEE_Main_Straight_Lines_PYQ_DK_Academy.pdf"
                            className={styles.downloadPillBtn}
                            title="Download Straight Lines PYQs PDF"
                          >
                            <FileText size={15} />
                            <span>Straight Lines PYQs (PDF)</span>
                            <Download size={14} />
                          </a>
                          <a
                            href="/assets/downloads/parabola -1.pdf"
                            download="JEE_Main_Parabola_PYQ_DK_Academy.pdf"
                            className={styles.downloadPillBtn}
                            title="Download Parabola PYQs PDF"
                          >
                            <FileText size={15} />
                            <span>Parabola PYQs (PDF)</span>
                            <Download size={14} />
                          </a>
                          <button
                            type="button"
                            className={styles.watchMasterclassBtn}
                            onClick={() => {
                              const targetQ = filteredQuestions.find(q => q.chapter === 'Straight Lines' || q.chapter === 'Parabola') || filteredQuestions[0] || pyqList[0];
                              setActiveVideoQuestion(targetQ);
                            }}
                          >
                            <Play size={14} fill="currentColor" />
                            <span>Watch Video Walkthrough</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className={styles.cardsGrid}>
                      {filteredQuestions.map((q, idx) => (
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

              {/* Right Column: Interactive Question Palette followed by Session Progress */}
              <aside className={styles.sidebarColumn}>
                <QuestionNavigator
                  totalCount={filteredQuestions.length}
                  currentIndex={activeQuestionIndex ?? 0}
                  onSelectIndex={(idx) => setActiveQuestionIndex(idx)}
                  responses={responses}
                  questionIds={questionIds}
                  isEnrolled={isEnrolled}
                  freeCount={5}
                  onToggleMarkForReview={handleToggleMarkForReview}
                />

                <PracticeProgress
                  totalQuestions={filteredQuestions.length}
                  answeredCount={stats.answered}
                  correctCount={stats.correct}
                  evaluatedCount={stats.evaluated}
                />
              </aside>
            </div>
          ) : (
            <PYQEmptyState
              searchQuery={searchQuery}
              selectedSubject={selectedSubject}
              selectedYear={selectedYear}
              selectedExam={selectedExam}
              onResetFilters={handleResetFilters}
            />
          )}
        </Container>
      </section>

      {/* YouTube Video Solution Modal */}
      <PYQVideoModal
        isOpen={Boolean(activeVideoQuestion)}
        onClose={() => setActiveVideoQuestion(null)}
        question={activeVideoQuestion}
      />

      {/* Course Unlock Modal */}
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
