import { Schema, BlogPostData } from '@/types/seo';
import { ORGANIZATION_INFO } from '@/lib/seo/utils/fallbackContent';
import { toISODate, ensureArray } from '@/lib/seo/utils/validators';
import { buildImageUrl } from '@/lib/seo/utils/detectPageType';

export function generateArticleSchema(post: BlogPostData): Schema {
  const imageUrl = buildImageUrl(post.featuredImage);
  const publishedDate = toISODate(post.publishedAt);
  const modifiedDate = toISODate(post.updatedAt);

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    ...(imageUrl && { image: imageUrl }),
    ...(publishedDate && { datePublished: publishedDate }),
    ...(modifiedDate && { dateModified: modifiedDate }),
    author: {
      '@type': 'Person',
      name: post.author?.name || ORGANIZATION_INFO.name,
      ...(post.author?.photo && { image: post.author.photo }),
      ...(post.author?.slug && {
        url: buildImageUrl(`/instructors/${post.author.slug}`),
      }),
    },
    publisher: {
      '@type': 'EducationalOrganization',
      name: ORGANIZATION_INFO.name,
      logo: {
        '@type': 'ImageObject',
        url: ORGANIZATION_INFO.logo,
        width: 600,
        height: 60,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': buildImageUrl(`/blog/${post.slug}`),
    },
    articleSection: post.category || 'Investment Education',
    articleBody: post.content,
    wordCount: post.wordCount || post.content.split(/\s+/).length,
    inLanguage: 'vi',
    keywords: ensureArray(post.tags),
    ...(post.commentCount && { commentCount: post.commentCount }),
    ...(post.commentCount || post.shareCount
      ? {
          interactionStatistic: [
            ...(post.commentCount
              ? [
                  {
                    '@type': 'InteractionCounter',
                    interactionType: 'https://schema.org/CommentAction',
                    userInteractionCount: post.commentCount,
                  },
                ]
              : []),
            ...(post.shareCount
              ? [
                  {
                    '@type': 'InteractionCounter',
                    interactionType: 'https://schema.org/ShareAction',
                    userInteractionCount: post.shareCount,
                  },
                ]
              : []),
          ],
        }
      : {}),
  };
}
