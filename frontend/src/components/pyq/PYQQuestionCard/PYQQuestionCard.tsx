import React from 'react';
import { ArrowRight, CheckCircle2, XCircle, Clock, FileText, Lock, Sparkles, Download, Play } from 'lucide-react';
import { YoutubeIcon } from '../../ui/YoutubeIcon/YoutubeIcon';
import type { PYQQuestion, PYQUserResponse } from '../../../types';
import { MathText } from '../../ui/MathText/MathText';
import styles from './PYQQuestionCard.module.scss';

interface PYQQuestionCardProps {
  question: PYQQuestion;
  index: number;
  userResponse?: PYQUserResponse;
  isUnlocked?: boolean;
  onOpenQuestion: (idx: number) => void;
  onOpenVideo?: (question: PYQQuestion) => void;
  onUnlockCourse?: () => void;
}

export const PYQQuestionCard: React.FC<PYQQuestionCardProps> = ({
  question,
  index,
  userResponse,
  isUnlocked = true,
  onOpenQuestion,
  onOpenVideo,
  onUnlockCourse
}) => {
  const isEvaluated = Boolean(userResponse?.isEvaluated);
  const isCorrect = Boolean(userResponse?.isCorrect);
  const isAnswered = Boolean(userResponse?.selectedOption);
  const isMarked = Boolean(userResponse?.isMarkedForReview);
  const isFreeQuestion = question.isFree ?? index < 5;

  const getSubjectClass = (subject: string) => {
    switch (subject) {
      case 'Physics': return styles.subjectPhysics;
      case 'Chemistry': return styles.subjectChemistry;
      case 'Mathematics': return styles.subjectMaths;
      default: return styles.subjectDefault;
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handlePdfClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isUnlocked) {
      onUnlockCourse?.();
      return;
    }
    if (question.pdfUrl) {
      window.open(question.pdfUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCardCtaClick = () => {
    if (!isUnlocked) {
      onUnlockCourse?.();
    } else {
      onOpenQuestion(index);
    }
  };

  return (
    <article
      className={`${styles.card} ${!isUnlocked ? styles.cardLocked : ''} ${isAnswered ? styles.cardAttempted : ''}`}
      aria-label={`Question ${index + 1}: ${question.exam} ${question.year} ${question.subject}`}
    >
      {/* 1. Header row: [Q.No badge] [Subject pill] [Year tag: "JEE Main 2024"] [Topic name] */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          {/* [Q.No badge] */}
          <span className={styles.qNoBadge}>Q.{index + 1}</span>

          {/* [Subject pill] */}
          <span className={`${styles.subjectPill} ${getSubjectClass(question.subject)}`}>
            {question.subject}
          </span>

          {/* [Year tag: "JEE Main 2024"] */}
          <span className={styles.yearTag}>
            {question.exam} {question.year}
          </span>

          {/* [Topic name] */}
          <span className={styles.topicTag} title={`Topic: ${question.topic}`}>
            {question.topic}
          </span>
        </div>

        <div className={styles.headerRight}>
          {/* Status Chip */}
          {isMarked && (
            <span className={styles.markedBadge}>Review</span>
          )}

          {isEvaluated ? (
            isCorrect ? (
              <span className={styles.correctStatus}>
                <CheckCircle2 size={13} aria-hidden="true" />
                <span>Correct</span>
              </span>
            ) : (
              <span className={styles.incorrectStatus}>
                <XCircle size={13} aria-hidden="true" />
                <span>Incorrect</span>
              </span>
            )
          ) : isAnswered ? (
            <span className={styles.answeredStatus}>
              <Clock size={13} aria-hidden="true" />
              <span>Attempted</span>
            </span>
          ) : null}

          {/* Marks */}
          <span className={styles.marksBadge}>{question.marks}</span>
        </div>
      </div>

      {/* 2. Mathematical Statement with KaTeX-styled typography & line-height */}
      <div className={styles.statementArea}>
        <div className={styles.statementContent}>
          <MathText text={question.statement} />
        </div>

        {question.formulaKey && (
          <div className={styles.formulaPill}>
            <span className={styles.formulaLabel}>Key Concept:</span>
            <MathText text={question.formulaKey} />
          </div>
        )}
      </div>

      {/* 3. Action Bar: "View Video Solution", "Download PDF", and primary "Practice Question" */}
      <div className={styles.actionsBar}>
        <div className={styles.resourceGroup}>
          {/* "View Video Solution" Button */}
          <button
            type="button"
            onClick={handleVideoClick}
            className={`${styles.actionBtn} ${styles.videoBtn}`}
            title={isUnlocked ? 'Watch DK Sir video solution on YouTube' : 'Unlock course to watch video solution'}
            aria-label={`View Video Solution for Question ${index + 1}`}
          >
            <YoutubeIcon size={16} className={styles.ytRedIcon} aria-hidden="true" />
            <span>View Video Solution</span>
            {question.videoDuration && isUnlocked && (
              <span className={styles.videoDuration}>{question.videoDuration}</span>
            )}
            {!isUnlocked && <Lock size={12} className={styles.miniLock} aria-hidden="true" />}
          </button>

          {/* "Download PDF" Button */}
          <button
            type="button"
            onClick={handlePdfClick}
            className={`${styles.actionBtn} ${styles.pdfBtn}`}
            title={isUnlocked ? 'Download step-by-step PDF solution' : 'Unlock course to download PDF'}
            aria-label={`Download PDF solution for Question ${index + 1}`}
          >
            <FileText size={15} className={styles.pdfBlueIcon} aria-hidden="true" />
            <span>Download PDF</span>
            <Download size={13} className={styles.downloadIcon} aria-hidden="true" />
            {!isUnlocked && <Lock size={12} className={styles.miniLock} aria-hidden="true" />}
          </button>
        </div>

        {/* Primary "Practice Question" CTA */}
        <div className={styles.primaryCtaWrap}>
          {isUnlocked ? (
            <button
              type="button"
              onClick={handleCardCtaClick}
              className={`${styles.primaryPracticeBtn} ${isEvaluated ? styles.reviewBtn : ''}`}
              aria-label={`${isEvaluated ? 'Review' : 'Practice'} Question ${index + 1}`}
            >
              <span>{isEvaluated ? 'Review Solution' : 'Practice Question'}</span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCardCtaClick}
              className={styles.unlockCtaBtn}
              aria-label={`Unlock Question ${index + 1} with Course`}
            >
              <Lock size={13} aria-hidden="true" />
              <span>Unlock Question (₹1,499)</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default PYQQuestionCard;
