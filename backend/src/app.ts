import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import { env } from './config/env.js';
import apiRoutes from './routes/apiRoutes.js';
import { handleRazorpayWebhook } from './controllers/paymentController.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import { sanitizeInputs, globalApiLimiter } from './middlewares/securityMiddleware.js';

export const app = express();

// Trust reverse proxy (for rate limiting, IP resolution behind Nginx/Render/Cloudflare)
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Enhanced Security Headers (Helmet)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    frameguard: { action: 'deny' }, // Clickjacking protection
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    dnsPrefetchControl: { allow: false },
    xContentTypeOptions: true // Prevent MIME type sniffing
  })
);

// Explicit CORS Allowlist from validated environment configuration
const allowedOrigins = env.ALLOWED_ORIGINS_ARRAY;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile native apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Check strict allowlist match
      if (allowedOrigins.some((allowed) => allowed === origin || (allowed && allowed.includes(origin)))) {
        return callback(null, true);
      }

      // Vercel deployment preview domains
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      // Reject unapproved origins in all environments (no arbitrary origin reflection with credentials)
      return callback(new Error(`CORS Security Violation: Origin ${origin} not authorized.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
  })
);

// Razorpay Webhook endpoint mounted with raw body parser BEFORE global express.json()
app.post(
  ['/api/v1/payment/webhook', '/api/payment/webhook'],
  express.raw({ type: 'application/json' }),
  handleRazorpayWebhook
);

// Request body parsers with bounded content size
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// NoSQL Injection & Input Sanitizer (recursively cleans req.body, req.query, req.params)
app.use(sanitizeInputs);

// Serve local media uploads statically with download/view restrictions
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads'), {
  dotfiles: 'ignore',
  maxAge: '1d'
}));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to DK Academy JEE & BITSAT Official Backend Server',
    version: '1.0.0',
    documentation: '/api/v1/health'
  });
});

// Mount Rate-Limited API Routes (supports both /api/v1 and /api)
app.use('/api/v1', globalApiLimiter, apiRoutes);
app.use('/api', globalApiLimiter, apiRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);
