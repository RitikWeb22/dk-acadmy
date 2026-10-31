import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import apiRoutes from './routes/apiRoutes.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import { sanitizeInputs, globalApiLimiter } from './middlewares/securityMiddleware.js';

dotenv.config();

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

// Explicit CORS Allowlists
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://dk-acadmy.vercel.app',
  'https://dkacademy.in',
  'https://www.dkacademy.in',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Local development origins
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }

      // Vercel deployment preview and production domains
      if (origin.endsWith('.vercel.app') || origin.includes('vercel.app')) {
        return callback(null, true);
      }

      // Configured production client URLs
      if (allowedOrigins.some((allowed) => allowed === origin || (allowed && allowed.includes(origin)))) {
        return callback(null, true);
      }

      // In production, reject unverified third-party origins
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error(`CORS Security Violation: Origin ${origin} not authorized.`));
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
  })
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
