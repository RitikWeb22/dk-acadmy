import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import { TestSeries } from '../src/models/TestSeries.js';
import { TestSubmission } from '../src/models/TestSubmission.js';
import { Coupon } from '../src/models/Coupon.js';

describe('Phase 2 — High Priority Functional Bugs & Security Regression Tests', () => {
  let server: http.Server;
  let baseUrl: string;
  const JWT_SECRET = env.JWT_SECRET || 'test_jwt_secret_dk_academy_2026';

  const adminToken = jwt.sign(
    { id: 'usr_admin_phase2', role: 'ADMIN', email: 'admin@dkacademy.com' },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' }
  );

  const studentAToken = jwt.sign(
    { id: 'usr_student_alpha', role: 'STUDENT', email: 'student_alpha@dkacademy.com' },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' }
  );

  const studentBToken = jwt.sign(
    { id: 'usr_student_beta', role: 'STUDENT', email: 'student_beta@dkacademy.com' },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' }
  );

  const mockTestId = 'test_phase2_cbt_101';
  const mockSubmissionId = 'sub_student_alpha_phase2_001';

  before(async () => {
    try {
      await connectDB();
      console.log('[Phase 2 Test DB Connected]');
    } catch (err: any) {
      console.warn('[Phase 2 Test DB Warning]:', err?.message || err);
    }

    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        console.log('[Phase 2 Test Server Ready at]:', baseUrl);
        resolve();
      });
    });

    // Seed mock test series & submission if connected to DB
    if (mongoose.connection.readyState === 1) {
      try {
        await TestSeries.deleteOne({ id: mockTestId });
        await TestSeries.create({
          id: mockTestId,
          title: 'Phase 2 Regression Test Series',
          slug: 'phase2-regression-test-series',
          description: 'CBT Test Series for Regression',
          price: 499,
          totalQuestions: 1,
          totalDurationMinutes: 30,
          isFree: false,
          solutionRelease: {
            enabled: true,
            releaseDelayHours: 24,
            solutionUnlockAt: new Date(Date.now() + 24 * 3600 * 1000)
          },
          markingScheme: {
            correct: 4,
            incorrect: -1,
            unattempted: 0
          },
          questions: [
            {
              id: 'q1',
              questionNumber: 1,
              subject: 'Physics',
              statement: 'What is Newton second law?',
              options: [
                { id: 'A', text: 'F=ma' },
                { id: 'B', text: 'E=mc^2' },
                { id: 'C', text: 'V=IR' },
                { id: 'D', text: 'P=IV' }
              ],
              correctAnswer: 'A',
              marks: 4,
              negativeMarks: 1
            }
          ]
        });

        await TestSubmission.deleteOne({ submissionId: mockSubmissionId });
        await TestSubmission.create({
          submissionId: mockSubmissionId,
          testId: mockTestId,
          studentId: 'usr_student_alpha',
          studentEmail: 'student_alpha@dkacademy.com',
          status: 'SUBMITTED',
          submittedAt: new Date(),
          score: 4,
          totalMarks: 4,
          accuracy: 100,
          correctCount: 1,
          incorrectCount: 0,
          unattemptedCount: 0,
          responses: { q1: 'A' },
          solutionSchedule: {
            enabled: true,
            releaseDelayHours: 24,
            solutionUnlockAt: new Date(Date.now() + 24 * 3600 * 1000),
            releaseStatus: 'SCHEDULED'
          }
        });

        const couponCount = await Coupon.countDocuments({ code: 'PHASE2TEST' });
        if (couponCount === 0) {
          await Coupon.create({
            code: 'PHASE2TEST',
            discountType: 'percent',
            discountValue: 15,
            label: '15% Off Phase 2',
            usageLimit: 100,
            usedCount: 0,
            isActive: true
          });
        }
      } catch (seedErr) {
        console.warn('[Phase 2 Mock Seed Note]:', seedErr);
      }
    }
  });

  after(async () => {
    if (mongoose.connection.readyState === 1) {
      try {
        await TestSeries.deleteOne({ id: mockTestId });
        await TestSubmission.deleteOne({ submissionId: mockSubmissionId });
        await Coupon.deleteOne({ code: 'PHASE2TEST' });
      } catch {}
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Issue BUG-FUNC-03: Unauthenticated File Upload Rejection
  // ─────────────────────────────────────────────────────────────
  test('1. POST /api/v1/upload rejects unauthenticated uploads with 401', async () => {
    const res = await fetch(`${baseUrl}/api/v1/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '10.20.1.1'
      },
      body: JSON.stringify({ file: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' })
    });

    assert.equal(res.status, 401, 'Unauthenticated upload must return 401');
    const data = await res.json();
    assert.equal(data.success, false);
  });

  test('2. POST /api/v1/upload/delete rejects unauthenticated callers with 401', async () => {
    const res = await fetch(`${baseUrl}/api/v1/upload/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '10.20.1.2'
      },
      body: JSON.stringify({ publicId: 'test_asset_123' })
    });

    assert.equal(res.status, 401, 'Unauthenticated delete must return 401');
  });

  test('3. POST /api/v1/upload/delete rejects student role with 403', async () => {
    const res = await fetch(`${baseUrl}/api/v1/upload/delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${studentAToken}`,
        'Content-Type': 'application/json',
        'X-Forwarded-For': '10.20.1.3'
      },
      body: JSON.stringify({ publicId: 'test_asset_123' })
    });

    assert.equal(res.status, 403, 'Students must not be authorized to delete media assets');
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Issue BUG-FUNC-04: CBT Autosave & Progress IDOR Protection
  // ─────────────────────────────────────────────────────────────
  test('4. POST /api/v1/test-series/:id/autosave rejects student attempting to autosave for another student with 403', async () => {
    const res = await fetch(`${baseUrl}/api/v1/test-series/${mockTestId}/autosave`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${studentAToken}`,
        'Content-Type': 'application/json',
        'X-Forwarded-For': '10.20.1.4'
      },
      body: JSON.stringify({
        studentId: 'usr_student_beta', // Attempting IDOR against beta
        responses: { q1: 'A' },
        timeSpentSeconds: 120
      })
    });

    assert.equal(res.status, 403, 'Autosave tampering with foreign studentId must return 403');
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /Forbidden.*another student/i);
  });

  test('5. POST /api/v1/test-series/:id/autosave rejects unauthenticated caller with non-guest studentId with 401', async () => {
    const res = await fetch(`${baseUrl}/api/v1/test-series/${mockTestId}/autosave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '10.20.1.5'
      },
      body: JSON.stringify({
        studentId: 'usr_student_alpha',
        responses: { q1: 'B' }
      })
    });

    assert.equal(res.status, 401, 'Unauthenticated autosave with registered student ID must return 401');
    const data = await res.json();
    assert.equal(data.success, false);
  });

  test('6. GET /api/v1/test-series/:id/progress rejects student querying another student with 403', async () => {
    const res = await fetch(`${baseUrl}/api/v1/test-series/${mockTestId}/progress?studentId=usr_student_beta`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${studentAToken}`,
        'X-Forwarded-For': '10.20.1.6'
      }
    });

    assert.equal(res.status, 403, 'Accessing progress of another student must return 403');
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /Forbidden.*another student/i);
  });

  test('7. GET /api/v1/test-series/:id/progress rejects unauthenticated query for registered student with 401', async () => {
    const res = await fetch(`${baseUrl}/api/v1/test-series/${mockTestId}/progress?studentId=usr_student_alpha`, {
      method: 'GET',
      headers: {
        'X-Forwarded-For': '10.20.1.7'
      }
    });

    assert.equal(res.status, 401, 'Unauthenticated access to student progress must return 401');
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Issue BUG-FUNC-05: Solution Release Authorization Logic Inversion
  // ─────────────────────────────────────────────────────────────
  test('8. GET /api/v1/test-series/submissions/:subId/solution rejects unauthenticated access to student submission with 403', async () => {
    const res = await fetch(`${baseUrl}/api/v1/test-series/submissions/${mockSubmissionId}/solution`, {
      method: 'GET',
      headers: {
        'X-Forwarded-For': '10.20.1.8'
      }
    });

    assert.equal(res.status, 403, 'Unauthenticated visitor must not access registered student solutions');
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /Access Denied/i);
  });

  test('9. GET /api/v1/test-series/submissions/:subId/solution rejects foreign student access with 403', async () => {
    const res = await fetch(`${baseUrl}/api/v1/test-series/submissions/${mockSubmissionId}/solution`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${studentBToken}`, // Student B attempting to read Student A's solution
        'X-Forwarded-For': '10.20.1.9'
      }
    });

    assert.equal(res.status, 403, 'Foreign student must be denied access to another student solution');
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /Access Denied/i);
  });

  test('10. GET /api/v1/test-series/submissions/:subId/solution enforces schedule lock for submission owner', async () => {
    const res = await fetch(`${baseUrl}/api/v1/test-series/submissions/${mockSubmissionId}/solution`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${studentAToken}`, // Genuine owner
        'X-Forwarded-For': '10.20.1.10'
      }
    });

    // Solutions are scheduled for +24 hours, so owner must receive 403 with isUnlocked: false
    assert.equal(res.status, 403, 'Locked solutions must return 403 to owner before scheduled unlock time');
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.isUnlocked, false);
    assert.match(data.message, /Solutions are locked/i);
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Issue BUG-FUNC-06 / CRIT-SEC-10: Public Coupon Data Exposure
  // ─────────────────────────────────────────────────────────────
  test('11. GET /api/v1/coupons rejects unauthenticated visitor with 401', async () => {
    const res = await fetch(`${baseUrl}/api/v1/coupons`, {
      method: 'GET',
      headers: {
        'X-Forwarded-For': '10.20.1.11'
      }
    });

    assert.equal(res.status, 401, 'Unauthenticated callers must not be able to dump coupon database');
    const data = await res.json();
    assert.equal(data.success, false);
  });

  test('12. GET /api/v1/coupons rejects student role with 403', async () => {
    const res = await fetch(`${baseUrl}/api/v1/coupons`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${studentAToken}`,
        'X-Forwarded-For': '10.20.1.12'
      }
    });

    assert.equal(res.status, 403, 'Students must not have access to full internal coupon catalog');
  });

  test('13. GET /api/v1/coupons allows admin role with 200', async () => {
    const res = await fetch(`${baseUrl}/api/v1/coupons`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'X-Forwarded-For': '10.20.1.13'
      }
    });

    assert.equal(res.status, 200, 'Admin must be authorized to retrieve coupons');
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data), 'Coupons list should be an array');
  });

  test('14. POST /api/v1/coupons/validate is publicly accessible for checkout visitors', async () => {
    const res = await fetch(`${baseUrl}/api/v1/coupons/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '10.20.1.14'
      },
      body: JSON.stringify({
        code: 'PHASE2TEST',
        coursePrice: 5000,
        apply: false
      })
    });

    // Public visitors must be allowed to validate a coupon code
    assert.ok(res.status === 200 || res.status === 400 || res.status === 404, 'Validation endpoint must respond without 401 auth gate');
    const resBody = await res.json();
    if (res.status === 200) {
      assert.equal(resBody.success, true);
      assert.equal(resBody.data?.code, 'PHASE2TEST');
    }
  });
});
