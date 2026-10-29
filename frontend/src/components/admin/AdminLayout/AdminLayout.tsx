import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FileCode2,
  BookOpen,
  Users2,
  Bell,
  Film,
  Settings,
  Menu,
  X,
  LogOut,
  ExternalLink,
  ChevronRight,
  GraduationCap,
  User,
  Activity,
  Volume2,
  MessageSquare,
  Search,
  Plus
} from 'lucide-react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import type { AdminRole } from '../../../types/admin';
import type { ProspectiveLead } from '../../../types/lead';
import { leadService } from '../../../services/leadService';
import { notificationService, type AdminNotificationItem, NOTIFICATIONS_EVENT_KEY } from '../../../services/notificationService';
import { soundEffects } from '../../../utils/sound';
import styles from './AdminLayout.module.scss';

export interface AdminNavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: AdminRole[];
}

// Primary Main Sidebar Items
const PRIMARY_NAV_ITEMS: AdminNavItem[] = [
  {
    label: 'Courses',
    path: '/admin/courses',
    icon: BookOpen,
    roles: ['SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER']
  },
  {
    label: 'Reviews',
    path: '/admin/reviews',
    icon: MessageSquare,
    roles: ['SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER']
  },
  {
    label: 'Students & Teachers',
    path: '/admin/students',
    icon: GraduationCap,
    roles: ['SUPER_ADMIN', 'ADMIN']
  },
  {
    label: 'Contacts & Enquiries',
    path: '/admin/leads',
    icon: Users2,
    roles: ['SUPER_ADMIN', 'ADMIN', 'LEAD_MANAGER', 'COUNSELOR']
  },
  {
    label: 'Pages & CMS',
    path: '/admin/pages',
    icon: FileCode2,
    roles: ['SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER']
  },
  {
    label: 'Settings',
    path: '/admin/settings',
    icon: Settings,
    roles: ['SUPER_ADMIN', 'ADMIN']
  }
];

