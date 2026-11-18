import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';
import { broadcastStudentRegistered } from '../sockets/socket.js';
import { generateStudentId, generateTeacherId } from '../utils/uuid.js';

const generateToken = (id: string, role: string): string => {
  return jwt.sign({ id, role, jti: uuidv4() }, env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, targetExam, targetClass, targetYear } = req.body;

    const rawPhone = phone ? phone.toString().replace(/\D/g, '').slice(-10) : '';
    const cleanEmail = email && typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : undefined;

    if (!rawPhone && !cleanEmail) {
      res.status(400).json({ success: false, message: 'Please provide either a valid 10-digit phone number or email address.' });
      return;
    }

    // Check if user already exists with this phone number
    if (rawPhone) {
      const phoneExists = await User.findOne({ phone: rawPhone });
      if (phoneExists) {
        res.status(400).json({ success: false, message: 'An account is already registered with this phone number.' });
        return;
      }
    }

    // Check if user already exists with this email address
    if (cleanEmail) {
      const userExists = await User.findOne({ email: cleanEmail });
      if (userExists) {
        res.status(400).json({ success: false, message: 'An account is already registered with this email address.' });
        return;
      }
    }

    const studentId = generateStudentId();

    const userPayload: any = {
      name: name?.trim(),
      password: password || 'password123',
      phone: rawPhone || undefined,
      role: 'STUDENT',
      studentId,
      targetExam: targetExam || 'JEE Main & Advanced',
      targetClass: targetClass || 'Class 11th',
      targetYear: targetYear || '2028'
    };

    // If student provided an email, store it; if not, do NOT create dummy email
    if (cleanEmail) {
      userPayload.email = cleanEmail;
    }

    const user = await User.create(userPayload);

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
    } catch (socketErr) {
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential, accessToken } = req.body;

    if (!credential && !accessToken) {
      res.status(400).json({ success: false, message: 'Google authentication credential is required.' });
      return;
    }

    let googleUser: {
      sub: string;
      email: string;
      name?: string;
      picture?: string;
      email_verified?: boolean | string;
    } | null = null;

    if (credential) {
      // 1. Verify Google ID token via official Google TokenInfo endpoint
      const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      if (!googleRes.ok) {
        const errorData: any = await googleRes.json().catch(() => ({}));
        res.status(401).json({ success: false, message: errorData.error_description || 'Invalid Google credential token.' });
        return;
      }
      googleUser = (await googleRes.json()) as any;
    } else if (accessToken) {
      // 2. Or verify Access Token via Google UserInfo endpoint
      const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!googleRes.ok) {
        res.status(401).json({ success: false, message: 'Invalid Google access token.' });
        return;
      }
      googleUser = (await googleRes.json()) as any;
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
    } else {
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
      } catch (socketErr) {
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
  } catch (error: any) {
    console.error('[Google Auth Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during Google authentication.' });
  }
};

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phone, identifier, password } = req.body;
    const rawLookup = (identifier || phone || email || '').toString().trim();
    const genericErrorMessage = 'Invalid mobile number/email or password';

    if (!rawLookup || !password) {
      res.status(400).json({ success: false, message: genericErrorMessage });
      return;
    }

    const cleanDigits = rawLookup.replace(/\D/g, '').slice(-10);
    const cleanEmail = rawLookup.toLowerCase();

    // Query by either email address, mobile number, or student ID
    const queryConditions: any[] = [];
    if (cleanEmail.includes('@')) {
      queryConditions.push({ email: cleanEmail });
    }
    if (cleanDigits && cleanDigits.length === 10) {
      queryConditions.push({ phone: cleanDigits });
      queryConditions.push({ email: `${cleanDigits}@student.dkacademy.in` });
    }
    if (rawLookup) {
      queryConditions.push({ studentId: rawLookup });
      queryConditions.push({ studentId: rawLookup.toUpperCase() });
    }

    if (queryConditions.length === 0) {
      res.status(401).json({ success: false, message: genericErrorMessage });
      return;
    }

    const user = await User.findOne({ $or: queryConditions }).select('+password');

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
      const updates: any = { failedLoginAttempts: currentAttempts };
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
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

    // Role check: only administrative or faculty accounts can access admin portal
    const allowedAdminRoles = ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'CMS_MANAGER', 'LEAD_MANAGER', 'COUNSELOR'];
    if (!allowedAdminRoles.includes(user.role)) {
      res.status(401).json({ success: false, message: genericErrorMessage });
      return;
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
      res.status(401).json({
        success: false,
        isLocked: true,
        message: `Account is temporarily locked due to failed attempts. Please contact a Super Administrator to unlock your account immediately, or wait ${remainingMinutes} minute(s).`
      });
      return;
    }

    let isMatch = await user.comparePassword(password);
    // Backward-compatible fallback for director DK Sir if transitioning between admin@123 and admin@1234
    if (!isMatch && user.email === 'dharmendra@dkacademy.com') {
      if (['admin@1234', 'admin@123'].includes(password)) {
        isMatch = true;
        user.password = password;
        await user.save();
      }
    }

    if (!isMatch) {
      const currentAttempts = (user.failedLoginAttempts || 0) + 1;
      const updates: any = { failedLoginAttempts: currentAttempts };
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'strict' | 'lax';
      path: string;
    } = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/'
    };

    res.clearCookie('token', cookieOptions);
    res.clearCookie('adminToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // 1. Email update handling
    if (req.body.email !== undefined) {
      const cleanEmail = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      if (cleanEmail) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
          res.status(400).json({ success: false, message: 'Please provide a valid email format (e.g. user@gmail.com).' });
          return;
        }
        const emailExists = await User.findOne({ email: cleanEmail, _id: { $ne: req.user._id } });
        if (emailExists) {
          res.status(400).json({ success: false, message: 'An account is already registered with this email address.' });
          return;
        }
        req.user.email = cleanEmail;
      } else {
        // User cleared email - remove it cleanly
        req.user.email = undefined;
        req.user.set('email', undefined);
      }
    }

    // 2. Phone update handling
    if (req.body.phone !== undefined) {
      const cleanPhone = req.body.phone.toString().replace(/\D/g, '').slice(-10);
      if (cleanPhone) {
        if (cleanPhone.length !== 10) {
          res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number.' });
          return;
        }
        const phoneExists = await User.findOne({ phone: cleanPhone, _id: { $ne: req.user._id } });
        if (phoneExists) {
          res.status(400).json({ success: false, message: 'An account is already registered with this mobile number.' });
          return;
        }
        req.user.phone = cleanPhone;
      }
    }

    const allowedUpdates = [
      'name',
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
      'board',
      'bio'
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        (req.user as any)[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
      }
    });

    if (req.body.password && typeof req.body.password === 'string' && req.body.password.trim().length >= 6) {
      req.user.password = req.body.password.trim();
    }

    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully in database',
      data: req.user
    });
  } catch (error: any) {
    console.error('[UpdateProfile Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const enrollCourse = async (req: AuthRequest, res: Response): Promise<void> => {
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
    } catch {
      course = await Course.findOne({ slug: courseId });
    }

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    // Check if course requires payment
    const isFree = course.price === 0 || (course as any).isFree === true;
    const isAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN';

    if (!isFree && !isAdmin) {
      res.status(402).json({
        success: false,
        message: 'Payment required: Paid courses require successful payment verification.'
      });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { enrolledCourses: courseId } },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Enrolled in course successfully',
      enrolledCourses: updatedUser?.enrolledCourses || []
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentsList = async (req: Request, res: Response): Promise<void> => {
  try {
    const students = await User.find({ role: 'STUDENT' }).select('-password').sort({ createdAt: -1 });
    const formattedStudents = students.map((s) => {
      const obj = s.toObject();
      if (!obj.studentId) {
        obj.studentId = `STU-${s._id.toString().slice(-8).toUpperCase()}`;
      }
      return obj;
    });
    res.status(200).json({ success: true, count: formattedStudents.length, data: formattedStudents });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStaffList = async (req: Request, res: Response): Promise<void> => {
  try {
    const staff = await User.find({ role: { $ne: 'STUDENT' } }).select('-password').sort({ createdAt: -1 });
    const formattedStaff = staff.map((u) => {
      const isLocked = Boolean(u.lockUntil && u.lockUntil.getTime() > Date.now());
      const obj = u.toObject();
      return {
        ...obj,
        isLocked,
        remainingLockMinutes: isLocked ? Math.ceil((u.lockUntil!.getTime() - Date.now()) / 60000) : 0
      };
    });
    res.status(200).json({ success: true, count: formattedStaff.length, data: formattedStaff });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStudentByAdmin = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStaffByAdmin = async (req: Request, res: Response): Promise<void> => {
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

    const callerRole = (req as AuthRequest).user?.role;
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
    delete (staffObj as any).password;

    res.status(201).json({
      success: true,
      message: 'Faculty/Staff created successfully with configured login credentials',
      data: {
        ...staffObj,
        initialPassword
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStaffPasswordByAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || '').trim();
    const { password } = req.body;
    const requesterRole = String(req.user?.role || '').toUpperCase();
    const isSuperAdmin = requesterRole === 'SUPER_ADMIN' || requesterRole === 'DIRECTOR';

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

    // Hierarchy check: Non-superadmins cannot modify a Super Admin's password
    if (staff.role === 'SUPER_ADMIN' && !isSuperAdmin) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only a Super Admin can change another Super Admin\'s password'
      });
      return;
    }

    staff.password = password.trim();
    staff.failedLoginAttempts = 0;
    (staff as any).lockUntil = undefined;
    await staff.save();

    await User.findByIdAndUpdate(staff._id, {
      $set: { failedLoginAttempts: 0 },
      $unset: { lockUntil: 1 }
    });

    res.status(200).json({
      success: true,
      message: `Password successfully updated and account unlocked for ${staff.name}. They can now login at /admin/login immediately.`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const unlockStaffByAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || '').trim();
    const requesterRole = String(req.user?.role || '').toUpperCase();
    const isSuperAdmin = requesterRole === 'SUPER_ADMIN' || requesterRole === 'DIRECTOR';

    if (!isSuperAdmin) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only a Super Admin can unlock administrative and faculty accounts'
      });
      return;
    }

    let staff = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      staff = await User.findById(id);
    }
    if (!staff) {
      staff = await User.findOne({ teacherId: id });
    }
    if (!staff) {
      staff = await User.findOne({ email: id.toLowerCase() });
    }

    if (!staff) {
      res.status(404).json({ success: false, message: 'Staff member not found' });
      return;
    }

    // Reset failed login attempts and unlock account immediately
    await User.findByIdAndUpdate(staff._id, {
      $set: { failedLoginAttempts: 0 },
      $unset: { lockUntil: 1 }
    });

    res.status(200).json({
      success: true,
      message: `Account for ${staff.name} (${staff.email}) has been immediately unlocked and reactivated. They can now login right away without waiting.`,
      data: {
        id: staff._id,
        email: staff.email,
        name: staff.name,
        role: staff.role,
        isLocked: false,
        failedLoginAttempts: 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStaffByAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || '').trim();
    const { name, phone, role, password } = req.body;
    const requesterRole = String(req.user?.role || '').toUpperCase();
    const isSuperAdmin = requesterRole === 'SUPER_ADMIN' || requesterRole === 'DIRECTOR';

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
      res.status(404).json({ success: false, message: 'Staff member not found' });
      return;
    }

    // Hierarchy check: Cannot edit a Super Admin unless you are a Super Admin
    if (staff.role === 'SUPER_ADMIN' && !isSuperAdmin) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only a Super Admin can modify a Super Admin profile'
      });
      return;
    }

    if (name) staff.name = name.trim();
    if (phone) staff.phone = phone.trim();
    if (role) {
      const targetRole = role.toUpperCase();
      if ((targetRole === 'SUPER_ADMIN' || targetRole === 'ADMIN') && !isSuperAdmin) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Only a Super Admin can promote a user to ADMIN or SUPER_ADMIN'
        });
        return;
      }
      staff.role = targetRole === 'ADMIN' ? 'ADMIN' : targetRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'TEACHER';
    }
    if (password && password.trim().length >= 6) {
      staff.password = password.trim();
    }

    await staff.save();
    const safeStaff = staff.toObject();
    delete (safeStaff as any).password;
    res.status(200).json({ success: true, message: 'Staff details updated successfully', data: safeStaff });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUserByAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const idStr = String(id || '').trim();
    const requesterRole = String(req.user?.role || '').toUpperCase();
    const isSuperAdmin = requesterRole === 'SUPER_ADMIN' || requesterRole === 'DIRECTOR';

    if (!isSuperAdmin) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only a Super Admin can delete user or staff accounts'
      });
      return;
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(idStr);
    const targetUser = await User.findOne(
      isObjectId
        ? { $or: [{ _id: idStr }, { teacherId: idStr }, { email: idStr.toLowerCase() }] }
        : { $or: [{ teacherId: idStr }, { email: idStr.toLowerCase() }] }
    );

    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Root super admin protection
    if (targetUser.email === 'ritikweb30@gmail.com' || targetUser.email === 'dharmendra@dkacademy.com') {
      res.status(403).json({
        success: false,
        message: 'Security violation: Root founder and director accounts cannot be deleted'
      });
      return;
    }

    // Prevent self-deletion
    if (req.user && targetUser._id.toString() === req.user._id.toString()) {
      res.status(400).json({
        success: false,
        message: 'Operation not permitted: You cannot delete your own active administrative account'
      });
      return;
    }

    await User.findByIdAndDelete(targetUser._id);
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      deleted: { id: targetUser._id, name: targetUser.name, email: targetUser.email }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
