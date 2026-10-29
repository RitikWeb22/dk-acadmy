import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Shield,
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  ArrowRight,
  Info,
  X,
  PhoneCall,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  KeyRound,
  ChevronRight,
  Server,
  HelpCircle,
  UserCheck
} from 'lucide-react';
import { Container } from '../../../components/ui/Container/Container';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import styles from './AdminLoginPage.module.scss';

type AuthRole = 'FACULTY' | 'ADMIN';

export const AdminLoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Role toggle: Faculty vs Super Admin (smart default based on returnUrl or path)
  const [selectedRole, setSelectedRole] = useState<AuthRole>(() => {
    return window.location.search.includes('admin') || window.location.pathname.includes('admin')
      ? 'ADMIN'
      : 'FACULTY';
  });

  // Form inputs (production clean defaults)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Extract returnUrl from query params and sanitize against open-redirect
  const queryParams = new URLSearchParams(location.search);
  const rawReturnUrl = queryParams.get('returnUrl');
  const returnUrl =
    rawReturnUrl &&
    (rawReturnUrl.startsWith('/admin') || rawReturnUrl.startsWith('/teacher')) &&
    !rawReturnUrl.startsWith('//')
      ? rawReturnUrl
      : selectedRole === 'FACULTY'
      ? '/teacher'
      : '/admin/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(returnUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, returnUrl]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = identifier.trim();
    if (!trimmed) {
      setErrorMessage(
        selectedRole === 'FACULTY'
          ? 'Please enter your faculty email or employee ID.'
          : 'Please enter your administrator ID or email.'
      );
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your security password key.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Map username to admin account if short ID is provided
      let loginEmail = trimmed;
      if (trimmed === 'superadmin' || trimmed === 'director' || trimmed === 'admin') {
        loginEmail = 'ritikweb30@gmail.com';
      }

      const res = await login(loginEmail, password);
      if (res.success) {
        if (selectedRole === 'FACULTY' && !returnUrl.startsWith('/admin')) {
          navigate('/teacher', { replace: true });
        } else {
          navigate(returnUrl || '/admin', { replace: true });
        }
      } else {
        setErrorMessage(
          res.error ||
            'Invalid credentials. Please verify your institutional identity or contact the Directorate Desk.'
        );
      }
    } catch {
      setErrorMessage('A secure handshake error occurred. Please verify your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Container size="wide">
        {/* Top Breadcrumb & Status Pill */}
        <div className={styles.topBarRow}>
          <nav className={styles.breadcrumbNav} aria-label="Breadcrumb">
            <Link to="/" className={styles.breadcrumbLink}>Home</Link>
            <ChevronRight size={13} className={styles.breadcrumbDivider} />
            <span className={styles.breadcrumbCurrent}>Institutional Access</span>
            <ChevronRight size={13} className={styles.breadcrumbDivider} />
            <span className={styles.breadcrumbActive}>Faculty &amp; Admin Console</span>
          </nav>

          <div className={styles.securityPill}>
            <ShieldCheck size={14} className={styles.shieldPillIcon} />
            <span>Secure Staff Authentication • 256-Bit Encrypted Session</span>
          </div>
        </div>

        {/* Dual-Column Centered Auth Stage (max-w-5xl mx-auto) */}
        <main className={styles.authStage}>
          {/* ─── LEFT COLUMN: Operational Context & Institute Trust (5 Cols) ─── */}
          <section className={styles.contextColumn} aria-labelledby="portal-context-title">
            <div className={styles.contextTop}>
              {/* Brand Anchor */}
              <div className={styles.brandAnchor}>
                <div className={styles.logoBadge}>
                  <img src="/img/logo.jpeg" alt="DK Academy Crest" className={styles.logoImg} />
                </div>
                <div className={styles.brandTextGroup}>
                  <span className={styles.brandName}>DK ACADEMY JEE</span>
                  <span className={styles.brandTag}>Management &amp; Evaluation Portal</span>
                </div>
              </div>

              {/* Title & Description */}
              <h1 id="portal-context-title" className={styles.contextTitle}>
                Dedicated Portal for Teachers &amp; Super Admins
              </h1>
              <p className={styles.contextDesc}>
                Manage CBT test series batches, review student submission palettes, update handwritten DPP solutions, and track classroom admissions in real time.
              </p>

              {/* Feature Highlights List */}
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>
                  <div className={styles.featureIconWrap}>
                    <CheckCircle2 size={16} className={styles.checkIcon} />
                  </div>
                  <div>
                    <strong className={styles.featureBold}>Role-Based Access:</strong> Dedicated privileges for Director, subject teachers, and coordinators.
                  </div>
                </li>
                <li className={styles.featureItem}>
                  <div className={styles.featureIconWrap}>
                    <CheckCircle2 size={16} className={styles.checkIcon} />
                  </div>
                  <div>
                    <strong className={styles.featureBold}>Live CBT Engine:</strong> Monitor ongoing mock test sessions and question difficulty analytics.
                  </div>
                </li>
                <li className={styles.featureItem}>
                  <div className={styles.featureIconWrap}>
                    <CheckCircle2 size={16} className={styles.checkIcon} />
                  </div>
                  <div>
                    <strong className={styles.featureBold}>Batch Attendance &amp; Notes:</strong> Instant sync of classroom handouts and lecture recordings.
                  </div>
                </li>
              </ul>
            </div>

            {/* Operational Status Chip (Bottom) */}
            <div className={styles.contextBottom}>
              <div className={styles.operationalStatusChip}>
                <span className={styles.pulseDot} />
                <span>Staff Systems Online • Janakpuri HQ</span>
              </div>
            </div>
          </section>

          {/* ─── RIGHT COLUMN: Central Login Form Card (7 Cols) ─── */}
          <section className={styles.formCard} aria-labelledby="login-form-title">
            <div className={styles.formHeader}>
              <h2 id="login-form-title" className={styles.formTitle}>
                Sign In to Your Workspace
              </h2>
              <p className={styles.formSubtitle}>
                Choose your access tier and provide your verified institute credentials.
              </p>
            </div>

            {/* Segmented Role Switcher: Faculty vs Super Admin */}
            <div className={styles.roleSwitcherTrack} role="tablist" aria-label="Institutional Role Selection">
              <button
                type="button"
                role="tab"
                aria-selected={selectedRole === 'FACULTY'}
                className={`${styles.roleTabBtn} ${selectedRole === 'FACULTY' ? styles.roleTabActive : ''}`}
                onClick={() => {
                  setSelectedRole('FACULTY');
                  setErrorMessage(null);
                }}
              >
                <GraduationCap size={16} />
                <span>Faculty / Teacher</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={selectedRole === 'ADMIN'}
                className={`${styles.roleTabBtn} ${selectedRole === 'ADMIN' ? styles.roleTabActive : ''}`}
                onClick={() => {
                  setSelectedRole('ADMIN');
                  setErrorMessage(null);
                }}
              >
                <ShieldCheck size={16} />
                <span>Super Admin</span>
              </button>
            </div>

            {/* Error Notification Alert */}
            {errorMessage && (
              <div className={styles.alertError} role="alert" aria-live="assertive">
                <AlertCircle size={18} className={styles.alertIcon} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
              {/* Field 1: Institutional Email / Faculty ID */}
              <div className={styles.formGroup}>
                <label htmlFor="staff-identifier" className={styles.inputLabel}>
                  {selectedRole === 'FACULTY' ? 'Institutional Email / Faculty ID' : 'Administrator Email / Access Key ID'}
                </label>
                <div className={styles.inputWrapper}>
                  {selectedRole === 'FACULTY' ? (
                    <Mail size={18} className={styles.inputIcon} />
                  ) : (
                    <UserCheck size={18} className={styles.inputIcon} />
                  )}
                  <input
                    id="staff-identifier"
                    type="text"
                    className={styles.textInput}
                    placeholder={
                      selectedRole === 'FACULTY'
                        ? 'faculty.name@dkacademy.com'
                        : 'ritikweb30@gmail.com or admin ID'
                    }
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username"
                    required
                    disabled={isSubmitting || isLoading}
                  />
                </div>
              </div>

              {/* Field 2: Security Password */}
              <div className={styles.formGroup}>
                <div className={styles.labelWithActionRow}>
                  <label htmlFor="staff-password" className={styles.inputLabel}>
                    Security Password
                  </label>
                  <button
                    type="button"
                    className={styles.forgotKeyBtn}
                    onClick={() => setIsForgotModalOpen(true)}
                  >
                    Forgot Security Key?
                  </button>
                </div>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    id="staff-password"
                    type={showPassword ? 'text' : 'password'}
                    className={styles.textInput}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={isSubmitting || isLoading}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>



              {/* Action Button CTA */}
              <button
                type="submit"
                className={styles.primaryAuthBtn}
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 size={18} className={styles.spinnerIcon} />
                    <span>Verifying Institute Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Authorize &amp; Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Fallback Switch to Student Dashboard */}
            <div className={styles.fallbackRow}>
              <span className={styles.fallbackText}>Are you a student or aspirant?</span>
              <Link to="/login" className={styles.studentLoginLink}>
                <span>Return to Student Dashboard Login</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Security Compliance & Support Strip */}
            <div className={styles.complianceNoticeBox}>
              <ShieldCheck size={16} className={styles.noticeIcon} />
              <div>
                <strong>Security Notice:</strong> Faculty and administrative sessions are strictly logged with device fingerprinting and IP tracking. Do not access test series databases from shared public devices.
              </div>
            </div>

            <p className={styles.supportHelplineText}>
              Facing access lockouts? Reach internal support at <a href="mailto:tech@dkacademy.com">tech@dkacademy.com</a> or call Janakpuri Support Desk.
            </p>
          </section>
        </main>
      </Container>

      {/* Forgot Security Key Recovery Modal (Teleported via Portal) */}
      {isForgotModalOpen && typeof document !== 'undefined' && createPortal(
        <div className={styles.modalBackdrop} onClick={() => setIsForgotModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className={styles.modalHeader}>
              <div className={styles.modalIconCircle}>
                <KeyRound size={20} color="#2563eb" />
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsForgotModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>
            <h3 className={styles.modalTitle}>Faculty &amp; Staff Credential Recovery</h3>
            <p className={styles.modalDesc}>
              In accordance with DK Academy JEE academic governance, faculty keys and administrative session credentials cannot be reset via public automated email links.
            </p>

            <div className={styles.modalContactBox}>
              <p className={styles.contactInstruction}>
                To request an emergency password reset or 2FA token sync, contact the Directorate Desk directly:
              </p>
              <div className={styles.contactItem}>
                <Mail size={15} />
                <span>ritikweb30@gmail.com (Super Administrator)</span>
              </div>
              <div className={styles.contactItem}>
                <PhoneCall size={15} />
                <span>+91 93259 87875 (Janakpuri HQ Directorate Desk)</span>
              </div>
            </div>

            <button
              type="button"
              className={styles.modalConfirmBtn}
              onClick={() => setIsForgotModalOpen(false)}
            >
              Understood
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminLoginPage;
