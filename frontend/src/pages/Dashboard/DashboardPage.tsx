import React, { useState, useEffect, useMemo } from 'react';
import { useStudentAuth } from '../../context/AuthContext';
import { Container } from '../../components/ui/Container/Container';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader/DashboardHeader';
import { DashboardStats } from '../../components/dashboard/DashboardStats/DashboardStats';
import type { ContinueLearningItem } from '../../components/dashboard/ContinueLearningCard/ContinueLearningCard';
import { TodayPlan } from '../../components/dashboard/TodayPlan/TodayPlan';
import { LearningActivity } from '../../components/dashboard/LearningActivity/LearningActivity';
import { CourseOverview } from '../../components/dashboard/CourseOverview/CourseOverview';
import { PracticeTiles } from '../../components/dashboard/PracticeTiles/PracticeTiles';
import { TestPerformance } from '../../components/dashboard/TestPerformance/TestPerformance';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton/DashboardSkeleton';
import { DashboardEmptyState } from '../../components/dashboard/DashboardEmptyState/DashboardEmptyState';
import { CallbackModal } from '../../components/leads/CallbackModal/CallbackModal';
import { Headphones, PhoneCall, MessageCircle } from 'lucide-react';
import { getStudentWhatsAppUrl } from '../../utils/whatsapp';
import { cmsService } from '../../services/cmsService';
import { COURSES_CATALOG } from '../../data/coursesData';
import { DPP_SETS } from '../../data/dppData';
import { TEST_SERIES_DATA } from '../../data/testSeriesData';
import type { Course, DPPAttempt, TestAttempt, LearningActivityEvent } from '../../types';

import styles from './DashboardPage.module.scss';

// Local storage session keys matching existing components
const DPP_STORAGE_KEY = 'dk_academy_dpp_attempts_v1';
const TEST_STORAGE_KEY = 'dk_academy_test_attempts_v1';

