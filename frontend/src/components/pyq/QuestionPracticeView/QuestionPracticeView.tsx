import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, RotateCcw, FileText, Download, Lock, Sparkles, Bookmark } from 'lucide-react';
import { YoutubeIcon } from '../../ui/YoutubeIcon/YoutubeIcon';
import type { PYQQuestion, PYQUserResponse } from '../../../types';
import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import { MathText } from '../../ui/MathText/MathText';
import { AnswerOptions } from '../AnswerOptions/AnswerOptions';
import { AnswerExplanation } from '../AnswerExplanation/AnswerExplanation';
import styles from './QuestionPracticeView.module.scss';

interface QuestionPracticeViewProps {
  question: PYQQuestion;
  currentIndex: number;
  totalQuestions: number;
  userResponse?: PYQUserResponse;
  isUnlocked?: boolean;
  onSelectOption: (optionId: string) => void;
  onCheckAnswer: () => void;
  onResetQuestion: () => void;
  onPrevQuestion: () => void;
  onNextQuestion: () => void;
  onBackToList: () => void;
  onOpenVideo?: (question: PYQQuestion) => void;
  onUnlockCourse?: () => void;
  onToggleMarkForReview?: () => void;
}

export const QuestionPracticeView: React.FC<QuestionPracticeViewProps> = ({
  question,
  currentIndex,
  totalQuestions,
  userResponse,
  isUnlocked = true,
  onSelectOption,
  onCheckAnswer,
  onResetQuestion,
  onPrevQuestion,
  onNextQuestion,
  onBackToList,
  onOpenVideo,
  onUnlockCourse,
  onToggleMarkForReview
}) => {
  const isSelected = Boolean(userResponse?.selectedOption);
  const isEvaluated = Boolean(userResponse?.isEvaluated);
  const isCorrect = Boolean(userResponse?.isCorrect);
  const isFreeQuestion = question.isFree ?? currentIndex < 5;

  const getSubjectBadgeVariant = (subject: string) => {
    switch (subject) {
      case 'Physics': return 'primary';
      case 'Chemistry': return 'accent';
      case 'Mathematics': return 'warning';
      default: return 'muted';
    }
  };

  const handleVideoClick = () => {
    if (!isUnlocked) {
      onUnlockCourse?.();
      return;
    }
    if (onOpenVideo) {
      onOpenVideo(question);
    } else if (question.youtubeUrl) {
      window.open(question.youtubeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePdfClick = () => {
    if (!isUnlocked) {
      onUnlockCourse?.();
      return;
    }
    if (question.pdfUrl) {
      window.open(question.pdfUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={styles.practiceCard}>
      {/* Top Header Row */}
      <div className={styles.headerRow}>
        <button
          type="button"
          onClick={onBackToList}
          className={styles.backBtn}
          aria-label="Back to all questions list"
        >
          <ArrowLeft size={16} />
          <span>Back to List</span>
        </button>

        <div className={styles.metadataBadges}>
          {/* Access Policy Badge */}
          {isFreeQuestion ? (
            <span className={styles.freePreviewBadge} title="Part of 5 Free Preview Questions">
              <Sparkles size={12} /> Free Question {currentIndex + 1} of 5
            </span>
          ) : isUnlocked ? (
            <span className={styles.enrolledBadge}>
              <CheckCircle size={12} /> Enrolled Access
            </span>
          ) : (
            <span className={styles.lockedBadge}>
              <Lock size={12} /> Course Only
            </span>
          )}

          <Badge variant={getSubjectBadgeVariant(question.subject)} size="sm">
            {question.subject}
          </Badge>
          <span className={styles.examTag}>
            {question.exam} {question.year}
          </span>
          <span className={styles.chapterTag}>
            {question.chapter}
          </span>
          <span className={styles.marksTag}>
            {question.marks}
          </span>
        </div>
      </div>

      {/* Main Question Body OR Locked Course Prompt */}
      {!isUnlocked ? (
        <div className={styles.lockedQuestionState}>
          <div className={styles.lockedIconGraphic}>
            <Lock size={32} />
          </div>

          <div className={styles.lockedInfo}>
            <span className={styles.lockedEyebrow}>Question {currentIndex + 1} Locked</span>
            <h3 className={styles.lockedHeading}>
              You have completed your 5 Free Questions
            </h3>
            <p className={styles.lockedDesc}>
              This question, its step-by-step <strong>YouTube video walkthrough</strong>, and <strong>downloadable solution PDF</strong> are part of the full <strong>10-Year JEE Chapter-Wise PYQ Mastery Course</strong>.
            </p>

            <div className={styles.lockedFeatures}>
              <div className={styles.featurePill}>
                <CheckCircle size={14} className={styles.pillCheck} />
                <span>500+ JEE Main &amp; Advanced Archive</span>
              </div>
              <div className={styles.featurePill}>
                <YoutubeIcon size={14} className={styles.pillYt} />
                <span>DK Sir Video Solutions on YouTube</span>
              </div>
              <div className={styles.featurePill}>
                <FileText size={14} className={styles.pillPdf} />
                <span>All PDF Solution Downloads</span>
              </div>
            </div>

            <div className={styles.lockedCtaRow}>
              <button
                type="button"
                className={styles.enrollNowBtn}
                onClick={onUnlockCourse}
              >
                <span>Unlock Full Course (₹1,499)</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className={styles.backToFreeBtn}
                onClick={onPrevQuestion}
              >
                ← Back to Free Questions
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Question Number & Statement */}
          <div className={styles.statementArea}>
            <div className={styles.questionNumRow}>
              <span className={styles.questionNumLabel}>
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <span className={styles.questionTypeTag}>{question.type}</span>
            </div>

            <div className={styles.statementText}>
              <MathText text={question.statement} />
            </div>

            {question.formulaKey && (
              <div className={styles.formulaKeyBox}>
                <span className={styles.formulaKeyLabel}>Key Formula:</span>
                <MathText text={question.formulaKey} />
              </div>
            )}
          </div>

          {/* Options */}
          {question.options && question.options.length > 0 && (
            <AnswerOptions
              options={question.options}
              selectedOption={userResponse?.selectedOption}
              correctAnswer={question.correctAnswer}
              isEvaluated={isEvaluated}
              onSelectOption={onSelectOption}
            />
          )}

          {/* Action Controls Bar */}
          <div className={styles.actionsBar}>
            <div className={styles.leftActions}>
              {!isEvaluated ? (
                <Button
                  onClick={onCheckAnswer}
                  disabled={!isSelected}
                  variant="primary"
                  size="md"
                  icon={<CheckCircle size={16} />}
                >
                  Check Answer
                </Button>
              ) : (
                <Button
                  onClick={onResetQuestion}
                  variant="outline"
                  size="md"
                  icon={<RotateCcw size={15} />}
                  iconPosition="left"
                >
                  Re-attempt
                </Button>
              )}

              {onToggleMarkForReview && (
                <button
                  type="button"
                  onClick={onToggleMarkForReview}
                  className={`${styles.reviewToggleBtn} ${userResponse?.isMarkedForReview ? styles.reviewToggleActive : ''}`}
                  title="Mark this question to review later"
                >
                  <Bookmark size={15} fill={userResponse?.isMarkedForReview ? 'currentColor' : 'none'} />
                  <span>{userResponse?.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
                </button>
              )}
            </div>

            {/* Previous / Next Navigation */}
            <div className={styles.navigationControls}>
              <Button
                onClick={onPrevQuestion}
                disabled={currentIndex === 0}
                variant="secondary"
                size="md"
                icon={<ArrowLeft size={16} />}
                iconPosition="left"
              >
                Previous
              </Button>
              <Button
                onClick={onNextQuestion}
                disabled={currentIndex === totalQuestions - 1}
                variant="secondary"
                size="md"
                icon={<ArrowRight size={16} />}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Answer Explanation & Official Solution Media (Revealed ONLY when student checks answer) */}
          {isEvaluated ? (
            <div className={styles.evaluatedSolutionSection}>
              {/* Official Solution Video & PDF Resources */}
              <div className={styles.sideResourcePanel}>
                <div className={styles.resourceHeader}>
                  <span className={styles.resourcePanelTitle}>Official Solutions &amp; Media</span>
                  <span className={styles.courseTag}>
                    {question.courseName || 'JEE PYQ Mastery Course'}
                  </span>
                </div>

                <div className={styles.resourceButtonsGrid}>
                  {/* YouTube Video Solution Button */}
                  <button
                    type="button"
                    onClick={handleVideoClick}
                    className={`${styles.ytSolutionBtn} ${!isUnlocked ? styles.resourceBtnDisabled : ''}`}
                    title={isUnlocked ? 'Watch step-by-step video solution on YouTube' : 'Unlock full course to watch'}
                  >
                    <div className={styles.ytIconWrap}>
                      <YoutubeIcon size={18} className={styles.ytIcon} />
                    </div>
                    <div className={styles.btnTextWrap}>
                      <span className={styles.primaryActionText}>
                        {isUnlocked ? 'Watch YouTube Solution' : 'Video Solution (Locked)'}
                      </span>
                      <span className={styles.subActionText}>
                        {isUnlocked
                          ? `DK Sir Walkthrough • ${question.videoDuration || '12:45'}`
                          : 'Requires Course Enrollment'}
                      </span>
                    </div>
                    {!isUnlocked && <Lock size={14} className={styles.lockIcon} />}
                  </button>

                  {/* Solution PDF Download Button */}
                  <button
                    type="button"
                    onClick={handlePdfClick}
                    className={`${styles.pdfSolutionBtn} ${!isUnlocked ? styles.resourceBtnDisabled : ''}`}
                    title={isUnlocked ? 'Download high-res step-by-step PDF' : 'Unlock full course to download PDF'}
                  >
                    <div className={styles.pdfIconWrap}>
                      <FileText size={18} className={styles.pdfIcon} />
                    </div>
                    <div className={styles.btnTextWrap}>
                      <span className={styles.primaryActionText}>
                        {isUnlocked ? 'Download Solution PDF' : 'Solution PDF (Locked)'}
                      </span>
                      <span className={styles.subActionText}>
                        {isUnlocked ? 'Step-by-step Kota notes & key' : 'Requires Course Enrollment'}
                      </span>
                    </div>
                    {isUnlocked ? (
                      <Download size={14} className={styles.downloadIcon} />
                    ) : (
                      <Lock size={14} className={styles.lockIcon} />
                    )}
                  </button>
                </div>
              </div>

              <AnswerExplanation
                question={question}
                userAnswer={userResponse?.selectedOption}
                isCorrect={isCorrect}
              />
            </div>
          ) : (
            <div className={styles.solveFirstNotice}>
              <Sparkles size={14} className={styles.sparkleIcon} />
              <span>
                Attempt this question and click <strong>Check Answer</strong> to reveal DK Sir’s step-by-step YouTube video solution and download the PDF.
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
