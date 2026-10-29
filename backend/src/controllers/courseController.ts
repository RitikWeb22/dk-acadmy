import type { Request, Response } from 'express';
import { Course } from '../models/Course.js';
import {
  broadcastCMSUpdated,
  broadcastCourseCreated,
  broadcastCourseUpdated,
  broadcastCourseDeleted
} from '../sockets/socket.js';

export const getAllCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, targetClass, mode } = req.query;
    const filter: any = {};

    if (category && category !== 'All') filter.category = category;
    if (targetClass && targetClass !== 'All') filter.targetClass = targetClass;
    if (mode && mode !== 'All') filter.deliveryMode = mode;

    const courses = await Course.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCourseBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = String(req.params.slug);
    const course = await Course.findOne({
      $or: [{ slug }, { _id: slug.match(/^[0-9a-fA-F]{24}$/) ? slug : null }]
    });

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    res.status(200).json({ success: true, data: course });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseData = { ...req.body };

    if (!courseData.title) {
      res.status(400).json({ success: false, message: 'Course title is required' });
      return;
    }

    // Auto-generate slug if not provided
    if (!courseData.slug) {
      courseData.slug = courseData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    // Normalize price to number
    if (typeof courseData.price === 'string') {
      const parsed = parseInt(courseData.price.replace(/\D/g, ''), 10);
      courseData.price = isNaN(parsed) ? 0 : parsed;
    } else if (courseData.numericPrice !== undefined) {
      courseData.price = Number(courseData.numericPrice);
    }

    // Provide sensible defaults for required schema fields
    if (!courseData.category) {
      courseData.category = 'JEE Main & Advanced';
    }
    if (!courseData.targetClass) {
      courseData.targetClass = 'Class 11th';
    }
    if (!courseData.targetYear) {
      courseData.targetYear = 'Target JEE 2028';
    }
    if (!courseData.deliveryMode) {
      courseData.deliveryMode = courseData.mode || 'Online Live';
    }

    // Check if course with this slug exists
    const existing = await Course.findOne({ slug: courseData.slug });
    if (existing) {
      // Update existing course instead of hard erroring
      const updated = await Course.findByIdAndUpdate(existing._id, courseData, {
        new: true,
        runValidators: true
      });
      if (updated) {
        broadcastCourseUpdated(updated);
        res.status(200).json({
          success: true,
          message: 'Existing course updated successfully',
          data: updated
        });
        return;
      }
    }

    const newCourse = await Course.create(courseData);
    broadcastCourseCreated(newCourse);

    res.status(201).json({
      success: true,
      message: 'Course created and persisted to MongoDB successfully',
      data: newCourse
    });
  } catch (error: any) {
    console.error('[CreateCourse Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const updates = { ...req.body };

    // Normalize price if passed as string
    if (typeof updates.price === 'string') {
      const parsed = parseInt(updates.price.replace(/\D/g, ''), 10);
      updates.price = isNaN(parsed) ? 0 : parsed;
    }

    const updated = await Course.findOneAndUpdate(
      { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { slug: id }] },
      updates,
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    broadcastCourseUpdated(updated);
    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: updated
    });
  } catch (error: any) {
    console.error('[UpdateCourse Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const deleted = await Course.findOneAndDelete({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { slug: id }]
    });

    broadcastCourseDeleted(id);
    res.status(200).json({
      success: true,
      message: 'Course deleted successfully from MongoDB',
      deletedId: deleted?._id || id
    });
  } catch (error: any) {
    console.error('[DeleteCourse Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
