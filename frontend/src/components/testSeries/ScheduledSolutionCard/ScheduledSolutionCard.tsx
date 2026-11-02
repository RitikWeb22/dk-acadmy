import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Unlock,
  Clock,
  FileText,
  Video,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { apiClient } from '../../../services/apiClient';
import styles from './ScheduledSolutionCard.module.scss';

interface ScheduledSolutionCardProps {
  testId: string;
  submissionId?: string;
  submittedAt?: number | string | Date;
  releaseDelayHours?: number;
  initialUnlockAt?: number | string | Date;
  hasPdfConfigured?: boolean;
  hasVideoConfigured?: boolean;
}

export const ScheduledSolutionCard: React.FC<ScheduledSolutionCardProps> = ({
  testId,
  submissionId,
  submittedAt,
  releaseDelayHours = 24,
  initialUnlockAt,
  hasPdfConfigured = true,
  hasVideoConfigured = true,
}) => {
  // Determine submission time & unlock time
  const subTime = submittedAt ? new Date(submittedAt).getTime() : Date.now();
  const unlockTargetTime = initialUnlockAt
    ? new Date(initialUnlockAt).getTime()
    : subTime + (releaseDelayHours * 60 * 60 * 1000);

  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });

  const [isUnlocked, setIsUnlocked] = useState<boolean>(Date.now() >= unlockTargetTime);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoadingUrls, setIsLoadingUrls] = useState<boolean>(false);
  const fetchedRef = useRef<boolean>(false);

  // Fetch actual authorized URLs from backend once unlocked
  const fetchUnlockedSolutions = async () => {
    if (!submissionId || fetchedRef.current) return;
    try {
      setIsLoadingUrls(true);
      const res = await apiClient.get<any>(`/test-series/submissions/${submissionId}/solution`);
      if (res && res.success && res.data) {
        fetchedRef.current = true;
        setPdfUrl(res.data.pdfSolutionUrl || null);
        setVideoUrl(res.data.videoSolutionUrl || null);
        setIsUnlocked(true);
      }
    } catch (err) {
      console.warn('[ScheduledSolutionCard] Could not fetch solutions yet:', err);
    } finally {
      setIsLoadingUrls(false);
    }
  };

  // Real-time countdown timer hook
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const diffMs = unlockTargetTime - now;

      if (diffMs <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
        if (!isUnlocked) {
          setIsUnlocked(true);
          fetchUnlockedSolutions();
        }
      } else {
        const totalSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;

        setTimeLeft({ hours, minutes, seconds, totalSeconds: totalSecs });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    // If already unlocked on mount, fetch right away
    if (Date.now() >= unlockTargetTime) {
      fetchUnlockedSolutions();
    }

    return () => clearInterval(interval);
  }, [unlockTargetTime, submissionId, isUnlocked]);

  // Format exact unlock date & time
  const unlockDateObj = new Date(unlockTargetTime);
  const formattedUnlockDate = unlockDateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const formattedUnlockTime = unlockDateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <section
      className={`${styles.scheduledSolutionCard} ${isUnlocked ? styles.unlockedCard : ''}`}
      aria-label="Automated Solution Scheduling Release"
    >
      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <div className={`${styles.iconBadge} ${isUnlocked ? styles.unlockedBadge : ''}`}>
            {isUnlocked ? <Unlock size={24} /> : <Lock size={24} />}
          </div>
          <div className={styles.titleGroup}>
            <h3 className={styles.cardTitle}>
              {isUnlocked ? 'Official Solutions Unlocked' : 'Solutions Coming Soon'}
            </h3>
            {isUnlocked && (
              <p className={styles.cardSubtitle}>
                Your solution access is active. Review official derivations and video explanations below.
              </p>
            )}
          </div>
        </div>

        {/* Resource Badges */}
        <div className={styles.resourceStatusPills}>
          {hasPdfConfigured && (
            <div className={`${styles.statusPill} ${isUnlocked ? styles.pillUnlocked : styles.pillLocked}`}>
              <FileText size={14} />
              <span>PDF Solution: {isUnlocked ? 'Unlocked' : 'Locked'}</span>
            </div>
          )}

          {hasVideoConfigured && (
            <div className={`${styles.statusPill} ${isUnlocked ? styles.pillUnlocked : styles.pillLocked}`}>
              <Video size={14} />
              <span>Video Solution: {isUnlocked ? 'Unlocked' : 'Locked'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Countdown Box (Active when locked) */}
      {!isUnlocked && (
        <div className={styles.countdownBox}>
          <div className={styles.countdownLeft}>
            <span className={styles.pulseDot} aria-hidden="true" />
            <span className={styles.countdownLabel}>Time Remaining:</span>
            <span className={styles.countdownTimer}>
              Solutions unlock in {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </span>
          </div>

          <div className={styles.unlockScheduleMeta}>
            <Clock size={15} />
            <span>
              Scheduled for: <strong className={styles.metaHighlight}>{formattedUnlockDate} at {formattedUnlockTime}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Unlocked Actions (Active when unlocked) */}
      {isUnlocked && (
        <div className={styles.unlockedActionsRow}>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.pdfActionBtn}
            >
              <FileText size={18} />
              <span>View PDF Solution</span>
              <ExternalLink size={15} />
            </a>
          )}

          {videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.videoActionBtn}
            >
              <Video size={18} />
              <span>Watch Video Solution</span>
              <ExternalLink size={15} />
            </a>
          )}

          {isLoadingUrls && (
            <span style={{ fontSize: '13px', color: '#94A3B8' }}>
              Decrypting verified solution links...
            </span>
          )}

          {!pdfUrl && !videoUrl && !isLoadingUrls && (
            <div style={{ fontSize: '13px', color: '#A7F3D0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} />
              <span>Solutions released. Admin has not attached external download links for this mock test.</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

