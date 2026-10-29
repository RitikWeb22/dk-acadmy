import React, { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import styles from './CountdownTimer.module.scss';

interface CountdownTimerProps {
  startTime: number; // Unix timestamp in ms
  durationMinutes: number;
  onTimeExpire: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  startTime,
  durationMinutes,
  onTimeExpire,
}) => {
  const targetEndTime = startTime + durationMinutes * 60 * 1000;

  // Calculate remaining seconds directly from clock timestamps to prevent drift
  const calculateRemainingSeconds = useCallback(() => {
    const diff = Math.floor((targetEndTime - Date.now()) / 1000);
    return Math.max(0, diff);
  }, [targetEndTime]);

  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateRemainingSeconds);

  useEffect(() => {
    // Initial check in case it's already expired
    if (calculateRemainingSeconds() <= 0) {
      onTimeExpire();
      return;
    }

    const intervalId = window.setInterval(() => {
      const remaining = calculateRemainingSeconds();
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        window.clearInterval(intervalId);
        onTimeExpire();
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [calculateRemainingSeconds, onTimeExpire]);

  // Format time as HH:MM:SS or MM:SS
  const formatTime = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const pad = (n: number) => String(n).padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const isLowTime = remainingSeconds <= 300 && remainingSeconds > 60; // < 5 mins
  const isCriticalTime = remainingSeconds <= 60 && remainingSeconds > 0; // < 1 min

  return (
    <div
      className={`${styles.timerContainer} ${isLowTime ? styles.lowTime : ''} ${isCriticalTime ? styles.criticalTime : ''}`}
      role="timer"
      aria-live="polite"
      aria-label={`Time Remaining: ${formatTime(remainingSeconds)}`}
    >
      {isCriticalTime ? (
        <AlertTriangle size={16} className={styles.timerIconPulse} />
      ) : (
        <Clock size={16} className={styles.timerIcon} />
      )}
      <div className={styles.timeDisplay}>
        <span className={styles.timeLabel}>Time Left:</span>
        <span className={styles.timeDigits}>{formatTime(remainingSeconds)}</span>
      </div>
    </div>
  );
};
