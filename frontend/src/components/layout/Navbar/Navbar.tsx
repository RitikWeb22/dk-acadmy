import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Phone,
  ChevronRight,
  ChevronDown,
  MapPin,
  MessageCircle,
  ExternalLink,
  User,
  Bell,
  LayoutDashboard,
  CreditCard,
  HelpCircle,
  LogOut,
  Target,
  BookOpen,
  Clock,
  GraduationCap,
  UserCheck,
  ArrowRight,
  Layers,
  FileText,
  Zap,
  Monitor,
  Trophy,
} from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { useStudentAuth } from '../../../context/AuthContext';
import { cmsService, CMS_EVENT_KEY, DEFAULT_NAVBAR_ITEMS } from '../../../services/cmsService';
import type { NavbarMenuItem, NavbarDropdownItem } from '../../../types/admin';
import styles from './Navbar.module.scss';

// Helper for Category Micro-Icons in Dropdown
const renderDropdownIcon = (iconName?: string, label?: string) => {
  const norm = `${iconName || ''} ${label || ''}`.toLowerCase();
  if (norm.includes('monitor') || norm.includes('all india cbt') || norm.includes('live nta') || norm.includes('activity')) {
    return <Monitor size={18} />;
  }
  if (norm.includes('zap') || norm.includes('speed & accuracy') || norm.includes('math cbt') || norm.includes('yield')) {
    return <Zap size={18} />;
  }
  if (norm.includes('trophy') || norm.includes('accelerator') || norm.includes('rank')) {
    return <Trophy size={18} />;
  }
  if (norm.includes('layer') || norm.includes('chapter-wise') || norm.includes('topic test')) {
    return <Layers size={18} />;
  }
  if (norm.includes('target') || norm.includes('jee main') || norm.includes('crosshair')) {
    return <Target size={18} />;
  }
  if (norm.includes('book') || norm.includes('bitsat')) {
    return <BookOpen size={18} />;
  }
  if (norm.includes('clock') || norm.includes('timer') || norm.includes('math special') || norm.includes('speed')) {
    return <Clock size={18} />;
  }
  if (norm.includes('graduation') || norm.includes('foundation')) {
    return <GraduationCap size={18} />;
  }
  if (norm.includes('user') || norm.includes('dropper') || norm.includes('repeater')) {
    return <UserCheck size={18} />;
  }
  if (norm.includes('arrow') || norm.includes('explore') || norm.includes('all courses') || norm.includes('dashboard')) {
    return <ArrowRight size={18} />;
  }
  if (norm.includes('test') || norm.includes('cbt') || norm.includes('file')) {
    return <FileText size={18} />;
  }
  return <Layers size={18} />;
};

// Helper for Subtitles / Descriptions
const getDropdownSubtitle = (sub: NavbarDropdownItem) => {
  if (sub.subtitle) return sub.subtitle;
  const l = sub.label.toLowerCase();
  if (l.includes('all india cbt')) return 'Full syllabus NTA simulation for Class 11 & 12';
  if (l.includes('speed & accuracy') || l.includes('math cbt')) return 'Speed drills & shortcut techniques by DK Sir';
  if (l.includes('chapter-wise') || l.includes('topic test')) return 'Physics, Chemistry & Math practice modules';
  if (l.includes('accelerator') || l.includes('rank')) return 'High-difficulty multi-concept mocks';
  if (l.includes('full cbt') || l.includes('all tests') || l.includes('test dashboard')) return 'View all 9 mock tests, syllabus breakdown & analysis';
  if (l.includes('jee main')) return 'Targeted preparation & speed methods';
  if (l.includes('bitsat')) return 'Speed drill & shortcut techniques';
  if (l.includes('math special')) return '20-30s speed methods & core calculus';
  if (l.includes('foundation')) return 'Olympiad prep & strong conceptual base';
  if (l.includes('dropper')) return 'Complete curriculum & mock tests';
  if (l.includes('explore') || l.includes('all courses')) return 'Browse our full range of programs';
  if (l.includes('classroom') || l.includes('live')) return 'Audio doubt clearing & digital board sessions';
  if (l.includes('pyq')) return '15+ Years chapter-wise solved PYQ bank';
  if (l.includes('dpp')) return 'Daily practice problem sets with solution keys';
  if (l.includes('about')) return 'Our Kota coaching pedagogy & mentor story';
  if (l.includes('contact')) return 'Helpline, center address & student support';
  if (l.includes('cbt')) return 'NTA pattern full mocks & analytics';
  return 'Comprehensive curriculum & practice';
};

