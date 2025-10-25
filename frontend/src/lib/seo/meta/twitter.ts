import { Metadata } from 'next';

import { SEOConfig } from '@/types/seo';
import { FALLBACK_CONTENT } from '@/lib/seo/utils/fallbackContent';
import { buildImageUrl } from '@/lib/seo/utils/detectPageType';

export function generateTwitter(config: SEOConfig): Metadata['twitter'] {
  const image = typeof config.image === 'string' ? config.image : config.image?.url;
  const imageUrl = buildImageUrl(image || FALLBACK_CONTENT.image);

  return {
    card: 'summary_large_image',
    title: config.title,
    description: config.description,
    images: imageUrl ? [imageUrl] : undefined,
    site: FALLBACK_CONTENT.twitterHandle,
    creator: config.author || FALLBACK_CONTENT.author,
  };
}
