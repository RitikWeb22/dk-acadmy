import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useStudentAuth } from '../../context/AuthContext';
import { Container } from '../../components/ui/Container/Container';
import {
  NotificationCard,
  NotificationFilters,
  NotificationEmptyState,
  type FilterCategory
} from '../../components/notifications';
import type { AppNotification } from '../../types';
import {
  Bell,
  CheckCheck,
  ChevronRight,
  LayoutDashboard,
  LogIn,
  UserX,
  ArrowRight,
  Settings,
  Undo2,
  Check
} from 'lucide-react';
import styles from './NotificationsPage.module.scss';

const PAGE_SIZE = 20;

interface GroupedNotifications {
  title: string;
  items: AppNotification[];
}

function groupNotificationsByDate(items: AppNotification[]): GroupedNotifications[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;

  const today: AppNotification[] = [];
  const yesterday: AppNotification[] = [];
  const thisWeek: AppNotification[] = [];
  const older: AppNotification[] = [];

  items.forEach((item) => {
    if (item.timestamp >= startOfToday) {
      today.push(item);
    } else if (item.timestamp >= startOfYesterday) {
      yesterday.push(item);
    } else if (item.timestamp >= startOfWeek) {
      thisWeek.push(item);
    } else {
      older.push(item);
    }
  });

  const groups: GroupedNotifications[] = [];
  if (today.length > 0) groups.push({ title: 'Today', items: today });
  if (yesterday.length > 0) groups.push({ title: 'Yesterday', items: yesterday });
  if (thisWeek.length > 0) groups.push({ title: 'Earlier this week', items: thisWeek });
  if (older.length > 0) groups.push({ title: 'Older', items: older });

  return groups;
}

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    student,
    isAuthenticated,
    isLoading,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markNotificationAsUnread,
    markAllNotificationsAsRead,
    deleteNotification
  } = useStudentAuth();

  // 1. Sync filter & search with URL query parameters (?filter=unread&q=...)
  const initialCategory = (searchParams.get('filter') as FilterCategory) || 'all';
  const initialQuery = searchParams.get('q') || '';

  const [activeCategory, setActiveCategory] = useState<FilterCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // 2. Delete with 5-second Undo Toast state
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimeoutRef = useRef<number | null>(null);

  // Sync category changes to URL
  const handleSelectCategory = (cat: FilterCategory) => {
    setActiveCategory(cat);
    setVisibleCount(PAGE_SIZE);
    const params = new URLSearchParams(searchParams);
    if (cat === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', cat);
    }
    setSearchParams(params, { replace: true });
  };

  // Sync search changes to URL
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setVisibleCount(PAGE_SIZE);
    const params = new URLSearchParams(searchParams);
    if (!query.trim()) {
      params.delete('q');
    } else {
      params.set('q', query.trim());
    }
    setSearchParams(params, { replace: true });
  };

  // Real computed counts from active notifications (excluding pending delete)
  const activeNotifications = useMemo(() => {
    if (!pendingDeleteId) return notifications;
    return notifications.filter((n) => n.id !== pendingDeleteId);
  }, [notifications, pendingDeleteId]);

  const counts = useMemo(() => {
    return {
      all: activeNotifications.length,
      unread: activeNotifications.filter((n) => !n.read).length,
      announcement: activeNotifications.filter((n) => n.category === 'announcement').length,
      course: activeNotifications.filter((n) => n.category === 'course').length,
      practice_test: activeNotifications.filter((n) => n.category === 'practice_test').length
    };
  }, [activeNotifications]);

  // Combined category & search filtering
  const filteredNotifications = useMemo(() => {
    let result = activeNotifications;

    // Category filter
    if (activeCategory === 'unread') {
      result = result.filter((n) => !n.read);
    } else if (activeCategory === 'announcement') {
      result = result.filter((n) => n.category === 'announcement');
    } else if (activeCategory === 'course') {
      result = result.filter((n) => n.category === 'course');
    } else if (activeCategory === 'practice_test') {
      result = result.filter((n) => n.category === 'practice_test');
    }

    // Search query filter
    const cleanQuery = searchQuery.trim().toLowerCase();
    if (cleanQuery) {
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(cleanQuery) ||
          n.message.toLowerCase().includes(cleanQuery) ||
          (n.tag && n.tag.toLowerCase().includes(cleanQuery))
      );
    }

    return result;
  }, [activeNotifications, activeCategory, searchQuery]);

  // Paginated slice
  const visibleNotifications = useMemo(() => {
    return filteredNotifications.slice(0, visibleCount);
  }, [filteredNotifications, visibleCount]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    return groupNotificationsByDate(visibleNotifications);
  }, [visibleNotifications]);

  // Cleanup undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  // Delete with 5-second undo handler
  const handleDeleteNotification = (id: string) => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    setPendingDeleteId(id);
    setShowUndo(true);
    setToastMessage('Notification deleted');

    // 5-second countdown to permanently commit delete
    undoTimeoutRef.current = window.setTimeout(() => {
      deleteNotification(id);
      setPendingDeleteId(null);
      setShowUndo(false);
      setToastMessage(null);
    }, 5000);
  };

  // Undo delete handler
  const handleUndoDelete = () => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    setPendingDeleteId(null);
    setShowUndo(false);
    setToastMessage('Notification restored');
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Mark all as read with toast
  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    setShowUndo(false);
    setToastMessage('All notifications marked as read');
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleToggleRead = (id: string, currentRead: boolean) => {
    if (currentRead) {
      markNotificationAsUnread(id);
    } else {
      markNotificationAsRead(id);
    }
  };

  // Opening notification marks it as read and navigates
  const handleOpenNotification = (notif: AppNotification) => {
    if (!notif.read) {
      markNotificationAsRead(notif.id);
    }
    if (notif.linkUrl) {
      navigate(notif.linkUrl);
    }
  };

  // Unauthenticated Guard
  if (!isLoading && (!isAuthenticated || !student)) {
    return (
      <main className={styles.page}>
        <Container size="default">
          <div className={styles.authRequiredCard} role="alert">
            <div className={styles.authIconCircle}>
              <UserX size={32} aria-hidden="true" />
            </div>
            <h2 className={styles.authTitle}>Student Authentication Required</h2>
            <p className={styles.authMessage}>
              Please sign in with your student account to view personalized announcements, batch notes, and CBT test updates.
            </p>
            <div className={styles.authActions}>
              <Link to="/login?redirect=/notifications" className={styles.authLoginBtn}>
                <LogIn size={16} aria-hidden="true" />
                <span>Sign In to Student Portal</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  const getEmptyStateType = () => {
    if (searchQuery.trim()) return 'search_empty';
    if (activeCategory === 'unread') return 'unread_empty';
    if (activeCategory === 'announcement') return 'announcement_empty';
    if (activeCategory === 'course') return 'course_empty';
    if (activeCategory === 'practice_test') return 'practice_test_empty';
    return 'all_empty';
  };

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
            <span>Dashboard</span>
          </Link>
          <ChevronRight size={14} className={styles.breadcrumbChevron} aria-hidden="true" />
          <span className={styles.breadcrumbCurrent} aria-current="page">
            Notifications &amp; Announcements
          </span>
        </nav>

        {/* Header Card */}
        <header className={styles.headerCard}>
          <div className={styles.headerMain}>
            <div className={styles.headerIconBox}>
              <Bell size={24} aria-hidden="true" />
            </div>
            <div className={styles.headerTitles}>
              <h1 className={styles.pageTitle}>Notifications &amp; Announcements</h1>
              <p className={styles.pageSubtitle}>
                Live masterclasses, lecture handouts, All-India CBT mock test schedules, and daily DPP alerts.
              </p>
            </div>
          </div>

          {/* Action Row: Settings Link + Mark All as Read (Only when unread > 0) */}
          <div className={styles.headerActions}>
            <Link
              to="/profile?tab=preferences"
              className={styles.settingsLink}
              title="Configure notification preferences in Student Profile"
            >
              <Settings size={15} aria-hidden="true" />
              <span>Notification settings</span>
            </Link>

            {unreadNotificationsCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className={styles.markAllBtn}
                title="Mark all notifications as read"
                aria-label="Mark all notifications as read"
              >
                <CheckCheck size={16} aria-hidden="true" />
                <span>Mark All as Read</span>
              </button>
            )}
          </div>
        </header>

        {/* Filter Tabs & Search Bar */}
        <NotificationFilters
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          counts={counts}
        />

        {/* Notifications Feed Grouped by Date */}
        <div className={styles.notificationsList}>
          {filteredNotifications.length > 0 ? (
            <>
              {groupedNotifications.map((group) => (
                <section key={group.title} className={styles.dateGroup} aria-label={`${group.title} notifications`}>
                  <div className={styles.stickyDateHeading}>
                    <span className={styles.stickyDateText}>{group.title}</span>
                    <span className={styles.stickyDateCount}>({group.items.length})</span>
                  </div>

                  <div className={styles.groupCardList}>
                    {group.items.map((notif) => (
                      <NotificationCard
                        key={notif.id}
                        notification={notif}
                        searchQuery={searchQuery}
                        onToggleRead={handleToggleRead}
                        onDelete={handleDeleteNotification}
                        onOpen={handleOpenNotification}
                      />
                    ))}
                  </div>
                </section>
              ))}

              {/* Load More Button after 20 items */}
              {filteredNotifications.length > visibleCount && (
                <div className={styles.loadMoreWrap}>
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className={styles.loadMoreBtn}
                    aria-label={`Load more notifications, ${
                      filteredNotifications.length - visibleCount
                    } remaining`}
                  >
                    <span>
                      Load More Notifications ({filteredNotifications.length - visibleCount} remaining)
                    </span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <NotificationEmptyState
              type={getEmptyStateType()}
              searchQuery={searchQuery}
              onClearFilters={() => {
                handleSelectCategory('all');
                handleSearchChange('');
              }}
            />
          )}
        </div>
      </Container>

      {/* Accessible Toast Notification with Undo */}
      {toastMessage && (
        <aside
          role="status"
          aria-live="polite"
          className={styles.toastContainer}
        >
          <div className={styles.toastContent}>
            <Check size={16} className={styles.toastIcon} aria-hidden="true" />
            <span>{toastMessage}</span>
          </div>

          {showUndo && (
            <button
              type="button"
              onClick={handleUndoDelete}
              className={styles.undoToastBtn}
              aria-label="Undo deletion of notification"
            >
              <Undo2 size={14} aria-hidden="true" />
              <span>Undo (5s)</span>
            </button>
          )}
        </aside>
      )}
    </main>
  );
};
