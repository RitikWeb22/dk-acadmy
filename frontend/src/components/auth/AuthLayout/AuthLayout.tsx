import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Award,
  BookOpen,
  ShieldCheck,
  Compass,
  CheckCircle2,
  MapPin
} from 'lucide-react';
import styles from './AuthLayout.module.scss';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  badgeText?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  children,
  badgeText = 'Student Portal'
}) => {
  return (
    <div className={styles.authPage}>
      <div className={styles.authContainer}>
        {/* Mobile Header: Short header (logo + one sentence) */}
        <header className={styles.mobileHeroHeader} aria-label="DK Academy JEE Portal">
          <Link to="/" className={styles.mobileBrand} aria-label="DK Academy JEE Homepage">
            <span className={styles.logoBold}>DK ACADEMY</span>
            <span className={styles.brandBadge}>JEE</span>
          </Link>
          <p className={styles.mobileSummary}>
            Official student portal for IIT JEE Mathematics, CBT mock tests, and chapter DPPs.
          </p>
        </header>

        {/* Left Value Panel (Desktop Split-Screen) - Aligned at top with form card */}
        <aside className={styles.leftPanel} aria-label="DK Academy JEE Educational Value">
          <div className={styles.leftContent}>
            {/* Value Headline & Supporting Copy */}
            <div className={styles.heroTextGroup}>
              <div className={styles.portalTag}>
                <Compass size={14} aria-hidden="true" />
                <span>{badgeText}</span>
              </div>
              <h1 className={styles.headline}>
                Your JEE preparation <span className={styles.highlight}>starts here.</span>
              </h1>
              <p className={styles.supportingText}>
                Master IIT JEE Mathematics and Physics with DK Sir's proven 20–30s speed techniques,
                full CBT mock tests, and structured chapter-wise learning.
              </p>
            </div>

            {/* 3 Honest Benefit Rows (Keeping Existing Copy) */}
            <div className={styles.benefitsList}>
              <div className={styles.benefitItem}>
                <div className={styles.benefitIconBox}>
                  <Zap size={18} aria-hidden="true" />
                </div>
                <div className={styles.benefitBody}>
                  <h2 className={styles.benefitTitle}>DK Sir 20–30s Speed Techniques</h2>
                  <p className={styles.benefitDesc}>
                    Learn shortcut algorithms to solve calculus, vectors, and algebra without lengthy steps.
                  </p>
                </div>
              </div>

              <div className={styles.benefitItem}>
                <div className={styles.benefitIconBox}>
                  <Award size={18} aria-hidden="true" />
                </div>
                <div className={styles.benefitBody}>
                  <h2 className={styles.benefitTitle}>Authentic NTA CBT Simulation</h2>
                  <p className={styles.benefitDesc}>
                    Full-length mock exams with chapter-level negative marking, percentile analysis, and rank projection.
                  </p>
                </div>
              </div>

              <div className={styles.benefitItem}>
                <div className={styles.benefitIconBox}>
                  <BookOpen size={18} aria-hidden="true" />
                </div>
                <div className={styles.benefitBody}>
                  <h2 className={styles.benefitTitle}>100% Chapter-wise DPPs &amp; PYQs</h2>
                  <p className={styles.benefitDesc}>
                    Daily practice problems and past exam archives (2012–2025) with detailed solution keys.
                  </p>
                </div>
              </div>
            </div>

            {/* Verified Results & Standards Strip (Real Data Only) */}
            <div className={styles.verifiedStrip} aria-label="Verified Academic Standards">
              <div className={styles.verifiedItem}>
                <CheckCircle2 size={15} className={styles.verifiedIcon} aria-hidden="true" />
                <span>Authentic NTA Exam Interface</span>
              </div>
              <div className={styles.verifiedItem}>
                <CheckCircle2 size={15} className={styles.verifiedIcon} aria-hidden="true" />
                <span>2012–2025 JEE PYQ Archive</span>
              </div>
              <div className={styles.verifiedItem}>
                <MapPin size={15} className={styles.verifiedIcon} aria-hidden="true" />
                <span>Janakpuri, New Delhi Classroom</span>
              </div>
            </div>

            {/* Institutional Trust Note */}
            <div className={styles.trustFooter}>
              <ShieldCheck size={16} className={styles.shieldIcon} aria-hidden="true" />
              <span>Offline Center at Janakpuri, New Delhi • Admissions: 9325987875, 9717159062</span>
            </div>
          </div>
        </aside>

        {/* Right Form Surface Panel */}
        <main className={styles.rightPanel}>
          <div className={styles.formCard}>
            {/* Header info */}
            <div className={styles.formHeader}>
              <h1 className={styles.formTitle}>{title}</h1>
              <p className={styles.formSubtitle}>{subtitle}</p>
            </div>

            {/* Form Slot */}
            <div className={styles.formBody}>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
