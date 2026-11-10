import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  Receipt,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  PlusSquare,
  FileText,
  Crosshair,
  RefreshCw,
  ArrowUpRight,
  Sparkles,
  Video,
  Mail,
  Tag
} from 'lucide-react';
// Lazy-loaded administrative workspaces for bundle optimization
const StudentManagementWorkspace = React.lazy(() =>
  import('../../../components/admin/StudentManagement/StudentManagementWorkspace').then((m) => ({ default: m.StudentManagementWorkspace }))
);
const FacultyManagementWorkspace = React.lazy(() =>
  import('../../../components/admin/FacultyManagement/FacultyManagementWorkspace').then((m) => ({ default: m.FacultyManagementWorkspace }))
);
const CourseBuilderWorkspace = React.lazy(() =>
  import('../../../components/admin/CourseBuilder/CourseBuilderWorkspace').then((m) => ({ default: m.CourseBuilderWorkspace }))
);
const InvoicesManagementWorkspace = React.lazy(() =>
  import('../../../components/admin/Invoices/InvoicesManagementWorkspace').then((m) => ({ default: m.InvoicesManagementWorkspace }))
);
const TestSeriesBuilderWorkspace = React.lazy(() =>
  import('../../../components/admin/TestSeries/TestSeriesBuilderWorkspace').then((m) => ({ default: m.TestSeriesBuilderWorkspace }))
);
const DppPyqManagementWorkspace = React.lazy(() =>
  import('../../../components/admin/DppPyq/DppPyqManagementWorkspace').then((m) => ({ default: m.DppPyqManagementWorkspace }))
);
const CourseReviewManagementWorkspace = React.lazy(() =>
  import('../../../components/admin/CourseReview/CourseReviewManagementWorkspace').then((m) => ({ default: m.CourseReviewManagementWorkspace }))
);
const FreeLecturesManagementWorkspace = React.lazy(() =>
  import('../../../components/admin/FreeLectures/FreeLecturesManagementWorkspace').then((m) => ({ default: m.FreeLecturesManagementWorkspace }))
);
const ContactManagementWorkspace = React.lazy(() =>
  import('../../../components/admin/ContactManagement/ContactManagementWorkspace').then((m) => ({ default: m.ContactManagementWorkspace }))
);
const NavbarFooterManagementWorkspace = React.lazy(() =>
  import('../../../components/admin/NavbarFooter/NavbarFooterManagementWorkspace').then((m) => ({ default: m.NavbarFooterManagementWorkspace }))
);
const PageManagementWorkspace = React.lazy(() =>
  import('../../../components/admin/PageManagement/PageManagementWorkspace').then((m) => ({ default: m.PageManagementWorkspace }))
);
const CouponManagementWorkspace = React.lazy(() =>
  import('../../../components/admin/Coupons/CouponManagementWorkspace').then((m) => ({ default: m.CouponManagementWorkspace }))
);

const AdminWorkspaceLoader: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', width: '100%' }}>
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: '#64748B', fontSize: '14px', fontWeight: 500 }}>
      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
      <span>Loading workspace...</span>
    </div>
  </div>
);

// Modular Components
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { QuickActionModal } from './components/QuickActionModal';
import { UsersAnalyticsCard } from './components/UsersAnalyticsCard';
import { OrdersAnalyticsCard } from './components/OrdersAnalyticsCard';
import { RecentTransactionsCard } from './components/RecentTransactionsCard';
import { CircularProgressRing } from './components/CircularProgressRing';
import { apiClient } from '../../../services/apiClient';
import { subscribeRealtimeEvents } from '../../../utils/broadcastSync';
import { useAdminAuth } from '../../../context/AdminAuthContext';

import styles from './AdminDashboardPage.module.scss';

