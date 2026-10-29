import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Calendar,
  Users,
  Sparkles,
  GraduationCap,
  Target,
  Compass,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { cmsService, CMS_EVENT_KEY } from '../../../services/cmsService';
import type { Course } from '../../../types';
import styles from './PopularCourses.module.scss';

type TabType = 'all' | '11-12' | 'dropper' | 'foundation';

export interface PopularCoursesProps {
  badge?: string;
  title?: string;
  subtitle?: string;
}

export const PopularCourses: React.FC<PopularCoursesProps> = ({ badge, title, subtitle }) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [coursesList, setCoursesList] = useState<Course[]>(() => cmsService.getCourses());

  useEffect(() => {
    const handleUpdate = () => setCoursesList(cmsService.getCourses());
    window.addEventListener(CMS_EVENT_KEY, handleUpdate);
    return () => window.removeEventListener(CMS_EVENT_KEY, handleUpdate);
  }, []);

  const filteredCourses = useMemo(() => {
    switch (activeTab) {
      case '11-12':
        return coursesList
          .filter((c) => c.targetClass === 'Class 11th' || c.targetClass === 'Class 12th')
          .slice(0, 3);
      case 'dropper':
        return coursesList.filter((c) => c.targetClass === 'Dropper').slice(0, 3);
      case 'foundation':
        return coursesList.filter((c) => c.targetClass === 'Class 10th Foundation').slice(0, 3);
      case 'all':
      default:
        return [
          coursesList.find((c) => c.id === 'jee-main-advanced-2yr-ultimate') || coursesList[0],
          coursesList.find((c) => c.id === 'jee-maths-mastery-dk-sir') || coursesList[2] || coursesList[0],
          coursesList.find((c) => c.id === 'jee-dropper-achiever-batch') || coursesList[1] || coursesList[0]
        ].filter(Boolean);
    }
  }, [activeTab, coursesList]);

  const handleEnrollClick = (courseTitle: string) => {
    const callbackTarget = document.getElementById('callback') || document.getElementById('callback-form');
    if (callbackTarget) {
      callbackTarget.scrollIntoView({ behavior: 'smooth' });
      const courseSelect = document.getElementById('callback-course') as HTMLSelectElement | null;
      if (courseSelect) {
        for (let i = 0; i < courseSelect.options.length; i++) {
          if (courseSelect.options[i].text.toLowerCase().includes(courseTitle.toLowerCase().slice(0, 15))) {
            courseSelect.selectedIndex = i;
            break;
          }
        }
      }
      const nameInput = document.getElementById('callback-name') || document.querySelector('input[type="text"]');
      if (nameInput) {
        setTimeout(() => (nameInput as HTMLElement).focus(), 500);
      }
    }
  };

  // Helper to calculate or derive discount percentage
  const getDiscountPercentage = (course: Course): number | null => {
    if (course.discountPercentage) return course.discountPercentage;
    if (course.price && course.originalPrice) {
      const p = parseInt(course.price.replace(/\D/g, ''), 10);
      const op = parseInt(course.originalPrice.replace(/\D/g, ''), 10);
      if (op > p && op > 0) {
        return Math.round(((op - p) / op) * 100);
      }
    }
    return null;
  };

  return (
    <section className={styles.section} id="popular-courses" aria-labelledby="popular-courses-heading">
      <div className={styles.ambientGlow} aria-hidden="true" />

      <Container size="wide">
        {/* Modern Header Row */}
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <div className={styles.eyebrowBadge}>
              <Sparkles size={13} className={styles.eyebrowIcon} aria-hidden="true" />
              <span>{badge || "TARGETED CURRICULUM"}</span>
            </div>
            <h2 id="popular-courses-heading" className={styles.title}>
              {title ? (
                title
              ) : (
                <>
                  Flagship Classroom &amp; <span className={styles.titleGradient}>Online Batches</span>
                </>
              )}
            </h2>
            <p className={styles.subtitle}>
              {subtitle ||
                "Proven programs taught with DK Sir’s concept-first techniques, strictly limited batch sizes (max 25), and comprehensive test series."}
            </p>
          </div>

          <div className={styles.topActions}>
            <Link to="/courses" className={styles.viewAllBtn} id="view-all-courses-top-btn">
              <span>View All Batches ({coursesList.length})</span>
              <ArrowRight size={15} className={styles.btnArrow} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Interactive Segmented Filter Dock */}
        <div className={styles.tabsWrap}>
          <div className={styles.tabsContainer} role="tablist" aria-label="Course Category Tabs">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'all'}
              className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <Sparkles size={14} className={styles.tabIcon} aria-hidden="true" />
              <span>All Featured Batches</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === '11-12'}
              className={`${styles.tabBtn} ${activeTab === '11-12' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('11-12')}
            >
              <GraduationCap size={14} className={styles.tabIcon} aria-hidden="true" />
              <span>Class 11th &amp; 12th (2-Year)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'dropper'}
              className={`${styles.tabBtn} ${activeTab === 'dropper' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('dropper')}
            >
              <Target size={14} className={styles.tabIcon} aria-hidden="true" />
              <span>Droppers &amp; Repeaters</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'foundation'}
              className={`${styles.tabBtn} ${activeTab === 'foundation' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('foundation')}
            >
              <Compass size={14} className={styles.tabIcon} aria-hidden="true" />
              <span>Foundation (8th–10th)</span>
            </button>
          </div>
        </div>

        {/* 3-Column Desktop Grid with Strict Equal Heights & Elevated Modern Cards */}
        <div
          className={styles.cardsContainer}
          role="region"
          aria-label="Course offerings"
        >
          {filteredCourses.map((course: Course, index: number) => {
            const isFeatured =
              course.isPopular ||
              course.id.includes('maths-mastery') ||
              course.badge?.toLowerCase().includes('flagship') ||
              index === 0;

            const discount = getDiscountPercentage(course);

            return (
              <article
                key={course.id}
                className={`${styles.courseCard} ${isFeatured ? styles.featuredCard : ''}`}
                aria-label={`Course: ${course.title}`}
              >
                {/* Decorative Top Accent Glow Line */}
                <div className={styles.cardAccentBar} aria-hidden="true" />

                {/* Top Badge Row */}
                <div className={styles.topBadgeRow}>
                  <div className={styles.flagshipBadge}>
                    <Sparkles size={12} className={styles.flagshipIcon} aria-hidden="true" />
                    <span>{course.badge || 'DK SIR FLAGSHIP'}</span>
                  </div>

                  <div className={styles.targetYearPill}>
                    <Calendar size={12} className={styles.calendarIcon} aria-hidden="true" />
                    <span>{course.targetYear || 'Target JEE 2028'}</span>
                  </div>
                </div>

                {/* Course Title */}
                <h3 className={styles.cardTitle}>
                  <Link
                    to={`/courses/${course.id}`}
                    className={styles.titleLink}
                  >
                    {course.title}
                  </Link>
                </h3>

                {/* Rigor Meta Pills: Capacity & Delivery */}
                <div className={styles.metaPillsRow}>
                  <div className={styles.metaPillBatch}>
                    <Users size={12} className={styles.metaIcon} aria-hidden="true" />
                    <span>Strictly Max 25 / Batch</span>
                  </div>
                  <div className={styles.metaPillMode}>
                    <Zap size={12} className={styles.metaIcon} aria-hidden="true" />
                    <span>{course.mode || 'Live Online'} • {course.duration || 'Full Session'}</span>
                  </div>
                </div>

                {/* Academic Deliverables Checklist (3 Key Points) */}
                <ul className={styles.bulletList}>
                  {course.features.slice(0, 3).map((feat, idx) => (
                    <li key={idx} className={styles.bulletItem}>
                      <div className={styles.checkIconWrap} aria-hidden="true">
                        <CheckCircle2 size={14} className={styles.checkIcon} />
                      </div>
                      <span className={styles.bulletText}>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Standardized Pricing Row */}
                <div className={styles.priceRow}>
                  <div className={styles.priceWrap}>
                    <span className={styles.currentPrice}>{course.price}</span>
                    {course.originalPrice && (
                      <span className={styles.strikethroughPrice}>{course.originalPrice}</span>
                    )}
                    {discount && (
                      <span className={styles.discountBadge}>Save {discount}%</span>
                    )}
                  </div>
                  <span className={styles.gstTag}>Incl. 18% GST</span>
                </div>

                {/* Card Action Buttons */}
                <div className={styles.cardFooter}>
                  <button
                    type="button"
                    className={styles.enrollBtn}
                    onClick={() => handleEnrollClick(course.title)}
                    aria-label={`Enroll in ${course.title}`}
                  >
                    <span>Enroll Now</span>
                    <ArrowRight size={14} className={styles.btnArrow} aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Section Bottom Assurance Banner */}
        <div className={styles.assuranceStrip}>
          <div className={styles.assuranceItem}>
            <ShieldCheck size={16} className={styles.assuranceIcon} />
            <span><strong>Strictly 25 Seats/Cohort:</strong> Direct faculty mentoring by DK Sir</span>
          </div>
          <div className={styles.assuranceDivider} aria-hidden="true" />
          <div className={styles.assuranceItem}>
            <Zap size={16} className={styles.assuranceIcon} />
            <span><strong>20–30s Inspection Method:</strong> Proprietary shortcut speed derivations</span>
          </div>
          <div className={styles.assuranceDivider} aria-hidden="true" />
          <div className={styles.assuranceItem}>
            <Sparkles size={16} className={styles.assuranceIcon} />
            <span><strong>Zero Commitment Counseling:</strong> 1-on-1 academic diagnostic call</span>
          </div>
        </div>

        {/* View all courses bottom button for mobile */}
        <div className={styles.mobileViewAllWrap}>
          <Link to="/courses" className={styles.mobileViewAllBtn}>
            <span>View All Batches ({coursesList.length})</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </Container>
    </section>
  );
};

export default PopularCourses;
