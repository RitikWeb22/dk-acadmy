import dotenv from 'dotenv';
dotenv.config();

import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Course } from '../src/models/Course.js';
import { Order } from '../src/models/Order.js';
import { TestSeries } from '../src/models/TestSeries.js';
import { TestSubmission } from '../src/models/TestSubmission.js';
import { DistributedLock } from '../src/models/DistributedLock.js';
import {
  acquireDistributedLease,
  acquireDistributedLock,
  renewDistributedLock,
  isLockHeld,
  releaseDistributedLock,
  withDistributedLock
} from '../src/utils/distributedLock.js';
import { runReconciliationAudit } from '../src/utils/reconcileFinances.js';

describe('DK Academy JEE — Phase 5: Production Readiness & Distributed Reliability Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  let adminToken: string;
  let studentToken: string;
  let testStudentId: string;
  let testCourse: any;
  let testExam: any;

  const JWT_SECRET = env.JWT_SECRET;
  const baseUri = env.MONGO_URI;
  const isolatedUri = baseUri.replace(/\/dk_academy_jee(\?|$)/, '/dk_academy_jee_test_isolated$1');

  before(async () => {
    assert.ok(isolatedUri.includes('dk_academy_jee_test_isolated'), 'Must only connect to isolated staging test DB');

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    await mongoose.connect(isolatedUri, {
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 15000,
      family: 4
    });

    // Start background HTTP server for API route testing
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    testStudentId = `std-p5-${Date.now()}`;
    const adminUser = await User.create({
      name: 'Super Admin Test',
      email: `admin-${Date.now()}@p5-test.in`,
      password: 'hashed-password-p5',
      role: 'SUPER_ADMIN'
    });
    adminToken = jwt.sign(
      { id: adminUser._id.toString(), role: 'SUPER_ADMIN' },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '1h' }
    );
    studentToken = jwt.sign(
      { id: testStudentId, role: 'STUDENT' },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    // Seed test course
    testCourse = await Course.create({
      title: `Phase 5 Test Course ${Date.now()}`,
      slug: `p5-course-${Date.now()}`,
      category: 'JEE',
      targetClass: 'Class 12',
      subject: 'PHYSICS',
      targetYear: '2026',
      price: 4999,
      discountedPrice: 2999,
      enrolmentCount: 0
    });

    // Seed test exam
    testExam = await TestSeries.create({
      id: `ts-p5-${Date.now()}`,
      title: 'Phase 5 Verification Mock Exam',
      slug: `p5-exam-${Date.now()}`,
      examType: 'JEE Advanced',
      format: 'Full Mock',
      durationMinutes: 180,
      totalQuestions: 2,
      totalMarks: 8,
      markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
      questions: [
        {
          id: 'q1',
          questionNumber: 1,
          subject: 'PHYSICS',
          type: 'SINGLE_CHOICE',
          questionText: 'What is acceleration due to gravity on Earth?',
          options: [
            { id: 'A', text: '9.8 m/s^2' },
            { id: 'B', text: '12.4 m/s^2' }
          ],
          correctAnswer: 'A',
          marks: 4,
          negativeMarks: 1
        },
        {
          id: 'q2',
          questionNumber: 2,
          subject: 'PHYSICS',
          type: 'NUMERICAL',
          questionText: 'Calculate 5 + 5',
          numericalAnswer: 10,
          marks: 4,
          negativeMarks: 0
        }
      ],
      solutionRelease: {
        enabled: true,
        releaseDelayHours: 24,
        pdfUrl: 'https://cdn.dkacademy.com/p5-sol.pdf'
      }
    });
  });

  after(async () => {
    try {
      if (testCourse?._id) await Course.deleteOne({ _id: testCourse._id });
      if (testExam?._id) await TestSeries.deleteOne({ _id: testExam._id });
      await DistributedLock.deleteMany({ lockKey: { $regex: /^p5-/ } });
      await TestSubmission.deleteMany({ studentId: testStudentId });
      await Order.deleteMany({ studentEmail: { $regex: /@p5-test\.in$/ } });
    } catch {}

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await mongoose.disconnect();
  });

  // ==========================================
  // SECTION 1: Distributed Lock Correctness
  // ==========================================
  describe('Task A: Distributed Lock Fencing, Renewals & Owner Protection', () => {
    test('acquireDistributedLease returns unique ownerToken and generation fencing counter', async () => {
      const lockKey = `p5-lock-lease-${Date.now()}`;
      const worker1 = 'worker-p5-1';

      const lease = await acquireDistributedLease(lockKey, 5000, worker1);
      assert.equal(lease.acquired, true, 'Lease must be acquired successfully');
      assert.ok(lease.ownerToken && lease.ownerToken.length > 10, 'Must generate unforgeable owner token');
      assert.equal(lease.generation, 1, 'Initial lease generation must be 1');

      // Verify active lease check
      const isHeld = await isLockHeld(lockKey, lease.ownerToken!);
      assert.equal(isHeld, true, 'isLockHeld must return true for valid ownerToken');

      await releaseDistributedLock(lockKey, lease.ownerToken);
    });

    test('Expired lock reclamation increments generation counter (fencing token)', async () => {
      const lockKey = `p5-lock-gen-${Date.now()}`;
      const worker1 = 'worker-p5-initial';
      const worker2 = 'worker-p5-successor';

      // Worker 1 acquires short 50ms lease
      const lease1 = await acquireDistributedLease(lockKey, 50, worker1);
      assert.equal(lease1.acquired, true);
      assert.equal(lease1.generation, 1);

      // Wait 100ms for lease expiration
      await new Promise((res) => setTimeout(res, 100));

      // Worker 2 reclaims expired lease
      const lease2 = await acquireDistributedLease(lockKey, 5000, worker2);
      assert.equal(lease2.acquired, true, 'Worker 2 must reclaim expired lease');
      assert.ok(lease2.generation! > lease1.generation!, 'Generation must increment as a monotonic fencing token');

      await releaseDistributedLock(lockKey, lease2.ownerToken);
    });

    test('Safe lease renewal (heartbeat) extends active lock lease duration', async () => {
      const lockKey = `p5-lock-renew-${Date.now()}`;
      const worker = 'worker-p5-heartbeat';

      const lease = await acquireDistributedLease(lockKey, 2000, worker);
      assert.equal(lease.acquired, true);

      // Heartbeat renewal before expiration
      const renewed = await renewDistributedLock(lockKey, lease.ownerToken!, 5000);
      assert.equal(renewed, true, 'Active lease must be renewed cleanly');

      // Verify lock record in DB has extended expiresAt
      const doc = await DistributedLock.findOne({ lockKey });
      assert.ok(doc && doc.renewedCount >= 1, 'Renewed count must increment');

      await releaseDistributedLock(lockKey, lease.ownerToken);
    });

    test('Stale worker cannot renew or release another workers active lock', async () => {
      const lockKey = `p5-lock-stale-${Date.now()}`;
      const worker1 = 'worker-p5-stale';
      const worker2 = 'worker-p5-legit';

      // Worker 1 acquires short 50ms lease
      const lease1 = await acquireDistributedLease(lockKey, 50, worker1);
      assert.equal(lease1.acquired, true);

      // Wait 100ms for expiration
      await new Promise((res) => setTimeout(res, 100));

      // Worker 2 acquires the lock
      const lease2 = await acquireDistributedLease(lockKey, 5000, worker2);
      assert.equal(lease2.acquired, true);

      // Stale Worker 1 attempts to release with lease1 ownerToken: MUST FAIL
      const staleReleased = await releaseDistributedLock(lockKey, lease1.ownerToken);
      assert.equal(staleReleased, false, 'Stale worker release query must not delete active lock');

      // Verify Worker 2 still holds the lock
      const stillHeld = await isLockHeld(lockKey, lease2.ownerToken!);
      assert.equal(stillHeld, true, 'Worker 2 lock must remain intact after stale release attempt');

      await releaseDistributedLock(lockKey, lease2.ownerToken);
    });

    test('withDistributedLock executes critical section and cleans up automatically', async () => {
      const lockKey = `p5-lock-scoped-${Date.now()}`;
      let executed = false;

      const res = await withDistributedLock(lockKey, 5000, async (lease) => {
        assert.ok(lease?.ownerToken);
        executed = true;
        return 42;
      });

      assert.equal(res.executed, true);
      assert.equal(res.result, 42);
      assert.equal(executed, true);

      // Verify lock was released
      const doc = await DistributedLock.findOne({ lockKey });
      assert.equal(doc, null, 'Lock must be completely cleaned up after task');
    });
  });

  // ==========================================
  // SECTION 2: Exam Autosave & Submission
  // ==========================================
  describe('Task B: Exam Autosave Consistency & Duplicate Submission Protection', () => {
    test('Autosave rejects with 409 Conflict if exam has already been submitted', async () => {
      const studentId = `std-submit-guard-${Date.now()}`;
      const submissionId = `sub-guard-${Date.now()}`;

      // Create a finalized exam submission
      await TestSubmission.create({
        submissionId,
        testId: testExam.id,
        studentId,
        score: 8,
        totalMarks: 8,
        accuracy: 100,
        correctCount: 2,
        incorrectCount: 0,
        unattemptedCount: 0,
        status: 'SUBMITTED',
        responses: { q1: { selectedOption: 'A' }, q2: { numericalValue: '10' } },
        solutionSchedule: {
          enabled: true,
          releaseDelayHours: 24,
          solutionUnlockAt: new Date(Date.now() + 24 * 3600 * 1000),
          releaseStatus: 'SCHEDULED'
        }
      });

      // Attempt to autosave to the same finalized exam
      const res = await fetch(`${baseUrl}/api/v1/test-series/${testExam.id}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          responses: { q1: { selectedOption: 'B' } },
          timeSpentSeconds: 50
        })
      });

      assert.equal(res.status, 409, 'Autosave must be rejected with 409 Conflict on finalized exam');
      const data = await res.json() as any;
      assert.equal(data.success, false);
      assert.ok(data.message.includes('finalized'));
    });

    test('Monotonic out-of-order autosave packets are safely ignored', async () => {
      const studentId = `std-jitter-${Date.now()}`;
      const now = Date.now();

      // Send packet 2 first (newer timestamp)
      const res2 = await fetch(`${baseUrl}/api/v1/test-series/${testExam.id}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          responses: { q1: { selectedOption: 'A' } },
          clientTimestamp: now + 5000,
          timeSpentSeconds: 30
        })
      });
      assert.equal(res2.status, 200);

      // Now send delayed packet 1 (older timestamp)
      const res1 = await fetch(`${baseUrl}/api/v1/test-series/${testExam.id}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          responses: { q1: { selectedOption: 'B' } },
          clientTimestamp: now,
          timeSpentSeconds: 20
        })
      });

      assert.equal(res1.status, 200);
      const data1 = await res1.json() as any;
      assert.equal(data1.ignored, true, 'Delayed out-of-order packet must be marked ignored');

      // Verify that newer answer 'A' was preserved
      const draft = await TestSubmission.findOne({ submissionId: `progress_${testExam.id}_${studentId}` });
      assert.equal(draft?.responses?.q1?.selectedOption, 'A', 'Draft must preserve newer packet response');
    });

    test('Duplicate exam submission is idempotent and does not double-evaluate or increment attempts', async () => {
      const studentId = `std-dup-sub-${Date.now()}`;
      const clientSubmissionId = `sub-client-dup-${Date.now()}`;

      // Submit #1
      const res1 = await fetch(`${baseUrl}/api/v1/test-series/${testExam.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          clientSubmissionId,
          responses: { q1: { selectedOption: 'A' }, q2: { numericalValue: '10' } },
          timeSpentSeconds: 120
        })
      });

      assert.equal(res1.status, 201);
      const data1 = await res1.json() as any;
      const initialScore = data1.data.score;
      assert.equal(initialScore, 8);

      // Duplicate Submit #2 with identical clientSubmissionId
      const res2 = await fetch(`${baseUrl}/api/v1/test-series/${testExam.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          clientSubmissionId,
          responses: { q1: { selectedOption: 'B' }, q2: { numericalValue: '99' } },
          timeSpentSeconds: 150
        })
      });

      assert.equal(res2.status, 200, 'Duplicate submission must return 200 OK');
      const data2 = await res2.json() as any;
      assert.equal(data2.data.submissionId, clientSubmissionId);
      assert.equal(data2.data.score, initialScore, 'Must return original evaluation score');
    });
  });

  // ==========================================
  // SECTION 3: Payment & Financial Integrity
  // ==========================================
  describe('Task C: Payment Lifecycle Concurrency, Refunds & Enrolment Non-Negativity', () => {
    test('Zero lower-bound: Course enrolmentCount cannot become negative on refund', async () => {
      const emptyCourse = await Course.create({
        title: `Zero Enrolment Course ${Date.now()}`,
        slug: `zero-course-${Date.now()}`,
        category: 'JEE',
        targetClass: 'Class 12',
        subject: 'MATHEMATICS',
        targetYear: '2026',
        price: 999,
        enrolmentCount: 0
      });

      const paymentId = `pay_zero_${Date.now()}`;
      await Order.create({
        orderId: `order_zero_${Date.now()}`,
        paymentId,
        studentName: 'Refund Student',
        studentEmail: `refund-${Date.now()}@p5-test.in`,
        courseId: emptyCourse._id.toString(),
        courseTitle: emptyCourse.title,
        amount: 999,
        status: 'SUCCESS'
      });

      // Send refund webhook
      const webhookPayload = {
        event: 'refund.processed',
        payload: {
          refund: {
            entity: {
              id: `rfnd_${Date.now()}`,
              payment_id: paymentId,
              amount: 99900
            }
          }
        }
      };

      const rawBody = JSON.stringify(webhookPayload);
      const signature = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');

      const res = await fetch(`${baseUrl}/api/v1/payment/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': signature
        },
        body: rawBody
      });

      assert.equal(res.status, 200);

      // Verify Course enrolmentCount remains 0 (never negative)
      const courseAfter = await Course.findById(emptyCourse._id);
      assert.equal(courseAfter?.enrolmentCount, 0, 'Course enrolment count must never be negative');

      await Course.deleteOne({ _id: emptyCourse._id });
    });

    test('Parallel /verify and order.paid webhook race cleanly increments course enrolment exactly once', async () => {
      const orderId = `order_race_${Date.now()}`;
      const paymentId = `pay_race_${Date.now()}`;
      const raceUser = await User.create({
        name: 'Race Student',
        email: `race-${Date.now()}@p5-test.in`,
        password: 'hashed-password',
        role: 'STUDENT',
        enrolledCourses: []
      });

      const initialCount = testCourse.enrolmentCount || 0;

      await Order.create({
        orderId,
        studentName: raceUser.name,
        studentEmail: raceUser.email,
        userId: raceUser._id,
        courseId: testCourse._id.toString(),
        courseTitle: testCourse.title,
        amount: 2999,
        status: 'PENDING'
      });

      const webhookPayload = {
        event: 'order.paid',
        payload: {
          payment: {
            entity: {
              id: paymentId,
              order_id: orderId,
              amount: 299900
            }
          }
        }
      };
      const rawBody = JSON.stringify(webhookPayload);
      const signature = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');

      // Fire both /verify and webhook simultaneously
      const verifyPromise = fetch(`${baseUrl}/api/v1/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: 'dummy-sig',
          courseId: testCourse._id.toString()
        })
      });

      const webhookPromise = fetch(`${baseUrl}/api/v1/payment/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': signature
        },
        body: rawBody
      });

      const [verifyRes, webhookRes] = await Promise.all([verifyPromise, webhookPromise]);
      assert.ok(verifyRes.status === 200 || webhookRes.status === 200);

      // Verify Course enrolmentCount increased by EXACTLY 1 (not 2)
      const courseAfter = await Course.findById(testCourse._id);
      assert.equal(
        courseAfter?.enrolmentCount,
        initialCount + 1,
        'Course enrolmentCount must increment exactly once despite concurrent verify and webhook calls'
      );

      await User.deleteOne({ _id: raceUser._id });
    });
  });

  // ==========================================
  // SECTION 4: Metrics Endpoint Security Hardening
  // ==========================================
  describe('Task F: Observability & Operational Security Hardening', () => {
    test('Anonymous GET /api/v1/health/metrics redacts sensitive database host topology', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health/metrics`);
      assert.equal(res.status, 200);

      const data = await res.json() as any;
      assert.equal(data.status, 'ok');
      assert.ok(data.worker.pid > 0);
      assert.ok(data.databasePool.readyState === 1);

      // Sensitive infrastructure topology MUST be omitted for anonymous public callers
      assert.equal(data.databasePool.host, undefined, 'Anonymous view must redact database cluster host URL');
      assert.equal(data.system, undefined, 'Anonymous view must not expose host OS server memory metrics');
    });

    test('Admin GET /api/v1/health/metrics includes full cluster telemetry', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health/metrics`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);

      const data = await res.json() as any;
      assert.equal(data.status, 'ok');
      assert.ok(data.system.cpuCores > 0, 'Admin view includes system cores');
      assert.ok(data.system.totalMemoryMB > 0, 'Admin view includes system memory');
    });

    test('Strict admin metrics endpoint /health/admin-metrics rejects anonymous requests with 401', async () => {
      const resAnon = await fetch(`${baseUrl}/api/v1/health/admin-metrics`);
      assert.equal(resAnon.status, 401, 'Anonymous request must be rejected with 401');

      const resAdmin = await fetch(`${baseUrl}/api/v1/health/admin-metrics`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(resAdmin.status, 200, 'Admin request must be authorized with 200');
    });
  });

  // ==========================================
  // SECTION 5: Database Consistency & Reconciliation
  // ==========================================
  describe('Task G: Financial & Data Consistency Reconciliation Engine', () => {
    test('runReconciliationAudit detects discrepancies in dry-run and repairs in fix mode', async () => {
      // Intentionally simulate a discrepancy: set Course enrolmentCount to 999 without orders
      await Course.findByIdAndUpdate(testCourse._id, { $set: { enrolmentCount: 999 } });

      // Run dry-run audit
      const dryReport = await runReconciliationAudit({ dryRun: true });
      assert.equal(dryReport.dryRun, true);
      const foundDiscrepancy = dryReport.courseCountDiscrepancies.find(
        (c) => c.courseId === testCourse._id.toString()
      );
      assert.ok(foundDiscrepancy, 'Dry-run must detect course count discrepancy');
      assert.equal(foundDiscrepancy.fixed, false, 'Dry-run must not mutate database');

      // Verify DB was NOT modified during dry-run
      const courseUnchanged = await Course.findById(testCourse._id);
      assert.equal(courseUnchanged?.enrolmentCount, 999);

      // Run fix mode
      const fixReport = await runReconciliationAudit({ dryRun: false });
      assert.equal(fixReport.dryRun, false);

      // Verify DB WAS repaired in fix mode
      const courseRepaired = await Course.findById(testCourse._id);
      assert.ok(courseRepaired!.enrolmentCount < 999, 'Fix mode must correct mismatched enrolment count');
    });
  });
});

