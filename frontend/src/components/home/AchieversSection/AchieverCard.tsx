import React, { useState } from 'react';
import {
  Trophy,
  GraduationCap,
  FileText,
  Award,
  Star,
  User,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import type { AchieverData } from '../../../services/achieverService';
import styles from './AchieversSection.module.scss';

export interface AchieverCardProps {
  achiever: AchieverData;
  isAdmin?: boolean;
  onEdit?: (achiever: AchieverData) => void;
  onDelete?: (id: string) => void;
}

export const AchieverCard: React.FC<AchieverCardProps> = ({
  achiever,
  isAdmin = false,
  onEdit,
  onDelete
}) => {
  const [imgError, setImgError] = useState(false);

  // Parse JEE Mains percentage
  const mainsScore = achiever.jeeMainsScore || achiever.score || '';
  const cleanMainsScore = mainsScore.replace(/^JEE MAINS:\s*/i, '').trim();

  // Advanced or BITSAT rank
  const advRank = achiever.advRank?.trim();
  const bitsatRank = achiever.bitsatRank?.trim();

  return (
    <article
      className={styles.card}
      aria-label={`Student Achievement Record: ${achiever.name}`}
    >
      {/* ─── 1. TOP PERFORMER Trophy Badge (Top-Left Corner Ribbon) ─── */}
      <div className={styles.topPerformerBadge}>
        <div className={styles.badgeGoldGlow} />
        <div className={styles.badgeContent}>
          <div className={styles.trophyIconWrap}>
            <Trophy size={13} className={styles.goldTrophyIcon} aria-hidden="true" />
          </div>
          <div className={styles.badgeTextLines}>
            <span className={styles.badgeLineTop}>TOP</span>
            <span className={styles.badgeLineBottom}>PERFORMER</span>
          </div>
        </div>
      </div>

      {/* ─── Admin Quick Action Controls (If enabled) ─── */}
      {isAdmin && (
        <div className={styles.cardAdminControls}>
          {onEdit && (
            <button
              type="button"
              className={styles.adminEditBtn}
              onClick={() => onEdit(achiever)}
              title="Edit Student Record"
              aria-label={`Edit ${achiever.name}`}
            >
              <Edit2 size={13} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className={styles.adminDeleteBtn}
              onClick={() => onDelete(achiever.id)}
              title="Delete Student Record"
              aria-label={`Delete ${achiever.name}`}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}

      {/* ─── 2. Student Portrait with Golden Laurel Wreath Background ─── */}
      <div className={styles.portraitWrapper}>
        {/* Ambient Aura Background Behind Head */}
        <div className={styles.portraitAura} aria-hidden="true" />

        {/* Golden Laurel Wreath SVG Vector Behind Head/Shoulders */}
        <svg
          className={styles.laurelWreathSvg}
          viewBox="0 0 400 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Left Branch Leaves */}
          <g className={styles.laurelLeftBranch} opacity="0.9">
            <path
              d="M100 240 C110 200, 125 150, 160 110"
              stroke="url(#goldGradientBranch)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path d="M96 230 C90 220 85 205 92 195 C98 205 104 215 102 225 Z" fill="url(#goldGradientLeaf)" />
            <path d="M108 205 C100 195 98 180 108 172 C113 182 116 193 114 202 Z" fill="url(#goldGradientLeaf)" />
            <path d="M120 178 C112 166 112 152 124 145 C128 156 128 168 124 176 Z" fill="url(#goldGradientLeaf)" />
            <path d="M135 152 C128 140 130 126 142 120 C145 132 143 144 138 150 Z" fill="url(#goldGradientLeaf)" />
            <path d="M152 128 C146 116 150 102 163 98 C164 110 160 122 154 126 Z" fill="url(#goldGradientLeaf)" />
            <path d="M172 108 C168 96 174 84 186 82 C186 94 180 104 174 107 Z" fill="url(#goldGradientLeaf)" />
          </g>

          {/* Right Branch Leaves */}
          <g className={styles.laurelRightBranch} opacity="0.9">
            <path
              d="M300 240 C290 200, 275 150, 240 110"
              stroke="url(#goldGradientBranch)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path d="M304 230 C310 220 315 205 308 195 C302 205 296 215 298 225 Z" fill="url(#goldGradientLeaf)" />
            <path d="M292 205 C300 195 302 180 292 172 C287 182 284 193 286 202 Z" fill="url(#goldGradientLeaf)" />
            <path d="M280 178 C288 166 288 152 276 145 C272 156 272 168 276 176 Z" fill="url(#goldGradientLeaf)" />
            <path d="M265 152 C272 140 270 126 258 120 C255 132 257 144 262 150 Z" fill="url(#goldGradientLeaf)" />
            <path d="M248 128 C254 116 250 102 237 98 C236 110 240 122 246 126 Z" fill="url(#goldGradientLeaf)" />
            <path d="M228 108 C232 96 226 84 214 82 C214 94 220 104 226 107 Z" fill="url(#goldGradientLeaf)" />
          </g>

          {/* Golden Gradients */}
          <defs>
            <linearGradient id="goldGradientBranch" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ca8a04" />
              <stop offset="50%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#d4af37" />
            </linearGradient>
            <linearGradient id="goldGradientLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="60%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
          </defs>
        </svg>

        {/* Student Photograph with True Passport Proportions & Full Visibility */}
        <div className={styles.imageContainer}>
          <div className={styles.passportFrame}>
            {!imgError && achiever.image ? (
              <img
                src={achiever.image}
                alt={`${achiever.name} - ${cleanMainsScore}`}
                className={styles.studentImg}
                loading="lazy"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className={styles.fallbackAvatar}>
                <User size={48} className={styles.fallbackIcon} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 3. Student Nameplate (Deep Navy Chamfered Polygon with Gold Trim) ─── */}
      <div className={styles.nameplateWrapper}>
        <div className={styles.nameplateShape}>
          <div className={styles.nameplateGoldBorder} />
          <div className={styles.nameplateInner}>
            <h3 className={styles.studentName} title={achiever.name}>
              {achiever.name.toUpperCase()}
            </h3>
            <div className={styles.yearRow}>
              <span className={styles.yearDividerLine} />
              <span className={styles.yearText}>{achiever.year || '2023'}</span>
              <span className={styles.yearDividerLine} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. Batch & Course Information Pill ─── */}
      <div className={styles.batchPillWrap}>
        <div className={styles.batchPill} title={achiever.highlightTopic}>
          <GraduationCap size={13} className={styles.batchGradIcon} aria-hidden="true" />
          <span className={styles.batchPillText}>
            {achiever.highlightTopic?.toUpperCase().startsWith('BATCH')
              ? achiever.highlightTopic
              : `BATCH- ${achiever.highlightTopic || '2 Year Classroom Program'}`}
          </span>
        </div>
      </div>

      {/* ─── 5. Unified & Structured Scorecards (JEE, ADV, BITSAT - All Visible) ─── */}
      <div className={styles.scorecardsContainer}>
        {/* Metric 1: JEE MAINS */}
        <div className={styles.metricStripMains}>
          <div className={styles.metricStripLeft}>
            <div className={styles.metricIconWrapMains}>
              <FileText size={11} className={styles.metricIconMains} aria-hidden="true" />
            </div>
            <span className={styles.metricLabelMains}>JEE MAINS</span>
          </div>
          <strong className={styles.metricValueMains}>
            {cleanMainsScore || '99.5%ILE'}
          </strong>
        </div>

        {/* Metric 2: JEE ADVANCED (If present) */}
        {advRank && (
          <div className={styles.metricStripAdv}>
            <div className={styles.metricStripLeft}>
              <div className={styles.metricIconWrapAdv}>
                <Award size={11} className={styles.metricIconAdv} aria-hidden="true" />
              </div>
              <span className={styles.metricLabelAdv}>ADV RANK</span>
            </div>
            <strong className={styles.metricValueAdv}>
              {advRank}
            </strong>
          </div>
        )}

        {/* Metric 3: BITSAT RANK (If present, e.g. Chirayu Sethia) */}
        {bitsatRank && (
          <div className={styles.metricStripBitsat}>
            <div className={styles.metricStripLeft}>
              <div className={styles.metricIconWrapBitsat}>
                <Trophy size={11} className={styles.metricIconBitsat} aria-hidden="true" />
              </div>
              <span className={styles.metricLabelBitsat}>BITSAT RANK</span>
            </div>
            <strong className={styles.metricValueBitsat}>
              {bitsatRank.replace(/^BITSAT\s*RANK:\s*/i, '')}
            </strong>
          </div>
        )}

        {/* Fallback Merit Strip for students without Adv or BITSAT (keeps all cards equal height) */}
        {!advRank && !bitsatRank && (
          <div className={styles.metricStripMerit}>
            <div className={styles.metricStripLeft}>
              <div className={styles.metricIconWrapMerit}>
                <Sparkles size={11} className={styles.metricIconMerit} aria-hidden="true" />
              </div>
              <span className={styles.metricLabelMerit}>MERIT</span>
            </div>
            <strong className={styles.metricValueMerit}>
              TOP 0.1% CLUB
            </strong>
          </div>
        )}
      </div>

      {/* ─── 6. Signature Bottom Wave with Center Gold Star ─── */}
      <div className={styles.cardFooterWave} aria-hidden="true">
        <svg
          className={styles.waveSvg}
          viewBox="0 0 360 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Gold Trim Stroke */}
          <path
            d="M0 20 C90 38, 270 2, 360 20 L360 22 C270 4, 90 40, 0 22 Z"
            fill="url(#footerGoldGrad)"
          />
          {/* Deep Navy Symmetrical Body */}
          <path
            d="M0 22 C90 40, 270 4, 360 22 L360 48 L0 48 Z"
            fill="url(#footerNavyGrad)"
          />
          <defs>
            <linearGradient id="footerGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ca8a04" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="75%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
            <linearGradient id="footerNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#091b42" />
              <stop offset="100%" stopColor="#051029" />
            </linearGradient>
          </defs>
        </svg>

        {/* Centered Golden Star & Divider Line */}
        <div className={styles.footerStarRow}>
          <span className={styles.starDividerLine} />
          <Star size={11} className={styles.footerGoldStar} fill="#eab308" strokeWidth={1} />
          <span className={styles.starDividerLine} />
        </div>
      </div>
    </article>
  );
};

export default AchieverCard;
