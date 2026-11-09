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
  Tag,
  Rocket,
  GraduationCap
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
  badgeColor?: 'danger' | 'warning' | 'info' | 'live' | 'neutral';
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

  const adminInitials = (admin?.name || 'Ritik')
    .trim()
    .charAt(0)
    .toUpperCase() || 'R';

  // Grouped Navigation structure exactly matching reference layout
  const navSections: NavSectionDef[] = [
    {
      sectionTitle: 'MAIN',
      items: [
        {
          key: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          route: '/admin/dashboard'
        },
        {
          key: 'students',
          label: 'Student Management',
          icon: Users,
          route: '/admin/students'
        },
        {
          key: 'teachers',
          label: 'Teachers & Admin',
          icon: ShieldCheck,
          route: '/admin/teachers'
        },
        {
          key: 'invoices',
          label: 'Invoices & Fee Slips',
          icon: CreditCard,
          route: '/admin/invoices'
        },
        {
          key: 'coupons',
          label: 'Discounts and Offers',
          icon: Tag,
          route: '/admin/coupons'
        }
      ]
    },
    {
      sectionTitle: 'ACADEMICS & CONTENT',
      items: [
        {
          key: 'courses',
          label: 'Courses Create',
          icon: PlusSquare,
          route: '/admin/courses/create'
        },
        {
          key: 'live-classroom',
          label: 'DK Coaching Live',
          icon: Video,
          badge: 'LIVE',
          badgeColor: 'live',
          route: '/admin/dashboard'
        },
        {
          key: 'test-series',
          label: 'Test Series',
          icon: FileText,
          route: '/admin/test-series'
        },
        {
          key: 'dpp-pyq',
          label: 'DPP & PYQ Practice',
          icon: Crosshair,
          route: '/admin/dpp-pyq'
        },
        {
          key: 'contact',
          label: 'Leads & Inquiries',
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
        {/* Top Header: Brand "DK ACADEMY" */}
        <div className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.brandLogoWrap}>
              <GraduationCap size={20} className="text-amber-400" />
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
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Admin Profile Widget (Dark Navy style) */}
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
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={styles.profileName} title={admin?.name || 'Ritik'}>
                  {admin?.name || 'Ritik'} (Super Admin)
                </span>
              </div>
              <span
                className={styles.profileRole}
                title={admin?.designation || 'Academic Director & Founder'}
              >
                Academic Director &amp; Founder
              </span>
            </div>
          )}

          {!isCollapsed && (
            <div className={`${styles.profileMenuTriggerWrap} ml-auto shrink-0`}>
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
                    <UserCog size={13} />
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
                    <LogOut size={13} />
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
                      title={isCollapsed ? item.label : undefined}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className={`${styles.itemIcon} ${isActive ? styles.activeIcon : ''}`}>
                        <Icon size={16} />
                      </span>

                      {!isCollapsed && (
                        <div className={styles.itemTextContainer}>
                          <span className={styles.itemLabel}>{item.label}</span>
                        </div>
                      )}

                      {!isCollapsed && item.badge !== undefined && (
                        <span
                          className={`${styles.itemBadge} ${
                            item.badgeColor === 'live'
                              ? styles.badgeLive
                              : item.badgeColor === 'danger'
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

          {/* Bottom Promotional Card (Grow Your Institute Further) */}
          {!isCollapsed && (
            <div className={styles.upgradeCard}>
              <div className={styles.upgradeHeader}>
                <div className={styles.rocketIconTile}>
                  <Rocket size={16} className="text-amber-400" />
                </div>
                <div className={styles.upgradeText}>
                  <h4 className={styles.upgradeTitle}>Grow Your Institute Further</h4>
                  <p className={styles.upgradeDesc}>
                    Track performance, manage easily, and boost success.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.upgradeBtn}
                onClick={() => onSelectMenu('courses', '/admin/courses')}
              >
                Upgrade Plan →
              </button>
            </div>
          )}

          {/* Footer Copyright */}
          {!isCollapsed && (
            <div className={styles.sidebarFooterNotice}>
              <span>© 2026 DK Academy</span>
              <span>Made with ❤️ in India</span>
            </div>
          )}
        </nav>
      </aside>

      {/* Admin Profile Modal */}
      <AdminProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};
