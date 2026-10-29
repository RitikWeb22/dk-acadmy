import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';
import styles from './TestEmptyState.module.scss';

interface TestEmptyStateProps {
  onClearFilters: () => void;
  message?: string;
}

export const TestEmptyState: React.FC<TestEmptyStateProps> = ({
  onClearFilters,
  message = 'No mock tests match your current search or filters.',
}) => {
  return (
    <div className={styles.emptyContainer}>
      <div className={styles.iconWrap}>
        <SearchX size={32} />
      </div>
      <h3 className={styles.title}>No Mock Tests Found</h3>
      <p className={styles.description}>{message}</p>
      <button type="button" className={styles.resetBtn} onClick={onClearFilters}>
        <RotateCcw size={16} />
        <span>Reset Filters</span>
      </button>
    </div>
  );
};
