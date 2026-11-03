import React, { useState, useMemo, useEffect } from 'react';
import type { DPPAttempt, DPPQuestionResponse } from '../../types';
import { Container } from '../../components/ui/Container/Container';
import { DPPPageHeader } from '../../components/dpp/DPPPageHeader/DPPPageHeader';
import { SubjectSelector, type SubjectFilterValue } from '../../components/dpp/SubjectSelector/SubjectSelector';
import { DPPFilters, type DifficultyFilterValue, type StatusFilterValue } from '../../components/dpp/DPPFilters/DPPFilters';
import { DPPSetCard } from '../../components/dpp/DPPSetCard/DPPSetCard';
import { DPPEmptyState } from '../../components/dpp/DPPEmptyState/DPPEmptyState';
import { DPPPracticeView } from '../../components/dpp/DPPPracticeView/DPPPracticeView';
import { DPPResults } from '../../components/dpp/DPPResults/DPPResults';
import { PYQCourseUnlockModal } from '../../components/pyq/PYQCourseUnlockModal/PYQCourseUnlockModal';
import { cmsService, CMS_EVENT_KEY } from '../../services/cmsService';
import { apiClient } from '../../services/apiClient';
import { paymentService } from '../../services/paymentService';
import { useStudentAuth } from '../../context/AuthContext';
import type { DPPSet } from '../../types';
import styles from './DPPPage.module.scss';

// Local storage session key for DPP practice attempts
const DPP_STORAGE_KEY = 'dk_academy_dpp_attempts_v1';

const mapDppPyqToDPPSet = (item: any): DPPSet => {
  const qs = Array.isArray(item.questions) ? item.questions : [];
  return {
    id: item.id || item._id,
    title: item.title,
    subject:
      item.subject === 'Physics' || item.subject === 'Chemistry' || item.subject === 'Mathematics'
        ? item.subject
        : 'Mathematics',
    chapter: item.chapter || item.categoryLabel || 'Comprehensive Practice',
    topic: item.categoryLabel || item.title,
    difficulty: (item.difficulty as any) || 'Moderate',
    estimatedMinutes: Math.max(15, qs.length * 3),
    pdfUrl: item.pdfUrl || '/assets/downloads/st line-2.pdf',
    videoWalkthroughUrl: item.videoWalkthroughUrl || '',
    isFree: item.isFree !== false,
    price: item.price !== undefined ? item.price : 299,
    status: item.status || 'Active',
    scheduledDate: item.scheduledDate || '',
    questions: qs.map((q: any, idx: number) => ({
      id: q.id || `q-${item.id}-${idx + 1}`,
      questionNumber: q.qNum || idx + 1,
      statement: q.statement || 'Question statement',
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
      explanation: q.stepSolution || q.explanation || 'Detailed step-by-step solution.',
      formulaKey: q.dkSirShortcut || 'DK Sir 20s Inspection Rule',
      isFree: q.isFree !== undefined ? q.isFree : (idx === 0)
    }))
  };
};

