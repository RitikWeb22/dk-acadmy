import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { TestSeriesItem } from '../../../types';
import styles from './ScheduledTestModal.module.scss';

interface ScheduledTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestSeriesItem | null;
  formattedStartTime: string;
}

export const ScheduledTestModal: React.FC<ScheduledTestModalProps> = ({
  isOpen,
  onClose,
  test,
  formattedStartTime
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !test || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scheduled-test-title"
    >
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.badgeRow}>
            <span className={styles.statusPill}>
              <span className={styles.pulseDot} />
              Scheduled Live CBT Mock
            </span>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close scheduled test announcement"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          <div className={styles.titleArea}>
            <h3 id="scheduled-test-title">{test.title}</h3>
            {test.subtitle && <p>{test.subtitle}</p>}
          </div>

          {/* Time Hero Highlight */}
          <div className={styles.timeHeroCard}>
            <div className={styles.calendarIconWrap}>
              <Calendar size={26} />
            </div>
            <div className={styles.timeDetails}>
              <span className={styles.timeLabel}>Live Examination Window</span>
              <span className={styles.timeValue}>
                Opens on {formattedStartTime || 'Scheduled Date'}
              </span>
            </div>
          </div>

          {/* Specs */}
          <div className={styles.specRow}>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Duration</span>
              <span className={styles.specVal}>{test.durationMinutes} Mins</span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Total Questions</span>
              <span className={styles.specVal}>{test.totalQuestions || test.questions?.length || 75} Qs</span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Total Marks</span>
              <span className={styles.specVal}>{test.totalMarks || 300} Marks</span>
            </div>
          </div>

          {/* Instructions Callout */}
          <div className={styles.instructionsCallout}>
            <CheckCircle2 size={16} />
            <span>
              This scheduled CBT mock opens on <strong>{formattedStartTime}</strong>. Please return at that time to take the live test with real-time National AIR benchmark scoring.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={onClose}
          >
            Understood, Return to Catalog
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

