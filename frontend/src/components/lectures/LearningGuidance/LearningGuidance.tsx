import React from 'react';
import { Video, FileText, CheckSquare, Target } from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import styles from './LearningGuidance.module.scss';

const STEPS = [
  {
    icon: <Video size={22} />,
    stepNum: '01',
    title: 'Watch the Concept Lesson',
    description: 'Focus on mathematical derivations, physical significance, and model problems without speed acceleration or distraction.'
  },
  {
    icon: <FileText size={22} />,
    stepNum: '02',
    title: 'Revise Important Notes',
    description: 'Download the accompanying lecture notes, verify standard formulas, and log tricky edge cases into your formula diary.'
  },
  {
    icon: <Target size={22} />,
    stepNum: '03',
    title: 'Practice Related PYQs',
    description: 'Attempt chapter-wise JEE Main and Advanced previous year questions to benchmark your understanding against official questions.'
  },
  {
    icon: <CheckSquare size={22} />,
    stepNum: '04',
    title: 'Reinforce Learning with DPPs',
    description: 'Complete the graded 15-question Daily Practice Problem sheet to eliminate calculation pitfalls and build speed.'
  }
];

export const LearningGuidance: React.FC = () => {
  return (
    <section className={styles.section} aria-labelledby="learning-guidance-title">
      <Container size="wide">
        <div className={styles.wrapper}>
          <div className={styles.header}>
            <span className={styles.eyebrow}>Effective Study Method</span>
            <h2 id="learning-guidance-title" className={styles.title}>
              Make the Most of Every Lecture
            </h2>
            <p className={styles.subtitle}>
              Passive watching produces short-term familiarity. Follow this 4-step disciplined loop to convert concepts into exam-day problem solving.
            </p>
          </div>

          <div className={styles.grid}>
            {STEPS.map((step) => (
              <div key={step.stepNum} className={styles.card}>
                <div className={styles.topRow}>
                  <div className={styles.iconWrap}>{step.icon}</div>
                  <span className={styles.numBadge}>{step.stepNum}</span>
                </div>
                <h3 className={styles.cardTitle}>{step.title}</h3>
                <p className={styles.cardDesc}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
