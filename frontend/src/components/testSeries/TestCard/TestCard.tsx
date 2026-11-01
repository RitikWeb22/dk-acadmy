import React from 'react';
import { Clock, Target, List, ArrowRight, CheckCircle2, RotateCcw, BarChart2, Calendar } from 'lucide-react';
import type { TestSeriesItem, TestAttempt } from '../../../types';
import styles from './TestCard.module.scss';

interface TestCardProps {
  test: TestSeriesItem;
  attempt?: TestAttempt;
  onOpenInstructions: (testId: string) => void;
  onResumeTest: (testId: string) => void;
  onViewResults: (testId: string) => void;
  onOpenScheduledNotice?: (test: TestSeriesItem, formattedStartTime: string) => void;
}

export const TestCard: React.FC<TestCardProps> = ({
  test,
  attempt,
  onOpenInstructions,
  onResumeTest,
  onViewResults,
  onOpenScheduledNotice,
}) => {
  const status = attempt ? attempt.status : 'Not Started';

  // Check scheduling status
  const now = Date.now();
  const isScheduled = test.status === 'Scheduled' && Boolean(test.schedule?.startWindow);
  const startTime = isScheduled ? new Date(test.schedule!.startWindow!).getTime() : null;
  const endTime = test.schedule?.endWindow ? new Date(test.schedule.endWindow).getTime() : null;

  const isUpcoming = Boolean(isScheduled && startTime && now < startTime);
  const isLiveWindow = Boolean(isScheduled && startTime && now >= startTime && (!endTime || now <= endTime));
  const isWindowClosed = Boolean(isScheduled && endTime && now > endTime);

  const formattedStartTime = startTime
    ? new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(new Date(startTime))
    : '';

  const markingCorrect = test.markingScheme?.correct ?? 4;
  const markingIncorrect = test.markingScheme?.incorrect ?? 1;

  // Calculate score if completed
  let totalScore = 0;
  if (attempt && attempt.isSubmitted) {
    (test.questions || []).forEach((q) => {
      const resp = attempt.responses[q.id];
      if (resp?.selectedOption) {
        if (resp.selectedOption === q.correctAnswer) {
          totalScore += markingCorrect;
        } else {
          totalScore -= markingIncorrect;
        }
      }
    });
  }

  // Answered questions count if in progress
  const answeredCount = attempt
    ? Object.keys(attempt.responses).filter((id) => Boolean(attempt.responses[id]?.selectedOption)).length
    : 0;

  // Normalized Exam Badge styling (Accessible WCAG contrast)
  const getExamBadgeClass = (exam: string) => {
    if (exam.toLowerCase().includes('advanced')) return styles.badgeJeeAdvanced;
    if (exam.toLowerCase().includes('bitsat')) return styles.badgeBitsat;
    return styles.badgeJeeMain;
  };

  // Format pill styling
  const getFormatClass = (fmt: string) => {
    switch (fmt) {
      case 'Full Mock': return styles.formatFullMock;
      case 'Part Test': return styles.formatPartTest;
      case 'Chapter Test': return styles.formatChapterTest;
      default: return styles.formatDefault;
    }
  };

  // Difficulty pill styling
  const getDifficultyClass = (diff: string) => {
    switch (diff) {
      case 'Moderate': return styles.diffModerate;
      case 'Challenging': return styles.diffChallenging;
      case 'Advanced': return styles.diffAdvanced;
      default: return styles.diffDefault;
    }
  };

  return (
    <article className={styles.card} aria-label={`Mock test: ${test.title}`}>
      {/* 1. Badging Row: Consistent pill styling with accessible WCAG color contrast */}
      <div className={styles.header}>
        <div className={styles.badgesRow}>
          {/* Tag: "JEE MAIN" / "JEE ADVANCED" */}
          <span className={`${styles.pillBadge} ${getExamBadgeClass(test.examType)}`}>
            {test.examType}
          </span>

          {/* Tag: "Full Mock" */}
          <span className={`${styles.pillBadge} ${getFormatClass(test.format)}`}>
            {test.format}
          </span>

          {/* Tag: "Moderate" / "Challenging" / "Advanced" */}
          <span className={`${styles.pillBadge} ${getDifficultyClass(test.difficulty)}`}>
            {test.difficulty}
          </span>
        </div>

        {/* Status Pill: "In Progress", "Completed", "Not Started", "Scheduled", "LIVE" */}
        <div className={styles.statusWrap}>
          {status === 'Completed' ? (
            <span className={`${styles.statusPill} ${styles.statusCompleted}`}>
              <CheckCircle2 size={12} aria-hidden="true" />
              <span>Score: {totalScore} / {test.totalMarks}</span>
            </span>
          ) : status === 'In Progress' ? (
            <span className={`${styles.statusPill} ${styles.statusInProgress}`}>
              <span className={styles.pulseDot} aria-hidden="true" />
              <span>In Progress ({answeredCount}/{test.totalQuestions})</span>
            </span>
          ) : isLiveWindow ? (
            <span className={`${styles.statusPill} ${styles.statusLive}`}>
              <span className={styles.liveRedDot} aria-hidden="true" />
              <span>LIVE CBT EXAM</span>
            </span>
          ) : isUpcoming ? (
            <span className={`${styles.statusPill} ${styles.statusScheduled}`}>
              <Calendar size={12} aria-hidden="true" />
              <span>Starts {formattedStartTime}</span>
            </span>
          ) : isWindowClosed ? (
            <span className={`${styles.statusPill} ${styles.statusClosed}`}>
              <span>Window Closed • Practice</span>
            </span>
          ) : (
            <span className={`${styles.statusPill} ${styles.statusNotStarted}`}>
              <span>Not Started</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Content: Title, Subtitle, Subjects */}
      <div className={styles.content}>
        <h3 className={styles.title}>{test.title}</h3>
        <p className={styles.subtitle}>{test.subtitle}</p>

        {/* Subjects list */}
        <div className={styles.subjectsRow}>
          <span className={styles.subjectLabel}>Coverage:</span>
          <span className={styles.subjectsText}>
            {(Array.isArray(test.subjects) ? test.subjects : []).join(' • ') || 'Physics • Chemistry • Mathematics'}
          </span>
        </div>
      </div>

      {/* 2. Structured 3-column micro-grid with micro-icons (List, Clock, Target) */}
      <div className={styles.microGrid} role="group" aria-label="Test specifications">
        <div className={styles.microCol}>
          <div className={styles.microIconWrap}>
            <List size={14} className={styles.microIcon} aria-hidden="true" />
          </div>
          <div className={styles.microTextWrap}>
            <span className={styles.microVal}>{test.totalQuestions} Questions</span>
            <span className={styles.microLabel}>Total Qs</span>
          </div>
        </div>

        <div className={styles.microCol}>
          <div className={styles.microIconWrap}>
            <Clock size={14} className={styles.microIcon} aria-hidden="true" />
          </div>
          <div className={styles.microTextWrap}>
            <span className={styles.microVal}>{test.durationMinutes} Mins</span>
            <span className={styles.microLabel}>Duration</span>
          </div>
        </div>

        <div className={styles.microCol}>
          <div className={styles.microIconWrap}>
            <Target size={14} className={styles.microIcon} aria-hidden="true" />
          </div>
          <div className={styles.microTextWrap}>
            <span className={styles.microVal}>{test.totalMarks} Marks</span>
            <span className={styles.microLabel}>+{markingCorrect}/-{markingIncorrect}</span>
          </div>
        </div>
      </div>

      {/* 3. Button States:
           - "Start Test" (Solid Primary Blue)
           - "Resume Test" (Solid Amber/Warning)
           - "View Analysis" (Outline Secondary with icon)
      */}
      <div className={styles.footerActions}>
        {status === 'Completed' ? (
          <div className={styles.completedActionsGroup}>
            {/* "View Analysis" (Outline Secondary with icon) */}
            <button
              type="button"
              className={styles.viewAnalysisBtn}
              onClick={() => onViewResults(test.id)}
              aria-label={`View performance analysis for ${test.title}`}
            >
              <BarChart2 size={16} aria-hidden="true" />
              <span>View Analysis</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>

            <button
              type="button"
              className={styles.retakeBtn}
              onClick={() => onOpenInstructions(test.id)}
              title="Retake this mock test"
              aria-label={`Retake ${test.title}`}
            >
              <RotateCcw size={15} aria-hidden="true" />
            </button>
          </div>
        ) : status === 'In Progress' ? (
          /* "Resume Test" (Solid Amber/Warning) */
          <button
            type="button"
            className={styles.resumeTestBtn}
            onClick={() => onResumeTest(test.id)}
            aria-label={`Resume test: ${test.title}`}
          >
            <span>Resume Test</span>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        ) : isLiveWindow ? (
          /* Live exam button */
          <button
            type="button"
            className={styles.liveExamBtn}
            onClick={() => onOpenInstructions(test.id)}
            aria-label={`Enter live exam: ${test.title}`}
          >
            <span className={styles.liveRedDot} style={{ backgroundColor: '#ffffff', boxShadow: 'none' }} />
            <span>Enter Live Exam</span>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        ) : isUpcoming ? (
          /* Upcoming scheduled test button */
          <button
            type="button"
            className={styles.scheduledUpcomingBtn}
            onClick={() => {
              if (onOpenScheduledNotice) {
                onOpenScheduledNotice(test, formattedStartTime);
              } else {
                alert(`This scheduled CBT mock opens on ${formattedStartTime}. Please return at that time to take the live test.`);
              }
            }}
            aria-label={`Scheduled test opens on ${formattedStartTime}`}
          >
            <Calendar size={14} aria-hidden="true" />
            <span>Opens {formattedStartTime}</span>
          </button>
        ) : (
          /* "Start Test" (Solid Primary Blue) */
          <button
            type="button"
            className={styles.startTestBtn}
            onClick={() => onOpenInstructions(test.id)}
            aria-label={`Start test: ${test.title}`}
          >
            <span>{isWindowClosed ? 'Start Practice Test' : 'Start Test'}</span>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  );
};

export default TestCard;
