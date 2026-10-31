import React, { useState, useMemo } from 'react';
import { Check, Calendar, Video, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import type { Course } from '../../../types';
import { useStudentAuth } from '../../../context/AuthContext';
import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import styles from './CourseCard.module.scss';

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { student, isAuthenticated } = useStudentAuth();
  const isAdvanced = course.targetExam === 'JEE Advanced';

  const isFree = useMemo(() => {
    return Boolean(
      course.tier === 'Free' ||
      course.numericPrice === 0 ||
      (course.price && course.price.toLowerCase().includes('free')) ||
      (course.badge && course.badge.toLowerCase().includes('free'))
    );
  }, [course.tier, course.numericPrice, course.price, course.badge]);

  const isPurchased = useMemo(() => {
    if (!isAuthenticated || !student) return false;
    const enrolledIds = student.enrolledCourseIds || [];
    return Boolean(
      enrolledIds.includes(course.id) ||
      (course._id && enrolledIds.includes(course._id)) ||
      ((course as any).slug && enrolledIds.includes((course as any).slug))
    );
  }, [course.id, course._id, (course as any).slug, isAuthenticated, student]);

  const targetLink = useMemo(() => {
    if (isPurchased) return `/learn/${course.id}`;
    if (isFree) return `/learn/${course.id}`;
    if (!isAuthenticated || !student) return `/login?redirect=${encodeURIComponent(`/payment/${course.id}`)}`;
    return `/payment/${course.id}`;
  }, [isPurchased, isFree, isAuthenticated, student, course.id]);

  const buttonText = isPurchased ? 'Open Classroom' : isFree ? 'Start Free' : 'Enroll Now';

  const visibleFeatures = isExpanded ? course.features : course.features.slice(0, 3);
  const hiddenCount = course.features.length - 3;

  return (
    <article className={`${styles.card} ${course.isPopular ? styles.popular : ''}`}>
      {course.isPopular && (
        <div className={styles.popularRibbon}>
          <span>MOST RECOMMENDED</span>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.badgesRow}>
          {course.tags && course.tags.length > 0 ? (
            course.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant={tag.toLowerCase().includes('popular') ? 'accent' : idx === 0 ? 'primary' : 'outline'} size="sm">
                {tag}
              </Badge>
            ))
          ) : (
            <>
              <Badge variant={isAdvanced ? 'primary' : 'muted'} size="sm">
                {course.targetExam}
              </Badge>
              <Badge variant="outline" size="sm">
                {course.targetYear}
              </Badge>
              <Badge variant={course.tier === 'Free' ? 'accent' : 'muted'} size="sm">
                {course.tier}
              </Badge>
            </>
          )}
        </div>

        <h3 className={styles.title}>{course.title}</h3>
        <p className={styles.description}>{course.description}</p>
      </div>

      <div className={styles.metaInfo}>
        <div className={styles.metaItem}>
          <Video size={15} className={styles.metaIcon} />
          <span>{course.mode}</span>
        </div>
        <div className={styles.metaItem}>
          <Calendar size={15} className={styles.metaIcon} />
          <span>{course.schedule}</span>
        </div>
      </div>

      <div className={styles.featuresSection}>
        <span className={styles.featuresTitle}>What's included:</span>
        <ul className={styles.featuresList}>
          {visibleFeatures.map((feature, idx) => (
            <li key={idx} className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        {hiddenCount > 0 && (
          <button
            type="button"
            className={styles.toggleFeaturesBtn}
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
          >
            <span>{isExpanded ? 'Show less' : `+${hiddenCount} more features`}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      <div className={styles.footer}>
        <Button
          to={targetLink}
          variant="secondary"
          size="md"
          fullWidth
          icon={<ArrowRight size={16} />}
        >
          {buttonText}
        </Button>
      </div>
    </article>
  );
};
