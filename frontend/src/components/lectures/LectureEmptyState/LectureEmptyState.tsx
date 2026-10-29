import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import styles from './LectureEmptyState.module.scss';

interface LectureEmptyStateProps {
  searchQuery: string;
  subject: string;
  onResetFilters: () => void;
}

export const LectureEmptyState: React.FC<LectureEmptyStateProps> = ({
  searchQuery,
  subject,
  onResetFilters
}) => {
  return (
    <div className={styles.emptyContainer} role="status" aria-live="polite">
      <div className={styles.iconBox}>
        <SearchX size={36} className={styles.icon} />
      </div>

      <h3 className={styles.title}>No matching lectures found</h3>

      <p className={styles.message}>
        {searchQuery ? (
          <>
            No lectures found for <strong>"{searchQuery}"</strong>
            {subject !== 'All' ? ` under ${subject}.` : '.'}
          </>
        ) : (
          `No lectures currently available under the ${subject} discipline.`
        )}
      </p>

      <div className={styles.tipsBox}>
        <span className={styles.tipsTitle}>Search suggestions:</span>
        <ul className={styles.tipsList}>
          <li>Search by chapter name (e.g. "Thermodynamics", "Calculus", "Bonding")</li>
          <li>Search by core concept or theorem (e.g. "Gauss", "SN1", "Leibniz")</li>
          <li>Switch subject to "All Subjects"</li>
        </ul>
      </div>

      <Button
        onClick={onResetFilters}
        variant="primary"
        size="md"
        icon={<RotateCcw size={16} />}
        iconPosition="left"
      >
        Clear Filters & View All Lectures
      </Button>
    </div>
  );
};
