import React from 'react';
import { Link } from 'react-router-dom';
import { Video, BookOpen, Award, FileCheck, ArrowRight } from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { SectionHeading } from '../../ui/SectionHeading/SectionHeading';
import styles from './ChoosePath.module.scss';

interface PathCard {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeType: 'primary' | 'success' | 'amber' | 'neutral';
  icon: React.ReactNode;
  route: string;
  ctaText: string;
}

const PATH_CARDS: PathCard[] = [
  {
    id: 'path-live',
    title: 'Live Batches',
    subtitle: 'Interactive cohorts mentored by DK Sir with real-time doubt solving, small batch sizes, and rigorous homework tracking.',
    badge: 'Flagship Program',
    badgeType: 'primary',
    icon: <Video size={24} aria-hidden="true" />,
    route: '/courses?category=JEE%20Main',
    ctaText: 'View Live Batches'
  },
  {
    id: 'path-dlp',
    title: 'Self-Study DLP',
    subtitle: 'Distance Learning Program with structured recorded video modules, printed study notes, and chapter-wise formula blueprints.',
    badge: 'Self-Paced',
    badgeType: 'neutral',
    icon: <BookOpen size={24} aria-hidden="true" />,
    route: '/courses',
    ctaText: 'Explore DLP Modules'
  },
  {
    id: 'path-test-series',
    title: 'CBT Test Series',
    subtitle: 'Real NTA computer-based exam engine with instant percentile rank prediction, topic heatmaps, and negative marking analysis.',
    badge: 'Exam Simulation',
    badgeType: 'amber',
    icon: <Award size={24} aria-hidden="true" />,
    route: '/test-series',
    ctaText: 'Take Free Mock Test'
  },
  {
    id: 'path-pyq-dpp',
    title: 'Free PYQ & DPP',
    subtitle: 'Zero-paywall daily practice problems (DPP) and 15+ years topic-classified JEE Main and Advanced previous year questions.',
    badge: '100% Free Access',
    badgeType: 'success',
    icon: <FileCheck size={24} aria-hidden="true" />,
    route: '/dpp',
    ctaText: 'Solve Daily Practice'
  }
];

export const ChoosePath: React.FC = () => {
  return (
    <section className={styles.section} id="choose-path" aria-labelledby="choose-path-heading">
      <Container size="wide">
        <div className={styles.headerWrap}>
          <SectionHeading
            eyebrow="Targeted Learning Modes"
            title="Choose Your Preparation Path"
            description="Whether you prefer live interactive guidance, independent problem solving, or testing speed under exam pressure, find the exact program built for your goals."
            align="center"
          />
        </div>

        <div className={styles.grid}>
          {PATH_CARDS.map((card) => (
            <Link
              key={card.id}
              to={card.route}
              className={styles.card}
              aria-label={`${card.title}: ${card.subtitle}`}
            >
              <div className={styles.cardTop}>
                <div className={styles.iconWrap}>
                  {card.icon}
                </div>
                <span className={`${styles.badge} ${styles[card.badgeType]}`}>
                  {card.badge}
                </span>
              </div>

              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardDesc}>{card.subtitle}</p>
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.ctaLink}>
                  <span>{card.ctaText}</span>
                  <ArrowRight size={16} className={styles.arrowIcon} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
};
