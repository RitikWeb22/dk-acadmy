import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ArrowRight, UserCheck, Sparkles, LogOut, Phone, ShieldCheck, KeyRound, RefreshCw } from 'lucide-react';
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

type AuthTab = 'email' | 'otp';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawRedirect = searchParams.get('redirect') || searchParams.get('returnUrl');
  const redirectPath = getSafeRedirectUrl(rawRedirect);

  const {
    loginWithCredentials,
    loginAsDemo,
    loginAsNewStudent,
    login,
    isAuthenticated,
    student,
    logout
  } = useStudentAuth();

  // Mode tab: 'email' | 'otp'
  const [activeTab, setActiveTab] = useState<AuthTab>('email');

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Mobile OTP state
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Field errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Async & Security states
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Only show demo evaluation access in development or when explicitly enabled
  const isDemoEnabled = Boolean(
    import.meta.env.DEV ||
    import.meta.env.VITE_ENABLE_DEMO === 'true' ||
    import.meta.env.VITE_ENABLE_DEMO === '1'
  );

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

  // Resend OTP cooldown countdown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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
      setEmailError('Please provide a valid email address (e.g. name@example.com).');
      valid = false;
    }

    if (!password) {
      setPasswordError('Please enter your password.');
      valid = false;
    }

    return valid;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    if (!validateEmailForm() || isLoading) return;

    setIsLoading(true);
    setGeneralError(null);

    try {
      const res = await loginWithCredentials(email, password, rememberMe);
      if (res.success) {
        setFailedAttempts(0);
        navigate(redirectPath);
      } else {
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);

        if (nextFailed >= 5) {
          setLockoutSeconds(30);
          setGeneralError('Too many failed attempts. For your security, please wait 30 seconds before trying again.');
        } else {
          // Generic secure error message per requirement
          setGeneralError('Incorrect email or password. Please verify your credentials or reset your password.');
        }
      }
    } catch {
      setGeneralError('Network error connecting to authentication server. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = () => {
    setMobileError(null);
    setGeneralError(null);
    const cleanNumber = mobileNumber.replace(/\D/g, '');

    if (cleanNumber.length !== 10) {
      setMobileError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsOtpSent(true);
      setResendCooldown(30);
      setOtpCode('');
      setOtpError(null);
    }, 450);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    setOtpError(null);
    setGeneralError(null);

    const cleanOtp = otpCode.trim();
    if (cleanOtp.length !== 6) {
      setOtpError('Please enter the 6-digit OTP code sent to your mobile.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Valid OTP in simulated environment (accept 123456 or any 6-digit code for testing)
      if (cleanOtp === '123456' || cleanOtp.length === 6) {
        login({
          phone: mobileNumber.replace(/\D/g, ''),
          name: 'Student Aspirant',
          targetExam: 'JEE Main & Advanced'
        });
        navigate(redirectPath);
      } else {
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);
        if (nextFailed >= 5) {
          setLockoutSeconds(30);
          setGeneralError('Too many failed OTP attempts. Please wait 30 seconds.');
        } else {
          setOtpError('Invalid OTP code. Please enter the correct 6-digit code.');
        }
      }
    }, 400);
  };

  const handleDemoLogin = () => {
    loginAsDemo();
    navigate(redirectPath);
  };

  const handleNewStudentLogin = () => {
    loginAsNewStudent();
    navigate(redirectPath);
  };

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Access your enrolled batches, CBT mock tests, and practice history."
      badgeText="Student Portal"
    >

      {/* 2. Google OAuth Button */}
      <div className={styles.socialSlot}>
        <GoogleSignInButton label="Sign in with Google" disabled={isLoading || lockoutSeconds > 0} />
      </div>

      {/* 3. Divider: "or continue with email / mobile" */}
      <div className={styles.orDivider}>
        <span>or sign in with your credentials</span>
      </div>

      {/* 4. Tab Switcher: Email + Password vs Mobile OTP */}
      <div className={styles.tabSwitcher} role="tablist" aria-label="Sign in method options">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'email'}
          aria-controls="email-signin-panel"
          id="email-signin-tab"
          className={`${styles.tabBtn} ${activeTab === 'email' ? styles.tabBtnActive : ''}`}
          onClick={() => {
            setActiveTab('email');
            setGeneralError(null);
          }}
        >
          <Mail size={15} aria-hidden="true" />
          <span>Email &amp; Password</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'otp'}
          aria-controls="otp-signin-panel"
          id="otp-signin-tab"
          className={`${styles.tabBtn} ${activeTab === 'otp' ? styles.tabBtnActive : ''}`}
          onClick={() => {
            setActiveTab('otp');
            setGeneralError(null);
          }}
        >
          <Phone size={15} aria-hidden="true" />
          <span>Sign in with Mobile OTP</span>
        </button>
      </div>

      {/* Error Summary Banner (role="alert", aria-live="polite") */}
      <AuthErrorMessage message={generalError} />

      {/* 5A. Email & Password Tab Panel */}
      {activeTab === 'email' && (
        <form
          id="email-signin-panel"
          role="tabpanel"
          aria-labelledby="email-signin-tab"
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
      )}

      {/* 5B. Mobile OTP Tab Panel */}
      {activeTab === 'otp' && (
        <form
          id="otp-signin-panel"
          role="tabpanel"
          aria-labelledby="otp-signin-tab"
          onSubmit={handleOtpSubmit}
          noValidate
          className={styles.form}
        >
          <div className={styles.fieldGroup}>
            <label htmlFor="login-mobile" className={styles.fieldLabel}>
              Mobile Number <span className={styles.requiredAsterisk}>*</span>
            </label>
            <div className={`${styles.phoneInputWrapper} ${mobileError ? styles.hasError : ''}`}>
              <span className={styles.countryPrefix} aria-hidden="true">+91</span>
              <input
                id="login-mobile"
                type="tel"
                autoComplete="tel-national"
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  setMobileNumber(cleaned);
                  if (mobileError) setMobileError(null);
                  if (generalError) setGeneralError(null);
                }}
                placeholder="10-digit mobile number"
                disabled={isLoading || isOtpSent || lockoutSeconds > 0}
                className={styles.phoneInput}
                aria-required="true"
                aria-invalid={!!mobileError}
                aria-describedby={mobileError ? 'login-mobile-error' : undefined}
              />
              {isOtpSent && (
                <button
                  type="button"
                  onClick={() => setIsOtpSent(false)}
                  className={styles.changePhoneBtn}
                  title="Change mobile number"
                >
                  Change
                </button>
              )}
            </div>
            {mobileError && (
              <span id="login-mobile-error" className={styles.fieldErrorText} role="alert" aria-live="polite">
                {mobileError}
              </span>
            )}
            <div className={styles.securityNote}>
              <ShieldCheck size={14} className={styles.securityIcon} aria-hidden="true" />
              <span>We never share your number. Read our <Link to="/privacy" className={styles.inlineLink}>Privacy Policy</Link>.</span>
            </div>
          </div>

          {!isOtpSent ? (
            <div className={styles.submitSlot}>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isLoading || lockoutSeconds > 0 || mobileNumber.replace(/\D/g, '').length !== 10}
                className={styles.sendOtpBtn}
              >
                <KeyRound size={17} aria-hidden="true" />
                <span>Get 6-Digit OTP</span>
              </button>
            </div>
          ) : (
            <>
              <div className={styles.fieldGroup}>
                <div className={styles.otpHeaderRow}>
                  <label htmlFor="login-otp-code" className={styles.fieldLabel}>
                    Enter 6-Digit Verification Code <span className={styles.requiredAsterisk}>*</span>
                  </label>
                  {resendCooldown > 0 ? (
                    <span className={styles.cooldownText}>Resend in {resendCooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoading}
                      className={styles.resendBtn}
                    >
                      <RefreshCw size={13} aria-hidden="true" />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>

                <div className={`${styles.otpInputWrapper} ${otpError ? styles.hasError : ''}`}>
                  <input
                    id="login-otp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setOtpCode(val);
                      if (otpError) setOtpError(null);
                      if (generalError) setGeneralError(null);
                    }}
                    placeholder="123456"
                    className={styles.otpInput}
                    aria-required="true"
                    aria-invalid={!!otpError}
                    aria-describedby={otpError ? 'login-otp-error' : undefined}
                    disabled={isLoading || lockoutSeconds > 0}
                  />
                </div>
                {otpError && (
                  <span id="login-otp-error" className={styles.fieldErrorText} role="alert" aria-live="polite">
                    {otpError}
                  </span>
                )}
                {isDemoEnabled && (
                  <p className={styles.devOtpHint}>
                    Testing note: Enter <strong>123456</strong> or any 6-digit code.
                  </p>
                )}
              </div>

              <div className={styles.submitSlot}>
                <AuthSubmitButton
                  isLoading={isLoading}
                  disabled={lockoutSeconds > 0 || otpCode.trim().length !== 6}
                  icon={<ArrowRight size={18} />}
                >
                  {lockoutSeconds > 0 ? `Locked Out (${lockoutSeconds}s)` : 'Verify & Sign In'}
                </AuthSubmitButton>
              </div>
            </>
          )}
        </form>
      )}

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
