import React from 'react';
import {
  Zap,
  Brain,
  Users,
  Award,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Container } from '../ui/Container/Container';
import styles from './WhyUsSection.module.scss';

interface AdvantageItem {
  id: string;
  number: string;
  title: string;
  tag: string;
  description: string;
  keyPoints: string[];
  impactMetric: { value: string; label: string };
  icon: React.ReactNode;
  themeClass: string;
}

const ADVANTAGES: AdvantageItem[] = [
  {
    id: 'shortcuts',
    number: '01',
    title: '20–30s Inspection Shortcuts',
    tag: 'Signature Method',
    description: 'Solve multi-concept calculus, coordinate geometry, and algebraic limits by structural inspection rather than tedious multi-page algebraic manipulation.',
    keyPoints: [
      'Eliminates 6 to 7 lines of tedious calculations',
      'Structural symmetry & boundary elimination',
      'Saves 15–20 minutes in actual exam hall'
    ],
    impactMetric: { value: '15–20 Mins', label: 'Time Saved per Paper' },
    icon: <Zap size={22} />,
    themeClass: styles.themeAmber
  },
  {
    id: 'concept-first',
    number: '02',
    title: 'Concept-First, Zero Rote',
    tag: 'First Principles',
    description: 'Master rigorous mathematical derivations from scratch. We build genuine problem-solving intuition so unexpected trap questions are easily navigated.',
    keyPoints: [
      'No blind formula memorization',
      'Rigorous first-principles proof for every theorem',
      'Visual intuition for non-smooth graphs & curves'
    ],
    impactMetric: { value: '100% Intuitive', label: 'Derivation-First Rigor' },
    icon: <Brain size={22} />,
    themeClass: styles.themeBlue
  },
  {
    id: 'small-batches',
    number: '03',
    title: 'Strictly Max 25 Students',
    tag: 'Personal Attention',
    description: 'Unlike commercial mega-coaching halls with 200+ students, our strictly capped small batches ensure DK Sir personally reviews every student’s homework and doubts.',
    keyPoints: [
      'Every single student is known by name',
      'Daily notebook checks & error log tracking',
      'Dedicated 1-on-1 doubt clearing after class'
    ],
    impactMetric: { value: 'Max 25 Cohort', label: 'Zero Backbenchers' },
    icon: <Users size={22} />,
    themeClass: styles.themeEmerald
  },
  {
    id: 'cbt-practice',
    number: '04',
    title: 'Complete CBT & DPP Bank',
    tag: 'NTA Exam Rigor',
    description: '15+ years topic-classified JEE Main and Advanced previous year questions with step-by-step reasoning and timed computer-based mock tests.',
    keyPoints: [
      '15+ years PYQs chapter-wise with video solutions',
      'NTA-identical test engine simulation interface',
      'Personalized negative-marking risk analytics'
    ],
    impactMetric: { value: '10,000+ PYQs', label: 'NTA CBT Simulation' },
    icon: <Award size={22} />,
    themeClass: styles.themePurple
  }
];

export interface WhyUsSectionProps {
  badge?: string;
  title?: string;
  subtitle?: string;
}

export const WhyUsSection: React.FC<WhyUsSectionProps> = ({ badge, title, subtitle }) => {
  return (
    <section className={styles.section} id="why-dk-academy" aria-labelledby="why-us-heading">
      <div className={styles.ambientGlow} aria-hidden="true" />

      <Container size="wide">
        {/* Modern Section Header */}
        <div className={styles.headerBlock}>
          <div className={styles.eyebrowBadge}>
            <Sparkles size={13} className={styles.sparkleIcon} aria-hidden="true" />
            <span>{badge || "THE DK ACADEMY ADVANTAGE"}</span>
          </div>

          <h2 id="why-us-heading" className={styles.heading}>
            {title ? (
              title
            ) : (
              <>
                Why Serious JEE Aspirants{' '}
                <span className={styles.headingGradient}>Choose DK Sir</span>
              </>
            )}
          </h2>

          <p className={styles.subtitle}>
            {subtitle ||
              "Transforming average mathematical problem-solvers into Top 1% IITian rankers through Kota-engineered inspection algorithms and high-touch individual mentoring."}
          </p>
        </div>

        {/* 4 Feature Showcase Cards Grid */}
        <div className={styles.grid}>
          {ADVANTAGES.map((item) => (
            <article key={item.id} className={`${styles.card} ${item.themeClass}`}>
              {/* Subtle Decorative Number Watermark */}
              <span className={styles.numberWatermark} aria-hidden="true">
                {item.number}
              </span>

              {/* Card Header Row */}
              <div className={styles.cardHeader}>
                <div className={styles.iconBox} aria-hidden="true">
                  {item.icon}
                </div>
                <span className={styles.badge}>{item.tag}</span>
              </div>

              {/* Content Body */}
              <h3 className={styles.title}>{item.title}</h3>
              <p className={styles.description}>{item.description}</p>

              {/* Divider */}
              <div className={styles.divider} aria-hidden="true" />

              {/* Highlights Checklist */}
              <ul className={styles.pointsList}>
                {item.keyPoints.map((pt, idx) => (
                  <li key={idx} className={styles.pointItem}>
                    <CheckCircle2 size={14} className={styles.pointIcon} aria-hidden="true" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>

              {/* Impact Metric Pill at Card Bottom */}
              <div className={styles.impactFooter}>
                <span className={styles.impactVal}>{item.impactMetric.value}</span>
                <span className={styles.impactLabel}>{item.impactMetric.label}</span>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default WhyUsSection;
