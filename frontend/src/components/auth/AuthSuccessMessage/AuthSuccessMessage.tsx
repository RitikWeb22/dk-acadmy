import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import styles from './AuthSuccessMessage.module.scss';

interface AuthSuccessMessageProps {
  message: string | null;
  className?: string;
}

export const AuthSuccessMessage: React.FC<AuthSuccessMessageProps> = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`${styles.successAlert} ${className}`} role="status">
      <CheckCircle2 size={16} className={styles.icon} aria-hidden="true" />
      <span className={styles.messageText}>{message}</span>
    </div>
  );
};
