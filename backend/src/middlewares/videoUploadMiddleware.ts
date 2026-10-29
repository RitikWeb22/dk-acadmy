import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const rawStorageDir = path.join(process.cwd(), 'storage', 'private', 'raw-videos');
const chunkStorageDir = path.join(process.cwd(), 'storage', 'private', 'chunks');

if (!fs.existsSync(rawStorageDir)) {
  fs.mkdirSync(rawStorageDir, { recursive: true });
}
if (!fs.existsSync(chunkStorageDir)) {
  fs.mkdirSync(chunkStorageDir, { recursive: true });
}

// Storage engine saving directly to private storage (never exposed publicly)
const videoDiskStorage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, rawStorageDir);
  },
  filename: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `raw_${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

// File filter: accept only video containers
const videoFilter = (_req: any, file: any, cb: any) => {
  const allowedExts = ['.mp4', '.mkv', '.mov', '.webm', '.avi', '.m4v'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExts.includes(ext) || file.mimetype?.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid video format. Supported formats: MP4, MKV, MOV, WEBM.'));
  }
};

export const uploadRawVideo = multer({
  storage: videoDiskStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 // 2GB max upload limit
  },
  fileFilter: videoFilter
});

// Chunks storage for resumable uploads
const chunkDiskStorage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, chunkStorageDir);
  },
  filename: (_req: any, _file: any, cb: any) => {
    cb(null, `part_${Date.now()}_${uuidv4()}`);
  }
});

export const uploadVideoChunk = multer({
  storage: chunkDiskStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB per chunk
  }
});
