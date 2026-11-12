import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Home,
  FileText,
  Zap,
  ListOrdered,
  Trophy,
  Package,
  CheckCircle2,
  Users,
  TrendingUp
} from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import styles from './DPPPageHeader.module.scss';

interface DPPPageHeaderProps {
  totalSets: number;
  totalQuestions: number;
  subjectsCount: number;
  attemptedSetsCount: number;
}

export const DPPPageHeader: React.FC<DPPPageHeaderProps> = ({
  totalSets,
  totalQuestions,
  subjectsCount,
  attemptedSetsCount,
}) => {
  return (
    <header className={styles.header}>
      <Container size="wide">
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/" className={styles.breadcrumbLink}>
            <Home size={14} className={styles.homeIcon} />
            <span>Home</span>
          </Link>
          <ChevronRight size={14} className={styles.breadcrumbSeparator} />
          <span className={styles.breadcrumbCurrent} aria-current="page">
            Daily Practice Problems (DPP)
          </span>
        </nav>

        {/* Header Grid: Left Content + Right 3D Visual & Stats */}
        <div className={styles.heroGrid}>
          {/* Left Column: Eyebrow, Heading, Description, Hub Buttons */}
          <div className={styles.heroLeftCol}>
            <div className={styles.badgeRow}>
              <span className={styles.liveBadge}>
                <Trophy size={13} className={styles.trophyIcon} />
                <span>JEE Main &amp; Advanced 2025–26</span>
              </span>
            </div>

            <h1 className={styles.title}>
              Daily Practice{' '}
              <span className={styles.titleHighlight}>
                Problems
                <svg
                  className={styles.headingWave}
                  viewBox="0 0 120 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M2 8C25 2 45 10 70 4C95 -2 108 8 118 6"
                    stroke="#2563EB"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className={styles.description}>
              Consistent <strong>daily practice</strong> is the cornerstone of a top JEE rank. Solve curated, topic-wise problem sets across Physics, Chemistry, and Mathematics with instant step-by-step solutions and exam-simulation modes.
            </p>

            {/* Quick Practice Hub Switcher Tabs */}
            <div className={styles.hubTabs} role="navigation" aria-label="Practice modes">
              <Link to="/pyq" className={styles.hubTab}>
                <FileText size={15} aria-hidden="true" />
                <span>Chapter-Wise PYQs</span>
              </Link>
              <span className={`${styles.hubTab} ${styles.hubTabActive}`}>
                <Zap size={15} aria-hidden="true" />
                <span>Daily Practice Problems (DPP)</span>
              </span>
              <Link to="/test-series" className={styles.hubTab}>
                <ListOrdered size={15} aria-hidden="true" />
                <span>Full CBT Test Series</span>
              </Link>
            </div>
          </div>

          {/* Right Column: 3D Student Illustration + Floating Glass Stats Card */}
          <div className={styles.heroRightCol}>
            <div className={styles.heroVisualWrap}>
              {/* Decorative Glow Aura Backdrop */}
              <div className={styles.heroBackdropAura} aria-hidden="true" />

              {/* Target / Dartboard Motif in Background */}
              <div className={styles.dartboardTarget} aria-hidden="true">
                <div className={styles.targetRing3} />
                <div className={styles.targetRing2} />
                <div className={styles.targetRing1} />
              </div>

              {/* Practice Score Higher Script Note with Curved Arrow */}
              <div className={styles.scoreHigherNote}>
                <span>Practice</span>
                <span>Score Higher</span>
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M7 17L17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </div>

              {/* 3D Student Illustration */}
              <img
                src="/images/dpp-hero-student.png"
                alt="JEE Aspirant Practicing DPP Daily - DK Academy"
                className={styles.heroStudentImg}
              />
            </div>

            {/* Floating Glass-Style Statistics Card */}
            <div className={styles.floatingStatsCard}>
              <div className={styles.statMetric}>
                <div className={`${styles.metricIconWrap} ${styles.iconWrapBlue}`}>
                  <Package size={17} />
                </div>
                <div className={styles.metricText}>
                  <span className={styles.metricNumber}>{totalSets || 8} Sets</span>
                  <span className={styles.metricLabel}>AVAILABLE DPPs</span>
                </div>
              </div>

              <div className={styles.statDivider} aria-hidden="true" />

              <div className={styles.statMetric}>
                <div className={`${styles.metricIconWrap} ${styles.iconWrapGreen}`}>
                  <CheckCircle2 size={17} />
                </div>
                <div className={styles.metricText}>
                  <span className={styles.metricNumber}>{totalQuestions || 29}</span>
                  <span className={styles.metricLabel}>TOTAL PROBLEMS</span>
                </div>
              </div>

              <div className={styles.statDivider} aria-hidden="true" />

              <div className={styles.statMetric}>
                <div className={`${styles.metricIconWrap} ${styles.iconWrapPurple}`}>
                  <Users size={17} />
                </div>
                <div className={styles.metricText}>
                  <span className={styles.metricNumber}>{subjectsCount || 3}</span>
                  <span className={styles.metricLabel}>Subjects PCM COVERAGE</span>
                </div>
              </div>

              <div className={styles.statDivider} aria-hidden="true" />

              <div className={styles.statMetric}>
                <div className={`${styles.metricIconWrap} ${styles.iconWrapCyan}`}>
                  <TrendingUp size={17} />
                </div>
                <div className={styles.metricText}>
                  <span className={styles.metricNumber}>{attemptedSetsCount || 3}</span>
                  <span className={styles.metricLabel}>SETS PRACTICED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
};
