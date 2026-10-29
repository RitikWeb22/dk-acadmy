import React, { useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Zap,
  FileDown,
  Lock,
  GraduationCap
} from 'lucide-react';
import type { Course } from '../../../types';
import { useStudentAuth } from '../../../context/AuthContext';
import styles from './CourseDemoModal.module.scss';

interface CourseDemoModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSyllabus?: (course: Course) => void;
}

const SPEED_OPTIONS = [1.0, 1.25, 1.5, 2.0];

export const CourseDemoModal: React.FC<CourseDemoModalProps> = ({
  course,
  isOpen,
  onClose,
  onOpenSyllabus
}) => {
  const navigate = useNavigate();
  const { student, isAuthenticated } = useStudentAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(54 * 60); // Default to 54m
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  const isPurchased = useMemo(() => {
    if (!course || typeof window === 'undefined') return false;
    if (!isAuthenticated || !student) return false;
    const enrolledIds = student.enrolledCourseIds || [];
    return Boolean(
      enrolledIds.includes(course.id) ||
      (course._id && enrolledIds.includes(course._id)) ||
      ((course as any).slug && enrolledIds.includes((course as any).slug))
    );
  }, [course, isAuthenticated, student]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !course) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 54 * 60;
    setCurrentTimeSec(current);
    setDurationSec(dur);
    setProgress((current / dur) * 100);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDurationSec(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekPercent = Number(e.target.value);
    const dur = videoRef.current.duration || durationSec;
    const seekTo = (seekPercent / 100) * dur;
    videoRef.current.currentTime = seekTo;
    setProgress(seekPercent);
    setCurrentTimeSec(seekTo);
  };

  const handleCycleSpeed = () => {
    const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
    const nextSpeed = SPEED_OPTIONS[nextIndex];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const handleFullScreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleEnrollNow = () => {
    onClose();
    if (!isAuthenticated || !student) {
      navigate(`/login?redirect=${encodeURIComponent(`/payment/${course.id}`)}`);
      return;
    }
    if (isPurchased) {
      navigate(`/learn/${course.id}`);
    } else {
      navigate(`/payment/${course.id}`);
    }
  };

  const handleDownloadNotes = (e: React.MouseEvent) => {
    e.preventDefault();
    const link = document.createElement('a');
    link.href = '/assets/downloads/st line-2.pdf';
    link.download = 'DK-Sir-Straight-Lines-JEE-Main-PYQs.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return createPortal(
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
    >
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* Floating Top-Right Close Button */}
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close demo modal"
        >
          <X size={18} />
        </button>

        {/* 54% / 46% Split Masterclass Layout */}
        <div className={styles.splitLayout}>
          {/* ══════════════════════════════════════════
              LEFT SECTION: Interactive Video Player & Lecture Handout
              ══════════════════════════════════════════ */}
          <div className={styles.leftVideoSection}>
            {/* Top Video Player Container */}
            <div className={styles.videoPlayerContainer}>
              <video
                ref={videoRef}
                src="/videos/1.mp4"
                poster="/images/pyq-straight-lines-banner.jpg"
                className={styles.videoElement}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                playsInline
                preload="metadata"
              />

              {/* Top Player Badges Overlay */}
              <div className={`${styles.videoTopHeader} ${isPlaying ? styles.headerAutoHide : ''}`}>
                <span className={styles.masterclassBadge}>
                  <Zap size={13} className={styles.zapIcon} />
                  100% Free Demo Masterclass
                </span>
                <span className={styles.resolutionBadge}>
                  1080p Full HD • 60 FPS
                </span>
              </div>

              {/* Large Centered Play Trigger */}
              {!isPlaying && (
                <button
                  type="button"
                  className={styles.centerPlayTrigger}
                  onClick={togglePlay}
                  aria-label="Play demo masterclass video"
                >
                  <Play size={26} fill="#ffffff" />
                </button>
              )}

              {/* Bottom Integrated Media Controls Bar */}
              <div className={`${styles.mediaScrubBar} ${isPlaying ? styles.controlsAutoHide : ''}`}>
                {/* Play / Pause Toggle */}
                <button
                  type="button"
                  className={styles.mediaIconBtn}
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} fill="#ffffff" />}
                </button>

                {/* Timestamps */}
                <span className={styles.timeDisplay}>
                  {formatTime(currentTimeSec)} / {formatTime(durationSec)}
                </span>

                {/* Seekbar */}
                <div className={styles.seekbarContainer}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleSeek}
                    className={styles.seekbarInput}
                    aria-label="Video seek slider"
                  />
                  <div
                    className={styles.seekbarFill}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Speed Selector */}
                <button
                  type="button"
                  className={styles.speedSelectorBtn}
                  onClick={handleCycleSpeed}
                  title="Cycle playback speed"
                >
                  {playbackSpeed}x
                </button>

                {/* Volume Toggle */}
                <button
                  type="button"
                  className={styles.mediaIconBtn}
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                {/* Fullscreen Trigger */}
                <button
                  type="button"
                  className={styles.mediaIconBtn}
                  onClick={handleFullScreen}
                  aria-label="Toggle Fullscreen"
                >
                  <Maximize size={16} />
                </button>
              </div>
            </div>

            {/* Bottom Lecture Meta Card */}
            <div className={styles.lectureMetaCard}>
              <div className={styles.lectureHeaderRow}>
                <span className={styles.lecturePill}>
                  Lecture 1 (Free Preview)
                </span>
                <span className={styles.lectureDuration}>
                  ⏱️ 5 Mins Video Walkthrough
                </span>
              </div>

              <h4 className={styles.lectureTitle}>
                Straight Lines Speed Shortcuts &amp; JEE Main PYQ Breakdown by DK Sir
              </h4>

              <p className={styles.lectureExcerpt}>
                Learn how Kota top rankers solve Coordinate Geometry and Straight Lines PYQs in 20-30 seconds with DK Sir’s visual inspection shortcuts. Includes official downloadable JEE Main Chapter PYQ booklet.
              </p>

              <button
                type="button"
                className={styles.handoutLink}
                onClick={handleDownloadNotes}
              >
                <FileDown size={14} />
                <span>Download Straight Lines PYQs PDF (Free Handout)</span>
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════
              RIGHT SECTION: Course Value, Faculty Credential & Direct Checkout
              ══════════════════════════════════════════ */}
          <div className={styles.rightInfoSection}>
            <div className={styles.infoScrollContent}>
              {/* Top Badges Row */}
              <div className={styles.topBadgesRow}>
                <span className={styles.targetClassPill}>
                  {course.targetExam || 'JEE Main & Advanced'} • {course.targetClass || 'Class 11th'}
                </span>
                <span className={styles.seatUrgencyPill}>
                  <span className={styles.pulseDot} />
                  <Zap size={11} className={styles.urgencyZap} />
                  Only 4 Seats Remaining
                </span>
              </div>

              {/* Course Title & Subtitle */}
              <h3 id="demo-modal-title" className={styles.courseTitle}>
                {course.title || 'Ultimate 2-Year Live Classroom: Target JEE 2028'}
              </h3>
              <p className={styles.courseSubtitle}>
                Comprehensive 2-year live interactive Kota coaching covering Class 11 &amp; 12 PCM syllabus aligned with updated NTA &amp; IIT JEE Advanced standards.
              </p>

              {/* Faculty Credential Card with DK Sir Studio Avatar */}
              <div className={styles.facultyCard}>
                <div className={styles.facultyAvatarWrap}>
                  <img
                    src="/img/dk-sir.jpg"
                    alt="Dharmendra Kumar (DK Sir)"
                    className={styles.facultyImg}
                    onError={(e) => {
                      // Fallback to stylized monogram if image fails
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className={styles.avatarFallback}>DK</div>
                </div>

                <div className={styles.facultyInfo}>
                  <div className={styles.facultyNameRow}>
                    <span className={styles.facultyName}>Dharmendra Kumar (DK Sir)</span>
                    <span className={styles.verifiedBadge} title="Verified Senior IIT-JEE Faculty">
                      <ShieldCheck size={12} className={styles.shieldIcon} />
                      Verified
                    </span>
                  </div>
                  <div className={styles.facultyCredentials}>
                    18+ Yrs Kota Faculty • Ex-Allen / Bansal Math HOD
                  </div>
                  <div className={styles.facultyTag}>
                    Specialist in 20-30s speed inspection algorithms
                  </div>
                </div>
              </div>

              {/* Academic Deliverables Checklist */}
              <div className={styles.deliverablesSection}>
                <div className={styles.deliverablesLabel}>
                  COMPLETE ACADEMIC DELIVERABLES
                </div>
                <ul className={styles.deliverablesList}>
                  <li className={styles.deliverableItem}>
                    <div className={styles.checkIconWrap}>
                      <CheckCircle2 size={15} />
                    </div>
                    <span className={styles.deliverableText}>
                      <strong>350+ Hours Live Classroom Rigor + Recorded Backup</strong> (with 1080p adaptive stream)
                    </span>
                  </li>
                  <li className={styles.deliverableItem}>
                    <div className={styles.checkIconWrap}>
                      <CheckCircle2 size={15} />
                    </div>
                    <span className={styles.deliverableText}>
                      <strong>Handwritten Blackboard PDF Notes</strong> + 120 Solved DPP Sets
                    </span>
                  </li>
                  <li className={styles.deliverableItem}>
                    <div className={styles.checkIconWrap}>
                      <CheckCircle2 size={15} />
                    </div>
                    <span className={styles.deliverableText}>
                      <strong>40 All-India CBT Test Series</strong> with NTA Rank Normalization
                    </span>
                  </li>
                  <li className={styles.deliverableItem}>
                    <div className={styles.checkIconWrap}>
                      <CheckCircle2 size={15} />
                    </div>
                    <span className={styles.deliverableText}>
                      <strong>1:1 Daily Doubt Resolution</strong> with DK Sir &amp; Kota Mentor Team
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Checkout & Action Container */}
            <div className={styles.checkoutBar}>
              <div className={styles.priceContainer}>
                <div className={styles.priceRow}>
                  <span className={styles.currentPrice}>
                    {course.price || '₹6,499'}
                  </span>
                  <span className={styles.originalPrice}>₹1,05,000</span>
                  <span className={styles.scholarshipBadge}>
                    20% Scholarship Applied
                  </span>
                </div>
                <div className={styles.taxSubtext}>
                  Inclusive of 18% GST • Printed Modules Shipped to Home
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className={styles.actionButtonsRow}>
                {onOpenSyllabus && (
                  <button
                    type="button"
                    className={styles.syllabusSecondaryBtn}
                    onClick={() => {
                      onClose();
                      onOpenSyllabus(course);
                    }}
                  >
                    <BookOpen size={14} />
                    <span>View Detailed Syllabus</span>
                  </button>
                )}

                <button
                  type="button"
                  className={styles.enrollPrimaryBtn}
                  onClick={handleEnrollNow}
                >
                  {isPurchased ? (
                    <>
                      <GraduationCap size={16} />
                      <span>Go to Classroom</span>
                      <ArrowRight size={15} />
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Enroll Now &amp; Secure Seat</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>

              {/* Trust & Security Microcopy */}
              <div className={styles.trustMicrocopy}>
                <Lock size={12} className={styles.lockIcon} />
                <span>
                  Instant batch access • 100% secure payment via Razorpay / Axis Desk • No cost EMI available
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
