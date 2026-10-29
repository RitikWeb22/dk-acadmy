import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { StudentProfile, NotificationPreferences } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import {
  Bell,
  CheckCircle2,
  FileText,
  ShieldCheck,
  ExternalLink,
  Mail,
  Smartphone,
  Calendar,
  BookOpen,
  Send,
  Check,
  AlertCircle,
  Lock,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { getStudentWhatsAppUrl } from '../../../utils/whatsapp';
import styles from './AccountSettings.module.scss';

interface AccountSettingsProps {
  student: StudentProfile;
  onUpdatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<{ success: boolean; error?: string }>;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({
  student,
  onUpdatePreferences
}) => {
  const { showToast } = useToast();
  const prefs = student.notificationPreferences || {
    emailAlerts: true,
    dppReminders: true,
    mockTestUpdates: true,
    smsExamUpdates: false
  };

  const [emailAlerts, setEmailAlerts] = useState(prefs.emailAlerts);
  const [dppReminders, setDppReminders] = useState(prefs.dppReminders);
  const [mockTestUpdates, setMockTestUpdates] = useState(prefs.mockTestUpdates);
  const [smsExamUpdates, setSmsExamUpdates] = useState(prefs.smsExamUpdates);
  const [isWhatsAppActive, setIsWhatsAppActive] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Format phone number to "+91 98765 43210" format
  const rawPhone = (student.phone || '9876543210').replace(/\D/g, '');
  const formattedPhone = rawPhone.length === 10
    ? `+91 ${rawPhone.slice(0, 5)} ${rawPhone.slice(5)}`
    : `+91 ${rawPhone}`;

  const handleToggle = async (key: keyof NotificationPreferences, currentValue: boolean) => {
    const newValue = !currentValue;

    if (key === 'emailAlerts') setEmailAlerts(newValue);
    if (key === 'dppReminders') setDppReminders(newValue);
    if (key === 'mockTestUpdates') setMockTestUpdates(newValue);
    if (key === 'smsExamUpdates') setSmsExamUpdates(newValue);

    setSaveStatus('Saving...');
    try {
      await onUpdatePreferences({ [key]: newValue });
      setSaveStatus('Changes saved automatically');
      showToast('Notification preference updated.', 'success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus('Failed to update preference');
      showToast('Failed to update preference.', 'error');
    }
  };

  const handleToggleWhatsApp = () => {
    const nextState = !isWhatsAppActive;
    setIsWhatsAppActive(nextState);
    if (nextState) {
      showToast('WhatsApp broadcasts activated for your batch.', 'success');
    } else {
      showToast('WhatsApp updates paused. You can re-enable anytime.', 'info');
    }
  };

  const handleSendTestNotification = () => {
    setIsSendingTest(true);
    setTimeout(() => {
      setIsSendingTest(false);
      showToast('🚀 Test Ping Delivered: Daily DPP Set #42 is live with 25 Math & Physics problems!', 'info');
    }, 450);
  };

  const whatsappSupportUrl = getStudentWhatsAppUrl({
    studentName: student.name,
    currentClass: student.targetClass,
    question: 'I have an inquiry regarding my academic notifications, batch schedule, and counseling support.'
  });

  return (
    <div className={styles.settingsContainer}>
      {/* 1. Header Card with Title and Ghost Action Button */}
      <div className={styles.mainCard}>
        <div className={styles.cardHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIconBox}>
              <Bell size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Notification Settings &amp; Preferences</h2>
              <p className={styles.cardSubtitle}>
                Manage your academic study reminders, CBT test alerts, SMS updates, and platform policies.
              </p>
            </div>
          </div>

          <div className={styles.headerRightActions}>
            {saveStatus && (
              <span className={styles.saveStatusPill} role="status">
                <CheckCircle2 size={13} aria-hidden="true" />
                <span>{saveStatus}</span>
              </span>
            )}

        
          </div>
        </div>

        {/* 2. Delivery Channel Status Bento Grid (3-Column structured card grid) */}
        <div className={styles.deliveryBentoGrid} role="region" aria-label="Notification Delivery Channels">
          {/* Card 1: Email Delivery */}
          <div className={styles.channelCard}>
            <div className={styles.channelHeader}>
              <div className={`${styles.channelIconBox} ${styles.iconEmail}`}>
                <Mail size={16} aria-hidden="true" />
              </div>
              <span className={styles.emeraldBadge}>
                <Check size={11} aria-hidden="true" /> Active
              </span>
            </div>
            <div className={styles.channelBody}>
              <span className={styles.channelTypeLabel}>Email Delivery</span>
              <span className={styles.channelEndpointText} title={student.email || 'aarav.sharma@jee2026.in'}>
                {student.email || 'aarav.sharma@jee2026.in'}
              </span>
              <span className={styles.channelMicroCopy}>Verified primary address</span>
            </div>
          </div>

          {/* Card 2: SMS Alerts */}
          <div className={styles.channelCard}>
            <div className={styles.channelHeader}>
              <div className={`${styles.channelIconBox} ${styles.iconSms}`}>
                <Smartphone size={16} aria-hidden="true" />
              </div>
              <span className={styles.emeraldBadge}>
                <Check size={11} aria-hidden="true" /> Active
              </span>
            </div>
            <div className={styles.channelBody}>
              <span className={styles.channelTypeLabel}>SMS Alerts</span>
              <span className={styles.channelEndpointText}>
                {formattedPhone}
              </span>
              <span className={styles.channelMicroCopy}>NTA intimations &amp; OTPs</span>
            </div>
          </div>

          {/* Card 3: WhatsApp Updates */}
          <div className={styles.channelCard}>
            <div className={styles.channelHeader}>
              <div className={`${styles.channelIconBox} ${styles.iconWhatsApp}`}>
                <MessageCircle size={16} aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={handleToggleWhatsApp}
                className={`${styles.waQuickToggleBtn} ${isWhatsAppActive ? styles.waActive : styles.waOptOut}`}
                aria-label={`WhatsApp broadcasts ${isWhatsAppActive ? 'Active' : 'Opted out'}. Click to toggle.`}
                title="Toggle WhatsApp broadcast opt-in"
              >
                {isWhatsAppActive ? (
                  <>
                    <Check size={11} aria-hidden="true" /> Active
                  </>
                ) : (
                  'Opted out'
                )}
              </button>
            </div>
            <div className={styles.channelBody}>
              <span className={styles.channelTypeLabel}>WhatsApp Updates</span>
              <span className={styles.channelEndpointText}>
                Admissions &amp; Batch Broadcasts
              </span>
              <span className={styles.channelMicroCopy}>Instant PDF lecture materials</span>
            </div>
          </div>
        </div>

        {/* 3. Academic Reminders & Schedule Alerts (Toggle Matrix) */}
        <section
          id="notification-preferences"
          className={styles.toggleMatrixSection}
          aria-labelledby="toggle-matrix-heading"
        >
          <div className={styles.sectionHeaderBar}>
            <div className={styles.sectionIconTitle}>
              <div className={styles.sectionIconBadge}>
                <Sparkles size={16} aria-hidden="true" />
              </div>
              <div>
                <h3 id="toggle-matrix-heading" className={styles.sectionTitle}>
                  Academic Reminders &amp; Schedule Alerts
                </h3>
                <p className={styles.sectionSubtitle}>
                  Real-time alerts to maintain your preparation consistency. Changes save automatically.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.toggleMatrixRows}>
            {/* Row 1: Daily DPP Practice Reminders */}
            <div className={styles.matrixRow}>
              <div className={styles.matrixLeftCol}>
                <div className={`${styles.itemIconBox} ${styles.iconDpp}`}>
                  <BookOpen size={18} aria-hidden="true" />
                </div>
              </div>
              <div className={styles.matrixMidCol}>
                <h4 className={styles.rowTitle}>Daily DPP Practice Reminders</h4>
                <p className={styles.rowSubtext}>
                  <strong className={styles.timingHighlight}>Alert at 06:00 AM</strong> • Daily JEE Math &amp; Physics problem sets dispatched directly to your portal.
                </p>
              </div>
              <div className={styles.matrixRightCol}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={dppReminders}
                  onClick={() => handleToggle('dppReminders', dppReminders)}
                  className={`${styles.iosToggleSwitch} ${dppReminders ? styles.toggleOn : ''}`}
                  aria-label="Toggle Daily DPP Practice Reminders"
                >
                  <span className={styles.toggleKnob} />
                </button>
              </div>
            </div>

            {/* Row 2: All-India CBT Test Schedules */}
            <div className={styles.matrixRow}>
              <div className={styles.matrixLeftCol}>
                <div className={`${styles.itemIconBox} ${styles.iconCbt}`}>
                  <Calendar size={18} aria-hidden="true" />
                </div>
              </div>
              <div className={styles.matrixMidCol}>
                <h4 className={styles.rowTitle}>All-India CBT Test Schedules</h4>
                <p className={styles.rowSubtext}>
                  <strong className={styles.timingHighlight}>24 hours prior</strong> • Critical reminders for full-syllabus NTA pattern mock tests &amp; scorecards.
                </p>
              </div>
              <div className={styles.matrixRightCol}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={mockTestUpdates}
                  onClick={() => handleToggle('mockTestUpdates', mockTestUpdates)}
                  className={`${styles.iosToggleSwitch} ${mockTestUpdates ? styles.toggleOn : ''}`}
                  aria-label="Toggle All-India CBT Test Schedules"
                >
                  <span className={styles.toggleKnob} />
                </button>
              </div>
            </div>

            {/* Row 3: Lecture Handouts & Formula Sheets */}
            <div className={styles.matrixRow}>
              <div className={styles.matrixLeftCol}>
                <div className={`${styles.itemIconBox} ${styles.iconHandouts}`}>
                  <FileText size={18} aria-hidden="true" />
                </div>
              </div>
              <div className={styles.matrixMidCol}>
                <h4 className={styles.rowTitle}>Lecture Handouts &amp; Formula Sheets</h4>
                <p className={styles.rowSubtext}>
                  <strong className={styles.timingHighlight}>Post-lecture</strong> • Downloadable PDF formula compendiums, chapter summaries, and speed solution notes.
                </p>
              </div>
              <div className={styles.matrixRightCol}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={emailAlerts}
                  onClick={() => handleToggle('emailAlerts', emailAlerts)}
                  className={`${styles.iosToggleSwitch} ${emailAlerts ? styles.toggleOn : ''}`}
                  aria-label="Toggle Lecture Handouts &amp; Formula Sheets"
                >
                  <span className={styles.toggleKnob} />
                </button>
              </div>
            </div>

            {/* Row 4: Official NTA Exam & Admit Card SMS Alerts */}
            <div className={styles.matrixRow}>
              <div className={styles.matrixLeftCol}>
                <div className={`${styles.itemIconBox} ${styles.iconNta}`}>
                  <AlertCircle size={18} aria-hidden="true" />
                </div>
              </div>
              <div className={styles.matrixMidCol}>
                <h4 className={styles.rowTitle}>Official NTA Exam &amp; Admit Card SMS Alerts</h4>
                <p className={styles.rowSubtext}>
                  <strong className={styles.timingHighlight}>Instant SMS</strong> • Direct notifications for JEE Main registration, admit card intimations &amp; answer keys.
                </p>
              </div>
              <div className={styles.matrixRightCol}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={smsExamUpdates}
                  onClick={() => handleToggle('smsExamUpdates', smsExamUpdates)}
                  className={`${styles.iosToggleSwitch} ${smsExamUpdates ? styles.toggleOn : ''}`}
                  aria-label="Toggle Official NTA Exam &amp; Admit Card SMS Alerts"
                >
                  <span className={styles.toggleKnob} />
                </button>
              </div>
            </div>
          </div>
        </section>

    

        {/* 5. Policies, Privacy & Student Support Grid (Clean 3-Card Resource Bar) */}
        <section className={styles.resourceSection} aria-labelledby="resources-heading">
          <h4 id="resources-heading" className="sr-only">
            Policies, Privacy &amp; Student Support Resources
          </h4>

          <div className={styles.resourceGrid}>
            {/* Card 1: Terms of Service & Code of Conduct */}
            <Link to="/terms" className={styles.resourceCard}>
              <div className={styles.resourceIconBox}>
                <FileText size={18} aria-hidden="true" />
              </div>
              <div className={styles.resourceContent}>
                <h4 className={styles.resourceTitle}>
                  Terms of Service &amp; Code of Conduct
                </h4>
                <p className={styles.resourceDesc}>
                  Course access rules, refund policy, and classroom decorum guidelines.
                </p>
              </div>
              <div className={styles.resourceArrowBox}>
                <ExternalLink size={15} aria-hidden="true" />
              </div>
            </Link>

            {/* Card 2: Student Data & Analytics Privacy Policy */}
            <Link to="/privacy" className={styles.resourceCard}>
              <div className={`${styles.resourceIconBox} ${styles.iconPrivacy}`}>
                <Lock size={18} aria-hidden="true" />
              </div>
              <div className={styles.resourceContent}>
                <h4 className={styles.resourceTitle}>
                  Student Data &amp; Analytics Privacy Policy
                </h4>
                <p className={styles.resourceDesc}>
                  Encrypted storage and protection for mock test percentiles &amp; performance data.
                </p>
              </div>
              <div className={styles.resourceArrowBox}>
                <ExternalLink size={15} aria-hidden="true" />
              </div>
            </Link>

            {/* Card 3: Counselor & Academic Support Line */}
            <a
              href={whatsappSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.resourceCard} ${styles.whatsappSupportCard}`}
            >
              <div className={`${styles.resourceIconBox} ${styles.iconSupport}`}>
                <MessageCircle size={18} aria-hidden="true" />
              </div>
              <div className={styles.resourceContent}>
                <h4 className={styles.resourceTitle}>
                  Counselor &amp; Academic Support Line
                </h4>
                <p className={styles.resourceDesc}>
                  Direct WhatsApp advisory desk with Janakpuri academic coordinators.
                </p>
              </div>
              <div className={`${styles.resourceArrowBox} ${styles.waArrowBox}`}>
                <ExternalLink size={15} aria-hidden="true" />
              </div>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

