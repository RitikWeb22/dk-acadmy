import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Play,
  CheckSquare,
  TrendingUp,
  Receipt,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  PlusSquare,
  PlusCircle,
  FileText,
  Crosshair,
  CloudUpload,
  RefreshCw,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Video,
  Mail,
  Tag,
  Calendar,
  Zap,
  ChevronDown
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
                {/* ─── COCKPIT WELCOME HERO ─── */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#111B34] dark:text-slate-100">
                      Welcome, {admin?.name || 'Ritik'} (Super Admin) 👋
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                      Real-time admissions, live batch curriculum, CBT simulations, and verified fee collections across DK Academy JEE.
                    </p>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-2.5 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      Live Sync Active
                    </span>

                    <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
                      <Calendar size={13} className="text-slate-400" />
                      <span>Nov 8, 2026 – Today</span>
                      <ChevronDown size={13} className="text-slate-400 ml-1" />
                    </div>
                  </div>
                </div>

                {/* ─── 4 CORE HERO PILLARS (Executive KPI Cockpit) ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Fee Collections (Blue Gradient) */}
                  <div
                    className="rounded-2xl border border-blue-100 dark:border-slate-800 bg-gradient-to-br from-[#EEF4FF] via-[#F3F7FF] to-[#DCE8FE] dark:from-slate-900 dark:to-slate-800/80 p-5 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all duration-150"
                    onClick={() => handleNavClick('invoices', '/admin/invoices')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-blue-100/80 dark:bg-blue-950/60 text-[#245BFF] flex items-center justify-center shrink-0">
                        <Users size={19} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-3xl font-extrabold text-[#111B34] dark:text-slate-100 tabular-nums tracking-tight">
                        ₹{liveAnalytics.grossRevenue.toLocaleString('en-IN') || '10'}
                      </div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                        Fee Collections
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        <span>↑</span>
                        <span>{liveAnalytics.revenueGrowth || '+18.4%'}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-2">
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                        Goal: ₹25L | Target: 40%
                      </div>
                      <div className="h-1.5 w-full bg-blue-200/60 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-[#245BFF] rounded-full w-[40%]" />
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Enrolled Aspirants (Purple Gradient) */}
                  <div
                    className="rounded-2xl border border-purple-100 dark:border-slate-800 bg-gradient-to-br from-[#FAF5FF] via-[#FAF5FF] to-[#F3E8FF] dark:from-slate-900 dark:to-slate-800/80 p-5 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all duration-150"
                    onClick={() => handleNavClick('students', '/admin/students')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-purple-100/80 dark:bg-purple-950/60 text-[#7955EF] flex items-center justify-center shrink-0">
                        <UserPlus size={19} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-3xl font-extrabold text-[#111B34] dark:text-slate-100 tabular-nums tracking-tight">
                        {liveAnalytics.totalStudents || 13}
                      </div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                        Enrolled Aspirants
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        <span>↑</span>
                        <span>+13 enrolled</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-2">
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                        Capacity: 500 | Max: 2.6%
                      </div>
                      <div className="h-1.5 w-full bg-purple-200/60 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-[#7955EF] rounded-full w-[15%]" />
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Course Batches (Green Gradient) */}
                  <div
                    className="rounded-2xl border border-emerald-100 dark:border-slate-800 bg-gradient-to-br from-[#F0FDF4] via-[#F4FDF7] to-[#DCFCE7] dark:from-slate-900 dark:to-slate-800/80 p-5 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all duration-150"
                    onClick={() => handleNavClick('courses', '/admin/courses')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 text-[#10B981] flex items-center justify-center shrink-0">
                        <Play size={17} className="fill-[#10B981]" />
                      </div>
                      <TrendingUp size={19} className="text-emerald-500/80" />
                    </div>
                    <div className="mt-4">
                      <div className="text-3xl font-extrabold text-[#111B34] dark:text-slate-100 tabular-nums tracking-tight">
                        {liveAnalytics.totalCourses || 6}
                      </div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                        Course Batches
                      </div>
                      <div className="mt-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/90 text-emerald-700 border border-emerald-200/60 shadow-2xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Live Batches
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 pt-2">
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Target JEE 2026, 2027 &amp; Droppers
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Test Series Mocks (Orange Gradient) */}
                  <div
                    className="rounded-2xl border border-orange-100 dark:border-slate-800 bg-gradient-to-br from-[#FFF7ED] via-[#FFF9F2] to-[#FFEDD5] dark:from-slate-900 dark:to-slate-800/80 p-5 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all duration-150"
                    onClick={() => handleNavClick('test-series', '/admin/test-series')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-orange-100/80 dark:bg-orange-950/60 text-[#F59E0B] flex items-center justify-center shrink-0">
                        <CheckSquare size={18} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-3xl font-extrabold text-[#111B34] dark:text-slate-100 tabular-nums tracking-tight">
                        {liveAnalytics.totalTestSeries || 9}
                      </div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                        Test Series Mocks
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        <span>↑</span>
                        <span>+9 Active</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-2">
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Full-Length CBT Mock Tests
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── 2-COLUMN ASYMMETRIC BENTO GRID (Left minmax(0,1fr) / Right 390px) ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_390px] gap-6 items-start">
                  {/* LEFT COLUMN (Analytics & Visual Trend Graphs) */}
                  <div className="min-w-0 flex flex-col gap-6">
                    <UsersAnalyticsCard />
                    <OrdersAnalyticsCard />
                  </div>

                  {/* RIGHT COLUMN (390px Width — Recent Transactions, Fast Access & Promo Banner) */}
                  <div className="w-full lg:w-[390px] min-w-0 flex flex-col gap-6">
                    {/* Live Financial & Admissions Ledger */}
                    <RecentTransactionsCard />

                    {/* Fast Navigation Quick Action Hub */}
                    <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6">
                      <div className="flex items-center gap-2.5">
                        <Zap size={18} className="text-[#245BFF] fill-[#245BFF]" />
                        <h2 className="text-base font-bold text-[#111B34] dark:text-slate-100 tracking-tight">
                          Quick Administrative Access
                        </h2>
                      </div>
                      <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                        Direct shortcuts to manage curriculum and students
                      </p>

                      <div className="grid grid-cols-2 gap-2.5 mt-4">
                        <button
                          type="button"
                          onClick={() => handleNavClick('courses', '/admin/courses/create')}
                          className="h-11 px-3 rounded-xl border border-slate-200/90 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-[#111B34] dark:text-slate-200 flex items-center justify-between transition-colors shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <PlusCircle size={15} className="text-[#245BFF] shrink-0" />
                            <span className="truncate">New Course</span>
                          </div>
                          <ArrowRight size={13} className="text-slate-400 shrink-0 ml-1" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleNavClick('test-series', '/admin/test-series')}
                          className="h-11 px-3 rounded-xl border border-slate-200/90 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-[#111B34] dark:text-slate-200 flex items-center justify-between transition-colors shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={15} className="text-[#7955EF] shrink-0" />
                            <span className="truncate">New CBT Mock</span>
                          </div>
                          <ArrowRight size={13} className="text-slate-400 shrink-0 ml-1" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleNavClick('dpp-pyq', '/admin/dpp-pyq')}
                          className="h-11 px-3 rounded-xl border border-slate-200/90 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-[#111B34] dark:text-slate-200 flex items-center justify-between transition-colors shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CloudUpload size={15} className="text-[#245BFF] shrink-0" />
                            <span className="truncate">Upload DPP</span>
                          </div>
                          <ArrowRight size={13} className="text-slate-400 shrink-0 ml-1" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleNavClick('invoices', '/admin/invoices')}
                          className="h-11 px-3 rounded-xl border border-slate-200/90 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-[#111B34] dark:text-slate-200 flex items-center justify-between transition-colors shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CreditCard size={15} className="text-[#10B981] shrink-0" />
                            <span className="truncate">Fee Slips</span>
                          </div>
                          <ArrowRight size={13} className="text-slate-400 shrink-0 ml-1" />
                        </button>
                      </div>
                    </Card>

                    {/* DK ACADEMY JEE Promotional Banner */}
                    <div className="relative rounded-2xl bg-gradient-to-r from-[#0A1329] via-[#101C38] to-[#1A2E5A] text-white p-5 overflow-hidden flex items-end justify-between shadow-sm">
                      <div className="flex flex-col z-10 max-w-[210px] pb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
                          DK ACADEMY JEE
                        </span>
                        <h3 className="text-base sm:text-[17px] font-black leading-tight text-amber-400 mt-1">
                          Dream Big. Prepare Better.
                        </h3>
                        <p className="text-xs text-slate-300 mt-1">
                          Your Success is Our Mission 🚀
                        </p>
                        <div>
                          <button
                            type="button"
                            onClick={() => handleNavClick('courses', '/admin/courses')}
                            className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F59E0B] text-slate-950 hover:bg-amber-400 shadow-sm transition-colors"
                          >
                            <span>View Courses</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="absolute right-0 bottom-0 top-0 w-[140px] flex items-end justify-end pointer-events-none">
                        <img
                          src="/img/founder.jpeg"
                          alt="DK Academy Founder"
                          className="h-32 object-contain object-bottom -mb-0.5 rounded-br-2xl"
                        />
                      </div>
                    </div>
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
