import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Zap, BookMarked, Sparkles, ArrowRight } from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { SectionHeading } from '../../ui/SectionHeading/SectionHeading';
import { ONLINE_CATEGORIES } from '../../../data/homepageRedesignData';
import styles from './OnlineCourseCategories.module.scss';

export const OnlineCourseCategories: React.FC = () => {
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Target':
        return <Target size={26} />;
      case 'Zap':
        return <Zap size={26} />;
      case 'BookMarked':
        return <BookMarked size={26} />;
      case 'Sparkles':
      default:
        return <Sparkles size={26} />;
    }
  };

  return (
    <section className={styles.section} aria-labelledby="online-courses-heading">
      <Container size="wide">
        <SectionHeading
          eyebrow="Targeted Curriculum"
          title="Explore Online Courses"
          description="Find the right program aligned to your current academic stage and target examination year."
          align="center"
        />

        <div className={styles.grid}>
          {ONLINE_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/courses?category=${encodeURIComponent(cat.categoryValue)}`}
              className={styles.card}
              style={{
                '--cat-accent': cat.accentColor,
                '--icon-bg': `${cat.accentColor}14`
              } as React.CSSProperties}
              aria-label={`Explore ${cat.title} for ${cat.targetClass}`}
            >
              <div className={styles.iconCircle}>
                {getCategoryIcon(cat.iconName)}
              </div>

              <span className={styles.targetClassBadge}>{cat.targetClass}</span>
              <h3 className={styles.title}>{cat.title}</h3>
              <p className={styles.description}>{cat.description}</p>

              <div className={styles.highlightsList}>
                {cat.highlights.map((hl, i) => (
                  <div key={i} className={styles.highlightItem}>
                    <span className={styles.dotIcon} />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>

              <div className={styles.arrowCta}>
                <span>View Program</span>
                <ArrowRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
};
