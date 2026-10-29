import React from 'react';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { Button } from '../../ui/Button/Button';
import styles from './LecturesCTA.module.scss';

export const LecturesCTA: React.FC = () => {
  return (
    <section className={styles.ctaSection} aria-labelledby="lectures-cta-heading">
      <Container size="default">
        <div className={styles.ctaCard}>
          <div className={styles.decorCircle} aria-hidden="true" />
          <div className={styles.topIconBox}>
            <GraduationCap size={24} />
          </div>
          <h2 id="lectures-cta-heading" className={styles.title}>
            Ready to Take Your Preparation Further?
          </h2>
          <p className={styles.description}>
            Explore available courses and structured learning resources for your JEE preparation.
            Gain access to year-long curriculum batches, curated test series, and dedicated doubt resolution.
          </p>
          <div className={styles.btnRow}>
            <Button
              to="/courses"
              variant="primary"
              size="lg"
              icon={<ArrowRight size={18} />}
            >
              Explore Courses
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};
