import dotenv from 'dotenv';
dotenv.config();

import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Course } from '../src/models/Course.js';
import { Order } from '../src/models/Order.js';
import { TestSeries } from '../src/models/TestSeries.js';
import { TestSubmission } from '../src/models/TestSubmission.js';
import { DistributedLock } from '../src/models/DistributedLock.js';
import { acquireDistributedLock, releaseDistributedLock, withDistributedLock } from '../src/utils/distributedLock.js';

describe('DK Academy Backend — Phase 4: Distributed System Reliability & Financial Integrity Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  let studentToken: string;
  let studentId: string;
  let testCourse: any;
  let testSeries: any;

  const JWT_SECRET = env.JWT_SECRET;
  const RAZORPAY_WEBHOOK_SECRET = env.RAZORPAY_WEBHOOK_SECRET;

  before(async () => {
    // Ensure database connection
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGO_URI, {
        family: 4,
        serverSelectionTimeoutMS: 15000
      });
    }

    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    // Create test student
    const testEmail = `dist_student_${Date.now()}@test-phase4.com`;
    const user = await User.create({
      name: 'Distributed Student',
      email: testEmail,
      password: 'HashedPassword$1234',
      role: 'STUDENT',
      isVerified: true
    });
    studentId = user._id.toString();

    studentToken = jwt.sign(
      { id: user._id.toString(), email: user.email, role: 'STUDENT' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create test course
    testCourse = await Course.create({
      title: 'Phase 4 Distributed Reliability Course',
      slug: `dist-course-${Date.now()}`,
      category: 'JEE Main',
      targetClass: 'Class 12',
      targetYear: '2026',
      description: 'Distributed testing course',
      price: 4999,
      enrolmentCount: 0,
      isPublished: true
    });

    // Create test series
    const testId = `dist-test-${Date.now()}`;
    testSeries = await TestSeries.create({
      id: testId,
      title: 'Phase 4 Advanced Test Series',
      slug: testId,
      examType: 'JEE Main',
      pattern: 'JEE_MAIN',
      durationInMinutes: 180,
      totalMarks: 300,
      questions: [
        {
          id: 'q1',
          type: 'SINGLE_CHOICE',
          subject: 'Physics',
          statement: 'Evaluate the kinetic energy formula',
          options: [{ id: 'A', text: '1/2 mv^2' }, { id: 'B', text: 'mv' }],
          correctAnswer: 'A',
          marks: 4,
          negativeMarks: 1
        }
      ]
    });
  });

  after(async () => {
    // Clean up created entities
    try {
      if (studentId) await User.findByIdAndDelete(studentId);
      if (testCourse?._id) await Course.findByIdAndDelete(testCourse._id);
      if (testSeries?._id) await TestSeries.findByIdAndDelete(testSeries._id);
      await TestSubmission.deleteMany({ studentId });
      await Order.deleteMany({ studentEmail: { $regex: /@test-phase4\.com$/ } });
      await DistributedLock.deleteMany({ lockKey: { $regex: /^test-/ } });
    } catch {
      // ignore
    }

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    } catch {
      // ignore
    }
  });

  // ==========================================
  // SECTION 1: Distributed Lock & Leader Election
  // ==========================================
  describe('Distributed Lock Coordination across Workers', () => {
    test('Worker 1 acquires exclusive lock; Worker 2 is rejected while lease is active', async () => {
      const lockKey = `test-job-${Date.now()}`;
      const worker1 = 'worker-node-1';
      const worker2 = 'worker-node-2';

      const acquired1 = await acquireDistributedLock(lockKey, 5000, worker1);
      assert.equal(acquired1, true, 'Worker 1 must acquire initial lock');

      const acquired2 = await acquireDistributedLock(lockKey, 5000, worker2);
      assert.equal(acquired2, false, 'Worker 2 must be rejected while Worker 1 holds active lease');

      // Worker 1 releases
      const released = await releaseDistributedLock(lockKey, worker1);
      assert.equal(released, true, 'Worker 1 must release lock cleanly');

      // Now Worker 2 can acquire
      const acquired2After = await acquireDistributedLock(lockKey, 5000, worker2);
      assert.equal(acquired2After, true, 'Worker 2 can acquire lock after Worker 1 release');
      await releaseDistributedLock(lockKey, worker2);
    });

    test('Expired lock is automatically reclaimed by next worker', async () => {
      const lockKey = `test-expire-${Date.now()}`;
      const worker1 = 'worker-dying';
      const worker2 = 'worker-survivor';

      // Worker 1 acquires lock with 50ms TTL
      await acquireDistributedLock(lockKey, 50, worker1);

      // Wait 100ms for lease expiration
      await new Promise((res) => setTimeout(res, 100));

      // Worker 2 should now acquire the expired lease
      const acquired2 = await acquireDistributedLock(lockKey, 5000, worker2);
      assert.equal(acquired2, true, 'Worker 2 must reclaim expired lock lease');
      await releaseDistributedLock(lockKey, worker2);
    });

    test('withDistributedLock guarantees single execution among parallel promises', async () => {
      const lockKey = `test-parallel-${Date.now()}`;
      let executions = 0;

      const workers = Array.from({ length: 10 }, (_, i) => `worker-${i}`);
      const tasks = workers.map((wId) =>
        withDistributedLock(
          lockKey,
          5000,
          async () => {
            executions++;
            await new Promise((res) => setTimeout(res, 500));
            return 'done';
          },
          wId
        )
      );

      const results = await Promise.all(tasks);
      const successfulExecutions = results.filter((r) => r.executed);

      assert.equal(successfulExecutions.length, 1, 'Exactly one worker must execute the critical task');
      assert.equal(executions, 1, 'Task function must run exactly once');
    });
  });

  // ==========================================
  // SECTION 2: Out-of-Order Autosave & Versioning
  // ==========================================
  describe('Examination-Day Autosave Jitter & Collision Defenses', () => {
    test('Newer autosave response is persisted; out-of-order delayed packet is discarded without error', async () => {
      const now = Date.now();

      // 1. Student answers q1 with option A at t = 1000
      const res1 = await fetch(`${baseUrl}/api/v1/test-series/${testSeries._id}/autosave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          studentId,
          timeSpentSeconds: 60,
          clientTimestamp: now + 1000,
          responses: { q1: { selectedOption: 'A' } }
        })
      });

      assert.equal(res1.status, 200);
      const data1 = (await res1.json()) as any;
      assert.equal(data1.success, true);
      assert.equal(data1.data.attemptVersion, 1);

      // 2. Student updates answer to B at t = 2000
      const res2 = await fetch(`${baseUrl}/api/v1/test-series/${testSeries._id}/autosave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          studentId,
          timeSpentSeconds: 120,
          clientTimestamp: now + 2000,
          responses: { q1: { selectedOption: 'B' } }
        })
      });

      assert.equal(res2.status, 200);
      const data2 = (await res2.json()) as any;
      assert.equal(data2.data.attemptVersion, 2);

      // 3. Delayed network packet from t = 500 arrives OUT OF ORDER (stale)
      const resStale = await fetch(`${baseUrl}/api/v1/test-series/${testSeries._id}/autosave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          studentId,
          timeSpentSeconds: 30,
          clientTimestamp: now + 500, // Older than 2000
          responses: { q1: { selectedOption: 'STALE_OVERWRITE' } }
        })
      });

      assert.equal(resStale.status, 200);
      const dataStale = (await resStale.json()) as any;
      assert.equal(dataStale.ignored, true, 'Delayed packet must be flagged as ignored');

      // 4. Verify progress endpoint still returns newest option B
      const progressRes = await fetch(`${baseUrl}/api/v1/test-series/${testSeries._id}/progress`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      assert.equal(progressRes.status, 200);
      const progressData = (await progressRes.json()) as any;
      assert.equal(progressData.data.responses.q1.selectedOption, 'B', 'Option B must not be overwritten by stale packet');
    });

    test('Autosave after finalized exam submission is rejected with 409 Conflict', async () => {
      // 1. Submit the test series to finalize it
      const submitRes = await fetch(`${baseUrl}/api/v1/test-series/${testSeries._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          clientSubmissionId: `final-sub-${Date.now()}`,
          studentId,
          responses: { q1: { selectedOption: 'A' } }
        })
      });
      assert.equal(submitRes.status, 201);

      // 2. Attempt autosave after submission
      const lateAutosaveRes = await fetch(`${baseUrl}/api/v1/test-series/${testSeries._id}/autosave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          studentId,
          responses: { q1: { selectedOption: 'B' } }
        })
      });

      assert.equal(lateAutosaveRes.status, 409, 'Autosave after final submit must return 409 Conflict');
      const lateData = (await lateAutosaveRes.json()) as any;
      assert.match(lateData.message, /already been finalized/i);
    });
  });

  // ==========================================
  // SECTION 3: Financial Webhook Idempotency & Bounded Enrollment
  // ==========================================
  describe('Financial Webhook Deduplication, Refunds & Bounded Counters', () => {
    test('Duplicate refund webhooks do not decrement course count twice or produce negative numbers', async () => {
      // Initial state: Course has enrolmentCount 1
      await Course.findByIdAndUpdate(testCourse._id, { $set: { enrolmentCount: 1 } });
      await User.findByIdAndUpdate(studentId, { $addToSet: { enrolledCourses: testCourse._id.toString() } });

      const testPaymentId = `pay_refund_${Date.now()}`;
      const testOrderId = `order_refund_${Date.now()}`;

      // Create existing SUCCESS order
      const order = await Order.create({
        orderId: testOrderId,
        paymentId: testPaymentId,
        studentName: 'Distributed Student',
        studentEmail: 'student@test-phase4.com',
        courseId: testCourse._id.toString(),
        courseTitle: testCourse.title,
        amount: 4999,
        status: 'SUCCESS'
      });

      const refundWebhookPayload = {
        event: 'refund.processed',
        payload: {
          refund: {
            entity: {
              id: `rfnd_${Date.now()}`,
              payment_id: testPaymentId,
              amount: 499900,
              status: 'processed'
            }
          }
        }
      };

      const rawBody = JSON.stringify(refundWebhookPayload);
      const signature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      // 1. Send first refund webhook
      const res1 = await fetch(`${baseUrl}/api/v1/payment/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': signature,
          'x-razorpay-event-id': `event_refund_1_${Date.now()}`
        },
        body: rawBody
      });
      assert.equal(res1.status, 200);

      // Verify order marked REFUNDED and course count decremented to 0
      const orderAfter1 = await Order.findById(order._id);
      assert.equal(orderAfter1?.status, 'REFUNDED');
      assert.equal(orderAfter1?.refundAmount, 4999);

      const courseAfter1 = await Course.findById(testCourse._id);
      assert.equal(courseAfter1?.enrolmentCount, 0, 'Count should be 0 after first refund');

      // 2. Send duplicate refund webhook (network retry or delayed delivery)
      const res2 = await fetch(`${baseUrl}/api/v1/payment/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': signature,
          'x-razorpay-event-id': `event_refund_2_${Date.now()}`
        },
        body: rawBody
      });
      assert.equal(res2.status, 200);

      // Verify course count is STILL 0 (never negative -1!)
      const courseAfter2 = await Course.findById(testCourse._id);
      assert.equal(courseAfter2?.enrolmentCount, 0, 'Course enrolment count must NEVER drop below 0');
    });

    test('Student with multiple orders for same course does not lose access when one order is refunded', async () => {
      const courseIdStr = testCourse._id.toString();
      await User.findByIdAndUpdate(studentId, { $addToSet: { enrolledCourses: courseIdStr } });

      // Student has TWO successful orders for the same course (e.g. extension or second batch)
      const order1 = await Order.create({
        orderId: `order_multi_1_${Date.now()}`,
        paymentId: `pay_multi_1_${Date.now()}`,
        userId: studentId,
        studentName: 'Distributed Student',
        studentEmail: 'student@test-phase4.com',
        courseId: courseIdStr,
        courseTitle: testCourse.title,
        amount: 4999,
        status: 'SUCCESS'
      });

      const order2 = await Order.create({
        orderId: `order_multi_2_${Date.now()}`,
        paymentId: `pay_multi_2_${Date.now()}`,
        userId: studentId,
        studentName: 'Distributed Student',
        studentEmail: 'student@test-phase4.com',
        courseId: courseIdStr,
        courseTitle: testCourse.title,
        amount: 4999,
        status: 'SUCCESS'
      });

      // Refund order1
      const refundPayload = {
        event: 'refund.processed',
        payload: {
          refund: {
            entity: {
              payment_id: order1.paymentId,
              amount: 499900
            }
          }
        }
      };

      const rawBody = JSON.stringify(refundPayload);
      const signature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      await fetch(`${baseUrl}/api/v1/payment/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': signature
        },
        body: rawBody
      });

      // Verify user STILL has course access because order2 is still active
      const userAfter = await User.findById(studentId);
      const isStillEnrolled = (userAfter?.enrolledCourses || []).some((c: any) => c.toString() === courseIdStr);
      assert.equal(isStillEnrolled, true, 'User must retain course access while another active order exists');
    });
  });

  // ==========================================
  // SECTION 4: Production Metrics & Observability Probe
  // ==========================================
  describe('Cluster & Database Pool Observability Endpoint', () => {
    test('GET /api/v1/health/metrics reports valid process, memory and database pool state', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health/metrics`);
      assert.equal(res.status, 200);

      const data = (await res.json()) as any;
      assert.equal(data.status, 'ok');
      assert.ok(data.worker.pid > 0);
      assert.ok(typeof data.worker.uptimeSeconds === 'number');
      assert.ok(data.memoryMB.heapUsed > 0);
      assert.ok(data.memoryMB.rss > 0);

      // Verify connection pool metrics
      assert.ok(data.databasePool.maxPoolSize >= 50);
      assert.ok(data.databasePool.minPoolSize >= 5);
      assert.equal(data.databasePool.readyState, 1);
    });
  });
});
