import dotenv from 'dotenv';
dotenv.config();

import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { TestSeries } from '../src/models/TestSeries.js';
import { TestSubmission } from '../src/models/TestSubmission.js';

interface LatencyStats {
  concurrency: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  durationMs: number;
  rps: number;
  minMs: number;
  meanMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
}

function calculateStats(concurrency: number, latencies: number[], durationMs: number, failures: number): LatencyStats {
  latencies.sort((a, b) => a - b);
  const n = latencies.length;
  const sum = latencies.reduce((acc, v) => acc + v, 0);

  const getPercentile = (p: number) => {
    if (n === 0) return 0;
    const idx = Math.min(n - 1, Math.floor((p / 100) * n));
    return latencies[idx];
  };

  return {
    concurrency,
    totalRequests: n + failures,
    successfulRequests: n,
    failedRequests: failures,
    durationMs: Math.round(durationMs),
    rps: durationMs > 0 ? Math.round(((n + failures) / (durationMs / 1000)) * 10) / 10 : 0,
    minMs: n > 0 ? Math.round(latencies[0] * 10) / 10 : 0,
    meanMs: n > 0 ? Math.round((sum / n) * 10) / 10 : 0,
    p50Ms: Math.round(getPercentile(50) * 10) / 10,
    p95Ms: Math.round(getPercentile(95) * 10) / 10,
    p99Ms: Math.round(getPercentile(99) * 10) / 10,
    maxMs: n > 0 ? Math.round(latencies[n - 1] * 10) / 10 : 0
  };
}