export const AdminDashboardPage: React.FC<{ initialMenu?: string }> = ({ initialMenu }) => {
  const { admin } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation state
  const [activeMenu, setActiveMenu] = useState<string>(
    initialMenu ||
      (location.pathname.includes('/students')
        ? 'students'
        : location.pathname.includes('/teachers') || location.pathname.includes('/faculty')
        ? 'teachers'
        : location.pathname.includes('/courses')
        ? 'courses'
        : location.pathname.includes('/invoices')
        ? 'invoices'
        : location.pathname.includes('/test-series')
        ? 'test-series'
        : location.pathname.includes('/pyq') || location.pathname.includes('/dpp-pyq')
        ? 'dpp-pyq'
        : location.pathname.includes('/free-lectures') || location.pathname.includes('/lectures')
        ? 'free-lectures'
        : location.pathname.includes('/reviews')
        ? 'reviews'
        : location.pathname.includes('/contact') || location.pathname.includes('/leads')
        ? 'contact'
        : location.pathname.includes('/navbar-footer')
        ? 'navbar-footer'
        : location.pathname.includes('/pages')
        ? 'pages'
        : location.pathname.includes('/coupons')
        ? 'coupons'
        : 'dashboard')
  );

  useEffect(() => {
    if (initialMenu) {
      setActiveMenu(initialMenu);
    } else if (location.pathname.includes('/students')) {
      setActiveMenu('students');
    } else if (location.pathname.includes('/teachers') || location.pathname.includes('/faculty')) {
      setActiveMenu('teachers');
    } else if (location.pathname.includes('/courses')) {
      setActiveMenu('courses');
    } else if (location.pathname.includes('/invoices')) {
      setActiveMenu('invoices');
    } else if (location.pathname.includes('/test-series')) {
      setActiveMenu('test-series');
    } else if (location.pathname.includes('/pyq') || location.pathname.includes('/dpp-pyq')) {
      setActiveMenu('dpp-pyq');
    } else if (location.pathname.includes('/free-lectures') || location.pathname.includes('/lectures')) {
      setActiveMenu('free-lectures');
    } else if (location.pathname.includes('/reviews')) {
      setActiveMenu('reviews');
    } else if (location.pathname.includes('/contact') || location.pathname.includes('/leads')) {
      setActiveMenu('contact');
    } else if (location.pathname.includes('/navbar-footer')) {
      setActiveMenu('navbar-footer');
    } else if (location.pathname.includes('/pages')) {
      setActiveMenu('pages');
    } else if (location.pathname.includes('/coupons')) {
      setActiveMenu('coupons');
    }
  }, [initialMenu, location.pathname]);

  const handleNavClick = (menuKey: string, routePath?: string) => {
    setActiveMenu(menuKey);
    if (routePath && location.pathname !== routePath) {
      navigate(routePath);
    }
  };

  // Sidebar collapse & Mobile drawer state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Dark Mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('dk_admin_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('darkMode', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('darkMode', 'dark');
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('darkMode', 'dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('darkMode', 'dark');
      document.body.setAttribute('data-theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('dk_admin_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Modals state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [quickActionType, setQuickActionType] = useState<string | null>(null);

  // Toast alert state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Keyboard shortcut listener: ⌘K or Ctrl+K for palette, Ctrl+\ for sidebar toggle
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Listen for real-time WebSocket student registrations across the entire admin portal
  useEffect(() => {
    const handleRealtimeStudent = (e: any) => {
      const student = e.detail;
      if (student) {
        showToast(`🎓 New Student Registered: ${student.name} (${student.email})`);
      }
    };

    window.addEventListener('dk_student_registered', handleRealtimeStudent);
    return () => window.removeEventListener('dk_student_registered', handleRealtimeStudent);
  }, []);

  // Real-time Analytics summary from MongoDB
  const [isSyncing, setIsSyncing] = useState(false);
  const [liveAnalytics, setLiveAnalytics] = useState<{
    grossRevenue: number;
    totalEnrolments: number;
    revenueGrowth: string;
    studentsGrowth: string;
    totalStudents: number;
    totalTeachers: number;
    totalCourses: number;
    totalTestSeries: number;
    totalDppPyq: number;
    totalFreeLectures: number;
    totalPaidLectures: number;
  }>({
    grossRevenue: 0,
    totalEnrolments: 0,
    revenueGrowth: '+0.0%',
    studentsGrowth: '0 this week',
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalTestSeries: 0,
    totalDppPyq: 0,
    totalFreeLectures: 0,
    totalPaidLectures: 0
  });

  const isSyncingRef = useRef(false);
  const lastSyncTimeRef = useRef(0);

  const fetchAnalytics = async (force = false) => {
    if (isSyncingRef.current) return;
    const now = Date.now();
    if (!force && now - lastSyncTimeRef.current < 2000) return;
    isSyncingRef.current = true;
    lastSyncTimeRef.current = now;
    setIsSyncing(true);
    try {
      const url = force ? `/analytics?force=true&_t=${now}` : '/analytics';
      const res = await apiClient.get(url);
      if (res.success && res.summary) {
        setLiveAnalytics({
          grossRevenue: res.summary.grossRevenue || 0,
          totalEnrolments: res.summary.totalEnrolments ?? res.summary.successfulPurchases ?? 0,
          revenueGrowth: res.summary.comparisons?.revenueGrowth || '+0.0%',
          studentsGrowth: res.summary.comparisons?.studentsGrowth || '0 this week',
          totalStudents: res.summary.totalStudents ?? 0,
          totalTeachers: res.summary.totalTeachers ?? 0,
          totalCourses: res.summary.totalCourses ?? 0,
          totalTestSeries: res.summary.totalTestSeries ?? 0,
          totalDppPyq: res.summary.totalDppPyq ?? 0,
          totalFreeLectures: res.summary.totalFreeLectures ?? 0,
          totalPaidLectures: res.summary.totalPaidLectures ?? 0
        });
        if (force) {
          showToast('✓ Live executive metrics synced from database!');
        }
      }
    } catch (err) {
      console.warn('[AdminDashboard] Analytics load fallback:', err);
    } finally {
      setIsSyncing(false);
      isSyncingRef.current = false;
    }
  };

  useEffect(() => {
    fetchAnalytics();

    const handleRealtimePayment = (e: any) => {
      const p = e.detail;
      if (p?.amount) {
        setLiveAnalytics((prev) => ({
          ...prev,
          grossRevenue: prev.grossRevenue + Number(p.amount),
          totalEnrolments: prev.totalEnrolments + 1
        }));
        showToast(`💳 Fee Slip Verified: ₹${Number(p.amount).toLocaleString('en-IN')} from ${p.studentName || 'Student'}`);
      }
      fetchAnalytics();
    };

    const handleSync = () => fetchAnalytics(true);

    const unsubscribe = subscribeRealtimeEvents(() => {
      fetchAnalytics(true);
    });

    window.addEventListener('dk_payment_success', handleRealtimePayment);
    window.addEventListener('dk_order_created', handleRealtimePayment);
    window.addEventListener('dk_course_created', handleSync);
    window.addEventListener('dk_course_updated', handleSync);
    window.addEventListener('dk_free_lecture_created', handleSync);
    window.addEventListener('dk_dpp_pyq_created', handleSync);
    window.addEventListener('dk_test_series_created', handleSync);
    window.addEventListener('dk_student_registered', handleSync);
    return () => {
      unsubscribe();
      window.removeEventListener('dk_payment_success', handleRealtimePayment);
      window.removeEventListener('dk_order_created', handleRealtimePayment);
      window.removeEventListener('dk_course_created', handleSync);
      window.removeEventListener('dk_course_updated', handleSync);
      window.removeEventListener('dk_free_lecture_created', handleSync);
      window.removeEventListener('dk_dpp_pyq_created', handleSync);
      window.removeEventListener('dk_test_series_created', handleSync);
      window.removeEventListener('dk_student_registered', handleSync);
    };
  }, []);

  return (
    <div
      className={`${styles.dashboardMasterShell} ${isDarkMode ? 'darkMode dark' : ''}`}
      data-theme={isDarkMode ? 'dark' : 'light'}
    >
      {/* Skip to Content for Accessibility */}
      <a href="#main-content" className={styles.skipLink}>
        Skip to main executive content
      </a>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className={styles.toastBanner} role="status" aria-live="polite">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── 1. LEFT SIDEBAR PANEL (Collapsible, Grouped Hierarchy) ─── */}
      <Sidebar
        activeMenu={activeMenu}
        onSelectMenu={(menuKey, routePath) => handleNavClick(menuKey, routePath)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* ─── 2. MAIN WORKSPACE CONTAINER ─── */}
      <div className={styles.mainContentWrapper}>
        {/* Top Lightweight Utility Bar */}
        <Topbar
          activeMenu={activeMenu}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Main Content Workspace */}
        <main
          id="main-content"
          className={`${styles.workspace} ${isDarkMode ? 'darkMode dark' : ''}`}
          data-theme={isDarkMode ? 'dark' : 'light'}
          role="main"
          tabIndex={-1}
        >
          <React.Suspense fallback={<AdminWorkspaceLoader />}>
            {activeMenu === 'students' ? (
              <StudentManagementWorkspace />
            ) : activeMenu === 'teachers' ? (
              <FacultyManagementWorkspace />
            ) : activeMenu === 'courses' ? (
              <CourseBuilderWorkspace />
            ) : activeMenu === 'invoices' ? (
              <InvoicesManagementWorkspace />
            ) : activeMenu === 'test-series' ? (
              <TestSeriesBuilderWorkspace />
            ) : activeMenu === 'dpp-pyq' ? (
              <DppPyqManagementWorkspace />
            ) : activeMenu === 'free-lectures' ? (
              <FreeLecturesManagementWorkspace />
            ) : activeMenu === 'reviews' ? (
              <CourseReviewManagementWorkspace />
            ) : activeMenu === 'contact' ? (
              <ContactManagementWorkspace />
            ) : activeMenu === 'navbar-footer' ? (
              <NavbarFooterManagementWorkspace />
            ) : activeMenu === 'pages' ? (
              <PageManagementWorkspace />
            ) : activeMenu === 'coupons' ? (
              <CouponManagementWorkspace />
            ) : (
              <div className={styles.dashboardContainerStack}>
              {/* ─── EXECUTIVE COMMAND HEADER STRIP ─── */}
              <div className={styles.execHeaderStrip}>
                <div className={styles.execHeaderInfo}>
                  <div className={styles.execIconCircle}>
                    <Sparkles size={20} className={styles.execSparkleIcon} />
                  </div>
                  <div>
                    <h1 className={styles.execTitle}>Executive Command Center</h1>
                    <p className={styles.execSubtitle}>
                      Real-time admissions, active curriculum, CBT simulations, and verified fee collections across DK Academy JEE.
                    </p>
                  </div>
                </div>

                <div className={styles.execActionsGroup}>
                  <button
                    type="button"
                    className={styles.syncDbBtn}
                    onClick={() => fetchAnalytics(true)}
                    disabled={isSyncing}
                    title="Refresh live metrics"
                  >
                    <RefreshCw size={14} className={isSyncing ? styles.spinIcon : ''} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
                  </button>

                  <button
                    type="button"
                    className={styles.quickCommandBtn}
                    onClick={() => setIsCommandPaletteOpen(true)}
                    title="Open Command Palette (Ctrl+K)"
                  >
                    <span>⌘ Quick Actions</span>
                  </button>
                </div>
              </div>

              {/* ─── 6-MODULE CORE ACADEMIC & DATA BENTO STRIP ─── */}
              <div className={styles.moduleBentoStrip}>
                {/* 1. Student Management */}
                <div
                  className={styles.moduleCard}
                  onClick={() => handleNavClick('students', '/admin/students')}
                  title="Open Student Management"
                >
                  <div className={styles.moduleCardHeader}>
                    <div className={`${styles.moduleIconTile} ${styles.emeraldModuleTile}`}>
                      <Users size={18} />
                    </div>
                    <ArrowUpRight size={15} className={styles.moduleArrow} />
                  </div>
                  <div className={styles.moduleCardBody}>
                    <span className={styles.moduleValue}>{liveAnalytics.totalStudents}</span>
                    <span className={styles.moduleLabel}>Student Management</span>
                    <span className={styles.moduleSubText}>Aspirants Roster &amp; Batches</span>
                  </div>
                </div>

                {/* 2. Teachers & Admin */}
                <div
                  className={styles.moduleCard}
                  onClick={() => handleNavClick('teachers', '/admin/teachers')}
                  title="Open Teachers & Admin"
                >
                  <div className={styles.moduleCardHeader}>
                    <div className={`${styles.moduleIconTile} ${styles.purpleModuleTile}`}>
                      <ShieldCheck size={18} />
                    </div>
                    <ArrowUpRight size={15} className={styles.moduleArrow} />
                  </div>
                  <div className={styles.moduleCardBody}>
                    <span className={styles.moduleValue}>{liveAnalytics.totalTeachers}</span>
                    <span className={styles.moduleLabel}>Teachers &amp; Admin</span>
                    <span className={styles.moduleSubText}>Faculty &amp; RBAC Control</span>
                  </div>
                </div>

                {/* 3. Invoices & Fee Slips */}
                <div
                  className={styles.moduleCard}
                  onClick={() => handleNavClick('invoices', '/admin/invoices')}
                  title="Open Invoices & Fee Slips"
                >
                  <div className={styles.moduleCardHeader}>
                    <div className={`${styles.moduleIconTile} ${styles.blueModuleTile}`}>
                      <CreditCard size={18} />
                    </div>
                    <ArrowUpRight size={15} className={styles.moduleArrow} />
                  </div>
                  <div className={styles.moduleCardBody}>
                    <span className={styles.moduleValue}>
                      ₹{(liveAnalytics.grossRevenue / 100000).toFixed(1)}L
                    </span>
                    <span className={styles.moduleLabel}>Invoices &amp; Fees</span>
                    <span className={styles.moduleSubText}>Razorpay &amp; Offline Slips</span>
                  </div>
                </div>

                {/* 4. Courses Create */}
                <div
                  className={styles.moduleCard}
                  onClick={() => handleNavClick('courses', '/admin/courses/create')}
                  title="Open Course Builder"
                >
                  <div className={styles.moduleCardHeader}>
                    <div className={`${styles.moduleIconTile} ${styles.amberModuleTile}`}>
                      <PlusSquare size={18} />
                    </div>
                    <ArrowUpRight size={15} className={styles.moduleArrow} />
                  </div>
                  <div className={styles.moduleCardBody}>
                    <span className={styles.moduleValue}>{liveAnalytics.totalCourses}</span>
                    <span className={styles.moduleLabel}>Courses Create</span>
                    <span className={styles.moduleSubText}>Batches &amp; Video Vault</span>
                  </div>
                </div>

                {/* 5. Test Series */}
                <div
                  className={styles.moduleCard}
                  onClick={() => handleNavClick('test-series', '/admin/test-series')}
                  title="Open Test Series Engine"
                >
                  <div className={styles.moduleCardHeader}>
                    <div className={`${styles.moduleIconTile} ${styles.roseModuleTile}`}>
                      <FileText size={18} />
                    </div>
                    <ArrowUpRight size={15} className={styles.moduleArrow} />
                  </div>
                  <div className={styles.moduleCardBody}>
                    <span className={styles.moduleValue}>{liveAnalytics.totalTestSeries}</span>
                    <span className={styles.moduleLabel}>Test Series</span>
                    <span className={styles.moduleSubText}>JEE &amp; BITSAT CBT Engine</span>
                  </div>
                </div>

                {/* 6. DPP & PYQ Practice */}
                <div
                  className={styles.moduleCard}
                  onClick={() => handleNavClick('dpp-pyq', '/admin/dpp-pyq')}
                  title="Open DPP & PYQ Practice"
                >
                  <div className={styles.moduleCardHeader}>
                    <div className={`${styles.moduleIconTile} ${styles.tealModuleTile}`}>
                      <Crosshair size={18} />
                    </div>
                    <ArrowUpRight size={15} className={styles.moduleArrow} />
                  </div>
                  <div className={styles.moduleCardBody}>
                    <span className={styles.moduleValue}>{liveAnalytics.totalDppPyq}</span>
                    <span className={styles.moduleLabel}>DPP &amp; PYQ Practice</span>
                    <span className={styles.moduleSubText}>Daily Drills &amp; Archives</span>
                  </div>
                </div>

                {/* 7. Free Lectures Create */}
                <div
                  className={styles.moduleCard}
                  onClick={() => handleNavClick('free-lectures', '/admin/free-lectures')}
                  title="Open Free Lectures Create"
                >
                  <div className={styles.moduleCardHeader}>
                    <div className={`${styles.moduleIconTile} ${styles.cyanModuleTile}`}>
                      <Video size={18} />
                    </div>
                    <ArrowUpRight size={15} className={styles.moduleArrow} />
                  </div>
                  <div className={styles.moduleCardBody}>
                    <span className={styles.moduleValue}>{liveAnalytics.totalFreeLectures} Free</span>
                    <span className={styles.moduleLabel}>Free Lectures Create</span>
                    <span className={styles.moduleSubText}>5-Free Rule &amp; Paid Pricing</span>
                  </div>
                </div>

                {/* 8. Contact Us & Leads Desk */}
                <div
                  className={styles.moduleCard}
                  onClick={() => handleNavClick('contact', '/admin/contact')}
                  title="Open Contact Us & Customer Inquiries Desk"
                >
                  <div className={styles.moduleCardHeader}>
                    <div className={`${styles.moduleIconTile} ${styles.blueModuleTile}`}>
                      <Mail size={18} />
                    </div>
                    <ArrowUpRight size={15} className={styles.moduleArrow} />
                  </div>
                  <div className={styles.moduleCardBody}>
                    <span className={styles.moduleValue}>Active Leads</span>
                    <span className={styles.moduleLabel}>Contact Us Desk</span>
                    <span className={styles.moduleSubText}>Callbacks &amp; Inquiries</span>
                  </div>
                </div>

                {/* 9. Discount Coupons */}
                <div
                  className={styles.moduleCard}
                  onClick={() => handleNavClick('coupons', '/admin/coupons')}
                  title="Open Discount Coupons & Promo Offers"
                >
                  <div className={styles.moduleCardHeader}>
                    <div className={`${styles.moduleIconTile} ${styles.purpleModuleTile}`}>
                      <Tag size={18} />
                    </div>
                    <ArrowUpRight size={15} className={styles.moduleArrow} />
                  </div>
                  <div className={styles.moduleCardBody}>
                    <span className={styles.moduleValue}>Promo Codes</span>
                    <span className={styles.moduleLabel}>Discount Coupons</span>
                    <span className={styles.moduleSubText}>Fee Concessions</span>
                  </div>
                </div>
              </div>

              {/* ─── 2-COLUMN ASYMMETRIC BENTO GRID (Left 68% / Right 32%) ─── */}
              <div className={styles.bentoGridWorkspace}>
                {/* LEFT COLUMN (~68% Width — Analytics & Visual Trend Graphs) */}
                <div className={styles.leftColumn}>
                  {/* Top Card: Users Analytics */}
                  <UsersAnalyticsCard />

                  {/* Bottom Card: Orders Analytics */}
                  <OrdersAnalyticsCard />
                </div>

                {/* RIGHT COLUMN (~32% Width — Compact Metric Gauges & Live Stream) */}
                <div className={styles.rightColumn}>
                  {/* Top Metric Card 1: Sales Obtained / Fee Collections */}
                  <div className={styles.kpiRadialCard}>
                    <div className={styles.kpiLeftContent}>
                      <div className={`${styles.iconContainer} ${styles.iconContainerBlue}`}>
                        <Receipt size={18} className={styles.iconBlue} />
                      </div>
                      <div className={styles.kpiMetaGroup}>
                        <div className={styles.valueRow}>
                          <span className={styles.kpiBoldValue}>
                            ₹{liveAnalytics.grossRevenue.toLocaleString('en-IN')}
                          </span>
                          <span className={styles.growthPillEmerald}>{liveAnalytics.revenueGrowth}</span>
                        </div>
                        <span className={styles.kpiLabelText}>Fee Collections</span>
                      </div>
                    </div>
                    <div className={styles.kpiRightRing}>
                      <CircularProgressRing
                        progress={Math.min(100, Math.max(15, Math.round((liveAnalytics.grossRevenue / 2500000) * 100)))}
                        size={58}
                        strokeWidth={5}
                        strokeColor="#2563EB"
                        trackColor="#EFF6FF"
                      />
                    </div>
                  </div>

                  {/* Top Metric Card 2: New Users / Student Enrollments */}
                  <div className={styles.kpiRadialCard}>
                    <div className={styles.kpiLeftContent}>
                      <div className={`${styles.iconContainer} ${styles.iconContainerIndigo}`}>
                        <Users size={18} className={styles.iconIndigo} />
                      </div>
                      <div className={styles.kpiMetaGroup}>
                        <div className={styles.valueRow}>
                          <span className={styles.kpiBoldValue}>{liveAnalytics.totalEnrolments}</span>
                          <span className={styles.growthPillEmerald}>{liveAnalytics.studentsGrowth}</span>
                        </div>
                        <span className={styles.kpiLabelText}>Enrolled Aspirants</span>
                      </div>
                    </div>
                    <div className={styles.kpiRightRing}>
                      <CircularProgressRing
                        progress={Math.min(100, Math.max(20, Math.round((liveAnalytics.totalEnrolments / 50) * 100)))}
                        size={58}
                        strokeWidth={5}
                        strokeColor="#4F46E5"
                        trackColor="#EEF2FF"
                      />
                    </div>
                  </div>

                  {/* Bottom Card: Recent Transactions (Live Admissions & Invoices) */}
                  <RecentTransactionsCard />
                </div>
              </div>
            </div>
          )}
          </React.Suspense>
        </main>
      </div>

      {/* Global Command Palette (⌘K) Modal */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(key, route) => {
          if (route) navigate(route);
          else setActiveMenu(key);
          setIsCommandPaletteOpen(false);
        }}
        onQuickAction={(actionKey) => {
          setIsCommandPaletteOpen(false);
          setQuickActionType(actionKey);
        }}
      />

      {/* Quick Action Modal */}
      {quickActionType && (
        <QuickActionModal
          actionType={quickActionType}
          onClose={() => setQuickActionType(null)}
          onSubmitSuccess={(msg: string) => {
            setQuickActionType(null);
            showToast(msg);
          }}
        />
      )}
    </div>
  );
};
