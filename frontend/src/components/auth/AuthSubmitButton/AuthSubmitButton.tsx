import React from 'react';
import { Loader2 } from 'lucide-react';
import styles from './AuthSubmitButton.module.scss';

interface AuthSubmitButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  onClick?: () => void;
}

export const AuthSubmitButton: React.FC<AuthSubmitButtonProps> = ({
  children,
  isLoading = false,
  disabled = false,
  icon,
  iconPosition = 'right',
  className = '',
  onClick
}) => {
  return (
    <button
      type="submit"
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      onClick={onClick}
      className={`${styles.submitBtn} ${className}`}
    >
      {isLoading ? (
        <span className={styles.loadingWrapper}>
          <Loader2 size={18} className={styles.spinner} aria-hidden="true" />
          <span>Please wait...</span>
        </span>
      ) : (
        <span className={styles.btnContent}>
          {icon && iconPosition === 'left' && <span className={styles.iconSlot}>{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className={styles.iconSlot}>{icon}</span>}
        </span>
      )}
    </button>
  );
};
