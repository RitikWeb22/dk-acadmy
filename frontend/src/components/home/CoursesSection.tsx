import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Container } from '../ui/Container/Container';
import { SectionHeading } from '../ui/SectionHeading/SectionHeading';
import { Button } from '../ui/Button/Button';
import { CourseCard } from '../courses/CourseCard/CourseCard';
import { COURSES_DATA } from '../../data/homepageData';
import styles from './CoursesSection.module.scss';

export const CoursesSection: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'JEE Main' | 'JEE Advanced' | 'Foundation'>('All');

  const filteredCourses = filter === 'All'
    ? COURSES_DATA
    : COURSES_DATA.filter((c) => c.targetExam === filter);

  return (
    <section className={styles.section} id="courses" aria-labelledby="courses-heading">
      <Container size="wide">
        <div className={styles.headerRow}>
          <SectionHeading
            eyebrow="Structured Batches"
            title="Explore Our Courses"
            description="Targeted preparation programs structured by experienced educators to take students from foundational clarity to JEE Advanced problem-solving competence."
            align="left"
            className={styles.heading}
          />

          {/* Client-side filter tabs for interactive usability */}
          <div className={styles.filterTabs} role="tablist" aria-label="Course Exam Filter">
            {(['All', 'JEE Main', 'JEE Advanced', 'Foundation'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={filter === tab}
                className={`${styles.tabBtn} ${filter === tab ? styles.activeTab : ''}`}
                onClick={() => setFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.grid}>
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>

        <div className={styles.viewAllAction}>
          <Button
            to="/courses"
            variant="outline"
            size="lg"
            icon={<ArrowRight size={18} />}
          >
            Explore All Courses & Batches
          </Button>
        </div>
      </Container>
    </section>
  );
};
