import React from 'react';
import { RotateCcw } from 'lucide-react';
import type { Subject } from '../../../types';
import { LECTURE_SUBJECTS } from '../../../data/lecturesData';
import styles from './LectureFilters.module.scss';

interface LectureFiltersProps {
  selectedSubject: 'All' | Subject;
  onSelectSubject: (subject: 'All' | Subject) => void;
  isFilterActive: boolean;
  onResetFilters: () => void;
  resultCount: number;
}

export const LectureFilters: React.FC<LectureFiltersProps> = ({
  selectedSubject,
  onSelectSubject,
  isFilterActive,
  onResetFilters,
  resultCount
}) => {
  return (
    <div className={styles.filtersBar}>
      <div className={styles.subjectsList} role="tablist" aria-label="Lecture Subjects">
        {LECTURE_SUBJECTS.map((sub) => {
          const isSelected = selectedSubject === sub.value;
          return (
            <button
              key={sub.value}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`${styles.filterBtn} ${isSelected ? styles.active : ''}`}
              onClick={() => onSelectSubject(sub.value)}
            >
              {sub.label}
            </button>
          );
        })}
      </div>

      <div className={styles.metaRow} aria-live="polite" aria-atomic="true">
        <span id="lecture-count-text" className={styles.countText}>
          <strong>{resultCount}</strong> {resultCount === 1 ? 'lecture' : 'lectures'} available
        </span>

        {isFilterActive && (
          <button
            type="button"
            onClick={onResetFilters}
            className={styles.resetBtn}
            aria-label="Reset all search and subject filters"
          >
            <RotateCcw size={14} className={styles.resetIcon} />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
