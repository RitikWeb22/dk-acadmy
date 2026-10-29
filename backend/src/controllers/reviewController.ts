import type { Request, Response } from 'express';
import { Review } from '../models/Review.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';
import {
  broadcastReviewCreated,
  broadcastReviewUpdated,
  broadcastReviewDeleted
} from '../sockets/socket.js';
import { escapeRegex, getPagination } from '../utils/sanitize.js';

/**
 * Get all reviews with filters for course, rating, status, reply status, and text search
 */
export const getAllReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId, rating, status, hasReply, search, page = 1, limit = 50 } = req.query;
    const filter: Record<string, any> = {};

    if (courseId && courseId !== 'ALL') {
      filter.courseId = courseId;
    }
    if (rating && rating !== 'ALL') {
      filter.rating = Number(rating);
    }
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (hasReply === 'true') {
      filter['adminReply.content'] = { $exists: true, $ne: '' };
    } else if (hasReply === 'false') {
      filter['adminReply.content'] = { $exists: false };
    }
    if (search) {
      const q = escapeRegex(String(search).trim());
      filter.$or = [
        { studentName: { $regex: q, $options: 'i' } },
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { courseTitle: { $regex: q, $options: 'i' } }
      ];
    }

    const { limit: safeLimit, skip } = getPagination(page, limit, 50, 100);
    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean();

    const total = await Review.countDocuments(filter);

    // Return actual reviews from database

    res.status(200).json({
      success: true,
      data: reviews,
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
 * Submit student review (public / verified)
 */
export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, courseTitle, rating, title, content, studentName, studentEmail } = req.body;

    if (!courseId || !rating || !title || !content) {
      res.status(400).json({ success: false, message: 'All review fields are required' });
      return;
    }

    const review = await Review.create({
      studentId: req.user?._id,
      studentName: studentName || req.user?.name || 'Aspirant',
      studentEmail: studentEmail || req.user?.email || 'student@dkacademy.com',
      courseId,
      courseTitle: courseTitle || 'JEE Course',
      rating: Number(rating),
      title: title.trim(),
      content: content.trim(),
      status: 'APPROVED',
      isVerifiedPurchase: true
    });

    broadcastReviewCreated(review);

    res.status(201).json({ success: true, data: review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update review moderation status: APPROVED | HIDDEN | FLAGGED
 */
export const updateReviewStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'PENDING', 'HIDDEN', 'FLAGGED'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    const review = await Review.findByIdAndUpdate(id, { status }, { new: true });
    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    broadcastReviewUpdated(review);

    res.status(200).json({ success: true, data: review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reply or edit existing reply to student review
 */
export const replyToReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ success: false, message: 'Reply content cannot be empty' });
      return;
    }

    const review = await Review.findById(id);
    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    const adminReply = {
      adminId: req.user?._id?.toString() || 'director_admin',
      adminName: req.user?.name || 'DK Sir (Director)',
      content: content.trim(),
      createdAt: review.adminReply?.createdAt || new Date(),
      updatedAt: new Date()
    };

    review.adminReply = adminReply;
    await review.save();

    broadcastReviewUpdated(review);

    res.status(200).json({ success: true, data: review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete review
 */
export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    broadcastReviewDeleted(String(id));

    res.status(200).json({ success: true, message: 'Review deleted successfully' });

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

