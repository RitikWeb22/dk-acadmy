import React from 'react';
import { HelpCircle, RotateCcw } from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import styles from './PYQEmptyState.module.scss';

interface PYQEmptyStateProps {
  searchQuery: string;
  selectedSubject: string;
  selectedYear: number | 'All';
  selectedExam: string;
  onResetFilters: () => void;
}

export const PYQEmptyState: React.FC<PYQEmptyStateProps> = ({
  searchQuery,
  selectedSubject,
  selectedYear,
  selectedExam,
  onResetFilters
}) => {
  return (
    <div className={styles.emptyContainer} role="status" aria-live="polite">
      <div className={styles.iconBox}>
        <HelpCircle size={36} className={styles.icon} />
      </div>

      <h3 className={styles.title}>No matching questions found</h3>

      <p className={styles.message}>
        We couldn't find any {selectedExam} questions matching your current filters:
        {searchQuery && <span> keyword: "<strong>{searchQuery}</strong>"</span>}
        {selectedSubject !== 'All' && <span> • subject: <strong>{selectedSubject}</strong></span>}
        {selectedYear !== 'All' && <span> • year: <strong>{selectedYear}</strong></span>}.
      </p>

      <div className={styles.tipsBox}>
        <span className={styles.tipsTitle}>Tips to find questions:</span>
        <ul className={styles.tipsList}>
          <li>Switch subject to "All Subjects"</li>
          <li>Set year to "All Years (2021–2024)"</li>
          <li>Search by specific topic name like "Moment of Inertia", "Gauss", "Integration"</li>
        </ul>
      </div>

      <Button
        onClick={onResetFilters}
        variant="primary"
        size="md"
        icon={<RotateCcw size={16} />}
        iconPosition="left"
      >
        Reset Filters & Show All {selectedExam} Questions
      </Button>
    </div>
  );
};
