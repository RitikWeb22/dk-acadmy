import React, { useState, useEffect } from 'react';
import {
  X,
  PhoneCall,
  Clock,
  CheckCircle2,
  Send,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Phone,
  Sunrise,
  Sun,
  Moon
} from 'lucide-react';
import { leadService } from '../../../services/leadService';
import { getStudentWhatsAppUrl } from '../../../utils/whatsapp';
import type { TimeSlot, ProspectiveLead } from '../../../types/lead';
import styles from './CallbackModal.module.scss';

interface CallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBatch?: string;
  defaultClass?: 'Class 10th' | 'Class 11th' | 'Class 12th' | 'Dropper';
  source?: string;
}

const BATCH_OPTIONS = [
  'JEE Main & Advanced 2-Year Comprehensive (Class 11th)',
  'Class 11th & 12th Math Special (DK Sir 20s Techniques)',
  'JEE Advanced 1-Year Fast Track (Class 12th)',
  'Dropper & Repeater Rank Booster (Target 2026/2027)',
  'Class 9th & 10th IIT Foundation Concept Builder',
  'All India CBT Mock Test Series & Chapter DPPs'
];

const TIME_SLOTS: {
  label: TimeSlot;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  sub: string;
}[] = [
  {
    label: 'Morning (9:00 AM – 12:00 PM)',
    icon: Sunrise,
    sub: '9 AM – 12 PM'
  },
  {
    label: 'Afternoon (12:00 PM – 4:00 PM)',
    icon: Sun,
    sub: '12 PM – 4 PM'
  },
  {
    label: 'Evening (4:00 PM – 8:00 PM)',
    icon: Moon,
    sub: '4 PM – 8 PM'
  }
];

