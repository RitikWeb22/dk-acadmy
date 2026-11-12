import React from 'react';
import { RotateCcw } from 'lucide-react';
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
      <div className={styles.illustrationWrap}>
        <img
          src="/images/pyq-empty-search.png"
          alt="No practice sets found"
          className={styles.emptyIllustration}
        />
      </div>
      <h3 className={styles.title}>No DPP Sets Found</h3>
      <p className={styles.description}>{message}</p>
      <button type="button" className={styles.resetBtn} onClick={onClearFilters}>
        <RotateCcw size={15} />
        <span>Reset All Filters</span>
      </button>
    </div>
  );
};
