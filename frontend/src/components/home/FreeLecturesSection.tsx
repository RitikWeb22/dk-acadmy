import React, { useState } from 'react';
import { ArrowRight, Play, X, Clock, BookOpen, CheckCircle, Video } from 'lucide-react';
import { Container } from '../ui/Container/Container';
import { SectionHeading } from '../ui/SectionHeading/SectionHeading';
import { Button } from '../ui/Button/Button';
import { LectureCard } from '../lectures/LectureCard/LectureCard';
import { FEATURED_LECTURES } from '../../data/homepageData';
import type { Lecture } from '../../types';
import styles from './FreeLecturesSection.module.scss';

export const FreeLecturesSection: React.FC = () => {
  const [activeLecture, setActiveLecture] = useState<Lecture | null>(null);

  const handleOpenLecture = (lecture: Lecture) => {
    setActiveLecture(lecture);
  };

  const handleCloseLecture = () => {
    setActiveLecture(null);
  };

  return (
    <section className={styles.section} id="free-lectures" aria-labelledby="free-lectures-heading">
      <Container size="wide">
        <div className={styles.headerRow}>
          <SectionHeading
            eyebrow="Open Access Learning"
            title="Learn for Free"
            description="Explore our curated free video lectures covering critical JEE concepts, high-difficulty derivations, and problem breakdowns with zero paywall."
            align="left"
            className={styles.heading}
          />
          <Button
            to="/free-lectures"
            variant="outline"
            size="md"
            icon={<ArrowRight size={16} />}
          >
            Explore All Free Lectures
          </Button>
        </div>

        <div className={styles.grid}>
          {FEATURED_LECTURES.map((lecture) => (
            <LectureCard
              key={lecture.id}
              lecture={lecture}
              onSelectLecture={handleOpenLecture}
            />
          ))}
        </div>

        {/* Informational banner highlighting zero-paywall pledge */}
        <div className={styles.infoBanner}>
          <div className={styles.infoIconBox}>
            <Play size={20} fill="currentColor" />
          </div>
          <div className={styles.infoContent}>
            <h4 className={styles.infoTitle}>No Credit Card or Subscription Required</h4>
            <p className={styles.infoText}>
              All lectures in this section are permanently free to watch. Chapter practice sheets and formula summaries are provided with each lecture.
            </p>
          </div>
          <Button
            to="/free-lectures"
            variant="primary"
            size="sm"
          >
            Start Learning Now
          </Button>
        </div>
      </Container>

      {/* Accessible Lecture Preview Modal */}
      {activeLecture && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lecture-modal-title"
          onClick={handleCloseLecture}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeBtn}
              onClick={handleCloseLecture}
              aria-label="Close lecture preview"
            >
              <X size={20} />
            </button>

            {/* Video Player Display Screen */}
            <div className={styles.playerContainer}>
              <div className={`${styles.playerPlaceholder} ${styles[activeLecture.subject.toLowerCase()]}`}>
                <div className={styles.playerBrandBadge}>DK ACADEMY JEE • FREE LECTURE</div>
                <div className={styles.playerCenterInfo}>
                  <div className={styles.playCircleIcon}>
                    <Play size={32} fill="currentColor" />
                  </div>
                  <span className={styles.playerSubject}>{activeLecture.subject} • {activeLecture.level}</span>
                  <h3 id="lecture-modal-title" className={styles.playerTitle}>{activeLecture.title}</h3>
                </div>
                <div className={styles.playerBottomControl}>
                  <div className={styles.playerMetaRow}>
                    <span><Clock size={13} /> {activeLecture.duration}</span>
                    <span><BookOpen size={13} /> {activeLecture.chapter}</span>
                    <span><Video size={13} /> 1080p HD Streaming</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body Info */}
            <div className={styles.modalBody}>
              <div className={styles.modalHeader}>
                <span className={styles.modalSubject}>{activeLecture.subject}</span>
                <span className={styles.modalLevel}>{activeLecture.level}</span>
                <span className={styles.modalDuration}>{activeLecture.duration}</span>
              </div>
              <p className={styles.modalDescription}>{activeLecture.description}</p>

              <div className={styles.topicsCovered}>
                <h4 className={styles.topicsTitle}>Concepts covered in this lecture:</h4>
                <ul className={styles.topicsList}>
                  <li>
                    <CheckCircle size={15} className={styles.checkIcon} />
                    <span>Fundamental theory, physical significance and standard derivations</span>
                  </li>
                  <li>
                    <CheckCircle size={15} className={styles.checkIcon} />
                    <span>Common algebraic errors and sign convention pitfalls</span>
                  </li>
                  <li>
                    <CheckCircle size={15} className={styles.checkIcon} />
                    <span>Step-by-step deconstruction of 4 benchmark JEE Advanced questions</span>
                  </li>
                </ul>
              </div>

              <div className={styles.modalActions}>
                <Button
                  to="/free-lectures"
                  variant="primary"
                  size="md"
                  icon={<ArrowRight size={16} />}
                >
                  Open in Full Free Player & Download DPP
                </Button>
                <Button
                  onClick={handleCloseLecture}
                  variant="secondary"
                  size="md"
                >
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
