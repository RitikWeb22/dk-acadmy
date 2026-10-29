import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Award,
  BookOpen,
  User,
  Trophy,
  Sparkles,
  GraduationCap,
  ArrowRight
} from 'lucide-react';
import type { AchieverItem } from '../../../types';
import styles from './AchieversSection.module.scss';

interface AchieverCardProps {
  achiever: AchieverItem;
  onOpenLightbox?: (achiever: AchieverItem) => void;
}

export const AchieverCard: React.FC<AchieverCardProps> = ({ achiever }) => {
  const [imgError, setImgError] = useState(false);

  // Standout visual highlight for top tier rankers
  const isTopRanker =
    achiever.score.includes('99.8') ||
    achiever.score.includes('99.5') ||
    (Boolean(achiever.rankOrCollege) && /AIR\s*([1-9][0-9]{0,3}|[1-2][0-9]{3})\b/i.test(achiever.rankOrCollege || ''));

  return (
    <article
      className={`${styles.card} ${isTopRanker ? styles.topRankCard : ''}`}
      aria-label={`Achiever: ${achiever.name}`}
    >
      {/* 1. Student Photo Framing with Standardized Aspect Ratio & Overlays */}
      <div className={styles.imageFrame}>
        <div className={styles.imageInner}>
          {!imgError ? (
            <img
              src={achiever.image}
              alt={`${achiever.name} - ${achiever.score}`}
              className={styles.studentImg}
              width={320}
              height={320}
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className={styles.avatarFallback}>
              <User size={52} className={styles.fallbackIcon} aria-hidden="true" />
            </div>
          )}
          {/* Subtle bottom gradient shadow overlay for badge readability */}
          <div className={styles.imageScrim} aria-hidden="true" />
        </div>

        {/* Top Performer Ribbon / Highlight Tag */}
        {isTopRanker && (
          <div className={styles.featuredTag}>
            <Sparkles size={11} className={styles.sparkleIcon} aria-hidden="true" />
            <span>TOP RANKER</span>
          </div>
        )}

        {/* Verified Student Glass Pill */}
        {achiever.verified && (
          <div className={styles.verifiedBadge} aria-label="Verified Student">
            <CheckCircle2 size={12} className={styles.verifiedCheck} aria-hidden="true" />
            <span>Verified</span>
          </div>
        )}

        {/* Exam Tag Pill over photo bottom */}
        <div className={styles.photoExamBadge}>
          <GraduationCap size={12} className={styles.examIcon} aria-hidden="true" />
          <span>{achiever.examTag} • {achiever.year}</span>
        </div>
      </div>

      {/* 2. Card Content Body */}
      <div className={styles.cardBody}>
        {/* Student Name */}
        <div className={styles.nameRow}>
          <h3 className={styles.studentName} title={achiever.name}>
            {achiever.name}
          </h3>
          <span className={styles.ntaBadge}>NTA Audited</span>
        </div>

        {/* 3. Highlight Achievement Box (Hero Credential Proof) */}
        <div className={styles.achievementBox}>
          <div className={styles.scoreRow}>
            <div className={styles.trophyIconBox}>
              <Trophy size={16} className={styles.trophyIcon} aria-hidden="true" />
            </div>
            <div className={styles.scoreTextCol}>
              <span className={styles.scoreNumber}>{achiever.score}</span>
            </div>
          </div>

          {achiever.rankOrCollege && (
            <div className={styles.subRankBadge}>
              <Award size={13} className={styles.subRankIcon} aria-hidden="true" />
              <span className={styles.subRankText}>{achiever.rankOrCollege}</span>
            </div>
          )}
        </div>

        {/* 4. Footer: Enrolled Course / Batch & Link */}
        <div className={styles.cardFooter}>
          <div className={styles.batchInfo} title={achiever.highlightTopic}>
            <BookOpen size={13} className={styles.batchIcon} aria-hidden="true" />
            <div className={styles.batchTextWrap}>
              <span className={styles.batchLabel}>Batch:</span>
              <span className={styles.batchName}>{achiever.highlightTopic}</span>
            </div>
          </div>

          <Link
            to="/results"
            className={styles.cardResultLink}
            aria-label={`View verified scorecard for ${achiever.name}`}
          >
            <span>Verified Scorecard</span>
            <ArrowRight size={12} className={styles.linkArrow} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default AchieverCard;
