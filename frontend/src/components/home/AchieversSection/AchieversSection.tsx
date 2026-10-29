import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, Pause, Play } from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { AchieverCard } from './AchieverCard';
import { ACHIEVERS_LIST } from '../../../data/homepageRedesignData';
import styles from './AchieversSection.module.scss';

export interface AchieversSectionProps {
  badge?: string;
  title?: string;
  subtitle?: string;
}

export const AchieversSection: React.FC<AchieversSectionProps> = ({ badge, title, subtitle }) => {
  const [isPaused, setIsPaused] = useState(false);
  const marqueeRef = useRef<HTMLDivElement>(null);

  return (
    <section className={styles.section} id="achievers" aria-labelledby="achievers-heading">
      {/* Background ambient lighting */}
      <div className={styles.ambientGlow} aria-hidden="true" />

      <Container size="wide">
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            {/* Eyebrow Badge */}
            <div className={styles.eyebrowBadge}>
              <span className={styles.pulseDot} aria-hidden="true" />
              <Trophy size={13} className={styles.trophyIcon} aria-hidden="true" />
              <span>{badge || "ACADEMIC MILESTONES • 100% AUDITED MERIT LIST"}</span>
            </div>

            {/* Title with Gradient Accent */}
            <h2 id="achievers-heading" className={styles.sectionTitle}>
              {title ? title : (
                <>
                  Meet Our <span className={styles.titleGradient}>JEE Achievers</span>
                </>
              )}
            </h2>

            {/* Subtitle */}
            <p className={styles.sectionSubtitle}>
              {subtitle || "Verified percentiles and All-India ranks achieved under DK Sir's concept-first mathematical guidance."}
            </p>
          </div>

          {/* Top Actions: Controls + View All */}
          <div className={styles.topActions}>
            <button
              type="button"
              className={styles.marqueeToggleBtn}
              onClick={() => setIsPaused((prev) => !prev)}
              aria-label={isPaused ? "Resume auto-scroll marquee" : "Pause auto-scroll marquee"}
              title={isPaused ? "Resume auto-scroll" : "Pause auto-scroll"}
            >
              {isPaused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
              <span>{isPaused ? "Resume" : "Pause"}</span>
            </button>

            <Link
              to="/results"
              className={styles.viewAllBtn}
              aria-label="View all verified JEE results on dedicated results page"
            >
              <span>View All Results ({ACHIEVERS_LIST.length})</span>
              <ArrowRight size={15} className={styles.arrowIcon} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Container>

      {/* Auto-scrolling Continuous Marquee (Pauses on hover or toggle button) */}
      <div
        ref={marqueeRef}
        className={styles.marqueeWrapper}
        role="region"
        aria-label="Meet Our JEE Achievers auto-scroll showcase"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className={`${styles.beltTrack} ${isPaused ? styles.pausedTrack : ''}`}>
          {/* Quadruple items for infinite seamless scroll across 4k/ultra-wide screens */}
          {[...ACHIEVERS_LIST, ...ACHIEVERS_LIST, ...ACHIEVERS_LIST, ...ACHIEVERS_LIST].map((achiever, index) => (
            <div key={`${achiever.id}-${index}`} className={styles.cardItemWrap}>
              <AchieverCard achiever={achiever} />
            </div>
          ))}
        </div>
      </div>

      <Container size="wide">
        {/* View all results link on mobile */}
        <div className={styles.mobileViewAllWrap}>
          <Link
            to="/results"
            className={styles.viewAllBtn}
            style={{ width: '100%', justifyContent: 'center' }}
            aria-label="View all verified JEE results"
          >
            <span>View All Results ({ACHIEVERS_LIST.length})</span>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </Container>
    </section>
  );
};

export default AchieversSection;
