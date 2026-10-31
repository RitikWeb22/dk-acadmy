import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  CreditCard,
  PlusSquare,
  FileText,
  Crosshair,
  Star,
  Monitor,
  Compass,
  Mail,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MoreVertical,
  UserCog,
  Video,
  Tag
} from 'lucide-react';
import { useAdminAuth } from '../../../../context/AdminAuthContext';
import { AdminProfileModal } from '../../../../components/admin/AdminProfileModal/AdminProfileModal';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  activeMenu: string;
  onSelectMenu: (menuKey: string, routePath?: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItemDef {
  key: string;
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string | number;
  badgeColor?: 'danger' | 'warning' | 'info' | 'neutral';
  route?: string;
}

interface NavSectionDef {
  sectionTitle: string;
  items: NavItemDef[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  onSelectMenu,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onMobileClose
}) => {
  const { admin, logout } = useAdminAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const adminInitials = (admin?.name || 'Admin')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Grouped Navigation structure matching reference layout
  const navSections: NavSectionDef[] = [
    {
      sectionTitle: 'Overview',
      items: [
        {
          key: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          route: '/admin/dashboard'
        }
      ]
    },
    {
      sectionTitle: 'Data & Users',
      items: [
        {
          key: 'students',
          label: 'Student Management',
          sublabel: 'Aspirants roster, batch allocations',
          icon: Users,
          route: '/admin/students'
        },
        {
          key: 'teachers',
          label: 'Teachers & Admin',
          sublabel: 'Faculty assignments, RBAC',
          icon: ShieldCheck,
          route: '/admin/teachers'
        },
        {
          key: 'invoices',
          label: 'Invoices & Fee Slips',
          sublabel: 'Razorpay & offline receipts',
          icon: CreditCard,
          route: '/admin/invoices'
        },
        {
          key: 'coupons',
          label: 'Coupons & Limits',
          sublabel: 'Promo codes & student limits',
          icon: Tag,
          route: '/admin/coupons'
        }
      ]
    },
    {
      sectionTitle: 'Academics & Content',
      items: [
        {
          key: 'courses',
          label: 'Courses Create',
          sublabel: 'New batch configuration',
          icon: PlusSquare,
          route: '/admin/courses/create'
        },
        {
          key: 'test-series',
          label: 'Test Series',
          sublabel: 'JEE & BITSAT CBT series',
          icon: FileText,
          route: '/admin/test-series'
        },
        {
          key: 'dpp-pyq',
          label: 'DPP & PYQ Practice',
          sublabel: 'Practice sets & archives',
          icon: Crosshair,
          route: '/admin/dpp-pyq'
        },
        {
          key: 'free-lectures',
          label: 'Free Lectures Create',
          sublabel: '5-free rule & unlock pricing',
          icon: Video,
          route: '/admin/free-lectures'
        },
        {
          key: 'reviews',
          label: 'Course Review Management',
          sublabel: 'Student ratings & moderation',
          icon: Star,
          route: '/admin/reviews'
        }
      ]
    },
    {
      sectionTitle: 'CMS & Platform',
      items: [
        {
          key: 'pages',
          label: 'Page Management',
          sublabel: 'Home page, About Us, Classrooms',
          icon: Monitor,
          route: '/admin/pages'
        },
        {
          key: 'navbar-footer',
          label: 'Navbar & Footer Management',
          sublabel: 'Global links, contact details',
          icon: Compass,
          route: '/admin/navbar-footer'
        },
        {
          key: 'contact',
          label: 'Contact Us Management',
          sublabel: 'Callback requests, demo leads',
          icon: Mail,
          route: '/admin/contact'
        }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className={styles.mobileBackdrop}
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${
          isMobileOpen ? styles.mobileOpen : ''
        }`}
        aria-label="Main Admin Navigation"
      >
        {/* Top Header: Brand "DK ACADEMY" with Collapse Arrow "<" */}
        <div className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.brandLogoWrap}>
              <img
                src="/img/logo.jpeg"
                alt="DK Academy"
                className={styles.logoImg}
              />
            </div>
            {!isCollapsed && (
              <div className={styles.brandInfo}>
                <span className={styles.brandTitle}>DK ACADEMY</span>
                <span className={styles.brandSubtag}>IIT-JEE Coaching</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className={styles.collapseToggle}
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar (<)' : 'Collapse sidebar (<)'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Admin Profile Widget (Placed under header, dynamic logged-in admin) */}
        <div className={styles.profileWidget}>
          <div
            className={styles.avatarWrap}
            style={{ cursor: 'pointer' }}
            onClick={() => setIsProfileModalOpen(true)}
            title="Edit Admin Profile & Avatar"
          >
            {admin?.avatarUrl ? (
              <img
                src={admin.avatarUrl}
                alt={admin.name || 'Admin'}
                className={styles.profileAvatarImg}
              />
            ) : (
              <div className={styles.profileAvatarFallback}>
                {adminInitials}
              </div>
            )}
            <span className={styles.onlineStatusDot} />
          </div>

          {!isCollapsed && (
            <div
              className={styles.profileDetails}
              style={{ cursor: 'pointer' }}
              onClick={() => setIsProfileModalOpen(true)}
              title="Click to edit profile"
            >
              <div className={styles.profileNameRow}>
                <span className={styles.profileName} title={admin?.name || 'Administrator'}>
                  {admin?.name || 'Administrator'}
                </span>
              </div>
              <span className={styles.profileRole} title={admin?.designation || admin?.role}>
                - {admin?.designation || (admin?.role ? admin.role.replace('_', ' ') : 'Super Admin')}
              </span>
            </div>
          )}

          {!isCollapsed && (
            <div className={styles.profileMenuTriggerWrap}>
              <button
                type="button"
                className={styles.profileMenuBtn}
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                aria-label="Account options"
                aria-expanded={isProfileMenuOpen}
              >
                <MoreVertical size={15} />
              </button>

              {isProfileMenuOpen && (
                <div className={styles.profileDropdown}>
                  <div className={styles.dropdownHeader}>
                    <span className={styles.dropdownEmail}>
                      {admin?.email || 'admin@dkacademy.in'}
                    </span>
                    <span className={styles.dropdownRole}>
                      {admin?.role?.replace('_', ' ') || 'SUPER ADMIN'}
                      {admin?.department ? ` • ${admin.department}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.editProfileBtn}
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                  >
                    <UserCog size={14} />
                    <span>Edit Profile &amp; Photo</span>
                  </button>
                  <button
                    type="button"
                    className={styles.logoutBtn}
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      logout();
                    }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Grouped Navigation List with Section Headers */}
        <nav className={styles.navScrollArea}>
          {navSections.map((section) => (
            <div key={section.sectionTitle} className={styles.sectionGroup}>
              {!isCollapsed ? (
                <div className={styles.sectionHeader}>
                  <span>{section.sectionTitle}</span>
                </div>
              ) : (
                <div className={styles.collapsedDivider} />
              )}

              <div className={styles.itemsList}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMenu === item.key;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                      onClick={() => {
                        onSelectMenu(item.key, item.route);
                        if (isMobileOpen && onMobileClose) onMobileClose();
                      }}
                      title={isCollapsed ? `${item.label}${item.sublabel ? ` - ${item.sublabel}` : ''}` : undefined}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className={styles.itemIcon}>
                        <Icon size={18} />
                      </span>

                      {!isCollapsed && (
                        <div className={styles.itemTextContainer}>
                          <span className={styles.itemLabel}>{item.label}</span>
                        </div>
                      )}

                      {!isCollapsed && item.badge !== undefined && (
                        <span
                          className={`${styles.itemBadge} ${
                            item.badgeColor === 'danger'
                              ? styles.badgeDanger
                              : styles.badgeInfo
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {isCollapsed && item.badge !== undefined && (
                        <span className={styles.collapsedBadgeDot} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Slim System Status Tag at Bottom of Sidebar */}
        {!isCollapsed && (
          <div className={styles.sidebarFooterNotice}>
            <span className={styles.pulseDotGreen} />
            <span>DK Coaching Live</span>
          </div>
        )}
      </aside>

      {/* Admin Profile & Avatar Cloudinary Editor Modal */}
      <AdminProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};
