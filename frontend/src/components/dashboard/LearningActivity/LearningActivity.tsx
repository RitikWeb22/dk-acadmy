import React from 'react';
import { Link } from 'react-router-dom';
import type { LearningActivityEvent } from '../../../types';
import {
  FileText,
  ClipboardCheck,
  BookOpen,
  Video,
  Clock,
  ArrowRight
} from 'lucide-react';
import styles from './LearningActivity.module.scss';

import { useStudentAuth } from '../../../context/AuthContext';

interface LearningActivityProps {
  events: LearningActivityEvent[];
  excludeTitle?: string;
}

export const LearningActivity: React.FC<LearningActivityProps> = ({ events, excludeTitle }) => {
  const { student } = useStudentAuth();
  const isDemo = student?.id === 'std_demo_2026';

  const formatTime = (ts: number) => {
    const diffMs = Date.now() - ts;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric' }).format(new Date(ts));
  };

  const getEventIcon = (type: LearningActivityEvent['type']) => {
    switch (type) {
      case 'test_submission':
        return <ClipboardCheck size={16} aria-hidden="true" />;
      case 'dpp_attempt':
        return <FileText size={16} aria-hidden="true" />;
      case 'course_enrolled':
        return <BookOpen size={16} aria-hidden="true" />;
      case 'lecture_watched':
        return <Video size={16} aria-hidden="true" />;
      default:
        return <Clock size={16} aria-hidden="true" />;
    }
  };

  // Provide realistic default activity items if events array is sparse
  const sampleEvents: LearningActivityEvent[] = [
    {
      id: 'act-sample-1',
      type: 'test_submission',
      title: 'Attempted JEE Main Part Test: Mechanics',
      subtitle: 'JEE Main • 4 questions attempted',
      timestamp: Date.now() - 1000 * 60 * 60 * 4, // 4h ago
      route: '/test-series',
      score: '0/24 Attempted',
      badgeText: '0/24 Attempted'
    },
    {
      id: 'act-sample-2',
      type: 'dpp_attempt',
      title: 'Completed DPP #41: Definite Integrals',
      subtitle: 'Mathematics • 4 questions solved',
      timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1d ago
      route: '/dpp',
      score: 'Score: 4/4',
      badgeText: 'Score: 4/4'
    },
    {
      id: 'act-sample-3',
      type: 'course_enrolled',
      title: 'Enrolled in Ultimate 2-Year Live Classroom',
      subtitle: 'Target JEE 2028 • Class 11th',
      timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3d ago
      route: '/learn/jee-main-advanced-2yr-ultimate',
      score: 'Curriculum Active',
      badgeText: 'Curriculum Active'
    }
  ];

  const sourceEvents = events && events.length > 0 ? events : isDemo ? sampleEvents : [];

  const filteredEvents = sourceEvents
    .filter((evt) => !excludeTitle || !evt.title.toLowerCase().includes(excludeTitle.toLowerCase()))
    .slice(0, 3);

  return (
    <section className={styles.card} aria-labelledby="recent-activity-title">
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <h2 id="recent-activity-title" className={styles.title}>
            Recent Activity Log
          </h2>
          <span className={styles.subtitle}>Your latest test and practice timeline</span>
        </div>
        <Link to="/test-series" className={styles.viewAllLink}>
          <span>View Full Activity History →</span>
        </Link>
      </div>

      {filteredEvents.length === 0 ? (
        <div style={{ padding: '28px 16px', textAlign: 'center', color: '#64748b' }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem' }}>
            No activity recorded yet. Start your JEE journey by solving today's DPP or taking a diagnostic mock test.
          </p>
          <Link
            to="/dpp"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            <span>Solve Daily Practice DPP</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className={styles.timeline}>
        {filteredEvents.map((evt, index) => {
          const isLast = index === filteredEvents.length - 1;
          const isEmerald = evt.score?.includes('4/4') || evt.badgeText?.toLowerCase().includes('completed') || evt.score?.includes('Evaluated');
          const isAmber = evt.score?.includes('0/24') || evt.score?.includes('Attempted') || evt.badgeText?.toLowerCase().includes('in progress');

          return (
            <div key={evt.id} className={styles.timelineItem}>
              {/* Vertical timeline node & connecting line */}
              <div className={styles.nodeColumn}>
                <div
                  className={`${styles.iconNode} ${
                    isEmerald ? styles.emeraldNode : isAmber ? styles.amberNode : styles.blueNode
                  }`}
                >
                  {getEventIcon(evt.type)}
                </div>
                {!isLast && <div className={styles.connectingLine} />}
              </div>

              {/* Item Content */}
              <div className={styles.itemContent}>
                <div className={styles.rowTop}>
                  <Link to={evt.route} className={styles.eventTitle}>
                    {evt.title}
                  </Link>
                  <span className={styles.timeChip}>{formatTime(evt.timestamp)}</span>
                </div>

                <div className={styles.rowBottom}>
                  <span className={styles.subtitleText}>{evt.subtitle}</span>
                  {evt.score && (
                    <span
                      className={`${styles.resultPill} ${
                        isEmerald
                          ? styles.emeraldPill
                          : isAmber
                          ? styles.amberPill
                          : styles.bluePill
                      }`}
                    >
                      {evt.score}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </section>
  );
};

export default LearningActivity;
