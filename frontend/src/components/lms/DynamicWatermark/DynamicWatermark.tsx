import React, { useEffect, useState, useMemo } from 'react';
import { useStudentAuth } from '../../../context/AuthContext';
import styles from './DynamicWatermark.module.scss';

interface DynamicWatermarkProps {
  watermarkText?: string;
  studentId?: string;
  studentEmail?: string;
}

export const DynamicWatermark: React.FC<DynamicWatermarkProps> = ({
  watermarkText,
  studentId,
  studentEmail
}) => {
  const { student, isAuthenticated } = useStudentAuth();

  // Always resolve the active logged-in student's real unmasked email for leak protection, or "Guest User"
  const activeEmail = useMemo(() => {
    if (watermarkText && watermarkText.trim()) {
      return watermarkText.trim();
    }
    if (studentEmail && studentEmail.trim() && !studentEmail.includes('***')) {
      return studentEmail.trim();
    }
    if (isAuthenticated && student?.email && student.email.trim()) {
      return student.email.trim();
    }
    return 'Guest User';
  }, [watermarkText, studentEmail, student?.email, isAuthenticated]);

  const activeId = useMemo(() => {
    if (studentId && studentId.trim()) return studentId.trim();
    if (isAuthenticated && student?.id && student.id.trim()) return student.id.trim();
    return 'GUEST-PREVIEW';
  }, [studentId, student?.id, isAuthenticated]);

  // Position state (percentage based: 16% to 74% to stay visible and avoid edge cutoffs)
  const [coords, setCoords] = useState<{ top: number; left: number }>({
    top: 26,
    left: 24
  });

  const [opacity, setOpacity] = useState<number>(0.65);
  const [currentTimeStamp, setCurrentTimeStamp] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    // Relocate moving watermark every 6 seconds across random coordinates so screen-recorders cannot crop or blur
    const moveInterval = setInterval(() => {
      const newTop = Math.floor(Math.random() * 54) + 18; // 18% - 72%
      const newLeft = Math.floor(Math.random() * 54) + 18; // 18% - 72%
      const newOpacity = Math.random() * 0.25 + 0.55; // 0.55 - 0.80

      setCoords({ top: newTop, left: newLeft });
      setOpacity(newOpacity);
      setCurrentTimeStamp(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 6000);

    return () => clearInterval(moveInterval);
  }, []);

  return (
    <div className={styles.watermarkContainer} aria-hidden="true">
      {/* 1. Dynamic Moving Anti-Piracy Watermark Badge (Prominently shows active user email) */}
      <div
        className={styles.movingBadge}
        style={{
          top: `${coords.top}%`,
          left: `${coords.left}%`,
          opacity: opacity
        }}
      >
        <span className={styles.shieldDot} />
        <span className={styles.emailBadge}>{activeEmail}</span>
        <span className={styles.divider}>•</span>
        <span className={styles.badgeId}>ID: {activeId.slice(-6).toUpperCase()}</span>
        <span className={styles.sessionStamp}>{currentTimeStamp}</span>
      </div>

      {/* 2. Top Permanent Anti-Leak Stamp */}
      <div className={styles.topStampWatermark}>
        <span>SECURE STREAM // {activeEmail}</span>
      </div>

      {/* 3. Bottom Corner Traceability Stamp */}
      <div className={styles.cornerWatermark}>
        <span>LICENSED TO: {activeEmail} • ANTI-PIRACY AUDIT ID: {activeId.slice(-8).toUpperCase()}</span>
      </div>
    </div>
  );
};
