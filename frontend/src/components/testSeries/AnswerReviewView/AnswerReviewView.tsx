import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Check,
  X,
  Filter,
} from 'lucide-react';
import type { TestSeriesItem, TestAttempt } from '../../../types';
import styles from './AnswerReviewView.module.scss';

type ReviewFilterType = 'All' | 'Incorrect' | 'Unattempted' | 'Marked';

interface AnswerReviewViewProps {
  test: TestSeriesItem;
  attempt: TestAttempt;
  onBackToResults: () => void;
  onBackToCatalog: () => void;
}

export const AnswerReviewView: React.FC<AnswerReviewViewProps> = ({
  test,
  attempt,
  onBackToResults,
  onBackToCatalog,
}) => {
  const [filter, setFilter] = useState<ReviewFilterType>('All');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter questions based on student's performance
  const filteredQuestions = test.questions.filter((q) => {
    const resp = attempt.responses[q.id];
    if (filter === 'Incorrect') {
      return resp?.selectedOption && resp.selectedOption !== q.correctAnswer;
    }
    if (filter === 'Unattempted') {
      return !resp || !resp.selectedOption;
    }
    if (filter === 'Marked') {
      return resp?.isMarkedForReview;
    }
    return true;
  });

  const activeQuestion = filteredQuestions[currentIndex] || test.questions[0];
  const resp = attempt.responses[activeQuestion?.id];
  const isSelected = Boolean(resp?.selectedOption);
  const isCorrect = resp?.selectedOption === activeQuestion?.correctAnswer;

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((p) => p - 1);
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) setCurrentIndex((p) => p + 1);
  };

  return (
    <div className={styles.reviewContainer}>
      {/* Top Header */}
      <div className={styles.topHeader}>
        <div className={styles.headerLeft}>
          <button type="button" className={styles.backBtn} onClick={onBackToResults}>
            <ArrowLeft size={16} />
            <span>Back to Score Analysis</span>
          </button>
          <div className={styles.titleGroup}>
            <h2 className={styles.reviewTitle}>Detailed Solutions: {test.title}</h2>
          </div>
        </div>

        <button type="button" className={styles.catalogBtn} onClick={onBackToCatalog}>
          <span>All Mock Tests</span>
        </button>
      </div>

      {/* Filter Tabs Row */}
      <div className={styles.filterTabsRow} role="tablist" aria-label="Filter Review Questions">
        <div className={styles.filterGroup}>
          <Filter size={14} className={styles.filterIcon} />
          <span className={styles.filterLabel}>Filter By:</span>
          {(['All', 'Incorrect', 'Unattempted', 'Marked'] as ReviewFilterType[]).map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`${styles.filterTab} ${isActive ? styles.filterTabActive : ''}`}
                onClick={() => {
                  setFilter(f);
                  setCurrentIndex(0);
                }}
              >
                {f} Questions
              </button>
            );
          })}
        </div>

        <span className={styles.filterCount}>
          Showing {filteredQuestions.length} of {test.questions.length} Questions
        </span>
      </div>

      {/* Main Review Workspace */}
      {filteredQuestions.length > 0 && activeQuestion ? (
        <div className={styles.workspaceGrid}>
          {/* Main Question & Solution */}
          <main className={styles.mainContent}>
            <div className={styles.card}>
              {/* Question Header */}
              <div className={styles.qMetaHeader}>
                <div className={styles.qNumberRow}>
                  <span className={styles.qNumber}>
                    Question {activeQuestion.questionNumber}
                  </span>
                  <span className={styles.subjectTag}>{activeQuestion.subject}</span>
                  <span className={styles.chapterTag}>{activeQuestion.chapter}</span>
                </div>

                {/* Score Status Tag */}
                <div className={styles.statusTagWrap}>
                  {isSelected ? (
                    isCorrect ? (
                      <span className={`${styles.scoreTag} ${styles.scoreCorrect}`}>
                        <CheckCircle2 size={14} />
                        <span>Correct (+{test.markingScheme.correct} Marks)</span>
                      </span>
                    ) : (
                      <span className={`${styles.scoreTag} ${styles.scoreIncorrect}`}>
                        <XCircle size={14} />
                        <span>Incorrect (-{test.markingScheme.incorrect} Mark)</span>
                      </span>
                    )
                  ) : (
                    <span className={`${styles.scoreTag} ${styles.scoreUnattempted}`}>
                      <HelpCircle size={14} />
                      <span>Unattempted (0 Marks)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Statement */}
              <div className={styles.statementArea}>
                <p className={styles.statementText}>{activeQuestion.statement}</p>
              </div>

              {/* Options with Answer Highlight */}
              <div className={styles.optionsList}>
                {activeQuestion.options.map((opt) => {
                  const isUserChoice = resp?.selectedOption === opt.id;
                  const isCorrectAnswer = opt.id === activeQuestion.correctAnswer;

                  let optClass = '';
                  if (isCorrectAnswer) {
                    optClass = styles.correctOption;
                  } else if (isUserChoice && !isCorrectAnswer) {
                    optClass = styles.incorrectOption;
                  }

                  return (
                    <div key={opt.id} className={`${styles.optionItem} ${optClass}`}>
                      <div className={styles.radioLetter}>{opt.id}</div>
                      <div className={styles.optionText}>{opt.text}</div>
                      {isCorrectAnswer && (
                        <div className={styles.correctIndicator}>
                          <Check size={16} />
                          <span>Correct Answer</span>
                        </div>
                      )}
                      {isUserChoice && !isCorrectAnswer && (
                        <div className={styles.incorrectIndicator}>
                          <X size={16} />
                          <span>Your Choice</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Solution Box */}
              <div className={styles.solutionBox}>
                <div className={styles.solutionHeader}>
                  <CheckCircle2 size={16} className={styles.solIcon} />
                  <span className={styles.solTitle}>Official Step-by-Step Solution</span>
                </div>

                {activeQuestion.formulaKey && (
                  <div className={styles.formulaRow}>
                    <span className={styles.formulaLabel}>Core Concept & Formula:</span>
                    <code className={styles.formulaCode}>{activeQuestion.formulaKey}</code>
                  </div>
                )}

                <div className={styles.explanationText}>
                  {activeQuestion.explanation}
                </div>
              </div>

              {/* Navigation Row */}
              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  aria-label="Previous Review Question"
                >
                  <ArrowLeft size={16} />
                  <span>Previous</span>
                </button>

                <span className={styles.navProgress}>
                  {currentIndex + 1} of {filteredQuestions.length}
                </span>

                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={handleNext}
                  disabled={currentIndex === filteredQuestions.length - 1}
                  aria-label="Next Review Question"
                >
                  <span>Next</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </main>

          {/* Palette Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarTitle}>Questions in View</h3>
              <div className={styles.paletteGrid}>
                {filteredQuestions.map((q, idx) => {
                  const qResp = attempt.responses[q.id];
                  const qSelected = Boolean(qResp?.selectedOption);
                  const qCorrect = qResp?.selectedOption === q.correctAnswer;
                  const isCurrent = idx === currentIndex;

                  let colorClass = styles.pUnattempted;
                  if (qSelected) {
                    colorClass = qCorrect ? styles.pCorrect : styles.pIncorrect;
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      className={`${styles.paletteBtn} ${colorClass} ${isCurrent ? styles.pActive : ''}`}
                      onClick={() => setCurrentIndex(idx)}
                      aria-label={`Go to Question ${q.questionNumber}`}
                    >
                      {q.questionNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className={styles.emptyFilterBox}>
          <p>No questions matched the selected filter ({filter}).</p>
          <button
            type="button"
            className={styles.resetFilterBtn}
            onClick={() => setFilter('All')}
          >
            Show All Questions
          </button>
        </div>
      )}
    </div>
  );
};
