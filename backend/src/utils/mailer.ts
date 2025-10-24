import nodemailer from 'nodemailer';
import { ENV } from '@/config/env';
import { logger } from '@/utils/logger';
import {
  buildPasswordResetEmail,
  buildVerificationEmail,
  SupportedLanguage,
} from '@/utils/emailTemplates';

interface BaseEmailParams {
  to: string;
  firstName?: string | null;
  language?: SupportedLanguage;
}

interface VerificationEmailParams extends BaseEmailParams {
  token: string;
}

interface PasswordResetEmailParams extends BaseEmailParams {
  token: string;
}

const isEmailConfigured = Boolean(ENV.smtp.host && ENV.smtp.user && ENV.smtp.pass);

const transporter = isEmailConfigured
  ? nodemailer.createTransport({
      host: ENV.smtp.host,
      port: ENV.smtp.port,
      secure: ENV.smtp.secure,
      auth: {
        user: ENV.smtp.user,
        pass: ENV.smtp.pass,
      },
    })
  : null;

async function sendMail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (!isEmailConfigured || !transporter) {
    logger.info('[mailer] Email transport not configured. Email logged instead.', {
      to,
      subject,
    });
    logger.debug('[mailer] Email content', { html, text });
    return;
  }

  await transporter.sendMail({
    from: {
      name: ENV.smtp.fromName ?? 'Hoc Vien Big Dipper',
      address: ENV.smtp.fromEmail ?? 'no-reply@localhost',
    },
    to,
    subject,
    html,
    text,
  });
}

export async function sendVerificationEmail({
  to,
  firstName,
  token,
  language,
}: VerificationEmailParams) {
  const { subject, html, text } = buildVerificationEmail({
    firstName,
    token,
    language,
    appUrl: ENV.appUrl,
  });

  await sendMail({ to, subject, html, text });
}

export async function sendPasswordResetEmail({
  to,
  firstName,
  token,
  language,
}: PasswordResetEmailParams) {
  const { subject, html, text } = buildPasswordResetEmail({
    firstName,
    token,
    language,
    appUrl: ENV.appUrl,
  });

  await sendMail({ to, subject, html, text });
}
