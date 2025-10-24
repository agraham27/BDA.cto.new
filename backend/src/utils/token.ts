import { createHash, randomBytes } from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import ms from 'ms';
import { UserRole } from '@prisma/client';
import { ENV } from '@/config/env';

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  tokenType: 'access';
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  tokenType: 'refresh';
  jti: string;
}

function ensureDuration(value: string): number {
  const duration = ms(value);

  if (typeof duration !== 'number') {
    throw new Error(`Invalid duration string: ${value}`);
  }

  return duration;
}

export function generateAccessToken(user: { id: string; email: string; role: UserRole }): string {
  if (!ENV.jwt.accessSecret) {
    throw new Error('JWT access secret is not configured');
  }

  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tokenType: 'access',
  };

  return jwt.sign(payload, ENV.jwt.accessSecret, {
    expiresIn: ENV.jwt.accessExpiresIn,
  });
}

export function generateRefreshToken({
  userId,
  tokenId,
}: {
  userId: string;
  tokenId: string;
}): string {
  if (!ENV.jwt.refreshSecret) {
    throw new Error('JWT refresh secret is not configured');
  }

  const payload: RefreshTokenPayload = {
    sub: userId,
    tokenType: 'refresh',
    jti: tokenId,
  };

  return jwt.sign(payload, ENV.jwt.refreshSecret, {
    expiresIn: ENV.jwt.refreshExpiresIn,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  if (!ENV.jwt.accessSecret) {
    throw new Error('JWT access secret is not configured');
  }

  return jwt.verify(token, ENV.jwt.accessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  if (!ENV.jwt.refreshSecret) {
    throw new Error('JWT refresh secret is not configured');
  }

  return jwt.verify(token, ENV.jwt.refreshSecret) as RefreshTokenPayload;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getRefreshTokenExpiryDate(): Date {
  const expiresInMs = ensureDuration(ENV.jwt.refreshExpiresIn);
  return new Date(Date.now() + expiresInMs);
}

export function getAccessTokenExpiresInMs(): number {
  return ensureDuration(ENV.jwt.accessExpiresIn);
}

export function createTimedToken(hours: number): {
  token: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  return {
    token,
    tokenHash,
    expiresAt,
  };
}
