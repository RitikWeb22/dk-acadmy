import React from 'react';
import styles from './AuthInput.module.scss';

interface AuthInputProps {
  id: string;
  label: string;
  type?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  error?: string | null;
  hint?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  id,
  label,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  autoComplete,
  error,
  hint,
  icon,
  disabled = false,
  maxLength,
  className = ''
}) => {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={`${styles.fieldGroup} ${className}`}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label} {required && <span className={styles.requiredAsterisk} aria-hidden="true">*</span>}
        </label>
      </div>

      <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
        {icon && (
          <div className={styles.iconSlot} aria-hidden="true">
            {icon}
          </div>
        )}
        <input
          id={id}
          name={name || id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={`${styles.input} ${icon ? styles.withIcon : ''}`}
        />
      </div>

      {error ? (
        <span id={errorId} className={styles.errorText} role="alert" aria-live="polite">
          {error}
        </span>
      ) : hint ? (
        <span id={hintId} className={styles.hintText}>
          {hint}
        </span>
      ) : null}
    </div>
  );
};
