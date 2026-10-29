import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type {
  TestAttempt,
  TestQuestionResponse,
} from '../../types';
import { Container } from '../../components/ui/Container/Container';
import { TestSeriesHeader } from '../../components/testSeries/TestSeriesHeader/TestSeriesHeader';
import {
  TestSeriesFilters,
  type ExamFilterValue,
  type FormatFilterValue,
  type DifficultyFilterValue,
  type StatusFilterValue,
} from '../../components/testSeries/TestSeriesFilters/TestSeriesFilters';
import { TestCard } from '../../components/testSeries/TestCard/TestCard';
import { TestInstructionsModal } from '../../components/testSeries/TestInstructionsModal/TestInstructionsModal';
import { TestTakingView } from '../../components/testSeries/TestTakingView/TestTakingView';
import { TestResultsView } from '../../components/testSeries/TestResultsView/TestResultsView';
import { AnswerReviewView } from '../../components/testSeries/AnswerReviewView/AnswerReviewView';
import { TestEmptyState } from '../../components/testSeries/TestEmptyState/TestEmptyState';
import { cmsService, CMS_EVENT_KEY } from '../../services/cmsService';
import type { TestSeriesItem } from '../../types';
import styles from './TestSeriesPage.module.scss';

// Local storage session key for Mock Test attempts
const TEST_STORAGE_KEY = 'dk_academy_test_attempts_v1';

