import React from 'react';
import { Link } from 'react-router-dom';
import type { TestAttempt, TestSeriesItem } from '../../../types';
import {
  Trophy,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Play,
  BarChart3
} from 'lucide-react';
import styles from './TestPerformance.module.scss';

import { useStudentAuth } from '../../../context/AuthContext';

interface EvaluatedTestSummary {
  testId: string;
  title: string;
  examType: string;
  format: string;
  totalScore: number;
  maxScore: number;
  correctCount: number;
  attemptedCount: number;
  totalQuestions: number;
  accuracy: number;
  submittedDateText: string;
  isSubmitted: boolean;
}

interface TestPerformanceProps {
  attempts: Record<string, TestAttempt>;
  allTests: TestSeriesItem[];
}

export const TestPerformance: React.FC<TestPerformanceProps> = ({ attempts, allTests }) => {
  const { student } = useStudentAuth();
  const isDemo = student?.id === 'std_demo_2026';

  // Filter active test attempts
  const attemptedEntries = Object.entries(attempts).filter(([_, att]) => att.status !== 'Not Started');

  // Evaluate genuine metrics for each attempted test
  let evaluatedTests: EvaluatedTestSummary[] = attemptedEntries.map(([testId, att]) => {
    const test = allTests.find((t) => t.id === testId);
    const questions = test?.questions || [];
    const scheme = test?.markingScheme || { correct: 4, incorrect: 1, unattempted: 0 };

    let correctCount = 0;
    let incorrectCount = 0;
    let attemptedCount = 0;
    let score = 0;

    questions.forEach((q) => {
      const resp = att.responses?.[q.id];
      if (resp && resp.selectedOption) {
        attemptedCount++;
        if (resp.selectedOption === q.correctAnswer) {
          correctCount++;
          score += scheme.correct;
        } else {
          incorrectCount++;
          score -= scheme.incorrect;
        }
      }
    });

    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const maxScore = test?.totalMarks || (questions.length * 4) || 24;

    let submittedDateText = 'Oct 22, 2026';
    if (att.submittedAt) {
      submittedDateText = new Intl.DateTimeFormat('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(new Date(att.submittedAt));
    }

    return {
      testId,
      title: test ? test.title : 'JEE Main Full Syllabus Mock Test 01',
      examType: test ? test.examType : 'JEE MAIN',
      format: test ? test.format : 'Full Mock',
      totalScore: Math.max(0, score),
      maxScore,
      correctCount,
      attemptedCount,
      totalQuestions: questions.length || 6,
      accuracy,
      submittedDateText,
      isSubmitted: att.isSubmitted || att.status === 'Completed'
    };
  });

  // Provide realistic demo cards ONLY for demo account
  if (evaluatedTests.length === 0 && isDemo) {
    evaluatedTests = [
      {
        testId: 'jee-main-mock-01',
        title: 'JEE Main Full Syllabus Mock Test 01',
        examType: 'JEE MAIN',
        format: 'Full Mock',
        totalScore: 0,
        maxScore: 24,
        correctCount: 0,
        attemptedCount: 0,
        totalQuestions: 6,
        accuracy: 0,
        submittedDateText: 'Oct 22, 2026',
        isSubmitted: true
      },
      {
        testId: 'jee-main-part-test-01',
        title: 'JEE Main Part Test: Mechanics & Physical Chemistry',
        examType: 'JEE MAIN',
        format: 'Part Test',
        totalScore: 0,
        maxScore: 16,
        correctCount: 0,
        attemptedCount: 0,
        totalQuestions: 4,
        accuracy: 0,
        submittedDateText: 'In Progress',
        isSubmitted: false
      }
    ];
  } else if (evaluatedTests.length === 1 && evaluatedTests[0].isSubmitted && isDemo) {
    evaluatedTests.push({
      testId: 'jee-main-part-test-01',
      title: 'JEE Main Part Test: Mechanics & Physical Chemistry',
      examType: 'JEE MAIN',
      format: 'Part Test',
      totalScore: 0,
      maxScore: 16,
      correctCount: 0,
      attemptedCount: 0,
      totalQuestions: 4,
      accuracy: 0,
      submittedDateText: 'In Progress',
      isSubmitted: false
    });
  }

  const completedCount = evaluatedTests.filter((t) => t.isSubmitted).length;

  return (
    <section className={styles.section} aria-labelledby="test-performance-title">
      <div className={styles.sectionHeader}>
        <div className={styles.titleGroup}>
          <div className={styles.iconBox}>
            <Trophy size={18} aria-hidden="true" />
          </div>
          <h2 id="test-performance-title" className={styles.sectionTitle}>
            CBT Mock Test Performance
          </h2>
          <span className={styles.evalCountBadge}>{completedCount} Evaluated</span>
        </div>

        <Link to="/test-series" className={styles.viewAllLink}>
          <span>Test Series Portal</span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {evaluatedTests.length === 0 ? (
        <div style={{ padding: '36px 16px', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Trophy size={32} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: '#1e293b', fontWeight: 700 }}>
            No CBT Mock Tests Attempted Yet
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#64748b', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
            Simulate official NTA CBT examination conditions with chapter-wise and full-syllabus mock tests to evaluate your All-India rank &amp; percentile.
          </p>
          <Link
            to="/test-series"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '8px',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            <span>Launch Mock Test Series</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className={styles.testGrid}>
        {evaluatedTests.slice(0, 2).map((item) => {
          const scorePercent =
            item.maxScore > 0 ? Math.round((item.totalScore / item.maxScore) * 100) : 0;
          const attemptedPercent =
            item.totalQuestions > 0
              ? Math.round((item.attemptedCount / item.totalQuestions) * 100)
              : 0;

          return (
            <div key={item.testId} className={styles.testCard}>
              {/* Top Row: Meta Tags & Date */}
              <div className={styles.testTopRow}>
                <div className={styles.tagGroup}>
                  <span className={styles.examTag}>{item.examType}</span>
                  <span className={styles.formatTag}>{item.format}</span>
                  {item.isSubmitted ? (
                    <span className={styles.evaluatedBadge}>Evaluated</span>
                  ) : (
                    <span className={styles.pausedBadge}>Session Paused</span>
                  )}
                </div>

                <div className={styles.dateTag}>
                  <Calendar size={12} aria-hidden="true" />
                  <span>{item.submittedDateText}</span>
                </div>
              </div>

              {/* Test Title */}
              <h3 className={styles.testTitle}>{item.title}</h3>

              {/* 3-Stat Inline Grid */}
              <div className={styles.inlineStatsGrid}>
                <div className={styles.statCell}>
                  <span className={styles.statLabel}>Total Score</span>
                  <div className={styles.scoreValWrap}>
                    <span className={styles.scoredVal}>{item.totalScore}</span>
                    <span className={styles.maxVal}>/{item.maxScore}</span>
                  </div>
                </div>

                <div className={styles.statCell}>
                  <span className={styles.statLabel}>Accuracy</span>
                  <div className={styles.accuracyVal}>
                    {item.isSubmitted ? `${item.accuracy}%` : 'Pending'}
                  </div>
                </div>

                <div className={styles.statCell}>
                  <span className={styles.statLabel}>Questions Attempted</span>
                  <div className={styles.questionsVal}>
                    {item.attemptedCount}/{item.totalQuestions}
                  </div>
                </div>
              </div>

              {/* Diagnostic Progress Bar */}
              <div className={styles.diagnosticTrackWrap}>
                <div className={styles.diagnosticTrack}>
                  <div
                    className={
                      item.isSubmitted
                        ? styles.diagnosticFillEvaluated
                        : styles.diagnosticFillPaused
                    }
                    style={{
                      width: item.isSubmitted
                        ? `${Math.max(scorePercent, 8)}%`
                        : `${Math.max(attemptedPercent, 12)}%`
                    }}
                  />
                </div>
                <div className={styles.diagnosticLabels}>
                  <span>Performance Metric</span>
                  <span>{item.isSubmitted ? 'All India Scorecard' : 'Resumable CBT'}</span>
                </div>
              </div>

              {/* Card Action */}
              <div className={styles.cardFooter}>
                {item.isSubmitted ? (
                  <Link to="/test-series" className={styles.outlineReviewBtn}>
                    <BarChart3 size={15} />
                    <span>View Detailed Analysis</span>
                    <ArrowUpRight size={14} />
                  </Link>
                ) : (
                  <Link to="/test-series" className={styles.solidResumeBtn}>
                    <Play size={14} fill="#ffffff" />
                    <span>Resume Mock Test</span>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}
    </section>
  );
};

export default TestPerformance;
