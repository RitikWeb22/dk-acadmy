import React, { useEffect, useState, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar/Navbar';
import { Footer } from './components/layout/Footer/Footer';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ToastProvider } from './context/ToastContext';
import { AdminProtectedRoute } from './components/admin/AdminProtectedRoute/AdminProtectedRoute';
import { AdminLayout } from './components/admin/AdminLayout/AdminLayout';
import { TopLoadingBar, PageTransitionWrapper, PageLoader } from './components/ui/PageTransition';
import { FloatingLeadWidget } from './components/leads/FloatingLeadWidget/FloatingLeadWidget';

// Helper for dynamic named imports with React.lazy
const lazyNamed = <T extends Record<string, any>, K extends keyof T>(
  loader: () => Promise<T>,
  key: K
) => React.lazy(() => loader().then((module) => ({ default: module[key] })));

// Public Student Pages (Code-split)
const HomePage = lazyNamed(() => import('./pages/Home/HomePage'), 'HomePage');
const CoursesPage = lazyNamed(() => import('./pages/Courses/CoursesPage'), 'CoursesPage');
const CourseDetailPage = lazyNamed(() => import('./pages/Courses/CourseDetailPage'), 'CourseDetailPage');
const FreeLecturesPage = lazyNamed(() => import('./pages/FreeLectures/FreeLecturesPage'), 'FreeLecturesPage');
const PYQPage = lazyNamed(() => import('./pages/PYQ/PYQPage'), 'PYQPage');
const DPPPage = lazyNamed(() => import('./pages/DPP/DPPPage'), 'DPPPage');
const TestSeriesPage = lazyNamed(() => import('./pages/TestSeries/TestSeriesPage'), 'TestSeriesPage');
const AboutPage = lazyNamed(() => import('./pages/About/AboutPage'), 'AboutPage');
const DashboardPage = lazyNamed(() => import('./pages/Dashboard/DashboardPage'), 'DashboardPage');
const LoginPage = lazyNamed(() => import('./pages/Login/LoginPage'), 'LoginPage');
const SignupPage = lazyNamed(() => import('./pages/Signup/SignupPage'), 'SignupPage');
const ForgotPasswordPage = lazyNamed(() => import('./pages/ForgotPassword/ForgotPasswordPage'), 'ForgotPasswordPage');
const ProfilePage = lazyNamed(() => import('./pages/Profile/ProfilePage'), 'ProfilePage');
const NotificationsPage = lazyNamed(() => import('./pages/Notifications/NotificationsPage'), 'NotificationsPage');
const ResultsPage = lazyNamed(() => import('./pages/Results/ResultsPage'), 'ResultsPage');
const BitsatPage = lazyNamed(() => import('./pages/Bitsat/BitsatPage'), 'BitsatPage');
const PaymentPage = lazyNamed(() => import('./pages/Payment/PaymentPage'), 'PaymentPage');
const CourseCheckout = lazyNamed(() => import('./pages/Payment/CourseCheckout'), 'CourseCheckout');
const LiveClassroomPage = lazyNamed(() => import('./pages/LiveClassroom/LiveClassroomPage'), 'LiveClassroomPage');
const ContactPage = lazyNamed(() => import('./pages/Contact/ContactPage'), 'ContactPage');

// LMS Portal Page (Code-split)
const CourseLmsPage = lazyNamed(() => import('./pages/Lms/CourseLmsPage'), 'CourseLmsPage');
const DynamicCustomPage = lazyNamed(() => import('./pages/DynamicPage/DynamicCustomPage'), 'DynamicCustomPage');

// Dedicated Admin Pages & Workspaces (Code-split)
const AdminLoginPage = lazyNamed(() => import('./pages/Admin/Login/AdminLoginPage'), 'AdminLoginPage');
const AdminDashboardPage = lazyNamed(() => import('./pages/Admin/Dashboard/AdminDashboardPage'), 'AdminDashboardPage');
const LeadsPage = lazyNamed(() => import('./pages/Admin/LeadsPage/LeadsPage'), 'LeadsPage');
const AdminBannersPage = lazyNamed(() => import('./pages/Admin/Banners/AdminBannersPage'), 'AdminBannersPage');
const AdminPagesPage = lazyNamed(() => import('./pages/Admin/Pages/AdminPagesPage'), 'AdminPagesPage');
const AdminCounselorsPage = lazyNamed(() => import('./pages/Admin/Counselors/AdminCounselorsPage'), 'AdminCounselorsPage');
const AdminAnnouncementsPage = lazyNamed(() => import('./pages/Admin/Announcements/AdminAnnouncementsPage'), 'AdminAnnouncementsPage');
const AdminMediaPage = lazyNamed(() => import('./pages/Admin/Media/AdminMediaPage'), 'AdminMediaPage');
const AdminSettingsPage = lazyNamed(() => import('./pages/Admin/Settings/AdminSettingsPage'), 'AdminSettingsPage');
const AdminAuditLogsPage = lazyNamed(() => import('./pages/Admin/AuditLogs/AdminAuditLogsPage'), 'AdminAuditLogsPage');

