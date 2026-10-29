import React, { useState } from 'react';
import { Play, Star, CheckCircle, Lightbulb, X } from 'lucide-react';
import type { SuccessStoryItem } from '../../../types';
import styles from './SuccessStoriesCarousel.module.scss';

interface SuccessStoryCardProps {
  story: SuccessStoryItem;
}

export const SuccessStoryCard: React.FC<SuccessStoryCardProps> = ({ story }) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <article className={styles.card} aria-label={`Success Story: ${story.name}`}>
        <div className={styles.mediaWrapper}>
          <img
            src={story.image}
            alt={story.name}
            className={styles.storyImg}
            loading="lazy"
          />
          <div className={styles.overlayGrad} />

          <button
            type="button"
            className={styles.watchBtn}
            onClick={() => setModalOpen(true)}
            aria-label={`Read ${story.name}'s full preparation journey`}
          >
            <Play size={14} fill="#ffffff" />
            <span>Read Journey</span>
          </button>

          <span className={styles.durationBadge}>{story.videoDuration}</span>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.studentMeta}>
            <div>
              <h3 className={styles.studentName}>{story.name}</h3>
              <p className={styles.collegeTag}>{story.college}</p>
            </div>
            <div className={styles.starsRow} aria-label="5 out of 5 stars">
              {[...Array(story.rating)].map((_, i) => (
                <Star key={i} size={14} fill="#eab308" />
              ))}
            </div>
          </div>

          <div className={styles.achievementBadge}>
            <CheckCircle size={13} />
            <span>{story.achievement}</span>
          </div>

          <p className={styles.quoteText}>"{story.quote}"</p>

          <div className={styles.takeawayFooter}>
            <Lightbulb size={13} color="#2563eb" />
            <span>Key focus: {story.keyTakeaway}</span>
          </div>
        </div>
      </article>

      {/* Story Details Modal */}
      {modalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`story-title-${story.id}`}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setModalOpen(false)}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            <div className={styles.studentMeta}>
              <div>
                <h3 id={`story-title-${story.id}`} className={styles.studentName}>
                  {story.name}'s Preparation Roadmap
                </h3>
                <p className={styles.collegeTag}>{story.college}</p>
              </div>
            </div>

            <div className={styles.achievementBadge}>
              <CheckCircle size={14} />
              <span>{story.achievement}</span>
            </div>

            <p className={styles.quoteText} style={{ fontStyle: 'normal' }}>
              "{story.quote}"
            </p>

            <div className={styles.takeawayFooter} style={{ border: 'none', background: '#eff6ff', padding: '10px 14px', borderRadius: '8px' }}>
              <Lightbulb size={16} color="#2563eb" />
              <span><strong>Strategy:</strong> {story.keyTakeaway}. Recommended for students targeting JEE Main & Advanced with daily disciplined problem solving.</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
