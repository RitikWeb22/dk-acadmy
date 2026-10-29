import React, { useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useStudentAuth } from '../../context/AuthContext';
import { Container } from '../../components/ui/Container/Container';
import {
  ProfileHeader,
  ProfileInformationForm,
  AccountSettings,
  PaymentsOrders,
  PasswordManagement,
  ProfileSkeleton,
  ProfileErrorState
} from '../../components/profile';
import {
  User,
  Bell,
  CreditCard,
  Lock,
  LayoutDashboard,
  ChevronRight,
  AlertTriangle,
  X
} from 'lucide-react';
import styles from './ProfilePage.module.scss';

type ProfileTab = 'info' | 'preferences' | 'payments' | 'security';

interface TabDefinition {
  id: ProfileTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  badge?: number;
}

const TABS: TabDefinition[] = [
  { id: 'info', label: 'Student Profile', icon: User },
  { id: 'preferences', label: 'Notification Settings', icon: Bell },
  { id: 'payments', label: 'Payments & Orders', icon: CreditCard, badge: 3 },
  { id: 'security', label: 'Password & Security', icon: Lock }
];

export const ProfilePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    student,
    isAuthenticated,
    isLoading,
    updateProfile,
    changePassword,
    updateNotificationPreferences
  } = useStudentAuth();

  // Tab state synced with URL ?tab=
  const tabParam = searchParams.get('tab');
  const activeTab: ProfileTab =
    tabParam === 'preferences' || tabParam === 'notifications'
      ? 'preferences'
      : tabParam === 'payments' || tabParam === 'orders' || tabParam === 'settings'
      ? 'payments'
      : tabParam === 'security'
      ? 'security'
      : 'info';

  const [isFormDirty, setIsFormDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<ProfileTab | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Tab selection with dirty check
  const handleTabClick = (tabId: ProfileTab) => {
    if (tabId === activeTab) return;
    if (isFormDirty && activeTab === 'info') {
      setPendingTab(tabId);
      setShowDiscardModal(true);
    } else {
      switchTab(tabId);
    }
  };

  const switchTab = (tabId: ProfileTab) => {
    setSearchParams({ tab: tabId });
    setShowDiscardModal(false);
    setPendingTab(null);
  };

  // Keyboard navigation for role="tablist"
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex = index;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      newIndex = (index + 1) % TABS.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      newIndex = (index - 1 + TABS.length) % TABS.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      newIndex = TABS.length - 1;
    }

    if (newIndex !== index) {
      tabRefs.current[newIndex]?.focus();
      handleTabClick(TABS[newIndex].id);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <main className={styles.page}>
        <Container size="default">
          <ProfileSkeleton />
        </Container>
      </main>
    );
  }

  // Unauthenticated guard
  if (!isAuthenticated || !student) {
    return (
      <main className={styles.page}>
        <Container size="default">
          <ProfileErrorState />
        </Container>
      </main>
    );
  }

  const isDemo = student?.id === 'std_demo_2026';
  const tabsWithBadge = [
    { id: 'info' as const, label: 'Student Profile', icon: User },
    { id: 'preferences' as const, label: 'Notification Settings', icon: Bell },
    {
      id: 'payments' as const,
      label: 'Payments & Orders',
      icon: CreditCard,
      badge: isDemo ? 3 : (student?.enrolledCourseIds && student.enrolledCourseIds.length > 0 ? student.enrolledCourseIds.length : undefined)
    },
    { id: 'security' as const, label: 'Password & Security', icon: Lock }
  ];

  return (
    <main className={styles.page}>
      <Container size="default">
        {/* Navigation Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/" className={styles.breadcrumbLink}>
            Home
          </Link>
          <ChevronRight size={14} className={styles.breadcrumbChevron} aria-hidden="true" />
          <Link to="/dashboard" className={styles.breadcrumbLink}>
            <LayoutDashboard size={13} aria-hidden="true" />
            <span>Student Dashboard</span>
          </Link>
          <ChevronRight size={14} className={styles.breadcrumbChevron} aria-hidden="true" />
          <span className={styles.breadcrumbCurrent} aria-current="page">
            Student Profile &amp; Settings
          </span>
        </nav>

        {/* Unified Profile Header */}
        <header className={styles.headerArea}>
          <ProfileHeader student={student} onUpdatePhoto={(url) => updateProfile({ avatarUrl: url })} />
        </header>

        {/* Tab Navigation Dock (4 accessible tabs) */}
        <nav className={styles.tabNavContainer} aria-label="Profile Sections">
          <div className={styles.tabList} role="tablist" aria-orientation="horizontal">
            {tabsWithBadge.map((tab, idx) => {
              const isSelected = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  ref={(el) => {
                    tabRefs.current[idx] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={isSelected ? 0 : -1}
                  className={`${styles.tabBtn} ${isSelected ? styles.activeTab : ''}`}
                  onClick={() => handleTabClick(tab.id)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                >
                  <Icon size={16} className={styles.tabIcon} aria-hidden="true" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`${styles.tabBadge} ${isSelected ? styles.activeBadge : ''}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Active Tab Panels */}
        <div className={styles.tabContent}>
          {activeTab === 'info' && (
            <div id="panel-info" role="tabpanel" aria-labelledby="tab-info">
              <ProfileInformationForm
                student={student}
                onUpdate={updateProfile}
                onDirtyChange={(dirty) => setIsFormDirty(dirty)}
              />
            </div>
          )}

          {activeTab === 'preferences' && (
            <div id="panel-preferences" role="tabpanel" aria-labelledby="tab-preferences">
              <AccountSettings
                student={student}
                onUpdatePreferences={updateNotificationPreferences}
              />
            </div>
          )}

          {activeTab === 'payments' && (
            <div id="panel-payments" role="tabpanel" aria-labelledby="tab-payments">
              <PaymentsOrders student={student} />
            </div>
          )}

          {activeTab === 'security' && (
            <div id="panel-security" role="tabpanel" aria-labelledby="tab-security">
              <PasswordManagement onChangePassword={changePassword} />
            </div>
          )}
        </div>
      </Container>

      {/* Unsaved Changes Confirmation Modal */}
      {showDiscardModal && (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setShowDiscardModal(false)}>
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="discard-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <AlertTriangle size={18} className={styles.warningIcon} aria-hidden="true" />
                <h3 id="discard-title" className={styles.modalTitle}>
                  Unsaved Profile Changes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className={styles.modalCloseBtn}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <p className={styles.modalDesc}>
              You have made modifications to your personal information. If you switch tabs now, your unsaved changes will be discarded.
            </p>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className={styles.keepEditingBtn}
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFormDirty(false);
                  if (pendingTab) switchTab(pendingTab);
                }}
                className={styles.discardBtn}
              >
                Discard &amp; Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
