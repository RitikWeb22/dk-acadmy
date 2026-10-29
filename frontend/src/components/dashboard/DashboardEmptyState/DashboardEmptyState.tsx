import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, LogIn, ArrowRight } from 'lucide-react';
import styles from './DashboardEmptyState.module.scss';

interface DashboardEmptyStateProps {
  type: 'unauthenticated' | 'error';
  message?: string;
  onRetry?: () => void;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  type,
  message,
  onRetry
}) => {
  if (type === 'unauthenticated') {
    return (
      <div className={styles.container}>
        <div className={styles.iconCircle}>
          <LogIn size={28} />
        </div>
        <h1 className={styles.title}>Student Portal Authentication Required</h1>
        <p className={styles.description}>
          Please sign in to access your personalized JEE batch curriculum, tracked practice sets, CBT mock test analyses, and performance reports.
        </p>

        <div className={styles.actionRow}>
          <Link to="/login?redirect=/dashboard" className={styles.loginBtn}>
            <span>Sign In to Student Account</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.errorIconCircle}>
        <ShieldAlert size={28} />
      </div>
      <h2 className={styles.title}>Unable to Load Dashboard Data</h2>
      <p className={styles.description}>
        {message || 'An unexpected issue occurred while retrieving your learning session. Please try refreshing.'}
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={styles.retryBtn}>
          Try Again
        </button>
      )}
    </div>
  );
};
