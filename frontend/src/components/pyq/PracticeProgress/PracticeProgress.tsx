import React from 'react';
import { Info } from 'lucide-react';
import styles from './PracticeProgress.module.scss';

interface PracticeProgressProps {
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  evaluatedCount: number;
}

export const PracticeProgress: React.FC<PracticeProgressProps> = ({
  totalQuestions,
  answeredCount,
  correctCount,
  evaluatedCount
}) => {
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const accuracyPercent = evaluatedCount > 0 ? Math.round((correctCount / evaluatedCount) * 100) : 0;

  return (
    <div className={styles.progressCard}>
      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Available</span>
          <span className={styles.statVal}>{totalQuestions}</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.statBox}>
          <span className={styles.statLabel}>Answered</span>
          <span className={styles.statVal}>{answeredCount}</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.statBox}>
          <span className={styles.statLabel}>Unanswered</span>
          <span className={styles.statVal}>{unansweredCount}</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.statBox}>
          <span className={styles.statLabel}>Correct</span>
          <span className={`${styles.statVal} ${styles.correctVal}`}>{correctCount}</span>
        </div>

        {evaluatedCount > 0 && (
          <>
            <div className={styles.divider} />
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Accuracy</span>
              <span className={styles.statVal}>{accuracyPercent}%</span>
            </div>
          </>
        )}
      </div>

      <div className={styles.sessionNotice}>
        <Info size={13} className={styles.noticeIcon} />
        <span>Session progress only (not saved permanently). Answers reset on reload.</span>
      </div>
    </div>
  );
};
