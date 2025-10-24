import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { User } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/utils/asyncHandler';
import { auditLogger } from '@/utils/auditLogger';
import { sendPasswordResetEmail, sendVerificationEmail } from '@/utils/mailer';
import { presentUser } from '@/utils/user';
import {
  createTimedToken,
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenExpiresInMs,
  getRefreshTokenExpiryDate,
  hashToken,
  verifyRefreshToken,
} from '@/utils/token';
import { AppError } from '@/middleware/errorHandler';
import { ENV } from '@/config/env';
import { getRequestContext } from '@/utils/request';

const languageSchema = z.enum(['vi', 'en']);

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    language: languageSchema.optional(),
  })
  .strict();

const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
  })
  .strict();

const refreshSchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .strict();

const logoutSchema = refreshSchema;

const verifyEmailSchema = z
  .object({
    token: z.string().min(1),
  })
  .strict();

const requestResetSchema = z
  .object({
    email: z.string().email(),
    language: languageSchema.optional(),
  })
  .strict();

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8),
  })
  .strict();

interface SessionTokens {
  tokenType: 'Bearer';
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

async function createSessionTokens(
  user: User,
  req: Request,
  replacedTokenId?: string
): Promise<SessionTokens> {
  const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
  const tokenId = randomUUID();
  const refreshToken = generateRefreshToken({ userId: user.id, tokenId });
  const refreshTokenHash = hashToken(refreshToken);
  const refreshTokenExpiresAt = getRefreshTokenExpiryDate();
  const requestContext = getRequestContext(req);

  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: refreshTokenExpiresAt,
      ipAddress: requestContext.ipAddress ?? undefined,
      userAgent: requestContext.userAgent ?? undefined,
    },
  });

  if (replacedTokenId) {
    try {
      await prisma.refreshToken.update({
        where: { id: replacedTokenId },
        data: {
          revokedAt: new Date(),
          replacedByTokenId: tokenId,
        },
      });
    } catch (error) {
      await auditLogger.log({
        action: 'auth.refresh.rotation-failed',
        entity: 'refresh_token',
        metadata: { replacedTokenId, error: (error as Error).message },
        userId: user.id,
        ...requestContext,
      });
    }
  }

  return {
    tokenType: 'Bearer',
    accessToken,
    accessTokenExpiresIn: getAccessTokenExpiresInMs(),
    refreshToken,
    refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
  };
}