// Legal & Utility Pages (Code-split)
const PrivacyPage = lazyNamed(() => import('./pages/Legal/PrivacyPage'), 'PrivacyPage');
const TermsPage = lazyNamed(() => import('./pages/Legal/TermsPage'), 'TermsPage');
const NotFoundPage = lazyNamed(() => import('./pages/NotFound/NotFoundPage'), 'NotFoundPage');

// Scroll to top on route change (respecting hash anchors)
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    }
  }, [pathname, hash]);

  return null;
}

export const App: React.FC = () => {
  const location = useLocation();

  const isAuthPortalPage = 
    location.pathname === '/admin/login' || 
    location.pathname === '/faculty/login' || 
    location.pathname === '/staff/login' || 
    location.pathname === '/portal/login' || 
    location.pathname === '/teacher/login';

  const isAdminPortal = !isAuthPortalPage && (
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/counselor') ||
    location.pathname.startsWith('/teacher') ||
    location.pathname.startsWith('/faculty')
  );
  const isLmsPortal = location.pathname.startsWith('/learn') || 
                      location.pathname.startsWith('/lms') || 
                      location.pathname.endsWith('/learn');

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setIsFadingOut(true);
    }, 380);
    const t2 = setTimeout(() => {
      setIsInitialLoading(false);
    }, 620);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <AuthProvider>
      <AdminAuthProvider>
        <ToastProvider>
          <ScrollToTop />
          <TopLoadingBar />

        {isInitialLoading && (
          <PageLoader
            message="DK ACADEMY"
            subMessage="IIT JEE KOTA PEDAGOGY"
            isFadingOut={isFadingOut}
            fullScreen
          />
        )}

        {/* 1. Admin & Faculty Portal Flow (Completely isolated from public navbar & footer) */}
        {isAdminPortal ? (
          <PageTransitionWrapper>
            <Suspense fallback={<PageLoader message="ADMIN PORTAL" isFadingOut={false} fullScreen />}>
              <Routes>
                {/* Dedicated Admin & Teacher Login */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/teacher/login" element={<AdminLoginPage />} />
                <Route path="/faculty/login" element={<AdminLoginPage />} />

                {/* Dedicated Teacher / Faculty Portal Workspace */}
                <Route
                  path="/teacher"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
                      <AdminDashboardPage initialMenu="courses" />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/faculty"
                  element={<Navigate to="/teacher" replace />}
                />

                {/* Admin Dashboard */}
                <Route
                  path="/admin"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
                      <AdminDashboardPage />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
                      <AdminDashboardPage />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/students"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                      <AdminDashboardPage initialMenu="students" />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/teachers"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                      <AdminDashboardPage initialMenu="teachers" />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/faculty"
                  element={<Navigate to="/admin/teachers" replace />}
                />
                <Route
                  path="/admin/invoices"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                      <AdminDashboardPage initialMenu="invoices" />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/leads"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'LEAD_MANAGER']}>
                      <AdminDashboardPage initialMenu="contact" />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/contact"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'LEAD_MANAGER']}>
                      <AdminDashboardPage initialMenu="contact" />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/counselor"
                  element={<Navigate to="/admin/contact" replace />}
                />
                <Route
                  path="/admin/courses"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
                      <AdminDashboardPage initialMenu="courses" />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/courses/create"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
                      <AdminDashboardPage initialMenu="courses" />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/test-series"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
                      <AdminDashboardPage initialMenu="test-series" />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/test-series/create"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
                      <AdminDashboardPage initialMenu="test-series" />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/dpp-pyq"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
                      <AdminDashboardPage initialMenu="dpp-pyq" />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/dpp"
                  element={<Navigate to="/admin/dpp-pyq" replace />}
                />
                <Route
                  path="/admin/pyq"
                  element={<Navigate to="/admin/dpp-pyq" replace />}
                />
                <Route
                  path="/admin/free-lectures"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
                      <AdminDashboardPage initialMenu="free-lectures" />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/lectures"
                  element={<Navigate to="/admin/free-lectures" replace />}
                />
                <Route
                  path="/admin/reviews"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                      <AdminDashboardPage initialMenu="reviews" />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/course-reviews"
                  element={<Navigate to="/admin/reviews" replace />}
                />
                <Route
                  path="/admin/banners"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                      <AdminLayout>
                        <AdminBannersPage />
                      </AdminLayout>
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/pages"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                      <AdminDashboardPage initialMenu="pages" />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/navbar-footer"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                      <AdminDashboardPage initialMenu="navbar-footer" />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/coupons"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                      <AdminDashboardPage initialMenu="coupons" />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/counselors"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                      <AdminLayout>
                        <AdminCounselorsPage />
                      </AdminLayout>
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/announcements"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'COUNSELOR']}>
                      <AdminLayout>
                        <AdminAnnouncementsPage />
                      </AdminLayout>
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/media"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                      <AdminLayout>
                        <AdminMediaPage />
                      </AdminLayout>
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                      <AdminLayout>
                        <AdminSettingsPage />
                      </AdminLayout>
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/audit-logs"
                  element={
                    <AdminProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                      <AdminLayout>
                        <AdminAuditLogsPage />
                      </AdminLayout>
                    </AdminProtectedRoute>
                  }
                />
                {/* Fallback inside admin */}
                <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </Suspense>
          </PageTransitionWrapper>
        ) : isLmsPortal ? (
          /* 2. Interactive Video LMS Player (Distraction-Free Workspace) */
          <PageTransitionWrapper>
            <Suspense fallback={<PageLoader message="LOADING LMS..." isFadingOut={false} fullScreen />}>
              <Routes>
                <Route path="/learn/course/:courseId" element={<CourseLmsPage />} />
                <Route path="/learn/:courseId" element={<CourseLmsPage />} />
                <Route path="/learn/:id" element={<CourseLmsPage />} />
                <Route path="/lms/course/:courseId" element={<CourseLmsPage />} />
                <Route path="/lms/:courseId" element={<CourseLmsPage />} />
                <Route path="/lms/:id" element={<CourseLmsPage />} />
                <Route path="/courses/:courseId/learn" element={<CourseLmsPage />} />
                <Route path="/courses/:id/learn" element={<CourseLmsPage />} />
                <Route path="/learn" element={<Navigate to="/free-lectures" replace />} />
                <Route path="/lms" element={<Navigate to="/free-lectures" replace />} />
                <Route path="*" element={<Navigate to="/courses" replace />} />
              </Routes>
            </Suspense>
          </PageTransitionWrapper>
        ) : (
          /* 3. Public Student Website Flow */
          <div className="app-layout">
            <Navbar />
            <PageTransitionWrapper>
              <Suspense fallback={<PageLoader message="DK ACADEMY" subMessage="Preparing classroom..." isFadingOut={false} fullScreen />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/learn/course/:courseId" element={<CourseLmsPage />} />
                  <Route path="/learn/:courseId" element={<CourseLmsPage />} />
                  <Route path="/learn/:id" element={<CourseLmsPage />} />
                  <Route path="/lms/course/:courseId" element={<CourseLmsPage />} />
                  <Route path="/lms/:courseId" element={<CourseLmsPage />} />
                  <Route path="/lms/:id" element={<CourseLmsPage />} />
                  <Route path="/courses/:courseId/learn" element={<CourseLmsPage />} />
                  <Route path="/courses/:id/learn" element={<CourseLmsPage />} />
                  <Route path="/courses/:courseId" element={<CourseDetailPage />} />
                  <Route path="/courses/:id" element={<CourseDetailPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/free-lectures" element={<FreeLecturesPage />} />
                  <Route path="/pyq" element={<PYQPage />} />
                  <Route path="/dpp" element={<DPPPage />} />
                  <Route path="/test-series" element={<TestSeriesPage />} />
                  <Route path="/results" element={<ResultsPage />} />
                  <Route path="/result" element={<ResultsPage />} />
                  <Route path="/bitsat" element={<BitsatPage />} />
                  <Route path="/payment/:courseId" element={<PaymentPage />} />
                  <Route path="/payment" element={<PaymentPage />} />
                  <Route path="/checkout/:courseId" element={<CourseCheckout />} />
                  <Route path="/checkout" element={<CourseCheckout />} />
                  <Route path="/classroom" element={<LiveClassroomPage />} />
                  <Route path="/live-classroom" element={<LiveClassroomPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route path="/faculty/login" element={<AdminLoginPage />} />
                  <Route path="/staff/login" element={<AdminLoginPage />} />
                  <Route path="/portal/login" element={<AdminLoginPage />} />
                  <Route path="/teacher/login" element={<AdminLoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<ProfilePage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/p/:slug" element={<DynamicCustomPage />} />
                  <Route path="/pages/:slug" element={<DynamicCustomPage />} />
                  <Route path="/coming-soon" element={<Navigate to="/courses" replace />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/refunds" element={<Navigate to="/privacy#refunds" replace />} />
                  <Route path="/cancellation" element={<Navigate to="/privacy#refunds" replace />} />
                  <Route path="/shipping" element={<Navigate to="/privacy#shipping" replace />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/terms-and-conditions" element={<TermsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </PageTransitionWrapper>
            <Footer />
            <FloatingLeadWidget />
          </div>
        )}
          </ToastProvider>
        </AdminAuthProvider>
      </AuthProvider>
  );
};

export default App;
