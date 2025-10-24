import { randomUUID } from 'node:crypto';
import { vi } from 'vitest';
import type { UserRole } from '@prisma/client';

process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT ?? '5000';
process.env.HOST = process.env.HOST ?? '127.0.0.1';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/testdb';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_HOURS = '24';
process.env.PASSWORD_RESET_TOKEN_EXPIRES_IN_HOURS = '2';
process.env.APP_URL = 'http://localhost:3000';
process.env.LOG_LEVEL = 'error';

interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerifiedAt: Date | null;
  emailVerificationTokenHash: string | null;
  emailVerificationTokenExpiresAt: Date | null;
  passwordResetTokenHash: string | null;
  passwordResetTokenExpiresAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface RefreshTokenRecord {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
  createdAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface AuditLogRecord {
  id: string;
  userId: string | null;
  action: string;
  entity: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

const mockDb = {
  users: new Map<string, UserRecord>(),
  refreshTokens: new Map<string, RefreshTokenRecord>(),
  refreshTokenHashIndex: new Map<string, string>(),
  auditLogs: new Map<string, AuditLogRecord>(),
};

function clone<T>(input: T): T {
  return structuredClone(input);
}

function resetMockDb() {
  mockDb.users.clear();
  mockDb.refreshTokens.clear();
  mockDb.refreshTokenHashIndex.clear();
  mockDb.auditLogs.clear();
}

function matchesWhere<T extends Record<string, unknown>>(
  record: Record<string, unknown>,
  where: T
): boolean {
  return Object.entries(where).every(([key, condition]) => {
    const value = record[key];

    if (condition && typeof condition === 'object' && !(condition instanceof Date)) {
      if ('gt' in (condition as Record<string, unknown>)) {
        const compareValue = (condition as { gt: Date }).gt;
        return value instanceof Date && value.getTime() > compareValue.getTime();
      }

      if ('equals' in (condition as Record<string, unknown>)) {
        const compareValue = (condition as { equals: unknown }).equals;
        return value === compareValue;
      }

      return Object.entries(condition as Record<string, unknown>).every(
        ([nestedKey, nestedValue]) => {
          if (
            typeof nestedValue === 'object' &&
            nestedValue &&
            'gt' in (nestedValue as Record<string, unknown>)
          ) {
            const compareValue = (nestedValue as { gt: Date }).gt;
            const recordValue = (value as Record<string, unknown> | undefined)?.[nestedKey];
            return recordValue instanceof Date && recordValue.getTime() > compareValue.getTime();
          }

          return (value as Record<string, unknown> | undefined)?.[nestedKey] === nestedValue;
        }
      );
    }

    return value === condition;
  });
}

function buildUser(data: Record<string, unknown>): UserRecord {
  const now = new Date();

  return {
    id: (data.id as string) ?? randomUUID(),
    email: (data.email as string).toLowerCase(),
    passwordHash: data.passwordHash as string,
    firstName: (data.firstName as string | null | undefined) ?? null,
    lastName: (data.lastName as string | null | undefined) ?? null,
    avatarUrl: (data.avatarUrl as string | null | undefined) ?? null,
    role: (data.role as UserRole) ?? 'STUDENT',
    isActive: (data.isActive as boolean | undefined) ?? true,
    isEmailVerified: (data.isEmailVerified as boolean | undefined) ?? false,
    emailVerifiedAt: (data.emailVerifiedAt as Date | null | undefined) ?? null,
    emailVerificationTokenHash:
      (data.emailVerificationTokenHash as string | null | undefined) ?? null,
    emailVerificationTokenExpiresAt:
      (data.emailVerificationTokenExpiresAt as Date | null | undefined) ?? null,
    passwordResetTokenHash: (data.passwordResetTokenHash as string | null | undefined) ?? null,
    passwordResetTokenExpiresAt:
      (data.passwordResetTokenExpiresAt as Date | null | undefined) ?? null,
    lastLoginAt: (data.lastLoginAt as Date | null | undefined) ?? null,
    createdAt: (data.createdAt as Date | undefined) ?? now,
    updatedAt: (data.updatedAt as Date | undefined) ?? now,
  };
}

function buildRefreshToken(data: Record<string, unknown>): RefreshTokenRecord {
  const now = new Date();

  return {
    id: (data.id as string) ?? randomUUID(),
    tokenHash: data.tokenHash as string,
    userId: data.userId as string,
    expiresAt: data.expiresAt as Date,
    revokedAt: (data.revokedAt as Date | null | undefined) ?? null,
    replacedByTokenId: (data.replacedByTokenId as string | null | undefined) ?? null,
    createdAt: (data.createdAt as Date | undefined) ?? now,
    ipAddress: (data.ipAddress as string | null | undefined) ?? null,
    userAgent: (data.userAgent as string | null | undefined) ?? null,
  };
}

vi.mock('@/lib/prisma', () => {
  const prismaMock = {
    user: {
      async findUnique({ where }: { where: Record<string, unknown> }) {
        if ('email' in where) {
          const user = Array.from(mockDb.users.values()).find((u) => u.email === where.email);
          return user ? clone(user) : null;
        }

        if ('id' in where) {
          const user = mockDb.users.get(where.id as string);
          return user ? clone(user) : null;
        }

        if ('emailVerificationTokenHash' in where) {
          const user = Array.from(mockDb.users.values()).find(
            (u) => u.emailVerificationTokenHash === where.emailVerificationTokenHash
          );
          return user ? clone(user) : null;
        }

        return null;
      },
      async findFirst({ where }: { where: Record<string, unknown> }) {
        const user = Array.from(mockDb.users.values()).find((record) =>
          matchesWhere(record, where)
        );
        return user ? clone(user) : null;
      },
      async create({ data }: { data: Record<string, unknown> }) {
        const user = buildUser(data);
        mockDb.users.set(user.id, user);
        return clone(user);
      },
      async update({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) {
        const id = where.id as string;
        const existing = mockDb.users.get(id);

        if (!existing) {
          throw new Error(`User with id ${id} not found`);
        }

        const updated: UserRecord = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };

        mockDb.users.set(id, updated);
        return clone(updated);
      },
    },
    refreshToken: {
      async create({ data }: { data: Record<string, unknown> }) {
        const token = buildRefreshToken(data);
        mockDb.refreshTokens.set(token.id, token);
        mockDb.refreshTokenHashIndex.set(token.tokenHash, token.id);
        return clone(token);
      },
      async findUnique({ where }: { where: Record<string, unknown> }) {
        if ('tokenHash' in where) {
          const tokenId = mockDb.refreshTokenHashIndex.get(where.tokenHash as string);
          if (!tokenId) {
            return null;
          }
          const token = mockDb.refreshTokens.get(tokenId);
          return token ? clone(token) : null;
        }

        if ('id' in where) {
          const token = mockDb.refreshTokens.get(where.id as string);
          return token ? clone(token) : null;
        }

        return null;
      },
      async update({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) {
        const id = where.id as string;
        const existing = mockDb.refreshTokens.get(id);

        if (!existing) {
          throw new Error(`Refresh token with id ${id} not found`);
        }

        const updated: RefreshTokenRecord = {
          ...existing,
          ...data,
        };

        mockDb.refreshTokens.set(id, updated);

        if (data.tokenHash) {
          mockDb.refreshTokenHashIndex.set(data.tokenHash as string, id);
        }

        return clone(updated);
      },
    },
    auditLog: {
      async create({ data }: { data: Record<string, unknown> }) {
        const record: AuditLogRecord = {
          id: (data.id as string) ?? randomUUID(),
          userId: (data.userId as string | null | undefined) ?? null,
          action: data.action as string,
          entity: (data.entity as string | null | undefined) ?? null,
          metadata: (data.metadata as Record<string, unknown> | null | undefined) ?? null,
          ipAddress: (data.ipAddress as string | null | undefined) ?? null,
          userAgent: (data.userAgent as string | null | undefined) ?? null,
          createdAt: new Date(),
        };

        mockDb.auditLogs.set(record.id, record);
        return clone(record);
      },
    },
  };

  return {
    prisma: prismaMock,
    connectPrisma: vi.fn().mockResolvedValue(undefined),
    disconnectPrisma: vi.fn().mockResolvedValue(undefined),
    __testUtils: {
      reset: resetMockDb,
      db: mockDb,
    },
  };
});

vi.mock('@/utils/mailer', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));
