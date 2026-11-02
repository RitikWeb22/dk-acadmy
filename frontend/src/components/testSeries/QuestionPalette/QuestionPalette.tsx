import React from 'react';
import { Bookmark, Check } from 'lucide-react';
import type { TestQuestion, TestQuestionResponse } from '../../../types';
import styles from './QuestionPalette.module.scss';

export const isSectionBQuestion = (q: TestQuestion, subjectIndex?: number): boolean => {
  if (q.section === 'B') return true;
  if (q.section === 'A') return false;
  if (q.type === 'NUMERICAL') return true;
  if (q.options && q.options.length > 0 && q.options.some((o) => o.text && o.text.trim().length > 0)) {
    if (typeof subjectIndex === 'number' && subjectIndex >= 20) return true;
    return false;
  }
  if (!q.options || q.options.length === 0) return true;
  if (typeof subjectIndex === 'number' && subjectIndex >= 20) return true;
  return false;
};

interface QuestionPaletteProps {
  questions: TestQuestion[];
  currentIndex: number;
  onSelectIndex: (idx: number) => void;
  responses: Record<string, TestQuestionResponse>;
  activeSubject?: string;
  onSelectSubject?: (sub: string) => void;
  subjects?: string[];
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  currentIndex,
  onSelectIndex,
  responses,
  activeSubject,
  onSelectSubject,
  subjects,
}) => {
  const totalCount = questions.length;

  // Filter questions for the active subject if provided
  const currentSub = activeSubject || questions[currentIndex]?.subject || 'General';
  const subjectQuestions = questions.filter((q) => !activeSubject || q.subject === currentSub);

  // Partition active subject questions into Section A and Section B
  const secAQuestions = subjectQuestions.filter((q, idx) => !isSectionBQuestion(q, idx));
  const secBQuestions = subjectQuestions.filter((q, idx) => isSectionBQuestion(q, idx));

  // Count answered in each section
  const countAnswered = (list: TestQuestion[]) => {
    return list.filter((q) => {
      const qId = q.id || (q as any)?._id;
      const resp = qId ? responses[qId] : undefined;
      return Boolean(resp?.numericalValue?.trim() || resp?.selectedOption);
    }).length;
  };

  const secAAnswered = countAnswered(secAQuestions);
  const secBAnswered = countAnswered(secBQuestions);

  const renderQuestionGrid = (list: TestQuestion[]) => {
    return (
      <div className={styles.grid} role="navigation" aria-label="Mock Test Question Palette">
        {list.map((q) => {
          const globalIndex = questions.findIndex(
            (item) => (item.id || (item as any)?._id) === (q.id || (q as any)?._id)
          );
          const qId = q?.id || (q as any)?._id || `q-${globalIndex}`;
          const resp = responses[qId];
          const isCurrent = globalIndex === currentIndex;
          const isVisited = resp?.isVisited ?? false;
          const isAnswered = Boolean(resp?.numericalValue?.trim() || resp?.selectedOption);
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
              key={qId}
              type="button"
              className={`${styles.paletteBtn} ${statusClass} ${isCurrent ? styles.active : ''}`}
              onClick={() => onSelectIndex(globalIndex)}
              aria-label={`Question ${globalIndex + 1}: ${statusText}${isCurrent ? ' (Current Question)' : ''}`}
              aria-current={isCurrent ? 'true' : undefined}
            >
              <span className={styles.qNum}>{globalIndex + 1}</span>
              {isMarked && !isAnswered && <Bookmark size={10} className={styles.cornerIcon} />}
              {isAnswered && isMarked && <Check size={10} className={styles.cornerIcon} />}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.paletteContainer}>
      <div className={styles.header}>
        <span className={styles.paletteTitle}>Question Palette</span>
        <span className={styles.currentPosition}>
          {currentIndex + 1} of {totalCount}
        </span>
      </div>

      {/* Quick Subject Tabs in Palette (if multiple subjects exist) */}
      {subjects && subjects.length > 1 && onSelectSubject && (
        <div className={styles.paletteSubjectTabs}>
          {subjects.map((sub) => {
            const isSubActive = sub === currentSub;
            return (
              <button
                key={sub}
                type="button"
                className={`${styles.paletteSubBtn} ${isSubActive ? styles.paletteSubBtnActive : ''}`}
                onClick={() => onSelectSubject(sub)}
              >
                {sub}
              </button>
            );
          })}
        </div>
      )}

      {/* Section A: MCQs */}
      <div className={styles.secPaletteBlock}>
        <div className={styles.secPaletteHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className={styles.secPaletteBadgeA}>Section A</span>
            <span className={styles.secPaletteTitleText}>MCQs</span>
          </div>
          <span className={styles.secPaletteCount}>
            {secAAnswered}/{secAQuestions.length}
          </span>
        </div>
        {renderQuestionGrid(secAQuestions)}
      </div>

      {/* Section B: Numerical Value Type (if any exist in subject) */}
      {secBQuestions.length > 0 && (
        <div className={styles.secPaletteBlock}>
          <div className={styles.secPaletteHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className={styles.secPaletteBadgeB}>Section B</span>
              <span className={styles.secPaletteTitleText}>Numerical</span>
            </div>
            <span className={styles.secPaletteCount}>
              {secBAnswered}/{secBQuestions.length} {secBQuestions.length >= 10 && <span style={{ color: '#D97706', fontSize: '10px' }}>(Max 5)</span>}
            </span>
          </div>
          {renderQuestionGrid(secBQuestions)}
        </div>
      )}

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
