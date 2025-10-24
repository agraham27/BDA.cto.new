import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/utils/asyncHandler';
import { verifyAccessToken } from '@/utils/token';
import { AppError } from './errorHandler';

export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', StatusCodes.UNAUTHORIZED);
    }

    const token = authHeader.replace('Bearer', '').trim();

    let payload;

    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      throw new AppError('Invalid or expired access token', StatusCodes.UNAUTHORIZED);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || !user.isActive) {
      throw new AppError('Account is inactive or no longer exists', StatusCodes.UNAUTHORIZED);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };

    next();
  }
);

export function authorizeRoles(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', StatusCodes.UNAUTHORIZED));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', StatusCodes.FORBIDDEN)
      );
    }

    return next();
  };
}
