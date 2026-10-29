import React from 'react';
import { Award, CheckCircle2, XCircle, HelpCircle, RotateCcw, ArrowLeft, ArrowRight, Target } from 'lucide-react';
import type { DPPSet, DPPAttempt } from '../../../types';
import styles from './DPPResults.module.scss';

interface DPPResultsProps {
  set: DPPSet;
  attempt: DPPAttempt;
  onReviewAnswers: () => void;
  onRetryPractice: () => void;
  onBackToSets: () => void;
}

export const DPPResults: React.FC<DPPResultsProps> = ({
  set,
  attempt,
  onReviewAnswers,
  onRetryPractice,
  onBackToSets,
}) => {
  const totalQuestions = set.questions.length;

  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;

  set.questions.forEach((q) => {
    const resp = attempt.responses[q.id];
    if (!resp || !resp.selectedOption) {
      unattemptedCount += 1;
    } else if (resp.selectedOption === q.correctAnswer) {
      correctCount += 1;
    } else {
      incorrectCount += 1;
    }
  });

  const attemptedCount = correctCount + incorrectCount;
  const accuracyPercentage =
    attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
  const overallPercentage = Math.round((correctCount / totalQuestions) * 100);

  // Encouraging feedback text based on percentage
  const getFeedback = () => {
    if (overallPercentage === 100) {
      return {
        title: 'Outstanding Mastery!',
        message: 'Flawless score! Your conceptual foundation on this chapter is rock-solid. Keep up this momentum.',
      };
    }
    if (overallPercentage >= 75) {
      return {
        title: 'Great Performance!',
        message: 'Impressive accuracy! Review the step-by-step solutions to master the finer nuances.',
      };
    }
    if (overallPercentage >= 50) {
      return {
        title: 'Good Attempt!',
        message: 'Solid effort. Carefully review the explanations for the incorrect questions to solidify key formulas.',
      };
    }
    return {
      title: 'Practice Needed',
      message: 'Take time to study the step-by-step solutions and retry the practice set to build speed and accuracy.',
    };
  };

  const feedback = getFeedback();

  return (
    <div className={styles.resultsCard}>
      {/* Top Banner */}
      <div className={styles.topHeader}>
        <div className={styles.setMeta}>
          <span className={`${styles.subjectBadge} ${styles[set.subject.toLowerCase()]}`}>
            {set.subject}
          </span>
          <span className={styles.chapterBadge}>{set.chapter}</span>
        </div>
        <h2 className={styles.setTitle}>{set.title}</h2>
        <p className={styles.setTopic}>Topic: {set.topic}</p>
      </div>

      {/* Main Scorecard */}
      <div className={styles.scoreRow}>
        <div className={styles.scoreCircle}>
          <div className={styles.scoreNumber}>{correctCount}</div>
          <div className={styles.scoreDivider}>out of {totalQuestions}</div>
          <div className={styles.scorePercent}>{overallPercentage}% Score</div>
        </div>

        <div className={styles.feedbackSection}>
          <div className={styles.awardIconWrap}>
            <Award size={24} />
          </div>
          <h3 className={styles.feedbackTitle}>{feedback.title}</h3>
          <p className={styles.feedbackMsg}>{feedback.message}</p>
        </div>
      </div>

      {/* Breakdown Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricItem}>
          <div className={styles.metricIconWrap}>
            <Target size={18} className={styles.accuracyIcon} />
          </div>
          <div className={styles.metricValue}>{accuracyPercentage}%</div>
          <div className={styles.metricLabel}>Accuracy</div>
        </div>

        <div className={styles.metricItem}>
          <div className={styles.metricIconWrap}>
            <CheckCircle2 size={18} className={styles.correctIcon} />
          </div>
          <div className={styles.metricValue}>{correctCount}</div>
          <div className={styles.metricLabel}>Correct</div>
        </div>

        <div className={styles.metricItem}>
          <div className={styles.metricIconWrap}>
            <XCircle size={18} className={styles.incorrectIcon} />
          </div>
          <div className={styles.metricValue}>{incorrectCount}</div>
          <div className={styles.metricLabel}>Incorrect</div>
        </div>

        <div className={styles.metricItem}>
          <div className={styles.metricIconWrap}>
            <HelpCircle size={18} className={styles.unattemptedIcon} />
          </div>
          <div className={styles.metricValue}>{unattemptedCount}</div>
          <div className={styles.metricLabel}>Unattempted</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button type="button" className={styles.reviewBtn} onClick={onReviewAnswers}>
          <span>Review Answers & Solutions</span>
          <ArrowRight size={16} />
        </button>

        <button type="button" className={styles.retryBtn} onClick={onRetryPractice}>
          <RotateCcw size={16} />
          <span>Retry Practice</span>
        </button>

        <button type="button" className={styles.backBtn} onClick={onBackToSets}>
          <ArrowLeft size={16} />
          <span>All DPP Sets</span>
        </button>
      </div>
    </div>
  );
};
