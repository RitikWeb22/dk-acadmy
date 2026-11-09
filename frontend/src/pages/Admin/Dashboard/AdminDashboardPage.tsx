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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { QuickActionModal } from './components/QuickActionModal';
import { UsersAnalyticsCard } from './components/UsersAnalyticsCard';
import { OrdersAnalyticsCard } from './components/OrdersAnalyticsCard';
import { RecentTransactionsCard } from './components/RecentTransactionsCard';
import { CircularProgressRing } from './components/CircularProgressRing';
import { apiClient } from '../../../services/apiClient';
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
    totalLeads: number;
    totalCoupons: number;
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
    totalPaidLectures: 0,
    totalLeads: 0,
    totalCoupons: 0
  });

  const formatCompactCurrency = (amount: number): string => {
    if (!amount || amount === 0) return '₹0';
    if (amount >= 10000000) {
      const val = amount / 10000000;
      return `₹${val.toFixed(val >= 10 ? 0 : 1).replace(/\.0$/, '')}Cr`;
    }
    if (amount >= 100000) {
      const val = amount / 100000;
      return `₹${val.toFixed(val >= 10 ? 0 : 1).replace(/\.0$/, '')}L`;
    }
    if (amount >= 1000) {
      const val = amount / 1000;
      return `₹${val.toFixed(val >= 10 ? 0 : 1).replace(/\.0$/, '')}K`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const isSyncingRef = useRef(false);
  const lastSyncTimeRef = useRef(0);

  const fetchAnalytics = async () => {
    const now = Date.now();
    if (isSyncingRef.current || now - lastSyncTimeRef.current < 2500) return;
    isSyncingRef.current = true;
    lastSyncTimeRef.current = now;
    setIsSyncing(true);
    try {
      const res = await apiClient.get('/analytics');
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
          totalPaidLectures: res.summary.totalPaidLectures ?? 0,
          totalLeads: res.summary.totalLeads ?? res.summary.leadsCount ?? 0,
          totalCoupons: res.summary.totalCoupons ?? res.summary.couponsCount ?? 0
        });
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

    window.addEventListener('dk_payment_success', handleRealtimePayment);
    window.addEventListener('dk_order_created', handleRealtimePayment);
    window.addEventListener('dk_course_created', fetchAnalytics);
    window.addEventListener('dk_course_updated', fetchAnalytics);
    window.addEventListener('dk_free_lecture_created', fetchAnalytics);
    window.addEventListener('dk_dpp_pyq_created', fetchAnalytics);
    window.addEventListener('dk_test_series_created', fetchAnalytics);
    window.addEventListener('dk_student_registered', fetchAnalytics);
    return () => {
      window.removeEventListener('dk_payment_success', handleRealtimePayment);
      window.removeEventListener('dk_order_created', handleRealtimePayment);
      window.removeEventListener('dk_course_created', fetchAnalytics);
      window.removeEventListener('dk_course_updated', fetchAnalytics);
      window.removeEventListener('dk_free_lecture_created', fetchAnalytics);
      window.removeEventListener('dk_dpp_pyq_created', fetchAnalytics);
      window.removeEventListener('dk_test_series_created', fetchAnalytics);
      window.removeEventListener('dk_student_registered', fetchAnalytics);
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
              <div className="flex flex-col gap-6 w-full max-w-[1440px] mx-auto p-6 sm:p-8 pb-16">
                {/* ─── COCKPIT HEADER ─── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                        Academic Session 2026–27 · IIT-JEE Division
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        Live Sync Active
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        Welcome, {admin?.name || 'Ritik'}
                      </h1>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        Super Admin
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                      Real-time admissions, live batch curriculum, CBT simulations, and verified fee collections across DK Academy JEE.
                    </p>
                  </div>

                  {/* Action Toolbar */}
                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={fetchAnalytics}
                      disabled={isSyncing}
                      className="h-9 px-3.5 rounded-lg text-xs font-medium border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-colors shrink-0 flex items-center gap-2"
                      title="Refresh live metrics"
                    >
                      <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                      <span>{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
                    </Button>

                    <Button
                      variant="default"
                      onClick={() => setIsCommandPaletteOpen(true)}
                      className="h-9 px-3.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-colors whitespace-nowrap shrink-0 flex items-center"
                      title="Open Command Palette (Ctrl+K)"
                    >
                      <span>Quick Actions</span>
                      <kbd className="ml-2 font-mono text-[10px] bg-primary-foreground/20 text-primary-foreground px-1.5 py-0.5 rounded-sm font-semibold whitespace-nowrap shrink-0">
                        ⌘K
                      </kbd>
                    </Button>
                  </div>
                </div>

                {/* ─── 4 CORE HERO PILLARS (Executive KPI Cockpit) ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Pillar 1: Total Fee Collections */}
                  <Card
                    className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150 p-6 flex flex-col justify-between"
                    onClick={() => handleNavClick('invoices', '/admin/invoices')}
                    title="View Invoices & Fee Slips"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <CreditCard size={18} />
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 tabular-nums">
                        {liveAnalytics.revenueGrowth}
                      </span>
                    </div>
                    <div className="mt-4">
                      <span className="text-2xl sm:text-[28px] font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                        ₹{liveAnalytics.grossRevenue.toLocaleString('en-IN')}
                      </span>
                      <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                        Fee Collections
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Verified online &amp; gateway receipts
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Goal: ₹25L Target</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">15% Met</span>
                    </div>
                  </Card>

                  {/* Pillar 2: Enrolled Aspirants */}
                  <Card
                    className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150 p-6 flex flex-col justify-between"
                    onClick={() => handleNavClick('students', '/admin/students')}
                    title="View Student Roster"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Users size={18} />
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800 tabular-nums">
                        {liveAnalytics.studentsGrowth}
                      </span>
                    </div>
                    <div className="mt-4">
                      <span className="text-2xl sm:text-[28px] font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                        {liveAnalytics.totalStudents || 13}
                      </span>
                      <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                        Enrolled Aspirants
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Classroom &amp; Online LMS roster
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Capacity: 500 Max</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">2.6% Utilized</span>
                    </div>
                  </Card>

                  {/* Pillar 3: Active Courses */}
                  <Card
                    className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150 p-6 flex flex-col justify-between"
                    onClick={() => handleNavClick('courses', '/admin/courses')}
                    title="View Courses & Batches"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <PlusSquare size={18} />
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        Live Batches
                      </span>
                    </div>
                    <div className="mt-4">
                      <span className="text-2xl sm:text-[28px] font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                        {liveAnalytics.totalCourses || 6}
                      </span>
                      <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                        Course Batches
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Target JEE 2026, 2027 &amp; Droppers
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Curriculum Status</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">100% On Track</span>
                    </div>
                  </Card>

                  {/* Pillar 4: CBT Mock Simulator */}
                  <Card
                    className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150 p-6 flex flex-col justify-between"
                    onClick={() => handleNavClick('test-series', '/admin/test-series')}
                    title="View Test Series Simulator"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-9 w-9 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 flex items-center justify-center shrink-0">
                        <FileText size={18} />
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                        NTA Pattern
                      </span>
                    </div>
                    <div className="mt-4">
                      <span className="text-2xl sm:text-[28px] font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                        {liveAnalytics.totalTestSeries || 9}
                      </span>
                      <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                        Test Series Mocks
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Full-length CBT mock tests active
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Drills &amp; Attempts</span>
                      <span className="font-semibold text-violet-600 dark:text-violet-400">160+ Submissions</span>
                    </div>
                  </Card>
                </div>

                {/* ─── ACADEMIC & OPERATIONS QUICK INVENTORY SHELF (5 Modules) ─── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  {/* Faculty & Staff */}
                  <div
                    onClick={() => handleNavClick('teachers', '/admin/teachers')}
                    className="cursor-pointer rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150 p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                        <ShieldCheck size={16} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                          {liveAnalytics.totalTeachers} Faculty
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          RBAC &amp; Staff
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight size={13} className="text-slate-400 shrink-0 ml-1" />
                  </div>

                  {/* DPP & PYQs */}
                  <div
                    onClick={() => handleNavClick('dpp-pyq', '/admin/dpp-pyq')}
                    className="cursor-pointer rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150 p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                        <Crosshair size={16} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                          {liveAnalytics.totalDppPyq} DPP / PYQ
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Daily Drills
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight size={13} className="text-slate-400 shrink-0 ml-1" />
                  </div>

                  {/* Free Lectures */}
                  <div
                    onClick={() => handleNavClick('free-lectures', '/admin/free-lectures')}
                    className="cursor-pointer rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150 p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                        <Video size={16} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                          {liveAnalytics.totalFreeLectures} Lectures
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Video Vault
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight size={13} className="text-slate-400 shrink-0 ml-1" />
                  </div>

                  {/* Leads Desk */}
                  <div
                    onClick={() => handleNavClick('contact', '/admin/contact')}
                    className="cursor-pointer rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150 p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                        <Mail size={16} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                          {liveAnalytics.totalLeads ?? 0} Inquiries
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Leads Desk
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight size={13} className="text-slate-400 shrink-0 ml-1" />
                  </div>

                  {/* Discount Coupons */}
                  <div
                    onClick={() => handleNavClick('coupons', '/admin/coupons')}
                    className="cursor-pointer rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150 p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                        <Tag size={16} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                          {liveAnalytics.totalCoupons ?? 0} Promos
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Fee Concessions
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight size={13} className="text-slate-400 shrink-0 ml-1" />
                  </div>
                </div>

                {/* ─── 2-COLUMN ASYMMETRIC BENTO GRID (Left minmax(0,1fr) / Right 380px) ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
                  {/* LEFT COLUMN (Analytics & Visual Trend Graphs) */}
                  <div className="min-w-0 flex flex-col gap-6">
                    <UsersAnalyticsCard />
                    <OrdersAnalyticsCard />
                  </div>

                  {/* RIGHT COLUMN (380px Width — Recent Transactions Ledger & Fast Action Hub) */}
                  <div className="w-full lg:w-[380px] min-w-0 flex flex-col gap-6">
                    {/* Live Financial & Admissions Ledger */}
                    <RecentTransactionsCard />

                    {/* Fast Navigation Quick Action Hub */}
                    <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6">
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                        Quick Administrative Access
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Direct shortcuts to manage curriculum and students
                      </p>

                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => handleNavClick('courses', '/admin/courses/create')}
                          className="h-10 text-xs font-medium border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 justify-start px-3 rounded-lg"
                        >
                          <PlusSquare size={14} className="text-indigo-600 dark:text-indigo-400 mr-2 shrink-0" />
                          <span>New Course</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleNavClick('test-series', '/admin/test-series')}
                          className="h-10 text-xs font-medium border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 justify-start px-3 rounded-lg"
                        >
                          <FileText size={14} className="text-violet-600 dark:text-violet-400 mr-2 shrink-0" />
                          <span>New CBT Mock</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleNavClick('dpp-pyq', '/admin/dpp-pyq')}
                          className="h-10 text-xs font-medium border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 justify-start px-3 rounded-lg"
                        >
                          <Crosshair size={14} className="text-blue-600 dark:text-blue-400 mr-2 shrink-0" />
                          <span>Upload DPP</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleNavClick('invoices', '/admin/invoices')}
                          className="h-10 text-xs font-medium border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 justify-start px-3 rounded-lg"
                        >
                          <CreditCard size={14} className="text-emerald-600 dark:text-emerald-400 mr-2 shrink-0" />
                          <span>Fee Slips</span>
                        </Button>
                      </div>
                    </Card>
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
