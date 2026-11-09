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
                {/* ─── HEADER ─── */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap">
                          Welcome, {admin?.name || 'Ritik'} (Super Admin)
                        </h1>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <span>Live Sync</span>
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                        Real-time admissions, active curriculum, CBT simulations, and verified fee collections across DK Academy JEE.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Button
                        variant="outline"
                        onClick={fetchAnalytics}
                        disabled={isSyncing}
                        className="h-10 px-4 rounded-lg text-xs font-medium border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-colors shrink-0 flex items-center gap-2"
                        title="Refresh live metrics"
                      >
                        <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
                      </Button>

                      <Button
                        variant="default"
                        onClick={() => setIsCommandPaletteOpen(true)}
                        className="h-10 px-4 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-colors whitespace-nowrap shrink-0 flex items-center"
                        title="Open Command Palette (Ctrl+K)"
                      >
                        <span>Quick Actions</span>
                        <kbd className="ml-2 font-mono text-[10px] bg-primary-foreground/20 text-primary-foreground px-1.5 py-0.5 rounded-sm font-semibold whitespace-nowrap shrink-0">
                          ⌘K
                        </kbd>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* ─── 9-MODULE CORE ACADEMIC & DATA BENTO STRIP (5 + 4 in 2 rows) ─── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {/* 1. Student Management */}
                  <Card
                    className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150 p-6 flex flex-col justify-between min-h-[156px]"
                    onClick={() => handleNavClick('students', '/admin/students')}
                    title="Open Student Management"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors flex items-center justify-center shrink-0">
                        <Users size={18} />
                      </div>
                      <ArrowUpRight size={14} className="text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex flex-col mt-3.5 min-w-0">
                      <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                        {liveAnalytics.totalStudents}
                      </span>
                      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate mt-0.5">
                        Students
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" title="Aspirants Roster & Batches">
                        Roster &amp; Batches
                      </span>
                    </div>
                  </Card>

                  {/* 2. Teachers & Admin */}
                  <Card
                    className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150 p-6 flex flex-col justify-between min-h-[156px]"
                    onClick={() => handleNavClick('teachers', '/admin/teachers')}
                    title="Open Teachers & Admin"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors flex items-center justify-center shrink-0">
                        <ShieldCheck size={18} />
                      </div>
                      <ArrowUpRight size={14} className="text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex flex-col mt-3.5 min-w-0">
                      <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                        {liveAnalytics.totalTeachers}
                      </span>
                      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate mt-0.5">
                        Faculty
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" title="Faculty & RBAC Directory">
                        RBAC Control
                      </span>
                    </div>
                  </Card>

                  {/* 3. Invoices & Fee Slips */}
                  <Card
                    className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150 p-6 flex flex-col justify-between min-h-[156px]"
                    onClick={() => handleNavClick('invoices', '/admin/invoices')}
                    title="Open Invoices & Fee Slips"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors flex items-center justify-center shrink-0">
                        <CreditCard size={18} />
                      </div>
                      <ArrowUpRight size={14} className="text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex flex-col mt-3.5 min-w-0">
                      <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                        {formatCompactCurrency(liveAnalytics.grossRevenue)}
                      </span>
                      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate mt-0.5">
                        Invoices
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" title="Fee Slips & Gateway Receipts">
                        Slips &amp; Razorpay
                      </span>
                    </div>
                  </Card>

                  {/* 4. Course Builder */}
                  <Card
                    className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150 p-6 flex flex-col justify-between min-h-[156px]"
                    onClick={() => handleNavClick('courses', '/admin/courses/create')}
                    title="Open Course Builder"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors flex items-center justify-center shrink-0">
                        <PlusSquare size={18} />
                      </div>
                      <ArrowUpRight size={14} className="text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex flex-col mt-3.5 min-w-0">
                      <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                        {liveAnalytics.totalCourses}
                      </span>
                      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate mt-0.5">
                        Courses
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" title="Batches & Curriculum Vault">
                        Batches &amp; Vault
                      </span>
                    </div>
                  </Card>

                  {/* 5. Test Series */}
                  <Card
                    className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150 p-6 flex flex-col justify-between min-h-[156px]"
                    onClick={() => handleNavClick('test-series', '/admin/test-series')}
                    title="Open Test Series Engine"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors flex items-center justify-center shrink-0">
                        <FileText size={18} />
                      </div>
                      <ArrowUpRight size={14} className="text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex flex-col mt-3.5 min-w-0">
                      <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                        {liveAnalytics.totalTestSeries}
                      </span>
                      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate mt-0.5">
                        Test Series
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" title="CBT Simulator & Full Length Mocks">
                        CBT Simulator
                      </span>
                    </div>
                  </Card>

                  {/* 6. DPP & PYQ Practice */}
                  <Card
                    className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150 p-6 flex flex-col justify-between min-h-[156px]"
                    onClick={() => handleNavClick('dpp-pyq', '/admin/dpp-pyq')}
                    title="Open DPP & PYQ Practice"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors flex items-center justify-center shrink-0">
                        <Crosshair size={18} />
                      </div>
                      <ArrowUpRight size={14} className="text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex flex-col mt-3.5 min-w-0">
                      <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                        {liveAnalytics.totalDppPyq}
                      </span>
                      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate mt-0.5">
                        DPP &amp; PYQ
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" title="Daily Drills & Archive Vault">
                        Daily Drills
                      </span>
                    </div>
                  </Card>

                  {/* 7. Free Lectures */}
                  <Card
                    className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150 p-6 flex flex-col justify-between min-h-[156px]"
                    onClick={() => handleNavClick('free-lectures', '/admin/free-lectures')}
                    title="Open Free Lectures Create"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors flex items-center justify-center shrink-0">
                        <Video size={18} />
                      </div>
                      <ArrowUpRight size={14} className="text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex flex-col mt-3.5 min-w-0">
                      <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                        {liveAnalytics.totalFreeLectures}
                      </span>
                      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate mt-0.5">
                        Free Lectures
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" title="5-Free Rule Video Library">
                        Lecture Library
                      </span>
                    </div>
                  </Card>

                  {/* 8. Contact Us & Leads Desk */}
                  <Card
                    className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150 p-6 flex flex-col justify-between min-h-[156px]"
                    onClick={() => handleNavClick('contact', '/admin/contact')}
                    title="Open Contact Us & Customer Inquiries Desk"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors flex items-center justify-center shrink-0">
                        <Mail size={18} />
                      </div>
                      <ArrowUpRight size={14} className="text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex flex-col mt-3.5 min-w-0">
                      <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                        {liveAnalytics.totalLeads ?? 0}
                      </span>
                      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate mt-0.5">
                        Leads Desk
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" title="Customer Callbacks & Desk Queries">
                        Callbacks &amp; Desk
                      </span>
                    </div>
                  </Card>

                  {/* 9. Discount Coupons */}
                  <Card
                    className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150 p-6 flex flex-col justify-between min-h-[156px]"
                    onClick={() => handleNavClick('coupons', '/admin/coupons')}
                    title="Open Discount Coupons & Promo Offers"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors flex items-center justify-center shrink-0">
                        <Tag size={18} />
                      </div>
                      <ArrowUpRight size={14} className="text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex flex-col mt-3.5 min-w-0">
                      <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                        {liveAnalytics.totalCoupons ?? 0}
                      </span>
                      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate mt-0.5">
                        Coupons
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" title="Promo Discounts & Concessions">
                        Fee Concessions
                      </span>
                    </div>
                  </Card>
                </div>

                {/* ─── 2-COLUMN ASYMMETRIC BENTO GRID (Left minmax(0,1fr) / Right 380px) ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
                  {/* LEFT COLUMN (Analytics & Visual Trend Graphs) */}
                  <div className="min-w-0 flex flex-col gap-6">
                    <UsersAnalyticsCard />
                    <OrdersAnalyticsCard />
                  </div>

                  {/* RIGHT COLUMN (380px Width — Compact Metric Gauges & Transactions Table) */}
                  <div className="w-full lg:w-[380px] min-w-0 flex flex-col gap-6">
                    {/* Top Metric Card 1: Fee Collections */}
                    <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                              <Receipt size={18} />
                            </div>
                            <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                              Fee Collections
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2.5 mt-2 flex-wrap">
                            <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                              ₹{liveAnalytics.grossRevenue.toLocaleString('en-IN')}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 tabular-nums">
                              {liveAnalytics.revenueGrowth}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Verified offline &amp; online payments
                          </span>
                        </div>
                        <div className="shrink-0 flex flex-col items-center gap-1" title="Monthly collection goal: ₹25L target">
                          <CircularProgressRing
                            progress={Math.min(100, Math.max(15, Math.round((liveAnalytics.grossRevenue / 2500000) * 100)))}
                            size={56}
                            strokeWidth={4}
                            strokeColor="#10B981"
                            trackColor="var(--border)"
                          />
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">Goal %</span>
                        </div>
                      </div>
                    </Card>

                    {/* Top Metric Card 2: Enrolled Aspirants */}
                    <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                              <Users size={18} />
                            </div>
                            <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                              Enrolled Aspirants
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2.5 mt-2 flex-wrap">
                            <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                              {liveAnalytics.totalStudents || liveAnalytics.totalEnrolments}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 tabular-nums">
                              {liveAnalytics.studentsGrowth}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Active students enrolled across all batches
                          </span>
                        </div>
                        <div className="shrink-0 flex flex-col items-center gap-1" title="Capacity utilization based on 500 max student capacity">
                          <CircularProgressRing
                            progress={Math.min(100, Math.max(10, Math.round(((liveAnalytics.totalStudents || liveAnalytics.totalEnrolments) / 500) * 100)))}
                            size={56}
                            strokeWidth={4}
                            strokeColor="#2563EB"
                            trackColor="var(--border)"
                          />
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">Capacity</span>
                        </div>
                      </div>
                    </Card>

                    {/* Bottom Card: Recent Transactions (Live Admissions & Invoices Table) */}
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
