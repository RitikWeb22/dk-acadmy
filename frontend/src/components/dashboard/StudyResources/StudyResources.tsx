import React from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen,
  ArrowRight,
  Video,
  FileQuestion,
  BookMarked,
  Cpu
} from 'lucide-react';
import styles from './StudyResources.module.scss';

export const StudyResources: React.FC = () => {
  const resources = [
    {
      id: 'res-pyq',
      title: 'PYQ Question Archive (2012–2025)',
      description: 'Comprehensive chapter-wise past questions with official NTA answer keys.',
      route: '/pyq',
      icon: <FileQuestion size={18} />,
      tag: 'Archive'
    },
    {
      id: 'res-lectures',
      title: 'Free Conceptual Lectures Library',
      description: 'Foundational theory videos covering all core chapters across PCM.',
      route: '/free-lectures',
      icon: <Video size={18} />,
      tag: 'Free'
    },
    {
      id: 'res-dpp',
      title: 'Daily Practice Worksheets & Hints',
      description: 'Handpicked problem sets designed to train speed under real time pressure.',
      route: '/dpp',
      icon: <BookMarked size={18} />,
      tag: 'Daily'
    },
    {
      id: 'res-cbt',
      title: 'Computer Based Test Simulation',
      description: 'Simulated examination portal mirroring the official JEE test screen.',
      route: '/test-series',
      icon: <Cpu size={18} />,
      tag: 'CBT Engine'
    }
  ];

  return (
    <section className={styles.section} aria-labelledby="study-resources-title">
      <div className={styles.sectionHeader}>
        <div className={styles.titleGroup}>
          <div className={styles.iconBox}>
            <FolderOpen size={18} />
          </div>
          <h2 id="study-resources-title" className={styles.sectionTitle}>
            Academic Study Resources
          </h2>
        </div>
      </div>

      <div className={styles.resourceGrid}>
        {resources.map((item) => (
          <Link key={item.id} to={item.route} className={styles.resourceCard}>
            <div className={styles.resourceIconBox}>{item.icon}</div>
            <div className={styles.resourceContent}>
              <div className={styles.cardHeaderRow}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <span className={styles.tag}>{item.tag}</span>
              </div>
              <p className={styles.cardDesc}>{item.description}</p>
            </div>
            <div className={styles.cardArrow} aria-hidden="true">
              <ArrowRight size={14} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
