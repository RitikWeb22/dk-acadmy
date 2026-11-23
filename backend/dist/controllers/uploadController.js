import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { cloudinary } from '../config/cloudinary.js';
import { verifyMagicBytes } from '../utils/fileValidation.js';
/**
 * Upload single media asset (image, video, document)
 * Accepts either:
 *  1. Multipart form file via multer (req.file)
 *  2. JSON body with base64 data URI or remote URL (req.body.file)
 */
export const uploadMedia = async (req, res) => {
    try {
        const uploadedFile = req.file;
        const { file, folder, resource_type } = req.body || {};
        // -------------------------------------------------------------
        // CASE 1: Multipart File Upload (req.file)
        // -------------------------------------------------------------
        if (uploadedFile) {
            const ext = path.extname(uploadedFile.path).toLowerCase();
            // Magic bytes verification to detect extension spoofing
            if (!verifyMagicBytes(uploadedFile.path, ext)) {
                if (fs.existsSync(uploadedFile.path)) {
                    fs.unlinkSync(uploadedFile.path);
                }
                res.status(400).json({
                    success: false,
                    message: `Security Alert: File signature (magic bytes) does not match declared extension (${ext}). Upload rejected.`
                });
                return;
            }
            const mime = uploadedFile.mimetype || '';
            const isPdf = ext === '.pdf' || mime === 'application/pdf' || Boolean(uploadedFile.originalname?.toLowerCase().endsWith('.pdf'));
            const isVideo = mime.startsWith('video/') || /\.(mp4|mkv|mov|webm)$/i.test(uploadedFile.filename);
            const isImage = mime.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(uploadedFile.filename);
            const mediaType = isPdf ? 'raw' : isVideo ? 'video' : isImage ? 'image' : 'raw';
            // -------------------------------------------------------------
            // PDF DOCUMENTS: Store locally on server to avoid Cloudinary PDF policy blocks
            // Cloudinary accounts block direct delivery of raw/image PDF files by default (403 Forbidden).
            // Storing in public/uploads guarantees 100% reliable viewing & downloading in all browsers.
            // -------------------------------------------------------------
            if (isPdf) {
                const backendUploadsDir = path.join(process.cwd(), 'backend', 'public', 'uploads');
                const rootUploadsDir = path.join(process.cwd(), 'public', 'uploads');
                const frontendUploadsDir = path.join(process.cwd(), 'frontend', 'public', 'uploads');
                const frontendDistUploadsDir = path.join(process.cwd(), 'frontend', 'dist', 'uploads');
                if (!fs.existsSync(backendUploadsDir))
                    fs.mkdirSync(backendUploadsDir, { recursive: true });
                if (!fs.existsSync(rootUploadsDir))
                    fs.mkdirSync(rootUploadsDir, { recursive: true });
                if (!fs.existsSync(frontendUploadsDir))
                    fs.mkdirSync(frontendUploadsDir, { recursive: true });
                if (!fs.existsSync(frontendDistUploadsDir))
                    fs.mkdirSync(frontendDistUploadsDir, { recursive: true });
                const safeOriginalName = (uploadedFile.originalname || 'document.pdf').replace(/[^a-zA-Z0-9.-]/g, '_');
                const filename = `syllabus-${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${safeOriginalName}`;
                const destPath1 = path.join(backendUploadsDir, filename);
                const destPath2 = path.join(rootUploadsDir, filename);
                const destPath3 = path.join(frontendUploadsDir, filename);
                const destPath4 = path.join(frontendDistUploadsDir, filename);
                fs.copyFileSync(uploadedFile.path, destPath1);
                try {
                    fs.copyFileSync(uploadedFile.path, destPath2);
                }
                catch { }
                try {
                    fs.copyFileSync(uploadedFile.path, destPath3);
                }
                catch { }
                try {
                    fs.copyFileSync(uploadedFile.path, destPath4);
                }
                catch { }
                try {
                    if (fs.existsSync(uploadedFile.path)) {
                        fs.unlinkSync(uploadedFile.path);
                    }
                }
                catch { }
                const finalUrl = `/uploads/${filename}`;
                res.status(200).json({
                    success: true,
                    message: 'PDF Document uploaded and stored successfully in Media Vault',
                    url: finalUrl,
                    public_id: filename,
                    format: 'pdf',
                    resourceType: 'raw',
                    bytes: uploadedFile.size,
                    originalName: uploadedFile.originalname,
                    storage: 'local'
                });
                return;
            }
            const uploadOptions = {
                folder: folder || 'dk-academy',
                resource_type: resource_type || (isVideo ? 'video' : isImage ? 'image' : 'auto')
            };
            try {
                const result = await cloudinary.uploader.upload(uploadedFile.path, uploadOptions);
                // Ensure safe deliverable URL for PDF files
                let finalUrl = result.secure_url || result.url;
                if (isPdf && finalUrl && finalUrl.includes('/image/upload/') && !finalUrl.includes('fl_attachment')) {
                    finalUrl = finalUrl.replace('/image/upload/', '/image/upload/fl_attachment/');
                }
                // Clean up temporary local disk file after successful Cloudinary upload
                try {
                    if (fs.existsSync(uploadedFile.path)) {
                        fs.unlinkSync(uploadedFile.path);
                    }
                }
                catch (unlinkErr) {
                    console.warn('[Upload Cleanup Error]:', unlinkErr);
                }
                res.status(200).json({
                    success: true,
                    message: `${isPdf ? 'PDF Document' : isVideo ? 'Video' : 'Image'} uploaded successfully to Cloudinary Media Vault`,
                    url: finalUrl,
                    public_id: result.public_id,
                    format: result.format || (isPdf ? 'pdf' : undefined),
                    resourceType: result.resource_type || mediaType,
                    width: result.width,
                    height: result.height,
                    duration: result.duration,
                    bytes: result.bytes || uploadedFile.size,
                    originalName: uploadedFile.originalname,
                    storage: 'cloudinary'
                });
                return;
            }
            catch (cloudErr) {
                console.warn('[Cloudinary Notice]:', cloudErr.message, '- Falling back to local static storage.');
                // Use root-relative URL so it works seamlessly over HTTP/HTTPS, localhost, and custom domains without Mixed Content blocks
                const fileUrl = `/uploads/${uploadedFile.filename}`;
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
        const uploadOptions = {
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
        }
        catch (cloudErr) {
            console.warn('[Cloudinary Notice]:', cloudErr.message, '- Falling back to persistent local storage.');
            // Resilient Fallback: If base64 data URI provided, save to public uploads directory
            if (typeof file === 'string' && file.startsWith('data:')) {
                const matches = file.match(/^data:([A-Za-z0-9\-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    const mimeType = matches[1];
                    const base64Data = matches[2];
                    let ext = 'png';
                    if (mimeType.includes('jpeg') || mimeType.includes('jpg'))
                        ext = 'jpg';
                    else if (mimeType.includes('png'))
                        ext = 'png';
                    else if (mimeType.includes('webp'))
                        ext = 'webp';
                    else if (mimeType.includes('mp4'))
                        ext = 'mp4';
                    else if (mimeType.includes('webm'))
                        ext = 'webm';
                    else if (mimeType.includes('quicktime') || mimeType.includes('mov'))
                        ext = 'mov';
                    else if (mimeType.includes('pdf'))
                        ext = 'pdf';
                    else {
                        res.status(400).json({ success: false, message: 'Unsupported file type for upload' });
                        return;
                    }
                    const isVideo = ext === 'mp4' || ext === 'webm' || ext === 'mov';
                    const filename = `${crypto.randomUUID()}.${ext}`;
                    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
                    if (!fs.existsSync(uploadsDir)) {
                        fs.mkdirSync(uploadsDir, { recursive: true });
                    }
                    const filePath = path.join(uploadsDir, filename);
                    if (!path.resolve(filePath).startsWith(uploadsDir)) {
                        res.status(400).json({ success: false, message: 'Invalid target path' });
                        return;
                    }
                    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
                    if (!verifyMagicBytes(filePath, ext)) {
                        if (fs.existsSync(filePath))
                            fs.unlinkSync(filePath);
                        res.status(400).json({ success: false, message: 'Invalid file signature in payload' });
                        return;
                    }
                    // Use root-relative URL to prevent mixed content on HTTPS
                    const fileUrl = `/uploads/${filename}`;
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
    }
    catch (error) {
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            }
            catch (cleanupErr) {
                console.warn('[Upload Error Cleanup Failure]:', cleanupErr);
            }
        }
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
export const deleteMedia = async (req, res) => {
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
    }
    catch (error) {
        console.error('[Cloudinary Destroy Error]:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
