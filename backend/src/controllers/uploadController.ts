import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import ms from 'ms';
import { FileCategory, FileVisibility } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/middleware/errorHandler';
import {
  buildFilePath,
  buildFileUrl,
  computeFileChecksum,
  ensureUploadDirectories,
  generateStorageFilename,
  getRelativeKey,
} from '@/utils/fileStorage';
import { categorizeFile, validateFile } from '@/utils/fileValidation';
import { generateSignedToken } from '@/utils/signedUrl';

const visibilitySet = new Set<FileVisibility>(['PUBLIC', 'PRIVATE', 'PROTECTED']);

function normalizeVisibility(value: unknown): FileVisibility {
  if (typeof value === 'string') {
    const upper = value.toUpperCase() as FileVisibility;
    if (visibilitySet.has(upper)) {
      return upper;
    }
  }

  return 'PRIVATE';
}

function normalizeRelationId(value: unknown) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return undefined;
}

function resolveExpiryDate(expiresIn: unknown) {
  if (!expiresIn) {
    return null;
  }

  const msValue = ms(String(expiresIn));

  if (typeof msValue !== 'number' || Number.isNaN(msValue) || msValue <= 0) {
    return null;
  }

  return new Date(Date.now() + msValue);
}

export const initializeStorage = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    await ensureUploadDirectories();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Storage directories initialized successfully',
    });
  }
);

export const uploadFile = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  if (!req.file) {
    throw new AppError('No file provided', StatusCodes.BAD_REQUEST);
  }

  const { originalname, mimetype, size, path: tempPath } = req.file;
  const normalizedVisibility = normalizeVisibility(req.body.visibility);
  const normalizedExpiresAt = resolveExpiryDate(req.body.expiresIn);
  const normalizedCourseId = normalizeRelationId(req.body.courseId);
  const normalizedLessonId = normalizeRelationId(req.body.lessonId);
  const normalizedBlogPostId = normalizeRelationId(req.body.blogPostId);

  const category = categorizeFile(mimetype, originalname);
  const validation = validateFile(originalname, mimetype, size, category);
  const fs = await import('fs/promises');

  if (req.body.expiresIn && !normalizedExpiresAt) {
    await fs.unlink(tempPath).catch(() => {});
    throw new AppError('Invalid expiresIn value', StatusCodes.BAD_REQUEST);
  }

  if (!validation.valid) {
    await fs.unlink(tempPath).catch(() => {});
    throw new AppError(validation.error || 'File validation failed', StatusCodes.BAD_REQUEST);
  }

  const filename = generateStorageFilename(originalname);
  const filePath = buildFilePath(category, filename);
  const url = buildFileUrl(category, filename);
  const key = getRelativeKey(category, filename);

  await fs.rename(tempPath, filePath);

  const checksum = await computeFileChecksum(filePath);

  const file = await prisma.file.create({
    data: {
      filename,
      originalFilename: originalname,
      mimeType: mimetype,
      size,
      path: filePath,
      url,
      key,
      category,
      visibility: normalizedVisibility,
      checksum,
      expiresAt: normalizedExpiresAt,
      uploaderId: req.user?.id,
      courseId: normalizedCourseId,
      lessonId: normalizedLessonId,
      blogPostId: normalizedBlogPostId,
    },
  });

  const signedUrl = normalizedVisibility === 'PRIVATE' ? generateSignedToken(file.id) : null;

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      file: {
        id: file.id,
        filename: file.originalFilename,
        mimeType: file.mimeType,
        size: file.size,
        category: file.category,
        url: normalizedVisibility === 'PUBLIC' ? file.url : undefined,
        signedToken: signedUrl,
        createdAt: file.createdAt,
      },
    },
  });
});

