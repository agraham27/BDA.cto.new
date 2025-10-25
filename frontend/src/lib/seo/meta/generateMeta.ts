import { Metadata } from 'next';

import { SEOConfig } from '@/types/seo';
import { FALLBACK_CONTENT, getDefaultMeta } from '@/lib/seo/utils/fallbackContent';
import { buildCanonicalUrl } from '@/lib/seo/utils/detectPageType';
import { DEFAULT_META, DEFAULT_ICONS, DEFAULT_VIEWPORT } from './defaults';
import { generateOpenGraph } from './openGraph';
import { generateTwitter } from './twitter';

export function generateMeta(config: Partial<SEOConfig> = {}): Metadata {
  const defaults = getDefaultMeta(config.locale);

  const title = config.title || defaults.title;
  const description = config.description || defaults.description;
  const keywords = config.keywords || defaults.keywords;
  const author = config.author || defaults.author;
  const canonical = config.url ? buildCanonicalUrl(config.url) : buildCanonicalUrl('/');

  const fullConfig: SEOConfig = {
    type: config.type || 'website',
    title,
    description,
    keywords,
    image: config.image || defaults.image,
    url: canonical,
    author,
    publishedTime: config.publishedTime,
    modifiedTime: config.modifiedTime,
    locale: config.locale,
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_CONTENT.url;

  const metadata: Metadata = {
    title: {
      default: title,
      template: `%s | ${FALLBACK_CONTENT.siteName}`,
    },
    description,
    keywords,
    authors: [{ name: author }],
    creator: author,
    publisher: FALLBACK_CONTENT.siteName,
    applicationName: DEFAULT_META.applicationName,
    robots: config.noindex || config.nofollow
      ? {
          index: !config.noindex,
          follow: !config.nofollow,
        }
      : DEFAULT_META.robots,
    icons: DEFAULT_ICONS,
    viewport: DEFAULT_VIEWPORT,
    themeColor: DEFAULT_META.themeColor,
    metadataBase: new URL(siteUrl),
    alternates: canonical
      ? {
          canonical,
        }
      : undefined,
    openGraph: generateOpenGraph(fullConfig),
    twitter: generateTwitter(fullConfig),
    appleWebApp: {
      capable: DEFAULT_META.appleMobileWebAppCapable === 'yes',
      statusBarStyle: DEFAULT_META.appleMobileWebAppStatusBarStyle,
      title: DEFAULT_META.appleMobileWebAppTitle,
    },
    other: {
      'msapplication-TileColor': DEFAULT_META.msapplicationTileColor,
      'msapplication-config': DEFAULT_META.msapplicationConfig,
    },
  };

  if (FALLBACK_CONTENT.fbAppId) {
    metadata.other = {
      ...metadata.other,
      'fb:app_id': FALLBACK_CONTENT.fbAppId,
    };
  }

  return metadata;
}
