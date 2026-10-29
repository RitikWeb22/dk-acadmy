import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, CheckCircle2, MapPin, ArrowRight, Award, Image as ImageIcon } from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { SectionHeading } from '../../ui/SectionHeading/SectionHeading';
import { ImageLightbox } from '../../ui/ImageLightbox/ImageLightbox';
import styles from './ResultsBannerSection.module.scss';

// 6 Top-ranked students from official records
const TOP_RANKERS = [
  {
    name: 'Rishabh Anand',
    score: '99.814 %ile',
    exam: 'JEE Mains',
    rank: 'AIR 2146 (Advanced)',
    image: '/img/IMG_5099.JPG.jpeg',
    alt: 'Rishabh Anand, 99.814 percentile in JEE Mains and AIR 2146 in JEE Advanced'
  },
  {
    name: 'Chirayu Sethia',
    score: '99.5 %ile',
    exam: 'JEE Mains',
    rank: 'AIR 6781 • BITS 292',
    image: '/img/achivers3.jpeg',
    alt: 'Chirayu Sethia, 99.5 percentile in JEE Mains and BITS Rank 292'
  },
  {
    name: 'Ashutosh Shukla',
    score: '99.44 %ile',
    exam: 'JEE Mains',
    rank: 'Top Percentile Scorer',
    image: '/img/achivers2.jpeg',
    alt: 'Ashutosh Shukla, 99.44 percentile in JEE Mains'
  },
  {
    name: 'Tejas Itankar',
    score: '98.99 %ile',
    exam: 'JEE Mains',
    rank: 'Consistent Top Performer',
    image: '/img/achivers4.jpeg',
    alt: 'Tejas Itankar, 98.99 percentile in JEE Mains'
  },
  {
    name: 'Harsh Kumar',
    score: '97.56 %ile',
    exam: 'JEE Mains',
    rank: 'AIR 10964 (Advanced)',
    image: '/img/achivers5.jpeg',
    alt: 'Harsh Kumar, 97.56 percentile in JEE Mains and AIR 10964 in JEE Advanced'
  },
  {
    name: 'Tanishq Gupta',
    score: '97.75 %ile',
    exam: 'JEE Mains',
    rank: 'Top Mathematics Scorer',
    image: '/img/achivers1.jpeg',
    alt: 'Tanishq Gupta, 97.75 percentile in JEE Mains'
  }
];

export const ResultsBannerSection: React.FC = () => {
  // Requirement 4: Default collapsed on mobile, expanded on desktop
  const [showPoster, setShowPoster] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth > 768 : true;
  });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  return (
    <section className={styles.section} id="results-banner-section" aria-labelledby="results-banner-heading">
      <Container size="wide">
        <div className={styles.headerRow}>
          <div>
            <SectionHeading
              eyebrow="Official Merit List"
              title="Our JEE Results Speak for Themselves"
              description="Verified top percentiles and ranks achieved by students mentored under DK Sir's concept-first mathematical guidance."
              align="left"
            />
          </div>

          <div className={styles.topActions}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setShowPoster(!showPoster)}
              aria-expanded={showPoster}
              aria-controls="full-results-poster"
            >
              <ImageIcon size={16} aria-hidden="true" />
              <span>{showPoster ? 'Hide Official Poster' : 'Show Official Poster'}</span>
            </button>

            <Link
              to="/results"
              className="btn-secondary"
              aria-label="View all verified student scorecards and merit ranks"
            >
              <span>View All Results ({TOP_RANKERS.length}+)</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Results Container with Headline Stats & Verified Student Grid */}
        <div className={styles.bannerContainer}>
          <div className={styles.bannerWrapper}>
            {/* Top Verified Header Bar (Sentence Case) */}
            <div className={styles.topInfoBar}>
              <div className={styles.leftPill}>
                <Trophy size={16} className={styles.trophyIcon} aria-hidden="true" />
                <span>DK Academy JEE • Verified Classroom Results</span>
              </div>
              <div className={styles.rightTag}>
                <span>AIR 2146 &amp; 99.814%ile</span>
              </div>
            </div>

            {/* (a) 3 Headline Stats */}
            <div className={styles.statsRibbon} role="region" aria-label="Key Performance Indicators">
              <div className={styles.statBox}>
                <div className={styles.statVal}>99.814%ile</div>
                <div className={styles.statLbl}>Highest JEE Main Score</div>
              </div>
              <div className={styles.statDivider} aria-hidden="true" />
              <div className={styles.statBox}>
                <div className={styles.statVal}>AIR 2146</div>
                <div className={styles.statLbl}>Top JEE Advanced Rank</div>
              </div>
              <div className={styles.statDivider} aria-hidden="true" />
              <div className={styles.statBox}>
                <div className={styles.statVal}>15+ Years</div>
                <div className={styles.statLbl}>IIT-JEE Mentorship by DK Sir</div>
              </div>
            </div>

            {/* (b) Clean Grid of Top-Rank Students as Real Semantic HTML */}
            <div className={styles.rankersGrid} role="list" aria-label="Top JEE Rankers">
              {TOP_RANKERS.map((ranker) => (
                <article key={ranker.name} className={styles.rankerCard} role="listitem">
                  <div className={styles.avatarWrap}>
                    <img
                      src={ranker.image}
                      alt={ranker.alt}
                      className={styles.rankerImg}
                      width={80}
                      height={80}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className={styles.badgeCheck} title="Verified student result" aria-label="Verified">
                      <CheckCircle2 size={14} aria-hidden="true" />
                    </span>
                  </div>
                  <div className={styles.rankerInfo}>
                    <h3 className={styles.rankerName} title={ranker.name}>{ranker.name}</h3>
                    <div className={styles.rankerScoreBadge}>
                      <Award size={13} aria-hidden="true" />
                      <span>{ranker.score}</span>
                    </div>
                    <span className={styles.rankerExam}>{ranker.rank}</span>
                  </div>
                </article>
              ))}
            </div>

            {/* Poster Showcase (Default expanded on desktop, collapsed on mobile) */}
            {showPoster && (
              <div id="full-results-poster" className={styles.posterContainer}>
                <div className={styles.posterFrame}>
                  <img
                    src="/img/dk-results-banner.jpeg"
                    alt="DK Academy JEE Top Rankers and Verified Results Banner mentored by DK Sir"
                    className={styles.bannerImg}
                    width={1600}
                    height={800}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className={styles.posterOverlay}>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setIsLightboxOpen(true)}
                      aria-label="View full size official results banner in lightbox"
                    >
                      <ImageIcon size={16} aria-hidden="true" />
                      <span>View Full Size Poster</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Fixed Information Bar */}
            <div className={styles.bottomBar}>
              <div className={styles.bottomInfoItem}>
                <CheckCircle2 size={16} className={styles.checkIcon} aria-hidden="true" />
                <span>Mentored by Dharmendra Kumar (DK Sir) — 15+ Years IIT-JEE Experience</span>
              </div>
              <div className={styles.bottomLocationItem}>
                <MapPin size={14} className={styles.mapIcon} aria-hidden="true" />
                <span>Dwarka Sector 12 &amp; Janakpuri Centers, New Delhi</span>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Lightbox for Full Size Poster Inspection */}
      <ImageLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageSrc="/img/dk-results-banner.jpeg"
        imageAlt="DK Academy JEE Top Rankers and Verified Results Banner"
        title="DK Academy JEE • Official Classroom Results"
        subtitle="Mentored by Dharmendra Kumar (DK Sir)"
      />
    </section>
  );
};

export default ResultsBannerSection;
