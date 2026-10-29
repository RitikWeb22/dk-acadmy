import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  GraduationCap,
  BookOpen,
  HelpCircle,
  FileQuestion,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Container } from '../../components/ui/Container/Container';
import styles from './NotFoundPage.module.scss';

export const NotFoundPage: React.FC = () => {
  useEffect(() => {
    document.title = '404 - Page Not Found | DK Academy JEE';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className={styles.notFoundWrapper}>
      <Container>
        <div className={styles.contentContainer}>
          <div className={styles.glitchNumber}>
            404
            <div className={styles.glowPill}>Function Undefined</div>
          </div>

          <h1 className={styles.headline}>Outside Syllabus Domain!</h1>
          <p className={styles.subtext}>
            The lecture, practice problem, or page you were trying to access has been moved, renamed, or does not exist in our curriculum.
          </p>

          <div className={styles.actionsGroup}>
            <Link to="/" className={styles.primaryBtn}>
              <Home size={18} />
              <span>Back to Home</span>
            </Link>
            <Link to="/courses" className={styles.secondaryBtn}>
              <GraduationCap size={18} />
              <span>Browse JEE Batches</span>
            </Link>
          </div>

          <div className={styles.quickNavCard}>
            <div className={styles.cardTitle}>Quick Student Destinations</div>
            <div className={styles.linksGrid}>
              <Link to="/courses" className={styles.quickLink}>
                <GraduationCap size={16} className={styles.linkIcon} />
                <span>All Courses</span>
              </Link>
              <Link to="/free-lectures" className={styles.quickLink}>
                <BookOpen size={16} className={styles.linkIcon} />
                <span>Free Lectures</span>
              </Link>
              <Link to="/pyq" className={styles.quickLink}>
                <FileQuestion size={16} className={styles.linkIcon} />
                <span>PYQ Question Bank</span>
              </Link>
              <Link to="/dpp" className={styles.quickLink}>
                <Layers size={16} className={styles.linkIcon} />
                <span>Daily Practice DPP</span>
              </Link>
              <Link to="/test-series" className={styles.quickLink}>
                <HelpCircle size={16} className={styles.linkIcon} />
                <span>CBT Test Series</span>
              </Link>
              <Link to="/about" className={styles.quickLink}>
                <ArrowRight size={16} className={styles.linkIcon} />
                <span>About DK Sir</span>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default NotFoundPage;
