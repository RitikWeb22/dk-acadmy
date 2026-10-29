import React from 'react';
import { X, Lock, CheckCircle2, Sparkles, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { YoutubeIcon } from '../../ui/YoutubeIcon/YoutubeIcon';
import styles from './PYQCourseUnlockModal.module.scss';

interface PYQCourseUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnroll: () => void;
  questionNumber?: number;
}

export const PYQCourseUnlockModal: React.FC<PYQCourseUnlockModalProps> = ({
  isOpen,
  onClose,
  onEnroll,
  questionNumber
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Unlock Full PYQ Mastery Course"
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
              5 Free Questions Used • Course Upgrade
            </span>
          </div>

          <h2 className={styles.title}>
            {questionNumber ? `Question ${questionNumber} is part of the Full Course` : 'Unlock Full 10-Year JEE PYQ Mastery Course'}
          </h2>

          <p className={styles.description}>
            You have accessed the <strong>5 Free Questions</strong> in this PYQ Bank. To unlock this question along with all 500+ JEE Main &amp; Advanced questions, DK Sir YouTube video solutions, and downloadable PDF solutions, enroll in the course.
          </p>

          {/* Value Prop List */}
          <div className={styles.benefitsCard}>
            <h4 className={styles.benefitsTitle}>Everything included in the Full Course:</h4>
            <ul className={styles.benefitsList}>
              <li>
                <CheckCircle2 size={16} className={styles.bulletIcon} />
                <span><strong>500+ Chapter-wise PYQs:</strong> 10+ Years JEE Main &amp; Advanced complete archive</span>
              </li>
              <li>
                <YoutubeIcon size={16} className={styles.bulletIconYt} />
                <span><strong>Side-by-Side YouTube Solutions:</strong> DK Sir 20-30s Kota inspection shortcuts for each question</span>
              </li>
              <li>
                <FileText size={16} className={styles.bulletIconPdf} />
                <span><strong>Downloadable Solution PDFs:</strong> High-resolution step-by-step papers and formula keys</span>
              </li>
              <li>
                <CheckCircle2 size={16} className={styles.bulletIcon} />
                <span><strong>CBT Exam Simulator:</strong> Real-time timer, marking scheme, and accuracy analytics</span>
              </li>
            </ul>
          </div>

          {/* Pricing Row */}
          <div className={styles.pricingCard}>
            <div className={styles.priceLeft}>
              <span className={styles.pricingTag}>Special Aspirant Offer</span>
              <div className={styles.priceNums}>
                <span className={styles.mainPrice}>₹1,499</span>
                <span className={styles.strikePrice}>₹4,999</span>
                <span className={styles.discountBadge}>70% OFF</span>
              </div>
              <span className={styles.validityText}>Valid till JEE Advanced 2027 • Instant Access</span>
            </div>

            <div className={styles.guaranteeTag}>
              <ShieldCheck size={16} />
              <span>Instant Verification</span>
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
              <span>Unlock All Questions &amp; Enroll Now</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className={styles.continueFreeBtn}
              onClick={onClose}
            >
              Practice Free Questions (Q1 to Q5)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
