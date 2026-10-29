import React from 'react';
import { Link } from 'react-router-dom';
import type { DPPAttempt, DPPSet } from '../../../types';
import {
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import styles from './DPPOverview.module.scss';

interface DPPOverviewProps {
  attempts: Record<string, DPPAttempt>;
  allSets: DPPSet[];
}

export const DPPOverview: React.FC<DPPOverviewProps> = ({ attempts, allSets }) => {
  // Extract attempted DPP sets
  const attemptedEntries = Object.entries(attempts).filter(([_, att]) => att.status !== 'Not Started');
  const completedAttempts = attemptedEntries.filter(([_, att]) => att.isSubmitted || att.status === 'Completed');
  const inProgressAttempts = attemptedEntries.filter(([_, att]) => !att.isSubmitted && att.status === 'In Progress');

  // Total questions answered across all attempts
  const totalQuestionsAnswered = attemptedEntries.reduce((total, [_, att]) => {
    return total + Object.values(att.responses || {}).filter((r) => r.selectedOption).length;
  }, 0);

  // Recent 3 attempts with matching set data
  const recentAttemptItems = attemptedEntries.slice(0, 3).map(([setId, att]) => {
    const set = allSets.find((s) => s.id === setId);
    const questionsAnswered = Object.values(att.responses || {}).filter((r) => r.selectedOption).length;
    const totalQuestions = set ? set.questions.length : 10;
    return {
      setId,
      title: set ? set.title : setId,
      subject: set ? set.subject : 'General',
      chapter: set ? set.chapter : 'Daily Practice',
      isCompleted: att.isSubmitted || att.status === 'Completed',
      questionsAnswered,
      totalQuestions
    };
  });

  return (
    <section className={styles.section} aria-labelledby="dpp-overview-title">
      <div className={styles.sectionHeader}>
        <div className={styles.titleGroup}>
          <div className={styles.iconBox}>
            <FileText size={18} />
          </div>
          <h2 id="dpp-overview-title" className={styles.sectionTitle}>
            Daily Practice Problems (DPP)
          </h2>
          <span className={styles.availableBadge}>{allSets.length} Sets Available</span>
        </div>
        <Link to="/dpp" className={styles.viewAllLink}>
          <span>Open DPP Engine</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Metrics Row */}
      <div className={styles.metricsRow}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Completed Sets</span>
          <span className={styles.metricVal}>{completedAttempts.length}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>In Progress</span>
          <span className={styles.metricVal}>{inProgressAttempts.length}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Problems Solved</span>
          <span className={styles.metricVal}>{totalQuestionsAnswered}</span>
        </div>
      </div>

      {attemptedEntries.length === 0 ? (
        <div className={styles.emptyCard}>
          <div className={styles.emptyIconBox}>
            <Clock size={20} />
          </div>
          <div className={styles.emptyTextGroup}>
            <div className={styles.emptyHeading}>No practice attempts logged yet</div>
            <p className={styles.emptySubtext}>
              Sharpen your speed with curated 10-problem sheets covering Physics, Chemistry, and Mathematics with instant hints.
            </p>
          </div>
          <Link to="/dpp" className={styles.actionBtn}>
            <span>Start First DPP</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className={styles.recentList}>
          {recentAttemptItems.map((item) => (
            <div key={item.setId} className={styles.recentItem}>
              <div className={styles.itemLeft}>
                <span className={item.isCompleted ? styles.statusIconDone : styles.statusIconProg}>
                  {item.isCompleted ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                </span>
                <div className={styles.itemInfo}>
                  <div className={styles.itemTitle}>{item.title}</div>
                  <div className={styles.itemSub}>{item.subject} • {item.chapter}</div>
                </div>
              </div>
              <div className={styles.itemRight}>
                <span className={styles.scorePill}>
                  {item.questionsAnswered}/{item.totalQuestions} Questions
                </span>
                <Link to="/dpp" className={styles.continueLink}>
                  {item.isCompleted ? 'Review' : 'Continue'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
