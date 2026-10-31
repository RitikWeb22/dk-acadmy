import React from 'react';
import { useLocation } from 'react-router-dom';
import styles from './PageTransitionWrapper.module.scss';

interface PageTransitionWrapperProps {
  children: React.ReactNode;
}

export const PageTransitionWrapper: React.FC<PageTransitionWrapperProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div key={location.pathname} className={styles.transitionContainer}>
      {children}
    </div>
  );
};