export const uploadMultipleFiles = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new AppError('No files provided', StatusCodes.BAD_REQUEST);
    }

    const normalizedVisibility = normalizeVisibility(req.body.visibility);
    const normalizedCourseId = normalizeRelationId(req.body.courseId);
    const normalizedLessonId = normalizeRelationId(req.body.lessonId);
    const normalizedBlogPostId = normalizeRelationId(req.body.blogPostId);

    const uploadedFiles = [];
    const fs = await import('fs/promises');

    for (const file of files) {
      const { originalname, mimetype, size, path: tempPath } = file;
      const category = categorizeFile(mimetype, originalname);
      const validation = validateFile(originalname, mimetype, size, category);

      if (!validation.valid) {
        await fs.unlink(tempPath).catch(() => {});
        continue;
      }

      const filename = generateStorageFilename(originalname);
      const filePath = buildFilePath(category, filename);
      const url = buildFileUrl(category, filename);
      const key = getRelativeKey(category, filename);

      await fs.rename(tempPath, filePath);
      const checksum = await computeFileChecksum(filePath);

      const uploadedFile = await prisma.file.create({
        data: {
          filename,
          originalFilename: originalname,
          mimeType: mimetype,
          size,
          path: filePath,
          url,
          key,
          category,
          visibility: normalizedVisibility,
          checksum,
          uploaderId: req.user?.id,
          courseId: normalizedCourseId,
          lessonId: normalizedLessonId,
          blogPostId: normalizedBlogPostId,
        },
      });

      uploadedFiles.push({
        id: uploadedFile.id,
        filename: uploadedFile.originalFilename,
        mimeType: uploadedFile.mimeType,
        size: uploadedFile.size,
        category: uploadedFile.category,
        url: normalizedVisibility === 'PUBLIC' ? uploadedFile.url : undefined,
        signedToken: normalizedVisibility === 'PRIVATE' ? generateSignedToken(uploadedFile.id) : null,
        createdAt: uploadedFile.createdAt,
      });
    }

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      data: {
        files: uploadedFiles,
      },
    });
  }
);

export const getFileById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;

  const file = await prisma.file.findUnique({
    where: { id },
    include: {
      uploader: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!file) {
    throw new AppError('File not found', StatusCodes.NOT_FOUND);
  }

  const signedToken = file.visibility === 'PRIVATE' ? generateSignedToken(file.id) : null;

  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      file: {
        id: file.id,
        filename: file.originalFilename,
        mimeType: file.mimeType,
        size: file.size,
        category: file.category,
        visibility: file.visibility,
        url: file.visibility === 'PUBLIC' ? file.url : undefined,
        signedToken,
        uploader: file.uploader,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      },
    },
  });
});

export const deleteFile = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;

  const file = await prisma.file.findUnique({ where: { id } });

  if (!file) {
    throw new AppError('File not found', StatusCodes.NOT_FOUND);
  }

  if (file.uploaderId !== req.user?.id && req.user?.role !== 'ADMIN') {
    throw new AppError('You do not have permission to delete this file', StatusCodes.FORBIDDEN);
  }

  const fs = await import('fs/promises');
  await fs.unlink(file.path).catch(() => {});
  await prisma.file.delete({ where: { id } });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'File deleted successfully',
  });
});

export const listFiles = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { category, visibility, page = '1', limit = '10' } = req.query;

  const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
  const take = parseInt(limit as string, 10);

  const where: Record<string, any> = {};

  if (category && typeof category === 'string') {
    where.category = category as FileCategory;
  }

  if (visibility && typeof visibility === 'string') {
    where.visibility = visibility as FileVisibility;
  }

  if (req.user?.role !== 'ADMIN') {
    where.OR = [{ visibility: 'PUBLIC' as FileVisibility }, { uploaderId: req.user?.id }];
  }

  const [files, total] = await Promise.all([
    prisma.file.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        originalFilename: true,
        mimeType: true,
        size: true,
        category: true,
        visibility: true,
        url: true,
        createdAt: true,
      },
    }),
    prisma.file.count({ where }),
  ]);

  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      files: files.map((file) => ({
        ...file,
        filename: file.originalFilename,
        url: file.visibility === 'PUBLIC' ? file.url : undefined,
        signedToken: file.visibility === 'PRIVATE' ? generateSignedToken(file.id) : null,
      })),
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total,
        pages: Math.ceil(total / take),
      },
    },
  });
});
