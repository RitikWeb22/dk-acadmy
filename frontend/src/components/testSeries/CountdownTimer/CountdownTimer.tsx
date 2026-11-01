import React, { useState, useEffect, useRef } from 'react';
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
  const safeDuration = Number(durationMinutes) > 0 ? Math.floor(Number(durationMinutes)) : 180;
  const totalDurationMs = safeDuration * 60 * 1000;

  // Keep latest onTimeExpire callback in a ref to avoid resetting timer interval on user answers
  const onTimeExpireRef = useRef(onTimeExpire);
  useEffect(() => {
    onTimeExpireRef.current = onTimeExpire;
  }, [onTimeExpire]);

  // Determine a valid start timestamp:
  // If startTime is a positive number and not in the past beyond total duration, use it.
  // If it's expired or invalid (e.g. 0, negative, stale localStorage), treat current time as fresh start.
  const getSafeStartTime = (inputTime: number): number => {
    const now = Date.now();
    const s = Number(inputTime);
    if (s > 0 && (now - s) >= 0 && (now - s) < totalDurationMs) {
      return s;
    }
    return now;
  };

  const [activeStartTime, setActiveStartTime] = useState<number>(() => getSafeStartTime(startTime));

  // Sync activeStartTime if startTime prop updates from parent
  useEffect(() => {
    const valid = getSafeStartTime(startTime);
    setActiveStartTime(valid);
  }, [startTime, totalDurationMs]);

  const targetEndTime = activeStartTime + totalDurationMs;

  const calculateRemainingSeconds = (): number => {
    const now = Date.now();
    const diff = Math.floor((targetEndTime - now) / 1000);
    return Math.max(0, diff);
  };

  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateRemainingSeconds);
  const expireTriggeredRef = useRef(false);

  useEffect(() => {
    expireTriggeredRef.current = false;
    const initialRemaining = calculateRemainingSeconds();
    setRemainingSeconds(initialRemaining);

    const intervalId = window.setInterval(() => {
      const remaining = calculateRemainingSeconds();
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        window.clearInterval(intervalId);
        if (!expireTriggeredRef.current) {
          expireTriggeredRef.current = true;
          onTimeExpireRef.current?.();
        }
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [targetEndTime]);

  // Format time as standard NTA CBT examination clock: HH:MM:SS
  const formatTime = (totalSecs: number) => {
    const safeSecs = isNaN(totalSecs) || totalSecs < 0 ? 0 : totalSecs;
    const hours = Math.floor(safeSecs / 3600);
    const minutes = Math.floor((safeSecs % 3600) / 60);
    const seconds = safeSecs % 60;

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
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
