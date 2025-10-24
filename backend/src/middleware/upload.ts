import { Request } from 'express';
import multer from 'multer';
import * as path from 'path';
import { FileCategory } from '@prisma/client';
import { STORAGE_CONFIG } from '@/config/storage';
import { AppError } from '@/middleware/errorHandler';
import { validateFileExtension, validateMimeType } from '@/utils/fileValidation';

const LIMITS: Record<FileCategory, number> = {
  VIDEO: STORAGE_CONFIG.maxVideoSize,
  IMAGE: STORAGE_CONFIG.maxImageSize,
  DOCUMENT: STORAGE_CONFIG.maxDocumentSize,
  OTHER: STORAGE_CONFIG.maxFileSize,
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, STORAGE_CONFIG.tempDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.originalname.split('.').pop();
    const generated = `${timestamp}-${randomString}.${extension}`;
    cb(null, generated);
  },
});

function inferCategoryFromRequest(req: Request, file: Express.Multer.File): FileCategory | null {
  const explicit = (req.body.category || req.query.category) as string | undefined;

  if (explicit && isFileCategory(explicit)) {
    return explicit;
  }

  if (req.path.includes('/videos')) {
    return 'VIDEO';
  }

  if (req.path.includes('/images')) {
    return 'IMAGE';
  }

  if (req.path.includes('/documents')) {
    return 'DOCUMENT';
  }

  if (file.mimetype.startsWith('video/')) {
    return 'VIDEO';
  }

  if (file.mimetype.startsWith('image/')) {
    return 'IMAGE';
  }

  if (file.mimetype.startsWith('application/')) {
    return 'DOCUMENT';
  }

  return 'OTHER';
}

function isFileCategory(value: unknown): value is FileCategory {
  return value === 'VIDEO' || value === 'IMAGE' || value === 'DOCUMENT' || value === 'OTHER';
}

export function createUploadMiddleware(fieldName = 'file', multiple = false) {
  return (req: Request, res: any, next: any) => {
    const limits = {
      fileSize: Math.max(...Object.values(LIMITS)),
    };

    const upload = multiple
      ? multer({ storage, limits }).array(fieldName)
      : multer({ storage, limits }).single(fieldName);

    upload(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        let message = err.message;

        if (err.code === 'LIMIT_FILE_SIZE') {
          const max = limits.fileSize / (1024 * 1024);
          message = `File size exceeds the limit of ${max} MB`;
        }

        return next(new AppError(message));
      }

      if (err) {
        return next(err);
      }

      if (!multiple && !req.file) {
        return next(new AppError('No file provided'));
      }

      const files = multiple ? (req.files as Express.Multer.File[]) : [req.file];

      for (const file of files) {
        const inferredCategory = inferCategoryFromRequest(req, file);

        if (!validateFileExtension(file.originalname, inferredCategory).valid) {
          return next(new AppError('Invalid file extension'));
        }

        if (!validateMimeType(file.mimetype, inferredCategory).valid) {
          return next(new AppError('Invalid mime type'));
        }
      }

      return next();
    });
  };
}
