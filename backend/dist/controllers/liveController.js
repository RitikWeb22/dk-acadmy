import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { env } from '../config/env.js';
import { LiveSession } from '../models/LiveSession.js';
import { User } from '../models/User.js';
/**
 * Generates role-based LiveKit access token
 * Endpoint: POST /api/live/token
 */
export const getLiveToken = async (req, res) => {
    try {
        const { roomId, userId, role, userName, batchId } = req.body;
        if (!roomId) {
            res.status(400).json({ success: false, message: 'Room ID is required' });
            return;
        }
        if (!role) {
            res.status(400).json({ success: false, message: 'Role (teacher or student) is required' });
            return;
        }
        const apiKey = env.LIVEKIT_API_KEY;
        const apiSecret = env.LIVEKIT_API_SECRET;
        const livekitUrl = env.LIVEKIT_URL || 'wss://dk-acadmey-jpdi7yks.livekit.cloud';
        if (!apiKey || !apiSecret) {
            res.status(500).json({
                success: false,
                message: 'LiveKit server credentials are not configured in environment variables'
            });
            return;
        }
        const authUser = req.user;
        const authRole = String(authUser?.role || '').toUpperCase();
        const isAuthFacultyOrAdmin = Boolean(authUser && ['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(authRole));
        const normalizedRole = String(role).trim().toLowerCase();
        const requestedTeacher = normalizedRole === 'teacher' ||
            normalizedRole === 'admin' ||
            normalizedRole === 'super_admin';
        // Disallow granting teacher/publisher permissions unless requester is verified staff
        if (requestedTeacher && !isAuthFacultyOrAdmin) {
            res.status(403).json({
                success: false,
                message: 'Forbidden: Only verified faculty and administrators can obtain instructor tokens'
            });
            return;
        }
        const isTeacher = isAuthFacultyOrAdmin && requestedTeacher;
        // Effective identity & display name strictly derived from auth if logged in
        const effectiveUserId = authUser?._id?.toString() ||
            (isTeacher ? `teacher_${Date.now()}` : `student_${Math.random().toString(36).substring(2, 9)}`);
        const effectiveName = authUser?.name ||
            (isTeacher ? 'Dharmendra Kumar (DK Sir)' : `Student ${effectiveUserId.slice(-4)}`);
        // Verify batch enrollment for students
        if (!isTeacher) {
            const targetBatch = batchId || 'all';
            // If batch is specified and not public/demo, check student enrollment
            if (targetBatch !== 'all' && targetBatch !== 'free-demo' && targetBatch !== 'public') {
                const studentRecord = authUser ||
                    (userId && userId.match(/^[0-9a-fA-F]{24}$/) ? await User.findById(userId) : null);
                if (studentRecord) {
                    const enrolledList = studentRecord.enrolledCourses || [];
                    const isEnrolled = enrolledList.some((c) => {
                        const cId = typeof c === 'string' ? c : c?.courseId || c?.id;
                        return cId === targetBatch || cId === 'all-access' || targetBatch.includes(cId);
                    });
                    // If not enrolled in this specific paid batch
                    if (!isEnrolled && studentRecord.role === 'STUDENT') {
                        res.status(403).json({
                            success: false,
                            message: `Access denied: Student is not enrolled in batch "${targetBatch}". Please complete course enrollment to enter this live classroom.`
                        });
                        return;
                    }
                }
            }
        }
        // Construct LiveKit Access Token
        const at = new AccessToken(apiKey, apiSecret, {
            identity: effectiveUserId,
            name: effectiveName,
            ttl: '6h'
        });
        if (isTeacher) {
            // Teacher role grants: full publisher, data publisher, subscriber, and room administrator
            at.addGrant({
                room: roomId,
                roomJoin: true,
                canPublish: true,
                canPublishData: true,
                canSubscribe: true,
                roomAdmin: true
            });
        }
        else {
            // Student role grants: viewer only (publish disabled), subscriber enabled, data channel for doubts
            at.addGrant({
                room: roomId,
                roomJoin: true,
                canPublish: false,
                canPublishData: true,
                canSubscribe: true,
                roomAdmin: false
            });
        }
        const token = await at.toJwt();
        // Increment active session participant count if session exists in DB
        try {
            await LiveSession.findOneAndUpdate({ roomId, status: 'LIVE' }, { $inc: { participantCount: 1 } });
        }
        catch {
            // non-blocking
        }
        res.status(200).json({
            success: true,
            token,
            wsUrl: livekitUrl,
            roomId,
            userId: effectiveUserId,
            userName: effectiveName,
            role: isTeacher ? 'teacher' : 'student',
            permissions: {
                canPublish: isTeacher,
                canSubscribe: true,
                canPublishData: true,
                roomAdmin: isTeacher
            }
        });
    }
    catch (error) {
        console.error('[LiveKit Token Error]:', error);
        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to generate LiveKit access token'
        });
    }
};
/**
 * Fetch active or scheduled live sessions
 * Endpoint: GET /api/live/sessions
 */
