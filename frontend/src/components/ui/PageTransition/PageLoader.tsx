import React from 'react';
import styles from './PageLoader.module.scss';

interface PageLoaderProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
  isFadingOut?: boolean;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'DK ACADEMY',
  subMessage = 'IIT JEE KOTA PEDAGOGY',
  fullScreen = true,
  isFadingOut = false
}) => {
  return (
    <div
      className={`
        ${fullScreen ? styles.fullScreenLoader : styles.inlineLoader}
        ${isFadingOut ? styles.fadeOut : ''}
      `}
      role="status"
      aria-label="Loading page content"
    >
      <div className={styles.loaderContent}>
        {/* Orbital Geometric Spinner with Official Brand Logo */}
        <div className={styles.spinnerWrapper}>
          <div className={styles.outerTrack} />
          <div className={styles.spinRing} />
          <div className={styles.innerEmblem}>
            <img
              src="/img/logo.jpeg"
              alt="DK Academy"
              className={styles.brandLogoImg}
            />
          </div>
        </div>

        {/* Minimalist Branding & Typography */}
        <div className={styles.textGroup}>
          <span className={styles.brandTitle}>{message}</span>
          <span className={styles.brandSubtitle}>{subMessage}</span>
        </div>

        {/* Minimalist Shimmer Bar */}
        <div className={styles.shimmerTrack}>
          <div className={styles.shimmerBar} />
        </div>

        {/* Verified Status Micro-Badge */}
        <div className={styles.statusIndicator}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>Secure Platform • Verified Fast</span>
        </div>
      </div>
    </div>
  );
};
