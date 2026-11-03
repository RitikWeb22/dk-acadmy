import React from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, CheckCircle2, Sparkles, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { YoutubeIcon } from '../../ui/YoutubeIcon/YoutubeIcon';
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
        {/* Top Header Badge */}
        <div className={styles.headerGraphic}>
          <div className={styles.lockBadge}>
            <Lock size={22} className={styles.lockIcon} />
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className={styles.contentBody}>
          <div className={styles.badgeRow}>
            <span className={styles.planBadge}>
              <Sparkles size={13} />
              Unlock Complete Paper
            </span>
          </div>

          <h2 className={styles.title}>
            {paperTitle ? `Unlock Complete Paper: ${paperTitle}` : (questionNumber ? `Question ${questionNumber} • Unlock Complete Paper` : 'Unlock Complete Paper')}
          </h2>

          <p className={styles.description}>
            Unlock full instant access to all questions in this paper, including step-by-step mathematical derivations, DK Sir Kota speed shortcuts, video walkthroughs, and downloadable PDF solutions.
          </p>

          {/* Value Prop List */}
          <div className={styles.benefitsCard}>
            <h4 className={styles.benefitsTitle}>Everything included in this Paper:</h4>
            <ul className={styles.benefitsList}>
              <li>
                <CheckCircle2 size={16} className={styles.bulletIcon} />
                <span><strong>All Paper Questions:</strong> Complete curated archive with KaTeX mathematical formulas</span>
              </li>
              <li>
                <YoutubeIcon size={16} className={styles.bulletIconYt} />
                <span><strong>Video Walkthroughs &amp; Solutions:</strong> DK Sir 20-30s Kota inspection shortcuts</span>
              </li>
              <li>
                <FileText size={16} className={styles.bulletIconPdf} />
                <span><strong>Downloadable Solution PDFs:</strong> High-resolution full paper derivation and step keys</span>
              </li>
              <li>
                <CheckCircle2 size={16} className={styles.bulletIcon} />
                <span><strong>Complete Scoring &amp; Review:</strong> Instant evaluation, timer, and detailed accuracy analytics</span>
              </li>
            </ul>
          </div>

          {/* Pricing Row */}
          <div className={styles.pricingCard}>
            <div className={styles.priceLeft}>
              <span className={styles.pricingTag}>Paper Access Fee</span>
              <div className={styles.priceNums}>
                <span className={styles.mainPrice}>₹{paperPrice}</span>
              </div>
              <span className={styles.validityText}>Full Lifetime Access • Instant Unlock</span>
            </div>

            <div className={styles.guaranteeTag}>
              <ShieldCheck size={16} />
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
              <ArrowRight size={16} />
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
