import React from 'react';
import {
  BellOff,
  CheckCircle2,
  SearchX,
  Megaphone,
  BookOpen,
  Award,
  RotateCcw
} from 'lucide-react';
import styles from './NotificationEmptyState.module.scss';

interface NotificationEmptyStateProps {
  type: 'all_empty' | 'unread_empty' | 'search_empty' | 'announcement_empty' | 'course_empty' | 'practice_test_empty';
  searchQuery?: string;
  onClearFilters?: () => void;
}

export const NotificationEmptyState: React.FC<NotificationEmptyStateProps> = ({
  type,
  searchQuery,
  onClearFilters
}) => {
  if (type === 'search_empty') {
    return (
      <div className={styles.emptyContainer} role="status">
        <div className={styles.iconCircle}>
          <SearchX size={32} aria-hidden="true" />
        </div>
        <h3 className={styles.title}>No matching notifications found</h3>
        <p className={styles.desc}>
          We couldn't find any announcements matching <strong>"{searchQuery}"</strong>. Try checking your spelling or clearing filters.
        </p>
        {onClearFilters && (
          <button type="button" onClick={onClearFilters} className={styles.actionBtn}>
            <RotateCcw size={15} aria-hidden="true" />
            <span>Clear Search &amp; Filters</span>
          </button>
        )}
      </div>
    );
  }

  if (type === 'unread_empty') {
    return (
      <div className={styles.emptyContainer} role="status">
        <div className={`${styles.iconCircle} ${styles.successIcon}`}>
          <CheckCircle2 size={32} aria-hidden="true" />
        </div>
        <h3 className={styles.title}>You're completely caught up!</h3>
        <p className={styles.desc}>
          No unread notifications right now. Check back later for live masterclass schedules, CBT test alerts, and daily DPP sheets.
        </p>
        {onClearFilters && (
          <button type="button" onClick={onClearFilters} className={styles.actionBtn}>
            <span>View All Notifications</span>
          </button>
        )}
      </div>
    );
  }

  if (type === 'announcement_empty') {
    return (
      <div className={styles.emptyContainer} role="status">
        <div className={styles.iconCircle}>
          <Megaphone size={32} aria-hidden="true" />
        </div>
        <h3 className={styles.title}>No active announcements</h3>
        <p className={styles.desc}>
          There are no general announcements or center updates published at this moment.
        </p>
        {onClearFilters && (
          <button type="button" onClick={onClearFilters} className={styles.actionBtn}>
            <span>View All Notifications</span>
          </button>
        )}
      </div>
    );
  }

  if (type === 'course_empty') {
    return (
      <div className={styles.emptyContainer} role="status">
        <div className={styles.iconCircle}>
          <BookOpen size={32} aria-hidden="true" />
        </div>
        <h3 className={styles.title}>No course updates found</h3>
        <p className={styles.desc}>
          No new batch notes, lecture handouts, or video solutions published recently.
        </p>
        {onClearFilters && (
          <button type="button" onClick={onClearFilters} className={styles.actionBtn}>
            <span>View All Notifications</span>
          </button>
        )}
      </div>
    );
  }

  if (type === 'practice_test_empty') {
    return (
      <div className={styles.emptyContainer} role="status">
        <div className={styles.iconCircle}>
          <Award size={32} aria-hidden="true" />
        </div>
        <h3 className={styles.title}>No test or practice alerts</h3>
        <p className={styles.desc}>
          No upcoming mock test registrations or new DPP problem sets in this view.
        </p>
        {onClearFilters && (
          <button type="button" onClick={onClearFilters} className={styles.actionBtn}>
            <span>View All Notifications</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.emptyContainer} role="status">
      <div className={styles.iconCircle}>
        <BellOff size={32} aria-hidden="true" />
      </div>
      <h3 className={styles.title}>No notifications to display</h3>
      <p className={styles.desc}>
        You're all caught up! When DK Sir schedules live classes or releases tests, they'll appear here.
      </p>
    </div>
  );
};
