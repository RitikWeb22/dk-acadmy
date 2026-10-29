import React, { useState, useMemo } from 'react';
import {
  Activity,
  CreditCard,
  Target,
  UserCheck,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import type { ActivityItem } from '../types';
import { Badge } from './Badge';
import styles from './ActivityFeed.module.scss';

interface ActivityFeedProps {
  items: ActivityItem[];
  onViewAll?: () => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ items, onViewAll }) => {
  const [filterType, setFilterType] = useState<'All' | 'test' | 'payment' | 'dpp'>('All');

  const filteredItems = useMemo(() => {
    if (filterType === 'All') return items;
    return items.filter((i) => i.type === filterType);
  }, [items, filterType]);

  const todayItems = filteredItems.filter((i) => i.group === 'Today');
  const yesterdayItems = filteredItems.filter((i) => i.group === 'Yesterday');

  const getTypeIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'test':
        return <Activity size={14} />;
      case 'payment':
        return <CreditCard size={14} />;
      case 'dpp':
        return <Target size={14} />;
      case 'lead':
        return <UserCheck size={14} />;
      default:
        return <Sparkles size={14} />;
    }
  };

  const getIconWrapClass = (type: ActivityItem['type']) => {
    switch (type) {
      case 'test':
        return styles.iconBlue;
      case 'payment':
        return styles.iconEmerald;
      case 'dpp':
        return styles.iconPurple;
      case 'lead':
        return styles.iconAmber;
      default:
        return styles.iconBlue;
    }
  };

  return (
    <div className={styles.feedCard}>
      {/* Header with Live Dot */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h2 className={styles.heading}>Recent Activity</h2>
          <span className={styles.liveBadge}>
            <span className={styles.pulseDot} />
            <span>Real-time</span>
          </span>
        </div>

        {/* Filter Pills */}
        <div className={styles.filterPillsRow}>
          <button
            type="button"
            className={`${styles.pillBtn} ${filterType === 'All' ? styles.pillActive : ''}`}
            onClick={() => setFilterType('All')}
          >
            All
          </button>
          <button
            type="button"
            className={`${styles.pillBtn} ${filterType === 'test' ? styles.pillActive : ''}`}
            onClick={() => setFilterType('test')}
          >
            Tests
          </button>
          <button
            type="button"
            className={`${styles.pillBtn} ${filterType === 'payment' ? styles.pillActive : ''}`}
            onClick={() => setFilterType('payment')}
          >
            Payments
          </button>
          <button
            type="button"
            className={`${styles.pillBtn} ${filterType === 'dpp' ? styles.pillActive : ''}`}
            onClick={() => setFilterType('dpp')}
          >
            DPP
          </button>
        </div>
      </div>

      {/* Feed List Container */}
      <div className={styles.feedScrollArea}>
        {/* Today Section */}
        {todayItems.length > 0 && (
          <div className={styles.groupBlock}>
            <div className={styles.groupHeader}>
              <Clock size={11} />
              <span>TODAY</span>
            </div>
            <div className={styles.itemsList}>
              {todayItems.map((item) => (
                <div
                  key={item.id}
                  className={styles.feedItem}
                  title={`Recorded: ${item.exactTimestamp}`}
                >
                  <div className={`${styles.iconWrap} ${getIconWrapClass(item.type)}`}>
                    {getTypeIcon(item.type)}
                  </div>

                  <div className={styles.contentCol}>
                    <div className={styles.topMeta}>
                      <span className={styles.studentName}>{item.studentName}</span>
                      <span className={styles.relativeTime} title={item.exactTimestamp}>
                        {item.relativeTime}
                      </span>
                    </div>

                    <p className={styles.actionParagraph}>
                      <span className={styles.actionWord}>{item.actionText}</span>{' '}
                      <strong className={styles.subjectTitle}>&ldquo;{item.subjectTitle}&rdquo;</strong>
                    </p>

                    <div className={styles.bottomPillsRow}>
                      <Badge variant={item.stateVariant}>{item.stateLabel}</Badge>
                      {item.metaNote && (
                        <span className={styles.metaNoteTag} title={item.metaNote}>
                          {item.metaNote}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Yesterday Section */}
        {yesterdayItems.length > 0 && (
          <div className={styles.groupBlock}>
            <div className={styles.groupHeader}>
              <Clock size={11} />
              <span>YESTERDAY</span>
            </div>
            <div className={styles.itemsList}>
              {yesterdayItems.map((item) => (
                <div
                  key={item.id}
                  className={styles.feedItem}
                  title={`Recorded: ${item.exactTimestamp}`}
                >
                  <div className={`${styles.iconWrap} ${getIconWrapClass(item.type)}`}>
                    {getTypeIcon(item.type)}
                  </div>

                  <div className={styles.contentCol}>
                    <div className={styles.topMeta}>
                      <span className={styles.studentName}>{item.studentName}</span>
                      <span className={styles.relativeTime} title={item.exactTimestamp}>
                        {item.relativeTime}
                      </span>
                    </div>

                    <p className={styles.actionParagraph}>
                      <span className={styles.actionWord}>{item.actionText}</span>{' '}
                      <strong className={styles.subjectTitle}>&ldquo;{item.subjectTitle}&rdquo;</strong>
                    </p>

                    <div className={styles.bottomPillsRow}>
                      <Badge variant={item.stateVariant}>{item.stateLabel}</Badge>
                      {item.metaNote && (
                        <span className={styles.metaNoteTag} title={item.metaNote}>
                          {item.metaNote}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className={styles.emptyFeed}>
            <span>No activity matches the selected filter.</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.feedFooter}>
        <span className={styles.footerTelemetry}>
          ● NTA CBT Telemetry Active • 34 Live Mocks
        </span>
        <button type="button" className={styles.viewAllLink} onClick={onViewAll}>
          <span>View all activity</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};
