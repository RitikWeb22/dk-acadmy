import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { uploadMedia, deleteMedia } from '../controllers/uploadController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// Rate limiter for file uploads to protect storage infrastructure
const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many upload requests, please try again later.' }
});

// Setup disk storage for direct multipart file uploads (image and video)
const uploadDir = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Strictly safe extensions whitelist (.svg and .doc removed for XSS/macro exploit defense)
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
  '.mp4', '.mov', '.webm', '.mkv',
  '.pdf', '.docx'
]);

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, uploadDir);
  },
  filename: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Fully randomized UUID filename (no client-supplied name preserved on disk or URL)
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    // 1. Whitelist extension check
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(
        new Error(
          `Security Alert: Unsupported or unsafe file type (${ext}). Only standard images, videos, docx, and PDFs are permitted.`
        )
      );
    }

    // 2. Whitelist MIME check
    if (!ALLOWED_MIME_TYPES.has(mime)) {
      return cb(new Error(`Security Alert: Invalid MIME type (${mime}) for uploaded content.`));
    }

    cb(null, true);
  }
});

// Support both multipart file upload (`file` field) and JSON base64 payload
router.post('/', uploadRateLimiter, upload.single('file'), uploadMedia);

// Delete media asset (Admin & Staff protected)
router.post('/delete', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), deleteMedia);

export default router;
