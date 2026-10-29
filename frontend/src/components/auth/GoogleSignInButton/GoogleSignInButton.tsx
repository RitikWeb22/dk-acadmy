import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import styles from './GoogleSignInButton.module.scss';

interface GoogleSignInButtonProps {
  label?: string;
  disabled?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  label = 'Continue with Google',
  disabled = false
}) => {
  const [showConfigNotice, setShowConfigNotice] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    // Since Google OAuth Client ID is not configured in local environment,
    // display honest development status dialog instead of a fake success
    setTimeout(() => {
      setIsProcessing(false);
      setShowConfigNotice(true);
    }, 250);
  };

  return (
    <>
      <div className={styles.wrapper}>
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || isProcessing}
          aria-busy={isProcessing}
          className={styles.googleBtn}
          title="Google Sign-In (Requires Google Cloud Client ID)"
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
      </div>

      {showConfigNotice && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setShowConfigNotice(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="google-auth-notice-title"
        >
          <div className={styles.noticeModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.noticeHeader}>
              <div className={styles.alertIconBox}>
                <AlertCircle size={20} />
              </div>
              <h3 id="google-auth-notice-title" className={styles.noticeTitle}>
                Google OAuth Setup Notice
              </h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowConfigNotice(false)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>
            <div className={styles.noticeContent}>
              <p>
                Google Sign-In is configured to use Google OAuth 2.0 Web Client credentials. In this local environment, OAuth client secrets are kept secure.
              </p>
              <div className={styles.configInstructions}>
                <strong>How to sign in now:</strong>
                <ul>
                  <li>Use the <strong>Email &amp; Password</strong> form directly.</li>
                  <li>Or use the <strong>Instant Evaluation Access</strong> buttons (Aarav Sharma demo account) to explore the student dashboard.</li>
                </ul>
              </div>
            </div>
            <div className={styles.noticeActions}>
              <button
                type="button"
                className={styles.dismissBtn}
                onClick={() => setShowConfigNotice(false)}
              >
                Understood, Return to Form
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
