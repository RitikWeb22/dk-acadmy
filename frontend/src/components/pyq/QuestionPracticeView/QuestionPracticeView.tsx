import React, { useMemo } from 'react';
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
  paperVideoUrl?: string;
  paperPdfUrl?: string;
  onSelectOption: (optionId: string) => void;
  onCheckAnswer: () => void;
  onResetQuestion: () => void;
  onPrevQuestion: () => void;
  onNextQuestion: () => void;
  onBackToList: () => void;
  onOpenVideo?: (question: PYQQuestion) => void;
  onUnlockCourse?: () => void;
  onToggleMarkForReview?: () => void;
  paperPrice?: number;
}

export const QuestionPracticeView: React.FC<QuestionPracticeViewProps> = ({
  question,
  currentIndex,
  totalQuestions,
  userResponse,
  isUnlocked = true,
  paperVideoUrl,
  paperPdfUrl,
  onSelectOption,
  onCheckAnswer,
  onResetQuestion,
  onPrevQuestion,
  onNextQuestion,
  onBackToList,
  onOpenVideo,
  onUnlockCourse,
  onToggleMarkForReview,
  paperPrice = 499
}) => {
  const isSelected = Boolean(userResponse?.selectedOption);
  const isEvaluated = Boolean(userResponse?.isEvaluated);
  const isCorrect = Boolean(userResponse?.isCorrect);
  const isFreeQuestion = question.isFree ?? currentIndex < 5;

  const effectiveQuestion: PYQQuestion = useMemo(() => ({
    ...question,
    youtubeUrl: question.youtubeUrl || question.videoUrl || paperVideoUrl || '',
    videoUrl: question.videoUrl || question.youtubeUrl || paperVideoUrl || '',
    pdfUrl: question.pdfUrl || paperPdfUrl || ''
  }), [question, paperVideoUrl, paperPdfUrl]);

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
    const targetVideo = effectiveQuestion.youtubeUrl || effectiveQuestion.videoUrl;
    if (onOpenVideo && targetVideo) {
      onOpenVideo(effectiveQuestion);
    } else if (targetVideo) {
      window.open(targetVideo, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePdfClick = () => {
    if (!isUnlocked) {
      onUnlockCourse?.();
      return;
    }
    const targetPdf = effectiveQuestion.pdfUrl;
    if (targetPdf) {
      window.open(targetPdf, '_blank', 'noopener,noreferrer');
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
            <span className={styles.freePreviewBadge} title="Free Preview Question">
              <Sparkles size={12} /> Free Preview
            </span>
          ) : isUnlocked ? (
            <span className={styles.enrolledBadge}>
              <CheckCircle size={12} /> Full Paper Access
            </span>
          ) : (
            <span className={styles.lockedBadge}>
              <Lock size={12} /> Locked Paper
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

      {/* Paper-Level Video Walkthrough & Solution PDF Bar */}
      {(paperVideoUrl || paperPdfUrl) && (
        <div className={styles.paperMediaActionRow}>
          <div className={styles.paperMediaTitle}>
            <Sparkles size={14} className={styles.paperMediaSparkle} />
            <span>Complete Paper Solutions &amp; Walkthrough:</span>
          </div>
          <div className={styles.paperMediaButtons}>
            {paperVideoUrl && (
              <a
                href={paperVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.paperVideoBtn}
                title="Watch Full Paper Video Walkthrough"
              >
                <YoutubeIcon size={15} />
                <span>Full Video Walkthrough</span>
              </a>
            )}
            {paperPdfUrl && (
              <a
                href={paperPdfUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className={styles.paperPdfBtn}
                title="Download Complete Solution PDF"
              >
                <FileText size={14} />
                <span>Solution PDF</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Main Question Body OR Locked Course Prompt */}
      {!isUnlocked ? (
        <div className={styles.lockedQuestionState}>
          <div className={styles.lockedIconGraphic}>
            <Lock size={32} />
          </div>

          <div className={styles.lockedInfo}>
            <span className={styles.lockedEyebrow}>Question {currentIndex + 1} Locked</span>
            <h3 className={styles.lockedHeading}>
              Unlock Complete Paper
            </h3>
            <p className={styles.lockedDesc}>
              This question, its step-by-step <strong>mathematical derivation</strong>, <strong>video solution</strong>, and <strong>downloadable solution PDF</strong> are part of this complete paper archive.
            </p>

            <div className={styles.lockedFeatures}>
              <div className={styles.featurePill}>
                <CheckCircle size={14} className={styles.pillCheck} />
                <span>All Paper Questions &amp; Solutions</span>
              </div>
              <div className={styles.featurePill}>
                <YoutubeIcon size={14} className={styles.pillYt} />
                <span>DK Sir Video Solutions</span>
              </div>
              <div className={styles.featurePill}>
                <FileText size={14} className={styles.pillPdf} />
                <span>Downloadable Solution PDF</span>
              </div>
            </div>

            <div className={styles.lockedCtaRow}>
              <button
                type="button"
                className={styles.enrollNowBtn}
                onClick={onUnlockCourse}
              >
                <span>Unlock Complete Paper (₹{paperPrice})</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className={styles.backToFreeBtn}
                onClick={onPrevQuestion}
              >
                ← Back to Free Preview
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

          {/* Answer Explanation & Step-by-Step Solution Media (Revealed ONLY when student checks answer) */}
          {isEvaluated ? (
            <div className={styles.evaluatedSolutionSection}>
              <AnswerExplanation
                question={effectiveQuestion}
                userAnswer={userResponse?.selectedOption}
                isCorrect={isCorrect}
                isUnlocked={isUnlocked}
                onWatchVideo={handleVideoClick}
                onDownloadPdf={handlePdfClick}
              />
            </div>
          ) : (
            <div className={styles.solveFirstNotice}>
              <Sparkles size={14} className={styles.sparkleIcon} />
              <span>
                Attempt this question and click <strong>Check Answer</strong> to reveal DK Sir’s step-by-step mathematical derivation, YouTube video walkthrough, and solution PDF.
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
