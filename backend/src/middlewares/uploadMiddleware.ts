import multer from 'multer';

const memoryStorage = multer.memoryStorage();

export const uploadPdfMiddleware = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    const name = (file.originalname || '').toLowerCase();
    const isPdf = file.mimetype === 'application/pdf' || name.endsWith('.pdf');
    const isDocx = name.endsWith('.docx') || name.endsWith('.doc') || file.mimetype.includes('word') || file.mimetype.includes('officedocument');
    const isText = name.endsWith('.txt') || name.endsWith('.csv') || name.endsWith('.tsv') || file.mimetype.startsWith('text/');

    if (isPdf || isDocx || isText) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF (.pdf), Word (.docx, .doc), or text documents are allowed.'));
    }
  }
});
