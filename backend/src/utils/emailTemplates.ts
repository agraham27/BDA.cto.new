export type SupportedLanguage = 'en' | 'vi';

interface BaseTemplateParams {
  firstName?: string | null;
  appUrl: string;
  token: string;
  language?: SupportedLanguage;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const verificationCopy: Record<
  SupportedLanguage,
  {
    subject: string;
    greeting: string;
    intro: string;
    actionText: string;
    outro: string;
    footer: string;
  }
> = {
  vi: {
    subject: 'Xác minh email của bạn',
    greeting: 'Xin chào',
    intro:
      'Cảm ơn bạn đã đăng ký tại Học Viện Big Dipper. Vui lòng nhấp vào nút bên dưới để xác minh địa chỉ email của bạn.',
    actionText: 'Xác minh email',
    outro: 'Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.',
    footer: 'Xin cảm ơn, Học Viện Big Dipper',
  },
  en: {
    subject: 'Verify your email address',
    greeting: 'Hello',
    intro:
      'Thanks for creating an account with Big Dipper Academy. Click the button below to verify your email address.',
    actionText: 'Verify email',
    outro: 'If you did not create an account, you can safely ignore this email.',
    footer: 'Warm regards, Big Dipper Academy',
  },
};

const resetCopy: Record<
  SupportedLanguage,
  {
    subject: string;
    greeting: string;
    intro: string;
    actionText: string;
    outro: string;
    footer: string;
  }
> = {
  vi: {
    subject: 'Đặt lại mật khẩu của bạn',
    greeting: 'Xin chào',
    intro:
      'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấp vào nút bên dưới để tạo mật khẩu mới.',
    actionText: 'Đặt lại mật khẩu',
    outro: 'Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.',
    footer: 'Xin cảm ơn, Học Viện Big Dipper',
  },
  en: {
    subject: 'Reset your password',
    greeting: 'Hello',
    intro:
      'We received a request to reset your password. Click the button below to create a new password.',
    actionText: 'Reset password',
    outro: 'If you did not request a password reset, you can safely ignore this email.',
    footer: 'Warm regards, Big Dipper Academy',
  },
};

function buildActionUrl(baseUrl: string, path: string, token: string): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const url = `${normalizedBase}${path}`;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}

function buildHtmlTemplate({
  heading,
  greeting,
  intro,
  actionText,
  actionUrl,
  outro,
  footer,
}: {
  heading: string;
  greeting: string;
  intro: string;
  actionText: string;
  actionUrl: string;
  outro: string;
  footer: string;
}): string {
  return `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${heading}</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 24px;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);">
            <tr>
              <td>
                <h1 style="font-size: 24px; margin-bottom: 16px; color: #111827;">${heading}</h1>
                <p style="font-size: 16px; color: #1f2937; margin: 0 0 16px 0;">${greeting}</p>
                <p style="font-size: 16px; color: #1f2937; margin: 0 0 24px 0; line-height: 1.6;">${intro}</p>
                <p style="text-align: center; margin: 0 0 24px 0;">
                  <a href="${actionUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 999px; text-decoration: none; font-weight: 600;">
                    ${actionText}
                  </a>
                </p>
                <p style="font-size: 14px; color: #6b7280; margin: 0 0 16px 0; line-height: 1.6;">${outro}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
                <p style="font-size: 14px; color: #9ca3af; margin: 0;">${footer}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildTextTemplate({
  greeting,
  intro,
  actionText,
  actionUrl,
  outro,
  footer,
}: {
  greeting: string;
  intro: string;
  actionText: string;
  actionUrl: string;
  outro: string;
  footer: string;
}): string {
  return `${greeting}

${intro}

${actionText}: ${actionUrl}

${outro}

${footer}`;
}

function resolveGreeting(copy: { greeting: string }, firstName?: string | null) {
  const safeName = firstName?.trim();
  return safeName ? `${copy.greeting} ${safeName},` : `${copy.greeting},`;
}

export function buildVerificationEmail(params: BaseTemplateParams): EmailTemplate {
  const language: SupportedLanguage = params.language ?? 'vi';
  const copy = verificationCopy[language];
  const heading = copy.subject;
  const actionUrl = buildActionUrl(params.appUrl, '/verify-email', params.token);
  const greeting = resolveGreeting(copy, params.firstName);

  return {
    subject: copy.subject,
    html: buildHtmlTemplate({
      heading,
      greeting,
      intro: copy.intro,
      actionText: copy.actionText,
      actionUrl,
      outro: copy.outro,
      footer: copy.footer,
    }),
    text: buildTextTemplate({
      greeting,
      intro: copy.intro,
      actionText: copy.actionText,
      actionUrl,
      outro: copy.outro,
      footer: copy.footer,
    }),
  };
}

export function buildPasswordResetEmail(params: BaseTemplateParams): EmailTemplate {
  const language: SupportedLanguage = params.language ?? 'vi';
  const copy = resetCopy[language];
  const heading = copy.subject;
  const actionUrl = buildActionUrl(params.appUrl, '/reset-password', params.token);
  const greeting = resolveGreeting(copy, params.firstName);

  return {
    subject: copy.subject,
    html: buildHtmlTemplate({
      heading,
      greeting,
      intro: copy.intro,
      actionText: copy.actionText,
      actionUrl,
      outro: copy.outro,
      footer: copy.footer,
    }),
    text: buildTextTemplate({
      greeting,
      intro: copy.intro,
      actionText: copy.actionText,
      actionUrl,
      outro: copy.outro,
      footer: copy.footer,
    }),
  };
}
