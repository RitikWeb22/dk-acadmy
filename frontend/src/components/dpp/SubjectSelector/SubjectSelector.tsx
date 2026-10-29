import React from 'react';
import { Layers, Atom, FlaskConical, Calculator } from 'lucide-react';
import styles from './SubjectSelector.module.scss';

export type SubjectFilterValue = 'All' | 'Physics' | 'Chemistry' | 'Mathematics';

interface SubjectSelectorProps {
  selectedSubject: SubjectFilterValue;
  onSelectSubject: (subject: SubjectFilterValue) => void;
  subjectCounts: Record<SubjectFilterValue, number>;
}

interface SubjectItem {
  value: SubjectFilterValue;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const SUBJECT_ITEMS: SubjectItem[] = [
  { value: 'All', label: 'All Subjects', icon: Layers },
  { value: 'Physics', label: 'Physics', icon: Atom },
  { value: 'Chemistry', label: 'Chemistry', icon: FlaskConical },
  { value: 'Mathematics', label: 'Mathematics', icon: Calculator },
];

export const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  selectedSubject,
  onSelectSubject,
  subjectCounts,
}) => {
  return (
    <div className={styles.selectorWrapper} role="tablist" aria-label="Filter DPP by Subject">
      {SUBJECT_ITEMS.map((item) => {
        const IconComponent = item.icon;
        const isSelected = selectedSubject === item.value;
        const count = subjectCounts[item.value] || 0;

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            className={`${styles.tabBtn} ${isSelected ? styles.active : ''} ${styles[item.value.toLowerCase()] || ''}`}
            onClick={() => onSelectSubject(item.value)}
          >
            <div className={styles.iconWrap}>
              <IconComponent size={18} />
            </div>
            <span className={styles.tabLabel}>{item.label}</span>
            <span className={styles.countBadge}>{count} Qs</span>
          </button>
        );
      })}
    </div>
  );
};
