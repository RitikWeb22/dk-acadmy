import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Doubt } from '../models/Doubt.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';
import { broadcastDoubtAnswered, broadcastNewDoubt } from '../sockets/socket.js';
import { escapeRegex, getPagination } from '../utils/sanitize.js';

/**
 * Get all doubts with search & filters
 */
export const getDoubts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, subject, courseId, search, page = 1, limit = 50 } = req.query;
    const filter: Record<string, any> = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (subject && subject !== 'ALL') {
      filter.subject = subject;
    }
    if (courseId && courseId !== 'ALL') {
      filter.courseId = courseId;
    }
    if (search) {
      const q = escapeRegex(String(search).trim());
      filter.$or = [
        { studentName: { $regex: q, $options: 'i' } },
        { studentEmail: { $regex: q, $options: 'i' } },
        { question: { $regex: q, $options: 'i' } },
        { chapter: { $regex: q, $options: 'i' } },
        { topic: { $regex: q, $options: 'i' } },
        { courseTitle: { $regex: q, $options: 'i' } }
      ];
    }

    const { limit: safeLimit, skip } = getPagination(page, limit, 50, 100);
    const doubts = await Doubt.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean();

    const total = await Doubt.countDocuments(filter);

    // Return actual doubts from database

    res.status(200).json({
      success: true,
      data: doubts,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Student raises a new doubt
 */
export const createDoubt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      courseId,
      courseTitle,
      subject,
      chapter,
      topic,
      doubtTitle,
      lessonId,
      lessonTitle,
      lessonType,
      question,
      questionImage,
      studentName,
      studentEmail,
      studentPhone,
      priority
    } = req.body;

    if (!courseId || !question) {
      res.status(400).json({ success: false, message: 'Course and question are required' });
      return;
    }

    const resolvedTopic = (doubtTitle || topic || 'Concept Query').trim();

    const doubt = await Doubt.create({
      studentId: req.user?._id,
      studentName: studentName || req.user?.name || 'JEE Aspirant',
      studentEmail: studentEmail || req.user?.email || '',
      studentPhone: (studentPhone && !studentPhone.includes('8287384970')) ? studentPhone : (req.user?.phone && !req.user.phone.includes('8287384970') ? req.user.phone : ''),
      courseId,
      courseTitle: courseTitle || 'JEE Ultimate Pinnacle',
      subject: ['Physics', 'Chemistry', 'Mathematics', 'General'].includes(subject) ? subject : 'Mathematics',
      chapter: chapter || lessonTitle || 'General',
      topic: resolvedTopic,
      doubtTitle: resolvedTopic,
      lessonId: lessonId || '',
      lessonTitle: lessonTitle || chapter || '',
      lessonType: lessonType || 'video',
      question: question.trim(),
      questionImage: questionImage || '',
      priority: ['HIGH', 'MEDIUM', 'LOW'].includes(priority) ? priority : 'MEDIUM',
      status: 'PENDING'
    });

    broadcastNewDoubt(doubt);

    res.status(201).json({ success: true, data: doubt });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin answers student doubt and sends instant Socket.IO broadcast to student
 */
export const answerDoubt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const answerText = (req.body.answerText || req.body.answer || '').trim();
    const adminName = (req.body.adminName || req.body.facultyName || req.user?.name || 'DK Sir (Director)').trim();
    const attachmentUrl = (req.body.attachmentUrl || req.body.answerImage || '').trim();

    if (!answerText) {
      res.status(400).json({ success: false, message: 'Answer text cannot be empty' });
      return;
    }

    const doubt = await Doubt.findById(id);
    if (!doubt) {
      res.status(404).json({ success: false, message: 'Doubt not found' });
      return;
    }

    const adminAnswer = {
      adminId: req.user?._id?.toString() || 'director_admin',
      adminName: adminName || req.user?.name || 'DK Sir (Director)',
      answerText: answerText.trim(),
      attachmentUrl: attachmentUrl || '',
      answeredAt: new Date()
    };

    doubt.status = 'ANSWERED';
    doubt.answer = adminAnswer;
    await doubt.save();

    // Broadcast instant Socket.IO event so student gets real-time message on their UI
    broadcastDoubtAnswered(doubt);

    res.status(200).json({
      success: true,
      message: 'Doubt answered successfully and student notified via Socket.IO',
      data: doubt
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update doubt status directly
 */
export const updateDoubtStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'ANSWERED', 'REJECTED'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    const doubt = await Doubt.findByIdAndUpdate(id, { status }, { returnDocument: 'after' });
    if (!doubt) {
      res.status(404).json({ success: false, message: 'Doubt not found' });
      return;
    }

    res.status(200).json({ success: true, data: doubt });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete doubt
 */
export const deleteDoubt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const idStr = String(id);
    const isObjectId = mongoose.Types.ObjectId.isValid(idStr);
    const doubt = await Doubt.findOneAndDelete(
      isObjectId ? { $or: [{ _id: idStr }, { id: idStr }] } : { id: idStr }
    );
    if (!doubt) {
      res.status(404).json({ success: false, message: 'Doubt not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Doubt deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Toggle like on a doubt
 */
export const toggleLikeDoubt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId = 'guest_student' } = req.body;

    const doubt = await Doubt.findById(id);
    if (!doubt) {
      res.status(404).json({ success: false, message: 'Doubt not found' });
      return;
    }

    if (!doubt.likedBy) {
      doubt.likedBy = [];
    }

    const hasLiked = doubt.likedBy.includes(userId);
    if (hasLiked) {
      doubt.likedBy = doubt.likedBy.filter((u) => u !== userId);
      doubt.likes = Math.max(0, (doubt.likes || 1) - 1);
    } else {
      doubt.likedBy.push(userId);
      doubt.likes = (doubt.likes || 0) + 1;
    }

    await doubt.save();

    res.status(200).json({
      success: true,
      likes: doubt.likes,
      isLiked: !hasLiked,
      data: doubt
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

