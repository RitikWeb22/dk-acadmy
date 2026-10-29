import React, { useState } from 'react';
import { Lock, Bookmark, Check, Eye } from 'lucide-react';
import type { PYQUserResponse } from '../../../types';
import styles from './QuestionNavigator.module.scss';

interface QuestionNavigatorProps {
  totalCount: number;
  currentIndex: number;
  onSelectIndex: (idx: number) => void;
  responses: Record<string, PYQUserResponse>;
  questionIds: string[];
  isEnrolled?: boolean;
  freeCount?: number;
  onToggleMarkForReview?: (questionId: string) => void;
}

type PaletteFilter = 'all' | 'attempted' | 'unattempted' | 'marked';

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  totalCount,
  currentIndex,
  onSelectIndex,
  responses,
  questionIds,
  isEnrolled = false,
  freeCount = 5,
  onToggleMarkForReview
}) => {
  const [filterMode, setFilterMode] = useState<PaletteFilter>('all');

  // Compute status counts for the filter summary
  const stats = React.useMemo(() => {
    let attempted = 0;
    let unattempted = 0;
    let marked = 0;

    questionIds.forEach((id) => {
      const resp = responses[id];
      if (resp?.isMarkedForReview) {
        marked += 1;
      }
      if (resp?.selectedOption) {
        attempted += 1;
      } else {
        unattempted += 1;
      }
    });

    return { attempted, unattempted, marked };
  }, [questionIds, responses]);

  return (
    <div className={styles.navigatorCard} aria-label="Question Practice Palette">
      {/* Palette Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <h3 className={styles.navTitle}>Question Palette</h3>
          <span className={styles.currentPosition}>
            Q.{currentIndex + 1} of {totalCount} Active
          </span>
        </div>

        {/* Current Question Quick Mark for Review Action */}
        {onToggleMarkForReview && questionIds[currentIndex] && (
          <button
            type="button"
            className={`${styles.markReviewBtn} ${responses[questionIds[currentIndex]]?.isMarkedForReview ? styles.markedActive : ''}`}
            onClick={() => onToggleMarkForReview(questionIds[currentIndex])}
            aria-label="Toggle Mark for Review on current question"
            title="Mark/Unmark this question for review"
          >
            <Bookmark size={13} fill={responses[questionIds[currentIndex]]?.isMarkedForReview ? 'currentColor' : 'none'} />
            <span>{responses[questionIds[currentIndex]]?.isMarkedForReview ? 'Marked' : 'Review'}</span>
          </button>
        )}
      </div>

      {/* Filter Summary Chips: All, Attempted (Green), Unattempted (Gray), Marked for Review (Purple) */}
      <div className={styles.filterSummaryRow} role="tablist" aria-label="Question state filters">
        <button
          type="button"
          className={`${styles.summaryChip} ${filterMode === 'all' ? styles.chipActive : ''}`}
          onClick={() => setFilterMode('all')}
        >
          <span>All ({totalCount})</span>
        </button>
        <button
          type="button"
          className={`${styles.summaryChip} ${styles.chipAttempted} ${filterMode === 'attempted' ? styles.chipActive : ''}`}
          onClick={() => setFilterMode('attempted')}
        >
          <span className={styles.indicatorGreen} />
          <span>Attempted ({stats.attempted})</span>
        </button>
        <button
          type="button"
          className={`${styles.summaryChip} ${styles.chipUnattempted} ${filterMode === 'unattempted' ? styles.chipActive : ''}`}
          onClick={() => setFilterMode('unattempted')}
        >
          <span className={styles.indicatorGray} />
          <span>Unattempted ({stats.unattempted})</span>
        </button>
        <button
          type="button"
          className={`${styles.summaryChip} ${styles.chipMarked} ${filterMode === 'marked' ? styles.chipActive : ''}`}
          onClick={() => setFilterMode('marked')}
        >
          <span className={styles.indicatorPurple} />
          <span>Marked ({stats.marked})</span>
        </button>
      </div>

      {/* Numbered Circular Grid (1, 2, 3...) */}
      <div className={styles.circularGrid} role="navigation" aria-label="Question selection grid">
        {questionIds.map((id, index) => {
          const resp = responses[id];
          const isCurrent = index === currentIndex;
          const isAnswered = Boolean(resp?.selectedOption);
          const isMarked = Boolean(resp?.isMarkedForReview);
          const isLocked = !isEnrolled && index >= freeCount;

          // Apply Filter Mode
          if (filterMode === 'attempted' && !isAnswered) return null;
          if (filterMode === 'unattempted' && isAnswered) return null;
          if (filterMode === 'marked' && !isMarked) return null;

          // Compute State: Attempted (Green), Unattempted (Gray), Marked for Review (Purple)
          let stateClass = styles.stateUnattempted;
          let stateLabel = 'Unattempted';

          if (isMarked) {
            stateClass = styles.stateMarked;
            stateLabel = 'Marked for Review';
          } else if (isAnswered) {
            stateClass = styles.stateAttempted;
            stateLabel = 'Attempted';
          }

          if (isLocked) {
            stateClass = `${stateClass} ${styles.stateLocked}`;
            stateLabel += ' (Course Locked)';
          }

          return (
            <button
              key={id}
              type="button"
              className={`${styles.circleBtn} ${stateClass} ${isCurrent ? styles.stateCurrent : ''}`}
              onClick={() => onSelectIndex(index)}
              aria-label={`Question ${index + 1}: ${stateLabel}${isCurrent ? ' (Active)' : ''}`}
              aria-current={isCurrent ? 'true' : undefined}
            >
              <span className={styles.circleNum}>{index + 1}</span>

              {/* Status Indicator Badges */}
              {isLocked ? (
                <span className={styles.badgeLock} title="Course Enrollment Required">
                  <Lock size={9} aria-hidden="true" />
                </span>
              ) : isMarked ? (
                <span className={styles.badgeMarked} title="Marked for Review">
                  <Bookmark size={8} fill="currentColor" aria-hidden="true" />
                </span>
              ) : isAnswered ? (
                <span className={styles.badgeAttempted} title="Attempted">
                  <Check size={8} strokeWidth={3} aria-hidden="true" />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Palette Legend */}
      <div className={styles.legendRow}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotAttempted}`} />
          <span>Attempted</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotUnattempted}`} />
          <span>Unattempted</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotMarked}`} />
          <span>Marked for Review</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotCurrent}`} />
          <span>Active</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigator;
