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
          totalPaidLectures: res.summary.totalPaidLectures ?? 0
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
              <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-8">
                {/* ─── EXECUTIVE COMMAND HEADER STRIP ─── */}
                <Card className="border-border/70 bg-card/70 backdrop-blur-xs p-5 shadow-xs rounded-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-md bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
                        <ShieldCheck size={22} />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2.5">
                          <h1 className="text-md font-bold tracking-tight text-foreground">
                            Welcome, {admin?.name || 'Admin'}!
                          </h1>
                          <Badge variant="outline" className="gap-1.5 py-0.5 px-2 text-xs font-medium border-border/80 text-muted-foreground bg-background rounded-md">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Live Sync</span>
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Real-time admissions, active curriculum, CBT simulations, and verified fee collections across DK Academy JEE
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchAnalytics}
                        disabled={isSyncing}
                        className="h-8 gap-2 text-xs font-medium rounded-md border-border/80 bg-background shadow-xs hover:bg-muted"
                        title="Refresh live metrics"
                      >
                        <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setIsCommandPaletteOpen(true)}
                        className="h-8 gap-2 text-xs font-medium rounded-md bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                        title="Open Command Palette (Ctrl+K)"
                      >
                        <span>Quick Actions</span>
                        <kbd className="hidden sm:inline-block font-mono text-xs bg-primary-foreground/20 text-primary-foreground px-1.5 py-0.5 rounded-md font-semibold">
                          ⌘K
                        </kbd>
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* ─── 9-MODULE CORE ACADEMIC & DATA BENTO STRIP ─── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-9 gap-3">
                  {/* 1. Student Management */}
                  <Card
                    className="group cursor-pointer border-border/70 bg-card hover:bg-accent/40 hover:border-border transition-all duration-150 p-3.5 flex flex-col justify-between shadow-xs hover:shadow-sm rounded-xl"
                    onClick={() => handleNavClick('students', '/admin/students')}
                    title="Open Student Management"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-8 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center">
                        <Users size={16} />
                      </div>
                      <ArrowUpRight size={13} className="text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="flex flex-col gap-0.5 mt-2">
                      <span className="text-base font-bold tabular-nums tracking-tight text-foreground">
                        {liveAnalytics.totalStudents}
                      </span>
                      <span className="text-xs font-semibold text-foreground truncate">
                        Students
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        Roster &amp; Batches
                      </span>
                    </div>
                  </Card>

                  {/* 2. Teachers & Admin */}
                  <Card
                    className="group cursor-pointer border-border/70 bg-card hover:bg-accent/40 hover:border-border transition-all duration-150 p-3.5 flex flex-col justify-between shadow-xs hover:shadow-sm rounded-xl"
                    onClick={() => handleNavClick('teachers', '/admin/teachers')}
                    title="Open Teachers & Admin"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-8 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center">
                        <ShieldCheck size={16} />
                      </div>
                      <ArrowUpRight size={13} className="text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="flex flex-col gap-0.5 mt-2">
                      <span className="text-base font-bold tabular-nums tracking-tight text-foreground">
                        {liveAnalytics.totalTeachers}
                      </span>
                      <span className="text-xs font-semibold text-foreground truncate">
                        Faculty
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        RBAC Control
                      </span>
                    </div>
                  </Card>

                  {/* 3. Invoices & Fee Slips */}
                  <Card
                    className="group cursor-pointer border-border/70 bg-card hover:bg-accent/40 hover:border-border transition-all duration-150 p-3.5 flex flex-col justify-between shadow-xs hover:shadow-sm rounded-xl"
                    onClick={() => handleNavClick('invoices', '/admin/invoices')}
                    title="Open Invoices & Fee Slips"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-8 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center">
                        <CreditCard size={16} />
                      </div>
                      <ArrowUpRight size={13} className="text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="flex flex-col gap-0.5 mt-2">
                      <span className="text-base font-bold tabular-nums tracking-tight text-foreground">
                        ₹{(liveAnalytics.grossRevenue / 100000).toFixed(1)}L
                      </span>
                      <span className="text-xs font-semibold text-foreground truncate">
                        Invoices
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        Slips &amp; Razorpay
                      </span>
                    </div>
                  </Card>

                  {/* 4. Course Builder */}
                  <Card
                    className="group cursor-pointer border-border/70 bg-card hover:bg-accent/40 hover:border-border transition-all duration-150 p-3.5 flex flex-col justify-between shadow-xs hover:shadow-sm rounded-xl"
                    onClick={() => handleNavClick('courses', '/admin/courses/create')}
                    title="Open Course Builder"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-8 rounded-md bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 flex items-center justify-center">
                        <PlusSquare size={16} />
                      </div>
                      <ArrowUpRight size={13} className="text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="flex flex-col gap-0.5 mt-2">
                      <span className="text-base font-bold tabular-nums tracking-tight text-foreground">
                        {liveAnalytics.totalCourses}
                      </span>
                      <span className="text-xs font-semibold text-foreground truncate">
                        Courses
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        Batches &amp; Vault
                      </span>
                    </div>
                  </Card>

                  {/* 5. Test Series */}
                  <Card
                    className="group cursor-pointer border-border/70 bg-card hover:bg-accent/40 hover:border-border transition-all duration-150 p-3.5 flex flex-col justify-between shadow-xs hover:shadow-sm rounded-xl"
                    onClick={() => handleNavClick('test-series', '/admin/test-series')}
                    title="Open Test Series Engine"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-8 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center">
                        <FileText size={16} />
                      </div>
                      <ArrowUpRight size={13} className="text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="flex flex-col gap-0.5 mt-2">
                      <span className="text-base font-bold tabular-nums tracking-tight text-foreground">
                        {liveAnalytics.totalTestSeries}
                      </span>
                      <span className="text-xs font-semibold text-foreground truncate">
                        Test Series
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        CBT Simulator
                      </span>
                    </div>
                  </Card>

                  {/* 6. DPP & PYQ Practice */}
                  <Card
                    className="group cursor-pointer border-border/70 bg-card hover:bg-accent/40 hover:border-border transition-all duration-150 p-3.5 flex flex-col justify-between shadow-xs hover:shadow-sm rounded-xl"
                    onClick={() => handleNavClick('dpp-pyq', '/admin/dpp-pyq')}
                    title="Open DPP & PYQ Practice"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-8 rounded-md bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400 flex items-center justify-center">
                        <Crosshair size={16} />
                      </div>
                      <ArrowUpRight size={13} className="text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="flex flex-col gap-0.5 mt-2">
                      <span className="text-base font-bold tabular-nums tracking-tight text-foreground">
                        {liveAnalytics.totalDppPyq}
                      </span>
                      <span className="text-xs font-semibold text-foreground truncate">
                        DPP &amp; PYQ
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        Daily Drills
                      </span>
                    </div>
                  </Card>

                  {/* 7. Free Lectures */}
                  <Card
                    className="group cursor-pointer border-border/70 bg-card hover:bg-accent/40 hover:border-border transition-all duration-150 p-3.5 flex flex-col justify-between shadow-xs hover:shadow-sm rounded-xl"
                    onClick={() => handleNavClick('free-lectures', '/admin/free-lectures')}
                    title="Open Free Lectures Create"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-8 rounded-md bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 flex items-center justify-center">
                        <Video size={16} />
                      </div>
                      <ArrowUpRight size={13} className="text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="flex flex-col gap-0.5 mt-2">
                      <span className="text-base font-bold tabular-nums tracking-tight text-foreground">
                        {liveAnalytics.totalFreeLectures}
                      </span>
                      <span className="text-xs font-semibold text-foreground truncate">
                        Free Lectures
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        Lecture Library
                      </span>
                    </div>
                  </Card>

                  {/* 8. Contact Us & Leads Desk */}
                  <Card
                    className="group cursor-pointer border-border/70 bg-card hover:bg-accent/40 hover:border-border transition-all duration-150 p-3.5 flex flex-col justify-between shadow-xs hover:shadow-sm rounded-xl"
                    onClick={() => handleNavClick('contact', '/admin/contact')}
                    title="Open Contact Us & Customer Inquiries Desk"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-8 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center">
                        <Mail size={16} />
                      </div>
                      <ArrowUpRight size={13} className="text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="flex flex-col gap-0.5 mt-2">
                      <span className="text-base font-bold tabular-nums tracking-tight text-foreground">
                        Leads
                      </span>
                      <span className="text-xs font-semibold text-foreground truncate">
                        Inquiries Desk
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        Callbacks &amp; Desk
                      </span>
                    </div>
                  </Card>

                  {/* 9. Discount Coupons */}
                  <Card
                    className="group cursor-pointer border-border/70 bg-card hover:bg-accent/40 hover:border-border transition-all duration-150 p-3.5 flex flex-col justify-between shadow-xs hover:shadow-sm rounded-xl"
                    onClick={() => handleNavClick('coupons', '/admin/coupons')}
                    title="Open Discount Coupons & Promo Offers"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-8 rounded-md bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 flex items-center justify-center">
                        <Tag size={16} />
                      </div>
                      <ArrowUpRight size={13} className="text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="flex flex-col gap-0.5 mt-2">
                      <span className="text-base font-bold tabular-nums tracking-tight text-foreground">
                        Coupons
                      </span>
                      <span className="text-xs font-semibold text-foreground truncate">
                        Promotions
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        Fee Concessions
                      </span>
                    </div>
                  </Card>
                </div>

                {/* ─── 2-COLUMN ASYMMETRIC BENTO GRID (Left 8 cols / Right 4 cols) ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* LEFT COLUMN (~67% Width — Analytics & Visual Trend Graphs) */}
                  <div className="lg:col-span-8 flex flex-col gap-6">
                    <UsersAnalyticsCard />
                    <OrdersAnalyticsCard />
                  </div>

                  {/* RIGHT COLUMN (~33% Width — Compact Metric Gauges & Live Stream) */}
                  <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Top Metric Card 1: Fee Collections */}
                    <Card className="border-border/60 bg-card p-5 shadow-xs rounded-xl">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center">
                              <Receipt size={16} />
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground">Fee Collections</span>
                          </div>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                              ₹{liveAnalytics.grossRevenue.toLocaleString('en-IN')}
                            </span>
                            <Badge variant="secondary" className="text-xs font-semibold py-0.5 px-2 tabular-nums text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 rounded-md">
                              {liveAnalytics.revenueGrowth}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Verified offline &amp; online payments
                          </span>
                        </div>
                        <div className="shrink-0">
                          <CircularProgressRing
                            progress={Math.min(100, Math.max(15, Math.round((liveAnalytics.grossRevenue / 2500000) * 100)))}
                            size={54}
                            strokeWidth={5}
                            strokeColor="#10B981"
                            trackColor="#E2E8F0"
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Top Metric Card 2: Enrolled Aspirants */}
                    <Card className="border-border/60 bg-card p-5 shadow-xs rounded-xl">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center">
                              <Users size={16} />
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground">Enrolled Aspirants</span>
                          </div>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                              {liveAnalytics.totalEnrolments}
                            </span>
                            <Badge variant="secondary" className="text-xs font-semibold py-0.5 px-2 tabular-nums text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 rounded-md">
                              {liveAnalytics.studentsGrowth}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Active students enrolled in batches
                          </span>
                        </div>
                        <div className="shrink-0">
                          <CircularProgressRing
                            progress={Math.min(100, Math.max(20, Math.round((liveAnalytics.totalEnrolments / 50) * 100)))}
                            size={54}
                            strokeWidth={5}
                            strokeColor="#4F46E5"
                            trackColor="#E2E8F0"
                          />
                        </div>
                      </div>
                    </Card>

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
