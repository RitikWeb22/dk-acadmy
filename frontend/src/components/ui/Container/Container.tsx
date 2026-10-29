import React from 'react';
import styles from './Container.module.scss';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'narrow' | 'wide';
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className = '',
  size = 'default',
  ...props
}) => {
  return (
    <div
      className={`${styles.container} ${styles[size]} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};
