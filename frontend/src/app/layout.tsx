import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Space_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';

import { AuthProvider } from '@/contexts/AuthContext';
import { QueryProvider } from '@/contexts/QueryProvider';
import '@/styles/globals.css';

const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'Hoc Vien Big Dipper',
    template: '%s | Hoc Vien Big Dipper',
  },
  description:
    'Nền tảng giáo dục Big Dipper - Nuôi dưỡng những nhà thám hiểm vũ trụ tiếp theo với trải nghiệm học tập hiện đại.',
  keywords: ['hoc vien big dipper', 'giáo dục', 'khoa học', 'vũ trụ', 'elearning'],
  authors: [{ name: 'Hoc Vien Big Dipper' }],
  creator: 'Hoc Vien Big Dipper',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
    languages: {
      vi: '/vi',
      en: '/en',
    },
  },
  openGraph: {
    title: 'Hoc Vien Big Dipper',
    description:
      'Nền tảng giáo dục Big Dipper - Nuôi dưỡng những nhà thám hiểm vũ trụ tiếp theo với trải nghiệm học tập hiện đại.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hoc Vien Big Dipper',
    description:
      'Nền tảng giáo dục Big Dipper - Nuôi dưỡng những nhà thám hiểm vũ trụ tiếp theo với trải nghiệm học tập hiện đại.',
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${beVietnam.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
