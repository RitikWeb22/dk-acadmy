import { Server as SocketIOServer, Socket } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

let io: SocketIOServer | null = null;

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
].filter(Boolean) as string[];

export const initSocket = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl or server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.some((allowed) => allowed === origin || (allowed && allowed.includes(origin)))) {
          return callback(null, true);
        }
        // In development, allow localhost variations
        if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
          return callback(null, true);
        }
        return callback(new Error('CORS policy: Socket origin not allowed'), false);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    },
    maxHttpBufferSize: 1e6, // 1MB payload ceiling
    pingTimeout: 20000,
    pingInterval: 25000
  });

  // Optional handshake authentication middleware
  io.use((socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');

      if (rawToken && typeof rawToken === 'string') {
        const secret = process.env.JWT_SECRET || 'jwt_secret_dk_institute_jee_2026';
        const decoded = jwt.verify(rawToken, secret) as any;
        socket.data.user = decoded;
      }
    } catch {
      // Allow connection even if token expired or invalid, socket.data.user remains undefined
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    // Simple per-socket message rate limiting (max 30 events per 10 seconds)
    let eventCount = 0;
    const rateLimitTimer = setInterval(() => {
      eventCount = 0;
    }, 10000);

    const isRateLimited = (): boolean => {
      eventCount++;
      return eventCount > 30;
    };

    // Client-side authentication event
    socket.on('authenticate', (data: { token?: string }) => {
      try {
        if (!data?.token || typeof data.token !== 'string') return;
        const secret = process.env.JWT_SECRET || 'jwt_secret_dk_institute_jee_2026';
        const decoded = jwt.verify(data.token, secret) as any;
        socket.data.user = decoded;

        // Auto-join admin room if role permits
        if (['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'FACULTY', 'LEAD_MANAGER'].includes(decoded.role)) {
          socket.join('admin_room');
        }
        socket.emit('authenticated', { userId: decoded.id, role: decoded.role });
      } catch (err) {
        socket.emit('auth_error', { message: 'Invalid token' });
      }
    });

    // Join room with authorization validation
    socket.on('join_room', (room: string) => {
      if (isRateLimited()) {
        socket.emit('error', { message: 'Rate limit exceeded' });
        return;
      }

      if (!room || typeof room !== 'string' || room.length > 64 || !/^[a-zA-Z0-9_\-:]+$/.test(room)) {
        return;
      }

      const restrictedAdminRooms = ['admin_room', 'counselor_room', 'staff_room'];
      if (restrictedAdminRooms.includes(room)) {
        const userRole = socket.data?.user?.role;
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'FACULTY', 'LEAD_MANAGER'];
        if (!userRole || !allowedRoles.includes(userRole)) {
          // If in development mode or non-strict dev environment, log warning
          if (process.env.NODE_ENV === 'production') {
            socket.emit('unauthorized_room', { room });
            return;
          }
        }
      }

      socket.join(room);
    });

    socket.on('disconnect', () => {
      clearInterval(rateLimitTimer);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};

// Real-time broadcast helpers
export const broadcastNewLead = (lead: any): void => {
  if (io) {
    io.emit('new_lead', lead);
  }
};

export const broadcastLeadUpdated = (lead: any): void => {
  if (io) {
    io.emit('lead_updated', lead);
  }
};

export const broadcastLeadDeleted = (leadId: string): void => {
  if (io) {
    io.emit('lead_deleted', { id: leadId });
  }
};

export const broadcastCMSUpdated = (type: string, id?: string, data?: any): void => {
  if (io) {
    io.emit('cms_updated', { type, id, data, timestamp: Date.now() });
  }
};

export const broadcastCourseCreated = (course: any): void => {
  if (io) {
    console.log(`[Socket.IO] Emitting course:created for: ${course.title || course.slug}`);
    io.emit('course:created', course);
    io.emit('cms_updated', { type: 'courses', action: 'create', data: course, timestamp: Date.now() });
  }
};

export const broadcastCourseUpdated = (course: any): void => {
  if (io) {
    console.log(`[Socket.IO] Emitting course:updated for: ${course.title || course.slug}`);
    io.emit('course:updated', course);
    io.emit('cms_updated', { type: 'courses', action: 'update', data: course, timestamp: Date.now() });
  }
};

export const broadcastCourseDeleted = (courseId: string): void => {
  if (io) {
    console.log(`[Socket.IO] Emitting course:deleted for: ${courseId}`);
    io.emit('course:deleted', { id: courseId });
    io.emit('cms_updated', { type: 'courses', action: 'delete', id: courseId, timestamp: Date.now() });
  }
};

export const broadcastPaymentSuccess = (paymentData: any): void => {
  if (io) {
    console.log(`[Socket.IO] Emitting payment:success for order: ${paymentData.orderId || paymentData.paymentId}`);
    io.emit('payment:success', paymentData);
    io.emit('order:created', paymentData);
    io.emit('cms_updated', { type: 'enrollment', data: paymentData, timestamp: Date.now() });
  }
};

export const broadcastAnnouncement = (announcement: any): void => {
  if (io) {
    io.emit('announcement_broadcast', announcement);
  }
};

export const broadcastStudentRegistered = (student: any): void => {
  if (io) {
    io.emit('student_registered', student);
  }
};

export const broadcastTestSeriesCreated = (testSeries: any): void => {
  if (io) {
    console.log(`[Socket.IO] Emitting test_series:created for: ${testSeries.title || testSeries.slug}`);
    io.emit('test_series:created', testSeries);
    io.emit('cms_updated', { type: 'test_series', action: 'create', data: testSeries, timestamp: Date.now() });
  }
};

export const broadcastTestSeriesUpdated = (testSeries: any): void => {
  if (io) {
    console.log(`[Socket.IO] Emitting test_series:updated for: ${testSeries.title || testSeries.slug}`);
    io.emit('test_series:updated', testSeries);
    io.emit('cms_updated', { type: 'test_series', action: 'update', data: testSeries, timestamp: Date.now() });
  }
};

export const broadcastTestSeriesDeleted = (testSeriesId: string): void => {
  if (io) {
    console.log(`[Socket.IO] Emitting test_series:deleted for: ${testSeriesId}`);
    io.emit('test_series:deleted', { id: testSeriesId });
    io.emit('cms_updated', { type: 'test_series', action: 'delete', id: testSeriesId, timestamp: Date.now() });
  }
};

export const broadcastDppPyqCreated = (item: any): void => {
  if (io) {
    console.log(`[Socket.IO] Emitting dpp_pyq:created for: ${item.title || item.slug}`);
    io.emit('dpp_pyq:created', item);
    io.emit('cms_updated', { type: 'dpp_pyq', action: 'create', data: item, timestamp: Date.now() });
  }
};

export const broadcastDppPyqUpdated = (item: any): void => {
  if (io) {
    console.log(`[Socket.IO] Emitting dpp_pyq:updated for: ${item.title || item.slug}`);
    io.emit('dpp_pyq:updated', item);
    io.emit('cms_updated', { type: 'dpp_pyq', action: 'update', data: item, timestamp: Date.now() });
  }
};

export const broadcastDppPyqDeleted = (itemId: string): void => {
  if (io) {
    console.log(`[Socket.IO] Emitting dpp_pyq:deleted for: ${itemId}`);
    io.emit('dpp_pyq:deleted', { id: itemId });
    io.emit('cms_updated', { type: 'dpp_pyq', action: 'delete', id: itemId, timestamp: Date.now() });
  }
};

export const broadcastFreeLectureCreated = (item: any): void => {
  if (io) {
    console.log(`[Socket.IO] Emitting free_lecture:created for: ${item.title || item.id}`);
    io.emit('free_lecture:created', item);
    io.emit('cms_updated', { type: 'free_lecture', action: 'create', data: item, timestamp: Date.now() });
  }
};

export const broadcastFreeLectureUpdated = (item: any): void => {
  if (io) {
    console.log(`[Socket.IO] Emitting free_lecture:updated for: ${item.title || item.id}`);
    io.emit('free_lecture:updated', item);
    io.emit('cms_updated', { type: 'free_lecture', action: 'update', data: item, timestamp: Date.now() });
  }
};

export const broadcastFreeLectureDeleted = (itemId: string): void => {
  if (io) {
    console.log(`[Socket.IO] Emitting free_lecture:deleted for: ${itemId}`);
    io.emit('free_lecture:deleted', { id: itemId });
    io.emit('cms_updated', { type: 'free_lecture', action: 'delete', id: itemId, timestamp: Date.now() });
  }
};

export const broadcastDoubtAnswered = (doubt: any): void => {
  if (io) {
    console.log(`[Socket.IO] Emitting doubt:answered for student: ${doubt.studentEmail} (Doubt ID: ${doubt._id || doubt.id})`);
    const payload = {
      doubtId: doubt._id || doubt.id,
      studentId: doubt.studentId,
      studentName: doubt.studentName,
      studentEmail: doubt.studentEmail,
      courseId: doubt.courseId,
      courseTitle: doubt.courseTitle,
      subject: doubt.subject,
      chapter: doubt.chapter,
      topic: doubt.topic,
      question: doubt.question,
      answer: doubt.answer,
      answeredBy: doubt.answer?.adminName || 'DK Sir (Director)',
      answerText: doubt.answer?.answerText || '',
      answeredAt: doubt.answer?.answeredAt || new Date(),
      timestamp: Date.now()
    };
    // Emit targeted user message and global event
    io.emit('doubt:answered', payload);
    io.emit('notification:new', {
      title: `Doubt Resolved: ${doubt.subject} (${doubt.courseTitle})`,
      description: `Answered by ${doubt.answer?.adminName || 'DK Sir'}: "${doubt.answer?.answerText?.slice(0, 80)}..."`,
      type: 'doubt',
      recipientEmail: doubt.studentEmail,
      timestamp: Date.now(),
      unread: true,
      meta: payload
    });
    io.emit('cms_updated', { type: 'doubts', action: 'answer', data: doubt, timestamp: Date.now() });
  }
};

export const broadcastNewDoubt = (doubt: any): void => {
  if (io) {
    console.log(`[Socket.IO] Emitting doubt:new from student: ${doubt.studentName}`);
    io.emit('doubt:new', doubt);
    io.emit('notification:new', {
      title: `New Doubt Raised by ${doubt.studentName}`,
      description: `${doubt.subject}: "${doubt.question?.slice(0, 80)}..."`,
      type: 'doubt',
      timestamp: Date.now(),
      unread: true,
      meta: doubt
    });
    io.emit('cms_updated', { type: 'doubts', action: 'create', data: doubt, timestamp: Date.now() });
  }
};

export const broadcastReviewCreated = (review: any): void => {
  if (io) {
    console.log(`[Socket.IO] Emitting review:created from: ${review.studentName}`);
    io.emit('review:created', review);
    io.emit('cms_updated', { type: 'reviews', action: 'create', data: review, timestamp: Date.now() });
  }
};

export const broadcastReviewUpdated = (review: any): void => {
  if (io) {
    console.log(`[Socket.IO] Emitting review:updated: ${review._id || review.id}`);
    io.emit('review:updated', review);
    io.emit('cms_updated', { type: 'reviews', action: 'update', data: review, timestamp: Date.now() });
  }
};

export const broadcastReviewDeleted = (reviewId: string): void => {
  if (io) {
    console.log(`[Socket.IO] Emitting review:deleted: ${reviewId}`);
    io.emit('review:deleted', { id: reviewId });
    io.emit('cms_updated', { type: 'reviews', action: 'delete', id: reviewId, timestamp: Date.now() });
  }
};


