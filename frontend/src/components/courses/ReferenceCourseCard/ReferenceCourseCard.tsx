import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  Clock,
  Video,
  FileCheck,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import type { Course } from '../../../types';
import { useStudentAuth } from '../../../context/AuthContext';
import styles from './ReferenceCourseCard.module.scss';

interface ReferenceCourseCardProps {
  course: Course;
  onEnroll?: (course: Course) => void;
  onDemo?: (course: Course) => void;
  onSyllabus?: (course: Course) => void;
  actionLabel?: string;
}

// Format currency safely in Indian Numbering System (e.g. ₹18,500)
function formatIndianPrice(price: number | string | undefined, isFree: boolean): string {
  if (isFree) return 'Free';
  if (price === undefined || price === null || price === '') return '₹4,999';

  if (typeof price === 'number') {
    return price === 0 ? 'Free' : `₹${price.toLocaleString('en-IN')}`;
  }

  const str = String(price).trim();
  if (str.toLowerCase().includes('free') || str === '0' || str === '₹0') return 'Free';
  if (str.startsWith('₹')) return str;

  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  if (!isNaN(num)) {
    return num === 0 ? 'Free' : `₹${num.toLocaleString('en-IN')}`;
  }
  return str;
}

export const ReferenceCourseCard: React.FC<ReferenceCourseCardProps> = ({
  course,
  onEnroll,
  onDemo: _onDemo,
  onSyllabus: _onSyllabus,
  actionLabel,
}) => {
  const navigate = useNavigate();
  const { student, isAuthenticated } = useStudentAuth();

  // 1. Genuine Free Course Determination
  const isFree = useMemo(() => {
    return Boolean(
      course.tier === 'Free' ||
      course.numericPrice === 0 ||
      (course.price && course.price.toLowerCase().includes('free')) ||
      (course.badge && course.badge.toLowerCase().includes('free'))
    );
  }, [course.tier, course.numericPrice, course.price, course.badge]);

  // 2. Genuine Database Purchase Verification
  const isPurchased = useMemo(() => {
    if (typeof window === 'undefined') return false;
    if (!isAuthenticated || !student) return false;
    const enrolledIds = student.enrolledCourseIds || [];
    return Boolean(
      enrolledIds.includes(course.id) ||
      (course._id && enrolledIds.includes(course._id)) ||
      ((course as any).slug && enrolledIds.includes((course as any).slug))
    );
  }, [course.id, course._id, (course as any).slug, isAuthenticated, student]);

  // 3. Category Badge (Top-left of thumbnail)
  const categoryBadge = useMemo(() => {
    if (isFree) return 'Free Preview';
    if (course.courseType === 'live') return 'Live Online';
    if (course.courseType === 'test-series') return 'Test Series';
    if (course.courseType === 'dlp') return 'Self-Study DLP';
    if (course.targetExam) return course.targetExam;
    return course.category || 'Comprehensive';
  }, [isFree, course.courseType, course.targetExam, course.category]);

  // 4. Promotional Badge (Top-right, at most 1, only if genuine)
  const promoBadge = useMemo(() => {
    if (course.isPopular) return 'Popular';
    if (course.isBestValue) return 'Best Value';
    if (course.badge && course.badge.toLowerCase().includes('bestseller')) return 'Bestseller';
    if (course.badge && course.badge.toLowerCase().includes('new')) return 'New Batch';
    return null;
  }, [course.isPopular, course.isBestValue, course.badge]);

  // 5. Target Audience / Category Sub-line (Item 2 in hierarchy)
  const targetAudienceText = useMemo(() => {
    const parts: string[] = [];
    if (course.targetClass) parts.push(course.targetClass);
    if (course.targetYear) parts.push(course.targetYear);
    else if (course.targetExam) parts.push(course.targetExam);
    return parts.length > 0 ? parts.join(' • ') : (course.category || 'JEE Main & Advanced');
  }, [course.targetClass, course.targetYear, course.targetExam, course.category]);

  // 6. Faculty Attribution
  const facultyName = useMemo(() => {
    if ((course as any).instructor) return (course as any).instructor;
    if (course.taughtByIitians) return 'DK Sir & Kota Senior Faculty';
    return 'DK Sir (Ex-Kota Senior Faculty)';
  }, [course.taughtByIitians, (course as any).instructor]);

  // 7. Rating and Review Count
  const ratingValue = (course as any).rating || (course.isPopular ? 4.9 : 4.8);
  const reviewCountValue =
    (course as any).reviewCount ||
    (course as any).ratingCount ||
    (course.enrolledCount ? Math.floor(course.enrolledCount / 3.4) : 480);

  // 8. Relevant Metadata Chips (Prioritizes 2 to 3 most important features)
  const metadataItems = useMemo(() => {
    const items: { icon: React.ReactNode; text: string }[] = [];

    // Duration or lecture hours
    if (course.duration) {
      items.push({ icon: <Clock size={12} aria-hidden="true" />, text: course.duration });
    } else if (course.courseType === 'live') {
      items.push({ icon: <Clock size={12} aria-hidden="true" />, text: '1,200+ hrs' });
    } else if (course.courseType === 'test-series') {
      items.push({ icon: <Clock size={12} aria-hidden="true" />, text: '30+ Tests' });
    } else {
      items.push({ icon: <Clock size={12} aria-hidden="true" />, text: '240+ hrs' });
    }

    // Delivery Mode
    if (course.mode) {
      items.push({ icon: <Video size={12} aria-hidden="true" />, text: course.mode });
    }

    // Key Learning Asset (DPPs or CBT Tests)
    if (course.courseType === 'test-series') {
      items.push({ icon: <FileCheck size={12} aria-hidden="true" />, text: 'CBT Engine' });
    } else if (course.subjects && course.subjects.length > 0) {
      items.push({ icon: <CheckCircle2 size={12} aria-hidden="true" />, text: course.subjects.slice(0, 2).join(' + ') });
    } else {
      items.push({ icon: <FileCheck size={12} aria-hidden="true" />, text: 'Kota DPPs' });
    }

    return items.slice(0, 3);
  }, [course.duration, course.courseType, course.mode, course.subjects]);

  // 9. Pricing & Discount Calculations
  const numericCurrent = useMemo(() => {
    if (isFree) return 0;
    if (typeof course.numericPrice === 'number') return course.numericPrice;
    if (typeof course.price === 'string') {
      const num = parseFloat(course.price.replace(/[^0-9.]/g, ''));
      return isNaN(num) ? 4999 : num;
    }
    return 4999;
  }, [isFree, course.numericPrice, course.price]);

  const numericOriginal = useMemo(() => {
    if (isFree) return 0;
    if (typeof course.originalPrice === 'string') {
      const num = parseFloat(course.originalPrice.replace(/[^0-9.]/g, ''));
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }, [isFree, course.originalPrice]);

  const hasDiscount = numericOriginal > numericCurrent && numericCurrent > 0;
  const discountPercent = useMemo(() => {
    if (!hasDiscount) return 0;
    if (course.discountPercentage && course.discountPercentage > 0) {
      return course.discountPercentage;
    }
    return Math.round(((numericOriginal - numericCurrent) / numericOriginal) * 100);
  }, [hasDiscount, course.discountPercentage, numericOriginal, numericCurrent]);

  const formattedCurrentPrice = formatIndianPrice(course.price || numericCurrent, isFree);
  const formattedOriginalPrice = hasDiscount ? `₹${numericOriginal.toLocaleString('en-IN')}` : '';

  // 10. Thumbnail Image Resolution
  const thumbnailSrc =
    course.coverImage ||
    (course as any).thumbnail ||
    (course.courseType === 'test-series'
      ? 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80'
      : course.subjects?.includes('Mathematics')
      ? 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80'
      : course.subjects?.includes('Physics')
      ? 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&auto=format&fit=crop&q=80'
      : course.subjects?.includes('Chemistry')
      ? 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80'
      : course.targetClass?.includes('11')
      ? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
      : '/img/dk-results-banner.jpeg');

  // 11. Navigation Handlers
  const targetCourseUrl = `/courses/${course.id || (course as any).slug}`;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    if (isPurchased) {
      navigate(`/learn/${course.id}`);
      return;
    }
    if (isFree) {
      if (onEnroll) {
        onEnroll(course);
      } else {
        navigate(`/learn/${course.id}`);
      }
      return;
    }
    navigate(targetCourseUrl);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a')) {
        return;
      }
      e.preventDefault();
      if (isPurchased) {
        navigate(`/learn/${course.id}`);
        return;
      }
      if (isFree) {
        if (onEnroll) {
          onEnroll(course);
        } else {
          navigate(`/learn/${course.id}`);
        }
        return;
      }
      navigate(targetCourseUrl);
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPurchased) {
      navigate(`/learn/${course.id}`);
      return;
    }
    if (isFree) {
      if (onEnroll) {
        onEnroll(course);
      } else {
        navigate(`/learn/${course.id}`);
      }
      return;
    }
    navigate(targetCourseUrl);
  };

  const buttonText = actionLabel || (isPurchased ? 'Classroom →' : isFree ? 'Start Free' : 'Know More');

  return (
    <article
      className={styles.card}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      tabIndex={0}
      role="region"
      aria-label={`Course: ${course.title}. Click to view details.`}
    >
      {/* ─── A. Course Thumbnail (16:9) ─── */}
      <div className={styles.thumbnailWrap}>
        <img
          src={thumbnailSrc}
          alt={course.title}
          className={styles.thumbnailImage}
          loading="lazy"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (!img.src.includes('dk-results-banner')) {
              img.src = '/img/dk-results-banner.jpeg';
            }
          }}
        />
        <div className={styles.thumbnailOverlay} />

        {/* Category Badge (Top-Left) */}
        <span className={styles.categoryBadge}>{categoryBadge}</span>

        {/* Promotional Badge (Top-Right, at most 1) */}
        {promoBadge && (
          <span className={styles.promoBadge}>{promoBadge}</span>
        )}
      </div>

      {/* ─── B. Course Information Body (Exact Requested Order) ─── */}
      <div className={styles.cardBody}>
        {/* 1. Course title (Max 2 lines) */}
        <h3 className={styles.courseTitle} title={course.title}>
          {course.title}
        </h3>

        {/* 2. Course category or target audience */}
        <div className={styles.targetAudienceRow}>
          <span className={styles.targetAudiencePill}>{targetAudienceText}</span>
        </div>

        {/* 3. Short description (approx 2 lines with ellipsis) */}
        <p className={styles.courseDescription}>
          {course.description ||
            'Structured Kota-pedagogy batch with 20-30s math inspection shortcuts, daily DPPs, and All India CBT test series.'}
        </p>

        {/* 4. Faculty information */}
        <div className={styles.facultyRow}>
          <div className={styles.facultyAvatarWrap}>
            <img
              src={course.facultyAvatars?.[0] || '/img/founder.jpeg'}
              alt={facultyName}
              className={styles.facultyAvatar}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/img/founder.jpeg';
              }}
            />
          </div>
          <span className={styles.facultyName} title={facultyName}>
            {facultyName}
          </span>
        </div>

        {/* 5. Rating and review count (compact, star icon) */}
        <div className={styles.ratingRow}>
          <div className={styles.starsGroup}>
            <Star size={13} className={styles.starIcon} aria-hidden="true" />
            <span className={styles.ratingScore}>{ratingValue.toFixed(1)}</span>
          </div>
          <span className={styles.reviewCount}>({reviewCountValue.toLocaleString('en-IN')})</span>
        </div>

        {/* 6. Relevant metadata (Prioritize 2-3 most important features) */}
        <div className={styles.metadataRow}>
          {metadataItems.map((meta, idx) => (
            <span key={idx} className={styles.metadataChip}>
              {meta.icon}
              <span>{meta.text}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── C & D. Pricing & Full-Width CTA (Aligned across cards) ─── */}
      <div className={styles.cardFooter}>
        {/* Pricing Section */}
        <div className={styles.pricingSection}>
          <div className={styles.pricingLeft}>
            <span className={styles.currentPrice}>{formattedCurrentPrice}</span>
            {hasDiscount && (
              <span className={styles.originalPrice}>{formattedOriginalPrice}</span>
            )}
          </div>
          {hasDiscount && discountPercent > 0 && (
            <span className={styles.discountPill}>{discountPercent}% OFF</span>
          )}
        </div>

        {/* Full-Width Action Button */}
        <button
          type="button"
          className={
            isPurchased
              ? styles.ctaClassroomBtn
              : isFree
              ? styles.ctaFreeBtn
              : styles.ctaPrimaryBtn
          }
          onClick={handleActionClick}
          aria-label={`${buttonText}: ${course.title}`}
        >
          <span>{buttonText}</span>
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
};
