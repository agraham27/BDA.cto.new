import request from 'supertest';
import { describe, expect, beforeAll, beforeEach, it, vi } from 'vitest';
import type { Express } from 'express';
import { hashToken } from '@/utils/token';

let app: Express;
let prismaModule: Awaited<typeof import('@/lib/prisma')>;
let mailerModule: Awaited<typeof import('@/utils/mailer')>;

beforeAll(async () => {
  app = (await import('@/app')).default;
  prismaModule = await import('@/lib/prisma');
  mailerModule = await import('@/utils/mailer');
});

beforeEach(() => {
  (prismaModule as unknown as { __testUtils: { reset: () => void } }).__testUtils.reset();
  vi.mocked(mailerModule.sendVerificationEmail).mockClear();
  vi.mocked(mailerModule.sendPasswordResetEmail).mockClear();
});

async function registerUser({
  email = `user-${Date.now()}@example.com`,
  password = 'Password123!',
  firstName = 'Test',
  lastName = 'User',
  language = 'en',
}: {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  language?: 'en' | 'vi';
} = {}) {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ email, password, firstName, lastName, language })
    .expect(201);

  const user = await prismaModule.prisma.user.findUnique({ where: { email } });
  const verificationMock = vi.mocked(mailerModule.sendVerificationEmail);
  const verificationCall = verificationMock.mock.calls.at(-1);
  const verificationToken = verificationCall?.[0]?.token as string | undefined;

  return {
    response,
    user,
    verificationToken,
    accessToken: response.body.data.tokens.accessToken as string,
    refreshToken: response.body.data.tokens.refreshToken as string,
    email,
    password,
  };
}

describe('Authentication API', () => {
  it('registers a new user and sends verification email', async () => {
    const { user, verificationToken } = await registerUser({ email: 'student@example.com' });

    expect(user).toBeTruthy();
    expect(verificationToken).toBeDefined();
    expect(mailerModule.sendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it('logs in an existing user and returns tokens', async () => {
    const { email, password } = await registerUser({ email: 'login@example.com' });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.data.tokens.accessToken).toBeDefined();

    const storedUser = await prismaModule.prisma.user.findUnique({ where: { email } });
    expect(storedUser?.lastLoginAt).not.toBeNull();
  });

  it('refreshes tokens and revokes the previous refresh token', async () => {
    const { refreshToken, email } = await registerUser({ email: 'refresh@example.com' });

    const refreshResponse = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(refreshResponse.body.success).toBe(true);
    expect(refreshResponse.body.data.tokens.refreshToken).not.toEqual(refreshToken);

    const existingToken = await prismaModule.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
    });

    expect(existingToken?.revokedAt).not.toBeNull();

    const user = await prismaModule.prisma.user.findUnique({ where: { email } });
    expect(user).toBeTruthy();
  });

  it('logs out and revokes the refresh token', async () => {
    const { refreshToken } = await registerUser({ email: 'logout@example.com' });

    const logoutResponse = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken })
      .expect(200);

    expect(logoutResponse.body.success).toBe(true);

    const storedToken = await prismaModule.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
    });

    expect(storedToken?.revokedAt).not.toBeNull();
  });

  it('verifies an email address using the verification token', async () => {
    const { email, verificationToken } = await registerUser({ email: 'verify@example.com' });

    await request(app)
      .post('/api/auth/verify-email')
      .send({ token: verificationToken })
      .expect(200);

    const updatedUser = await prismaModule.prisma.user.findUnique({ where: { email } });
    expect(updatedUser?.isEmailVerified).toBe(true);
  });

  it('handles the password reset flow end-to-end', async () => {
    const { email } = await registerUser({ email: 'reset@example.com' });

    await request(app).post('/api/auth/forgot-password').send({ email }).expect(200);

    expect(mailerModule.sendPasswordResetEmail).toHaveBeenCalledTimes(1);

    const resetMock = vi.mocked(mailerModule.sendPasswordResetEmail);
    const resetToken = resetMock.mock.calls[0]?.[0]?.token as string;

    await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, password: 'NewPassword123!' })
      .expect(200);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'NewPassword123!' })
      .expect(200);

    expect(loginResponse.body.success).toBe(true);
  });

  it('returns the authenticated user profile', async () => {
    const { accessToken, email } = await registerUser({ email: 'profile@example.com' });

    const profileResponse = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(profileResponse.body.success).toBe(true);
    expect(profileResponse.body.data.user.email).toBe(email);
  });

  it('updates the authenticated user profile', async () => {
    const { accessToken } = await registerUser({ email: 'update@example.com' });

    const updateResponse = await request(app)
      .patch('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ firstName: 'Updated', avatarUrl: 'https://example.com/avatar.png' })
      .expect(200);

    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.data.user.firstName).toBe('Updated');
    expect(updateResponse.body.data.user.avatarUrl).toBe('https://example.com/avatar.png');
  });
});
