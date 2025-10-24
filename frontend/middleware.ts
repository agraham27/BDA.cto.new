import createMiddleware from 'next-intl/middleware';

import { defaultLocale, locales } from './src/i18n/request';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export const config = {
  matcher: [
    '/',
    '/(vi|en)/:path*',
    '/((?!_next|_vercel|.*\..*|api).*)',
  ],
};
