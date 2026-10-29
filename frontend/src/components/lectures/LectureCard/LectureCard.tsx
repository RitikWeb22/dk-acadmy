import React from 'react';
import { Play, Clock, BookOpen, User, ArrowRight, Lock, Sparkles } from 'lucide-react';
import type { Lecture } from '../../../types';
import { Badge } from '../../ui/Badge/Badge';
import styles from './LectureCard.module.scss';

interface LectureCardProps {
  lecture: Lecture;
  onSelectLecture?: (lecture: Lecture) => void;
}

export const LectureCard: React.FC<LectureCardProps> = ({ lecture, onSelectLecture }) => {
  const isPaid = Boolean(lecture.isPaid);

  const getSubjectBadgeVariant = (subject: string) => {
    switch (subject) {
      case 'Physics':
        return 'primary';
      case 'Chemistry':
        return 'accent';
      case 'Mathematics':
        return 'warning';
      default:
        return 'muted';
    }
  };

  const handleClick = () => {
    if (onSelectLecture) {
      onSelectLecture(lecture);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <article
      className={`${styles.card} ${lecture.isFeatured ? styles.featuredCard : ''} ${isPaid ? styles.paidCard : styles.freeCard}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={isPaid ? `Unlock paid lecture: ${lecture.title}` : `Watch free lecture: ${lecture.title}`}
    >
      <div className={styles.thumbnailWrapper}>
        <div className={`${styles.gradientBg} ${styles[lecture.subject.toLowerCase()]} ${isPaid ? styles.lockedBg : ''}`}>
          <div className={styles.watermarkText}>{lecture.subject.slice(0, 3).toUpperCase()}</div>

          <div className={`${styles.playButton} ${isPaid ? styles.lockButton : ''}`} aria-hidden="true">
            {isPaid ? <Lock size={20} /> : <Play size={20} fill="currentColor" />}
          </div>
        </div>

        <div className={styles.durationPill}>
          <Clock size={12} />
          <span>{lecture.duration}</span>
        </div>

        {/* Access Status Pill (Free Demo vs Course Enrolled) */}
        {isPaid ? (
          <div className={styles.paidBadge}>
            <Lock size={12} />
            <span>ENROLLED BATCH</span>
          </div>
        ) : (
          <div className={styles.freeBadge}>
            <Sparkles size={12} />
            <span>100% FREE DEMO</span>
          </div>
        )}

        {lecture.isFeatured && !isPaid && (
          <div className={styles.featuredBadge}>FEATURED</div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.tagsRow}>
          <Badge variant={getSubjectBadgeVariant(lecture.subject)} size="sm">
            {lecture.subject}
          </Badge>
          <span className={styles.chapterName}>
            <BookOpen size={13} className={styles.iconInline} />
            {lecture.chapter}
          </span>
        </div>

        <h3 className={styles.title}>{lecture.title}</h3>
        <p className={styles.description}>{lecture.description}</p>

        <div className={styles.footerRow}>
          <span className={styles.instructorTag}>
            <User size={13} className={styles.iconInline} />
            {lecture.instructor}
          </span>
          <span className={styles.levelBadge}>{lecture.level}</span>
        </div>

        <div className={`${styles.watchActionRow} ${isPaid ? styles.lockedActionRow : styles.freeActionRow}`}>
          {isPaid ? (
            <>
              <Lock size={14} className={styles.actionLockIcon} />
              <span className={styles.watchLabel}>Unlock with Course</span>
              <ArrowRight size={14} className={styles.watchArrow} />
            </>
          ) : (
            <>
              <span className={styles.watchLabel}>Watch Free Lecture</span>
              <ArrowRight size={15} className={styles.watchArrow} />
            </>
          )}
        </div>
      </div>
    </article>
  );
};
