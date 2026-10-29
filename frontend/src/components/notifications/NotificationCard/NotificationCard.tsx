import React from 'react';
import type { AppNotification } from '../../../types';
import {
  Bell,
  BookOpen,
  Award,
  Megaphone,
  Check,
  RotateCcw,
  Trash2,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import styles from './NotificationCard.module.scss';

interface NotificationCardProps {
  notification: AppNotification;
  searchQuery?: string;
  onToggleRead: (id: string, currentRead: boolean) => void;
  onDelete: (id: string) => void;
  onOpen: (notification: AppNotification) => void;
}

// Relative time formatting helper
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric' }).format(new Date(timestamp));
}

// Full exact time tooltip helper
function formatExactTime(timestamp: number): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(new Date(timestamp));
}

// Search text highlight helper
const HighlightText: React.FC<{ text: string; query?: string }> = ({ text, query }) => {
  if (!query || !query.trim()) return <>{text}</>;
  const cleanQ = query.trim();
  const escaped = cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === cleanQ.toLowerCase() ? (
          <mark key={i} className={styles.highlight}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  searchQuery,
  onToggleRead,
  onDelete,
  onOpen
}) => {
  // Category specific icon & styling
  const getCategoryDetails = () => {
    switch (notification.category) {
      case 'announcement':
        return {
          icon: <Megaphone size={18} aria-hidden="true" />,
          styleClass: styles.catAnnouncement
        };
      case 'course':
        return {
          icon: <BookOpen size={18} aria-hidden="true" />,
          styleClass: styles.catCourse
        };
      case 'practice_test':
        return {
          icon: <Award size={18} aria-hidden="true" />,
          styleClass: styles.catPractice
        };
      default:
        return {
          icon: <Bell size={18} aria-hidden="true" />,
          styleClass: styles.catGeneral
        };
    }
  };

  const cat = getCategoryDetails();

  // Check if item is time-sensitive (live classes, CBT test registrations)
  const isTimeSensitive =
    notification.tag?.toLowerCase().includes('live') ||
    notification.tag?.toLowerCase().includes('mock test') ||
    notification.tag?.toLowerCase().includes('cbt') ||
    notification.urgency === 'high';

  const getTimeSensitiveButtonText = () => {
    if (notification.tag?.toLowerCase().includes('live')) return 'Register';
    if (notification.tag?.toLowerCase().includes('mock') || notification.tag?.toLowerCase().includes('cbt')) return 'Register';
    if (notification.tag?.toLowerCase().includes('dpp')) return 'Start DPP';
    return 'View Schedule';
  };

  const handleCardClick = () => {
    onOpen(notification);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(notification);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onDelete(notification.id);
    }
  };

  const handleToggleReadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleRead(notification.id, notification.read);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  const handleActionBtnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpen(notification);
  };

  const exactTimeText = formatExactTime(notification.timestamp);
  const relativeTimeText = formatTimeAgo(notification.timestamp);

  return (
    <article
      tabIndex={0}
      role="link"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={`${styles.card} ${!notification.read ? styles.unread : ''}`}
      aria-label={`${!notification.read ? 'Unread notification: ' : 'Notification: '}${notification.title}`}
    >
      {/* 1. Category Icon Box (40px) */}
      <div className={`${styles.iconTile} ${cat.styleClass}`}>
        {cat.icon}
      </div>

      {/* 2. Main Content: Title with unread dot, clamped description, ONE chip */}
      <div className={styles.contentCol}>
        <div className={styles.titleRow}>
          {!notification.read && (
            <>
              <span className="sr-only">Unread notification: </span>
              <span className={styles.unreadDot} aria-hidden="true" />
            </>
          )}
          <h3 className={styles.title}>
            <HighlightText text={notification.title} query={searchQuery} />
          </h3>
        </div>

        <p className={styles.description}>
          <HighlightText text={notification.message} query={searchQuery} />
        </p>

        {/* ONE chip: Subtype (Rule 1) */}
        {notification.tag && (
          <div className={styles.chipRow}>
            <span className={styles.subtypeChip}>
              <HighlightText text={notification.tag} query={searchQuery} />
            </span>
          </div>
        )}
      </div>

      {/* 3. Time + Actions */}
      <div className={styles.rightCol}>
        <div className={styles.topRightRow}>
          <time
            dateTime={new Date(notification.timestamp).toISOString()}
            title={exactTimeText}
            className={styles.timestamp}
          >
            <Clock size={13} aria-hidden="true" />
            <span>{relativeTimeText}</span>
          </time>

          <div className={styles.iconActions}>
            <button
              type="button"
              onClick={handleToggleReadClick}
              className={styles.iconBtn}
              title={notification.read ? 'Mark as unread' : 'Mark as read'}
              aria-label={notification.read ? 'Mark as unread' : 'Mark as read'}
            >
              {notification.read ? (
                <RotateCcw size={16} aria-hidden="true" />
              ) : (
                <Check size={16} aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={handleDeleteClick}
              className={`${styles.iconBtn} ${styles.deleteBtn}`}
              title="Delete notification"
              aria-label="Delete notification"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Optional Time-Sensitive CTA Button */}
        {isTimeSensitive && (
          <div className={styles.ctaRow}>
            <button
              type="button"
              onClick={handleActionBtnClick}
              className={styles.timeSensitiveBtn}
              aria-label={`${getTimeSensitiveButtonText()} for ${notification.title}`}
            >
              <span>{getTimeSensitiveButtonText()}</span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
};