export const CallbackModal: React.FC<CallbackModalProps> = ({
  isOpen,
  onClose,
  defaultBatch,
  defaultClass = 'Class 11th',
  source = 'Floating Callback Widget'
}) => {
  const [activeTab, setActiveTab] = useState<'callback' | 'whatsapp'>('callback');

  // Form State
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [currentClass, setCurrentClass] = useState<'Class 10th' | 'Class 11th' | 'Class 12th' | 'Dropper'>(defaultClass);
  const [targetBatch, setTargetBatch] = useState(defaultBatch || BATCH_OPTIONS[0]);
  const [preferredTime, setPreferredTime] = useState<TimeSlot>('Evening (4:00 PM – 8:00 PM)');
  const [queryNotes, setQueryNotes] = useState('');

  // Errors & submission state
  const [nameError, setNameError] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<ProspectiveLead | null>(null);

  // Sync defaultBatch if changed
  useEffect(() => {
    if (defaultBatch) setTargetBatch(defaultBatch);
    if (defaultClass) setCurrentClass(defaultClass);
  }, [defaultBatch, defaultClass]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    let valid = true;
    setNameError(null);
    setMobileError(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setNameError('Please enter your full name (minimum 2 characters).');
      valid = false;
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!cleanMobile) {
      setMobileError('Please enter your 10-digit mobile number.');
      valid = false;
    } else if (!mobileRegex.test(cleanMobile)) {
      setMobileError('Enter a valid 10-digit Indian mobile number (starts with 6-9).');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newLead = leadService.submitLead({
        fullName,
        mobile,
        currentClass,
        targetBatch,
        preferredTime,
        queryNotes,
        source: source as any
      });

      setIsSubmitting(false);
      setSubmittedLead(newLead);
    }, 600);
  };

  const handleReset = () => {
    setFullName('');
    setMobile('');
    setQueryNotes('');
    setSubmittedLead(null);
    setNameError(null);
    setMobileError(null);
  };

  const whatsappDirectUrl = getStudentWhatsAppUrl({
    studentName: fullName,
    targetBatch,
    currentClass,
    preferredTime,
    inquiryId: submittedLead?.id
  });

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="callback-modal-title"
    >
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.iconCircle} aria-hidden="true">
              <PhoneCall size={20} />
            </div>
            <div>
              <h2 id="callback-modal-title" className={styles.modalTitle}>
                Academic Counseling &amp; Admissions
              </h2>
              <p className={styles.modalSubtitle}>
                Official DK Academy JEE Guidance • Janakpuri Center &amp; Online Batches
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close counseling modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher: Scheduled Callback vs Instant WhatsApp */}
        {!submittedLead && (
          <div className={styles.tabGroup} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'callback'}
              className={`${styles.tabBtn} ${activeTab === 'callback' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('callback')}
            >
              <Clock size={15} />
              <span>Request Scheduled Callback</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'whatsapp'}
              className={`${styles.tabBtn} ${styles.whatsappTab} ${activeTab === 'whatsapp' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('whatsapp')}
            >
              <MessageCircle size={15} />
              <span>Instant WhatsApp Connect</span>
              <span className={styles.instantTag}>FASTEST</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {submittedLead ? (
            /* Submission Success View with Reference ID & WhatsApp Trigger */
            <div className={styles.successView} role="alert">
              <div className={styles.successIconCircle}>
                <CheckCircle2 size={36} />
              </div>
              <h3 className={styles.successTitle}>Inquiry Registered Successfully!</h3>
              <div className={styles.referenceBadge}>
                <span>Reference Inquiry ID:</span>
                <strong>{submittedLead.id}</strong>
              </div>
              <p className={styles.successText}>
                Thank you, <strong>{submittedLead.fullName}</strong>. Our senior counseling team has logged your inquiry for <strong>{submittedLead.targetBatch}</strong>.
              </p>

              <div className={styles.slotConfirmedCard}>
                <Clock size={16} className={styles.slotClockIcon} />
                <div>
                  <strong>Scheduled Callback Window:</strong>
                  <p>{submittedLead.preferredTime}</p>
                </div>
              </div>

              {/* Instant WhatsApp bridge */}
              <div className={styles.instantBridgeBox}>
                <span className={styles.bridgeLabel}>Prefer an immediate response right now?</span>
                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.instantWhatsAppBtn}
                >
                  <MessageCircle size={18} />
                  <span>Chat with Senior Counselor on WhatsApp</span>
                </a>
              </div>

              <div className={styles.successActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={handleReset}
                >
                  Submit Another Inquiry
                </button>
                <button
                  type="button"
                  className={styles.primaryDoneBtn}
                  onClick={onClose}
                >
                  Done
                </button>
              </div>
            </div>
          ) : activeTab === 'callback' ? (
            /* Form Tab: Schedule Academic Callback */
            <form onSubmit={handleSubmit} noValidate className={styles.form}>
              {/* Row 1: Name and Mobile */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="cb-fullname" className={styles.label}>
                    Student Full Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="cb-fullname"
                    type="text"
                    className={`${styles.input} ${nameError ? styles.hasError : ''}`}
                    placeholder="e.g. Aarav Sharma"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (nameError) setNameError(null);
                    }}
                    disabled={isSubmitting}
                    required
                  />
                  {nameError && (
                    <span className={styles.errorText} role="alert">
                      {nameError}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="cb-mobile" className={styles.label}>
                    10-Digit Mobile Number <span className={styles.required}>*</span>
                  </label>
                  <div className={`${styles.phoneInputWrapper} ${mobileError ? styles.hasError : ''}`}>
                    <span className={styles.prefix}>+91</span>
                    <input
                      id="cb-mobile"
                      type="tel"
                      maxLength={10}
                      className={styles.phoneInput}
                      placeholder="e.g. 9876543210"
                      value={mobile}
                      onChange={(e) => {
                        setMobile(e.target.value.replace(/\D/g, ''));
                        if (mobileError) setMobileError(null);
                      }}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  {mobileError && (
                    <span className={styles.errorText} role="alert">
                      {mobileError}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Target Batch Selection */}
              <div className={styles.formGroup}>
                <label htmlFor="cb-batch" className={styles.label}>
                  Target Batch / Course Selection <span className={styles.required}>*</span>
                </label>
                <select
                  id="cb-batch"
                  className={styles.select}
                  value={targetBatch}
                  onChange={(e) => setTargetBatch(e.target.value)}
                  disabled={isSubmitting}
                >
                  {BATCH_OPTIONS.map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 3: Current Class Selection */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Current Academic Class / Stage <span className={styles.required}>*</span>
                </label>
                <div className={styles.classChipsRow}>
                  {(['Class 10th', 'Class 11th', 'Class 12th', 'Dropper'] as const).map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      className={`${styles.classChip} ${currentClass === cls ? styles.classChipActive : ''}`}
                      onClick={() => setCurrentClass(cls)}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 4: Preferred Contact Time Slots */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Preferred Callback Time Slot <span className={styles.required}>*</span>
                </label>
                <div className={styles.timeSlotGrid}>
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = preferredTime === slot.label;
                    const SlotIcon = slot.icon;
                    return (
                      <button
                        key={slot.label}
                        type="button"
                        className={`${styles.timeSlotCard} ${isSelected ? styles.timeSlotCardActive : ''}`}
                        onClick={() => setPreferredTime(slot.label)}
                        aria-pressed={isSelected}
                      >
                        <span className={styles.slotIcon}>
                          <SlotIcon size={18} strokeWidth={1.8} />
                        </span>
                        <div className={styles.slotInfo}>
                          <span className={styles.slotTitle}>{slot.label.split(' ')[0]}</span>
                          <span className={styles.slotSub}>{slot.sub}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 5: Specific Query / Questions (Optional) */}
              <div className={styles.formGroup}>
                <label htmlFor="cb-notes" className={styles.label}>
                  Any Specific Question or Goal? <span className={styles.optional}>(Optional)</span>
                </label>
                <input
                  id="cb-notes"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Inquiring about Janakpuri offline seat or scholarship test"
                  value={queryNotes}
                  onChange={(e) => setQueryNotes(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Trust & Zero Spam Note */}
              <div className={styles.trustNote}>
                <ShieldCheck size={15} className={styles.shieldIcon} />
                <span>Zero-Spam Promise: We never share numbers. Calls are strictly for academic guidance.</span>
              </div>

              {/* Submit Button */}
              <div className={styles.modalActions}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.submitBtn}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className={styles.spinner} />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Request Senior Counselor Callback</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Mode B: Direct Instant WhatsApp */
            <div className={styles.whatsappTabPanel}>
              <div className={styles.waLiveStatus}>
                <div className={styles.pulseDot} />
                <span>Senior Academic Counselors Online Now</span>
              </div>

              <div className={styles.waCard}>
                <div className={styles.waIconLarge}>
                  <MessageCircle size={32} />
                </div>
                <h3 className={styles.waTitle}>Direct 1-Click WhatsApp Support</h3>
                <p className={styles.waDesc}>
                  Connect directly with Dharmendra Kumar Sir (DK Sir) and the official Janakpuri Admissions Desk. Fast responses for batch queries, fee scholarships, and study materials.
                </p>

                <div className={styles.waBatchSelect}>
                  <label htmlFor="wa-batch-select" className={styles.label}>
                    Inquiring About:
                  </label>
                  <select
                    id="wa-batch-select"
                    className={styles.select}
                    value={targetBatch}
                    onChange={(e) => setTargetBatch(e.target.value)}
                  >
                    {BATCH_OPTIONS.map((batch) => (
                      <option key={batch} value={batch}>
                        {batch}
                      </option>
                    ))}
                  </select>
                </div>

                <a
                  href={getStudentWhatsAppUrl({ targetBatch })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.openWhatsAppBtn}
                >
                  <MessageCircle size={18} />
                  <span>Open WhatsApp (+91 93259 87875)</span>
                </a>

                <div className={styles.directCallRow}>
                  <span className={styles.callLabel}>Or call counselors directly:</span>
                  <div className={styles.callLinks}>
                    <a href="tel:9325987875" className={styles.phoneChip}>
                      <Phone size={13} /> 93259 87875
                    </a>
                    <a href="tel:9717159062" className={styles.phoneChip}>
                      <Phone size={13} /> 97171 59062
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
