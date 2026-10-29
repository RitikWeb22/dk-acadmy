import React from 'react';
import { Sparkles } from 'lucide-react';
import type { Lecture } from '../../../types';
import { LectureCard } from '../LectureCard/LectureCard';
import styles from './FeaturedLectures.module.scss';

interface FeaturedLecturesProps {
  lectures: Lecture[];
  onSelectLecture: (lecture: Lecture) => void;
}

export const FeaturedLectures: React.FC<FeaturedLecturesProps> = ({
  lectures,
  onSelectLecture
}) => {
  const featuredItems = lectures.filter((l) => l.isFeatured);

  if (featuredItems.length === 0) return null;

  return (
    <div className={styles.featuredSection} aria-labelledby="featured-lectures-title">
      <div className={styles.featuredHeader}>
        <div className={styles.titleWrap}>
          <Sparkles size={18} className={styles.sparkleIcon} />
          <h2 id="featured-lectures-title" className={styles.sectionTitle}>
            Featured Masterclasses
          </h2>
        </div>
        <p className={styles.sectionSubtitle}>
          Hand-picked foundational derivations and problem sets across Physics, Chemistry, and Mathematics.
        </p>
      </div>

      <div className={styles.grid}>
        {featuredItems.map((lecture) => (
          <LectureCard
            key={lecture.id}
            lecture={lecture}
            onSelectLecture={onSelectLecture}
          />
        ))}
      </div>
    </div>
  );
};
