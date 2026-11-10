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
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://checkout.razorpay.com',
          'https://*.razorpay.com',
          'https://cdn.razorpay.com',
          'https://accounts.google.com',
          'https://*.google.com',
          'https://apis.google.com'
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://cdn.jsdelivr.net',
          'https://fonts.cdnfonts.com',
          'https://cdnfonts.com',
          'https://*.cdnfonts.com'
        ],
        styleSrcElem: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://cdn.jsdelivr.net',
          'https://fonts.cdnfonts.com',
          'https://cdnfonts.com',
          'https://*.cdnfonts.com'
        ],
        fontSrc: [
          "'self'",
          'https://fonts.gstatic.com',
          'https://cdn.jsdelivr.net',
          'https://fonts.cdnfonts.com',
          'https://cdnfonts.com',
          'https://*.cdnfonts.com',
          'data:'
        ],
        fontSrcElem: [
          "'self'",
          'https://fonts.gstatic.com',
          'https://cdn.jsdelivr.net',
          'https://fonts.cdnfonts.com',
          'https://cdnfonts.com',
          'https://*.cdnfonts.com',
          'data:'
        ],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://res.cloudinary.com',
          'https://images.unsplash.com',
          'https://*.unsplash.com',
          'https://unsplash.com',
          'https://*.razorpay.com',
          'https://cdn.razorpay.com',
          'https://lh3.googleusercontent.com',
          'https://*.googleusercontent.com',
          'https://img.youtube.com',
          'https://i.ytimg.com',
          'https://*.ytimg.com'
        ],
        mediaSrc: [
          "'self'",
          'blob:',
          'data:',
          'https://res.cloudinary.com',
          'https://*.cloudinary.com',
          'https://drive.google.com',
          'https://*.googleusercontent.com'
        ],
        connectSrc: [
          "'self'",
          'https://cdn.jsdelivr.net',
          'https://api.razorpay.com',
          'https://lumberjack.razorpay.com',
          'https://*.razorpay.com',
          'https://lvh.me:*',
          'ws:',
          'wss:',
          'https://res.cloudinary.com',
          'https://accounts.google.com',
          'https://*.google.com',
          'https://apis.google.com'
        ],
        frameSrc: [
          'https://api.razorpay.com',
          'https://checkout.razorpay.com',
          'https://*.razorpay.com',
          'https://accounts.google.com',
          'https://*.google.com',
          'https://www.youtube.com',
          'https://*.youtube.com',
          'https://www.youtube-nocookie.com',
          'https://*.youtube-nocookie.com',
          'https://drive.google.com',
          'https://docs.google.com'
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"]
      }
    },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // Enables Google Identity Services (GSI) & OAuth popups to communicate with window.opener / postMessage without getting blocked
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
  cors((req, callback) => {
    const origin = req.headers.origin;
    const host = req.headers.host;

    // Allow requests with no origin (e.g. mobile native apps, curl, server-to-server)
    if (!origin) {
      return callback(null, {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
      });
    }

    // Always allow SAME-ORIGIN requests (e.g. frontend loaded on same host:port)
    if (host && (origin === `http://${host}` || origin === `https://${host}`)) {
      return callback(null, {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
      });
    }

    // Always allow localhost and loopback IP origins on any port for local development/testing
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
      });
    }

    // Always allow production domain dkacademyjee.com, its subdomains (including www) & protocol variants
    if (/^https?:\/\/([a-zA-Z0-9-]+\.)*dkacademyjee\.com(:\d+)?$/.test(origin)) {
      return callback(null, {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
      });
    }

    // Check strict allowlist exact match
    if (allowedOrigins.includes(origin)) {
      return callback(null, {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
      });
    }

    // Vercel deployment preview domains with strict regex pattern
    if (/^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)) {
      return callback(null, {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
      });
    }

    // Reject unapproved origins in all environments (no arbitrary origin reflection with credentials)
    return callback(new Error(`CORS Security Violation: Origin ${origin} not authorized.`));
  })
);

// Razorpay Webhook endpoint mounted with raw body parser BEFORE global express.json()
app.post(
  ['/api/v1/payment/webhook', '/api/payment/webhook'],
  express.raw({ type: 'application/json' }),
  handleRazorpayWebhook
);

// Request body parsers with generous limits for rich media & base64 attachments
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

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
  // Serve static assets from frontend build with high-performance immutable caching
  app.use(
    express.static(resolvedFrontendDir, {
      maxAge: '1y',
      immutable: true,
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        } else if (/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2|woff|ttf|webp)$/i.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    })
  );

  // SPA fallback for all non-API / non-upload GET routes
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    // Never serve index.html for missing assets/chunks (prevents MIME type script error on old client caches)
    if (
      req.path.startsWith('/assets/') ||
      /\.(js|css|map|png|jpg|jpeg|gif|ico|svg|woff2|woff|ttf|webp)$/i.test(req.path)
    ) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.status(404).json({ error: 'Asset not found', path: req.path });
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
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
