import React from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, CheckCircle2, Sparkles, FileText, ArrowRight, ShieldCheck, Video } from 'lucide-react';
import styles from './PYQCourseUnlockModal.module.scss';

interface PYQCourseUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnroll: () => void;
  questionNumber?: number;
  paperTitle?: string;
  paperPrice?: number;
}

export const PYQCourseUnlockModal: React.FC<PYQCourseUnlockModalProps> = ({
  isOpen,
  onClose,
  onEnroll,
  questionNumber,
  paperTitle,
  paperPrice = 499
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Unlock Complete Paper"
    >
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        {/* Top Header Row with Close */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.lockBadge}>
              <Lock size={16} className={styles.lockIcon} />
            </div>
            <div>
              <span className={styles.planBadge}>
                <Sparkles size={11} />
                Unlock Complete Paper
              </span>
              <h3 className={styles.title}>
                {paperTitle ? paperTitle : (questionNumber ? `Question ${questionNumber} • Paper Access` : 'Unlock Complete Paper')}
              </h3>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className={styles.contentBody}>
          <p className={styles.description}>
            Instant access to all questions in this paper, complete step-by-step mathematical derivations, video solutions, and downloadable PDF keys.
          </p>

          {/* Compact Feature Grid */}
          <div className={styles.featuresGrid}>
            <div className={styles.featureItem}>
              <CheckCircle2 size={13} className={styles.featureCheck} />
              <span>All Questions with KaTeX</span>
            </div>
            <div className={styles.featureItem}>
              <Video size={13} className={styles.featureVideo} />
              <span>DK Sir Video Solutions</span>
            </div>
            <div className={styles.featureItem}>
              <FileText size={13} className={styles.featurePdf} />
              <span>High-Res Solution PDF</span>
            </div>
            <div className={styles.featureItem}>
              <ShieldCheck size={13} className={styles.featureShield} />
              <span>Instant Lifetime Access</span>
            </div>
          </div>

          {/* Pricing Row */}
          <div className={styles.pricingCard}>
            <div className={styles.priceLeft}>
              <span className={styles.pricingTag}>One-Time Paper Fee</span>
              <div className={styles.priceNums}>
                <span className={styles.mainPrice}>₹{paperPrice}</span>
                <span className={styles.validityText}>• All Questions Included</span>
              </div>
            </div>
            <div className={styles.guaranteeTag}>
              <ShieldCheck size={12} />
              <span>Instant Unlock</span>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actionFooter}>
            <button
              type="button"
              className={styles.enrollBtn}
              onClick={() => {
                onEnroll();
                onClose();
              }}
            >
              <span>Unlock Complete Paper (₹{paperPrice})</span>
              <ArrowRight size={15} />
            </button>

            <button
              type="button"
              className={styles.continueFreeBtn}
              onClick={onClose}
            >
              Continue Free Preview
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
