import React from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Target,
  Clock,
  BarChart3,
  AlertTriangle,
  ChevronRight,
  Atom,
  FlaskConical,
  Calculator,
  Calendar,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import type { TestSeriesItem, TestAttempt, Subject } from '../../../types';
import styles from './TestResultsView.module.scss';

interface TestResultsViewProps {
  test: TestSeriesItem;
  attempt: TestAttempt;
  onReviewAnswers: () => void;
  onRetryTest: () => void;
  onBackToCatalog: () => void;
}

export const TestResultsView: React.FC<TestResultsViewProps> = ({
  test,
  attempt,
  onReviewAnswers,
  onRetryTest,
  onBackToCatalog,
}) => {
  const totalQuestions = test.questions.length;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let totalScore = 0;

  // Subject breakdown accumulator
  const subjectStats: Partial<
    Record<
      Subject,
      {
        total: number;
        correct: number;
        incorrect: number;
        unattempted: number;
        score: number;
        maxScore: number;
      }
    >
  > = {};

  test.questions.forEach((q) => {
    if (!subjectStats[q.subject]) {
      subjectStats[q.subject] = {
        total: 0,
        correct: 0,
        incorrect: 0,
        unattempted: 0,
        score: 0,
        maxScore: 0,
      };
    }

    const sStat = subjectStats[q.subject]!;
    sStat.total += 1;
    sStat.maxScore += test.markingScheme.correct;

    const resp = attempt.responses[q.id];
    if (!resp || !resp.selectedOption) {
      unattemptedCount += 1;
      sStat.unattempted += 1;
    } else if (resp.selectedOption === q.correctAnswer) {
      correctCount += 1;
      sStat.correct += 1;
      totalScore += test.markingScheme.correct;
      sStat.score += test.markingScheme.correct;
    } else {
      incorrectCount += 1;
      sStat.incorrect += 1;
      totalScore -= test.markingScheme.incorrect;
      sStat.score -= test.markingScheme.incorrect;
    }
  });

  const attemptedCount = correctCount + incorrectCount;
  const accuracyPercentage =
    attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
  const percentage = Math.max(0, Math.round((totalScore / test.totalMarks) * 100));

  // Target Cut-off calculations (standard qualifying cut-off benchmark ~60%)
  const targetCutoff = Math.round(test.totalMarks * 0.6);
  const cutoffGap = Math.max(0, targetCutoff - totalScore);

  // Radial progress chart stroke parameters
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.max(0, Math.min(100, percentage));
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  // Format time spent
  const formatTimeSpent = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      return `${hrs}h ${mins % 60}m`;
    }
    return `${mins}m ${remainingSecs}s`;
  };

  // Submission timestamp
  const submissionDate = attempt.startTime
    ? new Date(attempt.startTime).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }) + ', ' + new Date(attempt.startTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : '24 Oct 2026, 04:30 PM';

  const isLowScore = percentage < 50;

  // Subject icon helper
  const getSubjectIcon = (subject: string) => {
    if (subject.toLowerCase() === 'physics') return <Atom size={16} aria-hidden="true" />;
    if (subject.toLowerCase() === 'chemistry') return <FlaskConical size={16} aria-hidden="true" />;
    return <Calculator size={16} aria-hidden="true" />;
  };

  return (
    <div className={styles.resultsContainer}>
      {/* 1. Breadcrumb & Back Navigation */}
      <div className={styles.topNavRow}>
        <button
          type="button"
          onClick={onBackToCatalog}
          className={styles.inlineBackLink}
          title="Return to mock test series catalog"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          <span>Back to All Mock Tests</span>
        </button>
      </div>

      {/* 2. Test Header Card */}
      <div className={styles.testHeaderCard}>
        <div className={styles.headerBadgesRow}>
          <span className={styles.examBadge}>{test.examType}</span>
          <span className={styles.formatBadge}>{test.format}</span>
          <span className={styles.patternBadge}>
            <Sparkles size={12} aria-hidden="true" />
            <span>NTA Pattern 2025–26</span>
          </span>
        </div>

        <h1 className={styles.testTitle}>{test.title}</h1>
        <p className={styles.testSubtitle}>{test.subtitle}</p>

        <div className={styles.attemptMetaRow}>
          <Calendar size={13} className={styles.metaIcon} aria-hidden="true" />
          <span>Submitted on: {submissionDate}</span>
          <span className={styles.metaDot} aria-hidden="true">•</span>
          <ShieldCheck size={13} className={styles.metaIcon} aria-hidden="true" />
          <span>All India Rank Prediction: <strong>Pending (Window Live)</strong></span>
        </div>
      </div>

      {/* 3. Hero Scorecard & Accuracy Wheel (Split 2-Column Banner) */}
      <div className={styles.heroScoreBanner}>
        {/* Left Column: Radial Score Chart */}
        <div className={styles.radialChartCol}>
          <div className={styles.radialRingWrapper}>
            <svg className={styles.radialSvg} viewBox="0 0 130 130" aria-label={`Score: ${totalScore} out of ${test.totalMarks}`}>
              {/* Background Track Circle */}
              <circle
                className={styles.radialBgCircle}
                cx="65"
                cy="65"
                r={radius}
                strokeWidth="9"
              />
              {/* Animated Progress Circle */}
              <circle
                className={styles.radialProgressCircle}
                cx="65"
                cy="65"
                r={radius}
                strokeWidth="9"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 65 65)"
              />
            </svg>

            {/* Inner Content */}
            <div className={styles.radialInnerContent}>
              <span className={styles.radialScoreValue}>{totalScore}</span>
              <span className={styles.radialTotalMarks}>/ {test.totalMarks} Marks</span>
              <span className={styles.radialAccuracyPill}>
                {accuracyPercentage}% Accuracy
              </span>
            </div>
          </div>

          {/* Cut-off Comparison Chip */}
          <div className={styles.cutoffChip}>
            {cutoffGap > 0 ? (
              <>
                <Target size={13} className={styles.cutoffIcon} aria-hidden="true" />
                <span>Target Cut-off: <strong>{targetCutoff} Marks</strong> • Gap: <strong>{cutoffGap} Marks</strong></span>
              </>
            ) : (
              <>
                <CheckCircle2 size={13} className={styles.cutoffSuccessIcon} aria-hidden="true" />
                <span>Target Cut-off Cleared (+{totalScore - targetCutoff} Marks) ✨</span>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Actionable Performance Diagnosis */}
        <div className={`${styles.diagnosisCol} ${isLowScore ? styles.diagnosisAmber : styles.diagnosisEmerald}`}>
          <div className={styles.diagnosisHeader}>
            <div className={styles.diagnosisIconBox}>
              {isLowScore ? (
                <AlertTriangle size={18} aria-hidden="true" />
              ) : (
                <Award size={18} aria-hidden="true" />
              )}
            </div>
            <div>
              <h2 className={styles.diagnosisTitle}>
                {isLowScore ? 'Needs Conceptual Revision & Time Pacing' : 'Top-Tier Competitive Performance!'}
              </h2>
              <span className={styles.diagnosisSubtitle}>AI Performance Diagnostic &amp; Mentorship Feed</span>
            </div>
          </div>

          <ul className={styles.diagnosticBulletList}>
            <li className={styles.diagnosticBullet}>
              <span className={styles.bulletDot} aria-hidden="true">•</span>
              <span>
                <strong>High unattempted question count:</strong> {unattemptedCount} of {totalQuestions} questions left blank. Prioritize quick first-pass sweeps.
              </span>
            </li>
            <li className={styles.diagnosticBullet}>
              <span className={styles.bulletDot} aria-hidden="true">•</span>
              <span>
                <strong>Time per question ratio needs tuning:</strong> Spend no more than 2.5 minutes per single-choice question before flagging.
              </span>
            </li>
            <li className={styles.diagnosticBullet}>
              <span className={styles.bulletDot} aria-hidden="true">•</span>
              <span>
                <strong>Recommended revision:</strong> Review Chapter 1 &amp; 2 Video Shortcuts and Kota DPP solution archives.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* 4. 5-Metric Quick-Glance Bento Bar */}
      <div className={styles.metricsBentoBar} role="region" aria-label="5-Metric Quick-Glance Performance Overview">
        {/* Tile 1: Accuracy */}
        <div className={`${styles.bentoTile} ${styles.tileSlate}`}>
          <div className={styles.tileHeader}>
            <span className={styles.tileLabel}>Accuracy</span>
            <div className={`${styles.iconWrap} ${styles.iconSlate}`}>
              <Target size={15} aria-hidden="true" />
            </div>
          </div>
          <div className={styles.tileValue}>{accuracyPercentage}%</div>
          <div className={styles.tileSub}>Overall Hit Rate</div>
        </div>

        {/* Tile 2: Correct (+4) */}
        <div className={`${styles.bentoTile} ${styles.tileEmerald}`}>
          <div className={styles.tileHeader}>
            <span className={styles.tileLabel}>Correct (+{test.markingScheme.correct})</span>
            <div className={`${styles.iconWrap} ${styles.iconEmerald}`}>
              <CheckCircle2 size={15} aria-hidden="true" />
            </div>
          </div>
          <div className={styles.tileValue}>{correctCount}</div>
          <div className={styles.tileSub}>+{correctCount * test.markingScheme.correct} Marks Added</div>
        </div>

        {/* Tile 3: Incorrect (-1) */}
        <div className={`${styles.bentoTile} ${styles.tileRose}`}>
          <div className={styles.tileHeader}>
            <span className={styles.tileLabel}>Incorrect (-{test.markingScheme.incorrect})</span>
            <div className={`${styles.iconWrap} ${styles.iconRose}`}>
              <XCircle size={15} aria-hidden="true" />
            </div>
          </div>
          <div className={styles.tileValue}>{incorrectCount}</div>
          <div className={styles.tileSub}>-{incorrectCount * test.markingScheme.incorrect} Negative Penalty</div>
        </div>

        {/* Tile 4: Unattempted */}
        <div className={`${styles.bentoTile} ${styles.tileAmber}`}>
          <div className={styles.tileHeader}>
            <span className={styles.tileLabel}>Unattempted</span>
            <div className={`${styles.iconWrap} ${styles.iconAmber}`}>
              <HelpCircle size={15} aria-hidden="true" />
            </div>
          </div>
          <div className={styles.tileValue}>{unattemptedCount}</div>
          <div className={styles.tileSub}>0 Marks Penalty</div>
        </div>

        {/* Tile 5: Time Spent */}
        <div className={`${styles.bentoTile} ${styles.tilePurple}`}>
          <div className={styles.tileHeader}>
            <span className={styles.tileLabel}>Time Spent</span>
            <div className={`${styles.iconWrap} ${styles.iconPurple}`}>
              <Clock size={15} aria-hidden="true" />
            </div>
          </div>
          <div className={styles.tileValue}>
            {formatTimeSpent(attempt.timeSpentSeconds || 60)}
          </div>
          <div className={styles.tileSub}>Allotted: {test.durationMinutes} mins</div>
        </div>
      </div>

      {/* 5. Subject-Wise Score & Accuracy Matrix */}
      {Object.keys(subjectStats).length > 0 && (
        <section className={styles.subjectMatrixSection} aria-labelledby="subject-breakdown-heading">
          <div className={styles.matrixSectionHeader}>
            <div className={styles.matrixIconBox}>
              <BarChart3 size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 id="subject-breakdown-heading" className={styles.matrixSectionTitle}>
                Subject-Wise Score &amp; Accuracy Breakdown
              </h2>
              <p className={styles.matrixSectionSubtitle}>
                Detailed section breakdown across Physics, Chemistry, and Mathematics with answer-key drilldowns.
              </p>
            </div>
          </div>

          <div className={styles.subjectCardsGrid}>
            {(Object.keys(subjectStats) as Subject[]).map((sub) => {
              const stat = subjectStats[sub]!;
              const subAttempted = stat.correct + stat.incorrect;
              const subAccuracy =
                subAttempted > 0 ? Math.round((stat.correct / subAttempted) * 100) : 0;
              const scorePercent = stat.maxScore > 0 ? Math.max(0, Math.min(100, Math.round((stat.score / stat.maxScore) * 100))) : 0;

              return (
                <article key={sub} className={styles.subjectCard}>
                  {/* Subject Header */}
                  <div className={styles.subCardHeader}>
                    <div className={styles.subTitleRow}>
                      <div className={styles.subIconWrapper}>
                        {getSubjectIcon(sub)}
                      </div>
                      <h3 className={styles.subName}>{sub}</h3>
                    </div>
                    <span className={styles.subScoreBadge}>
                      {stat.score} / {stat.maxScore} Marks
                    </span>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className={styles.subProgressBarTrack} role="progressbar" aria-valuenow={scorePercent} aria-valuemin={0} aria-valuemax={100} aria-label={`${sub} Score Progress`}>
                    <div
                      className={styles.subProgressBarFill}
                      style={{ width: `${scorePercent}%` }}
                    />
                  </div>

                  {/* Stat Row */}
                  <div className={styles.subStatsRow}>
                    <div className={styles.subStatPill}>
                      <span className={styles.statLabel}>Correct:</span>
                      <strong className={styles.statValueGreen}>{stat.correct}</strong>
                    </div>
                    <span className={styles.statDivider}>|</span>
                    <div className={styles.subStatPill}>
                      <span className={styles.statLabel}>Incorrect:</span>
                      <strong className={styles.statValueRed}>{stat.incorrect}</strong>
                    </div>
                    <span className={styles.statDivider}>|</span>
                    <div className={styles.subStatPill}>
                      <span className={styles.statLabel}>Accuracy:</span>
                      <strong className={styles.statValueSlate}>{subAccuracy}%</strong>
                    </div>
                  </div>

                  {/* Action Link */}
                  <button
                    type="button"
                    onClick={onReviewAnswers}
                    className={styles.subActionLink}
                  >
                    <span>View {sub} Solutions</span>
                    <ChevronRight size={14} className={styles.subChevron} aria-hidden="true" />
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. Bottom Action Bar (Fixed / Sturdy Elevated Footer) */}
      <footer className={styles.bottomActionBar}>
        <button
          type="button"
          className={styles.primaryReviewBtn}
          onClick={onReviewAnswers}
          title="Inspect step-by-step solutions, Kota shortcut methods, and explanations"
        >
          <span>Review Detailed Step-by-Step Solutions</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>

        <button
          type="button"
          className={styles.secondaryRetryBtn}
          onClick={onRetryTest}
          title="Reset timer and retake this mock test in practice mode"
        >
          <RotateCcw size={15} aria-hidden="true" />
          <span>Retake Mock Test (Practice Mode)</span>
        </button>

        <button
          type="button"
          className={styles.tertiaryBackBtn}
          onClick={onBackToCatalog}
          title="Return to mock test series dashboard"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          <span>Return to Test Dashboard</span>
        </button>
      </footer>
    </div>
  );
};
