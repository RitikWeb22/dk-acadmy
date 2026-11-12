import type { Request, Response } from 'express';
import { Course } from '../models/Course.js';
import { escapeRegex, getPagination } from '../utils/sanitize.js';
import {
  broadcastCMSUpdated,
  broadcastCourseCreated,
  broadcastCourseUpdated,
  broadcastCourseDeleted
} from '../sockets/socket.js';

export const getAllCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, targetClass, mode, search, page, limit } = req.query;
    const filter: any = {};

    if (category && category !== 'All') filter.category = category;
    if (targetClass && targetClass !== 'All') filter.targetClass = targetClass;
    if (mode && mode !== 'All') filter.deliveryMode = mode;
    if (search && typeof search === 'string' && search.trim()) {
      const q = escapeRegex(search.trim());
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { subtitle: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } }
      ];
    }

    if (limit) {
      const pagination = getPagination(page, limit, 20, 100);
      const [courses, total] = await Promise.all([
        Course.find(filter)
          .sort({ createdAt: -1 })
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),
        Course.countDocuments(filter)
      ]);

      res.status(200).json({
        success: true,
        count: courses.length,
        total,
        page: pagination.page,
        totalPages: Math.ceil(total / pagination.limit),
        hasMore: pagination.page * pagination.limit < total,
        data: courses
      });
      return;
    }

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

    // Normalize originalPrice to number
    if (typeof courseData.originalPrice === 'string') {
      const parsed = parseInt(courseData.originalPrice.replace(/\D/g, ''), 10);
      courseData.originalPrice = isNaN(parsed) ? undefined : parsed;
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
    if (!courseData.mode) {
      courseData.mode = courseData.deliveryMode;
    }

    // Normalize tags
    if (courseData.tags) {
      if (!Array.isArray(courseData.tags)) {
        courseData.tags = typeof courseData.tags === 'string'
          ? courseData.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
          : [];
      }
    } else {
      courseData.tags = [];
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

    // 1. Normalize price if passed as string or numeric
    if (typeof updates.price === 'string') {
      const parsed = parseInt(updates.price.replace(/\D/g, ''), 10);
      updates.price = isNaN(parsed) ? 0 : parsed;
    } else if (updates.numericPrice !== undefined) {
      updates.price = Number(updates.numericPrice);
    }

    // 2. Normalize originalPrice if passed as string (e.g. "₹45,000" -> 45000)
    if (typeof updates.originalPrice === 'string') {
      const parsed = parseInt(updates.originalPrice.replace(/\D/g, ''), 10);
      updates.originalPrice = isNaN(parsed) ? undefined : parsed;
    }

    // 3. Normalize tags
    if (updates.tags) {
      if (!Array.isArray(updates.tags)) {
        updates.tags = typeof updates.tags === 'string'
          ? updates.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
          : [];
      }
    }

    // 4. Normalize features
    if (updates.features && typeof updates.features === 'string') {
      updates.features = [updates.features];
    }

    // Try finding by _id, slug, or title
    const searchFilter: any = {
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { slug: id }
      ]
    };
    if (updates.title) {
      searchFilter.$or.push({ title: updates.title });
    }

    let updated = await Course.findOneAndUpdate(
      searchFilter,
      updates,
      { new: true, runValidators: false }
    );

    // If not found in MongoDB (e.g. was a catalog course not yet saved to DB), UPSERT it!
    if (!updated) {
      const courseSlug = updates.slug || (updates.title ? updates.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : `course-${Date.now()}`);
      
      const newCourseDoc = {
        ...updates,
        title: updates.title || 'Untitled Course',
        slug: courseSlug,
        category: updates.category || 'JEE Main & Advanced',
        targetClass: updates.targetClass || 'Class 11th',
        targetYear: updates.targetYear || 'Target JEE 2028',
        price: typeof updates.price === 'number' ? updates.price : 0,
        originalPrice: typeof updates.originalPrice === 'number' ? updates.originalPrice : undefined,
        deliveryMode: updates.deliveryMode || updates.mode || 'Online Live',
        mode: updates.mode || updates.deliveryMode || 'Online Live',
        isPublished: updates.isPublished !== false,
        status: updates.status || 'published'
      };

      updated = await Course.create(newCourseDoc);
      broadcastCourseCreated(updated);
      res.status(200).json({
        success: true,
        message: 'Course created and persisted to MongoDB successfully',
        data: updated
      });
      return;
    }

    broadcastCourseUpdated(updated);
    res.status(200).json({
      success: true,
      message: 'Course updated successfully in MongoDB',
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
