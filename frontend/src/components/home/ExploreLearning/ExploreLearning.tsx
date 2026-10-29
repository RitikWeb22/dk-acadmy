import React from 'react';
import { Link } from 'react-router-dom';
import { Video, BookOpen, FileCheck, Award, ArrowRight } from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { SectionHeading } from '../../ui/SectionHeading/SectionHeading';
import { EXPLORE_LEARNING_ITEMS } from '../../../data/homepageRedesignData';
import styles from './ExploreLearning.module.scss';

export const ExploreLearning: React.FC = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Video':
        return <Video size={24} />;
      case 'BookOpen':
        return <BookOpen size={24} />;
      case 'FileCheck':
        return <FileCheck size={24} />;
      case 'Award':
      default:
        return <Award size={24} />;
    }
  };

  return (
    <section className={styles.section} aria-labelledby="explore-learning-heading">
      <Container size="wide">
        <SectionHeading
          eyebrow="Pathways to Success"
          title="Explore Learning"
          description="Choose your tailored academic pathway to master JEE Main, JEE Advanced, and Foundation concepts."
          align="center"
        />

        <div className={styles.grid}>
          {EXPLORE_LEARNING_ITEMS.map((item) => (
            <Link
              key={item.id}
              to={item.route}
              className={styles.card}
              style={{
                '--card-accent': item.themeColor,
                '--icon-bg': `${item.themeColor}14`
              } as React.CSSProperties}
              aria-label={`Explore ${item.title}: ${item.subtitle}`}
            >
              <div className={styles.topRow}>
                <div className={styles.iconWrapper}>
                  {getIcon(item.iconName)}
                </div>
                <span className={styles.badge}>{item.badge}</span>
              </div>

              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardSubtitle}>{item.subtitle}</p>

              <div className={styles.actionRow}>
                <span className={styles.actionText}>Get Started</span>
                <ArrowRight size={16} className={styles.arrowIcon} />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
};
