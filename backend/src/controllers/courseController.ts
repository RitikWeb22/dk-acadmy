import type { Request, Response } from 'express';
import { Course } from '../models/Course.js';
import { FreeLecture } from '../models/FreeLecture.js';
import { CMSConfig } from '../models/CMS.js';
import { escapeRegex, getPagination } from '../utils/sanitize.js';
import {
  broadcastCMSUpdated,
  broadcastCourseCreated,
  broadcastCourseUpdated,
  broadcastCourseDeleted
} from '../sockets/socket.js';
import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from '../config/redis.js';

export const getAllCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, targetClass, mode, search, page, limit } = req.query;
    const filter: any = {};

    // Exclude permanently deleted courses
    const deletedConfig = await CMSConfig.findOne({ key: 'deleted_course_ids' }).lean().catch(() => null);
    const deletedIds: string[] = Array.isArray(deletedConfig?.data) ? deletedConfig.data : [];

    const isDefaultQuery = !category && !targetClass && !mode && !search && !page && !limit;
    if (isDefaultQuery) {
      const cachedCourses = await cacheGet<any[]>('courses:all');
      if (cachedCourses && Array.isArray(cachedCourses)) {
        const filteredCached = deletedIds.length > 0
          ? cachedCourses.filter((c: any) =>
              !deletedIds.includes(String(c._id)) &&
              !deletedIds.includes(c.slug) &&
              !deletedIds.includes(c.id) &&
              !deletedIds.includes(c.title)
            )
          : cachedCourses;
        res.status(200).json({ success: true, count: filteredCached.length, data: filteredCached });
        return;
      }
    }

    if (deletedIds.length > 0) {
      const objectIds = deletedIds.filter(id => /^[0-9a-fA-F]{24}$/.test(id));
      filter._id = { $nin: objectIds };
      filter.slug = { $nin: deletedIds };
      filter.title = { $nin: deletedIds };
    }

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

    const rawCourses = await Course.find(filter).sort({ createdAt: -1 }).lean();

    // Also synthesize course tracks from FreeLecture collection that are not already in Course collection
    const existingSlugs = new Set(rawCourses.map((c: any) => String(c.slug || '').toLowerCase()));
    const freeLectures = await FreeLecture.find(
      deletedIds.length > 0 ? { trackId: { $nin: deletedIds }, title: { $nin: deletedIds } } : {}
    )
      .sort({ trackId: 1, order: 1 })
      .lean()
      .catch(() => []);

    const trackMap = new Map<string, any[]>();
    for (const lec of freeLectures) {
      const tid = String(lec.trackId || '').trim().toLowerCase();
      if (!tid || existingSlugs.has(tid) || deletedIds.includes(tid)) continue;
      if (!trackMap.has(tid)) trackMap.set(tid, []);
      trackMap.get(tid)!.push(lec);
    }

    const synthesizedTrackCourses: any[] = [];
    trackMap.forEach((trackLecs, tid) => {
      if (trackLecs.length === 0) return;
      const first = trackLecs[0];
      const freeCount = trackLecs.filter((l) => l.isFree).length;
      const paidPrice = trackLecs.find((l) => !l.isFree && l.price > 0)?.price || 0;

      synthesizedTrackCourses.push({
        _id: first._id,
        id: tid,
        slug: tid,
        title: first.trackTitle || first.title,
        description:
          first.description ||
          'Masterclass lecture series featuring structured video lessons, notes, and JEE Main/Advanced practice.',
        category: first.subject || 'Mathematics',
        targetClass: first.targetClass || 'Class 11 & 12',
        targetYear: 'Target JEE 2026/27',
        targetExam: first.targetExam || 'JEE Main & Advanced',
        instructor: first.facultyName || 'Dharmendra Kumar (DK Sir)',
        price: freeCount === trackLecs.length ? 0 : paidPrice,
        originalPrice: freeCount === trackLecs.length ? 999 : paidPrice + 500,
        tier: freeCount === trackLecs.length ? 'Free' : 'Paid',
        deliveryMode: 'Structured Recorded',
        mode: 'Structured Recorded',
        courseType: 'recorded',
        duration: `${trackLecs.length} Lectures`,
        coverImage: first.thumbnailUrl || '/img/dk-sir.jpg',
        demoVideoUrl: first.videoUrl || '',
        tags: Array.isArray(first.tags) ? first.tags : [],
        badge:
          first.badge ||
          (freeCount === trackLecs.length ? '100% Free Demo' : `${freeCount} Free Lectures`),
        features: [
          `${trackLecs.length} Structured Video Lectures`,
          'Interactive Lesson MCQs & Instant Score Tracking',
          'Downloadable Practice DPPs & Notes PDF'
        ],
        curriculumSections: [
          {
            id: `sec-${tid}`,
            title: first.trackTitle || first.title,
            description: first.description || '',
            lectures: trackLecs.map((l, idx) => ({
              id: l.id || String(l._id) || `lec-${idx + 1}`,
              title: l.title,
              duration: l.duration || '45 min',
              videoUrl: l.videoUrl,
              isFree: Boolean(l.isFree),
              isFreePreview: Boolean(l.isFree),
              isPreview: Boolean(l.isFree),
              isLocked: !l.isFree,
              price: l.isFree ? 0 : (l.price || 499),
              notesPdfUrl: l.notesPdfUrl,
              dppPdfUrl: l.dppUrl,
              points: Number(l.points) || 40,
              mcqs: Array.isArray(l.mcqs) ? l.mcqs : []
            }))
          }
        ],
        isPublished: true,
        status: 'published',
        enrolmentCount: 120,
        rating: 4.9
      });
    });

    const courses = [...rawCourses, ...synthesizedTrackCourses];
    if (isDefaultQuery) {
      await cacheSet('courses:all', courses, 60);
    }
    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCourseBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = String(req.params.slug);
    const cacheKey = `course:${slug}`;

    const cachedCourse = await cacheGet(cacheKey);
    if (cachedCourse) {
      res.status(200).json({ success: true, data: cachedCourse });
      return;
    }

    let course: any = await Course.findOne({
      $or: [{ slug }, { _id: slug.match(/^[0-9a-fA-F]{24}$/) ? slug : null }]
    }).lean();

    // Query matching FreeLecture records for this course/track
    const freeLectures = await FreeLecture.find({
      $or: [{ trackId: slug }, { trackTitle: course?.title }]
    })
      .sort({ order: 1 })
      .lean()
      .catch(() => []);

    // If not found in Course collection, try synthesizing from FreeLecture
    if (!course) {
      if (freeLectures && freeLectures.length > 0) {
        const first = freeLectures[0];
        const freeCount = freeLectures.filter((l) => l.isFree).length;
        const paidPrice = freeLectures.find((l) => !l.isFree && l.price > 0)?.price || 0;
        course = {
          _id: first._id,
          id: slug,
          slug,
          title: first.trackTitle || first.title,
          description:
            first.description ||
            'Masterclass lecture series featuring structured video lessons, notes, and JEE Main/Advanced practice.',
          category: first.subject || 'Mathematics',
          targetClass: first.targetClass || 'Class 11 & 12',
          targetYear: 'Target JEE 2026/27',
          targetExam: first.targetExam || 'JEE Main & Advanced',
          instructor: first.facultyName || 'Dharmendra Kumar (DK Sir)',
          price: freeCount === freeLectures.length ? 0 : paidPrice,
          originalPrice: freeCount === freeLectures.length ? 999 : paidPrice + 500,
          tier: freeCount === freeLectures.length ? 'Free' : 'Paid',
          deliveryMode: 'Structured Recorded',
          mode: 'Structured Recorded',
          courseType: 'recorded',
          duration: `${freeLectures.length} Lectures`,
          coverImage: first.thumbnailUrl || '/img/dk-sir.jpg',
          demoVideoUrl: first.videoUrl || '',
          tags: Array.isArray(first.tags) ? first.tags : [],
          badge:
            first.badge ||
            (freeCount === freeLectures.length ? '100% Free Demo' : `${freeCount} Free Lectures`),
          features: [
            `${freeLectures.length} Structured Video Lectures`,
            'Interactive Lesson MCQs & Instant Score Tracking',
            'Downloadable Practice DPPs & Notes PDF'
          ],
          curriculumSections: [
            {
              id: `sec-${slug}`,
              title: first.trackTitle || first.title,
              description: first.description || '',
              lectures: freeLectures.map((l, idx) => ({
                id: l.id || String(l._id) || `lec-${idx + 1}`,
                title: l.title,
                duration: l.duration || '45 min',
                videoUrl: l.videoUrl,
                isFree: Boolean(l.isFree),
                isFreePreview: Boolean(l.isFree),
                isPreview: Boolean(l.isFree),
                isLocked: !l.isFree,
                price: l.isFree ? 0 : (l.price || 499),
                notesPdfUrl: l.notesPdfUrl,
                dppPdfUrl: l.dppUrl,
                points: Number(l.points) || 40,
                mcqs: Array.isArray(l.mcqs) ? l.mcqs : []
              }))
            }
          ],
          isPublished: true,
          status: 'published',
          enrolmentCount: 120,
          rating: 4.9
        };
      } else {
        res.status(404).json({ success: false, message: 'Course not found' });
        return;
      }
    } else if (Array.isArray(course.curriculumSections) && freeLectures && freeLectures.length > 0) {
      // Synchronize curriculumSections with FreeLecture collection so free/paid accurately reflects admin state
      course.curriculumSections = course.curriculumSections.map((sec: any) => ({
        ...sec,
        lectures: (sec.lectures || []).map((lec: any, idx: number) => {
          const fl = freeLectures.find(
            (item: any) =>
              item.id === lec.id ||
              String(item._id) === String(lec._id) ||
              (item.title && lec.title && item.title.trim().toLowerCase() === lec.title.trim().toLowerCase())
          ) || freeLectures[idx];
          if (fl) {
            return {
              ...lec,
              isFree: Boolean(fl.isFree),
              isFreePreview: Boolean(fl.isFree),
              isPreview: Boolean(fl.isFree),
              isLocked: !fl.isFree,
              price: fl.isFree ? 0 : (fl.price || 499)
            };
          }
          return lec;
        })
      }));
    }

    await cacheSet(cacheKey, course, 60);
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

    if (courseData.status && typeof courseData.status === 'string') {
      courseData.status = courseData.status.toLowerCase();
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
        await cacheDel('courses:all', `course:${existing.slug}`, `course:${existing._id}`);
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
    await cacheDel('courses:all');
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

    // Try finding by _id, slug, or title across all provided identifiers
    const cleanId = id.trim().replace(/^["']|["']$/g, '');
    const orClauses: any[] = [];

    // 1. Check ID as 24-hex ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(cleanId)) {
      orClauses.push({ _id: cleanId });
    }
    // 2. Check cleanId as slug
    if (cleanId) {
      orClauses.push({ slug: cleanId });
    }

    // 3. Check updates._id or updates.id
    const payloadId = updates._id || updates.id;
    if (payloadId && /^[0-9a-fA-F]{24}$/.test(String(payloadId).trim())) {
      orClauses.push({ _id: String(payloadId).trim() });
    }

    // 4. Check updates.slug
    if (updates.slug && updates.slug !== cleanId) {
      orClauses.push({ slug: updates.slug });
    }

    // 5. Check original title if provided
    if (updates.originalTitle && typeof updates.originalTitle === 'string' && updates.originalTitle.trim()) {
      const origEscaped = updates.originalTitle.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      orClauses.push({ title: updates.originalTitle.trim() });
      orClauses.push({ title: { $regex: new RegExp(`^${origEscaped}$`, 'i') } });
    }

    // 6. Check title
    if (updates.title && typeof updates.title === 'string' && updates.title.trim()) {
      const titleEscaped = updates.title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      orClauses.push({ title: updates.title.trim() });
      orClauses.push({ title: { $regex: new RegExp(`^${titleEscaped}$`, 'i') } });
    }

    // Never modify immutable _id field in MongoDB document updates
    delete updates._id;

    // Ensure published courses remain published
    if (updates.status && typeof updates.status === 'string') {
      if (updates.status.toLowerCase() === 'published' && updates.isPublished === undefined) {
        updates.isPublished = true;
      }
    }

    let updated = null;
    if (orClauses.length > 0) {
      updated = await Course.findOneAndUpdate(
        { $or: orClauses },
        updates,
        { new: true, runValidators: false }
      );
    }

    // Fuzzy title match fallback
    if (!updated && updates.title && typeof updates.title === 'string' && updates.title.trim()) {
      const escaped = updates.title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      updated = await Course.findOneAndUpdate(
        { title: { $regex: new RegExp(escaped, 'i') } },
        updates,
        { new: true, runValidators: false }
      );
    }

    // If not found in MongoDB (e.g. was a catalog course not yet saved to DB), UPSERT it!
    if (!updated) {
      const courseSlug = updates.slug || (updates.title ? updates.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : `course-${Date.now()}`);
      
      // Safety check: ensure slug doesn't already exist to prevent duplicate creation
      const existingBySlug = await Course.findOne({ slug: courseSlug });
      if (existingBySlug) {
        updated = await Course.findByIdAndUpdate(existingBySlug._id, updates, { new: true, runValidators: false });
      } else {
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
          status: (typeof updates.status === 'string' ? updates.status.toLowerCase() : 'published') as any
        };

        updated = await Course.create(newCourseDoc);
        await cacheDel('courses:all', `course:${courseSlug}`, `course:${updated._id}`);
        broadcastCourseCreated(updated);
        res.status(200).json({
          success: true,
          message: 'Course created and persisted to MongoDB successfully',
          data: updated
        });
        return;
      }
    }

    if (!updated) {
      res.status(404).json({ success: false, message: 'Course not found to update' });
      return;
    }

    await cacheDel('courses:all', `course:${id}`, `course:${updated.slug}`, `course:${updated._id}`);
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
    const cleanId = id.replace(/^\//, '');
    const queryConditions: any[] = [
      { slug: id },
      { slug: cleanId },
      { slug: `/${cleanId}` },
      { title: id },
      { title: cleanId }
    ];
    if (/^[0-9a-fA-F]{24}$/.test(cleanId)) {
      queryConditions.push({ _id: cleanId });
    }
    const slugified = cleanId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (slugified) {
      queryConditions.push({ slug: slugified });
      queryConditions.push({ slug: `/${slugified}` });
    }

    const deleted = await Course.findOneAndDelete({ $or: queryConditions });

    // Store in CMSConfig blacklist so it is never re-seeded or returned
    const toBlacklist = [id, cleanId];
    if (deleted?._id) toBlacklist.push(String(deleted._id));
    if (deleted?.slug) {
      toBlacklist.push(deleted.slug);
      toBlacklist.push(deleted.slug.replace(/^\//, ''));
    }
    if (deleted?.title) toBlacklist.push(deleted.title);
    if (slugified) toBlacklist.push(slugified);

    try {
      const existingDeleted = await CMSConfig.findOne({ key: 'deleted_course_ids' });
      if (!existingDeleted) {
        await CMSConfig.create({
          key: 'deleted_course_ids',
          data: toBlacklist,
          updatedBy: (req as any).user?.email || 'Admin'
        });
      } else {
        const merged = Array.from(new Set([...(existingDeleted.data || []), ...toBlacklist]));
        existingDeleted.data = merged;
        await existingDeleted.save();
      }
    } catch (cmsErr) {
      console.warn('[deleteCourse] CMSConfig blacklist warning:', cmsErr);
    }

    await cacheDel('courses:all', `course:${id}`, `course:${deleted?._id}`, `course:${deleted?.slug}`);
    broadcastCourseDeleted(id);
    if (deleted?._id && String(deleted._id) !== id) broadcastCourseDeleted(String(deleted._id));
    if (deleted?.slug && deleted.slug !== id) broadcastCourseDeleted(deleted.slug);

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
