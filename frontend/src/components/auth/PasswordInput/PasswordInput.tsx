import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import styles from './PasswordInput.module.scss';

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: 'current-password' | 'new-password';
  error?: string | null;
  hint?: string;
  disabled?: boolean;
  rightLabelAction?: React.ReactNode;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder = '••••••••',
  required = false,
  autoComplete = 'current-password',
  error,
  hint,
  disabled = false,
  rightLabelAction
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className={styles.fieldGroup}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label} {required && <span className={styles.requiredAsterisk} aria-hidden="true">*</span>}
        </label>
        {rightLabelAction && <div className={styles.rightLabel}>{rightLabelAction}</div>}
      </div>

      <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
        <div className={styles.leftIcon} aria-hidden="true">
          <Lock size={16} />
        </div>
        <input
          id={id}
          name={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={styles.input}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className={styles.toggleBtn}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
          tabIndex={0}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
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
