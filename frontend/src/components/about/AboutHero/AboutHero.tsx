import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Home,
  Play,
  ArrowRight,
  Sparkles,
  Trophy,
  Clock,
  GraduationCap,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import styles from './AboutHero.module.scss';

export const AboutHero: React.FC = () => {
  return (
    <section className={styles.heroSection}>
      <Container>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/" className={styles.breadcrumbLink}>
            <Home size={14} aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight size={14} className={styles.breadcrumbSeparator} aria-hidden="true" />
          <span className={styles.breadcrumbCurrent} aria-current="page">
            About Us &amp; Academic Approach
          </span>
        </nav>

        {/* Hero Content Grid */}
        <div className={styles.heroGrid}>
          {/* Left Column (Text & Value Proposition) */}
          <div className={styles.textContent}>
            <div className={styles.badgeRow}>
              <span className={styles.pedagogyBadge}>
                <Sparkles size={14} className={styles.badgeIcon} aria-hidden="true" />
                <span>DK Sir&apos;s Pedagogy &amp; Story</span>
              </span>
            </div>

            <h1 className={styles.title}>
              Empowering JEE Aspirants with{' '}
              <span className={styles.titleHighlight}>Conceptual Depth &amp; 20s Speed Mastery</span>
            </h1>

            <p className={styles.leadParagraph}>
              DK Academy JEE is a dedicated learning platform engineered to make IIT JEE Mathematics intuitive,
              structured, and scoring. Founded on the principle that true problem-solving mastery comes from
              crystal-clear fundamentals coupled with trademarked <strong>20s speed algorithms</strong>, we equip
              aspirants with 760+ chapter-wise PYQ dissections and Kota classroom mentorship.
            </p>

            <div className={styles.trustStrip}>
              <div className={styles.trustItem}>
                <CheckCircle2 size={16} className={styles.trustCheck} aria-hidden="true" />
                <span>Zero Rote Memorization</span>
              </div>
              <div className={styles.trustItem}>
                <CheckCircle2 size={16} className={styles.trustCheck} aria-hidden="true" />
                <span>15-Year NTA Question Bank</span>
              </div>
              <div className={styles.trustItem}>
                <CheckCircle2 size={16} className={styles.trustCheck} aria-hidden="true" />
                <span>Small Batch (Max 30)</span>
              </div>
            </div>

            {/* Primary & Secondary CTAs */}
            <div className={styles.actionRow}>
              <a href="/#callback" className={styles.primaryBtn}>
                <span>Join Classroom Program</span>
                <ArrowRight size={16} aria-hidden="true" />
              </a>

              <Link to="/free-lectures" className={styles.secondaryBtn}>
                <Play size={16} aria-hidden="true" />
                <span>Explore YouTube Lectures</span>
              </Link>
            </div>
          </div>

          {/* Right Column (Key Milestones Grid: 2x2 Bento Grid) */}
          <div className={styles.bentoWrapper} aria-label="Key Academic Milestones">
            <div className={styles.bentoGrid}>
              {/* Tile 1: Success Rate */}
              <div className={`${styles.bentoCard} ${styles.bentoCardAmber}`}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.iconWrap} ${styles.iconAmber}`}>
                    <Trophy size={20} aria-hidden="true" />
                  </div>
                  <span className={styles.miniTag}>Proven Results</span>
                </div>
                <div className={styles.metricRow}>
                  <span className={styles.metricNumber}>98%</span>
                </div>
                <h4 className={styles.metricLabel}>Success Rate</h4>
                <p className={styles.metricSub}>In JEE Main Qualification</p>
              </div>

              {/* Tile 2: Curated Content */}
              <div className={`${styles.bentoCard} ${styles.bentoCardBlue}`}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.iconWrap} ${styles.iconBlue}`}>
                    <Clock size={20} aria-hidden="true" />
                  </div>
                  <span className={styles.miniTag}>Open Vault</span>
                </div>
                <div className={styles.metricRow}>
                  <span className={styles.metricNumber}>1000+ Hrs</span>
                </div>
                <h4 className={styles.metricLabel}>Curated Content</h4>
                <p className={styles.metricSub}>760+ Recorded Lectures</p>
              </div>

              {/* Tile 3: IITian Alumni */}
              <div className={`${styles.bentoCard} ${styles.bentoCardEmerald}`}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.iconWrap} ${styles.iconEmerald}`}>
                    <GraduationCap size={20} aria-hidden="true" />
                  </div>
                  <span className={styles.miniTag}>Kota Legacy</span>
                </div>
                <div className={styles.metricRow}>
                  <span className={styles.metricNumber}>450+</span>
                </div>
                <h4 className={styles.metricLabel}>IITian Alumni</h4>
                <p className={styles.metricSub}>Mentored into Top IITs</p>
              </div>

              {/* Tile 4: Speed Inspection */}
              <div className={`${styles.bentoCard} ${styles.bentoCardPurple}`}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.iconWrap} ${styles.iconPurple}`}>
                    <Zap size={20} aria-hidden="true" />
                  </div>
                  <span className={styles.miniTag}>Proprietary</span>
                </div>
                <div className={styles.metricRow}>
                  <span className={styles.metricNumber}>20s Speed</span>
                </div>
                <h4 className={styles.metricLabel}>Inspection Shortcuts</h4>
                <p className={styles.metricSub}>Zero Calculation Error</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default AboutHero;