export const TestSeriesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params
  const urlExam = searchParams.get('exam');
  const urlFormat = searchParams.get('format');
  const urlSubject = searchParams.get('subject');
  const urlFilter = searchParams.get('filter');

  // Derive initial or URL-synced exam filter
  const selectedExam: ExamFilterValue = useMemo(() => {
    if (urlSubject?.toLowerCase() === 'mathematics' || urlFilter === 'math-speed') return 'MathSpeed';
    if (urlExam === 'JEE Main') return 'JEE Main';
    if (urlExam === 'JEE Advanced') return 'JEE Advanced';
    return 'All';
  }, [urlExam, urlSubject, urlFilter]);

  // Derive initial or URL-synced format filter
  const selectedFormat: FormatFilterValue = useMemo(() => {
    if (urlFormat === 'Full Mock') return 'Full Mock';
    if (urlFormat === 'Part Test') return 'Part Test';
    if (urlFormat === 'Chapter Test') return 'Chapter Test';
    return 'All';
  }, [urlFormat]);

  // Derive initial or URL-synced subject filter
  const selectedSubject: 'All' | 'Mathematics' | 'Physics' | 'Chemistry' = useMemo(() => {
    if (urlSubject?.toLowerCase() === 'mathematics' || urlFilter === 'math-speed') return 'Mathematics';
    if (urlSubject?.toLowerCase() === 'physics') return 'Physics';
    if (urlSubject?.toLowerCase() === 'chemistry') return 'Chemistry';
    return 'All';
  }, [urlSubject, urlFilter]);

  // Session attempts state: persisted in localStorage so student progress and scores are retained
  const [attempts, setAttempts] = useState<Record<string, TestAttempt>>(() => {
    try {
      const stored = localStorage.getItem(TEST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Save attempts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(attempts));
    } catch {
      // Ignore storage write issues
    }
  }, [attempts]);

  // Additional Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilterValue>('All');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilterValue>('All');

  // Active view states: 'catalog' | 'test' | 'results' | 'review'
  const [viewState, setViewState] = useState<'catalog' | 'test' | 'results' | 'review'>('catalog');
  const [activeTestId, setActiveTestId] = useState<string | null>(null);

  // Instructions modal state
  const [instructionsModalTestId, setInstructionsModalTestId] = useState<string | null>(null);

  const [testSeriesList, setTestSeriesList] = useState<TestSeriesItem[]>(() => cmsService.getTestSeries());

  useEffect(() => {
    // Sync latest from MongoDB
    cmsService.fetchTestSeriesFromAPI().then((items) => {
      if (items && items.length > 0) {
        setTestSeriesList(items);
      }
    }).catch(() => {});

    const handleUpdate = () => {
      setTestSeriesList(cmsService.getTestSeries());
    };

    window.addEventListener(CMS_EVENT_KEY, handleUpdate);
    window.addEventListener('dk_test_series_created', handleUpdate);
    window.addEventListener('dk_test_series_updated', handleUpdate);
    window.addEventListener('dk_test_series_deleted', handleUpdate);

    return () => {
      window.removeEventListener(CMS_EVENT_KEY, handleUpdate);
      window.removeEventListener('dk_test_series_created', handleUpdate);
      window.removeEventListener('dk_test_series_updated', handleUpdate);
      window.removeEventListener('dk_test_series_deleted', handleUpdate);
    };
  }, []);

  // Find active test object
  const activeTest = useMemo(() => {
    if (!activeTestId) return null;
    return testSeriesList.find((t) => t.id === activeTestId) || null;
  }, [activeTestId, testSeriesList]);

  // Test selected for instructions modal
  const instructionTest = useMemo(() => {
    if (!instructionsModalTestId) return null;
    return testSeriesList.find((t) => t.id === instructionsModalTestId) || null;
  }, [instructionsModalTestId, testSeriesList]);

  // Derive counts per exam from actual test data
  const examCounts = useMemo<Record<ExamFilterValue, number>>(() => {
    const counts: Record<ExamFilterValue, number> = {
      All: testSeriesList.length,
      'JEE Main': 0,
      'JEE Advanced': 0,
      'BITSAT': 0,
      MathSpeed: 0,
    };

    testSeriesList.forEach((test) => {
      if (test.examType === 'JEE Main') counts['JEE Main'] += 1;
      if (test.examType === 'JEE Advanced') counts['JEE Advanced'] += 1;
      if (test.examType === 'BITSAT') counts['BITSAT'] += 1;
      if (test.subjects.includes('Mathematics') && test.subjects.length === 1) counts['MathSpeed'] += 1;
    });

    return counts;
  }, [testSeriesList]);

  // Total questions count across all tests
  const totalQuestions = useMemo(() => {
    return testSeriesList.reduce((sum, t) => sum + t.questions.length, 0);
  }, [testSeriesList]);

  // Attempted tests count
  const attemptedTestsCount = useMemo(() => {
    return Object.values(attempts).filter(
      (a) => a.status === 'In Progress' || a.status === 'Completed'
    ).length;
  }, [attempts]);

  // Filtered test catalog
  const filteredTests = useMemo(() => {
    return testSeriesList.filter((test) => {
      // 1. Exam or MathSpeed filter
      if (selectedExam === 'MathSpeed') {
        if (!test.subjects.includes('Mathematics') || test.subjects.length !== 1) return false;
      } else if (selectedExam !== 'All' && test.examType !== selectedExam) {
        return false;
      }

      // 2. Format filter
      if (selectedFormat !== 'All' && test.format !== selectedFormat) {
        return false;
      }

      // 3. Subject / DK Sir Math Speed filter
      if (selectedSubject !== 'All') {
        const hasSubject = test.subjects.includes(selectedSubject);
        const isMathSpecial =
          test.id.includes('math-speed') ||
          test.title.includes('Math') ||
          test.title.includes('DK Sir');
        if (selectedSubject === 'Mathematics') {
          if (!hasSubject && !isMathSpecial) return false;
        } else if (!hasSubject) {
          return false;
        }
      }

      // 4. Difficulty filter
      if (selectedDifficulty !== 'All' && test.difficulty !== selectedDifficulty) {
        return false;
      }

      // 5. Status filter
      if (selectedStatus !== 'All') {
        const attempt = attempts[test.id];
        const status = attempt ? attempt.status : 'Not Started';
        if (status !== selectedStatus) {
          return false;
        }
      }

      // 6. Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = test.title.toLowerCase().includes(q);
        const matchesSubtitle = test.subtitle.toLowerCase().includes(q);
        const matchesSubjects = test.subjects.some((s) => s.toLowerCase().includes(q));
        const matchesChapters = test.questions.some((item) =>
          item.chapter.toLowerCase().includes(q)
        );
        return matchesTitle || matchesSubtitle || matchesSubjects || matchesChapters;
      }

      return true;
    });
  }, [selectedExam, selectedFormat, selectedSubject, selectedDifficulty, selectedStatus, searchQuery, attempts]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedExam !== 'All' ||
    selectedFormat !== 'All' ||
    selectedSubject !== 'All' ||
    selectedDifficulty !== 'All' ||
    selectedStatus !== 'All';

  const handleSelectExam = (exam: ExamFilterValue) => {
    const nextParams = new URLSearchParams(searchParams);
    if (exam === 'MathSpeed') {
      nextParams.delete('exam');
      nextParams.set('subject', 'Mathematics');
    } else if (exam === 'JEE Main') {
      nextParams.delete('subject');
      nextParams.set('exam', 'JEE Main');
    } else if (exam === 'JEE Advanced') {
      nextParams.delete('subject');
      nextParams.set('exam', 'JEE Advanced');
    } else {
      nextParams.delete('exam');
      nextParams.delete('subject');
      nextParams.delete('filter');
    }
    setSearchParams(nextParams);
  };

  const handleSelectFormat = (format: FormatFilterValue) => {
    const nextParams = new URLSearchParams(searchParams);
    if (format === 'All') {
      nextParams.delete('format');
    } else {
      nextParams.set('format', format);
    }
    setSearchParams(nextParams);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedDifficulty('All');
    setSelectedStatus('All');
    setSearchParams({});
  };

  // Open instructions modal
  const handleOpenInstructions = (testId: string) => {
    setInstructionsModalTestId(testId);
  };

  // Start test from instructions modal
  const handleStartTest = (testId: string) => {
    setInstructionsModalTestId(null);
    setActiveTestId(testId);

    // Initialize attempt with timestamp if not existing
    setAttempts((prev) => {
      const existing = prev[testId];
      if (existing && existing.status === 'In Progress') {
        return prev;
      }

      return {
        ...prev,
        [testId]: {
          testId,
          status: 'In Progress',
          startTime: Date.now(),
          timeSpentSeconds: 0,
          responses: {},
          isSubmitted: false,
        },
      };
    });

    setViewState('test');
  };

  // Resume an in-progress test
  const handleResumeTest = (testId: string) => {
    setActiveTestId(testId);
    setViewState('test');
  };

  // Save intermediate responses
  const handleSaveProgress = (responses: Record<string, TestQuestionResponse>) => {
    if (!activeTestId) return;

    setAttempts((prev) => {
      const existing = prev[activeTestId];
      const startTime = existing?.startTime || Date.now();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);

      return {
        ...prev,
        [activeTestId]: {
          testId: activeTestId,
          status: existing?.status === 'Completed' ? 'Completed' : 'In Progress',
          startTime,
          timeSpentSeconds: elapsed,
          responses,
          isSubmitted: Boolean(existing?.isSubmitted),
        },
      };
    });
  };

  // Submit test
  const handleSubmitTest = (responses: Record<string, TestQuestionResponse>) => {
    if (!activeTestId) return;

    setAttempts((prev) => {
      const existing = prev[activeTestId];
      const startTime = existing?.startTime || Date.now();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);

      return {
        ...prev,
        [activeTestId]: {
          testId: activeTestId,
          status: 'Completed',
          startTime,
          timeSpentSeconds: elapsed,
          responses,
          isSubmitted: true,
          submittedAt: Date.now(),
        },
      };
    });

    setViewState('results');
  };

  // View results for completed test
  const handleViewResults = (testId: string) => {
    setActiveTestId(testId);
    setViewState('results');
  };

  // Review detailed answers
  const handleReviewAnswers = () => {
    setViewState('review');
  };

  // Retake test
  const handleRetryTest = () => {
    if (!activeTestId) return;

    setAttempts((prev) => {
      const updated = { ...prev };
      delete updated[activeTestId];
      return updated;
    });

    // Start fresh
    handleStartTest(activeTestId);
  };

  // Return to catalog
  const handleBackToCatalog = () => {
    setActiveTestId(null);
    setViewState('catalog');
  };

  return (
    <div className={styles.testSeriesPage}>
      {/* Page Header */}
      <TestSeriesHeader
        totalTests={testSeriesList.length}
        totalQuestions={totalQuestions}
        availableExamsCount={2}
        attemptedTestsCount={attemptedTestsCount}
      />

      {/* Main Content Area */}
      <Container className={styles.pageContainer}>
        {viewState === 'catalog' && (
          <section className={styles.catalogSection} aria-label="Available Mock Tests">
            {/* Section Heading & Chapter-wise Link */}
            <div className={styles.sectionHeader}>
              <h2 id="available-mock-tests" className={styles.sectionTitle}>
                {selectedExam === 'MathSpeed'
                  ? 'DK Sir Math Speed & Accuracy CBT Series'
                  : selectedExam === 'JEE Advanced'
                  ? 'JEE Advanced Simulation Engine Mocks'
                  : selectedExam === 'JEE Main'
                  ? 'JEE Main All-India CBT Mock Tests'
                  : 'All India CBT Mock Tests & Simulation'}
              </h2>
              <Link to="/pyq" className={styles.pyqHintLink} title="Practice chapter-wise previous year questions & DPP tests">
                <span>Practice Chapter-Wise PYQ &amp; DPP Tests</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>

            {/* Single Responsive Filter Toolbar */}
            <TestSeriesFilters
              selectedExam={selectedExam}
              onSelectExam={handleSelectExam}
              examCounts={examCounts}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedFormat={selectedFormat}
              onFormatChange={handleSelectFormat}
              selectedDifficulty={selectedDifficulty}
              onDifficultyChange={setSelectedDifficulty}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
              totalResults={filteredTests.length}
            />

            {/* Test Cards Grid */}
            {filteredTests.length > 0 ? (
              <div className={styles.testsGrid}>
                {filteredTests.map((test) => (
                  <TestCard
                    key={test.id}
                    test={test}
                    attempt={attempts[test.id]}
                    onOpenInstructions={handleOpenInstructions}
                    onResumeTest={handleResumeTest}
                    onViewResults={handleViewResults}
                  />
                ))}
              </div>
            ) : (
              <TestEmptyState
                onClearFilters={handleClearFilters}
                message={
                  searchQuery
                    ? `No mock tests matched "${searchQuery}". Try searching for another topic or chapter.`
                    : 'No mock tests match your selected criteria.'
                }
              />
            )}
          </section>
        )}

        {/* Test-Taking Mode */}
        {viewState === 'test' && activeTest && (
          <TestTakingView
            test={activeTest}
            startTime={attempts[activeTest.id]?.startTime ?? 0}
            savedResponses={attempts[activeTest.id]?.responses || {}}
            onSaveProgress={handleSaveProgress}
            onSubmitTest={handleSubmitTest}
            onExitTest={handleBackToCatalog}
          />
        )}

        {/* Results Analysis Mode */}
        {viewState === 'results' && activeTest && attempts[activeTest.id] && (
          <TestResultsView
            test={activeTest}
            attempt={attempts[activeTest.id]}
            onReviewAnswers={handleReviewAnswers}
            onRetryTest={handleRetryTest}
            onBackToCatalog={handleBackToCatalog}
          />
        )}

        {/* Detailed Solutions Review Mode */}
        {viewState === 'review' && activeTest && attempts[activeTest.id] && (
          <AnswerReviewView
            test={activeTest}
            attempt={attempts[activeTest.id]}
            onBackToResults={() => setViewState('results')}
            onBackToCatalog={handleBackToCatalog}
          />
        )}

        {/* Instructions Modal */}
        <TestInstructionsModal
          test={instructionTest}
          isOpen={Boolean(instructionTest)}
          onClose={() => setInstructionsModalTestId(null)}
          onStartTest={handleStartTest}
        />
      </Container>
    </div>
  );
};

export default TestSeriesPage;
