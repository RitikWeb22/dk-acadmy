import dotenv from 'dotenv';
dotenv.config();

import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { escapeRegex, getPagination } from '../src/utils/sanitize.js';

describe('DK Academy Backend — Comprehensive Security & API Test Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  const JWT_SECRET = process.env.JWT_SECRET || 'F7x6LaFFrx1V4PSoHdi4iP5pSta4h7Ay2M6fu5R8r0k';

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
      // Since database may be connected or disconnected in test env, check valid contract
      assert.ok([200, 503].includes(res.status));
      const data = await res.json();
      assert.ok(['ready', 'degraded'].includes(data.status));
      assert.ok(data.database);
    });
  });

  // ==========================================
  // SECTION 2: Security & Authentication Gates
  // ==========================================
  describe('Phase 2: Authentication & Authorization Gates', () => {
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

    test('Student token attempting to access admin route /api/v1/leads is rejected with 403 Forbidden', async () => {
      const studentToken = jwt.sign(
        { id: 'student_123', role: 'STUDENT', email: 'student@example.com' },
        JWT_SECRET,
        { expiresIn: '1h' }
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
        { expiresIn: '1h' }
      );
      const res = await fetch(`${baseUrl}/api/v1/leads`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      // Should not be 401 or 403 (could be 200 or 500 depending on live DB connection)
      assert.ok(![401, 403].includes(res.status), `Expected non-auth error, got ${res.status}`);
    });
  });

  // ==========================================
  // SECTION 3: Path Traversal Defenses
  // ==========================================
  describe('Phase 2: Path Traversal Vulnerability Defenses', () => {
    test('Unauthenticated deleteMedia request is rejected with 401', async () => {
      const res = await fetch(`${baseUrl}/api/v1/upload/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: '../../package.json' })
      });
      assert.equal(res.status, 401);
    });

    test('Authorized user submitting path traversal string is rejected safely with 400 Bad Request', async () => {
      const adminToken = jwt.sign(
        { id: 'admin_test_123', role: 'SUPER_ADMIN', email: 'admin@dkacademy.com' },
        JWT_SECRET,
        { expiresIn: '1h' }
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
  // SECTION 4: Input Sanitization & Pagination
  // ==========================================
  describe('Phase 2 & 6: Input Sanitization & Bounded Pagination', () => {
    test('escapeRegex escapes ReDoS special characters correctly', () => {
      const dangerousInput = '.*+?^${}()|[]\\test';
      const escaped = escapeRegex(dangerousInput);
      assert.equal(escaped, '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\test');
      // Verify safe usage inside RegExp constructor without crashing
      const re = new RegExp(escaped);
      assert.ok(re.test(dangerousInput));
    });

    test('getPagination enforces bounds and limits max query page size', () => {
      // Normal bounds
      const p1 = getPagination(2, 25);
      assert.equal(p1.page, 2);
      assert.equal(p1.limit, 25);
      assert.equal(p1.skip, 25);

      // Oversized limit capped to maxLimit (100)
      const p2 = getPagination(1, 999999);
      assert.equal(p2.limit, 100);

      // Negative or invalid page coerced to 1
      const p3 = getPagination(-5, -10);
      assert.equal(p3.page, 1);
      assert.equal(p3.limit, 1);
    });
  });

  // ==========================================
  // SECTION 5: HTTP Security Headers
  // ==========================================
  describe('Phase 2: HTTP Security Headers & Helmet', () => {
    test('Responses contain Helmet security headers and omit X-Powered-By', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health`);
      assert.equal(res.headers.get('x-powered-by'), null);
      assert.ok(res.headers.get('x-content-type-options'));
    });
  });
});
