import { User } from '@prisma/client';

export type PublicUser = Omit<
  User,
  | 'passwordHash'
  | 'emailVerificationTokenHash'
  | 'emailVerificationTokenExpiresAt'
  | 'passwordResetTokenHash'
  | 'passwordResetTokenExpiresAt'
>;

export function presentUser(user: User): PublicUser {
  const {
    passwordHash: _passwordHash,
    emailVerificationTokenHash: _emailVerificationTokenHash,
    emailVerificationTokenExpiresAt: _emailVerificationTokenExpiresAt,
    passwordResetTokenHash: _passwordResetTokenHash,
    passwordResetTokenExpiresAt: _passwordResetTokenExpiresAt,
    ...rest
  } = user;

  return rest;
}
