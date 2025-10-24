import { getRequestConfig } from 'next-intl/server';

export const locales = ['vi', 'en'] as const;
export const defaultLocale = 'vi' as const;

export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../../messages/${locale}.json`)).default,
}));
