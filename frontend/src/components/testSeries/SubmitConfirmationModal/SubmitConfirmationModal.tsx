import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Bookmark, X } from 'lucide-react';
import styles from './SubmitConfirmationModal.module.scss';

interface SubmitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalQuestions: number;
  answeredCount: number;
  markedCount: number;
}

export const SubmitConfirmationModal: React.FC<SubmitConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalQuestions,
  answeredCount,
  markedCount,
}) => {
  const unansweredCount = totalQuestions - answeredCount;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-submit-test-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close submit confirmation dialog"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className={styles.header}>
          <div className={`${styles.iconWrap} ${unansweredCount > 0 ? styles.warningIcon : styles.successIcon}`}>
            {unansweredCount > 0 ? <AlertTriangle size={26} /> : <CheckCircle size={26} />}
          </div>
          <h2 id="confirm-submit-test-title" className={styles.title}>
            Submit Test Attempt?
          </h2>
          <p className={styles.subtitle}>
            {unansweredCount > 0
              ? `You have ${unansweredCount} unanswered ${unansweredCount === 1 ? 'question' : 'questions'}. Unanswered questions receive 0 marks with no negative penalty.`
              : 'You have answered all questions in this mock test. Ready to calculate your score and detailed analysis?'}
          </p>
        </div>

        {/* Question Status Grid */}
        <div className={styles.statusBreakdown}>
          <div className={styles.statusItem}>
            <div className={styles.statusCount}>{answeredCount}</div>
            <div className={styles.statusLabel}>Answered</div>
          </div>
          <div className={styles.statusItem}>
            <div className={`${styles.statusCount} ${unansweredCount > 0 ? styles.countWarning : ''}`}>
              {unansweredCount}
            </div>
            <div className={styles.statusLabel}>Unanswered</div>
          </div>
          <div className={styles.statusItem}>
            <div className={styles.statusCount}>
              <span className={styles.markedNumber}>
                <Bookmark size={12} /> {markedCount}
              </span>
            </div>
            <div className={styles.statusLabel}>Marked for Review</div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Continue Test
          </button>
          <button type="button" className={styles.confirmBtn} onClick={onConfirm}>
            Yes, Final Submit
          </button>
        </div>
      </div>
    </div>
  );
};
