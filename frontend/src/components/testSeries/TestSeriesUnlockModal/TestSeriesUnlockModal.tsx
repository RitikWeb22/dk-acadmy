import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, CheckCircle2, Sparkles, FileText, ArrowRight, ShieldCheck, Video, Clock, Award } from 'lucide-react';
import type { TestSeriesItem } from '../../../types';
import { offerService } from '../../../services/offerService';
import styles from './TestSeriesUnlockModal.module.scss';

interface TestSeriesUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayAndUnlock: () => void;
  test: TestSeriesItem | null;
  isProcessing?: boolean;
}

export const TestSeriesUnlockModal: React.FC<TestSeriesUnlockModalProps> = ({
  isOpen,
  onClose,
  onPayAndUnlock,
  test,
  isProcessing = false
}) => {
  const rawPrice = test?.price ? Number(test.price) : 299;
  const effectiveOffer = useMemo(() => {
    return offerService.getEffectiveItemOffer(test?.id, 'test-series', rawPrice);
  }, [test?.id, rawPrice]);

  if (!isOpen || !test || typeof document === 'undefined') return null;

  const price = effectiveOffer.hasOffer ? effectiveOffer.discountedPrice : rawPrice;

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Unlock CBT Mock Test"
    >
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        {/* Top Header Row with Close */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.lockBadge}>
              <Lock size={20} className={styles.lockIcon} />
            </div>
            <div>
              <span className={styles.planBadge}>
                <Sparkles size={11} />
                {test.badgeCode || test.format || 'All India CBT Mock'}
              </span>
              <h3 className={styles.title}>{test.title}</h3>
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
            {test.subtitle || 'Complete simulated examination environment strictly compliant with the latest NTA testing guidelines and interface.'}
          </p>

          {/* Test Meta Stats */}
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Duration</span>
              <span className={styles.metaVal}>{test.durationMinutes || 180} Mins</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Questions</span>
              <span className={styles.metaVal}>{test.questions?.length || test.totalQuestions || 25} Qs</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Max Marks</span>
              <span className={styles.metaVal}>{test.totalMarks || 300} Marks</span>
            </div>
          </div>

          {/* Compact Feature Grid */}
          <div className={styles.featuresGrid}>
            <div className={styles.featureItem}>
              <CheckCircle2 size={13} className={styles.featureCheck} />
              <span>Full CBT Screen with Palette</span>
            </div>
            <div className={styles.featureItem}>
              <Award size={13} className={styles.featureVideo} />
              <span>All India Rank & Percentile</span>
            </div>
            <div className={styles.featureItem}>
              <Video size={13} className={styles.featureVideo} />
              <span>DK Sir Video Solutions</span>
            </div>
            <div className={styles.featureItem}>
              <FileText size={13} className={styles.featurePdf} />
              <span>Step Solution & KaTeX Derivations</span>
            </div>
          </div>

          {/* Pricing Row */}
          <div className={styles.pricingCard}>
            <div className={styles.priceLeft}>
              <span className={styles.pricingTag}>
                Examination Access Fee
                {effectiveOffer.hasOffer && (
                  <span style={{ marginLeft: '8px', color: '#dc2626', fontWeight: 700 }}>
                    ({effectiveOffer.badgeText})
                  </span>
                )}
              </span>
              <div className={styles.priceNums}>
                {effectiveOffer.hasOffer && (
                  <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '1rem', marginRight: '6px' }}>
                    ₹{rawPrice}
                  </span>
                )}
                <span className={styles.mainPrice}>₹{price}</span>
                <span className={styles.validityText}>• Lifetime Retakes & Solutions</span>
              </div>
            </div>
            <div className={styles.guaranteeTag}>
              <ShieldCheck size={13} />
              <span>Instant Activation</span>
            </div>
          </div>

          {/* Pay Button */}
          <button
            type="button"
            className={styles.actionBtn}
            disabled={isProcessing}
            onClick={onPayAndUnlock}
          >
            <Lock size={16} />
            <span>
              {isProcessing
                ? 'Processing Payment...'
                : `Pay ₹${price} & Unlock Test Now ${effectiveOffer.hasOffer ? `(${effectiveOffer.badgeText})` : ''}`}
            </span>
            <ArrowRight size={16} />
          </button>

          <p className={styles.securityNote}>
            <ShieldCheck size={14} color="#10b981" />
            <span>Guaranteed Secure Razorpay 256-bit encrypted checkout. Login mandatory.</span>
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

