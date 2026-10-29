import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight
} from 'lucide-react';
import styles from './ContinueLearningCard.module.scss';

export interface ContinueLearningItem {
  id: string;
  title: string;
  contextTitle: string;
  type: 'course' | 'dpp' | 'test';
  route: string;
  timestampText: string;
  progressPercent?: number;
  statusText?: string;
  isFirstMockPrompt?: boolean;
}

interface ContinueLearningCardProps {
  item?: ContinueLearningItem | null;
}

export const ContinueLearningCard: React.FC<ContinueLearningCardProps> = ({ item }) => {
  // If 0 mocks and no active session, show "Take your first mock test" as the hero (Rule 6)
  const isFirstMock = !item || item.isFirstMockPrompt;

  const displayTitle = isFirstMock
    ? 'JEE Main Full Syllabus Mock Test 1'
    : item.title;

  const displayContext = isFirstMock
    ? 'All India CBT Simulation • 75 Questions • 300 Marks • Physics, Chemistry & Math'
    : `${item.contextTitle} • ${item.statusText || item.timestampText}`;

  const buttonText = isFirstMock
    ? 'Take Your First Mock Test'
    : item.type === 'dpp'
    ? 'Resume DPP Practice'
    : item.type === 'test'
    ? 'Resume Mock Test'
    : 'Resume Batch Curriculum';

  const destinationRoute = isFirstMock ? '/test-series' : item.route;
  const progress = item && typeof item.progressPercent === 'number' ? item.progressPercent : null;

  return (
    <section className={styles.heroCard} aria-labelledby="continue-learning-title">
      <div className={styles.heroContent}>
        <div className={styles.eyebrow}>
          <Sparkles size={14} className={styles.eyebrowIcon} aria-hidden="true" />
          <span>{isFirstMock ? 'RECOMMENDED FIRST STEP' : 'CONTINUE WHERE YOU LEFT OFF'}</span>
        </div>

        <h2 id="continue-learning-title" className={styles.title}>
          {displayTitle}
        </h2>

        <p className={styles.contextText}>{displayContext}</p>

        {progress !== null && (
          <div className={styles.progressContainer}>
            <div
              className={styles.progressBarTrack}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${displayTitle} progress: ${progress}%`}
            >
              <div className={styles.progressBarFill} style={{ width: `${progress}%` }} />
            </div>
            <span className={styles.progressLabel}>{progress}% completed</span>
          </div>
        )}
      </div>

      <div className={styles.heroAction}>
        <Link to={destinationRoute} className={styles.primaryHeroBtn}>
          <span>{buttonText}</span>
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
};
