import React from 'react';
import { ArrowRight, PhoneCall, Sparkles } from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import styles from './AboutCta.module.scss';

export const AboutCta: React.FC = () => {
  return (
    <section className={styles.ctaSection}>
      <Container>
        <div className={styles.ctaCard}>
          <div className={styles.glowSpot} aria-hidden="true" />
          <div className={styles.content}>
            <div className={styles.badgeWrap}>
              <span className={styles.badge}>
                <Sparkles size={13} className={styles.sparkleIcon} aria-hidden="true" />
                <span>Small Batch Kota Mentorship</span>
              </span>
            </div>

            <h2 className={styles.title}>Ready to Master IIT JEE Mathematics?</h2>
            <p className={styles.description}>
              Join DK Sir&apos;s small batch mentorship at Dwarka / Janakpuri center or master trademarked 20s speed
              inspection algorithms through our structured video course modules.
            </p>

            <div className={styles.buttonGroup}>
              <a href="/#callback" className={styles.primaryBtn}>
                <span>Enroll in Classroom Batch</span>
                <ArrowRight size={16} aria-hidden="true" />
              </a>

              <a href="/#callback" className={styles.secondaryBtn}>
                <PhoneCall size={16} aria-hidden="true" />
                <span>Book Free Demo Call</span>
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default AboutCta;

