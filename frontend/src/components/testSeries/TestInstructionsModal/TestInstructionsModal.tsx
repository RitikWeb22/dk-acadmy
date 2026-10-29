import React, { useEffect } from 'react';
import { X, Clock, HelpCircle, Award, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';
import type { TestSeriesItem } from '../../../types';
import styles from './TestInstructionsModal.module.scss';

interface TestInstructionsModalProps {
  test: TestSeriesItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStartTest: (testId: string) => void;
}

export const TestInstructionsModal: React.FC<TestInstructionsModalProps> = ({
  test,
  isOpen,
  onClose,
  onStartTest,
}) => {
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !test) return null;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="instructions-modal-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close instructions"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.iconWrap}>
            <ShieldCheck size={28} />
          </div>
          <span className={styles.examTag}>{test.examType} Mock Examination</span>
          <h2 id="instructions-modal-title" className={styles.title}>
            {test.title}
          </h2>
          <p className={styles.subtitle}>{test.subtitle}</p>
        </div>

        {/* Test Overview Spec */}
        <div className={styles.specGrid}>
          <div className={styles.specItem}>
            <Clock size={16} className={styles.specIcon} />
            <div className={styles.specContent}>
              <span className={styles.specValue}>{test.durationMinutes} Minutes</span>
              <span className={styles.specLabel}>Duration</span>
            </div>
          </div>

          <div className={styles.specItem}>
            <HelpCircle size={16} className={styles.specIcon} />
            <div className={styles.specContent}>
              <span className={styles.specValue}>{test.totalQuestions} Problems</span>
              <span className={styles.specLabel}>Total Questions</span>
            </div>
          </div>

          <div className={styles.specItem}>
            <Award size={16} className={styles.specIcon} />
            <div className={styles.specContent}>
              <span className={styles.specValue}>{test.totalMarks} Marks</span>
              <span className={styles.specLabel}>Maximum Score</span>
            </div>
          </div>

          <div className={styles.specItem}>
            <CheckCircle size={16} className={styles.specIcon} />
            <div className={styles.specContent}>
              <span className={styles.specValue}>+{test.markingScheme.correct} / -{test.markingScheme.incorrect}</span>
              <span className={styles.specLabel}>Marking Scheme</span>
            </div>
          </div>
        </div>

        {/* Guidelines List */}
        <div className={styles.guidelinesSection}>
          <h3 className={styles.sectionHeading}>Important Examination Guidelines</h3>
          <ul className={styles.instructionsList}>
            {test.instructions.map((inst, idx) => (
              <li key={idx} className={styles.instructionItem}>
                <span className={styles.bullet}>{idx + 1}.</span>
                <span>{inst}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Warning Notice */}
        <div className={styles.warningNotice}>
          <AlertTriangle size={16} className={styles.warnIcon} />
          <p className={styles.warnText}>
            The countdown timer will initiate immediately once you click <strong>Start Test Now</strong>. Ensure a stable environment.
          </p>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel & Go Back
          </button>
          <button
            type="button"
            className={styles.startBtn}
            onClick={() => onStartTest(test.id)}
          >
            Start Test Now
          </button>
        </div>
      </div>
    </div>
  );
};