// Helper for Status Badges
const renderDropdownBadge = (badge?: string) => {
  if (!badge) return null;
  const bLower = badge.toLowerCase();
  if (bLower === 'popular') {
    return <span className={styles.popularBadge}>{badge}</span>;
  }
  if (bLower === 'new') {
    return <span className={styles.newPillBadge}>{badge}</span>;
  }
  if (bLower.includes('high yield')) {
    return <span className={styles.highYieldBadge}>{badge}</span>;
  }
  if (bLower.includes('live nta') || bLower.includes('nta')) {
    return <span className={styles.liveNtaBadge}>{badge}</span>;
  }
  if (bLower.includes('advanced')) {
    return <span className={styles.advancedBadge}>{badge}</span>;
  }
  return <span className={styles.customBadge}>{badge}</span>;
};

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isAuthenticated,
    student,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    logout
  } = useStudentAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<NavbarMenuItem[]>(() => cmsService.getNavbarItems());

  // Direct Desktop Navigation - all visible items displayed outside in the row
  const visibleItems = useMemo(() => {
    return menuItems
      .filter((item) => item.isVisible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [menuItems]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDropdownMouseEnter = (itemId: string) => {
    if (dropdownCloseTimeoutRef.current) {
      clearTimeout(dropdownCloseTimeoutRef.current);
      dropdownCloseTimeoutRef.current = null;
    }
    setOpenDropdownId(itemId);
  };

  const handleDropdownMouseLeave = () => {
    if (dropdownCloseTimeoutRef.current) {
      clearTimeout(dropdownCloseTimeoutRef.current);
    }
    // 280ms grace period so users can comfortably move the cursor into the dropdown menu
    dropdownCloseTimeoutRef.current = setTimeout(() => {
      setOpenDropdownId(null);
    }, 280);
  };

  useEffect(() => {
    return () => {
      if (dropdownCloseTimeoutRef.current) {
        clearTimeout(dropdownCloseTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard navigation for dropdown menu items
  const handleItemKeyDown = (e: React.KeyboardEvent, index: number, total: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = (index + 1) % total;
      const items = dropdownRef.current?.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]');
      items?.[nextIdx]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = (index - 1 + total) % total;
      const items = dropdownRef.current?.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]');
      items?.[prevIdx]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpenDropdownId(null);
    }
  };

  // Sync dynamic navbar items from CMS (real-time from MongoDB Atlas, custom events, and cross-tab storage)
  useEffect(() => {
    // 1. Initial background fetch from MongoDB Atlas
    cmsService.fetchNavbarFromAPI().then((items) => {
      if (items && items.length > 0) {
        setMenuItems(items);
      }
    }).catch(() => {});

    // 2. Listen for CMS updates in the same tab/window
    const handleCmsUpdate = (e: any) => {
      const detailType = e?.detail?.type;
      if (!detailType || detailType === 'navbar') {
        setMenuItems(cmsService.getNavbarItems());
      }
    };
    window.addEventListener(CMS_EVENT_KEY, handleCmsUpdate);

    // 3. Listen for StorageEvent across browser tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dk_academy_cms_navbar_v1' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMenuItems(parsed);
          }
        } catch {
          setMenuItems(cmsService.getNavbarItems());
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(CMS_EVENT_KEY, handleCmsUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (desktopNavRef.current && !desktopNavRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdownId(null);
        setIsUserMenuOpen(false);
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className={`${styles.navbarWrapper} ${isScrolled ? styles.isScrolled : ''}`}>
        <Container size="wide" className={styles.navContainer}>
          {/* Top Brand Logo */}
          <Link to="/" className={styles.brand} aria-label="DK Academy - Return to Homepage">
            <img src="/img/logo.jpeg" alt="DK Academy" className={styles.brandLogoImg} />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className={styles.desktopNav} ref={desktopNavRef} aria-label="Main Navigation">
            <ul className={styles.navList}>
              {visibleItems.map((item) => {
                const defaultItem = DEFAULT_NAVBAR_ITEMS.find((d) => d.id === item.id);
                const effectiveDropdownItems =
                  item.dropdownItems && item.dropdownItems.length > 0
                    ? item.dropdownItems
                    : (item.id === 'nav_courses' ? (defaultItem?.dropdownItems || []) : []);
                const isDropdown = Boolean(item.isDropdown && effectiveDropdownItems.length > 0);

                if (isDropdown && effectiveDropdownItems.length > 0) {
                  const isOpen = openDropdownId === item.id;
                  const isCurrentSection = location.pathname.startsWith(item.path);
                  return (
                    <li
                      key={item.id}
                      className={`${styles.navItem} ${styles.hasDropdown}`}
                      onMouseEnter={() => handleDropdownMouseEnter(item.id)}
                      onMouseLeave={handleDropdownMouseLeave}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        className={`${styles.navLink} ${
                          isOpen ? styles.dropdownTriggerOpen : isCurrentSection ? styles.activeLink : ''
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (dropdownCloseTimeoutRef.current) clearTimeout(dropdownCloseTimeoutRef.current);
                          setOpenDropdownId(isOpen ? null : item.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                            e.preventDefault();
                            if (dropdownCloseTimeoutRef.current) clearTimeout(dropdownCloseTimeoutRef.current);
                            setOpenDropdownId(item.id);
                            setTimeout(() => {
                              const firstItem = dropdownRef.current?.querySelector<HTMLAnchorElement>('[role="menuitem"]');
                              firstItem?.focus();
                            }, 60);
                          } else if (e.key === 'Escape') {
                            if (dropdownCloseTimeoutRef.current) clearTimeout(dropdownCloseTimeoutRef.current);
                            setOpenDropdownId(null);
                          }
                        }}
                        aria-expanded={isOpen}
                        aria-haspopup="menu"
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        <span>{item.label}</span>
                        {item.badge && <span className={styles.freeBadge}>{item.badge}</span>}
                        <span className={styles.chevronWrapper}>
                          <ChevronDown
                            size={14}
                            className={`${styles.dropdownChevron} ${isOpen ? styles.dropdownChevronRotated : ''}`}
                            aria-hidden="true"
                          />
                        </span>
                      </div>

                      {/* Interactive Dropdown / Mega Menu */}
                      {isOpen && (
                        <div
                          ref={dropdownRef}
                          className={styles.coursesDropdown}
                          role="menu"
                          aria-label={`${item.label} Navigation Menu`}
                          onMouseEnter={() => handleDropdownMouseEnter(item.id)}
                          onMouseLeave={handleDropdownMouseLeave}
                        >
                          {effectiveDropdownItems
                            .filter((sub) => sub.isVisible !== false)
                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                            .map((sub, idx, arr) => {
                              const isFooter =
                                sub.id === 'sub_all_courses' ||
                                sub.id === 'sub_all_tests' ||
                                sub.label.toLowerCase().includes('explore all') ||
                                sub.label.toLowerCase().includes('explore full');

                              return (
                                <Link
                                  key={sub.id}
                                  to={sub.path}
                                  className={`${styles.dropdownRichItem} ${isFooter ? styles.dropdownFooterItem : ''}`}
                                  role="menuitem"
                                  tabIndex={0}
                                  onClick={() => {
                                    if (dropdownCloseTimeoutRef.current) clearTimeout(dropdownCloseTimeoutRef.current);
                                    setOpenDropdownId(null);
                                  }}
                                  onKeyDown={(e) => handleItemKeyDown(e, idx, arr.length)}
                                >
                                  {/* Left Column: Iconography */}
                                  <div className={`${styles.itemIconWrap} ${isFooter ? styles.footerIconWrap : ''}`}>
                                    {renderDropdownIcon(sub.icon, sub.label)}
                                  </div>

                                  {/* Middle Column: Typography & Meta */}
                                  <div className={styles.itemContent}>
                                    <div className={styles.itemTitleRow}>
                                      <span className={`${styles.itemTitle} ${isFooter ? styles.footerItemTitle : ''}`}>
                                        {sub.label}
                                      </span>
                                      {renderDropdownBadge(sub.badge)}
                                    </div>
                                    <span className={styles.itemSubtitle}>
                                      {getDropdownSubtitle(sub)}
                                    </span>
                                  </div>

                                  {/* Right Column: Action Cue */}
                                  <div className={styles.itemActionCue}>
                                    <ChevronRight size={15} className={styles.itemChevron} aria-hidden="true" />
                                  </div>
                                </Link>
                              );
                            })}
                        </div>
                      )}
                    </li>
                  );
                }

                if (item.isButton) {
                  return (
                    <li key={item.id} className={styles.navItem}>
                      <NavLink
                        to={item.path}
                        className={`${styles.navMenuButton} ${
                          item.buttonVariant === 'outline'
                            ? styles.navMenuButtonOutline
                            : styles.navMenuButtonPrimary
                        }`}
                        style={{
                          padding: '12px 28px'
                        }}
                      >
                        <span>{item.label}</span>
                        {item.badge && <span className={styles.freeBadge}>{item.badge}</span>}
                      </NavLink>
                    </li>
                  );
                }

                return (
                  <li key={item.id} className={styles.navItem}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink
                      }
                    >
                      <span>{item.label}</span>
                      {item.badge && <span className={styles.freeBadge}>{item.badge}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Desktop Right Action Area */}
          <div className={styles.rightActions}>
            {/* Notification Bell Dropdown - Only for Authenticated Users */}
            {isAuthenticated && (
              <div className={styles.notificationWrapper} ref={notificationRef}>
                <button
                  type="button"
                  className={`${styles.bellNavBtn} ${isNotificationOpen ? styles.bellNavBtnActive : ''}`}
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  aria-label="View Notifications"
                  aria-expanded={isNotificationOpen}
                  aria-haspopup="dialog"
                  title="Notifications & Updates"
                >
                  <Bell size={18} />
                  {unreadNotificationsCount > 0 && (
                    <span className={styles.bellBadge}>
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {isNotificationOpen && (
                  <div className={styles.notificationDropdown} role="dialog" aria-label="Notifications">
                    <div className={styles.notifHeader}>
                      <div className={styles.notifTitleRow}>
                        <span className={styles.notifTitle}>Notifications</span>
                        {unreadNotificationsCount > 0 && (
                          <span className={styles.notifCountBadge}>{unreadNotificationsCount} new</span>
                        )}
                      </div>
                      {unreadNotificationsCount > 0 && (
                        <button
                          type="button"
                          className={styles.markAllReadBtn}
                          onClick={markAllNotificationsAsRead}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className={styles.notifList}>
                      {notifications.length === 0 ? (
                        <div className={styles.emptyNotifs}>
                          <Bell size={24} className={styles.emptyIcon} />
                          <p>No notifications right now.</p>
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((notif) => (
                          <div
                            key={notif.id}
                            className={`${styles.notifCard} ${!notif.read ? styles.notifUnread : ''}`}
                            onClick={() => {
                              markNotificationAsRead(notif.id);
                              if (notif.linkUrl) {
                                setIsNotificationOpen(false);
                                navigate(notif.linkUrl);
                              }
                            }}
                          >
                            <div className={styles.notifCardHeader}>
                              <span className={styles.notifCardTitle}>{notif.title}</span>
                              {!notif.read && <span className={styles.unreadDot} />}
                            </div>
                            <p className={styles.notifCardMessage}>{notif.message}</p>
                            <div className={styles.notifCardFooter}>
                              <span className={styles.notifTime}>
                                {new Date(notif.timestamp).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              {notif.linkText && notif.linkUrl && (
                                <span className={styles.notifActionLink}>{notif.linkText} &rarr;</span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isAuthenticated ? (
              <div className={styles.authGroup}>
                {/* Student Avatar Dropdown */}
                <div className={styles.userMenuWrapper} ref={userMenuRef}>
                  <button
                    type="button"
                    className={`${styles.avatarMenuBtn} ${isUserMenuOpen ? styles.avatarMenuBtnActive : ''} ${location.pathname === '/profile' ? styles.activeProfileNavBtn : ''}`}
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    aria-label="Student Account Menu"
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="menu"
                    title={`Account menu: ${student?.name || 'Student'}`}
                  >
                    {student?.avatarUrl ? (
                      <img src={student.avatarUrl} alt="" className={styles.avatarNavImg} />
                    ) : (
                      <span className={styles.avatarNavInitial}>
                        {student?.name?.trim().charAt(0).toUpperCase() || 'S'}
                      </span>
                    )}
                  </button>

                  {isUserMenuOpen && (
                    <div className={styles.userDropdownMenu} role="menu" aria-label="Student account options">
                      <div className={styles.userDropdownHeader}>
                        <div className={styles.userNameText}>{student?.name || 'Student Aspirant'}</div>
                        <div className={styles.userEmailText}>{student?.email || 'student@dkacademyjee.com'}</div>
                        <span className={styles.userIdChip}>ID: {student?.id || 'std_student'}</span>
                      </div>
                      <div className={styles.dropdownDivider} role="separator" />
                      <Link
                        to="/profile"
                        role="menuitem"
                        className={`${styles.dropdownItem} ${location.pathname === '/profile' ? styles.dropdownItemActive : ''}`}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User size={15} className={styles.dropdownItemIcon} aria-hidden="true" />
                        <span>Profile &amp; Settings</span>
                      </Link>
                      <Link
                        to="/dashboard"
                        role="menuitem"
                        className={`${styles.dropdownItem} ${location.pathname === '/dashboard' ? styles.dropdownItemActive : ''}`}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <LayoutDashboard size={15} className={styles.dropdownItemIcon} aria-hidden="true" />
                        <span>Dashboard</span>
                      </Link>
                      <Link
                        to="/profile?tab=payments"
                        role="menuitem"
                        className={`${styles.dropdownItem} ${location.search.includes('tab=payments') ? styles.dropdownItemActive : ''}`}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <CreditCard size={15} className={styles.dropdownItemIcon} aria-hidden="true" />
                        <span>Payments &amp; Orders</span>
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        className={styles.dropdownItem}
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsPhoneModalOpen(true);
                        }}
                      >
                        <HelpCircle size={15} className={styles.dropdownItemIcon} aria-hidden="true" />
                        <div className={styles.helpCol}>
                          <span>Help &amp; Support</span>
                          <small className={styles.helpSub}>Helpline: 9325987875, 9717159062</small>
                        </div>
                      </button>
                      <div className={styles.dropdownDivider} role="separator" />
                      <button
                        type="button"
                        role="menuitem"
                        className={`${styles.dropdownItem} ${styles.dropdownLogoutItem}`}
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                          navigate('/login');
                        }}
                      >
                        <LogOut size={15} className={styles.dropdownItemIcon} aria-hidden="true" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.unauthActions}>
                <button
                  type="button"
                  className={styles.phoneIconBtn}
                  onClick={() => setIsPhoneModalOpen(true)}
                  aria-label="Call DK Academy Admissions Helpline"
                  title="Call Helpline: 9325987875, 9717159062"
                >
                  <Phone size={18} fill="#ffffff" />
                </button>
                {location.pathname !== '/login' && (
                  <button
                    type="button"
                    className={styles.loginPillBtn}
                    onClick={() => navigate('/login')}
                    aria-label="Login to Student Portal"
                  >
                    Login
                  </button>
                )}
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className={styles.mobileToggle}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </Container>

        {/* Mobile Navigation Drawer */}
        <div
          className={`${styles.mobileDrawer} ${mobileMenuOpen ? styles.mobileDrawerOpen : ''}`}
          aria-hidden={!mobileMenuOpen}
        >
          <div className={styles.mobileNavInner}>
            <div className={styles.mobileHeader}>
              <div className={styles.mobileBrandWrap}>
                <img src="/img/logo.jpeg" alt="DK Academy" className={styles.brandLogoImg} />
              </div>
              <button
                type="button"
                className={styles.mobileCloseBtn}
                onClick={closeMobileMenu}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav aria-label="Mobile Navigation">
              <ul className={styles.mobileNavList}>
                {menuItems
                  .filter((item) => item.isVisible !== false)
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((item) => {
                    const defaultItem = DEFAULT_NAVBAR_ITEMS.find((d) => d.id === item.id);
                    const effectiveDropdownItems =
                      item.dropdownItems && item.dropdownItems.length > 0
                        ? item.dropdownItems
                        : (item.id === 'nav_courses' ? (defaultItem?.dropdownItems || []) : []);
                    const isDropdown = Boolean(item.isDropdown && effectiveDropdownItems.length > 0);

                    return (
                      <React.Fragment key={item.id}>
                        <li>
                          <Link to={item.path} onClick={closeMobileMenu} className={styles.mobileNavLink}>
                            <span>{item.label}</span>
                            {item.badge && <span className={styles.freeBadge}>{item.badge}</span>}
                          </Link>
                        </li>
                        {isDropdown &&
                          effectiveDropdownItems
                            .filter((sub) => sub.isVisible !== false)
                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                            .map((sub) => (
                              <li key={sub.id} style={{ paddingLeft: '1.25rem' }}>
                                <Link
                                  to={sub.path}
                                  onClick={closeMobileMenu}
                                  className={styles.mobileNavLink}
                                  style={{ fontSize: '0.85rem', opacity: 0.85 }}
                                >
                                  <span>↳ {sub.label}</span>
                                  {sub.badge && <span className={styles.freeBadge}>{sub.badge}</span>}
                                </Link>
                              </li>
                            ))}
                      </React.Fragment>
                    );
                  })}
              </ul>
            </nav>

            <div className={styles.mobileCenterInfo}>
              <div className={styles.centerAddress}>
                <MapPin size={15} />
                <span>C4F/33, behind F Market, Janakpuri, New Delhi – 110058</span>
              </div>
              <div className={styles.mobilePhoneRow}>
                <a href="tel:9325987875" className={styles.mobilePhoneLink}>
                  <Phone size={14} /> 9325987875
                </a>
                <a href="tel:9717159062" className={styles.mobilePhoneLink}>
                  <Phone size={14} /> 9717159062
                </a>
              </div>
            </div>

            <div className={styles.mobileAuthActions}>
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className={styles.mobileLoginBtn} onClick={closeMobileMenu}>
                    Student Dashboard ({student?.name || 'My Portal'})
                  </Link>
                  <Link to="/profile" className={styles.mobileProfileLink} onClick={closeMobileMenu}>
                    Student Profile &amp; Settings
                  </Link>
                </>
              ) : (
                location.pathname !== '/login' && (
                  <Link to="/login" className={styles.mobileLoginBtn} onClick={closeMobileMenu}>
                    Login to Student Portal
                  </Link>
                )
              )}
              <Link to="/courses" className={styles.mobileExploreBtn} onClick={closeMobileMenu}>
                Explore JEE Courses
              </Link>
            </div>
          </div>
        </div>
        {mobileMenuOpen && <div className={styles.backdrop} onClick={closeMobileMenu} aria-hidden="true" />}
      </header>

      {/* Contact & Center Helpline Modal (Triggered by Circular Phone Button) */}
      {isPhoneModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setIsPhoneModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="phone-modal-title"
        >
          <div className={styles.phoneModalCard} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setIsPhoneModalOpen(false)}
              aria-label="Close helpline modal"
            >
              <X size={18} />
            </button>

            <div className={styles.modalHeader}>
              <div className={styles.modalIconBadge}>
                <Phone size={22} fill="#2563eb" color="#2563eb" />
              </div>
              <h3 id="phone-modal-title" className={styles.modalTitle}>
                DK Academy JEE Helpline
              </h3>
              <p className={styles.modalSubtitle}>
                Founded by <strong>DK Sir (Dharmendra Kumar)</strong> • Specializing in IIT JEE Mathematics
              </p>
            </div>

            <div className={styles.helplineNumbersBox}>
              <span className={styles.boxLabel}>Call Admissions &amp; Academic Counselors:</span>
              <div className={styles.numberRow}>
                <a href="tel:9325987875" className={styles.callNumberLink}>
                  <Phone size={16} />
                  <span>+91 93259 87875</span>
                </a>
                <span className={styles.numTag}>Primary Helpline</span>
              </div>
              <div className={styles.numberRow}>
                <a href="tel:9717159062" className={styles.callNumberLink}>
                  <Phone size={16} />
                  <span>+91 97171 59062</span>
                </a>
                <span className={styles.numTag}>Janakpuri Center</span>
              </div>
            </div>

            <div className={styles.locationDetailsBox}>
              <div className={styles.locItem}>
                <MapPin size={16} className={styles.locIcon} />
                <div>
                  <strong>Physical Center Location:</strong>
                  <p>C4F/33, behind F Market, Janakpuri, New Delhi – 110058</p>
                </div>
              </div>
            </div>

            <div className={styles.whatsappQuickBox}>
              <a
                href="https://wa.me/919325987875?text=Hello%20DK%20Sir,%20I%20want%20guidance%20for%20IIT%20JEE%20Mathematics%20batches"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappModalBtn}
              >
                <MessageCircle size={18} />
                <span>Chat on WhatsApp (+91 93259 87875)</span>
              </a>
            </div>

            <div className={styles.channelsFooter}>
              <span>Official Channels:</span>
              <a
                href="https://www.youtube.com/@DKAcademyJEE"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.channelLink}
              >
                <ExternalLink size={13} />
                YouTube @DKAcademyJEE
              </a>
              <a
                href="https://in.linkedin.com/in/dharmendra-kumar-67735a55"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.channelLink}
              >
                <ExternalLink size={13} />
                LinkedIn: Dharmendra Kumar
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
