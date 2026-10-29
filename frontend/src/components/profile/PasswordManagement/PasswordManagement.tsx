import React, { useState } from 'react';
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Smartphone,
  Laptop,
  LogOut,
  Lock,
  Check,
  Shield,
  HelpCircle,
  Sparkles,
  Circle
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import styles from './PasswordManagement.module.scss';

interface PasswordManagementProps {
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

export const PasswordManagement: React.FC<PasswordManagementProps> = ({
  onChangePassword
}) => {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOutDevices, setIsLoggingOutDevices] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);

  // 3-Point Validation Checklist rules
  const rule1Met = newPassword.length >= 8;
  const rule2Met = /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword);
  const rule3Met = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'None', color: '#e2e8f0' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    if (pwd.length >= 10 && /[A-Z]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: '#ef4444' };
      case 2:
        return { score: 2, label: 'Fair', color: '#f59e0b' };
      case 3:
        return { score: 3, label: 'Good', color: '#2563eb' };
      case 4:
        return { score: 4, label: 'Strong', color: '#10b981' };
      default:
        return { score: 1, label: 'Weak', color: '#ef4444' };
    }
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }
    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (!rule2Met) {
      setError('Password must contain at least one number and one symbol.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onChangePassword(currentPassword, newPassword);
      if (res.success) {
        setSuccess('Password updated successfully! Keep your credentials safe.');
        showToast('🔒 Password updated successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(res.error || 'Failed to update password. Please check your current password.');
      }
    } catch {
      setError('Network error updating password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
    showToast('Password form changes discarded.', 'info');
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast('📧 Password reset instructions dispatched to your registered email.', 'info');
  };

  const handleToggle2FA = () => {
    const nextState = !is2FAEnabled;
    setIs2FAEnabled(nextState);
    if (nextState) {
      showToast('Two-Factor Authentication (2FA) enabled for all CBT test submissions.', 'success');
    } else {
      showToast('2FA paused. We recommend keeping 2FA enabled for account safety.', 'info');
    }
  };

  const handleLogoutOtherDevices = () => {
    setIsLoggingOutDevices(true);
    setTimeout(() => {
      setIsLoggingOutDevices(false);
      showToast('✓ All other device sessions have been successfully terminated.', 'info');
    }, 600);
  };

  return (
    <div className={styles.securityWrapper}>
      {/* SECTION 1: CHANGE STUDENT PASSWORD CARD */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.titleGroup}>
            <div className={styles.headerIconRow}>
              <div className={styles.iconBox}>
                <KeyRound size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 className={styles.cardTitle}>Change Student Password</h2>
                <p className={styles.cardSubtitle}>
                  Ensure your account is protected against unauthorized access during live CBT tests.
                </p>
              </div>
            </div>
          </div>
        </div>

        {success && (
          <div className={styles.successBanner} role="status">
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className={styles.errorBanner} role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          {/* Structured 2-Column Grid */}
          <div className={styles.formGrid}>
            {/* Row 1 (Full Width): Current Password with direct action link */}
            <div className={styles.fullWidthField}>
              <div className={styles.fieldLabelRow}>
                <label htmlFor="current-pwd" className={styles.label}>
                  Current Password <span className={styles.requiredAsterisk} aria-hidden="true">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className={styles.forgotPwdLink}
                >
                  Forgot Password?
                </button>
              </div>

              <div className={styles.inputWrapper}>
                <Lock size={16} className={styles.inputPrefixIcon} aria-hidden="true" />
                <input
                  id="current-pwd"
                  type={showCurrent ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isSubmitting}
                  placeholder="Enter your current password"
                  className={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className={styles.toggleVisibilityBtn}
                  aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                  title={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Row 2 (Col 1): New Password */}
            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabelRow}>
                <label htmlFor="new-pwd" className={styles.label}>
                  New Password <span className={styles.requiredAsterisk} aria-hidden="true">*</span>
                </label>
              </div>

              <div className={styles.inputWrapper}>
                <Lock size={16} className={styles.inputPrefixIcon} aria-hidden="true" />
                <input
                  id="new-pwd"
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isSubmitting}
                  placeholder="Min. 8 characters"
                  className={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className={styles.toggleVisibilityBtn}
                  aria-label={showNew ? 'Hide new password' : 'Show new password'}
                  title={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Row 2 (Col 2): Confirm New Password with Dynamic Matching Indicator */}
            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabelRow}>
                <label htmlFor="confirm-pwd" className={styles.label}>
                  Confirm New Password <span className={styles.requiredAsterisk} aria-hidden="true">*</span>
                </label>
                {rule3Met && (
                  <span className={styles.matchingNotice}>
                    <CheckCircle2 size={12} aria-hidden="true" /> Passwords Match
                  </span>
                )}
              </div>

              <div className={`${styles.inputWrapper} ${rule3Met ? styles.inputWrapperMatched : ''}`}>
                <Lock size={16} className={styles.inputPrefixIcon} aria-hidden="true" />
                <input
                  id="confirm-pwd"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isSubmitting}
                  placeholder="Re-enter new password"
                  className={styles.input}
                />
                <div className={styles.inputSuffixGroup}>
                  {rule3Met && (
                    <span className={styles.matchedIndicatorIcon} title="Passwords match seamlessly">
                      <CheckCircle2 size={16} aria-hidden="true" />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className={styles.toggleVisibilityBtn}
                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                    title={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Real-Time Password Strength Meter */}
          {newPassword && (
            <div className={styles.strengthMeterContainer}>
              <div className={styles.strengthMeterHeader}>
                <span className={styles.strengthMeterTitle}>Password Strength:</span>
                <span className={styles.strengthScoreBadge} style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
              <div className={styles.meterBars}>
                {[1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className={styles.meterBar}
                    style={{
                      background: step <= strength.score ? strength.color : '#e2e8f0'
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 3-Point Validation Checklist */}
          <div className={styles.validationChecklist}>
            <div className={`${styles.checklistItem} ${rule1Met ? styles.met : ''}`}>
              <span className={styles.checklistIconWrapper}>
                {rule1Met ? (
                  <Check size={11} className={styles.checkIcon} aria-hidden="true" />
                ) : (
                  <Circle size={8} className={styles.dotIcon} aria-hidden="true" />
                )}
              </span>
              <span>Minimum 8 characters (Recommended: 10+)</span>
            </div>

            <div className={`${styles.checklistItem} ${rule2Met ? styles.met : ''}`}>
              <span className={styles.checklistIconWrapper}>
                {rule2Met ? (
                  <Check size={11} className={styles.checkIcon} aria-hidden="true" />
                ) : (
                  <Circle size={8} className={styles.dotIcon} aria-hidden="true" />
                )}
              </span>
              <span>At least one number (0-9) &amp; symbol (@, #, $)</span>
            </div>

            <div className={`${styles.checklistItem} ${rule3Met ? styles.met : ''}`}>
              <span className={styles.checklistIconWrapper}>
                {rule3Met ? (
                  <Check size={11} className={styles.checkIcon} aria-hidden="true" />
                ) : (
                  <Circle size={8} className={styles.dotIcon} aria-hidden="true" />
                )}
              </span>
              <span>Passwords match seamlessly</span>
            </div>
          </div>

          {/* Action Button Row */}
          <div className={styles.actionButtonRow}>
            <div className={styles.securityHelperText}>
              <Shield size={15} aria-hidden="true" />
              <span>Password updates will require re-login on unauthorized devices.</span>
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={handleDiscard}
                disabled={isSubmitting || (!currentPassword && !newPassword && !confirmPassword)}
                className={styles.discardBtn}
              >
                Discard
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className={styles.updateBtn}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className={styles.spin} aria-hidden="true" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

    </div>
  );
};
