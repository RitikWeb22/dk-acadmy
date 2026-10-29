import React, { useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  Scale,
  ShieldAlert,
  GraduationCap,
  MonitorPlay
} from 'lucide-react';
import { Container } from '../../components/ui/Container/Container';
import styles from './TermsPage.module.scss';

export const TermsPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Terms & Conditions | DK Academy IIT JEE';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className={styles.termsPageWrapper}>
      <Container>
        <header className={styles.termsHeader}>
          <div className={styles.badge}>
            <Scale size={14} />
            <span>Student Terms of Service</span>
          </div>
          <h1>Terms &amp; Conditions</h1>
          <p className={styles.subtitle}>
            Please review the standard terms governing your access to DK Academy&apos;s digital classroom, video LMS, and CBT test series.
          </p>
          <span className={styles.lastUpdated}>Effective Date: Academic Session 2026–2027 • DK Academy Kota</span>
        </header>

        <div className={styles.termsCard}>
          {/* Section 1 */}
          <div className={styles.section}>
            <h2>
              <span className={styles.sectionNum}>1</span>
              <span>Acceptance of Terms</span>
            </h2>
            <p>
              By accessing, browsing, or registering an account on the <strong>DK Academy JEE Platform</strong> (including mobile web, student portal, and video LMS applications), you agree to be legally bound by these Terms and Conditions. If you do not agree to these terms, please refrain from using our digital services.
            </p>
          </div>

          {/* Section 2 */}
          <div className={styles.section}>
            <h2>
              <span className={styles.sectionNum}>2</span>
              <span>Student Account Security &amp; Fair Use</span>
            </h2>
            <p>
              Each student enrollment is intended strictly for personal, non-commercial educational use by a single individual aspirant:
            </p>
            <ul>
              <li>
                <strong>Single-User License:</strong> Sharing login credentials with multiple classmates, external coaching groups, or peer study networks is strictly prohibited.
              </li>
              <li>
                <strong>Concurrent Login Protection:</strong> Our LMS systems enforce concurrent stream limitations. Simultaneous logins across disparate geographic locations will result in automatic session termination.
              </li>
              <li>
                <strong>Accurate Registration:</strong> Aspirants must provide authentic contact details for mentorship progress tracking and parent notifications.
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className={styles.section}>
            <h2>
              <span className={styles.sectionNum}>3</span>
              <span>Intellectual Property &amp; Anti-Piracy Policy</span>
            </h2>
            <p>
              All video lectures, 20–30s shortcut problem-solving methodologies, Kota pedagogy notes, Daily Practice Problem (DPP) PDFs, and CBT questions authored by <strong>Dharmendra Kumar (DK Sir)</strong> and DK Academy are the exclusive copyrighted intellectual property of the Institute.
            </p>
            <div className={styles.warningBox}>
              <ShieldAlert size={18} className={styles.warningIcon} />
              <p>
                <strong>Zero-Tolerance Piracy Warning:</strong> Screen recording, ripping, decompiling, or re-uploading DK Academy video lectures to Telegram channels, YouTube, Google Drive, or torrents constitutes an actionable offense under Section 66 of the Information Technology Act and Indian Copyright Act, 1957. All video streams contain dynamic forensic student watermarks.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className={styles.section}>
            <h2>
              <span className={styles.sectionNum}>4</span>
              <span>All India CBT Mock Tests &amp; Percentile Scores</span>
            </h2>
            <p>
              DK Academy conducts mock tests strictly mimicking the National Testing Agency (NTA) Computer Based Test (CBT) interface:
            </p>
            <ul>
              <li>
                Scores, ranks, and percentiles generated on our platform are indicative metrics based on historical normalization algorithms to assist in student self-evaluation.
              </li>
              <li>
                Cheating, tab switching during proctored mocks, or running automated scripts will disqualify mock attempts from All-India leaderboard calculations.
              </li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className={styles.section}>
            <h2>
              <span className={styles.sectionNum}>5</span>
              <span>Fees, Taxes &amp; Currency</span>
            </h2>
            <p>
              All course fee amounts listed across the website are in Indian Rupees (INR) and are inclusive of applicable Goods and Services Tax (GST) at prevailing government rates unless explicitly stated otherwise.
            </p>
          </div>

          {/* Section 6 */}
          <div className={styles.section}>
            <h2>
              <span className={styles.sectionNum}>6</span>
              <span>Jurisdiction &amp; Dispute Resolution</span>
            </h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws of the Republic of India. Any legal disputes arising out of enrollment or platform use shall be subject to the exclusive jurisdiction of the competent courts in <strong>Kota, Rajasthan, India</strong>.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default TermsPage;
