import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Shield,
  RotateCcw,
  Truck,
  Mail,
  Phone,
  MapPin,
  Lock,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Container } from '../../components/ui/Container/Container';
import styles from './PrivacyPage.module.scss';

export const PrivacyPage: React.FC = () => {
  const { hash } = useLocation();
  const [activeTab, setActiveTab] = useState<'privacy' | 'refunds' | 'shipping'>('privacy');

  useEffect(() => {
    document.title = 'Privacy Policy, Refunds & Shipping Terms | DK Academy JEE';
  }, []);

  useEffect(() => {
    if (hash === '#refunds') {
      setActiveTab('refunds');
      const el = document.getElementById('refunds');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (hash === '#shipping') {
      setActiveTab('shipping');
      const el = document.getElementById('shipping');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      setActiveTab('privacy');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [hash]);

  const scrollToSection = (id: 'privacy' | 'refunds' | 'shipping') => {
    setActiveTab(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.legalPageWrapper}>
      <Container>
        <header className={styles.legalHeader}>
          <div className={styles.badge}>
            <Shield size={14} />
            <span>DK Academy JEE Legal &amp; Student Trust</span>
          </div>
          <h1>Privacy, Refund &amp; Shipping Policies</h1>
          <p className={styles.subtitle}>
            Clear, transparent guidelines governing student data protection, digital batch cancellations, and physical study module delivery across India.
          </p>
          <span className={styles.lastUpdated}>Last Revised: October 2026 • Valid for Academic Year 2026–2027</span>
        </header>

        {/* Quick Jump Navigation Tabs */}
        <div className={styles.navTabs} role="tablist" aria-label="Policy sections">
          <button
            type="button"
            className={`${styles.navTabItem} ${activeTab === 'privacy' ? styles.active : ''}`}
            onClick={() => scrollToSection('privacy')}
          >
            <Lock size={15} />
            <span>1. Privacy Policy</span>
          </button>
          <button
            type="button"
            className={`${styles.navTabItem} ${activeTab === 'refunds' ? styles.active : ''}`}
            onClick={() => scrollToSection('refunds')}
          >
            <RotateCcw size={15} />
            <span>2. Refund &amp; Cancellation Policy</span>
          </button>
          <button
            type="button"
            className={`${styles.navTabItem} ${activeTab === 'shipping' ? styles.active : ''}`}
            onClick={() => scrollToSection('shipping')}
          >
            <Truck size={15} />
            <span>3. Shipping &amp; Delivery Policy</span>
          </button>
        </div>

        <div className={styles.legalContentCard}>
          {/* ─── 1. PRIVACY POLICY ─── */}
          <section id="privacy" className={`${styles.policySection} ${activeTab === 'privacy' ? styles.highlighted : ''}`}>
            <div className={styles.sectionHeader}>
              <div className={styles.iconBox}>
                <Lock size={20} />
              </div>
              <h2>1. Privacy Policy &amp; Data Security</h2>
            </div>
            <p>
              At <strong>DK Academy JEE</strong> (referred to as &quot;we&quot;, &quot;our&quot;, or &quot;the Institute&quot;), we are committed to upholding the privacy and safeguarding the personal information of our students, parents, and website visitors. This policy outlines how information is gathered, utilized, stored, and protected in compliance with the Information Technology Act, 2000 and Digital Personal Data Protection Act (DPDPA).
            </p>

            <h3>Information We Collect</h3>
            <ul>
              <li>
                <strong>Student Profile Information:</strong> Full name, verified mobile number, email address, target examination year (JEE Main / JEE Advanced / BITSAT), target class (11th, 12th, or Dropper), and residential address for physical dispatch.
              </li>
              <li>
                <strong>Academic Performance &amp; Analytics:</strong> CBT Mock test scorecards, time spent per question, chapter accuracy metrics, recorded lecture watch-time percentage, and DPP submission history to power personalized Kota pedagogy recommendations.
              </li>
              <li>
                <strong>Technical &amp; Telemetry Data:</strong> IP address, device operating system, browser specifications, and dynamic watermarking identifiers embedded into live streams to protect intellectual property against unauthorized distribution.
              </li>
              <li>
                <strong>Payment Information:</strong> All financial transactions are processed securely through RBI-licensed payment gateways (e.g., Razorpay, Cashfree, UPI). DK Academy <strong>never</strong> stores student credit/debit card numbers, CVVs, or net banking passwords on its servers.
              </li>
            </ul>

            <div className={styles.infoCallout}>
              <CheckCircle2 size={18} className={styles.calloutIcon} />
              <p>
                <strong>Zero Third-Party Advertising:</strong> DK Academy will never sell, rent, or trade student mobile numbers or contact details to third-party telemarketers or external commercial agencies. Communications are strictly restricted to batch schedules, test results, mentorship, and academic alerts.
              </p>
            </div>

            <h3>Data Retention &amp; Security Controls</h3>
            <p>
              Student accounts and test performance records are stored on secure cloud databases utilizing TLS 1.3 encryption in transit and AES-256 encryption at rest. Students may request an export or complete deletion of their account records upon completion of their JEE examinations by contacting our grievance team.
            </p>
          </section>

          {/* ─── 2. REFUND & CANCELLATION POLICY ─── */}
          <section id="refunds" className={`${styles.policySection} ${activeTab === 'refunds' ? styles.highlighted : ''}`}>
            <div className={styles.sectionHeader}>
              <div className={styles.iconBox} style={{ background: '#fef3c7', color: '#d97706' }}>
                <RotateCcw size={20} />
              </div>
              <h2>2. Refund &amp; Cancellation Policy</h2>
            </div>
            <p>
              We stand firmly behind the rigor, pedagogy, and Kota excellence delivered in DK Sir&apos;s Mathematics and Integrated JEE Courses. We provide a transparent refund window so parents and aspirants can enroll with total confidence.
            </p>

            <h3>7-Day Money-Back Guarantee (Digital Course Batches)</h3>
            <p>
              Students who enroll in our comprehensive Year-long or Dropper batches (e.g., <em>JEE Ultimate 2-Year</em> or <em>JEE 1-Year Rankers Mastery</em>) are eligible for a <strong>100% refund within 7 calendar days</strong> from the official batch start date or enrollment date (whichever is later), subject to the conditions below:
            </p>
            <ul>
              <li>The student has consumed less than 15% of the total video lecture curriculum.</li>
              <li>The student has not downloaded proprietary offline watermarked materials or printable module PDFs in bulk.</li>
              <li>The refund request is submitted through the student dashboard or emailed directly to <code>admissions@dkacademy.com</code> within the 7-day window.</li>
            </ul>

            <h3>Refund Processing Matrix</h3>
            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th>Program Type</th>
                    <th>Refund Eligibility Window</th>
                    <th>Deduction / Terms</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Full Year &amp; 2-Year Classroom Batches</strong></td>
                    <td>Within 7 days of course start</td>
                    <td>100% refund (Payment gateway charge 2% excluded)</td>
                  </tr>
                  <tr>
                    <td><strong>Crash Courses &amp; BITSAT Fast-Tracks</strong></td>
                    <td>Within 48 hours of enrollment</td>
                    <td>Prorated refund if fewer than 3 live sessions attended</td>
                  </tr>
                  <tr>
                    <td><strong>All India CBT Mock Test Series</strong></td>
                    <td>Before attempting 2nd full mock test</td>
                    <td>Full refund minus ₹200 server infrastructure fee</td>
                  </tr>
                  <tr>
                    <td><strong>Printed Study Material Kits</strong></td>
                    <td>Before dispatch from Kota warehouse</td>
                    <td>100% refund; non-refundable once shipped</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.infoCallout}>
              <AlertCircle size={18} className={styles.calloutIcon} />
              <p>
                <strong>Refund Disbursement Timeline:</strong> Approved refunds are credited back to the original source payment method (UPI account, Net Banking, or Credit/Debit Card) within <strong>5 to 7 business days</strong> as per banking network regulations.
              </p>
            </div>
          </section>

          {/* ─── 3. SHIPPING & DELIVERY POLICY ─── */}
          <section id="shipping" className={`${styles.policySection} ${activeTab === 'shipping' ? styles.highlighted : ''}`}>
            <div className={styles.sectionHeader}>
              <div className={styles.iconBox} style={{ background: '#dcfce7', color: '#16a34a' }}>
                <Truck size={20} />
              </div>
              <h2>3. Shipping &amp; Delivery Policy (Printed Modules)</h2>
            </div>
            <p>
              For batches that include hardcopy study packages, printed module workbooks, Daily Practice Problem booklets, and Kota classroom formula sheets, dispatches are handled promptly from our central logistics center in Kota, Rajasthan.
            </p>

            <h3>Dispatch &amp; Delivery Timeframes</h3>
            <ul>
              <li>
                <strong>Dispatch Timeline:</strong> Study modules are packed and dispatched within <strong>24 to 48 business hours</strong> of payment confirmation.
              </li>
              <li>
                <strong>Estimated Delivery:</strong>
                <ul>
                  <li><strong>Tier 1 Metros (Delhi, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata):</strong> 3–4 business days.</li>
                  <li><strong>Tier 2 / State Capitals (Jaipur, Patna, Lucknow, Pune, Ahmedabad):</strong> 4–5 business days.</li>
                  <li><strong>Rest of India &amp; Remote Districts:</strong> 6–8 business days via India Post SpeedPost.</li>
                </ul>
              </li>
              <li>
                <strong>Courier Partners:</strong> We partner with trusted tier-1 logistics providers including <em>BlueDart, DTDC, Delhivery</em>, and <em>SpeedPost (India Post)</em>.
              </li>
              <li>
                <strong>Tracking SMS &amp; Email:</strong> A live tracking AWB link is automatically dispatched to the student&apos;s registered mobile number via WhatsApp and SMS as soon as the parcel leaves the warehouse.
              </li>
            </ul>

            <h3>Damaged, Missing, or Incomplete Shipments</h3>
            <p>
              If a book or study package arrives in damaged condition or with missing printed booklets, students must inform our support desk within <strong>48 hours of delivery</strong> with unboxing photographs. We will arrange a free replacement courier at zero additional charge.
            </p>
          </section>

          {/* ─── 4. GRIEVANCE & SUPPORT CONTACT ─── */}
          <div className={styles.contactBox}>
            <h3>Grievance Redressal &amp; Student Helpdesk</h3>
            <p>
              Have questions regarding your batch enrollment, refund status, or printed module dispatch? Our dedicated academic student support team in Kota is available Monday through Saturday, 9:00 AM – 7:00 PM IST.
            </p>
            <div className={styles.contactGrid}>
              <div className={styles.contactItem}>
                <Mail size={16} />
                <span>Email: <a href="mailto:admissions@dkacademy.com">admissions@dkacademy.com</a></span>
              </div>
              <div className={styles.contactItem}>
                <Phone size={16} />
                <span>Helpline: <a href="tel:+919325987875">+91 93259 87875</a></span>
              </div>
              <div className={styles.contactItem}>
                <MapPin size={16} />
                <span>Office: Kota Study Campus, Rajasthan, India</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default PrivacyPage;
