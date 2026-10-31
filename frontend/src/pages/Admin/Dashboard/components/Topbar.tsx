import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  Menu,
  CheckCircle2,
  Activity,
  LogOut,
  ChevronDown,
  UserCog
} from 'lucide-react';
import { useAdminAuth } from '../../../../context/AdminAuthContext';
import { AdminProfileModal } from '../../../../components/admin/AdminProfileModal/AdminProfileModal';
import { notificationService, type AdminNotificationItem, NOTIFICATIONS_EVENT_KEY } from '../../../../services/notificationService';
import styles from './Topbar.module.scss';

interface TopbarProps {
  activeMenu?: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenCommandPalette: () => void;
  onToggleMobileSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeMenu = 'dashboard',
  isDarkMode,
  onToggleDarkMode,
  onOpenCommandPalette,
  onToggleMobileSidebar
}) => {
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>(() =>
    notificationService.getNotifications()
  );

  const handleNotificationClick = (n: AdminNotificationItem) => {
    notificationService.markAsRead(n.id);
    setNotifications(notificationService.getNotifications());
    setIsNotificationsOpen(false);

    // Explicit direct routing based on item meta or notification type
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

  useEffect(() => {
    notificationService.syncInitialNotifications().then(() => {
      setNotifications(notificationService.getNotifications());
    }).catch(() => {});

    const handleUpdate = () => {
      setNotifications(notificationService.getNotifications());
    };

    window.addEventListener(NOTIFICATIONS_EVENT_KEY, handleUpdate);
    window.addEventListener('dk_payment_success', handleUpdate);
    window.addEventListener('dk_student_registered', handleUpdate);
    window.addEventListener('dk_course_created', handleUpdate);
    window.addEventListener('dk_leads_updated', handleUpdate);

    return () => {
      window.removeEventListener(NOTIFICATIONS_EVENT_KEY, handleUpdate);
      window.removeEventListener('dk_payment_success', handleUpdate);
      window.removeEventListener('dk_student_registered', handleUpdate);
      window.removeEventListener('dk_course_created', handleUpdate);
      window.removeEventListener('dk_leads_updated', handleUpdate);
    };
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Map active menu to readable breadcrumb segment
  const getBreadcrumbLabel = (menuKey: string) => {
    switch (menuKey) {
      case 'students':
        return 'Student Management';
      case 'teachers':
        return 'Teachers & Admin';
      case 'courses':
        return 'Courses Create';
      case 'test-series':
        return 'Test Series';
      case 'invoices':
        return 'Invoices & Fee Slips';
      case 'dpp-pyq':
        return 'DPP & BITSAT Management';
      case 'reviews':
        return 'Course Review Management';
      case 'pages':
        return 'Page Management';
      case 'navbar-footer':
        return 'Navbar & Footer';
      case 'contact':
        return 'Contact Us';
      default:
        return 'Overview Dashboard';
    }
  };

  return (
    <header className={styles.topbar} role="banner">
      {/* Left: Mobile Toggle & Dynamic Breadcrumb */}
      <div className={styles.leftArea}>
        <button
          type="button"
          className={styles.mobileMenuBtn}
          onClick={onToggleMobileSidebar}
          aria-label="Open navigation sidebar"
        >
          <Menu size={18} />
        </button>

        {activeMenu === 'dashboard' && (
          <nav className={styles.breadcrumbs} aria-label="Breadcrumbs">
            <span className={styles.crumbParent}>Admin Console</span>
            <ChevronRight size={13} className={styles.crumbSeparator} />
            <h1 className={styles.crumbCurrent} aria-current="page">
              Overview Dashboard
            </h1>
          </nav>
        )}
      </div>

      {/* Right: Quick Search Input, System Status Chip, Notification Bell, User Profile */}
      <div className={styles.rightArea}>
        {/* Quick Search Input */}
        <div className={styles.searchWrapper}>
          <div
            className={styles.searchBox}
            onClick={onOpenCommandPalette}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onOpenCommandPalette()}
            aria-label="Search aspirants, batches, orders (Press Ctrl+K)"
          >
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search portal..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onFocus={onOpenCommandPalette}
              readOnly
            />
            <kbd className={styles.shortcutKbd}>⌘K</kbd>
          </div>
        </div>


        {/* Notification Bell with Live Unread Badge */}
        <div className={styles.dropdownAnchor}>
          <button
            type="button"
            className={`${styles.iconButton} ${isNotificationsOpen ? styles.btnActive : ''}`}
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsUserDropdownOpen(false);
            }}
            aria-label={`${unreadCount} Unread Notifications`}
            aria-expanded={isNotificationsOpen}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className={styles.greenBadgePill}>
                <span className={styles.greenBadgeDot}>●</span> {unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className={styles.notificationsMenu}>
              <div className={styles.dropdownTitleRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={styles.dropdownTitle}>Notifications</span>
                  {unreadCount > 0 && (
                    <span className={styles.unreadCountPill}>{unreadCount} new</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => notificationService.markAllAsRead()}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className={styles.notificationsList}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                    No new activity yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={styles.notificationItem}
                      onClick={() => handleNotificationClick(n)}
                      style={{ cursor: 'pointer', opacity: n.unread ? 1 : 0.7 }}
                    >
                      {n.unread && <div className={styles.notificationItemDot} />}
                      <div className={styles.notificationTextWrap}>
                        <p className={styles.notificationTitle} style={{ fontWeight: n.unread ? 600 : 400 }}>
                          {n.title}
                        </p>
                        {n.description && (
                          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                            {n.description}
                          </p>
                        )}
                        <span className={styles.notificationTime}>{n.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Theme Toggle (Light / Dark) */}
        <button
          type="button"
          className={styles.iconButton}
          onClick={onToggleDarkMode}
          aria-label={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Quick User Profile Pill */}
        <div className={styles.dropdownAnchor}>
          <button
            type="button"
            className={styles.userProfilePill}
            onClick={() => {
              setIsUserDropdownOpen(!isUserDropdownOpen);
              setIsNotificationsOpen(false);
            }}
            aria-label="User menu"
            aria-expanded={isUserDropdownOpen}
          >
            {admin?.avatarUrl ? (
              <img
                src={admin.avatarUrl}
                alt={admin.name || 'Admin'}
                className={styles.userAvatarImg}
              />
            ) : (
              <span className={styles.userAvatarFallback}>
                {(admin?.name || 'Admin').charAt(0).toUpperCase()}
              </span>
            )}
            <span className={styles.userNameText}>
              {admin?.name ? (admin.name.split(' ')[0] || admin.name) : 'Admin'}
            </span>
            <ChevronDown size={13} className={styles.userChevron} />
          </button>

          {isUserDropdownOpen && (
            <div className={styles.userMenuDropdown}>
              <div className={styles.userMenuHeader}>
                <span className={styles.userMenuName} title={admin?.name || 'Administrator'}>
                  {admin?.name || 'Administrator'}
                </span>
                <span className={styles.userMenuRole} title={admin?.designation || admin?.role}>
                  {admin?.designation || admin?.role?.replace('_', ' ') || 'Super Admin'}
                </span>
              </div>
              <button
                type="button"
                className={styles.userMenuItemAction}
                onClick={() => {
                  setIsUserDropdownOpen(false);
                  setIsProfileModalOpen(true);
                }}
              >
                <UserCog size={14} />
                <span>Edit Profile</span>
              </button>
              <button
                type="button"
                className={styles.userMenuItemLogout}
                onClick={() => {
                  setIsUserDropdownOpen(false);
                  logout();
                }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Admin Profile Modal */}
      <AdminProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </header>
  );
};
