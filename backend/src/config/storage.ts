import { z } from 'zod';
import path from 'path';

const storageSchema = z.object({
  UPLOAD_DIR: z.string().default('/var/www/uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(500 * 1024 * 1024),
  MAX_VIDEO_SIZE: z.coerce.number().default(2 * 1024 * 1024 * 1024),
  MAX_IMAGE_SIZE: z.coerce.number().default(10 * 1024 * 1024),
  MAX_DOCUMENT_SIZE: z.coerce.number().default(50 * 1024 * 1024),
  SIGNED_URL_SECRET: z.string().optional(),
  SIGNED_URL_EXPIRY: z.coerce.number().default(3600),
  CHUNK_SIZE: z.coerce.number().default(1024 * 1024),
});

const parsed = storageSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn('⚠️ Using default storage configuration:', parsed.error.flatten().fieldErrors);
}

const config = parsed.success ? parsed.data : storageSchema.parse({});

export const STORAGE_CONFIG = {
  uploadDir: config.UPLOAD_DIR,
  videoDir: path.join(config.UPLOAD_DIR, 'videos'),
  imageDir: path.join(config.UPLOAD_DIR, 'images'),
  documentDir: path.join(config.UPLOAD_DIR, 'documents'),
  tempDir: path.join(config.UPLOAD_DIR, 'temp'),
  maxFileSize: config.MAX_FILE_SIZE,
  maxVideoSize: config.MAX_VIDEO_SIZE,
  maxImageSize: config.MAX_IMAGE_SIZE,
  maxDocumentSize: config.MAX_DOCUMENT_SIZE,
  signedUrlSecret: config.SIGNED_URL_SECRET ?? 'default-signed-url-secret',
  signedUrlExpiry: config.SIGNED_URL_EXPIRY,
  chunkSize: config.CHUNK_SIZE,
};

export const ALLOWED_MIME_TYPES = {
  video: [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/webm',
  ],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ],
};

export const FILE_EXTENSIONS = {
  video: ['.mp4', '.mpeg', '.mov', '.avi', '.wmv', '.webm'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv'],
};
