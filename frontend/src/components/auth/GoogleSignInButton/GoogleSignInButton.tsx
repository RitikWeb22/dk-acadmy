import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useStudentAuth } from '../../../context/AuthContext';
import styles from './GoogleSignInButton.module.scss';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInButtonProps {
  label?: string;
  disabled?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  label = 'Continue with Google',
  disabled = false
}) => {
  const { loginWithGoogle } = useStudentAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);

  const clientId =
    (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ||
    '422285875211-hd17jag5pjm8s2h7uo429fj9likg9vku.apps.googleusercontent.com';

  const handleCredentialResponse = useCallback(async (response: any) => {
    if (!response || !response.credential) {
      setErrorMsg('Failed to obtain Google login credentials.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg(null);
      const result = await loginWithGoogle(response.credential);
      if (result.success) {
        const from = (location.state as any)?.from?.pathname || '/learn';
        navigate(from, { replace: true });
      } else {
        setErrorMsg(result.error || 'Google login failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'An error occurred during Google sign-in.');
    } finally {
      setIsProcessing(false);
    }
  }, [loginWithGoogle, location.state, navigate]);

  useEffect(() => {
    const initGoogleGsi = () => {
      if (!window.google?.accounts?.id || !clientId) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = '';

          // Accurately determine available container width
          const container = googleBtnContainerRef.current;
          const rectWidth = container.getBoundingClientRect()?.width || container.clientWidth;
          const parentWidth = container.parentElement?.clientWidth;
          const measuredWidth = (rectWidth && rectWidth > 50) ? rectWidth : (parentWidth && parentWidth > 50 ? parentWidth : 0);
          const fallbackWidth = typeof window !== 'undefined' ? Math.max(200, window.innerWidth - 64) : 280;
          const availableWidth = measuredWidth || fallbackWidth;

          // Google Identity Services renderButton strictly enforces [200, 400]
          // Subtract a small buffer (4px) and screen safe bounds so borders never clip
          const screenSafeMax = typeof window !== 'undefined' ? Math.max(200, window.innerWidth - 64) : 340;
          const targetWidth = Math.max(200, Math.min(380, screenSafeMax, Math.floor(availableWidth - 4)));

          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: label.toLowerCase().includes('sign up') ? 'signup_with' : 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: targetWidth
          });
        }
        setGisLoaded(true);
      } catch (e) {
        console.warn('GIS init error:', e);
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleGsi();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogleGsi();
        }
      }, 300);
      return () => clearInterval(interval);
    }

    let resizeTimer: any;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.google?.accounts?.id && googleBtnContainerRef.current) {
          initGoogleGsi();
        }
      }, 200);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [clientId, label, handleCredentialResponse]);

  const handleFallbackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || isProcessing) return;

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setErrorMsg('Google Sign-In is initializing. Please verify network access or try again in a few seconds.');
    }
  };

  return (
    <div className={styles.wrapper}>
      <div
        ref={googleBtnContainerRef}
        className={`${styles.gisContainer} ${gisLoaded ? styles.gisVisible : styles.gisHidden}`}
      />

      {!gisLoaded && (
        <button
          type="button"
          onClick={handleFallbackClick}
          disabled={disabled || isProcessing}
          aria-busy={isProcessing}
          className={styles.googleBtn}
          title="Sign in with Google"
        >
          <svg className={styles.googleIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span className={styles.btnLabel}>
            {isProcessing ? 'Connecting...' : label}
          </span>
        </button>
      )}

      {errorMsg && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
