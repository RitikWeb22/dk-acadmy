import React from 'react';
import styles from './CircularProgressRing.module.scss';

interface CircularProgressRingProps {
  progress: number; // e.g. 86
  size?: number; // e.g. 60
  strokeWidth?: number; // e.g. 5
  strokeColor?: string; // e.g. '#2563EB'
  trackColor?: string; // e.g. '#E2E8F0'
  textColor?: string;
  showText?: boolean;
}

export const CircularProgressRing: React.FC<CircularProgressRingProps> = ({
  progress,
  size = 62,
  strokeWidth = 5.5,
  strokeColor = '#2563EB',
  trackColor = '#F1F5F9',
  textColor,
  showText = true
}) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const offset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className={styles.ringWrapper} style={{ width: size, height: size }}>
      <svg className={styles.svgRing} width={size} height={size}>
        {/* Background Track Circle */}
        <circle
          className={styles.trackCircle}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
        />
        {/* Animated Progress Circle */}
        <circle
          className={styles.progressCircle}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      {showText && (
        <span
          className={styles.centerText}
          style={{ color: textColor || strokeColor }}
        >
          {clampedProgress}%
        </span>
      )}
    </div>
  );
};
