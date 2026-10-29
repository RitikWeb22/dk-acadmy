import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home, BookOpen, Layers, CheckCircle2, Clock, FileText, Zap, ListOrdered } from 'lucide-react';
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
      <Container>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/" className={styles.breadcrumbLink}>
            <Home size={14} />
            <span>Home</span>
          </Link>
          <ChevronRight size={14} className={styles.breadcrumbSeparator} />
          <span className={styles.breadcrumbCurrent} aria-current="page">
            Daily Practice Problems (DPP)
          </span>
        </nav>

        {/* Header Content */}
        <div className={styles.headerContent}>
          <div className={styles.textContent}>
            <div className={styles.badgeRow}>
              <span className={styles.liveBadge}>
                <span className={styles.pulseDot} />
                JEE Main & Advanced 2025–26
              </span>
            </div>
            <h1 className={styles.title}>Daily Practice Problems</h1>
            <p className={styles.description}>
              Consistent daily practice is the cornerstone of a top JEE rank. Solve curated, topic-wise problem sets across Physics, Chemistry, and Mathematics with instant step-by-step solutions and exam-simulation modes.
            </p>

            {/* Quick Practice Hub Switcher */}
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

          {/* Quick Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIconWrap}>
                <BookOpen size={18} className={styles.statIcon} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{totalSets} Sets</span>
                <span className={styles.statLabel}>Available DPPs</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconWrap}>
                <Layers size={18} className={styles.statIcon} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{totalQuestions}</span>
                <span className={styles.statLabel}>Total Problems</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconWrap}>
                <Clock size={18} className={styles.statIcon} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{subjectsCount} Subjects</span>
                <span className={styles.statLabel}>PCM Coverage</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconWrap}>
                <CheckCircle2 size={18} className={styles.statIcon} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{attemptedSetsCount}</span>
                <span className={styles.statLabel}>Sets Practiced</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
};
