import React from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  CheckSquare,
  FileCheck,
  PlayCircle,
  Award,
  Layers,
  BookOpen,
  Compass,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { SectionHeading } from '../../ui/SectionHeading/SectionHeading';
import { LEARNING_FEATURE_CHIPS } from '../../../data/homepageRedesignData';
import styles from './LearningFeatures.module.scss';

export const LearningFeatures: React.FC = () => {
  const getFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'Video':
        return <Video size={20} />;
      case 'CheckSquare':
        return <CheckSquare size={20} />;
      case 'FileCheck':
        return <FileCheck size={20} />;
      case 'PlayCircle':
        return <PlayCircle size={20} />;
      case 'Award':
        return <Award size={20} />;
      case 'Layers':
        return <Layers size={20} />;
      case 'BookOpen':
        return <BookOpen size={20} />;
      case 'Compass':
        return <Compass size={20} />;
      case 'BarChart3':
      default:
        return <BarChart3 size={20} />;
    }
  };

  return (
    <section className={styles.section} aria-labelledby="learning-features-heading">
      <Container size="wide">
        <SectionHeading
          eyebrow="Ecosystem Capabilities"
          title="Learn Better with DK Academy"
          description="Everything you need to eliminate doubts, reinforce core concepts, and build exam-day accuracy in one connected ecosystem."
          align="center"
        />

        <div className={styles.chipsGrid}>
          {LEARNING_FEATURE_CHIPS.map((chip) => (
            <Link
              key={chip.id}
              to={chip.route}
              className={styles.chipCard}
              aria-label={`${chip.title}: ${chip.description}`}
            >
              <div className={styles.iconBox}>
                {getFeatureIcon(chip.iconName)}
              </div>

              <div className={styles.chipInfo}>
                <span className={styles.chipTitle}>{chip.title}</span>
                <span className={styles.chipDescription}>{chip.description}</span>
              </div>

              <ChevronRight size={18} className={styles.arrowIcon} />
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
};
