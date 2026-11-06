import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Calendar, Video, ArrowRight, Sparkles } from 'lucide-react';
import type { Course } from '../../../types';
import { offerService, OFFERS_EVENT_KEY } from '../../../services/offerService';
import styles from './CoursesCarousel.module.scss';

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const [offersTick, setOffersTick] = useState(0);
  useEffect(() => {
    const handler = () => setOffersTick((v) => v + 1);
    window.addEventListener(OFFERS_EVENT_KEY, handler);
    return () => window.removeEventListener(OFFERS_EVENT_KEY, handler);
  }, []);

  const rawPrice = course.numericPrice || (typeof course.price === 'string' ? parseFloat(course.price.replace(/[^0-9.]/g, '')) : 4999);
  const effectiveOffer = useMemo(() => {
    return offerService.getEffectiveItemOffer(course.id || (course as any)._id, 'course', rawPrice);
  }, [course.id, (course as any)._id, rawPrice, offersTick]);

  return (
    <Link
      to={`/courses?category=${encodeURIComponent(course.targetExam)}`}
      className={`${styles.card} ${course.isPopular ? styles.popularCard : ''}`}
      aria-label={`Course: ${course.title}. View batch details`}
    >
      <div className={styles.cardTop}>
        <span className={styles.examBadge}>{course.targetExam}</span>
        {effectiveOffer?.hasOffer ? (
          <span
            className={styles.popularPill}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              fontWeight: 700
            }}
          >
            {effectiveOffer.badgeText}
          </span>
        ) : course.isPopular ? (
          <span className={styles.popularPill}>Most Popular</span>
        ) : null}
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
