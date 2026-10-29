import React from 'react';
import { Star, CheckCircle2, Quote, Sparkles, Trophy, Award } from 'lucide-react';
import { Container } from '../ui/Container/Container';
import { SectionHeading } from '../ui/SectionHeading/SectionHeading';
import { TESTIMONIALS_DATA } from '../../data/homepageData';
import type { Testimonial } from '../../types';
import styles from './TestimonialsSection.module.scss';

export const TestimonialsSection: React.FC = () => {

  // Duplicate for seamless infinite marquee loop
  const marqueeRow1: Testimonial[] = [...TESTIMONIALS_DATA, ...TESTIMONIALS_DATA];
  const marqueeRow2: Testimonial[] = [
    ...TESTIMONIALS_DATA.slice().reverse(),
    ...TESTIMONIALS_DATA.slice().reverse(),
  ];

  const renderCard = (item: Testimonial, keyIndex: number) => (
    <article key={`${item.id}-${keyIndex}`} className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.userMeta}>
          <div className={styles.avatarWrap}>
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className={styles.avatarImg}
                loading="lazy"
                onError={(e) => {
                  // Fallback to text initials if image fails
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={styles.avatarFallback}
              style={{ display: item.image ? 'none' : 'flex' }}
            >
              {item.avatarText}
            </div>
          </div>
          <div className={styles.userInfo}>
            <div className={styles.nameRow}>
              <h3 className={styles.userName}>{item.name}</h3>
              {item.verified && (
                <span title="Verified Student" style={{ display: 'inline-flex' }}>
                  <CheckCircle2 size={16} className={styles.verifiedIcon} />
                </span>
              )}
            </div>
            <p className={styles.userRole}>{item.rankOrCollege}</p>
          </div>
        </div>
        <span className={styles.scoreTag}>{item.score}</span>
      </div>

      <div className={styles.ratingRow}>
        {Array.from({ length: item.rating }).map((_, i) => (
          <Star key={i} size={15} className={styles.starFilled} fill="currentColor" />
        ))}
      </div>

      <blockquote className={styles.quote}>
        <Quote size={20} className={styles.quoteIcon} />
        <p>"{item.quote}"</p>
      </blockquote>

      <div className={styles.cardFooter}>
        <span className={styles.topicBadge}>
          Focus: <strong>{item.highlightTopic}</strong>
        </span>
        <span className={styles.examTag}>{item.examTag}</span>
      </div>
    </article>
  );

  return (
    <section className={styles.section} id="testimonials" aria-labelledby="testimonials-heading">
      <Container size="wide">
        {/* Top Mascot Banner */}
        <div className={styles.mascotBanner}>
          <div className={styles.mascotContent}>
            <div className={styles.badgeRow}>
              <span className={styles.badge}>
                <Sparkles size={14} className={styles.sparkleIcon} />
                Real Stories • Real Scores
              </span>
              <span className={styles.subBadge}>
                <Trophy size={14} /> 99.85 %ile Top Score
              </span>
            </div>
            <h2 className={styles.mascotTitle}>
              Math Confidence That Translates Into <span className={styles.highlightText}>IIT Ranks</span>
            </h2>
            <p className={styles.mascotDesc}>
              From defeating calculus phobia with the 112-video LCD playlist to mastering 30-second definite integration shortcuts — hear straight from our students who made it to their dream engineering institutes.
            </p>

            <div className={styles.statsStrip}>
              <div className={styles.statMini}>
                <span className={styles.statNum}>760+</span>
                <span className={styles.statLabel}>Free Video Lectures</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statMini}>
                <span className={styles.statNum}>99.4%</span>
                <span className={styles.statLabel}>Avg Math Improvement</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statMini}>
                <span className={styles.statNum}>100%</span>
                <span className={styles.statLabel}>Verified Feedback</span>
              </div>
            </div>
          </div>

          <div className={styles.mascotVisual}>
            <div className={styles.mascotGlow} />
            <div className={styles.pedestalGlow} />
            <img
              src="/images/mascot-success.png"
              alt="DK Academy Celebrating Student Mascot"
              className={styles.mascotImg}
              loading="lazy"
            />
            <div className={styles.floatingTagTop}>
              <Award size={16} className={styles.tagIcon} />
              <span>100% in Math Boards & 99.85%ile JEE</span>
            </div>
            <div className={styles.floatingTagBottom}>
              <span className={styles.starCluster}>★★★★★</span>
              <span>4.9 / 5.0 Rating</span>
            </div>
          </div>
        </div>

        {/* Section Heading */}
        <div className={styles.headerRow}>
          <SectionHeading
            eyebrow="Student Feedback Wall"
            title="Real Voices from the DK Academy Community"
            description="Hover with your mouse over any testimonial card to pause the marquee and read their complete preparation experience."
            align="left"
            className={styles.heading}
          />
        </div>
      </Container>

      {/* Full-width Tilted Marquee Stage */}
      <div className={styles.tiltedStage} aria-label="Student feedback moving cards">
        {/* Row 1: Leftward Scroll */}
        <div className={styles.marqueeTrackRow}>
          <div className={`${styles.marqueeTrack} ${styles.trackLeft}`}>
            {marqueeRow1.map((item, idx) => renderCard(item, idx))}
          </div>
        </div>

        {/* Row 2: Rightward Scroll */}
        <div className={styles.marqueeTrackRow}>
          <div className={`${styles.marqueeTrack} ${styles.trackRight}`}>
            {marqueeRow2.map((item, idx) => renderCard(item, idx))}
          </div>
        </div>
      </div>
    </section>
  );
};
