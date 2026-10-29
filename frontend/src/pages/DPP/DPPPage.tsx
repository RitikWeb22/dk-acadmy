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
import { cmsService, CMS_EVENT_KEY } from '../../services/cmsService';
import type { DPPSet } from '../../types';
import styles from './DPPPage.module.scss';

// Local storage session key for DPP practice attempts
const DPP_STORAGE_KEY = 'dk_academy_dpp_attempts_v1';

export const DPPPage: React.FC = () => {
  const [dppList, setDppList] = useState<DPPSet[]>(() => cmsService.getDPPSets());

  useEffect(() => {
    const handleUpdate = () => setDppList(cmsService.getDPPSets());
    window.addEventListener(CMS_EVENT_KEY, handleUpdate);
    return () => window.removeEventListener(CMS_EVENT_KEY, handleUpdate);
  }, []);

  // Session attempts state: persisted in localStorage so student progress is remembered during practice sessions
  const [attempts, setAttempts] = useState<Record<string, DPPAttempt>>(() => {
    try {
      const stored = localStorage.getItem(DPP_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Save attempts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DPP_STORAGE_KEY, JSON.stringify(attempts));
    } catch {
      // Ignore storage write issues
    }
  }, [attempts]);

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
      counts.All += set.questions.length;
      if (set.subject === 'Physics' || set.subject === 'Chemistry' || set.subject === 'Mathematics') {
        counts[set.subject] += set.questions.length;
      }
    });

    return counts;
  }, [dppList]);

  // Total questions count
  const totalQuestions = useMemo(() => {
    return dppList.reduce((sum, s) => sum + s.questions.length, 0);
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
        const matchesTitle = set.title.toLowerCase().includes(q);
        const matchesChapter = set.chapter.toLowerCase().includes(q);
        const matchesTopic = set.topic.toLowerCase().includes(q);
        const matchesSubject = set.subject.toLowerCase().includes(q);
        return matchesTitle || matchesChapter || matchesTopic || matchesSubject;
      }

      return true;
    });
  }, [selectedSubject, selectedDifficulty, selectedStatus, searchQuery, attempts]);

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
                    onStartPractice={handleStartPractice}
                    onReviewPractice={handleReviewPractice}
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
            savedResponses={attempts[activeSet.id]?.responses || {}}
            onSaveProgress={handleSaveProgress}
            onSubmitPractice={handleSubmitPractice}
            onBackToSets={handleBackToCatalog}
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
    </div>
  );
};

export default DPPPage;
