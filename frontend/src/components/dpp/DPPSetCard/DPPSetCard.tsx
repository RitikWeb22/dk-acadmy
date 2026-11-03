import React, { useState, useEffect, useMemo } from 'react';
import { Clock, HelpCircle, ArrowRight, CheckCircle2, RotateCcw, FileText, Download } from 'lucide-react';
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

  const [nowTime, setNowTime] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const countdown = useMemo(() => {
    const schedDate = (set as any).scheduledDate;
    if ((set as any).status !== 'Scheduled' || !schedDate) return null;
    const target = new Date(schedDate).getTime();
    if (isNaN(target)) return null;
    const diff = target - nowTime;
    if (diff <= 0) return null;
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    return `${d > 0 ? `${d}d ` : ''}${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  }, [set, nowTime]);

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
        {countdown ? (
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#7c3aed', background: '#faf5ff', border: '1px solid #ddd6fe', padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={11} />
            <span>Opens in {countdown}</span>
          </span>
        ) : (
          renderStatusBadge()
        )}
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

        {/* Authentic Kota DPP PDF Download Button */}
        {set.pdfUrl && (
          <a
            href={set.pdfUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className={styles.pdfDownloadPill}
            onClick={(e) => e.stopPropagation()}
            title="Download authentic Kota DPP problem sheet PDF"
          >
            <FileText size={14} />
            <span>Download DPP Sheet (PDF)</span>
            <Download size={13} />
          </a>
        )}

        {/* Action Button */}
        {countdown ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#7c3aed', background: '#ede9fe', padding: '10px 14px', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
            <Clock size={14} />
            <span>Opens {new Date((set as any).scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          </span>
        ) : status === 'Completed' ? (
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