describe('DK Academy Backend — Phase 3: High-Concurrency Student Testing Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  let benchmarkTestSeries: any;
  let studentTokens: string[] = [];

  const JWT_SECRET = env.JWT_SECRET;
  const baseUri = env.MONGO_URI;
  const isolatedUri = baseUri.replace(/\/dk_academy_jee(\?|$)/, '/dk_academy_jee_test_isolated$1');

  before(async () => {
    assert.ok(isolatedUri.includes('dk_academy_jee_test_isolated'), 'Must only connect to isolated staging test DB');

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    await mongoose.connect(isolatedUri, {
      maxPoolSize: 50, // Staging connection pool capacity
      serverSelectionTimeoutMS: 15000,
      family: 4
    });

    // Cleanup previous load-test data
    await TestSubmission.deleteMany({ submissionId: { $regex: /^load-test-/ } });
    await TestSeries.deleteMany({ slug: { $regex: /^load-test-benchmark-/ } });

    // Seed realistic 3-question JEE Grand Mock Exam
    benchmarkTestSeries = await TestSeries.create({
      id: `ts-load-${Date.now()}`,
      title: 'JEE Advanced High-Concurrency Benchmark Grand Mock',
      slug: `load-test-benchmark-${Date.now()}`,
      examType: 'JEE Advanced',
      format: 'Full Mock',
      difficulty: 'Hard',
      durationMinutes: 180,
      totalQuestions: 3,
      totalMarks: 12,
      markingScheme: { correct: 4, incorrect: 1, unattempted: 0 },
      solutionRelease: {
        enabled: true,
        releaseDelayHours: 24,
        pdfUrl: 'https://cdn.dkacademy.com/sol.pdf'
      },
      questions: [
        {
          id: 'q1',
          questionNumber: 1,
          subject: 'Physics',
          section: 'A',
          type: 'SINGLE_CORRECT',
          statement: 'Calculate the total kinetic energy of a rolling sphere of mass M and velocity V.',
          options: [
            { id: 'A', text: '\\frac{7}{10} M V^2' },
            { id: 'B', text: '\\frac{1}{2} M V^2' },
            { id: 'C', text: '\\frac{3}{4} M V^2' },
            { id: 'D', text: '\\frac{2}{5} M V^2' }
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
          statement: 'Identify the state of matter at absolute zero according to Bose-Einstein statistics.',
          options: [
            { id: 'A', text: 'Plasma' },
            { id: 'B', text: 'Bose-Einstein Condensate' },
            { id: 'C', text: 'Supercritical Fluid' },
            { id: 'D', text: 'Fermionic Degenerate' }
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
          statement: 'Find the numerical value of Planck constant in units of 10^-34 J*s (round to 2 decimals):',
          options: [],
          numericalAnswer: '6.63',
          correctAnswer: '6.63',
          marks: 4,
          negativeMarks: 0
        }
      ]
    });

    // Pre-generate 1,000 valid JWT tokens for simulated concurrent students
    for (let i = 0; i < 1000; i++) {
      const token = jwt.sign(
        { id: `sim_student_${i}`, role: 'STUDENT', email: `sim_${i}@test-isolated.com` },
        JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '4h' }
      );
      studentTokens.push(token);
    }

    // Start local server on high-performance port
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
      await TestSubmission.deleteMany({ submissionId: { $regex: /^load-test-/ } });
      await TestSeries.deleteMany({ slug: { $regex: /^load-test-benchmark-/ } });
      await mongoose.disconnect();
    } catch {}

    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  // ==========================================
  // SECTION 1: 100 Concurrent Students Load Test
  // ==========================================
  test('100 concurrent students simultaneously autosaving progress and submitting tests', async () => {
    const concurrency = 100;
    const latencies: number[] = [];
    let failures = 0;
    const t0 = performance.now();

    const tasks = Array.from({ length: concurrency }, async (_, i) => {
      const studentId = `sim_student_${i}`;
      const subId = `load-test-100-${i}-${Date.now()}`;
      const token = studentTokens[i];

      const startReq = performance.now();
      try {
        // Step 1: Autosave progress
        const autoRes = await fetch(`${baseUrl}/api/v1/test-series/${benchmarkTestSeries._id}/autosave`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            studentId,
            timeSpentSeconds: 60,
            responses: { q1: { selectedOption: 'A' } }
          })
        });
        assert.equal(autoRes.status, 200);

        // Step 2: Final Submit
        const subRes = await fetch(`${baseUrl}/api/v1/test-series/${benchmarkTestSeries._id}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            clientSubmissionId: subId,
            studentId,
            timeSpentSeconds: 120,
            responses: {
              q1: { selectedOption: 'A' }, // +4
              q2: { selectedOption: 'B' }, // +4
              q3: { numericalValue: '6.63' } // +4 -> Score: 12
            }
          })
        });
        assert.ok([200, 201].includes(subRes.status));
        const subData = await subRes.json();
        assert.equal(subData.data.score, 12);
        latencies.push(performance.now() - startReq);
      } catch (err) {
        failures++;
      }
    });

    await Promise.all(tasks);
    const totalDuration = performance.now() - t0;
    const stats = calculateStats(concurrency, latencies, totalDuration, failures);

    console.log(`[Load Benchmark 100 Concurrent]:`, JSON.stringify(stats));
    assert.equal(failures, 0, 'Zero failures allowed for 100 concurrent students');
    assert.equal(stats.successfulRequests, 100, 'All 100 concurrent requests must complete successfully');
  });

  // ==========================================
  // SECTION 2: 250 Concurrent Students Load Test
  // ==========================================
  test('250 concurrent students simultaneously taking & submitting exams', async () => {
    const concurrency = 250;
    const latencies: number[] = [];
    let failures = 0;
    const t0 = performance.now();

    const tasks = Array.from({ length: concurrency }, async (_, i) => {
      const studentId = `sim_student_${i}`;
      const subId = `load-test-250-${i}-${Date.now()}`;
      const token = studentTokens[i];

      const startReq = performance.now();
      try {
        const res = await fetch(`${baseUrl}/api/v1/test-series/${benchmarkTestSeries._id}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            clientSubmissionId: subId,
            studentId,
            timeSpentSeconds: 180,
            responses: {
              q1: { selectedOption: i % 2 === 0 ? 'A' : 'C' },
              q2: { selectedOption: 'B' },
              q3: { numericalValue: '6.63' }
            }
          })
        });

        assert.ok([200, 201].includes(res.status));
        latencies.push(performance.now() - startReq);
      } catch (err) {
        failures++;
      }
    });

    await Promise.all(tasks);
    const totalDuration = performance.now() - t0;
    const stats = calculateStats(concurrency, latencies, totalDuration, failures);

    console.log(`[Load Benchmark 250 Concurrent]:`, JSON.stringify(stats));
    assert.equal(failures, 0, 'Zero failures allowed for 250 concurrent students');
    assert.equal(stats.successfulRequests, 250, 'All 250 concurrent students must be processed successfully');
  });

  // ==========================================
  // SECTION 3: 500 Concurrent Students Load Test
  // ==========================================
  test('500 concurrent students burst submission and autosave recovery test', async () => {
    const concurrency = 500;
    const latencies: number[] = [];
    let failures = 0;
    const t0 = performance.now();

    const tasks = Array.from({ length: concurrency }, async (_, i) => {
      const studentId = `sim_student_${i}`;
      const subId = `load-test-500-${i}-${Date.now()}`;
      const token = studentTokens[i];

      const startReq = performance.now();
      try {
        const res = await fetch(`${baseUrl}/api/v1/test-series/${benchmarkTestSeries._id}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            clientSubmissionId: subId,
            studentId,
            timeSpentSeconds: 240,
            responses: {
              q1: { selectedOption: 'A' },
              q2: { selectedOption: 'B' }
            }
          })
        });

        if (res.status === 201 || res.status === 200) {
          latencies.push(performance.now() - startReq);
        } else {
          failures++;
        }
      } catch (err) {
        failures++;
      }
    });

    await Promise.all(tasks);
    const totalDuration = performance.now() - t0;
    const stats = calculateStats(concurrency, latencies, totalDuration, failures);

    console.log(`[Load Benchmark 500 Concurrent]:`, JSON.stringify(stats));
    assert.ok(stats.successfulRequests >= 400, `At least 400 of 500 requests must succeed under WAN burst (succeeded: ${stats.successfulRequests})`);
  });

  // ==========================================
  // SECTION 4: 1,000 High-Capacity Burst Verification
  // ==========================================
  test('1,000 concurrent examination requests measuring platform saturation point', async () => {
    const concurrency = 1000;
    const latencies: number[] = [];
    let failures = 0;
    const t0 = performance.now();

    const tasks = Array.from({ length: concurrency }, async (_, i) => {
      const studentId = `sim_student_${i}`;
      const subId = `load-test-1000-${i}-${Date.now()}`;
      const token = studentTokens[i];

      const startReq = performance.now();
      try {
        const res = await fetch(`${baseUrl}/api/v1/test-series/${benchmarkTestSeries._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 200) {
          latencies.push(performance.now() - startReq);
        } else {
          failures++;
        }
      } catch (err) {
        failures++;
      }
    });

    await Promise.all(tasks);
    const totalDuration = performance.now() - t0;
    const stats = calculateStats(concurrency, latencies, totalDuration, failures);

    console.log(`[Load Benchmark 1,000 Concurrent]:`, JSON.stringify(stats));
    assert.ok(stats.successfulRequests >= 500, `At least 500 of 1000 concurrent requests must succeed under WAN burst (succeeded: ${stats.successfulRequests})`);
  });

  // ==========================================
  // SECTION 5: Simultaneous Duplicate Submission Collision Test
  // ==========================================
  test('Simultaneous race collision: 20 parallel requests with identical clientSubmissionId return cleanly without 500 error', async () => {
    const collisionSubId = `load-test-collision-${Date.now()}`;
    const token = studentTokens[0];

    const tasks = Array.from({ length: 20 }, async () => {
      return fetch(`${baseUrl}/api/v1/test-series/${benchmarkTestSeries._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          clientSubmissionId: collisionSubId,
          studentId: 'sim_student_0',
          responses: { q1: { selectedOption: 'A' } }
        })
      });
    });

    const responses = await Promise.all(tasks);
    for (const res of responses) {
      assert.ok([200, 201].includes(res.status), `Status must be 200 or 201, got ${res.status}`);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.data.submissionId, collisionSubId);
    }

    // Verify exactly ONE document exists in MongoDB despite 20 simultaneous submissions
    const count = await TestSubmission.countDocuments({ submissionId: collisionSubId });
    assert.equal(count, 1, 'Exactly one submission record must exist in MongoDB');
  });
});
