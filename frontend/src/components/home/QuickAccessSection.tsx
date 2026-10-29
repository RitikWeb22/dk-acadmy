import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  PlayCircle,
  FileCheck,
  CheckSquare,
  Award,
  ArrowRight
} from 'lucide-react';
import { Container } from '../ui/Container/Container';
import { SectionHeading } from '../ui/SectionHeading/SectionHeading';
import { QUICK_ACCESS_ITEMS } from '../../data/homepageData';
import styles from './QuickAccessSection.module.scss';

export const QuickAccessSection: React.FC = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap size={24} />;
      case 'PlayCircle':
        return <PlayCircle size={24} />;
      case 'FileCheck':
        return <FileCheck size={24} />;
      case 'CheckSquare':
        return <CheckSquare size={24} />;
      case 'Award':
        return <Award size={24} />;
      default:
        return <GraduationCap size={24} />;
    }
  };

  return (
    <section className={styles.section} aria-labelledby="quick-access-heading">
      <Container size="wide">
        <SectionHeading
          eyebrow="Key Offerings"
          title="Direct Access to Learning Pillars"
          description="Everything you need for comprehensive JEE Main and JEE Advanced preparation, organized into five core learning modules."
          align="center"
        />

        <div className={styles.grid}>
          {QUICK_ACCESS_ITEMS.map((item) => (
            <Link key={item.id} to={item.route} className={styles.card}>
              <div className={styles.topRow}>
                <div className={styles.iconWrap}>
                  {getIcon(item.iconName)}
                </div>
                <span className={styles.badge}>{item.badge}</span>
              </div>

              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDesc}>{item.description}</p>

              <div className={styles.actionRow}>
                <span className={styles.actionText}>Access Module</span>
                <ArrowRight size={15} className={styles.actionIcon} />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
};
