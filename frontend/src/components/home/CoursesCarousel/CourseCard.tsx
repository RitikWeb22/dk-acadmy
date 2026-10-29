import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Calendar, Video, ArrowRight } from 'lucide-react';
import type { Course } from '../../../types';
import styles from './CoursesCarousel.module.scss';

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <Link
      to={`/courses?category=${encodeURIComponent(course.targetExam)}`}
      className={`${styles.card} ${course.isPopular ? styles.popularCard : ''}`}
      aria-label={`Course: ${course.title}. View batch details`}
    >
      <div className={styles.cardTop}>
        <span className={styles.examBadge}>{course.targetExam}</span>
        {course.isPopular && (
          <span className={styles.popularPill}>Most Popular</span>
        )}
      </div>

      <h3 className={styles.courseTitle}>{course.title}</h3>

      <div className={styles.targetYear}>
        <Calendar size={14} />
        <span>{course.targetYear}</span>
      </div>

      <p className={styles.description}>{course.description}</p>

      <ul className={styles.featureList}>
        {course.features.slice(0, 3).map((feat, idx) => (
          <li key={idx} className={styles.featureItem}>
            <Check size={14} className={styles.checkIcon} />
            <span>{feat}</span>
          </li>
        ))}
      </ul>

      <div className={styles.cardFooter}>
        <div className={styles.metaRow}>
          <div className={styles.metaItem}>
            <Video size={13} />
            <span>{course.mode}</span>
          </div>
          <span>{course.tier === 'Free' ? 'Free Access' : 'Flagship Batch'}</span>
        </div>

        {/* Subtle, non-repetitive link that responds to card hover (Fixes Issue 12) */}
        <div className={styles.actionLinkRow}>
          <span className={styles.viewDetailsText}>View Curriculum</span>
          <ArrowRight size={15} className={styles.arrowIcon} />
        </div>
      </div>
    </Link>
  );
};
