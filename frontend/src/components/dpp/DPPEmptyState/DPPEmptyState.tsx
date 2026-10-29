import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';
import styles from './DPPEmptyState.module.scss';

interface DPPEmptyStateProps {
  onClearFilters: () => void;
  message?: string;
}

export const DPPEmptyState: React.FC<DPPEmptyStateProps> = ({
  onClearFilters,
  message = 'No practice problem sets match your current filters.',
}) => {
  return (
    <div className={styles.emptyContainer}>
      <div className={styles.iconWrap}>
        <SearchX size={32} />
      </div>
      <h3 className={styles.title}>No DPP Sets Found</h3>
      <p className={styles.description}>{message}</p>
      <button type="button" className={styles.resetBtn} onClick={onClearFilters}>
        <RotateCcw size={16} />
        <span>Reset Filters</span>
      </button>
    </div>
  );
};
