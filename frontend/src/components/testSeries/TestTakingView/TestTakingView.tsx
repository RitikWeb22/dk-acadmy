import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  RotateCcw,
  Send,
  Check,
  ShieldAlert,
} from 'lucide-react';
import type { TestSeriesItem, TestQuestionResponse } from '../../../types';
import { CountdownTimer } from '../CountdownTimer/CountdownTimer';
import { QuestionPalette } from '../QuestionPalette/QuestionPalette';
import { SubmitConfirmationModal } from '../SubmitConfirmationModal/SubmitConfirmationModal';
import styles from './TestTakingView.module.scss';

interface TestTakingViewProps {
  test: TestSeriesItem;
  startTime: number;
  savedResponses?: Record<string, TestQuestionResponse>;
  onSaveProgress: (responses: Record<string, TestQuestionResponse>) => void;
  onSubmitTest: (responses: Record<string, TestQuestionResponse>) => void;
  onExitTest: () => void;
}

export const TestTakingView: React.FC<TestTakingViewProps> = ({
  test,
  startTime,
  savedResponses = {},
  onSaveProgress,
  onSubmitTest,
  onExitTest,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, TestQuestionResponse>>(() => {
    const initial = { ...savedResponses };
    // Mark first question as visited
    if (test.questions.length > 0) {
      const q1Id = test.questions[0].id;
      if (!initial[q1Id]) {
        initial[q1Id] = { isMarkedForReview: false, isVisited: true };
      } else {
        initial[q1Id].isVisited = true;
      }
    }
    return initial;
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isExitWarningOpen, setIsExitWarningOpen] = useState(false);

  const totalQuestions = test.questions.length;
  const currentQuestion = test.questions[currentIndex];
  const currentResponse = responses[currentQuestion.id] || { isMarkedForReview: false, isVisited: true };

  // Helper to change question index and mark target question as visited
  const navigateToQuestion = (targetIndex: number) => {
    setCurrentIndex(targetIndex);
    const targetQ = test.questions[targetIndex];
    if (targetQ && !responses[targetQ.id]?.isVisited) {
      const updated = {
        ...responses,
        [targetQ.id]: {
          ...(responses[targetQ.id] || { isMarkedForReview: false }),
          isVisited: true,
        },
      };
      setResponses(updated);
      onSaveProgress(updated);
    }
  };

  // Derived counts
  const answeredCount = Object.keys(responses).filter(
    (id) => Boolean(responses[id]?.selectedOption)
  ).length;

  const markedCount = Object.keys(responses).filter(
    (id) => Boolean(responses[id]?.isMarkedForReview)
  ).length;

  // Handle option selection
  const handleSelectOption = (optionId: string) => {
    const updated = {
      ...responses,
      [currentQuestion.id]: {
        ...currentResponse,
        selectedOption: optionId,
        isVisited: true,
      },
    };
    setResponses(updated);
    onSaveProgress(updated);
  };

  // Clear current response
  const handleClearResponse = () => {
    const nextResponse = { ...currentResponse };
    delete nextResponse.selectedOption;

    const updated = {
      ...responses,
      [currentQuestion.id]: nextResponse,
    };
    setResponses(updated);
    onSaveProgress(updated);
  };

  // Toggle Mark for Review
  const handleToggleMark = () => {
    const updated = {
      ...responses,
      [currentQuestion.id]: {
        ...currentResponse,
        isMarkedForReview: !currentResponse.isMarkedForReview,
        isVisited: true,
      },
    };
    setResponses(updated);
    onSaveProgress(updated);
  };

  // Navigation handlers
  const handlePrev = () => {
    if (currentIndex > 0) {
      navigateToQuestion(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      navigateToQuestion(currentIndex + 1);
    }
  };

  // Automatic submission when timer expires
  const handleTimerExpire = () => {
    setIsConfirmOpen(false);
    onSubmitTest(responses);
  };

  // Final submission confirmed by student
  const handleConfirmSubmit = () => {
    setIsConfirmOpen(false);
    onSubmitTest(responses);
  };

  // Subject sections filter tabs (e.g. Physics, Chemistry, Math)
  const currentSubject = currentQuestion.subject;
  const handleSubjectTabClick = (sub: string) => {
    const firstQIndex = test.questions.findIndex((q) => q.subject === sub);
    if (firstQIndex !== -1) {
      navigateToQuestion(firstQIndex);
    }
  };

  return (
    <div className={styles.testContainer}>
      {/* Top Test Navigation Bar */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button
            type="button"
            className={styles.exitBtn}
            onClick={() => setIsExitWarningOpen(true)}
            aria-label="Pause or exit mock test"
          >
            <ArrowLeft size={16} />
            <span>Leave Test</span>
          </button>

          <div className={styles.testTitleGroup}>
            <h2 className={styles.testTitle}>{test.title}</h2>
            <div className={styles.badgeGroup}>
              <span className={styles.examTag}>{test.examType}</span>
              <span className={styles.formatTag}>{test.format}</span>
            </div>
          </div>
        </div>

        {/* Right Header Area: Timer & Submit */}
        <div className={styles.topBarRight}>
          <CountdownTimer
            startTime={startTime}
            durationMinutes={test.durationMinutes}
            onTimeExpire={handleTimerExpire}
          />

          <button
            type="button"
            className={styles.headerSubmitBtn}
            onClick={() => setIsConfirmOpen(true)}
          >
            <Send size={15} />
            <span>Submit Test</span>
          </button>
        </div>
      </header>

      {/* Subject Section Tabs (for multi-subject full mocks) */}
      {test.subjects.length > 1 && (
        <nav className={styles.subjectTabsBar} aria-label="Subject Sections">
          <span className={styles.subjectTabsLabel}>Sections:</span>
          {test.subjects.map((sub) => {
            const isActive = sub === currentSubject;
            const subQuestions = test.questions.filter((q) => q.subject === sub);
            const subAnswered = subQuestions.filter((q) => Boolean(responses[q.id]?.selectedOption)).length;

            return (
              <button
                key={sub}
                type="button"
                className={`${styles.subjectTab} ${isActive ? styles.subjectTabActive : ''}`}
                onClick={() => handleSubjectTabClick(sub)}
              >
                <span>{sub}</span>
                <span className={styles.subCount}>
                  ({subAnswered}/{subQuestions.length})
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Main Examination Layout */}
      <div className={styles.workspaceGrid}>
        {/* Left Column: Question Area */}
        <main className={styles.questionPanel}>
          <div className={styles.questionCard}>
            {/* Question Meta Header */}
            <div className={styles.questionMetaHeader}>
              <div className={styles.questionNumGroup}>
                <span className={styles.qNumber}>Question {currentIndex + 1}</span>
                <span className={styles.qTotal}>of {totalQuestions}</span>
                <span className={styles.subjectBadge}>{currentQuestion.subject}</span>
                <span className={styles.chapterBadge}>{currentQuestion.chapter}</span>
              </div>

              <div className={styles.marksBadge}>
                +{test.markingScheme.correct} / -{test.markingScheme.incorrect} Marks
              </div>
            </div>

            {/* Question Statement */}
            <div className={styles.statementArea}>
              <p className={styles.statementText}>{currentQuestion.statement}</p>
            </div>

            {/* MCQ Options List */}
            <div
              className={styles.optionsList}
              role="radiogroup"
              aria-label={`Options for Question ${currentIndex + 1}`}
            >
              {currentQuestion.options.map((opt) => {
                const isSelected = currentResponse.selectedOption === opt.id;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`${styles.optionBtn} ${isSelected ? styles.selectedOption : ''}`}
                    onClick={() => handleSelectOption(opt.id)}
                  >
                    <div className={styles.radioLetter}>{opt.id}</div>
                    <div className={styles.optionText}>{opt.text}</div>
                    {isSelected && (
                      <div className={styles.selectedCheckWrap}>
                        <Check size={18} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions Row */}
            <div className={styles.actionRow}>
              <div className={styles.actionLeft}>
                <button
                  type="button"
                  className={`${styles.markBtn} ${currentResponse.isMarkedForReview ? styles.markActive : ''}`}
                  onClick={handleToggleMark}
                  aria-pressed={currentResponse.isMarkedForReview}
                >
                  <Bookmark size={14} />
                  <span>
                    {currentResponse.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
                  </span>
                </button>

                {currentResponse.selectedOption && (
                  <button
                    type="button"
                    className={styles.clearBtn}
                    onClick={handleClearResponse}
                  >
                    <RotateCcw size={14} />
                    <span>Clear Response</span>
                  </button>
                )}
              </div>

              <div className={styles.actionRight}>
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  aria-label="Previous Question"
                >
                  <ArrowLeft size={16} />
                  <span>Previous</span>
                </button>

                {currentIndex < totalQuestions - 1 ? (
                  <button
                    type="button"
                    className={styles.nextBtn}
                    onClick={handleNext}
                    aria-label="Next Question"
                  >
                    <span>Save & Next</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.submitFinalBtn}
                    onClick={() => setIsConfirmOpen(true)}
                  >
                    <Send size={15} />
                    <span>Submit Test</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Right Column: Palette & Progress Panel */}
        <aside className={styles.sidebar}>
          {/* Progress Card */}
          <div className={styles.progressCard}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>Attempt Progress</span>
              <span className={styles.progressScore}>
                {answeredCount} / {totalQuestions} Answered
              </span>
            </div>
            <div className={styles.progressBarBg}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Palette */}
          <QuestionPalette
            questions={test.questions}
            currentIndex={currentIndex}
            onSelectIndex={(idx) => navigateToQuestion(idx)}
            responses={responses}
          />

          {/* Primary Submit Button in Sidebar */}
          <button
            type="button"
            className={styles.sidebarSubmitBtn}
            onClick={() => setIsConfirmOpen(true)}
          >
            <Send size={16} />
            <span>Submit Full Test</span>
          </button>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      <SubmitConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        markedCount={markedCount}
      />

      {/* Exit Test Warning Modal */}
      {isExitWarningOpen && (
        <div
          className={styles.exitModalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-modal-title"
        >
          <div className={styles.exitModalCard}>
            <div className={styles.warnIconWrap}>
              <ShieldAlert size={28} />
            </div>
            <h3 id="exit-modal-title" className={styles.exitModalTitle}>
              Leave Examination?
            </h3>
            <p className={styles.exitModalText}>
              Your current answers and elapsed time are saved in local session storage, but the test timer continues running. Do you want to return to the catalog?
            </p>
            <div className={styles.exitModalActions}>
              <button
                type="button"
                className={styles.stayBtn}
                onClick={() => setIsExitWarningOpen(false)}
              >
                Stay in Test
              </button>
              <button
                type="button"
                className={styles.leaveBtn}
                onClick={() => {
                  setIsExitWarningOpen(false);
                  onExitTest();
                }}
              >
                Yes, Leave Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
