import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './TopLoadingBar.module.scss';

export const TopLoadingBar: React.FC = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Clear any pending timers on route transition
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];

    // Start progress immediately
    setIsVisible(true);
    setProgress(18);

    const t1 = setTimeout(() => {
      setProgress(48);
    }, 60);

    const t2 = setTimeout(() => {
      setProgress(82);
    }, 180);

    const t3 = setTimeout(() => {
      setProgress(100);
    }, 300);

    const t4 = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 520);

    timerRef.current = [t1, t2, t3, t4];

    return () => {
      timerRef.current.forEach(clearTimeout);
    };
  }, [location.pathname, location.search]);

  if (!isVisible && progress === 0) return null;

  return (
    <div className={styles.barContainer} aria-hidden="true">
      <div
        className={styles.progressBar}
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1
        }}
      >
        <div className={styles.glowPeg} />
      </div>
    </div>
  );
};
