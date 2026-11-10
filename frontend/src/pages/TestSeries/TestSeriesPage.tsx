import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
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
import { ScheduledTestModal } from '../../components/testSeries/ScheduledTestModal/ScheduledTestModal';
import { TestTakingView } from '../../components/testSeries/TestTakingView/TestTakingView';
import { TestResultsView } from '../../components/testSeries/TestResultsView/TestResultsView';
import { AnswerReviewView } from '../../components/testSeries/AnswerReviewView/AnswerReviewView';
import { TestEmptyState } from '../../components/testSeries/TestEmptyState/TestEmptyState';
import { TestSeriesUnlockModal } from '../../components/testSeries/TestSeriesUnlockModal/TestSeriesUnlockModal';
import { cmsService, CMS_EVENT_KEY } from '../../services/cmsService';
import { paymentService } from '../../services/paymentService';
import { requestFullScreen, exitFullScreen } from '../../utils/fullscreen';
import { useStudentAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/apiClient';
import type { TestSeriesItem } from '../../types';
import styles from './TestSeriesPage.module.scss';

// Local storage session key for Mock Test attempts
const TEST_STORAGE_KEY = 'dk_academy_test_attempts_v1';

export const TestSeriesPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params
  const urlExam = searchParams.get('exam');
  const urlFormat = searchParams.get('format');
  const urlSubject = searchParams.get('subject');
  const urlFilter = searchParams.get('filter');

  // Derive initial or URL-synced exam filter
  const selectedExam: ExamFilterValue = useMemo(() => {
    if (urlSubject?.toLowerCase() === 'mathematics' || urlFilter === 'math-speed' || urlExam === 'MathSpeed') return 'MathSpeed';
    if (urlFormat === 'Part Test' || urlExam === 'PartTest') return 'PartTest';
    if (urlExam === 'JEE Main') return 'JEE Main';
    if (urlExam === 'JEE Advanced') return 'JEE Advanced';
    if (urlExam === 'BITSAT') return 'BITSAT';
    if (urlExam === 'AllIndia' || urlFilter === 'all-india') return 'AllIndia';
    if (urlExam === 'All') return 'All';
    return 'All';
  }, [urlExam, urlFormat, urlSubject, urlFilter]);

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

  const { student, isAuthenticated } = useStudentAuth();

  // Session attempts state: persisted in localStorage so student progress and scores are retained
  const [attempts, setAttempts] = useState<Record<string, TestAttempt>>(() => {
    try {
      const globalStored = localStorage.getItem(TEST_STORAGE_KEY);
      const studentKey = student?.id ? `dk_tests_${student.id}` : null;
      const studentStored = studentKey ? localStorage.getItem(studentKey) : null;
      const globalObj = globalStored ? JSON.parse(globalStored) : {};
      const studentObj = studentStored ? JSON.parse(studentStored) : {};
      return { ...globalObj, ...studentObj };
    } catch {
      return {};
    }
  });

  // Save attempts to localStorage and dispatch real-time events
  useEffect(() => {
    try {
      localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(attempts));
      if (student?.id) {
        localStorage.setItem(`dk_tests_${student.id}`, JSON.stringify(attempts));
      }
      window.dispatchEvent(new CustomEvent('dk_test_attempts_updated', { detail: { attempts } }));
    } catch {
      // Ignore storage write issues
    }
  }, [attempts, student?.id]);

  // Additional Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilterValue>('All');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilterValue>('All');

  // URL Query Sync for Direct Links (from dashboard or notification)
  const urlParamTestId = searchParams.get('testId');
  const urlParamView = searchParams.get('view');

  // Active view states: 'catalog' | 'test' | 'results' | 'review'
  const [viewState, setViewState] = useState<'catalog' | 'test' | 'results' | 'review'>('catalog');
  const [activeTestId, setActiveTestId] = useState<string | null>(null);

  useEffect(() => {
    if (urlParamTestId) {
      setActiveTestId(urlParamTestId);
      if (urlParamView === 'results') {
        setViewState('results');
      } else if (urlParamView === 'test') {
        setViewState('test');
      } else if (urlParamView === 'review') {
        setViewState('review');
      }
    }
  }, [urlParamTestId, urlParamView]);

  // Instructions modal state
  const [instructionsModalTestId, setInstructionsModalTestId] = useState<string | null>(null);

  // Scheduled upcoming test announcement modal state
  const [scheduledModalData, setScheduledModalData] = useState<{ test: TestSeriesItem; formattedStartTime: string } | null>(null);

  const [testSeriesList, setTestSeriesList] = useState<TestSeriesItem[]>(() => cmsService.getTestSeries());

  useEffect(() => {
    // Sync latest from MongoDB
    const syncTestSeries = async () => {
      try {
        const items = await cmsService.fetchTestSeriesFromAPI(true);
        if (Array.isArray(items) && items.length > 0) {
          setTestSeriesList(items);
        }
      } catch (err) {
        console.warn('[TestSeriesPage] sync error:', err);
      }
    };

    syncTestSeries();

    const handleUpsert = (e: any) => {
      const incoming = e?.detail?.data || e?.detail;
      if (incoming && incoming.title && (incoming.id || incoming._id || incoming.slug)) {
        const targetId = incoming.id || incoming._id;
        setTestSeriesList((prev) => {
          const exists = prev.some(
            (t) => (targetId && (t.id === targetId || (t as any)._id === targetId)) || (incoming.slug && t.slug === incoming.slug)
          );
          if (exists) {
            return prev.map((t) =>
              (targetId && (t.id === targetId || (t as any)._id === targetId)) || (incoming.slug && t.slug === incoming.slug)
                ? { ...t, ...incoming }
                : t
            );
          } else {
            return [incoming, ...prev];
          }
        });
      }
      cmsService.fetchTestSeriesFromAPI(true).then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          setTestSeriesList(items);
        }
      }).catch(() => {});
    };

    const handleDeleteEvent = (e: any) => {
      const deletedId = typeof e?.detail === 'string' ? e.detail : e?.detail?.id || e?.detail?.data?.id;
      if (deletedId) {
        setTestSeriesList((prev) => prev.filter((t) => t.id !== deletedId && (t as any)._id !== deletedId && t.slug !== deletedId));
      } else {
        cmsService.fetchTestSeriesFromAPI(true).then((items) => {
          if (Array.isArray(items)) setTestSeriesList(items);
        }).catch(() => {});
      }
    };

    window.addEventListener(CMS_EVENT_KEY, handleUpsert);
    window.addEventListener('dk_test_series_created', handleUpsert);
    window.addEventListener('dk_test_series_updated', handleUpsert);
    window.addEventListener('dk_test_series_deleted', handleDeleteEvent);

    const pollInterval = setInterval(() => {
      cmsService.fetchTestSeriesFromAPI(true).then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          setTestSeriesList(items);
        }
      }).catch(() => {});
    }, 6000);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener(CMS_EVENT_KEY, handleUpsert);
      window.removeEventListener('dk_test_series_created', handleUpsert);
      window.removeEventListener('dk_test_series_updated', handleUpsert);
      window.removeEventListener('dk_test_series_deleted', handleDeleteEvent);
    };
  }, []);

  // Find active test object
  const activeTest = useMemo(() => {
    if (!activeTestId) return null;
    return testSeriesList.find((t) => t.id === activeTestId || (t as any)._id === activeTestId || t.slug === activeTestId) || null;
  }, [activeTestId, testSeriesList]);

  // Test selected for instructions modal
  const instructionTest = useMemo(() => {
    if (!instructionsModalTestId) return null;
    return testSeriesList.find((t) => t.id === instructionsModalTestId || (t as any)._id === instructionsModalTestId || t.slug === instructionsModalTestId) || null;
  }, [instructionsModalTestId, testSeriesList]);

  // Helpers for CBT tests categorization
  const isTestMathSpeed = (test: TestSeriesItem): boolean => {
    return (
      test.badgeCode === 'MATH SPEED' ||
      (test as any).examType === 'MathSpeed' ||
      test.title?.toLowerCase().includes('math speed') ||
      test.title?.toLowerCase().includes('speed drill') ||
      test.subtitle?.toLowerCase().includes('math speed')
    );
  };

  const isTestPart = (test: TestSeriesItem): boolean => {
    if (isTestMathSpeed(test)) return false;
    return (
      test.format === 'Part Test' ||
      test.badgeCode === 'PART TEST' ||
      (test as any).examType === 'PartTest' ||
      test.title?.toLowerCase().includes('part test') ||
      test.subtitle?.toLowerCase().includes('part test')
    );
  };

  const isTestAllIndia = (test: TestSeriesItem): boolean => {
    return (
      test.format === 'Full Mock' ||
      test.badgeCode === 'FULL CBT' ||
      test.badgeCode === 'ALL INDIA' ||
      test.title?.toLowerCase().includes('all india') ||
      test.title?.toLowerCase().includes('full mock') ||
      test.title?.toLowerCase().includes('cbt mock') ||
      (test as any).examType === 'AllIndia' ||
      (test.format !== 'Chapter Test' && (test.examType === 'JEE Main' || test.examType === 'JEE Advanced' || test.examType === 'BITSAT'))
    );
  };

  // Visible tests for students: Published or Scheduled (hide Draft and Archived)
  const visibleStudentTests = useMemo(() => {
    return testSeriesList.filter((test) => {
      const s = String(test.status || 'Published').toLowerCase();
      return s !== 'draft' && s !== 'archived';
    });
  }, [testSeriesList]);

  // Derive counts per exam from actual test data
  const examCounts = useMemo<Record<ExamFilterValue, number>>(() => {
    const counts: Record<ExamFilterValue, number> = {
      All: visibleStudentTests.length,
      AllIndia: 0,
      'JEE Main': 0,
      'JEE Advanced': 0,
      BITSAT: 0,
      PartTest: 0,
      MathSpeed: 0,
    };

    visibleStudentTests.forEach((test) => {
      if (isTestAllIndia(test)) counts.AllIndia += 1;
      if (isTestPart(test)) counts.PartTest += 1;
      if (isTestMathSpeed(test)) counts.MathSpeed += 1;
      if (test.examType === 'JEE Main' || test.badgeCode?.includes('JEE MAIN') || test.title?.toLowerCase().includes('jee main')) counts['JEE Main'] += 1;
      if (test.examType === 'JEE Advanced' || test.badgeCode?.includes('JEE ADVANCED') || test.title?.toLowerCase().includes('jee advanced')) counts['JEE Advanced'] += 1;
      if (test.examType === 'BITSAT' || test.badgeCode?.includes('BITSAT') || test.title?.toLowerCase().includes('bitsat')) counts.BITSAT += 1;
    });

    return counts;
  }, [visibleStudentTests]);

  // Total questions count across all tests
  const totalQuestions = useMemo(() => {
    return visibleStudentTests.reduce((sum, t) => sum + (t.questions?.length || 0), 0);
  }, [visibleStudentTests]);

  // Attempted tests count
  const attemptedTestsCount = useMemo(() => {
    return Object.values(attempts).filter(
      (a) => a.status === 'In Progress' || a.status === 'Completed'
    ).length;
  }, [attempts]);

  // Paid Test Unlock & Monetization State
  const [unlockedMockTestIds, setUnlockedMockTestIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('unlocked_mock_test_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [modalTargetTest, setModalTargetTest] = useState<TestSeriesItem | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const isTestUnlocked = (test: TestSeriesItem): boolean => {
    // If not marked paid or explicitly free, it is open
    if (test.isFree !== false && test.accessMode !== 'paid') return true;
    const testId = test.id || (test as any)._id;
    // Check local unlocked cache
    if (unlockedMockTestIds.includes(testId)) return true;
    // Check student enrolled list
    if (student?.id && Array.isArray((test as any).unlockedStudents) && (test as any).unlockedStudents.includes(student.id)) {
      return true;
    }
    return false;
  };

  const handleUnlockTest = (test: TestSeriesItem) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    setModalTargetTest(test);
    setIsUnlockModalOpen(true);
  };

  const handlePayAndUnlockTest = async () => {
    if (!modalTargetTest) return;
    if (!isAuthenticated || !student) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    const testId = modalTargetTest.id || (modalTargetTest as any)._id;
    const price = modalTargetTest.price || 299;

    setIsProcessingPayment(true);

    try {
      await paymentService.initiateCourseCheckout({
        amount: price,
        courseId: `test_series_${testId}`,
        courseTitle: `${modalTargetTest.title} (CBT Test Series)`,
        studentName: student.name || 'Student',
        studentEmail: student.email || '',
        studentPhone: student.phone || '',
        onSuccess: (paymentId) => {
          setIsProcessingPayment(false);
          setIsUnlockModalOpen(false);
          // Unlock test locally and notify backend
          setUnlockedMockTestIds((prev) => {
            const next = Array.from(new Set([...prev, testId]));
            try {
              localStorage.setItem('unlocked_mock_test_ids', JSON.stringify(next));
            } catch {}
            return next;
          });
          apiClient.post(`/test-series/${testId}/unlock`, { paymentId }).catch(() => {});
          handleOpenInstructions(testId);
        },
        onError: (err) => {
          setIsProcessingPayment(false);
          console.warn('[Test Series Payment Failed or Closed]:', err);
        }
      });
    } catch (err) {
      setIsProcessingPayment(false);
      console.error('[Test Series Payment Error]:', err);
    }
  };

  // Filtered test catalog
  const filteredTests = useMemo(() => {
    return visibleStudentTests.filter((test) => {
      // 1. Strict Exam Categorization
      if (selectedExam === 'AllIndia') {
        if (!isTestAllIndia(test)) return false;
      } else if (selectedExam === 'PartTest') {
        if (!isTestPart(test)) return false;
      } else if (selectedExam === 'MathSpeed') {
        if (!isTestMathSpeed(test)) return false;
      } else if (selectedExam === 'JEE Main') {
        if (test.examType !== 'JEE Main' && !test.badgeCode?.includes('JEE MAIN') && !test.title?.toLowerCase().includes('jee main')) return false;
      } else if (selectedExam === 'JEE Advanced') {
        if (test.examType !== 'JEE Advanced' && !test.badgeCode?.includes('JEE ADVANCED') && !test.title?.toLowerCase().includes('jee advanced')) return false;
      } else if (selectedExam === 'BITSAT') {
        if (test.examType !== 'BITSAT' && !test.title?.toLowerCase().includes('bitsat') && !test.badgeCode?.includes('BITSAT')) return false;
      } else if (selectedExam !== 'All' && test.examType !== selectedExam) {
        return false;
      }

      // 2. Format filter
      if (selectedFormat !== 'All') {
        if (selectedFormat === 'Part Test') {
          if (!isTestPart(test)) return false;
        } else if (test.format !== selectedFormat) {
          return false;
        }
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
  }, [selectedExam, selectedFormat, selectedSubject, selectedDifficulty, selectedStatus, searchQuery, attempts, visibleStudentTests]);

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
      nextParams.delete('format');
      nextParams.set('subject', 'Mathematics');
    } else if (exam === 'PartTest') {
      nextParams.delete('exam');
      nextParams.delete('subject');
      nextParams.set('format', 'Part Test');
    } else if (exam === 'JEE Main') {
      nextParams.delete('subject');
      nextParams.delete('format');
      nextParams.set('exam', 'JEE Main');
    } else if (exam === 'JEE Advanced') {
      nextParams.delete('subject');
      nextParams.delete('format');
      nextParams.set('exam', 'JEE Advanced');
    } else if (exam === 'BITSAT') {
      nextParams.delete('subject');
      nextParams.delete('format');
      nextParams.set('exam', 'BITSAT');
    } else {
      nextParams.delete('exam');
      nextParams.delete('format');
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
    const targetTest = testSeriesList.find((t) => t.id === testId || (t as any)._id === testId || t.slug === testId);
    if (targetTest && !isTestUnlocked(targetTest)) {
      handleUnlockTest(targetTest);
      return;
    }
    if (targetTest?.status === 'Scheduled' && targetTest.schedule?.endWindow) {
      const endTime = new Date(targetTest.schedule.endWindow).getTime();
      if (Date.now() > endTime) {
        showToast('⚠️ This examination window is closed. Candidates cannot enter closed tests.');
        return;
      }
    }
    setInstructionsModalTestId(testId);
  };

  // Start test from instructions modal
  const handleStartTest = (testId: string) => {
    const now = Date.now();
    const targetTest = testSeriesList.find((t) => t.id === testId || (t as any)._id === testId || t.slug === testId);
    if (targetTest && !isTestUnlocked(targetTest)) {
      handleUnlockTest(targetTest);
      return;
    }
    if (targetTest?.status === 'Scheduled' && targetTest.schedule?.endWindow) {
      const endTime = new Date(targetTest.schedule.endWindow).getTime();
      if (now > endTime) {
        showToast('⚠️ This examination window is closed. Candidates cannot enter closed tests.');
        return;
      }
    }

    requestFullScreen().catch(() => {});
    setInstructionsModalTestId(null);
    setActiveTestId(testId);

    const testDurationMinutes = Number(targetTest?.durationMinutes) > 0 ? Number(targetTest?.durationMinutes) : 180;

    // Initialize attempt with timestamp if not existing or if stale/expired
    setAttempts((prev) => {
      const existing = prev[testId];
      const existingStart = existing?.startTime ?? 0;
      const isExistingActive =
        Boolean(existing) &&
        existing?.status === 'In Progress' &&
        existingStart > 0 &&
        now - existingStart < testDurationMinutes * 60 * 1000;

      if (isExistingActive) {
        return prev;
      }

      return {
        ...prev,
        [testId]: {
          testId,
          status: 'In Progress',
          startTime: now,
          timeSpentSeconds: 0,
          responses: {},
          isSubmitted: false,
        },
      };
    });

    setViewState('test');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  // Resume an in-progress test
  const handleResumeTest = (testId: string) => {
    const targetTest = testSeriesList.find((t) => t.id === testId || (t as any)._id === testId || t.slug === testId);
    if (targetTest && !isTestUnlocked(targetTest)) {
      handleUnlockTest(targetTest);
      return;
    }
    requestFullScreen().catch(() => {});
    setActiveTestId(testId);

    const now = Date.now();
    const testDurationMinutes = Number(targetTest?.durationMinutes) > 0 ? Number(targetTest?.durationMinutes) : 180;

    setAttempts((prev) => {
      const existing = prev[testId];
      const existingStart = existing?.startTime ?? 0;
      const isExpired = !existingStart || now - existingStart >= testDurationMinutes * 60 * 1000;

      if (isExpired) {
        return {
          ...prev,
          [testId]: {
            testId,
            status: 'In Progress',
            startTime: now,
            timeSpentSeconds: 0,
            responses: existing?.responses || {},
            isSubmitted: false,
          },
        };
      }
      return prev;
    });

    setViewState('test');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  // Save intermediate responses with instant local caching & asynchronous cloud sync
  const handleSaveProgress = async (responses: Record<string, TestQuestionResponse>) => {
    if (!activeTestId) return;

    const existing = attempts[activeTestId];
    const startTime = existing?.startTime || Date.now();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    const updatedAttempt: TestAttempt = {
      testId: activeTestId,
      status: existing?.status === 'Completed' ? 'Completed' : 'In Progress',
      startTime,
      timeSpentSeconds: elapsed,
      responses,
      isSubmitted: Boolean(existing?.isSubmitted),
    };

    setAttempts((prev) => {
      const next = {
        ...prev,
        [activeTestId]: updatedAttempt,
      };

      try {
        localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(next));
        if (student?.id) {
          localStorage.setItem(`dk_tests_${student.id}`, JSON.stringify(next));
        }
        window.dispatchEvent(new CustomEvent('dk_test_attempts_updated', { detail: { attempts: next } }));
      } catch {}

      return next;
    });

    // Cloud autosave with monotonic timestamp and student identity
    try {
      const res = await apiClient.post<any>(`/test-series/${activeTestId}/autosave`, {
        responses,
        timeSpentSeconds: elapsed,
        clientTimestamp: Date.now(),
        studentId: student?.id || (student as any)?._id
      });
      return res;
    } catch (cloudErr) {
      // Re-throw so TestTakingView exponential backoff can track failure and schedule jittered retry
      throw cloudErr;
    }
  };

  // Submit test with individual automated solution scheduling
  const handleSubmitTest = (responses: Record<string, TestQuestionResponse>) => {
    exitFullScreen().catch(() => {});
    if (!activeTestId) return;

    const existing = attempts[activeTestId];
    const startTime = existing?.startTime || Date.now();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const clientSubmissionId = `sub_${activeTestId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const nowTs = Date.now();
    const activeTestObj = testSeriesList.find((t) => t.id === activeTestId);
    const releaseDelayHours = activeTestObj?.solutionRelease?.releaseDelayHours || 24;
    const defaultUnlockAt = nowTs + (releaseDelayHours * 60 * 60 * 1000);

    const initialAttempt: TestAttempt = {
      testId: activeTestId,
      status: 'Completed',
      startTime,
      timeSpentSeconds: elapsed,
      responses,
      isSubmitted: true,
      submittedAt: nowTs,
      submissionId: clientSubmissionId,
      solutionUnlockAt: defaultUnlockAt,
      solutionSchedule: {
        enabled: activeTestObj?.solutionRelease?.enabled ?? true,
        releaseDelayHours,
        solutionUnlockAt: defaultUnlockAt,
        isUnlocked: false,
        hasPdf: activeTestObj?.solutionRelease?.hasPdf,
        hasVideo: activeTestObj?.solutionRelease?.hasVideo
      }
    };

    setAttempts((prev) => {
      const next = {
        ...prev,
        [activeTestId]: initialAttempt,
      };

      try {
        localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(next));
        if (student?.id) {
          localStorage.setItem(`dk_tests_${student.id}`, JSON.stringify(next));
        }
        window.dispatchEvent(new CustomEvent('dk_test_submitted', { detail: { testId: activeTestId, attempt: initialAttempt } }));
        window.dispatchEvent(new CustomEvent('dk_test_attempts_updated', { detail: { attempts: next } }));
      } catch (err) {
        console.warn('Storage sync error:', err);
      }

      return next;
    });

    // Asynchronously submit to backend server to record persistent server timestamp and schedule
    apiClient.post<any>(`/test-series/${activeTestId}/submit`, {
      responses,
      timeSpentSeconds: elapsed,
      clientSubmissionId,
      studentId: student?.id,
      studentEmail: student?.email,
      studentName: student?.name
    }).then((res) => {
      if (res && res.success && res.data) {
        const sData = res.data;
        setAttempts((prev) => {
          const cur = prev[activeTestId];
          if (!cur) return prev;
          const updated: TestAttempt = {
            ...cur,
            submissionId: sData.submissionId,
            submittedAt: new Date(sData.submittedAt).getTime(),
            solutionUnlockAt: new Date(sData.solutionSchedule.solutionUnlockAt).getTime(),
            solutionSchedule: sData.solutionSchedule
          };
          const next = { ...prev, [activeTestId]: updated };
          try {
            localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(next));
            if (student?.id) localStorage.setItem(`dk_tests_${student.id}`, JSON.stringify(next));
            window.dispatchEvent(new CustomEvent('dk_test_attempts_updated', { detail: { attempts: next } }));
          } catch {}
          return next;
        });
      }
    }).catch((err) => {
      console.warn('[handleSubmitTest backend sync]:', err);
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
    exitFullScreen().catch(() => {});
    setActiveTestId(null);
    setViewState('catalog');
  };

  // Ensure body lock and hide public website navbar/footer during active CBT test
  useEffect(() => {
    if (viewState === 'test') {
      document.body.classList.add('cbt-exam-active');
      document.documentElement.classList.add('cbt-exam-active');
    } else {
      document.body.classList.remove('cbt-exam-active');
      document.documentElement.classList.remove('cbt-exam-active');
    }

    return () => {
      document.body.classList.remove('cbt-exam-active');
      document.documentElement.classList.remove('cbt-exam-active');
    };
  }, [viewState]);

  // Exam Recovery: Automatically restore answers from cloud autosave if local responses are missing
  useEffect(() => {
    if (viewState === 'test' && activeTest && (student?.id || (student as any)?._id)) {
      const activeKey = activeTest.id || (activeTest as any)._id;
      const current = attempts[activeKey];
      if (!current?.responses || Object.keys(current.responses).length === 0) {
        const studentIdentifier = student?.id || (student as any)?._id;
        apiClient.get<any>(`/test-series/${activeKey}/progress?studentId=${studentIdentifier}`)
          .then((res) => {
            if (res?.success && res.data?.responses && Object.keys(res.data.responses).length > 0) {
              setAttempts((prev) => ({
                ...prev,
                [activeKey]: {
                  ...(prev[activeKey] || {
                    testId: activeKey,
                    status: 'In Progress',
                    startTime: Date.now() - (res.data.timeSpentSeconds || 0) * 1000
                  }),
                  responses: res.data.responses,
                  timeSpentSeconds: res.data.timeSpentSeconds || 0
                }
              }));
            }
          })
          .catch(() => {});
      }
    }
  }, [viewState, activeTest, student]);

  // When active exam is taking place, render completely isolated fullscreen interface
  // (No public header, no website navbar, no footer, no padding)
  if (viewState === 'test' && activeTest) {
    const activeKey = activeTest.id || (activeTest as any)._id || 'test';
    const currentAttempt = attempts[activeKey] || attempts[activeTest.id];
    const durationMins = Number(activeTest.durationMinutes) > 0 ? Number(activeTest.durationMinutes) : 180;
    const durationMs = durationMins * 60 * 1000;
    const now = Date.now();
    const isAttemptValid =
      Boolean(currentAttempt) &&
      currentAttempt?.status === 'In Progress' &&
      typeof currentAttempt?.startTime === 'number' &&
      currentAttempt.startTime > 0 &&
      now - currentAttempt.startTime < durationMs;

    const effectiveStartTime = isAttemptValid && currentAttempt?.startTime ? currentAttempt.startTime : now;

    return (
      <div className={styles.fullscreenCbtWrapper}>
        <TestTakingView
          test={activeTest}
          startTime={effectiveStartTime}
          savedResponses={currentAttempt?.responses || {}}
          onSaveProgress={handleSaveProgress}
          onSubmitTest={handleSubmitTest}
          onExitTest={handleBackToCatalog}
        />
      </div>
    );
  }

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
                    isLocked={!isTestUnlocked(test)}
                    onUnlock={handleUnlockTest}
                    onOpenInstructions={handleOpenInstructions}
                    onResumeTest={handleResumeTest}
                    onViewResults={handleViewResults}
                    onOpenScheduledNotice={(targetTest, time) =>
                      setScheduledModalData({ test: targetTest, formattedStartTime: time })
                    }
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

        {/* Scheduled Upcoming Live CBT Mock Modal */}
        <ScheduledTestModal
          isOpen={Boolean(scheduledModalData)}
          onClose={() => setScheduledModalData(null)}
          test={scheduledModalData?.test || null}
          formattedStartTime={scheduledModalData?.formattedStartTime || ''}
        />

        {/* Paid Test Series Unlock & Payment Modal */}
        <TestSeriesUnlockModal
          isOpen={isUnlockModalOpen}
          test={modalTargetTest}
          isProcessing={isProcessingPayment}
          onPayAndUnlock={handlePayAndUnlockTest}
          onClose={() => {
            if (!isProcessingPayment) {
              setIsUnlockModalOpen(false);
            }
          }}
        />
      </Container>
    </div>
  );
};

export default TestSeriesPage;
