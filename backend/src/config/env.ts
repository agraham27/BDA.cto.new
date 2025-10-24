import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(5000),
    HOST: z.string().default('0.0.0.0'),
    CORS_ORIGIN: z
      .string()
      .transform((value) => value.split(',').map((origin) => origin.trim()))
      .default('http://localhost:3000'),
    DATABASE_URL: z.string().url(),
    SESSION_SECRET: z.string().optional(),
    JWT_ACCESS_SECRET: z.string().optional(),
    JWT_REFRESH_SECRET: z.string().optional(),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_HOURS: z.coerce.number().default(24),
    PASSWORD_RESET_TOKEN_EXPIRES_IN_HOURS: z.coerce.number().default(2),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_SECURE: z
      .string()
      .transform((value) => value.trim().toLowerCase() === 'true')
      .default('false'),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM_EMAIL: z.string().email().optional(),
    SMTP_FROM_NAME: z.string().optional(),
    APP_URL: z.string().url().default('http://localhost:3000'),
    LOG_LEVEL: z.string().default('info'),
  })
  .superRefine((env, ctx) => {
    if (!['development', 'test'].includes(env.NODE_ENV)) {
      if (!env.SESSION_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'SESSION_SECRET is required',
          path: ['SESSION_SECRET'],
        });
      }

      if (!env.JWT_ACCESS_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'JWT_ACCESS_SECRET is required',
          path: ['JWT_ACCESS_SECRET'],
        });
      }

      if (!env.JWT_REFRESH_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'JWT_REFRESH_SECRET is required',
          path: ['JWT_REFRESH_SECRET'],
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

const isDevOrTest = ['development', 'test'].includes(parsed.data.NODE_ENV);

export const ENV = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  host: parsed.data.HOST,
  corsOrigins: Array.isArray(parsed.data.CORS_ORIGIN)
    ? parsed.data.CORS_ORIGIN
    : [parsed.data.CORS_ORIGIN],
  databaseUrl: parsed.data.DATABASE_URL,
  sessionSecret: parsed.data.SESSION_SECRET ?? 'dev-session-secret',
  jwt: {
    accessSecret: parsed.data.JWT_ACCESS_SECRET ?? (isDevOrTest ? 'dev-access-secret' : ''),
    refreshSecret: parsed.data.JWT_REFRESH_SECRET ?? (isDevOrTest ? 'dev-refresh-secret' : ''),
    accessExpiresIn: parsed.data.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
  },
  tokens: {
    emailVerificationHours: parsed.data.EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_HOURS,
    passwordResetHours: parsed.data.PASSWORD_RESET_TOKEN_EXPIRES_IN_HOURS,
  },
  smtp: {
    host: parsed.data.SMTP_HOST,
    port: parsed.data.SMTP_PORT,
    secure: parsed.data.SMTP_SECURE,
    user: parsed.data.SMTP_USER,
    pass: parsed.data.SMTP_PASS,
    fromEmail: parsed.data.SMTP_FROM_EMAIL,
    fromName: parsed.data.SMTP_FROM_NAME,
  },
  appUrl: parsed.data.APP_URL,
  logLevel: parsed.data.LOG_LEVEL,
  jwtSecret: parsed.data.JWT_ACCESS_SECRET ?? (isDevOrTest ? 'dev-access-secret' : ''),
  jwtExpiresIn: parsed.data.JWT_ACCESS_EXPIRES_IN,
};
