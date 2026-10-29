import React from 'react';
import { AlertCircle } from 'lucide-react';
import styles from './AuthErrorMessage.module.scss';

interface AuthErrorMessageProps {
  message: string | null;
  action?: React.ReactNode;
  className?: string;
}

export const AuthErrorMessage: React.FC<AuthErrorMessageProps> = ({
  message,
  action,
  className = ''
}) => {
  if (!message) return null;

  return (
    <div className={`${styles.errorAlert} ${className}`} role="alert" aria-live="polite">
      <AlertCircle size={18} className={styles.icon} aria-hidden="true" />
      <div className={styles.contentCol}>
        <span className={styles.messageText}>{message}</span>
        {action && <div className={styles.actionSlot}>{action}</div>}
      </div>
    </div>
  );
};