function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertActiveUser(user: User): void {
  if (!user.isActive) {
    throw new AppError(
      'Account has been deactivated. Please contact support.',
      StatusCodes.FORBIDDEN
    );
  }
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const payload = registerSchema.parse(req.body);
  const email = sanitizeEmail(payload.email);
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new AppError('Email address is already registered', StatusCodes.CONFLICT);
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const verificationToken = createTimedToken(ENV.tokens.emailVerificationHours);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: payload.firstName,
      lastName: payload.lastName,
      emailVerificationTokenHash: verificationToken.tokenHash,
      emailVerificationTokenExpiresAt: verificationToken.expiresAt,
    },
  });

  const tokens = await createSessionTokens(user, req);

  await sendVerificationEmail({
    to: user.email,
    firstName: user.firstName,
    token: verificationToken.token,
    language: payload.language,
  });

  await auditLogger.log({
    action: 'auth.register',
    entity: 'user',
    userId: user.id,
    metadata: { email: user.email },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Registration successful. Please verify your email address.',
    data: {
      user: presentUser(user),
      tokens,
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const payload = loginSchema.parse(req.body);
  const email = sanitizeEmail(payload.email);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError('Invalid email or password', StatusCodes.UNAUTHORIZED);
  }

  assertActiveUser(user);

  const isPasswordValid = await bcrypt.compare(payload.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', StatusCodes.UNAUTHORIZED);
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = await createSessionTokens(updatedUser, req);

  await auditLogger.log({
    action: 'auth.login',
    entity: 'user',
    userId: updatedUser.id,
    metadata: { email: updatedUser.email },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      user: presentUser(updatedUser),
      tokens,
    },
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const payload = refreshSchema.parse(req.body);
  const { refreshToken } = payload;

  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', StatusCodes.UNAUTHORIZED);
  }

  const hashedToken = hashToken(refreshToken);
  const existingToken = await prisma.refreshToken.findUnique({ where: { tokenHash: hashedToken } });

  if (!existingToken || existingToken.revokedAt) {
    throw new AppError('Refresh token has been revoked', StatusCodes.UNAUTHORIZED);
  }

  if (existingToken.expiresAt.getTime() <= Date.now()) {
    await prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { revokedAt: new Date() },
    });
    throw new AppError('Refresh token has expired', StatusCodes.UNAUTHORIZED);
  }

  if (existingToken.userId !== decoded.sub || existingToken.id !== decoded.jti) {
    await prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { revokedAt: new Date() },
    });
    throw new AppError('Refresh token does not match session', StatusCodes.UNAUTHORIZED);
  }

  const user = await prisma.user.findUnique({ where: { id: existingToken.userId } });

  if (!user) {
    throw new AppError('User does not exist', StatusCodes.UNAUTHORIZED);
  }

  assertActiveUser(user);

  const tokens = await createSessionTokens(user, req, existingToken.id);

  await auditLogger.log({
    action: 'auth.refresh',
    entity: 'refresh_token',
    userId: user.id,
    metadata: {
      previousTokenId: existingToken.id,
    },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      user: presentUser(user),
      tokens,
    },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const payload = logoutSchema.parse(req.body);
  const hashedToken = hashToken(payload.refreshToken);
  const existingToken = await prisma.refreshToken.findUnique({ where: { tokenHash: hashedToken } });

  if (existingToken && !existingToken.revokedAt) {
    await prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { revokedAt: new Date() },
    });

    await auditLogger.log({
      action: 'auth.logout',
      entity: 'refresh_token',
      userId: existingToken.userId,
      metadata: { tokenId: existingToken.id },
      ...getRequestContext(req),
    });
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Logged out successfully',
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const payload = verifyEmailSchema.parse(req.body);
  const hashedToken = hashToken(payload.token);

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationTokenHash: hashedToken,
      emailVerificationTokenExpiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new AppError('Verification token is invalid or has expired', StatusCodes.BAD_REQUEST);
  }

  if (user.isEmailVerified) {
    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Email address has already been verified',
    });
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiresAt: null,
    },
  });

  await auditLogger.log({
    action: 'auth.verify-email',
    entity: 'user',
    userId: updatedUser.id,
    metadata: { email: updatedUser.email },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Email verified successfully',
    data: {
      user: presentUser(updatedUser),
    },
  });
});

export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  const payload = requestResetSchema.parse(req.body);
  const email = sanitizeEmail(payload.email);
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const resetToken = createTimedToken(ENV.tokens.passwordResetHours);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: resetToken.tokenHash,
        passwordResetTokenExpiresAt: resetToken.expiresAt,
      },
    });

    await sendPasswordResetEmail({
      to: user.email,
      firstName: user.firstName,
      token: resetToken.token,
      language: payload.language,
    });

    await auditLogger.log({
      action: 'auth.request-password-reset',
      entity: 'user',
      userId: user.id,
      metadata: { email: user.email },
      ...getRequestContext(req),
    });
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'If an account with that email exists, a reset link has been sent.',
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const payload = resetPasswordSchema.parse(req.body);
  const hashedToken = hashToken(payload.token);

  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: hashedToken,
      passwordResetTokenExpiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new AppError('Password reset token is invalid or has expired', StatusCodes.BAD_REQUEST);
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetTokenExpiresAt: null,
    },
  });

  await auditLogger.log({
    action: 'auth.reset-password',
    entity: 'user',
    userId: updatedUser.id,
    metadata: { email: updatedUser.email },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Password has been reset successfully',
  });
});
