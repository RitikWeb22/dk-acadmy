import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, UserX, ArrowRight } from 'lucide-react';
import styles from './ProfileErrorState.module.scss';

interface ProfileErrorStateProps {
  message?: string;
}

export const ProfileErrorState: React.FC<ProfileErrorStateProps> = ({
  message = 'You must be signed in with a valid student account to access this profile.'
}) => {
  return (
    <div className={styles.errorCard} role="alert">
      <div className={styles.iconCircle}>
        <UserX size={32} aria-hidden="true" />
      </div>
      <h2 className={styles.title}>Student Authentication Required</h2>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <Link to="/login?redirect=/profile" className={styles.loginBtn}>
          <LogIn size={16} aria-hidden="true" />
          <span>Sign In to Student Portal</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link to="/courses" className={styles.coursesBtn}>
          Explore Courses
        </Link>
      </div>
    </div>
  );
};
