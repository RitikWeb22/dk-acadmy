import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { useStudentAuth } from '../../context/AuthContext';
import {
  AuthLayout,
  AuthInput,
  AuthSubmitButton,
  AuthErrorMessage,
  AuthSuccessMessage
} from '../../components/auth';
import styles from './ForgotPasswordPage.module.scss';

export const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset } = useStudentAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const validate = (): boolean => {
    setEmailError(null);
    setGeneralError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError('Please enter the email address linked to your student account.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('Please enter a valid email address (e.g. name@example.com).');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isLoading) return;

    setIsLoading(true);
    setGeneralError(null);

    try {
      const res = await requestPasswordReset(email);
      if (res.success) {
        setIsSubmitted(true);
        setSuccessMessage(res.message);
        setResendCooldown(30);

        // Start 30s countdown for resend
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch {
      setGeneralError('Network error dispatching password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your registered email address and we'll send you recovery instructions."
      badgeText="Account Recovery"
    >
      {isSubmitted ? (
        <div className={styles.successState}>
          <div className={styles.successIconCircle}>
            <CheckCircle2 size={36} />
          </div>

          <div className={styles.successTextGroup}>
            <h2 className={styles.successHeading}>Check Your Inbox</h2>
            <p className={styles.successSubtext}>
              If an account is associated with <strong>{email}</strong>, we have dispatched instructions with a secure link to reset your credentials.
            </p>
          </div>

          <div className={styles.securityNote}>
            <p>
              Please allow up to 2 minutes for delivery. Check your spam or promotional folders if you don't see it in your primary inbox.
            </p>
          </div>

          <div className={styles.actionButtons}>
            <Link to="/login" className={styles.backToLoginBtn}>
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Return to Sign In</span>
            </Link>

            <button
              type="button"
              disabled={resendCooldown > 0 || isLoading}
              onClick={handleSubmit}
              className={styles.resendBtn}
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>
                {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Resend instructions'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <AuthErrorMessage message={generalError} />
          <AuthSuccessMessage message={successMessage} />

          <AuthInput
            id="forgot-email"
            label="Registered Student Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            placeholder="e.g. student@jee2026.in"
            required
            disabled={isLoading}
            error={emailError}
            hint="We'll send password recovery instructions to this address."
            icon={<Mail size={16} />}
          />

          <div className={styles.submitSlot}>
            <AuthSubmitButton isLoading={isLoading} icon={<ArrowRight size={18} />}>
              Send Reset Link
            </AuthSubmitButton>
          </div>

          <div className={styles.footerNav}>
            <Link to="/login" className={styles.backLink}>
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
