import React from 'react';
import { ArrowRight, Play, BookOpen, Atom, Calculator, CheckCircle2, Award, Sparkles } from 'lucide-react';
import { Container } from '../ui/Container/Container';
import { Button } from '../ui/Button/Button';
import styles from './HeroSection.module.scss';

export const HeroSection: React.FC = () => {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.bgDecorCircle} aria-hidden="true" />
      <div className={styles.bgGridPattern} aria-hidden="true" />

      <Container size="wide" className={styles.container}>
        <div className={styles.heroGrid}>
          {/* Left Column: Headline and CTAs */}
          <div className={styles.leftCol}>
            <div className={styles.eyebrowBadge}>
              <Sparkles size={14} className={styles.sparkleIcon} />
              <span>Your JEE Journey Starts Here</span>
            </div>

            <h1 id="hero-heading" className={styles.headline}>
              Prepare Smarter. <br />
              Aim Higher. <br />
              <span className={styles.highlightText}>Crack JEE.</span>
            </h1>

            <p className={styles.description}>
              Explore structured courses, free lectures, previous-year questions and daily
              practice resources to prepare for JEE Main and Advanced.
            </p>

            <div className={styles.ctaGroup}>
              <Button
                to="/courses"
                variant="primary"
                size="lg"
                icon={<ArrowRight size={18} />}
              >
                Explore Courses
              </Button>
              <Button
                to="/free-lectures"
                variant="secondary"
                size="lg"
                icon={<Play size={16} fill="currentColor" />}
                iconPosition="left"
              >
                Watch Free Lectures
              </Button>
            </div>

            {/* Platform Trust Highlights (Clean and Truthful) */}
            <div className={styles.trustHighlights}>
              <div className={styles.trustItem}>
                <CheckCircle2 size={16} className={styles.trustIcon} />
                <span>NTA JEE Main & Advanced Aligned</span>
              </div>
              <div className={styles.trustItem}>
                <CheckCircle2 size={16} className={styles.trustIcon} />
                <span>Zero Paywall Free Lectures</span>
              </div>
              <div className={styles.trustItem}>
                <CheckCircle2 size={16} className={styles.trustIcon} />
                <span>Daily Graded DPP Sets</span>
              </div>
            </div>
          </div>

          {/* Right Column: Educational Dashboard Visual */}
          <div className={styles.rightCol}>
            <div className={styles.visualCardWrapper}>
              {/* Main Visual Board */}
              <div className={styles.mainBoard}>
                {/* Header of Mock Board */}
                <div className={styles.boardHeader}>
                  <div className={styles.boardDots}>
                    <span className={styles.dotRed} />
                    <span className={styles.dotYellow} />
                    <span className={styles.dotGreen} />
                  </div>
                  <div className={styles.boardTitle}>
                    JEE Academic Preparation Track
                  </div>
                  <div className={styles.yearTag}>2026 / 2027</div>
                </div>

                {/* Subject Cards Overview */}
                <div className={styles.subjectsGrid}>
                  <div className={`${styles.subjectCard} ${styles.physics}`}>
                    <div className={styles.subjectIconBox}>
                      <Atom size={20} />
                    </div>
                    <div>
                      <div className={styles.subjectName}>Physics</div>
                      <div className={styles.subjectTopic}>Mechanics & Electrodynamics</div>
                    </div>
                    <div className={styles.subjectStatus}>32 Chapters</div>
                  </div>

                  <div className={`${styles.subjectCard} ${styles.chemistry}`}>
                    <div className={styles.subjectIconBox}>
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <div className={styles.subjectName}>Chemistry</div>
                      <div className={styles.subjectTopic}>Organic, Inorganic & Physical</div>
                    </div>
                    <div className={styles.subjectStatus}>28 Chapters</div>
                  </div>

                  <div className={`${styles.subjectCard} ${styles.maths}`}>
                    <div className={styles.subjectIconBox}>
                      <Calculator size={20} />
                    </div>
                    <div>
                      <div className={styles.subjectName}>Mathematics</div>
                      <div className={styles.subjectTopic}>Calculus, Vectors & Algebra</div>
                    </div>
                    <div className={styles.subjectStatus}>30 Chapters</div>
                  </div>
                </div>

                {/* Today's Learning Module Preview */}
                <div className={styles.activityBox}>
                  <div className={styles.activityHeader}>
                    <span className={styles.activityLabel}>Daily Preparation Module</span>
                    <span className={styles.activityBadge}>Active</span>
                  </div>
                  <div className={styles.activityRow}>
                    <div className={styles.activityIndicator} />
                    <div className={styles.activityText}>
                      <strong>Chapter: Rotational Dynamics</strong>
                      <span>Lecture 04 • Moment of Inertia & Parallel Axis Theorem</span>
                    </div>
                  </div>
                  <div className={styles.progressRow}>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: '75%' }} />
                    </div>
                    <span className={styles.progressText}>75% Concept Retention</span>
                  </div>
                </div>
              </div>

              {/* Floating Pill 1: DPP Solved */}
              <div className={`${styles.floatingPill} ${styles.pillTopLeft}`}>
                <div className={styles.pillIconWrap}>
                  <Award size={18} />
                </div>
                <div>
                  <div className={styles.pillHeading}>Daily DPP Routine</div>
                  <div className={styles.pillSub}>15 Questions / Day</div>
                </div>
              </div>

              {/* Floating Pill 2: PYQ Question Bank */}
              <div className={`${styles.floatingPill} ${styles.pillBottomRight}`}>
                <div className={styles.pillIconWrapAccent}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div className={styles.pillHeading}>PYQ 2012–2025</div>
                  <div className={styles.pillSub}>Step-by-step Explanations</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
