import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/utils/asyncHandler';
import { auditLogger } from '@/utils/auditLogger';
import { getRequestContext } from '@/utils/request';
import { presentUser } from '@/utils/user';
import { AppError } from '@/middleware/errorHandler';

const updateProfileSchema = z
  .object({
    firstName: z.string().max(100).optional().nullable(),
    lastName: z.string().max(100).optional().nullable(),
    avatarUrl: z.string().url().optional().nullable(),
  })
  .strict()
  .refine((data) => Object.keys(data).some((key) => data[key as keyof typeof data] !== undefined), {
    message: 'At least one field must be provided',
  });

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', StatusCodes.UNAUTHORIZED);
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  if (!user) {
    throw new AppError('User not found', StatusCodes.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      user: presentUser(user),
    },
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', StatusCodes.UNAUTHORIZED);
  }

  const payload = updateProfileSchema.parse(req.body);

  const data: {
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
  } = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'firstName')) {
    data.firstName = payload.firstName ?? null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'lastName')) {
    data.lastName = payload.lastName ?? null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'avatarUrl')) {
    data.avatarUrl = payload.avatarUrl ?? null;
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data,
  });

  await auditLogger.log({
    action: 'profile.update',
    entity: 'user',
    userId: updatedUser.id,
    metadata: data,
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      user: presentUser(updatedUser),
    },
  });
});
