import React from 'react';
import styles from './SectionHeading.module.scss';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  align = 'center',
  action,
  className = ''
}) => {
  if (action && align === 'left') {
    return (
      <div className={`${styles.wrapperWithAction} ${className}`.trim()}>
        <div className={styles.headingMainCol}>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{title}</h2>
          </div>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        <div className={styles.headingActionCol}>{action}</div>
      </div>
    );
  }

  return (
    <div className={`${styles.wrapper} ${styles[align]} ${className}`.trim()}>
      {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
      <h2 className={styles.title}>{title}</h2>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
};
