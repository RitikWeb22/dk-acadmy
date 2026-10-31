import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import { env } from './config/env.js';
import apiRoutes from './routes/apiRoutes.js';
import { handleRazorpayWebhook } from './controllers/paymentController.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import { sanitizeInputs, globalApiLimiter } from './middlewares/securityMiddleware.js';
import { requestLogger } from './middlewares/loggerMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Assign correlation IDs and log structured requests with sensitive data redaction
app.use(requestLogger);

// Trust reverse proxy (for rate limiting, IP resolution behind Nginx/Render/Cloudflare)
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Enhanced Security Headers (Helmet with strict Content-Security-Policy)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://checkout.razorpay.com',
          'https://accounts.google.com'
        ],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://res.cloudinary.com',
          'https://*.razorpay.com',
          'https://lh3.googleusercontent.com'
        ],
        connectSrc: [
          "'self'",
          'https://api.razorpay.com',
          'https://lvh.me:*',
          'ws:',
          'wss:',
          'https://res.cloudinary.com',
          'https://accounts.google.com'
        ],
        frameSrc: [
          'https://api.razorpay.com',
          'https://checkout.razorpay.com',
          'https://accounts.google.com'
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"]
      }
    },
    crossOriginResourcePolicy: { policy: 'same-origin' }, // Protected by default; cross-origin scoped to /uploads & /stream only
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

      // Check strict allowlist exact match
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Vercel deployment preview domains with strict regex pattern
      if (/^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)) {
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

// Request body parsers with strictly bounded content size (100kb)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ limit: '100kb', extended: true }));

// NoSQL Injection & Input Sanitizer (recursively cleans req.body, req.query, req.params)
app.use(sanitizeInputs);

// Serve local media uploads statically with download/view restrictions and scoped cross-origin policy
app.use(
  '/uploads',
  (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.join(process.cwd(), 'public', 'uploads'), {
    dotfiles: 'ignore',
    maxAge: '1d'
  })
);

// Mount Rate-Limited API Routes (supports both /api/v1 and /api)
app.use('/api/v1', globalApiLimiter, apiRoutes);
app.use('/api', globalApiLimiter, apiRoutes);

// Candidate directories for static React frontend build
const candidateFrontendDirs = [
  path.join(process.cwd(), 'public'),
  path.join(process.cwd(), 'backend', 'public'),
  path.join(__dirname, '../public'),
  path.join(__dirname, '../../frontend/dist'),
  path.join(process.cwd(), 'frontend', 'dist')
];

const resolvedFrontendDir = candidateFrontendDirs.find((dir) =>
  fs.existsSync(path.join(dir, 'index.html'))
);

if (resolvedFrontendDir) {
  // Serve static assets from frontend build
  app.use(
    express.static(resolvedFrontendDir, {
      maxAge: '1d',
      index: false
    })
  );

  // SPA fallback for all non-API / non-upload GET routes
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(resolvedFrontendDir, 'index.html'));
  });
} else {
  // Fallback API root route when frontend is hosted separately
  app.get('/', (_req, res) => {
    res.json({
      message: 'Welcome to DK Academy JEE & BITSAT Official Backend Server',
      version: '1.0.0',
      documentation: '/api/v1/health'
    });
  });
}

// Error Handling for unhandled API and static routes
app.use(notFound);
app.use(errorHandler);
