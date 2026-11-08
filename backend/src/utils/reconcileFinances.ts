import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { TestSubmission } from '../models/TestSubmission.js';
import { DistributedLock } from '../models/DistributedLock.js';

export interface AuditReport {
  timestamp: string;
  dryRun: boolean;
  courseCountDiscrepancies: Array<{
    courseId: string;
    courseTitle: string;
    recordedCount: number;
    actualOrderCount: number;
    difference: number;
    fixed?: boolean;
  }>;
  userAccessDiscrepancies: Array<{
    userId: string;
    studentEmail: string;
    missingCourses: string[];
    extraCourses: string[];
    fixed?: boolean;
  }>;
  orphanedDrafts: {
    found: number;
    cleanedUp?: number;
  };
  staleLocks: {
    found: number;
    cleanedUp?: number;
  };
}

/**
 * Runs a comprehensive financial, enrolment, and database consistency audit.
 * @param dryRun If true (default), reports discrepancies without mutating database.
 */
export async function runReconciliationAudit(options: { dryRun?: boolean } = {}): Promise<AuditReport> {
  const dryRun = options.dryRun !== false;

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    dryRun,
    courseCountDiscrepancies: [],
    userAccessDiscrepancies: [],
    orphanedDrafts: { found: 0 },
    staleLocks: { found: 0 }
  };

  // 1. Audit Course Enrolment Counts vs Actual Successful Orders
  const courses = await Course.find({});
  for (const course of courses) {
    const courseIdStr = course._id.toString();
    const slugStr = course.slug;

    // Count distinct successful buyers
    const matchingOrders = await Order.find({
      $or: [{ courseId: courseIdStr }, { courseId: slugStr }],
      status: 'SUCCESS'
    });

    const uniquePaidUsers = new Set(
      matchingOrders.map((o) => (o.userId ? o.userId.toString() : o.studentEmail)).filter(Boolean)
    );
    const actualOrderCount = uniquePaidUsers.size;
    const recordedCount = course.enrolmentCount || 0;

    if (recordedCount !== actualOrderCount) {
      const discrepancy = {
        courseId: courseIdStr,
        courseTitle: course.title,
        recordedCount,
        actualOrderCount,
        difference: actualOrderCount - recordedCount,
        fixed: false
      };

      if (!dryRun) {
        await Course.findByIdAndUpdate(course._id, {
          $set: { enrolmentCount: Math.max(0, actualOrderCount) }
        });
        discrepancy.fixed = true;
      }

      report.courseCountDiscrepancies.push(discrepancy);
    }
  }

  // 2. Audit User Enrolled Courses vs Orders
  const successfulOrders = await Order.find({ status: 'SUCCESS', userId: { $exists: true, $ne: null } });
  const userOrderMap = new Map<string, Set<string>>();

  for (const ord of successfulOrders) {
    if (!ord.userId) continue;
    const uId = ord.userId.toString();
    if (!userOrderMap.has(uId)) {
      userOrderMap.set(uId, new Set<string>());
    }
    userOrderMap.get(uId)!.add(ord.courseId);
  }

  for (const [uId, paidCourseIds] of userOrderMap.entries()) {
    const user = await User.findById(uId);
    if (!user) continue;

    const currentEnrolled = new Set((user.enrolledCourses || []).map((c: any) => c.toString()));
    const missingCourses: string[] = [];

    for (const paidCourse of paidCourseIds) {
      if (!currentEnrolled.has(paidCourse)) {
        missingCourses.push(paidCourse);
      }
    }

    if (missingCourses.length > 0) {
      const accessDiscrepancy = {
        userId: uId,
        studentEmail: user.email,
        missingCourses,
        extraCourses: [],
        fixed: false
      };

      if (!dryRun) {
        await User.findByIdAndUpdate(user._id, {
          $addToSet: { enrolledCourses: { $each: missingCourses } }
        });
        accessDiscrepancy.fixed = true;
      }

      report.userAccessDiscrepancies.push(accessDiscrepancy);
    }
  }

  // 3. Stale/Expired Distributed Locks
  const now = new Date();
  const staleLocks = await DistributedLock.find({ expiresAt: { $lt: now } });
  report.staleLocks.found = staleLocks.length;

  if (!dryRun && staleLocks.length > 0) {
    const delRes = await DistributedLock.deleteMany({ expiresAt: { $lt: now } });
    report.staleLocks.cleanedUp = delRes.deletedCount || 0;
  }

  // 4. Orphaned In-Progress Drafts (> 72 hours old)
  const threeDaysAgo = new Date(Date.now() - 72 * 3600 * 1000);
  const orphanedDrafts = await TestSubmission.find({
    status: 'IN_PROGRESS',
    updatedAt: { $lt: threeDaysAgo }
  });
  report.orphanedDrafts.found = orphanedDrafts.length;

  if (!dryRun && orphanedDrafts.length > 0) {
    const delRes = await TestSubmission.deleteMany({
      status: 'IN_PROGRESS',
      updatedAt: { $lt: threeDaysAgo }
    });
    report.orphanedDrafts.cleanedUp = delRes.deletedCount || 0;
  }

  return report;
}

// CLI entry point
if (process.argv[1] && process.argv[1].includes('reconcileFinances')) {
  const isFix = process.argv.includes('--fix');
  const dryRun = !isFix;

  (async () => {
    try {
      const { env } = await import('../config/env.js');
      const uri = env.MONGO_URI;
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(uri);
      }

      console.log(`[Reconciliation] Running financial & data consistency audit (Mode: ${dryRun ? 'DRY-RUN' : 'REPAIR --fix'})...`);
      const report = await runReconciliationAudit({ dryRun });
      console.log('[Reconciliation Audit Report]:\n', JSON.stringify(report, null, 2));

      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('[Reconciliation Error]:', err);
      process.exit(1);
    }
  })();
}

