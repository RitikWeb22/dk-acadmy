import React from 'react';
import { Bookmark, Check, X } from 'lucide-react';
import type { DPPQuestionResponse, DPPQuestion } from '../../../types';
import styles from './QuestionNavigator.module.scss';

interface QuestionNavigatorProps {
  questions: DPPQuestion[];
  currentIndex: number;
  onSelectIndex: (idx: number) => void;
  responses: Record<string, DPPQuestionResponse>;
  isReviewMode?: boolean;
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions,
  currentIndex,
  onSelectIndex,
  responses,
  isReviewMode = false,
}) => {
  const totalCount = questions.length;

  return (
    <div className={styles.navigatorCard}>
      <div className={styles.headerRow}>
        <span className={styles.navTitle}>Question Palette</span>
        <span className={styles.currentPosition}>
          {currentIndex + 1} of {totalCount}
        </span>
      </div>

      <div className={styles.paletteGrid} role="navigation" aria-label="Question Navigation">
        {questions.map((q, index) => {
          const resp = responses[q.id];
          const isCurrent = index === currentIndex;
          const isAnswered = Boolean(resp?.selectedOption);
          const isMarked = Boolean(resp?.isMarkedForReview);
          const isEvaluated = Boolean(resp?.isEvaluated || isReviewMode);
          const isCorrect = resp?.selectedOption === q.correctAnswer;

          let statusClass = styles.unanswered;
          let labelText = `Question ${index + 1}: Unanswered`;

          if (isEvaluated && isAnswered) {
            if (isCorrect) {
              statusClass = styles.correct;
              labelText = `Question ${index + 1}: Correct`;
            } else {
              statusClass = styles.incorrect;
              labelText = `Question ${index + 1}: Incorrect`;
            }
          } else if (isMarked && isAnswered) {
            statusClass = styles.markedAndAnswered;
            labelText = `Question ${index + 1}: Answered & Marked for Review`;
          } else if (isMarked) {
            statusClass = styles.marked;
            labelText = `Question ${index + 1}: Marked for Review`;
          } else if (isAnswered) {
            statusClass = styles.answered;
            labelText = `Question ${index + 1}: Answered`;
          }

          return (
            <button
              key={q.id}
              type="button"
              className={`${styles.navBtn} ${statusClass} ${isCurrent ? styles.active : ''}`}
              onClick={() => onSelectIndex(index)}
              aria-label={`${labelText}${isCurrent ? ' (Current Question)' : ''}`}
              aria-current={isCurrent ? 'true' : undefined}
            >
              <span className={styles.qNum}>{index + 1}</span>
              {isMarked && !isEvaluated && <Bookmark size={10} className={styles.markedIcon} />}
              {isEvaluated && isAnswered && isCorrect && <Check size={11} className={styles.evalIcon} />}
              {isEvaluated && isAnswered && !isCorrect && <X size={11} className={styles.evalIcon} />}
            </button>
          );
        })}
      </div>

      {/* Legend Bar */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.answeredDot}`} />
          <span>Answered</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.markedDot}`} />
          <span>Marked</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.markedAndAnsweredDot}`} />
          <span>Ans & Marked</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.unansweredDot}`} />
          <span>Unanswered</span>
        </div>
        {isReviewMode && (
          <>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.correctDot}`} />
              <span>Correct</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.incorrectDot}`} />
              <span>Incorrect</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
