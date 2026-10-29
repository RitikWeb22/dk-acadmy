import React, { useState } from 'react';
import {
  PhoneCall,
  CheckCircle2,
  Send,
  Loader2,
  Check,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { leadService } from '../../../services/leadService';
import { getStudentWhatsAppUrl } from '../../../utils/whatsapp';
import type { ProspectiveLead } from '../../../types/lead';
import styles from './CallbackForm.module.scss';

export interface CallbackFormProps {
  badge?: string;
  title?: string;
  subtitle?: string;
}

export const CallbackForm: React.FC<CallbackFormProps> = ({ badge, title, subtitle }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    courseInterest: 'Class 11th - Target JEE 2028 (2-Year Comprehensive)'
  });

  const [errors, setErrors] = useState<{ fullName?: string; mobile?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<ProspectiveLead | null>(null);

  const validate = (): boolean => {
    const newErrors: { fullName?: string; mobile?: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Please enter your full name';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    const cleanMobile = formData.mobile.replace(/\D/g, '');
    const indianMobileRegex = /^[6-9]\d{9}$/;
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Please enter your 10-digit mobile number';
    } else if (!indianMobileRegex.test(cleanMobile)) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number (starts with 6-9)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const lead = leadService.submitLead({
        fullName: formData.fullName,
        mobile: formData.mobile,
        currentClass: 'Class 11th',
        targetBatch: formData.courseInterest,
        preferredTime: 'Evening (4:00 PM – 8:00 PM)',
        source: 'Home Callback Form'
      });

      setIsSubmitting(false);
      setSubmittedLead(lead);
    }, 500);
  };

  const handleReset = () => {
    setFormData({
      fullName: '',
      mobile: '',
      courseInterest: 'Class 11th - Target JEE 2028 (2-Year Comprehensive)'
    });
    setErrors({});
    setSubmittedLead(null);
  };

  const whatsappDirectUrl = getStudentWhatsAppUrl({
    studentName: formData.fullName,
    targetBatch: formData.courseInterest,
    inquiryId: submittedLead?.id
  });

  return (
    <section className={styles.section} id="callback" aria-labelledby="callback-form-heading">
      <div id="callback-form" style={{ position: 'relative', top: '-80px', visibility: 'hidden' }} />
      <Container size="wide">
        <div className={styles.cardContainer}>
          {/* Left Column: Counseling Information */}
          <div className={styles.infoCol}>
            <div className={styles.counselingBadge}>
              <PhoneCall size={14} aria-hidden="true" />
              <span>{badge || 'Academic Counseling & Admissions'}</span>
            </div>

            <h2 id="callback-form-heading" className={styles.title}>
              {title || 'Request a Callback from Senior IIT JEE Mentors'}
            </h2>

            <p className={styles.subtitle}>
              {subtitle || 'Unsure which batch fits your target year? Speak with our academic counseling team for a personalized study roadmap tailored to your strengths, target percentiles, and syllabus milestones.'}
            </p>

            <div className={styles.benefitsList}>
              <div className={styles.benefitItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} aria-hidden="true" />
                <span>1-on-1 Personalized Study Roadmap &amp; Batch Recommendation</span>
              </div>
              <div className={styles.benefitItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} aria-hidden="true" />
                <span>Class 11th, 12th &amp; Dropper Strategy with DK Sir 20s Techniques</span>
              </div>
              <div className={styles.benefitItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} aria-hidden="true" />
                <span>Live Walkthrough of NTA CBT Mock Tests &amp; Chapter DPP Archives</span>
              </div>
            </div>
          </div>

          {/* Right Column: Modernized Lead Capture Form with Floating Labels */}
          <div className={styles.formCard}>
            {!submittedLead ? (
              <form className={styles.form} onSubmit={handleSubmit} noValidate>
                {/* 1. Full Name Floating Input Field */}
                <div className={`${styles.floatingField} ${errors.fullName ? styles.fieldError : ''}`}>
                  <input
                    id="callback-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    className={styles.floatingInput}
                    placeholder=" "
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData({ ...formData, fullName: e.target.value });
                      if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                    }}
                    aria-describedby={errors.fullName ? 'callback-name-error' : undefined}
                    disabled={isSubmitting}
                    required
                  />
                  <label htmlFor="callback-name" className={styles.floatingLabel}>
                    Full Name *
                  </label>
                  {errors.fullName && (
                    <span id="callback-name-error" className={styles.errorText} role="alert">
                      {errors.fullName}
                    </span>
                  )}
                </div>

                {/* 2. Indian Mobile Number Field with +91 Prefix */}
                <div className={`${styles.floatingField} ${styles.phoneFloatingField} ${errors.mobile ? styles.fieldError : ''}`}>
                  <div className={styles.phoneInputInner}>
                    <span className={styles.prefixPill}>
                      <span className={styles.flagIcon}>🇮🇳</span>
                      <span>+91</span>
                    </span>
                    <input
                      id="callback-mobile"
                      name="tel"
                      type="tel"
                      inputMode="numeric"
                      pattern="[6-9][0-9]{9}"
                      autoComplete="tel"
                      maxLength={10}
                      className={styles.phoneFloatingInput}
                      placeholder=" "
                      value={formData.mobile}
                      onChange={(e) => {
                        setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') });
                        if (errors.mobile) setErrors({ ...errors, mobile: undefined });
                      }}
                      aria-describedby={errors.mobile ? 'callback-mobile-error' : undefined}
                      disabled={isSubmitting}
                      required
                    />
                    <label htmlFor="callback-mobile" className={styles.phoneFloatingLabel}>
                      10-Digit Mobile Number *
                    </label>
                  </div>
                  {errors.mobile && (
                    <span id="callback-mobile-error" className={styles.errorText} role="alert">
                      {errors.mobile}
                    </span>
                  )}
                </div>

                {/* 3. Target Exam & Class Field */}
                <div className={styles.selectGroup}>
                  <label htmlFor="callback-target" className={styles.selectLabel}>
                    Target Batch / Class *
                  </label>
                  <select
                    id="callback-target"
                    name="target"
                    className={styles.selectInput}
                    value={formData.courseInterest}
                    onChange={(e) =>
                      setFormData({ ...formData, courseInterest: e.target.value })
                    }
                    disabled={isSubmitting}
                  >
                    <option value="Class 11th - Target JEE 2028 (2-Year Comprehensive)">
                      Class 11th — Target JEE 2028 (2-Year Classroom)
                    </option>
                    <option value="Class 12th - Target JEE 2027 (1-Year Fast Track)">
                      Class 12th — Target JEE 2027 (1-Year Fast Track)
                    </option>
                    <option value="Dropper & Repeater - Target JEE 2027 Rank Booster">
                      Dropper &amp; Repeater — Target JEE 2027 Rank Booster
                    </option>
                    <option value="Class 8th-10th IIT Foundation Concept Builder">
                      Class 8th–10th Foundation Concept Builder
                    </option>
                    <option value="Class 11th & 12th Math Special (DK Sir 20s Techniques)">
                      Class 11th &amp; 12th Math Special (DK Sir 20s Techniques)
                    </option>
                    <option value="All India Online CBT Test Series">
                      All India Online CBT Test Series
                    </option>
                  </select>
                </div>

                {/* High-Contrast Primary Submit Button */}
                <div className={styles.actionButtonsRow}>
                  <button
                    type="submit"
                    className={styles.highContrastSubmitBtn}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className={styles.spinner} aria-hidden="true" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <span>Request Callback Now</span>
                        <Send size={16} aria-hidden="true" />
                      </>
                    )}
                  </button>

                  <a
                    href={whatsappDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.whatsappGhostBtn}
                    title="Connect with senior counseling team on WhatsApp"
                  >
                    <MessageCircle size={18} className={styles.waIcon} aria-hidden="true" />
                    <span>Prefer WhatsApp? Chat Directly with Mentors</span>
                  </a>
                </div>

                <p className={styles.disclaimerText}>
                  Zero spam commitment. Your contact information is strictly used for admissions counseling by DK Academy JEE.
                </p>
              </form>
            ) : (
              /* Success Confirmation Card */
              <div className={styles.successBox} role="status" aria-live="polite">
                <div className={styles.successIcon}>
                  <Check size={28} aria-hidden="true" />
                </div>
                <h3 className={styles.successTitle}>Callback Request Received!</h3>
                <p className={styles.successSubtitle}>
                  Thank you, <strong>{submittedLead.fullName}</strong>. A senior academic advisor will contact you on{' '}
                  <strong>+91 {submittedLead.mobile}</strong> shortly regarding{' '}
                  <strong>{submittedLead.targetBatch}</strong>.
                </p>
                <div className={styles.inquiryRefBadge}>
                  <span>Inquiry ID:</span>
                  <strong>{submittedLead.id}</strong>
                </div>

                <div className={styles.successActions}>
                  <a
                    href={whatsappDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.whatsappDirectSuccessBtn}
                  >
                    <MessageCircle size={18} aria-hidden="true" />
                    <span>Fast-Track on WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleReset}
                    className={styles.resetBtn}
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
};

export default CallbackForm;
