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
import { Coupon } from '../src/models/Coupon.js';
import { TestSeries } from '../src/models/TestSeries.js';
import { TestSubmission } from '../src/models/TestSubmission.js';
import { DppPyq } from '../src/models/DppPyq.js';
import { WebhookEvent } from '../src/models/WebhookEvent.js';

describe('DK Academy Backend — Phase 3 Database Integration & Concurrency Test Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  let superAdminToken: string;
  let regularAdminToken: string;
  let studentToken: string;
  let testStudentId: string;
  let testStudentEmail: string;

  const JWT_SECRET = env.JWT_SECRET;
  const RAZORPAY_KEY_SECRET = env.RAZORPAY_KEY_SECRET;

  // Derive isolated test DB URI to ensure production DB is NEVER touched
  const baseUri = env.MONGO_URI;
  const isolatedTestDbUri = baseUri.replace(/\/dk_academy_jee(\?|$)/, '/dk_academy_jee_test_isolated$1');

  before(async () => {
    // Assert target is isolated test DB
    assert.ok(
      isolatedTestDbUri.includes('dk_academy_jee_test_isolated'),
      'CRITICAL: Tests must only run against dk_academy_jee_test_isolated'
    );

    // Disconnect if previously connected
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Connect to isolated test database
    await mongoose.connect(isolatedTestDbUri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 15000,
      family: 4
    });

    console.log(`[Integration Test] Connected to MongoDB host: ${mongoose.connection.host}, database: ${mongoose.connection.name}`);
    assert.equal(mongoose.connection.name, 'dk_academy_jee_test_isolated', 'Must be connected to dk_academy_jee_test_isolated');

    // Clean up previous test artifacts from isolated test database
    await User.deleteMany({ email: { $regex: /@test-isolated\.com$/i } });
    await Course.deleteMany({ slug: { $regex: /^test-isolated-/ } });
    await Order.deleteMany({ 'notes.isTestRun': true });
    await Coupon.deleteMany({ code: { $regex: /^TEST_/ } });
    await TestSeries.deleteMany({ slug: { $regex: /^test-isolated-/ } });
    await TestSubmission.deleteMany({ studentEmail: { $regex: /@test-isolated\.com$/i } });
    await DppPyq.deleteMany({ slug: { $regex: /^test-isolated-/ } });
    await WebhookEvent.deleteMany({ eventId: { $regex: /^evt_test_iso_/ } });

    // Seed test accounts in isolated DB
    const superAdmin = await User.create({
      name: 'Super Admin Tester',
      email: `superadmin_${Date.now()}@test-isolated.com`,
      password: 'SuperPassword123!',
      role: 'SUPER_ADMIN'
    });

    const regularAdmin = await User.create({
      name: 'Regular Admin Tester',
      email: `admin_${Date.now()}@test-isolated.com`,
      password: 'AdminPassword123!',
      role: 'ADMIN'
    });

    testStudentEmail = `student_${Date.now()}@test-isolated.com`;
    const student = await User.create({
      name: 'Test Aspirant',
      email: testStudentEmail,
      password: 'StudentPassword123!',
      role: 'STUDENT',
      studentId: `STU-TEST-${Date.now()}`
    });
    testStudentId = student._id.toString();

    superAdminToken = jwt.sign(
      { id: superAdmin._id.toString(), role: superAdmin.role, email: superAdmin.email },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '2h' }
    );

    regularAdminToken = jwt.sign(
      { id: regularAdmin._id.toString(), role: regularAdmin.role, email: regularAdmin.email },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '2h' }
    );

    studentToken = jwt.sign(
      { id: student._id.toString(), role: student.role, email: student.email },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '2h' }
    );

    // Spin up test server on dynamic OS port
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr !== null) {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    try {
      // Clean up all created test documents
      await User.deleteMany({ email: { $regex: /@test-isolated\.com$/i } });
      await Course.deleteMany({ slug: { $regex: /^test-isolated-/ } });
      await Order.deleteMany({ 'notes.isTestRun': true });
      await Coupon.deleteMany({ code: { $regex: /^TEST_/ } });
      await TestSeries.deleteMany({ slug: { $regex: /^test-isolated-/ } });
      await TestSubmission.deleteMany({ studentEmail: { $regex: /@test-isolated\.com$/i } });
      await DppPyq.deleteMany({ slug: { $regex: /^test-isolated-/ } });
      await WebhookEvent.deleteMany({ eventId: { $regex: /^evt_test_iso_/ } });
      await mongoose.disconnect();
    } catch {}

    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  // ==========================================
  // SECTION 1: Student Creation & Unique Duplicate Prevention
  // ==========================================
  describe('Student Registration & Unique Duplicate Key Constraint', () => {
    test('Public registration creates STUDENT and hashes password', async () => {
      const regRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Fresh Aspirant',
          email: `fresh_aspirant_${Date.now()}@test-isolated.com`,
          password: 'SecretPassword123!',
          targetExam: 'JEE Advanced',
          targetClass: 'Class 12th',
          targetYear: '2026'
        })
      });

      assert.equal(regRes.status, 201);
      const regData = await regRes.json();
      assert.equal(regData.success, true);
      assert.equal(regData.data.role, 'STUDENT');
      assert.ok(regData.data.token);

      // Verify in DB directly (with +password since password has select: false)
      const savedUser = await User.findOne({ email: regData.data.email }).select('+password');
      assert.ok(savedUser);
      assert.equal(savedUser.role, 'STUDENT');
      assert.notEqual(savedUser.password, 'SecretPassword123!'); // Must be bcrypt hashed
      const isMatch = await savedUser.comparePassword('SecretPassword123!');
      assert.equal(isMatch, true);
    });

    test('Duplicate email registration is rejected with 400 Bad Request', async () => {
      const duplicateEmail = `duplicate_${Date.now()}@test-isolated.com`;
      await User.create({
        name: 'Initial Student',
        email: duplicateEmail,
        password: 'Password123!',
        role: 'STUDENT'
      });

      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Second Student Same Email',
          email: duplicateEmail,
          password: 'Password123!'
        })
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /already exists/i);
    });

    test('Direct DB duplicate insert throws E11000 duplicate key error', async () => {
      const uniqueEmail = `unique_idx_${Date.now()}@test-isolated.com`;
      await User.create({
        name: 'First User',
        email: uniqueEmail,
        password: 'Password123!',
        role: 'STUDENT'
      });

      let threw = false;
      try {
        await User.create({
          name: 'Second User',
          email: uniqueEmail,
          password: 'Password123!',
          role: 'STUDENT'
        });
      } catch (err: any) {
        threw = true;
        assert.equal(err.code, 11000, 'Must throw MongoDB duplicate key error code 11000');
      }
      assert.equal(threw, true, 'Duplicate insert must throw error');
    });

    test('Missing required email in schema throws ValidationError', async () => {
      let threw = false;
      try {
        await User.create({
          name: 'No Email User',
          password: 'Password123!',
          role: 'STUDENT'
        } as any);
      } catch (err: any) {
        threw = true;
        assert.match(err.message, /Please provide email address/i);
      }
      assert.equal(threw, true);
    });
  });

  // ==========================================
  // SECTION 2: Course Creation & Price Tampering Prevention
  // ==========================================
  describe('Course Enrollment & Payment Price Manipulation Defenses', () => {
    let createdCourse: any;

    before(async () => {
      createdCourse = await Course.create({
        title: 'JEE Advanced Quantum Mechanics Flagship',
        slug: `test-isolated-quantum-${Date.now()}`,
        price: 4999,
        originalPrice: 9999,
        category: 'Physics',
        targetClass: 'Class 12th',
        targetYear: '2026',
        deliveryMode: 'Online Live',
        enrolmentCount: 0
      });
    });

    test('Penny attack: Client attempting to create order with manipulated price ₹1 is blocked with 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          courseId: createdCourse._id.toString(),
          amount: 1, // Manipulated price! Real price is 4999
          courseTitle: createdCourse.title
        })
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /price tampering|invalid payment amount/i);
    });

    test('Legitimate order creation with authentic price ₹4999 succeeds and records pending Order in DB', async () => {
      const res = await fetch(`${baseUrl}/api/v1/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          courseId: createdCourse._id.toString(),
          amount: 4999,
          courseTitle: createdCourse.title,
          studentName: 'Test Aspirant',
          studentEmail: testStudentEmail
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.order?.id);

      // Verify order saved in DB as PENDING
      const dbOrder = await Order.findOne({ orderId: data.order.id });
      assert.ok(dbOrder);
      assert.equal(dbOrder.status, 'PENDING');
      assert.equal(dbOrder.amount, 4999);
      assert.equal(dbOrder.courseId, createdCourse._id.toString());
    });

    test('Valid Coupon discounts verified price legitimately', async () => {
      const coupon = await Coupon.create({
        code: `TEST_DKSIR20_${Date.now()}`,
        discountType: 'percent',
        discountValue: 20, // 20% off 4999 = 3999
        label: '20% OFF Early Bird',
        minCoursePrice: 1000,
        usageLimit: 10,
        usedCount: 0,
        isActive: true
      });

      // Attacker tries ₹500 with coupon -> Should be rejected
      const hackRes = await fetch(`${baseUrl}/api/v1/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          courseId: createdCourse._id.toString(),
          amount: 500,
          couponCode: coupon.code
        })
      });
      assert.equal(hackRes.status, 400);

      // Legitimate discounted payment ₹3999 -> Accepted
      const validRes = await fetch(`${baseUrl}/api/v1/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          courseId: createdCourse._id.toString(),
          amount: 3999,
          couponCode: coupon.code
        })
      });
      assert.equal(validRes.status, 200);
      const validData = await validRes.json();
      assert.equal(validData.success, true);
    });

    test('Payment verification with authentic HMAC signature enrolls student and increments count', async () => {
      const testOrderId = `order_test_${Date.now()}`;
      const testPaymentId = `pay_test_${Date.now()}`;

      // Create an order in DB
      await Order.create({
        orderId: testOrderId,
        userId: new mongoose.Types.ObjectId(testStudentId),
        studentName: 'Test Aspirant',
        studentEmail: testStudentEmail,
        courseId: createdCourse._id.toString(),
        courseTitle: createdCourse.title,
        amount: 4999,
        currency: 'INR',
        status: 'PENDING',
        notes: { isTestRun: true }
      });

      // Compute authentic HMAC signature
      const body = `${testOrderId}|${testPaymentId}`;
      const validSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      const verifyRes = await fetch(`${baseUrl}/api/v1/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          razorpay_order_id: testOrderId,
          razorpay_payment_id: testPaymentId,
          razorpay_signature: validSignature,
          courseId: createdCourse._id.toString()
        })
      });

      assert.equal(verifyRes.status, 200);
      const verifyData = await verifyRes.json();
      assert.equal(verifyData.success, true);

      // Verify DB state: Order status SUCCESS
      const updatedOrder = await Order.findOne({ orderId: testOrderId });
      assert.equal(updatedOrder?.status, 'SUCCESS');
      assert.equal(updatedOrder?.paymentId, testPaymentId);

      // Verify DB state: User enrolledCourses contains courseId
      const studentInDb = await User.findById(testStudentId);
      assert.ok(
        (studentInDb?.enrolledCourses || []).map(String).includes(createdCourse._id.toString()),
        'Student enrolledCourses array must contain courseId'
      );

      // Verify DB state: Course enrolmentCount incremented
      const updatedCourse = await Course.findById(createdCourse._id);
      assert.equal(updatedCourse?.enrolmentCount, 1);
    });

    test('Course ID mismatch in verification is rejected as security violation', async () => {
      const testOrderId = `order_test_mismatch_${Date.now()}`;
      const testPaymentId = `pay_test_mismatch_${Date.now()}`;

      await Order.create({
        orderId: testOrderId,
        userId: new mongoose.Types.ObjectId(testStudentId),
        studentName: 'Test Aspirant',
        studentEmail: testStudentEmail,
        courseId: createdCourse._id.toString(),
        courseTitle: createdCourse.title,
        amount: 4999,
        currency: 'INR',
        status: 'PENDING',
        notes: { isTestRun: true }
      });

      const body = `${testOrderId}|${testPaymentId}`;
      const signature = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(body).digest('hex');

      const res = await fetch(`${baseUrl}/api/v1/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          razorpay_order_id: testOrderId,
          razorpay_payment_id: testPaymentId,
          razorpay_signature: signature,
          courseId: 'different_unauthorized_course_id' // Mismatched course!
        })
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /security violation|does not match/i);
    });
  });

  // ==========================================
  // SECTION 3: Test Series & JEE Scoring Engine
  // ==========================================
  describe('Test Series Creation, Standard JEE Marking & Solution Scheduling', () => {
    let createdTestSeries: any;

    before(async () => {
      createdTestSeries = await TestSeries.create({
        id: `ts-test-${Date.now()}`,
        title: 'JEE Advanced Physics Grand Mock Test',
        slug: `test-isolated-mock-${Date.now()}`,
        examType: 'JEE Advanced',
        format: 'Full Mock',
        difficulty: 'Hard',
        durationMinutes: 180,
        totalQuestions: 3,
        totalMarks: 12,
        subjects: ['Physics'],
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        solutionRelease: {
          enabled: true,
          pdfUrl: 'https://cdn.dkacademy.com/solutions/grand_mock_sol.pdf',
          videoUrl: 'https://cdn.dkacademy.com/solutions/grand_mock_sol.mp4',
          releaseDelayHours: 24
        },
        instructions: ['Standard JEE negative marking scheme applies'],
        questions: [
          {
            id: 'q1',
            questionNumber: 1,
            subject: 'Physics',
            section: 'A',
            type: 'SINGLE_CORRECT',
            statement: 'What is the de Broglie wavelength of an electron accelerated through 100V?',
            options: [
              { id: 'A', text: '0.123 nm' },
              { id: 'B', text: '1.23 nm' },
              { id: 'C', text: '12.3 nm' },
              { id: 'D', text: '0.0123 nm' }
            ],
            correctAnswer: 'A',
            marks: 4,
            negativeMarks: 1
          },
          {
            id: 'q2',
            questionNumber: 2,
            subject: 'Physics',
            section: 'A',
            type: 'SINGLE_CORRECT',
            statement: 'A projectile is fired at 45 degrees. The trajectory radius of curvature at vertex is:',
            options: [
              { id: 'A', text: 'v^2 / g' },
              { id: 'B', text: 'v^2 / (2g)' },
              { id: 'C', text: 'v^2 / (4g)' },
              { id: 'D', text: '2v^2 / g' }
            ],
            correctAnswer: 'B',
            marks: 4,
            negativeMarks: 1
          },
          {
            id: 'q3',
            questionNumber: 3,
            subject: 'Physics',
            section: 'B',
            type: 'NUMERICAL',
            statement: 'Find the magnetic moment in A-m^2 (round to 2 decimal places):',
            options: [],
            numericalAnswer: '3.14',
            correctAnswer: '3.14',
            marks: 4,
            negativeMarks: 0 // Section B zero negative marks
          }
        ]
      });
    });

    test('Submission correctly computes score: +4 for correct, -1 for wrong, 0 for Section B wrong', async () => {
      // Q1: 'A' (correct -> +4)
      // Q2: 'C' (wrong -> -1)
      // Q3: '3.14' (correct -> +4)
      // Expected total: 4 - 1 + 4 = 7 marks
      const clientSubId = `sub-client-${Date.now()}`;
      const res = await fetch(`${baseUrl}/api/v1/test-series/${createdTestSeries._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          clientSubmissionId: clientSubId,
          timeSpentSeconds: 1200,
          responses: {
            q1: { selectedOption: 'A' },
            q2: { selectedOption: 'C' },
            q3: { numericalValue: '3.14' }
          }
        })
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.data.score, 7, 'Score must be exactly 7 (+4 -1 +4)');
      assert.equal(data.data.correctCount, 2);
      assert.equal(data.data.incorrectCount, 1);
      assert.equal(data.data.unattemptedCount, 0);

      // Verify solution scheduling: releaseDelayHours is 24, solutionUnlockAt is submittedAt + 24 hours
      assert.equal(data.data.solutionSchedule.releaseDelayHours, 24);
      assert.equal(data.data.solutionSchedule.isUnlocked, false);

      const submittedAtTime = new Date(data.data.submittedAt).getTime();
      const unlockTime = new Date(data.data.solutionSchedule.solutionUnlockAt).getTime();
      const expectedUnlockTime = submittedAtTime + 24 * 60 * 60 * 1000;
      assert.ok(Math.abs(unlockTime - expectedUnlockTime) < 1000, 'Unlock time must be submittedAt + 24h');

      // Verify submission persisted in MongoDB
      const savedSub = await TestSubmission.findOne({ submissionId: clientSubId });
      assert.ok(savedSub);
      assert.equal(savedSub.score, 7);
      assert.equal(savedSub.solutionSchedule.releaseStatus, 'SCHEDULED');
    });

    test('Idempotency: Re-submitting identical clientSubmissionId returns cached result without re-evaluating', async () => {
      const clientSubId = `sub-idemp-${Date.now()}`;

      // First submission
      const res1 = await fetch(`${baseUrl}/api/v1/test-series/${createdTestSeries._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          clientSubmissionId: clientSubId,
          responses: {
            q1: { selectedOption: 'A' }
          }
        })
      });
      assert.equal(res1.status, 201);
      const data1 = await res1.json();

      // Second submission with same clientSubmissionId
      const res2 = await fetch(`${baseUrl}/api/v1/test-series/${createdTestSeries._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          clientSubmissionId: clientSubId,
          responses: {
            q1: { selectedOption: 'B' } // Different response should be ignored due to idempotency
          }
        })
      });
      assert.equal(res2.status, 200);
      const data2 = await res2.json();
      assert.match(data2.message, /existing submission retrieved/i);
      assert.equal(data2.data.score, data1.data.score);

      // Verify only 1 document in DB
      const subCount = await TestSubmission.countDocuments({ submissionId: clientSubId });
      assert.equal(subCount, 1);
    });

    test('Locked solutions cannot be accessed before scheduled unlock time', async () => {
      const subId = `sub-locked-${Date.now()}`;
      await fetch(`${baseUrl}/api/v1/test-series/${createdTestSeries._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          clientSubmissionId: subId,
          responses: {}
        })
      });

      const solRes = await fetch(`${baseUrl}/api/v1/test-series/submissions/${subId}/solution`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });

      assert.equal(solRes.status, 403);
      const solData = await solRes.json();
      assert.equal(solData.success, false);
      assert.match(solData.message, /solutions are locked/i);
      assert.ok(!solData.data?.pdfSolutionUrl);
    });
  });

  // ==========================================
  // SECTION 4: DPP / PYQ Math Extraction & Formula Preservation
  // ==========================================
  describe('DPP / PYQ Creation & Complex Mathematical Expression Integrity', () => {
    test('DPP with complex integrals, fractions, second derivatives and radicals preserves LaTeX intact', async () => {
      const complexLatexStatement =
        'Evaluate the integral: \\int_{0}^{\\pi} \\frac{\\sqrt[3]{\\sin(x)}}{\\sqrt[3]{\\sin(x)} + \\sqrt[3]{\\cos(x)}} \\, dx = \\frac{\\pi}{4} and find f\'\'(0).';

      const dppItem = await DppPyq.create({
        id: `dpp-math-${Date.now()}`,
        badgeCode: 'MTH-ADV-01',
        title: 'Definite Integration Advanced Worksheet',
        slug: `test-isolated-dpp-math-${Date.now()}`,
        moduleType: 'DPP',
        subject: 'Mathematics',
        categoryLabel: 'Calculus',
        chapter: 'Definite Integrals',
        questionsCount: 1,
        attemptsCount: 0,
        solutionNote: 'Standard symmetry property \\int_a^b f(x)dx = \\int_a^b f(a+b-x)dx applies.',
        status: 'Published',
        questions: [
          {
            id: 'dpp_q1',
            qNum: 1,
            statement: complexLatexStatement,
            topic: 'Definite Integration',
            difficulty: 'Challenging',
            options: [
              { key: 'A', text: '\\frac{\\pi}{4}' },
              { key: 'B', text: '\\frac{\\pi}{2}' },
              { key: 'C', text: '-\\frac{\\pi}{4}' },
              { key: 'D', text: '-1' }
            ],
            correctKey: 'A',
            stepSolution: 'Let I = \\int_0^\\pi ... By King property, 2I = \\pi/2 \\Rightarrow I = \\pi/4.'
          }
        ]
      });

      // Retrieve from DB and verify character-for-character preservation
      const retrieved = await DppPyq.findById(dppItem._id);
      assert.ok(retrieved);
      const q = retrieved.questions[0];

      // Verify radical \sqrt[3] is not stripped to \sqrt or mangled
      assert.ok(q.statement.includes('\\sqrt[3]'), 'Must preserve \\sqrt[3]');
      // Verify second derivative f''(0) is not replaced by space or mangled
      assert.ok(q.statement.includes("f''(0)"), "Must preserve f''(0)");
      // Verify negative option -1 is not stripped of minus sign
      assert.equal(q.options[3].text, '-1', 'Must preserve negative mathematical option -1');
      // Verify fraction is intact
      assert.ok(q.statement.includes('\\frac{\\pi}{4}'), 'Must preserve \\frac{\\pi}{4}');
    });
  });

  // ==========================================
  // SECTION 5: High-Concurrency & Race Condition Defenses
  // ==========================================
  describe('High-Concurrency Submissions & Atomic State Integrity', () => {
    test('10 concurrent student submissions complete with atomic consistency and zero data races', async () => {
      const concurrentTest = await TestSeries.create({
        id: `ts-concurrent-${Date.now()}`,
        title: 'Concurrent Load Verification Test',
        slug: `test-isolated-concurrent-${Date.now()}`,
        examType: 'JEE Main',
        format: 'Chapter Test',
        difficulty: 'Medium',
        durationMinutes: 60,
        totalQuestions: 1,
        totalMarks: 4,
        subjects: ['Chemistry'],
        markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
        questions: [
          {
            id: 'c1',
            questionNumber: 1,
            subject: 'Chemistry',
            section: 'A',
            type: 'SINGLE_CORRECT',
            statement: 'What is the hybridisation of xenon in XeF4?',
            options: [
              { id: 'A', text: 'sp3d2' },
              { id: 'B', text: 'sp3d' }
            ],
            correctAnswer: 'A',
            marks: 4,
            negativeMarks: 1
          }
        ]
      });

      const submissionPromises = Array.from({ length: 10 }, (_, i) => {
        const studentSubId = `sub-concurrent-${i}-${Date.now()}`;
        return fetch(`${baseUrl}/api/v1/test-series/${concurrentTest._id}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${studentToken}`
          },
          body: JSON.stringify({
            clientSubmissionId: studentSubId,
            studentId: `concurrent_student_${i}`,
            studentEmail: `concurrent_${i}@test-isolated.com`,
            studentName: `Aspirant ${i}`,
            responses: {
              c1: { selectedOption: i % 2 === 0 ? 'A' : 'B' } // Half correct (+4), half wrong (-1)
            }
          })
        });
      });

      const responses = await Promise.all(submissionPromises);
      assert.equal(responses.length, 10);

      for (let i = 0; i < responses.length; i++) {
        assert.equal(responses[i].status, 201, `Submission ${i} must succeed with 201`);
        const json = await responses[i].json();
        assert.equal(json.success, true);
        const expectedScore = i % 2 === 0 ? 4 : -1;
        assert.equal(json.data.score, expectedScore, `Submission ${i} score should be ${expectedScore}`);
      }

      // Verify all 10 records exist in MongoDB
      const count = await TestSubmission.countDocuments({
        submissionId: { $regex: /^sub-concurrent-/ }
      });
      assert.equal(count, 10, 'All 10 submissions must be distinctly persisted in database');
    });
  });

  // ==========================================
  // SECTION 6: Privilege Escalation & Admin Role Gates
  // ==========================================
  describe('RBAC Privilege Escalation & Staff Governance Gates', () => {
    test('Public registration cannot inject SUPER_ADMIN role (blocked by strict schema)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Hacker Trying Role Escalation',
          email: `hacker_${Date.now()}@test-isolated.com`,
          password: 'Password123!',
          role: 'SUPER_ADMIN' // Prohibited!
        })
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(JSON.stringify(data.errors), /role/i);
    });

    test('Regular ADMIN cannot create a SUPER_ADMIN staff account (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${regularAdminToken}` // Regular ADMIN
        },
        body: JSON.stringify({
          name: 'Escalated Admin Target',
          email: `rogue_super_${Date.now()}@test-isolated.com`,
          role: 'SUPER_ADMIN'
        })
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /Forbidden.*SUPER_ADMIN/i);
    });

    test('SUPER_ADMIN successfully creates faculty staff with 201 Created', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`
        },
        body: JSON.stringify({
          name: 'Prof. S. K. Verma',
          email: `prof_verma_${Date.now()}@test-isolated.com`,
          role: 'TEACHER',
          department: 'Physics',
          phone: '+91 98765 00000'
        })
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.data.role, 'TEACHER');
      assert.ok(data.data.teacherId);
    });

    test('Student token accessing staff directory /api/v1/auth/staff is rejected with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/staff`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('Student token accessing orders list /api/v1/payment/orders is rejected with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/v1/payment/orders`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('Expired JWT token is rejected with 401 Unauthorized', async () => {
      const expiredToken = jwt.sign(
        { id: testStudentId, role: 'STUDENT', email: testStudentEmail },
        JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '-10s' } // Expired 10 seconds ago
      );

      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${expiredToken}` }
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /jwt expired|expired/i);
    });

    test('Tampered JWT payload with forged signature is rejected with 401 Unauthorized', async () => {
      const forgedToken = jwt.sign(
        { id: testStudentId, role: 'SUPER_ADMIN', email: testStudentEmail },
        'different_tampered_secret_key_123456789'
      );

      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${forgedToken}` }
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /invalid|failed/i);
    });
  });
});
