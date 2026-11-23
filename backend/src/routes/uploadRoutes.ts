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
const candidateUploadDirs = [
  path.resolve(process.cwd(), 'backend', 'public', 'uploads'),
  path.resolve(process.cwd(), 'public', 'uploads')
];
for (const dir of candidateUploadDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
const uploadDir = fs.existsSync(candidateUploadDirs[0]) ? candidateUploadDirs[0] : candidateUploadDirs[1];

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

// Support both multipart file upload (`file` field) and JSON base64 payload (Authenticated user protected)
router.post('/', protect, uploadRateLimiter, upload.single('file'), uploadMedia);

// Delete media asset (Admin & Staff protected)
router.post('/delete', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), deleteMedia);

// Public view / download route for uploaded files (serves PDFs inline with zero 403 blocks)
router.get('/file/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const possiblePaths = [
    path.join(process.cwd(), 'backend', 'public', 'uploads', filename),
    path.join(process.cwd(), 'public', 'uploads', filename),
    path.join(process.cwd(), 'frontend', 'public', 'uploads', filename),
    path.join(process.cwd(), 'frontend', 'dist', 'uploads', filename)
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      if (filename.toLowerCase().endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="' + filename + '"');
      }
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.sendFile(p);
    }
  }
  return res.status(404).json({ error: 'File not found' });
});

// Safe PDF proxy / relay (prevents Cloudinary 403 Forbidden or CORS blocks)
router.get('/view-pdf', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
    return res.status(400).send('Invalid or missing PDF URL parameter');
  }
  try {
    const fetchRes = await fetch(targetUrl);
    if (!fetchRes.ok) {
      return res.status(fetchRes.status).send(`Failed to fetch external PDF (HTTP ${fetchRes.status})`);
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const buffer = await fetchRes.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err: any) {
    return res.status(500).send('PDF Relay error: ' + err.message);
  }
});

export default router;
