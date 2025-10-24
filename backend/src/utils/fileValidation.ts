import path from 'path';
import { FileCategory } from '@prisma/client';
import { ALLOWED_MIME_TYPES, FILE_EXTENSIONS, STORAGE_CONFIG } from '@/config/storage';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function categorizeFile(mimeType: string, filename?: string): FileCategory {
  if (ALLOWED_MIME_TYPES.video.includes(mimeType)) {
    return 'VIDEO';
  }

  if (ALLOWED_MIME_TYPES.image.includes(mimeType)) {
    return 'IMAGE';
  }

  if (ALLOWED_MIME_TYPES.document.includes(mimeType)) {
    return 'DOCUMENT';
  }

  if (filename) {
    const ext = path.extname(filename).toLowerCase();

    if (FILE_EXTENSIONS.video.includes(ext)) {
      return 'VIDEO';
    }

    if (FILE_EXTENSIONS.image.includes(ext)) {
      return 'IMAGE';
    }

    if (FILE_EXTENSIONS.document.includes(ext)) {
      return 'DOCUMENT';
    }
  }

  return 'OTHER';
}

export function validateFileSize(size: number, category: FileCategory): FileValidationResult {
  const limits: Record<FileCategory, number> = {
    VIDEO: STORAGE_CONFIG.maxVideoSize,
    IMAGE: STORAGE_CONFIG.maxImageSize,
    DOCUMENT: STORAGE_CONFIG.maxDocumentSize,
    OTHER: STORAGE_CONFIG.maxFileSize,
  };

  const maxSize = limits[category];

  if (size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size exceeds the maximum allowed size of ${maxMB}MB for ${category.toLowerCase()} files`,
    };
  }

  return { valid: true };
}

export function validateMimeType(mimeType: string, category: FileCategory): FileValidationResult {
  const allowedTypes: Record<FileCategory, string[]> = {
    VIDEO: ALLOWED_MIME_TYPES.video,
    IMAGE: ALLOWED_MIME_TYPES.image,
    DOCUMENT: ALLOWED_MIME_TYPES.document,
    OTHER: [],
  };

  const allowed = allowedTypes[category];

  if (allowed.length > 0 && !allowed.includes(mimeType)) {
    return {
      valid: false,
      error: `MIME type ${mimeType} is not allowed for ${category.toLowerCase()} files. Allowed types: ${allowed.join(', ')}`,
    };
  }

  return { valid: true };
}

export function validateFileExtension(filename: string, category: FileCategory): FileValidationResult {
  const extension = path.extname(filename).toLowerCase();

  if (!extension) {
    return { valid: false, error: 'File must have an extension' };
  }

  const allowedExtensions: Record<FileCategory, string[]> = {
    VIDEO: FILE_EXTENSIONS.video,
    IMAGE: FILE_EXTENSIONS.image,
    DOCUMENT: FILE_EXTENSIONS.document,
    OTHER: [],
  };

  const allowed = allowedExtensions[category];

  if (allowed.length > 0 && !allowed.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} is not allowed for ${category.toLowerCase()} files. Allowed extensions: ${allowed.join(', ')}`,
    };
  }

  return { valid: true };
}

export function validateFile(
  filename: string,
  mimeType: string,
  size: number,
  category: FileCategory
): FileValidationResult {
  let result = validateFileExtension(filename, category);
  if (!result.valid) return result;

  result = validateMimeType(mimeType, category);
  if (!result.valid) return result;

  result = validateFileSize(size, category);
  if (!result.valid) return result;

  return { valid: true };
}