export const DPPPage: React.FC = () => {
  const [dppList, setDppList] = useState<DPPSet[]>(() => cmsService.getDPPSets());

  useEffect(() => {
    let isMounted = true;

    const loadAllDPPs = async () => {
      try {
        const [cmsItems, dppPyqRes] = await Promise.all([
          cmsService.fetchDPPSetsFromAPI().catch(() => []),
          apiClient.get<any>('/dpp-pyq').catch(() => [])
        ]);

        if (!isMounted) return;

        const liveList = Array.isArray(dppPyqRes) ? dppPyqRes : dppPyqRes?.data || [];
        const liveMapped: DPPSet[] = [];
        if (Array.isArray(liveList)) {
          liveList.forEach((set: any) => {
            const modType = String(set.moduleType || set.type || 'DPP').toUpperCase();
            if (modType === 'DPP') {
              liveMapped.push(mapDppPyqToDPPSet(set));
            }
          });
        }

        const combined = [
          ...liveMapped,
          ...(cmsItems || []).filter((c) => !liveMapped.some((l) => l.id === c.id))
        ];
        if (combined.length > 0 && isMounted) {
          setDppList(combined);
        }
      } catch (err) {
        console.warn('Error syncing DPP sets:', err);
      }
    };

    loadAllDPPs();

    const handleUpdate = (e: any) => {
      if (e?.detail?.type === 'dpp' && isMounted) {
        loadAllDPPs();
      }
    };
    window.addEventListener(CMS_EVENT_KEY, handleUpdate);
    window.addEventListener('dk_dpp_pyq_created', loadAllDPPs);
    window.addEventListener('dk_dpp_pyq_updated', loadAllDPPs);
    return () => {
      isMounted = false;
      window.removeEventListener(CMS_EVENT_KEY, handleUpdate);
      window.removeEventListener('dk_dpp_pyq_created', loadAllDPPs);
      window.removeEventListener('dk_dpp_pyq_updated', loadAllDPPs);
    };
  }, []);

  const { student } = useStudentAuth();

  // DPP Unlock status & Razorpay checkout
  const [unlockedSetIds, setUnlockedSetIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dk_unlocked_dpp_sets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [modalTargetSet, setModalTargetSet] = useState<DPPSet | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isSetUnlocked = (set: DPPSet): boolean => {
    if (set.isFree !== false || !set.price || set.price === 0) return true;
    const setId = String(set.id);
    if (unlockedSetIds.includes(setId)) return true;
    if (!student?.enrolledCourseIds) return false;
    return (
      student.enrolledCourseIds.includes(setId) ||
      student.enrolledCourseIds.includes('jee-dpp-archive-mastery') ||
      student.enrolledCourseIds.includes('jee-main-advanced-2yr-ultimate') ||
      student.enrolledCourseIds.includes('jee-rankers-crash-course-2026')
    );
  };

  const handleUnlockDPP = (set: DPPSet) => {
    setModalTargetSet(set);
    setIsUnlockModalOpen(true);
  };

  const handleEnrollDPP = async () => {
    const targetSet = modalTargetSet || activeSet;
    if (!targetSet) return;
    const price = targetSet.price ?? 299;
    const setId = String(targetSet.id);
    const paperTitle = targetSet.title || 'DPP Problem Sheet';

    try {
      await paymentService.initiateCourseCheckout({
        amount: price,
        courseId: setId,
        courseTitle: paperTitle,
        studentName: student?.name || 'Aspirant',
        studentEmail: student?.email || 'student@dkacademy.in',
        studentPhone: student?.phone || '9999999999',
        onSuccess: (_paymentId: string) => {
          setIsUnlockModalOpen(false);
          setUnlockedSetIds((prev) => {
            const next = Array.from(new Set([...prev, setId]));
            try {
              localStorage.setItem('dk_unlocked_dpp_sets', JSON.stringify(next));
            } catch {}
            return next;
          });
          showToast('DPP Set unlocked successfully! You now have full access to all questions.');
        },
        onError: (err: any) => {
          console.error('DPP payment error:', err);
        }
      });
    } catch (err) {
      console.error('Failed to initiate DPP checkout:', err);
    }
  };

  // Session attempts state: persisted in localStorage so student progress is remembered during practice sessions
  const [attempts, setAttempts] = useState<Record<string, DPPAttempt>>(() => {
    try {
      const globalStored = localStorage.getItem(DPP_STORAGE_KEY);
      const studentKey = student?.id ? `dk_dpp_${student.id}` : null;
      const studentStored = studentKey ? localStorage.getItem(studentKey) : null;
      const globalObj = globalStored ? JSON.parse(globalStored) : {};
      const studentObj = studentStored ? JSON.parse(studentStored) : {};
      return { ...globalObj, ...studentObj };
    } catch {
      return {};
    }
  });

  // Save attempts to localStorage and broadcast real-time update
  useEffect(() => {
    try {
      localStorage.setItem(DPP_STORAGE_KEY, JSON.stringify(attempts));
      if (student?.id) {
        localStorage.setItem(`dk_dpp_${student.id}`, JSON.stringify(attempts));
      }
      window.dispatchEvent(new CustomEvent('dk_dpp_attempts_updated', { detail: { attempts } }));
    } catch {
      // Ignore storage write issues
    }
  }, [attempts, student?.id]);

  // Filtering state
  const [selectedSubject, setSelectedSubject] = useState<SubjectFilterValue>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilterValue>('All');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilterValue>('All');

  // Active practice session state
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [viewState, setViewState] = useState<'catalog' | 'practice' | 'results' | 'review'>('catalog');

  // Find active set object
  const activeSet = useMemo(() => {
    if (!activeSetId) return null;
    return dppList.find((s) => s.id === activeSetId) || null;
  }, [activeSetId, dppList]);

  // Derive counts per subject from actual DPP data
  const subjectCounts = useMemo<Record<SubjectFilterValue, number>>(() => {
    const counts: Record<SubjectFilterValue, number> = {
      All: 0,
      Physics: 0,
      Chemistry: 0,
      Mathematics: 0,
    };

    dppList.forEach((set) => {
      const qLen = Array.isArray(set.questions) ? set.questions.length : 0;
      counts.All += qLen;
      if (set.subject === 'Physics' || set.subject === 'Chemistry' || set.subject === 'Mathematics') {
        counts[set.subject] += qLen;
      }
    });

    return counts;
  }, [dppList]);

  // Total questions count
  const totalQuestions = useMemo(() => {
    return dppList.reduce((sum, s) => sum + (Array.isArray(s.questions) ? s.questions.length : 0), 0);
  }, [dppList]);

  // Attempted sets count
  const attemptedSetsCount = useMemo(() => {
    return Object.values(attempts).filter(
      (a) => a.status === 'In Progress' || a.status === 'Completed'
    ).length;
  }, [attempts]);

  // Filtered sets list
  const filteredSets = useMemo(() => {
    return dppList.filter((set) => {
      // 1. Subject filter
      if (selectedSubject !== 'All' && set.subject !== selectedSubject) {
        return false;
      }

      // 2. Difficulty filter
      if (selectedDifficulty !== 'All' && set.difficulty !== selectedDifficulty) {
        return false;
      }

      // 3. Status filter
      if (selectedStatus !== 'All') {
        const attempt = attempts[set.id];
        const status = attempt ? attempt.status : 'Not Started';
        if (status !== selectedStatus) {
          return false;
        }
      }

      // 4. Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = (set.title || '').toLowerCase().includes(q);
        const matchesChapter = (set.chapter || '').toLowerCase().includes(q);
        const matchesTopic = (set.topic || '').toLowerCase().includes(q);
        const matchesSubject = (set.subject || '').toLowerCase().includes(q);
        return matchesTitle || matchesChapter || matchesTopic || matchesSubject;
      }

      return true;
    });
  }, [selectedSubject, selectedDifficulty, selectedStatus, searchQuery, attempts, dppList]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedDifficulty !== 'All' ||
    selectedStatus !== 'All' ||
    selectedSubject !== 'All';

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedDifficulty('All');
    setSelectedStatus('All');
    setSelectedSubject('All');
  };

  // Start or continue practice on a set
  const handleStartPractice = (setId: string) => {
    setActiveSetId(setId);
    setViewState('practice');
  };

  // Review a completed set
  const handleReviewPractice = (setId: string) => {
    setActiveSetId(setId);
    setViewState('results');
  };

  // Save intermediate responses
  const handleSaveProgress = (
    responses: Record<string, DPPQuestionResponse>,
    mode: 'practice' | 'test'
  ) => {
    if (!activeSetId) return;

    setAttempts((prev) => {
      const existing = prev[activeSetId];
      const answeredCount = Object.keys(responses).filter((id) => Boolean(responses[id]?.selectedOption)).length;
      const status = answeredCount > 0 ? 'In Progress' : 'Not Started';

      return {
        ...prev,
        [activeSetId]: {
          setId: activeSetId,
          status: existing?.status === 'Completed' ? 'Completed' : status,
          mode,
          responses,
          isSubmitted: Boolean(existing?.isSubmitted),
        },
      };
    });
  };

  // Submit practice session
  const handleSubmitPractice = (
    responses: Record<string, DPPQuestionResponse>,
    mode: 'practice' | 'test'
  ) => {
    if (!activeSetId) return;

    setAttempts((prev) => ({
      ...prev,
      [activeSetId]: {
        setId: activeSetId,
        status: 'Completed',
        mode,
        responses,
        isSubmitted: true,
      },
    }));

    setViewState('results');
  };

  // Switch to review answers view
  const handleReviewAnswers = () => {
    setViewState('review');
  };

  // Retry practice: reset responses and start fresh
  const handleRetryPractice = () => {
    if (!activeSetId) return;

    setAttempts((prev) => {
      const updated = { ...prev };
      delete updated[activeSetId];
      return updated;
    });

    setViewState('practice');
  };

  // Return to catalog
  const handleBackToCatalog = () => {
    setActiveSetId(null);
    setViewState('catalog');
  };

  return (
    <div className={styles.dppPage}>
      {/* Page Header: only displayed in catalog view for focus mode during practice */}
      {viewState === 'catalog' && (
        <DPPPageHeader
          totalSets={dppList.length}
          totalQuestions={totalQuestions}
          subjectsCount={3}
          attemptedSetsCount={attemptedSetsCount}
        />
      )}

      {/* Main Content Area */}
      <Container className={viewState === 'catalog' ? styles.pageContainer : styles.focusContainer}>
        {viewState === 'catalog' && (
          <section className={styles.catalogSection} aria-label="Daily Practice Problem Sets">
            <h2 className={styles.visuallyHidden}>Available Practice Problem Sets</h2>
            {/* Subject Selector Tabs */}
            <SubjectSelector
              selectedSubject={selectedSubject}
              onSelectSubject={setSelectedSubject}
              subjectCounts={subjectCounts}
            />

            {/* Search and Filters */}
            <DPPFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedSubject={selectedSubject}
              onSubjectChange={setSelectedSubject}
              selectedDifficulty={selectedDifficulty}
              onDifficultyChange={setSelectedDifficulty}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
              totalResults={filteredSets.length}
            />

            {/* Sets Cards Grid */}
            {filteredSets.length > 0 ? (
              <div className={styles.setsGrid}>
                {filteredSets.map((set) => (
                  <DPPSetCard
                    key={set.id}
                    set={set}
                    attempt={attempts[set.id]}
                    isUnlocked={isSetUnlocked(set)}
                    onStartPractice={(setId) => {
                      const target = dppList.find((s) => s.id === setId);
                      if (target && !isSetUnlocked(target)) {
                        handleUnlockDPP(target);
                        return;
                      }
                      handleStartPractice(setId);
                    }}
                    onReviewPractice={handleReviewPractice}
                    onUnlock={handleUnlockDPP}
                  />
                ))}
              </div>
            ) : (
              <DPPEmptyState
                onClearFilters={handleClearFilters}
                message={
                  searchQuery
                    ? `No DPP sets matched "${searchQuery}". Try searching for another topic or chapter.`
                    : 'No practice problem sets match your selected criteria.'
                }
              />
            )}
          </section>
        )}

        {/* Practice Mode or Review Mode */}
        {(viewState === 'practice' || viewState === 'review') && activeSet && (
          <DPPPracticeView
            set={activeSet}
            initialMode={attempts[activeSet.id]?.mode || 'practice'}
            isReviewMode={viewState === 'review'}
            isUnlocked={isSetUnlocked(activeSet)}
            savedResponses={attempts[activeSet.id]?.responses || {}}
            onSaveProgress={handleSaveProgress}
            onSubmitPractice={handleSubmitPractice}
            onBackToSets={handleBackToCatalog}
            onUnlock={() => handleUnlockDPP(activeSet)}
          />
        )}

        {/* Results Mode */}
        {viewState === 'results' && activeSet && attempts[activeSet.id] && (
          <DPPResults
            set={activeSet}
            attempt={attempts[activeSet.id]}
            onReviewAnswers={handleReviewAnswers}
            onRetryPractice={handleRetryPractice}
            onBackToSets={handleBackToCatalog}
          />
        )}
      </Container>

      {/* Unlock Complete DPP Paper Modal */}
      <PYQCourseUnlockModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        onEnroll={handleEnrollDPP}
        paperTitle={modalTargetSet?.title || activeSet?.title || 'DPP Problem Sheet'}
        paperPrice={modalTargetSet?.price ?? activeSet?.price ?? 299}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          zIndex: 99999,
          fontWeight: 600,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default DPPPage;
