import React from 'react';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { Container } from '../ui/Container/Container';
import { Button } from '../ui/Button/Button';
import styles from './CtaSection.module.scss';

export const CtaSection: React.FC = () => {
  return (
    <section className={styles.section} aria-labelledby="cta-heading">
      <Container size="default">
        <div className={styles.ctaCard}>
          <div className={styles.bgGlow} aria-hidden="true" />

          <div className={styles.eyebrow}>
            <Sparkles size={14} />
            <span>Structured JEE Main & Advanced Preparation</span>
          </div>

          <h2 id="cta-heading" className={styles.headline}>
            Your JEE Preparation Starts Here.
          </h2>

          <p className={styles.description}>
            Explore the learning resources and build a preparation routine that works for you.
            Access free foundation lectures or enroll in structured batches.
          </p>

          <div className={styles.buttonGroup}>
            <Button
              to="/courses"
              variant="primary"
              size="lg"
              icon={<ArrowRight size={18} />}
            >
              Explore Courses
            </Button>
            <Button
              to="/free-lectures"
              variant="secondary"
              size="lg"
              icon={<Play size={16} fill="currentColor" />}
              iconPosition="left"
            >
              Watch Free Lectures
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};
