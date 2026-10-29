import React from 'react';
import { RotateCcw } from 'lucide-react';
import type { CourseCategory } from '../../../types';
import { COURSE_CATEGORIES } from '../../../data/coursesData';
import styles from './CourseFilters.module.scss';

interface CourseFiltersProps {
  selectedCategory: 'All' | CourseCategory;
  onSelectCategory: (category: 'All' | CourseCategory) => void;
  isFilterActive: boolean;
  onResetFilters: () => void;
  resultCount: number;
}

export const CourseFilters: React.FC<CourseFiltersProps> = ({
  selectedCategory,
  onSelectCategory,
  isFilterActive,
  onResetFilters,
  resultCount
}) => {
  return (
    <div className={styles.filtersBar}>
      <div className={styles.categoriesList} role="tablist" aria-label="Course Categories">
        {COURSE_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`${styles.filterBtn} ${isSelected ? styles.active : ''}`}
              onClick={() => onSelectCategory(cat.value)}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className={styles.metaRow}>
        <span className={styles.countText}>
          <strong>{resultCount}</strong> {resultCount === 1 ? 'course' : 'courses'} found
        </span>

        {isFilterActive && (
          <button
            type="button"
            onClick={onResetFilters}
            className={styles.resetBtn}
            aria-label="Reset all search and category filters"
          >
            <RotateCcw size={14} className={styles.resetIcon} />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
