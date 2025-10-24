import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { createHash, randomUUID } from 'crypto';
import { FileCategory } from '@prisma/client';
import { STORAGE_CONFIG } from '@/config/storage';

const CATEGORY_DIRECTORY_MAP: Record<FileCategory, () => string> = {
  VIDEO: () => STORAGE_CONFIG.videoDir,
  DOCUMENT: () => STORAGE_CONFIG.documentDir,
  IMAGE: () => STORAGE_CONFIG.imageDir,
  OTHER: () => STORAGE_CONFIG.uploadDir,
};

export async function ensureUploadDirectories() {
  const directories = [
    STORAGE_CONFIG.uploadDir,
    STORAGE_CONFIG.videoDir,
    STORAGE_CONFIG.imageDir,
    STORAGE_CONFIG.documentDir,
    STORAGE_CONFIG.tempDir,
  ];

  await Promise.all(
    directories.map(async (dir) => {
      try {
        await fsPromises.mkdir(dir, { recursive: true });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
          throw error;
        }
      }
    })
  );
}

export function getCategoryDirectory(category: FileCategory) {
  const resolver = CATEGORY_DIRECTORY_MAP[category];
  return resolver ? resolver() : STORAGE_CONFIG.uploadDir;
}

export function generateStorageFilename(originalFilename: string) {
  const extension = path.extname(originalFilename);
  const safeExtension = extension ? extension.toLowerCase() : '';
  const baseName = randomUUID();
  return `${baseName}${safeExtension}`;
}

export function buildFilePath(category: FileCategory, filename: string) {
  const directory = getCategoryDirectory(category);
  return path.join(directory, filename);
}

export function buildFileUrl(category: FileCategory, filename: string) {
  const segments: string[] = ['/uploads'];

  if (category === 'VIDEO') segments.push('videos');
  else if (category === 'IMAGE') segments.push('images');
  else if (category === 'DOCUMENT') segments.push('documents');

  segments.push(filename);
  return segments.join('/').replace(/\\/g, '/');
}

export function getRelativeKey(category: FileCategory, filename: string) {
  const parts: string[] = [];

  if (category === 'VIDEO') parts.push('videos');
  else if (category === 'IMAGE') parts.push('images');
  else if (category === 'DOCUMENT') parts.push('documents');

  parts.push(filename);
  return parts.join('/');
}

export async function computeFileChecksum(filePath: string, algorithm: 'md5' | 'sha256' = 'sha256') {
  return new Promise<string>((resolve, reject) => {
    const hash = createHash(algorithm);
    const stream = fs.createReadStream(filePath);

    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

export async function deleteFileQuietly(filePath: string) {
  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
}
