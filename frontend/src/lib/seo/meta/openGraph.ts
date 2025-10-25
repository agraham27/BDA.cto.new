import { Metadata } from 'next';

import { SEOConfig, SEOImage } from '@/types/seo';
import { FALLBACK_CONTENT } from '@/lib/seo/utils/fallbackContent';
import { buildImageUrl } from '@/lib/seo/utils/detectPageType';

export function generateOpenGraph(config: SEOConfig): Metadata['openGraph'] {
  const imageData = typeof config.image === 'string' ? { url: config.image } : config.image;
  const imageUrl = buildImageUrl(imageData?.url || FALLBACK_CONTENT.image);

  const image = imageUrl
    ? {
        url: imageUrl,
        width: imageData?.width || 1200,
        height: imageData?.height || 630,
        alt: imageData?.alt || config.title,
      }
    : undefined;

  const type = config.type === 'blog' ? 'article' : config.type === 'lesson' ? 'video.other' : 'website';

  const locale = config.locale || 'vi_VN';

  return {
    title: config.title,
    description: config.description,
    url: config.url,
    siteName: FALLBACK_CONTENT.siteName,
    locale,
    type,
    images: image ? [image] : undefined,
    ...(type === 'article' && config.publishedTime
      ? {
          publishedTime: config.publishedTime,
          modifiedTime: config.modifiedTime,
          authors: config.author ? [config.author] : undefined,
        }
      : {}),
  };
}
