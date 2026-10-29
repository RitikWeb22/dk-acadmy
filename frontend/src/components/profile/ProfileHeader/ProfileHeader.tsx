import React, { useState, useRef } from 'react';
import type { StudentProfile } from '../../../types';
import { apiClient } from '../../../services/apiClient';
import { useToast } from '../../../context/ToastContext';
import {
  Calendar,
  Mail,
  Phone,
  Target,
  GraduationCap,
  Copy,
  Check,
  Camera,
  Trash2,
  AlertCircle,
  Loader2,
  Flame,
  BookOpen,
  MapPin
} from 'lucide-react';
import styles from './ProfileHeader.module.scss';

interface ProfileHeaderProps {
  student: StudentProfile;
  onUpdatePhoto?: (avatarUrl: string | undefined) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ student, onUpdatePhoto }) => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initial = student.name ? student.name.trim().charAt(0).toUpperCase() : 'S';

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(student.id);
      setCopied(true);
      showToast('Student ID copied to clipboard!', 'info');
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setPhotoError('Only JPG or PNG images are supported.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Profile photo must be 2MB or smaller.');
      return;
    }

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const res = await apiClient.uploadMedia(base64Data, 'students');
        if (res.success && res.url) {
          onUpdatePhoto?.(res.url);
          // Sync with backend user record
          apiClient.put('/auth/profile', { avatarUrl: res.url }).catch(() => {});
          showToast('🎉 Profile photo uploaded successfully!', 'success');
        } else {
          // Fallback to local base64 display
          onUpdatePhoto?.(base64Data);
          showToast('Profile photo updated locally.', 'info');
        }
      } catch {
        onUpdatePhoto?.(base64Data);
        showToast('Profile photo updated locally.', 'info');
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdatePhoto?.(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Profile photo removed.', 'info');
  };

  const isDemo = student.id === 'std_demo_2026';

  // Dynamic profile completion calculation
  let score = 0;
  if (student.name?.trim()) score += 15;
  if (student.email?.trim()) score += 15;
  if (student.phone?.trim()) score += 15;
  if (student.targetExam) score += 15;
  if (student.targetClass) score += 10;
  if (student.dob) score += 10;
  if (student.city && student.state) score += 10;
  if (student.parentName && student.parentPhone) score += 10;
  if (student.avatarUrl) score += 5;

  const completionPercentage = isDemo ? 92 : Math.min(100, score);

  let completionHint = 'Add Alternate Parent Phone to reach 100%';
  if (!isDemo) {
    if (!student.dob) completionHint = 'Add Date of Birth to reach 80%';
    else if (!student.city || !student.state) completionHint = 'Add City and State to reach 90%';
    else if (!student.parentName || !student.parentPhone) completionHint = 'Add Parent Contact details to reach 100%';
    else if (!student.avatarUrl) completionHint = 'Upload profile photo to reach 100%';
    else completionHint = 'Profile 100% Complete';
  }

  const batchYear = student.targetYear || '2028';
  const targetClassLabel = student.targetClass || 'Class 11th';
  const enrolledCount = isDemo ? (student.enrolledCourseIds?.length || 3) : (student.enrolledCourseIds?.length || 0);

  return (
    <div className={styles.headerCard}>
      {/* 1. Top Hero Profile Banner with Deep Royal Blue Gradient & Engineering Grid */}
      <div className={styles.topBanner} aria-hidden="true">
        <div className={styles.bannerGrid} />
        <div className={styles.bannerGlow} />
        <div className={styles.campusTag}>
          <MapPin size={12} className={styles.campusPinIcon} />
          <span>DK Academy JEE • Janakpuri Campus</span>
        </div>
      </div>

      {/* Header Body Surface */}
      <div className={styles.headerBody}>
        {/* Student Avatar: 96x96px circular frame with emerald active pulse ring and hover camera button */}
        <div className={styles.avatarWrapper}>
          <div className={styles.avatarCircle} aria-label={`${student.name}'s profile avatar`}>
            {student.avatarUrl ? (
              <img src={student.avatarUrl} alt={student.name} className={styles.avatarImg} />
            ) : (
              <span className={styles.avatarInitial}>{initial}</span>
            )}

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/jpeg,image/png,image/jpg"
              className={styles.hiddenFileInput}
              aria-label="Upload profile photo"
            />

            {/* Dedicated Hover-Triggered Camera Overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={styles.photoUploadBtn}
              aria-label="Change photo"
              title="Change profile photo (JPG/PNG, max 2MB)"
            >
              {isUploadingPhoto ? (
                <Loader2 size={16} className={styles.spin} aria-hidden="true" />
              ) : (
                <div className={styles.cameraOverlayContent}>
                  <Camera size={16} aria-hidden="true" />
                  <span className={styles.cameraOverlayText}>Change</span>
                </div>
              )}
            </button>
          </div>

          {/* Emerald Green "Active" Pulse Ring */}
          <div className={styles.onlineStatusDot} title="Active student session" aria-label="Active">
            <span className={styles.pingRing} />
            <span className={styles.pingCore} />
          </div>

          <div className={styles.avatarActions}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={styles.uploadTextBtn}
            >
              Change photo
            </button>
            {student.avatarUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className={styles.removePhotoBtn}
                title="Remove photo"
              >
                <Trash2 size={12} aria-hidden="true" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>

        {/* Identity & Quick Copy & Status Metric Strip */}
        <div className={styles.infoCol}>
          {photoError && (
            <div className={styles.photoErrorBanner} role="alert">
              <AlertCircle size={14} aria-hidden="true" />
              <span>{photoError}</span>
            </div>
          )}

          {/* Identity Row: 24px Bold Student Name & Solid Emerald Badge */}
          <div className={styles.nameRow}>
            <div className={styles.nameGroup}>
              <h1 className={styles.studentName}>{student.name}</h1>
              <span className={styles.verifiedBadge}>
                ✓ Verified Student
              </span>
            </div>

            {/* Clickable Copy Student ID Chip with Tooltip */}
            <div className={styles.idChipWrapper}>
              <button
                type="button"
                onClick={handleCopyId}
                className={styles.copyIdChip}
                aria-label={copied ? 'Student ID copied' : 'Copy Student ID'}
              >
                <span className={styles.idPrefix}>ID:</span>
                <span className={styles.idCode}>{student.id}</span>
                {copied ? (
                  <Check size={13} className={styles.copiedIcon} aria-hidden="true" />
                ) : (
                  <Copy size={13} className={styles.copyIcon} aria-hidden="true" />
                )}
                <span className={styles.tooltip}>{copied ? 'Copied to clipboard!' : 'Click to copy ID'}</span>
              </button>
            </div>
          </div>

          {/* Student Meta Row */}
          <div className={styles.metaRow}>
            {student.email && (
              <span className={styles.metaItem}>
                <Mail size={14} aria-hidden="true" />
                <span>{student.email}</span>
              </span>
            )}
            {student.phone && (
              <span className={styles.metaItem}>
                <Phone size={14} aria-hidden="true" />
                <span>+91 {student.phone}</span>
              </span>
            )}
            <span className={styles.metaItem}>
              <Calendar size={14} aria-hidden="true" />
              <span>Joined {student.joinedDate || 'May 2024'}</span>
            </span>
          </div>

          {/* Student Status Metric Strip (4-Column Bento Card) */}
          <div className={styles.statsRibbon} role="region" aria-label="Student Academic Metrics">
            {/* 1. Target Exam */}
            <div className={styles.bentoCard}>
              <div className={`${styles.bentoIconBox} ${styles.iconExam}`}>
                <Target size={16} aria-hidden="true" />
              </div>
              <div className={styles.bentoContent}>
                <span className={styles.bentoLabel}>Target Exam</span>
                <span className={styles.bentoValue}>{student.targetExam || 'JEE Main & Advanced'}</span>
              </div>
            </div>

            {/* 2. Batch */}
            <div className={styles.bentoCard}>
              <div className={`${styles.bentoIconBox} ${styles.iconBatch}`}>
                <GraduationCap size={16} aria-hidden="true" />
              </div>
              <div className={styles.bentoContent}>
                <span className={styles.bentoLabel}>Batch</span>
                <span className={styles.bentoValue}>{targetClassLabel} ({batchYear})</span>
              </div>
            </div>

            {/* 3. Study Streak with warm amber badge */}
            <div className={styles.bentoCard}>
              <div className={`${styles.bentoIconBox} ${styles.iconStreak}`}>
                <Flame size={16} aria-hidden="true" />
              </div>
              <div className={styles.bentoContent}>
                <span className={styles.bentoLabel}>Study Streak</span>
                <span className={styles.bentoValueStreak}>
                  {isDemo ? '14 Days Active 🔥' : '1 Day Active ⚡'}
                </span>
              </div>
            </div>

            {/* 4. Enrolled Classroom Batches */}
            <div className={styles.bentoCard}>
              <div className={`${styles.bentoIconBox} ${styles.iconEnrolled}`}>
                <BookOpen size={16} aria-hidden="true" />
              </div>
              <div className={styles.bentoContent}>
                <span className={styles.bentoLabel}>Enrolled</span>
                <span className={styles.bentoValue}>
                  {enrolledCount} {enrolledCount === 1 ? 'Classroom Batch' : 'Classroom Batches'}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar: Clean 6px progress track with smooth emerald fill */}
          <div className={styles.progressContainer} aria-label={`Profile ${completionPercentage}% complete`}>
            <div className={styles.progressLabelRow}>
              <div className={styles.progressTitle}>
                <span className={styles.progressText}>
                  Profile <strong>{completionPercentage}%</strong> Complete
                </span>
                <span className={styles.progressDivider}>•</span>
                <span className={styles.progressHint}>
                  {completionHint}
                </span>
              </div>
            </div>
            <div
              className={styles.progressBarTrack}
              role="progressbar"
              aria-valuenow={completionPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className={styles.progressBarFill} style={{ width: `${completionPercentage}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

