import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Course } from '../../../types';
import {
  GraduationCap,
  ArrowRight,
  Play,
  Sparkles,
  Lock,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import styles from './CourseOverview.module.scss';

interface CourseOverviewProps {
  enrolledCourses: Course[];
}

const COURSES_PER_PAGE = 3;

export const CourseOverview: React.FC<CourseOverviewProps> = ({ enrolledCourses }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(enrolledCourses.length / COURSES_PER_PAGE));

  // Keep currentPage within valid bounds if enrolled courses list changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * COURSES_PER_PAGE;
  const currentCourses = enrolledCourses.slice(startIndex, startIndex + COURSES_PER_PAGE);

  return (
    <section className={styles.card} aria-labelledby="my-batch-title">
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <span className={styles.eyebrow}>
            <GraduationCap size={15} aria-hidden="true" />
            Active Enrollment
          </span>
          <h2 id="my-batch-title" className={styles.title}>
            My Enrolled Courses ({enrolledCourses.length})
          </h2>
        </div>
        {enrolledCourses.length > 0 && (
          <span className={styles.statusPill}>
            <span className={styles.statusDot} />
            Active Learning
          </span>
        )}
      </div>

      {enrolledCourses.length === 0 ? (
        <div className={styles.emptyWrap}>
          <p className={styles.emptyText}>You are not currently enrolled in any batch.</p>
          <div className={styles.trialInfoStrip}>
            <span>
              🎓 <strong>Free Trial Active:</strong> You can watch the first 5 video lectures of ANY course for free with zero credit card required.
            </span>
          </div>
          <div className={styles.emptyActionsRow}>
            <Link to="/courses" className={styles.primaryBtn}>
              <span>Browse Classroom Batches</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link to="/free-lectures" className={styles.secondaryBtn}>
              <span>Explore 4 Free Masterclass Tracks</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.containerFixed}>
          <div className={styles.coursesList} key={currentPage}>
            {currentCourses.map((c) => {
              const isPaid = c.tier === 'Paid' || (c.numericPrice !== undefined && c.numericPrice > 0);

              return (
                <div key={c.id} className={styles.courseItemCard}>
                  <div className={styles.itemTop}>
                    <div className={styles.itemBadges}>
                      {isPaid ? (
                        <span className={styles.paidBadge}>
                          <Sparkles size={12} />
                          <span>Full Batch Unlocked</span>
                        </span>
                      ) : (
                        <span className={styles.freeBadge}>
                          <Lock size={12} />
                          <span>Free Preview</span>
                        </span>
                      )}
                      <span className={styles.examTag}>{c.targetExam}</span>
                    </div>

                    <h3 className={styles.batchTitle}>{c.title}</h3>

                    <div className={styles.metaRow}>
                      <span className={styles.metaChip}>
                        {c.mode === 'Live' ? 'Classroom Live' : 'Self-Paced'} • {c.targetClass || 'Class 11th'}
                      </span>
                      {c.targetYear && (
                        <span className={styles.yearChip}>{c.targetYear}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.itemActionRow}>
                    <Link to={`/learn/${c.id}`} className={styles.primaryLmsBtn}>
                      <Play size={13} fill="#ffffff" />
                      <span>Enrolled Course</span>
                    </Link>

                    <Link
                      to={`/courses/${c.id}`}
                      className={styles.syllabusGhostBtn}
                      title={`View Syllabus PDF for ${c.title}`}
                      aria-label={`View Syllabus PDF for ${c.title}`}
                    >
                      <FileText size={14} className={styles.docIcon} />
                      <span>Syllabus PDF</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className={styles.paginationBar}>
              <div className={styles.pageCountInfo}>
                Showing <strong>{startIndex + 1}–{Math.min(startIndex + COURSES_PER_PAGE, enrolledCourses.length)}</strong> of <strong>{enrolledCourses.length}</strong>
              </div>

              <div className={styles.paginationControls}>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={styles.pageNavBtn}
                  aria-label="Previous Page"
                  title="Previous Page"
                >
                  <ChevronLeft size={15} />
                </button>

                <div className={styles.pagePills}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`${styles.pagePill} ${pageNum === currentPage ? styles.pagePillActive : ''}`}
                      aria-label={`Go to page ${pageNum}`}
                      aria-current={pageNum === currentPage ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={styles.pageNavBtn}
                  aria-label="Next Page"
                  title="Next Page"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default CourseOverview;
