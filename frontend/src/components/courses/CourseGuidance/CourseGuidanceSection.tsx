import React from 'react';
import { Target, BookOpenCheck, PlayCircle, CalendarCheck } from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import styles from './CourseGuidanceSection.module.scss';

const GUIDANCE_STEPS = [
  {
    icon: <Target size={22} />,
    title: '1. Identify Your Target Exam',
    description: 'Determine whether you need comprehensive coverage for JEE Main, deep multi-concept problem solving for JEE Advanced, or foundational Class 11 bridging.'
  },
  {
    icon: <BookOpenCheck size={22} />,
    title: '2. Review Syllabus & Materials',
    description: 'Check the chapter distribution, daily practice problem (DPP) volume, and computer-based test (CBT) simulations included in the batch syllabus.'
  },
  {
    icon: <PlayCircle size={22} />,
    title: '3. Sample Free Lectures First',
    description: 'Watch open-access lectures to experience our teaching methodology, derivation rigor, and conceptual explanations before committing to any full track.'
  },
  {
    icon: <CalendarCheck size={22} />,
    title: '4. Check Batch Flexibility',
    description: 'Confirm the schedule fits your school or self-study routine. All live classes include immediate recorded backups and revision summaries.'
  }
];

export const CourseGuidanceSection: React.FC = () => {
  return (
    <section className={styles.guidanceSection} aria-labelledby="guidance-heading">
      <Container size="wide">
        <div className={styles.innerCard}>
          <div className={styles.header}>
            <span className={styles.eyebrow}>Academic Guidance</span>
            <h2 id="guidance-heading" className={styles.title}>
              How to Select the Right JEE Course
            </h2>
            <p className={styles.subtitle}>
              Choosing the appropriate preparation track prevents burnout and ensures your daily study hours match your academic goals.
            </p>
          </div>

          <div className={styles.grid}>
            {GUIDANCE_STEPS.map((item, idx) => (
              <div key={idx} className={styles.guidanceItem}>
                <div className={styles.iconBox}>{item.icon}</div>
                <h3 className={styles.itemTitle}>{item.title}</h3>
                <p className={styles.itemDesc}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
