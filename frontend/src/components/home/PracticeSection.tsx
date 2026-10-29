import React from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, CheckSquare, Award, Video, ArrowRight, Check } from 'lucide-react';
import { Container } from '../ui/Container/Container';
import { SectionHeading } from '../ui/SectionHeading/SectionHeading';
import { PRACTICE_FEATURES } from '../../data/homepageData';
import styles from './PracticeSection.module.scss';

export const PracticeSection: React.FC = () => {
  const getFeatureIcon = (id: string) => {
    switch (id) {
      case 'pyq-bank':
        return <FileCheck size={28} />;
      case 'dpp-system':
        return <CheckSquare size={28} />;
      case 'mock-tests':
        return <Award size={28} />;
      case 'video-solutions':
        return <Video size={28} />;
      default:
        return <FileCheck size={28} />;
    }
  };

  return (
    <section className={styles.section} id="practice" aria-labelledby="practice-heading">
      <Container size="wide">
        <SectionHeading
          eyebrow="Practice & Assessment"
          title="Engineered for Rigorous Exam Temperament"
          description="Consistent practice transforms conceptual understanding into test-day speed and accuracy. Our practice toolkit gives you systematic daily repetitions."
          align="center"
          className={styles.heading}
        />

        <div className={styles.grid}>
          {PRACTICE_FEATURES.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.iconWrap}>
                  {getFeatureIcon(item.id)}
                </div>
                {item.badgeText && (
                  <span className={styles.badge}>{item.badgeText}</span>
                )}
              </div>

              <div className={styles.tag}>{item.shortTag}</div>
              <h3 className={styles.title}>{item.title}</h3>
              <p className={styles.description}>{item.description}</p>

              <ul className={styles.bulletsList}>
                {item.bulletPoints.map((point, idx) => (
                  <li key={idx} className={styles.bulletItem}>
                    <Check size={15} className={styles.bulletCheck} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <div className={styles.footerLinkWrapper}>
                <Link to={item.route} className={styles.actionLink}>
                  <span>Explore {item.title}</span>
                  <ArrowRight size={16} className={styles.arrowIcon} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};