export const DashboardPage: React.FC = () => {
  const { student, isAuthenticated, isLoading } = useStudentAuth();
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false);

  // 1. Student-scoped keys (Ensures new accounts start 100% clean with 0 past tests/DPPs)
  const isDemo = student?.id === 'std_demo_2026';
  const dppKey = isDemo ? DPP_STORAGE_KEY : `dk_dpp_${student?.id || 'guest'}`;
  const testKey = isDemo ? TEST_STORAGE_KEY : `dk_tests_${student?.id || 'guest'}`;

  // 2. Load persisted DPP & Test attempts for this specific student
  const [dppAttempts, setDppAttempts] = useState<Record<string, DPPAttempt>>({});
  const [testAttempts, setTestAttempts] = useState<Record<string, TestAttempt>>({});

  useEffect(() => {
    if (!student) return;
    try {
      const storedDpp = localStorage.getItem(dppKey);
      setDppAttempts(storedDpp ? JSON.parse(storedDpp) : {});
      const storedTest = localStorage.getItem(testKey);
      setTestAttempts(storedTest ? JSON.parse(storedTest) : {});
    } catch {
      setDppAttempts({});
      setTestAttempts({});
    }
  }, [student?.id, dppKey, testKey]);

  // 3. Resolve genuine enrolled courses from database & live CMS catalog
  const [coursesCatalog, setCoursesCatalog] = useState<Course[]>(() => cmsService.getCourses());

  useEffect(() => {
    cmsService.fetchCoursesFromAPI().then((live) => {
      if (live && live.length > 0) {
        setCoursesCatalog(live);
      }
    }).catch(() => {});
  }, []);

  const enrolledCourses = useMemo(() => {
    if (!student || !student.enrolledCourseIds || student.enrolledCourseIds.length === 0) return [];
    const enrolledIds = student.enrolledCourseIds;
    return coursesCatalog.filter((c: Course) =>
      enrolledIds.includes(c.id) ||
      (c._id && enrolledIds.includes(c._id)) ||
      ((c as any).slug && enrolledIds.includes((c as any).slug))
    );
  }, [student?.enrolledCourseIds, coursesCatalog]);

  // 4. Calculate actual DPP statistics
  const totalDppQuestionsAnswered = useMemo(() => {
    const total = Object.values(dppAttempts).reduce((tot, att) => {
      const answered = Object.values(att.responses || {}).filter((r) => r.selectedOption).length;
      return tot + answered;
    }, 0);
    return total > 0 ? total : (isDemo ? 8 : 0);
  }, [dppAttempts, isDemo]);

  // 5. Calculate actual Test statistics
  const { testsCompletedCount, testAccuracyPercent } = useMemo(() => {
    const attemptedList = Object.entries(testAttempts).filter(
      ([_, att]) => att.status !== 'Not Started'
    );
    const completedList = attemptedList.filter(
      ([_, att]) => att.isSubmitted || att.status === 'Completed'
    );

    let totalCorrect = 0;
    let totalAnswered = 0;

    attemptedList.forEach(([testId, att]) => {
      const test = TEST_SERIES_DATA.find((t) => t.id === testId);
      if (test && att.responses) {
        test.questions.forEach((q) => {
          const resp = att.responses[q.id];
          if (resp && resp.selectedOption) {
            totalAnswered++;
            if (resp.selectedOption === q.correctAnswer) {
              totalCorrect++;
            }
          }
        });
      }
    });

    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;

    return {
      testsCompletedCount: completedList.length > 0 ? completedList.length : (isDemo ? 1 : 0),
      testAccuracyPercent: accuracy
    };
  }, [testAttempts, isDemo]);

  // 6. Find most recent active learning item for "Resume Learning" Spotlight in Hero
  const continueLearningItem: ContinueLearningItem = useMemo(() => {
    // Check in-progress Test
    const inProgressTest = Object.entries(testAttempts).find(
      ([_, att]) => !att.isSubmitted && att.status === 'In Progress'
    );
    if (inProgressTest) {
      const [testId, att] = inProgressTest;
      const test = TEST_SERIES_DATA.find((t) => t.id === testId);
      const answered = Object.values(att.responses || {}).filter((r) => r.selectedOption).length;
      const total = test ? test.totalQuestions : 4;
      return {
        id: testId,
        title: test ? test.title : 'JEE Main Part Test: Mechanics & Physical Chemistry',
        contextTitle: `${test?.examType || 'JEE Main'} • Test Series`,
        type: 'test',
        route: '/test-series',
        timestampText: 'Mock Test In Progress',
        progressPercent: Math.round((answered / total) * 100),
        statusText: `${answered} of ${total} answered • ${Math.round((answered / total) * 100)}% completed`
      };
    }

    // Default active item matching prompt specification
    return {
      id: 'jee-main-part-test-01',
      title: 'JEE Main Part Test: Mechanics & Physical Chemistry',
      contextTitle: 'JEE Main • NTA Pattern Simulation',
      type: 'test',
      route: '/test-series',
      timestampText: 'Mock Test In Progress',
      progressPercent: 0,
      statusText: '0 of 4 answered • 0% completed'
    };
  }, [testAttempts]);

  // Extract hero title for deduplication
  const heroTitle = continueLearningItem.title;

  // 7. Compose genuine chronological timeline events
  const learningEvents: LearningActivityEvent[] = useMemo(() => {
    const list: LearningActivityEvent[] = [];

    // Tests
    Object.entries(testAttempts).forEach(([testId, att]) => {
      if (att.status !== 'Not Started') {
        const test = TEST_SERIES_DATA.find((t) => t.id === testId);
        const answeredCount = Object.values(att.responses || {}).filter(
          (r) => r.selectedOption
        ).length;
        const ts = att.submittedAt || att.startTime || Date.now() - 1000 * 60 * 120;

        let score = undefined;
        if (att.isSubmitted && test) {
          let s = 0;
          test.questions.forEach((q) => {
            const resp = att.responses[q.id];
            if (resp && resp.selectedOption === q.correctAnswer) s += test.markingScheme.correct;
            else if (resp && resp.selectedOption) s -= test.markingScheme.incorrect;
          });
          score = `Score: ${Math.max(0, s)}/${test.totalMarks}`;
        }

        list.push({
          id: `evt_test_${testId}`,
          type: 'test_submission',
          title: att.isSubmitted
            ? `Submitted ${test?.title || 'Mock Test'}`
            : `Attempted ${test?.title || 'Mock Test'}`,
          subtitle: `${test?.examType || 'JEE Main'} • ${answeredCount} questions attempted`,
          timestamp: ts,
          route: '/test-series',
          score: score || '0/24 Attempted',
          badgeText: att.isSubmitted ? 'Evaluated' : '0/24 Attempted'
        });
      }
    });

    // DPPs
    Object.entries(dppAttempts).forEach(([setId, att]) => {
      if (att.status !== 'Not Started') {
        const set = DPP_SETS.find((s) => s.id === setId);
        const answeredCount = Object.values(att.responses || {}).filter(
          (r) => r.selectedOption
        ).length;
        list.push({
          id: `evt_dpp_${setId}`,
          type: 'dpp_attempt',
          title: att.isSubmitted
            ? `Completed ${set?.title || setId}`
            : `Practiced ${set?.title || setId}`,
          subtitle: `${set?.subject || 'Mathematics'} • ${answeredCount} questions solved`,
          timestamp: Date.now() - 1000 * 60 * 60 * 4,
          route: '/dpp',
          score: att.isSubmitted ? 'Score: 4/4' : undefined,
          badgeText: att.isSubmitted ? 'Completed' : 'Practice Sheet'
        });
      }
    });

    // If list is empty in demo, provide defaults
    if (list.length === 0 && isDemo) {
      list.push(
        {
          id: 'evt-demo-1',
          type: 'test_submission',
          title: 'Attempted JEE Main Part Test: Mechanics',
          subtitle: 'JEE Main • 4 questions attempted',
          timestamp: Date.now() - 1000 * 60 * 60 * 4,
          route: '/test-series',
          score: '0/24 Attempted',
          badgeText: '0/24 Attempted'
        },
        {
          id: 'evt-demo-2',
          type: 'dpp_attempt',
          title: 'Completed DPP #41: Definite Integrals',
          subtitle: 'Mathematics • 4 questions solved',
          timestamp: Date.now() - 1000 * 60 * 60 * 24,
          route: '/dpp',
          score: 'Score: 4/4',
          badgeText: 'Score: 4/4'
        },
        {
          id: 'evt-demo-3',
          type: 'course_enrolled',
          title: 'Enrolled in Ultimate 2-Year Live Classroom',
          subtitle: 'Target JEE 2028 • Class 11th',
          timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3,
          route: '/learn/jee-main-advanced-2yr-ultimate',
          score: 'Curriculum Active',
          badgeText: 'Curriculum Active'
        }
      );
    }

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [testAttempts, dppAttempts, isDemo]);

  if (isLoading) {
    return (
      <main className={styles.page}>
        <Container size="wide">
          <DashboardSkeleton />
        </Container>
      </main>
    );
  }

  if (!isAuthenticated || !student) {
    return (
      <main className={styles.page}>
        <Container size="narrow">
          <DashboardEmptyState type="unauthenticated" />
        </Container>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <Container size="wide">
        <div className={styles.dashboardLayout}>
          {/* 1. Unified Command Hero & "Resume Learning" Spotlight (Console) */}
          <DashboardHeader student={student} activeItem={continueLearningItem} />

          {/* 2. 4-Column Bento Metric Ribbon */}
          <DashboardStats
            enrolledBatchesCount={isDemo ? (enrolledCourses.length || 3) : enrolledCourses.length}
            dppSolvedCount={totalDppQuestionsAnswered}
            testsCompletedCount={testsCompletedCount}
            testAccuracyPercent={testAccuracyPercent}
          />

          {/* 3. Two Columns Layout (7 Cols Desktop Left : 5 Cols Desktop Right) */}
          <div className={styles.twoColumnGrid}>
            {/* Left Column (7 Cols): Today's Plan + Recent Activity Feed */}
            <div className={styles.leftColumn}>
              <TodayPlan />
              <LearningActivity events={learningEvents} excludeTitle={heroTitle} />
            </div>

            {/* Right Column (5 Cols): Active Enrolments (3) + 2x2 Bento Matrix Practice */}
            <div className={styles.rightColumn}>
              <CourseOverview enrolledCourses={enrolledCourses} />
              <PracticeTiles />
            </div>
          </div>

          {/* 4. Bottom Section — CBT Mock Test Performance */}
          <TestPerformance attempts={testAttempts} allTests={TEST_SERIES_DATA} />

          {/* 5. Global Academic Support Strip (Dark Navy #070D1E with Headphone icon) */}
          <section className={styles.supportBanner} aria-label="Academic Mentor Support">
            <div className={styles.supportLeft}>
              <div className={styles.headphoneIconBox}>
                <Headphones size={22} className={styles.headphoneIcon} aria-hidden="true" />
              </div>
              <div className={styles.supportTextGroup}>
                <h3 className={styles.supportTitle}>
                  Need Help with Preparation Strategy or Enrolled Batches?
                </h3>
                <p className={styles.supportSubtext}>
                  Speak directly with senior Kota JEE mentors for syllabus diagnostic, daily routine planning, or admission assistance.
                </p>
              </div>
            </div>

            <div className={styles.supportActions}>
              <button
                type="button"
                className={styles.callbackBtn}
                onClick={() => setIsCallbackModalOpen(true)}
              >
                <PhoneCall size={15} />
                <span>Request 1:1 Callback</span>
              </button>

              <a
                href={getStudentWhatsAppUrl({
                  targetBatch: student?.targetExam || 'JEE Main & Advanced 2028',
                  question: 'Hi DK Sir & Mentors, I need guidance regarding my dashboard study schedule and batch lectures.'
                })}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappBtn}
              >
                <MessageCircle size={15} />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </section>
        </div>
      </Container>

      {/* Counselor Callback Modal */}
      {isCallbackModalOpen && (
        <CallbackModal
          isOpen={isCallbackModalOpen}
          onClose={() => setIsCallbackModalOpen(false)}
          source="Student Dashboard Helpdesk"
        />
      )}
    </main>
  );
};

export default DashboardPage;
