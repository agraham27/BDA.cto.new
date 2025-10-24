import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { FileVisibility } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/middleware/errorHandler';
import { verifySignedToken } from '@/utils/signedUrl';
import { STORAGE_CONFIG } from '@/config/storage';
import { logger } from '@/utils/logger';

function assertFileAccess(
  file: {
    id: string;
    visibility: FileVisibility;
    uploaderId: string | null;
  },
  req: Request,
  token?: string | string[]
) {
  const isAdmin = req.user?.role === 'ADMIN';
  const isUploader = req.user?.id && file.uploaderId && req.user.id === file.uploaderId;

  if (file.visibility === 'PUBLIC') {
    return;
  }

  if (file.visibility === 'PROTECTED') {
    if (!req.user) {
      throw new AppError('Authentication required for protected files', StatusCodes.UNAUTHORIZED);
    }

    return;
  }

  const tokenValue = Array.isArray(token) ? token[0] : token;

  if (!tokenValue && !isAdmin && !isUploader) {
    throw new AppError('Access token required for private files', StatusCodes.UNAUTHORIZED);
  }

  if (tokenValue) {
    const payload = verifySignedToken(tokenValue);

    if (payload.fileId !== file.id) {
      throw new AppError('Invalid access token', StatusCodes.FORBIDDEN);
    }
  }
}

async function ensureFileOnDisk(filePath: string) {
  try {
    await fsPromises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function recordFileAccess(fileId: string) {
  await prisma.file.update({
    where: { id: fileId },
    data: {
      accessCount: { increment: 1 },
      lastAccessedAt: new Date(),
    },
  });
}

export const streamFile = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  const { token } = req.query;

  const file = await prisma.file.findUnique({ where: { id } });

  if (!file) {
    throw new AppError('File not found', StatusCodes.NOT_FOUND);
  }

  if (file.category !== 'VIDEO') {
    throw new AppError('Only video files can be streamed', StatusCodes.BAD_REQUEST);
  }

  assertFileAccess(file, req, token);

  const fileExists = await ensureFileOnDisk(file.path);

  if (!fileExists) {
    throw new AppError('File not found on disk', StatusCodes.NOT_FOUND);
  }

  void recordFileAccess(id).catch((error) => {
    logger.error('Failed to record file access', { fileId: id, error });
  });

  const stat = await fsPromises.stat(file.path);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = Number(parts[0]);
    const requestedEnd = parts[1] ? Number(parts[1]) : start + STORAGE_CONFIG.chunkSize - 1;
    const sanitizedEnd = Number.isNaN(requestedEnd) ? fileSize - 1 : requestedEnd;
    const end = Math.min(sanitizedEnd, fileSize - 1);

    if (Number.isNaN(start) || start < 0 || start >= fileSize || end < start) {
      res.status(StatusCodes.REQUESTED_RANGE_NOT_SATISFIABLE);
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      return res.end();
    }

    const chunkSize = end - start + 1;
    const fileStream = fs.createReadStream(file.path, { start, end });

    res.status(StatusCodes.PARTIAL_CONTENT);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', chunkSize);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.originalFilename}"`);

    fileStream.pipe(res);
  } else {
    res.status(StatusCodes.OK);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.originalFilename}"`);
    res.setHeader('Accept-Ranges', 'bytes');

    const fileStream = fs.createReadStream(file.path);
    fileStream.pipe(res);
  }
});

export const downloadFile = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const { token } = req.query;

    const file = await prisma.file.findUnique({ where: { id } });

    if (!file) {
      throw new AppError('File not found', StatusCodes.NOT_FOUND);
    }

    assertFileAccess(file, req, token);

    const fileExists = await ensureFileOnDisk(file.path);

    if (!fileExists) {
      throw new AppError('File not found on disk', StatusCodes.NOT_FOUND);
    }

    void recordFileAccess(id).catch((error) => {
      logger.error('Failed to record file access', { fileId: id, error });
    });

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalFilename}"`);
    res.setHeader('Content-Length', file.size);

    const fileStream = fs.createReadStream(file.path);
    fileStream.pipe(res);
  }
);

export const convertToHLS = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;

  const file = await prisma.file.findUnique({ where: { id } });

  if (!file) {
    throw new AppError('File not found', StatusCodes.NOT_FOUND);
  }

  if (file.category !== 'VIDEO') {
    throw new AppError('Only video files can be converted to HLS', StatusCodes.BAD_REQUEST);
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'HLS conversion initiated (not yet implemented)',
    data: {
      fileId: file.id,
      status: 'pending',
      note: 'This is a placeholder for HLS conversion. Integration with ffmpeg or similar tool is needed.',
    },
  });
});

export const getHLSManifest = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;

    const file = await prisma.file.findUnique({ where: { id } });

    if (!file) {
      throw new AppError('File not found', StatusCodes.NOT_FOUND);
    }

    if (file.category !== 'VIDEO') {
      throw new AppError('Only video files support HLS streaming', StatusCodes.BAD_REQUEST);
    }

    res.status(StatusCodes.NOT_IMPLEMENTED).json({
      success: false,
      message: 'HLS streaming not yet implemented',
      data: {
        note: 'This endpoint will serve the HLS manifest file once conversion is implemented.',
      },
    });
  }
);

export const getVideoMetadata = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;

    const file = await prisma.file.findUnique({ where: { id } });

    if (!file) {
      throw new AppError('File not found', StatusCodes.NOT_FOUND);
    }

    if (file.category !== 'VIDEO') {
      throw new AppError('Only video files have metadata', StatusCodes.BAD_REQUEST);
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        fileId: file.id,
        filename: file.originalFilename,
        mimeType: file.mimeType,
        size: file.size,
        duration: file.duration,
        width: file.width,
        height: file.height,
        metadata: file.metadata,
        isProcessed: file.isProcessed,
        processedAt: file.processedAt,
      },
    });
  }
);
