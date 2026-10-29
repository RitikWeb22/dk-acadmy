import React, { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import styles from './ImageLightbox.module.scss';

export interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
  title?: string;
  subtitle?: string;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  onClose,
  imageSrc,
  imageAlt,
  title,
  subtitle
}) => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!isOpen) {
      setScale(1);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.35, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.35, 0.75));
  const resetZoom = () => setScale(1);

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Full Image Lightbox'}
    >
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        {/* Top Control Bar */}
        <div className={styles.topBar}>
          <div className={styles.infoCol}>
            {title && <h3 className={styles.lightboxTitle}>{title}</h3>}
            {subtitle && <p className={styles.lightboxSubtitle}>{subtitle}</p>}
          </div>

          <div className={styles.actionsGroup}>
            <button
              type="button"
              className={styles.controlBtn}
              onClick={zoomOut}
              disabled={scale <= 0.75}
              aria-label="Zoom out"
              title="Zoom out"
            >
              <ZoomOut size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.controlBtn}
              onClick={resetZoom}
              aria-label="Reset zoom"
              title="Reset zoom"
            >
              <RotateCcw size={16} aria-hidden="true" />
              <span className={styles.zoomPercent}>{Math.round(scale * 100)}%</span>
            </button>
            <button
              type="button"
              className={styles.controlBtn}
              onClick={zoomIn}
              disabled={scale >= 3}
              aria-label="Zoom in"
              title="Zoom in"
            >
              <ZoomIn size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close image lightbox"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Zoomable Image Wrapper */}
        <div className={styles.imageScrollArea}>
          <img
            src={imageSrc}
            alt={imageAlt}
            className={styles.lightboxImg}
            style={{ transform: `scale(${scale})` }}
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Pinch / Tap Tip on Mobile */}
        <div className={styles.mobileHint}>
          Use zoom buttons or pinch on touch screens to inspect fine details
        </div>
      </div>
    </div>
  );
};
