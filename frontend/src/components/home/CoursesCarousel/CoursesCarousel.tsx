import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { SectionHeading } from '../../ui/SectionHeading/SectionHeading';
import { CourseCard } from './CourseCard';
import { COURSES_CATALOG } from '../../../data/coursesData';
import styles from './CoursesCarousel.module.scss';

export const CoursesCarousel: React.FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: -380, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: 380, behavior: 'smooth' });
    }
  };

  return (
    <section className={styles.section} aria-labelledby="courses-chosen-heading">
      <Container size="wide">
        <div className={styles.headerRow}>
          <SectionHeading
            eyebrow="Structured Learning"
            title="Courses Chosen by Students"
            description="Targeted curriculum programs designed for conceptual retention, multi-concept problem solving, and top rank performance."
            align="left"
          />

          <div className={styles.actionControls}>
            <Link to="/courses" className={styles.viewAllLink}>
              <span>View All Courses</span>
              <ArrowRight size={16} />
            </Link>

            <div className={styles.navArrows}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={scrollLeft}
                aria-label="Scroll courses left"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className={styles.navBtn}
                onClick={scrollRight}
                aria-label="Scroll courses right"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={trackRef}
          className={styles.carouselTrack}
          role="region"
          aria-label="Course list"
        >
          {COURSES_CATALOG.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </Container>
    </section>
  );
};
