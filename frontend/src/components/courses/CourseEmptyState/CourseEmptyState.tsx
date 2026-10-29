import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import styles from './CourseEmptyState.module.scss';

interface CourseEmptyStateProps {
  searchQuery: string;
  category: string;
  onResetFilters: () => void;
}

export const CourseEmptyState: React.FC<CourseEmptyStateProps> = ({
  searchQuery,
  category,
  onResetFilters
}) => {
  return (
    <div className={styles.emptyContainer} role="status" aria-live="polite">
      <div className={styles.iconBox}>
        <SearchX size={36} className={styles.icon} />
      </div>

      <h3 className={styles.title}>No matching courses found</h3>

      <p className={styles.message}>
        {searchQuery ? (
          <>
            We couldn't find any courses matching <strong>"{searchQuery}"</strong>
            {category !== 'All' ? ` in the ${category} category.` : '.'}
          </>
        ) : (
          `No courses available under the "${category}" category right now.`
        )}
      </p>

      <div className={styles.tipsBox}>
        <span className={styles.tipsTitle}>Search suggestions:</span>
        <ul className={styles.tipsList}>
          <li>Check for typos or alternate spellings (e.g., "Physics", "Calculus", "Mechanics")</li>
          <li>Try switching category to "All Courses"</li>
          <li>Browse general batches such as "Comprehensive" or "Foundation"</li>
        </ul>
      </div>

      <Button
        onClick={onResetFilters}
        variant="primary"
        size="md"
        icon={<RotateCcw size={16} />}
        iconPosition="left"
      >
        Clear Filters & View All Courses
      </Button>
    </div>
  );
};
