import { Schema, BlogPostData } from '@/types/seo';
import { generateArticleSchema } from './Article';

export function generateBlogPostingSchema(post: BlogPostData): Schema {
  const base = generateArticleSchema(post);

  return {
    ...base,
    '@type': 'BlogPosting',
    blogSection: post.category || 'Investment Tips',
    timeRequired: post.readingTime ? `PT${post.readingTime}M` : 'PT5M',
  };
}
