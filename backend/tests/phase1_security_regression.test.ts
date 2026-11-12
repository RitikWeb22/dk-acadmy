import dotenv from 'dotenv';
dotenv.config();

import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';

describe('Phase 1 — Critical Security Regression Tests', () => {
  let server: http.Server;
  let baseUrl: string;
  const JWT_SECRET = env.JWT_SECRET || 'test_jwt_secret_dk_academy_2026';

  const superAdminToken = jwt.sign(
    { id: 'usr_super_01', role: 'SUPER_ADMIN', email: 'ritikweb30@gmail.com' },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' }
  );

  const teacherToken = jwt.sign(
    { id: 'usr_teacher_01', role: 'TEACHER', email: 'teacher@dkacademy.com' },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' }
  );

  const counselorToken = jwt.sign(
    { id: 'usr_counselor_01', role: 'COUNSELOR', email: 'counselor@dkacademy.com' },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' }
  );

  const studentToken = jwt.sign(
    { id: 'usr_student_01', role: 'STUDENT', email: 'student@dkacademy.com' },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' }
  );

  before(async () => {
    try {
      await connectDB();
      console.log('[Test DB Connected successfully]');
    } catch (err: any) {
      console.warn('[Test DB Connection warning]:', err?.message || err);
    }

    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        console.log('[Test Server Ready at]:', baseUrl);
        resolve();
      });
    });
  });

  after(async () => {
    try {
      mongoose.connection.removeAllListeners();
      await mongoose.disconnect();
    } catch {}
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    setTimeout(() => process.exit(0), 100).unref();
  });

  // TEST 1: Authentication Backdoor Passwords Rejected
  test('CRIT-SEC-01: Admin login rejects hardcoded backdoor passwords', async () => {
    const backdoorPasswords = ['ritik@123', 'admin123', 'admin@123', 'admin', 'teacher123'];
    for (const pwd of backdoorPasswords) {
      try {
        const res = await fetch(`${baseUrl}/api/v1/auth/admin-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'nonexistent_attacker@dkacademy.com', password: pwd })
        });
        assert.strictEqual(res.status, 401, `Backdoor password "${pwd}" must be rejected with 401`);
      } catch (err: any) {
        console.error('[Fetch Error Cause]:', err?.cause || err);
        throw err;
      }
    }
  });

  test('CRIT-SEC-01: Admin login rejects student role logins', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/admin-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.100'
      },
      body: JSON.stringify({ email: 'student@dkacademy.com', password: 'randomPassword999' })
    });
    // Must be rejected as unauthorized or rate limited
    assert.ok([401, 403, 429].includes(res.status), `Expected 401/403/429 but got ${res.status}`);
  });

  // TEST 2: Gemini Configuration Endpoints Protected
  test('CRIT-SEC-03: GET /system/gemini-config is protected against unauthenticated users', async () => {
    const res = await fetch(`${baseUrl}/api/v1/system/gemini-config`);
    assert.strictEqual(res.status, 401, 'Unauthenticated request must return 401');
  });

  test('CRIT-SEC-03: POST /system/gemini-config is protected against unauthenticated users', async () => {
    const res = await fetch(`${baseUrl}/api/v1/system/gemini-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: 'evil_key' })
    });
    assert.strictEqual(res.status, 401, 'Unauthenticated request must return 401');
  });

  test('CRIT-SEC-03: POST /system/gemini-config rejects non-admin users', async () => {
    const res = await fetch(`${baseUrl}/api/v1/system/gemini-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ apiKey: 'evil_key' })
    });
    assert.strictEqual(res.status, 403, 'Student token must be rejected with 403');
  });

  test('CRIT-SEC-03: POST /system/gemini-config rejects newline injection in API key', async () => {
    const res = await fetch(`${baseUrl}/api/v1/system/gemini-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ apiKey: 'valid_key\nATTACKER_OVERWRITE=true', model: 'gemini-2.5-flash' })
    });
    assert.strictEqual(res.status, 400, 'Newline characters in API key must return 400');
  });

  // TEST 3: LiveKit Token Generator Permissions
  test('CRIT-SEC-04: POST /live/token rejects teacher role from unauthenticated callers', async () => {
    const res = await fetch(`${baseUrl}/api/v1/live/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: 'classroom_101', role: 'teacher' })
    });
    assert.strictEqual(res.status, 403, 'Unauthenticated teacher token request must return 403');
  });

  test('CRIT-SEC-04: POST /live/token rejects teacher role from student accounts', async () => {
    const res = await fetch(`${baseUrl}/api/v1/live/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ roomId: 'classroom_101', role: 'teacher' })
    });
    assert.strictEqual(res.status, 403, 'Student attempting to get teacher token must return 403');
  });

  // TEST 4: CBT Exam Question Answer Stripping
  test('CRIT-SEC-05: GET /test-series/:id strips correct answers and solutions for students/guests', async () => {
    const res = await fetch(`${baseUrl}/api/v1/test-series/test-ja-coord-geom-01`, {
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });
    if (res.status === 200) {
      const body = await res.json();
      if (body.data && Array.isArray(body.data.questions)) {
        for (const q of body.data.questions) {
          assert.strictEqual(q.correctAnswer, undefined, 'correctAnswer must be stripped for students');
          assert.strictEqual(q.numericalAnswer, undefined, 'numericalAnswer must be stripped for students');
          assert.strictEqual(q.explanation, undefined, 'explanation must be stripped for students');
          assert.strictEqual(q.shortcutTrick, undefined, 'shortcutTrick must be stripped for students');
        }
      }
    }
  });

  // TEST 5: Payment and Enrollment Verification
  test('CRIT-SEC-06: POST /test-series/:id/unlock rejects requests without authentication', async () => {
    const res = await fetch(`${baseUrl}/api/v1/test-series/test-ja-coord-geom-01/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: 'fake_payment_123' })
    });
    assert.strictEqual(res.status, 401, 'Unauthenticated unlock request must return 401');
  });

  test('CRIT-SEC-06: POST /test-series/:id/unlock rejects fake/unverified payment IDs', async () => {
    const res = await fetch(`${baseUrl}/api/v1/test-series/test-ja-coord-geom-01/unlock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ paymentId: 'fake_nonexistent_payment_id' })
    });
    assert.strictEqual(res.status, 400, 'Unverified payment ID must return 400');
  });

  // TEST 6: Staff Management Privilege Escalation
  test('CRIT-SEC-07: Non-superadmin cannot delete staff accounts', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/staff/usr_target_01`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${counselorToken}`
      }
    });
    assert.strictEqual(res.status, 403, 'Counselor attempting to delete staff must return 403');
  });

  test('CRIT-SEC-07: Non-superadmin cannot promote users to SUPER_ADMIN', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/staff/usr_target_01`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({ role: 'SUPER_ADMIN' })
    });
    assert.strictEqual(res.status, 403, 'Teacher attempting to modify staff role to SUPER_ADMIN must return 403');
  });

  // TEST 7: Orders and Invoices Authorization
  test('CRIT-SEC-08: Counselors and Teachers cannot delete financial orders', async () => {
    const res = await fetch(`${baseUrl}/api/v1/payment/orders/ord_test_01`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${counselorToken}`
      }
    });
    assert.strictEqual(res.status, 403, 'Counselor deleting orders must return 403');
  });

  test('CRIT-SEC-08: Counselors and Teachers cannot purge demo orders', async () => {
    const res = await fetch(`${baseUrl}/api/v1/payment/orders-purge-demo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    });
    assert.strictEqual(res.status, 403, 'Teacher purging demo orders must return 403');
  });
});
