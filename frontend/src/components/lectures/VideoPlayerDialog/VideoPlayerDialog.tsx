import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Play, Clock, BookOpen, User, CheckCircle, FileText, Download, Lock, ShieldCheck, ArrowRight, PhoneCall } from 'lucide-react';
import type { Lecture } from '../../../types';
import { Button } from '../../ui/Button/Button';
import styles from './VideoPlayerDialog.module.scss';

interface VideoPlayerDialogProps {
  lecture: Lecture | null;
  onClose: () => void;
}

export const VideoPlayerDialog: React.FC<VideoPlayerDialogProps> = ({
  lecture,
  onClose
}) => {
  // Trap escape key for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (lecture) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lecture, onClose]);

  if (!lecture) return null;

  const isPaid = Boolean(lecture.isPaid);

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-dialog-title"
      onClick={onClose}
    >
      <div
        className={`${styles.dialogCard} ${isPaid ? styles.paidDialogCard : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close video player"
        >
          <X size={20} />
        </button>

        {/* Video Player Display Screen */}
        <div className={styles.screenContainer}>
          <div className={`${styles.screenBg} ${styles[lecture.subject.toLowerCase()]} ${isPaid ? styles.screenLockedBg : ''}`}>
            <div className={styles.screenTopBar}>
              <span className={`${styles.badgePill} ${isPaid ? styles.paidBadgePill : ''}`}>
                {isPaid ? 'DK ACADEMY JEE • PAID BATCH LECTURE' : 'DK ACADEMY JEE • OPEN ACCESS DEMO'}
              </span>
              <span className={styles.levelTag}>{lecture.level}</span>
            </div>

            <div className={styles.screenCenter}>
              {isPaid ? (
                <div className={styles.lockIconCircle} aria-label="Lecture locked">
                  <Lock size={36} />
                </div>
              ) : (
                <div className={styles.playIconCircle}>
                  <Play size={36} fill="currentColor" />
                </div>
              )}

              <span className={styles.subjectSubtitle}>
                {lecture.subject} • {lecture.chapter}
              </span>
              <h2 id="video-dialog-title" className={styles.videoTitle}>
                {lecture.title}
              </h2>
            </div>

            <div className={styles.screenBottomBar}>
              <div className={styles.metaRow}>
                <span><Clock size={14} /> {lecture.duration}</span>
                <span><User size={14} /> {lecture.instructor}</span>
                {isPaid ? (
                  <span className={styles.lockedMetaTag}><Lock size={13} /> Full Course Enrolled Only</span>
                ) : (
                  <span className={styles.freeMetaTag}>100% Free Demo • Zero Paywall</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dialog Details and Resources */}
        <div className={styles.dialogBody}>
          <div className={styles.detailsHeader}>
            <div className={styles.tagsGroup}>
              <span className={styles.subjectPill}>{lecture.subject}</span>
              <span className={styles.chapterPill}>
                <BookOpen size={13} /> {lecture.chapter}
              </span>
            </div>
            <span className={styles.durationBadge}>Duration: {lecture.duration}</span>
          </div>

          <p className={styles.descriptionText}>{lecture.description}</p>

          {/* Conditional Rendering: If Paid, show Upgrade / Course Unlock Offer */}
          {isPaid ? (
            <div className={styles.paywallBox}>
              <div className={styles.paywallHeader}>
                <ShieldCheck size={22} className={styles.shieldIcon} />
                <div>
                  <h4 className={styles.paywallTitle}>Unlock Full Syllabus with DK Academy Batches</h4>
                  <p className={styles.paywallSubtitle}>
                    This lecture is part of the comprehensive IIT JEE Main & Advanced curriculum. Enroll today to unlock the full 450+ lecture library.
                  </p>
                </div>
              </div>

              <div className={styles.benefitsGrid}>
                <div className={styles.benefitItem}>
                  <CheckCircle size={15} className={styles.benefitCheck} />
                  <span>450+ Hours Live & Recorded HD Lectures</span>
                </div>
                <div className={styles.benefitItem}>
                  <CheckCircle size={15} className={styles.benefitCheck} />
                  <span>DK Sir's 20–30s Math Shortcut Modules</span>
                </div>
                <div className={styles.benefitItem}>
                  <CheckCircle size={15} className={styles.benefitCheck} />
                  <span>Daily Graded DPPs with Video Solutions</span>
                </div>
                <div className={styles.benefitItem}>
                  <CheckCircle size={15} className={styles.benefitCheck} />
                  <span>15 All India CBT Mock Tests</span>
                </div>
              </div>

              <div className={styles.paywallActions}>
                <Link to="/courses" className={styles.enrollCourseBtn} onClick={onClose}>
                  <span>Explore Courses & Enroll</span>
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="https://wa.me/919325987875?text=Hello%20DK%20Academy,%20I%20want%20to%20enroll%20in%20the%20JEE%20Comprehensive%20Course%20to%20unlock%20all%20lectures."
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.whatsappCounselorBtn}
                >
                  <PhoneCall size={15} />
                  <span>Chat with Counselor</span>
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Concepts Covered for Free Lecture */}
              <div className={styles.conceptsBox}>
                <h4 className={styles.boxTitle}>Core Concepts & Problem Sets in This Free Lecture:</h4>
                <ul className={styles.conceptsList}>
                  {lecture.topics && lecture.topics.length > 0 ? (
                    lecture.topics.map((topic, i) => (
                      <li key={i}>
                        <CheckCircle size={15} className={styles.checkIcon} />
                        <span>{topic}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li>
                        <CheckCircle size={15} className={styles.checkIcon} />
                        <span>Derivations, boundary conditions, and sign conventions</span>
                      </li>
                      <li>
                        <CheckCircle size={15} className={styles.checkIcon} />
                        <span>Previous year JEE question deconstruction with shortcuts</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Resource Downloads */}
              <div className={styles.resourcesRow}>
                <div className={styles.resourceItem}>
                  <FileText size={18} className={styles.resourceIcon} />
                  <div>
                    <span className={styles.resourceName}>Lecture Handwritten Notes</span>
                    <span className={styles.resourceMeta}>PDF • Formula sheet included</span>
                  </div>
                </div>
                <div className={styles.resourceItem}>
                  <Download size={18} className={styles.resourceIcon} />
                  <div>
                    <span className={styles.resourceName}>Class DPP Problem Set</span>
                    <span className={styles.resourceMeta}>15 Questions with Answer Key</span>
                  </div>
                </div>
              </div>

              <div className={styles.dialogActions}>
                <Button
                  onClick={onClose}
                  variant="secondary"
                  size="md"
                >
                  Close Video Dialog
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
