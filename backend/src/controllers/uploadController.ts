import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { cloudinary } from '../config/cloudinary.js';

/**
 * Upload single media asset (image, video, document)
 * Accepts either:
 *  1. Multipart form file via multer (req.file)
 *  2. JSON body with base64 data URI or remote URL (req.body.file)
 */
export const uploadMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const uploadedFile = req.file;
    const { file, folder, resource_type } = req.body || {};

    // -------------------------------------------------------------
    // CASE 1: Multipart File Upload (req.file)
    // -------------------------------------------------------------
    if (uploadedFile) {
      const mime = uploadedFile.mimetype || '';
      const isVideo = mime.startsWith('video/') || /\.(mp4|mkv|mov|webm|avi|m4v)$/i.test(uploadedFile.originalname);
      const isImage = mime.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(uploadedFile.originalname);
      const mediaType = isVideo ? 'video' : isImage ? 'image' : 'raw';

      const uploadOptions: any = {
        folder: folder || 'dk-academy',
        resource_type: resource_type || (isVideo ? 'video' : isImage ? 'image' : 'auto')
      };

      try {
        const result = await cloudinary.uploader.upload(uploadedFile.path, uploadOptions);

        res.status(200).json({
          success: true,
          message: `${isVideo ? 'Video' : 'Image'} uploaded successfully to Cloudinary Media Vault`,
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          resourceType: result.resource_type || mediaType,
          width: result.width,
          height: result.height,
          duration: result.duration,
          bytes: result.bytes || uploadedFile.size,
          originalName: uploadedFile.originalname,
          storage: 'cloudinary'
        });
        return;
      } catch (cloudErr: any) {
        console.warn('[Cloudinary Notice]:', cloudErr.message, '- Falling back to local static storage.');

        const host = req.get('host') || 'localhost:5000';
        const protocol = req.protocol || 'http';
        const fileUrl = `${protocol}://${host}/uploads/${uploadedFile.filename}`;

        res.status(200).json({
          success: true,
          message: `${isVideo ? 'Video' : 'Image'} uploaded successfully (Local Media Vault Storage)`,
          url: fileUrl,
          public_id: uploadedFile.filename,
          format: path.extname(uploadedFile.originalname).replace('.', ''),
          resourceType: mediaType,
          bytes: uploadedFile.size,
          originalName: uploadedFile.originalname,
          storage: 'local'
        });
        return;
      }
    }

    // -------------------------------------------------------------
    // CASE 2: Base64 / Remote URL (req.body.file)
    // -------------------------------------------------------------
    if (!file) {
      res.status(400).json({
        success: false,
        message: 'Please provide a file to upload (via form-data file or base64 file string).'
      });
      return;
    }

    const uploadOptions: any = {
      folder: folder || 'dk-academy',
      resource_type: resource_type || 'auto'
    };

    try {
      const result = await cloudinary.uploader.upload(file, uploadOptions);

      res.status(200).json({
        success: true,
        message: 'File uploaded successfully to Cloudinary',
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        resourceType: result.resource_type,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        created_at: result.created_at,
        storage: 'cloudinary'
      });
      return;
    } catch (cloudErr: any) {
      console.warn('[Cloudinary Notice]:', cloudErr.message, '- Falling back to persistent local storage.');

      // Resilient Fallback: If base64 data URI provided, save to public uploads directory
      if (typeof file === 'string' && file.startsWith('data:')) {
        const matches = file.match(/^data:([A-Za-z0-9\-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          
          let ext = 'png';
          if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
          else if (mimeType.includes('png')) ext = 'png';
          else if (mimeType.includes('webp')) ext = 'webp';
          else if (mimeType.includes('svg')) ext = 'svg';
          else if (mimeType.includes('mp4')) ext = 'mp4';
          else if (mimeType.includes('webm')) ext = 'webm';
          else if (mimeType.includes('quicktime') || mimeType.includes('mov')) ext = 'mov';
          else if (mimeType.includes('pdf')) ext = 'pdf';

          const isVideo = ext === 'mp4' || ext === 'webm' || ext === 'mov';
          const filename = `dk_asset_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          const filePath = path.join(uploadsDir, filename);
          fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

          const host = req.get('host') || 'localhost:5000';
          const protocol = req.protocol || 'http';
          const fileUrl = `${protocol}://${host}/uploads/${filename}`;

          res.status(200).json({
            success: true,
            message: 'File saved successfully to Local Media Vault',
            url: fileUrl,
            public_id: filename,
            format: ext,
            resourceType: isVideo ? 'video' : 'image',
            storage: 'local'
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: cloudErr.message || 'Failed to upload asset to Cloudinary or Local Vault'
      });
    }
  } catch (error: any) {
    console.error('[Upload Controller Error]:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process asset upload'
    });
  }
};

/**
 * Delete media asset from Cloudinary by publicId or local storage
 */
export const deleteMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { publicId, storage } = req.body;

    if (!publicId || typeof publicId !== 'string') {
      res.status(400).json({ success: false, message: 'Please provide publicId of the asset' });
      return;
    }

    // Reject path traversal patterns immediately
    if (publicId.includes('..') || path.isAbsolute(publicId)) {
      res.status(400).json({ success: false, message: 'Invalid file path or public ID format' });
      return;
    }

    if (storage === 'local' || publicId.startsWith('dk_')) {
      const sanitizedFileName = path.basename(publicId);
      const baseUploadDir = path.resolve(process.cwd(), 'public', 'uploads');
      const localPath = path.join(baseUploadDir, sanitizedFileName);

      if (path.resolve(localPath).startsWith(baseUploadDir) && fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
      res.status(200).json({
        success: true,
        message: 'Asset removed from Local Media Vault'
      });
      return;
    }

    const result = await cloudinary.uploader.destroy(publicId);

    res.status(200).json({
      success: true,
      message: 'Asset removed from Cloudinary',
      result
    });
  } catch (error: any) {
    console.error('[Cloudinary Destroy Error]:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
