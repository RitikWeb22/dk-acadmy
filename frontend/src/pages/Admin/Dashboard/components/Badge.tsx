import React from 'react';
import type { BadgeVariant } from '../types';
import styles from './Badge.module.scss';

interface BadgeProps {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  icon,
  children,
  className = '',
  title
}) => {
  const variantClass = styles[`badge_${variant}`] || styles.badge_neutral;

  return (
    <span
      className={`${styles.badge} ${variantClass} ${className}`}
      title={title}
      role="status"
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{children}</span>
    </span>
  );
};
