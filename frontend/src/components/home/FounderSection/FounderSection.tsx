import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Play,
  Calendar,
  Users,
  MapPin,
  Quote,
  UserCheck,
  Sparkles,
  ShieldCheck,
  Zap,
  GraduationCap
} from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { founderData } from '../../../data/founder.js';
import styles from './FounderSection.module.scss';

export interface FounderSectionProps {
  badge?: string;
  title?: string;
  subtitle?: string;
}

export const FounderSection: React.FC<FounderSectionProps> = ({ badge, title }) => {
  const [imgError, setImgError] = useState(false);

  const scrollToCallback = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById('callback');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      const nameInput = document.getElementById('callback-name');
      if (nameInput) {
        setTimeout(() => nameInput.focus(), 500);
      }
    } else {
      window.location.hash = 'callback';
    }
  };

  const hasPhoto = Boolean(founderData.photo) && !imgError;

  return (
    <section className={styles.section} id="founder" aria-labelledby="founder-heading">
      <div className={styles.ambientGlow} aria-hidden="true" />

      <Container size="wide">
        <div className={styles.twoColGrid}>
          {/* Left Column: Studio Portrait Card with Floating Glass Badges */}
          <div className={styles.mediaCol}>
            <div className={styles.portraitWrapper}>
              {/* Soft Ambient Backdrop Aura */}
              <div className={styles.ambientBackdrop} aria-hidden="true" />

              {/* Floating Badge 1: 18+ Yrs Kota Pedagogy (Top Right) */}
              <div className={styles.floatingExpBadge} aria-hidden="true">
                <Sparkles size={13} className={styles.expSparkle} />
                <span>18+ Yrs Kota Pedagogy</span>
              </div>

              {/* Floating Badge 2: 20-30s Shortcuts (Bottom Left) */}
              <div className={styles.floatingShortcutBadge} aria-hidden="true">
                <div className={styles.shortcutIconWrap}>
                  <Zap size={14} />
                </div>
                <div className={styles.shortcutText}>
                  <strong>20–30s Shortcuts</strong>
                  <span>Calculus &amp; Algebra</span>
                </div>
              </div>

              {/* Main Photo Container */}
              <div className={styles.photoFrame}>
                {hasPhoto ? (
                  <>
                    <img
                      src={founderData.photo}
                      alt={founderData.photoAlt || `${founderData.name} - ${founderData.roleBadge}`}
                      className={styles.portraitImg}
                      width={520}
                      height={650}
                      loading="lazy"
                      decoding="async"
                      onError={() => setImgError(true)}
                    />
                    <div className={styles.portraitOverlay} />
                  </>
                ) : (
                  /* Fallback placeholder */
                  <div className={styles.placeholderBox} role="img" aria-label="Founder photo placeholder">
                    <div className={styles.initialsCircle}>
                      <span className={styles.initialsText}>{founderData.initials || 'DK'}</span>
                    </div>
                    <div className={styles.replaceNotice}>
                      <UserCheck size={18} className={styles.replaceIcon} aria-hidden="true" />
                      <span className={styles.replaceTitle}>[Founder Portrait]</span>
                      <span className={styles.replaceDesc}>Photo not available</span>
                    </div>
                  </div>
                )}

                {/* Bottom Modern Mentor Glass Caption */}
                <div className={styles.mentorCaption} aria-label="Founder Role Badge">
                  <div className={styles.captionNameRow}>
                    <span className={styles.captionName}>Dharmendra Kumar</span>
                    <span className={styles.verifiedBadge} title="Verified Senior Faculty">
                      <ShieldCheck size={16} />
                    </span>
                  </div>
                  <span className={styles.captionRole}>{founderData.roleBadge}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bio, Credentials, Manifesto Quote & Key Facts */}
          <div className={styles.contentCol}>
            {/* Section Eyebrow Label */}
            <div className={styles.eyebrowWrap}>
              <div className={styles.eyebrowBadge}>
                <Sparkles size={13} className={styles.eyebrowIcon} aria-hidden="true" />
                <span>{badge || founderData.sectionLabel || 'Meet Your Mentor'}</span>
              </div>
            </div>

            {/* H2 Heading with Gradient Accent */}
            <h2 id="founder-heading" className={styles.heading}>
              {title || (
                <>
                  Dharmendra Kumar <span className={styles.headingGradient}>(DK Sir)</span>
                </>
              )}
            </h2>

            {/* Editorial Bio Paragraphs */}
            <div className={styles.bioGroup}>
              {founderData.bio.map((para, idx) => {
                const isPlaceholderPara = para.includes('[REPLACE:');
                return (
                  <p
                    key={idx}
                    className={`${styles.bioPara} ${idx === 0 ? styles.leadBioPara : ''} ${
                      isPlaceholderPara ? styles.placeholderPara : ''
                    }`}
                  >
                    {para}
                  </p>
                );
              })}
            </div>

            {/* Modern Thematic Credential Badges */}
            <div className={styles.credentialsWrap} aria-label="Mentor Credentials">
              {founderData.credentials.map((cred, idx) => {
                const isPlaceholder = cred.includes('[REPLACE:');
                const IconComp =
                  idx === 0
                    ? GraduationCap
                    : idx === 1
                    ? Calendar
                    : idx === 2
                    ? MapPin
                    : Users;

                const themeClass =
                  idx === 0
                    ? styles.chipBlue
                    : idx === 1
                    ? styles.chipPurple
                    : idx === 2
                    ? styles.chipEmerald
                    : styles.chipAmber;

                return (
                  <span
                    key={idx}
                    className={`${styles.credentialChip} ${themeClass} ${
                      isPlaceholder ? styles.placeholderChip : ''
                    }`}
                  >
                    <IconComp size={14} className={styles.chipIcon} aria-hidden="true" />
                    <span>{cred}</span>
                  </span>
                );
              })}
            </div>

            {/* Executive Quote / Teaching Manifesto Card */}
            {founderData.quote && (
              <blockquote className={styles.quoteCard}>
                <Quote size={42} className={styles.quoteWatermark} aria-hidden="true" />
                <p className={styles.quoteText}>&ldquo;{founderData.quote}&rdquo;</p>
                <cite className={styles.quoteAuthor}>— DK Sir • Founder&rsquo;s Teaching Manifesto</cite>
              </blockquote>
            )}

            {/* 3 Modern Key Milestones Cards */}
            <div className={styles.keyFactsRow} role="region" aria-label="Founder Key Milestones">
              {founderData.keyFacts.map((fact, idx) => {
                const isExp = idx === 0;
                const isStudents = idx === 1;

                const IconComp = isExp ? Calendar : isStudents ? Users : MapPin;
                const iconThemeClass = isExp
                  ? styles.iconBlue
                  : isStudents
                  ? styles.iconPurple
                  : styles.iconEmerald;

                return (
                  <div key={idx} className={styles.factCard}>
                    <div className={`${styles.factIconWrap} ${iconThemeClass}`}>
                      <IconComp size={18} aria-hidden="true" />
                    </div>
                    <div className={styles.factInfo}>
                      <div className={styles.factValue}>{fact.value}</div>
                      <div className={styles.factLabel}>{fact.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTAs Row */}
            <div className={styles.ctaRow}>
              <Link
                to={founderData.primaryCta.to}
                className={styles.primaryBtn}
                id="founder-watch-lecture-btn"
                aria-label="Watch a free lecture by DK Sir"
              >
                <Play size={16} fill="currentColor" aria-hidden="true" />
                <span>{founderData.primaryCta.label}</span>
              </Link>

              <a
                href={founderData.secondaryCta.to}
                onClick={scrollToCallback}
                className={styles.secondaryBtn}
                id="founder-book-demo-btn"
                aria-label="Book a free demo session with DK Sir"
              >
                <span>{founderData.secondaryCta.label}</span>
                <ArrowRight size={16} className={styles.btnArrow} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default FounderSection;
