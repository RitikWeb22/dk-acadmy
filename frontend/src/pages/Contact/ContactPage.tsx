import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Sparkles,
  HelpCircle,
  Building2,
  ArrowRight,
  ShieldCheck,
  Radio,
  FileCheck2
} from 'lucide-react';
import { Container } from '../../components/ui/Container/Container';
import { leadService } from '../../services/leadService';
import { useToast } from '../../context/ToastContext';
import styles from './ContactPage.module.scss';

export const ContactPage: React.FC = () => {
  const { showToast } = useToast();

  useEffect(() => {
    document.title = 'Contact Admissions Desk & DK Sir Helpdesk | DK Academy IIT JEE';
    window.scrollTo(0, 0);
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    currentClass: 'Class 11th',
    targetBatch: '2-Year Ultimate JEE Main & Advanced Mastery Program',
    subject: 'Admissions & Batch Seat Inquiries',
    preferredTime: 'Evening (4:00 PM – 8:00 PM)',
    city: 'Delhi NCR',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(null);

  // FAQ Active State
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }

    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdLead = await leadService.submitLead({
        fullName: formData.fullName.trim(),
        mobile: cleanMobile,
        email: formData.email.trim() || undefined,
        currentClass: formData.currentClass as any,
        targetBatch: formData.targetBatch,
        subject: formData.subject,
        message: formData.message.trim() || undefined,
        preferredTime: formData.preferredTime as any,
        city: formData.city.trim() || 'Delhi NCR',
        source: 'Contact Us Portal'
      });

      setSubmittedLeadId(createdLead.id);
      showToast('Inquiry submitted! Our counselor will reach out shortly.', 'success');
    } catch {
      showToast('Failed to submit inquiry. Please try again or message via WhatsApp.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      fullName: '',
      mobile: '',
      email: '',
      currentClass: 'Class 11th',
      targetBatch: '2-Year Ultimate JEE Main & Advanced Mastery Program',
      subject: 'Admissions & Batch Seat Inquiries',
      preferredTime: 'Evening (4:00 PM – 8:00 PM)',
      city: 'Delhi NCR',
      message: ''
    });
    setSubmittedLeadId(null);
  };

  const faqs = [
    {
      q: 'How fast will an academic counselor call me back?',
      a: 'During standard working hours (8:00 AM to 9:00 PM IST), inquiries are acknowledged within 15 to 30 minutes. A senior academic counselor or DK Sir’s team will review your class, target exam year, and recommend the best classroom or live batch.'
    },
    {
      q: 'Can I visit the Janakpuri center for a live demo and interaction with DK Sir?',
      a: 'Yes! Walk-in counseling sessions are available 7 days a week at our Janakpuri Metro Pillar 542 campus. You can also request a free Kota Speed Algorithms demo masterclass before final enrollment.'
    },
    {
      q: 'Are fee installment plans and scholarship criteria available?',
      a: 'Yes. We offer zero-cost EMIs up to 12 months for 1-year and 2-year programs. Furthermore, students scoring above 90% in our DK National Diagnostic Test receive up to a 90% academic fee waiver.'
    },
    {
      q: 'How do students outside Delhi NCR attend lectures and doubt counters?',
      a: 'Students across India join our Hybrid & Online Live batches. Lectures are streamed in low-latency 1080p with daily Kota DPPs, handwritten video PDF notes, and 6-days-a-week live audio-video doubt counters.'
    }
  ];

  const whatsappMessage = encodeURIComponent(
    `Hello DK Academy Admissions Desk, I want guidance regarding JEE Main & Advanced batches and DK Sir Kota techniques.`
  );

  return (
    <div className={styles.contactPage}>
      {/* ─── 1. INSTITUTIONAL HERO HEADER ─── */}
      <section className={styles.heroSection}>
        <Container size="wide">
          <div className={styles.breadcrumbRow}>
            <Link to="/">Home</Link>
            <ChevronRight size={13} />
            <span>Admissions Desk</span>
            <ChevronRight size={13} />
            <span className={styles.activeBreadcrumb}>Contact Us</span>
          </div>

          <div className={styles.headerContent}>
            <div className={styles.badgePill}>
              <span className={styles.badgeDot} />
              <span>Admissions Desk • Janakpuri Center • Kota Pedagogy</span>
            </div>

            <h1 className={styles.pageTitle}>
              Connect With Senior Counselors &amp; <span className={styles.highlight}>DK Sir Academic Desk</span>
            </h1>

            <p className={styles.pageSubtitle}>
              Whether you are looking for offline hybrid classroom coaching in Delhi, 1-on-1 mentorship,
              or 20s speed solving algorithms for Class 11th, 12th, or Droppers — we are here to guide your JEE roadmap.
            </p>

            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <span className={styles.statNumber}>15-30 Min</span>
                <span className={styles.statLabel}>Avg Counselor Callback</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statNumber}>100% Free</span>
                <span className={styles.statLabel}>Academic Roadmap Audit</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statNumber}>7 Days/Week</span>
                <span className={styles.statLabel}>Janakpuri Center Support</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container size="wide">
        {/* ─── 2. 4-PILLAR TOUCHPOINT CARDS ─── */}
        <div className={styles.touchpointsGrid}>
          {/* Card 1: Direct Phone Call */}
          <div className={styles.touchCard}>
            <div className={`${styles.cardIconBox} ${styles.blueIcon}`}>
              <Phone size={20} />
            </div>
            <h3 className={styles.cardTitle}>Direct Helpline</h3>
            <p className={styles.cardDesc}>Speak directly with our senior JEE academic counselors.</p>
            <a href="tel:+919325987875" className={styles.cardAction}>
              <span>+91 93259 87875</span>
              <ArrowRight size={14} />
            </a>
          </div>

          {/* Card 2: WhatsApp Admissions */}
          <div className={styles.touchCard}>
            <div className={`${styles.cardIconBox} ${styles.emeraldIcon}`}>
              <MessageCircle size={20} />
            </div>
            <h3 className={styles.cardTitle}>WhatsApp Instant Desk</h3>
            <p className={styles.cardDesc}>Chat for syllabus PDFs, fee slips, and test schedules.</p>
            <a
              href={`https://wa.me/919325987875?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.cardAction}
            >
              <span>Chat on WhatsApp</span>
              <ArrowRight size={14} />
            </a>
          </div>

          {/* Card 3: Admissions Email */}
          <div className={styles.touchCard}>
            <div className={`${styles.cardIconBox} ${styles.amberIcon}`}>
              <Mail size={20} />
            </div>
            <h3 className={styles.cardTitle}>Admissions Email</h3>
            <p className={styles.cardDesc}>Send official scorecards, test queries, and documents.</p>
            <a href="mailto:admissions@dkacademy.in" className={styles.cardAction}>
              <span>admissions@dkacademy.in</span>
              <ArrowRight size={14} />
            </a>
          </div>

          {/* Card 4: Janakpuri Classroom */}
          <div className={styles.touchCard}>
            <div className={`${styles.cardIconBox} ${styles.purpleIcon}`}>
              <Building2 size={20} />
            </div>
            <h3 className={styles.cardTitle}>Janakpuri Center</h3>
            <p className={styles.cardDesc}>Walk-in counseling &amp; offline classroom simulations.</p>
            <a
              href="https://maps.google.com/?q=Janakpuri+New+Delhi"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.cardAction}
            >
              <span>Get Directions</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </div>

        {/* ─── 3. FORM & CAMPUS INFO GRID ─── */}
        <div className={styles.formSectionGrid}>
          {/* Left: Interactive Inquiry Form */}
          <div className={styles.formCard}>
            <div className={styles.formCardHeader}>
              <h2>Send An Inquiry / Request Callback</h2>
              <p>Fill out your details below. A dedicated academic mentor will contact you at your preferred time.</p>
            </div>

            {submittedLeadId ? (
              <div className={styles.successCard}>
                <div className={styles.successIcon}>
                  <CheckCircle2 size={34} />
                </div>
                <h3>Inquiry Registered Successfully!</h3>
                <p>
                  Thank you for reaching out to DK Academy. A senior counselor will review your requirements and call you back shortly.
                </p>
                <div className={styles.ticketPill}>
                  <span>Inquiry Reference ID: <strong>{submittedLeadId}</strong></span>
                </div>
                <div className={styles.successActions}>
                  <a
                    href={`https://wa.me/919325987875?text=${encodeURIComponent(
                      `Hello DK Academy, I just submitted inquiry #${submittedLeadId}. Please share course details.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.whatsappDirectBtn}
                  >
                    <MessageCircle size={16} />
                    <span>Instant WhatsApp Followup</span>
                  </a>
                  <button type="button" className={styles.resetBtn} onClick={handleResetForm}>
                    <span>Submit Another Query</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.formGrid}>
                {/* Full Name */}
                <div className={styles.inputGroup}>
                  <label htmlFor="fullName">
                    <span>Student / Parent Name <span className={styles.requiredStar}>*</span></span>
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    placeholder="e.g. Aryan Sharma"
                    value={formData.fullName}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Mobile Number */}
                <div className={styles.inputGroup}>
                  <label htmlFor="mobile">
                    <span>Mobile Number <span className={styles.requiredStar}>*</span></span>
                    <span className={styles.hint}>10-digit number</span>
                  </label>
                  <input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={formData.mobile}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Email Address */}
                <div className={styles.inputGroup}>
                  <label htmlFor="email">
                    <span>Email Address</span>
                    <span className={styles.hint}>Optional</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="e.g. aryan.sharma@gmail.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Current Class */}
                <div className={styles.inputGroup}>
                  <label htmlFor="currentClass">
                    <span>Current Class / Grade <span className={styles.requiredStar}>*</span></span>
                  </label>
                  <select
                    id="currentClass"
                    name="currentClass"
                    value={formData.currentClass}
                    onChange={handleInputChange}
                  >
                    <option value="Class 10th">Class 10th (Foundation Phase)</option>
                    <option value="Class 11th">Class 11th (Target JEE 2028)</option>
                    <option value="Class 12th">Class 12th (Target JEE 2027)</option>
                    <option value="Dropper">Dropper / Repeater (Target JEE 2026/27)</option>
                  </select>
                </div>

                {/* Target Batch */}
                <div className={styles.inputGroup}>
                  <label htmlFor="targetBatch">
                    <span>Target Academic Program</span>
                  </label>
                  <select
                    id="targetBatch"
                    name="targetBatch"
                    value={formData.targetBatch}
                    onChange={handleInputChange}
                  >
                    <option value="2-Year Ultimate JEE Main & Advanced Mastery Program">
                      2-Year Ultimate JEE Main &amp; Advanced Mastery Program
                    </option>
                    <option value="DK Sir Chapter-wise Math PYQ Video Vault & Short Tricks">
                      DK Sir Chapter-wise Math PYQ Video Vault &amp; Short Tricks
                    </option>
                    <option value="BITSAT Speed, Accuracy & Logic Mastery Crash Program">
                      BITSAT Speed, Accuracy &amp; Logic Mastery Crash Program
                    </option>
                    <option value="Class 11th & 12th Math Special (DK Sir 20s Techniques)">
                      Class 11th &amp; 12th Math Special (DK Sir 20s Techniques)
                    </option>
                    <option value="Offline Classroom Hybrid (Janakpuri Center)">
                      Offline Classroom Hybrid (Janakpuri Center)
                    </option>
                  </select>
                </div>

                {/* Inquiry Category / Subject */}
                <div className={styles.inputGroup}>
                  <label htmlFor="subject">
                    <span>Inquiry Category</span>
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                  >
                    <option value="Admissions & Batch Seat Inquiries">Admissions &amp; Batch Seat Inquiries</option>
                    <option value="Classroom Demo Session Booking">Classroom Demo Session Booking</option>
                    <option value="Scholarship Test & Diagnostic Score">Scholarship Test &amp; Diagnostic Score</option>
                    <option value="Fee Structure & Installment Plans">Fee Structure &amp; Installment Plans</option>
                    <option value="DK Sir 20s Speed Technique Guidance">DK Sir 20s Speed Technique Guidance</option>
                    <option value="Technical or Portal App Assistance">Technical or Portal App Assistance</option>
                  </select>
                </div>

                {/* Preferred Contact Time */}
                <div className={styles.inputGroup}>
                  <label htmlFor="preferredTime">
                    <span>Preferred Callback Slot</span>
                  </label>
                  <select
                    id="preferredTime"
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleInputChange}
                  >
                    <option value="Morning (9:00 AM – 12:00 PM)">Morning (9:00 AM – 12:00 PM)</option>
                    <option value="Afternoon (12:00 PM – 4:00 PM)">Afternoon (12:00 PM – 4:00 PM)</option>
                    <option value="Evening (4:00 PM – 8:00 PM)">Evening (4:00 PM – 8:00 PM)</option>
                  </select>
                </div>

                {/* City */}
                <div className={styles.inputGroup}>
                  <label htmlFor="city">
                    <span>City / State</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="e.g. New Delhi, Patna, Jaipur"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Detailed Message */}
                <div className={`${styles.inputGroup} ${styles.fullCol}`}>
                  <label htmlFor="message">
                    <span>Specific Question / Remarks</span>
                    <span className={styles.hint}>Optional</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Tell us about your current preparation stage, target exam percentile, or any specific query for DK Sir..."
                    value={formData.message}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Submit Button */}
                <div className={styles.fullCol}>
                  <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                    {isSubmitting ? (
                      <>
                        <Radio size={18} className={styles.spinIcon} />
                        <span>Transmitting to Admissions Desk...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Submit Inquiry &amp; Request Callback</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right: Campus Details & Timings */}
          <div className={styles.campusInfoStack}>
            {/* Center Info Card */}
            <div className={styles.campusCard}>
              <div className={styles.campusHeader}>
                <div className={styles.campusIcon}>
                  <MapPin size={22} />
                </div>
                <div>
                  <h3>Main Janakpuri Classroom Center</h3>
                </div>
              </div>

              <p className={styles.addressText}>
                <strong>DK Academy IIT JEE &amp; BITSAT Institute</strong>
                <br />
                Metro Pillar 542, Main Najafgarh Road, Block C-4, Janakpuri,
                <br />
                New Delhi, Delhi – 110058 (Near Janakpuri West Metro Station)
              </p>

              <ul className={styles.facilityList}>
                <li>
                  <FileCheck2 size={15} />
                  <span>Interactive 4K Digital Flat Panels</span>
                </li>
                <li>
                  <CheckCircle2 size={15} />
                  <span>Air-Conditioned CBT Simulation Test Lab</span>
                </li>
                <li>
                  <Sparkles size={15} />
                  <span>DK Sir Daily 1-on-1 Math Doubt Desks</span>
                </li>
                <li>
                  <ShieldCheck size={15} />
                  <span>Parent Counseling &amp; Performance Audit Lounge</span>
                </li>
              </ul>

              <a
                href="https://maps.google.com/?q=Janakpuri+West+Metro+Station+New+Delhi"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.directionsBtn}
              >
                <MapPin size={15} />
                <span>Open in Google Maps</span>
              </a>
            </div>

            {/* Operating Hours Card */}
            <div className={styles.workingHoursCard}>
              <h3>
                <Clock size={18} />
                <span>Counseling Desk Working Hours</span>
              </h3>

              <div className={styles.timingRow}>
                <span className={styles.day}>Monday – Friday</span>
                <span className={styles.time}>8:00 AM – 9:00 PM</span>
              </div>
              <div className={styles.timingRow}>
                <span className={styles.day}>Saturday</span>
                <span className={styles.time}>8:00 AM – 9:00 PM</span>
              </div>
              <div className={styles.timingRow}>
                <span className={styles.day}>Sunday (Demo &amp; Tests)</span>
                <span className={styles.time}>9:00 AM – 8:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 4. FAQ ACCORDION ─── */}
        <section className={styles.faqSection}>
          <div className={styles.sectionHeaderCenter}>
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about admissions, counseling, and batch onboarding.</p>
          </div>

          <div className={styles.faqAccordion}>
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`${styles.faqItem} ${activeFaq === idx ? styles.activeFaq : ''}`}
              >
                <button
                  type="button"
                  className={styles.faqQuestionBtn}
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  aria-expanded={activeFaq === idx}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`${styles.faqChevron} ${activeFaq === idx ? styles.rotated : ''}`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className={styles.faqAnswerBox}>
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
};

export default ContactPage;
