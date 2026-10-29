import React from 'react';
import { Bookmark, Check } from 'lucide-react';
import type { TestQuestion, TestQuestionResponse } from '../../../types';
import styles from './QuestionPalette.module.scss';

interface QuestionPaletteProps {
  questions: TestQuestion[];
  currentIndex: number;
  onSelectIndex: (idx: number) => void;
  responses: Record<string, TestQuestionResponse>;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  currentIndex,
  onSelectIndex,
  responses,
}) => {
  const totalCount = questions.length;

  return (
    <div className={styles.paletteContainer}>
      <div className={styles.header}>
        <span className={styles.paletteTitle}>Question Palette</span>
        <span className={styles.currentPosition}>
          {currentIndex + 1} of {totalCount}
        </span>
      </div>

      {/* Palette Buttons Grid */}
      <div className={styles.grid} role="navigation" aria-label="Mock Test Question Palette">
        {questions.map((q, index) => {
          const resp = responses[q.id];
          const isCurrent = index === currentIndex;
          const isVisited = resp?.isVisited ?? false;
          const isAnswered = Boolean(resp?.selectedOption);
          const isMarked = resp?.isMarkedForReview ?? false;

          let statusClass = styles.notVisited;
          let statusText = 'Not Visited';

          if (isAnswered && isMarked) {
            statusClass = styles.answeredAndMarked;
            statusText = 'Answered & Marked for Review';
          } else if (isMarked) {
            statusClass = styles.markedForReview;
            statusText = 'Marked for Review';
          } else if (isAnswered) {
            statusClass = styles.answered;
            statusText = 'Answered';
          } else if (isVisited) {
            statusClass = styles.notAnswered;
            statusText = 'Not Answered';
          }

          return (
            <button
              key={q.id}
              type="button"
              className={`${styles.paletteBtn} ${statusClass} ${isCurrent ? styles.active : ''}`}
              onClick={() => onSelectIndex(index)}
              aria-label={`Question ${index + 1}: ${statusText}${isCurrent ? ' (Current Question)' : ''}`}
              aria-current={isCurrent ? 'true' : undefined}
            >
              <span className={styles.qNum}>{index + 1}</span>
              {isMarked && !isAnswered && <Bookmark size={10} className={styles.cornerIcon} />}
              {isAnswered && isMarked && <Check size={10} className={styles.cornerIcon} />}
            </button>
          );
        })}
      </div>

      {/* Palette Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendBox} ${styles.answeredBox}`} />
          <span>Answered</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendBox} ${styles.notAnsweredBox}`} />
          <span>Not Answered</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendBox} ${styles.markedBox}`} />
          <span>Marked for Review</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendBox} ${styles.answeredMarkedBox}`} />
          <span>Ans & Marked</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendBox} ${styles.notVisitedBox}`} />
          <span>Not Visited</span>
        </div>
      </div>
    </div>
  );
};
