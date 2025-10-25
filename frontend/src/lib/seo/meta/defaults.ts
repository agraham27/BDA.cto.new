import { Metadata } from 'next';

import { FALLBACK_CONTENT } from '@/lib/seo/utils/fallbackContent';

export const DEFAULT_VIEWPORT: Metadata['viewport'] = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const DEFAULT_ICONS: Metadata['icons'] = {
  icon: '/favicon.ico',
  apple: '/apple-touch-icon.png',
};

export const DEFAULT_THEME_COLOR = '#0f172a';

export const DEFAULT_META = {
  charset: 'utf-8',
  viewport: DEFAULT_VIEWPORT,
  robots: {
    index: true,
    follow: true,
  },
  themeColor: DEFAULT_THEME_COLOR,
  applicationName: FALLBACK_CONTENT.siteName,
  appleMobileWebAppCapable: 'yes' as const,
  appleMobileWebAppStatusBarStyle: 'default' as const,
  appleMobileWebAppTitle: FALLBACK_CONTENT.siteName,
  msapplicationTileColor: DEFAULT_THEME_COLOR,
  msapplicationConfig: '/browserconfig.xml',
};
