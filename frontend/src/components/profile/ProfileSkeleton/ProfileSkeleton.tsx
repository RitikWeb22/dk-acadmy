import React from 'react';
import styles from './ProfileSkeleton.module.scss';

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className={styles.skeletonContainer} aria-busy="true" aria-label="Loading student profile...">
      {/* Header skeleton */}
      <div className={styles.headerSkeleton}>
        <div className={styles.topBannerSkeleton} />
        <div className={styles.bodySkeleton}>
          <div className={styles.avatarSkeleton} />
          <div className={styles.textSkeletonGroup}>
            <div className={styles.nameLineSkeleton} />
            <div className={styles.metaLineSkeleton} />
          </div>
        </div>
      </div>

      {/* Form cards skeleton */}
      <div className={styles.cardSkeleton}>
        <div className={styles.titleSkeleton} />
        <div className={styles.rowSkeleton}>
          <div className={styles.fieldSkeleton} />
          <div className={styles.fieldSkeleton} />
        </div>
        <div className={styles.fieldSkeleton} />
      </div>
    </div>
  );
};
