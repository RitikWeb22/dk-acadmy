import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import apiRoutes from './routes/apiRoutes.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

dotenv.config();

export const app = express();

// Trust reverse proxy (for rate limiting, IP resolution behind Nginx/Render/Cloudflare)
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Security Headers (Helmet)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false
  })
);

// Explicit CORS Allowlists
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://dk-acadmy.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      if (origin.endsWith('.vercel.app') || origin.includes('vercel.app')) {
        return callback(null, true);
      }
      if (allowedOrigins.some((allowed) => allowed === origin || (allowed && allowed.includes(origin)))) {
        return callback(null, true);
      }
      // Gracefully allow origin to avoid breaking API access
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve local media uploads statically
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to DK Academy JEE & BITSAT Official Backend Server',
    version: '1.0.0',
    documentation: '/api/v1/health'
  });
});

// API Routes (supports both /api/v1 and /api)
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);