// Complete item catalog for breadcrumb resolution
const ALL_NAV_ITEMS: AdminNavItem[] = [
  ...PRIMARY_NAV_ITEMS,
  { label: 'Test Series', path: '/admin/test-series', icon: BookOpen, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'PYQ Bank', path: '/admin/pyq', icon: BookOpen, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Daily DPP', path: '/admin/dpp', icon: BookOpen, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Results & Achievers', path: '/admin/results', icon: BookOpen, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Classroom Centers', path: '/admin/classroom', icon: BookOpen, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Navbar CMS', path: '/admin/navbar', icon: FileCode2, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Footer CMS', path: '/admin/footer', icon: FileCode2, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Promotional Banners', path: '/admin/banners', icon: FileCode2, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Staff Management', path: '/admin/staff', icon: GraduationCap, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Counselors Desk', path: '/admin/counselors', icon: Users2, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Audit & Security Logs', path: '/admin/audit-logs', icon: Settings, roles: ['SUPER_ADMIN'] }
];

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { admin, logout, hasRole } = useAdminAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>(() =>
    notificationService.getNotifications()
  );
  const [unreadCount, setUnreadCount] = useState<number>(() =>
    notificationService.getUnreadCount()
  );
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Load and subscribe to real-time incoming leads, doubts, reviews, and system notifications
  useEffect(() => {
    notificationService.syncInitialNotifications().then(() => {
      const items = notificationService.getNotifications();
      setNotifications(items);
      setUnreadCount(notificationService.getUnreadCount());
    }).catch(() => {});

    const refreshNotifications = () => {
      const items = notificationService.getNotifications();
      setNotifications(items);
      setUnreadCount(notificationService.getUnreadCount());
    };

    window.addEventListener(NOTIFICATIONS_EVENT_KEY, refreshNotifications);
    window.addEventListener('dk_leads_updated', refreshNotifications);
    window.addEventListener('dk_doubt_new', refreshNotifications);
    window.addEventListener('dk_review_created', refreshNotifications);
    window.addEventListener('dk_payment_success', refreshNotifications);
    window.addEventListener('dk_student_registered', refreshNotifications);
    window.addEventListener('dk_course_created', refreshNotifications);
    window.addEventListener('dk_announcement_received', refreshNotifications);

    return () => {
      window.removeEventListener(NOTIFICATIONS_EVENT_KEY, refreshNotifications);
      window.removeEventListener('dk_leads_updated', refreshNotifications);
      window.removeEventListener('dk_doubt_new', refreshNotifications);
      window.removeEventListener('dk_review_created', refreshNotifications);
      window.removeEventListener('dk_payment_success', refreshNotifications);
      window.removeEventListener('dk_student_registered', refreshNotifications);
      window.removeEventListener('dk_course_created', refreshNotifications);
      window.removeEventListener('dk_announcement_received', refreshNotifications);
    };
  }, []);

  const handleNotificationClick = (n: AdminNotificationItem) => {
    notificationService.markAsRead(n.id);
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());
    setIsNotificationOpen(false);

    if (n.meta?.route) {
      navigate(n.meta.route);
      return;
    }

    switch (n.type) {
      case 'doubt':
        navigate('/admin/reviews?tab=doubts');
        break;
      case 'review':
        navigate('/admin/reviews?tab=reviews');
        break;
      case 'payment':
        navigate('/admin/invoices');
        break;
      case 'lead':
      case 'student':
        navigate('/admin/students');
        break;
      case 'course':
        navigate('/admin/courses/create');
        break;
      case 'test_series':
        navigate('/admin/test-series');
        break;
      default:
        navigate('/admin/dashboard');
        break;
    }
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
    setNotifications(notificationService.getNotifications());
    setUnreadCount(0);
  };

  // Close mobile sidebar and dropdowns on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
    setIsProfileDropdownOpen(false);
    setIsNotificationOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  // Active route matching for primary items and nested sub-routes
  const isItemActive = (itemPath: string) => {
    if (itemPath === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    if (itemPath === '/admin/courses') {
      return (
        location.pathname.startsWith('/admin/courses') ||
        location.pathname.startsWith('/admin/test-series') ||
        location.pathname.startsWith('/admin/pyq') ||
        location.pathname.startsWith('/admin/dpp') ||
        location.pathname.startsWith('/admin/results') ||
        location.pathname.startsWith('/admin/classroom')
      );
    }
    if (itemPath === '/admin/reviews') {
      return location.pathname.startsWith('/admin/reviews');
    }
    if (itemPath === '/admin/students') {
      return (
        location.pathname.startsWith('/admin/students') ||
        location.pathname.startsWith('/admin/staff')
      );
    }
    if (itemPath === '/admin/leads') {
      return (
        location.pathname.startsWith('/admin/leads') ||
        location.pathname.startsWith('/admin/counselors')
      );
    }
    if (itemPath === '/admin/pages') {
      return (
        location.pathname.startsWith('/admin/pages') ||
        location.pathname.startsWith('/admin/navbar') ||
        location.pathname.startsWith('/admin/footer') ||
        location.pathname.startsWith('/admin/banners')
      );
    }
    if (itemPath === '/admin/settings') {
      return (
        location.pathname.startsWith('/admin/settings') ||
        location.pathname.startsWith('/admin/audit-logs') ||
        location.pathname.startsWith('/admin/roles')
      );
    }
    return location.pathname === itemPath;
  };

  // Compute breadcrumb path
  const currentNav = ALL_NAV_ITEMS.find(
    (item) => item.path === location.pathname || (item.path !== '/admin' && location.pathname.startsWith(item.path))
  );

  return (
    <div className={styles.adminContainer}>
      {/* 1. Mobile Sidebar Backdrop Overlay */}
      {isMobileNavOpen && (
        <div
          className={styles.sidebarOverlay}
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 2. Admin Sidebar */}
      <aside className={`${styles.sidebar} ${isMobileNavOpen ? styles.sidebarOpen : ''}`}>
        {/* Brand Header */}
        <div className={styles.sidebarHeader}>
          <Link to="/admin/courses" className={styles.brandLink}>
            <img src="/img/logo.jpeg" alt="DK Academy" className={styles.sidebarLogoImg} />
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>DK ACADEMY</span>
              <span className={styles.brandSubtitle}>Admin Portal</span>
            </div>
          </Link>
          <button
            type="button"
            className={styles.closeMobileBtn}
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Admin Quick Info Strip */}
        {admin && (
          <div className={styles.sidebarAdminInfo}>
            <div className={styles.adminAvatar}>
              {admin.name.charAt(0)}
            </div>
            <div className={styles.adminMeta}>
              <span className={styles.adminName} title={admin.name}>{admin.name}</span>
              <span className={`${styles.roleBadge} ${styles[admin.role.toLowerCase()]}`}>
                {admin.role.replace('_', ' ')}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Menu (Exactly 7 Core Items) */}
        <nav className={styles.navMenu} aria-label="Admin Navigation">
          {PRIMARY_NAV_ITEMS.filter((item) => hasRole(item.roles)).map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                aria-current={active ? 'page' : undefined}
                className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
              >
                <Icon size={18} className={styles.navIcon} />
                <span className={styles.navLabel}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer Link */}
        <div className={styles.sidebarFooter}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.viewLiveSiteLink}
            title="Open student website in new tab"
          >
            <ExternalLink size={18} className={styles.navIcon} />
            <span className={styles.navLabel}>Open Public Website</span>
          </a>
        </div>
      </aside>

      {/* 3. Main Viewport */}
      <div className={styles.mainWrapper}>
        {/* Top Navbar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              type="button"
              className={styles.mobileMenuToggle}
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              aria-label="Toggle navigation menu"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb Path */}
            <nav aria-label="Breadcrumb" className={styles.breadcrumbNav}>
              <Link to="/admin" className={styles.breadcrumbRoot}>
                Admin
              </Link>
              {currentNav && currentNav.path !== '/admin' && (
                <>
                  <ChevronRight size={14} className={styles.breadcrumbSeparator} />
                  <span className={styles.breadcrumbCurrent}>{currentNav.label}</span>
                </>
              )}
            </nav>

            {/* Global Search (Issue 7: Visually differentiated with pill shape and global placeholder) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (globalSearchQuery.trim()) {
                  navigate(`/admin/courses?q=${encodeURIComponent(globalSearchQuery.trim())}`);
                }
              }}
              className={styles.globalSearchWrap}
              role="search"
            >
              <Search size={14} />
              <input
                type="text"
                placeholder="Global search across academy..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                aria-label="Global search across academy"
              />
              <kbd className={styles.searchKbd}>⌘K</kbd>
            </form>
          </div>

          <div className={styles.topbarRight}>
            {/* Functional Group 1: Page Creation & Quick Actions (Issue 10) */}
            <div className={styles.topbarActionGroup}>
              <div className={styles.quickActionWrapper}>
                <button
                  type="button"
                  className={styles.quickActionBtn}
                  onClick={() => setIsQuickCreateOpen(!isQuickCreateOpen)}
                  aria-expanded={isQuickCreateOpen}
                  aria-label="Quick creation options"
                >
                  <Plus size={14} />
                  <span>Quick Create</span>
                </button>

                {isQuickCreateOpen && (
                  <div className={styles.quickActionMenu}>
                    <Link
                      to="/admin/courses"
                      className={styles.quickActionLink}
                      onClick={() => setIsQuickCreateOpen(false)}
                    >
                      <BookOpen size={14} />
                      <span>Create Course</span>
                    </Link>
                    <Link
                      to="/admin/students"
                      className={styles.quickActionLink}
                      onClick={() => setIsQuickCreateOpen(false)}
                    >
                      <GraduationCap size={14} />
                      <span>Register Student</span>
                    </Link>
                    <Link
                      to="/admin/pages"
                      className={styles.quickActionLink}
                      onClick={() => setIsQuickCreateOpen(false)}
                    >
                      <FileCode2 size={14} />
                      <span>Add New Page</span>
                    </Link>
                    <Link
                      to="/teacher"
                      className={styles.quickActionLink}
                      onClick={() => setIsQuickCreateOpen(false)}
                    >
                      <Film size={14} />
                      <span>Upload LMS Video</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Functional Group 2: System Utilities & Profile (Issue 2) */}
            <div className={styles.topbarSystemGroup}>
              {/* Live Status Badge */}
              <div className={styles.sessionStatusBadge} title="Security session active">
                <span className={styles.statusPulse} />
                <span className={styles.statusText}>Secure Session</span>
              </div>

              {/* Admin Notifications Dropdown */}
              <div className={styles.notificationDropdownWrapper}>
                <button
                  type="button"
                  className={styles.notificationTriggerBtn}
                  onClick={() => {
                    setIsNotificationOpen(!isNotificationOpen);
                    setIsProfileDropdownOpen(false);
                  }}
                  aria-label="View notifications"
                  aria-expanded={isNotificationOpen}
                  title="Admin alerts & prospective student inquiries"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className={styles.notificationBadge}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationOpen && (
                  <div className={styles.notificationMenu}>
                    <div className={styles.notificationHeader}>
                      <div className={styles.notificationHeaderTitle}>
                        <Bell size={15} />
                        <span>Live Admin Alerts</span>
                        {unreadCount > 0 && (
                          <span className={styles.unreadTag}>{unreadCount} New</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#2563eb',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: '2px 4px'
                            }}
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.testToneBtn}
                          onClick={() => soundEffects.playAdminAlertChime()}
                          title="Test Audio Tone"
                        >
                          <Volume2 size={13} />
                          <span>Test</span>
                        </button>
                      </div>
                    </div>

                    <div className={styles.notificationList}>
                      {notifications.length === 0 ? (
                        <div className={styles.emptyNotification}>
                          <p>No new activity or inquiries</p>
                        </div>
                      ) : (
                        notifications.slice(0, 15).map((item) => (
                          <div
                            key={item.id}
                            className={styles.notificationItem}
                            onClick={() => handleNotificationClick(item)}
                            style={{
                              cursor: 'pointer',
                              opacity: item.unread ? 1 : 0.72,
                              background: item.unread ? '#f8faff' : '#ffffff'
                            }}
                          >
                            <div className={styles.notificationItemTop}>
                              <span className={styles.notificationLeadName} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {item.unread && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />}
                                <span style={{ color: item.unread ? '#0f172a' : '#475569', fontWeight: item.unread ? 700 : 500 }}>
                                  {item.title}
                                </span>
                              </span>
                              <span className={styles.notificationTime} style={{ flexShrink: 0, marginLeft: '6px' }}>
                                {item.time}
                              </span>
                            </div>
                            {item.description && (
                              <p className={styles.notificationCourse} style={{ color: '#64748b', fontSize: '11.5px', marginTop: '2px' }}>
                                {item.description}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <div className={styles.notificationFooter}>
                      <button
                        type="button"
                        className={styles.viewAllLeadsBtn}
                        onClick={() => {
                          setIsNotificationOpen(false);
                          navigate('/admin/reviews?tab=doubts');
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Go to Doubts &amp; Reviews Desk &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Admin User Profile Dropdown */}
              <div className={styles.profileDropdownWrapper}>
                <button
                  type="button"
                  className={styles.profileTriggerBtn}
                onClick={() => {
                  setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  setIsNotificationOpen(false);
                }}
                aria-expanded={isProfileDropdownOpen}
              >
                <div className={styles.profileAvatar}>
                  <User size={16} />
                </div>
                <div className={styles.profileText}>
                  <span className={styles.profileName}>{admin?.name}</span>
                  <span className={styles.profileRole}>{admin?.role}</span>
                </div>
              </button>

              {isProfileDropdownOpen && (
                <div className={styles.profileMenu}>
                  <div className={styles.profileMenuHeader}>
                    <strong>{admin?.name}</strong>
                    <span>{admin?.email}</span>
                    <small>{admin?.designation}</small>
                  </div>
                  <div className={styles.menuDivider} />
                  <Link
                    to="/admin/settings"
                    className={styles.menuItem}
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <Settings size={15} />
                    <span>Admin Settings</span>
                  </Link>
                  {hasRole('SUPER_ADMIN') && (
                    <Link
                      to="/admin/audit-logs"
                      className={styles.menuItem}
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <Activity size={15} />
                      <span>Security Audit Logs</span>
                    </Link>
                  )}
                  <div className={styles.menuDivider} />
                  <button
                    type="button"
                    className={`${styles.menuItem} ${styles.logoutMenuItem}`}
                    onClick={handleLogout}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

        {/* Dynamic Content Outlet */}
        <main className={styles.pageContent}>{children}</main>
      </div>
    </div>
  );
};
