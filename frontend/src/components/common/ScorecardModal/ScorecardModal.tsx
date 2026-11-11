import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Trophy,
  Award,
  GraduationCap,
  Calendar,
  BookOpen,
  MapPin,
  Printer,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AchieverItem } from '../../../types';
import styles from './ScorecardModal.module.scss';

export interface ScorecardModalProps {
  achiever: AchieverItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ScorecardModal: React.FC<ScorecardModalProps> = ({
  achiever,
  isOpen,
  onClose
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !achiever) return null;

  const handlePrint = () => {
    window.print();
  };

  const getAdvRank = (rankOrCollege?: string) => {
    if (!rankOrCollege) return null;
    const match = rankOrCollege.match(/AIR\s*([0-9]+)/i);
    return match ? `AIR ${match[1]}` : null;
  };

  const getBitsatRank = (rankOrCollege?: string) => {
    if (!rankOrCollege) return null;
    const match = rankOrCollege.match(/BITSAT\s*Rank\s*([0-9]+)/i) || rankOrCollege.match(/BITS\s*Rank\s*([0-9]+)/i);
    return match ? `Rank ${match[1]}` : null;
  };

  const advRank = getAdvRank(achiever.rankOrCollege);
  const bitsatRank = getBitsatRank(achiever.rankOrCollege);

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scorecard-title"
    >
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Certificate Top Border Ribbon */}
        <div className={styles.topRibbon} />

        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerBadge}>
              <ShieldCheck size={14} className={styles.shieldIcon} aria-hidden="true" />
              <span>ACADEMIC MILESTONES • 100% AUDITED MERIT LIST</span>
            </div>
            <h2 id="scorecard-title" className={styles.headerTitle}>
              Official Verified Scorecard &amp; Selection Dossier
            </h2>
            <p className={styles.headerSubtitle}>
              DK Academy JEE &amp; BITSAT Mentorship Registry • Dwarka &amp; Janakpuri, New Delhi
            </p>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close scorecard modal"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Certificate Body */}
        <div className={styles.body}>
          {/* Left Column: Passport Photo & Student Bio */}
          <div className={styles.leftCol}>
            <div className={styles.passportPhotoFrame}>
              <img
                src={achiever.image}
                alt={`${achiever.name} Passport Photograph`}
                className={styles.passportImg}
                loading="eager"
              />
              <div className={styles.photoSealTag}>
                <CheckCircle2 size={11} aria-hidden="true" />
                <span>NTA AUDITED PHOTO</span>
              </div>
            </div>

            <div className={styles.studentBioBox}>
              <h3 className={styles.studentName}>{achiever.name}</h3>
              <div className={styles.programBadge}>
                <BookOpen size={12} aria-hidden="true" />
                <span>2 Year Classroom Program</span>
              </div>
              <div className={styles.centerBadge}>
                <MapPin size={12} aria-hidden="true" />
                <span>Dwarka Sector 12, New Delhi</span>
              </div>
            </div>

            <div className={styles.auditedAffidavitBox}>
              <div className={styles.affidavitRow}>
                <ShieldCheck size={15} className={styles.affidavitIcon} />
                <div>
                  <strong>Official Scorecard On File</strong>
                  <p>100% verified NTA / IIT merit record. No mock or unverified rankings.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Performance Breakdown Ledger */}
          <div className={styles.rightCol}>
            <div className={styles.ledgerHeader}>
              <Trophy size={18} className={styles.trophyIcon} />
              <span>Examination Performance Summary</span>
            </div>

            <div className={styles.metricsGrid}>
              {/* JEE Mains Score Card */}
              <div className={styles.metricCard}>
                <div className={styles.metricLabelRow}>
                  <span className={styles.metricLabel}>JEE MAIN PERCENTILE</span>
                  <span className={styles.examYearBadge}>{achiever.year}</span>
                </div>
                <div className={styles.metricValueRow}>
                  <strong className={styles.metricValue}>{achiever.score.replace(' in JEE Mains', '')}</strong>
                </div>
                <div className={styles.metricFooter}>
                  <CheckCircle2 size={12} className={styles.checkIcon} />
                  <span>National Testing Agency (NTA) Confirmed</span>
                </div>
              </div>

              {/* JEE Advanced AIR if applicable */}
              {advRank && (
                <div className={`${styles.metricCard} ${styles.metricCardAdv}`}>
                  <div className={styles.metricLabelRow}>
                    <span className={styles.metricLabel}>JEE ADVANCED ALL-INDIA RANK</span>
                    <span className={styles.examYearBadge}>IIT JEE</span>
                  </div>
                  <div className={styles.metricValueRow}>
                    <strong className={styles.metricValue}>{advRank}</strong>
                  </div>
                  <div className={styles.metricFooter}>
                    <Award size={12} className={styles.checkIcon} />
                    <span>IIT Advanced Qualified Merit Rank</span>
                  </div>
                </div>
              )}

              {/* BITSAT Rank if applicable */}
              {bitsatRank && (
                <div className={`${styles.metricCard} ${styles.metricCardBitsat}`}>
                  <div className={styles.metricLabelRow}>
                    <span className={styles.metricLabel}>BITSAT ALL-INDIA RANK</span>
                    <span className={styles.examYearBadge}>BITS Pilani</span>
                  </div>
                  <div className={styles.metricValueRow}>
                    <strong className={styles.metricValue}>{bitsatRank}</strong>
                  </div>
                  <div className={styles.metricFooter}>
                    <Award size={12} className={styles.checkIcon} />
                    <span>BITS Pilani Speed &amp; Accuracy Merit</span>
                  </div>
                </div>
              )}
            </div>

            {/* Program & Pedagogy Ledger */}
            <div className={styles.programDetailsBox}>
              <div className={styles.programDetailItem}>
                <span className={styles.detailKey}>Curriculum &amp; Batch:</span>
                <span className={styles.detailVal}>2 Year Classroom Program (Class 11 &amp; 12)</span>
              </div>
              <div className={styles.programDetailItem}>
                <span className={styles.detailKey}>Faculty Mentor:</span>
                <span className={styles.detailVal}>DK Sir (IIT-JEE Mathematics Expert)</span>
              </div>
              <div className={styles.programDetailItem}>
                <span className={styles.detailKey}>Passing Session:</span>
                <span className={styles.detailVal}>{achiever.year}</span>
              </div>
              <div className={styles.programDetailItem}>
                <span className={styles.detailKey}>Key Focus:</span>
                <span className={styles.detailVal}>Concept-first derivations &amp; 20–30s Kota inspection shortcuts</span>
              </div>
              <div className={styles.programDetailItem}>
                <span className={styles.detailKey}>Registry Status:</span>
                <span className={styles.detailValVerified}>
                  <CheckCircle2 size={13} inline-block /> 100% Genuine &amp; Non-Duplicated Record
                </span>
              </div>
            </div>

            {/* Mentor Testimony Snippet */}
            {achiever.storySnippet && (
              <div className={styles.quoteBox}>
                <p>&ldquo;{achiever.storySnippet}&rdquo;</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className={styles.footer}>
          <div className={styles.footerAuditId}>
            <span>Record ID: <code>DKA-VERIFIED-{achiever.id.replace('ach-', '').toUpperCase()}-{achiever.year}</code></span>
          </div>

          <div className={styles.footerActions}>
            <button
              type="button"
              onClick={handlePrint}
              className={styles.printBtn}
              title="Print official scorecard dossier"
            >
              <Printer size={15} />
              <span>Print Scorecard</span>
            </button>

            <Link
              to="/courses"
              className={styles.ctaBtn}
              onClick={onClose}
            >
              <span>Explore 2 Year Classroom Program</span>
              <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ScorecardModal;

