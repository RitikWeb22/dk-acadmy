/**
 * Real-time Socket.IO Gateway for DK Academy Frontend
 * Listens for live lead submissions, counselor assignments, and CMS updates.
 */

import { io, Socket } from 'socket.io-client';
import { cmsService, CMS_EVENT_KEY } from './cmsService';
import { notificationService } from './notificationService';
import { soundEffects } from '../utils/sound';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

let socket: Socket | null = null;

export const initSocketClient = (): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_SERVER_URL, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000
  });

  // Helper to determine if current browser tab/session is Admin portal
  const isCurrentClientAdmin = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.location.pathname.startsWith('/admin');
  };

  socket.on('connect', () => {
    // Fetch latest courses & CMS configs from MongoDB upon connection
    cmsService.fetchCoursesFromAPI().catch(() => {});
    cmsService.fetchTestSeriesFromAPI().catch(() => {});
    cmsService.fetchNavbarFromAPI().catch(() => {});
    cmsService.fetchFooterFromAPI().catch(() => {});
    cmsService.fetchPagesFromAPI().catch(() => {});

    // Sync initial notifications from MongoDB ONLY when currently inside Admin portal
    if (isCurrentClientAdmin()) {
      notificationService.syncInitialNotifications().catch(() => {});
    }
  });

  // 1. Listen for new incoming prospective leads (Admin Only alert)
  socket.on('new_lead', (lead) => {
    if (isCurrentClientAdmin()) {
      soundEffects.playAdminAlertChime();
      notificationService.addNotification({
        title: `New Inquiry: ${lead.fullName || 'Student'} (${lead.targetCourse || lead.targetExam || 'JEE'})`,
        description: `Mobile: ${lead.mobile || lead.phone || 'N/A'}`,
        type: 'lead',
        timestamp: Date.now(),
        unread: true,
        meta: { ...lead, route: '/admin/students' }
      });
      window.dispatchEvent(new CustomEvent('dk_live_toast', {
        detail: {
          title: '📞 New Prospective Inquiry',
          message: `${lead.fullName || 'Student'} (${lead.targetCourse || lead.targetExam || 'JEE'})`,
          type: 'info'
        }
      }));
    }
    window.dispatchEvent(new CustomEvent('dk_leads_updated', { detail: lead }));
  });

  // 2. Listen for counselor lead updates & deletions
  socket.on('lead_updated', (lead) => {
    window.dispatchEvent(new CustomEvent('dk_leads_updated', { detail: lead }));
  });

  socket.on('lead_deleted', (data) => {
    window.dispatchEvent(new CustomEvent('dk_leads_updated', { detail: data }));
  });

  // 3. Listen for CMS changes (Navbar, Courses, Test Series, DPP, etc.)
  socket.on('cms_updated', (data) => {
    if (data?.type === 'courses' || data?.type === 'enrollment') {
      cmsService.fetchCoursesFromAPI().catch(() => {});
    }
    if (data?.type === 'navbar') {
      cmsService.fetchNavbarFromAPI().catch(() => {});
    }
    if (data?.type === 'footer') {
      cmsService.fetchFooterFromAPI().catch(() => {});
    }
    if (data?.type === 'pages') {
      cmsService.fetchPagesFromAPI().catch(() => {});
    }
    window.dispatchEvent(new CustomEvent(CMS_EVENT_KEY, { detail: data }));
  });

  // 4. Real-time Course Lifecycle Events
  socket.on('course:created', (course) => {
    if (isCurrentClientAdmin()) {
      soundEffects.playNotificationChime();
      notificationService.addNotification({
        title: `New Course Created: ${course?.title || course?.slug}`,
        description: `Fee: ₹${(course?.price || course?.numericPrice || 0).toLocaleString('en-IN')}`,
        type: 'course',
        timestamp: Date.now(),
        unread: true,
        meta: { ...course, route: '/admin/courses/create' }
      });
    }
    cmsService.fetchCoursesFromAPI().catch(() => {});
    window.dispatchEvent(new CustomEvent('dk_course_created', { detail: course }));
    window.dispatchEvent(new CustomEvent(CMS_EVENT_KEY, { detail: { type: 'courses', action: 'create', data: course } }));
  });

  socket.on('course:updated', (course) => {
    cmsService.fetchCoursesFromAPI().catch(() => {});
    window.dispatchEvent(new CustomEvent('dk_course_updated', { detail: course }));
    window.dispatchEvent(new CustomEvent(CMS_EVENT_KEY, { detail: { type: 'courses', action: 'update', data: course } }));
  });

  socket.on('course:deleted', (data) => {
    cmsService.fetchCoursesFromAPI().catch(() => {});
    window.dispatchEvent(new CustomEvent('dk_course_deleted', { detail: data }));
    window.dispatchEvent(new CustomEvent(CMS_EVENT_KEY, { detail: { type: 'courses', action: 'delete', id: data?.id } }));
  });

  // 5. Real-time Payment & Enrollment Events
  socket.on('payment:success', (paymentData) => {
    if (isCurrentClientAdmin()) {
      soundEffects.playAdminAlertChime();
      notificationService.addNotification({
        title: `${paymentData.studentName || 'Student'} paid ₹${(paymentData.amount || 0).toLocaleString('en-IN')} for ${paymentData.courseTitle || 'JEE Course'}`,
        description: `Txn #${paymentData.paymentId || paymentData.orderId} • Status: Confirmed`,
        type: 'payment',
        timestamp: Date.now(),
        unread: true,
        meta: { ...paymentData, route: '/admin/invoices' }
      });
      window.dispatchEvent(new CustomEvent('dk_live_toast', {
        detail: {
          title: '💳 Fee Payment Received',
          message: `${paymentData.studentName || 'Student'} paid ₹${(paymentData.amount || 0).toLocaleString('en-IN')}`,
          type: 'success'
        }
      }));
    }
    window.dispatchEvent(new CustomEvent('dk_payment_success', { detail: paymentData }));
    cmsService.fetchCoursesFromAPI().catch(() => {});
  });

  socket.on('order:created', (orderData) => {
    window.dispatchEvent(new CustomEvent('dk_order_created', { detail: orderData }));
  });

  // 6. Listen for system-wide announcements
  socket.on('announcement_broadcast', (announcement) => {
    soundEffects.playNotificationChime();
    window.dispatchEvent(new CustomEvent('dk_announcement_received', { detail: announcement }));
    window.dispatchEvent(new CustomEvent('dk_live_toast', {
      detail: {
        title: '📢 Notice',
        message: announcement.title || 'New announcement published',
        type: 'info'
      }
    }));
  });

  // 7. Listen for real-time student registrations
  socket.on('student_registered', (student) => {
    if (isCurrentClientAdmin()) {
      soundEffects.playAdminAlertChime();
      notificationService.addNotification({
        title: `New Student Account: ${student.name}`,
        description: `Email: ${student.email}`,
        type: 'student',
        timestamp: Date.now(),
        unread: true,
        meta: { ...student, route: '/admin/students' }
      });
      window.dispatchEvent(new CustomEvent('dk_live_toast', {
        detail: {
          title: '🎓 New Student Account',
          message: `${student.name} (${student.email})`,
          type: 'info'
        }
      }));
    }
    window.dispatchEvent(new CustomEvent('dk_student_registered', { detail: student }));
  });

  // 8. Real-time Test Series Lifecycle Events
  socket.on('test_series:created', (testSeries) => {
    if (isCurrentClientAdmin()) {
      soundEffects.playNotificationChime();
      notificationService.addNotification({
        title: `New CBT Mock Test Scheduled: ${testSeries?.title || testSeries?.slug}`,
        description: `Exam: ${testSeries?.examType || 'JEE'} • ${testSeries?.totalQuestions || 0} Questions • ${testSeries?.durationMinutes || 180} mins`,
        type: 'test_series',
        timestamp: Date.now(),
        unread: true,
        meta: { ...testSeries, route: '/admin/test-series' }
      });
    }
    cmsService.fetchTestSeriesFromAPI().catch(() => {});
    window.dispatchEvent(new CustomEvent('dk_test_series_created', { detail: testSeries }));
    window.dispatchEvent(new CustomEvent(CMS_EVENT_KEY, { detail: { type: 'test_series', action: 'create', data: testSeries } }));
  });

  socket.on('test_series:updated', (testSeries) => {
    cmsService.fetchTestSeriesFromAPI().catch(() => {});
    window.dispatchEvent(new CustomEvent('dk_test_series_updated', { detail: testSeries }));
    window.dispatchEvent(new CustomEvent(CMS_EVENT_KEY, { detail: { type: 'test_series', action: 'update', data: testSeries } }));
  });

  socket.on('test_series:deleted', (data) => {
    cmsService.fetchTestSeriesFromAPI().catch(() => {});
    window.dispatchEvent(new CustomEvent('dk_test_series_deleted', { detail: data }));
    window.dispatchEvent(new CustomEvent(CMS_EVENT_KEY, { detail: { type: 'test_series', action: 'delete', id: data?.id } }));
  });

  // 9. Real-time Student Academic Doubts Events
  socket.on('doubt:answered', (data) => {
    const isAdmin = isCurrentClientAdmin();

    // If client is student (NOT admin portal), play chime and show live alert
    if (!isAdmin) {
      soundEffects.playNotificationChime();
      const snippet = data?.answerText || data?.answer?.answerText || 'Your doubt has been answered by DK Sir.';
      window.dispatchEvent(new CustomEvent('dk_live_toast', {
        detail: {
          title: '✅ Faculty Answered Your Doubt!',
          message: `${data?.answeredBy || 'DK Sir (Director)'}: "${snippet.slice(0, 85)}..."`,
          type: 'success',
          route: `/learn/${data?.courseId || 'jee-main-advanced-2yr-ultimate'}?tab=doubts`
        }
      }));
    }

    window.dispatchEvent(new CustomEvent('dk_doubt_answered', { detail: data }));
    window.dispatchEvent(new CustomEvent(CMS_EVENT_KEY, { detail: { type: 'doubts', action: 'answer', data } }));
  });

  socket.on('doubt:new', (doubt) => {
    const isAdmin = isCurrentClientAdmin();

    // ONLY notify Admin about new incoming student doubts! Student who asked must NOT get self-notification.
    if (isAdmin) {
      soundEffects.playAdminAlertChime();
      notificationService.addNotification({
        title: `❓ New Doubt Raised: ${doubt?.studentName || 'Student'} (${doubt?.subject || 'JEE'})`,
        description: `Q: "${(doubt?.question || '').slice(0, 85)}..."`,
        type: 'doubt',
        timestamp: Date.now(),
        unread: true,
        meta: { ...doubt, route: '/admin/reviews?tab=doubts' }
      });
      window.dispatchEvent(new CustomEvent('dk_live_toast', {
        detail: {
          title: `❓ New Doubt: ${doubt?.studentName || 'Student'} (${doubt?.subject || 'JEE'})`,
          message: `"${(doubt?.question || '').slice(0, 80)}..."`,
          type: 'warning',
          route: '/admin/reviews?tab=doubts'
        }
      }));
    }

    window.dispatchEvent(new CustomEvent('dk_doubt_new', { detail: doubt }));
    window.dispatchEvent(new CustomEvent(CMS_EVENT_KEY, { detail: { type: 'doubts', action: 'create', data: doubt } }));
  });

  // 10. Real-time Course Reviews Events
  socket.on('review:created', (review) => {
    const isAdmin = isCurrentClientAdmin();

    // ONLY notify Admin about newly submitted course reviews!
    if (isAdmin) {
      soundEffects.playNotificationChime();
      notificationService.addNotification({
        title: `⭐ New Course Review: ${review?.studentName} (${review?.rating}★)`,
        description: `"${(review?.title || review?.content || '').slice(0, 80)}..."`,
        type: 'review',
        timestamp: Date.now(),
        unread: true,
        meta: { ...review, route: '/admin/reviews?tab=reviews' }
      });
      window.dispatchEvent(new CustomEvent('dk_live_toast', {
        detail: {
          title: `⭐ New Course Review (${review?.rating}★)`,
          message: `${review?.studentName}: "${(review?.title || review?.content || '').slice(0, 75)}..."`,
          type: 'success',
          route: '/admin/reviews?tab=reviews'
        }
      }));
    }

    window.dispatchEvent(new CustomEvent('dk_review_created', { detail: review }));
    window.dispatchEvent(new CustomEvent(CMS_EVENT_KEY, { detail: { type: 'reviews', action: 'create', data: review } }));
  });

  socket.on('review:updated', (review) => {
    window.dispatchEvent(new CustomEvent('dk_review_updated', { detail: review }));
    window.dispatchEvent(new CustomEvent(CMS_EVENT_KEY, { detail: { type: 'reviews', action: 'update', data: review } }));
  });

  socket.on('review:deleted', (data) => {
    window.dispatchEvent(new CustomEvent('dk_review_deleted', { detail: data }));
    window.dispatchEvent(new CustomEvent(CMS_EVENT_KEY, { detail: { type: 'reviews', action: 'delete', id: data?.id } }));
  });

  socket.on('review:updated', (review) => {
    window.dispatchEvent(new CustomEvent('dk_review_updated', { detail: review }));
    window.dispatchEvent(new CustomEvent(CMS_EVENT_KEY, { detail: { type: 'reviews', action: 'update', data: review } }));
  });

  socket.on('review:deleted', (data) => {
    window.dispatchEvent(new CustomEvent('dk_review_deleted', { detail: data }));
    window.dispatchEvent(new CustomEvent(CMS_EVENT_KEY, { detail: { type: 'reviews', action: 'delete', id: data?.id } }));
  });

  socket.on('disconnect', () => {
    // disconnected
  });


  return socket;
};

export const getSocket = (): Socket | null => socket;
