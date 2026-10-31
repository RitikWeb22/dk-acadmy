import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed extensions and MIME types whitelist
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg',
  '.mp4', '.mov', '.webm', '.mkv',
  '.pdf', '.doc', '.docx'
]);

const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument'];

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, uploadDir);
  },
  filename: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Sanitize filename to prevent directory traversal and special character injection
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    cb(null, `dk_${Date.now()}_${cleanBase}${ext}`);
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
      return cb(new Error(`Security Alert: Unsupported or unsafe file type (${ext}). Only standard images, videos, and PDFs are permitted.`));
    }

    // 2. Whitelist MIME check
    const isAllowedMime = ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix));
    if (!isAllowedMime) {
      return cb(new Error(`Security Alert: Invalid MIME type (${mime}) for uploaded content.`));
    }

    cb(null, true);
  }
});

// Support both multipart file upload (`file` field) and JSON base64/URL payload
router.post('/', uploadRateLimiter, upload.single('file'), uploadMedia);

// Delete media asset (Admin & Staff protected)
router.post('/delete', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), deleteMedia);

export default router;
