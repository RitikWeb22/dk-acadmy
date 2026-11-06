import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Target, List, ArrowRight, CheckCircle2, RotateCcw, BarChart2, Calendar, Timer, Lock, Sparkles } from 'lucide-react';
import type { TestSeriesItem, TestAttempt } from '../../../types';
import { requestFullScreen } from '../../../utils/fullscreen';
import { offerService, OFFERS_EVENT_KEY } from '../../../services/offerService';
import styles from './TestCard.module.scss';

interface TestCardProps {
  test: TestSeriesItem;
  attempt?: TestAttempt;
  isLocked?: boolean;
  onOpenInstructions: (testId: string) => void;
  onResumeTest: (testId: string) => void;
  onViewResults: (testId: string) => void;
  onOpenScheduledNotice?: (test: TestSeriesItem, formattedStartTime: string) => void;
  onUnlock?: (test: TestSeriesItem) => void;
}

export const TestCard: React.FC<TestCardProps> = ({
  test,
  attempt,
  isLocked = false,
  onOpenInstructions,
  onResumeTest,
  onViewResults,
  onOpenScheduledNotice,
  onUnlock,
}) => {
  const status = attempt ? attempt.status : 'Not Started';

  // Real-time special offers listener
  const [offersTick, setOffersTick] = useState(0);
  useEffect(() => {
    const handler = () => setOffersTick((v) => v + 1);
    window.addEventListener(OFFERS_EVENT_KEY, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(OFFERS_EVENT_KEY, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const rawPrice = test.price ? Number(test.price) : 299;
  const effectiveOffer = useMemo(() => {
    if (!isLocked) return null;
    return offerService.getEffectiveItemOffer(test.id, 'test-series', rawPrice);
  }, [isLocked, test.id, rawPrice, offersTick]);

  const effectivePrice = effectiveOffer && effectiveOffer.hasOffer ? effectiveOffer.discountedPrice : rawPrice;

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

  const formattedEndTime = endTime
    ? new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(new Date(endTime))
    : '';

  // Live Countdown Timer for Upcoming Scheduled Tests
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!startTime || !isUpcoming) return;

    const updateCountdown = () => {
      const diff = startTime - Date.now();
      if (diff <= 0) {
        setCountdown(null);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [startTime, isUpcoming]);

  const countdownFormatted = countdown
    ? `${countdown.days > 0 ? `${countdown.days}d ` : ''}${String(countdown.hours).padStart(2, '0')}h : ${String(countdown.minutes).padStart(2, '0')}m : ${String(countdown.seconds).padStart(2, '0')}s`
    : '';

  const markingCorrect = test.markingScheme?.correct ?? 4;
  const markingIncorrect = test.markingScheme?.incorrect ?? 1;

  // Calculate score if completed
  let totalScore = 0;
  if (attempt && attempt.isSubmitted) {
    (test.questions || []).forEach((q) => {
      if (!q) return;
      const qId = q.id || (q as any)?._id;
      if (!qId) return;
      const resp = attempt.responses?.[qId];
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
    ? Object.keys(attempt.responses || {}).filter((id) => Boolean(attempt.responses?.[id]?.selectedOption)).length
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

          {/* Pricing / Lock Badge */}
          {isLocked ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{
                  background: '#FEF3C7',
                  color: '#B45309',
                  border: '1px solid #FCD34D',
                  borderRadius: '4px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Lock size={10} />
                {effectiveOffer?.hasOffer ? (
                  <>
                    <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>₹{rawPrice}</span>
                    <span style={{ color: '#b91c1c', fontWeight: 800 }}>₹{effectivePrice}</span>
                  </>
                ) : (
                  <span>₹{rawPrice}</span>
                )}
              </span>

              {/* Custom Offer Badge */}
              {effectiveOffer?.hasOffer && (
                <span
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    boxShadow: '0 1px 3px rgba(220, 38, 38, 0.35)'
                  }}
                >
                  <Sparkles size={9} />
                  <span>{effectiveOffer.badgeText}</span>
                </span>
              )}
            </div>
          ) : (
            <span
              style={{
                background: '#ECFDF5',
                color: '#047857',
                border: '1px solid #A7F3D0',
                borderRadius: '4px',
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '2px 7px'
              }}
            >
              Free
            </span>
          )}
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
            <span className={`${styles.statusPill} ${styles.statusScheduled}`} title={`Opens on ${formattedStartTime}`}>
              <Timer size={12} aria-hidden="true" />
              <span>{countdownFormatted ? `Opens in ${countdownFormatted}` : `Starts ${formattedStartTime}`}</span>
            </span>
          ) : isWindowClosed ? (
            <span className={`${styles.statusPill} ${styles.statusClosed}`} title={`Closed on ${formattedEndTime || 'scheduled end'}`}>
              <Lock size={12} aria-hidden="true" />
              <span>Closed Test</span>
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
            onClick={async () => {
              await requestFullScreen();
              onResumeTest(test.id);
            }}
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
          /* Upcoming scheduled test button with live countdown and time/date */
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
            aria-label={`Scheduled test opens on ${formattedStartTime}. Countdown: ${countdownFormatted || 'Upcoming'}`}
          >
            <div className={styles.scheduledBtnInner}>
              <div className={styles.scheduledDateRow}>
                <Calendar size={14} aria-hidden="true" />
                <span>Opens {formattedStartTime}</span>
              </div>
              {countdownFormatted && (
                <div className={styles.scheduledCountdownRow}>
                  <Timer size={12} className={styles.countdownTimerIcon} aria-hidden="true" />
                  <span>Starts in: <strong>{countdownFormatted}</strong></span>
                </div>
              )}
            </div>
          </button>
        ) : isWindowClosed ? (
          /* Closed Scheduled Test: User cannot open */
          <button
            type="button"
            className={styles.closedExamBtn}
            disabled
            aria-label={`Exam Closed: ${test.title}`}
            title={`This exam was closed on ${formattedEndTime || 'the scheduled date'}. Submissions are no longer accepted.`}
          >
            <Lock size={14} className={styles.closedLockIcon} aria-hidden="true" />
            <span>Closed Test</span>
          </button>
        ) : isLocked ? (
          /* "Unlock Test" (Paid Lock Gate) */
          <button
            type="button"
            className={styles.startTestBtn}
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onClick={() => (onUnlock ? onUnlock(test) : onOpenInstructions(test.id))}
            aria-label={`Unlock test: ${test.title} for ₹${effectivePrice}`}
          >
            <Lock size={15} />
            <span>
              Unlock Test (₹{effectivePrice})
              {effectiveOffer?.hasOffer && ` • ${effectiveOffer.badgeText}`}
            </span>
            <ArrowRight size={15} />
          </button>
        ) : (
          /* "Start Test" (Solid Primary Blue) */
          <button
            type="button"
            className={styles.startTestBtn}
            onClick={() => onOpenInstructions(test.id)}
            aria-label={`Start test: ${test.title}`}
          >
            <span>Start Test</span>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  );
};

export default TestCard;
