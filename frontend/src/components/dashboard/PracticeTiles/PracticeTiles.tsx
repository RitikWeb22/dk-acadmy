import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  BookOpen,
  Trophy,
  Video,
  ArrowUpRight
} from 'lucide-react';
import styles from './PracticeTiles.module.scss';

interface PracticeTileItem {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: React.ReactNode;
  badge?: string;
  tintClass: string;
}

export const PracticeTiles: React.FC = () => {
  const tiles: PracticeTileItem[] = [
    {
      id: 'tile-dpp',
      title: 'DPP Sheets',
      description: 'Daily Problem Sets',
      route: '/dpp',
      icon: <FileText size={18} aria-hidden="true" />,
      badge: 'Active',
      tintClass: 'emeraldTint'
    },
    {
      id: 'tile-pyq',
      title: 'Chapter PYQs',
      description: 'Topic-wise 10-Year Archive',
      route: '/pyq',
      icon: <BookOpen size={18} aria-hidden="true" />,
      tintClass: 'blueTint'
    },
    {
      id: 'tile-mock',
      title: 'Mock Tests',
      description: 'CBT Exam Simulator',
      route: '/test-series',
      icon: <Trophy size={18} aria-hidden="true" />,
      badge: 'NTA CBT',
      tintClass: 'purpleTint'
    },
    {
      id: 'tile-lectures',
      title: 'Free Lectures',
      description: 'DK Sir Masterclasses',
      route: '/free-lectures',
      icon: <Video size={18} aria-hidden="true" />,
      tintClass: 'amberTint'
    }
  ];

  return (
    <section className={styles.card} aria-labelledby="practice-tiles-heading">
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <h2 id="practice-tiles-heading" className={styles.heading}>
            Practice & Resources
          </h2>
          <span className={styles.subheading}>Self-study drills & archives</span>
        </div>
      </div>

      <div className={styles.bentoMatrix}>
        {tiles.map((tile) => (
          <Link
            key={tile.id}
            to={tile.route}
            className={`${styles.tileItem} ${styles[tile.tintClass]}`}
            aria-label={`${tile.title}: ${tile.description}`}
          >
            <div className={styles.tileTop}>
              <div className={styles.iconCircle}>{tile.icon}</div>
              <ArrowUpRight size={15} className={styles.arrowIcon} aria-hidden="true" />
            </div>

            <div className={styles.tileBottom}>
              <div className={styles.titleRow}>
                <span className={styles.tileTitle}>{tile.title}</span>
                {tile.badge && <span className={styles.tileBadge}>{tile.badge}</span>}
              </div>
              <span className={styles.tileDesc}>{tile.description}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default PracticeTiles;
