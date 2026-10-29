import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Sparkles, Rocket, ArrowRight, CheckCircle2, Calendar } from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import styles from './AboutBatches.module.scss';

export const AboutBatches: React.FC = () => {
  const batches = [
    {
      categoryTag: 'Foundation 11th',
      categoryTheme: 'blueTag',
      icon: Sparkles,
      title: 'JEE Main & Advanced 2-Year Foundation',
      subtitle: 'Class 11 & Early Starters seeking deep conceptual grounding before intense competition.',
      highlights: [
        'Complete Class 11 syllabus integrated with NCERT and Olympiad-level analytical depth',
        'Early mastery of Functions, Graph Transformations, Limits, and Coordinate Geometry',
        'Weekly CBT mock tests with individual error clinics to diagnose speed bottlenecks',
        'Structured classroom formula sheets and daily 10-problem DPP assignments'
      ],
      startDate: 'Next Batch: 10th Nov 2026 • Limited 30 Seats',
      linkUrl: '/courses',
    },
    {
      categoryTag: 'Target 12th & Droppers',
      categoryTheme: 'emeraldTag',
      icon: GraduationCap,
      title: 'JEE Advanced & Mains 1-Year Flagship',
      subtitle: 'Class 12 & Dropper / Repeater aspirants targeting 99+ percentiles and top IITs.',
      highlights: [
        'Comprehensive 11th & 12th revision with intensive Kota problem-solving tempo',
        'DK Sir’s proprietary 20s speed inspection algorithms for Definite Integrals and Calculus',
        'Exhaustive 15-year topic-wise PYQ bank with step-by-step examiner trap notes',
        'Dedicated 1:1 doubt-clearing sessions and CBT national percentile benchmark tests'
      ],
      startDate: 'Next Batch: 15th Nov 2026 • 24 Seats Available',
      linkUrl: '/courses',
    },
    {
      categoryTag: 'Specialized Speed Crash Course',
      categoryTheme: 'amberTag',
      icon: Rocket,
      title: 'Fast-Track Problem Solving & Shortcuts',
      subtitle: 'Final Sprint Revision module engineered for maximum score acceleration before exams.',
      highlights: [
        'High-yield shortcuts: King’s property, Leibniz rule, and symmetry arguments',
        'Smart boundary-condition testing and rapid option elimination methods',
        'Top 35 highest-weightage chapters with zero-fluff, high-probability problems',
        'Formula memory marathons, negative-marking prevention, and test strategy'
      ],
      startDate: 'Next Batch: 1st Dec 2026 • Open Admissions',
      linkUrl: '/courses',
    },
  ];

  return (
    <section className={styles.batchesSection}>
      <Container>
        <div className={styles.sectionHeader}>
          <span className={styles.subheading}>Academic Programs</span>
          <h2 className={styles.heading}>Course Offerings &amp; Structured Batches</h2>
          <p className={styles.caption}>
            Tailored learning pathways catering to early foundation learners, regular school students, and repeater aspirants.
          </p>
        </div>

        <div className={styles.batchesGrid}>
          {batches.map((batch, idx) => {
            const Icon = batch.icon;
            return (
              <div key={idx} className={styles.batchCard}>
                {/* Top Banner Category Tag */}
                <div className={styles.cardTopBanner}>
                  <span className={`${styles.categoryPill} ${styles[batch.categoryTheme]}`}>
                    {batch.categoryTag}
                  </span>
                  <div className={styles.headerIconWrap}>
                    <Icon size={18} aria-hidden="true" />
                  </div>
                </div>

                {/* Title & Subtitle Clearly Separated */}
                <div className={styles.titleGroup}>
                  <h3 className={styles.batchTitle}>{batch.title}</h3>
                  <p className={styles.batchSubtitle}>{batch.subtitle}</p>
                </div>

                {/* High-Contrast Feature List */}
                <div className={styles.highlightsList}>
                  {batch.highlights.map((h, hIdx) => (
                    <div key={hIdx} className={styles.highlightItem}>
                      <CheckCircle2 size={16} className={styles.checkIcon} aria-hidden="true" />
                      <span className={styles.highlightText}>{h}</span>
                    </div>
                  ))}
                </div>

                {/* Bottom Anchor: Start Date & Action CTA */}
                <div className={styles.cardFooter}>
                  <div className={styles.batchStartDate}>
                    <Calendar size={14} className={styles.dateIcon} aria-hidden="true" />
                    <span>{batch.startDate}</span>
                  </div>
                  <Link to={batch.linkUrl} className={styles.ctaLink}>
                    <span>View Full Batch Details</span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default AboutBatches;

