import React, { useEffect } from 'react';
import { X, ExternalLink, Download, FileText, CheckCircle2 } from 'lucide-react';
import { YoutubeIcon } from '../../ui/YoutubeIcon/YoutubeIcon';
import type { PYQQuestion } from '../../../types';
import styles from './PYQVideoModal.module.scss';

interface PYQVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: PYQQuestion | null;
}

export const PYQVideoModal: React.FC<PYQVideoModalProps> = ({
  isOpen,
  onClose,
  question
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !question) return null;

  // Extract YouTube embed URL or video ID
  const getEmbedUrl = (url?: string) => {
    if (!url) return 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    try {
      if (url.includes('embed/')) return url;
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${id}?autoplay=1`;
      }
      if (url.includes('watch?v=')) {
        const id = url.split('watch?v=')[1]?.split('&')[0];
        return `https://www.youtube.com/embed/${id}?autoplay=1`;
      }
    } catch {
      // fallback
    }
    return url;
  };

  const isDirectVideo = Boolean(
    (question.videoUrl && (question.videoUrl.endsWith('.mp4') || question.videoUrl.startsWith('/videos/') || question.videoUrl.startsWith('/assets/'))) ||
    (question.youtubeUrl && (question.youtubeUrl.endsWith('.mp4') || question.youtubeUrl.startsWith('/videos/') || question.youtubeUrl.startsWith('/assets/')))
  );
  const directVideoSrc = question.videoUrl || (question.youtubeUrl?.endsWith('.mp4') ? question.youtubeUrl : '');
  const embedUrl = isDirectVideo ? '' : getEmbedUrl(question.youtubeUrl);
  const rawYoutubeUrl = question.youtubeUrl || 'https://www.youtube.com';

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Video Solution Player"
    >
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.titleInfo}>
            <div className={styles.brandBadge}>
              <YoutubeIcon size={16} className={styles.ytIcon} />
              <span>{isDirectVideo ? 'DK Sir Masterclass Video Walkthrough' : 'DK Academy Video Solution'}</span>
            </div>
            <h3 className={styles.modalHeading}>
              {question.exam} {question.year} • {question.subject}: {question.chapter}
            </h3>
            <span className={styles.topicName}>Topic: {question.topic}</span>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close video player"
          >
            <X size={20} />
          </button>
        </div>

        {/* Video Player Container */}
        <div className={styles.playerContainer}>
          {isDirectVideo ? (
            <video
              src={directVideoSrc}
              controls
              autoPlay
              playsInline
              controlsList="nodownload"
              className={styles.iframe}
              style={{ objectFit: 'contain', backgroundColor: '#000000', width: '100%', height: '100%' }}
            />
          ) : (
            <iframe
              src={embedUrl}
              title={`${question.exam} ${question.chapter} Solution Video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className={styles.iframe}
            />
          )}
        </div>

        {/* Resource Action Bar */}
        <div className={styles.modalFooter}>
          <div className={styles.facultyHighlight}>
            <CheckCircle2 size={16} className={styles.checkIcon} />
            <span>
              Taught with DK Sir Kota 20-30s inspection shortcuts • Duration:{' '}
              <strong>{question.videoDuration || '12:45'}</strong>
            </span>
          </div>

          <div className={styles.buttonActions}>
            {question.pdfUrl && (
              <a
                href={question.pdfUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className={styles.pdfDownloadBtn}
              >
                <FileText size={15} />
                <span>Download PYQ PDF</span>
                <Download size={14} />
              </a>
            )}

            {!isDirectVideo && (
              <a
                href={rawYoutubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.openYoutubeBtn}
              >
                <YoutubeIcon size={15} />
                <span>Open in YouTube</span>
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
