import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  ArrowUpRight,
  Sparkles,
  BookOpen
} from 'lucide-react';
import type { StudentProfile } from '../../../types';
import type { ContinueLearningItem } from '../ContinueLearningCard/ContinueLearningCard';
import styles from './DashboardHeader.module.scss';

interface DashboardHeaderProps {
  student: StudentProfile | null;
  activeItem?: ContinueLearningItem | null;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ student, activeItem }) => {
  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  const displayName = student?.name ? student.name.trim() : 'Aspirant';
  const targetExam = student?.targetExam || 'JEE Main & Advanced';
  const targetYear = student?.targetYear || '2028';
  const examTag = `${targetExam} ${targetYear}`;

  // Check if student is new (not demo account and no enrollments or attempts yet)
  const isNewStudent =
    student?.id !== 'std_demo_2026' &&
    (!student?.enrolledCourseIds || student.enrolledCourseIds.length === 0);

  // Dynamic Spotlight configuration
  const spotlightTitle = isNewStudent
    ? 'Welcome to DK Academy! Begin Your Kota JEE Preparation Journey'
    : activeItem?.title || 'JEE Main Part Test: Mechanics & Physical Chemistry';

  const spotlightTag = isNewStudent
    ? 'NEW ASPIRANT ONBOARDING • KOTA PEDAGOGY'
    : 'IN PROGRESS • NTA PATTERN';

  const destinationRoute = isNewStudent ? '/courses' : activeItem?.route || '/test-series';

  const btnLabel = isNewStudent ? 'Browse Classroom Batches' : 'Resume Mock Test';

  const progressPercent = isNewStudent
    ? 100
    : typeof activeItem?.progressPercent === 'number'
    ? activeItem.progressPercent
    : 0;

  const progressText = isNewStudent
    ? 'Account Active • Choose your batch or start daily practice DPPs'
    : activeItem?.statusText || '0 of 4 answered • 0% completed';

  return (
    <section className={styles.commandHero} aria-labelledby="dashboard-command-heading">
      {/* Background ambient decorative glow */}
      <div className={styles.ambientGlow} aria-hidden="true" />

      {/* Top Bar: Student Greeting & Target Exam Badge (Notification bell removed per requirement) */}
      <div className={styles.topBar}>
        <div className={styles.greetingMeta}>
          <div className={styles.greetingTitleRow}>
            <h1 id="dashboard-command-heading" className={styles.greetingTitle}>
              Welcome back, {displayName}! 👋
            </h1>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.dateChip}>{todayFormatted}</span>
            <span className={styles.examTargetPill}>{examTag}</span>
            {isNewStudent && (
              <span className={styles.dateChip} style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                ✨ Fresh Aspirant Profile
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Unified "Resume Learning" or "Fresh Aspirant Onboarding" Spotlight Console */}
      <div className={styles.spotlightCard}>
        <div className={styles.spotlightLeft}>
          <div className={styles.spotlightBadge}>
            {isNewStudent ? (
              <Sparkles size={13} className={styles.zapIcon} />
            ) : (
              <Zap size={13} className={styles.zapIcon} />
            )}
            <span>{spotlightTag}</span>
          </div>

          <h2 className={styles.spotlightTitle}>{spotlightTitle}</h2>

          {/* Segmented Progress Track */}
          <div className={styles.progressContainer}>
            <div className={styles.segmentedBar}>
              {[0, 1, 2, 3].map((segIndex) => {
                const isFilled = progressPercent >= (segIndex + 1) * 25;
                const isPartiallyFilled =
                  !isFilled && progressPercent > segIndex * 25;
                return (
                  <div key={segIndex} className={styles.segmentTrack}>
                    <div
                      className={styles.segmentFill}
                      style={{
                        width: isFilled
                          ? '100%'
                          : isPartiallyFilled
                          ? `${((progressPercent - segIndex * 25) / 25) * 100}%`
                          : '0%'
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <span className={styles.progressText}>{progressText}</span>
          </div>
        </div>

        <div className={styles.spotlightRight}>
          <Link to={destinationRoute} className={styles.resumeBtn}>
            {isNewStudent ? (
              <>
                <BookOpen size={16} />
                <span>{btnLabel}</span>
              </>
            ) : (
              <>
                <span>{btnLabel}</span>
                <ArrowUpRight size={18} className={styles.btnArrow} />
              </>
            )}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DashboardHeader;
