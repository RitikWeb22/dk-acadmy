import React from 'react';
import type { PYQExam } from '../../../types';
import styles from './ExamSelector.module.scss';

interface ExamSelectorProps {
  selectedExam: PYQExam;
  onSelectExam: (exam: PYQExam) => void;
}

export const ExamSelector: React.FC<ExamSelectorProps> = ({
  selectedExam,
  onSelectExam
}) => {
  return (
    <div className={styles.selectorWrapper} role="tablist" aria-label="Select Target Exam">
      <button
        type="button"
        role="tab"
        aria-selected={selectedExam === 'JEE Main'}
        className={`${styles.tabBtn} ${selectedExam === 'JEE Main' ? styles.active : ''}`}
        onClick={() => onSelectExam('JEE Main')}
      >
        <span className={styles.examName}>JEE Main</span>
        <span className={styles.examSub}>Computer Based Test (NTA)</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={selectedExam === 'JEE Advanced'}
        className={`${styles.tabBtn} ${selectedExam === 'JEE Advanced' ? styles.active : ''}`}
        onClick={() => onSelectExam('JEE Advanced')}
      >
        <span className={styles.examName}>JEE Advanced</span>
        <span className={styles.examSub}>IIT Entrance Benchmark</span>
      </button>
    </div>
  );
};
