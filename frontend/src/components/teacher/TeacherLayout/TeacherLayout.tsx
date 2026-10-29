import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  TrendingUp,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  FileText,
  Layers,
  GraduationCap
} from 'lucide-react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import styles from './TeacherLayout.module.scss';

interface TeacherLayoutProps {
  children: React.ReactNode;
}

export const TeacherLayout: React.FC<TeacherLayoutProps> = ({ children }) => {
  const { admin, logout, hasRole } = useAdminAuth();
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className={styles.layoutContainer}>
      {/* ─── SIDEBAR NAVIGATION ─── */}
      <aside className={`${styles.sidebar} ${isMobileNavOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link to="/" className={styles.brandLink}>
            <div className={styles.brandLogo}>DK</div>
            <div>
              <div className={styles.brandName}>DK Academy</div>
              <div className={styles.brandBadge}>Faculty Portal</div>
            </div>
          </Link>
          <button
            type="button"
            className={styles.mobileCloseBtn}
            onClick={() => setIsMobileNavOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Teacher Profile Summary Card */}
        <div className={styles.teacherProfileCard}>
          <div className={styles.teacherAvatar}>
            {admin?.name?.charAt(0) || 'T'}
          </div>
          <div className={styles.teacherInfo}>
            <div className={styles.teacherName}>{admin?.name || 'Prof. R.K. Verma'}</div>
            <div className={styles.teacherRole}>Physics &amp; Mechanics Faculty</div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className={styles.navMenu}>
          <div className={styles.navCategory}>
            Curriculum &amp; Testing
          </div>

          <NavLink
            to="/teacher/courses"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
            onClick={() => setIsMobileNavOpen(false)}
          >
            <BookOpen size={18} />
            <span>Course Catalog &amp; Syllabus</span>
          </NavLink>

          <NavLink
            to="/teacher/test-series"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
            onClick={() => setIsMobileNavOpen(false)}
          >
            <HelpCircle size={18} />
            <span>Test Series &amp; BITSAT</span>
          </NavLink>

          <NavLink
            to="/teacher/pyq"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
            onClick={() => setIsMobileNavOpen(false)}
          >
            <FileText size={18} />
            <span>PYQ Question Bank</span>
          </NavLink>

          <NavLink
            to="/teacher/dpp"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
            onClick={() => setIsMobileNavOpen(false)}
          >
            <Layers size={18} />
            <span>Daily DPP Problem Sets</span>
          </NavLink>

          <NavLink
            to="/teacher/analytics"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
            onClick={() => setIsMobileNavOpen(false)}
          >
            <TrendingUp size={18} />
            <span>Student Watch Stats</span>
          </NavLink>

          {/* If Super Admin, show Switch to Super Admin Portal */}
          {hasRole('SUPER_ADMIN') && (
            <>
              <div className={styles.navCategory} style={{ marginTop: '1.5rem' }}>
                Directorate
              </div>
              <Link
                to="/admin"
                className={styles.navItem}
                style={{ color: '#7c3aed' }}
              >
                <ShieldCheck size={18} />
                <span>Switch to Super Admin</span>
                <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
              </Link>
            </>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          <Link to="/" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
            <ExternalLink size={14} />
            <span>Student Website</span>
          </Link>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT VIEWPORT ─── */}
      <div className={styles.mainViewport}>
        {/* Top Navbar */}
        <header className={styles.topNavbar}>
          <button
            type="button"
            className={styles.mobileMenuBtn}
            onClick={() => setIsMobileNavOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className={styles.navbarTitle}>
            <span>Faculty Video LMS &amp; Curriculum Studio</span>
          </div>

          <div className={styles.navbarActions}>
            <Link to="/courses" target="_blank" rel="noopener noreferrer" className={styles.previewWebsiteBtn}>
              <GraduationCap size={15} />
              <span>Student Course View</span>
            </Link>

            {hasRole('SUPER_ADMIN') && (
              <Link to="/admin" className={styles.superAdminPill}>
                <ShieldCheck size={14} />
                <span>Super Admin Panel</span>
              </Link>
            )}

            <button type="button" className={styles.topLogoutBtn} onClick={handleLogout}>
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className={styles.pageContent}>{children}</main>
      </div>
    </div>
  );
};
