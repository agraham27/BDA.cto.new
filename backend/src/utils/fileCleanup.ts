import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { STORAGE_CONFIG } from '@/config/storage';
import { prisma } from '@/lib/prisma';
import { deleteFileQuietly } from './fileStorage';
import { logger } from './logger';

export async function cleanupOrphanedFiles() {
  const files = await prisma.file.findMany({
    where: {
      uploaderId: null,
      courseId: null,
      lessonId: null,
      blogPostId: null,
      createdAt: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  let deletedCount = 0;

  for (const file of files) {
    try {
      await deleteFileQuietly(file.path);
      await prisma.file.delete({ where: { id: file.id } });
      deletedCount++;
    } catch (error) {
      logger.error('Failed to delete orphaned file', { fileId: file.id, error });
    }
  }

  logger.info('Orphaned files cleanup completed', { deletedCount });
  return deletedCount;
}

export async function cleanupExpiredFiles() {
  const now = new Date();
  const files = await prisma.file.findMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  });

  let deletedCount = 0;

  for (const file of files) {
    try {
      await deleteFileQuietly(file.path);
      await prisma.file.delete({ where: { id: file.id } });
      deletedCount++;
    } catch (error) {
      logger.error('Failed to delete expired file', { fileId: file.id, error });
    }
  }

  logger.info('Expired files cleanup completed', { deletedCount });
  return deletedCount;
}

export async function cleanupTempFiles(tempDir: string, maxAgeMs = 24 * 60 * 60 * 1000) {
  try {
    const files = await fsPromises.readdir(tempDir);
    const now = Date.now();
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fsPromises.stat(filePath);

      if (now - stats.mtimeMs > maxAgeMs) {
        await deleteFileQuietly(filePath);
        deletedCount++;
      }
    }

    logger.info('Temp files cleanup completed', { deletedCount });
    return deletedCount;
  } catch (error) {
    logger.error('Failed to cleanup temp files', { error });
    return 0;
  }
}

export async function runScheduledCleanup() {
  try {
    logger.info('Starting scheduled file cleanup');
    const [orphaned, expired, temp] = await Promise.all([
      cleanupOrphanedFiles(),
      cleanupExpiredFiles(),
      cleanupTempFiles(STORAGE_CONFIG.tempDir),
    ]);

    logger.info('Scheduled cleanup completed', { orphaned, expired, temp });
    return { orphaned, expired, temp };
  } catch (error) {
    logger.error('Scheduled cleanup failed', { error });
    throw error;
  }
}
