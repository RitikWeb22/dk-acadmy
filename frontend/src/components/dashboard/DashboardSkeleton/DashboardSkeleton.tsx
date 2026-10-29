import React from 'react';
import styles from './DashboardSkeleton.module.scss';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className={styles.skeletonContainer} aria-label="Loading student dashboard...">
      <div className={styles.headerSkeleton}>
        <div className={styles.shimmerLineSm} />
        <div className={styles.shimmerTitle} />
        <div className={styles.shimmerLineMd} />
      </div>

      <div className={styles.statsSkeletonGrid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.statSkeletonCard}>
            <div className={styles.shimmerCircle} />
            <div className={styles.shimmerCol}>
              <div className={styles.shimmerLineSm} />
              <div className={styles.shimmerLineXs} />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.mainGridSkeleton}>
        <div className={styles.leftColSkeleton}>
          <div className={styles.cardSkeletonLg} />
          <div className={styles.cardSkeletonMd} />
        </div>
        <div className={styles.rightColSkeleton}>
          <div className={styles.cardSkeletonMd} />
          <div className={styles.cardSkeletonSm} />
        </div>
      </div>
    </div>
  );
};
