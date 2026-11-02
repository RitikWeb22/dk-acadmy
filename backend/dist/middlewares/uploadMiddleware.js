import multer from 'multer';
const memoryStorage = multer.memoryStorage();
export const uploadPdfMiddleware = multer({
    storage: memoryStorage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf' || (file.originalname && file.originalname.toLowerCase().endsWith('.pdf'))) {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF documents (.pdf) are allowed.'));
        }
    }
});
