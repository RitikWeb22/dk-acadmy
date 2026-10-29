import React from 'react';
import { Clock, HelpCircle, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import type { DPPSet, DPPAttempt } from '../../../types';
import { Badge } from '../../ui/Badge/Badge';
import styles from './DPPSetCard.module.scss';

interface DPPSetCardProps {
  set: DPPSet;
  attempt?: DPPAttempt;
  onStartPractice: (setId: string) => void;
  onReviewPractice: (setId: string) => void;
}

export const DPPSetCard: React.FC<DPPSetCardProps> = ({
  set,
  attempt,
  onStartPractice,
  onReviewPractice,
}) => {
  const status = attempt ? attempt.status : 'Not Started';
  const totalQuestions = set.questions.length;

  // Calculate quick score if completed
  let correctCount = 0;
  let answeredCount = 0;
  if (attempt) {
    answeredCount = Object.keys(attempt.responses).filter(
      (qId) => Boolean(attempt.responses[qId]?.selectedOption)
    ).length;

    set.questions.forEach((q) => {
      const resp = attempt.responses[q.id];
      if (resp && resp.selectedOption === q.correctAnswer) {
        correctCount += 1;
      }
    });
  }

  // Difficulty badge variant mapping
  const getDifficultyBadge = (diff: DPPSet['difficulty']) => {
    switch (diff) {
      case 'Easy':
        return <Badge variant="accent" size="sm">{diff}</Badge>;
      case 'Medium':
        return <Badge variant="warning" size="sm">{diff}</Badge>;
      case 'Hard':
        return <Badge variant="primary" size="sm">{diff}</Badge>;
      default:
        return <Badge variant="muted" size="sm">{diff}</Badge>;
    }
  };

  // Status badge styling
  const renderStatusBadge = () => {
    switch (status) {
      case 'Completed':
        return (
          <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>
            <CheckCircle2 size={12} />
            <span>Completed ({correctCount}/{totalQuestions})</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className={`${styles.statusBadge} ${styles.statusProgress}`}>
            <span className={styles.dot} />
            <span>In Progress ({answeredCount}/{totalQuestions})</span>
          </span>
        );
      default:
        return (
          <span className={`${styles.statusBadge} ${styles.statusNotStarted}`}>
            <span>Not Started</span>
          </span>
        );
    }
  };

  return (
    <div className={styles.card}>
      {/* Top Header */}
      <div className={styles.header}>
        <div className={styles.badges}>
          <span className={`${styles.subjectBadge} ${styles[set.subject.toLowerCase()]}`}>
            {set.subject}
          </span>
          {getDifficultyBadge(set.difficulty)}
        </div>
        {renderStatusBadge()}
      </div>

      {/* Main Info */}
      <div className={styles.content}>
        <h3 className={styles.title}>{set.title}</h3>
        <p className={styles.chapter}>
          <strong className={styles.chapterLabel}>Chapter:</strong> {set.chapter}
        </p>
        <p className={styles.topic}>
          <span className={styles.topicLabel}>Focus:</span> {set.topic}
        </p>
      </div>

      {/* Footer & Metadata */}
      <div className={styles.footer}>
        <div className={styles.metaRow}>
          <div className={styles.metaItem}>
            <HelpCircle size={14} className={styles.metaIcon} />
            <span>{totalQuestions} Problems</span>
          </div>
          <div className={styles.metaItem}>
            <Clock size={14} className={styles.metaIcon} />
            <span>{set.estimatedMinutes} mins</span>
          </div>
        </div>

        {/* Action Button */}
        {status === 'Completed' ? (
          <div className={styles.actionButtonGroup}>
            <button
              type="button"
              className={styles.reviewBtn}
              onClick={() => onReviewPractice(set.id)}
            >
              <span>Review Solutions</span>
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              className={styles.retakeBtn}
              onClick={() => onStartPractice(set.id)}
              title="Practice this set again"
              aria-label={`Retake practice for ${set.title}`}
            >
              <RotateCcw size={14} />
              <span>Retake</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`${styles.primaryActionBtn} ${status === 'In Progress' ? styles.inProgressBtn : ''}`}
            onClick={() => onStartPractice(set.id)}
          >
            <span>{status === 'In Progress' ? 'Continue Practice' : 'Start Practice'}</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
