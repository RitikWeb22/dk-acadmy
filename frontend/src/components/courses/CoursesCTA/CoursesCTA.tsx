import React from 'react';
import { Play } from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { Button } from '../../ui/Button/Button';
import styles from './CoursesCTA.module.scss';

export const CoursesCTA: React.FC = () => {
  return (
    <section className={styles.ctaSection} aria-labelledby="courses-cta-heading">
      <Container size="default">
        <div className={styles.ctaCard}>
          <div className={styles.decorCircle} aria-hidden="true" />
          <h2 id="courses-cta-heading" className={styles.title}>
            Start Learning at Your Own Pace
          </h2>
          <p className={styles.description}>
            Explore available free lectures and discover the learning resources that suit your preparation.
            No credit card or subscription required for open chapters.
          </p>
          <div className={styles.btnRow}>
            <Button
              to="/free-lectures"
              variant="primary"
              size="lg"
              icon={<Play size={16} fill="currentColor" />}
              iconPosition="left"
            >
              Explore Free Lectures
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};
