import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Download, FileText, CheckCircle2, PlayCircle } from 'lucide-react';
import type { PYQQuestion } from '../../../types';
import { parseVideoUrl } from '../../../utils/videoUrl';
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

  if (!isOpen || !question || typeof document === 'undefined') return null;

  const targetVideoUrl = question.videoUrl || question.youtubeUrl || '';
  const parsed = parseVideoUrl(targetVideoUrl);
  const isDirectVideo = !parsed.isIframe;
  const directVideoSrc = parsed.directUrl || '/videos/1.mp4';
  const embedUrl = parsed.embedUrl || 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ';
  const rawVideoUrl = targetVideoUrl || '';

  return createPortal(
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
              <PlayCircle size={15} className={styles.playIcon} />
              <span>Watch Video Solution</span>
            </div>
            <h3 className={styles.modalHeading}>
              {question.exam} {question.year} • {question.subject}: {question.chapter}
            </h3>
            {question.topic && <span className={styles.topicName}>Topic: {question.topic}</span>}
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close video player"
          >
            <X size={18} />
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
            <CheckCircle2 size={14} className={styles.checkIcon} />
            <span>
              DK Sir Kota 20-30s shortcuts {question.videoDuration ? `• ${question.videoDuration}` : ''}
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
                <FileText size={13} />
                <span>PDF Solution</span>
                <Download size={12} />
              </a>
            )}

            {rawVideoUrl && (
              <a
                href={rawVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.openVideoBtn}
              >
                <ExternalLink size={12} />
                <span>Watch Video Solution</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
