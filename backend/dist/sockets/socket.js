import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from '../config/env.js';
import { createRedisClient } from '../config/redis.js';
let io = null;
const allowedOrigins = env.ALLOWED_ORIGINS_ARRAY;
export const initSocket = (server) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: (origin, callback) => {
                // Allow requests with no origin (like mobile apps, curl, or same-origin)
                if (!origin)
                    return callback(null, true);
                // Always allow localhost and loopback IP origins on any port for local development
                if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
                    return callback(null, true);
                }
                // Always allow production domain dkacademyjee.com and its subdomains
                if (/^https?:\/\/([a-zA-Z0-9-]+\.)*dkacademyjee\.com(:\d+)?$/.test(origin)) {
                    return callback(null, true);
                }
                // Check configured allowedOrigins from environment
                if (allowedOrigins.includes('*') ||
                    allowedOrigins.some((allowed) => allowed === origin || (allowed && allowed.includes(origin)))) {
                    return callback(null, true);
                }
                // Fallback: permit connection to prevent WebSocket handshake failures
                return callback(null, true);
            },
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            credentials: true
        },
        maxHttpBufferSize: 1e6, // 1MB payload ceiling
        pingTimeout: 20000,
        pingInterval: 25000
    });
    // Attach Redis adapter if REDIS_URL is provided (enables cross-worker event broadcasting)
    if (env.REDIS_URL && env.REDIS_URL.trim() !== '') {
        try {
            const pubClient = createRedisClient();
            const subClient = pubClient ? pubClient.duplicate() : null;
            if (pubClient && subClient) {
                pubClient.on('error', (err) => {
                    console.warn('[Socket.io Redis pubClient] Warning:', err.message);
                });
                subClient.on('error', (err) => {
                    console.warn('[Socket.io Redis subClient] Warning:', err.message);
                });
                Promise.all([pubClient.connect(), subClient.connect()])
                    .then(() => {
                    io.adapter(createAdapter(pubClient, subClient));
                    console.log('[Socket.io] Redis adapter attached for multi-worker scaling.');
                })
                    .catch((err) => {
                    console.warn('[Socket.io] Redis adapter failed to connect, continuing with in-memory adapter:', err.message);
                });
            }
        }
        catch (err) {
            console.warn('[Socket.io] Could not initialize Redis adapter:', err.message);
        }
    }
    // Optional handshake authentication middleware
    io.use((socket, next) => {
        try {
            const rawToken = socket.handshake.auth?.token ||
                socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');
            if (rawToken && typeof rawToken === 'string') {
                const decoded = jwt.verify(rawToken, env.JWT_SECRET, { algorithms: ['HS256'] });
                socket.data.user = decoded;
            }
        }
        catch {
            // Allow connection even if token expired or invalid, socket.data.user remains undefined
        }
        next();
    });
    io.on('connection', (socket) => {
        // Simple per-socket message rate limiting (max 30 events per 10 seconds)
        let eventCount = 0;
        const rateLimitTimer = setInterval(() => {
            eventCount = 0;
        }, 10000);
        const isRateLimited = () => {
            eventCount++;
            return eventCount > 30;
        };
        // Client-side authentication event
        socket.on('authenticate', (data) => {
            try {
                if (!data?.token || typeof data.token !== 'string')
                    return;
                const decoded = jwt.verify(data.token, env.JWT_SECRET, { algorithms: ['HS256'] });
                socket.data.user = decoded;
                // Auto-join admin room if role permits
                if (['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'FACULTY', 'LEAD_MANAGER'].includes(decoded.role)) {
                    socket.join('admin_room');
                }
                socket.emit('authenticated', { userId: decoded.id, role: decoded.role });
            }
            catch (err) {
                socket.emit('auth_error', { message: 'Invalid token' });
            }
        });
        // Join room with authorization validation
        socket.on('join_room', (room) => {
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
                    socket.emit('unauthorized_room', { room });
                    return;
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
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io has not been initialized yet!');
    }
    return io;
};
// Real-time broadcast helpers
export const broadcastNewLead = (lead) => {
    if (io) {
        io.emit('new_lead', lead);
    }
};
export const broadcastLeadUpdated = (lead) => {
    if (io) {
        io.emit('lead_updated', lead);
    }
};
export const broadcastLeadDeleted = (leadId) => {
    if (io) {
        io.emit('lead_deleted', { id: leadId });
    }
};
export const broadcastCMSUpdated = (type, id, data) => {
    if (io) {
        io.emit('cms_updated', { type, id, data, timestamp: Date.now() });
    }
};
export const broadcastCourseCreated = (course) => {
    if (io) {
        console.log(`[Socket.IO] Emitting course:created for: ${course.title || course.slug}`);
        io.emit('course:created', course);
        io.emit('cms_updated', { type: 'courses', action: 'create', data: course, timestamp: Date.now() });
    }
};
export const broadcastCourseUpdated = (course) => {
    if (io) {
        console.log(`[Socket.IO] Emitting course:updated for: ${course.title || course.slug}`);
        io.emit('course:updated', course);
        io.emit('cms_updated', { type: 'courses', action: 'update', data: course, timestamp: Date.now() });
    }
};
export const broadcastCourseDeleted = (courseId) => {
    if (io) {
        console.log(`[Socket.IO] Emitting course:deleted for: ${courseId}`);
        io.emit('course:deleted', { id: courseId });
        io.emit('cms_updated', { type: 'courses', action: 'delete', id: courseId, timestamp: Date.now() });
    }
};
export const broadcastPaymentSuccess = (paymentData) => {
    if (io) {
        console.log(`[Socket.IO] Emitting payment:success for order: ${paymentData.orderId || paymentData.paymentId}`);
        io.emit('payment:success', paymentData);
        io.emit('order:created', paymentData);
        io.emit('cms_updated', { type: 'enrollment', data: paymentData, timestamp: Date.now() });
    }
};
export const broadcastAnnouncement = (announcement) => {
    if (io) {
        io.emit('announcement_broadcast', announcement);
    }
};
export const broadcastStudentRegistered = (student) => {
    if (io) {
        io.emit('student_registered', student);
    }
};
export const broadcastTestSeriesCreated = (testSeries) => {
    if (io) {
        console.log(`[Socket.IO] Emitting test_series:created for: ${testSeries.title || testSeries.slug}`);
        io.emit('test_series:created', testSeries);
        io.emit('cms_updated', { type: 'test_series', action: 'create', data: testSeries, timestamp: Date.now() });
    }
};
export const broadcastTestSeriesUpdated = (testSeries) => {
    if (io) {
        console.log(`[Socket.IO] Emitting test_series:updated for: ${testSeries.title || testSeries.slug}`);
        io.emit('test_series:updated', testSeries);
        io.emit('cms_updated', { type: 'test_series', action: 'update', data: testSeries, timestamp: Date.now() });
    }
};
export const broadcastTestSeriesDeleted = (testSeriesId) => {
    if (io) {
        console.log(`[Socket.IO] Emitting test_series:deleted for: ${testSeriesId}`);
        io.emit('test_series:deleted', { id: testSeriesId });
        io.emit('cms_updated', { type: 'test_series', action: 'delete', id: testSeriesId, timestamp: Date.now() });
    }
};
export const broadcastDppPyqCreated = (item) => {
    if (io) {
        const rawType = (item.moduleType || item.type || 'DPP').toString().toUpperCase();
        const isBitsat = rawType === 'BITSAT' || (item.badgeCode && item.badgeCode.includes('BITSAT')) || (item.title && item.title.includes('BITSAT'));
        const isPyq = !isBitsat && (rawType === 'PYQ' || (item.badgeCode && item.badgeCode.includes('PYQ')) || (item.title && item.title.includes('PYQ')));
        let notifTitle = `📝 New DPP Sheet: ${item.title || item.chapter || 'Practice Problem'}`;
        let notifRoute = '/dpp';
        if (isBitsat) {
            notifTitle = `⚡ New BITSAT Speed Drill: ${item.title || 'BITSAT Speed Test'}`;
            notifRoute = '/bitsat';
        }
        else if (isPyq) {
            notifTitle = `📚 New PYQ Archive: ${item.title || 'Solved Past Year Archive'}`;
            notifRoute = '/pyq';
        }
        console.log(`[Socket.IO] Emitting dpp_pyq:created for: ${item.title || item.slug}`);
        io.emit('dpp_pyq:created', item);
        io.emit('cms_updated', { type: 'dpp_pyq', action: 'create', data: item, timestamp: Date.now() });
        io.emit('notification:new', {
            title: notifTitle,
            description: `${item.subject || 'All Subjects'} • ${item.questionsCount || item.questions?.length || 20} Questions`,
            route: notifRoute,
            meta: item,
            timestamp: Date.now()
        });
    }
};
export const broadcastDppPyqUpdated = (item) => {
    if (io) {
        console.log(`[Socket.IO] Emitting dpp_pyq:updated for: ${item.title || item.slug}`);
        io.emit('dpp_pyq:updated', item);
        io.emit('cms_updated', { type: 'dpp_pyq', action: 'update', data: item, timestamp: Date.now() });
    }
};
export const broadcastDppPyqDeleted = (itemId) => {
    if (io) {
        console.log(`[Socket.IO] Emitting dpp_pyq:deleted for: ${itemId}`);
        io.emit('dpp_pyq:deleted', { id: itemId });
        io.emit('cms_updated', { type: 'dpp_pyq', action: 'delete', id: itemId, timestamp: Date.now() });
    }
};
export const broadcastFreeLectureCreated = (item) => {
    if (io) {
        console.log(`[Socket.IO] Emitting free_lecture:created for: ${item.title || item.id}`);
        io.emit('free_lecture:created', item);
        io.emit('cms_updated', { type: 'free_lecture', action: 'create', data: item, timestamp: Date.now() });
    }
};
export const broadcastFreeLectureUpdated = (item) => {
    if (io) {
        console.log(`[Socket.IO] Emitting free_lecture:updated for: ${item.title || item.id}`);
        io.emit('free_lecture:updated', item);
        io.emit('cms_updated', { type: 'free_lecture', action: 'update', data: item, timestamp: Date.now() });
    }
};
export const broadcastFreeLectureDeleted = (itemId) => {
    if (io) {
        console.log(`[Socket.IO] Emitting free_lecture:deleted for: ${itemId}`);
        io.emit('free_lecture:deleted', { id: itemId });
        io.emit('cms_updated', { type: 'free_lecture', action: 'delete', id: itemId, timestamp: Date.now() });
    }
};
export const broadcastDoubtAnswered = (doubt) => {
    if (io) {
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
        io.emit('cms_updated', { type: 'doubts', action: 'answer', data: doubt, timestamp: Date.now() });
    }
};
export const broadcastNewDoubt = (doubt) => {
    if (io) {
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
export const broadcastReviewCreated = (review) => {
    if (io) {
        console.log(`[Socket.IO] Emitting review:created from: ${review.studentName}`);
        io.emit('review:created', review);
        io.emit('cms_updated', { type: 'reviews', action: 'create', data: review, timestamp: Date.now() });
    }
};
export const broadcastReviewUpdated = (review) => {
    if (io) {
        console.log(`[Socket.IO] Emitting review:updated: ${review._id || review.id}`);
        io.emit('review:updated', review);
        io.emit('cms_updated', { type: 'reviews', action: 'update', data: review, timestamp: Date.now() });
    }
};
export const broadcastReviewDeleted = (reviewId) => {
    if (io) {
        console.log(`[Socket.IO] Emitting review:deleted: ${reviewId}`);
        io.emit('review:deleted', { id: reviewId });
        io.emit('cms_updated', { type: 'reviews', action: 'delete', id: reviewId, timestamp: Date.now() });
    }
};
