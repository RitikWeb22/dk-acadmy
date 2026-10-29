import { Search, BookOpen, PenTool, BarChart3 } from 'lucide-react';
import { Container } from '../ui/Container/Container';
import { SectionHeading } from '../ui/SectionHeading/SectionHeading';
import { LEARNING_JOURNEY } from '../../data/homepageData';
import styles from './LearningJourneySection.module.scss';

export const LearningJourneySection: React.FC = () => {
  const getStepIcon = (name: string) => {
    switch (name) {
      case 'Search':
        return <Search size={22} />;
      case 'BookOpen':
        return <BookOpen size={22} />;
      case 'PenTool':
        return <PenTool size={22} />;
      case 'BarChart3':
        return <BarChart3 size={22} />;
      default:
        return <Search size={22} />;
    }
  };

  return (
    <section className={styles.section} aria-labelledby="journey-heading">
      <Container size="wide">
        <SectionHeading
          eyebrow="Study Workflow"
          title="How It Works: Your 4-Step Daily Routine"
          description="A systematic method designed to turn high-school physics, chemistry, and mathematics into intuitive competitive exam instincts."
          align="center"
        />

        <div className={styles.stepsContainer}>
          <div className={styles.connectorLine} aria-hidden="true" />

          <div className={styles.grid}>
            {LEARNING_JOURNEY.map((step) => (
              <div key={step.stepNumber} className={styles.stepCard}>
                <div className={styles.stepNumberBadge}>
                  0{step.stepNumber}
                </div>

                <div className={styles.iconCircle}>
                  {getStepIcon(step.iconName)}
                </div>

                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
