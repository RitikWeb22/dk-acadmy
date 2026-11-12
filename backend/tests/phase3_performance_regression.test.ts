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
import fs from 'fs';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import { escapeRegex, getPagination } from '../src/utils/sanitize.js';
import { Course } from '../src/models/Course.js';
import { TestSeries } from '../src/models/TestSeries.js';

describe('Phase 3 — Performance Optimization & Resilience Regression Tests', () => {
  let server: http.Server;
  let baseUrl: string;
  const adminToken = jwt.sign(
    { id: 'usr_admin_phase3', role: 'ADMIN', email: 'admin@dkacademy.com' },
    env.JWT_SECRET || 'test_jwt_secret_dk_academy_2026',
    { algorithm: 'HS256', expiresIn: '1h' }
  );

  before(async () => {
    try {
      await connectDB();
      console.log('[Phase 3 Test DB Connected]');
    } catch (err: any) {
      console.warn('[Phase 3 Test DB Warning]:', err?.message || err);
    }

    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        console.log('[Phase 3 Test Server Ready at]:', baseUrl);
        resolve();
      });
    });

    if (mongoose.connection.readyState === 1) {
      try {
        // Seed 3 test courses for pagination tests
        await Course.deleteMany({ slug: { $regex: /^test-phase3-course-/ } });
        await Course.create([
          {
            title: 'Test Phase 3 Course Alpha',
            slug: 'test-phase3-course-alpha',
            description: 'Course Alpha for pagination test',
            price: 1999,
            category: 'JEE Main',
            targetClass: 'Class 11'
          },
          {
            title: 'Test Phase 3 Course Beta',
            slug: 'test-phase3-course-beta',
            description: 'Course Beta for pagination test',
            price: 2999,
            category: 'JEE Main',
            targetClass: 'Class 12'
          },
          {
            title: 'Test Phase 3 Course Gamma',
            slug: 'test-phase3-course-gamma',
            description: 'Course Gamma for pagination test',
            price: 3999,
            category: 'JEE Advanced',
            targetClass: 'Dropper'
          }
        ]);
      } catch (seedErr) {
        console.warn('[Phase 3 Mock Seed Note]:', seedErr);
      }
    }
  });

  after(async () => {
    if (mongoose.connection.readyState === 1) {
      try {
        await Course.deleteMany({ slug: { $regex: /^test-phase3-course-/ } });
      } catch {}
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Issue PERF-03: Course Catalog Pagination & Backward Compatibility
  // ─────────────────────────────────────────────────────────────
  test('1. GET /api/v1/courses supports bounded pagination when limit is provided', async () => {
    const res = await fetch(`${baseUrl}/api/v1/courses?page=1&limit=2`, {
      method: 'GET',
      headers: { 'X-Forwarded-For': '10.30.1.1' }
    });

    assert.equal(res.status, 200, 'Paginated courses request must return 200');
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.page, 1);
    assert.ok(data.count <= 2, 'Count must respect limit');
    assert.ok(typeof data.total === 'number', 'Total documents must be returned');
    assert.ok(typeof data.totalPages === 'number', 'Total pages must be calculated');
    assert.ok(typeof data.hasMore === 'boolean', 'hasMore boolean must be present');
    assert.ok(Array.isArray(data.data), 'Data must be an array of courses');
  });

  test('2. GET /api/v1/courses retains full catalog array for legacy callers without limit', async () => {
    const res = await fetch(`${baseUrl}/api/v1/courses`, {
      method: 'GET',
      headers: { 'X-Forwarded-For': '10.30.1.2' }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data), 'Legacy caller must receive full array');
    assert.ok(data.data.length >= 3, 'Must contain seeded courses');
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Issue PERF-03: Test Series Catalog Pagination & Backward Compatibility
  // ─────────────────────────────────────────────────────────────
  test('3. GET /api/v1/test-series supports bounded pagination when limit is provided', async () => {
    const res = await fetch(`${baseUrl}/api/v1/test-series?page=1&limit=1`, {
      method: 'GET',
      headers: { 'X-Forwarded-For': '10.30.1.3' }
    });

    assert.equal(res.status, 200, 'Paginated test-series request must return 200');
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.page, 1);
    assert.ok(data.count <= 1, 'Count must respect limit');
    assert.ok(typeof data.total === 'number', 'Total count must be returned');
    assert.ok(typeof data.totalPages === 'number');
    assert.ok(Array.isArray(data.data));
  });

  test('4. GET /api/v1/test-series retains full array response for legacy unpaginated callers', async () => {
    const res = await fetch(`${baseUrl}/api/v1/test-series`, {
      method: 'GET',
      headers: { 'X-Forwarded-For': '10.30.1.4' }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data), 'Unpaginated request must return data array');
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Issue PERF-04: ReDoS & Unescaped Regex Injection Protection
  // ─────────────────────────────────────────────────────────────
  test('5. escapeRegex utility sanitizes regex metacharacters properly', () => {
    const maliciousInput = '(((((((a+)+)+)+)+)+)+)[]{}*?^$\\';
    const sanitized = escapeRegex(maliciousInput);
    assert.equal(sanitized, '\\(\\(\\(\\(\\(\\(\\(a\\+\\)\\+\\)\\+\\)\\+\\)\\+\\)\\+\\)\\+\\)\\[\\]\\{\\}\\*\\?\\^\\$\\\\');
    // Ensure the escaped string compiles to a literal RegExp without syntax error or catastrophic backtracking
    const re = new RegExp(sanitized);
    assert.ok(re.test(maliciousInput));
  });

  test('6. GET /api/v1/courses safely handles unescaped regex characters without 500 error', async () => {
    // Malformed regex pattern: unmatched open bracket '[' or open paren '('
    const res = await fetch(`${baseUrl}/api/v1/courses?search=[unclosed_bracket(`, {
      method: 'GET',
      headers: { 'X-Forwarded-For': '10.30.1.5' }
    });

    assert.equal(res.status, 200, 'Regex characters must not crash the courses search endpoint');
    const data = await res.json();
    assert.equal(data.success, true);
  });

  test('7. GET /api/v1/test-series safely handles ReDoS exploit payloads without crashing or timeout', async () => {
    const redosPayload = '((((((((((a+)+)+)+)+)+)+)+)+)+)';
    const start = Date.now();
    const res = await fetch(`${baseUrl}/api/v1/test-series?search=${encodeURIComponent(redosPayload)}`, {
      method: 'GET',
      headers: { 'X-Forwarded-For': '10.30.1.6' }
    });
    const elapsed = Date.now() - start;

    assert.equal(res.status, 200, 'ReDoS payload must not cause 500 error');
    assert.ok(elapsed < 1000, `ReDoS payload took ${elapsed}ms; must execute in under 1000ms`);
  });

  test('8. GET /api/v1/dpp-pyq safely handles unescaped regex metacharacters', async () => {
    const res = await fetch(`${baseUrl}/api/v1/dpp-pyq?search=${encodeURIComponent('.*+?^${}()|[]\\')}`, {
      method: 'GET',
      headers: { 'X-Forwarded-For': '10.30.1.7' }
    });

    assert.equal(res.status, 200, 'DPP search with special chars must not crash');
    const data = await res.json();
    assert.ok(data);
  });

  test('9. GET /api/v1/dpp-pyq/question-bank safely handles complex regex payloads', async () => {
    const res = await fetch(`${baseUrl}/api/v1/dpp-pyq/question-bank?search=${encodeURIComponent('(a|b|c)*?')}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'X-Forwarded-For': '10.30.1.8'
      }
    });

    assert.equal(res.status, 200, 'QuestionBank search must not crash on regex metacharacters');
    const data = await res.json();
    assert.ok(data);
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Issue PERF-01 & PERF-02: Frontend Polling & Countdown Interval Consolidation
  // ─────────────────────────────────────────────────────────────
  test('10. Frontend useSharedClock hook file exists and exports reference-counted clock', () => {
    const hookPath = path.resolve(process.cwd(), 'frontend/src/hooks/useSharedClock.ts');
    assert.ok(fs.existsSync(hookPath), 'useSharedClock hook must exist');
    const content = fs.readFileSync(hookPath, 'utf8');
    assert.match(content, /export function useSharedClock/, 'useSharedClock must be exported');
    assert.match(content, /listeners\.add/, 'Must reference-count subscribers');
    assert.match(content, /listeners\.delete/, 'Must clean up subscribers');
  });

  test('11. DashboardPage and TestSeriesPage use 60s visibility-aware polling intervals', () => {
    const dashboardPath = path.resolve(process.cwd(), 'frontend/src/pages/Dashboard/DashboardPage.tsx');
    const testSeriesPath = path.resolve(process.cwd(), 'frontend/src/pages/TestSeries/TestSeriesPage.tsx');

    const dashContent = fs.readFileSync(dashboardPath, 'utf8');
    assert.doesNotMatch(dashContent, /setInterval\([^,]+,\s*4500\)/, '4.5s aggressive dashboard polling must be removed');
    assert.match(dashContent, /60000/, 'Dashboard must use 60s polling');
    assert.match(dashContent, /visibilitychange/, 'Dashboard must be visibility-aware');

    const testContent = fs.readFileSync(testSeriesPath, 'utf8');
    assert.doesNotMatch(testContent, /setInterval\([^,]+,\s*3500\)/, '3.5s aggressive test-series polling must be removed');
    assert.match(testContent, /60000/, 'TestSeries must use 60s polling');
    assert.match(testContent, /visibilitychange/, 'TestSeries must be visibility-aware');
  });

  test('12. Component cards use useSharedClock instead of separate 1-second intervals', () => {
    const dppCardPath = path.resolve(process.cwd(), 'frontend/src/components/dpp/DPPSetCard/DPPSetCard.tsx');
    const pyqPagePath = path.resolve(process.cwd(), 'frontend/src/pages/PYQ/PYQPage.tsx');
    const testCardPath = path.resolve(process.cwd(), 'frontend/src/components/testSeries/TestCard/TestCard.tsx');

    const dppContent = fs.readFileSync(dppCardPath, 'utf8');
    assert.match(dppContent, /useSharedClock/, 'DPPSetCard must use useSharedClock');
    assert.doesNotMatch(dppContent, /setInterval\(\(\) => setNowTime/, 'DPPSetCard must not create standalone setInterval');

    const pyqContent = fs.readFileSync(pyqPagePath, 'utf8');
    assert.match(pyqContent, /useSharedClock/, 'PYQPage must use useSharedClock');

    const testContent = fs.readFileSync(testCardPath, 'utf8');
    assert.match(testContent, /useSharedClock/, 'TestCard must use useSharedClock');
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Issue PERF-05: PM2 Cluster Configuration & Shared State
  // ─────────────────────────────────────────────────────────────
  test('13. ecosystem.config.cjs configures cluster worker instances safely without Redis desync', () => {
    const configPath = path.resolve(process.cwd(), 'ecosystem.config.cjs');
    const configContent = fs.readFileSync(configPath, 'utf8');
    assert.match(configContent, /process\.env\.PM2_INSTANCES/, 'Must allow PM2_INSTANCES override');
    assert.match(configContent, /process\.env\.REDIS_URL/, 'Must check REDIS_URL for multi-worker scaling');
  });

  test('14. lmsVideoController uses filesystem chunk tracking instead of in-memory Map', () => {
    const controllerPath = path.resolve(process.cwd(), 'backend/src/controllers/lmsVideoController.ts');
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');
    assert.doesNotMatch(controllerContent, /const chunkUploads = new Map/, 'In-memory chunkUploads Map must be eliminated');
    assert.match(controllerContent, /meta\.json/, 'Must track upload metadata on disk for cluster workers');
    assert.match(controllerContent, /existingChunks\.length >= total/, 'Must check disk chunks across all cluster instances');
  });
});
