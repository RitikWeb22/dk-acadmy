import React from 'react';
import { Target, Zap, Database, CheckCircle2 } from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import styles from './AboutMethodology.module.scss';

export const AboutMethodology: React.FC = () => {
  const pillars = [
    {
      icon: Target,
      themeClass: 'blueTheme',
      title: 'In-Depth Conceptual Theory',
      tag: 'Foundation First',
      points: [
        'Deconstruct every formula and theorem with geometric and algebraic intuition from first principles.',
        'Comprehensive curve sketching, asymptotic analysis, and visualization of limits & continuity.',
        'Zero rote memorization—students master the underlying "why" before writing a single step.'
      ]
    },
    {
      icon: Zap,
      themeClass: 'amberTheme',
      title: 'Proprietary 20s Speed Algorithms',
      tag: 'Speed & Efficiency',
      points: [
        'Trademarked 20–30 second inspection shortcuts for King’s integral properties, LCD, and matrices.',
        'Symmetry arguments, smart boundary-value testing, and rapid option elimination methods.',
        'Eliminate algebraic fatigue and turn 5-minute calculation traps into rapid mental arithmetic.'
      ]
    },
    {
      icon: Database,
      themeClass: 'emeraldTheme',
      title: 'Exhaustive 15-Year PYQ Rigor',
      tag: 'Real Exam Alignment',
      points: [
        'Every single question from 2011 to 2025 classified by chapter weightage and examiner trap patterns.',
        'Side-by-side solution comparison: standard school algebra vs DK Sir’s high-tempo inspection method.',
        'Computer-based test (CBT) shift simulations ensuring absolute stamina on real JEE exam day.'
      ]
    }
  ];

  return (
    <section className={styles.methodologySection}>
      <Container>
        <div className={styles.sectionHeader}>
          <span className={styles.subheading}>Teaching Methodology</span>
          <h2 className={styles.heading}>The Three Pillars of Our Academic Approach</h2>
          <p className={styles.caption}>
            Our pedagogy bridges the gap between deep theoretical understanding and high-speed exam execution,
            transforming mathematics into an aspirant&apos;s highest-scoring subject.
          </p>
        </div>

        <div className={styles.pillarsGrid}>
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div key={idx} className={`${styles.pillarCard} ${styles[pillar.themeClass]}`}>
                <div className={styles.cardTop}>
                  <div className={styles.iconWrap}>
                    <Icon size={24} aria-hidden="true" />
                  </div>
                  <span className={styles.tag}>{pillar.tag}</span>
                </div>

                <h3 className={styles.cardTitle}>{pillar.title}</h3>

                <div className={styles.pointsList}>
                  {pillar.points.map((pt, pIdx) => (
                    <div key={pIdx} className={styles.pointItem}>
                      <CheckCircle2 size={16} className={styles.pointCheck} aria-hidden="true" />
                      <span className={styles.pointText}>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default AboutMethodology;

