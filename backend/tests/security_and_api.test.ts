import dotenv from 'dotenv';
dotenv.config();

import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { escapeRegex, getPagination } from '../src/utils/sanitize.js';
import { verifyMagicBytes } from '../src/utils/fileValidation.js';

describe('DK Academy Backend — Comprehensive Security & API Test Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  const JWT_SECRET = env.JWT_SECRET;

  before(async () => {
    // Spin up lightweight test server on dynamic OS-assigned port
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr !== null) {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  // ==========================================
  // SECTION 1: Health, Liveness & Readiness
  // ==========================================
  describe('Phase 1 & 8: Health Probes', () => {
    test('GET /api/v1/health returns 200 OK with operational status', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'healthy');
      assert.ok(data.timestamp);
    });

    test('GET /api/v1/health/liveness returns 200 alive with process uptime', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health/liveness`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'alive');
      assert.equal(typeof data.uptimeSeconds, 'number');
    });

    test('GET /api/v1/health/readiness returns valid response structure', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health/readiness`);
      assert.ok([200, 503].includes(res.status));
      const data = await res.json();
      assert.ok(['ready', 'degraded'].includes(data.status));
      assert.ok(data.database);
    });
  });

  // ==========================================
  // SECTION 2: Security & Authentication Gates
  // ==========================================
  describe('Phase 2 & 4: Authentication & Authorization Gates', () => {
    test('Unauthenticated request to GET /api/v1/leads is rejected with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/v1/leads`);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /Not authorized/i);
    });

    test('Old backdoor token (dka_sess_*) is rejected with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/v1/leads`, {
        headers: { Authorization: 'Bearer dka_sess_demo_super_admin' }
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('Forged JWT signature is rejected with 401 Unauthorized', async () => {
      const forgedToken = jwt.sign(
        { id: 'fake_admin_id', role: 'SUPER_ADMIN', email: 'hacker@attacker.com' },
        'wrong_secret_key'
      );
      const res = await fetch(`${baseUrl}/api/v1/leads`, {
        headers: { Authorization: `Bearer ${forgedToken}` }
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /invalid|failed/i);
    });

    test('Unsigned alg: none JWT token is rejected with 401 Unauthorized', async () => {
      // Craft unsigned alg: none header
      const headerB64 = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payloadB64 = Buffer.from(JSON.stringify({ id: 'admin_test_123', role: 'SUPER_ADMIN' })).toString('base64url');
      const algNoneToken = `${headerB64}.${payloadB64}.`;

      const res = await fetch(`${baseUrl}/api/v1/leads`, {
        headers: { Authorization: `Bearer ${algNoneToken}` }
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('Student token attempting to access admin route /api/v1/leads is rejected with 403 Forbidden', async () => {
      const studentToken = jwt.sign(
        { id: 'student_123', role: 'STUDENT', email: 'student@example.com' },
        JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '1h' }
      );
      const res = await fetch(`${baseUrl}/api/v1/leads`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /not authorized|access/i);
    });

    test('Valid SUPER_ADMIN token passes authorization gate on /api/v1/leads', async () => {
      const adminToken = jwt.sign(
        { id: 'admin_test_123', role: 'SUPER_ADMIN', email: 'admin@dkacademy.com' },
        JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '1h' }
      );
      const res = await fetch(`${baseUrl}/api/v1/leads`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      // Should pass authorization (non 401 / non 403)
      assert.ok(![401, 403].includes(res.status), `Expected non-auth error, got ${res.status}`);
    });
  });

  // ==========================================
  // SECTION 3: Input Validation & NoSQL Injection Defense
  // ==========================================
  describe('Phase 3: Schema Validation & NoSQL Injection Defense', () => {
    test('POST with object instead of string for email is rejected with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: { $gt: '' },
          password: 'Password123!'
        })
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /invalid request body schema/i);
    });

    test('POST with unrecognized/unexpected key is rejected with 400 Bad Request by strict schema', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'valid.user@example.com',
          password: 'Password123!',
          injectedAdminFlag: true
        })
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /invalid request body schema/i);
      assert.match(JSON.stringify(data.errors), /injectedAdminFlag/i);
    });

    test('POST /api/v1/leads with invalid email format is rejected with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/v1/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'not-a-valid-email-string',
          phone: '9876543210'
        })
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /invalid request body schema/i);
    });

    test('Invalid :id param fails ObjectId validation with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/v1/doubts/not-a-valid-mongo-id/like`, {
        method: 'PUT'
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /invalid path parameters/i);
    });
  });

  // ==========================================
  // SECTION 4: IDOR & Mass-Assignment Defenses
  // ==========================================
  describe('Phase 7: IDOR & Mass-Assignment Defenses', () => {
    test('Profile update cannot elevate role to SUPER_ADMIN (mass-assignment blocked by strict schema)', async () => {
      const studentToken = jwt.sign(
        { id: 'mock_student_id_123', role: 'STUDENT', email: 'student@example.com' },
        JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '1h' }
      );
      const res = await fetch(`${baseUrl}/api/v1/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          name: 'Honest Student',
          role: 'SUPER_ADMIN'
        })
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(JSON.stringify(data.errors), /role/i);
    });

    test('Authorized user submitting path traversal string is rejected safely with 400 Bad Request', async () => {
      const adminToken = jwt.sign(
        { id: 'mock_admin_id_456', role: 'SUPER_ADMIN', email: 'admin@dkacademy.com' },
        JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '1h' }
      );
      const res = await fetch(`${baseUrl}/api/v1/upload/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ publicId: '../../etc/passwd' })
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /invalid file path/i);
    });
  });

  // ==========================================
  // SECTION 5: Magic Bytes File Validation
  // ==========================================
  describe('Phase 6: Binary Magic Bytes Inspection', () => {
    const tmpDir = os.tmpdir();

    test('Spoofed HTML file with .jpg extension is rejected by magic bytes checker', () => {
      const fakeJpgPath = path.join(tmpDir, `test_fake_${Date.now()}.jpg`);
      fs.writeFileSync(fakeJpgPath, '<html><script>alert("xss")</script></html>');
      try {
        const isValid = verifyMagicBytes(fakeJpgPath, '.jpg');
        assert.equal(isValid, false, 'HTML payload disguised as JPG must be rejected');
      } finally {
        if (fs.existsSync(fakeJpgPath)) fs.unlinkSync(fakeJpgPath);
      }
    });

    test('Legitimate JPEG header bytes pass verification', () => {
      const validJpgPath = path.join(tmpDir, `test_valid_${Date.now()}.jpg`);
      // Standard JPEG header: FF D8 FF E0 00 10 4A 46 49 46 00 01
      const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60]);
      fs.writeFileSync(validJpgPath, jpegHeader);
      try {
        const isValid = verifyMagicBytes(validJpgPath, '.jpg');
        assert.equal(isValid, true, 'Legitimate JPEG header must pass');
      } finally {
        if (fs.existsSync(validJpgPath)) fs.unlinkSync(validJpgPath);
      }
    });

    test('Legitimate PDF header bytes pass verification', () => {
      const validPdfPath = path.join(tmpDir, `test_valid_${Date.now()}.pdf`);
      // %PDF-1.4 header
      const pdfHeader = Buffer.from('%PDF-1.4\n%Fake PDF binary content');
      fs.writeFileSync(validPdfPath, pdfHeader);
      try {
        const isValid = verifyMagicBytes(validPdfPath, '.pdf');
        assert.equal(isValid, true, 'Legitimate PDF header must pass');
      } finally {
        if (fs.existsSync(validPdfPath)) fs.unlinkSync(validPdfPath);
      }
    });

    test('Spoofed script with .pdf extension is rejected', () => {
      const fakePdfPath = path.join(tmpDir, `test_fake_${Date.now()}.pdf`);
      fs.writeFileSync(fakePdfPath, '#!/bin/bash\necho "Malicious payload"\n');
      try {
        const isValid = verifyMagicBytes(fakePdfPath, '.pdf');
        assert.equal(isValid, false, 'Shell script disguised as PDF must be rejected');
      } finally {
        if (fs.existsSync(fakePdfPath)) fs.unlinkSync(fakePdfPath);
      }
    });
  });

  // ==========================================
  // SECTION 6: Payment Signature & Webhook Security
  // ==========================================
  describe('Phase 2: Razorpay Payment Verification & Webhook Security', () => {
    test('Forged Razorpay signature is rejected with 400 Bad Request', async () => {
      const studentToken = jwt.sign(
        { id: '60c72b2f9b1d8b2bad000001', role: 'STUDENT', email: 'student@example.com' },
        JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '1h' }
      );
      const res = await fetch(`${baseUrl}/api/v1/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          razorpay_order_id: 'order_test_999999',
          razorpay_payment_id: 'pay_test_999999',
          razorpay_signature: 'forged_tampered_signature_hex_1234567890abcdef'
        })
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /invalid payment signature/i);
    });

    test('Webhook with invalid signature is rejected with 400 Bad Request', async () => {
      const rawPayload = JSON.stringify({
        entity: 'event',
        event: 'payment.captured',
        id: `evt_test_${Date.now()}`
      });

      const res = await fetch(`${baseUrl}/api/v1/payment/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'invalid_forged_webhook_signature'
        },
        body: rawPayload
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /invalid webhook signature/i);
    });

    test('Webhook with authentic signature is accepted and subsequent replay is idempotent', async () => {
      const eventId = `evt_test_sec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const payloadObj = {
        id: eventId,
        entity: 'event',
        event: 'order.paid',
        payload: {
          order: {
            entity: {
              id: `order_fake_${Date.now()}`,
              status: 'paid'
            }
          }
        }
      };
      const rawPayload = JSON.stringify(payloadObj);
      const validSignature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawPayload)
        .digest('hex');

      // First webhook delivery
      const res1 = await fetch(`${baseUrl}/api/v1/payment/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': validSignature
        },
        body: rawPayload
      });
      assert.equal(res1.status, 200);
      const data1 = await res1.json();
      assert.equal(data1.success, true);

      // Second replay delivery (test idempotency)
      const res2 = await fetch(`${baseUrl}/api/v1/payment/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': validSignature
        },
        body: rawPayload
      });
      assert.equal(res2.status, 200);
      const data2 = await res2.json();
      assert.equal(data2.success, true);
      assert.match(data2.message, /already processed/i);
    });
  });

  // ==========================================
  // SECTION 7: HTTP Headers & CORS Isolation
  // ==========================================
  describe('Phase 5: HTTP Security Headers & Strict CORS', () => {
    test('Responses contain Helmet security headers and omit X-Powered-By', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health`);
      assert.equal(res.headers.get('x-powered-by'), null);
      assert.ok(res.headers.get('x-content-type-options'));
      assert.ok(res.headers.get('content-security-policy'));
    });

    test('Unauthorized CORS origin does not receive Access-Control-Allow-Origin matching attacker', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health`, {
        headers: {
          Origin: 'https://malicious-evil-phishing.com'
        }
      });
      const allowOrigin = res.headers.get('access-control-allow-origin');
      assert.notEqual(allowOrigin, 'https://malicious-evil-phishing.com');
    });

    test('Allowed origin receives matching Access-Control-Allow-Origin header', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health`, {
        headers: {
          Origin: env.CLIENT_URL
        }
      });
      const allowOrigin = res.headers.get('access-control-allow-origin');
      assert.equal(allowOrigin, env.CLIENT_URL);
    });
  });

  // ==========================================
  // SECTION 8: Fail-Fast Startup Validation
  // ==========================================
  describe('Phase 1: Fail-Fast Configuration Validation', () => {
    test('Startup terminates with code 1 if required env var is missing', () => {
      // Execute node running env validation with missing JWT_SECRET
      const result = spawnSync(
        process.execPath,
        ['--import', 'tsx', '-e', 'import("./src/config/env.js")'],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            JWT_SECRET: '' // Blank/invalid secret
          },
          encoding: 'utf-8'
        }
      );
      assert.equal(result.status, 1, 'Process should exit with code 1 when required env is missing');
      assert.match(result.stderr || result.stdout, /FATAL CONFIGURATION ERROR/i);
    });
  });

  // ==========================================
  // SECTION 9: Sanitization Utilities
  // ==========================================
  describe('Input Sanitization & Bounded Pagination', () => {
    test('escapeRegex escapes ReDoS special characters correctly', () => {
      const dangerousInput = '.*+?^${}()|[]\\test';
      const escaped = escapeRegex(dangerousInput);
      assert.equal(escaped, '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\test');
      const re = new RegExp(escaped);
      assert.ok(re.test(dangerousInput));
    });

    test('getPagination enforces bounds and limits max query page size', () => {
      const p1 = getPagination(2, 25);
      assert.equal(p1.page, 2);
      assert.equal(p1.limit, 25);
      assert.equal(p1.skip, 25);

      const p2 = getPagination(1, 999999);
      assert.equal(p2.limit, 100);

      const p3 = getPagination(-5, -10);
      assert.equal(p3.page, 1);
      assert.equal(p3.limit, 1);
    });
  });
});

