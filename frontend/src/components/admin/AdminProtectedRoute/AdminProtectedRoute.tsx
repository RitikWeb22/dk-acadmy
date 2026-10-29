import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock, LogOut } from 'lucide-react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { useStudentAuth } from '../../../context/AuthContext';
import type { AdminRole } from '../../../types/admin';
import styles from './AdminProtectedRoute.module.scss';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AdminRole[];
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
  allowedRoles
}) => {
  const { isAuthenticated, admin, isLoading, hasRole, logout } = useAdminAuth();
  const { student } = useStudentAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Verifying administrative credentials...</p>
      </div>
    );
  }

  // 1. If not authenticated as an admin, redirect to dedicated admin login
  if (!isAuthenticated || !admin) {
    // Sanitize returnUrl against open-redirect
    const returnPath =
      (location.pathname.startsWith('/admin') || location.pathname.startsWith('/teacher')) && !location.pathname.startsWith('//')
        ? location.pathname + location.search
        : '/admin';

    return <Navigate to={`/admin/login?returnUrl=${encodeURIComponent(returnPath)}`} replace />;
  }

  // 2. Security Check: If a student session exists and is NOT an admin
  // (student profile alone cannot grant access)
  if (student && !admin) {
    return (
      <div className={styles.accessDeniedContainer}>
        <div className={styles.deniedCard}>
          <div className={styles.iconCircle}>
            <ShieldAlert size={36} color="#dc2626" />
          </div>
          <h2>Student Account Detected</h2>
          <p>
            You are signed in as student <strong>{student.name}</strong>. Student accounts do
            not have permission to access the DK Academy Administrative Portal.
          </p>
          <div className={styles.actions}>
            <Link to="/dashboard" className={styles.primaryBtn}>
              <ArrowLeft size={16} />
              <span>Back to Student Dashboard</span>
            </Link>
            <Link to="/admin/login" className={styles.secondaryBtn}>
              <span>Switch to Portal Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. RBAC Check: If role is restricted and user does not possess role
  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    const isTeacher = admin.role === 'TEACHER';

    return (
      <div className={styles.accessDeniedContainer}>
        <div className={styles.deniedCard}>
          <div className={styles.iconCircle}>
            <Lock size={36} color="#d97706" />
          </div>
          <h2>Access Restricted (403)</h2>
          <p>
            Your account role is <strong>{admin.role}</strong>. This module requires{' '}
            <strong>{allowedRoles.join(' or ')}</strong> privileges.
          </p>
          <div className={styles.userBadge}>
            <span>{admin.name}</span> • <span>{admin.email}</span>
          </div>
          <div className={styles.actions}>
            <Link to={isTeacher ? '/teacher' : '/admin'} className={styles.primaryBtn}>
              <ArrowLeft size={16} />
              <span>{isTeacher ? 'Back to Faculty Portal' : 'Back to Admin Dashboard'}</span>
            </Link>
            <button type="button" onClick={logout} className={styles.dangerBtn}>
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
