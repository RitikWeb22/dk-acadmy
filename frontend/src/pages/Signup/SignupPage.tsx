import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Mail,
  ArrowRight,
  CheckCircle2,
  Check,
  X,
  ShieldCheck,
  Calendar,
  Sparkles,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { useStudentAuth } from '../../context/AuthContext';
import {
  AuthLayout,
  AuthInput,
  PasswordInput,
  GoogleSignInButton,
  AuthSubmitButton,
  AuthErrorMessage
} from '../../components/auth';
import styles from './SignupPage.module.scss';

function getSafeRedirectUrl(target: string | null): string {
  if (!target) return '/';
  if (target.startsWith('/') && !target.startsWith('//')) {
    return target;
  }
  return '/';
}

type ClassStage = 'Class 10th' | 'Class 11th' | 'Class 12th' | 'Dropper';
type SignupStep = 'form' | 'otp' | 'welcome';

// Derived target year per prompt specifications:
// Class 11 -> JEE 2028, Class 12 -> JEE 2027, Dropper -> JEE 2027, Class 10 -> JEE 2029
function getDerivedTargetYear(stage: ClassStage): string {
  switch (stage) {
    case 'Class 10th':
      return 'JEE 2029';
    case 'Class 11th':
      return 'JEE 2028';
    case 'Class 12th':
      return 'JEE 2027';
    case 'Dropper':
      return 'JEE 2027';
    default:
      return 'JEE 2028';
  }
}

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawRedirect = searchParams.get('redirect') || searchParams.get('returnUrl');
  const redirectPath = getSafeRedirectUrl(rawRedirect);

  const { signupStudent, isAuthenticated, student } = useStudentAuth();

  // Registration flow: directly completes and redirects into Home
  const [currentStep] = useState<SignupStep>('form');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentClass, setCurrentClass] = useState<ClassStage>('Class 11th');
  const [targetExam, setTargetExam] = useState<'JEE Main & Advanced' | 'JEE Main' | 'JEE Advanced'>('JEE Main & Advanced');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [referralSource, setReferralSource] = useState('');
  const [isReferralOpen, setIsReferralOpen] = useState(false);

  // OTP step state
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);

  // Field Errors (Inline on Blur)
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isEmailRegistered, setIsEmailRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Derived Target Year
  const derivedTargetYear = useMemo(() => getDerivedTargetYear(currentClass), [currentClass]);

  // Live Password Strength & Checklist
  const passwordRules = useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    let score = 0;
    if (hasMinLength) score += 1;
    if (hasLetter) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecial) score += 1;

    let strengthLabel = 'Too Short';
    let strengthClass = styles.strengthWeak;
    if (password.length === 0) {
      strengthLabel = '';
      strengthClass = '';
    } else if (score <= 1) {
      strengthLabel = 'Weak';
      strengthClass = styles.strengthWeak;
    } else if (score === 2) {
      strengthLabel = 'Fair';
      strengthClass = styles.strengthFair;
    } else if (score === 3) {
      strengthLabel = 'Good';
      strengthClass = styles.strengthGood;
    } else if (score >= 4) {
      strengthLabel = 'Strong';
      strengthClass = styles.strengthStrong;
    }

    const isValid = hasMinLength && hasLetter && hasNumber;

    return {
      hasMinLength,
      hasLetter,
      hasNumber,
      score,
      strengthLabel,
      strengthClass,
      isValid
    };
  }, [password]);

  // Form validity for submit button
  const isFormValid = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
      phone.replace(/\D/g, '').length === 10 &&
      passwordRules.isValid &&
      agreeTerms
    );
  }, [name, email, phone, passwordRules.isValid, agreeTerms]);

  // OTP resend cooldown timer
  useEffect(() => {
    if (currentStep !== 'otp' || resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentStep, resendTimer]);

  // Auto redirect to Home if welcome state is reached
  useEffect(() => {
    if (currentStep === 'welcome') {
      navigate('/', { replace: true });
    }
  }, [currentStep, navigate]);

  // If already logged in, show existing account banner
  if (isAuthenticated && student && currentStep === 'form') {
    return (
      <AuthLayout
        title="Already Signed In"
        subtitle="You already have an active student account with DK Academy JEE."
        badgeText="Account Active"
      >
        <div className={styles.alreadyCard}>
          <div className={styles.successIconBox} aria-hidden="true">
            <CheckCircle2 size={36} />
          </div>
          <p className={styles.alreadyText}>
            You are currently signed in as <strong>{student.name}</strong> ({student.email || student.phone || 'Student'}).
          </p>
          <AuthSubmitButton
            onClick={() => navigate(redirectPath)}
            icon={<ArrowRight size={18} />}
          >
            Continue to Dashboard
          </AuthSubmitButton>
        </div>
      </AuthLayout>
    );
  }

  // Individual Blur Validators
  const handleNameBlur = () => {
    if (!name.trim()) {
      setNameError('Full name is required.');
    } else if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters.');
    } else {
      setNameError(null);
    }
  };

  const handleEmailBlur = () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError('Email address is required.');
      setIsEmailRegistered(false);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('Please provide a valid email format (e.g. rohan.patel@gmail.com).');
      setIsEmailRegistered(false);
    } else {
      setEmailError(null);
      setIsEmailRegistered(false);
    }
  };

  const handlePhoneBlur = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      setPhoneError('Mobile number is required for OTP verification.');
    } else if (cleanPhone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number.');
    } else {
      setPhoneError(null);
    }
  };

  const handlePasswordBlur = () => {
    if (!password) {
      setPasswordError('Please create a password.');
    } else if (!passwordRules.isValid) {
      setPasswordError('Password must meet all 3 checklist requirements.');
    } else {
      setPasswordError(null);
    }
  };

  const validateAll = (): boolean => {
    let valid = true;
    setNameError(null);
    setEmailError(null);
    setPhoneError(null);
    setPasswordError(null);
    setTermsError(null);
    setGeneralError(null);
    setIsEmailRegistered(false);

    if (!name.trim() || name.trim().length < 2) {
      setNameError('Please enter your full name (minimum 2 characters).');
      valid = false;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('Please provide a valid email address.');
      valid = false;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number.');
      valid = false;
    }

    if (!passwordRules.isValid) {
      setPasswordError('Password must be at least 8 characters with letters and numbers.');
      valid = false;
    }

    if (!agreeTerms) {
      setTermsError('You must agree to the Terms of Service and Privacy Policy to continue.');
      valid = false;
    }

    return valid;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll() || isLoading) return;

    setIsLoading(true);
    setGeneralError(null);
    setIsEmailRegistered(false);

    try {
      const res = await signupStudent({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.replace(/\D/g, ''),
        targetExam,
        targetClass: currentClass,
        targetYear: derivedTargetYear.replace('JEE ', '')
      });

      if (res.success) {
        // Direct redirect into home page on successful account creation
        navigate('/', { replace: true });
        return;
      } else {
        if (res.error?.toLowerCase().includes('already registered')) {
          setIsEmailRegistered(true);
          setGeneralError('An account is already registered with this email address.');
        } else {
          setGeneralError(res.error || 'Failed to create student account. Please try again.');
        }
      }
    } catch {
      setGeneralError('Network interruption during registration. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    const cleanOtp = otpCode.trim();
    if (cleanOtp.length !== 6) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/', { replace: true });
    }, 300);
  };

  const handleResendOtp = () => {
    setResendTimer(30);
    setOtpCode('');
    setOtpError(null);
  };

  // STEP 2: Email & Mobile OTP Verification
  if (currentStep === 'otp') {
    return (
      <AuthLayout
        title="Verify your mobile & email"
        subtitle="We sent a 6-digit verification code to confirm your student credentials."
        badgeText="Verification"
      >
        <form onSubmit={handleVerifyOtp} noValidate className={styles.form}>
          <div className={styles.otpNoticeBox}>
            <span className={styles.otpNoticeLabel}>Code sent to:</span>
            <div className={styles.otpContactRow}>
              <strong>+91 {phone.replace(/\D/g, '')}</strong> • <strong>{email}</strong>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.otpHeaderRow}>
              <label htmlFor="signup-otp-input" className={styles.label}>
                Enter 6-Digit Verification Code <span className={styles.requiredAsterisk}>*</span>
              </label>
              {resendTimer > 0 ? (
                <span className={styles.cooldownText}>Resend in {resendTimer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className={styles.resendBtn}
                >
                  <RefreshCw size={13} aria-hidden="true" />
                  <span>Resend Code</span>
                </button>
              )}
            </div>

            <div className={`${styles.otpInputWrapper} ${otpError ? styles.hasError : ''}`}>
              <input
                id="signup-otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, ''));
                  if (otpError) setOtpError(null);
                }}
                placeholder="123456"
                className={styles.otpInput}
                disabled={isLoading}
                aria-required="true"
                aria-invalid={!!otpError}
                aria-describedby={otpError ? 'signup-otp-error' : undefined}
                autoFocus
              />
            </div>
            {otpError && (
              <span id="signup-otp-error" className={styles.fieldErrorText} role="alert" aria-live="polite">
                {otpError}
              </span>
            )}
            <p className={styles.devOtpHint}>
              Dev Note: Enter <strong>123456</strong> or any 6-digit code to complete verification.
            </p>
          </div>

          <div className={styles.submitSlot}>
            <AuthSubmitButton
              isLoading={isLoading}
              disabled={otpCode.trim().length !== 6}
              icon={<ArrowRight size={18} />}
            >
              Verify &amp; Activate Account
            </AuthSubmitButton>
          </div>
        </form>
      </AuthLayout>
    );
  }

  // STEP 3: Welcome Screen leading to Dashboard
  if (currentStep === 'welcome') {
    return (
      <AuthLayout
        title="Welcome to DK Academy JEE!"
        subtitle="Your student account has been verified and your portal is ready."
        badgeText="Account Ready"
      >
        <div className={styles.welcomeCard}>
          <div className={styles.welcomeCelebrationIcon} aria-hidden="true">
            <Sparkles size={36} />
          </div>

          <div className={styles.welcomeGreeting}>
            <h2 className={styles.welcomeTitle}>Welcome, {name.trim().split(' ')[0]}!</h2>
            <p className={styles.welcomeSub}>
              You are all set to start mastering IIT JEE Mathematics &amp; Physics with DK Sir.
            </p>
          </div>

          {/* Student Profile Snapshot Chip */}
          <div className={styles.enrollmentSnapshot}>
            <div className={styles.snapshotRow}>
              <span className={styles.snapshotLabel}>Target Exam:</span>
              <span className={styles.snapshotValue}>{targetExam}</span>
            </div>
            <div className={styles.snapshotRow}>
              <span className={styles.snapshotLabel}>Enrolled Stage:</span>
              <span className={styles.snapshotValue}>{currentClass}</span>
            </div>
            <div className={styles.snapshotRow}>
              <span className={styles.snapshotLabel}>Target Year:</span>
              <span className={styles.snapshotValueTag}>{derivedTargetYear}</span>
            </div>
          </div>

          <div className={styles.submitSlot}>
            <AuthSubmitButton
              onClick={() => navigate(redirectPath)}
              icon={<ArrowRight size={18} />}
            >
              Continue to Home Page
            </AuthSubmitButton>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // STEP 1: Main Signup Form
  return (
    <AuthLayout
      title="Create your student account"
      subtitle="Join DK Academy JEE to unlock personalized DPPs, test series, and mentorship."
      badgeText="New Aspirant"
    >
      {/* 1. Google OAuth Option */}
      <div className={styles.socialSlot}>
        <GoogleSignInButton label="Sign up with Google" disabled={isLoading} />
      </div>

      <div className={styles.orDivider}>
        <span>or sign up with your details</span>
      </div>

      {/* General Error Banner with inline "Sign in instead" link if email already exists */}
      <AuthErrorMessage
        message={generalError}
        action={
          isEmailRegistered ? (
            <Link
              to={`/login?redirect=${encodeURIComponent(rawRedirect || '/dashboard')}`}
              className={styles.signInInsteadLink}
            >
              Sign in to your existing account &rarr;
            </Link>
          ) : undefined
        }
      />

      <form onSubmit={handleFormSubmit} noValidate className={styles.form}>
        {/* Full Name */}
        <AuthInput
          id="signup-name"
          label="Full Name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(null);
          }}
          onBlur={handleNameBlur}
          placeholder="e.g. Rohan Patel"
          required
          disabled={isLoading}
          error={nameError}
          icon={<User size={18} />}
        />

        {/* Email Address */}
        <AuthInput
          id="signup-email"
          label="Email Address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(null);
            if (generalError) setGeneralError(null);
            if (isEmailRegistered) setIsEmailRegistered(false);
          }}
          onBlur={handleEmailBlur}
          placeholder="e.g. rohan.patel@gmail.com"
          required
          disabled={isLoading}
          error={emailError}
          icon={<Mail size={18} />}
        />

        {/* Mobile Number (+91 Prefix with OTP Verification Notice) */}
        <div className={styles.fieldGroup}>
          <label htmlFor="signup-phone" className={styles.label}>
            Mobile Number <span className={styles.requiredAsterisk}>*</span>
          </label>
          <div className={`${styles.phoneInputWrapper} ${phoneError ? styles.hasError : ''}`}>
            <span className={styles.countryPrefix} aria-hidden="true">+91</span>
            <input
              id="signup-phone"
              type="tel"
              autoComplete="tel-national"
              maxLength={10}
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setPhone(val);
                if (phoneError) setPhoneError(null);
              }}
              onBlur={handlePhoneBlur}
              placeholder="10-digit number"
              required
              disabled={isLoading}
              className={styles.phoneInput}
              aria-required="true"
              aria-invalid={!!phoneError}
              aria-describedby={phoneError ? 'signup-phone-error' : undefined}
            />
          </div>
          {phoneError && (
            <span id="signup-phone-error" className={styles.fieldErrorText} role="alert" aria-live="polite">
              {phoneError}
            </span>
          )}
          {/* Trust and security note linking to privacy policy */}
          <div className={styles.securityNote}>
            <ShieldCheck size={14} className={styles.securityIcon} aria-hidden="true" />
            <span>Your data is secure. We never share your number. See <Link to="/privacy" className={styles.inlineLink}>Privacy Policy</Link>.</span>
          </div>
        </div>

        {/* Current Class/Stage & Target Exam with Derived Target Year Chip */}
        <div className={styles.twoColRow}>
          {/* Current Class */}
          <div className={styles.fieldGroup}>
            <label htmlFor="signup-class" className={styles.label}>
              Current Class / Stage <span className={styles.requiredAsterisk}>*</span>
            </label>
            <div className={styles.selectWrapper}>
              <select
                id="signup-class"
                value={currentClass}
                onChange={(e) => setCurrentClass(e.target.value as ClassStage)}
                disabled={isLoading}
                className={styles.select}
              >
                <option value="Class 10th">Class 10th</option>
                <option value="Class 11th">Class 11th</option>
                <option value="Class 12th">Class 12th</option>
                <option value="Dropper">Dropper / Repeater</option>
              </select>
            </div>
            {/* Derived Target Year Read-only Chip */}
            <div className={styles.targetYearChip} aria-label={`Derived Target Year: ${derivedTargetYear}`}>
              <Calendar size={13} className={styles.chipIcon} aria-hidden="true" />
              <span>Target: <strong>{derivedTargetYear}</strong></span>
            </div>
          </div>

          {/* Target Exam */}
          <div className={styles.fieldGroup}>
            <label htmlFor="signup-target" className={styles.label}>
              Target Exam
            </label>
            <div className={styles.selectWrapper}>
              <select
                id="signup-target"
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value as any)}
                disabled={isLoading}
                className={styles.select}
              >
                <option value="JEE Main & Advanced">JEE Main &amp; Advanced</option>
                <option value="JEE Main">JEE Main</option>
                <option value="JEE Advanced">JEE Advanced</option>
              </select>
            </div>
            <span className={styles.fieldHelpText}>Comprehensive syllabus coverage</span>
          </div>
        </div>

        {/* Password Field with Live Strength Meter & Rules Checklist */}
        <div className={styles.passwordSection}>
          <PasswordInput
            id="signup-password"
            label="Password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            onBlur={handlePasswordBlur}
            placeholder="Min 8 characters (letters & numbers)"
            required
            disabled={isLoading}
            error={passwordError}
          />

          {/* Live Strength Meter */}
          {password.length > 0 && (
            <div className={styles.strengthMeterBox}>
              <div className={styles.strengthHeader}>
                <span className={styles.strengthTitle}>Password Strength:</span>
                <span className={`${styles.strengthValue} ${passwordRules.strengthClass}`}>
                  {passwordRules.strengthLabel}
                </span>
              </div>
              <div className={styles.strengthBarTrack}>
                <div
                  className={`${styles.strengthBarFill} ${passwordRules.strengthClass}`}
                  style={{ width: `${Math.min(100, passwordRules.score * 25)}%` }}
                />
              </div>
            </div>
          )}

          {/* Rules Checklist */}
          <div className={styles.rulesChecklist} aria-label="Password requirements">
            <div className={`${styles.ruleItem} ${passwordRules.hasMinLength ? styles.ruleValid : ''}`}>
              {passwordRules.hasMinLength ? (
                <Check size={14} className={styles.validIcon} aria-hidden="true" />
              ) : (
                <X size={14} className={styles.invalidIcon} aria-hidden="true" />
              )}
              <span>At least 8 characters</span>
            </div>

            <div className={`${styles.ruleItem} ${passwordRules.hasLetter ? styles.ruleValid : ''}`}>
              {passwordRules.hasLetter ? (
                <Check size={14} className={styles.validIcon} aria-hidden="true" />
              ) : (
                <X size={14} className={styles.invalidIcon} aria-hidden="true" />
              )}
              <span>Contains at least one letter</span>
            </div>

            <div className={`${styles.ruleItem} ${passwordRules.hasNumber ? styles.ruleValid : ''}`}>
              {passwordRules.hasNumber ? (
                <Check size={14} className={styles.validIcon} aria-hidden="true" />
              ) : (
                <X size={14} className={styles.invalidIcon} aria-hidden="true" />
              )}
              <span>Contains at least one number</span>
            </div>
          </div>
        </div>

        {/* Optional Collapsed Section: "Referral / how did you hear about us" */}
        <div className={styles.referralAccordion}>
          <button
            type="button"
            className={styles.referralToggle}
            onClick={() => setIsReferralOpen(!isReferralOpen)}
            aria-expanded={isReferralOpen}
            aria-controls="referral-select-panel"
          >
            <span>How did you hear about us? (Optional)</span>
            <ChevronDown
              size={16}
              className={`${styles.chevron} ${isReferralOpen ? styles.chevronOpen : ''}`}
              aria-hidden="true"
            />
          </button>

          {isReferralOpen && (
            <div id="referral-select-panel" className={styles.referralContent}>
              <div className={styles.selectWrapper}>
                <select
                  id="signup-referral"
                  value={referralSource}
                  onChange={(e) => setReferralSource(e.target.value)}
                  className={styles.select}
                  aria-label="How did you hear about DK Academy JEE"
                >
                  <option value="">Select option</option>
                  <option value="YouTube @DKAcademyJEE">YouTube (@DKAcademyJEE)</option>
                  <option value="Friend or Senior Recommendation">Friend or Senior Recommendation</option>
                  <option value="Google Search">Google Search</option>
                  <option value="School or Coaching Faculty">School / Coaching Faculty</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Terms Agreement Checkbox (44px tap area, required) */}
        <div className={styles.termsRow}>
          <label className={styles.termsLabel}>
            <input
              type="checkbox"
              id="signup-terms"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (termsError) setTermsError(null);
              }}
              disabled={isLoading}
              className={styles.checkbox}
              aria-invalid={!!termsError}
              aria-describedby={termsError ? 'signup-terms-error' : undefined}
              required
            />
            <span className={styles.termsText}>
              I agree to the{' '}
              <Link to="/terms" target="_blank" rel="noopener noreferrer" className={styles.legalLink}>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" target="_blank" rel="noopener noreferrer" className={styles.legalLink}>
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {termsError && (
            <span id="signup-terms-error" className={styles.fieldErrorText} role="alert" aria-live="polite">
              {termsError}
            </span>
          )}
        </div>

        {/* Submit Button */}
        <div className={styles.submitSlot}>
          <AuthSubmitButton
            isLoading={isLoading}
            disabled={!isFormValid && !isLoading}
            icon={<ArrowRight size={18} />}
          >
            Create Student Account
          </AuthSubmitButton>
        </div>
      </form>

      {/* Navigation footer */}
      <div className={styles.footerNav}>
        <span>Already have an account?</span>{' '}
        <Link
          to={`/login${rawRedirect ? `?redirect=${encodeURIComponent(rawRedirect)}` : ''}`}
          className={styles.loginLink}
        >
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
};
