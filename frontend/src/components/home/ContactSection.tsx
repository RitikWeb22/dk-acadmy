import React, { useState } from 'react';
import { Phone, Mail, MapPin, MessageSquare, CheckCircle2, Clock, Send, Sparkles } from 'lucide-react';
import { Container } from '../ui/Container/Container';
import { SectionHeading } from '../ui/SectionHeading/SectionHeading';
import styles from './ContactSection.module.scss';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    grade: 'Class 12',
    query: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate quick feedback
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 450);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      phone: '',
      grade: 'Class 12',
      query: '',
    });
    setSubmitted(false);
  };

  return (
    <section className={styles.section} id="contact" aria-labelledby="contact-heading">
      <Container size="wide">
        <div className={styles.headingWrapper}>
          <SectionHeading
            eyebrow="Direct Mentorship"
            title="Connect With Our Academic Counselors"
            description="Have questions about JEE batch enrollments, personalized mentorship, or test series schedules? Reach out directly to plan your academic pathway."
            align="center"
          />
        </div>

        <div className={styles.contentGrid}>
          {/* Left Column: Direct Helpline & Centers */}
          <div className={styles.infoSide}>
            <div className={styles.infoCard}>
              <div className={styles.counselingPill}>
                <Sparkles size={14} aria-hidden="true" />
                <span>100% Free 1-on-1 Academic Counseling</span>
              </div>
              <h3 className={styles.infoTitle}>Expert Guidance for JEE Main & Advanced</h3>
              <p className={styles.infoDesc}>
                Whether you need help selecting between intensive dropper batches or weekend classroom modules, our faculty advisors are here to evaluate your current prep level.
              </p>
            </div>

            <div className={styles.channelsList}>
              <a href="tel:+919325987875" className={styles.channelItem} aria-label="Call Admissions Helpline: +91 9325987875">
                <div className={`${styles.channelIconWrap} ${styles.phone}`}>
                  <Phone size={20} aria-hidden="true" />
                </div>
                <div className={styles.channelMeta}>
                  <span className={styles.channelLabel}>Admissions Helpline</span>
                  <span className={styles.channelValue}>+91 93259 87875 / 97171 59062</span>
                </div>
              </a>

              <a
                href="https://wa.me/919325987875"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.channelItem}
                aria-label="Chat on WhatsApp: +91 93259 87875"
              >
                <div className={`${styles.channelIconWrap} ${styles.whatsapp}`}>
                  <MessageSquare size={20} aria-hidden="true" />
                </div>
                <div className={styles.channelMeta}>
                  <span className={styles.channelLabel}>Instant WhatsApp Support</span>
                  <span className={styles.channelValue}>+91 93259 87875</span>
                </div>
              </a>

              <a href="mailto:counseling@dkacademy.in" className={styles.channelItem} aria-label="Email Us: counseling@dkacademy.in">
                <div className={`${styles.channelIconWrap} ${styles.email}`}>
                  <Mail size={20} aria-hidden="true" />
                </div>
                <div className={styles.channelMeta}>
                  <span className={styles.channelLabel}>Academic Queries</span>
                  <span className={styles.channelValue}>counseling@dkacademy.in</span>
                </div>
              </a>

              <div className={styles.channelItem}>
                <div className={`${styles.channelIconWrap} ${styles.location}`}>
                  <MapPin size={20} aria-hidden="true" />
                </div>
                <div className={styles.channelMeta}>
                  <span className={styles.channelLabel}>Primary Learning Center</span>
                  <span className={styles.channelValue}>Rajeev Gandhi Nagar, Kota / Delhi NCR</span>
                </div>
              </div>

              <div className={styles.channelItem}>
                <div className={`${styles.channelIconWrap} ${styles.phone}`}>
                  <Clock size={20} aria-hidden="true" />
                </div>
                <div className={styles.channelMeta}>
                  <span className={styles.channelLabel}>Counseling Hours</span>
                  <span className={styles.channelValue}>Mon – Sat: 9:00 AM – 8:00 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Callback Request Form */}
          <div className={styles.formSide}>
            {!submitted ? (
              <>
                <div className={styles.formHeader}>
                  <h3 className={styles.formTitle}>Request a Callback</h3>
                  <p className={styles.formSubtitle}>
                    Leave your contact details and our senior counselor will call back within 2 business hours.
                  </p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit} noValidate={false}>
                  <div className={styles.formRow}>
                    <div className={styles.inputGroup}>
                      <label htmlFor="student-name" className={styles.label}>
                        Student / Parent Name <span className={styles.requiredStar}>*</span>
                      </label>
                      <input
                        type="text"
                        id="student-name"
                        className={styles.input}
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label htmlFor="student-phone" className={styles.label}>
                        Mobile Number <span className={styles.requiredStar}>*</span>
                      </label>
                      <input
                        type="tel"
                        id="student-phone"
                        className={styles.input}
                        required
                        placeholder="e.g. 9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="student-grade" className={styles.label}>
                      Target JEE Exam / Class <span className={styles.requiredStar}>*</span>
                    </label>
                    <select
                      id="student-grade"
                      className={styles.select}
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    >
                      <option value="Class 11">Class 11 (2-Year JEE Foundation 2027)</option>
                      <option value="Class 12">Class 12 (1-Year JEE Main & Advanced 2026)</option>
                      <option value="Dropper">Dropper / Repeater (Target JEE 2026 Rank Booster)</option>
                      <option value="Foundation">Class 9 / 10 Early Starter</option>
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="student-query" className={styles.label}>
                      Any Specific Questions or Subject Focus?
                    </label>
                    <textarea
                      id="student-query"
                      className={styles.textarea}
                      placeholder="e.g. I need guidance on Physics Advanced batch timings and mock test schedule..."
                      value={formData.query}
                      onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading}
                  >
                    <Send size={16} aria-hidden="true" />
                    <span>{loading ? 'Submitting Request...' : 'Request Free Counseling Call'}</span>
                  </button>

                  <p className={styles.privacyNote}>
                    🔒 We respect your privacy. No spam. You will only receive a single academic counseling call.
                  </p>
                </form>
              </>
            ) : (
              <div className={styles.successCard} role="alert" aria-live="polite">
                <div className={styles.successIconWrap}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 className={styles.successTitle}>Request Received Successfully!</h3>
                <p className={styles.successMsg}>
                  Thank you, <strong>{formData.name || 'Student'}</strong>. Our academic counseling mentor will contact you on <strong>{formData.phone}</strong> shortly to discuss your JEE preparation strategy.
                </p>
                <button
                  type="button"
                  className={styles.resetBtn}
                  onClick={handleReset}
                >
                  Submit Another Inquiry
                </button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
};
