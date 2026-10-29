import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Layers,
  Download,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  FileCheck2,
  ExternalLink,
  Eye,
  Check
} from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import styles from './AboutMentorship.module.scss';

export const AboutMentorship: React.FC = () => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadSample = (e: React.MouseEvent) => {
    e.preventDefault();
    setDownloadSuccess(true);
    // Simulate instant download feedback
    const dummyContent = `DK ACADEMY JEE — SAMPLE HANDWRITTEN NOTES\nTopic: Limits, Continuity & Differentiability (LCD)\n\n1. King's Property: ∫[a,b] f(x)dx = ∫[a,b] f(a+b-x)dx\n2. 20s Inspection Shortcut: When f(a+b-x) + f(x) = C, Integral = C*(b-a)/2\n3. L'Hôpital Trap: Ensure 0/0 or ∞/∞ condition before differentiating numerator & denominator!`;
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DK-Academy-Calculus-Sample-Notes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <section className={styles.mentorshipSection}>
      <Container>
        <div className={styles.sectionHeader}>
          <span className={styles.subheading}>Self-Study &amp; Academic Rigor</span>
          <h2 className={styles.heading}>Study Materials &amp; Mentorship Content</h2>
          <p className={styles.caption}>
            Academic preparation is only half the battle. We equip students with structured handwritten classroom notes,
            graded daily practice problems, and continuous performance analytics.
          </p>
        </div>

        <div className={styles.contentGrid}>
          {/* Left Card: Handwritten Classroom Notes */}
          <div className={`${styles.materialCard} ${styles.notesCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIconWrap}>
                <FileText size={24} aria-hidden="true" />
              </div>
              <span className={styles.materialTag}>Digital Study Vault</span>
            </div>

            <div className={styles.cardMain}>
              <h3 className={styles.cardTitle}>Handwritten Classroom Notes</h3>
              <p className={styles.cardLead}>
                Every YouTube lecture and classroom session is accompanied by crisp, structured blackboard notes,
                visual geometric proofs, and high-yield formula cheat sheets.
              </p>

              <div className={styles.featureList}>
                <div className={styles.featureItem}>
                  <CheckCircle2 size={16} className={styles.checkIcon} aria-hidden="true" />
                  <span>Comprehensive step-by-step mathematical proofs from first principles</span>
                </div>
                <div className={styles.featureItem}>
                  <CheckCircle2 size={16} className={styles.checkIcon} aria-hidden="true" />
                  <span>Annotated examiner traps, common calculation errors &amp; shortcuts</span>
                </div>
                <div className={styles.featureItem}>
                  <CheckCircle2 size={16} className={styles.checkIcon} aria-hidden="true" />
                  <span>High-resolution vector diagrams for Coordinate Geometry &amp; Vectors 3D</span>
                </div>
                <div className={styles.featureItem}>
                  <CheckCircle2 size={16} className={styles.checkIcon} aria-hidden="true" />
                  <span>Downloadable PDFs synchronized with chapter video timestamps</span>
                </div>
              </div>
            </div>

            {/* Card Footer Action */}
            <div className={styles.cardFooter}>
              <button
                type="button"
                onClick={handleDownloadSample}
                className={styles.downloadSampleBtn}
                aria-label="Download Sample Chapter PDF"
              >
                {downloadSuccess ? (
                  <>
                    <Check size={16} className={styles.btnIcon} aria-hidden="true" />
                    <span>Sample Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download size={16} className={styles.btnIcon} aria-hidden="true" />
                    <span>Download Sample Chapter PDF</span>
                  </>
                )}
              </button>
              <a
                href="https://t.me/dkacademyjee"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondaryLink}
              >
                <span>Access Full Vault on Telegram</span>
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Right Card: Curated Daily Practice Problems (DPP) */}
          <div className={`${styles.materialCard} ${styles.dppCard}`}>
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIconWrap} ${styles.dppIconWrap}`}>
                <Layers size={24} aria-hidden="true" />
              </div>
              <span className={`${styles.materialTag} ${styles.dppTag}`}>Daily Problem Sprints</span>
            </div>

            <div className={styles.cardMain}>
              <h3 className={styles.cardTitle}>Curated Daily Practice Problems (DPP)</h3>
              <p className={styles.cardLead}>
                Systematic 10–15 problem practice sets tiered across graded difficulty levels right after each lecture
                to build accuracy, speed, and eliminate negative marks.
              </p>

              <div className={styles.featureList}>
                <div className={styles.featureItem}>
                  <CheckCircle2 size={16} className={styles.checkIconEmerald} aria-hidden="true" />
                  <span>3-Tier Graded Difficulty: Level 1 Foundation to Level 3 JEE Advanced</span>
                </div>
                <div className={styles.featureItem}>
                  <CheckCircle2 size={16} className={styles.checkIconEmerald} aria-hidden="true" />
                  <span>Comprehensive step-by-step video solution breakdowns for every problem</span>
                </div>
                <div className={styles.featureItem}>
                  <CheckCircle2 size={16} className={styles.checkIconEmerald} aria-hidden="true" />
                  <span>Authentic NTA computer-based exam format with timer constraints</span>
                </div>
                <div className={styles.featureItem}>
                  <CheckCircle2 size={16} className={styles.checkIconEmerald} aria-hidden="true" />
                  <span>Detailed accuracy metrics tracking calculation vs conceptual mistakes</span>
                </div>
              </div>
            </div>

            {/* Card Footer Action */}
            <div className={styles.cardFooter}>
              <Link to="/dpp" className={styles.dppPrimaryBtn}>
                <FileCheck2 size={16} className={styles.btnIcon} aria-hidden="true" />
                <span>Attempt Today&apos;s Free DPP</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link to="/test-series" className={styles.secondaryLink}>
                <span>Explore Full CBT Test Series</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default AboutMentorship;

