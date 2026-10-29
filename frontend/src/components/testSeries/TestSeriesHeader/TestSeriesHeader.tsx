import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home, Award, Clock, FileCheck, CheckCircle2, Flame, Layers } from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import styles from './TestSeriesHeader.module.scss';

interface TestSeriesHeaderProps {
  totalTests: number;
  totalQuestions: number;
  availableExamsCount: number;
  attemptedTestsCount: number;
}

export const TestSeriesHeader: React.FC<TestSeriesHeaderProps> = ({
  totalTests,
  totalQuestions,
  availableExamsCount,
  attemptedTestsCount,
}) => {
  return (
    <header className={styles.header}>
      <Container>
        {/* Breadcrumb Navigation */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/" className={styles.breadcrumbLink}>
            <Home size={14} aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight size={14} className={styles.breadcrumbSeparator} aria-hidden="true" />
          <span className={styles.breadcrumbCurrent} aria-current="page">
            Test Series
          </span>
        </nav>

        {/* Content Heading */}
        <div className={styles.headerHero}>
          <div className={styles.titleWrapper}>
            <h1 className={styles.title}>JEE CBT Test Series Dashboard</h1>
            <span className={styles.patternPill}>NTA Pattern 2025–26</span>
          </div>
          <p className={styles.description}>
            Experience authentic exam conditions with timed full-length and chapter-wise mock tests for JEE Main and JEE Advanced. Built with real countdown timers, negative marking schemes, instant question palettes, and comprehensive post-test analysis.
          </p>
        </div>

        {/* 4 Bento-style Summary Tiles with Matching Accent Icon Badges */}
        <div className={styles.bentoGrid} role="region" aria-label="Test series overview metrics">
          {/* Tile 1: 9 Mock Tests */}
          <div className={`${styles.bentoTile} ${styles.tileBlue}`}>
            <div className={styles.tileTopRow}>
              <span className={styles.tileLabel}>Mock Tests</span>
              <div className={`${styles.iconBadge} ${styles.badgeBlue}`} aria-hidden="true">
                <Layers size={18} />
              </div>
            </div>
            <div className={styles.tileMetricBlock}>
              <span className={styles.tileValue}>{totalTests} Mock Tests</span>
              <span className={styles.tileSub}>Full CBT &amp; Part Mocks</span>
            </div>
          </div>

          {/* Tile 2: 48 Total Questions */}
          <div className={`${styles.bentoTile} ${styles.tilePurple}`}>
            <div className={styles.tileTopRow}>
              <span className={styles.tileLabel}>Total Questions</span>
              <div className={`${styles.iconBadge} ${styles.badgePurple}`} aria-hidden="true">
                <FileCheck size={18} />
              </div>
            </div>
            <div className={styles.tileMetricBlock}>
              <span className={styles.tileValue}>{totalQuestions} Total Questions</span>
              <span className={styles.tileSub}>Physics, Chemistry &amp; Maths</span>
            </div>
          </div>

          {/* Tile 3: 2 Exam Formats */}
          <div className={`${styles.bentoTile} ${styles.tileAmber}`}>
            <div className={styles.tileTopRow}>
              <span className={styles.tileLabel}>Exam Formats</span>
              <div className={`${styles.iconBadge} ${styles.badgeAmber}`} aria-hidden="true">
                <Clock size={18} />
              </div>
            </div>
            <div className={styles.tileMetricBlock}>
              <span className={styles.tileValue}>{availableExamsCount} Exam Formats</span>
              <span className={styles.tileSub}>JEE Main &amp; Advanced Engines</span>
            </div>
          </div>

          {/* Tile 4: 2 Tests Attempted */}
          <div className={`${styles.bentoTile} ${styles.tileGreen}`}>
            <div className={styles.tileTopRow}>
              <span className={styles.tileLabel}>Tests Attempted</span>
              <div className={`${styles.iconBadge} ${styles.badgeGreen}`} aria-hidden="true">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className={styles.tileMetricBlock}>
              <span className={styles.tileValue}>{attemptedTestsCount} Tests Attempted</span>
              <span className={styles.tileSub}>
                {attemptedTestsCount > 0 ? 'Active performance tracked' : 'Ready to start first mock'}
              </span>
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
};

export default TestSeriesHeader;
