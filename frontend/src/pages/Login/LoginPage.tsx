import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ArrowRight, LogOut } from 'lucide-react';
import { useStudentAuth } from '../../context/AuthContext';
import {
  AuthLayout,
  AuthInput,
  PasswordInput,
  GoogleSignInButton,
  AuthSubmitButton,
  AuthErrorMessage
} from '../../components/auth';
import styles from './LoginPage.module.scss';

// Safe redirect validator to prevent open redirects (defaults to home page)
function getSafeRedirectUrl(target: string | null): string {
  if (!target) return '/';
  // Must be a relative path starting with / and not // (protocol-relative)
  if (target.startsWith('/') && !target.startsWith('//')) {
    return target;
  }
  return '/';
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawRedirect = searchParams.get('redirect') || searchParams.get('returnUrl');
  const redirectPath = getSafeRedirectUrl(rawRedirect);

  const {
    loginWithCredentials,
    isAuthenticated,
    student,
    logout
  } = useStudentAuth();

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Field errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Async & Security states
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Rate limiting countdown effect
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setFailedAttempts(0);
          setGeneralError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // If already authenticated, show friendly session info and quick jump
  if (isAuthenticated && student) {
    return (
      <AuthLayout
        title="Active Student Session"
        subtitle="You are currently signed in to the DK Academy JEE portal."
        badgeText="Authenticated"
      >
        <div className={styles.activeSessionCard}>
          <div className={styles.avatarCircle} aria-hidden="true">
            {student.name.charAt(0)}
          </div>
          <div className={styles.activeMeta}>
            <span className={styles.studentName}>{student.name}</span>
            <span className={styles.studentEmail}>{student.email || 'student@dkacademyjee.com'}</span>
            <span className={styles.studentRole}>{student.targetExam || 'JEE Main & Advanced'} Aspirant</span>
          </div>

          <div className={styles.activeActions}>
            <AuthSubmitButton
              onClick={() => navigate(redirectPath)}
              icon={<ArrowRight size={18} />}
            >
              Go to Home Page
            </AuthSubmitButton>

            <button
              type="button"
              onClick={logout}
              className={styles.switchAccountBtn}
            >
              <LogOut size={16} aria-hidden="true" />
              <span>Sign Out / Switch Account</span>
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  const validateEmailForm = (): boolean => {
    let valid = true;
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError('Please enter your registered email address.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('Please enter a valid email format (e.g. name@domain.com).');
      valid = false;
    }

    if (!password) {
      setPasswordError('Please enter your account password.');
      valid = false;
    }

    return valid;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    if (!validateEmailForm()) return;

    setIsLoading(true);
    setGeneralError(null);

    try {
      const result = await loginWithCredentials(email.trim(), password);
      if (result.success) {
        navigate(redirectPath);
      } else {
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);

        if (nextFailed >= 5) {
          setLockoutSeconds(30);
          setGeneralError('Too many failed attempts. For your security, please wait 30 seconds before trying again.');
        } else {
          setGeneralError(result.error || 'Incorrect email or password. Please verify your credentials or reset your password.');
        }
      }
    } catch {
      setGeneralError('Network error connecting to authentication server. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Access your enrolled batches, CBT mock tests, and practice history."
      badgeText="Student Portal"
    >
      {/* 1. Google OAuth Button */}
      <div className={styles.socialSlot}>
        <GoogleSignInButton label="Sign in with Google" disabled={isLoading || lockoutSeconds > 0} />
      </div>

      {/* 2. Divider */}
      <div className={styles.orDivider}>
        <span>or sign in with email &amp; password</span>
      </div>

      {/* Error Summary Banner */}
      <AuthErrorMessage message={generalError} />

      {/* 3. Email & Password Form */}
      <form
        id="email-signin-panel"
        onSubmit={handleEmailSubmit}
        noValidate
        className={styles.form}
      >
        <AuthInput
          id="login-email"
          label="Email Address"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(null);
            if (generalError) setGeneralError(null);
          }}
          placeholder="e.g. aarav.sharma@jee2026.in"
          required
          disabled={isLoading || lockoutSeconds > 0}
          error={emailError}
          icon={<Mail size={18} />}
        />

        <PasswordInput
          id="login-password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordError) setPasswordError(null);
            if (generalError) setGeneralError(null);
          }}
          placeholder="••••••••"
          required
          disabled={isLoading || lockoutSeconds > 0}
          error={passwordError}
          rightLabelAction={
            <Link to="/forgot-password" className={styles.forgotLink}>
              Forgot password?
            </Link>
          }
        />

        {/* Remember Me Option */}
        <div className={styles.optionsRow}>
          <label className={styles.rememberMeLabel}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading || lockoutSeconds > 0}
              className={styles.checkbox}
            />
            <span>Remember me on this device</span>
          </label>
        </div>

        {/* Submit Button */}
        <div className={styles.submitSlot}>
          <AuthSubmitButton
            isLoading={isLoading}
            disabled={lockoutSeconds > 0}
            icon={<ArrowRight size={18} />}
          >
            {lockoutSeconds > 0 ? `Locked Out (${lockoutSeconds}s)` : 'Sign In'}
          </AuthSubmitButton>
        </div>
      </form>

      {/* Navigation footer */}
      <div className={styles.footerNav}>
        <span>Don't have an account?</span>{' '}
        <Link
          to={`/signup${rawRedirect ? `?redirect=${encodeURIComponent(rawRedirect)}` : ''}`}
          className={styles.signupLink}
        >
          Create student account
        </Link>
      </div>
    </AuthLayout>
  );
};