export const getLiveSessions = async (req, res) => {
    try {
        const { status, batchId } = req.query;
        const query = {};
        if (status) {
            query.status = String(status).toUpperCase();
        }
        else {
            // Default: show currently live or scheduled sessions
            query.status = { $in: ['LIVE', 'SCHEDULED'] };
        }
        if (batchId && batchId !== 'all') {
            query.$or = [{ batchId }, { batchId: 'all' }];
        }
        let sessions = await LiveSession.find(query).sort({ status: -1, startedAt: -1, createdAt: -1 });
        // If no session exists in database yet, auto-seed a default active DK Sir Live Session
        if (sessions.length === 0) {
            const defaultSession = await LiveSession.create({
                roomId: 'dk-jee-math-mastery-live',
                title: 'JEE 2027 Advanced Math & Calculus Mastery: 20-30s Inspection Tricks',
                subject: 'Mathematics',
                topic: 'Definite Integrals & Straight Lines Speed Shortcuts',
                batchId: 'jee-main-advanced-2yr-ultimate',
                batchName: 'JEE Main & Advanced 2-Year Ultimate Batch (2026–2028)',
                teacherId: 'teacher_dk_sir',
                teacherName: 'Dharmendra Kumar (DK Sir)',
                status: 'LIVE',
                startedAt: new Date(),
                participantCount: 42,
                description: 'Interactive classroom broadcast with direct 1080p stream, audio analysis, and live real-time student doubt resolution queue.'
            });
            sessions = [defaultSession];
        }
        res.status(200).json({
            success: true,
            count: sessions.length,
            data: sessions
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Start or create a live session
 * Endpoint: POST /api/live/sessions
 */
export const startLiveSession = async (req, res) => {
    try {
        const { roomId: customRoomId, title, subject = 'Mathematics', topic, batchId = 'all', batchName = 'JEE Rankers Comprehensive Batch', teacherId, teacherName = 'Dharmendra Kumar (DK Sir)', description } = req.body;
        const generatedRoomId = customRoomId?.trim() || `dk-live-${Date.now().toString(36)}`;
        const sessionTitle = title?.trim() || `${subject}: ${topic || 'Advanced Problem Solving Workshop'}`;
        // Update existing or create new live session
        const session = await LiveSession.findOneAndUpdate({ roomId: generatedRoomId }, {
            roomId: generatedRoomId,
            title: sessionTitle,
            subject,
            topic: topic || 'JEE Advanced Exam Tactics',
            batchId,
            batchName,
            teacherId: teacherId || 'teacher_dk_sir',
            teacherName,
            status: 'LIVE',
            startedAt: new Date(),
            endedAt: null,
            participantCount: 1,
            description: description || 'Official DK Academy Live Lecture Stream'
        }, { upsert: true, new: true });
        // Also auto-generate teacher token for convenience
        const apiKey = env.LIVEKIT_API_KEY;
        const apiSecret = env.LIVEKIT_API_SECRET;
        const livekitUrl = env.LIVEKIT_URL || 'wss://dk-acadmey-jpdi7yks.livekit.cloud';
        const at = new AccessToken(apiKey, apiSecret, {
            identity: teacherId || 'teacher_dk_sir',
            name: teacherName,
            ttl: '6h'
        });
        at.addGrant({
            room: generatedRoomId,
            roomJoin: true,
            canPublish: true,
            canPublishData: true,
            canSubscribe: true,
            roomAdmin: true
        });
        const teacherToken = await at.toJwt();
        res.status(201).json({
            success: true,
            message: 'Live session initialized successfully',
            data: session,
            token: teacherToken,
            wsUrl: livekitUrl
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * End a live session for everyone
 * Endpoint: POST /api/live/sessions/:roomId/end or PUT /api/live/sessions/:roomId/end
 */
export const endLiveSession = async (req, res) => {
    try {
        const roomId = String(req.params.roomId || '').trim();
        const session = await LiveSession.findOneAndUpdate({ roomId }, {
            status: 'ENDED',
            endedAt: new Date()
        }, { new: true });
        if (!session) {
            res.status(404).json({ success: false, message: 'Live session not found' });
            return;
        }
        // Try closing room via LiveKit RoomServiceClient
        const apiKey = env.LIVEKIT_API_KEY;
        const apiSecret = env.LIVEKIT_API_SECRET;
        const livekitUrl = env.LIVEKIT_URL;
        if (apiKey && apiSecret && livekitUrl) {
            try {
                const httpUrl = livekitUrl.replace('wss://', 'https://').replace('ws://', 'http://');
                const roomService = new RoomServiceClient(httpUrl, apiKey, apiSecret);
                await roomService.deleteRoom(roomId);
            }
            catch (err) {
                console.warn('[LiveKit RoomService Delete Warning]:', err);
            }
        }
        res.status(200).json({
            success: true,
            message: 'Live session closed successfully for all participants',
            data: session
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Get single session by roomId
 * Endpoint: GET /api/live/sessions/:roomId
 */
export const getLiveSessionById = async (req, res) => {
    try {
        const roomId = String(req.params.roomId || '').trim();
        const session = await LiveSession.findOne({ roomId });
        if (!session) {
            res.status(404).json({ success: false, message: 'Session not found' });
            return;
        }
        res.status(200).json({ success: true, data: session });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
