import { Schema, LessonData } from '@/types/seo';
import { ORGANIZATION_INFO } from '@/lib/seo/utils/fallbackContent';
import { toISODate, toISO8601Duration } from '@/lib/seo/utils/validators';
import { buildImageUrl } from '@/lib/seo/utils/detectPageType';

export function generateVideoObjectSchema(lesson: LessonData): Schema {
  const thumbnailUrl = buildImageUrl(lesson.thumbnailUrl);
  const uploadDate = toISODate(lesson.uploadDate);

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: lesson.title,
    description: lesson.description,
    ...(thumbnailUrl && { thumbnailUrl }),
    ...(uploadDate && { uploadDate }),
    duration: toISO8601Duration(lesson.duration) || 'PT15M',
    ...(lesson.videoUrl && { contentUrl: lesson.videoUrl }),
    inLanguage: 'vi',
    publisher: {
      '@type': 'EducationalOrganization',
      name: ORGANIZATION_INFO.name,
      logo: {
        '@type': 'ImageObject',
        url: ORGANIZATION_INFO.logo,
      },
    },
    ...(lesson.viewCount && {
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/WatchAction',
        userInteractionCount: lesson.viewCount,
      },
    }),
  };
}
