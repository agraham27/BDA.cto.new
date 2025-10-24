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
    SESSION_SECRET: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().default('7d'),
    LOG_LEVEL: z.string().default('info'),
  })
  .refine((env) => env.SESSION_SECRET || env.NODE_ENV === 'development', {
    message: 'SESSION_SECRET is required',
    path: ['SESSION_SECRET'],
  })
  .refine((env) => env.JWT_SECRET || env.NODE_ENV === 'development', {
    message: 'JWT_SECRET is required',
    path: ['JWT_SECRET'],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

export const ENV = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  host: parsed.data.HOST,
  corsOrigins: Array.isArray(parsed.data.CORS_ORIGIN)
    ? parsed.data.CORS_ORIGIN
    : [parsed.data.CORS_ORIGIN],
  databaseUrl: parsed.data.DATABASE_URL,
  sessionSecret: parsed.data.SESSION_SECRET,
  jwtSecret: parsed.data.JWT_SECRET,
  jwtExpiresIn: parsed.data.JWT_EXPIRES_IN,
  logLevel: parsed.data.LOG_LEVEL,
};
