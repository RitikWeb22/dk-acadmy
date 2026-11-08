import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { broadcastStudentRegistered } from '../sockets/socket.js';
import { generateStudentId, generateTeacherId } from '../utils/uuid.js';
const generateToken = (id, role) => {
    return jwt.sign({ id, role, jti: uuidv4() }, env.JWT_SECRET, {
        expiresIn: '7d'
    });
};
export const register = async (req, res) => {
    try {
        const { name, email, password, phone, targetExam, targetClass, targetYear } = req.body;
        const cleanEmail = email?.trim().toLowerCase();
        const userExists = await User.findOne({ email: cleanEmail });
        if (userExists) {
            res.status(400).json({ success: false, message: 'User already exists with this email' });
            return;
        }
        const studentId = generateStudentId();
        const user = await User.create({
            name: name?.trim(),
            email: cleanEmail,
            password: password || 'password123',
            phone: phone?.trim(),
            role: 'STUDENT',
            studentId,
            targetExam: targetExam || 'JEE Main & Advanced',
            targetClass: targetClass || 'Class 11th',
            targetYear: targetYear || '2028'
        });
        const token = generateToken(user._id.toString(), user.role);
        // Real-time broadcast to Admin, Teachers, and active consoles via WebSockets
        try {
            broadcastStudentRegistered({
                _id: user._id.toString(),
                studentId: user.studentId,
                teacherId: user.teacherId,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                targetExam: user.targetExam,
                targetClass: user.targetClass,
                targetYear: user.targetYear,
                createdAt: user.createdAt
            });
            console.log(`[Socket.io Broadcast] New student registered in realtime: ${user.name} (${user.email}) - ID: ${user.studentId}`);
        }
        catch (socketErr) {
            console.warn('[Socket Broadcast Warning]:', socketErr);
        }
        res.status(201).json({
            success: true,
            message: 'Account registered successfully',
            data: {
                _id: user._id,
                studentId: user.studentId,
                teacherId: user.teacherId,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                targetExam: user.targetExam,
                targetClass: user.targetClass,
                targetYear: user.targetYear,
                enrolledCourses: user.enrolledCourses || [],
                token
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const googleAuth = async (req, res) => {
    try {
        const { credential, accessToken } = req.body;
        if (!credential && !accessToken) {
            res.status(400).json({ success: false, message: 'Google authentication credential is required.' });
            return;
        }
        let googleUser = null;
        if (credential) {
            // 1. Verify Google ID token via official Google TokenInfo endpoint
            const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
            if (!googleRes.ok) {
                const errorData = await googleRes.json().catch(() => ({}));
                res.status(401).json({ success: false, message: errorData.error_description || 'Invalid Google credential token.' });
                return;
            }
            googleUser = (await googleRes.json());
        }
        else if (accessToken) {
            // 2. Or verify Access Token via Google UserInfo endpoint
            const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (!googleRes.ok) {
                res.status(401).json({ success: false, message: 'Invalid Google access token.' });
                return;
            }
            googleUser = (await googleRes.json());
        }
        if (!googleUser || !googleUser.email) {
            res.status(400).json({ success: false, message: 'Could not retrieve verified email from Google.' });
            return;
        }
        const cleanEmail = googleUser.email.trim().toLowerCase();
        let user = await User.findOne({ email: cleanEmail });
        if (user) {
            // Existing user: Link googleId and avatar if not present
            let needsSave = false;
            if (!user.googleId && googleUser.sub) {
                user.googleId = googleUser.sub;
                needsSave = true;
            }
            if (!user.avatarUrl && googleUser.picture) {
                user.avatarUrl = googleUser.picture;
                needsSave = true;
            }
            if (needsSave) {
                await user.save();
            }
        }
        else {
            // New student registration via Google
            const studentId = generateStudentId();
            user = await User.create({
                name: (googleUser.name || cleanEmail.split('@')[0]).trim(),
                email: cleanEmail,
                googleId: googleUser.sub,
                avatarUrl: googleUser.picture,
                authProvider: 'google',
                role: 'STUDENT',
                studentId,
                targetExam: 'JEE Main & Advanced 2027',
                targetClass: 'Class 11th',
                targetYear: '2028'
            });
            try {
                broadcastStudentRegistered({
                    _id: user._id.toString(),
                    studentId: user.studentId,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    targetExam: user.targetExam,
                    targetClass: user.targetClass,
                    targetYear: user.targetYear,
                    createdAt: user.createdAt
                });
                console.log(`[Google Auth] New student registered with Google: ${user.name} (${user.email}) - ID: ${user.studentId}`);
            }
            catch (socketErr) {
                console.warn('[Socket Broadcast Warning]:', socketErr);
            }
        }
        const token = generateToken(user._id.toString(), user.role);
        res.status(200).json({
            success: true,
            message: 'Google authentication successful',
            data: {
                _id: user._id,
                studentId: user.studentId,
                teacherId: user.teacherId,
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                avatarUrl: user.avatarUrl,
                role: user.role,
                targetExam: user.targetExam,
                targetClass: user.targetClass,
                targetYear: user.targetYear,
                enrolledCourses: user.enrolledCourses || [],
                token
            }
        });
    }
    catch (error) {
        console.error('[Google Auth Error]:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error during Google authentication.' });
    }
};
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const genericErrorMessage = 'Invalid email or password';
        if (!email || !password) {
            res.status(400).json({ success: false, message: genericErrorMessage });
            return;
        }
        const cleanEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: cleanEmail }).select('+password');
        if (!user) {
            res.status(401).json({ success: false, message: genericErrorMessage });
            return;
        }
        // Check account lockout
        if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
            res.status(401).json({ success: false, message: genericErrorMessage });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            const currentAttempts = (user.failedLoginAttempts || 0) + 1;
            const updates = { failedLoginAttempts: currentAttempts };
            if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
                updates.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
            }
            await User.findByIdAndUpdate(user._id, updates);
            res.status(401).json({ success: false, message: genericErrorMessage });
            return;
        }
        // Reset lockout counters on success
        if (user.failedLoginAttempts || user.lockUntil) {
            await User.findByIdAndUpdate(user._id, {
                $set: { failedLoginAttempts: 0 },
                $unset: { lockUntil: 1 }
            });
        }
        const token = generateToken(user._id.toString(), user.role);
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                _id: user._id,
                studentId: user.studentId,
                teacherId: user.teacherId,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                targetExam: user.targetExam,
                targetClass: user.targetClass,
                targetYear: user.targetYear,
                avatarUrl: user.avatarUrl,
                dob: user.dob,
                preferredLanguage: user.preferredLanguage,
                city: user.city,
                state: user.state,
                parentName: user.parentName,
                parentPhone: user.parentPhone,
                schoolName: user.schoolName,
                board: user.board,
                enrolledCourses: user.enrolledCourses || [],
                token
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const genericErrorMessage = 'Invalid email or password';
        if (!email || !password) {
            res.status(400).json({ success: false, message: genericErrorMessage });
            return;
        }
        const cleanEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: cleanEmail }).select('+password');
        if (!user) {
            res.status(401).json({ success: false, message: genericErrorMessage });
            return;
        }
        // Check account lockout
        if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
            res.status(401).json({ success: false, message: genericErrorMessage });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            const currentAttempts = (user.failedLoginAttempts || 0) + 1;
            const updates = { failedLoginAttempts: currentAttempts };
            if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
                updates.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
            }
            await User.findByIdAndUpdate(user._id, updates);
            res.status(401).json({ success: false, message: genericErrorMessage });
            return;
        }
        // Reset lockout counters on success
        if (user.failedLoginAttempts || user.lockUntil) {
            await User.findByIdAndUpdate(user._id, {
                $set: { failedLoginAttempts: 0 },
                $unset: { lockUntil: 1 }
            });
        }
        // Explicitly allow TEACHER, ADMIN, SUPER_ADMIN, and Portal administrative roles
        const allowedAdminRoles = ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'CMS_MANAGER', 'LEAD_MANAGER', 'COUNSELOR'];
        if (!allowedAdminRoles.includes(user.role)) {
            res.status(403).json({ success: false, message: 'Access denied: not an administrative or faculty account' });
            return;
        }
        const token = generateToken(user._id.toString(), user.role);
        res.status(200).json({
            success: true,
            message: `Welcome back, ${user.name}`,
            data: {
                token,
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    avatarUrl: user.avatarUrl,
                    designation: user.designation,
                    department: user.department
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const getMe = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: req.user
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const allowedUpdates = [
            'name',
            'phone',
            'targetExam',
            'targetClass',
            'targetYear',
            'avatarUrl',
            'designation',
            'department',
            'dob',
            'preferredLanguage',
            'city',
            'state',
            'parentName',
            'parentPhone',
            'schoolName',
            'board'
        ];
        allowedUpdates.forEach((field) => {
            if (req.body[field] !== undefined) {
                req.user[field] = req.body[field];
            }
        });
        if (req.body.password && typeof req.body.password === 'string' && req.body.password.trim().length >= 6) {
            req.user.password = req.body.password.trim();
        }
        await req.user.save();
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: req.user
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const enrollCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        if (!courseId) {
            res.status(400).json({ success: false, message: 'Please provide courseId' });
            return;
        }
        // Verify course exists and verify if course is free or requires payment
        let course = null;
        try {
            course = await Course.findById(courseId);
        }
        catch {
            course = await Course.findOne({ slug: courseId });
        }
        if (!course) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        // Check if course requires payment
        const isFree = course.price === 0 || course.isFree === true;
        const isAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN';
        if (!isFree && !isAdmin) {
            res.status(402).json({
                success: false,
                message: 'Payment required: Paid courses require successful payment verification.'
            });
            return;
        }
        const updatedUser = await User.findByIdAndUpdate(req.user._id, { $addToSet: { enrolledCourses: courseId } }, { new: true }).select('-password');
        res.status(200).json({
            success: true,
            message: 'Enrolled in course successfully',
            enrolledCourses: updatedUser?.enrolledCourses || []
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const getStudentsList = async (req, res) => {
    try {
        const students = await User.find({ role: 'STUDENT' }).select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: students.length, data: students });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const getStaffList = async (req, res) => {
    try {
        const staff = await User.find({ role: { $ne: 'STUDENT' } }).select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: staff.length, data: staff });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const createStudentByAdmin = async (req, res) => {
    try {
        const { name, email, phone, targetClass, targetYear, targetExam } = req.body;
        if (!name || !email) {
            res.status(400).json({ success: false, message: 'Name and email are required' });
            return;
        }
        const existing = await User.findOne({ email: email.trim().toLowerCase() });
        if (existing) {
            res.status(400).json({ success: false, message: 'A student with this email already exists' });
            return;
        }
        const student = await User.create({
            name,
            email: email.trim().toLowerCase(),
            password: 'studentpassword123',
            phone: phone || '+91 98765 43210',
            targetClass: targetClass || 'Class 11',
            targetYear: targetYear || 'Target JEE 2028',
            targetExam: targetExam || 'JEE Main & Advanced',
            role: 'STUDENT',
            studentId: generateStudentId()
        });
        res.status(201).json({
            success: true,
            message: 'Student created successfully',
            data: student
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const createStaffByAdmin = async (req, res) => {
    try {
        const { name, email, phone, role = 'TEACHER', department, specialization, password } = req.body;
        if (!name || !email) {
            res.status(400).json({ success: false, message: 'Name and email are required' });
            return;
        }
        const cleanEmail = email.trim().toLowerCase();
        const existing = await User.findOne({ email: cleanEmail });
        if (existing) {
            res.status(400).json({ success: false, message: 'Staff member with this email already exists' });
            return;
        }
        const initialPassword = password && password.trim().length >= 6 ? password.trim() : 'staffpassword123';
        const normalizedRole = role.toUpperCase() === 'ADMIN'
            ? 'ADMIN'
            : role.toUpperCase() === 'SUPER_ADMIN'
                ? 'SUPER_ADMIN'
                : 'TEACHER';
        const callerRole = req.user?.role;
        if ((normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN') && callerRole !== 'SUPER_ADMIN') {
            res.status(403).json({
                success: false,
                message: 'Forbidden: Only SUPER_ADMIN can create an ADMIN or SUPER_ADMIN account'
            });
            return;
        }
        const staff = await User.create({
            name: name.trim(),
            email: cleanEmail,
            password: initialPassword,
            phone: phone?.trim() || '+91 98112 34567',
            role: normalizedRole,
            teacherId: generateTeacherId()
        });
        const staffObj = staff.toObject();
        delete staffObj.password;
        res.status(201).json({
            success: true,
            message: 'Faculty/Staff created successfully with configured login credentials',
            data: {
                ...staffObj,
                initialPassword
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const updateStaffPasswordByAdmin = async (req, res) => {
    try {
        const id = String(req.params.id || '').trim();
        const { password } = req.body;
        if (!password || password.trim().length < 6) {
            res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
            return;
        }
        // Support lookup by MongoDB _id or custom teacherId
        let staff = null;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            staff = await User.findById(id).select('+password');
        }
        if (!staff) {
            staff = await User.findOne({ teacherId: id }).select('+password');
        }
        if (!staff) {
            staff = await User.findOne({ email: id.toLowerCase() }).select('+password');
        }
        if (!staff) {
            res.status(404).json({ success: false, message: 'Faculty member not found' });
            return;
        }
        staff.password = password.trim();
        await staff.save();
        res.status(200).json({
            success: true,
            message: `Password successfully updated for ${staff.name}. They can now login at /admin/login with their new password.`
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const updateStaffByAdmin = async (req, res) => {
    try {
        const id = String(req.params.id || '').trim();
        const { name, phone, role, password } = req.body;
        let staff = null;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            staff = await User.findById(id).select('+password');
        }
        if (!staff) {
            staff = await User.findOne({ teacherId: id }).select('+password');
        }
        if (!staff) {
            res.status(404).json({ success: false, message: 'Staff member not found' });
            return;
        }
        if (name)
            staff.name = name.trim();
        if (phone)
            staff.phone = phone.trim();
        if (role) {
            staff.role = role.toUpperCase() === 'ADMIN' ? 'ADMIN' : role.toUpperCase() === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'TEACHER';
        }
        if (password && password.trim().length >= 6) {
            staff.password = password.trim();
        }
        await staff.save();
        res.status(200).json({ success: true, message: 'Staff details updated successfully', data: staff });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const deleteUserByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const idStr = String(id);
        const isObjectId = mongoose.Types.ObjectId.isValid(idStr);
        const deleted = await User.findOneAndDelete(isObjectId
            ? { $or: [{ _id: idStr }, { teacherId: idStr }, { email: idStr.toLowerCase() }] }
            : { $or: [{ teacherId: idStr }, { email: idStr.toLowerCase() }] });
        res.status(200).json({ success: true, message: 'User deleted successfully', deleted });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
