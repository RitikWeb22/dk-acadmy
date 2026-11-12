import React from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  Trophy,
  Play,
  ArrowRight,
  Info,
  Calendar,
  HelpCircle,
  FileText,
  TrendingUp,
} from 'lucide-react';
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
  const handleScrollToTests = () => {
    const el = document.getElementById('available-mock-tests');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={styles.header}>
      <Container size="wide">
        {/* Breadcrumb Navigation */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/" className={styles.breadcrumbLink}>
            <Home size={14} aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight size={13} className={styles.breadcrumbSeparator} aria-hidden="true" />
          <span className={styles.breadcrumbCurrent} aria-current="page">
            Test Series
          </span>
        </nav>

        {/* Two-Column Hero Grid */}
        <div className={styles.heroGrid}>
          {/* Left Column: Heading, Subtitle, CTAs */}
          <div className={styles.heroLeftCol}>
            <div className={styles.heroEyebrowBadge}>
              <Trophy size={14} className={styles.eyebrowIcon} aria-hidden="true" />
              <span>NTA Pattern 2025–26</span>
            </div>

            <h1 className={styles.heroHeading}>
              <span className={styles.headingAccent}>JEE</span> CBT Test Series
              <br />
              Dashboard
            </h1>

            <p className={styles.heroDescription}>
              Experience authentic exam conditions with timed full-length and chapter-wise mock tests for JEE Main and JEE Advanced. Built with real countdown timers, negative marking schemes, instant question palettes, and comprehensive post-test analysis.
            </p>

            <div className={styles.heroCtaRow}>
              <button
                type="button"
                className={styles.heroPrimaryBtn}
                onClick={handleScrollToTests}
              >
                <Play size={15} fill="currentColor" aria-hidden="true" />
                <span>Start a Test</span>
                <ArrowRight size={15} aria-hidden="true" />
              </button>

              <button
                type="button"
                className={styles.heroSecondaryBtn}
                onClick={handleScrollToTests}
              >
                <span>Learn More</span>
                <Info size={15} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Right Column: 3D Illustration & Aura (Static, zero animation) */}
          <div className={styles.heroRightCol}>
            <div className={styles.heroVisualCard}>
              {/* Dot Matrix Pattern */}
              <div className={styles.dotMatrixGrid} aria-hidden="true" />

              {/* Curved Aura Backdrop */}
              <div className={styles.heroWaveBackdrop} aria-hidden="true" />

              {/* JEE CBT Test Series Math & STEM Illustration */}
              <img
                src="/images/test-series-hero-3d.png"
                alt="JEE CBT Test Series Mathematics and STEM Concept Illustration"
                className={styles.heroIllustrationImg}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (!img.src.includes('cutout')) {
                    img.src = '/images/test-series-hero-cutout.png';
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className={styles.summaryTilesRow} role="region" aria-label="Test series overview metrics">
          {/* Card 1: Mock Tests */}
          <div className={styles.summaryCard}>
            <div className={`${styles.iconBadge} ${styles.badgeBlue}`} aria-hidden="true">
              <Calendar size={18} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValueRow}>
                <span className={styles.metricNumber}>{totalTests}</span>
                <span className={styles.metricLabel}>Mock Tests</span>
              </div>
              <span className={styles.metricSub}>Full CBT &amp; Part Mocks</span>
            </div>
          </div>

          {/* Card 2: Total Questions */}
          <div className={styles.summaryCard}>
            <div className={`${styles.iconBadge} ${styles.badgePurple}`} aria-hidden="true">
              <HelpCircle size={18} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValueRow}>
                <span className={styles.metricNumber}>{totalQuestions}</span>
                <span className={styles.metricLabel}>Total Questions</span>
              </div>
              <span className={styles.metricSub}>Physics, Chemistry &amp; Maths</span>
            </div>
          </div>

          {/* Card 3: Exam Formats */}
          <div className={styles.summaryCard}>
            <div className={`${styles.iconBadge} ${styles.badgeOrange}`} aria-hidden="true">
              <FileText size={18} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValueRow}>
                <span className={styles.metricNumber}>{availableExamsCount}</span>
                <span className={styles.metricLabel}>Exam Formats</span>
              </div>
              <span className={styles.metricSub}>JEE Main &amp; Advanced Engines</span>
            </div>
          </div>

          {/* Card 4: Tests Attempted */}
          <div className={styles.summaryCard}>
            <div className={`${styles.iconBadge} ${styles.badgeGreen}`} aria-hidden="true">
              <TrendingUp size={18} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValueRow}>
                <span className={styles.metricNumber}>{attemptedTestsCount}</span>
                <span className={styles.metricLabel}>Tests Attempted</span>
              </div>
              <span className={styles.metricSub}>Active performance tracked</span>
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
};

export default TestSeriesHeader;
