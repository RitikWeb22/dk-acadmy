import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  // Ensure valid duration: fallback to 180 mins (standard JEE mock) if missing or non-positive
  const safeDuration = Number(durationMinutes) > 0 ? Number(durationMinutes) : 180;

  // Track valid startTime ref to prevent re-renders or premature resets
  const safeStartTimeRef = useRef<number>(
    Number(startTime) > 0 ? Number(startTime) : Date.now()
  );

  // If a valid positive startTime prop arrives or changes later from parent
  useEffect(() => {
    if (Number(startTime) > 0 && Math.abs(safeStartTimeRef.current - Number(startTime)) > 1000) {
      safeStartTimeRef.current = Number(startTime);
    }
  }, [startTime]);

  const targetEndTime = safeStartTimeRef.current + safeDuration * 60 * 1000;

  // Calculate remaining seconds directly from clock timestamps to prevent drift
  const calculateRemainingSeconds = useCallback(() => {
    const now = Date.now();
    const diff = Math.floor((targetEndTime - now) / 1000);
    return Math.max(0, diff);
  }, [targetEndTime]);

  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateRemainingSeconds);
  const expireTriggeredRef = useRef(false);

  // Sync remaining seconds when targetEndTime updates
  useEffect(() => {
    setRemainingSeconds(calculateRemainingSeconds());
  }, [calculateRemainingSeconds]);

  useEffect(() => {
    // Initial check: if genuinely expired and not triggered yet
    if (calculateRemainingSeconds() <= 0 && !expireTriggeredRef.current) {
      expireTriggeredRef.current = true;
      const t = setTimeout(() => {
        onTimeExpire();
      }, 500);
      return () => clearTimeout(t);
    }

    const intervalId = window.setInterval(() => {
      const remaining = calculateRemainingSeconds();
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        window.clearInterval(intervalId);
        if (!expireTriggeredRef.current) {
          expireTriggeredRef.current = true;
          onTimeExpire();
        }
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [calculateRemainingSeconds, onTimeExpire]);

  // Format time as HH:MM:SS or MM:SS
  const formatTime = (totalSecs: number) => {
    const safeSecs = isNaN(totalSecs) || totalSecs < 0 ? 0 : totalSecs;
    const hours = Math.floor(safeSecs / 3600);
    const minutes = Math.floor((safeSecs % 3600) / 60);
    const seconds = safeSecs % 60;

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
