import React from 'react';
import { Layers, GraduationCap, Flame, Zap } from 'lucide-react';
import type { TestExamType } from '../../../types';
import styles from './ExamSelector.module.scss';

export type ExamFilterValue = 'All' | TestExamType | 'MathSpeed';

interface ExamSelectorProps {
  selectedExam: ExamFilterValue;
  onSelectExam: (exam: ExamFilterValue) => void;
  examCounts: Record<ExamFilterValue, number>;
}

interface ExamTabItem {
  value: ExamFilterValue;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

const EXAM_ITEMS: ExamTabItem[] = [
  { value: 'All', label: 'All India CBT Mocks', icon: Layers },
  { value: 'JEE Main', label: 'JEE Main Mocks', icon: GraduationCap },
  { value: 'JEE Advanced', label: 'JEE Advanced Engine', icon: Flame },
  { value: 'MathSpeed', label: 'DK Sir Speed Math', icon: Zap, badge: 'HOT' },
];

export const ExamSelector: React.FC<ExamSelectorProps> = ({
  selectedExam,
  onSelectExam,
  examCounts,
}) => {
  return (
    <div className={styles.selectorWrapper} role="tablist" aria-label="Select Target Exam">
      {EXAM_ITEMS.map((item) => {
        const IconComponent = item.icon;
        const isSelected = selectedExam === item.value;
        const count = examCounts[item.value] || 0;

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            className={`${styles.tabBtn} ${isSelected ? styles.active : ''}`}
            onClick={() => onSelectExam(item.value)}
          >
            <div className={styles.iconWrap}>
              <IconComponent size={18} />
            </div>
            <span className={styles.tabLabel}>
              {item.label}
              {item.badge && <span className={styles.hotBadge}>{item.badge}</span>}
            </span>
            <span className={styles.countBadge}>{count} Tests</span>
          </button>
        );
      })}
    </div>
  );
};
